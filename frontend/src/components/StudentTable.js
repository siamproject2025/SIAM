import React, { useEffect,useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Edit, Trash2, Filter, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../styles/StudentTable.css';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { auth } from "../components/authentication/Auth";

const API_HOST = process.env.REACT_APP_API_URL;
const API_GRADOS = `${API_HOST}/api/grados`;

const StudentTable = ({ students, loading, selectedStudents, onSelectionChange, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [grados, setGrados] = useState([]);
  const itemsPerPage = 10;

  const studentsArray = students || [];

  const obtenerGrados = async () => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      const config = { 
        headers: { 
          Authorization: `Bearer ${token}` 
        } 
      };
  
      const response = await axios.get(API_GRADOS, config);
  
      // Mapear cada grado con _id y nombre
      const gradosList = response.data.items.map(item => ({
        _id: item._id,
        nombre: item.grado // Ajusta según tu API
      }));
  
      setGrados(gradosList);
  
    } catch (error) {
      console.error(" Error al cargar los grados:", error);
     
  
      // Grados por defecto en caso de error (usando _id falso para compatibilidad)
      setGrados([
        { _id: '1', nombre: 'Primer Grado' },
        { _id: '2', nombre: 'Segundo Grado' },
        { _id: '3', nombre: 'Tercer Grado' },
        { _id: '4', nombre: 'Cuarto Grado' },
        { _id: '5', nombre: 'Quinto Grado' },
        { _id: '6', nombre: 'Sexto Grado' }
      ]);
  
    } 
  };
  
  
     useEffect(() => {
      obtenerGrados();
    }, []);
  
    // Agrega esta función para obtener el nombre del grado por _id
  const getNombreGrado = (gradoId) => {
    const grado = grados.find(g => g._id === gradoId);
    return grado ? grado.nombre : gradoId; // Si no encuentra, devuelve el ID como fallback
  };
  // Obtener grados únicos y años únicos
  const { uniqueGrades, uniqueYears } = useMemo(() => {
  const grades = [...new Set(studentsArray.map(student => student.grado_a_matricular).filter(Boolean))];
  const years = [...new Set(
    studentsArray
      .map(student => student.fecha_matricula ? new Date(student.fecha_matricula).getFullYear() : null)
      .filter(Boolean)
  )].sort((a, b) => b - a);

  return { uniqueGrades: grades, uniqueYears: years };
}, [studentsArray]);
  // Filtrar estudiantes
  const filteredStudents = useMemo(() => {
    let filtered = studentsArray;

    // Filtro por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(student => 
        student.nombre_completo?.toLowerCase().includes(term) ||
        student.id_documento?.toLowerCase().includes(term) ||
        student.grado_a_matricular?.toLowerCase().includes(term) ||
        student.nombre_encargado?.toLowerCase().includes(term) ||
        student.telefono_encargado?.toLowerCase().includes(term) ||
        student.genero?.toLowerCase().includes(term)
      );
    }

    // Filtro por grados seleccionados
    if (selectedGrades.length > 0) {
      filtered = filtered.filter(student => 
        selectedGrades.includes(student.grado_a_matricular)
      );
    }

    // Filtro por año de matrícula
    if (selectedYear) {
      filtered = filtered.filter(student => 
        student.fecha_matricula && 
        new Date(student.fecha_matricula).getFullYear().toString() === selectedYear
      );
    }

    return filtered;
  }, [studentsArray, searchTerm, selectedGrades, selectedYear]);

  // Calcular datos de paginación
  const paginationData = useMemo(() => {
    const totalItems = filteredStudents.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredStudents.slice(startIndex, endIndex);

    return {
      totalItems,
      totalPages,
      currentItems,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, totalItems)
    };
  }, [filteredStudents, currentPage]);

  const { totalItems, totalPages, currentItems, startIndex, endIndex } = paginationData;

  // Toggle para selección de grados
  const toggleGradeSelection = (grade) => {
    if (selectedGrades.includes(grade)) {
      setSelectedGrades(selectedGrades.filter(g => g !== grade));
    } else {
      setSelectedGrades([...selectedGrades, grade]);
    }
  };

  // Seleccionar/deseleccionar todos los grados
  const toggleAllGrades = () => {
    if (selectedGrades.length === uniqueGrades.length) {
      setSelectedGrades([]);
    } else {
      setSelectedGrades([...uniqueGrades]);
    }
  };

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setSelectedGrades([]);
    setSelectedYear("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Descargar PDF
  const downloadPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [250, 350],
    });

    //  Logo institucional
    const logoUrl = "/Logo1.png";
    try {
      doc.addImage(logoUrl, "PNG", 15, 10, 25, 25);
    } catch (e) {
      console.warn("️ No se pudo cargar el logo. Verifica /public/Logo1.png");
    }

    //  Encabezado
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0, 102, 204);
    doc.text("Escuela Experimental de Niños para la Música", 210, 20, { align: "center" });

    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text("Reporte Completo de Estudiantes", 210, 30, { align: "center" });

    // Línea decorativa
    doc.setDrawColor(0, 102, 204);
    doc.line(14, 35, 410, 35);

    //  Filtros
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);

    let yPosition = 42;
    let filterInfo = "Todos los estudiantes";
    if (searchTerm || selectedGrades.length > 0 || selectedYear) {
      filterInfo = "Estudiantes filtrados:";
      if (searchTerm) filterInfo += ` Búsqueda: "${searchTerm}"`;
      if (selectedGrades.length > 0) filterInfo += ` | Grados: ${selectedGrades.map(id => getNombreGrado(id)).join(", ")}`;
      if (selectedYear) filterInfo += ` | Año: ${selectedYear}`;
    }

    doc.text(filterInfo, 14, yPosition);
    yPosition += 6;
    doc.text(`Total de estudiantes: ${filteredStudents.length}`, 14, yPosition);
    yPosition += 6;
    const fechaActual = new Date().toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    doc.text(`Fecha de generación: ${fechaActual}`, 14, yPosition);

    doc.setDrawColor(220, 220, 220);
    doc.line(14, yPosition + 2, 410, yPosition + 2);

    //  Tabla
    const tableData = filteredStudents.map((student) => [
      student.nombre_completo || "N/A",
      student.id_documento || "N/A",
      student.fecha_nacimiento
        ? new Date(student.fecha_nacimiento).toLocaleDateString("es-ES")
        : "N/A",
      student.edad?.toString() || "N/A",
      student.genero || "N/A",
      getNombreGrado(student.grado_a_matricular) || "N/A",
      student.residencia_direccion?.substring(0, 25) +
        (student.residencia_direccion?.length > 45 ? "..." : "") ||
        "N/A",
      student.telefono_alumno || "N/A",
      student.nombre_encargado || "N/A",
      student.parentesco_encargado || "N/A",
      student.id_documento_encargado || "N/A",
      student.telefono_encargado || "N/A",
      student.email_encargado?.substring(0, 20) +
        (student.email_encargado?.length > 45 ? "..." : "") ||
        "N/A",
      student.fecha_matricula
        ? new Date(student.fecha_matricula).toLocaleDateString("es-ES")
        : "N/A",
    ]);

    autoTable(doc, {
      startY: yPosition + 8,
      head: [
        [
          "Nombre",
          "Documento",
          "Fecha Nac.",
          "Edad",
          "Género",
          "Grado",
          "Dirección",
          "Tel. Alumno",
          "Encargado",
          "Parentesco",
          "Doc. Encargado",
          "Tel. Encargado",
          "Email",
          "Fecha Mat.",
        ],
      ],
      body: tableData,
      theme: "striped",
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
        textColor: [50, 50, 50],
      },
      headStyles: {
        fillColor: [0, 102, 204],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: [245, 248, 250] },

      //  Columnas más anchas y bien distribuidas (usando todo el ancho)
      columnStyles: {
        0: { cellWidth: 40 }, // Nombre
        1: { cellWidth: 25 }, // Documento
        2: { cellWidth: 25 }, // Fecha Nac.
        3: { cellWidth: 10 }, // Edad
        4: { cellWidth: 12 }, // Género
        5: { cellWidth: 18 }, // Grado
        6: { cellWidth: 35 }, // Dirección
        7: { cellWidth: 22 }, // Tel alumno
        8: { cellWidth: 25 }, // Encargado
        9: { cellWidth: 22 }, // Parentesco
        10: { cellWidth: 28 }, // Doc encargado
        11: { cellWidth: 22 }, // Tel encargado
        12: { cellWidth: 32 }, // Email
        13: { cellWidth: 20 }, // Fecha Mat.
      },
      margin: { left: 8, right: 8 },

      didDrawPage: (data) => {
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Encabezado en cada página
        if (doc.internal.getNumberOfPages() > 1) {
          doc.addImage(logoUrl, "PNG", 15, 10, 20, 20);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.setTextColor(0, 102, 204);
          doc.text("Escuela Experimental de Niños para la Música", pageWidth / 2, 20, { align: "center" });
          doc.setFontSize(11);
          doc.setTextColor(60, 60, 60);
          doc.text("Reporte Completo de Estudiantes", pageWidth / 2, 27, { align: "center" });
          doc.line(14, 32, pageWidth - 14, 32);
        }

        // Footer institucional
        doc.setFontSize(9);
        doc.setTextColor(130, 130, 130);
        doc.text(
          "Documento generado automáticamente por la Escuela Experimental de Niños para la Música - S.I.A.M.",
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );

        // Número de página
        const pageNum = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Página ${pageNum}`, pageWidth - 20, pageHeight - 10);
      },
    });

    // Guardar PDF
    const nombreArchivo = `reporte_estudiantes_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(nombreArchivo);
  };

  // Agrega esta función junto con downloadPDF
  const downloadXLSX = () => {
  // Crear un nuevo libro de trabajo
  const wb = XLSX.utils.book_new();
  
  // Preparar los datos para la hoja de cálculo
  const xlsxData = filteredStudents.map(student => ({
    'Nombre Completo': student.nombre_completo || 'N/A',
    'Documento': student.id_documento || 'N/A',
    'Fecha de Nacimiento': student.fecha_nacimiento ? 
      new Date(student.fecha_nacimiento).toLocaleDateString('es-ES') : 'N/A',
    'Edad': student.edad?.toString() || 'N/A',
    'Género': student.genero || 'N/A',
    'Grado': getNombreGrado(student.grado_a_matricular) || 'N/A',
    'Dirección': student.residencia_direccion || 'N/A',
    'Teléfono Alumno': student.telefono_alumno || 'N/A',
    'Encargado': student.nombre_encargado || 'N/A',
    'Parentesco': student.parentesco_encargado || 'N/A',
    'Documento Encargado': student.id_documento_encargado || 'N/A',
    'Teléfono Encargado': student.telefono_encargado || 'N/A',
    'Email Encargado': student.email_encargado || 'N/A',
    'Fecha de Matrícula': student.fecha_matricula ? 
      new Date(student.fecha_matricula).toLocaleDateString('es-ES') : 'N/A'
  }));

    // Agregar información de filtros como metadatos
    const metadata = [
      ['REPORTE COMPLETO DE ESTUDIANTES'],
      [''],
      ['Información de Filtros:'],
      [searchTerm || selectedGrades.length > 0 || selectedYear ? 
        'Estudiantes filtrados' : 'Todos los estudiantes'],
      ...(searchTerm ? [['Búsqueda:', searchTerm]] : []),
      ...(selectedGrades.length > 0 ? [['Grados:', selectedGrades.map(id => getNombreGrado(id)).join(', ')]] : []),
      ...(selectedYear ? [['Año:', selectedYear]] : []),
      ['Total de estudiantes:', filteredStudents.length.toString()],
      ['Fecha de generación:', new Date().toLocaleDateString('es-ES')],
      [''] // Fila vacía de separación
    ];
    // Calcular cuántas filas ocupan los metadatos
    const metadataRows = metadata.length;

    // Crear una hoja vacía primero
    const ws = XLSX.utils.aoa_to_sheet([]);

    // Agregar los metadatos al inicio
    XLSX.utils.sheet_add_aoa(ws, metadata, { origin: 'A1' });

    // Agregar los encabezados de la tabla después de los metadatos
    const headers = [
      ['Nombre Completo', 'Documento', 'Fecha de Nacimiento', 'Edad', 'Género', 'Grado', 
      'Dirección', 'Teléfono Alumno', 'Encargado', 'Parentesco', 'Documento Encargado', 
      'Teléfono Encargado', 'Email Encargado', 'Fecha de Matrícula']
    ];
    XLSX.utils.sheet_add_aoa(ws, headers, { origin: `A${metadataRows + 1}` });

    // Agregar los datos después de los encabezados
    const dataForSheet = xlsxData.map(student => [
      student['Nombre Completo'],
      student['Documento'],
      student['Fecha de Nacimiento'],
      student['Edad'],
      student['Género'],
      student['Grado'],
      student['Dirección'],
      student['Teléfono Alumno'],
      student['Encargado'],
      student['Parentesco'],
      student['Documento Encargado'],
      student['Teléfono Encargado'],
      student['Email Encargado'],
      student['Fecha de Matrícula']
    ]);

    XLSX.utils.sheet_add_aoa(ws, dataForSheet, { origin: `A${metadataRows + 2}` });

    // Ajustar el ancho de las columnas para mejor visualización
    const colWidths = [
      { wch: 25 }, // Nombre Completo
      { wch: 15 }, // Documento
      { wch: 15 }, // Fecha de Nacimiento
      { wch: 8 },  // Edad
      { wch: 10 }, // Género
      { wch: 12 }, // Grado
      { wch: 30 }, // Dirección
      { wch: 15 }, // Teléfono Alumno
      { wch: 20 }, // Encargado
      { wch: 12 }, // Parentesco
      { wch: 15 }, // Documento Encargado
      { wch: 15 }, // Teléfono Encargado
      { wch: 25 }, // Email Encargado
      { wch: 15 }  // Fecha de Matrícula
    ];
    ws['!cols'] = colWidths;

    // Agregar la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, 'Estudiantes');

    // Generar el archivo y descargar
    const fileName = `estudiantes_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const toggleStudentSelection = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      onSelectionChange(selectedStudents.filter(id => id !== studentId));
    } else {
      onSelectionChange([...selectedStudents, studentId]);
    }
  };

  const toggleAllSelection = () => {
    if (selectedStudents.length === currentItems.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(currentItems.map(student => student._id));
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div className="loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando estudiantes...</p>
      </div>
    );
  }

  if (!studentsArray || studentsArray.length === 0) {
    return (
      <div className="no-data">
        <i className="fas fa-users fa-3x"></i>
        <h3>No hay estudiantes matriculados</h3>
        <p>Comience agregando un nuevo estudiante</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      {/* Barra de búsqueda y filtros */}
      <div className="search-filter-bar">
        <div className="search-input-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, documento, grado..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="search-input"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="search-clear-btn"
            >
              
            </button>
          )}
        </div>

        
      <div className="filter-buttons">
        <button
          className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
          Filtros
          {(selectedGrades.length > 0 || selectedYear) && (
            <span className="filter-badge"></span>
          )}
        </button>

        {filteredStudents.length > 0 && (
          <div className="download-buttons">
            <button
              className="download-pdf-btn"
              onClick={downloadPDF}
              title="Descargar PDF"
            >
              <Download size={16} />
              Descargar PDF
            </button>
            <button
              className="download-pdf-btn"
              onClick={downloadXLSX}
              title="Descargar Excel"
            >
              <Download size={16} />
              Descargar Excel
            </button>
          </div>
        )}
      </div>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-header">
            <h4>Filtros</h4>
            <button onClick={clearAllFilters} className="clear-filters-btn">
              Limpiar filtros
            </button>
          </div>

          <div className="filters-grid">
            {/* Filtro por grados */}
            <div className="filter-group">
              <label className="filter-label">Grados</label>
              <div className="grades-filter">
                <label className="checkbox-item select-all">
                  <input
                    type="checkbox"
                    checked={selectedGrades.length === uniqueGrades.length}
                    onChange={toggleAllGrades}
                  />
                  <span>Seleccionar todos</span>
                </label>
                <div className="grades-grid">
                  {uniqueGrades.map(gradeId => (
                  <label key={gradeId} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedGrades.includes(gradeId)}
                      onChange={() => toggleGradeSelection(gradeId)}
                    />
                    <span>{getNombreGrado(gradeId)}</span>
                  </label>
                ))}
                </div>
              </div>
            </div>

            {/* Filtro por año */}
            <div className="filter-group">
              <label className="filter-label">Año de matrícula</label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="year-select"
              >
                <option value="">Todos los años</option>
                {uniqueYears.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Información de resultados */}
      <div className="pagination-info">
        <div className="results-info">
          Mostrando {startIndex} a {endIndex} de {totalItems} estudiantes
          {(searchTerm || selectedGrades.length > 0 || selectedYear) && 
            ` (filtrados de ${studentsArray.length} totales)`}
        </div>
        
        <div className="rows-per-page">
          <span>15 estudiantes por página</span>
        </div>
      </div>

      {/* Tabla */}
      <div className="table-wrapper">
        <table className="student-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <input
                  type="checkbox"
                  checked={currentItems.length > 0 && selectedStudents.length === currentItems.length}
                  onChange={toggleAllSelection}
                  className="checkbox"
                />
              </th>
              <th>Nombre Completo</th>
              <th>Documento</th>
              <th>Grado</th>
              <th>Encargado</th>
              <th>Teléfono</th>
              <th>Fecha Matrícula</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-results">
                  <div className="no-results-content">
                    <i className="fas fa-search fa-2x"></i>
                    <h4>No se encontraron estudiantes</h4>
                    <p>No hay resultados que coincidan con los criterios de búsqueda</p>
                    {(searchTerm || selectedGrades.length > 0 || selectedYear) && (
                      <button onClick={clearAllFilters} className="clear-filters-suggestion">
                        Limpiar filtros
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              currentItems.map((student) => (
                <tr key={student._id} className={selectedStudents.includes(student._id) ? 'selected' : ''}>
                  <td className="checkbox-column">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student._id)}
                      onChange={() => toggleStudentSelection(student._id)}
                      className="checkbox"
                    />
                  </td>
                  <td className="student-name">
                    <div className="name">{student.nombre_completo}</div>
                    <div className="details">{student.edad} años • {student.genero}</div>
                  </td>
                  <td>{student.id_documento}</td>
                  <td>
                    <span className="grade-badge">{getNombreGrado(student.grado_a_matricular)}</span>
                  </td>
                  <td>
                    <div className="encargado-info">
                      <div className="name">{student.nombre_encargado}</div>
                      <div className="relationship">{student.parentesco_encargado}</div>
                    </div>
                  </td>
                  <td>{student.telefono_encargado}</td>
                  <td>
                    {student.fecha_matricula ? 
                      new Date(student.fecha_matricula).toLocaleDateString('es-ES') : 
                      'N/A'
                    }
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => onEdit(student)}
                        title="Editar"
                      >
                        <Edit size={16}/>
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => onDelete(student._id)}
                        title="Eliminar"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info-mobile">
            Página {currentPage} de {totalPages}
          </div>

          <div className="pagination-controls">
            <button
              className="pagination-btn pagination-prev"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>

            {generatePageNumbers().map(page => (
              <button
                key={page}
                className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}

            <button
              className="pagination-btn pagination-next"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTable;