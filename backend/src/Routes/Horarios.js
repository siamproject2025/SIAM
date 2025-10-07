const express = require('express');
const router = express.Router();
const { crearHorario } = require('../Controllers/horariosController');

router.post('/', crearHorario);

module.exports = router;