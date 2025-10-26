const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const docenteSchema = new Schema({
    identidad: {type: String, required: true},
    nombre: { type: String, require: true },
    fechaCreacion: { type: Date, require: true, default: Date.now() },
    fechaModificacion: { type: Date, require: true, defualt: Date.now() }
}, { collections: "docentes" })

const Docente = mongoose.model("Docente", docenteSchema);

module.exports = Docente;