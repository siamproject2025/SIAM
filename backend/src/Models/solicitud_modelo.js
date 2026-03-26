const mongoose = require('mongoose');

const solicitudSchema = new mongoose.Schema({
  nombre_solicitante: { type: String, required: true },     // padre/empleado
  email: { type: String, required: true, unique: true },
  nombre_alumno: { type: String, required: true },
  grado: { type: String, required: true },                  // ej: "3ro Primaria" o "Empleado"
  estado: {
    type: String,
    enum: ['PENDIENTE', 'APROBADO', 'DENEGADO', 'BLOQUEADO'],
    default: 'PENDIENTE'
  },
  fecha_solicitud: { type: Date, default: Date.now },
  fecha_resolucion: { type: Date, default: null },
  resuelto_por: { type: String, default: null }             // authId del admin
});

const Solicitud = mongoose.model('Solicitud', solicitudSchema, 'solicitudes');
module.exports = Solicitud;