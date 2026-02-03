const mongoose = require("mongoose");
const { Schema } = mongoose;

const docenteSchema = new Schema({
  identidad: {
    type: String,
    required: true,
    trim: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaModificacion: {
    type: Date,
    default: Date.now
  }
}, { collection: "docentes" });

const Docente = mongoose.model("Docente", docenteSchema);
module.exports = Docente;
