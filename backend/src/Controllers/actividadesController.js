const Actividad = require("../Models/Actividad");

// ===== GET /actividades — Obtener todas las actividades del usuario autenticado =====
const obtenerActividades = async (req, res) => {
  try {
    const usuario = req.headers.usuario || req.user?.uid || req.user?.id;
    
    if (!usuario) {
      return res.status(401).json({ 
        message: "Usuario no identificado. Verifica el token." 
      });
    }

    const actividades = await Actividad.find({ usuario })
      .sort({ fecha: 1 })
      .lean();

    res.status(200).json(actividades);
  } catch (error) {
    console.error("Error al obtener actividades:", error);
    res.status(500).json({ message: "Error al obtener actividades." });
  }
};

// ===== POST /actividades — Crear nueva actividad =====
const crearActividad = async (req, res) => {
  try {
    const usuario = req.headers.usuario || req.user?.uid || req.user?.id;
    
    if (!usuario) {
      return res.status(401).json({ 
        message: "Usuario no identificado. Verifica el token." 
      });
    }

    const { nombre, fecha, lugar, descripcion, categoria, color } = req.body;

    // Validación de campos requeridos
    if (!nombre || !fecha || !lugar || !descripcion) {
      return res.status(400).json({ 
        message: "Todos los campos son obligatorios (nombre, fecha, lugar, descripcion)." 
      });
    }

    // Validar fecha no sea en el pasado
    const fechaIngresada = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaIngresada < hoy) {
      return res.status(400).json({ 
        message: "La fecha no puede ser en el pasado." 
      });
    }

    // Determinar categoría automáticamente si no viene especificada
    const categoriasDefault = {
      'mantenimiento': ['mantenimiento', 'reparación', 'mantencion'],
      'prestamo': ['préstamo', 'prestamo', 'prestar'],
      'activo': ['activo', 'inventario', 'bien'],
      'general': []
    };

    let categoriaAsignada = categoria || 'general';
    if (!categoria) {
      const nombreLower = nombre.toLowerCase();
      for (const [cat, palabras] of Object.entries(categoriasDefault)) {
        if (palabras.some(p => nombreLower.includes(p))) {
          categoriaAsignada = cat;
          break;
        }
      }
    }

    const nuevaActividad = new Actividad({
      nombre: nombre.trim(),
      fecha: fechaIngresada,
      lugar: lugar.trim(),
      descripcion: descripcion.trim(),
      categoria: categoriaAsignada,
      color: color || 'morado',
      usuario
    });

    const guardada = await nuevaActividad.save();

    console.log("✓ Actividad creada:", guardada._id);
    res.status(201).json(guardada);
  } catch (error) {
    console.error("✗ Error al crear actividad:", error);
    res.status(500).json({ 
      message: "Error del servidor al crear la actividad.",
      error: error.message 
    });
  }
};

// ===== PUT /actividades/:id — Actualizar actividad =====
const actualizarActividad = async (req, res) => {
  try {
    const usuario = req.headers.usuario || req.user?.uid || req.user?.id;
    const { id } = req.params;
    const { nombre, fecha, lugar, descripcion, categoria, color } = req.body;

    if (!usuario) {
      return res.status(401).json({ 
        message: "Usuario no identificado." 
      });
    }

    if (!nombre || !fecha || !lugar || !descripcion) {
      return res.status(400).json({ 
        message: "Todos los campos son obligatorios." 
      });
    }

    const fechaIngresada = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaIngresada < hoy) {
      return res.status(400).json({ 
        message: "La fecha no puede ser en el pasado." 
      });
    }

    // Determinar categoría automáticamente si no viene especificada
    const categoriasDefault = {
      'mantenimiento': ['mantenimiento', 'reparación', 'mantencion'],
      'prestamo': ['préstamo', 'prestamo', 'prestar'],
      'activo': ['activo', 'inventario', 'bien'],
      'general': []
    };

    let categoriaAsignada = categoria || 'general';
    if (!categoria) {
      const nombreLower = nombre.toLowerCase();
      for (const [cat, palabras] of Object.entries(categoriasDefault)) {
        if (palabras.some(p => nombreLower.includes(p))) {
          categoriaAsignada = cat;
          break;
        }
      }
    }

    const actividadActualizada = await Actividad.findOneAndUpdate(
      { _id: id, usuario },
      {
        nombre: nombre.trim(),
        fecha: fechaIngresada,
        lugar: lugar.trim(),
        descripcion: descripcion.trim(),
        categoria: categoriaAsignada,
        color: color || 'morado'
      },
      { new: true, runValidators: true }
    );

    if (!actividadActualizada) {
      return res.status(404).json({ 
        message: "Actividad no encontrada o no tienes permisos para modificarla." 
      });
    }

    console.log("✓ Actividad actualizada:", id);
    res.status(200).json(actividadActualizada);
  } catch (error) {
    console.error("✗ Error al actualizar actividad:", error);
    res.status(500).json({ 
      message: "Error del servidor al actualizar la actividad.",
      error: error.message 
    });
  }
};

// ===== DELETE /actividades/:id — Eliminar actividad =====
const eliminarActividad = async (req, res) => {
  try {
    const usuario = req.headers.usuario || req.user?.uid || req.user?.id;
    const { id } = req.params;

    if (!usuario) {
      return res.status(401).json({ 
        message: "Usuario no identificado." 
      });
    }

    const actividadEliminada = await Actividad.findOneAndDelete(
      { _id: id, usuario }
    );

    if (!actividadEliminada) {
      return res.status(404).json({ 
        message: "Actividad no encontrada o no tienes permisos para eliminarla." 
      });
    }

    console.log("✓ Actividad eliminada:", id);
    res.status(200).json({ 
      message: "Actividad eliminada correctamente.",
      _id: id 
    });
  } catch (error) {
    console.error("✗ Error al eliminar actividad:", error);
    res.status(500).json({ 
      message: "Error del servidor al eliminar la actividad.",
      error: error.message 
    });
  }
};

module.exports = {
  crearActividad,
  obtenerActividades,
  actualizarActividad,
  eliminarActividad,
};
