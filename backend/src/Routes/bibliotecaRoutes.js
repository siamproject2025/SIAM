const express = require('express');
const router = express.Router();
const { crearBiblioteca } = require('../Controllers/bibliotecaController');

router.post('/', crearBiblioteca);
router.post('/:id', crearArchivoBiblioteca);

module.exports = router;