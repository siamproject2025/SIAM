const Modulo = require("../Models/dashboard_modelo");

exports.listarModulos = async (req, res) => {
  try {
    const roles = req.user?.roles || ["DOCENTE"];
    const modulos = await Modulo.visibleParaRoles(roles);
    res.json({ modulos });
  } catch (e) {
    res.status(500).json({ message: "Error al obtener módulos" });
  }
};

// (opcional) sembrar
exports.seed = async (_req, res) => {
  const seeded = await Modulo.seedIfEmpty();
  res.json({ seeded });
};

