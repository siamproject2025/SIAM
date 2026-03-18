// routes/auditControlRoutes.js
const express = require('express');
const router = express.Router();
const { getStatus, setStatus } = require('../Controllers/auditControlController');
const { authenticateUser } = require('../middleware/authMiddleWare');
const { checkPermission } = require('../middleware/checkPermission');

// Rutas para control de auditoría (protegidas con autenticación)
router.get('/audit-status', authenticateUser, getStatus);
router.post('/audit-status',checkPermission('ACTUALIZAR_AUDITORIA'), authenticateUser, setStatus);

module.exports = router;