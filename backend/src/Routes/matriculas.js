// Routes/matriculas.js
const express = require('express');
const router = express.Router();
const matriculaController = require('../controllers/MatriculaController'); // revisa la ruta exacta
const { upload } = matriculaController; // usamos el middleware exportado en el controlador

// Crear matrícula
router.post('/', upload, matriculaController.crearMatricula);

// Obtener todas las matrículas
router.get('/', matriculaController.getAllMatriculas);

// Obtener matrícula por ID
router.get('/:id', matriculaController.getMatriculaById);

// Actualizar matrícula
router.put('/:id', upload, matriculaController.updateMatricula);

// Eliminar matrícula
router.delete('/:id', matriculaController.deleteMatricula);

module.exports = router;
