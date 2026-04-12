const mongoose = require("mongoose");

const actividadSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, "El nombre es obligatorio"],
    trim: true
  },
  fecha: {
    type: Date,
    required: [true, "La fecha es obligatoria"]
  },
  lugar: {
    type: String,
    required: [true, "El lugar es obligatorio"],
    trim: true
  },
  descripcion: {
    type: String,
    required: [true, "La descripción es obligatoria"],
    trim: true
  },
  categoria: {
    type: String,
    enum: ['mantenimiento', 'prestamo', 'activo', 'general', 'conflicto'],
    default: 'general'
  },
  color: {
    type: String,
    enum: ['azul', 'verde', 'amarillo', 'morado', 'rojo'],
    default: 'morado'
  },
  usuario: {
    type: String,
    required: [true, "El usuario es obligatorio"],
    index: true
  },

  // ── Auditoría de actualizaciones ──────────────────────────────
  // FIX: campos para registrar quién y cuándo hizo la última edición
  actualizado_por_email: {
    type: String,
    default: null
  },
  fecha_actualizacion: {
    type: Date,
    default: null
  },  creado_por: {
    type: String, // ID del usuario que creó
    default: null
  },
  creado_por_email: {
    type: String, // Email del usuario que creó
    default: null
  },

}, {
  timestamps: true,
  collection: 'actividades'
});

actividadSchema.index({ usuario: 1, fecha: 1 });
actividadSchema.index({ usuario: 1, lugar: 1 });

module.exports = mongoose.model("Actividad", actividadSchema);