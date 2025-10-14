const Horario = require('../Models/Horario');

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function validarFormatoHora(hora) {
  return /^\d{2}:\d{2}$/.test(hora);
}

function validarDatos(horario) {
  const camposRequeridos = ['aula_id', 'dia', 'inicio', 'fin', 'docente_id', 'grado', 'asignatura'];
  for (const campo of camposRequeridos) {
    if (!horario[campo]) return `El campo '${campo}' es obligatorio.`;
  }

  if (!validarFormatoHora(horario.inicio) || !validarFormatoHora(horario.fin)) {
    return 'El formato de hora debe ser HH:MM';
  }

  const inicioMin = timeToMinutes(horario.inicio);
  const finMin = timeToMinutes(horario.fin);

  if (inicioMin >= finMin) {
    return 'La hora de inicio debe ser menor que la hora de fin.';
  }

  const diasPermitidos = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
  if (!diasPermitidos.includes(horario.dia)) {
    return 'El campo "dia" debe ser uno de: LUN, MAR, MIE, JUE, VIE, SAB';
  }

  return null; // Sin errores
}

async function validarSinConflictos(nuevo) {
  const inicioMin = timeToMinutes(nuevo.inicio);
  const finMin = timeToMinutes(nuevo.fin);

  // Buscar conflictos en horarios que se solapan
  const conflictos = await Horario.find({
    dia: nuevo.dia,
    $or: [
      // Choque en la misma aula
      {
        aula_id: nuevo.aula_id,
        $expr: {
          $lt: [ { $toInt: { $substr: ["$inicio", 0, 2] } }, finMin ]
        }
      },
      // Para simplificar, usar condiciones normales para inicio/fin
      {
        aula_id: nuevo.aula_id,
        inicio: { $lt: nuevo.fin },
        fin: { $gt: nuevo.inicio }
      },
      // Docente con otra clase al mismo tiempo
      {
        docente_id: nuevo.docente_id,
        inicio: { $lt: nuevo.fin },
        fin: { $gt: nuevo.inicio }
      },
      // Docente enseñando al mismo grado a la misma hora
      {
        docente_id: nuevo.docente_id,
        grado: nuevo.grado,
        inicio: { $lt: nuevo.fin },
        fin: { $gt: nuevo.inicio }
      }
    ]
  });

  return conflictos.length === 0;
}

async function crearHorario(req, res) {
  const datos = req.body;

  const errorValidacion = validarDatos(datos);
  if (errorValidacion) {
    return res.status(400).json({ error: errorValidacion });
  }

  const nuevoHorario = new Horario(datos);

  try {
    const sinConflictos = await validarSinConflictos(nuevoHorario);
    if (!sinConflictos) {
      return res.status(400).json({ error: 'Conflicto de horario detectado con otro existente.' });
    }

    await nuevoHorario.save();
    res.status(201).json({ message: '✅ Horario creado correctamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { crearHorario };