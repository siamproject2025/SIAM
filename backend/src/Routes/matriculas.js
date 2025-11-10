// Routes/matriculas.js
const express = require('express');
const router = express.Router();
const matriculaController = require('../Controllers/MatriculaController'); // revisa la ruta exacta
const { upload } = require('../middleware/uploadImage'); // Multer en memoria
const { authenticateUser } = require('../middleware/authMiddleWare');
const { checkRole } = require('../middleware/checkRole');


router.use(authenticateUser);
// Crear matrícula
router.post('/', upload.single('imagen'), matriculaController.crearMatricula);

// Obtener todas las matrículas
router.get('/', matriculaController.getAllMatriculas);

// Obtener matrícula por ID
router.get('/:id', matriculaController.getMatriculaById);

// Actualizar matrícula
router.put('/:id', upload.single('imagen'), matriculaController.updateMatricula);

// Eliminar matrícula
router.delete('/:id', matriculaController.deleteMatricula);

module.exports = router;
