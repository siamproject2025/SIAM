// backend/src/Controllers/gradosController.js
const Grado = require("../Models/Grado");
const { isValidObjectId } = require("mongoose");

// Validaciones de payload básicas sobre tu esquema
function validar(body, isUpdate = false) {
  if (!isUpdate) {
    const req = [
      "grado",
      "aula",
      "anio_academico",
      "estado",
      "fecha_actualizacion",
      "timestamp",
    ];
    for (const f of req) {
      if (body[f] === undefined || body[f] === null || body[f] === "") {
        return `Falta '${f}'.`;
      }
    }
  }
  if (body.estado && !["Activo", "Inactivo"].includes(body.estado)) {
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

// POST /api/grados
exports.crearGrado = async (req, res) => {
  try {
    const error = validar(req.body);
    if (error) return res.status(400).json({ message: error });

    const creado = await Grado.create(req.body);
    return res.status(201).json({ message: "Grado creado", data: creado });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Ya existe este grado para el mismo año académico." });
    }
    return res.status(500).json({ message: "Error al crear grado", error: err.message });
  }
};

// GET /api/grados
// filtros: ?q=10mo&anio_academico=2024&estado=Activo&page=1&limit=10&sort=grado:asc
exports.listarGrados = async (req, res) => {
  try {
    const {
      q,
      anio_academico,
      estado,
      page = 1,
      limit = 10,
      sort = "grado:asc",
    } = req.query;

    const where = {};
    if (q) {
      where.$or = [
        { grado: { $regex: q, $options: "i" } },
        { descripcion: { $regex: q, $options: "i" } },
        { aula: { $regex: q, $options: "i" } }, // Búsqueda por aula también
        { "materias_grado.nombre": { $regex: q, $options: "i" } },
        { "horarios_grado.materia.nombre": { $regex: q, $options: "i" } },
      ];
    }
    if (anio_academico) where.anio_academico = Number(anio_academico);
    if (estado) where.estado = estado;

    const sortObj = {};
    sort.split(",").forEach((pair) => {
      const [f, dir] = pair.split(":");
      if (f) sortObj[f.trim()] = (dir || "asc").toLowerCase() === "desc" ? -1 : 1;
    });

    const pageNum = Math.max(parseInt(page, 10), 1);
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

// GET /api/grados/:id
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

// PUT /api/grados/:id
exports.actualizarGrado = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "ID inválido." });

    const error = validar(req.body, true);
    if (error) return res.status(400).json({ message: error });

    const actualizado = await Grado.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!actualizado) return res.status(404).json({ message: "Grado no encontrado" });
    return res.json({ message: "Grado actualizado", data: actualizado });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Conflicto: ya existe este grado para el mismo año." });
    }
    return res.status(500).json({ message: "Error al actualizar grado", error: err.message });
  }
};

// DELETE /api/grados/:id (delete definitivo)
exports.eliminarGrado = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id))
      return res.status(400).json({ message: "ID inválido." });

    const eliminado = await Grado.findByIdAndDelete(id);

    if (!eliminado)
      return res.status(404).json({ message: "Grado no encontrado o ya eliminado." });

    return res.json({
      message: "Grado eliminado permanentemente.",
      data: eliminado,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error al eliminar el grado permanentemente.",
      error: err.message,
    });
  }
};

// PATCH /api/grados/:id/restaurar
exports.restaurarGrado = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "ID inválido." });

    const restaurado = await Grado.findByIdAndUpdate(id, { estado: "Activo" }, { new: true });
    if (!restaurado) return res.status(404).json({ message: "Grado no encontrado" });
    return res.json({ message: "Grado restaurado", data: restaurado });
  } catch (err) {
    return res.status(500).json({ message: "Error al restaurar grado", error: err.message });
  }
};