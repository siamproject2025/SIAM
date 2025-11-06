// models/Bien.js
const mongoose = require("mongoose");

const bienSchema = new mongoose.Schema({
  codigo: {
    type: String, 
    required: false,
    unique: false,
    trim: true
  },
  nombre:{
    type: String,
    required: false,
    trim: true
  },
  descripcion: {
    type: String,
    required: false,
    trim: true
  },
  categoria: {
    type: String,
    trim: true
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
  }
}, { collection: "bienes" });

module.exports = mongoose.model("Bien", bienSchema);