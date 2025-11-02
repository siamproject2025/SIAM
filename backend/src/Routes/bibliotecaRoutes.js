const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Libro = require("../Models/biblioteca");

// 📁 Carpeta donde se guardarán los archivos
const uploadPath = path.join(__dirname, "../uploads/libros");

// Crear carpeta si no existe
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// 📌 Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const nombreUnico = Date.now() + "-" + file.originalname;
    cb(null, nombreUnico);
  },
});

const upload = multer({ storage });

// -------------------
// POST: Subir nuevo libro
// -------------------
router.post("/", upload.single("archivo"), async (req, res) => {
  try {
    const { titulo, autor } = req.body;

    if (!req.file) return res.status(400).json({ error: "No se subió ningún archivo" });
    if (!titulo || !autor) return res.status(400).json({ error: "Título y autor son obligatorios" });

    const archivoUrl = `http://localhost:5000/uploads/libros/${req.file.filename}`;

    const libro = new Libro({
      titulo,
      autor,
      archivoUrl,
      nombreArchivo: req.file.filename,
    });

    await libro.save();
    res.status(201).json(libro);
  } catch (error) {
    console.error("Error al subir libro:", error);
    res.status(500).json({ error: error.message });
  }
});

// -------------------
// GET: Listar todos los libros
// -------------------
router.get("/", async (req, res) => {
  try {
    const libros = await Libro.find();
    res.json(libros);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------
// DELETE: Eliminar un libro por ID
// -------------------
router.delete("/:id", async (req, res) => {
  try {
    const libro = await Libro.findById(req.params.id);
    if (!libro) return res.status(404).json({ message: "Libro no encontrado" });

    // Eliminar archivo físico
    const filePath = path.join(uploadPath, libro.nombreArchivo);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // Eliminar registro de MongoDB
    await Libro.findByIdAndDelete(req.params.id);

    res.json({ message: "Libro eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar libro:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
