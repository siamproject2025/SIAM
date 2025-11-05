
const express = require("express");
const router = express.Router();
const { authenticateUser } = require('../middleware/authMiddleWare');

const {
  crearActividad,
  obtenerActividades,
  actualizarActividad,
  eliminarActividad,
} = require("../Controllers/actividadesController");

router.post("/", authenticateUser, crearActividad);
router.get("/", authenticateUser, obtenerActividades);
router.put("/:id", authenticateUser, actualizarActividad); // actualizar
router.delete("/:id", authenticateUser, eliminarActividad); // eliminar

module.exports = router;
