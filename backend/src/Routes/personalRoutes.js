const express = require('express');
const router = express.Router();

const { authenticateUser } = require('../middleware/authMiddleWare');
const { capturarDatosPrevios, registrarAuditoria } = require('../middleware/auditoriaMiddleware');
const Personal = require('../Models/personalModel');
const { uploadMatricula } = require('../middleware/uploadImage');

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
 
  obtenerPersonal
);

router.get('/:id', 
 
  obtenerPersonalPorId
);

router.post('/', 
  uploadMatricula,
  registrarAuditoria('PERSONAL'),
  crearPersonal
);

router.put('/:id', 
  uploadMatricula,
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