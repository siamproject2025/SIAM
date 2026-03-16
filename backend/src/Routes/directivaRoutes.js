const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authenticateUser } = require('../middleware/authMiddleWare');
const { registrarAuditoria, capturarDatosPrevios } = require('../middleware/auditoriaMiddleware');
const Directiva = require('../Models/directivaModel');

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
} = require('../Controllers/directivaController');

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

// Middleware de autenticación para todas las rutas
router.use(authenticateUser);

// Middleware para medir tiempo de respuesta (útil para auditoría)
router.use((req, res, next) => {
  req.requestStartTime = Date.now();
  next();
});

// Aplicar autenticación a todas las rutas (descomenta si necesitas autenticación)
// router.use(authenticateUser);

// Rutas principales
router.get('/', 
 
  obtenerMiembrosDirectiva
);

router.get('/estadisticas/estados', 
 
  obtenerEstadisticas
);

router.get('/:id', 
  registrarAuditoria('DIRECTIVA'),
  obtenerMiembroPorId
);

router.post('/', 
  registrarAuditoria('DIRECTIVA'),
  crearMiembroDirectiva
);

router.put('/:id', 
  capturarDatosPrevios(Directiva),
  registrarAuditoria('DIRECTIVA'),
  actualizarMiembroDirectiva
);

router.delete('/:id', 
  capturarDatosPrevios(Directiva),
  registrarAuditoria('DIRECTIVA'),
  eliminarMiembroDirectiva
);

// Rutas para documentos
router.post('/:id/documentos', 
  upload.single('archivo_pdf'),
  registrarAuditoria('DIRECTIVA_DOCUMENTOS'),
  agregarDocumento
);

router.put('/:id/documentos/:documentoId', 
  upload.single('archivo_pdf'),
  registrarAuditoria('DIRECTIVA_DOCUMENTOS'),
  actualizarDocumento
);

router.delete('/:id/documentos/:documentoId', 
  registrarAuditoria('DIRECTIVA_DOCUMENTOS'),
  eliminarDocumento
);

module.exports = router;