/*const OrdenCompra = require("../Models/ordenCompra");

exports.crearOrden = async (req, res) => {
  try {
    const nuevaOrden = new OrdenCompra(req.body);
    await nuevaOrden.save();
    res.status(201).json(nuevaOrden);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.obtenerOrdenes = async (req, res) => {
  try {
    const ordenes = await OrdenCompra.find();
    res.status(200).json(ordenes);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
};

exports.actualizarOrden = async (req, res) => {
  try {
    const ordenActualizada = await OrdenCompra.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!ordenActualizada) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }
    res.status(200).json(ordenActualizada);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.eliminarOrden = async (req, res) => {
  try {
    const ordenEliminada = await OrdenCompra.findByIdAndDelete(req.params.id);
    if (!ordenEliminada) {
      return res.status(404).json({error: "Orden no encontrada" });
    }
    res.status(200).json({ mensaje: "Orden eliminada correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};*/

const OrdenCompra = require("../Models/ordenCompra");

// Crear una nueva orden
exports.crearOrden = async (req, res) => {
  try {
    const nuevaOrden = new OrdenCompra(req.body);
    await nuevaOrden.save();

    // Populate inmediatamente después de guardar
    const ordenConProveedor = await OrdenCompra.findById(nuevaOrden._id)
      .populate("proveedor_id", "nombre empresa")
      .lean();

    res.status(201).json(ordenConProveedor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Obtener todas las órdenes (con datos del proveedor)
exports.obtenerOrdenes = async (req, res) => {
  try {
    const ordenes = await OrdenCompra.find()
      .populate("proveedor_id", "nombre empresa")
      .lean();

    res.status(200).json(ordenes);
  } catch (err) {
    console.error("Error al obtener órdenes:", err);
    res.status(500).json({ error: err.message });
  }
};

// Actualizar una orden existente
exports.actualizarOrden = async (req, res) => {
  try {
    const ordenActualizada = await OrdenCompra.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate("proveedor_id", "nombre empresa")
      .lean();

    if (!ordenActualizada) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    res.status(200).json(ordenActualizada);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Eliminar una orden
exports.eliminarOrden = async (req, res) => {
  try {
    const ordenEliminada = await OrdenCompra.findByIdAndDelete(req.params.id);
    if (!ordenEliminada) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }
    res.status(200).json({ mensaje: "Orden eliminada correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
