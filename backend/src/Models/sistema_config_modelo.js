const mongoose = require('mongoose');

/**
 * Guarda parámetros globales del sistema.
 * Se usa un único documento con clave "bloqueo".
 */
const sistemaConfigSchema = new mongoose.Schema({
  clave: { type: String, required: true, unique: true },   // e.g. "bloqueo"
  max_intentos_fallidos: { type: Number, default: 4 },     // intentos antes de bloquear
  minutos_bloqueo:       { type: Number, default: 10 },    // minutos de bloqueo
}, { timestamps: true });

const SistemaConfig = mongoose.model('SistemaConfig', sistemaConfigSchema, 'sistema_config');
module.exports = SistemaConfig;