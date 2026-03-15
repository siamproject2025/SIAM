const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/uploadImage');
const { authenticateUser } = require('../middleware/authMiddleWare');
const { checkRole } = require('../middleware/checkRole');
const { capturarDatosPrevios, registrarAuditoria } = require('../middleware/auditoriaMiddleware');
const Personal = require('../Models/personalModel');

const {
  obtenerPersonal,
  obtenerPersonalPorId,
  crearPersonal,
  actualizarPersonal,
  eliminarPersonal,
  buscarPorEstado,
  buscarPorCargo
} = require('../Controllers/personalController');

// Middleware para medir tiempo de respuesta
router.use((req, res, next) => {
  req.requestStartTime = Date.now();
  next();
});

router.use(authenticateUser);

// Rutas básicas CRUD
router.get('/', 
  registrarAuditoria('PERSONAL'),
  obtenerPersonal
);

router.get('/:id', 
  registrarAuditoria('PERSONAL'),
  obtenerPersonalPorId
);

router.post('/', 
  upload.single('imagen'),
  registrarAuditoria('PERSONAL'),
  crearPersonal
);

router.put('/:id', 
  upload.single('imagen'),
  capturarDatosPrevios(Personal),
  registrarAuditoria('PERSONAL'),
  actualizarPersonal
);

router.delete('/:id', 
  capturarDatosPrevios(Personal),
  registrarAuditoria('PERSONAL'),
  eliminarPersonal
);

// Rutas de búsqueda específicas
router.get('/estado/:estado', 
  registrarAuditoria('PERSONAL'),
  buscarPorEstado
);

router.get('/cargo/:cargo', 
  registrarAuditoria('PERSONAL'),
  buscarPorCargo
);

module.exports = router;