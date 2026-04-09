// ============================================================
// Controllers/parametrosController.js
//
// GET  /api/parametros        — leer configuración global
// PUT  /api/parametros        — guardar/actualizar configuración
//
// Patrón singleton: upsert con _id = "global".
// Si no existe aún en BD, el GET devuelve los DEFAULTS del
// frontend (no falla). El PUT crea o sobreescribe el doc.
// ============================================================
const Parametros = require("../Models/Parametros.model");

// ── Valores por defecto (espejo de DEFAULTS del frontend) ───
const DEFAULTS = {
  _id:                 "global",
  nombre_institucion:  "Escuela Experimental de Niños para la Música",
  siglas:              "S.I.A.M.",
  slogan:              "Sistema Integrado Administrativo Musical",
  descripcion_hero:    "Plataforma digital para la gestión académica, administrativa y operativa de escuelas de música",
  directora:           "Lic. Rosario de Fátima Mejía Aguilar",
  cargo_directora:     "Directora, Escuela Experimental de Niños para la Música",
  testimonio:          "Sistema que mejora la eficiencia y la calidad del servicio educativo musical.",
  telefono:            "+504 8797-1675",
  correo:              "esc.experimentalmusica@gmail.com",
  direccion:           "Colonia Hato de Enmedio, sector 2 Contiguo a la Iglesia de los Santos de los Últimos Días, Tegucigalpa, Honduras",
  ciudad:              "Tegucigalda, Honduras",
  desarrollado_por:    "Estudiantes de Informática Administrativa, UNAH",
  mapa_embed_url:      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3931.562882243273!2d-87.1767392!3d14.0727637!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8f6fbcd070775acd%3A0x30d484aaca34d4cf!2sEscuela%20Experimental%20De%20Ni%C3%B1os%20Para%20La%20M%C3%BAsica!5e0!3m2!1ses!2shn!4v1699999999999",
  color_primario:      "#6C4FBF",
  color_secundario:    "#9B59B6",
  stat_eficiencia:     "70",
  stat_reduccion:      "100",
  stat_acceso:         "24",
  stat_estudiantes:    "500",
  faq: [
    { question: "¿Qué es S.I.A.M.?",                    answer: "S.I.A.M. es un Sistema Integrado Administrativo Musical diseñado para optimizar y automatizar los procesos clave de instituciones musicales, desde la matrícula hasta el control de inventario." },
    { question: "¿Qué problemas resuelve S.I.A.M.?",    answer: "Resuelve problemas como procesos manuales de matrícula, desorganización en horarios, control limitado de inventario, falta de trazabilidad en compras y comunicación institucional dispersa." },
    { question: "¿Qué tecnologías utiliza S.I.A.M.?",   answer: "Utiliza React y JavaScript en el frontend, Express.js en el backend, MongoDB como base de datos y APIs privadas seguras para integración." },
    { question: "¿Cómo mejora la eficiencia institucional?", answer: "Aumenta en más del 70% la eficiencia en tareas administrativas, reduce errores en procesos críticos y proporciona acceso centralizado a información 24/7." },
    { question: "¿Quién puede utilizar S.I.A.M.?",      answer: "Está diseñado para escuelas de música, conservatorios y cualquier institución educativa musical que necesite gestionar sus procesos administrativos y académicos." },
  ],
};

// ── GET /api/parametros ──────────────────────────────────────
exports.obtenerParametros = async (req, res) => {
  try {
    const doc = await Parametros.findById("global").lean();

    // Si aún no existe en BD, devolver los defaults sin error
    if (!doc) return res.status(200).json(DEFAULTS);

    // Fusionar con defaults para que campos nuevos siempre existan
    res.status(200).json({ ...DEFAULTS, ...doc });

  } catch (err) {
    console.error("Error al obtener parámetros:", err);
    res.status(500).json({ error: err.message });
  }
};

// ── PUT /api/parametros ──────────────────────────────────────
exports.actualizarParametros = async (req, res) => {
  try {
    const payload = { ...req.body };

    // Asegurar que el _id singleton no se cambie desde el body
    delete payload._id;

    // Validaciones básicas
    if (payload.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.correo)) {
      return res.status(400).json({ error: "Formato de correo inválido" });
    }
    if (payload.color_primario && !/^#[0-9A-Fa-f]{6}$/.test(payload.color_primario)) {
      return res.status(400).json({ error: "color_primario debe ser un hex válido (#RRGGBB)" });
    }
    if (payload.color_secundario && !/^#[0-9A-Fa-f]{6}$/.test(payload.color_secundario)) {
      return res.status(400).json({ error: "color_secundario debe ser un hex válido (#RRGGBB)" });
    }

    // Upsert: crea el doc si no existe, actualiza si existe
    const doc = await Parametros.findOneAndUpdate(
      { _id: "global" },
      { $set: { ...payload, updatedAt: new Date() } },
      {
        upsert:         true,   // crear si no existe
        new:            true,   // devolver el doc actualizado
        runValidators:  true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    res.status(200).json({ ...DEFAULTS, ...doc });

  } catch (err) {
    console.error("Error al guardar parámetros:", err);
    res.status(500).json({ error: err.message });
  }
};