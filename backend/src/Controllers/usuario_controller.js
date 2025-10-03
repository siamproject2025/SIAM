const Auth = require("../Models/usuario_modelo");
const argon2 = require('argon2');
// LLama al usuario
exports.listarUsuario = async (req, res) => {
   try {
        
        const auth = await Auth.find({});
        console.log(auth);
        res.json({
            
            Auth: auth // Enviando el usuario obtenido
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener usuario" }); // Maneja el error
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
    if (roles) userData.roles = roles;
  

    const auth = new Auth(userData);

    await auth.save();
    res.status(200).json({ status: "Usuario guardado", auth });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

