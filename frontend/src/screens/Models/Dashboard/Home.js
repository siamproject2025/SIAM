import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell, CartesianGrid, PieChart, Pie, Legend, LineChart, Line
} from "recharts";
import { auth } from "../../../components/authentication/Auth";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import {
  FiUsers, FiShoppingCart, FiBox, FiBook, FiCalendar, 
  FiDollarSign, FiTrendingUp, FiDownload, 
  FiUserCheck, FiAward, FiLoader, FiAlertCircle
} from "react-icons/fi";
import "../../../styles/Home.css";
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const API_URL = process.env.REACT_APP_API_URL;
const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c084fc", "#e9d5ff"];

export default function Home() {
  const [data, setData] = useState({
    usuarios: null,
    alumnos: [],
    compras: [],
    bienes: [],
    libros: [],
    actividades: [],
    donaciones: [],
    personal: [],
    directiva: [],
    proveedores: [],
    grados: [],
    horarios: []
  });
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(new Date(new Date().setDate(1)));
  const [fechaFin, setFechaFin] = useState(new Date());
  const [selectedKPI, setSelectedKPI] = useState('all');

  // Función para validar y limitar fechas
  const maxDate = new Date();

  // Función auxiliar para extraer datos de diferentes formatos de respuesta
  const extractData = (response, defaultArray = []) => {
    if (!response) return defaultArray;
    
    if (Array.isArray(response)) return response;
    if (response.data && Array.isArray(response.data)) return response.data;
    if (response.users && Array.isArray(response.users)) return response.users;
    
    const possibleArrays = ['items', 'results', 'datos', 'registros'];
    for (const prop of possibleArrays) {
      if (response[prop] && Array.isArray(response[prop])) return response[prop];
    }
    
    return defaultArray;
  };

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };

        const results = await Promise.allSettled([
          axios.get(`${API_URL}/api/usuarios`, { headers }),
          axios.get(`${API_URL}/api/compras`, { headers }),
          axios.get(`${API_URL}/api/bienes`, { headers }),
          axios.get(`${API_URL}/api/biblioteca`, { headers }),
          axios.get(`${API_URL}/api/actividades`, { headers }),
          axios.get(`${API_URL}/api/matriculas`, { headers }),
          axios.get(`${API_URL}/api/donaciones`, { headers }),
          axios.get(`${API_URL}/api/personal`, { headers }),
          axios.get(`${API_URL}/api/directiva`, { headers }),
          axios.get(`${API_URL}/api/proveedores`, { headers }),
          axios.get(`${API_URL}/api/grados`, { headers }),
          axios.get(`${API_URL}/api/horario`, { headers })
        ]);

        setData({
          usuarios: results[0].status === "fulfilled" ? results[0].value.data : "no_access",
          compras: results[1].status === "fulfilled" ? extractData(results[1].value.data) : [],
          bienes: results[2].status === "fulfilled" ? extractData(results[2].value.data) : [],
          libros: results[3].status === "fulfilled" ? extractData(results[3].value.data) : [],
          actividades: results[4].status === "fulfilled" ? extractData(results[4].value.data) : [],
          alumnos: results[5].status === "fulfilled" ? extractData(results[5].value.data) : [],
          donaciones: results[6].status === "fulfilled" ? extractData(results[6].value.data) : [],
          personal: results[7].status === "fulfilled" ? extractData(results[7].value.data) : [],
          directiva: results[8].status === "fulfilled" ? extractData(results[8].value.data) : [],
          proveedores: results[9].status === "fulfilled" ? extractData(results[9].value.data) : [],
          grados: results[10].status === "fulfilled" ? extractData(results[10].value.data) : [],
          horarios: results[11].status === "fulfilled" ? extractData(results[11].value.data) : []
        });
      } catch (error) {
        console.error("Error crítico en Home:", error);
      } finally {
        setCargando(false);
      }
    };
    obtenerDatos();
  }, []);

  // Función para obtener nombre del grado por ID
  const obtenerNombreGrado = (gradoId) => {
    if (!gradoId || !data.grados || !Array.isArray(data.grados)) return 'No asignado';
    
    // Buscar el grado en el array de grados
    const grado = data.grados.find(g => {
      // Comparar por _id
      if (g._id && gradoId) {
        return g._id === gradoId || g._id.$oid === gradoId || g._id === gradoId.$oid;
      }
      return false;
    });
    
    return grado?.grado || grado?.nombre || 'No asignado';
  };

  // Función para filtrar por fecha
  const filtrarPorFecha = (item, campoFecha) => {
    if (!item || !item[campoFecha]) return false;
    const fecha = new Date(item[campoFecha]);
    return fecha >= fechaInicio && fecha <= fechaFin;
  };

  // Función segura para filtrar arrays
  const safeFilter = (array, callback) => {
    if (!Array.isArray(array)) return [];
    return array.filter(callback);
  };

  const safeMap = (array, callback) => {
    if (!Array.isArray(array)) return [];
    return array.map(callback);
  };

  const safeLength = (array) => {
    if (!Array.isArray(array)) return 0;
    return array.length;
  };

  // Datos filtrados por fecha
  const alumnosFiltrados = safeFilter(data.alumnos, a => filtrarPorFecha(a, 'fecha_matricula'));
  const comprasFiltradas = safeFilter(data.compras, c => filtrarPorFecha(c, 'fecha'));
  const donacionesFiltradas = safeFilter(data.donaciones, d => filtrarPorFecha(d, 'fecha'));
  const actividadesFiltradas = safeFilter(data.actividades, a => filtrarPorFecha(a, 'fecha'));
  const bienesFiltrados = safeFilter(data.bienes, b => filtrarPorFecha(b, 'fechaIngreso'));

  // Cálculos de KPI
  const totalEstudiantes = safeLength(data.alumnos);
  const totalEstudiantesPeriodo = safeLength(alumnosFiltrados);
  const totalPersonal = safeLength(data.personal) + safeLength(data.directiva);
  const personalActivo = safeFilter(data.personal, p => p?.estado === "ACTIVO").length;
  const totalCompras = safeLength(data.compras);
  const comprasMes = safeLength(comprasFiltradas);
  
  const totalDonaciones = safeLength(data.donaciones);
  const donacionesMes = safeLength(donacionesFiltradas);

  const totalProveedores = safeLength(data.proveedores);
  const proveedoresActivos = safeFilter(data.proveedores, p => p?.estado === "ACTIVO").length;

  const bienesPorEstado = [...new Set(safeMap(data.bienes, b => b?.estado).filter(Boolean))].map(estado => ({
    name: estado,
    value: safeFilter(data.bienes, b => b?.estado === estado).length,
  }));

  const librosDisponibles = safeFilter(data.libros, l => l?.disponible).length;

  const actividadesProximas = safeFilter(data.actividades, a => a?.fecha && new Date(a.fecha) >= new Date())
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .slice(0, 5);

  const comprasPorEstado = [...new Set(safeMap(data.compras, c => c?.estado).filter(Boolean))].map(estado => ({
    name: estado,
    value: safeFilter(data.compras, c => c?.estado === estado).length,
  }));

  // Datos para gráfica de tendencia
  const tendenciaMatriculas = alumnosFiltrados.reduce((acc, alumno) => {
    if (!alumno?.fecha_matricula) return acc;
    const fecha = new Date(alumno.fecha_matricula);
    const mes = fecha.toLocaleString('default', { month: 'short' });
    acc[mes] = (acc[mes] || 0) + 1;
    return acc;
  }, {});

  const dataTendencia = Object.keys(tendenciaMatriculas).map(mes => ({
    mes,
    matriculas: tendenciaMatriculas[mes]
  }));

  // Función para verificar si hay datos para exportar
  const tieneDatosParaExportar = () => {
    switch(selectedKPI) {
      case 'estudiantes':
        return alumnosFiltrados.length > 0;
      case 'personal':
        return (data.personal.length + data.directiva.length) > 0;
      case 'compras':
        return comprasFiltradas.length > 0;
      default:
        return true;
    }
  };

  // Función de exportación a Excel
  const exportToExcel = async (data, filename) => {
    try {
      setExportando(true);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Datos");
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error("Error exportando a Excel:", error);
      alert("Error al exportar a Excel: " + error.message);
    } finally {
      setExportando(false);
    }
  };

  // Función de exportación a PDF con jsPDF puro - MÁS ANCHO
  const exportToPDF = async (data, title) => {
    try {
      setExportando(true);
      
      await new Promise(resolve => setTimeout(resolve, 500));

      // Crear PDF con orientación horizontal y tamaño más ancho
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [297, 210] // A4 horizontal (5% más ancho que el estándar)
      });
      
      let yPos = 20;
      const lineHeight = 7;
      const marginLeft = 14;
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;

      // Título
      doc.setFontSize(18);
      doc.setTextColor(102, 126, 234);
      doc.text(title, marginLeft, yPos);
      yPos += lineHeight + 2;

      // Período
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text(`Período: ${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}`, marginLeft, yPos);
      yPos += lineHeight;
      doc.text(`Generado: ${new Date().toLocaleString()}`, marginLeft, yPos);
      yPos += lineHeight + 5;

      // Línea separadora
      doc.setDrawColor(200, 200, 200);
      doc.line(marginLeft, yPos - 2, pageWidth - 10, yPos - 2);

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      if (Array.isArray(data)) {
        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          
          // Calcular ancho de columna basado en el número de columnas
          const colWidth = (pageWidth - 30) / headers.length;
          
          // Dibujar encabezados
          doc.setFont("helvetica", "bold");
          let xPos = marginLeft;
          headers.forEach(header => {
            doc.text(header, xPos, yPos);
            xPos += colWidth;
          });
          yPos += lineHeight;
          
          // Línea debajo de encabezados
          doc.setDrawColor(102, 126, 234);
          doc.line(marginLeft, yPos - 3, pageWidth - 10, yPos - 3);
          
          // Dibujar datos
          doc.setFont("helvetica", "normal");
          data.forEach((item) => {
            if (yPos > pageHeight - 20) {
              doc.addPage();
              yPos = 20;
              
              // Repetir encabezados
              doc.setFont("helvetica", "bold");
              xPos = marginLeft;
              headers.forEach(header => {
                doc.text(header, xPos, yPos);
                xPos += colWidth;
              });
              yPos += lineHeight;
              doc.setFont("helvetica", "normal");
            }

            xPos = marginLeft;
            headers.forEach(header => {
              let value = item[header] || '';
              // Truncar texto si es necesario
              const maxLength = Math.floor(colWidth / 2); // Aproximación
              if (value.length > maxLength) {
                value = value.substring(0, maxLength - 3) + '...';
              }
              doc.text(String(value), xPos, yPos);
              xPos += colWidth;
            });
            yPos += lineHeight;
          });
        }
      } else {
        // Para resumen, usar una cuadrícula de 3 columnas
        doc.setFont("helvetica", "bold");
        doc.text("MÉTRICAS DEL DASHBOARD", marginLeft, yPos);
        yPos += lineHeight + 2;
        
        doc.setFont("helvetica", "normal");
        
        const entries = Object.entries(data);
        const colWidth = (pageWidth - 30) / 3;
        let xPos = marginLeft;
        let colCount = 0;
        
        entries.forEach(([key, value]) => {
          if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.text(`${key}: ${value}`, xPos, yPos);
          
          colCount++;
          if (colCount % 3 === 0) {
            yPos += lineHeight;
            xPos = marginLeft;
          } else {
            xPos += colWidth;
          }
        });
      }

      // Pie de página
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 40, pageHeight - 10);
      }

      doc.save(`${title}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Error exportando a PDF:", error);
      alert("Error al exportar a PDF: " + error.message);
    } finally {
      setExportando(false);
    }
  };

  const handleExport = async (type) => {
    if (!tieneDatosParaExportar()) {
      alert("No hay datos disponibles para exportar en el período seleccionado");
      return;
    }

    try {
      let exportData = [];
      let title = '';

      switch(selectedKPI) {
        case 'estudiantes':
          exportData = alumnosFiltrados.map(alumno => ({
            'Nombre': alumno?.nombre_completo || '',
            'Grado': obtenerNombreGrado(alumno?.grado_a_matricular),
            'Teléfono': alumno?.telefono_alumno || '',
            'Email Encargado': alumno?.email_encargado || '',
            'Fecha Matrícula': alumno?.fecha_matricula ? new Date(alumno.fecha_matricula).toLocaleDateString() : ''
          }));
          title = 'Estudiantes';
          break;
          
        case 'personal':
          const personalData = data.personal.map(p => ({
            'Nombre': `${p?.nombres || ''} ${p?.apellidos || ''}`,
            'Cargo': p?.cargo_asignacion?.cargo || '',
            'Teléfono': p?.telefono || '',
            'Estado': p?.estado || '',
            'Área': p?.area_trabajo || ''
          }));
          
          const directivaData = data.directiva.map(d => ({
            'Nombre': d?.nombre || '',
            'Cargo': d?.cargo || '',
            'Teléfono': d?.telefono || '',
            'Estado': d?.estado || '',
            'Área': 'Directiva'
          }));
          
          exportData = [...personalData, ...directivaData];
          title = 'Personal';
          break;
          
        case 'compras':
          exportData = comprasFiltradas.map(c => ({
            'Número': c?.numero || '',
            'Estado': c?.estado || '',
            'Fecha': c?.fecha ? new Date(c.fecha).toLocaleDateString() : '',
            'Items': c?.items?.length || 0
          }));
          title = 'Compras';
          break;
          
        default:
          exportData = {
            'Total Estudiantes': totalEstudiantes,
            'Estudiantes (período)': totalEstudiantesPeriodo,
            'Total Personal': totalPersonal,
            'Personal Activo': personalActivo,
            'Total Compras': totalCompras,
            'Compras (período)': comprasMes,
            'Total Donaciones': totalDonaciones,
            'Donaciones (período)': donacionesMes,
            'Total Bienes': safeLength(data.bienes),
            'Libros Disponibles': librosDisponibles,
            'Total Proveedores': totalProveedores,
            'Proveedores Activos': proveedoresActivos,
            'Próximas Actividades': actividadesProximas.length
          };
          title = 'Resumen_Dashboard';
      }

      if (type === 'excel') {
        await exportToExcel(exportData, title);
      } else {
        await exportToPDF(exportData, title);
      }
    } catch (error) {
      console.error("Error en exportación:", error);
      alert("Error al exportar: " + error.message);
    }
  };

  if (cargando) return (
    <div className="loader-container">
      <div className="spinner"></div>
      <p>Cargando Dashboard...</p>
    </div>
  );

  return (
    <div className="dashboard-container">
      {/* Loader de exportación */}
      {exportando && (
        <div className="export-loader-overlay">
          <div className="export-loader-content">
            <FiLoader className="export-spinner" />
            <p>Generando reporte...</p>
            <small>Por favor espere</small>
          </div>
        </div>
      )}

      {/* Header con filtros y exportación */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <span className="gradient-text">Panel de Control</span>
        </h1>
        
        <div className="header-controls">
          <div className="date-range">
            <div className="date-input">
              <FiCalendar className="input-icon" />
              <DatePicker
                selected={fechaInicio}
                onChange={date => setFechaInicio(date)}
                selectsStart
                startDate={fechaInicio}
                endDate={fechaFin}
                maxDate={maxDate}
                className="date-picker"
                dateFormat="dd/MM/yyyy"
                placeholderText="Fecha inicio"
              />
            </div>
            <span className="date-separator">-</span>
            <div className="date-input">
              <FiCalendar className="input-icon" />
              <DatePicker
                selected={fechaFin}
                onChange={date => setFechaFin(date)}
                selectsEnd
                startDate={fechaInicio}
                endDate={fechaFin}
                minDate={fechaInicio}
                maxDate={maxDate}
                className="date-picker"
                dateFormat="dd/MM/yyyy"
                placeholderText="Fecha fin"
              />
            </div>
          </div>

          <div className="export-section">
            <select 
              className="kpi-select"
              value={selectedKPI}
              onChange={(e) => setSelectedKPI(e.target.value)}
            >
              <option value="all">Resumen General</option>
              <option value="estudiantes">
                Estudiantes {totalEstudiantesPeriodo > 0 ? `(${totalEstudiantesPeriodo})` : '(0)'}
              </option>
              <option value="personal">
                Personal ({totalPersonal})
              </option>
              <option value="compras">
                Compras {comprasMes > 0 ? `(${comprasMes})` : '(0)'}
              </option>
            </select>

            <div className="export-buttons">
              <button 
                className={`export-btn excel ${!tieneDatosParaExportar() ? 'disabled' : ''}`}
                onClick={() => handleExport('excel')}
                disabled={exportando || !tieneDatosParaExportar()}
                title={!tieneDatosParaExportar() ? "No hay datos para exportar" : "Exportar a Excel"}
              >
                <FiDownload /> Excel
              </button>
              <button 
                className={`export-btn pdf ${!tieneDatosParaExportar() ? 'disabled' : ''}`}
                onClick={() => handleExport('pdf')}
                disabled={exportando || !tieneDatosParaExportar()}
                title={!tieneDatosParaExportar() ? "No hay datos para exportar" : "Exportar a PDF"}
              >
                <FiDownload /> PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card gradient-purple">
          <div className="kpi-icon-wrapper">
            <FiUsers className="kpi-icon" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Estudiantes</span>
            <h2 className="kpi-value">{totalEstudiantes}</h2>
            <span className="kpi-subtext">
              {totalEstudiantesPeriodo} en el período
            </span>
          </div>
        </div>

        <div className="kpi-card gradient-blue">
          <div className="kpi-icon-wrapper">
            <FiUserCheck className="kpi-icon" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Personal Activo</span>
            <h2 className="kpi-value">{personalActivo}/{totalPersonal}</h2>
            <span className="kpi-subtext">
              {safeLength(data.directiva)} directivos
            </span>
          </div>
        </div>

        <div className="kpi-card gradient-purple-light">
          <div className="kpi-icon-wrapper">
            <FiShoppingCart className="kpi-icon" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Compras</span>
            <h2 className="kpi-value">{comprasMes}</h2>
            <span className="kpi-subtext">
              del período ({totalCompras} total)
            </span>
          </div>
        </div>

        <div className="kpi-card gradient-blue-light">
          <div className="kpi-icon-wrapper">
            <FiDollarSign className="kpi-icon" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Donaciones</span>
            <h2 className="kpi-value">{donacionesMes}</h2>
            <span className="kpi-subtext">
              del período ({totalDonaciones} total)
            </span>
          </div>
        </div>

        <div className="kpi-card gradient-purple-soft">
          <div className="kpi-icon-wrapper">
            <FiBox className="kpi-icon" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Bienes</span>
            <h2 className="kpi-value">{safeLength(data.bienes)}</h2>
            <span className="kpi-subtext">
              {bienesPorEstado.find(e => e.name === "DISPONIBLE" || e.name === "ACTIVO")?.value || 0} disponibles
            </span>
          </div>
        </div>

        <div className="kpi-card gradient-blue-soft">
          <div className="kpi-icon-wrapper">
            <FiAward className="kpi-icon" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Proveedores</span>
            <h2 className="kpi-value">{proveedoresActivos}/{totalProveedores}</h2>
            <span className="kpi-subtext">
              activos
            </span>
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="charts-grid">
        {bienesPorEstado.length > 0 && (
          <div className="chart-card">
            <div className="chart-header">
              <h3>Distribución de Bienes</h3>
              <FiBox className="chart-icon" />
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={bienesPorEstado}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    {bienesPorEstado.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {comprasPorEstado.length > 0 && (
          <div className="chart-card">
            <div className="chart-header">
              <h3>Estado de Compras</h3>
              <FiShoppingCart className="chart-icon" />
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comprasPorEstado}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                    {comprasPorEstado.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {dataTendencia.length > 0 && (
          <div className="chart-card full-width">
            <div className="chart-header">
              <h3>Tendencia de Matrículas</h3>
              <FiTrendingUp className="chart-icon" />
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dataTendencia}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="matriculas" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    dot={{ fill: '#6366f1', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Tablas de datos recientes */}
      <div className="tables-grid">
        {actividadesProximas.length > 0 && (
          <div className="table-card">
            <div className="table-header">
              <h3>Próximas Actividades</h3>
              <FiCalendar className="table-icon" />
            </div>
            <div className="table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Actividad</th>
                    <th>Fecha</th>
                    <th>Lugar</th>
                  </tr>
                </thead>
                <tbody>
                  {actividadesProximas.map(act => (
                    <tr key={act._id}>
                      <td>{act.nombre}</td>
                      <td>{new Date(act.fecha).toLocaleDateString()}</td>
                      <td>{act.lugar}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data.compras.length > 0 && (
          <div className="table-card">
            <div className="table-header">
              <h3>Últimas Compras</h3>
              <FiShoppingCart className="table-icon" />
            </div>
            <div className="table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {data.compras.slice(0, 5).map(compra => (
                    <tr key={compra._id}>
                      <td>{compra.numero}</td>
                      <td>
                        <span className={`status-badge ${compra.estado?.toLowerCase()}`}>
                          {compra.estado}
                        </span>
                      </td>
                      <td>{new Date(compra.fecha).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data.libros.length > 0 && (
          <div className="table-card">
            <div className="table-header">
              <h3>Biblioteca - Últimos Libros</h3>
              <FiBook className="table-icon" />
            </div>
            <div className="table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Autor</th>
                    <th>Grado</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.libros.slice(0, 5).map(libro => (
                    <tr key={libro._id}>
                      <td>{libro.titulo}</td>
                      <td>{libro.autor}</td>
                      <td>{libro.grado}</td>
                      <td>
                        <span className={`status-badge ${libro.disponible ? 'disponible' : 'prestado'}`}>
                          {libro.disponible ? 'Disponible' : 'Prestado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Mensaje si no hay datos */}
      {safeLength(data.alumnos) === 0 && 
       safeLength(data.compras) === 0 && 
       safeLength(data.bienes) === 0 && 
       safeLength(data.actividades) === 0 && (
        <div className="no-data-message">
          <FiAlertCircle />
          <p>No hay datos disponibles para mostrar</p>
        </div>
      )}
    </div>
  );
}