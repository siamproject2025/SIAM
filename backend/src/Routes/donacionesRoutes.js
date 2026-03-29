// routes/donacionesRoutes.js
const express = require('express');
const router  = express.Router();
const multer  = require('multer');

const donacionesController = require('../Controllers/donacionesController');
const { authenticateUser }  = require('../middleware/authMiddleWare');
const { capturarDatosPrevios, registrarAuditoria } = require('../middleware/auditoriaMiddleware');
const Donacion = require('../Models/donacionesModel');

const upload = multer({ storage: multer.memoryStorage() });
const uploadFields = upload.fields([
  { name: 'imagen',    maxCount: 1 },
  { name: 'documento', maxCount: 1 },
]);

router.use(authenticateUser);

// GET — sin auditoría
router.get('/',                          donacionesController.getAllDonaciones);
router.get('/estadisticas/resumen',      donacionesController.getEstadisticasDonaciones);
router.get('/almacen/:id_almacen',       donacionesController.getDonacionesByAlmacen);
router.get('/tipo/:tipo',                donacionesController.getDonacionesByTipo);
router.get('/:id',                       donacionesController.getDonacionById);

// POST — crear
router.post(
  '/',
  uploadFields,
  registrarAuditoria('DONACIONES'),
  donacionesController.createDonacion
);

// PUT — actualizar (ID numérico en id_donacion)
router.put(
  '/:id',
  uploadFields,
  capturarDatosPrevios(Donacion, 'id_donacion'),   // ← busca por campo id_donacion, no _id
  registrarAuditoria('DONACIONES'),
  donacionesController.updateDonacion
);

// PATCH — anular
router.patch(
  '/:id/anular',
  capturarDatosPrevios(Donacion, 'id_donacion'),
  registrarAuditoria('DONACIONES'),
  donacionesController.anularDonacion
);

// DELETE
router.delete(
  '/:id',
  capturarDatosPrevios(Donacion, 'id_donacion'),
  registrarAuditoria('DONACIONES'),
  donacionesController.deleteDonacion
);

module.exports = router;