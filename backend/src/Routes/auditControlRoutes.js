// routes/auditControlRoutes.js
const express = require('express');
const router = express.Router();
const { getStatus, setStatus } = require('../Controllers/auditControlController');
const { authenticateUser } = require('../middleware/authMiddleWare');

// Rutas para control de auditoría (protegidas con autenticación)
router.get('/audit-status', authenticateUser, getStatus);
router.post('/audit-status', authenticateUser, setStatus);

module.exports = router;