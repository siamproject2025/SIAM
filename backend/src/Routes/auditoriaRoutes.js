// routes/auditoriaRoutes.js
const express = require('express');
const router = express.Router();
const auditoriaController = require('../Controllers/auditoriaController');
const { authenticateUser } = require('../middleware/authMiddleWare');
const { checkRole } = require('../middleware/checkRole');

// Middleware de autenticación para todas las rutas
router.use(authenticateUser);

// Rutas principales
router.get('/', 
  checkRole(['ADMIN', 'DOCENTE']),
  auditoriaController.obtenerRegistros
);

router.get('/exportar',
  checkRole(['ADMIN', 'DOCENTE']),
  auditoriaController.exportarRegistros
);

// Rutas de estadísticas
router.get('/estadisticas',
  checkRole(['ADMIN', 'DOCENTE']),
  auditoriaController.obtenerEstadisticas
);

router.get('/resumen',
  checkRole(['ADMIN', 'DOCENTE']),
  auditoriaController.obtenerResumenPorPeriodo
);

// Rutas de usuario específico
router.get('/usuario/:usuarioId',
  checkRole(['ADMIN', 'DOCENTE']),
  auditoriaController.obtenerActividadUsuario
);

// Búsqueda avanzada
router.post('/busqueda-avanzada',
  checkRole(['ADMIN', 'DOCENTE']),
  auditoriaController.busquedaAvanzada
);

// Rutas de ADMINistración
router.delete('/limpiar',
  checkRole(['ADMIN']),
  auditoriaController.limpiarRegistrosAntiguos
);

// Ruta para registro específico
router.get('/:id',
  checkRole(['ADMIN', 'DOCENTE']),
  auditoriaController.obtenerRegistroPorId
);

module.exports = router;