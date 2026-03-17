const express = require("express");
const { authenticateUser } = require('../middleware/authMiddleWare');
const { registrarAuditoria, capturarDatosPrevios } = require('../middleware/auditoriaMiddleware');
const Modelo = require("../Models/Horario"); // Importar modelo para capturar datos previos
const { checkPermission } = require('../middleware/checkPermission');
const router = express.Router();

router.use(authenticateUser);
const {
  crearHorario,
  obtenerHorarios,
  obtenerHorario,
  actualizarHorario,
  eliminarHorario,
} = require("../Controllers/horariosController");

router.get("/", obtenerHorarios);
router.get("/:id", obtenerHorario);
router.post("/",checkPermission('CREAR_HORARIOS'),  registrarAuditoria('HORARIOS'), crearHorario);
router.put("/:id",checkPermission('ACTUALIZAR_HORARIOS'),capturarDatosPrevios(Modelo), registrarAuditoria('HORARIOS'),actualizarHorario);
router.delete("/:id",checkPermission('ELIMINAR_HORARIOS'), capturarDatosPrevios(Modelo), registrarAuditoria('HORARIOS'),eliminarHorario);

module.exports = router;
