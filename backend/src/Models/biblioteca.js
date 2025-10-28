const mongoose = require("mongoose");

const LibroSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  autor: { type: String, required: true },
  categoria: { type: String },
  disponible: { type: Boolean, default: true },
  archivoUrl: { type: String, required: true }, // ✅ se agrega
  nombreArchivo: { type: String, required: true }, // ✅ se agrega para eliminar luego
  fechaCreacion: { type: Date, default: Date.now },
});

const Libro = mongoose.model("Libro", libroSchema, "libros");
module.exports = Libro;
