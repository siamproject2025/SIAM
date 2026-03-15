// middleware/auditoria.js - MODIFICADO
const Auditoria = require('../Models/Auditoria');

// Variable para controlar auditoría globalmente (puedes guardarla en BD)
let auditGlobalEnabled = true;

// Función para eliminar campos de imagen
const eliminarCamposImagen = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const limpio = { ...obj };
  const camposAEliminar = ['imagen', 'tipo_imagen', 'imagenBase64', 'foto', 'foto_preview'];
  
  camposAEliminar.forEach(campo => {
    if (limpio[campo] !== undefined) {
      delete limpio[campo];
    }
  });
  
  return limpio;
};

// NUEVA FUNCIÓN: Para cambiar estado de auditoría
const setAuditEnabled = (enabled) => {
  auditGlobalEnabled = enabled;
  console.log(`🔊 Auditoría ${enabled ? 'activada' : 'desactivada'} globalmente`);
};

// NUEVA FUNCIÓN: Para obtener estado
const getAuditEnabled = () => auditGlobalEnabled;

const registrarAuditoria = (modulo) => {
  return async (req, res, next) => {
    // VERIFICAR SI LA AUDITORÍA ESTÁ DESACTIVADA
    // 1. Por estado global
    // 2. Por cabecera HTTP
    // 3. Por query param
    const skipGlobal = !auditGlobalEnabled;
    const skipByHeader = req.headers['x-skip-audit'] === 'true';
    const skipByQuery = req.query.skipAudit === 'true';
    
    if (skipGlobal || skipByHeader || skipByQuery) {
      console.log(`🔇 Auditoría DESACTIVADA para ${req.method} ${req.originalUrl}`);
      return next();
    }
    
    const originalJson = res.json;
    const startTime = Date.now();

    let accion;
    switch (req.method) {
      case 'POST': accion = 'CREATE'; break;
      case 'PUT':
      case 'PATCH': accion = 'UPDATE'; break;
      case 'DELETE': accion = 'DELETE'; break;
      case 'GET': accion = 'VIEW'; break;
      default: accion = 'VIEW';
    }

    res.json = function(data) {
      const duration = Date.now() - startTime;
      
      const datosPreviosLimpios = req.datosPrevios ? eliminarCamposImagen(req.datosPrevios) : null;
      const datosNuevosLimpios = req.body ? eliminarCamposImagen(req.body) : null;

      const usuarioData = req.user ? {
        id: req.user._id || req.user.id,
        username: req.user?.username || req.user?.email?.split('@')[0] || 'Sistema',
        email: req.user?.email || 'sistema@local',
        rol: req.user?.roles?.[0] || 'usuario'
      } : {
        username: 'Sistema',
        email: 'sistema@local',
        rol: 'usuario'
      };

      Auditoria.create({
        usuario: usuarioData,
        accion,
        modulo,
        entidad: {
          nombre: req.baseUrl + req.path,
          id: req.params.id || data?.data?._id || null,
          datos_previos: datosPreviosLimpios,
          datos_nuevos: datosNuevosLimpios
        },
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent'),
        detalles: `${req.method} ${req.originalUrl}`,
        resultado: res.statusCode >= 400 ? 'ERROR' : 'EXITO',
        error_message: res.statusCode >= 400 ? data?.mensaje || data?.message || 'Error' : null,
        metadata: {
          query: req.query,
          params: req.params,
          statusCode: res.statusCode,
          duration
        },
        fecha_creacion: new Date()
      })
      .then(() => console.log(`✅ Auditoría: ${accion} en ${modulo} por ${usuarioData.username}`))
      .catch(err => console.error('❌ Error auditoría:', err));

      return originalJson.call(this, data);
    };

    next();
  };
};

const capturarDatosPrevios = (model) => {
  return async (req, res, next) => {
    if (req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE') {
      try {
        if (req.params.id) {
          const documento = await model.findById(req.params.id);
          if (documento) {
            req.datosPrevios = documento.toObject ? documento.toObject() : documento;
          }
        }
      } catch (error) {
        console.error('Error capturando datos previos:', error);
      }
    }
    next();
  };
};

module.exports = { 
  registrarAuditoria, 
  capturarDatosPrevios,
  setAuditEnabled,  // EXPORTAR NUEVAS FUNCIONES
  getAuditEnabled 
};