// Routes/matriculas.js
const express    = require('express');
const router     = express.Router();
const ctrl       = require('../Controllers/MatriculaController');

// uploadMatricula ya viene configurado con .fields() + fileFilter correcto
// que acepta imágenes (perfil) y PDF/JPG/PNG (documentos de matrícula)
const { uploadMatricula } = require('../middleware/uploadImage');

const { authenticateUser }   = require('../middleware/authMiddleWare');
const { checkPermission }    = require('../middleware/checkPermission');
const { registrarAuditoria, capturarDatosPrevios } = require('../middleware/auditoriaMiddleware');
const Modelo = require('../Models/Estudiante');

router.use(authenticateUser);

// ── Crear alumno con primera matrícula ───────────────────────
router.post(
    '/',
    checkPermission('CREAR_MATRICULA'),
    uploadMatricula,                      // acepta 'imagen' (1) + 'documentos' (hasta 6)
    registrarAuditoria('MATRICULA'),
    ctrl.crearMatricula
);

// ── Agregar año de matrícula a alumno existente ──────────────
router.post(
    '/:id/matricular',
    checkPermission('CREAR_MATRICULA'),
    registrarAuditoria('MATRICULA'),
    ctrl.agregarMatricula
);

// ── Editar una entrada específica del historial ──────────────
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

// ── Actualizar expediente ────────────────────────────────────
router.put(
    '/:id',
    checkPermission('ACTUALIZAR_MATRICULA'),
    uploadMatricula,                      // acepta 'imagen' (1) + 'documentos' (hasta 6)
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