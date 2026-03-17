const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authMiddleWare');
const { registrarAuditoria, capturarDatosPrevios } = require('../middleware/auditoriaMiddleware');
const Proveedor = require("../Models/proveedorModel"); // Importar modelo para capturar datos previos
const {
  obtenerProveedores,
  obtenerProveedorPorId,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor,
  buscarPorEstado,
  buscarPorTipo,
  buscarPorCalificacion
} = require('../Controllers/proveedoresController');

// Middleware para medir tiempo de respuesta (opcional pero útil para auditoría)
router.use((req, res, next) => {
  req.requestStartTime = Date.now();
  next();
});

router.use(authenticateUser);
// Rutas básicas CRUD
router.get('/',  obtenerProveedores);
router.get('/:id', obtenerProveedorPorId);
router.post('/',  registrarAuditoria('PROVEEDORES'), crearProveedor);
router.put('/:id',capturarDatosPrevios(Proveedor), registrarAuditoria('PROVEEDORES'),  actualizarProveedor);
router.delete('/:id',capturarDatosPrevios(Proveedor), registrarAuditoria('PROVEEDORES'),  eliminarProveedor);

// Rutas de búsqueda específicas
router.get('/estado/:estado', buscarPorEstado);
router.get('/tipo/:tipo', buscarPorTipo);
router.get('/calificacion/:calificacion', buscarPorCalificacion);

// Exportación corregida
module.exports = router;
