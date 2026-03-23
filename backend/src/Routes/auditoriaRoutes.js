// routes/auditoriaRoutes.js
const express = require('express');
const router = express.Router();
const auditoriaController = require('../Controllers/auditoriaController');
const { authenticateUser } = require('../middleware/authMiddleWare');
const { checkPermission } = require('../middleware/checkPermission');

// Middleware de autenticación para todas las rutas
router.use(authenticateUser);

// Rutas principales
router.get('/', 

  auditoriaController.obtenerRegistros
);

router.get('/exportar',

  auditoriaController.exportarRegistros
);

// Rutas de estadísticas
router.get('/estadisticas',

  auditoriaController.obtenerEstadisticas
);

router.get('/resumen',

  auditoriaController.obtenerResumenPorPeriodo
);

// Rutas de usuario específico
router.get('/usuario/:usuarioId',

  auditoriaController.obtenerActividadUsuario
);

// Búsqueda avanzada
router.post('/busqueda-avanzada',
  checkPermission('ACTUALIZAR_AUDITORIA'),
  auditoriaController.busquedaAvanzada
);

// Rutas de ADMINistración
router.delete('/limpiar',
  checkPermission('ELIMINAR_AUDITORIA'),
  auditoriaController.limpiarRegistrosAntiguos
);

// Ruta para registro específico
router.get('/:id',
  auditoriaController.obtenerRegistroPorId
);

router.get('/exportar',
 
  auditoriaController.exportarRegistros
);

module.exports = router;