// Models/Estudiante.js
const mongoose = require('mongoose');

// ── Sub-schema para cada entrada del historial ───────────────
// Cada vez que un alumno se rematricula, se AGREGA una entrada
// a este array. Los años anteriores NUNCA se sobreescriben.
const MatriculaHistorialSchema = new mongoose.Schema({
    anio_matricula:     { type: Number, required: true },
    grado_a_matricular: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grado',
        required: true
    },
    fecha_matricula:    { type: Date, default: Date.now },
    estado_matricula:   {
        type: String,
        enum: ['activa', 'prematricula', 'completada', 'retirado'],
        default: 'activa'
    },
    notas:              { type: String, default: '' },
    realizado_por:      { type: String, default: 'sistema' }
}, { _id: true });

const EstudianteSchema = new mongoose.Schema({
    // --- Datos permanentes del Alumno ---
    nombre_completo:      { type: String, required: true },
    fecha_nacimiento:     { type: Date,   required: true },
    edad:                 { type: Number, required: true },
    genero:               { type: String, enum: ['Masculino', 'Femenino', 'Otro'], required: true },
    id_documento:         { type: String, unique: true, required: true },
    residencia_direccion: { type: String, required: true },
    telefono_alumno:      { type: String },

    // Estado del alumno (activo / inactivo)
    estado: {
        type: String,
        enum: ['activo', 'inactivo'],
        default: 'activo'
    },

    // --- Imagen ---
    imagen:      { type: String, default: null },
    tipo_imagen: { type: String, default: null },

    // --- Datos Médicos ---
    alergias:       { type: String, default: '' },
    enfermedades:   { type: String, default: '' },
    medicamentos:   { type: String, default: '' },
    pediatra:       { type: String, default: '' },
    vacunas_al_dia: { type: Boolean, default: false },

    // --- Datos Académicos (matrícula ACTUAL / más reciente) ---
    // Estos campos reflejan el año y grado en curso.
    // El historial completo vive en historial_matriculas[].
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

    // ── HISTORIAL DE MATRÍCULAS ──────────────────────────────
    // Array embebido. Cada rematrícula AGREGA un elemento nuevo.
    // Los registros anteriores nunca se modifican.
    historial_matriculas: {
        type: [MatriculaHistorialSchema],
        default: []
    },

    // --- Datos del Padre/Encargado ---
    nombre_encargado:       { type: String, required: true },
    parentesco_encargado:   { type: String, required: true },
    id_documento_encargado: { type: String, required: true },
    telefono_encargado:     { type: String, required: true },
    email_encargado:        { type: String },

    // --- Contacto de Emergencia ---
    contacto_emergencia_nombre:   { type: String },
    contacto_emergencia_telefono: { type: String },

    // --- Auditoría ---
    creado_por:      { type: String, default: 'sistema' },
    actualizado_por: { type: String, default: '' },

    fecha_matricula: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Estudiante', EstudianteSchema);