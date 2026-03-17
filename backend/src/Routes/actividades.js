
const express = require("express");
const router = express.Router();
const { authenticateUser } = require('../middleware/authMiddleWare');
const { registrarAuditoria, capturarDatosPrevios } = require('../middleware/auditoriaMiddleware');
const Modelo = require("../Models/Actividad"); // Importar modelo para capturar datos previos

const {
  crearActividad,
  obtenerActividades,
  actualizarActividad,
  eliminarActividad,
} = require("../Controllers/actividadesController");

router.post("/", authenticateUser,registrarAuditoria('ACTIVIDADES'), crearActividad);
router.get("/", authenticateUser, obtenerActividades);
router.put("/:id", authenticateUser, capturarDatosPrevios(Modelo), registrarAuditoria('ACTIVIDADES'),
actualizarActividad); // actualizar
router.delete("/:id", authenticateUser, capturarDatosPrevios(Modelo), registrarAuditoria('ACTIVIDADES'),
eliminarActividad); // eliminar

module.exports = router;
