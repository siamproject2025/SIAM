// middleware/auditoria.js - MODIFICADO
const Auditoria = require('../Models/Auditoria');
const Usuario = require('../Models/usuario_modelo');
const Solicitud = require('../Models/solicitud_modelo'); // ajusta el path

const modelosMap = {
  'USUARIOS': Usuario,
  'SOLICITUDES': Solicitud,
  // agrega más entidades aquí según necesites
};
// Variable para controlar auditoría globalmente
let auditGlobalEnabled = true;

// CACHE para peticiones GET (nuevo)
const getCache = new Map();
const GET_CACHE_DURATION = 5000; // 5 segundos en milisegundos

// Función para generar clave única de la petición GET
const generarClaveGet = (req) => {
  return `${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}:${req.user?._id || 'anonymous'}`;
};

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

// Función para cambiar estado de auditoría
const setAuditEnabled = (enabled) => {
  auditGlobalEnabled = enabled;
  console.log(`🔊 Auditoría ${enabled ? 'activada' : 'desactivada'} globalmente`);
};

// Función para obtener estado
const getAuditEnabled = () => auditGlobalEnabled;

// Limpiar caché periódicamente (cada minuto)
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of getCache.entries()) {
    if (now - timestamp > GET_CACHE_DURATION) {
      getCache.delete(key);
    }
  }
  console.log(`🧹 Caché de GETs limpiado. Tamaño actual: ${getCache.size}`);
}, 60000); // Limpiar cada minuto

const registrarAuditoria = (modulo, accionPersonalizada = null) => {
  return async (req, res, next) => {
    // ⚠️ Manejo especial para GET con caché
    if (req.method === 'GET') {
      const cacheKey = generarClaveGet(req);
      const ahora = Date.now();
      const ultimoRegistro = getCache.get(cacheKey);
      
      // Si ya se registró un GET idéntico en los últimos 5 segundos, NO registrar
      if (ultimoRegistro && (ahora - ultimoRegistro) < GET_CACHE_DURATION) {
        console.log(`⏱️ GET duplicado ignorado (${Math.round((ahora - ultimoRegistro)/1000)}s): ${req.originalUrl}`);
        return next(); // Continúa pero sin auditar
      }
      
      // Marcar que vamos a registrar este GET
      getCache.set(cacheKey, ahora);
      
      // Limpiar entradas antiguas de este usuario/ruta específica
      setTimeout(() => {
        if (getCache.get(cacheKey) === ahora) {
          getCache.delete(cacheKey);
          console.log(`🧹 Caché expirado para: ${req.originalUrl}`);
        }
      }, GET_CACHE_DURATION + 1000); // Expirar 1 segundo después
    }
    
    // VERIFICAR SI LA AUDITORÍA ESTÁ DESACTIVADA
    const skipGlobal = !auditGlobalEnabled;
    const skipByHeader = req.headers['x-skip-audit'] === 'true';
    const skipByQuery = req.query.skipAudit === 'true';
    
    if (skipGlobal || skipByHeader || skipByQuery) {
      console.log(`🔇 Auditoría DESACTIVADA para ${req.method} ${req.originalUrl}`);
      return next();
    }
    
    const originalJson = res.json;
    const startTime = Date.now();

    // DETERMINAR LA ACCIÓN: usar personalizada si existe, sino mapear por método HTTP
    let accion;
    if (accionPersonalizada) {
      accion = accionPersonalizada;
      console.log(`📝 Usando acción personalizada: ${accion} para ${req.method} ${req.originalUrl}`);
    } else {
      switch (req.method) {
        case 'POST': accion = 'CREATE'; break;
        case 'PUT':
        case 'PATCH': accion = 'UPDATE'; break;
        case 'DELETE': accion = 'DELETE'; break;
        case 'GET': accion = 'VIEW'; break;
        default: accion = 'VIEW';
      }
    }

            res.json = function(data) {
          const duration = Date.now() - startTime;

          const datosPreviosLimpios = req.datosPrevios
            ? eliminarCamposImagen(req.datosPrevios)
            : null;

          // ✅ Toma la respuesta del controlador, no solo req.body
          const datosNuevosRaw = data?.data || data?.usuario || data?.solicitud || req.body || null;
          const datosNuevosLimpios = datosNuevosRaw
            ? eliminarCamposImagen(datosNuevosRaw)
            : null;
            
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

      // Solo registrar si es GET y está en caché (lo registramos) o si es otro método
      if (req.method !== 'GET' || getCache.has(generarClaveGet(req))) {
        Auditoria.create({
          usuario: usuarioData,
          accion, // Ahora usa la acción determinada (personalizada o mapeada)
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
            duration,
            metodoHttp: req.method,
            accionPersonalizada: accionPersonalizada || null
          },
          fecha_creacion: new Date()
        })
        .then(() => {
          if (req.method === 'GET') {
            console.log(`✅ Auditoría GET (cacheada): ${accion} en ${modulo} por ${usuarioData.username}`);
          } else {
            console.log(`✅ Auditoría: ${accion} en ${modulo} por ${usuarioData.username}`);
          }
        })
        .catch(err => console.error('❌ Error auditoría:', err));
      }

      return originalJson.call(this, data);
    };

    next();
  };
};
const capturarDatosPrevios = (entidad) => {
  return async (req, res, next) => {
    if (req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE') {
      try {
        const Model = modelosMap[entidad]; // ✅ obtiene el modelo real

        if (!Model) {
          console.warn(`⚠️ No hay modelo definido para: ${entidad}`);
          return next();
        }

        if (req.params.id) {
          const documento = await Model.findById(req.params.id);
          if (documento) {
            req.datosPrevios = documento.toObject ? documento.toObject() : documento;
            console.log(`✅ Datos previos capturados para ${entidad}:`, req.datosPrevios);
          } else {
            console.warn(`⚠️ No se encontró documento con ID: ${req.params.id}`);
          }
        }
      } catch (error) {
        console.error('❌ Error capturando datos previos:', error);
      }
    }
    next();
  };
};


module.exports = { 
  registrarAuditoria, 
  capturarDatosPrevios,
  setAuditEnabled,
  getAuditEnabled 
};