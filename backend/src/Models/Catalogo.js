// models/Catalogo.js
// Modelo genérico para todos los catálogos/mantenimientos del sistema.
// Un solo modelo maneja: Matrícula, Personal, Donaciones, Bienes, Directiva y Horarios.

const mongoose = require("mongoose");

const CatalogoSchema = new mongoose.Schema(
  {
    // ── Identificación ──────────────────────────────────────────
    modulo: {
      type: String,
      required: [true, "El módulo es obligatorio"],
      enum: ["matricula", "personal", "donaciones", "bienes", "directiva", "horarios"],
      trim: true,
    },

    // Subtipo dentro del módulo, p.ej. "parentesco_encargado", "tipo_contrato", etc.
    tipo: {
      type: String,
      required: [true, "El tipo es obligatorio"],
      trim: true,
    },

    // El valor del catálogo, p.ej. "Tutor Legal", "TIEMPO_COMPLETO", "Matemáticas"
    valor: {
      type: String,
      required: [true, "El valor es obligatorio"],
      trim: true,
    },

    // Etiqueta legible (opcional). Si no se da, se usa 'valor'.
    etiqueta: {
      type: String,
      trim: true,
      default: "",
    },

    // Descripción o notas adicionales
    descripcion: {
      type: String,
      trim: true,
      default: "",
    },

    // Para ordenar los ítems en el frontend
    orden: {
      type: Number,
      default: 0,
    },

    // Soft-delete / activación
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Índice único: no pueden existir dos registros con mismo modulo+tipo+valor
CatalogoSchema.index({ modulo: 1, tipo: 1, valor: 1 }, { unique: true });

// ── Mapa de módulos → tipos permitidos ─────────────────────────
// Útil para validación y para poblar el frontend sin hardcode.
CatalogoSchema.statics.TIPOS_POR_MODULO = {
  matricula:   ["parentesco_encargado", "tipo"],
  personal:    ["tipo_contrato", "area_trabajo", "cargo", "horario_preferido"],
  donaciones:  ["tipo_donacion", "id_almacen"],
  bienes:      ["categoria", "tipo_asignacion"],
  directiva:   ["cargo"],
  horarios:    ["asignatura"],
};

module.exports = mongoose.model("Catalogo", CatalogoSchema);