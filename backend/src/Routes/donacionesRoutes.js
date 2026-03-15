const express = require('express');
const router = express.Router();
const donacionesController = require('../Controllers/donacionesController');
const { upload } = require('../middleware/uploadImage');
const { authenticateUser } = require('../middleware/authMiddleWare');
const { capturarDatosPrevios, registrarAuditoria } = require('../middleware/auditoriaMiddleware');
const Donacion = require('../Models/donacionesModel');

// Middleware para medir tiempo de respuesta
router.use((req, res, next) => {
  req.requestStartTime = Date.now();
  next();
});

router.use(authenticateUser);

// Rutas básicas CRUD
router.get('/', 
  registrarAuditoria('DONACIONES'),
  donacionesController.getAllDonaciones
);

router.get('/:id', 
  registrarAuditoria('DONACIONES'),
  donacionesController.getDonacionById
);

// Crear donación con imagen
router.post('/', 
  upload.single('imagen'),
  registrarAuditoria('DONACIONES'),
  donacionesController.createDonacion
);

// Actualizar donación con posibilidad de nueva imagen
router.put('/:id', 
  upload.single('imagen'),
  capturarDatosPrevios(Donacion, 'id_donacion'), // Buscar por id_donacion en lugar de _id
  registrarAuditoria('DONACIONES'),
  donacionesController.updateDonacion
);

router.delete('/:id', 
  capturarDatosPrevios(Donacion, 'id_donacion'), // Buscar por id_donacion
  registrarAuditoria('DONACIONES'),
  donacionesController.deleteDonacion
);

// Rutas adicionales
router.get('/almacen/:id_almacen', 
  registrarAuditoria('DONACIONES'),
  donacionesController.getDonacionesByAlmacen
);

router.get('/tipo/:tipo', 
  registrarAuditoria('DONACIONES'),
  donacionesController.getDonacionesByTipo
);

router.get('/estadisticas/resumen', 
  registrarAuditoria('DONACIONES'),
  donacionesController.getEstadisticasDonaciones
);

module.exports = router;