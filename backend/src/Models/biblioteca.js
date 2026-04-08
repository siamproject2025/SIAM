// ============================================================
// Models/biblioteca.js
//
// CAMBIOS vs versión anterior:
// FIX #1 ALTO  — Campos APA: autor_corporativo, anio_publicacion,
//               ciudad, editorial, edicion, isbn
// FIX #3 MEDIO — sin cambio en el modelo (la edición se maneja
//               en el controller con PUT)
// AUDITORÍA    — Campos de auditoría idénticos a Bien.js:
//               creado_por, creado_por_email, fecha_creacion,
//               actualizado_por, actualizado_por_email, fecha_actualizacion,
//               eliminado_por, eliminado_por_email, fecha_eliminacion
// ============================================================
const mongoose = require("mongoose");

const LibroSchema = new mongoose.Schema({
    // ── Campos originales ─────────────────────────────────────
    titulo:        { type: String, required: true, trim: true },
    autor:         { type: String, required: true, trim: true },
    grado:         { type: String, required: true, trim: true },
    clase:         { type: String, required: true, trim: true },
    observacion:   { type: String, trim: true },
    categoria:     { type: String },
    disponible:    { type: Boolean, default: true },
    archivoUrl:    { type: String, required: true },
    nombreArchivo: { type: String, required: true },
    extension:     { type: String },
    fechaCreacion: { type: Date, default: Date.now },

    // ── FIX #1: Campos de referencia APA ─────────────────────
    autor_corporativo:  { type: String, trim: true },
    anio_publicacion:   { type: Number, min: 1800, max: 2100 },
    ciudad:             { type: String, trim: true },
    editorial:          { type: String, trim: true },
    edicion:            { type: String, trim: true },
    isbn:               { type: String, trim: true },

    // ── Campos de auditoría (igual que Bien.js) ───────────────
    creado_por:           { type: String, default: null }, // ID del usuario que creó
    creado_por_email:     { type: String, default: null }, // Email del usuario que creó
    fecha_creacion:       { type: Date,   default: Date.now },

    actualizado_por:      { type: String, default: null }, // ID del usuario que actualizó
    actualizado_por_email:{ type: String, default: null }, // Email del usuario que actualizó
    fecha_actualizacion:  { type: Date,   default: null },

    eliminado_por:        { type: String, default: null }, // ID del usuario que eliminó
    eliminado_por_email:  { type: String, default: null }, // Email del usuario que eliminó
    fecha_eliminacion:    { type: Date,   default: null },
}, {
    collection: "libros",
    timestamps: true, // añade createdAt y updatedAt automáticamente
});

// ── Índices para filtros avanzados — FIX #2 ──────────────────
LibroSchema.index({ grado:     1 });
LibroSchema.index({ clase:     1 });
LibroSchema.index({ autor:     1 });
LibroSchema.index({ editorial: 1 });

const Libro = mongoose.model("Libro", LibroSchema, "libros");
module.exports = Libro;