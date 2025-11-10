const mongoose = require("mongoose");

const LibroSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  autor: { type: String, required: true },
  categoria: { type: String },
  disponible: { type: Boolean, default: true },
  archivoUrl: { type: String, required: true }, // URL en Google Drive
  nombreArchivo: { type: String, required: true }, // nombre interno en Drive
  extension: { type: String }, // nueva propiedad para guardar la extensión del archivo
  fechaCreacion: { type: Date, default: Date.now },
});

const Libro = mongoose.model("Libro", LibroSchema, "libros");
module.exports = Libro;
