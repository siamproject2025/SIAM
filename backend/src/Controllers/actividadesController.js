const Actividad = require("../Models/Actividad");
const mongoose  = require("mongoose");

// ── Helper: verifica que el id sea un ObjectId válido ───────────
const esIdValido = (id) => mongoose.Types.ObjectId.isValid(id) && id !== 'undefined';

// ===== GET /actividades =============================================
const obtenerActividades = async (req, res) => {
  try {
    const actividades = await Actividad.find().sort({ fecha: 1 }).lean();
    res.status(200).json(actividades);
  } catch (error) {
    console.error("Error al obtener actividades:", error);
    res.status(500).json({ message: "Error al obtener actividades." });
  }
};

// ===== POST /actividades ============================================
// Agrega esta función helper al inicio del archivo (si no existe)
const getUserInfo = (req) => {
  const u = req.user;
  if (!u) return { id: 'sistema', email: 'sistema@escuela.edu' };
  return {
    id:    u.uid || u._id?.toString() || u.id || u.sub,
    email: u.email || 'sistema@escuela.edu'
  };
};

// ===== POST /actividades ============================================
const crearActividad = async (req, res) => {
  try {
    // ✅ Usar getUserInfo igual que en createBien
    const usuario = getUserInfo(req);
    
    if (!usuario.id) {
      return res.status(401).json({ message: "Usuario no identificado. Verifica el token." });
    }

    const { nombre, fecha, lugar, descripcion, categoria, color } = req.body;

    const erroresCampos = {};
    if (!nombre?.trim())      erroresCampos.nombre      = "El nombre es obligatorio.";
    if (!fecha)               erroresCampos.fecha       = "La fecha y hora son obligatorias.";
    if (!lugar?.trim())       erroresCampos.lugar       = "El lugar es obligatorio.";
    if (!descripcion?.trim()) erroresCampos.descripcion = "La descripción es obligatoria.";

    if (Object.keys(erroresCampos).length > 0) {
      return res.status(400).json({
        message: "Por favor completa todos los campos requeridos.",
        errores: erroresCampos,
      });
    }

    const fechaIngresada = new Date(fecha);
    if (isNaN(fechaIngresada.getTime())) {
      return res.status(400).json({ message: "La fecha ingresada no es válida." });
    }

    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    ayer.setHours(0, 0, 0, 0);

    if (fechaIngresada < ayer) {
      return res.status(400).json({ message: "La fecha no puede ser más de 1 día en el pasado." });
    }

    const categoriasDefault = {
      mantenimiento: ["mantenimiento", "reparación", "mantencion"],
      prestamo:      ["préstamo", "prestamo", "prestar"],
      activo:        ["activo", "inventario", "bien"],
    };
    let categoriaAsignada = categoria || "general";
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
      // ✅ Auditoría completa (igual que en createBien)
      creado_por: usuario.id,
      creado_por_email: usuario.email,
      fecha_creacion: new Date(),
      actualizado_por: usuario.id,
      actualizado_por_email: usuario.email,
      fecha_actualizacion: new Date(),
      // Datos de la actividad
      nombre: nombre.trim(),
      fecha: fechaIngresada,
      lugar: lugar.trim(),
      descripcion: descripcion.trim(),
      categoria: categoriaAsignada,
      color: color || "morado",
      usuario: usuario.id,  // Guarda el UID
    });

    const guardada = await nuevaActividad.save();
    console.log("✓ Actividad creada por:", usuario.email, "ID:", guardada._id);
    
    res.status(201).json({
      success: true,
      message: 'Actividad creada exitosamente',
      data: guardada,
      audit: {
        creado_por: usuario.email,
        fecha_creacion: guardada.fecha_creacion
      }
    });

  } catch (error) {
    console.error("✗ Error al crear actividad:", error);
    if (error.name === "ValidationError") {
      const msgs = Object.values(error.errors).map(e => e.message).join(", ");
      return res.status(400).json({ message: `Error de validación: ${msgs}` });
    }
    res.status(500).json({ message: "Error del servidor al crear la actividad.", error: error.message });
  }
};

// ===== PUT /actividades/:id =========================================
const actualizarActividad = async (req, res) => {
  try {
    const usuario = req.user?.uid || req.user?.id || req.user?._id?.toString();
    const { id }  = req.params;

    // ✅ Validar el id ANTES de usarlo — evita CastError de MongoDB
    if (!id || !esIdValido(id)) {
      return res.status(400).json({
        message: `ID de actividad inválido: "${id}". Verifica que estás enviando el _id correcto desde el frontend.`,
      });
    }

    if (!usuario) {
      return res.status(401).json({ message: "Usuario no identificado." });
    }

    const {
      nombre, fecha, lugar, descripcion, categoria, color,
      actualizado_por_email, fecha_actualizacion,
    } = req.body;

    const erroresCampos = {};
    if (!nombre?.trim())      erroresCampos.nombre      = "El nombre es obligatorio.";
    if (!fecha)               erroresCampos.fecha       = "La fecha y hora son obligatorias.";
    if (!lugar?.trim())       erroresCampos.lugar       = "El lugar es obligatorio.";
    if (!descripcion?.trim()) erroresCampos.descripcion = "La descripción es obligatoria.";

    if (Object.keys(erroresCampos).length > 0) {
      return res.status(400).json({
        message: "Por favor completa todos los campos requeridos.",
        errores: erroresCampos,
      });
    }

    const fechaIngresada = new Date(fecha);
    if (isNaN(fechaIngresada.getTime())) {
      return res.status(400).json({ message: "La fecha ingresada no es válida." });
    }

    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    ayer.setHours(0, 0, 0, 0);

    if (fechaIngresada < ayer) {
      return res.status(400).json({ message: "La fecha no puede ser más de 1 día en el pasado." });
    }

    const categoriasDefault = {
      mantenimiento: ["mantenimiento", "reparación", "mantencion"],
      prestamo:      ["préstamo", "prestamo", "prestar"],
      activo:        ["activo", "inventario", "bien"],
    };
    let categoriaAsignada = categoria || "general";
    if (!categoria) {
      const nombreLower = nombre.toLowerCase();
      for (const [cat, palabras] of Object.entries(categoriasDefault)) {
        if (palabras.some(p => nombreLower.includes(p))) { categoriaAsignada = cat; break; }
      }
    }

    const updateData = {
      nombre:                nombre.trim(),
      fecha:                 fechaIngresada,
      lugar:                 lugar.trim(),
      descripcion:           descripcion.trim(),
      categoria:             categoriaAsignada,
      color:                 color || "morado",
      usuario,
      actualizado_por_email: actualizado_por_email || null,
      fecha_actualizacion:   fecha_actualizacion ? new Date(fecha_actualizacion) : new Date(),
    };

    // ✅ Busca solo por _id — cualquier usuario puede editar
    const actividadActualizada = await Actividad.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!actividadActualizada) {
      return res.status(404).json({ message: `Actividad con ID "${id}" no encontrada.` });
    }

    console.log("✓ Actividad actualizada:", id, "por:", actualizado_por_email || usuario);
    res.status(200).json(actividadActualizada);

  } catch (error) {
    console.error("✗ Error al actualizar actividad:", error);
    if (error.name === "ValidationError") {
      const msgs = Object.values(error.errors).map(e => e.message).join(", ");
      return res.status(400).json({ message: `Error de validación: ${msgs}` });
    }
    if (error.name === "CastError") {
      return res.status(400).json({ message: `El ID proporcionado no tiene un formato válido: "${error.value}".` });
    }
    res.status(500).json({ message: "Error del servidor al actualizar.", error: error.message });
  }
};

// ===== DELETE /actividades/:id ======================================
const eliminarActividad = async (req, res) => {
  try {
    const usuario = req.user?.uid || req.user?.id || req.user?._id?.toString();
    const { id }  = req.params;

    // ✅ Validar el id ANTES de usarlo
    if (!id || !esIdValido(id)) {
      return res.status(400).json({
        message: `ID de actividad inválido: "${id}".`,
      });
    }

    if (!usuario) {
      return res.status(401).json({ message: "Usuario no identificado." });
    }

    // ✅ BUGS CORREGIDOS: era findOneAndDelete({ _id }) sin valor → ahora findByIdAndDelete(id)
    const actividadEliminada = await Actividad.findByIdAndDelete(id);

    if (!actividadEliminada) {
      return res.status(404).json({ message: `Actividad con ID "${id}" no encontrada.` });
    }

    console.log("✓ Actividad eliminada:", id, "por usuario:", usuario);
    res.status(200).json({ message: "Actividad eliminada correctamente.", _id: id });

  } catch (error) {
    console.error("✗ Error al eliminar actividad:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: `El ID proporcionado no tiene un formato válido.` });
    }
    res.status(500).json({ message: "Error del servidor al eliminar.", error: error.message });
  }
};

module.exports = { crearActividad, obtenerActividades, actualizarActividad, eliminarActividad };