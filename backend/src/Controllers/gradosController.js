// backend/src/Controllers/gradosController.js
const Grado = require("../Models/Grado");
const { isValidObjectId } = require("mongoose");

// ── Helper: datos del usuario desde el token ─────────────────
const getUserInfo = (req) => {
  const user = req.user;
  if (!user) return { id: "sistema", email: "sistema@escuela.edu" };
  return {
    id:    user._id || user.id || user.sub,
    email: user.email || "sistema@escuela.edu",
  };
};

// ── Helper: detectar cambios entre dos objetos ───────────────
const detectarCambios = (anterior, nuevo) => {
  if (!anterior || !nuevo) return { cambios: {}, descripcion: "" };

  const camposIgnorar = [
    "_id", "__v",
    "creado_por", "creado_por_email", "fecha_creacion",
    "actualizado_por", "actualizado_por_email", "fecha_actualizacion_audit",
    "eliminado_por", "eliminado_por_email", "fecha_eliminacion",
    "createdAt", "updatedAt",
    // subdocumentos grandes — se registran simplemente como "modificado"
    "horarios_grado", "materias_grado",
  ];

  const cambios = {};
  const campos = new Set([...Object.keys(anterior), ...Object.keys(nuevo)]);

  for (const campo of campos) {
    if (camposIgnorar.includes(campo)) continue;
    if (JSON.stringify(anterior[campo]) !== JSON.stringify(nuevo[campo])) {
      cambios[campo] = {
        anterior: anterior[campo] ?? "vacío",
        nuevo:    nuevo[campo]    ?? "vacío",
      };
    }
  }

  const descripcion = Object.keys(cambios)
    .map(c => {
      const ant = String(cambios[c].anterior).substring(0, 50);
      const nvo = String(cambios[c].nuevo).substring(0, 50);
      return `${c}: "${ant}" → "${nvo}"`;
    })
    .join("; ");

  return { cambios, descripcion };
};

// ── Validación básica de payload ─────────────────────────────
function validar(body, isUpdate = false) {
  if (!isUpdate) {
    const req = ["grado", "aula", "anio_academico", "estado", "fecha_actualizacion", "timestamp"];
    for (const f of req) {
      if (body[f] === undefined || body[f] === null || body[f] === "") {
        return `Falta '${f}'.`;
      }
    }
  }
  if (body.estado && !["Activo","Inactivo"].includes(body.estado)) {
    return "estado debe ser 'Activo' o 'Inactivo'.";
  }
  if (body.aula !== undefined && (!body.aula || body.aula.trim() === "")) {
    return "aula es requerido.";
  }
  if (body.horarios_grado && !Array.isArray(body.horarios_grado)) {
    return "horarios_grado debe ser un arreglo.";
  }
  if (body.materias_grado && !Array.isArray(body.materias_grado)) {
    return "materias_grado debe ser un arreglo.";
  }
  return null;
}

// ── POST /api/grados ─────────────────────────────────────────
exports.crearGrado = async (req, res) => {
  try {
    const error = validar(req.body);
    if (error) return res.status(400).json({ message: error });

    const usuario = getUserInfo(req);
    const ahora   = new Date();

    const creado = await Grado.create({
      ...req.body,
      // Auditoría
      creado_por:            usuario.id,
      creado_por_email:      usuario.email,
      fecha_creacion:        ahora,
      actualizado_por:       usuario.id,
      actualizado_por_email: usuario.email,
      fecha_actualizacion_audit: ahora,
    });

    console.log(`✅ Grado creado por ${usuario.email}: ${creado.grado} (${creado.anio_academico})`);

    return res.status(201).json({
      message: "Grado creado",
      data: creado,
      audit: {
        creado_por:    usuario.email,
        fecha_creacion: ahora,
      },
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Ya existe este grado para el mismo año académico." });
    }
    return res.status(500).json({ message: "Error al crear grado", error: err.message });
  }
};

// ── GET /api/grados ──────────────────────────────────────────
// filtros: ?q=10mo&anio_academico=2024&estado=Activo&page=1&limit=10&sort=grado:asc
exports.listarGrados = async (req, res) => {
  try {
    const {
      q,
      anio_academico,
      estado,
      page  = 1,
      limit = 10,
      sort  = "grado:asc",
    } = req.query;

    const where = {};
    if (q) {
      where.$or = [
        { grado:       { $regex: q, $options: "i" } },
        { descripcion: { $regex: q, $options: "i" } },
        { aula:        { $regex: q, $options: "i" } },
        { "materias_grado.nombre":          { $regex: q, $options: "i" } },
        { "horarios_grado.materia.nombre":  { $regex: q, $options: "i" } },
      ];
    }
    if (anio_academico) where.anio_academico = Number(anio_academico);
    if (estado)         where.estado = estado;

    const sortObj = {};
    sort.split(",").forEach((pair) => {
      const [f, dir] = pair.split(":");
      if (f) sortObj[f.trim()] = (dir || "asc").toLowerCase() === "desc" ? -1 : 1;
    });

    const pageNum  = Math.max(parseInt(page,  10), 1);
    const limitNum = Math.max(parseInt(limit, 10), 1);

    const [items, total] = await Promise.all([
      Grado.find(where).sort(sortObj).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
      Grado.countDocuments(where),
    ]);

    return res.json({ total, page: pageNum, pages: Math.ceil(total / limitNum), items });
  } catch (err) {
    return res.status(500).json({ message: "Error al listar grados", error: err.message });
  }
};

// ── GET /api/grados/:id ──────────────────────────────────────
exports.obtenerGrado = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "ID inválido." });

    const data = await Grado.findById(id).lean();
    if (!data) return res.status(404).json({ message: "Grado no encontrado" });
    return res.json({ data });
  } catch (err) {
    return res.status(500).json({ message: "Error al obtener grado", error: err.message });
  }
};

// ── PUT /api/grados/:id ──────────────────────────────────────
exports.actualizarGrado = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "ID inválido." });

    const error = validar(req.body, true);
    if (error) return res.status(400).json({ message: error });

    const usuario       = getUserInfo(req);
    const gradoAnterior = await Grado.findById(id).lean();
    if (!gradoAnterior) return res.status(404).json({ message: "Grado no encontrado" });

    const ahora = new Date();
    const updateData = {
      ...req.body,
      // Auditoría de actualización
      actualizado_por:           usuario.id,
      actualizado_por_email:     usuario.email,
      fecha_actualizacion_audit: ahora,
    };

    const { cambios, descripcion } = detectarCambios(gradoAnterior, updateData);

    if (Object.keys(cambios).length > 0) {
      console.log(`📝 Grado actualizado por ${usuario.email}:`, descripcion);
    } else {
      console.log(`ℹ️ Sin cambios detectados en actualización por ${usuario.email}`);
    }

    const actualizado = await Grado.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    return res.json({
      message: "Grado actualizado",
      data: actualizado,
      audit: {
        actualizado_por:     usuario.email,
        fecha_actualizacion: ahora,
        cambios_realizados:  Object.keys(cambios).length,
        detalles_cambios:    descripcion || "Sin cambios significativos",
      },
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Conflicto: ya existe este grado para el mismo año." });
    }
    return res.status(500).json({ message: "Error al actualizar grado", error: err.message });
  }
};

// ── DELETE /api/grados/:id ───────────────────────────────────
exports.eliminarGrado = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "ID inválido." });

    const usuario = getUserInfo(req);
    const grado   = await Grado.findById(id).lean();
    if (!grado) return res.status(404).json({ message: "Grado no encontrado o ya eliminado." });

    const datosEliminados = {
      id:             grado._id,
      grado:          grado.grado,
      aula:           grado.aula,
      anio_academico: grado.anio_academico,
      creado_por:     grado.creado_por_email || grado.creado_por,
      fecha_creacion: grado.fecha_creacion,
    };

    console.log(`🗑️ Grado "${grado.grado}" eliminado por ${usuario.email}`);

    await Grado.findByIdAndDelete(id);

    return res.json({
      message: "Grado eliminado permanentemente.",
      data: datosEliminados,
      audit: {
        eliminado_por:    usuario.email,
        fecha_eliminacion: new Date(),
        grado_eliminado:  datosEliminados,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Error al eliminar el grado.", error: err.message });
  }
};

// ── PATCH /api/grados/:id/restaurar ─────────────────────────
exports.restaurarGrado = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "ID inválido." });

    const usuario = getUserInfo(req);
    const ahora   = new Date();

    const restaurado = await Grado.findByIdAndUpdate(
      id,
      {
        estado: "Activo",
        actualizado_por:           usuario.id,
        actualizado_por_email:     usuario.email,
        fecha_actualizacion_audit: ahora,
      },
      { new: true }
    );
    if (!restaurado) return res.status(404).json({ message: "Grado no encontrado" });

    console.log(`✅ Grado "${restaurado.grado}" restaurado por ${usuario.email}`);

    return res.json({
      message: "Grado restaurado",
      data: restaurado,
      audit: { restaurado_por: usuario.email, fecha: ahora },
    });
  } catch (err) {
    return res.status(500).json({ message: "Error al restaurar grado", error: err.message });
  }
};

// ── GET /api/grados/:id/auditoria ───────────────────────────
exports.getGradoAuditoria = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "ID inválido." });

    const grado = await Grado.findById(id).lean();
    if (!grado) return res.status(404).json({ message: "Grado no encontrado" });

    return res.json({
      id:    grado._id,
      grado: grado.grado,
      creado: {
        por:   grado.creado_por_email  || grado.creado_por,
        fecha: grado.fecha_creacion,
      },
      ultima_actualizacion: {
        por:   grado.actualizado_por_email || grado.actualizado_por,
        fecha: grado.fecha_actualizacion_audit,
      },
      historial: {
        fecha_creacion:            grado.fecha_creacion,
        fecha_ultima_modificacion: grado.fecha_actualizacion_audit || grado.fecha_creacion,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Error al obtener auditoría del grado", error: err.message });
  }
};