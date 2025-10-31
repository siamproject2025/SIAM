const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/uploadImage'); // Multer en memoria

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
router.post('/', upload.single('imagen'), crearPersonal);
router.put('/:id', upload.single('imagen'), actualizarPersonal);
router.delete('/:id', eliminarPersonal);

// Rutas de búsqueda específicas
router.get('/estado/:estado', buscarPorEstado);
router.get('/cargo/:cargo', buscarPorCargo);

module.exports = router;