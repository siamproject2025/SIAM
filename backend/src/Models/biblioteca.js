const mongoose = require("mongoose");

const LibroSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  autor: { type: String, required: true },
  archivoUrl: { type: String },
  fechaCreacion: { type: Date, default: Date.now },
});

const Libro = mongoose.model('libro', LibroSchema, "libros");

module.exports = Libro;
