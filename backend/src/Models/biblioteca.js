const mongoose = require('mongoose');

const bibliotecaSchema = new mongoose.Schema({
  id: { type: String, required: true },
  titulo: { type: String, required: true },
  autor: { type: String, required: true },
  recurso: { type: String, required: true },
  fechaCreacion: { type: Date, default: Date.now },
});

const Biblioteca = mongoose.model('Biblioteca', bibliotecaSchema);

module.exports = Biblioteca;