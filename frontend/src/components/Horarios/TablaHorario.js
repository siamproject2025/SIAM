import { motion } from "framer-motion";
import { Search, HelpCircle, Plus, Edit, Users, Trash, Filter, Download, X } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import AdminOnly from '../../components/Plugins/AdminOnly';
import "../../styles/Models/horarios.css"
import { auth } from "../../components/authentication/Auth";

const BusquedaTablaHorarios = ({
  horarios,
  aulas,
  onDetalleHorario,
  onDetalleAlumnos,
  onCrearHorario,
  onEliminarHorario,
}) => {
  const [filtros, setFiltros] = useState({
    busqueda: "",
    grado: "",
    aula: ""
  });

  const [personal, setPersonal] = useState([]);
  const [loadingPersonal, setLoadingPersonal] = useState(false);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  // Cargar personal desde la API
  useEffect(() => {
    cargarPersonal();
  }, []);

  const cargarPersonal = async () => {
    try {
      setLoadingPersonal(true);
      const API_URL = process.env.REACT_APP_API_URL + "/api/personal";
       const user = auth.currentUser;
        const token = await user.getIdToken();
      const res = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`, 
        },
      });

      if (!res.ok) throw new Error("Error al cargar personal");

      const data = await res.json();
     
      setPersonal(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al obtener el personal:", err);
      setPersonal([]);
    } finally {
      setLoadingPersonal(false);
    }
  };

  // Función para normalizar IDs (maneja tanto string como objeto {$oid})
  const normalizarId = (id) => {
    if (!id) return null;
    if (typeof id === "string") return id;
    if (id.$oid) return id.$oid;
    return String(id);
  };

  // Obtener grados únicos para el filtro
  const gradosUnicos = useMemo(() => {
    const grados = horarios.map(horario => horario.grado).filter(Boolean);
    return [...new Set(grados)].sort();
  }, [horarios]);

  // Obtener aulas únicas para el filtro
  const aulasUnicas = useMemo(() => {
    return aulas.map(aula => ({
      id: normalizarId(aula._id),
      nombre: aula.grado
    })).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [aulas]);

  // Función para obtener nombre del docente
  const obtenerNombreDocente = (docenteId) => {
    if (!docenteId) return "Sin docente";

    const idNormalizado = normalizarId(docenteId);

    if (!personal.length) return "Cargando...";

    const docente = personal.find(p => normalizarId(p._id) === idNormalizado);

    return docente ? `${docente.nombres} ${docente.apellidos}` : "Docente no encontrado";
  };

  // Filtrar horarios
  const horariosFiltrados = useMemo(() => {
    return horarios.filter(horario => {
      const nombreDocente = obtenerNombreDocente(horario.docente_id);
      
      const coincideBusqueda = filtros.busqueda === "" || 
        horario.asignatura?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        horario.grado?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        aulas.find(aula => normalizarId(aula._id) === normalizarId(horario.aula_id))?.nombre?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        nombreDocente.toLowerCase().includes(filtros.busqueda.toLowerCase());

      const coincideGrado = filtros.grado === "" || horario.grado === filtros.grado;
      const coincideAula = filtros.aula === "" || normalizarId(horario.aula_id) === filtros.aula;

      return coincideBusqueda && coincideGrado && coincideAula;
    });
  }, [horarios, filtros, aulas, personal]);

  // Función para descargar PDF
  const descargarPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
  
    //  Logo institucional
    const logoUrl = "/Logo1.png";
    try {
      doc.addImage(logoUrl, "PNG", 15, 10, 25, 25);
    } catch (e) {
      console.warn(" No se pudo cargar el logo. Verifica /public/Logo1.png");
    }
  
    //  Encabezado institucional
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0, 102, 204);
    doc.text("Escuela Experimental de Niños para la Música", 105, 20, { align: "center" });
  
    //  Subtítulo del reporte
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text(" Reporte General de Horarios", 105, 28, { align: "center" });
  
    // Línea decorativa azul
    doc.setDrawColor(0, 102, 204);
    doc.line(14, 32, 196, 32);
  
    //  Información de filtros aplicados
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
  
    let infoFiltros = `Total de horarios: ${horariosFiltrados.length}`;
    if (filtros.grado) infoFiltros += ` | Grado: ${filtros.grado}`;
    if (filtros.aula) {
      const nombreAula = aulas.find(a => normalizarId(a._id) === filtros.aula)?.nombre;
      infoFiltros += ` | Aula: ${nombreAula || filtros.aula}`;
    }
    if (filtros.busqueda) infoFiltros += ` | Búsqueda: ${filtros.busqueda}`;
  
    doc.text(infoFiltros, 14, 40);
  
    //  Fecha de generación
    const fecha = new Date().toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    doc.text(`Generado: ${fecha}`, 14, 47);
  
    // Línea suave
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 50, 196, 50);
  
    //  Preparar datos para la tabla
    const tableData = horariosFiltrados.map((horario) => {
      const nombreAula =  aulas.find((aula) => normalizarId(aula._id) === normalizarId(horario.aula_id))?.aula || "N/A";
      const nombreGrado =  aulas.find((aula) => normalizarId(aula._id) === normalizarId(horario.aula_id))?.grado || "N/A";
      const nombreDocente = obtenerNombreDocente(horario.docente_id);
      return [
        horario.dia.join(", "),
        `${horario.inicio} - ${horario.fin}`,
        horario.asignatura,
        nombreAula,
        nombreGrado,
        nombreDocente
      ];
    });
  
    //  Generar tabla con estilo
    autoTable(doc, {
      startY: 55,
      head: [["Día", "Horario", "Asignatura", "Aula", "Grado", "Docente"]],
      body: tableData,
      theme: "striped",
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: [60, 60, 60],
      },
      headStyles: {
        fillColor: [0, 102, 204],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 248, 250] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 30 },
        2: { cellWidth: 40 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25 },
        5: { cellWidth: 35 },
      },
      didDrawPage: (data) => {
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
  
        //  Encabezado (en cada página)
        if (doc.internal.getNumberOfPages() > 1) {
          doc.addImage(logoUrl, "PNG", 15, 10, 20, 20);
          doc.setFontSize(14);
          doc.setTextColor(0, 102, 204);
          doc.text("Escuela Experimental de Niños para la Música", pageWidth / 2, 20, { align: "center" });
          doc.setFontSize(11);
          doc.setTextColor(60, 60, 60);
          doc.text("Reporte General de Horarios", pageWidth / 2, 27, { align: "center" });
          doc.line(14, 32, pageWidth - 14, 32);
        }
  
        //  Footer institucional
        doc.setFontSize(9);
        doc.setTextColor(130, 130, 130);
        doc.text(
          "Documento generado automáticamente por la Escuela Experimental de Niños para la Música - S.I.A.M.",
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
  
        //  Número de página
        const pageNum = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Página ${pageNum}`, pageWidth - 20, pageHeight - 10);
      },
    });
  
    //  Guardar PDF
    const nombreArchivo = `reporte_horarios_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(nombreArchivo);
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: "",
      grado: "",
      aula: ""
    });
  };

  const generarTabla = () => {
    return horariosFiltrados.map((horario, i) => {
    const aulaEncontrada = aulas.find(aula => normalizarId(aula._id) === normalizarId(horario.aula_id));
const nombreAula = aulaEncontrada ? `${aulaEncontrada.grado} | ${aulaEncontrada.aula}` : "N/A";


      const nombreDocente = obtenerNombreDocente(horario.docente_id);
      
      return (
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
          <td className="cell-autor">{nombreAula}</td>
          
          <td className="cell-autor">
            {loadingPersonal ? (
              <span className="text-muted">Cargando...</span>
            ) : (
              nombreDocente
            )}
          </td>
          <AdminOnly>
          <td className="cell-acciones justify-content-between">
            <a
              className="btn btn-outline-primary btn-sm"
              style={{ minWidth: 30, margin: "5px" }}
              onClick={() => onDetalleHorario(horario._id)}
            >
              <Edit />
            </a>
            <a
              className="btn btn-outline-success btn-sm"
              style={{ minWidth: 30, margin: "5px" }}
              onClick={() => onDetalleAlumnos(horario._id)}
            >
              <Users />
            </a>
            <a
              className="btn btn-outline-danger btn-sm"
              style={{ minWidth: 30, margin: "5px" }}
              onClick={() => onEliminarHorario(horario._id)}
            >
              <Trash />
            </a>
          </td>
          </AdminOnly>
        </tr>
      );
    });
  };

  return (
    <>
      {/* Barra de Filtros */}
      <motion.div
        className="donacion-busqueda-bar"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        style={{ marginTop: "2rem" }}
      >
        {/* Barra de Búsqueda */}
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
            placeholder="Buscar por asignatura, aula, grado o docente..."
            value={filtros.busqueda}
            onChange={(e) => handleFiltroChange("busqueda", e.target.value)}
          />
        </div>

        {/* Filtro por Grado */}
        

        {/* Filtro por Aula */}
        <div style={{ position: "relative", minWidth: "150px" }}>
          <select
            className="donacion-busqueda"
            value={filtros.aula}
            onChange={(e) => handleFiltroChange("aula", e.target.value)}
          >
            <option value="">Todas las aulas</option>
            {aulasUnicas.map((aula) => (
              <option key={aula.id} value={aula.id}>
                {aula.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Botón Limpiar Filtros */}
        {(filtros.grado || filtros.aula) && (
          <motion.button
            className="btn-ayuda"
            onClick={limpiarFiltros}
            title="Limpiar filtros"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Filter size={18} />
            Limpiar
          </motion.button>
        )}

        {/* Botón Descargar PDF */}
        {horariosFiltrados.length > 0 && (
          <motion.button
            className="btn-ayuda"
            onClick={descargarPDF}
            title="Descargar PDF"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 6px 20px rgba(46, 204, 113, 0.4)",
            }}
            whileTap={{ scale: 0.95 }}
            style={{ background: "linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)" }}
          >
            <Download size={18} />
            PDF
          </motion.button>
                      )}
              <motion.button
                className="btn-ayuda"
                title="Ver ayuda"
                onClick={() => setMostrarAyuda(true)}
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
        <AdminOnly>
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
        </AdminOnly>
      </motion.div>

      {/* Información de resultados */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-3"
      >
        <small className="text-muted">
          Mostrando {horariosFiltrados.length} de {horarios.length} horarios
          {filtros.grado && ` • Grado: ${filtros.grado}`}
          {filtros.aula && ` • Aula: ${aulas.find(a => normalizarId(a._id) === filtros.aula)?.nombre || filtros.aula}`}
          {horariosFiltrados.length > 0 && (
            <span> • <button 
              onClick={descargarPDF} 
              className="btn-link p-0 border-0 text-primary"
              style={{ background: 'none', textDecoration: 'underline' }}
            >
              Descargar PDF
            </button></span>
          )}
        </small>
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
              <th className="th-autor">grado | Aula</th>
             
              <th className="th-autor">Docente</th>
             <AdminOnly>
              <th className="th-autor" style={{ minWidth: 30 }}>
                Acciones
              </th>
              </AdminOnly> 
            </tr>
          </thead>
          <tbody>
            {horariosFiltrados.length > 0 ? (
              generarTabla()
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-4 text-muted">
                  No se encontraron horarios con los filtros aplicados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>
      {/* Barra de Filtros */}
    <motion.div
      className="donacion-busqueda-bar"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      style={{ marginTop: "2rem" }}
    >
      {/* ... otros elementos de la barra ... */}


      {/* ... resto de botones ... */}
    </motion.div>

    {/* ... resto del componente ... */}

    {/* Modal de Ayuda */}
    {mostrarAyuda && (
      <div className="horarios-modal-overlay horarios-modal-show">
        <div className="horarios-modal-content">
          <div className="horarios-modal-header">
            <h3 className="horarios-modal-title">
              <HelpCircle size={24} />
              Ayuda - Gestión de Horarios
            </h3>
            <button 
              className="horarios-modal-close"
              onClick={() => setMostrarAyuda(false)}
            >
              <X size={20} />
            </button>
          </div>

          <div className="horarios-modal-body">
            <div className="horarios-help-section">
              <h4 className="horarios-help-title">¿Cómo funciona el sistema de horarios?</h4>
              <p className="horarios-help-text">
                El módulo de horarios te permite gestionar las clases programadas, asignando 
                docentes, aulas y horarios específicos para cada asignatura.
              </p>
            </div>

            <div className="horarios-help-section">
              <h4 className="horarios-help-title">Funcionalidades principales:</h4>
              <ul className="horarios-help-list">
                <li className="horarios-help-item">
                  <strong>Búsqueda y filtros:</strong> Encuentra horarios por asignatura, aula, grado o docente
                </li>
                <li className="horarios-help-item">
                  <strong>Gestión de clases:</strong> Crea, edita y elimina horarios según necesidades
                </li>
                <li className="horarios-help-item">
                  <strong>Asignación de docentes:</strong> Vincula cada horario con un docente específico
                </li>
                <li className="horarios-help-item">
                  <strong>Control de aulas:</strong> Asigna espacios físicos para cada clase
                </li>
                <li className="horarios-help-item">
                  <strong>Reportes PDF:</strong> Descarga los horarios filtrados en formato PDF
                </li>
              </ul>
            </div>

            <div className="horarios-help-section">
              <h4 className="horarios-help-title">Iconos y acciones:</h4>
              <div className="horarios-icons-grid">
                <div className="horarios-icon-item">
                  <Edit size={16} className="horarios-icon-primary" />
                  <span>Editar horario</span>
                </div>
                <div className="horarios-icon-item">
                  <Users size={16} className="horarios-icon-success" />
                  <span>Gestionar alumnos</span>
                </div>
                <div className="horarios-icon-item">
                  <Trash size={16} className="horarios-icon-danger" />
                  <span>Eliminar horario</span>
                </div>
                <div className="horarios-icon-item">
                  <Download size={16} className="horarios-icon-info" />
                  <span>Descargar PDF</span>
                </div>
                <div className="horarios-icon-item">
                  <Plus size={16} className="horarios-icon-new" />
                  <span>Nuevo horario</span>
                </div>
              </div>
            </div>

            <div className="horarios-help-section">
              <h4 className="horarios-help-title">Consejos de uso:</h4>
              <div className="horarios-tips">
                <div className="horarios-tip">
                  <span className="horarios-tip-badge"></span>
                  <span>Usa los filtros para encontrar horarios específicos rápidamente</span>
                </div>
                <div className="horarios-tip">
                  <span className="horarios-tip-badge"></span>
                  <span>Verifica que no haya conflictos de horarios para el mismo docente o aula</span>
                </div>
                <div className="horarios-tip">
                  <span className="horarios-tip-badge"></span>
                  <span>Gestiona los alumnos desde el icono de "Usuarios" en cada horario</span>
                </div>
              </div>
            </div>
          </div>

          <div className="horarios-modal-footer">
            <button 
              className="horarios-modal-btn-close"
              onClick={() => setMostrarAyuda(false)}
            >
              Cerrar Ayuda
            </button>
          </div>
        </div>
      </div>
    )}
  
    </>
  );
  
};


export default BusquedaTablaHorarios;