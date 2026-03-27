// Models/Estudiante.js
const mongoose = require('mongoose');

// ── Sub-schema: historial de matrículas ─────────────────────
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
    realizado_por: { type: String, default: 'sistema' }
}, { _id: true });

// ── Sub-schema: encargado / padre / tutor ────────────────────
// Antes solo existían campos sueltos (nombre_encargado, etc.)
// Ahora se guarda un array — hasta 3 encargados por alumno.
// Los campos sueltos legacy se conservan apuntando al principal.
const EncargadoSchema = new mongoose.Schema({
    nombre_encargado:       { type: String, required: true },
    parentesco_encargado:   { type: String, required: true },
    id_documento_encargado: { type: String, default: '' },
    telefono_encargado:     { type: String, required: true },
    email_encargado:        { type: String, default: '' },
    es_principal:           { type: Boolean, default: false }
}, { _id: false });

// ── Sub-schema: documento de matrícula (guardado en Drive) ───
const DocumentoSchema = new mongoose.Schema({
    tipo:          { type: String, default: 'otro' }, // identidad, partida_nacimiento, etc.
    nombre:        { type: String, default: '' },     // nombre original del archivo
    archivoUrl:    { type: String, default: '' },     // webViewLink de Google Drive
    nombreArchivo: { type: String, default: '' },     // nombre con UUID en Drive
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

    // Estado del alumno
    estado: {
        type: String,
        enum: ['activo', 'inactivo'],
        default: 'activo'
    },

    // --- Imagen de perfil (base64 en Mongo) ---
    imagen:      { type: String, default: null },
    tipo_imagen: { type: String, default: null },

    // --- Datos Médicos ---
    alergias:     { type: String, default: '' },
    enfermedades: { type: String, default: '' },
    medicamentos: { type: String, default: '' },

    // pediatra: campo legacy (se mantiene para compatibilidad con registros viejos)
    pediatra:         { type: String, default: '' },
    // Campos nuevos separados que usa el formulario actual
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

    // --- Historial de matrículas ---
    historial_matriculas: {
        type: [MatriculaHistorialSchema],
        default: []
    },

    // --- Encargados (array — hasta 3) ---
    // Reemplaza los campos sueltos. Los campos sueltos se conservan
    // apuntando al encargado principal para compatibilidad con código antiguo.
    encargados: {
        type: [EncargadoSchema],
        default: []
    },

    // --- Campos legacy del encargado principal ---
    // Se sincronizan automáticamente desde encargados[0] en el controlador.
    nombre_encargado:       { type: String, required: true },
    parentesco_encargado:   { type: String, required: true },
    id_documento_encargado: { type: String },
    telefono_encargado:     { type: String, required: true },
    email_encargado:        { type: String },

    // --- Documentos de matrícula (guardados en Google Drive) ---
    documentos: {
        type: [DocumentoSchema],
        default: []
    },

    // --- Contacto de Emergencia ---
    contacto_emergencia_nombre:   { type: String },
    contacto_emergencia_telefono: { type: String },

    // --- Auditoría ---
    creado_por:      { type: String, default: 'sistema' },
    actualizado_por: { type: String, default: '' },
    fecha_matricula: { type: Date, default: Date.now }

});

module.exports = mongoose.model('Estudiante', EstudianteSchema);