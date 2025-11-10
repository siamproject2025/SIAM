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

router.use(authenticateUser);
// Rutas básicas CRUD
router.get('/', obtenerPersonal);
router.get('/:id', obtenerPersonalPorId);
router.post('/', upload.single('imagen'), crearPersonal);
router.put('/:id',  upload.single('imagen'), actualizarPersonal);
router.delete('/:id',  eliminarPersonal);

// Rutas de búsqueda específicas
router.get('/estado/:estado', authenticateUser, buscarPorEstado);
router.get('/cargo/:cargo', authenticateUser, buscarPorCargo);

module.exports = router;