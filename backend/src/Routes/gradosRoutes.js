// backend/src/routes/gradosRoutes.js
const { authenticateUser } = require('../middleware/authMiddleWare');
const { registrarAuditoria, capturarDatosPrevios } = require('../middleware/auditoriaMiddleware');
const Modelo = require("../Models/Grado"); // Importar modelo para capturar datos previos
const { checkPermission } = require('../middleware/checkPermission');

const { Router } = require("express");
const ctrl = require("../Controllers/gradosController");
const router = Router();

/* ---- Rutas específicas primero ---- */
router.get("/ping", (req, res) => {
  return res.json({ ok: true, ruta: "/api/grados/ping", ts: new Date().toISOString() });
});

router.use(authenticateUser);
router.post("/",checkPermission('CREAR_GRADOS'), registrarAuditoria('GRADOS'), ctrl.crearGrado);
router.get("/", ctrl.listarGrados);

/* ---- rutas finales con ID ---- */
router.get("/:id", ctrl.obtenerGrado);
router.put("/:id",checkPermission('ACTUALIZAR_GRADOS'), capturarDatosPrevios(Modelo), registrarAuditoria('GRADOS'), ctrl.actualizarGrado);
router.delete("/:id",checkPermission('ELIMINAR_GRADOS'),capturarDatosPrevios(Modelo), registrarAuditoria('GRADOS'), ctrl.eliminarGrado);
router.patch("/:id/restaurar", ctrl.restaurarGrado);

module.exports = router;