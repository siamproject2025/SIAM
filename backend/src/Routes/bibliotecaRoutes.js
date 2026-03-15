const express = require("express");
const router = express.Router();
const multer = require("multer");
const libroController = require("../Controllers/bibliotecaController");
const { registrarAuditoria, capturarDatosPrevios } = require('../middleware/auditoriaMiddleware');
const Modelo = require("../Models/biblioteca"); // Importar modelo para capturar datos previos

const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST: Subir libro
router.post("/", upload.single("archivo"),registrarAuditoria('BIBLIOTECA'), libroController.crearLibro);

// GET: Listar libros
router.get("/", registrarAuditoria('BIBLIOTECA'),libroController.obtenerLibros);

// DELETE: Eliminar libro
router.delete("/:id", capturarDatosPrevios(Modelo), registrarAuditoria('BIBLIOTECA'), libroController.eliminarLibro);

module.exports = router;
