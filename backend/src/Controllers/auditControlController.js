// controllers/auditControlController.js
const { setAuditEnabled, getAuditEnabled } = require('../middleware/auditoriaMiddleware');
const Auditoria = require('../Models/Auditoria');

// Obtener estado actual
const getStatus = (req, res) => {
  res.json({
    enabled: getAuditEnabled(),
    message: `Auditoría ${getAuditEnabled() ? 'activada' : 'desactivada'}`
  });
};

// Cambiar estado
const setStatus = async (req, res) => {
  try {
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'El parámetro "enabled" debe ser booleano' });
    }

    // Cambiar estado
    setAuditEnabled(enabled);

   
    res.json({
      enabled,
      message: `Auditoría ${enabled ? 'activada' : 'desactivada'} correctamente`
    });

  } catch (error) {
    console.error('Error cambiando estado de auditoría:', error);
    res.status(500).json({ error: 'Error al cambiar estado de auditoría' });
  }
};

module.exports = {
  getStatus,
  setStatus
};