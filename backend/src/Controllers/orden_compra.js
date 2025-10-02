const Compra = require('../Models/orden_compra');

// Crear compra
exports.crearCompra = async (req, res) => {
  try {
    const nuevaCompra = new Compra(req.body);
    const compraGuardada = await nuevaCompra.save();
    res.status(201).json(compraGuardada);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Actualizar estado
exports.actualizarEstado = async (req, res) => {
  try {
    const compra = await Compra.findByIdAndUpdate(
      req.params.id,
      { estado: req.body.estado },
      { new: true }
    );
    if (!compra) {
      return res.status(404).json({ message: 'Compra no encontrada' });
    }
    res.json(compra);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Listar compras
exports.listarCompras = async (req, res) => {
  try {
    const compras = await Compra.find().populate('proveedorId', 'nombre contacto');
    res.json(compras);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
