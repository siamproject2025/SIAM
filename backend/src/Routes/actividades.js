// En rutas de actividades
const express = require("express");
const router = express.Router();
const {
  crearActividad,
  obtenerActividades,
  actualizarActividad,
  eliminarActividad,
} = require("../Controllers/actividadesController");

router.post("/", crearActividad);
router.get("/", obtenerActividades);
router.put("/:id", actualizarActividad); // actualizar
router.delete("/:id", eliminarActividad); // eliminar

module.exports = router;
