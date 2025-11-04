import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight,Edit, Trash2 } from 'lucide-react';
import '../styles/StudentTable.css';

const StudentTable = ({ students, loading, selectedStudents, onSelectionChange, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Fijo en 15 elementos por página

  const studentsArray = students || [];

  // Filtrar estudiantes
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return studentsArray;
    
    const term = searchTerm.toLowerCase();
    return studentsArray.filter(student => 
      student.nombre_completo?.toLowerCase().includes(term) ||
      student.id_documento?.toLowerCase().includes(term) ||
      student.grado_a_matricular?.toLowerCase().includes(term) ||
      student.nombre_encargado?.toLowerCase().includes(term) ||
      student.telefono_encargado?.toLowerCase().includes(term) ||
      student.genero?.toLowerCase().includes(term)
    );
  }, [studentsArray, searchTerm]);

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
      {/* Barra de búsqueda */}
      <div className="search-bar">
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
      </div>

      {/* Información de resultados */}
      <div className="pagination-info">
        <div className="results-info">
          Mostrando {startIndex} a {endIndex} de {totalItems} estudiantes
          {searchTerm && ` (filtrados de ${studentsArray.length} totales)`}
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
                    <p>No hay resultados que coincidan con "{searchTerm}"</p>
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
                        <i className="fas fa-edit"></i>
                        <Edit/>
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => onDelete(student._id)}
                        title="Eliminar"
                      >
                        <i className="fas fa-trash"></i>
                        <Trash2/>
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