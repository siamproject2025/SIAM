// models/OrdenCompra.js
const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  descripcion: { type: String, required: true },
  cantidad:    { type: Number, required: true, min: 0 },
  costoUnit:   { type: Number, required: true, min: 0 }
});

const adjuntoSchema = new mongoose.Schema({
  nombre:      { type: String, required: true, trim: true },
  tipo:        { type: String, enum: ['PDF', 'IMG', 'DOC'], required: true },
  ruta:        { type: String, required: true },
  tamano:      { type: Number, required: true },
  fecha_carga: { type: Date, default: Date.now }
});

const ordenCompraSchema = new mongoose.Schema({
  numero: {
    type:     String,
    required: false,   // Se genera en pre-save
    unique:   true,
    trim:     true
  },
  proveedor_id: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      "Proveedor",
    required: true
  },
  estado: {
    type:    String,
    required: true,
    enum:    ["BORRADOR", "ENVIADA", "RECIBIDA", "CERRADA"],
    default: "BORRADOR"
  },
  fecha: { type: Date, default: Date.now },
  items: {
    type: [itemSchema],
    required: true,
    validate: {
      validator: (items) => items && items.length > 0,
      message:   'La orden debe tener al menos un ítem'
    }
  },
  recepciones: { type: Array, default: [] },
  adjuntos: {
    type: [adjuntoSchema],
    default: [],
    validate: {
      validator: (a) => a.length <= 5,
      message:   'Máximo 5 adjuntos por orden'
    }
  },

  // ========== CAMPOS DE AUDITORÍA ==========
  creado_por: {
    type:    String,
    default: null
  },
  creado_por_email: {
    type:    String,
    default: null
  },
  fecha_creacion: {
    type:    Date,
    default: Date.now
  },
  actualizado_por: {
    type:    String,
    default: null
  },
  actualizado_por_email: {
    type:    String,
    default: null
  },
  fecha_actualizacion: {
    type:    Date,
    default: null
  },
  eliminado_por: {
    type:    String,
    default: null
  },
  eliminado_por_email: {
    type:    String,
    default: null
  },
  fecha_eliminacion: {
    type:    Date,
    default: null
  }
}, {
  collection: "ordenes_compra",
  timestamps: true   // createdAt + updatedAt automáticos
});

// ── Auto-generar número ──────────────────────────────────────
ordenCompraSchema.pre('save', async function (next) {
  if (this.numero) return next();
  try {
    const ultima = await mongoose.model('OrdenCompra').findOne().sort({ createdAt: -1 }).lean();

    let siguiente = 1;
    if (ultima?.numero) {
      const actual = parseInt(ultima.numero.split('-')[1], 10);
      siguiente = actual + 1;
    }
    this.numero = `ORD-${String(siguiente).padStart(6, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("OrdenCompra", ordenCompraSchema);