// models/Bien.js
const mongoose = require("mongoose");

const bienSchema = new mongoose.Schema({
  codigo: {
    type: String, 
    required: false,
    unique: false,
    trim: true
  },
  nombre: {
    type: String,
    required: false,
    trim: true
  },
  descripcion: {
    type: String,
    required: false,
    trim: true
  },
  tipo_asignacion: {
    type: String,
    enum: ["Persona", "Aula", "Departamento", "Almacén", null],
    default: null
  },
  asignado_a: {
    type: String,
    default: null
  },
  categoria: {
    type: String,
    enum: [
      'MOBILIARIO',
      'EQUIPO_COMPUTO',
      'ELECTRONICO',
      'HERRAMIENTA',
      'OTRO',
      'CUERDA',
      'VIENTO_MADERA',
      'VIENTO_METAL',
      'PERCUSION',
      'TECLADO',
      'INSTRUMENTO_ELECTRONICO',
      'ACCESORIO_MUSICAL'
    ],
    required: true
  },
  estado: {
    type: String,
    required: true,
    enum: ["ACTIVO", "INACTIVO", "MANTENIMIENTO", "PRESTAMO"],
    default: "ACTIVO"
  },
  valor: {
    type: Number,
    default: 0
  },
  fechaIngreso: {
    type: Date,
    default: Date.now
  },
  // NUEVOS CAMPOS PARA IMAGEN
  imagen: {
    type: String, // Guardará la imagen en Base64
    default: null
  },
  tipo_imagen: {
    type: String, // Guardará el tipo MIME, ej. image/png
    default: null
  },
  // ========== CAMPOS DE AUDITORÍA ==========
  creado_por: {
    type: String, // ID del usuario que creó
    default: null
  },
  creado_por_email: {
    type: String, // Email del usuario que creó
    default: null
  },
  fecha_creacion: {
    type: Date,
    default: Date.now
  },
  actualizado_por: {
    type: String, // ID del usuario que actualizó
    default: null
  },
  actualizado_por_email: {
    type: String, // Email del usuario que actualizó
    default: null
  },
  fecha_actualizacion: {
    type: Date,
    default: null
  },
  eliminado_por: {
    type: String, // ID del usuario que eliminó (para soft delete si se implementa)
    default: null
  },
  eliminado_por_email: {
    type: String, // Email del usuario que eliminó
    default: null
  },
  fecha_eliminacion: {
    type: Date,
    default: null
  }
}, { 
  collection: "bienes",
  timestamps: true // Esto añade createdAt y updatedAt automáticamente
});

module.exports = mongoose.model("Bien", bienSchema);