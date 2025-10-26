const mongoose = require('mongoose');

const libroSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  autor: { type: String, required: true },
  recurso: { type: String, required: false },
  tipoRecurso: { type: String, required: false},
  fechaCreacion: { type: Date, default: Date.now },
}, { collection: "biblioteca_virtuals"});

const Libro = mongoose.model('libro', libroSchema, "libros");

module.exports = Libro;