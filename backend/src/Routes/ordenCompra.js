const express = require("express");
const router = express.Router();
const controller = require('../Controllers/ordenCompra');
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
  controller.createOrden
);

router.get("/", controller.getOrdenes);

router.put("/:id", 
  uploadAdjuntos, 
  manejarErroresMulter, 
  procesarAdjuntos, 
  capturarDatosPrevios(Orden), 
  registrarAuditoria('ORDENES_COMPRA'), 
  controller.updateOrden
);

router.post("/:id/adjuntos", 
  uploadAdjuntos, 
  manejarErroresMulter, 
  procesarAdjuntos, 
  registrarAuditoria('ORDENES_COMPRA'), 
  controller.agregarAdjuntos
);

router.delete("/:id/adjuntos/:adjuntoIndex", 
  capturarDatosPrevios(Orden), 
  registrarAuditoria('ORDENES_COMPRA'), 
  controller.eliminarAdjunto
);

router.delete("/:id", 
  capturarDatosPrevios(Orden), 
  registrarAuditoria('ORDENES_COMPRA'), 
  controller.deleteOrden
);

module.exports = router;