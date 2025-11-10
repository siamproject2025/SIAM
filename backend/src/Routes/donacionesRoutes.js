// routes/donacionesRoutes.js
const express = require('express');
const router = express.Router();
const donacionesController = require('../Controllers/donacionesController');
const { upload } = require('../middleware/uploadImage'); // Multer en memoria
const { authenticateUser } = require('../middleware/authMiddleWare');


router.use(authenticateUser);
// Rutas básicas CRUD
router.get('/', donacionesController.getAllDonaciones);
router.get('/:id', donacionesController.getDonacionById);

// Crear donación con imagen
router.post('/', upload.single('imagen'), donacionesController.createDonacion);

// Actualizar donación con posibilidad de nueva imagen
router.put('/:id', upload.single('imagen'), donacionesController.updateDonacion);

router.delete('/:id', donacionesController.deleteDonacion);

// Rutas adicionales
router.get('/almacen/:id_almacen', donacionesController.getDonacionesByAlmacen);
router.get('/tipo/:tipo', donacionesController.getDonacionesByTipo);
router.get('/estadisticas/resumen', donacionesController.getEstadisticasDonaciones);

module.exports = router;
