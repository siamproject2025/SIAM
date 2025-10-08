const Auth = require("../Models/usuario_modelo");
const argon2 = require('argon2');
// LLama al usuario
exports.listarUsuario = async (req, res) => {
  try {
    // Trae todos los usuarios, excluyendo campos sensibles como contraseña
    const usuarios = await Auth.find({}, { password: 0 }); // exclude password

    console.log("Usuarios obtenidos:", usuarios);

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
    // 🔹 Hash de la contraseña si existe
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

// 🔹 Asignar o modificar roles de un usuario (solo ADMIN)
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