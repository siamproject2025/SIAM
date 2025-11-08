// backend/src/Models/Grado.js
const { Schema, model } = require("mongoose");

/* ---------- Subdocumentos ---------- */
const MateriaSchema = new Schema(
  {
    id_materia: { type: Number, required: true, min: 1 },
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, default: "", trim: true },
    creditos: { type: Number, required: true, min: 0 },
    personal: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const HorarioGradoSchema = new Schema(
  {
    id_horario: { type: Number, required: true, min: 1 },
    dia_semana: {
      type: String,
      required: true,
      enum: ["Lunes", "Martes", "Miercoles", "Miércoles", "Jueves", "Viernes", "Sabado", "Sábado"],
    },
    hora_inicio: {
      type: String,
      required: true,
      match: [/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/, "hora_inicio debe estar en formato HH:mm:ss"],
    },
    hora_fin: {
      type: String,
      required: true,
      match: [/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/, "hora_fin debe estar en formato HH:mm:ss"],
    },
    materia: { type: MateriaSchema, required: true },
    aula: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const MateriaPlanSchema = new Schema(
  {
    id_materia: { type: Number, required: true, min: 1 },
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, default: "", trim: true },
    creditos: { type: Number, required: true, min: 0 },
    horas_semanales: { type: Number, required: true, min: 0 },
    es_obligatoria: { type: Boolean, default: true },
    personal_asignado: { type: String, required: true, trim: true },
  },
  { _id: false }
);

/* ---------- Documento principal ---------- */
const GradoSchema = new Schema(
  {
    grado: { type: String, required: true, trim: true }, // "10mo Grado"
    descripcion: { type: String, default: "", trim: true },

    horarios_grado: { type: [HorarioGradoSchema], default: [] },
    materias_grado: { type: [MateriaPlanSchema], default: [] },

    total_creditos: { type: Number, required: true, min: 0 },
    total_horas_semanales: { type: Number, required: true, min: 0 },

    estado: { type: String, default: "Activo", enum: ["Activo", "Inactivo"] },
    anio_academico: { type: Number, required: true, min: 1900 },

    fecha_actualizacion: { type: Date, required: true },
    timestamp: { type: Date, required: true },
  },
  { timestamps: true, collection: "grados" }
);

/* ---------- Índices ---------- */
GradoSchema.index({ grado: 1, anio_academico: 1 }, { unique: true, name: "uniq_grado_anio" });
GradoSchema.index({ estado: 1, anio_academico: 1 });

/* ---------- Consistencias ---------- */
GradoSchema.pre("save", function (next) {
  for (const h of this.horarios_grado || []) {
    if (h.hora_inicio && h.hora_fin && h.hora_inicio >= h.hora_fin) {
      return next(new Error(`En horario ${h.id_horario}, hora_inicio debe ser menor que hora_fin`));
    }
  }
  next();
});

module.exports = model("grados", GradoSchema);