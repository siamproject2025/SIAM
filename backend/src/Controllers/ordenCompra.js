const OrdenCompra = require("../Models/ordenCompra");

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
};