const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const horarioSchema = new Schema({
  aula_id: { type: Types.ObjectId, required: true, ref: "Aula"},
  dia: [{ type: String, enum: ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'], required: true }],
  inicio: { type: String, required: true }, // formatear HH:mm
  fin: { type: String, required: true },
  docente_id: { type: Types.ObjectId, required: true, ref: 'Docente' },
  grado: { type: String, required: false },
  asignatura: { type: String, required: true },
  alumnos: [{type: Types.ObjectId, ref: "Alumno", default: []}]
});

const Horario = mongoose.model('Horario', horarioSchema);

module.exports = Horario;