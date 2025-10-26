const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const aulaSchema = new Schema({
    nombre: { type: String, require: true },
    descripcion: { type: String, require: true },
    capacidad: { type: Number, require: true },
    fechaCreacion: { type: Date, require: true, default: Date.now() },
    fechaModificacion: { type: Date, require: true, defualt: Date.now() }
}, { collections: "aulas" })

const Aula = mongoose.model("Aula", aulaSchema);

module.exports = Aula;