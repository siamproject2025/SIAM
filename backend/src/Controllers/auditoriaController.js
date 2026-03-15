// controllers/auditoriaController.js
const Auditoria = require('../Models/Auditoria');
const { Parser } = require('json2csv');

exports.obtenerRegistros = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      busqueda,
      modulo,
      accion,
      resultado,
      fechaInicio,
      fechaFin,
      usuario
    } = req.query;

    // Construir filtros
    const filtros = {};

    if (modulo && modulo !== 'todos') filtros.modulo = modulo;
    if (accion && accion !== 'todos') filtros.accion = accion;
    if (resultado && resultado !== 'todos') filtros.resultado = resultado;
    
    if (fechaInicio || fechaFin) {
      filtros.fecha_creacion = {};
      if (fechaInicio) filtros.fecha_creacion.$gte = new Date(fechaInicio);
      if (fechaFin) {
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);
        filtros.fecha_creacion.$lte = fin;
      }
    }

    if (busqueda) {
      filtros.$or = [
        { 'usuario.username': { $regex: busqueda, $options: 'i' } },
        { 'usuario.email': { $regex: busqueda, $options: 'i' } },
        { detalles: { $regex: busqueda, $options: 'i' } },
        { modulo: { $regex: busqueda, $options: 'i' } }
      ];
    }

    if (usuario) {
      filtros['usuario.username'] = { $regex: usuario, $options: 'i' };
    }

    // Obtener total para paginación
    const total = await Auditoria.countDocuments(filtros);

    // Obtener registros paginados
    const registros = await Auditoria.find(filtros)
      .sort({ fecha_creacion: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Obtener estadísticas
    const stats = {
      total,
      exitos: await Auditoria.countDocuments({ ...filtros, resultado: 'EXITO' }),
      errores: await Auditoria.countDocuments({ ...filtros, resultado: 'ERROR' }),
      denegados: await Auditoria.countDocuments({ ...filtros, resultado: 'DENEGADO' })
    };

    res.json({
      registros,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      stats
    });
  } catch (error) {
    console.error('Error obteniendo registros:', error);
    res.status(500).json({ mensaje: 'Error al obtener los registros de auditoría' });
  }
};

exports.exportarRegistros = async (req, res) => {
  try {
    const filtros = { ...req.query };
    
    // Eliminar parámetros de paginación
    delete filtros.page;
    delete filtros.limit;

    // Convertir fechas si existen
    if (filtros.fechaInicio || filtros.fechaFin) {
      filtros.fecha_creacion = {};
      if (filtros.fechaInicio) {
        filtros.fecha_creacion.$gte = new Date(filtros.fechaInicio);
        delete filtros.fechaInicio;
      }
      if (filtros.fechaFin) {
        const fin = new Date(filtros.fechaFin);
        fin.setHours(23, 59, 59, 999);
        filtros.fecha_creacion.$lte = fin;
        delete filtros.fechaFin;
      }
    }

    // Obtener todos los registros
    const registros = await Auditoria.find(filtros)
      .sort({ fecha_creacion: -1 });

    // Preparar datos para CSV
    const datosCSV = registros.map(r => ({
      fecha: r.fecha_creacion,
      usuario: r.usuario?.username || 'Sistema',
      email: r.usuario?.email || '',
      rol: r.usuario?.rol || '',
      accion: r.accion,
      modulo: r.modulo,
      detalles: r.detalles,
      resultado: r.resultado,
      ip: r.ip_address,
      error: r.error_message || ''
    }));

    // Convertir a CSV
    const fields = ['fecha', 'usuario', 'email', 'rol', 'accion', 'modulo', 'detalles', 'resultado', 'ip', 'error'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(datosCSV);

    // Configurar respuesta
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=bitacora.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exportando registros:', error);
    res.status(500).json({ mensaje: 'Error al exportar la bitácora' });
  }
};

// Obtener estadísticas rápidas
exports.obtenerEstadisticas = async (req, res) => {
  try {
    const { dias = 30 } = req.query;
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - parseInt(dias));

    const stats = {
      total: await Auditoria.countDocuments({ fecha_creacion: { $gte: fechaLimite } }),
      porModulo: await Auditoria.aggregate([
        { $match: { fecha_creacion: { $gte: fechaLimite } } },
        { $group: { _id: '$modulo', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      porAccion: await Auditoria.aggregate([
        { $match: { fecha_creacion: { $gte: fechaLimite } } },
        { $group: { _id: '$accion', count: { $sum: 1 } } }
      ]),
      porResultado: await Auditoria.aggregate([
        { $match: { fecha_creacion: { $gte: fechaLimite } } },
        { $group: { _id: '$resultado', count: { $sum: 1 } } }
      ]),
      usuariosActivos: await Auditoria.aggregate([
        { $match: { 
          fecha_creacion: { $gte: fechaLimite },
          'usuario.username': { $exists: true }
        } },
        { $group: { _id: '$usuario.username', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    };

    res.json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ mensaje: 'Error al obtener estadísticas' });
  }
};

// Limpiar registros antiguos
exports.limpiarRegistrosAntiguos = async (req, res) => {
  try {
    const { dias = 90 } = req.body;
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - parseInt(dias));

    const resultado = await Auditoria.deleteMany({ 
      fecha_creacion: { $lt: fechaLimite },
      modulo: { $ne: 'AUDITORIA' } // Preservar auditoría de auditoría
    });

    // Registrar la limpieza
    await Auditoria.create({
      usuario: {
        id: req.usuario?._id,
        username: req.usuario?.username || 'Sistema',
        email: req.usuario?.email || '',
        rol: req.usuario?.rol || 'sistema'
      },
      accion: 'DELETE',
      modulo: 'AUDITORIA',
      detalles: `Limpieza de registros anteriores a ${dias} días`,
      resultado: 'EXITO',
      metadata: {
        registrosEliminados: resultado.deletedCount,
        dias: parseInt(dias),
        fechaLimite
      }
    });

    res.json({ 
      mensaje: 'Registros antiguos eliminados correctamente',
      registrosEliminados: resultado.deletedCount 
    });
  } catch (error) {
    console.error('Error limpiando registros:', error);
    res.status(500).json({ mensaje: 'Error al limpiar registros antiguos' });
  }
};

// Obtener registro por ID
exports.obtenerRegistroPorId = async (req, res) => {
  try {
    const registro = await Auditoria.findById(req.params.id);
    
    if (!registro) {
      return res.status(404).json({ mensaje: 'Registro no encontrado' });
    }

    res.json(registro);
  } catch (error) {
    console.error('Error obteniendo registro:', error);
    res.status(500).json({ mensaje: 'Error al obtener el registro' });
  }
};

// Obtener resumen por período
exports.obtenerResumenPorPeriodo = async (req, res) => {
  try {
    const { periodo = 'dia' } = req.query; // dia, semana, mes
    const fechaActual = new Date();
    let fechaInicio;

    switch(periodo) {
      case 'dia':
        fechaInicio = new Date(fechaActual.setHours(0,0,0,0));
        break;
      case 'semana':
        fechaInicio = new Date(fechaActual.setDate(fechaActual.getDate() - 7));
        break;
      case 'mes':
        fechaInicio = new Date(fechaActual.setMonth(fechaActual.getMonth() - 1));
        break;
      default:
        fechaInicio = new Date(fechaActual.setHours(0,0,0,0));
    }

    const resumen = await Auditoria.aggregate([
      {
        $match: {
          fecha_creacion: { $gte: fechaInicio }
        }
      },
      {
        $group: {
          _id: {
            modulo: '$modulo',
            accion: '$accion',
            resultado: '$resultado'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.modulo',
          acciones: {
            $push: {
              accion: '$_id.accion',
              resultado: '$_id.resultado',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      }
    ]);

    res.json({
      periodo,
      fechaInicio,
      resumen
    });
  } catch (error) {
    console.error('Error obteniendo resumen:', error);
    res.status(500).json({ mensaje: 'Error al obtener resumen' });
  }
};

// Obtener actividad de un usuario específico
exports.obtenerActividadUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { limit = 50 } = req.query;

    const actividades = await Auditoria.find({
      'usuario.id': usuarioId
    })
    .sort({ fecha_creacion: -1 })
    .limit(parseInt(limit));

    const estadisticas = await Auditoria.aggregate([
      {
        $match: { 'usuario.id': usuarioId }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          porModulo: { $addToSet: '$modulo' },
          ultimaActividad: { $max: '$fecha_creacion' }
        }
      }
    ]);

    res.json({
      actividades,
      estadisticas: estadisticas[0] || {
        total: 0,
        porModulo: [],
        ultimaActividad: null
      }
    });
  } catch (error) {
    console.error('Error obteniendo actividad del usuario:', error);
    res.status(500).json({ mensaje: 'Error al obtener actividad del usuario' });
  }
};

// Buscar avanzada
exports.busquedaAvanzada = async (req, res) => {
  try {
    const {
      fechaDesde,
      fechaHasta,
      modulos,
      acciones,
      resultados,
      usuarios,
      ip,
      texto
    } = req.body;

    const filtros = {};

    if (fechaDesde || fechaHasta) {
      filtros.fecha_creacion = {};
      if (fechaDesde) filtros.fecha_creacion.$gte = new Date(fechaDesde);
      if (fechaHasta) {
        const fin = new Date(fechaHasta);
        fin.setHours(23, 59, 59, 999);
        filtros.fecha_creacion.$lte = fin;
      }
    }

    if (modulos && modulos.length > 0) {
      filtros.modulo = { $in: modulos };
    }

    if (acciones && acciones.length > 0) {
      filtros.accion = { $in: acciones };
    }

    if (resultados && resultados.length > 0) {
      filtros.resultado = { $in: resultados };
    }

    if (usuarios && usuarios.length > 0) {
      filtros['usuario.username'] = { $in: usuarios };
    }

    if (ip) {
      filtros.ip_address = ip;
    }

    if (texto) {
      filtros.$or = [
        { detalles: { $regex: texto, $options: 'i' } },
        { 'usuario.username': { $regex: texto, $options: 'i' } },
        { 'usuario.email': { $regex: texto, $options: 'i' } },
        { modulo: { $regex: texto, $options: 'i' } }
      ];
    }

    const registros = await Auditoria.find(filtros)
      .sort({ fecha_creacion: -1 })
      .limit(1000); // Limitar a 1000 resultados para búsqueda avanzada

    res.json({
      total: registros.length,
      registros
    });
  } catch (error) {
    console.error('Error en búsqueda avanzada:', error);
    res.status(500).json({ mensaje: 'Error en búsqueda avanzada' });
  }
};