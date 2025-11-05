const express = require("express");
const { authenticateUser } = require('../middleware/authMiddleWare');

const router = express.Router();

router.use(authenticateUser);
const {
  crearHorario,
  obtenerHorarios,
  obtenerHorario,
  actualizarHorario,
  eliminarHorario,
} = require("../Controllers/horariosController");

router.get("/", obtenerHorarios);
router.get("/:id", obtenerHorario);
router.post("/", crearHorario);
router.put("/:id", actualizarHorario);
router.delete("/:id", eliminarHorario);

module.exports = router;
