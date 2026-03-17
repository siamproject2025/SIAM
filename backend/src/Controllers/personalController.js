const Personal = require('../Models/personalModel');
const multer = require('multer');
const sharp = require('sharp');
// const Auditoria = require('../Models/Auditoria'); // Descomentar cuando exista

// Configuración de multer para almacenar archivos en memoria
const upload = multer({ storage: multer.memoryStorage() });
exports.uploadMiddleware = upload.single('imagen');

// Función auxiliar para detectar cambios específicos
const detectarCambiosEspecificos = (objetoAnterior, objetoNuevo) => {
  if (!objetoAnterior || !objetoNuevo) return { cambios: null, descripcion: '' };
  
  const cambios = {};
  const camposIgnorar = ['_id', '__v', 'fecha_creacion', 'fecha_actualizacion', 'imagen', 'tipo_imagen', 'cv', 'documentacion'];
  
  const todosLosCampos = new Set([
    ...Object.keys(objetoAnterior),
    ...Object.keys(objetoNuevo)
  ]);
  
  for (const campo of todosLosCampos) {
    if (camposIgnorar.includes(campo)) continue;
    
    const valorAnterior = objetoAnterior[campo];
    const valorNuevo = objetoNuevo[campo];
    
    if (JSON.stringify(valorAnterior) !== JSON.stringify(valorNuevo)) {
      cambios[campo] = {
        anterior: valorAnterior || 'vacío',
        nuevo: valorNuevo || 'vacío'
      };
    }
  }
  
  const camposModificados = Object.keys(cambios);
  let descripcion = '';
  
  if (camposModificados.length > 0) {
    descripcion = camposModificados.map(campo => {
      const cambio = cambios[campo];
      const anterior = String(cambio.anterior).substring(0, 50);
      const nuevo = String(cambio.nuevo).substring(0, 50);
      return `${campo}: "${anterior}" → "${nuevo}"`;
    }).join('; ');
  }
  
  return { cambios, descripcion };
};

// Obtener todo el personal
exports.obtenerPersonal = async (req, res) => {
  try {
    const personal = await Personal.find().sort({ fecha_creacion: -1 });
    res.status(200).json(personal);
  } catch (error) {
    console.error('Error al obtener personal:', error);
    res.status(500).json({ 
      message: 'Error al obtener el personal', 
      error: error.message 
    });
  }
};

// Obtener un empleado por ID
exports.obtenerPersonalPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const empleado = await Personal.findById(id);

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: empleado
    });
  } catch (error) {
    console.error('Error al obtener empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el empleado',
      error: error.message
    });
  }
};

// Crear nuevo empleado (con soporte para imagen)
exports.crearPersonal = async (req, res) => {
  try {
    console.log('🚀 Iniciando creación de personal...');

    const {
      codigo,
      nombres,
      apellidos,
      numero_identidad,
      tipo_contrato,
      estado,
      cv,
      especialidades,
      area_trabajo,
      telefono,
      direccion_correo,
      cargo_asignacion,
      documentacion,
      salario,
      fecha_ingreso
    } = req.body;

    // Validaciones de duplicados
    const [codigoExiste, identidadExiste] = await Promise.all([
      Personal.findOne({ codigo }),
      Personal.findOne({ numero_identidad })
    ]);

    if (codigoExiste) {
      return res.status(400).json({ message: 'Ya existe un empleado con este código' });
    }
    if (identidadExiste) {
      return res.status(400).json({ message: 'Ya existe un empleado con este número de identidad' });
    }

    // Procesamiento de imagen (si existe)
    let imagenBase64 = null;
    let tipoImagen = null;

    if (req.file) {
      console.log('📸 Archivo recibido, procesando con Sharp...');
      const TARGET_WIDTH = 600;
      const TARGET_HEIGHT = 600;
      const QUALITY = 60;

      let imageSharp = sharp(req.file.buffer).resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: 'inside' });
      const processedBuffer = await imageSharp.jpeg({ quality: QUALITY }).toBuffer();

      imagenBase64 = processedBuffer.toString('base64');
      tipoImagen = 'image/jpeg';
      console.log(`✅ Imagen procesada, tamaño aproximado: ${(imagenBase64.length / 1024 / 1024).toFixed(2)} MB`);
    }

    let cargoAsignacionObj = null;
    if (cargo_asignacion) {
      try {
        cargoAsignacionObj = JSON.parse(cargo_asignacion);
      } catch (err) {
        return res.status(400).json({ message: 'Formato de cargo_asignacion inválido' });
      }
    }

    // Crear el objeto con los datos del personal
    const personalData = {
      codigo,
      nombres,
      apellidos,
      numero_identidad,
      tipo_contrato,
      estado: estado || 'ACTIVO',
      cv,
      especialidades,
      area_trabajo,
      telefono,
      direccion_correo,
      cargo_asignacion: cargoAsignacionObj,
      salario,
      fecha_ingreso: fecha_ingreso || Date.now(),
      imagen: imagenBase64,
      tipo_imagen: tipoImagen,
      creado_por: req.user?._id || req.user?.id,
      fecha_creacion: new Date()
    };

    // Guardar en la base de datos
    const empleadoGuardado = await Personal.create(personalData);

    // Crear descripción detallada de lo que se creó
    const camposPrincipales = ['codigo', 'nombres', 'apellidos', 'tipo_contrato', 'estado']
      .filter(c => empleadoGuardado[c])
      .map(c => `${c}=${empleadoGuardado[c]}`)
      .join(', ');
    
    const descripcionDetallada = `Personal creado: ${camposPrincipales}`;

    // RESPUESTA EXITOSA
    res.status(201).json({
      success: true,
      message: 'Empleado creado exitosamente',
      data: empleadoGuardado
    });

    // Copia para auditoría SIN imagen
    const personalDataParaAuditoria = { ...personalData };
    delete personalDataParaAuditoria.imagen;
    delete personalDataParaAuditoria.tipo_imagen;
    delete personalDataParaAuditoria.cv;
    delete personalDataParaAuditoria.documentacion;

    // AUDITORÍA: Registrar después de enviar la respuesta
  

  } catch (error) {
    console.error('❌ Error al crear empleado:', error);

    // AUDITORÍA DE ERROR
    

    res.status(500).json({
      success: false,
      message: 'Error al crear el empleado',
      error: error.message
    });
  }
};

// Actualizar empleado (también permite nueva imagen)
exports.actualizarPersonal = async (req, res) => {
  try {
    console.log('🔄 Iniciando actualización de personal...');
    const { id } = req.params;

    if (!id) return res.status(400).json({ message: 'ID no proporcionado' });

    // Obtener el personal antes de actualizar (para auditoría)
    const personalAnterior = await Personal.findById(id);
    if (!personalAnterior) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    const body = req.body;

    // Validar duplicados
    if (body.codigo || body.numero_identidad) {
      const [codigoExiste, identidadExiste] = await Promise.all([
        body.codigo ? Personal.findOne({ codigo: body.codigo, _id: { $ne: id } }) : null,
        body.numero_identidad ? Personal.findOne({ numero_identidad: body.numero_identidad, _id: { $ne: id } }) : null
      ]);

      if (codigoExiste) return res.status(400).json({ message: 'El código ya está en uso' });
      if (identidadExiste) return res.status(400).json({ message: 'La identidad ya está en uso' });
    }

    // Procesar Imagen nueva si existe
    let imagenData = {};
    if (req.file) {
      console.log('📸 Archivo recibido, procesando con Sharp...');
      const processedBuffer = await sharp(req.file.buffer)
        .resize(600, 600, { fit: 'inside' })
        .jpeg({ quality: 60 })
        .toBuffer();
      
      imagenData = {
        imagen: processedBuffer.toString('base64'),
        tipo_imagen: 'image/jpeg'
      };
      console.log(`✅ Imagen procesada, tamaño aproximado: ${(imagenData.imagen.length / 1024 / 1024).toFixed(2)} MB`);
    }

    // Parsear cargo_asignacion
    let cargoObj = {};
    if (body.cargo_asignacion) {
      try {
        cargoObj = typeof body.cargo_asignacion === 'string' 
          ? JSON.parse(body.cargo_asignacion) 
          : body.cargo_asignacion;
      } catch (err) {
        return res.status(400).json({ message: 'Formato de cargo inválido' });
      }
    }

    // Construir objeto de actualización
    const updateData = {};
    const camposDisponibles = [
      'codigo', 'nombres', 'apellidos', 'numero_identidad', 
      'tipo_contrato', 'estado', 'cv', 'especialidades', 
      'area_trabajo', 'telefono', 'direccion_correo', 
      'salario', 'fecha_ingreso'
    ];

    camposDisponibles.forEach(campo => {
      if (body[campo] !== undefined && body[campo] !== 'null') {
        updateData[campo] = body[campo];
      }
    });

    if (Object.keys(cargoObj).length > 0) updateData.cargo_asignacion = cargoObj;
    if (imagenData.imagen) {
      updateData.imagen = imagenData.imagen;
      updateData.tipo_imagen = imagenData.tipo_imagen;
    }
    updateData.fecha_actualizacion = new Date();

    // ===== PREPARAR DATOS PARA AUDITORÍA =====
    const personalAnteriorObj = personalAnterior.toObject ? personalAnterior.toObject() : personalAnterior;
    
    const datosPreviosLimpios = { ...personalAnteriorObj };
    if (datosPreviosLimpios.imagen) {
      datosPreviosLimpios.imagen = "imagen no disponible en auditoría";
    }
    if (datosPreviosLimpios.tipo_imagen) {
      datosPreviosLimpios.tipo_imagen = "tipo no disponible";
    }
    delete datosPreviosLimpios.cv;
    delete datosPreviosLimpios.documentacion;

    const datosNuevosLimpios = { ...updateData };
    if (datosNuevosLimpios.imagen) {
      datosNuevosLimpios.imagen = "imagen no disponible en auditoría";
    }
    if (datosNuevosLimpios.tipo_imagen) {
      datosNuevosLimpios.tipo_imagen = "tipo no disponible";
    }
    delete datosNuevosLimpios.cv;
    delete datosNuevosLimpios.documentacion;
    // =========================================

    const { cambios, descripcion } = detectarCambiosEspecificos(datosPreviosLimpios, datosNuevosLimpios);

    // EJECUTAR ACTUALIZACIÓN
    const empleadoActualizado = await Personal.findByIdAndUpdate(
      id, 
      { $set: updateData }, 
      { new: true, runValidators: true }
    );

    // RESPUESTA EXITOSA
    res.status(200).json({
      success: true,
      message: 'Empleado actualizado correctamente',
      data: empleadoActualizado
    });

    // AUDITORÍA
    

  } catch (error) {
    console.error('Error en actualizarPersonal:', error);

    // AUDITORÍA DE ERROR
    

    res.status(500).json({ success: false, message: error.message });
  }
};

// Eliminar empleado
exports.eliminarPersonal = async (req, res) => {
  try {
    // Obtener el personal antes de eliminar (para auditoría)
    const personalEliminado = await Personal.findById(req.params.id);
    
    if (!personalEliminado) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    // Guardar datos importantes antes de eliminar
    const datosEliminados = {
      id: personalEliminado._id,
      codigo: personalEliminado.codigo,
      nombres: personalEliminado.nombres,
      apellidos: personalEliminado.apellidos,
      numero_identidad: personalEliminado.numero_identidad,
      tipo_contrato: personalEliminado.tipo_contrato,
      estado: personalEliminado.estado
    };

    // Eliminar el personal
    await Personal.findByIdAndDelete(req.params.id);

    // RESPUESTA EXITOSA
    res.status(200).json({
      success: true,
      message: 'Empleado eliminado exitosamente',
      data: personalEliminado
    });

    // AUDITORÍA
    

  } catch (error) {
    console.error('Error al eliminar empleado:', error);

    // AUDITORÍA DE ERROR
    
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el empleado',
      error: error.message
    });
  }
};

// Buscar por estado
exports.buscarPorEstado = async (req, res) => {
  try {
    const { estado } = req.params;
    const personal = await Personal.find({ estado }).sort({ fecha_creacion: -1 });
    res.status(200).json({
      success: true,
      count: personal.length,
      data: personal
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al buscar por estado',
      error: error.message
    });
  }
};

// Buscar por cargo
exports.buscarPorCargo = async (req, res) => {
  try {
    const { cargo } = req.params;
    const personal = await Personal.find({
      'cargo_asignacion.cargo': { $regex: cargo, $options: 'i' }
    }).sort({ fecha_creacion: -1 });
    res.status(200).json({
      success: true,
      count: personal.length,
      data: personal
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al buscar por cargo',
      error: error.message
    });
  }
};