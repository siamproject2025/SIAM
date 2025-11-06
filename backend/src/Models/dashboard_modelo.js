// backend/src/Models/dashboard_modelo.js
const { Schema, model } = require("mongoose");

const ROLES_VALIDOS = ["ADMIN", "DOCENTE", "PADRE"];

const DashboardModuloSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },       // ej: "grados"
    titulo: { type: String, required: true, trim: true },                   // ej: "Grados"
    link: { type: String, required: true, trim: true },                     // ej: "/grados"
    icon: { type: String, default: "FiFile", trim: true },                  // ej: "FiLayers"
    roles: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0 && arr.every(r => ROLES_VALIDOS.includes(String(r).toUpperCase())),
        message: `roles debe contener al menos uno de: ${ROLES_VALIDOS.join(", ")}`
      }
    },
    activo: { type: Boolean, default: true },
    orden: { type: Number, default: 1, min: 0 },
  },
  {
    timestamps: true,
    collection: "dashboard_modulos",
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

/* ---------- Índices ---------- */
DashboardModuloSchema.index({ key: 1 }, { unique: true });
DashboardModuloSchema.index({ activo: 1, orden: 1 });

/* ---------- Normalizaciones/consistencias ---------- */
DashboardModuloSchema.pre("save", function (next) {
  // roles a MAYÚSCULAS y únicos
  this.roles = (this.roles || [])
    .map(r => String(r).toUpperCase())
    .filter((v, i, a) => a.indexOf(v) === i);

  // Asegura que el link empiece con "/"
  if (this.link && !this.link.startsWith("/")) this.link = `/${this.link}`;

  next();
});

/* ---------- Métodos/estáticos útiles ---------- */
DashboardModuloSchema.statics.visibleParaRoles = function (roles = []) {
  const up = (roles || []).map(r => String(r).toUpperCase());
  return this.find({ activo: true, roles: { $in: up } }).sort({ orden: 1, titulo: 1 });
};

DashboardModuloSchema.statics.seedIfEmpty = async function () {
  const count = await this.estimatedDocumentCount();
  if (count > 0) return false;
  await this.create({
    key: "grados",
    titulo: "Grados",
    link: "/grados",
    icon: "FiLayers",
    roles: ["ADMIN", "DOCENTE", "PADRE"],
    activo: true,
    orden: 1,
  });
  return true;
};

module.exports = model("Modulo", DashboardModuloSchema);

