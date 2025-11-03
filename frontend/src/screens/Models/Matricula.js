import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, UserPlus, User, Calendar, Award } from 'lucide-react';
import '..//../styles/Matriculas.css';
import StudentTable from '..//..//components/StudentTable';
import StudentForm from '..//..//components/StudentForm';
import Modal from '..//..//components/Modal';

const API_URL = 'http://localhost:5000/api/matriculas';

function App() {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Obtener estudiantes
  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStudents(data.data || []);
 // Asegurar que siempre sea un array
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Error al cargar los estudiantes: ' + error.message);
      setStudents([]); // Asegurar que students sea un array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  const totalEstudiantes = students.length;
  const estudiantesActivos = students.filter(estudiante => estudiante.estado === 'activo').length;
  const estudiantesNuevos = students.filter(estudiante => {
    const fechaRegistro = new Date(estudiante.fechaRegistro);
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 30); // Últimos 30 días
    return fechaRegistro > fechaLimite;
  }).length;

  useEffect(() => {
    fetchStudents();
  }, []);

  // Crear estudiante
  const createStudent = async (studentData) => {
  try {
    // Crear FormData
    const formData = new FormData();
    for (const key in studentData) {
      formData.append(key, studentData[key]);
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData, // enviamos FormData
      // NOTA: No debes poner 'Content-Type', fetch lo maneja automáticamente
    });

    if (response.ok) {
      setShowCreateModal(false);
      fetchStudents();
      alert('Estudiante matriculado exitosamente');
    } else {
      throw new Error('Error al crear estudiante');
    }
  } catch (error) {
    console.error('Error creating student:', error);
    alert('Error al crear el estudiante');
  }
};


  // Actualizar estudiante
const updateStudent = async (studentData) => {
  try {
    // Crear FormData
    const formData = new FormData();
    for (const key in studentData) {
      formData.append(key, studentData[key]);
    }

    const response = await fetch(`${API_URL}/${editingStudent._id}`, {
      method: 'PUT',
      body: formData, // enviamos FormData
      // NOTA: No se pone 'Content-Type', fetch lo maneja automáticamente
    });

    if (response.ok) {
      setShowEditModal(false);
      setEditingStudent(null);
      fetchStudents();
      alert('Estudiante actualizado exitosamente');
    } else {
      throw new Error('Error al actualizar estudiante');
    }
  } catch (error) {
    console.error('Error updating student:', error);
    alert('Error al actualizar el estudiante');
  }
};


  // Eliminar estudiante
  const deleteStudent = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este estudiante?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchStudents();
        // Remover el estudiante de la selección
        setSelectedStudents(prev => prev.filter(studentId => studentId !== id));
        alert('Estudiante eliminado exitosamente');
      } else {
        throw new Error('Error al eliminar estudiante');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Error al eliminar el estudiante');
    }
  };

  // Eliminar estudiantes seleccionados
  const deleteSelectedStudents = async () => {
    if (selectedStudents.length === 0) {
      alert('Seleccione al menos un estudiante para eliminar');
      return;
    }

    if (!window.confirm(`¿Está seguro de que desea eliminar ${selectedStudents.length} estudiante(s)?`)) {
      return;
    }

    try {
      const deletePromises = selectedStudents.map(id => 
        fetch(`${API_URL}/${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      setSelectedStudents([]);
      fetchStudents();
      alert('Estudiantes eliminados exitosamente');
    } catch (error) {
      console.error('Error deleting students:', error);
      alert('Error al eliminar los estudiantes');
    }
  };

  // Abrir modal de edición
  const openEditModal = (student) => {
    setEditingStudent(student);
    setShowEditModal(true);
  };

  return (
    <div className="App2">
      {/* Header con gradiente */}
      <div className='headerEstudiantes'>
      <motion.div 
        className="biblioteca-header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, type: "spring", stiffness: 100 }}
      >
        <motion.div
          className="header-gradient"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          {/* Patrón de fondo */}
          <div className="header-pattern" />

          <div className="header-content">
            <motion.h2
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
              >
                <Users size={36} fill="white" color="white" />
              </motion.div>
              Gestión de Estudiantes
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                className="floating-main-icon"
              >
                <UserCheck size={32} color="white" />
              </motion.div>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="header-subtitle"
            >
              Administra y supervisa el registro de estudiantes de manera eficiente.
            </motion.p>

            <motion.div 
              className="header-stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <motion.div 
                className="stat-item"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="stat-icon"><Users size={20} color="white" /></div>
                <div className="stat-text">
                  <div className="stat-value">{totalEstudiantes}</div>
                  <div className="stat-label">Total Estudiantes</div>
                </div>
              </motion.div>
              <motion.div 
                className="stat-item"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
              >
                <div className="stat-icon"><UserCheck size={20} color="white" /></div>
                <div className="stat-text">
                  <div className="stat-value">{estudiantesActivos}</div>
                  <div className="stat-label">Estudiantes Activos</div>
                </div>
              </motion.div>
              <motion.div 
                className="stat-item"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
              >
                <div className="stat-icon"><UserPlus size={20} color="white" /></div>
                <div className="stat-text">
                  <div className="stat-value">{estudiantesNuevos}</div>
                  <div className="stat-label">Nuevos Registros</div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              className="floating-icons"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <motion.div 
                className="floating-icon"
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <User size={20} color="white" />
              </motion.div>
              <motion.div 
                className="floating-icon"
                animate={{ 
                  y: [0, -15, 0],
                  rotate: [0, -8, 8, 0]
                }}
                transition={{ 
                  duration: 3.5, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              >
                <Calendar size={20} color="white" />
              </motion.div>
              <motion.div 
                className="floating-icon"
                animate={{ 
                  y: [0, -12, 0],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ 
                  duration: 4.2, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              >
                <Award size={20} color="white" />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
      </div>
      {/* Contenido principal */}
      <main className="main-content">
        <div className="container2">
          {/* Mostrar error si existe */}
          {error && (
            <div className="error-banner">
              <i className="fas fa-exclamation-triangle"></i>
              {error}
              <button onClick={fetchStudents} className="btn btn-secondary">
                Reintentar
              </button>
            </div>
          )}

          {/* Barra de acciones */}
          <div className="action-bar">
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="fas fa-plus"></i>
              Nueva Matrícula
            </button>
            
            {selectedStudents.length > 0 && (
              <button 
                className="btn btn-danger"
                onClick={deleteSelectedStudents}
              >
                <i className="fas fa-trash"></i>
                Eliminar Seleccionados ({selectedStudents.length})
              </button>
            )}
          </div>

          {/* Tabla de estudiantes */}
          <StudentTable
            students={students}
            loading={loading}
            selectedStudents={selectedStudents}
            onSelectionChange={setSelectedStudents}
            onEdit={openEditModal}
            onDelete={deleteStudent}
          />
        </div>
      </main>

      {/* Modal para crear estudiante */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nueva Matrícula"
      >
        <StudentForm
          onSubmit={createStudent}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Modal para editar estudiante */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingStudent(null);
        }}
        title="Editar Matrícula"
      >
        <StudentForm
          student={editingStudent}
          onSubmit={updateStudent}
          onCancel={() => {
            setShowEditModal(false);
            setEditingStudent(null);
          }}
          onDelete={() => deleteStudent(editingStudent?._id)}
          isEdit={true}
        />
      </Modal>
    </div>
  );
}

export default App;