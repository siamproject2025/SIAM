// backend/src/routes/gradosRoutes.js
console.log("✅ Cargando router: gradosRoutes");

const { Router } = require("express");
const ctrl = require("../Controllers/gradosController");
const router = Router();

/* ---- Rutas específicas primero ---- */
router.get("/ping", (req, res) => {
  return res.json({ ok: true, ruta: "/api/grados/ping", ts: new Date().toISOString() });
});

router.post("/", ctrl.crearGrado);
router.get("/", ctrl.listarGrados);

/* ---- rutas finales con ID ---- */
router.get("/:id", ctrl.obtenerGrado);
router.put("/:id", ctrl.actualizarGrado);
router.delete("/:id", ctrl.eliminarGrado);
router.patch("/:id/restaurar", ctrl.restaurarGrado);

module.exports = router;