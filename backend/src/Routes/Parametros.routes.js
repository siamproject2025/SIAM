// ============================================================
// Routes/parametros.js
//
// GET  /api/parametros   — público (landing lo consume sin login)
// PUT  /api/parametros   — solo ADMIN autenticado
// ============================================================
const express = require("express");
const router  = express.Router();
const ctrl    = require("../Controllers/Parametroscontroller");
const { authenticateUser } = require("../middleware/authMiddleWare");
const { checkPermission }  = require("../middleware/checkPermission");
const { registrarAuditoria } = require("../middleware/auditoriaMiddleware");

// ── GET: público — la landing lo llama sin token ─────────────
router.get("/", ctrl.obtenerParametros);

// ── PUT: solo admin autenticado con permiso ──────────────────
router.put("/",
  authenticateUser,
  checkPermission("ACTUALIZAR_PAGINA_PRINCIPAL","VISUALIZAR_PAGINA_PRINCIPAL"),   // crea este permiso en tu BD de roles
  registrarAuditoria("PARAMETROS"),
  ctrl.actualizarParametros
);

module.exports = router;