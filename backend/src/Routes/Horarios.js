const express = require('express');
const router = express.Router();
const { crearHorario, obtenerHorarios, obtenerHorario, actualizarHorario} = require("../Controllers/horariosController")

router.get('/', obtenerHorarios);
router.get('/:id', obtenerHorario);
router.post('/', crearHorario);
router.put("/:id", actualizarHorario);

module.exports = router;