import { motion } from "framer-motion";
import { Search, HelpCircle, Plus, Edit, Users, Trash } from "lucide-react";

const BusquedaTablaHorarios = ({
  horarios,
  aulas,
  onDetalleHorario,
  onDetalleAlumnos,
  onCrearHorario,
}) => {
  const generarTabla = () => {
    return horarios.map((horario, i) => (
      <tr key={i} className="table-row">
        <td className="cell-autor text-center">
          {horario.dia.map((dia, index) => (
            <span key={index} className="estado-badge">
              {dia}
            </span>
          ))}
        </td>
        <td className="cell-autor">
          {horario.inicio} - {horario.fin}
        </td>
        <td className="cell-autor">{horario.asignatura}</td>
        <td className="cell-autor">
          {aulas.filter((aula) => aula._id == horario.aula_id)[0]?.nombre ||
            "N/A"}
        </td>
        <td className="cell-autor">{horario.grado}</td>
        <td className="cell-acciones d-flex justify-content-between">
          <a
            className="btn btn-outline-primary btn-sm"
            style={{ minWidth: 30 }}
            onClick={() => onDetalleHorario(horario._id)}
          >
            <Edit />
          </a>
          <a
            className="btn btn-outline-success btn-sm"
            onClick={() => onDetalleAlumnos(horario._id)}
          >
            <Users />
          </a>
          <a
            className="btn btn-outline-danger btn-sm"
            // onClick={() => onDetalleAlumnos(horario._id)}
          >
            <Trash />
          </a>
        </td>
      </tr>
    ));
  };

  return (
    <>
      {/* Barra de Búsqueda */}
      <motion.div
        className="donacion-busqueda-bar"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        style={{ marginTop: "2rem" }}
      >
        <div style={{ position: "relative", flex: 1 }}>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#666",
            }}
          >
            <Search size={18} />
          </motion.div>
          <input
            type="text"
            className="donacion-busqueda"
            placeholder="Buscar por asignatura, aula o grado..."
            // value={}
          />
        </div>
        <motion.button
          className="btn-ayuda"
          title="Ver ayuda"
          whileHover={{
            scale: 1.08,
            boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)",
          }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <HelpCircle size={18} />
          </motion.div>
          Ayuda
        </motion.button>
        <motion.button
          className="btn-ayuda"
          onClick={onCrearHorario}
          title="Registrar nuevo horario"
          whileHover={{
            scale: 1.08,
            boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Plus size={18} />
          </motion.div>
          Nuevo
        </motion.button>
      </motion.div>

      {/* Tabla de Horarios */}
      <motion.div
        className="row table-responsive mt-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <table className="biblioteca-table">
          <thead>
            <tr>
              <th className="th-autor">Día</th>
              <th className="th-autor">Horario</th>
              <th className="th-autor">Asignatura</th>
              <th className="th-autor">Aula</th>
              <th className="th-autor">Grado</th>
              <th className="th-autor" style={{ minWidth: 30 }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>{generarTabla()}</tbody>
        </table>
      </motion.div>
    </>
  );
};

export default BusquedaTablaHorarios;
