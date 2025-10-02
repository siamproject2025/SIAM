const express = require('express');
const router = express.Router();
const compraController = require('../Controllers/orden_compra');

router.post('/compras', compraController.crearCompra);
router.put('/compras/:id', compraController.actualizarEstado);
router.get('/compras', compraController.listarCompras);

module.exports = router;
