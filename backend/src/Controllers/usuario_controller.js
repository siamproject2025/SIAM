const Auth     = require('../../src/Models/usuario_modelo');
const Solicitud = require('../../src/Models/solicitud_modelo');
const argon2   = require('argon2');
const admin    = require('../config/firebaseAdmin');

// ─── Listar usuarios ──────────────────────────────────────────────────────
exports.listarUsuario = async (req, res) => {
  try {
    const usuarios = await Auth.find({}, { password: 0 });
    res.json({ users: usuarios });
  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
};

// ─── Crear usuario ────────────────────────────────────────────────────────
exports.crearUsuario = async (req, res) => {
  try {
    const { authId, email, username, password_hash, roles } = req.body;

    const userExist = await Auth.findOne({ email });
    if (userExist) {
      return res.status(400).json({ message: "Usuario ya existe." });
    }

    const userData = { authId };
    if (email)         userData.email    = email;
    if (username)      userData.username = username;
    if (password_hash) {
      userData.password_hash = await argon2.hash(password_hash);
    }
    userData.roles = "PADRE";

    const auth = new Auth(userData);
    await auth.save();
    res.status(200).json({ status: "Usuario guardado", auth });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ─── Login con Google: verificar acceso o crear solicitud ────────────────
exports.loginOCrearSolicitudGoogle = async (req, res) => {
  try {
    const { email, username } = req.body;
    const emailNorm = email.toLowerCase().trim();

    // 1. ¿Ya existe como usuario aprobado en MongoDB?
    const usuarioExiste = await Auth.findOne({ email: emailNorm });
    if (usuarioExiste) {
      if (usuarioExiste.estado === 'BLOQUEADO') {
        return res.status(403).json({
          aprobado: false,
          message:  'Tu acceso ha sido bloqueado. Contacta al administrador.'
        });
      }
      return res.status(200).json({ aprobado: true });
    }

    // 2. ¿Ya tiene solicitud?
    const solicitudExiste = await Solicitud.findOne({ email: emailNorm });
    if (solicitudExiste) {
      const msgs = {
        PENDIENTE: 'Tu solicitud está pendiente de aprobación. Te notificaremos por correo cuando sea revisada.',
        APROBADO:  'Tu solicitud fue aprobada. Revisa tu correo para obtener tus credenciales.',
        DENEGADO:  'Tu solicitud fue denegada. Contacta al administrador.',
        BLOQUEADO: 'Tu acceso ha sido bloqueado. Contacta al administrador.'
      };
      return res.status(403).json({
        aprobado: false,
        message:  msgs[solicitudExiste.estado] || 'Solicitud en proceso.'
      });
    }

    // 3. Crear solicitud automática
    const nuevaSolicitud = new Solicitud({
      nombre_solicitante: (username || email).toUpperCase(),
      email:              emailNorm,
      nombre_alumno:      'N/A',
      grado:              'N/A',
      estado:             'PENDIENTE'
    });
    await nuevaSolicitud.save();

    return res.status(403).json({
      aprobado: false,
      message:  'Tu solicitud fue enviada correctamente. El administrador la revisará pronto y recibirás tus credenciales por correo.'
    });

  } catch (error) {
    console.error('Error en loginOCrearSolicitudGoogle:', error);
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};

// ─── Asignar rol ──────────────────────────────────────────────────────────
exports.asignarRol = async (req, res) => {
  try {
    const { id }    = req.params;
    const { roles } = req.body;

    if (!Array.isArray(roles)) {
      return res.status(400).json({ message: 'El campo roles debe ser un array.' });
    }

    const usuarioActualizado = await Auth.findByIdAndUpdate(
      id,
      { roles },
      { new: true }
    );

    if (!usuarioActualizado) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    res.json({ message: 'Roles actualizados correctamente.', usuario: usuarioActualizado });
  } catch (error) {
    console.error('Error al asignar roles:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// ─── Eliminar usuario ─────────────────────────────────────────────────────
exports.eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Auth.findById(id);
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    if (usuario.authId) {
      await admin.auth().deleteUser(usuario.authId);
      console.log(`Usuario Firebase ${usuario.authId} eliminado`);
    }

    await Auth.findByIdAndDelete(id);

    res.json({ message: "Usuario eliminado correctamente de MongoDB y Firebase.", usuario });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ message: "Error al eliminar usuario." });
  }
};

// ─── Login: verificar si está bloqueado ───────────────────────────────────
exports.loginUsuario = async (req, res) => {
  const { email } = req.body;
  try {
    const usuario = await Auth.findOne({ email });
    if (!usuario) return res.status(200).json({ permitido: true });

    if (usuario.bloqueado_hasta && usuario.bloqueado_hasta > Date.now()) {
      const minutosRestantes = Math.ceil((usuario.bloqueado_hasta - Date.now()) / 60000);
      return res.status(429).json({
        permitido: false,
        message:   `Cuenta bloqueada. Intenta en ${minutosRestantes} minutos.`
      });
    }

    return res.status(200).json({ permitido: true });
  } catch (error) {
    console.error("Error en loginUsuario:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// ─── Registrar intento fallido ────────────────────────────────────────────
exports.registrarIntentoFallido = async (req, res) => {
  const { email } = req.body;
  try {
    const usuario = await Auth.findOne({ email });
    if (!usuario) return res.sendStatus(200);

    usuario.intentos_fallidos += 1;

    if (usuario.intentos_fallidos >= 4) {
      usuario.bloqueado_hasta = new Date(Date.now() + 10 * 60000);
      await usuario.save();
      return res.status(429).json({ message: "Usuario bloqueado por 10 minutos." });
    }

    await usuario.save();
    res.json({ message: "Intento fallido registrado." });
  } catch (error) {
    console.error("Error en registrarIntentoFallido:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// ─── Reiniciar intentos tras login exitoso ────────────────────────────────
exports.reiniciarIntentos = async (req, res) => {
  const { email } = req.body;
  try {
    const usuario = await Auth.findOne({ email });
    if (!usuario) return res.sendStatus(200);

    usuario.intentos_fallidos = 0;
    usuario.bloqueado_hasta   = null;
    await usuario.save();

    res.json({ message: "Intentos reiniciados." });
  } catch (error) {
    console.error("Error en reiniciarIntentos:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// ─── Actualizar rol y/o alumno de un usuario existente ───────────────────
  exports.actualizarAsignacion = async (req, res) => {
    try {
      const { id }             = req.params;
      const { rol, alumno_id } = req.body;

      const usuario = await Auth.findById(id);
      if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' });

      // Actualizar rol si viene
      if (rol) {
        usuario.roles = [rol];
      }

      // Actualizar alumno si viene — permite null para des-asignar
      if (alumno_id !== undefined) {
        if (alumno_id === null || alumno_id === '') {
          usuario.alumno = null;
        } else {
          const mongoose = require('mongoose');
          if (!mongoose.Types.ObjectId.isValid(alumno_id)) {
            return res.status(400).json({ message: 'alumno_id inválido.' });
          }
          usuario.alumno = alumno_id;
        }
      }

      await usuario.save();

      // Sincronizar rol_asignado y alumno_asignado en la solicitud también
      const Solicitud = require('../Models/solicitud_modelo');
      const updateSolicitud = {};
      if (rol)               updateSolicitud.rol_asignado    = rol;
      if (alumno_id !== undefined) updateSolicitud.alumno_asignado = alumno_id || null;

      if (Object.keys(updateSolicitud).length > 0) {
        await Solicitud.findOneAndUpdate(
          { email: usuario.email },
          updateSolicitud
        );
      }

      res.json({ message: 'Asignación actualizada correctamente.', usuario });

    } catch (error) {
      console.error('Error al actualizar asignación:', error);
      res.status(500).json({ message: 'Error al actualizar asignación.' });
    }
  };

