// Routes/matriculas.js
const express = require('express');
const router = express.Router();
const matriculaController = require('../Controllers/MatriculaController'); // revisa la ruta exacta
const { upload } = require('../middleware/uploadImage'); // Multer en memoria
const { authenticateUser } = require('../middleware/authMiddleWare');
const { checkRole } = require('../middleware/checkRole');
const { checkPermission } = require('../middleware/checkPermission');
const { registrarAuditoria, capturarDatosPrevios } = require('../middleware/auditoriaMiddleware');
const Modelo = require("../Models/Estudiante"); // Importar modelo para capturar datos previos

router.use(authenticateUser); 
// Crear matrícula
router.post('/', checkPermission('CREAR_MATRICULA'),upload.single('imagen'),registrarAuditoria('MATRICULA'), matriculaController.crearMatricula);

// Obtener todas las matrículas
router.get('/',matriculaController.getAllMatriculas);

// Obtener matrícula por ID
router.get('/:id', matriculaController.getMatriculaById);

// Actualizar matrícula
router.put('/:id',checkPermission('ACTUALIZAR_MATRICULA'), upload.single('imagen'),capturarDatosPrevios(Modelo), registrarAuditoria('MATRICULA'), matriculaController.updateMatricula);

// Eliminar matrícula
router.delete('/:id',capturarDatosPrevios(Modelo),checkPermission('ELIMINAR_MATRICULA'), registrarAuditoria('MATRICULA'), matriculaController.deleteMatricula);

module.exports = router;
