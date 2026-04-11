// Controllers/ordenCompraController.js
const OrdenCompra = require("../Models/OrdenCompra");

// ── Helper: detectar cambios campo a campo ───────────────────
const detectarCambios = (anterior, nuevo) => {
  if (!anterior || !nuevo) return { cambios: {}, descripcion: '' };

  const ignorar = new Set([
    '_id', '__v', 'fecha_creacion', 'fecha_actualizacion',
    'creado_por', 'creado_por_email',
    'actualizado_por', 'actualizado_por_email',
    'createdAt', 'updatedAt'
  ]);

  const cambios = {};
  const campos  = new Set([...Object.keys(anterior), ...Object.keys(nuevo)]);

  for (const campo of campos) {
    if (ignorar.has(campo)) continue;
    if (JSON.stringify(anterior[campo]) !== JSON.stringify(nuevo[campo])) {
      cambios[campo] = {
        anterior: anterior[campo] ?? 'vacío',
        nuevo:    nuevo[campo]    ?? 'vacío'
      };
    }
  }

  const descripcion = Object.entries(cambios)
    .map(([c, v]) =>
      `${c}: "${String(v.anterior).substring(0, 50)}" → "${String(v.nuevo).substring(0, 50)}"`)
    .join('; ');

  return { cambios, descripcion };
};

// ── Helper: extraer usuario del token ────────────────────────
const getUserInfo = (req) => {
  const u = req.user;
  if (!u) return { id: 'sistema', email: 'sistema@escuela.edu' };
  return {
    id:    u._id || u.id || u.sub,
    email: u.email || 'sistema@escuela.edu'
  };
};

// ── GET /api/compras ─────────────────────────────────────────
exports.getOrdenes = async (req, res) => {
  try {
    const ordenes = await OrdenCompra.find()
      .populate('proveedor_id', 'nombre empresa direccion telefono')
      .sort({ createdAt: -1 });
    res.json(ordenes);
  } catch (err) {
    console.error('❌ getOrdenes:', err);
    res.status(500).json({ message: "Error al obtener órdenes", error: err.message });
  }
};

// ── GET /api/compras/:id ─────────────────────────────────────
exports.getOrdenById = async (req, res) => {
  try {
    const orden = await OrdenCompra.findById(req.params.id)
      .populate('proveedor_id', 'nombre empresa direccion telefono');
    if (!orden) return res.status(404).json({ message: "Orden no encontrada" });
    res.json(orden);
  } catch (err) {
    console.error('❌ getOrdenById:', err);
    res.status(500).json({ message: "Error al buscar la orden", error: err.message });
  }
};

// ── POST /api/compras ────────────────────────────────────────
exports.createOrden = async (req, res) => {
  try {
    console.log('🚀 Creando orden de compra...');
    const usuario = getUserInfo(req);
    console.log(`👤 Usuario: ${usuario.email} (${usuario.id})`);

    const ordenData = {
      ...req.body,
      // Auditoría
      creado_por:           usuario.id,
      creado_por_email:     usuario.email,
      fecha_creacion:       new Date(),
      actualizado_por:      usuario.id,
      actualizado_por_email:usuario.email,
      fecha_actualizacion:  new Date()
    };

    const orden = await OrdenCompra.create(ordenData);

    console.log(`✅ Orden creada por ${usuario.email}: ${orden.numero}`);

    res.status(201).json({
      success: true,
      message: 'Orden de compra creada exitosamente',
      data:    orden,
      audit: {
        creado_por:    usuario.email,
        fecha_creacion:orden.fecha_creacion
      }
    });
  } catch (err) {
    console.error('❌ createOrden:', err);
    res.status(400).json({
      success: false,
      message: 'Error al crear la orden',
      error:   err.message
    });
  }
};

// ── PUT /api/compras/:id ─────────────────────────────────────
exports.updateOrden = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = getUserInfo(req);
    console.log(`👤 Usuario: ${usuario.email} | Actualizando orden ${id}`);

    const ordenAnterior = await OrdenCompra.findById(id);
    if (!ordenAnterior) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    // Campos permitidos para actualizar
    const ordenData = {
      ...(req.body.numero    !== undefined && { numero:       req.body.numero    }),
      ...(req.body.estado    !== undefined && { estado:       req.body.estado    }),
      ...(req.body.fecha     !== undefined && { fecha:        req.body.fecha     }),
      ...(req.body.items     !== undefined && { items:        req.body.items     }),
      ...(req.body.proveedor_id !== undefined && { proveedor_id: req.body.proveedor_id }),
      // Auditoría
      actualizado_por:       usuario.id,
      actualizado_por_email: usuario.email,
      fecha_actualizacion:   new Date()
    };

    // Detectar cambios para logging
    const anteriorObj = ordenAnterior.toObject ? ordenAnterior.toObject() : ordenAnterior;
    const { cambios, descripcion } = detectarCambios(anteriorObj, { ...anteriorObj, ...ordenData });

    if (Object.keys(cambios).length > 0) {
      console.log(`📝 Cambios por ${usuario.email}: ${descripcion}`);
    } else {
      console.log(`ℹ️ Sin cambios detectados (${usuario.email})`);
    }

    const ordenActualizada = await OrdenCompra.findByIdAndUpdate(
      id,
      ordenData,
      { new: true, runValidators: true }
    ).populate('proveedor_id', 'nombre empresa direccion telefono');

    console.log(`✅ Orden ${ordenActualizada.numero} actualizada por ${usuario.email}`);

    res.status(200).json({
      success: true,
      message: 'Orden actualizada exitosamente',
      data:    ordenActualizada,
      audit: {
        actualizado_por:      usuario.email,
        fecha_actualizacion:  ordenActualizada.fecha_actualizacion,
        cambios_realizados:   Object.keys(cambios).length,
        detalles_cambios:     descripcion || 'Sin cambios significativos'
      }
    });
  } catch (err) {
    console.error('❌ updateOrden:', err);
    res.status(400).json({
      success: false,
      message: 'Error al actualizar la orden',
      error:   err.message
    });
  }
};

// ── DELETE /api/compras/:id ──────────────────────────────────
exports.deleteOrden = async (req, res) => {
  try {
    console.log('🗑️ Eliminando orden...');
    const usuario = getUserInfo(req);
    console.log(`👤 Usuario: ${usuario.email}`);

    const ordenEliminada = await OrdenCompra.findById(req.params.id);
    if (!ordenEliminada) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    const datosEliminados = {
      id:               ordenEliminada._id,
      numero:           ordenEliminada.numero,
      estado:           ordenEliminada.estado,
      creado_por:       ordenEliminada.creado_por_email || ordenEliminada.creado_por,
      fecha_creacion:   ordenEliminada.fecha_creacion,
      ultima_actualizacion: ordenEliminada.fecha_actualizacion,
      actualizado_por:  ordenEliminada.actualizado_por_email
    };

    console.log(`📋 Orden a eliminar: ${datosEliminados.numero}`);
    console.log(`🗑️ Eliminado por: ${usuario.email}`);

    await OrdenCompra.findByIdAndDelete(req.params.id);

    console.log(`✅ Orden eliminada por ${usuario.email}`);

    res.json({
      success: true,
      message: 'Orden eliminada correctamente',
      data: { id: req.params.id, numero: datosEliminados.numero },
      audit: {
        eliminado_por:    usuario.email,
        fecha_eliminacion:new Date(),
        orden_eliminada:  datosEliminados
      }
    });
  } catch (err) {
    console.error('❌ deleteOrden:', err);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la orden',
      error:   err.message
    });
  }
};

// ── GET /api/compras/:id/auditoria ───────────────────────────
exports.getOrdenAuditoria = async (req, res) => {
  try {
    const orden = await OrdenCompra.findById(req.params.id);
    if (!orden) return res.status(404).json({ message: "Orden no encontrada" });

    res.json({
      id:     orden._id,
      numero: orden.numero,
      estado: orden.estado,
      creado: {
        por:   orden.creado_por_email || orden.creado_por,
        fecha: orden.fecha_creacion
      },
      ultima_actualizacion: {
        por:   orden.actualizado_por_email || orden.actualizado_por,
        fecha: orden.fecha_actualizacion
      },
      historial: {
        fecha_creacion:           orden.fecha_creacion,
        fecha_ultima_modificacion:orden.fecha_actualizacion || orden.fecha_creacion
      }
    });
  } catch (err) {
    console.error('❌ getOrdenAuditoria:', err);
    res.status(500).json({ message: "Error al obtener auditoría", error: err.message });
  }
};

// Agregar adjuntos a una orden existente
exports.agregarAdjuntos = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.adjuntosProcessados || req.adjuntosProcessados.length === 0) {
      return res.status(400).json({ error: "No hay archivos para adjuntar" });
    }

    const orden = await OrdenCompra.findById(id);
    if (!orden) {
      // Limpiar archivos si la orden no existe
      if (req.files) {
        const fs = require('fs');
        req.files.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (e) {
            console.error('Error eliminando archivo:', e);
          }
        });
      }
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    // Verificar que no exceda máximo de 5 adjuntos
    if (orden.adjuntos.length + req.adjuntosProcessados.length > 5) {
      // Limpiar archivos
      if (req.files) {
        const fs = require('fs');
        req.files.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (e) {
            console.error('Error eliminando archivo:', e);
          }
        });
      }
      return res.status(400).json({ error: "Límite de 5 adjuntos por orden excedido" });
    }

    // Agregar nuevos adjuntos
    orden.adjuntos = orden.adjuntos.concat(req.adjuntosProcessados);
    await orden.save();

    const ordenActualizada = await OrdenCompra.findById(id)
      .populate("proveedor_id", "nombre empresa")
      .lean();

    res.status(200).json({
      ...ordenActualizada,
      mensaje: `${req.adjuntosProcessados.length} adjunto(s) agregado(s) exitosamente`
    });
  } catch (err) {
    // Limpiar archivos si hay error
    if (req.files) {
      const fs = require('fs');
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (e) {
          console.error('Error eliminando archivo:', e);
        }
      });
    }
    res.status(400).json({ error: err.message });
  }
};

// Eliminar adjunto específico de una orden
exports.eliminarAdjunto = async (req, res) => {
  try {
    const { id, adjuntoIndex } = req.params;
    const indexInt = parseInt(adjuntoIndex);

    if (isNaN(indexInt)) {
      return res.status(400).json({ error: "Índice de adjunto inválido" });
    }

    const orden = await OrdenCompra.findById(id);
    if (!orden) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    if (indexInt < 0 || indexInt >= orden.adjuntos.length) {
      return res.status(400).json({ error: "Adjunto no encontrado" });
    }

    // Eliminar archivo del disco
    const fs = require('fs');
    const path = require('path');
    const rutaArchivo = path.join(__dirname, '../../uploads', orden.adjuntos[indexInt].ruta);
    
    try {
      fs.unlinkSync(rutaArchivo);
    } catch (e) {
      console.error('Error eliminando archivo del disco:', e);
    }

    // Eliminar adjunto del array
    orden.adjuntos.splice(indexInt, 1);
    await orden.save();

    res.status(200).json({ mensaje: "Adjunto eliminado correctamente" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

