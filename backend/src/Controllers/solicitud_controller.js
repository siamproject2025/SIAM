const Solicitud   = require('../../src/Models/solicitud_modelo');
const Usuario     = require('../../src/Models/usuario_modelo');
const admin       = require('../config/firebaseAdmin');
const argon2      = require('argon2');
const mailer = require('../config/mailer');
// ─── Crear solicitud (público, sin auth) ──────────────────────────────────
exports.crearSolicitud = async (req, res) => {
  try {
    const { nombre_solicitante, email} = req.body;

    if (!nombre_solicitante || !email ) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    const existe = await Solicitud.findOne({ email: email.toLowerCase().trim() });
    if (existe) {
      const msg = {
        PENDIENTE: 'Ya tienes una solicitud pendiente de revisión.',
        APROBADO:  'Tu solicitud ya fue aprobada. Revisa tu correo.',
        DENEGADO:  'Tu solicitud fue denegada. Contacta al administrador.',
        BLOQUEADO: 'Tu acceso ha sido bloqueado. Contacta al administrador.'
      };
      return res.status(400).json({ message: msg[existe.estado] || 'Ya existe una solicitud con este correo.' });
    }

    const solicitud = new Solicitud({
      nombre_solicitante: nombre_solicitante.toUpperCase().trim(),
      email:              email.toLowerCase().trim(),
      nombre_alumno:      nombre_alumno.toUpperCase().trim(),
      grado:              grado.trim()
    });

    await solicitud.save();
    res.status(201).json({ message: 'Solicitud enviada correctamente. El administrador la revisará pronto.' });

  } catch (error) {
    console.error('Error al crear solicitud:', error);
    res.status(500).json({ message: 'Error al enviar la solicitud.' });
  }
};

// ─── Login con Google: verificar acceso o crear solicitud ────────────────
exports.loginOCrearSolicitudGoogle = async (req, res) => {
  try {
    const { email, username } = req.body;
    const emailNorm = email.toLowerCase().trim();

    // 1. Verificar si ya existe como usuario aprobado en MongoDB
    const usuarioExiste = await Usuario.findOne({ email: emailNorm });
    if (usuarioExiste) {
      if (usuarioExiste.estado === 'BLOQUEADO') {
        return res.status(403).json({
          aprobado: false,
          message:  'Tu acceso ha sido bloqueado. Contacta al administrador.'
        });
      }
      return res.status(200).json({ aprobado: true });
    }

    // 2. Verificar si ya tiene solicitud
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

    // 3. No existe solicitud → crear una automáticamente
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

// ─── Listar solicitudes (admin) ───────────────────────────────────────────
exports.listarSolicitudes = async (req, res) => {
  try {
    const { estado } = req.query;
    const filtro = estado ? { estado } : {};
    const solicitudes = await Solicitud.find(filtro).sort({ fecha_solicitud: -1 });
    res.json({ solicitudes });
  } catch (error) {
    console.error('Error al listar solicitudes:', error);
    res.status(500).json({ message: 'Error al listar solicitudes.' });
  }
};

// ─── Resolver solicitud: APROBADO | DENEGADO ──────────────────────────────
// ─── Resolver solicitud: APROBADO | DENEGADO ──────────────────────────────
exports.resolverSolicitud = async (req, res) => {
  try {
    const { id }                    = req.params;
    const { accion, rol, alumno_id } = req.body;   // ← recibe rol y alumno_id
    console.log("🔵 resolverSolicitud iniciado:", { id, accion, rol, alumno_id });

    if (!['APROBADO', 'DENEGADO'].includes(accion)) {
      return res.status(400).json({ message: 'Acción inválida.' });
    }

    const solicitud = await Solicitud.findById(id);
    console.log("🔵 Solicitud encontrada:", solicitud?.email, solicitud?.estado);

    if (!solicitud) return res.status(404).json({ message: 'Solicitud no encontrada.' });
    if (solicitud.estado !== 'PENDIENTE') {
      return res.status(400).json({ message: 'Esta solicitud ya fue resuelta.' });
    }

    if (accion === 'APROBADO') {
      // Validar que se envió el rol
      if (!rol) {
        return res.status(400).json({ message: 'Debes asignar un rol al aprobar una solicitud.' });
      }

      const passwordTemporal = generarPasswordTemporal();
      console.log("✅ PASO 1: Password generado");

      let firebaseUid;
      try {
        const firebaseUser = await admin.auth().createUser({
          email:         solicitud.email,
          password:      passwordTemporal,
          displayName:   solicitud.nombre_solicitante,
          emailVerified: true
        });
        firebaseUid = firebaseUser.uid;
        console.log("✅ PASO 2: Firebase user creado:", firebaseUid);
      } catch (firebaseErr) {
        console.log("⚠️ PASO 2 Firebase error:", firebaseErr.code);
        if (firebaseErr.code === 'auth/email-already-exists') {
          const existingUser = await admin.auth().getUserByEmail(solicitud.email);
          firebaseUid = existingUser.uid;
          await admin.auth().updateUser(firebaseUid, { password: passwordTemporal, emailVerified: true });
          console.log("✅ PASO 2b: Firebase user reutilizado:", firebaseUid);
        } else {
          throw firebaseErr;
        }
      }

      const hashedPassword = await argon2.hash(passwordTemporal);
      console.log("✅ PASO 3: Password hasheado");

      // ── Construir objeto usuario con rol y alumno opcionales ──
      const datosUsuario = {
        authId:                firebaseUid,
        email:                 solicitud.email,
        username:              solicitud.nombre_solicitante,
        password_hash:         hashedPassword,
        roles:                 [rol],          // ← rol elegido por el admin
        estado:                'ACTIVO',
        debe_cambiar_password: true,
      };

      // Solo agregar alumno si se seleccionó uno
      if (alumno_id) {
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(alumno_id)) {
          datosUsuario.alumno = alumno_id;
          console.log("✅ PASO 3b: Alumno asignado:", alumno_id);
        } else {
          console.warn("⚠️ alumno_id inválido, se omite:", alumno_id);
        }
      }

      const nuevoUsuario = new Usuario(datosUsuario);
      await nuevoUsuario.save();
      console.log("✅ PASO 4: Usuario guardado en MongoDB con rol:", rol, "| alumno:", alumno_id || 'ninguno');

      // ── Correo — si falla aquí no debe bloquear el proceso ──
      try {
        console.log("🔵 PASO 5: Intentando enviar correo a:", solicitud.email);
        await enviarCorreoAprobacion(solicitud.email, solicitud.nombre_solicitante, passwordTemporal);
        console.log("✅ PASO 5: Correo enviado");
      } catch (mailErr) {
        console.error("❌ PASO 5 ERROR correo (no bloquea):", mailErr.message);
      }
    }

    solicitud.estado           = accion;
    solicitud.fecha_resolucion = new Date();
    solicitud.resuelto_por     = req.user?.uid || 'ADMIN';
    await solicitud.save();
    console.log("✅ PASO 6: Solicitud actualizada a:", accion);

    res.json({ message: `Solicitud ${accion.toLowerCase()} correctamente.` });

  } catch (error) {
    console.error("❌ ERROR GENERAL resolverSolicitud:", {
      message: error.message,
      code:    error.code,
      stack:   error.stack
    });
    res.status(500).json({ message: 'Error al procesar la solicitud.', detalle: error.message });
  }
};
// ─── Bloquear usuario ya existente ───────────────────────────────────────
exports.bloquearUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findById(id);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' });

    if (usuario.authId) {
      await admin.auth().updateUser(usuario.authId, { disabled: true });
    }

    usuario.estado = 'BLOQUEADO';
    await usuario.save();

    await Solicitud.findOneAndUpdate(
      { email: usuario.email },
      { estado: 'BLOQUEADO' }
    );

    // ✅ devuelve el usuario actualizado
    res.json({ message: 'Usuario bloqueado correctamente.', usuario });

  } catch (error) {
    console.error('Error al bloquear usuario:', error);
    res.status(500).json({ message: 'Error al bloquear usuario.' });
  }
};
// ─── Reabrir solicitud denegada → volver a PENDIENTE ─────────────────────
exports.reabrirSolicitud = async (req, res) => {
  try {
    const { id } = req.params;

    const solicitud = await Solicitud.findById(id);
    if (!solicitud) return res.status(404).json({ message: 'Solicitud no encontrada.' });
    if (solicitud.estado !== 'DENEGADO') {
      return res.status(400).json({ message: 'Solo se pueden reabrir solicitudes denegadas.' });
    }

    solicitud.estado           = 'PENDIENTE';
    solicitud.fecha_resolucion = null;
    solicitud.resuelto_por     = null;
    await solicitud.save();

    res.json({ message: 'Solicitud reabierta. Ahora está pendiente de revisión.' });
  } catch (error) {
    console.error('Error al reabrir solicitud:', error);
    res.status(500).json({ message: 'Error al reabrir la solicitud.' });
  }
};
// ─── Desbloquear usuario ──────────────────────────────────────────────────
// ─── Desbloquear usuario ──────────────────────────────────────────────────
exports.desbloquearUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findById(id);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' });

    if (usuario.authId) {
      await admin.auth().updateUser(usuario.authId, { disabled: false });
    }

    usuario.estado            = 'ACTIVO';
    usuario.intentos_fallidos = 0;
    usuario.bloqueado_hasta   = null;
    await usuario.save();

    await Solicitud.findOneAndUpdate(
      { email: usuario.email },
      { estado: 'APROBADO' }
    );

    // ✅ devuelve el usuario actualizado
    res.json({ message: 'Usuario desbloqueado correctamente.', usuario });

  } catch (error) {
    console.error('Error al desbloquear usuario:', error);
    res.status(500).json({ message: 'Error al desbloquear usuario.' });
  }
};

// ─── Utilidad: generar contraseña temporal segura ─────────────────────────
const generarPasswordTemporal = () => {
  const mayus      = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const minus      = 'abcdefghjkmnpqrstuvwxyz';
  const nums       = '23456789';
  const especiales = '@$!%*?&';

  let pass = '';
  pass += mayus[Math.floor(Math.random() * mayus.length)];
  pass += minus[Math.floor(Math.random() * minus.length)];
  pass += nums[Math.floor(Math.random() * nums.length)];
  pass += especiales[Math.floor(Math.random() * especiales.length)];

  const todos = mayus + minus + nums + especiales;
  for (let i = 4; i < 10; i++) {
    pass += todos[Math.floor(Math.random() * todos.length)];
  }

  return pass.split('').sort(() => Math.random() - 0.5).join('');
};

// ─── Enviar correo de aprobación ──────────────────────────────────────────
// enviarCorreoAprobacion
const enviarCorreoAprobacion = async (email, nombre, password) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
        <tr>
          <td align="center">
            <table width="520" cellpadding="0" cellspacing="0"
              style="background:#ffffff;border-radius:12px;overflow:hidden;
                     box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:#1a1d27;padding:32px 40px;text-align:center;">
                  <h1 style="color:#4f8ef7;margin:0;font-size:22px;letter-spacing:-0.5px;">
                    ✅ Acceso Aprobado
                  </h1>
                </td>
              </tr>
              <tr>
                <td style="padding:36px 40px;">
                  <p style="color:#374151;font-size:15px;margin:0 0 12px;">
                    Hola <strong>${nombre}</strong>,
                  </p>
                  <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 28px;">
                    Tu solicitud de acceso ha sido <strong style="color:#22c55e;">aprobada</strong>.
                    A continuación encontrarás tus credenciales para ingresar al sistema.
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0"
                    style="background:#f8faff;border:1px solid #e5e7eb;
                           border-radius:8px;margin-bottom:28px;">
                    <tr>
                      <td style="padding:20px 24px;">
                        <p style="margin:0 0 12px;font-size:13px;color:#9ca3af;
                                  text-transform:uppercase;letter-spacing:0.06em;">
                          Tus credenciales
                        </p>
                        <p style="margin:0 0 8px;font-size:14px;color:#374151;">
                          📧 <strong>Correo:</strong> ${email}
                        </p>
                        <p style="margin:0;font-size:14px;color:#374151;">
                          🔑 <strong>Contraseña temporal:</strong>
                          <span style="background:#1a1d27;color:#4f8ef7;padding:3px 10px;
                                       border-radius:5px;font-family:monospace;font-size:15px;
                                       letter-spacing:1px;margin-left:6px;">
                            ${password}
                          </span>
                        </p>
                      </td>
                    </tr>
                  </table>
                  <table width="100%" cellpadding="0" cellspacing="0"
                    style="background:#fff7ed;border:1px solid #fed7aa;
                           border-radius:8px;margin-bottom:28px;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                          ⚠️ <strong>Importante:</strong> Al ingresar por primera vez, el sistema
                          te pedirá que cambies esta contraseña temporal por una de tu elección.
                        </p>
                      </td>
                    </tr>
                  </table>
                  <p style="text-align:center;margin:0;">
                    <a href="${process.env.FRONTEND_URL}/login"
                      style="display:inline-block;background:#4f8ef7;color:#ffffff;
                             text-decoration:none;padding:13px 32px;border-radius:8px;
                             font-weight:600;font-size:14px;">
                      Ingresar al sistema →
                    </a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background:#f9fafb;padding:20px 40px;text-align:center;
                           border-top:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;">
                    Si no solicitaste este acceso, ignora este correo.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  const sendSmtpEmail = {
    
    to: [{ email }],
    sender: { email: 'siamproject2025@gmail.com', name: 'Sistema Escolar' },
    subject: '✅ Tu acceso ha sido aprobado — Credenciales de ingreso',
    htmlContent: html  // tu mismo HTML de antes
  };

  await mailer.sendTransacEmail(sendSmtpEmail);
  console.log(`📧 Correo enviado a ${email}`);
};
