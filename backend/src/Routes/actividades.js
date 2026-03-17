
const express = require("express");
const router = express.Router();
const { authenticateUser } = require('../middleware/authMiddleWare');
const { registrarAuditoria, capturarDatosPrevios } = require('../middleware/auditoriaMiddleware');
const Modelo = require("../Models/Actividad"); // Importar modelo para capturar datos previos
const { checkPermission } = require('../middleware/checkPermission');
const {
  crearActividad,
  obtenerActividades,
  actualizarActividad,
  eliminarActividad,
} = require("../Controllers/actividadesController");

router.post("/", authenticateUser,checkPermission('CREAR_ACTIVIDADES'),registrarAuditoria('ACTIVIDADES'), crearActividad);
router.get("/", authenticateUser, obtenerActividades);
router.put("/:id", authenticateUser,checkPermission('ACTUALIZAR_ACTIVIDADES'), capturarDatosPrevios(Modelo), registrarAuditoria('ACTIVIDADES'),
actualizarActividad); // actualizar
router.delete("/:id", authenticateUser,checkPermission('ELIMINAR_ACTIVIDADES'), capturarDatosPrevios(Modelo), registrarAuditoria('ACTIVIDADES'),
eliminarActividad); // eliminar

module.exports = router;
