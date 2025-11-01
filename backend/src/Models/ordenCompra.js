  /* const mongoose = require("mongoose");

  const itemSchema = new mongoose.Schema({
    descripcion: String,
    cantidad: Number,
    costoUnit: Number
  });

  const ordenCompraSchema = new mongoose.Schema({
    numero: { type: String, required: true },
    proveedor_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    estado: { type: String, required: true },
    fecha: { type: Date, default: Date.now }, // Aquí agregas la fecha
    items: { type: [itemSchema], required: true },
    recepciones: { type: Array }
  });

  module.exports = mongoose.model("OrdenCompra", ordenCompraSchema);
*/

const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  descripcion: { type: String, required: true },
  cantidad: { type: Number, required: true },
  costoUnit: { type: Number, required: true }
});

const ordenCompraSchema = new mongoose.Schema({
  numero: { type: String, required: true },
  proveedor_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Proveedor", // 👈 Necesario para populate()
    required: true 
  },
  estado: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
  items: { type: [itemSchema], required: true },
  recepciones: { type: Array }
});

module.exports = mongoose.model("OrdenCompra", ordenCompraSchema);
