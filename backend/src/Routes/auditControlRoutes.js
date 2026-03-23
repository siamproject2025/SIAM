// routes/auditControlRoutes.js
const express = require('express');
const router = express.Router();
const { getStatus, setStatus } = require('../Controllers/auditControlController');
const { authenticateUser } = require('../middleware/authMiddleWare');
const { checkPermission } = require('../middleware/checkPermission');
const { registrarAuditoria, capturarDatosPrevios } = require('../middleware/auditoriaMiddleware');

const Auditoria = require('../Models/Auditoria');

// Rutas para control de auditoría (protegidas con autenticación)
router.get('/audit-status', authenticateUser, getStatus);
router.post('/audit-status', authenticateUser,capturarDatosPrevios(Auditoria), registrarAuditoria('AUDITORIA'),checkPermission('ACTUALIZAR_AUDITORIA'),setStatus);

module.exports = router;