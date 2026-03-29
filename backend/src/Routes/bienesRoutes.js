// routes/bienesRoutes.js
const express = require('express');
const { upload } = require('../middleware/uploadImage');
const { authenticateUser } = require('../middleware/authMiddleWare');
const { registrarAuditoria, capturarDatosPrevios } = require('../middleware/auditoriaMiddleware');
const Bien = require('../Models/Bien');

const { getBienes, getBienById, createBien, updateBien, deleteBien } =
  require('../Controllers/bienesController');

const router = express.Router();

router.use(authenticateUser);

// GET — sin auditoría (lecturas, no críticas)
router.get('/', getBienes);
router.get('/:id', getBienById);

// POST — crear bien
router.post(
  '/',
  upload.single('imagen'),
  registrarAuditoria('BIENES'),
  createBien
);

// PUT — actualizar bien (captura datos previos ANTES de modificar)
router.put(
  '/:id',
  upload.single('imagen'),
  capturarDatosPrevios(Bien),   // ← pasa el modelo Mongoose directamente
  registrarAuditoria('BIENES'),
  updateBien
);

// DELETE — eliminar bien
router.delete(
  '/:id',
  capturarDatosPrevios(Bien),
  registrarAuditoria('BIENES'),
  deleteBien
);

module.exports = router;