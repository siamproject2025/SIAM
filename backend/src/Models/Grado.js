// backend/src/Models/Grado.js
const { Schema, model } = require("mongoose");

/* ---------- Subdocumentos ---------- */
const MateriaSchema = new Schema(
  {
    id_materia:  { type: Number, required: true, min: 1 },
    nombre:      { type: String, required: true, trim: true },
    descripcion: { type: String, default: "", trim: true },
    aula:        { type: String, required: true, trim: true },
    personal:    { type: String, required: true, trim: true },
  },
  { _id: false }
);

const HorarioGradoSchema = new Schema(
  {
    id_horario: { type: Number, required: true, min: 1 },
    dia_semana: {
      type: String,
      required: true,
      enum: ["Lunes","Martes","Miercoles","Miércoles","Jueves","Viernes","Sabado","Sábado"],
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
    aula:    { type: String, required: true, trim: true },
  },
  { _id: false }
);

const MateriaPlanSchema = new Schema(
  {
    id_materia:         { type: Number,  required: true, min: 1 },
    nombre:             { type: String,  required: true, trim: true },
    descripcion:        { type: String,  default: "", trim: true },
    aula:               { type: String,  required: true, trim: true },
    es_obligatoria:     { type: Boolean, default: true },
    personal_asignado:  { type: String,  required: true, trim: true },
  },
  { _id: false }
);

/* ---------- Documento principal ---------- */
const GradoSchema = new Schema(
  {
    grado:       { type: String, required: true, trim: true },
    descripcion: { type: String, default: "", trim: true },

    horarios_grado: { type: [HorarioGradoSchema], default: [] },
    materias_grado: { type: [MateriaPlanSchema],  default: [] },

    aula:           { type: String, required: true, trim: true },
    estado:         { type: String, default: "Activo", enum: ["Activo","Inactivo"] },
    anio_academico: { type: Number, required: true, min: 1900 },

    fecha_actualizacion: { type: Date, required: true },
    timestamp:           { type: Date, required: true },

    // ── Auditoría (igual que Bien.js / biblioteca.js) ──────────
    creado_por:            { type: String, default: null }, // ID del usuario que creó
    creado_por_email:      { type: String, default: null }, // Email del usuario que creó
    fecha_creacion:        { type: Date,   default: Date.now },

    actualizado_por:       { type: String, default: null }, // ID del usuario que actualizó
    actualizado_por_email: { type: String, default: null }, // Email del usuario que actualizó
    fecha_actualizacion_audit: { type: Date, default: null }, // separado de fecha_actualizacion del negocio

    eliminado_por:         { type: String, default: null },
    eliminado_por_email:   { type: String, default: null },
    fecha_eliminacion:     { type: Date,   default: null },
  },
  { timestamps: true, collection: "grados" }
);

/* ---------- Índices ---------- */
GradoSchema.index({ grado: 1, anio_academico: 1 }, { unique: true, name: "uniq_grado_anio" });
GradoSchema.index({ estado: 1, anio_academico: 1 });

/* ---------- Validación de horarios ---------- */
GradoSchema.pre("save", function (next) {
  for (const h of this.horarios_grado || []) {
    if (h.hora_inicio && h.hora_fin && h.hora_inicio >= h.hora_fin) {
      return next(new Error(`En horario ${h.id_horario}, hora_inicio debe ser menor que hora_fin`));
    }
  }
  next();
});

module.exports = model("grados", GradoSchema);