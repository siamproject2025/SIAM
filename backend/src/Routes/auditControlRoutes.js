// routes/auditControlRoutes.js
const express = require('express');
const router = express.Router();
const { getStatus, setStatus } = require('../Controllers/auditControlController');
const { authenticateUser } = require('../middleware/authMiddleWare');
const { checkPermission } = require('../middleware/checkPermission');

// Rutas para control de auditoría (protegidas con autenticación)
router.get('/audit-status', checkPermission('ACTUALIZAR_AUDITORIA'), authenticateUser, getStatus);
router.post('/audit-status', authenticateUser, setStatus);

module.exports = router;