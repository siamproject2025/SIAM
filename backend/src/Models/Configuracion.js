// models/Configuracion.js
const mongoose = require('mongoose');

const configuracionSchema = new mongoose.Schema({
  clave: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  valor: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  descripcion: {
    type: String,
    default: ''
  },
  tipo: {
    type: String,
    enum: ['BOOLEAN', 'STRING', 'NUMBER', 'OBJECT', 'ARRAY'],
    default: 'BOOLEAN'
  },
  modificado_por: {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    fecha: { type: Date, default: Date.now }
  },
  metadata: {
    creado_en: { type: Date, default: Date.now },
    motivo: String,
    estado_anterior: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

configuracionSchema.index({ clave: 1 });
configuracionSchema.index({ 'modificado_por.usuario': 1 });

module.exports = mongoose.model('Configuracion', configuracionSchema);