import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Edit, Trash2, Filter, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../styles/StudentTable.css';

const StudentTable = ({ students, loading, selectedStudents, onSelectionChange, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const itemsPerPage = 10;

  const studentsArray = students || [];

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

 const downloadPDF = () => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a3",
  });

  // 🔹 Logo institucional
  const logoUrl = "/Logo1.png";
  try {
    doc.addImage(logoUrl, "PNG", 15, 10, 25, 25);
  } catch (e) {
    console.warn("⚠️ No se pudo cargar el logo. Verifica /public/Logo1.png");
  }

  // 🏫 Encabezado
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(0, 102, 204);
  doc.text("Escuela Experimental de Niños para la Música", 210, 20, { align: "center" });

  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text("📘 Reporte Completo de Estudiantes", 210, 30, { align: "center" });

  // Línea decorativa
  doc.setDrawColor(0, 102, 204);
  doc.line(14, 35, 410, 35);

  // 🔹 Filtros
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);

  let yPosition = 42;
  let filterInfo = "Todos los estudiantes";
  if (searchTerm || selectedGrades.length > 0 || selectedYear) {
    filterInfo = "Estudiantes filtrados:";
    if (searchTerm) filterInfo += ` Búsqueda: "${searchTerm}"`;
    if (selectedGrades.length > 0) filterInfo += ` | Grados: ${selectedGrades.join(", ")}`;
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

  // 🔹 Tabla
  const tableData = filteredStudents.map((student) => [
    student.nombre_completo || "N/A",
    student.id_documento || "N/A",
    student.fecha_nacimiento
      ? new Date(student.fecha_nacimiento).toLocaleDateString("es-ES")
      : "N/A",
    student.edad?.toString() || "N/A",
    student.genero || "N/A",
    student.grado_a_matricular || "N/A",
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

    // 🧩 Columnas más anchas y bien distribuidas (usando todo el ancho)
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
              ✕
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
            <button
              className="download-pdf-btn"
              onClick={downloadPDF}
              title="Descargar PDF"
            >
              <Download size={16} />
              Descargar PDF
            </button>
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
                  {uniqueGrades.map(grade => (
                    <label key={grade} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedGrades.includes(grade)}
                        onChange={() => toggleGradeSelection(grade)}
                      />
                      <span>{grade}</span>
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
                    <span className="grade-badge">{student.grado_a_matricular}</span>
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