// backend/src/models/Auditoria.js
const mongoose = require('mongoose');

const auditoriaSchema = new mongoose.Schema({
  usuario: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    username: { type: String, default: 'Sistema' },
    email: { type: String, default: 'sistema@local' },
    rol: { type: String, default: 'sistema' }
  },
  accion: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT', 'IMPORT'],
    required: true
  },
  modulo: {
    type: String,   
    enum: ['USUARIOS', 'ROLES', 'PROVEEDORES', 'BIENES', 'PERSONAL', 'ESTUDIANTES', 
           'HORARIOS', 'ACTIVIDADES', 'LIBROS', 'DONACIONES', 'GRADOS', 'ORDENES_COMPRA',
           'QUESTIONS', 'DASHBOARD', 'AUDITORIA', 'DIRECTIVA','DIRECTIVA_DOCUMENTOS'],
    required: true
  },
  entidad: {
    nombre: String,
    id: mongoose.Schema.Types.Mixed,
    datos_previos: mongoose.Schema.Types.Mixed,
    datos_nuevos: mongoose.Schema.Types.Mixed,
    cambios_detectados: mongoose.Schema.Types.Mixed // Nuevo: guarda solo los cambios
  },
  ip_address: String,
  user_agent: String,
  detalles: String,
  descripcion_detallada: String, // Nuevo: descripción legible de los cambios
  resultado: {
    type: String,
    enum: ['EXITO', 'ERROR', 'DENEGADO'],
    default: 'EXITO'
  },
  error_message: String,
  metadata: {
    query: mongoose.Schema.Types.Mixed,
    params: mongoose.Schema.Types.Mixed,
    statusCode: Number,
    duration: Number,
    responseSize: Number
  },
  fecha_creacion: { type: Date, default: Date.now }
});

// Índices
auditoriaSchema.index({ fecha_creacion: -1 });
auditoriaSchema.index({ 'usuario.id': 1 });
auditoriaSchema.index({ modulo: 1, accion: 1 });
auditoriaSchema.index({ resultado: 1 });
auditoriaSchema.index({ descripcion_detallada: 'text' }); // Para búsqueda de texto

module.exports = mongoose.model('Auditoria', auditoriaSchema);