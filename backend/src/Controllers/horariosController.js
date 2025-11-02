const mongoose = require("mongoose");
const { Types } = mongoose;
const Horario = require("../Models/Horario");

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function validarFormatoHora(hora) {
  return /^\d{2}:\d{2}$/.test(hora);
}

function validarDatos(horario) {
  const camposRequeridos = [
    "aula_id",
    "dia",
    "inicio",
    "fin",
    "docente_id",
    "grado",
    "asignatura",
  ];
  for (const campo of camposRequeridos) {
    if (!horario[campo]) return `El campo '${campo}' es obligatorio.`;
  }

  if (!validarFormatoHora(horario.inicio) || !validarFormatoHora(horario.fin)) {
    return "El formato de hora debe ser HH:MM";
  }

  const inicioMin = timeToMinutes(horario.inicio);
  const finMin = timeToMinutes(horario.fin);

  if (inicioMin >= finMin) {
    return "La hora de inicio debe ser menor que la hora de fin.";
  }

  const diasPermitidos = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];

  horario.dia.forEach((dia) => {
    if (!diasPermitidos.includes(dia)) {
      return 'El campo "dia" debe ser uno de: LUN, MAR, MIE, JUE, VIE, SAB';
    }
  });

  return null; // Sin errores
}

async function validarSinConflictos(nuevo, horarioIdExcluir = null) {
  const condiciones = {
    // Validar que haya al menos un día en común
    dia: { $in: nuevo.dia },
    $or: [
      // Conflicto en misma aula
      {
        aula_id: nuevo.aula_id,
        inicio: { $lt: nuevo.fin },
        fin: { $gt: nuevo.inicio },
      },
      // Conflicto con mismo docente
      {
        docente_id: nuevo.docente_id,
        inicio: { $lt: nuevo.fin },
        fin: { $gt: nuevo.inicio },
      },
      // Conflicto con mismo alumno (si existe alumno_id)
      ...(nuevo.alumno_id
        ? [
            {
              alumno_id: nuevo.alumno_id,
              inicio: { $lt: nuevo.fin },
              fin: { $gt: nuevo.inicio },
            },
          ]
        : []),
    ],
  };

  // Excluir el horario actual si se está editando
  if (horarioIdExcluir) {
    condiciones._id = { $ne: horarioIdExcluir };
  }

  const conflictos = await Horario.find(condiciones);
  return conflictos.length === 0;
}

exports.crearHorario = async (req, res) => {
  const datos = {
    ...req.body,
    aula_id: new Types.ObjectId(req.body.aula_id),
    docente_id: new Types.ObjectId(req.body.docente_id),
    alumnos: req.body.alumnos.map((alumno) => new Types.ObjectId(alumno)),
  };

  const errorValidacion = validarDatos(datos);
  if (errorValidacion) {
    return res.status(400).json({ error: errorValidacion });
  }

  try {
    const nuevoHorario = new Horario(datos);
    const sinConflictos = await validarSinConflictos(nuevoHorario);
    if (!sinConflictos) {
      return res
        .status(400)
        .json({ error: "Conflicto de horario detectado con otro existente." });
    }

    await nuevoHorario.save();
    res.status(201).json({ message: "✅ Horario creado correctamente." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.actualizarHorario = async (req, res) => {
  const datos = {
    ...req.body,
    aula_id: new Types.ObjectId(req.body.aula_id),
    docente_id: new Types.ObjectId(req.body.docente_id),
    alumnos: req.body.alumnos.map((alumno) => new Types.ObjectId(alumno)),
  };

  const errorValidacion = validarDatos(datos);

  if (errorValidacion) {
    return res.status(400).json({ error: errorValidacion });
  }

  try {
    const sinConflictos = await validarSinConflictos(datos, req.params.id);

    if (!sinConflictos)
      return res
        .status(400)
        .json({ error: "Conflicto de horario detectado con otro existente." });

    const actualHorario = await Horario.findByIdAndUpdate(
      req.params.id,
      datos,
      { new: true }
    );

    if (!actualHorario)
      return res.status(404).json({ message: "Horario no encontrado" });

    res.status(200).json(actualHorario);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.obtenerHorarios = async (req, res) => {
  try {
    const horarios = await Horario.find();
    res.status(200).json(
      horarios.map((horario) => ({
        _id: horario._id,
        dia: horario.dia,
        inicio: horario.inicio,
        fin: horario.fin,
        grado: horario.grado,
        asignatura: horario.asignatura,
        aula_id: horario.aula_id,
      }))
    );
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener horarios", error: error.message });
  }
};

exports.obtenerHorario = async (req, res) => {
  try {
    const horario = await Horario.findById(req.params.id);

    if (!horario) {
      return res.status(404).json({ message: "Horario no encontrado" });
    }

    res.status(200).json(horario);
  } catch (error) {
    console.error(
      `Error al obtener el horario ${req.params.id}: ${error.message}`
    );
    res
      .status(500)
      .json({ message: `Error al obtener el horario`, error: error.message });
  }
};

exports.eliminarHorario = async (req, res) => {
  try {
    const horario = await Horario.findByIdAndDelete(req.params.id);

    if (!horario) {
      return res.status(404).json({ message: "Horario no encontrado" });
    }

    res.status(200).json({ message: "Horario eliminado correctamente" });
  } catch (error) {
    console.error(
      `Error al obtener el horario ${req.params.id}: ${error.message}`
    );
    res
      .status(500)
      .json({ message: `Error al obtener el horario`, error: error.message });
  }
};
