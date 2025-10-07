// controllers/moduloController.js
const Modulo = require("../Models/dashboard_modelo");

// Listar módulos filtrando por rol del usuario
exports.listarModulos = async (req, res) => {
  try {
    const userRoles = req.user.roles; // array de roles del usuario, ej: ['PADRE']

    // Filtrar módulos que contengan al menos uno de los roles del usuario
    const modulos = await Modulo.find({
      roles: { $in: userRoles }
    });

    res.json({ modulos });
  } catch (err) {
    console.error("Error al obtener módulos:", err);
    res.status(500).json({ message: "Error al obtener módulos" });
  }
};
