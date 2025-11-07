const Personal = require('../Models/personalmodel');

// Obtener todo el personal
const obtenerPersonal = async (req, res) => {
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
const obtenerPersonalPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const empleado = await Personal.findById(id);
    
    if (!empleado) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }
    
    res.status(200).json(empleado);
  } catch (error) {
    console.error('Error al obtener empleado:', error);
    res.status(500).json({ 
      message: 'Error al obtener el empleado', 
      error: error.message 
    });
  }
};

// Crear nuevo empleado
const crearPersonal = async (req, res) => {
  try {
    const {
      codigo,
      nombres,
      apellidos,
      numero_identidad,
      tipo_contrato,
      estado,
      foto,
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

    // Validar que no exista el código
    const codigoExiste = await Personal.findOne({ codigo });
    if (codigoExiste) {
      return res.status(400).json({ 
        message: 'Ya existe un empleado con este código' 
      });
    }

    // Validar que no exista el número de identidad
    const identidadExiste = await Personal.findOne({ numero_identidad });
    if (identidadExiste) {
      return res.status(400).json({ 
        message: 'Ya existe un empleado con este número de identidad' 
      });
    }

    // Crear nuevo empleado
    const nuevoEmpleado = new Personal({
      codigo,
      nombres,
      apellidos,
      numero_identidad,
      tipo_contrato,
      estado: estado || 'ACTIVO',
      foto,
      cv,
      especialidades,
      area_trabajo,
      telefono,
      direccion_correo,
      cargo_asignacion,
      documentacion,
      salario,
      fecha_ingreso: fecha_ingreso || Date.now()
    });

    const empleadoGuardado = await nuevoEmpleado.save();
    res.status(201).json(empleadoGuardado);
  } catch (error) {
    console.error('Error al crear empleado:', error);
    
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Error de validación', 
        errores 
      });
    }
    
    res.status(500).json({ 
      message: 'Error al crear el empleado', 
      error: error.message 
    });
  }
};

// Actualizar empleado
const actualizarPersonal = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizados = req.body;

    // Si se está actualizando el código, verificar que no exista
    if (datosActualizados.codigo) {
      const codigoExiste = await Personal.findOne({ 
        codigo: datosActualizados.codigo,
        _id: { $ne: id }
      });
      
      if (codigoExiste) {
        return res.status(400).json({ 
          message: 'Ya existe un empleado con este código' 
        });
      }
    }

    // Si se está actualizando el número de identidad, verificar que no exista
    if (datosActualizados.numero_identidad) {
      const identidadExiste = await Personal.findOne({ 
        numero_identidad: datosActualizados.numero_identidad,
        _id: { $ne: id }
      });
      
      if (identidadExiste) {
        return res.status(400).json({ 
          message: 'Ya existe un empleado con este número de identidad' 
        });
      }
    }

    const empleadoActualizado = await Personal.findByIdAndUpdate(
      id,
      datosActualizados,
      { 
        new: true, 
        runValidators: true 
      }
    );

    if (!empleadoActualizado) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    res.status(200).json(empleadoActualizado);
  } catch (error) {
    console.error('Error al actualizar empleado:', error);
    
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Error de validación', 
        errores 
      });
    }
    
    res.status(500).json({ 
      message: 'Error al actualizar el empleado', 
      error: error.message 
    });
  }
};

// Eliminar empleado
const eliminarPersonal = async (req, res) => {
  try {
    const { id } = req.params;
    const empleadoEliminado = await Personal.findByIdAndDelete(id);

    if (!empleadoEliminado) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    res.status(200).json({ 
      message: 'Empleado eliminado exitosamente',
      empleado: empleadoEliminado
    });
  } catch (error) {
    console.error('Error al eliminar empleado:', error);
    res.status(500).json({ 
      message: 'Error al eliminar el empleado', 
      error: error.message 
    });
  }
};

// Buscar personal por estado
const buscarPorEstado = async (req, res) => {
  try {
    const { estado } = req.params;
    const personal = await Personal.find({ estado }).sort({ fecha_creacion: -1 });
    res.status(200).json(personal);
  } catch (error) {
    console.error('Error al buscar por estado:', error);
    res.status(500).json({ 
      message: 'Error al buscar por estado', 
      error: error.message 
    });
  }
};

// Buscar personal por cargo
const buscarPorCargo = async (req, res) => {
  try {
    const { cargo } = req.params;
    const personal = await Personal.find({ 
      'cargo_asignacion.cargo': { $regex: cargo, $options: 'i' } 
    }).sort({ fecha_creacion: -1 });
    res.status(200).json(personal);
  } catch (error) {
    console.error('Error al buscar por cargo:', error);
    res.status(500).json({ 
      message: 'Error al buscar por cargo', 
      error: error.message 
    });
  }
};

module.exports = {
  obtenerPersonal,
  obtenerPersonalPorId,
  crearPersonal,
  actualizarPersonal,
  eliminarPersonal,
  buscarPorEstado,
  buscarPorCargo
};