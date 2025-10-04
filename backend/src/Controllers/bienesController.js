const Bien = require("../Models/Bien");

// Obtener todos los bienes
exports.getBienes = async (req, res) => {
  try {
    const bienes = await Bien.find();
    res.json(bienes);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener bienes", error });
  }
};

// Obtener un bien por ID
exports.getBienById = async (req, res) => {
  try {
    const bien = await Bien.findById(req.params.id);
    if (!bien) return res.status(404).json({ message: "Bien no encontrado" });
    res.json(bien);
  } catch (error) {
    res.status(500).json({ message: "Error al buscar el bien", error });
  }
};

// Crear nuevo bien
exports.createBien = async (req, res) => {
  try {
    // Convertir valor a número y fechaIngreso a Date
    if (req.body.valor !== undefined) req.body.valor = parseFloat(req.body.valor);
    if (req.body.fechaIngreso) req.body.fechaIngreso = new Date(req.body.fechaIngreso);

    const bien = new Bien(req.body);
    const nuevoBien = await bien.save();
    res.status(201).json(nuevoBien);
  } catch (error) {
    res.status(400).json({ message: "Error al crear el bien", error });
  }
};

// Actualizar bien
exports.updateBien = async (req, res) => {
  try {
    // Convertir valor a número y fechaIngreso a Date
    if (req.body.valor !== undefined) req.body.valor = parseFloat(req.body.valor);
    if (req.body.fechaIngreso) req.body.fechaIngreso = new Date(req.body.fechaIngreso);

    const bienActualizado = await Bien.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!bienActualizado) return res.status(404).json({ message: "Bien no encontrado" });
    res.json(bienActualizado);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar el bien", error });
  }
};

// Eliminar bien
exports.deleteBien = async (req, res) => {
  try {
    const bienEliminado = await Bien.findByIdAndDelete(req.params.id);
    if (!bienEliminado) return res.status(404).json({ message: "Bien no encontrado" });
    res.json({ message: "Bien eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el bien", error });
  }
};
