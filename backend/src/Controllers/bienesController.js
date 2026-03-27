// Controllers/bienesController.js
const Bien = require("../Models/Bien");
const sharp = require('sharp');

// Función auxiliar para detectar cambios específicos
const detectarCambiosEspecificos = (objetoAnterior, objetoNuevo) => {
  if (!objetoAnterior || !objetoNuevo) return { cambios: null, descripcion: '' };
  
  const cambios = {};
  const camposIgnorar = ['_id', '__v', 'fecha_creacion', 'fecha_actualizacion', 'imagen', 'tipo_imagen', 'creado_por', 'creado_por_email', 'actualizado_por', 'actualizado_por_email'];
  
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

// Función auxiliar para obtener datos del usuario desde el token
const getUserInfo = (req) => {
  const user = req.user;
  if (!user) return { id: 'sistema', email: 'sistema@escuela.edu' };
  
  return {
    id: user._id || user.id || user.sub,
    email: user.email || 'sistema@escuela.edu'
  };
};

// Obtener todos los bienes
exports.getBienes = async (req, res) => {
  try {
    const bienes = await Bien.find();
    res.json(bienes);
  } catch (error) {
    console.error('❌ Error en getBienes:', error);
    res.status(500).json({ message: "Error al obtener bienes", error: error.message });
  }
};

// Obtener un bien por ID
exports.getBienById = async (req, res) => {
  try {
    const bien = await Bien.findById(req.params.id);
    if (!bien) return res.status(404).json({ message: "Bien no encontrado" });
    res.json(bien);
  } catch (error) {
    console.error('❌ Error en getBienById:', error);
    res.status(500).json({ message: "Error al buscar el bien", error: error.message });
  }
};

// Crear nuevo bien
exports.createBien = async (req, res) => {
  try {
    console.log('🚀 Iniciando creación de bien...');
    
    // Obtener información del usuario que está creando
    const usuario = getUserInfo(req);
    console.log(`👤 Usuario: ${usuario.email} (${usuario.id})`);

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

    // Crear el objeto con los datos del bien y auditoría
    const bienData = {
      ...req.body,
      imagen: imagenBase64,
      tipo_imagen: tipoImagen,
      // Campos de auditoría
      creado_por: usuario.id,
      creado_por_email: usuario.email,
      fecha_creacion: new Date(),
      actualizado_por: usuario.id,
      actualizado_por_email: usuario.email,
      fecha_actualizacion: new Date()
    };
     
    // Guardar en la base de datos
    const bien = await Bien.create(bienData);
    
    // Crear descripción detallada de lo que se creó
    const camposPrincipales = ['nombre', 'codigo', 'categoria', 'valor', 'estado']
      .filter(c => bien[c])
      .map(c => `${c}=${bien[c]}`)
      .join(', ');
    
    console.log(`✅ Bien creado exitosamente por ${usuario.email}: ${camposPrincipales}`);

    // RESPUESTA EXITOSA
    res.status(201).json({
      success: true,
      message: 'Bien creado exitosamente',
      data: bien,
      audit: {
        creado_por: usuario.email,
        fecha_creacion: bien.fecha_creacion
      }
    });

  } catch (error) {
    console.error('❌ Error en createBien:', error);
    
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
    const { id } = req.params;

    // Validaciones...
    const usuario = getUserInfo(req);
    console.log(`👤 Usuario: ${usuario.email} (${usuario.id})`);

    console.log('🔄 Iniciando actualización de bien...');
    const bienAnterior = await Bien.findById(id);
    
    if (!bienAnterior) {
      return res.status(404).json({ message: "Bien no encontrado" });
    }

    console.log(`📋 Bien anterior: ${bienAnterior.nombre} (${bienAnterior.codigo})`);

    // Procesar imagen SOLO si viene una nueva
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
    } else {
      console.log('ℹ️ No hay archivo de imagen nuevo');
    }

    // Convertir tipos de datos del body
    if (req.body.valor !== undefined) req.body.valor = parseFloat(req.body.valor);
    if (req.body.fechaIngreso) req.body.fechaIngreso = new Date(req.body.fechaIngreso);
    if (req.body.fecha_salida === 'null' || req.body.fecha_salida === '') req.body.fecha_salida = null;
    if (req.body.fecha_salida) req.body.fecha_salida = new Date(req.body.fecha_salida);

    // Crear objeto final para actualizar
    const bienData = {
      ...(req.body.nombre !== undefined && { nombre: req.body.nombre }),
      ...(req.body.descripcion !== undefined && { descripcion: req.body.descripcion }),
      ...(req.body.categoria !== undefined && { categoria: req.body.categoria }),
      ...(req.body.estado !== undefined && { estado: req.body.estado }),
      ...(req.body.valor !== undefined && { valor: parseFloat(req.body.valor) }),
      ...(req.body.fechaIngreso !== undefined && { fechaIngreso: new Date(req.body.fechaIngreso) }),
      ...(req.body.fecha_salida !== undefined && { fecha_salida: req.body.fecha_salida }),
      ...(req.body.tipo_asignacion !== undefined && req.body.tipo_asignacion !== 'null' && { tipo_asignacion: req.body.tipo_asignacion }),
      ...(req.body.asignado_a !== undefined && req.body.asignado_a !== 'null' && { asignado_a: req.body.asignado_a }),
      // ✅ SOLO incluir imagen si hay una nueva
      ...(imagenBase64 && { imagen: imagenBase64, tipo_imagen: tipoImagen }),
      // Campos de auditoría
      actualizado_por: usuario.id,
      actualizado_por_email: usuario.email,
      fecha_actualizacion: new Date()
    };

    // Eliminar campos undefined
    Object.keys(bienData).forEach(key => bienData[key] === undefined && delete bienData[key]);

    // Preparar datos para detectar cambios
    const bienAnteriorObj = bienAnterior.toObject ? bienAnterior.toObject() : bienAnterior;
    
    const datosPreviosLimpios = { ...bienAnteriorObj };
    delete datosPreviosLimpios.imagen;
    delete datosPreviosLimpios.tipo_imagen;
    delete datosPreviosLimpios.creado_por;
    delete datosPreviosLimpios.creado_por_email;
    delete datosPreviosLimpios.fecha_creacion;
    delete datosPreviosLimpios.actualizado_por;
    delete datosPreviosLimpios.actualizado_por_email;
    delete datosPreviosLimpios.fecha_actualizacion;
    delete datosPreviosLimpios.eliminado_por;
    delete datosPreviosLimpios.eliminado_por_email;
    delete datosPreviosLimpios.fecha_eliminacion;
    delete datosPreviosLimpios.createdAt;
    delete datosPreviosLimpios.updatedAt;
    delete datosPreviosLimpios.__v;

    const datosNuevosLimpios = { ...bienData };
    delete datosNuevosLimpios.actualizado_por;
    delete datosNuevosLimpios.actualizado_por_email;
    delete datosNuevosLimpios.fecha_actualizacion;
    delete datosNuevosLimpios.imagen;
    delete datosNuevosLimpios.tipo_imagen;

    // Detectar cambios
    const { cambios, descripcion } = detectarCambiosEspecificos(datosPreviosLimpios, datosNuevosLimpios);

    if (Object.keys(cambios).length > 0) {
      console.log(`📝 Cambios detectados por ${usuario.email}:`, descripcion);
    } else {
      console.log(`ℹ️ No se detectaron cambios en la actualización por ${usuario.email}`);
    }

    // Actualizar en la base de datos
    const bienActualizado = await Bien.findByIdAndUpdate(
      req.params.id, 
      bienData, 
      { new: true, runValidators: true }
    );
    
    console.log(`✅ Bien actualizado exitosamente por ${usuario.email}: ${bienActualizado.nombre}`);

    // RESPUESTA EXITOSA
    res.status(200).json({
      success: true,
      message: 'Bien actualizado exitosamente',
      data: bienActualizado,
      audit: {
        actualizado_por: usuario.email,
        fecha_actualizacion: bienActualizado.fecha_actualizacion,
        cambios_realizados: Object.keys(cambios).length,
        detalles_cambios: descripcion || 'Sin cambios significativos'
      }
    });

  } catch (error) {
    console.error('❌ Error en updateBien:', error);
    
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
    console.log('🗑️ Iniciando eliminación de bien...');
    
    // Obtener información del usuario que está eliminando
    const usuario = getUserInfo(req);
    console.log(`👤 Usuario: ${usuario.email} (${usuario.id})`);

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
      estado: bienEliminado.estado,
      creado_por: bienEliminado.creado_por_email || bienEliminado.creado_por,
      fecha_creacion: bienEliminado.fecha_creacion,
      ultima_actualizacion: bienEliminado.fecha_actualizacion,
      actualizado_por: bienEliminado.actualizado_por_email
    };

    console.log(`📋 Bien a eliminar: ${datosEliminados.nombre} (${datosEliminados.codigo})`);
    console.log(`👤 Creado por: ${datosEliminados.creado_por}`);
    console.log(`🗑️ Eliminado por: ${usuario.email}`);

    // Actualizar el bien con campos de eliminación (soft delete opcional)
    // Si quieres soft delete, descomenta estas líneas y comenta la de abajo
    /*
    await Bien.findByIdAndUpdate(req.params.id, {
      eliminado_por: usuario.id,
      eliminado_por_email: usuario.email,
      fecha_eliminacion: new Date(),
      estado: "INACTIVO"
    });
    */
    
    // Eliminar el bien permanentemente
    await Bien.findByIdAndDelete(req.params.id);

    console.log(`✅ Bien eliminado exitosamente por ${usuario.email}`);

    // RESPUESTA EXITOSA
    res.json({ 
      success: true,
      message: "Bien eliminado correctamente",
      data: { 
        id: req.params.id,
        nombre: datosEliminados.nombre,
        codigo: datosEliminados.codigo
      },
      audit: {
        eliminado_por: usuario.email,
        fecha_eliminacion: new Date(),
        bien_eliminado: datosEliminados
      }
    });

  } catch (error) {
    console.error('❌ Error en deleteBien:', error);
    
    res.status(500).json({ 
      success: false,
      message: "Error al eliminar el bien", 
      error: error.message 
    });
  }
};

// Obtener auditoría de un bien específico (historial de cambios)
exports.getBienAuditoria = async (req, res) => {
  try {
    const bien = await Bien.findById(req.params.id);
    
    if (!bien) {
      return res.status(404).json({ message: "Bien no encontrado" });
    }

    const auditoria = {
      id: bien._id,
      codigo: bien.codigo,
      nombre: bien.nombre,
      creado: {
        por: bien.creado_por_email || bien.creado_por,
        fecha: bien.fecha_creacion
      },
      ultima_actualizacion: {
        por: bien.actualizado_por_email || bien.actualizado_por,
        fecha: bien.fecha_actualizacion
      },
      historial: {
        fecha_creacion: bien.fecha_creacion,
        fecha_ultima_modificacion: bien.fecha_actualizacion || bien.fecha_creacion
      }
    };

    res.json(auditoria);
  } catch (error) {
    console.error('❌ Error en getBienAuditoria:', error);
    res.status(500).json({ 
      message: "Error al obtener auditoría del bien", 
      error: error.message 
    });
  }
};