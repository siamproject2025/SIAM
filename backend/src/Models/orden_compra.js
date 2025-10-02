const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  descripcion: { type: String, required: true },
  cantidad: { type: Number, required: true },
  costoUnit: { type: Number, required: true }
}, { _id: false });

const compraSchema = new mongoose.Schema({
  numero: { type: String, required: true },
  estado: { type: String, enum: ['pendiente', 'entregado'], default: 'pendiente' },
  items: { type: [itemSchema], required: true },
  recepciones: { type: Array, default: [] }
}, {
  collection: 'ordenes_compra',
  timestamps: true
});

module.exports = mongoose.model('OrdenCompra', compraSchema);
