const Donacion = require('../Models/donacionesModel');
const multer = require('multer');
const sharp = require('sharp');
// const Auditoria = require('../Models/Auditoria'); // Descomentar cuando exista

// Configuración de multer para guardar archivos en memoria
const upload = multer({ storage: multer.memoryStorage() });

// Función auxiliar para detectar cambios específicos
const detectarCambiosEspecificos = (objetoAnterior, objetoNuevo) => {
  if (!objetoAnterior || !objetoNuevo) return { cambios: null, descripcion: '' };
  
  const cambios = {};
  const camposIgnorar = ['_id', '__v', 'createdAt', 'updatedAt', 'fecha_ingreso', 'imagen', 'tipo_imagen'];
  
  // Obtener todos los campos únicos
  const todosLosCampos = new Set([
    ...Object.keys(objetoAnterior),
    ...Object.keys(objetoNuevo)
  ]);
  
  for (const campo of todosLosCampos) {
    if (camposIgnorar.includes(campo)) continue;
    
    const valorAnterior = objetoAnterior[campo];
    const valorNuevo = objetoNuevo[campo];
    
    // Comparar valores (manejar undefined, null, objetos)
    if (JSON.stringify(valorAnterior) !== JSON.stringify(valorNuevo)) {
      cambios[campo] = {
        anterior: valorAnterior || 'vacío',
        nuevo: valorNuevo || 'vacío'
      };
    }
  }
  
  // Crear descripción legible
  const camposModificados = Object.keys(cambios);
  let descripcion = '';
  
  if (camposModificados.length > 0) {
    descripcion = camposModificados.map(campo => {
      const cambio = cambios[campo];
      // Truncar valores largos
      const anterior = String(cambio.anterior).substring(0, 50);
      const nuevo = String(cambio.nuevo).substring(0, 50);
      return `${campo}: "${anterior}" → "${nuevo}"`;
    }).join('; ');
  }
  
  return { cambios, descripcion };
};

// Crear nueva donación
exports.createDonacion = async (req, res) => {
  try {
    console.log('🚀 Iniciando creación de donación...');
    
    const nextId = await Donacion.getNextId();

    let imagenBase64 = null;
    let tipoImagen = null;

    if (req.file) {
      console.log('📸 Archivo recibido, procesando con Sharp...');

      const TARGET_WIDTH = 600;
      const TARGET_HEIGHT = 600;
      const QUALITY = 60;

      let imageSharp = sharp(req.file.buffer).resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: 'inside' });

      if (req.file.mimetype === 'image/png' || req.file.mimetype === 'image/jpeg') {
        const processedBuffer = await imageSharp.jpeg({ quality: QUALITY }).toBuffer();
        imagenBase64 = processedBuffer.toString('base64');
        tipoImagen = 'image/jpeg';
      } else if (req.file.mimetype === 'image/webp') {
        const processedBuffer = await imageSharp.webp({ quality: QUALITY }).toBuffer();
        imagenBase64 = processedBuffer.toString('base64');
        tipoImagen = 'image/webp';
      } else {
        const processedBuffer = await imageSharp.jpeg({ quality: QUALITY }).toBuffer();
        imagenBase64 = processedBuffer.toString('base64');
        tipoImagen = 'image/jpeg';
      }

      console.log(`✅ Imagen procesada, tamaño aproximado: ${(imagenBase64.length / 1024 / 1024).toFixed(2)} MB`);
    }

    const donacionData = {
      ...req.body,
      id_donacion: nextId,
      imagen: imagenBase64,
      tipo_imagen: tipoImagen,
      creado_por: req.user?._id || req.user?.id,
      fecha_creacion: new Date()
    };

    const donacion = await Donacion.create(donacionData);

    // Crear descripción detallada de lo que se creó
    const camposPrincipales = ['id_donacion', 'tipo_donacion', 'cantidad_donacion', 'id_almacen']
      .filter(c => donacion[c])
      .map(c => `${c}=${donacion[c]}`)
      .join(', ');
    
    const descripcionDetallada = `Donación creada: ${camposPrincipales}`;

    // RESPUESTA EXITOSA
    res.status(201).json({
      success: true,
      message: 'Donación creada exitosamente',
      data: donacion
    });

    // Crear copia para auditoría SIN imagen
    const donacionDataParaAuditoria = { ...donacionData };
    delete donacionDataParaAuditoria.imagen;
    delete donacionDataParaAuditoria.tipo_imagen;

    // AUDITORÍA: Registrar después de enviar la respuesta
    setImmediate(async () => {
      try {
        await Auditoria.create({
          usuario: req.user ? {
            id: req.user._id || req.user.id,
            username: req.user?.username || req.user?.email || 'Sistema',
            email: req.user?.email || 'sistema@local',
            rol: req.user?.roles ? req.user?.roles[0] : 'sistema'
          } : {
            username: 'Sistema',
            email: 'sistema@local',
            rol: 'sistema'
          },
          accion: 'CREATE',
          modulo: 'DONACIONES',
          entidad: {
            nombre: 'Donacion',
            id: donacion._id,
            datos_nuevos: donacionDataParaAuditoria,
            cambios_detectados: null
          },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent'),
          detalles: `POST /api/donaciones - Creación de donación`,
          descripcion_detallada: descripcionDetallada,
          resultado: 'EXITO',
          metadata: {
            query: req.query,
            params: req.params,
            statusCode: 201,
            duration: Date.now() - (req.requestStartTime || Date.now())
          },
          fecha_creacion: new Date()
        });
        console.log('✅ Auditoría de creación guardada:', descripcionDetallada);
      } catch (auditError) {
        console.error('❌ Error guardando auditoría:', auditError);
      }
    });

  } catch (error) {
    console.error('❌ Error en createDonacion:', error);

    // AUDITORÍA DE ERROR
    setImmediate(async () => {
      try {
        await Auditoria.create({
          usuario: req.user ? {
            id: req.user._id || req.user.id,
            username: req.user?.username || req.user?.email || 'Sistema',
            email: req.user?.email || 'sistema@local',
            rol: req.user?.roles ? req.user?.roles[0] : 'sistema'
          } : {
            username: 'Sistema',
            email: 'sistema@local',
            rol: 'sistema'
          },
          accion: 'CREATE',
          modulo: 'DONACIONES',
          entidad: {
            nombre: 'Donacion',
            datos_nuevos: req.body
          },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent'),
          detalles: `POST /api/donaciones - Error creando donación`,
          descripcion_detallada: `Error: ${error.message}`,
          resultado: 'ERROR',
          error_message: error.message,
          metadata: {
            query: req.query,
            params: req.params,
            statusCode: 400,
            duration: Date.now() - (req.requestStartTime || Date.now())
          },
          fecha_creacion: new Date()
        });
      } catch (auditError) {
        console.error('❌ Error guardando auditoría de error:', auditError);
      }
    });

    res.status(400).json({
      success: false,
      message: 'Error al crear la donación',
      error: error.message
    });
  }
};

// Obtener todas las donaciones
exports.getAllDonaciones = async (req, res) => {
  try {
    const donaciones = await Donacion.find().sort({ fecha: -1 });
    res.status(200).json({
      success: true,
      count: donaciones.length,
      data: donaciones
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener las donaciones',
      error: error.message
    });
  }
};

// Obtener una donación por ID
exports.getDonacionById = async (req, res) => {
  try {
    const donacion = await Donacion.findOne({ id_donacion: req.params.id });
    
    if (!donacion) {
      return res.status(404).json({
        success: false,
        message: 'Donación no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: donacion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener la donación',
      error: error.message
    });
  }
};

// Actualizar una donación
exports.updateDonacion = async (req, res) => {
  try {
    console.log('🔄 Iniciando actualización de donación...');

    // Obtener la donación antes de actualizar (para auditoría)
    const donacionAnterior = await Donacion.findOne({ id_donacion: req.params.id });
    
    if (!donacionAnterior) {
      return res.status(404).json({
        success: false,
        message: 'Donación no encontrada'
      });
    }

    const updateData = { ...req.body };

    if (req.file) {
      console.log('📸 Archivo recibido, procesando con Sharp...');
      
      const MAX_WIDTH = 600;
      const MAX_HEIGHT = 600;
      const QUALITY = 60;

      let imageSharp = sharp(req.file.buffer).resize({
        width: MAX_WIDTH,
        height: MAX_HEIGHT,
        fit: 'inside',
        withoutEnlargement: true
      });

      const processedBuffer = await imageSharp.jpeg({ quality: QUALITY }).toBuffer();
      updateData.imagen = processedBuffer.toString('base64');
      updateData.tipo_imagen = 'image/jpeg';
      
      console.log(`✅ Imagen procesada, tamaño aproximado: ${(updateData.imagen.length / 1024 / 1024).toFixed(2)} MB`);
    }

    updateData.fecha_actualizacion = new Date();

    // ===== PREPARAR DATOS PARA AUDITORÍA =====
    const donacionAnteriorObj = donacionAnterior.toObject ? donacionAnterior.toObject() : donacionAnterior;
    
    const datosPreviosLimpios = { ...donacionAnteriorObj };
    if (datosPreviosLimpios.imagen) {
      datosPreviosLimpios.imagen = "imagen no disponible en auditoría";
    }
    if (datosPreviosLimpios.tipo_imagen) {
      datosPreviosLimpios.tipo_imagen = "tipo no disponible";
    }

    const datosNuevosLimpios = { ...updateData };
    if (datosNuevosLimpios.imagen) {
      datosNuevosLimpios.imagen = "imagen no disponible en auditoría";
    }
    if (datosNuevosLimpios.tipo_imagen) {
      datosNuevosLimpios.tipo_imagen = "tipo no disponible";
    }
    // =========================================

    const { cambios, descripcion } = detectarCambiosEspecificos(datosPreviosLimpios, datosNuevosLimpios);

    const donacion = await Donacion.findOneAndUpdate(
      { id_donacion: req.params.id },
      updateData,
      { new: true, runValidators: true }
    );

    // RESPUESTA EXITOSA
    res.status(200).json({
      success: true,
      message: 'Donación actualizada exitosamente',
      data: donacion
    });

    // AUDITORÍA
    setImmediate(async () => {
      try {
        let descripcionFinal = descripcion;
        if (req.file) {
          descripcionFinal += (descripcionFinal ? '; ' : '') + 'imagen actualizada';
        }

        await Auditoria.create({
          usuario: req.user ? {
            id: req.user._id || req.user.id,
            username: req.user?.username || req.user?.email || 'Sistema',
            email: req.user?.email || 'sistema@local',
            rol: req.user?.roles ? req.user?.roles[0] : 'sistema'
          } : {
            username: 'Sistema',
            email: 'sistema@local',
            rol: 'sistema'
          },
          accion: 'UPDATE',
          modulo: 'DONACIONES',
          entidad: {
            nombre: 'Donacion',
            id: donacionAnterior._id,
            datos_previos: datosPreviosLimpios,
            datos_nuevos: datosNuevosLimpios,
            cambios_detectados: cambios
          },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent'),
          detalles: `PUT /api/donaciones/${req.params.id}`,
          descripcion_detallada: descripcionFinal || 'Actualización sin cambios detectados',
          resultado: 'EXITO',
          metadata: {
            query: req.query,
            params: req.params,
            statusCode: 200,
            duration: Date.now() - (req.requestStartTime || Date.now())
          },
          fecha_creacion: new Date()
        });
        console.log('✅ Auditoría de actualización guardada:', descripcionFinal || 'Sin cambios');
      } catch (auditError) {
        console.error('❌ Error guardando auditoría:', auditError);
      }
    });

  } catch (error) {
    console.error('❌ Error en updateDonacion:', error);

    // AUDITORÍA DE ERROR
    setImmediate(async () => {
      try {
        await Auditoria.create({
          usuario: req.user ? {
            id: req.user._id || req.user.id,
            username: req.user?.username || req.user?.email || 'Sistema',
            email: req.user?.email || 'sistema@local',
            rol: req.user?.roles ? req.user?.roles[0] : 'sistema'
          } : {
            username: 'Sistema',
            email: 'sistema@local',
            rol: 'sistema'
          },
          accion: 'UPDATE',
          modulo: 'DONACIONES',
          entidad: {
            nombre: 'Donacion',
            id: req.params.id
          },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent'),
          detalles: `PUT /api/donaciones/${req.params.id} - Error actualizando donación`,
          descripcion_detallada: `Error: ${error.message}`,
          resultado: 'ERROR',
          error_message: error.message,
          metadata: {
            query: req.query,
            params: req.params,
            statusCode: 400,
            duration: Date.now() - (req.requestStartTime || Date.now())
          },
          fecha_creacion: new Date()
        });
      } catch (auditError) {
        console.error('❌ Error guardando auditoría de error:', auditError);
      }
    });

    res.status(400).json({
      success: false,
      message: 'Error al actualizar la donación',
      error: error.message
    });
  }
};

// Eliminar una donación
exports.deleteDonacion = async (req, res) => {
  try {
    // Obtener la donación antes de eliminar (para auditoría)
    const donacionEliminada = await Donacion.findOne({ id_donacion: req.params.id });

    if (!donacionEliminada) {
      return res.status(404).json({
        success: false,
        message: 'Donación no encontrada'
      });
    }

    // Guardar datos importantes antes de eliminar
    const datosEliminados = {
      id: donacionEliminada._id,
      id_donacion: donacionEliminada.id_donacion,
      tipo_donacion: donacionEliminada.tipo_donacion,
      cantidad_donacion: donacionEliminada.cantidad_donacion,
      id_almacen: donacionEliminada.id_almacen,
      fecha: donacionEliminada.fecha
    };

    // Eliminar la donación
    await Donacion.findOneAndDelete({ id_donacion: req.params.id });

    // RESPUESTA EXITOSA
    res.status(200).json({
      success: true,
      message: 'Donación eliminada exitosamente',
      data: donacionEliminada
    });

    // AUDITORÍA
    setImmediate(async () => {
      try {
        const descripcionDetallada = `Donación eliminada: ID ${datosEliminados.id_donacion} - ${datosEliminados.tipo_donacion} (Cantidad: ${datosEliminados.cantidad_donacion}, Almacén: ${datosEliminados.id_almacen})`;
        
        await Auditoria.create({
          usuario: req.user ? {
            id: req.user._id || req.user.id,
            username: req.user?.username || req.user?.email || 'Sistema',
            email: req.user?.email || 'sistema@local',
            rol: req.user?.roles ? req.user?.roles[0] : 'sistema'
          } : {
            username: 'Sistema',
            email: 'sistema@local',
            rol: 'sistema'
          },
          accion: 'DELETE',
          modulo: 'DONACIONES',
          entidad: {
            nombre: 'Donacion',
            id: donacionEliminada._id,
            datos_previos: datosEliminados
          },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent'),
          detalles: `DELETE /api/donaciones/${req.params.id}`,
          descripcion_detallada: descripcionDetallada,
          resultado: 'EXITO',
          metadata: {
            query: req.query,
            params: req.params,
            statusCode: 200,
            duration: Date.now() - (req.requestStartTime || Date.now())
          },
          fecha_creacion: new Date()
        });
        console.log('✅ Auditoría de eliminación guardada:', descripcionDetallada);
      } catch (auditError) {
        console.error('❌ Error guardando auditoría:', auditError);
      }
    });

  } catch (error) {
    console.error('❌ Error en deleteDonacion:', error);

    // AUDITORÍA DE ERROR
    setImmediate(async () => {
      try {
        await Auditoria.create({
          usuario: req.user ? {
            id: req.user._id || req.user.id,
            username: req.user?.username || req.user?.email || 'Sistema',
            email: req.user?.email || 'sistema@local',
            rol: req.user?.roles ? req.user?.roles[0] : 'sistema'
          } : {
            username: 'Sistema',
            email: 'sistema@local',
            rol: 'sistema'
          },
          accion: 'DELETE',
          modulo: 'DONACIONES',
          entidad: {
            nombre: 'Donacion',
            id: req.params.id
          },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent'),
          detalles: `DELETE /api/donaciones/${req.params.id} - Error eliminando donación`,
          descripcion_detallada: `Error: ${error.message}`,
          resultado: 'ERROR',
          error_message: error.message,
          metadata: {
            query: req.query,
            params: req.params,
            statusCode: 500,
            duration: Date.now() - (req.requestStartTime || Date.now())
          },
          fecha_creacion: new Date()
        });
      } catch (auditError) {
        console.error('❌ Error guardando auditoría de error:', auditError);
      }
    });

    res.status(500).json({
      success: false,
      message: 'Error al eliminar la donación',
      error: error.message
    });
  }
};

// Obtener donaciones por almacén
exports.getDonacionesByAlmacen = async (req, res) => {
  try {
    const donaciones = await Donacion.find({ id_almacen: req.params.id_almacen }).sort({ fecha: -1 });

    res.status(200).json({
      success: true,
      count: donaciones.length,
      data: donaciones
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener las donaciones del almacén',
      error: error.message
    });
  }
};

// Obtener donaciones por tipo
exports.getDonacionesByTipo = async (req, res) => {
  try {
    const donaciones = await Donacion.find({ tipo_donacion: req.params.tipo }).sort({ fecha: -1 });

    res.status(200).json({
      success: true,
      count: donaciones.length,
      data: donaciones
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener las donaciones por tipo',
      error: error.message
    });
  }
};

// Obtener estadísticas de donaciones
exports.getEstadisticasDonaciones = async (req, res) => {
  try {
    const stats = await Donacion.aggregate([
      {
        $group: {
          _id: '$tipo_donacion',
          total: { $sum: '$cantidad_donacion' },
          cantidad_donaciones: { $sum: 1 },
          promedio: { $avg: '$cantidad_donacion' }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener las estadísticas',
      error: error.message
    });
  }
};