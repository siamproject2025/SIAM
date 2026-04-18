// Models/Estudiante.js
// CAMBIOS:
// - Sub-schema TransporteSchema (datos del servicio de transporte)
// - Sub-schema SnapshotEncargadoSchema (foto de encargados por año)
// - MatriculaHistorialSchema ahora incluye snapshot de encargados + transporte
//   para que cada año tenga su propia "foto" del estado del alumno
const mongoose = require('mongoose');

// ── Sub-schema: historial de matrículas ─────────────────────
// Ahora cada entrada guarda un snapshot de los datos relevantes del año
const SnapshotEncargadoSchema = new mongoose.Schema({
  nombre_encargado:       { type: String, default: '' },
  parentesco_encargado:   { type: String, default: '' },
  id_documento_encargado: { type: String, default: '' },
  telefono_encargado:     { type: String, default: '' },
  email_encargado:        { type: String, default: '' },
  es_principal:           { type: Boolean, default: false },
}, { _id: false });

// Snapshot de transporte por año
const SnapshotTransporteSchema = new mongoose.Schema({
  usa_transporte:               { type: Boolean, default: false },
  transporte_ruta:              { type: String, default: '' },
  transporte_conductor_nombre:  { type: String, default: '' },
  transporte_conductor_telefono:{ type: String, default: '' },
  transporte_placa:             { type: String, default: '' },
  transporte_empresa:           { type: String, default: '' },
  transporte_punto_recogida:    { type: String, default: '' },
  transporte_observaciones:     { type: String, default: '' },
}, { _id: false });

const MatriculaHistorialSchema = new mongoose.Schema({
  anio_matricula:     { type: Number, required: true },
  grado_a_matricular: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grado',
    required: true
  },
  fecha_matricula:  { type: Date, default: Date.now },
  estado_matricula: {
    type: String,
    enum: ['activa', 'prematricula', 'completada', 'retirado'],
    default: 'activa'
  },
  notas:         { type: String, default: '' },
  realizado_por: { type: String, default: 'sistema' },

  // ── Snapshot del estado del alumno en ese año ────────────
  // Permite ver quién era el encargado, si tenía transporte, etc.
  // Esta info queda inmutable una vez guardada — no se sobreescribe
  // al modificar los datos actuales del alumno.
  snapshot_encargados:  { type: [SnapshotEncargadoSchema],   default: [] },
  snapshot_transporte:  { type: SnapshotTransporteSchema,    default: {} },
  // Agregar después de los campos existentes de snapshot_encargados y snapshot_transporte:
snapshot_nombre_completo:              { type: String, default: '' },
snapshot_fecha_nacimiento:             { type: Date },
snapshot_edad:                         { type: Number },
snapshot_genero:                       { type: String, default: '' },
snapshot_id_documento:                 { type: String, default: '' },
snapshot_telefono_alumno:              { type: String, default: '' },
snapshot_escuela_anterior:             { type: String, default: '' },
snapshot_alergias:                     { type: String, default: '' },
snapshot_enfermedades:                 { type: String, default: '' },
snapshot_medicamentos:                 { type: String, default: '' },
snapshot_pediatra_nombre:              { type: String, default: '' },
snapshot_pediatra_telefono:            { type: String, default: '' },
snapshot_vacunas_al_dia:               { type: Boolean, default: false },
snapshot_contacto_emergencia_nombre:   { type: String, default: '' },
snapshot_contacto_emergencia_telefono: { type: String, default: '' },
  snapshot_grado_nombre:{ type: String, default: '' }, // Nombre del grado en ese año (desnormalizado)
  snapshot_residencia:  { type: String, default: '' }, // Dirección en ese año
  // Flag: indica si el snapshot fue generado automáticamente
  snapshot_generado:    { type: Boolean, default: false },

  // Edición posterior al snapshot (no toca el snapshot, solo estado/notas)
  editado_por:      { type: String, default: '' },
  fecha_edicion:    { type: Date },
}, { _id: true });

// ── Sub-schema: encargado / padre / tutor ────────────────────
const EncargadoSchema = new mongoose.Schema({
  nombre_encargado:       { type: String, required: true },
  parentesco_encargado:   { type: String, required: true },
  id_documento_encargado: { type: String, required: true, default: '' },
  telefono_encargado:     { type: String, required: true },
  email_encargado:        { type: String, default: '' },
  es_principal:           { type: Boolean, default: false }
}, { _id: false });

// ── Sub-schema: documento de matrícula (guardado en Drive) ───
const DocumentoSchema = new mongoose.Schema({
  tipo:          { type: String, default: 'otro' },
  nombre:        { type: String, default: '' },
  archivoUrl:    { type: String, default: '' },
  nombreArchivo: { type: String, default: '' },
}, { _id: false });

// ── Sub-schema: transporte escolar ──────────────────────────
const TransporteSchema = new mongoose.Schema({
  usa_transporte:               { type: Boolean, default: false },
  transporte_ruta:              { type: String, default: '' },
  transporte_conductor_nombre:  { type: String, default: '' },
  transporte_conductor_telefono:{ type: String, default: '' },
  transporte_placa:             { type: String, default: '' },
  transporte_empresa:           { type: String, default: '' },
  transporte_punto_recogida:    { type: String, default: '' },
  transporte_observaciones:     { type: String, default: '' },
}, { _id: false });

// ── Schema principal ─────────────────────────────────────────
const EstudianteSchema = new mongoose.Schema({

  // --- Datos permanentes del Alumno ---
  nombre_completo:      { type: String, required: true },
  fecha_nacimiento:     { type: Date,   required: true },
  edad:                 { type: Number, required: true },
  genero:               { type: String, enum: ['Masculino', 'Femenino', 'Otro'], required: true },
  id_documento:         { type: String, unique: true, required: true },
  residencia_direccion: { type: String, required: true },
  telefono_alumno:      { type: String },

  estado: {
    type: String,
    enum: ['activo', 'inactivo'],
    default: 'activo'
  },

  imagen:      { type: String, default: null },
  tipo_imagen: { type: String, default: null },

  // --- Datos Médicos ---
  alergias:     { type: String, default: '' },
  enfermedades: { type: String, default: '' },
  medicamentos: { type: String, default: '' },
  pediatra:         { type: String, default: '' }, // legacy
  pediatra_nombre:  { type: String, default: '' },
  pediatra_telefono:{ type: String, default: '' },
  vacunas_al_dia: { type: Boolean, default: false },

  // --- Datos Académicos (matrícula más reciente) ---
  grado_a_matricular: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grado',
    required: true
  },
  escuela_anterior:     { type: String },
  notas_grado_anterior: { type: String },
  anio_matricula: {
    type: Number,
    default: () => new Date().getFullYear()
  },

  historial_matriculas: {
    type: [MatriculaHistorialSchema],
    default: []
  },

  // --- Encargados (array — hasta 3) ---
  encargados: {
    type: [EncargadoSchema],
    default: []
  },

  // Campos legacy del encargado principal
  nombre_encargado:       { type: String, required: true },
  parentesco_encargado:   { type: String, required: true },
  id_documento_encargado: { type: String },
  telefono_encargado:     { type: String, required: true },
  email_encargado:        { type: String },

  // --- Documentos de matrícula ---
  documentos: {
    type: [DocumentoSchema],
    default: []
  },

  // --- Transporte escolar ─────────────────────────────────
  usa_transporte:               { type: Boolean, default: false },
  transporte_ruta:              { type: String, default: '' },
  transporte_conductor_nombre:  { type: String, default: '' },
  transporte_conductor_telefono:{ type: String, default: '' },
  transporte_placa:             { type: String, default: '' },
  transporte_empresa:           { type: String, default: '' },
  transporte_punto_recogida:    { type: String, default: '' },
  transporte_observaciones:     { type: String, default: '' },

  // --- Contacto de Emergencia ---
  contacto_emergencia_nombre:   { type: String },
  contacto_emergencia_telefono: { type: String },

  // --- Auditoría ---
  creado_por:      { type: String, default: 'sistema' },
  actualizado_por: { type: String, default: '' },
  fecha_matricula: { type: Date, default: Date.now }

});

module.exports = mongoose.model('Estudiante', EstudianteSchema);