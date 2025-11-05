const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/uploadImage'); // Multer en memoria
const { authenticateUser } = require('../middleware/authMiddleWare');
const { checkRole } = require('../middleware/checkRole');

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
router.get('/', authenticateUser, obtenerPersonal);
router.get('/:id', authenticateUser, obtenerPersonalPorId);
router.post('/', authenticateUser, upload.single('imagen'), crearPersonal);
router.put('/:id', authenticateUser, upload.single('imagen'), actualizarPersonal);
router.delete('/:id', authenticateUser, eliminarPersonal);

// Rutas de búsqueda específicas
router.get('/estado/:estado', authenticateUser, buscarPorEstado);
router.get('/cargo/:cargo', authenticateUser, buscarPorCargo);

module.exports = router;