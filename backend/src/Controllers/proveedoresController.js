const Proveedor = require('../Models/proveedorModel');

// Obtener todos los proveedores
const obtenerProveedores = async (req, res) => {
  try {
    const proveedores = await Proveedor.find().sort({ fecha_creacion: -1 });
    res.status(200).json(proveedores);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({ 
      message: 'Error al obtener los proveedores', 
      error: error.message 
    });
  }
};

// Obtener un proveedor por ID
const obtenerProveedorPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const proveedor = await Proveedor.findById(id);
    
    if (!proveedor) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }
    
    res.status(200).json(proveedor);
  } catch (error) {
    console.error('Error al obtener proveedor:', error);
    res.status(500).json({ 
      message: 'Error al obtener el proveedor', 
      error: error.message 
    });
  }
};

// Crear nuevo proveedor
const crearProveedor = async (req, res) => {
  try {
    const {
      id_proveedor,
      nombre,
      contacto,
      email,
      telefono,
      empresa,
      direccion,
      ciudad,
      pais,
      sitio_web,
      rtn,
      tipo_proveedor,
      estado,
      calificacion,
      notas,
      condiciones_pago,
      tiempo_entrega_promedio,
      fecha_registro
    } = req.body;

    // Validar que no exista el id_proveedor
    const idExiste = await Proveedor.findOne({ id_proveedor });
    if (idExiste) {
      return res.status(400).json({ 
        message: 'Ya existe un proveedor con este ID' 
      });
    }

    // Validar que no exista el email
    const emailExiste = await Proveedor.findOne({ email });
    if (emailExiste) {
      return res.status(400).json({ 
        message: 'Ya existe un proveedor con este email' 
      });
    }

    // Crear nuevo proveedor
    const nuevoProveedor = new Proveedor({
      id_proveedor,
      nombre,
      contacto,
      email,
      telefono,
      empresa,
      direccion,
      ciudad,
      pais,
      sitio_web,
      rtn,
      tipo_proveedor,
      estado: estado || 'ACTIVO',
      calificacion,
      notas,
      condiciones_pago,
      tiempo_entrega_promedio,
      fecha_registro: fecha_registro || Date.now()
    });

    const proveedorGuardado = await nuevoProveedor.save();
    res.status(201).json(proveedorGuardado);
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Error de validación', 
        errores 
      });
    }
    
    res.status(500).json({ 
      message: 'Error al crear el proveedor', 
      error: error.message 
    });
  }
};

// Actualizar proveedor
const actualizarProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizados = req.body;

    // Si se está actualizando el id_proveedor, verificar que no exista
    if (datosActualizados.id_proveedor) {
      const idExiste = await Proveedor.findOne({ 
        id_proveedor: datosActualizados.id_proveedor,
        _id: { $ne: id }
      });
      
      if (idExiste) {
        return res.status(400).json({ 
          message: 'Ya existe un proveedor con este ID' 
        });
      }
    }

    // Si se está actualizando el email, verificar que no exista
    if (datosActualizados.email) {
      const emailExiste = await Proveedor.findOne({ 
        email: datosActualizados.email,
        _id: { $ne: id }
      });
      
      if (emailExiste) {
        return res.status(400).json({ 
          message: 'Ya existe un proveedor con este email' 
        });
      }
    }

    const proveedorActualizado = await Proveedor.findByIdAndUpdate(
      id,
      datosActualizados,
      { 
        new: true, 
        runValidators: true 
      }
    );

    if (!proveedorActualizado) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    res.status(200).json(proveedorActualizado);
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Error de validación', 
        errores 
      });
    }
    
    res.status(500).json({ 
      message: 'Error al actualizar el proveedor', 
      error: error.message 
    });
  }
};

// Eliminar proveedor
const eliminarProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const proveedorEliminado = await Proveedor.findByIdAndDelete(id);

    if (!proveedorEliminado) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    res.status(200).json({ 
      message: 'Proveedor eliminado exitosamente',
      proveedor: proveedorEliminado
    });
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    res.status(500).json({ 
      message: 'Error al eliminar el proveedor', 
      error: error.message 
    });
  }
};

// Buscar proveedores por estado
const buscarPorEstado = async (req, res) => {
  try {
    const { estado } = req.params;
    const proveedores = await Proveedor.find({ estado }).sort({ fecha_creacion: -1 });
    res.status(200).json(proveedores);
  } catch (error) {
    console.error('Error al buscar por estado:', error);
    res.status(500).json({ 
      message: 'Error al buscar por estado', 
      error: error.message 
    });
  }
};

// Buscar proveedores por tipo
const buscarPorTipo = async (req, res) => {
  try {
    const { tipo } = req.params;
    const proveedores = await Proveedor.find({ tipo_proveedor: tipo }).sort({ fecha_creacion: -1 });
    res.status(200).json(proveedores);
  } catch (error) {
    console.error('Error al buscar por tipo:', error);
    res.status(500).json({ 
      message: 'Error al buscar por tipo', 
      error: error.message 
    });
  }
};

// Buscar proveedores por calificación
const buscarPorCalificacion = async (req, res) => {
  try {
    const { calificacion } = req.params;
    const proveedores = await Proveedor.find({ calificacion: Number(calificacion) }).sort({ fecha_creacion: -1 });
    res.status(200).json(proveedores);
  } catch (error) {
    console.error('Error al buscar por calificación:', error);
    res.status(500).json({ 
      message: 'Error al buscar por calificación', 
      error: error.message 
    });
  }
};

module.exports = {
  obtenerProveedores,
  obtenerProveedorPorId,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor,
  buscarPorEstado,
  buscarPorTipo,
  buscarPorCalificacion
};