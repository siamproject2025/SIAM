// Controllers/bienesController.js
const Bien = require("../Models/Bien");
const sharp = require('sharp');
//const Auditoria = require('../Models/Auditoria'); // Importar modelo de auditoría

// Función auxiliar para detectar cambios específicos
const detectarCambiosEspecificos = (objetoAnterior, objetoNuevo) => {
  if (!objetoAnterior || !objetoNuevo) return { cambios: null, descripcion: '' };
  
  const cambios = {};
  const camposIgnorar = ['_id', '__v', 'fecha_creacion', 'fecha_actualizacion', 'imagen', 'tipo_imagen'];
  
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

// Obtener todos los bienes
exports.getBienes = async (req, res) => {
  try {
    const bienes = await Bien.find();
    res.json(bienes);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener bienes", error });
  }
};

// Obtener un bien por ID
exports.getBienById = async (req, res) => {
  try {
    const bien = await Bien.findById(req.params.id);
    if (!bien) return res.status(404).json({ message: "Bien no encontrado" });
    res.json(bien);
  } catch (error) {
    res.status(500).json({ message: "Error al buscar el bien", error });
  }
};

// Crear nuevo bien
exports.createBien = async (req, res) => {
  try {
    console.log('🚀 Iniciando creación de bien...');

    // Procesar imagen (si viene en el FormData)
    let imagenBase64 = null;
    let tipoImagen = null;

    if (req.file) {
      console.log('📸 Archivo recibido, procesando con Sharp...');

      const TARGET_WIDTH = 600;
      const TARGET_HEIGHT = 600;
      const QUALITY = 60;

      let imageSharp = sharp(req.file.buffer).resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: 'inside' });

      // Convertir a formato adecuado y optimizar
      if (req.file.mimetype === 'image/png' || req.file.mimetype === 'image/jpeg') {
        const processedBuffer = await imageSharp.jpeg({ quality: QUALITY }).toBuffer();
        imagenBase64 = processedBuffer.toString('base64');
        tipoImagen = 'image/jpeg';
      } else if (req.file.mimetype === 'image/webp') {
        const processedBuffer = await imageSharp.webp({ quality: QUALITY }).toBuffer();
        imagenBase64 = processedBuffer.toString('base64');
        tipoImagen = 'image/webp';
      } else {
        // Para otros tipos, convertir a JPEG por defecto
        const processedBuffer = await imageSharp.jpeg({ quality: QUALITY }).toBuffer();
        imagenBase64 = processedBuffer.toString('base64');
        tipoImagen = 'image/jpeg';
      }

      console.log(`✅ Imagen procesada, tamaño aproximado: ${(imagenBase64.length / 1024 / 1024).toFixed(2)} MB`);
    }

    // Crear el objeto con los datos del bien
    const bienData = {
      ...req.body,
      imagen: imagenBase64,
      tipo_imagen: tipoImagen,
      creado_por: req.user?._id || req.user?.id, // Agregar quién crea el registro
      fecha_creacion: new Date()
    };
     
    // Guardar en la base de datos
    const bien = await Bien.create(bienData);
    
    // Crear descripción detallada de lo que se creó
    const camposPrincipales = ['nombre', 'codigo', 'categoria', 'valor', 'estado']
      .filter(c => bien[c])
      .map(c => `${c}=${bien[c]}`)
      .join(', ');
    
    const descripcionDetallada = `Bien creado: ${camposPrincipales}`;

    // RESPUESTA EXITOSA
    res.status(201).json({
      success: true,
      message: 'Bien creado exitosamente',
      data: bien,
    });
     // Crear copia de bienData SIN imagen para auditoría
    const bienDataParaAuditoria = { ...bienData };
    delete bienDataParaAuditoria.imagen;
    delete bienDataParaAuditoria.tipo_imagen;
    // AUDITORÍA: Registrar después de enviar la respuesta (no bloquea)
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
          modulo: 'BIENES',
          entidad: {
            nombre: 'Bien',
            id: bien._id,
            datos_nuevos: bienData,
            cambios_detectados: null // No hay cambios previos en creación
          },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent'),
          detalles: `POST /api/bienes - Creación de bien`,
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
    console.error('❌ Error en createBien:', error);
    
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
          modulo: 'BIENES',
          entidad: {
            nombre: 'Bien',
            datos_nuevos: req.body
          },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent'),
          detalles: `POST /api/bienes - Error creando bien`,
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
      message: 'Error al crear el bien',
      error: error.message,
    });
  }
};

// Actualizar bien
exports.updateBien = async (req, res) => {
  try {
    console.log('🔄 Iniciando actualización de bien...');

    // Obtener el bien antes de actualizar (para auditoría)
    const bienAnterior = await Bien.findById(req.params.id);
    
    if (!bienAnterior) {
      return res.status(404).json({ message: "Bien no encontrado" });
    }

    // Procesar imagen si viene en el FormData
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

    // Convertir tipos de datos del body
    if (req.body.valor !== undefined) req.body.valor = parseFloat(req.body.valor);
    if (req.body.fechaIngreso) req.body.fechaIngreso = new Date(req.body.fechaIngreso);

    // Crear objeto final para actualizar
    const bienData = {
      ...req.body,
      ...(imagenBase64 && { imagen: imagenBase64, tipo_imagen: tipoImagen }),
      fecha_actualizacion: new Date()
    };


    // ===== COLOCA EL CÓDIGO AQUÍ =====
    const bienAnteriorObj = bienAnterior.toObject ? bienAnterior.toObject() : bienAnterior;
    
    // Crear versiones modificadas para auditoría
    const datosPreviosLimpios = { ...bienAnteriorObj };
    if (datosPreviosLimpios.imagen) {
      datosPreviosLimpios.imagen = "imagen no disponible en auditoría";
    }
    if (datosPreviosLimpios.tipo_imagen) {
      datosPreviosLimpios.tipo_imagen = "tipo no disponible";
    }

    const datosNuevosLimpios = { ...bienData };
    if (datosNuevosLimpios.imagen) {
      datosNuevosLimpios.imagen = "imagen no disponible en auditoría";
    }
    if (datosNuevosLimpios.tipo_imagen) {
      datosNuevosLimpios.tipo_imagen = "tipo no disponible";
    }
    // =================================

    // Detectar cambios usando las versiones modificadas
    const { cambios, descripcion } = detectarCambiosEspecificos(datosPreviosLimpios, datosNuevosLimpios);

    // Actualizar en la base de datos (usando bienData original, NO las versiones limpias)
    const bienActualizado = await Bien.findByIdAndUpdate(req.params.id, bienData, { new: true });
    
    // RESPUESTA EXITOSA
    res.status(200).json({
      success: true,
      message: 'Bien actualizado exitosamente',
      data: bienActualizado,
    });

     

    // AUDITORÍA: Registrar después de enviar la respuesta
    setImmediate(async () => {
      try {
        // Si hay cambios en la imagen, agregarlo a la descripción
        let descripcionFinal = descripcion;
        if (req.file) {
          descripcionFinal += (descripcionFinal ? '; ' : '') + 'imagen actualizada';
        }

        
    
        console.log(`✅ usuario procesado `, req.user?.roles[0]);
       
        
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
          modulo: 'BIENES',
          entidad: {
            nombre: 'Bien',
            id: req.params.id,
            datos_previos: datosPreviosLimpios, // ← USAR COPIA SIN IMAGEN
            datos_nuevos: datosNuevosLimpios,   // ← USAR COPIA SIN IMAGEN
            cambios_detectados: cambios
          },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent'),
          detalles: `PUT /api/bienes/${req.params.id}`,
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
    console.error('❌ Error en updateBien:', error);
    
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
          modulo: 'BIENES',
          entidad: {
            nombre: 'Bien',
            id: req.params.id
          },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent'),
          detalles: `PUT /api/bienes/${req.params.id} - Error actualizando bien`,
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
      message: 'Error al actualizar el bien',
      error: error.message,
    });
  }
};

// Eliminar bien
exports.deleteBien = async (req, res) => {
  try {
    // Obtener el bien antes de eliminar (para auditoría)
    const bienEliminado = await Bien.findById(req.params.id);
    
    if (!bienEliminado) {
      return res.status(404).json({ message: "Bien no encontrado" });
    }

    // Guardar datos importantes antes de eliminar
    const datosEliminados = {
      id: bienEliminado._id,
      codigo: bienEliminado.codigo,
      nombre: bienEliminado.nombre,
      categoria: bienEliminado.categoria,
      valor: bienEliminado.valor,
      estado: bienEliminado.estado
    };

    // Eliminar el bien
    await Bien.findByIdAndDelete(req.params.id);

    // RESPUESTA EXITOSA
    res.json({ 
      message: "Bien eliminado correctamente",
      data: { id: req.params.id }
    });

    // AUDITORÍA: Registrar después de enviar la respuesta
    setImmediate(async () => {
      try {
        const descripcionDetallada = `Bien eliminado: ${datosEliminados.nombre || datosEliminados.codigo} (Categoría: ${datosEliminados.categoria}, Valor: ${datosEliminados.valor})`;
        
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
          modulo: 'BIENES',
          entidad: {
            nombre: 'Bien',
            id: req.params.id,
            datos_previos: datosEliminados
          },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent'),
          detalles: `DELETE /api/bienes/${req.params.id}`,
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
    console.error('❌ Error en deleteBien:', error);
    
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
          modulo: 'BIENES',
          entidad: {
            nombre: 'Bien',
            id: req.params.id
          },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent'),
          detalles: `DELETE /api/bienes/${req.params.id} - Error eliminando bien`,
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

    res.status(500).json({ message: "Error al eliminar el bien", error });
  }
};