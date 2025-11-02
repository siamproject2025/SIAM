// Rutas: matriculas.js (Express.js)
const express = require('express');
const router = express.Router();
const matriculaController = require('../controllers/MatriculaController');

// Ruta para crear una nueva matrícula (POST)
router.post('/', matriculaController.crearMatricula);

// Ruta para obtener todos los estudiantes (GET)
router.get('/', matriculaController.obtenerEstudiantes);

// Ruta para obtener un estudiante por ID (GET)
router.get('/:id', matriculaController.obtenerEstudiantePorId);

// Nota: Puedes agregar rutas para actualizar (PUT/PATCH) y eliminar (DELETE)

module.exports = router;

/*
**Ejemplo de uso de la ruta:**
- POST /api/matriculas -> Crea un nuevo estudiante.
- GET /api/matriculas  -> Obtiene la lista de estudiantes.
- GET /api/matriculas/123456 -> Obtiene un estudiante específico.
*/