const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const horarioSchema = new Schema({
  aula_id: { type: String, required: true },
  dia: { type: String, enum: ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'], required: true },
  inicio: { type: String, required: true }, // formatear HH:mm
  fin: { type: String, required: true },
  docente_id: { type: Types.ObjectId, required: true, ref: 'Docente' },
  grado: { type: String, required: true },
  asignatura: { type: String, required: true }
});

const Horario = mongoose.model('Horario', horarioSchema);

module.exports = Horario;