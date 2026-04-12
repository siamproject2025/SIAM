// routes/catalogoRoutes.js
// Define todas las rutas del módulo de catálogos/mantenimientos.

const express = require("express");
const router  = express.Router();
const ctrl    = require("../Controllers/catalogoController");

// ── Utilidades ───────────────────────────────────────────────
// GET  /api/catalogos/estructura   → mapa módulos→tipos
router.get("/estructura", ctrl.getEstructura);

// ── Consultas ────────────────────────────────────────────────
// GET  /api/catalogos              → todos (filtros via ?modulo= &tipo= &activo=)
router.get("/", ctrl.getAll);

// GET  /api/catalogos/id/:id       → un ítem por ID
router.get("/id/:id", ctrl.getById);

// GET  /api/catalogos/:modulo      → todos los ítems del módulo, agrupados por tipo
router.get("/:modulo", ctrl.getByModulo);

// GET  /api/catalogos/:modulo/:tipo → lista plana de valores para módulo+tipo
router.get("/:modulo/:tipo", ctrl.getByModuloTipo);

// ── Escritura ────────────────────────────────────────────────
// POST   /api/catalogos            → crear ítem
router.post("/", ctrl.create);

// PUT    /api/catalogos/:id        → actualizar ítem
router.put("/:id", ctrl.update);

// PATCH  /api/catalogos/:id/toggle → activar/desactivar
router.patch("/:id/toggle", ctrl.toggle);

// DELETE /api/catalogos/:id                           → eliminar un ítem
router.delete("/:id", ctrl.remove);

// DELETE /api/catalogos/modulo/:modulo/tipo/:tipo     → eliminar todos de módulo+tipo
router.delete("/modulo/:modulo/tipo/:tipo", ctrl.removeByModuloTipo);

module.exports = router;