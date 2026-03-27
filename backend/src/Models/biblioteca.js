// ============================================================
// Models/biblioteca.js
//
// CAMBIOS vs versión anterior:
// FIX #1 ALTO — Campos APA: autor_corporativo, anio_publicacion,
//               ciudad, editorial, edicion, isbn
// FIX #3 MEDIO — sin cambio en el modelo (la edición se maneja
//               en el controller con PUT)
// ============================================================
const mongoose = require("mongoose");

const LibroSchema = new mongoose.Schema({
    // Campos originales
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
    // Autor corporativo (institución u organismo como autor)
    autor_corporativo:  { type: String, trim: true },
    // Año de publicación de la obra (no confundir con fechaCreacion)
    anio_publicacion:   { type: Number, min: 1800, max: 2100 },
    // Ciudad de publicación
    ciudad:             { type: String, trim: true },
    // Editorial
    editorial:          { type: String, trim: true },
    // Número de edición
    edicion:            { type: String, trim: true },
    // ISBN o ISSN
    isbn:               { type: String, trim: true },
});

// Índices para los nuevos filtros avanzados — FIX #2
LibroSchema.index({ grado:     1 });
LibroSchema.index({ clase:     1 });
LibroSchema.index({ autor:     1 });
LibroSchema.index({ editorial: 1 });

const Libro = mongoose.model("Libro", LibroSchema, "libros");
module.exports = Libro;