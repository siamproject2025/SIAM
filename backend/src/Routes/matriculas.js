// Routes/matriculas.js
const express    = require('express');
const router     = express.Router();
const ctrl       = require('../Controllers/MatriculaController');
const { upload } = require('../middleware/uploadImage');
const { authenticateUser }          = require('../middleware/authMiddleWare');
const { checkPermission }           = require('../middleware/checkPermission');
const { registrarAuditoria, capturarDatosPrevios } = require('../middleware/auditoriaMiddleware');
const Modelo = require('../Models/Estudiante');

router.use(authenticateUser);

// ── Crear alumno con primera matrícula ───────────────────────
router.post(
    '/',
    checkPermission('CREAR_MATRICULA'),
    upload.single('imagen'),
    registrarAuditoria('MATRICULA'),
    ctrl.crearMatricula
);

// ── NUEVO: Agregar año de matrícula a alumno existente ───────
// Usa $push en historial_matriculas → NO sobreescribe años anteriores
router.post(
    '/:id/matricular',
    checkPermission('CREAR_MATRICULA'),
    registrarAuditoria('MATRICULA'),
    ctrl.agregarMatricula
);

// ── NUEVO: Editar una entrada específica del historial ───────
router.put(
    '/:id/historial/:matriculaId',
    checkPermission('ACTUALIZAR_MATRICULA'),
    registrarAuditoria('MATRICULA'),
    ctrl.editarEntradaHistorial
);

// ── Obtener todas las matrículas ─────────────────────────────
router.get('/', ctrl.getAllMatriculas);

// ── Obtener por ID ───────────────────────────────────────────
router.get('/:id', ctrl.getMatriculaById);

// ── Actualizar expediente (datos personales / médicos) ───────
// NO toca el historial de matrículas
router.put(
    '/:id',
    checkPermission('ACTUALIZAR_MATRICULA'),
    upload.single('imagen'),
    capturarDatosPrevios(Modelo),
    registrarAuditoria('MATRICULA'),
    ctrl.updateMatricula
);

// ── Eliminar ─────────────────────────────────────────────────
router.delete(
    '/:id',
    capturarDatosPrevios(Modelo),
    checkPermission('ELIMINAR_MATRICULA'),
    registrarAuditoria('MATRICULA'),
    ctrl.deleteMatricula
);

module.exports = router;