import React from 'react';

const StudentTable = ({ students, loading, selectedStudents, onSelectionChange, onEdit, onDelete }) => {
  // Verificar si students es undefined o null
  const studentsArray = students || [];
  
  const toggleStudentSelection = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      onSelectionChange(selectedStudents.filter(id => id !== studentId));
    } else {
      onSelectionChange([...selectedStudents, studentId]);
    }
  };

  const toggleAllSelection = () => {
    if (selectedStudents.length === studentsArray.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(studentsArray.map(student => student._id));
    }
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
      <table className="student-table">
        <thead>
          <tr>
            <th className="checkbox-column">
              <input
                type="checkbox"
                checked={studentsArray.length > 0 && selectedStudents.length === studentsArray.length}
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
          {studentsArray.map((student) => (
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
                  </button>
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => onDelete(student._id)}
                    title="Eliminar"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentTable;