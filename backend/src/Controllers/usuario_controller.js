const Auth = require('../../src/Models/usuario_modelo');
const argon2 = require('argon2');
const admin = require('../config/firebaseAdmin'); // importamos la instancia inicializada

// LLama al usuario
exports.listarUsuario = async (req, res) => {
  try {
    // Trae todos los usuarios, excluyendo campos sensibles como contraseña
    const usuarios = await Auth.find({}, { password: 0 }); // exclude password

    res.json({
      users: usuarios, // Más claro que "Auth"
    });
  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
};
//Crea nuevo usuario
exports.crearUsuario = async (req, res) => {
  try {
    const { authId, email, username, password_hash, roles } = req.body;

    const userExist = await Auth.findOne({ email });
    if (userExist) {
      return res.status(400).json({ message: "Usuario ya existe." });
    }

    // Crear objeto dinámico
    const userData = { authId }; // authId debería ser obligatorio

    if (email) userData.email = email;
    if (username) userData.username = username;
    //  Hash de la contraseña si existe
    if (password_hash) {
      const hashedPassword = await argon2.hash(password_hash);
      userData.password_hash = hashedPassword;
    }
      userData.roles = "PADRE";
  

    const auth = new Auth(userData);

    await auth.save();
    res.status(200).json({ status: "Usuario guardado", auth });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//  Asignar o modificar roles de un usuario (solo ADMIN)
exports.asignarRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { roles } = req.body;

    // Validar que 'roles' sea un array
    if (!Array.isArray(roles)) {
      return res.status(400).json({ message: 'El campo roles debe ser un array.' });
    }

    // Buscar y actualizar usuario
    const usuarioActualizado = await Auth.findByIdAndUpdate(
      id,
      { roles },
      { new: true }
    );

    if (!usuarioActualizado) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    res.json({
      message: 'Roles actualizados correctamente.',
      usuario: usuarioActualizado
    });
  } catch (error) {
    console.error('Error al asignar roles:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

exports.eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Busca el usuario en MongoDB
    const usuario = await Auth.findById(id);
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    // 2️⃣ Elimina de Firebase Auth usando el authId guardado en tu DB
    if (usuario.authId) {
      await admin.auth().deleteUser(usuario.authId);
      console.log(`Usuario Firebase ${usuario.authId} eliminado`);
    }

    // 3️⃣ Elimina de MongoDB
    await Auth.findByIdAndDelete(id);

    res.json({
      message: "Usuario eliminado correctamente de MongoDB y Firebase.",
      usuario: usuario
    });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ message: "Error al eliminar usuario." });
  }
};

// =====================
//  LOGIN CON INTENTOS
// =====================

// 1️⃣ Verifica si el usuario está bloqueado antes del login
exports.loginUsuario = async (req, res) => {
  const { email } = req.body;

  try {
    const usuario = await Auth.findOne({ email });

    // Si no existe, respondemos como permitido (por seguridad)
    if (!usuario) {
      return res.status(200).json({ permitido: true });
    }

    // Verificar si está bloqueado
    if (usuario.bloqueado_hasta && usuario.bloqueado_hasta > Date.now()) {
      const minutosRestantes = Math.ceil((usuario.bloqueado_hasta - Date.now()) / 60000);
      return res.status(429).json({
        permitido: false,
        message: `Cuenta bloqueada. Intenta en ${minutosRestantes} minutos.`
      });
    }

    // Si no está bloqueado
    return res.status(200).json({ permitido: true });

  } catch (error) {
    console.error("Error en loginUsuario:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// 2️⃣ Registrar intento fallido
exports.registrarIntentoFallido = async (req, res) => {
  const { email } = req.body;

  try {
    const usuario = await Auth.findOne({ email });
    if (!usuario) return res.sendStatus(200);

    usuario.intentos_fallidos += 1;

    // Si llega al límite → bloquear 10 minutos
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

// 3️⃣ Reiniciar intentos tras login exitoso
exports.reiniciarIntentos = async (req, res) => {
  const { email } = req.body;

  try {
    const usuario = await Auth.findOne({ email });
    if (!usuario) return res.sendStatus(200);

    usuario.intentos_fallidos = 0;
    usuario.bloqueado_hasta = null;

    await usuario.save();

    res.json({ message: "Intentos reiniciados." });

  } catch (error) {
    console.error("Error en reiniciarIntentos:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};