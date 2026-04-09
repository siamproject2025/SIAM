const mongoose = require('mongoose');

const solicitudSchema = new mongoose.Schema({
  nombre_solicitante: { type: String, required: true },
  email:              { type: String, required: true, unique: true },
  nombre_alumno:      { type: String, required: false },
  grado:              { type: String, required: false },

  estado: {
    type:    String,
    enum:    ['PENDIENTE', 'APROBADO', 'DENEGADO', 'BLOQUEADO'],
    default: 'PENDIENTE'
  },

  fecha_solicitud:  { type: Date,   default: Date.now },
  fecha_resolucion: { type: Date,   default: null },
  resuelto_por:     { type: String, default: null },

  // ── Asignados al aprobar ──────────────────────────────────────────────────
  rol_asignado: {
    type:    String,
    default: null                           // ej: "PADRE", "DOCENTE", etc.
  },
  alumno_asignado: {
    type:    mongoose.Schema.Types.ObjectId,
    ref:     'Matricula',
    default: null                           // ObjectId del alumno en /api/matriculas
  }
});

const Solicitud = mongoose.model('Solicitud', solicitudSchema, 'solicitudes');
module.exports = Solicitud;