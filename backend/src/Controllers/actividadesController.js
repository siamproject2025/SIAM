const Actividad = require("../Models/Actividad");

// POST /actividades
const crearActividad = async (req, res) => {
  try {
   

    const { nombre, fecha=Date, lugar, descripcion } = req.body;

    if (!nombre || !fecha || !lugar || !descripcion) {
      console.log(" Faltan campos obligatorios");
      return res.status(400).json({ mensaje: "Todos los campos son obligatorios." });
    }

    const fechaIngresada = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaIngresada < hoy) {
      console.log(" Fecha pasada");
      return res.status(400).json({ mensaje: "La fecha no puede ser en el pasado." });
    }

    const nuevaActividad = new Actividad({
      nombre,
      fecha: fechaIngresada,
      lugar,
      descripcion
    });

    

    await nuevaActividad.save();

    console.log("Actividad guardada");
    res.status(201).json(nuevaActividad);
  } catch (error) {
    console.error(" Error al registrar actividad:", error);
    res.status(500).json({ mensaje: "Error del servidor al crear la actividad." });
  }
};


// GET /actividades (opcional si necesitas consultarlas)
const obtenerActividades = async (req, res) => {
  try {
    const actividades = await Actividad.find().sort({ fecha: 1 });
    res.status(200).json(actividades);
  } catch (error) {
    console.error("Error al obtener actividades:", error);
    res.status(500).json({ mensaje: "Error al obtener actividades." });
  }
};



// Actualizar actividad
const actualizarActividad = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, fecha, lugar, descripcion } = req.body;

    if (!nombre || !fecha || !lugar || !descripcion) {
      return res.status(400).json({ mensaje: "Todos los campos son obligatorios." });
    }

    const fechaIngresada = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaIngresada < hoy) {
      return res.status(400).json({ mensaje: "La fecha no puede ser en el pasado." });
    }

    const actividadActualizada = await Actividad.findByIdAndUpdate(
      id,
      { nombre, fecha: fechaIngresada, lugar, descripcion },
      { new: true }
    );

    if (!actividadActualizada) {
      return res.status(404).json({ mensaje: "Actividad no encontrada." });
    }

    res.status(200).json(actividadActualizada);
  } catch (error) {
    console.error("Error al actualizar actividad:", error);
    res.status(500).json({ mensaje: "Error del servidor al actualizar la actividad." });
  }
};

// Eliminar actividad
const eliminarActividad = async (req, res) => {
  try {
    const { id } = req.params;

    const actividadEliminada = await Actividad.findByIdAndDelete(id);

    if (!actividadEliminada) {
      return res.status(404).json({ mensaje: "Actividad no encontrada." });
    }

    res.status(200).json({ mensaje: "Actividad eliminada correctamente." });
  } catch (error) {
    console.error("Error al eliminar actividad:", error);
    res.status(500).json({ mensaje: "Error del servidor al eliminar la actividad." });
  }
};

module.exports = {
  crearActividad,
  obtenerActividades,
  actualizarActividad,
  eliminarActividad,
};
