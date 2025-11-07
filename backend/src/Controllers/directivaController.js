const Directiva = require('../models/directivaModel');

// @desc    Obtener todos los miembros de la directiva
// @route   GET /api/directiva
// @access  Public
const obtenerMiembrosDirectiva = async (req, res) => {
  try {
    const { estado, cargo } = req.query;
    let filtro = {};

    if (estado) filtro.estado = estado;
    if (cargo) filtro.cargo = { $regex: cargo, $options: 'i' };

    const miembros = await Directiva.find(filtro)
      .select('-documentos_pdf.archivo_binario') // Excluir binarios para listar
      .sort({ nombre: 1 });

    res.json({
      success: true,
      count: miembros.length,
      data: miembros
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener los miembros de la directiva',
      error: error.message
    });
  }
};

// @desc    Obtener un miembro de la directiva por ID
// @route   GET /api/directiva/:id
// @access  Public
const obtenerMiembroPorId = async (req, res) => {
  try {
    const miembro = await Directiva.findById(req.params.id);

    if (!miembro) {
      return res.status(404).json({
        success: false,
        message: 'Miembro de la directiva no encontrado'
      });
    }

    res.json({
      success: true,
      data: miembro
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al obtener el miembro de la directiva',
      error: error.message
    });
  }
};

// @desc    Crear un nuevo miembro de la directiva
// @route   POST /api/directiva
// @access  Public
const crearMiembroDirectiva = async (req, res) => {
  try {
    const miembro = new Directiva(req.body);
    const nuevoMiembro = await miembro.save();

    res.status(201).json({
      success: true,
      message: 'Miembro de la directiva creado exitosamente',
      data: nuevoMiembro
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }
    if (error.name === 'ValidationError') {
      const mensajesError = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: mensajesError
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al crear el miembro de la directiva',
      error: error.message
    });
  }
};

// @desc    Actualizar un miembro de la directiva
// @route   PUT /api/directiva/:id
// @access  Public
const actualizarMiembroDirectiva = async (req, res) => {
  try {
    const miembro = await Directiva.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!miembro) {
      return res.status(404).json({
        success: false,
        message: 'Miembro de la directiva no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Miembro de la directiva actualizado exitosamente',
      data: miembro
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }
    if (error.name === 'ValidationError') {
      const mensajesError = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: mensajesError
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el miembro de la directiva',
      error: error.message
    });
  }
};

// @desc    Eliminar un miembro de la directiva
// @route   DELETE /api/directiva/:id
// @access  Public
const eliminarMiembroDirectiva = async (req, res) => {
  try {
    const miembro = await Directiva.findByIdAndDelete(req.params.id);

    if (!miembro) {
      return res.status(404).json({
        success: false,
        message: 'Miembro de la directiva no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Miembro de la directiva eliminado exitosamente',
      data: miembro
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el miembro de la directiva',
      error: error.message
    });
  }
};

// @desc    Agregar documento PDF a un miembro
// @route   POST /api/directiva/:id/documentos
// @access  Public
const agregarDocumento = async (req, res) => {
  try {
    const miembro = await Directiva.findById(req.params.id);

    if (!miembro) {
      return res.status(404).json({
        success: false,
        message: 'Miembro de la directiva no encontrado'
      });
    }

    await miembro.agregarDocumento(req.body);

    res.json({
      success: true,
      message: 'Documento agregado exitosamente'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }
    if (error.name === 'ValidationError') {
      const mensajesError = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: mensajesError
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al agregar el documento',
      error: error.message
    });
  }
};

// @desc    Obtener estadísticas de la directiva
// @route   GET /api/directiva/estadisticas/estados
// @access  Public
const obtenerEstadisticas = async (req, res) => {
  try {
    const estadisticas = await Directiva.aggregate([
      {
        $group: {
          _id: '$estado',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Directiva.countDocuments();

    res.json({
      success: true,
      data: {
        estadisticas,
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener las estadísticas',
      error: error.message
    });
  }
};

module.exports = {
  obtenerMiembrosDirectiva,
  obtenerMiembroPorId,
  crearMiembroDirectiva,
  actualizarMiembroDirectiva,
  eliminarMiembroDirectiva,
  agregarDocumento,
  obtenerEstadisticas
};