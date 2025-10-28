const express = require('express');
const router = express.Router();
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

// Rutas básicas CRUD
router.get('/', obtenerProveedores);
router.get('/:id', obtenerProveedorPorId);
router.post('/', crearProveedor);
router.put('/:id', actualizarProveedor);
router.delete('/:id', eliminarProveedor);

// Rutas de búsqueda específicas
router.get('/estado/:estado', buscarPorEstado);
router.get('/tipo/:tipo', buscarPorTipo);
router.get('/calificacion/:calificacion', buscarPorCalificacion);

// Exportación corregida
module.exports = router;
