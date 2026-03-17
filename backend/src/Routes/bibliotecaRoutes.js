const express = require("express");
const router = express.Router();
const multer = require("multer");
const libroController = require("../Controllers/bibliotecaController");
const { registrarAuditoria, capturarDatosPrevios } = require('../middleware/auditoriaMiddleware');
const Modelo = require("../Models/biblioteca"); // Importar modelo para capturar datos previos
const { authenticateUser } = require('../middleware/authMiddleWare');
const { checkPermission } = require('../middleware/checkPermission');

const storage = multer.memoryStorage();
const upload = multer({ storage });



router.use(authenticateUser);

// POST: Subir libro
router.post("/", upload.single("archivo"),checkPermission('CREAR_BIBLIOTECA'),registrarAuditoria('BIBLIOTECA'), libroController.crearLibro);

// GET: Listar libros
router.get("/",libroController.obtenerLibros);

// DELETE: Eliminar libro
router.delete("/:id",checkPermission('ELIMINAR_BIBLIOTECA'), capturarDatosPrevios(Modelo), registrarAuditoria('BIBLIOTECA'), libroController.eliminarLibro);

module.exports = router;
