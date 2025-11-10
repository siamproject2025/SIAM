const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
  obtenerMiembrosDirectiva,
  obtenerMiembroPorId,
  crearMiembroDirectiva,
  actualizarMiembroDirectiva,
  eliminarMiembroDirectiva,
  agregarDocumento,
  actualizarDocumento,
  eliminarDocumento,
  obtenerEstadisticas
} = require('../controllers/directivaController');

// Configurar multer para manejar archivos (igual que en biblioteca)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB límite
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('application/pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'), false);
    }
  }
});

// Rutas existentes
router.get('/', obtenerMiembrosDirectiva);
router.get('/estadisticas/estados', obtenerEstadisticas);
router.get('/:id', obtenerMiembroPorId);
router.post('/', crearMiembroDirectiva);
router.put('/:id', actualizarMiembroDirectiva);
router.delete('/:id', eliminarMiembroDirectiva);

// Nuevas rutas para documentos con upload de archivos
router.post('/:id/documentos', upload.single('archivo_pdf'), agregarDocumento);
router.put('/:id/documentos/:documentoId', upload.single('archivo_pdf'), actualizarDocumento);
router.delete('/:id/documentos/:documentoId', eliminarDocumento);

module.exports = router;