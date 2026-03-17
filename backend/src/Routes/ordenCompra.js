const express = require("express");
const router = express.Router();
const ordenController = require("../Controllers/ordenCompra");
const { authenticateUser } = require('../middleware/authMiddleWare');
const { registrarAuditoria, capturarDatosPrevios } = require('../middleware/auditoriaMiddleware');
const Orden = require("../Models/ordenCompra"); // Importar modelo para capturar datos previos




router.use(authenticateUser);
router.post("/", registrarAuditoria('ORDENES_COMPRA'),ordenController.crearOrden);
router.get("/",ordenController.obtenerOrdenes);
router.put("/:id",capturarDatosPrevios(Orden), registrarAuditoria('ORDENES_COMPRA'), ordenController.actualizarOrden);
router.delete("/:id",capturarDatosPrevios(Orden), registrarAuditoria('ORDENES_COMPRA'), ordenController.eliminarOrden);
module.exports = router;