const express = require("express");
const multer = require("multer");
const subida = multer({ storage: multer.memoryStorage() });
const router = express.Router();
const {
  obtenerLibros,
  obtenerLibro,
  crearLibro,
  actualizarLibro,
  eliminarLibro,
} = require("../Controllers/bibliotecaController");

// Rutas CRUD completas
// TODO: Añadir middlewares de roles y auth.
router.get("/", obtenerLibros);
router.get("/:id", obtenerLibro);
router.post("/", subida.single('archivo'), crearLibro);
// router.put("/:id", actualizarLibro); // todo: implementar actualización de recurso
router.delete("/:id", eliminarLibro);

module.exports = router;
//holaaaaa