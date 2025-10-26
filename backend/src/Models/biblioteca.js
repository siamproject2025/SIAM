const mongoose = require('mongoose');

const libroSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  autor: { type: String, required: true },
  categoria: { type: String },
  disponible: { type: Boolean, default: true },
  fechaRegistro: { type: Date, default: Date.now }
});

const Libro = mongoose.model('libro', libroSchema, "libros");
module.exports = Libro;
