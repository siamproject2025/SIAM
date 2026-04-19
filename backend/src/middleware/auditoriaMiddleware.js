// middleware/auditoriaMiddleware.js
const Auditoria = require('../Models/Auditoria');

// ─── Estado global de auditoría ───────────────────────────────────────────────
let auditGlobalEnabled = true;

// ─── Cache de GETs duplicados (evita doble registro por re-render) ────────────
const getCache = new Map();
const GET_CACHE_DURATION = 5000; // ms

const generarClaveGet = (req) =>
  `${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}:${req.user?._id || 'anonymous'}`;

// Limpiar cache cada minuto
setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of getCache.entries()) {
    if (now - ts > GET_CACHE_DURATION) getCache.delete(key);
  }
}, 60_000);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CAMPOS_IMAGEN  = ['imagen', 'tipo_imagen', 'imagenBase64', 'foto', 'foto_preview'];
const CAMPOS_SISTEMA = ['_id', '__v', 'createdAt', 'updatedAt', 'timestamp'];

// Campos que guardan ObjectIds de "quién hizo algo" — se reemplazan por nombre legible
const CAMPOS_USUARIO_ID = [
  'actualizado_por', 'creado_por', 'modificado_por',
  'registrado_por',  'aprobado_por', 'rechazado_por',
  'eliminado_por',   'asignado_por', 'autorizado_por',
];
// Sus contrapartes de email que ya son legibles — se conservan tal cual
const CAMPOS_USUARIO_EMAIL = CAMPOS_USUARIO_ID.map(c => `${c}_email`);

/**
 * En los datos previos/nuevos, reemplaza los campos *_por (que guardan ObjectId)
 * por el nombre del usuario actual (req.user) cuando el valor coincide con su _id.
 * Si el ObjectId pertenece a otro usuario, muestra el email si está disponible en
 * el mismo objeto, o deja el ID acortado como fallback.
 */
const resolverCamposUsuario = (obj, user) => {
  if (!obj || typeof obj !== 'object') return obj;

  const resultado = { ...obj };
  const userId = user?._id?.toString() || user?.id?.toString();
  const userName = user?.username || user?.email?.split('@')[0] || 'Usuario';

  for (const campo of CAMPOS_USUARIO_ID) {
    if (resultado[campo] === undefined) continue;

    const valorId = resultado[campo]?.toString?.() || String(resultado[campo]);
    const emailCampo = `${campo}_email`;

    if (valorId === userId) {
      // Es el usuario actual → mostrar su nombre
      resultado[campo] = userName;
    } else if (resultado[emailCampo]) {
      // Hay email disponible en el mismo objeto → usarlo como nombre
      resultado[campo] = resultado[emailCampo];
    } else if (/^[a-fA-F0-9]{24}$/.test(valorId)) {
      // ObjectId desconocido → acortar para que no llene la vista
      resultado[campo] = `ID:${valorId.slice(-6)}`;
    }
    // Si no es ObjectId (ya era un nombre), dejarlo como está
  }

  return resultado;
};

/**
 * Limpia campos de imagen y sistema de un objeto plano.
 * Acepta un usuario opcional para humanizar campos *_por.
 */
const limpiarObjeto = (obj, user = null) => {
  if (!obj || typeof obj !== 'object') return obj;

  const raw = typeof obj.toObject === 'function' ? obj.toObject() : { ...obj };

  const eliminar = new Set([...CAMPOS_IMAGEN, ...CAMPOS_SISTEMA, ...CAMPOS_USUARIO_EMAIL]);
  let limpio = Object.fromEntries(
    Object.entries(raw).filter(([k]) => !eliminar.has(k))
  );

  if (user) limpio = resolverCamposUsuario(limpio, user);

  return limpio;
};

/**
 * Intenta extraer la entidad modificada de la respuesta del controlador.
 * Acepta el usuario para humanizar campos *_por en los datos resultantes.
 */
const extraerDatosNuevos = (responseData, reqBody, user = null) => {
  if (!responseData) return limpiarObjeto(reqBody, user) || null;

  const candidatos = [
    responseData.data,
    responseData.bien,
    responseData.usuario,
    responseData.solicitud,
    responseData.donacion,
    responseData.horario,
    responseData.actividad,
    responseData.estudiante,
    responseData.personal,
    responseData.orden,
    responseData.proveedor,
    responseData.rol,
    responseData.grado,
    responseData.matricula,
    responseData.biblioteca,
    responseData.directiva,
    responseData.documento,
  ];

  for (const candidato of candidatos) {
    if (candidato && typeof candidato === 'object' && !Array.isArray(candidato)) {
      return limpiarObjeto(candidato, user);
    }
  }

  if (responseData._id) return limpiarObjeto(responseData, user);

  return limpiarObjeto(reqBody, user) || null;
};

// ─── API pública ──────────────────────────────────────────────────────────────
const setAuditEnabled = (enabled) => {
  auditGlobalEnabled = enabled;
  console.log(`🔊 Auditoría ${enabled ? 'activada' : 'desactivada'} globalmente`);
};

const getAuditEnabled = () => auditGlobalEnabled;

// ─────────────────────────────────────────────────────────────────────────────
// capturarDatosPrevios
// Acepta directamente el modelo Mongoose (NO un string del mapa).
//
// Uso básico (modelos con _id ObjectId estándar):
//   capturarDatosPrevios(Bien)
//
// Uso con campo ID personalizado (ej. modelos con id numérico):
//   capturarDatosPrevios(Donacion, 'id_donacion')
//   capturarDatosPrevios(Bien,     'id_bien')
//
// El segundo argumento indica el nombre del campo en el MODELO y también
// el nombre esperado en req.params. Si no se indica, se usa findById() con
// req.params.id (comportamiento estándar ObjectId).
// ─────────────────────────────────────────────────────────────────────────────
const capturarDatosPrevios = (Model, campoId = null) => {
  return async (req, res, next) => {
    const metodo = req.method.toUpperCase();
    if (metodo !== 'PUT' && metodo !== 'PATCH' && metodo !== 'DELETE') {
      return next();
    }

    if (!Model) {
      console.warn('⚠️ capturarDatosPrevios: no se proporcionó un modelo.');
      return next();
    }

    // Resolver el valor del ID desde req.params
    // Busca en orden: campo personalizado → 'id' genérico → cualquier param disponible
    const idValor =
      (campoId && req.params[campoId]) ||
      req.params.id ||
      Object.values(req.params)[0];

    if (!idValor) {
      console.warn('⚠️ capturarDatosPrevios: no se encontró un ID en req.params.');
      return next();
    }

    try {
      let documento;

      // Detectar si el valor recibido es un ObjectId válido de MongoDB (24 hex chars)
      const esObjectId = /^[a-fA-F0-9]{24}$/.test(idValor);

      if (campoId && !esObjectId) {
        // ID numérico o personalizado → buscar por el campo indicado
        documento = await Model.findOne({ [campoId]: idValor }).lean();
      } else if (esObjectId) {
        // ObjectId estándar → findById es suficiente (funciona con _id)
        documento = await Model.findById(idValor).lean();
      } else {
        // Fallback: intentar findOne por el campo indicado o por _id
        documento = campoId
          ? await Model.findOne({ [campoId]: idValor }).lean()
          : await Model.findOne({ _id: idValor }).lean();
      }

      if (documento) {
        // Pasar req.user para humanizar campos *_por en los datos previos
        req.datosPrevios = limpiarObjeto(documento, req.user);
        console.log(`✅ Datos previos capturados [${esObjectId ? '_id' : (campoId || '_id')}=${idValor}]:`, Object.keys(req.datosPrevios));
      } else {
        console.warn(`⚠️ No se encontró documento con ${esObjectId ? '_id' : (campoId || '_id')}: ${idValor}`);
        req.datosPrevios = null;
      }
    } catch (err) {
      console.error('❌ Error capturando datos previos:', err.message);
      req.datosPrevios = null;
    }

    next();
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// registrarAuditoria
// ─────────────────────────────────────────────────────────────────────────────
const registrarAuditoria = (modulo, accionPersonalizada = null) => {
  return async (req, res, next) => {
    // ── Cache de GETs duplicados ──────────────────────────────────────────
    if (req.method === 'GET') {
      const cacheKey = generarClaveGet(req);
      const ahora = Date.now();
      const ultimoRegistro = getCache.get(cacheKey);

      if (ultimoRegistro && (ahora - ultimoRegistro) < GET_CACHE_DURATION) {
        return next(); // GET duplicado en menos de 5 s → no auditar
      }
      getCache.set(cacheKey, ahora);

      setTimeout(() => {
        if (getCache.get(cacheKey) === ahora) getCache.delete(cacheKey);
      }, GET_CACHE_DURATION + 1000);
    }

    // ── Verificar si la auditoría está desactivada ────────────────────────
    if (
      !auditGlobalEnabled ||
      req.headers['x-skip-audit'] === 'true' ||
      req.query.skipAudit === 'true'
    ) {
      return next();
    }

    // ── Determinar acción ─────────────────────────────────────────────────
    let accion = accionPersonalizada;
    if (!accion) {
      const map = { POST: 'CREATE', PUT: 'UPDATE', PATCH: 'UPDATE', DELETE: 'DELETE', GET: 'VIEW' };
      accion = map[req.method] || 'VIEW';
    }

    const startTime = Date.now();
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      const duration = Date.now() - startTime;

      // ── Datos del usuario ─────────────────────────────────────────────
      const usuarioData = req.user
        ? {
            id: req.user._id || req.user.id,
            username: req.user.username || req.user.email?.split('@')[0] || 'Sistema',
            email: req.user.email || 'sistema@local',
            rol: req.user.roles?.[0] || req.user.rol || 'usuario',
          }
        : { username: 'Sistema', email: 'sistema@local', rol: 'sistema' };

      // ── Datos previos (ya capturados por capturarDatosPrevios) ────────
      const datosPrevios = req.datosPrevios || null;

      // ── Datos nuevos ──────────────────────────────────────────────────
      // Solo guardar datos_nuevos en CREATE / UPDATE / PATCH
      let datosNuevos = null;
      if (['POST', 'PUT', 'PATCH'].includes(req.method) && res.statusCode < 400) {
        datosNuevos = extraerDatosNuevos(data, req.body, req.user);
      }

      // ── Registrar solo si corresponde ─────────────────────────────────
      const debeRegistrar =
        req.method !== 'GET' || getCache.has(generarClaveGet(req));

      if (debeRegistrar) {
        Auditoria.create({
          usuario: usuarioData,
          accion,
          modulo,
          entidad: {
            nombre: req.baseUrl + req.path,
            id: req.params.id || req.params.id_donacion || data?._id || null,
            datos_previos: datosPrevios,
            datos_nuevos: datosNuevos,
          },
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.get('User-Agent'),
          detalles: `${req.method} ${req.originalUrl}`,
          resultado: res.statusCode >= 400 ? 'ERROR' : 'EXITO',
          error_message:
            res.statusCode >= 400
              ? data?.mensaje || data?.message || `HTTP ${res.statusCode}`
              : null,
          metadata: {
            query: req.query,
            params: req.params,
            statusCode: res.statusCode,
            duration,
            metodoHttp: req.method,
            accionPersonalizada: accionPersonalizada || null,
          },
          fecha_creacion: new Date(),
        })
          .then(() => console.log(`✅ Auditoría [${modulo}] ${accion} por ${usuarioData.username}`))
          .catch((err) => console.error('❌ Error registrando auditoría:', err.message));
      }

      return originalJson(data);
    };

    next();
  };
};


module.exports = {
  registrarAuditoria,
  capturarDatosPrevios,
  setAuditEnabled,
  getAuditEnabled,
};