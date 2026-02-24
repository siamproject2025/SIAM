// routes/bienesRoutes.js
const express = require("express");
const { upload } = require('../middleware/uploadImage'); // Multer en memoria
const { authenticateUser } = require('../middleware/authMiddleWare');
const { registrarAuditoria, capturarDatosPrevios } = require('../middleware/auditoriaMiddleware');
const Bien = require("../Models/Bien"); // Importar modelo para capturar datos previos

const  {
  getBienes,
  getBienById,
  createBien,
  updateBien,
  deleteBien
} = require( "../Controllers/bienesController");

const router = express.Router();

// Middleware para medir tiempo de respuesta (opcional pero útil para auditoría)
router.use((req, res, next) => {
  req.requestStartTime = Date.now();
  next();
});

// Middleware de autenticación para todas las rutas
router.use(authenticateUser);

// GET /api/bienes - Listar todos los bienes
router.get("/", 
  registrarAuditoria('BIENES'),
  getBienes
);

router.get("/:id",
  registrarAuditoria('BIENES'),
  getBienById
);

// POST /api/bienes - Crear nuevo bien
router.post("/", 
  upload.single('imagen'),
  registrarAuditoria('BIENES'),
  createBien
);

// PUT /api/bienes/:id - Actualizar bien
router.put("/:id",  
  upload.single('imagen'),
  authenticateUser, // Este podría ser redundante pero lo dejamos
  capturarDatosPrevios(Bien), // Captura datos antes de actualizar
  registrarAuditoria('BIENES'),
  updateBien
);

// DELETE /api/bienes/:id - Eliminar bien
router.delete("/:id", 
  capturarDatosPrevios(Bien), // Captura datos antes de eliminar
  registrarAuditoria('BIENES'),
  deleteBien
);

module.exports = router;