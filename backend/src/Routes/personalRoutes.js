const express = require('express');
const router = express.Router();
const {
  obtenerPersonal,
  obtenerPersonalPorId,
  crearPersonal,
  actualizarPersonal,
  eliminarPersonal,
  buscarPorEstado,
  buscarPorCargo
} = require('../Controllers/personalController');

// Rutas básicas CRUD
router.get('/', obtenerPersonal);
router.get('/:id', obtenerPersonalPorId);
router.post('/', crearPersonal);
router.put('/:id', actualizarPersonal);
router.delete('/:id', eliminarPersonal);

// Rutas de búsqueda específicas
router.get('/estado/:estado', buscarPorEstado);
router.get('/cargo/:cargo', buscarPorCargo);

module.exports = router;