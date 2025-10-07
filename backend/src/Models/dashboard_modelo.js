// Models/modulo_modelo.js
const mongoose = require('mongoose');

const moduloSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    unique: true
  },
  descripcion: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  roles: {
    type: [String],
    enum: ['ADMIN', 'DOCENTE', 'PADRE'],
    default: ['ADMIN']
  }
}, { timestamps: true });

module.exports = mongoose.model('Dashboard', moduloSchema, 'dashboard');
