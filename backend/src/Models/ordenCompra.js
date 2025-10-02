const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  descripcion: String,
  cantidad: Number,
  costoUnit: Number
});

const ordenCompraSchema = new mongoose.Schema({
  numero: { type: String, required: true },
  proveedor_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  estado: { type: String, required: true },
  items: { type: [itemSchema], required: true },
  recepciones: { type: Array }
});

module.exports = mongoose.model("OrdenCompra", ordenCompraSchema);