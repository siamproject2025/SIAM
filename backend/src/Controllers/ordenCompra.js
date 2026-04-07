const OrdenCompra = require("../Models/ordenCompra");

// Crear una nueva orden
exports.crearOrden = async (req, res) => {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('📦 INICIANDO CREACIÓN DE ORDEN');
    console.log('='.repeat(60));
    
    // Manejar dos formatos:
    // 1. JSON en header X-Orden-Data (base64) + FormData/archivos
    // 2. JSON directo en body
    
    let datosOrden;
    
    // Intentar primero obtener datos del header
    if (req.headers['x-orden-data']) {
      console.log('📋 Decodificando datos desde header X-Orden-Data');
      try {
        const ordenDataBase64 = req.headers['x-orden-data'];
        const ordenDataJson = Buffer.from(ordenDataBase64, 'base64').toString('utf-8');
        datosOrden = JSON.parse(ordenDataJson);
        console.log('✅ Datos decodificados del header exitosamente');
      } catch (decodeErr) {
        console.error('❌ Error decodificando header:', decodeErr.message);
        return res.status(400).json({ error: 'Header X-Orden-Data inválido' });
      }
    } else if (req.body?.datos) {
      // Si viene FormData con campo 'datos'
      console.log('📋 Parseando FormData con datos JSON');
      try {
        datosOrden = JSON.parse(req.body.datos);
        console.log('✅ JSON del FormData parseado exitosamente');
      } catch (parseErr) {
        console.error('❌ Error parseando JSON del FormData:', parseErr.message);
        return res.status(400).json({ error: 'El campo datos debe ser un JSON válido' });
      }
    } else if (typeof req.body === 'object' && req.body !== null && Object.keys(req.body).length > 0) {
      // Si viene JSON directo en el body
      console.log('📊 Usando body como datos de orden (JSON directo)');
      datosOrden = req.body;
    } else {
      console.error('❌ No se encontraron datos de orden');
      return res.status(400).json({ error: 'No se encontraron datos de orden' });
    }
    
    // Validar que datosOrden sea un objeto
    if (!datosOrden || typeof datosOrden !== 'object') {
      console.error('❌ datosOrden no es un objeto válido:', typeof datosOrden);
      return res.status(400).json({ error: 'Datos de orden inválidos' });
    }
    
    console.log('📊 Datos de orden recibidos:');
    console.log('   Proveedor:', datosOrden.proveedor_id);
    console.log('   Items:', datosOrden.items?.length || 0);
    console.log('   Estado:', datosOrden.estado);
    console.log('   Fecha:', datosOrden.fecha);
    
    // Desestructurar datos, EXCLUIR número (se genera automáticamente)
    const { numero, ...datosLimpios } = datosOrden;
    
    // Agregar adjuntos si existen (vienen procesados desde middleware)
    if (req.adjuntosProcessados && req.adjuntosProcessados.length > 0) {
      console.log(`📎 Agregando ${req.adjuntosProcessados.length} adjunto(s)`);
      datosLimpios.adjuntos = req.adjuntosProcessados;
    }
    
    console.log('💾 Guardando orden en base de datos...');
    
    // Crear orden SIN el número (se generará en pre-save)
    const nuevaOrden = new OrdenCompra(datosLimpios);
    const ordenGuardada = await nuevaOrden.save();
    console.log('✅ Orden guardada exitosamente:', ordenGuardada._id);
    console.log('   Número generado:', ordenGuardada.numero);

    // Populate inmediatamente después de guardar
    const ordenConProveedor = await OrdenCompra.findById(ordenGuardada._id)
      .populate("proveedor_id", "nombre empresa")
      .lean();

    console.log('='.repeat(60));
    console.log('✨ ORDEN CREADA EXITOSAMENTE\n');
    
    // Retornar orden con número generado automáticamente
    res.status(201).json({
      ...ordenConProveedor,
      mensaje: `Orden creada exitosamente con número: ${ordenConProveedor.numero} y ${req.adjuntosProcessados?.length || 0} adjunto(s)`
    });
  } catch (err) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ ERROR EN CREARORDEN');
    console.error('='.repeat(60));
    console.error('Mensaje:', err.message);
    console.error('Stack:', err.stack);
    console.error('='.repeat(60) + '\n');
    
    // Limpiar archivos si hay error
    if (req.files && Object.keys(req.files).length > 0) {
      const fs = require('fs');
      console.log('🗑️ Limpiando archivos por error...');
      
      // Con multer.fields(), los archivos están en req.files.adjuntos
      const archivos = req.files.adjuntos || [];
      archivos.forEach(file => {
        try {
          fs.unlinkSync(file.path);
          console.log('  ✅ Eliminado:', file.path);
        } catch (e) {
          console.error('  ❌ Error eliminando archivo:', e.message);
        }
      });
    }
    
    res.status(400).json({ error: err.message || 'Error desconocido al crear orden' });
  }
};


/*const OrdenCompra = require("../Models/ordenCompra");

exports.getOrdenes = async (req, res) => {
  try {
    const ordenes = await OrdenCompra.find()
      .populate("proveedor_id", "nombre"); 
    res.json(ordenes);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener órdenes", error });
  }
};*/

// Obtener todas las órdenes (con datos del proveedor)
exports.obtenerOrdenes = async (req, res) => {
  try {
    const ordenes = await OrdenCompra.find()
      .populate("proveedor_id", "nombre empresa")
      .lean();

    res.status(200).json(ordenes);
  } catch (err) {
    console.error("Error al obtener órdenes:", err);
    res.status(500).json({ error: err.message });
  }
};

// Actualizar una orden existente
exports.actualizarOrden = async (req, res) => {
  try {
    // Desestructurar datos, EXCLUIR número (no debe modificarse)
    const { numero, _id, createdAt, ...datosActualizacion } = req.body;
    
    const ordenActualizada = await OrdenCompra.findByIdAndUpdate(
      req.params.id,
      datosActualizacion,
      { new: true, runValidators: true }
    )
      .populate("proveedor_id", "nombre empresa")
      .lean();

    if (!ordenActualizada) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    res.status(200).json(ordenActualizada);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Eliminar una orden
exports.eliminarOrden = async (req, res) => {
  try {
    const ordenEliminada = await OrdenCompra.findByIdAndDelete(req.params.id);
    if (!ordenEliminada) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }
    res.status(200).json({ mensaje: "Orden eliminada correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message }); 
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

