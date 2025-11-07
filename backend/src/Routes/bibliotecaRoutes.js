const express = require("express");
const router = express.Router();
const multer = require("multer");
const libroController = require("../Controllers/bibliotecaController");

const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST: Subir libro
router.post("/", upload.single("archivo"), libroController.crearLibro);

// GET: Listar libros
router.get("/", libroController.obtenerLibros);

// DELETE: Eliminar libro
router.delete("/:id", libroController.eliminarLibro);

module.exports = router;
