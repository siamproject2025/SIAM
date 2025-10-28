const express = require('express');
const router = express.Router();
const { obtenerAlumno, obtenerAlumnos } = require("../Controllers/alumnosController");

router.get('/', obtenerAlumnos);
router.get('/:id', obtenerAlumno);

module.exports = router;