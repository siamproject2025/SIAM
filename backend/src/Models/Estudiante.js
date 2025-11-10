// Modelo: Estudiante.js
const mongoose = require('mongoose');

const EstudianteSchema = new mongoose.Schema({
    // --- Datos del Alumno ---
    nombre_completo: { type: String, required: true },
    fecha_nacimiento: { type: Date, required: true },
    edad: { type: Number, required: true },
    genero: { type: String, enum: ['Masculino', 'Femenino', 'Otro'], required: true },
    id_documento: { type: String, unique: true, required: true }, // Cédula, DNI, Pasaporte, etc.
    residencia_direccion: { type: String, required: true },
    telefono_alumno: { type: String },
    // NUEVOS CAMPOS PARA IMAGEN
        imagen: {
            type: String, // Guardará la imagen en Base64
            default: null
        },
        tipo_imagen: {
            type: String, // Guardará el tipo MIME, ej. image/png
            default: null
        },
    // --- Datos Académicos ---
    grado_a_matricular: { type: String, required: true },
    escuela_anterior: { type: String },
    notas_grado_anterior: { type: String }, // Podría ser una URL a un documento o una nota simple

    // --- Datos del Padre/Encargado ---
    nombre_encargado: { type: String, required: true },
    parentesco_encargado: { type: String, required: true },
    id_documento_encargado: { type: String, required: true },
    telefono_encargado: { type: String, required: true },
    email_encargado: { type: String },
    
    // --- Contacto de Emergencia ---
    contacto_emergencia_nombre: { type: String },
    contacto_emergencia_telefono: { type: String },

    fecha_matricula: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Estudiante', EstudianteSchema);