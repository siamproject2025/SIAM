// routes/donacionesRoutes.js
const express = require('express');
const router = express.Router();
const donacionesController = require('../Controllers/donacionesController');

// Rutas básicas CRUD
router.get('/', donacionesController.getAllDonaciones);
router.get('/:id', donacionesController.getDonacionById);
router.post('/', donacionesController.createDonacion);
router.put('/:id', donacionesController.updateDonacion);
router.delete('/:id', donacionesController.deleteDonacion);

// Rutas adicionales
router.get('/almacen/:id_almacen', donacionesController.getDonacionesByAlmacen);
router.get('/tipo/:tipo', donacionesController.getDonacionesByTipo);
router.get('/estadisticas/resumen', donacionesController.getEstadisticasDonaciones);

module.exports = router;
