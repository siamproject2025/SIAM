const express = require('express');
const router = express.Router();
const { obtenerDocente, obtenerDocentes, crearDocente} = require("../Controllers/docentesController");

router.get('/', obtenerDocentes);
router.get('/:id', obtenerDocente);
router.post("/", crearDocente);

module.exports = router;