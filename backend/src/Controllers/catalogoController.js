// controllers/catalogoController.js
// CRUD completo para todos los catálogos del sistema.
// Sin autenticación — solo lógica de negocio y manejo de errores.

const Catalogo = require("../Models/Catalogo");

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const ok  = (res, data, status = 200) => res.status(status).json({ ok: true,  ...data });
const err = (res, mensaje, status = 400) => res.status(status).json({ ok: false, mensaje });

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/catalogos
// Devuelve todos los catálogos activos, opcionalmente filtrados por ?modulo= y ?tipo=
// ─────────────────────────────────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const filtro = {};
    if (req.query.modulo) filtro.modulo = req.query.modulo.toLowerCase();
    if (req.query.tipo)   filtro.tipo   = req.query.tipo.toLowerCase();
    if (req.query.activo !== undefined)
      filtro.activo = req.query.activo === "false" ? false : true;

    const catalogos = await Catalogo.find(filtro).sort({ modulo: 1, tipo: 1, orden: 1, valor: 1 });
    ok(res, { data: catalogos, total: catalogos.length });
  } catch (e) {
    err(res, e.message, 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/catalogos/estructura
// Devuelve el mapa de módulos → tipos disponibles (para construir el sidebar)
// ─────────────────────────────────────────────────────────────────────────────
exports.getEstructura = async (_req, res) => {
  try {
    ok(res, { data: Catalogo.TIPOS_POR_MODULO });
  } catch (e) {
    err(res, e.message, 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/catalogos/:modulo
// Devuelve todos los ítems de un módulo, agrupados por tipo
// ─────────────────────────────────────────────────────────────────────────────
exports.getByModulo = async (req, res) => {
  try {
    const { modulo } = req.params;
    const catalogos = await Catalogo
      .find({ modulo: modulo.toLowerCase(), activo: true })
      .sort({ tipo: 1, orden: 1, valor: 1 });

    // Agrupa por tipo para facilitar el consumo en frontend
    const agrupado = catalogos.reduce((acc, item) => {
      if (!acc[item.tipo]) acc[item.tipo] = [];
      acc[item.tipo].push(item);
      return acc;
    }, {});

    ok(res, { data: agrupado, modulo });
  } catch (e) {
    err(res, e.message, 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/catalogos/:modulo/:tipo
// Devuelve la lista plana de valores para un módulo+tipo específico
// ─────────────────────────────────────────────────────────────────────────────
exports.getByModuloTipo = async (req, res) => {
  try {
    const { modulo, tipo } = req.params;

    // Si viene ?activo=all  → sin filtro de estado
    // Si viene ?activo=false → solo inactivos
    // Por defecto (omitido)  → solo activos
    const filtro = { modulo: modulo.toLowerCase(), tipo: tipo.toLowerCase() };

    if (req.query.activo === undefined || req.query.activo === "true") {
      filtro.activo = true;
    } else if (req.query.activo === "false") {
      filtro.activo = false;
    }
    // "all" → no se agrega filtro de activo

    const catalogos = await Catalogo
      .find(filtro)
      .sort({ orden: 1, valor: 1 });

    ok(res, { data: catalogos, modulo, tipo });
  } catch (e) {
    err(res, e.message, 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/catalogos/id/:id
// Devuelve un ítem por su _id
// ─────────────────────────────────────────────────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const item = await Catalogo.findById(req.params.id);
    if (!item) return err(res, "Catálogo no encontrado", 404);
    ok(res, { data: item });
  } catch (e) {
    err(res, e.message, 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/catalogos
// Crea un nuevo ítem de catálogo
// Body: { modulo, tipo, valor, etiqueta?, descripcion?, orden?, activo? }
// ─────────────────────────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { modulo, tipo, valor, etiqueta, descripcion, orden, activo } = req.body;

    // Validaciones básicas
    if (!modulo) return err(res, "El campo 'modulo' es obligatorio");
    if (!tipo)   return err(res, "El campo 'tipo' es obligatorio");
    if (!valor)  return err(res, "El campo 'valor' es obligatorio");

    // Verificar que el módulo es válido
    const modulosValidos = Object.keys(Catalogo.TIPOS_POR_MODULO);
    if (!modulosValidos.includes(modulo.toLowerCase()))
      return err(res, `Módulo inválido. Valores permitidos: ${modulosValidos.join(", ")}`);

    // Verificar que el tipo pertenece al módulo
    const tiposDelModulo = Catalogo.TIPOS_POR_MODULO[modulo.toLowerCase()];
    if (!tiposDelModulo.includes(tipo.toLowerCase()))
      return err(res, `Tipo inválido para '${modulo}'. Valores permitidos: ${tiposDelModulo.join(", ")}`);

    const nuevo = await Catalogo.create({
      modulo: modulo.toLowerCase(),
      tipo:   tipo.toLowerCase(),
      valor:  valor.trim(),
      etiqueta:    etiqueta    || "",
      descripcion: descripcion || "",
      orden:       orden       ?? 0,
      activo:      activo      ?? true,
    });

    ok(res, { data: nuevo, mensaje: "Catálogo creado correctamente" }, 201);
  } catch (e) {
    if (e.code === 11000)
      return err(res, `Ya existe un registro con ese valor en ${req.body.modulo}/${req.body.tipo}`);
    err(res, e.message, 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/catalogos/:id
// Actualiza un ítem existente
// ─────────────────────────────────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const { valor, etiqueta, descripcion, orden, activo } = req.body;

    const item = await Catalogo.findById(req.params.id);
    if (!item) return err(res, "Catálogo no encontrado", 404);

    // Solo se actualizan estos campos; modulo+tipo son inmutables una vez creados
    if (valor       !== undefined) item.valor       = valor.trim();
    if (etiqueta    !== undefined) item.etiqueta    = etiqueta;
    if (descripcion !== undefined) item.descripcion = descripcion;
    if (orden       !== undefined) item.orden       = orden;
    if (activo      !== undefined) item.activo      = activo;

    await item.save();
    ok(res, { data: item, mensaje: "Catálogo actualizado correctamente" });
  } catch (e) {
    if (e.code === 11000)
      return err(res, "Ya existe un registro con ese valor en este módulo/tipo");
    err(res, e.message, 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/catalogos/:id/toggle
// Activa / desactiva un ítem (soft delete)
// ─────────────────────────────────────────────────────────────────────────────
exports.toggle = async (req, res) => {
  try {
    const item = await Catalogo.findById(req.params.id);
    if (!item) return err(res, "Catálogo no encontrado", 404);

    item.activo = !item.activo;
    await item.save();

    ok(res, {
      data: item,
      mensaje: `Catálogo ${item.activo ? "activado" : "desactivado"} correctamente`,
    });
  } catch (e) {
    err(res, e.message, 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/catalogos/:id
// Elimina permanentemente un ítem
// ─────────────────────────────────────────────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    const item = await Catalogo.findByIdAndDelete(req.params.id);
    if (!item) return err(res, "Catálogo no encontrado", 404);
    ok(res, { mensaje: "Catálogo eliminado correctamente" });
  } catch (e) {
    err(res, e.message, 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/catalogos/modulo/:modulo/tipo/:tipo
// Elimina todos los ítems de un módulo+tipo (limpieza masiva)
// ─────────────────────────────────────────────────────────────────────────────
exports.removeByModuloTipo = async (req, res) => {
  try {
    const { modulo, tipo } = req.params;
    const resultado = await Catalogo.deleteMany({
      modulo: modulo.toLowerCase(),
      tipo:   tipo.toLowerCase(),
    });
    ok(res, {
      mensaje: `${resultado.deletedCount} registros eliminados de ${modulo}/${tipo}`,
      eliminados: resultado.deletedCount,
    });
  } catch (e) {
    err(res, e.message, 500);
  }
};