// models/Bien.js
const mongoose = require("mongoose");

const bienSchema = new mongoose.Schema({
  codigo: {
    type: String, 
    required: true,
    unique: true,
    trim: true
  },
  nombre:{
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    required: true,
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
  }
}, { collection: "bienes" });

module.exports = mongoose.model("Bien", bienSchema);