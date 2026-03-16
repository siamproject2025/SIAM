const express = require("express");
const { authenticateUser } = require('../middleware/authMiddleWare');
const { registrarAuditoria, capturarDatosPrevios } = require('../middleware/auditoriaMiddleware');
const Modelo = require("../Models/Horario"); // Importar modelo para capturar datos previos

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
router.post("/",  registrarAuditoria('HORARIOS'), crearHorario);
router.put("/:id",capturarDatosPrevios(Modelo), registrarAuditoria('HORARIOS'),actualizarHorario);
router.delete("/:id", capturarDatosPrevios(Modelo), registrarAuditoria('HORARIOS'),eliminarHorario);

module.exports = router;
