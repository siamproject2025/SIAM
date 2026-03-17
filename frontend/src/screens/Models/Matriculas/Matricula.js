import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserCheck, UserPlus, User, Calendar, Award } from 'lucide-react';
import '../../../styles/Matriculas.css';
import StudentTable from '../../../components/StudentTable';
import StudentForm from '../../../components/StudentForm';
import Modal from '../../../components/Modal';
import Notification from '../../../components/Notification';
import { auth } from "../../../components/authentication/Auth";
import { loadingController } from "../../../api/loadingController";
import WithPermission from '../../../components/Permisos/WithPermission';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL + '/api/matriculas';

function App() {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);

    try {
      loadingController.start();
      const user = auth.currentUser;
      if (!user) {
        setError('No estás autenticado. Por favor inicia sesión.');
        setStudents([]);
        setLoading(false);
        return;
      }
      const token = await user.getIdToken();

      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setStudents(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Error al cargar los estudiantes: ' + error.message);
      setStudents([]);
    } finally {
      setLoading(false);
      loadingController.stop();
    }
  };

  const totalEstudiantes = students.length;
  const estudiantesActivos = students.filter(estudiante => estudiante.estado === 'activo').length;
  const estudiantesNuevos = students.filter(estudiante => {
    const fechaRegistro = new Date(estudiante.fechaRegistro);
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 30);
    return fechaRegistro > fechaLimite;
  }).length;

  useEffect(() => {
    fetchStudents();
  }, []);

  const createStudent = async (studentData) => {
    try {
      loadingController.start();
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');
      const token = await user.getIdToken();

      const formData = new FormData();
      for (const key in studentData) {
        formData.append(key, studentData[key]);
      }
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error desconocido del servidor');
      }

      setShowCreateModal(false);
      fetchStudents();
      setNotification({
        message: result.message || "Estudiante matriculado exitosamente",
        type: "success",
      });
    } catch (error) {
      console.error('Error creando estudiante:', error);
      setNotification({
        message: error.message || "Ocurrió un error al crear el estudiante",
        type: "error",
      });
    } finally {
      loadingController.stop();
    }
  };

  const updateStudent = async (studentData) => {
    try {
      loadingController.start();
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');
      const token = await user.getIdToken();

      const formData = new FormData();
      for (const key in studentData) {
        formData.append(key, studentData[key]);
      }

      const response = await fetch(`${API_URL}/${editingStudent._id}`, {
        method: 'PUT',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error desconocido del servidor");
      }

      setShowEditModal(false);
      setEditingStudent(null);
      fetchStudents();
      setNotification({
        message: result.message || "Estudiante actualizado exitosamente",
        type: "success",
      });
    } catch (error) {
      console.error("Error actualizando estudiante:", error);
      setNotification({
        message: error.message || "Ocurrió un error al actualizar el estudiante",
        type: "error",
      });
    } finally {
      loadingController.stop();
    }
  };

  const deleteStudent = async (student) => {
    if (!student || !student._id) {
      console.error('Error: Estudiante inválido o sin ID', student);
      setNotification({
        message: 'Error: ID de estudiante no válido',
        type: 'error'
      });
      return;
    }

   

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');
      const token = await user.getIdToken();

      const response = await fetch(`${API_URL}/${student._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchStudents();
        setSelectedStudents(prev => prev.filter(studentId => studentId !== student._id));
        
        if (showEditModal) {
          setShowEditModal(false);
          setEditingStudent(null);
        }
        
        setNotification({
          message: 'Estudiante eliminado exitosamente',
          type: 'success'
        });
      } else {
        const result = await response.json();
        throw new Error(result.message || 'Error al eliminar estudiante');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      setNotification({
        message: error.message || 'Error al eliminar el estudiante',
        type: 'error'
      });
    }
  };

  const deleteSelectedStudents = async () => {
    if (selectedStudents.length === 0) {
      setNotification({
        message: 'Seleccione al menos un estudiante para eliminar',
        type: 'error'
      });
      return;
    }

    const confirmacion = window.confirm(
      `¿Estás seguro de que deseas eliminar los ${selectedStudents.length} estudiantes seleccionados?`
    );

    if (!confirmacion) return;

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');
      const token = await user.getIdToken();

      const deletePromises = selectedStudents.map(id =>
        fetch(`${API_URL}/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      );

      await Promise.all(deletePromises);
      setSelectedStudents([]);
      fetchStudents();
      setNotification({
        message: 'Estudiantes eliminados exitosamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting students:', error);
      setNotification({
        message: error.message || 'Error al eliminar los estudiantes',
        type: 'error'
      });
    }
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setShowEditModal(true);
  };

  return (
    <div className="App2">
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
            <div className="header-pattern" />

            <div className="header-content">
              <div className="header-top">
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
                </motion.h2>

                <div className="header-buttons">
                  <motion.button
                    className="btn-grados"
                    onClick={() => navigate('/grados')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                    <span>Grados</span>
                  </motion.button>
                </div>
              </div>

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
                    <div className="stat-value" style={{ color: "white" }}>{totalEstudiantes}</div>
                    <div className="stat-label" style={{ color: "white" }}>Total Estudiantes</div>
                  </div>
                </motion.div>
                <motion.div
                  className="stat-item"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                >
                  <div className="stat-icon"><UserCheck size={20} color="white" /></div>
                  <div className="stat-text">
                    <div className="stat-value" style={{ color: "white" }}>{estudiantesActivos}</div>
                    <div className="stat-label" style={{ color: "white" }}>Estudiantes Activos</div>
                  </div>
                </motion.div>
                <motion.div
                  className="stat-item"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                >
                  <div className="stat-icon"><UserPlus size={20} color="white" /></div>
                  <div className="stat-text">
                    <div className="stat-value" style={{ color: "white" }}>{estudiantesNuevos}</div>
                    <div className="stat-label" style={{ color: "white" }}>Nuevos Registros</div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <main className="main-content">
        <div className="container2">
          {error && (
            <div className="error-banner">
              <i className="fas fa-exclamation-triangle"></i>
              {error}
              <button onClick={fetchStudents} className="btn btn-secondary">
                Reintentar
              </button>
            </div>
          )}

          <div className="action-bar">
            <button className="btn btn-ayuda" onClick={() => setShowCreateModal(true)}>
              <i className="fas fa-plus"></i> Nueva Matrícula
            </button>

            <WithPermission requiredPermissions={["ELIMINAR_MATRICULA"]}>
              <button className="btn btn-danger" onClick={deleteSelectedStudents}>
                <i className="fas fa-trash"></i> Eliminar Seleccionados ({selectedStudents.length})
              </button>
            </WithPermission>
          </div>

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

      <AnimatePresence>
        {showCreateModal && (
          <Modal
            key="modal-crear"
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            title="Nueva Matrícula"
          >
            <StudentForm
              onSubmit={createStudent}
              onCancel={() => setShowCreateModal(false)}
            />
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && editingStudent && (
          <Modal
            key="modal-editar"
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
              onDelete={() => deleteStudent(editingStudent)}
              isEdit={true}
            />
          </Modal>
        )}
      </AnimatePresence>

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
          duration={4000}
        />
      )}
    </div>
  );
}

export default App;