const mongoose = require("mongoose");
const { Schema } = mongoose;

const aulaSchema = new Schema({
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, required: true, trim: true },
  capacidad: { type: Number, required: true, min: 1 },
  fechaCreacion: { type: Date, default: Date.now },
  fechaModificacion: { type: Date, default: Date.now }
}, { collection: "aulas" });

const Aula = mongoose.model("Aula", aulaSchema);
module.exports = Aula;
