const express = require('express');
const router = express.Router();
const {obtenerAula, obtenerAulas, crearAula, actualizarAula} = require("../Controllers/aulasController");

router.get('/', obtenerAulas);
router.get('/:id', obtenerAula);
router.post('/', crearAula);
router.put('/', actualizarAula);

module.exports = router;