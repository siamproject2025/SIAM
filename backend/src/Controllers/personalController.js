// controllers/personalController.js
const Personal = require('../Models/personalModel');
const multer = require('multer');
const sharp = require('sharp');

//  Configuración de multer para almacenar archivos en memoria
const upload = multer({ storage: multer.memoryStorage() });

// Ejemplo de uso en rutas:
// router.post('/personal', upload.single('imagen'), crearPersonal);

exports.uploadMiddleware = upload.single('imagen');

//  Obtener todo el personal
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

//  Obtener un empleado por ID
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

//  Crear nuevo empleado (con soporte para imagen)
exports.crearPersonal = async (req, res) => {
  try {
    const {
      codigo,
      nombres,
      apellidos,
      numero_identidad,
      tipo_contrato,
      estado,
      imagen,
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

    //  Validaciones de duplicados
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

    // ️ Procesamiento de imagen (si existe)
    let imagenBase64 = null;
    let tipoImagen = null;

    if (req.file) {
      console.log(' Archivo de imagen recibido, procesando...');
      const TARGET_WIDTH = 600;
      const TARGET_HEIGHT = 600;
      const QUALITY = 60;

      let imageSharp = sharp(req.file.buffer).resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: 'inside' });
      const processedBuffer = await imageSharp.jpeg({ quality: QUALITY }).toBuffer();

      imagenBase64 = processedBuffer.toString('base64');
      tipoImagen = 'image/jpeg';
      console.log(` Imagen procesada (${(imagenBase64.length / 1024 / 1024).toFixed(2)} MB)`);
    }
        let cargoAsignacionObj = null;
    if (cargo_asignacion) {
      try {
        cargoAsignacionObj = JSON.parse(cargo_asignacion);
      } catch (err) {
        return res.status(400).json({ message: 'Formato de cargo_asignacion inválido' });
      }
    }
    //  Crear nuevo registro
   const nuevoEmpleado = new Personal({
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
      tipo_imagen: tipoImagen
    });


    const empleadoGuardado = await nuevoEmpleado.save();

    res.status(201).json({
      success: true,
      message: 'Empleado creado exitosamente',
      data: empleadoGuardado
    });
  } catch (error) {
    console.error(' Error al crear empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el empleado',
      error: error.message
    });
  }
};

//  Actualizar empleado (también permite nueva imagen)
exports.actualizarPersonal = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validar que el ID sea válido
    if (!id) return res.status(400).json({ message: 'ID no proporcionado' });

    // 2. Extraer datos (asegurarnos de que no vengan como strings "undefined" o "null")
    const body = req.body;

    // 3. Validar duplicados (excluyendo el actual)
    if (body.codigo || body.numero_identidad) {
      const [codigoExiste, identidadExiste] = await Promise.all([
        body.codigo ? Personal.findOne({ codigo: body.codigo, _id: { $ne: id } }) : null,
        body.numero_identidad ? Personal.findOne({ numero_identidad: body.numero_identidad, _id: { $ne: id } }) : null
      ]);

      if (codigoExiste) return res.status(400).json({ message: 'El código ya está en uso' });
      if (identidadExiste) return res.status(400).json({ message: 'La identidad ya está en uso' });
    }

    // 4. Procesar Imagen nueva si existe
    let imagenData = {};
    if (req.file) {
      const processedBuffer = await sharp(req.file.buffer)
        .resize(600, 600, { fit: 'inside' })
        .jpeg({ quality: 60 })
        .toBuffer();
      
      imagenData = {
        imagen: processedBuffer.toString('base64'),
        tipo_imagen: 'image/jpeg'
      };
    }

    // 5. Parsear cargo_asignacion (Multer lo recibe como string)
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

    // 6. Construir objeto de actualización LIMPIO (solo campos con valor)
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

    // Añadir objetos procesados
    if (Object.keys(cargoObj).length > 0) updateData.cargo_asignacion = cargoObj;
    if (imagenData.imagen) {
      updateData.imagen = imagenData.imagen;
      updateData.tipo_imagen = imagenData.tipo_imagen;
    }

    // 7. EJECUTAR ACTUALIZACIÓN con $set para mayor seguridad
    const empleadoActualizado = await Personal.findByIdAndUpdate(
      id, 
      { $set: updateData }, 
      { new: true, runValidators: true }
    );

    if (!empleadoActualizado) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    res.status(200).json({
      success: true,
      message: 'Empleado actualizado correctamente',
      data: empleadoActualizado
    });

  } catch (error) {
    console.error('Error en actualizarPersonal:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


//  Eliminar empleado
exports.eliminarPersonal = async (req, res) => {
  try {
    const { id } = req.params;
    const empleadoEliminado = await Personal.findByIdAndDelete(id);

    if (!empleadoEliminado) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    res.status(200).json({
      success: true,
      message: 'Empleado eliminado exitosamente',
      data: empleadoEliminado
    });
  } catch (error) {
    console.error('Error al eliminar empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el empleado',
      error: error.message
    });
  }
};

//  Buscar por estado
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

//  Buscar por cargo
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
