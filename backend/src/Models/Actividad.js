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
  }
});

module.exports = mongoose.model("Actividad", actividadSchema);
