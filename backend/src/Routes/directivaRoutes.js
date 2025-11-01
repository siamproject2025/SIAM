// routes/directivaRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getAllMiembros,
  getMiembroById,
  createMiembro,
  updateMiembro,
  deleteMiembro,
  uploadPDF,
  getPDFList,
  downloadPDF,
  deletePDF,
  buscarPDFsPorTipo,
  getEstadisticasDocumentos,
  getEstadisticasGenerales
} = require('../Controllers/directivaController');

// ============================================
// CONFIGURACIÓN DE MULTER
// ============================================
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'), false);
    }
  }
});

// ============================================
// RUTAS DE ESTADÍSTICAS
// ============================================
router.get('/stats/documentos', getEstadisticasDocumentos);
router.get('/stats/general', getEstadisticasGenerales);

// ============================================
// RUTAS DE BÚSQUEDA DE PDFs
// ============================================
router.get('/pdfs/tipo/:tipo', buscarPDFsPorTipo);

// ============================================
// RUTAS CRUD DE MIEMBROS
// ============================================
router.route('/')
  .get(getAllMiembros)      // GET /api/directiva
  .post(createMiembro);     // POST /api/directiva

router.route('/:id')
  .get(getMiembroById)      // GET /api/directiva/:id
  .put(updateMiembro)       // PUT /api/directiva/:id
  .delete(deleteMiembro);   // DELETE /api/directiva/:id

// ============================================
// RUTAS DE GESTIÓN DE PDFs
// ============================================
router.post('/:id/pdf', upload.single('pdf'), uploadPDF);        // POST /api/directiva/:id/pdf
router.get('/:id/pdfs', getPDFList);                             // GET /api/directiva/:id/pdfs
router.get('/:id/pdf/:pdfId', downloadPDF);                      // GET /api/directiva/:id/pdf/:pdfId
router.delete('/:id/pdf/:pdfId', deletePDF);                     // DELETE /api/directiva/:id/pdf/:pdfId

module.exports = router;