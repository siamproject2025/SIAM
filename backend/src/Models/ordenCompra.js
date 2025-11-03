const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  descripcion: { type: String, required: true },
  cantidad: { type: Number, required: true, min: 0 },
  costoUnit: { type: Number, required: true, min: 0 }
});

const ordenCompraSchema = new mongoose.Schema({
  numero: { 
    type: String, 
    required: true,
    unique: true,
    trim: true 
  },
  proveedor_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Proveedor", // 👈 Necesario para populate()
    required: true 
  },
  estado: { 
    type: String, 
    required: true,
    enum: ["BORRADOR", "ENVIADA", "RECIBIDA", "CERRADA"],
    default: "BORRADOR"
  },
  fecha: { 
    type: Date, 
    default: Date.now 
  },
  items: { 
    type: [itemSchema], 
    required: true,
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'La orden debe tener al menos un ítem'
    }
  },
  recepciones: { 
    type: Array,
    default: [] 
  }
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

module.exports = mongoose.model("OrdenCompra", ordenCompraSchema);