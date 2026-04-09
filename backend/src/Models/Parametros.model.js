// ============================================================
// Models/parametros.js
// Documento singleton — solo existe uno en toda la colección.
// Se usa upsert con _id fijo para garantizarlo.
// ============================================================
const mongoose = require("mongoose");

const FaqItemSchema = new mongoose.Schema({
  question: { type: String, trim: true },
  answer:   { type: String, trim: true },
}, { _id: false });

const ParametrosSchema = new mongoose.Schema({
  // _id fijo para garantizar singleton
  _id: { type: String, default: "global" },

  // ── Institución ──────────────────────────────────────────
  nombre_institucion: { type: String, trim: true },
  siglas:             { type: String, trim: true },
  slogan:             { type: String, trim: true },
  descripcion_hero:   { type: String, trim: true },

  // ── Dirección / autoridad ────────────────────────────────
  directora:          { type: String, trim: true },
  cargo_directora:    { type: String, trim: true },
  testimonio:         { type: String, trim: true },
  desarrollado_por:   { type: String, trim: true },

  // ── Contacto ─────────────────────────────────────────────
  telefono:           { type: String, trim: true },
  correo:             { type: String, trim: true },
  direccion:          { type: String, trim: true },
  ciudad:             { type: String, trim: true },
  mapa_embed_url:     { type: String, trim: true },

  // ── Colores ───────────────────────────────────────────────
  color_primario:     { type: String, trim: true },
  color_secundario:   { type: String, trim: true },

  // ── Estadísticas ─────────────────────────────────────────
  stat_eficiencia:    { type: String },
  stat_reduccion:     { type: String },
  stat_acceso:        { type: String },
  stat_estudiantes:   { type: String },

  // ── FAQ ───────────────────────────────────────────────────
  faq: { type: [FaqItemSchema], default: [] },

  // ── Auditoría ─────────────────────────────────────────────
  updatedAt: { type: Date, default: Date.now },
}, {
  // No auto-generar _id; usamos el string "global"
  _id: false,
  versionKey: false,
});

// Actualizar updatedAt antes de cada save/update
ParametrosSchema.pre("findOneAndUpdate", function () {
  this.set({ updatedAt: new Date() });
});

const Parametros = mongoose.model("Parametros", ParametrosSchema, "parametros");
module.exports = Parametros;