const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const alumnoSchema = new Schema({
    identidad: { type: String, required: true },
    nombre: { type: String, required: true },
    matriculas: [{
        periodo: { type: String },
        estado: { type: String },
        grado: { type: String }
    }],
    asignaturas: [{type: String}],
    estadoHistorial: [{
        desde: {type: Date},
        estado: {type: String}
    }]
}, { collection: "alumnos" });

const Alumno = mongoose.model('Alumno', alumnoSchema);

module.exports = Alumno;