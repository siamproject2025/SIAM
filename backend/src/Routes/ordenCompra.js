const express = require("express");
const router = express.Router();
const ordenController = require("../Controllers/ordenCompra");
const { authenticateUser } = require('../middleware/authMiddleWare');
const { registrarAuditoria, capturarDatosPrevios } = require('../middleware/auditoriaMiddleware');
const Orden = require("../Models/ordenCompra");
const { uploadAdjuntos, procesarAdjuntos, manejarErroresMulter } = require('../middleware/uploadAdjuntosOrden');

router.use(authenticateUser);

// Middleware para manejar errores de multer en esta ruta
router.post("/", 
  uploadAdjuntos, 
  manejarErroresMulter, 
  procesarAdjuntos, 
  registrarAuditoria('ORDENES_COMPRA'), 
  ordenController.crearOrden
);

router.get("/", ordenController.obtenerOrdenes);

router.put("/:id", 
  uploadAdjuntos, 
  manejarErroresMulter, 
  procesarAdjuntos, 
  capturarDatosPrevios(Orden), 
  registrarAuditoria('ORDENES_COMPRA'), 
  ordenController.actualizarOrden
);

router.post("/:id/adjuntos", 
  uploadAdjuntos, 
  manejarErroresMulter, 
  procesarAdjuntos, 
  registrarAuditoria('ORDENES_COMPRA'), 
  ordenController.agregarAdjuntos
);

router.delete("/:id/adjuntos/:adjuntoIndex", 
  capturarDatosPrevios(Orden), 
  registrarAuditoria('ORDENES_COMPRA'), 
  ordenController.eliminarAdjunto
);

router.delete("/:id", 
  capturarDatosPrevios(Orden), 
  registrarAuditoria('ORDENES_COMPRA'), 
  ordenController.eliminarOrden
);

module.exports = router;