const mongoose = require('mongoose');

const donacionSchema = new mongoose.Schema({
  id_donacion: {
    type: Number,
    required: [true, 'El ID de donación es obligatorio'],
    unique: true,
    min: [1, 'El ID debe ser mayor a 0']
  },
  id_almacen: {
    type: String,
    required: [true, 'El nombre del almacén es obligatorio']
  },

  // Fecha real de recepción (la ingresa el usuario, no puede ser futura)
  fecha: {
    type: Date,
    required: false
  },

  // Fecha de registro en el sistema (automática, inmutable)
  fecha_ingreso: {
    type: Date,
    required: false,
    default: Date.now,
    immutable: true
  },

  cantidad_donacion: {
    type: Number,
    required: [true, 'La cantidad de donación es obligatoria'],
    min: [0, 'La cantidad no puede ser negativa']
  },

  // ── Campos de valor ──────────────────────────────────────────────────────
  precio_unitario: {
    type: Number,
    default: 0,
    min: [0, 'El precio unitario no puede ser negativo']
  },
  valor_total: {
    type: Number,
    default: 0,
    min: [0, 'El valor total no puede ser negativo']
  },

  descripcion: {
    type: String,
    maxlength: [1000, 'La descripción no puede exceder 1000 caracteres'],
    trim: true
  },
  tipo_donacion: {
    type: String,
    required: [true, 'El tipo de donación es obligatorio'],
    default: 'Recibida'
  },

  // ── Estado del ciclo de vida ─────────────────────────────────────────────
  estado: {
    type: String,
    required: [true, 'El estado es obligatorio'],
    
    default: 'Recibida'
  },

  observaciones: {
    type: String,
    maxlength: [500, 'Las observaciones no pueden exceder 500 caracteres'],
    trim: true
  },

  // ── Imagen (Base64) ──────────────────────────────────────────────────────
  imagen: {
    type: String,
    default: null
  },
  tipo_imagen: {
    type: String,
    default: null
  },

  // ── Documento adjunto → Google Drive ────────────────────────────────────
  documento_url: {
    type: String,
    default: null
  },
  documento_nombre: {
    type: String,
    default: null
  },

  // ── Auditoría ────────────────────────────────────────────────────────────
  creado_por: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  creado_por_email: {
    type: String,
    default: null
  },
  fecha_creacion: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  actualizado_por: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  actualizado_por_email: {
    type: String,
    default: null
  },
  fecha_actualizacion: {
    type: Date,
    default: null
  }

}, {
  timestamps: true,
  versionKey: false
});

// ── Pre-save: calcular valor_total automáticamente ───────────────────────────
donacionSchema.pre('save', function (next) {
  if (this.precio_unitario != null && this.cantidad_donacion != null) {
    this.valor_total = parseFloat((this.precio_unitario * this.cantidad_donacion).toFixed(2));
  }
  next();
});

donacionSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  const precio = parseFloat(update.precio_unitario ?? update.$set?.precio_unitario ?? 0);
  const cantidad = parseFloat(update.cantidad_donacion ?? update.$set?.cantidad_donacion ?? 0);
  if (precio && cantidad) {
    const total = parseFloat((precio * cantidad).toFixed(2));
    if (update.$set) update.$set.valor_total = total;
    else update.valor_total = total;
  }
  next();
});

// ── Índices ──────────────────────────────────────────────────────────────────
donacionSchema.index({ id_donacion: 1 });
donacionSchema.index({ id_almacen: 1 });
donacionSchema.index({ tipo_donacion: 1 });
donacionSchema.index({ estado: 1 });
donacionSchema.index({ fecha: -1 });
donacionSchema.index({ fecha_ingreso: -1 });

// ── Próximo ID disponible ────────────────────────────────────────────────────
donacionSchema.statics.getNextId = async function () {
  const last = await this.findOne().sort({ id_donacion: -1 });
  return last ? last.id_donacion + 1 : 1;
};

module.exports = mongoose.model('Donacion', donacionSchema, 'donaciones');