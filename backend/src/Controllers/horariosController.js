const mongoose = require("mongoose");
const { Types } = mongoose;
const Horario = require("../Models/Horario");

// Convierte "HH:MM" a minutos totales
function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// Verifica formato HH:MM
function validarFormatoHora(hora) {
  return /^\d{2}:\d{2}$/.test(hora);
}

// Valida datos obligatorios y formato
function validarDatos(horario) {
  const camposRequeridos = [
    "aula_id", "dia", "inicio", "fin", "docente_id", "grado", "asignatura",
  ];
  for (const campo of camposRequeridos) {
    if (!horario[campo]) return `El campo '${campo}' es obligatorio y no puede quedar vacío.`;
  }

  if (!validarFormatoHora(horario.inicio) || !validarFormatoHora(horario.fin)) {
    return "Las horas deben tener el formato correcto HH:MM (por ejemplo, 08:30 o 13:45).";
  }

  const inicioMin = timeToMinutes(horario.inicio);
  const finMin    = timeToMinutes(horario.fin);

  if (inicioMin >= finMin) {
    return "La hora de inicio debe ser menor que la hora de finalización.";
  }

  const diasPermitidos = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];
  for (const dia of horario.dia) {
    if (!diasPermitidos.includes(dia)) {
      return `El valor '${dia}' no es válido. Los días permitidos son: ${diasPermitidos.join(", ")}.`;
    }
  }

  return null;
}

// Comprueba conflictos con otros horarios
// Retorna objeto con detalle por tipo de conflicto, o null si no hay conflictos
const validarSinConflictos = async (datos, idExcluido = null) => {
  const conflictos = {};

  // Buscar horarios en los mismos días (excluyendo el actual si es edición)
  const query = { dia: { $in: datos.dia } };
  if (idExcluido) query._id = { $ne: new Types.ObjectId(idExcluido) };

  const horariosExistentes = await Horario.find(query);

  const nuevoInicio = timeToMinutes(datos.inicio);
  const nuevoFin    = timeToMinutes(datos.fin);

  horariosExistentes.forEach(h => {
    const hInicio   = timeToMinutes(h.inicio);
    const hFin      = timeToMinutes(h.fin);
    const hayChoque = hInicio < nuevoFin && nuevoInicio < hFin;

    if (!hayChoque) return;

    // Verificar días en común para el choque
    const diasEnComun = h.dia.filter(d => datos.dia.includes(d));
    if (diasEnComun.length === 0) return;

    const diasStr = diasEnComun.join(", ");
    const franjaStr = `${h.inicio}–${h.fin}`;

    if (h.aula_id.equals(datos.aula_id)) {
      conflictos.aula = {
        id: h.aula_id,
        dias: diasStr,
        franja: franjaStr,
        asignatura: h.asignatura,
      };
    }

    if (h.docente_id.equals(datos.docente_id)) {
      conflictos.docente = {
        id: h.docente_id,
        dias: diasStr,
        franja: franjaStr,
        asignatura: h.asignatura,
      };
    }

    const alumnosConflictivos = h.alumnos.filter(a =>
      datos.alumnos.map(String).includes(a.toString())
    );
    if (alumnosConflictivos.length > 0) {
      conflictos.alumnos = {
        ids: alumnosConflictivos,
        dias: diasStr,
        franja: franjaStr,
      };
    }
  });

  return Object.keys(conflictos).length > 0 ? conflictos : null;
};

// Construye mensaje de conflicto descriptivo
function mensajeConflicto(conflictos) {
  const detalles = [];

  if (conflictos.aula) {
    const { dias, franja, asignatura } = conflictos.aula;
    detalles.push(
      `El aula ya está ocupada los días ${dias} en el horario ${franja} (asignatura: ${asignatura}).`
    );
  }

  if (conflictos.docente) {
    const { dias, franja, asignatura } = conflictos.docente;
    detalles.push(
      `El docente ya tiene una clase asignada los días ${dias} en el horario ${franja} (asignatura: ${asignatura}).`
    );
  }

  if (conflictos.alumnos) {
    const { dias, franja } = conflictos.alumnos;
    detalles.push(
      `Uno o más alumnos ya tienen clase los días ${dias} en el horario ${franja}.`
    );
  }

  return detalles.join(" ");
}

// Parsea y valida campos comunes del body
function parsearDatos(body) {
  const { aula_id, docente_id, alumnos, dia, inicio, fin, grado, asignatura } = body;

  const camposFaltantes = [];
  if (!aula_id)    camposFaltantes.push("Aula");
  if (!docente_id) camposFaltantes.push("Docente");
  if (!dia || !Array.isArray(dia) || dia.length === 0) camposFaltantes.push("Día(s)");
  if (!inicio)     camposFaltantes.push("Hora de inicio");
  if (!fin)        camposFaltantes.push("Hora de fin");
  if (!grado)      camposFaltantes.push("Grado");
  if (!asignatura) camposFaltantes.push("Asignatura");

  if (camposFaltantes.length > 0) {
    return {
      error: {
        type: "VALIDACION",
        message: `Faltan campos obligatorios: ${camposFaltantes.join(", ")}`,
      },
    };
  }

  return {
    datos: {
      aula_id:    new Types.ObjectId(aula_id),
      docente_id: new Types.ObjectId(docente_id),
      alumnos:    Array.isArray(alumnos) ? alumnos.map(a => new Types.ObjectId(a)) : [],
      dia,
      inicio,
      fin,
      grado,
      asignatura,
    },
  };
}

// =======================
//  CONTROLADORES CRUD
// =======================

// Crear horario
exports.crearHorario = async (req, res) => {
  try {
    const { error, datos } = parsearDatos(req.body);
    if (error) return res.status(400).json(error);

    const errorValidacion = validarDatos(datos);
    if (errorValidacion) {
      return res.status(400).json({ type: "VALIDACION", message: errorValidacion });
    }

    const conflictos = await validarSinConflictos(datos);
    if (conflictos) {
      return res.status(400).json({
        type: "CONFLICTO",
        message: mensajeConflicto(conflictos),
      });
    }

    const nuevoHorario = new Horario(datos);
    await nuevoHorario.save();

    res.status(201).json({
      message: "El horario fue creado exitosamente y no presenta conflictos.",
    });
  } catch (err) {
    res.status(500).json({
      type: "SERVER",
      message: "Ocurrió un error interno al intentar crear el horario. Detalles: " + err.message,
    });
  }
};

// Actualizar horario
exports.actualizarHorario = async (req, res) => {
  try {
    const { error, datos } = parsearDatos(req.body);
    if (error) return res.status(400).json(error);

    const errorValidacion = validarDatos(datos);
    if (errorValidacion) {
      return res.status(400).json({ type: "VALIDACION", message: errorValidacion });
    }

    // Excluir el horario actual para no conflictuar consigo mismo
    const conflictos = await validarSinConflictos(datos, req.params.id);
    if (conflictos) {
      return res.status(400).json({
        type: "CONFLICTO",
        message: mensajeConflicto(conflictos),
      });
    }

    const actualHorario = await Horario.findByIdAndUpdate(req.params.id, datos, { new: true });
    if (!actualHorario) {
      return res.status(404).json({
        type: "NOT_FOUND",
        message: "No se encontró el horario solicitado. Es posible que haya sido eliminado anteriormente.",
      });
    }

    res.status(200).json({
      message: "Los datos del horario fueron actualizados correctamente.",
    });
  } catch (err) {
    res.status(500).json({
      type: "SERVER",
      message: "Ocurrió un error interno al intentar actualizar el horario. Detalles: " + err.message,
    });
  }
};

// Obtener todos los horarios
exports.obtenerHorarios = async (req, res) => {
  try {
    const horarios = await Horario.find();
    res.status(200).json(
      horarios.map(h => ({
        _id:        h._id,
        dia:        h.dia,
        inicio:     h.inicio,
        fin:        h.fin,
        grado:      h.grado,
        asignatura: h.asignatura,
        aula_id:    h.aula_id,
        docente_id: h.docente_id,
      }))
    );
  } catch (error) {
    res.status(500).json({
      type: "SERVER",
      message: "No se pudieron obtener los horarios debido a un error interno del servidor.",
    });
  }
};

// Obtener un horario por ID
exports.obtenerHorario = async (req, res) => {
  try {
    const horario = await Horario.findById(req.params.id);
    if (!horario) {
      return res.status(404).json({
        type: "NOT_FOUND",
        message: "El horario solicitado no existe o fue eliminado.",
      });
    }
    res.status(200).json(horario);
  } catch (error) {
    res.status(500).json({
      type: "SERVER",
      message: "No se pudo obtener la información del horario. Detalles: " + error.message,
    });
  }
};

// Eliminar horario
exports.eliminarHorario = async (req, res) => {
  try {
    const horario = await Horario.findByIdAndDelete(req.params.id);
    if (!horario) {
      return res.status(404).json({
        type: "NOT_FOUND",
        message: "El horario que intenta eliminar no existe o ya fue eliminado.",
      });
    }
    res.status(200).json({
      message: "El horario fue eliminado exitosamente.",
    });
  } catch (error) {
    res.status(500).json({
      type: "SERVER",
      message: "No se pudo eliminar el horario debido a un error del servidor. Detalles: " + error.message,
    });
  }
};