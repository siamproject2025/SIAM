import React, { useEffect, useState } from "react";
import Notification from '../../components/Notification';


const API_URL = "http://localhost:5000/api/personal";

const Personal = () => {
  const [personal, setPersonal] = useState([]);
  const [personalSeleccionado, setPersonalSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [notification, setNotification] = useState(null);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setPersonal(data))
      .catch(err => console.error('Error al obtener el personal:', err));
  }, []);

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  const handleCrearPersonal = async (nuevoPersonal) => {
    try {
      // Validaciones
      if (!nuevoPersonal.codigo.trim()) {
        showNotification('El código del empleado es obligatorio', 'error');
        return;
      }
      if (!nuevoPersonal.nombre.trim()) {
        showNotification('El nombre es obligatorio', 'error');
        return;
      }
      if (!nuevoPersonal.apellido.trim()) {
        showNotification('El apellido es obligatorio', 'error');
        return;
      }
      if (!nuevoPersonal.cargo) {
        showNotification('Debe seleccionar un cargo', 'error');
        return;
      }
      if (!nuevoPersonal.estado) {
        showNotification('Debe seleccionar un estado', 'error');
        return;
      }
      if (!nuevoPersonal.fechaIngreso) {
        showNotification('La fecha de ingreso es obligatoria', 'error');
        return;
      }

      // Verificar si el código ya existe
      const codigoExistente = personal.find(p => p.codigo.toLowerCase() === nuevoPersonal.codigo.toLowerCase());
      if (codigoExistente) {
        showNotification('Ya existe un empleado con este código', 'error');
        return;
      }

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoPersonal)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al crear el empleado');
      }
      
      const personalCreado = await res.json();
      setPersonal([...personal, personalCreado]);
      setMostrarModalCrear(false);
      showNotification(`Empleado "${personalCreado.nombre} ${personalCreado.apellido}" creado exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al crear el empleado', 'error');
    }
  };

  const handleEditarPersonal = async (personalActualizado) => {
    try {
      // Validaciones
      if (!personalActualizado.codigo.trim()) {
        showNotification('El código del empleado es obligatorio', 'error');
        return;
      }
      if (!personalActualizado.nombre.trim()) {
        showNotification('El nombre es obligatorio', 'error');
        return;
      }
      if (!personalActualizado.apellido.trim()) {
        showNotification('El apellido es obligatorio', 'error');
        return;
      }
      if (!personalActualizado.cargo) {
        showNotification('Debe seleccionar un cargo', 'error');
        return;
      }
      if (!personalActualizado.estado) {
        showNotification('Debe seleccionar un estado', 'error');
        return;
      }

      const res = await fetch(`${API_URL}/${personalActualizado._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personalActualizado)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al editar el empleado');
      }
      
      const actualizado = await res.json();
      setPersonal(personal.map(p => p._id === actualizado._id ? actualizado : p));
      setPersonalSeleccionado(null);
      showNotification(`Empleado "${actualizado.nombre} ${actualizado.apellido}" actualizado exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al editar el empleado', 'error');
    }
  };

  const handleEliminarPersonal = async (id) => {
    const personalAEliminar = personal.find(p => p._id === id);
    if (!window.confirm(`¿Seguro que deseas eliminar al empleado "${personalAEliminar?.nombre} ${personalAEliminar?.apellido}"?`)) return;
    
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al eliminar el empleado');
      }
      
      setPersonal(personal.filter(p => p._id !== id));
      setPersonalSeleccionado(null);
      showNotification(`Empleado "${personalAEliminar?.nombre} ${personalAEliminar?.apellido}" eliminado exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al eliminar el empleado', 'error');
    }
  };

  const personalFiltrado = personal.filter(p => {
    const terminoBusqueda = busqueda.toLowerCase();
    return (
      p.codigo?.toLowerCase().includes(terminoBusqueda) ||
      p.nombre?.toLowerCase().includes(terminoBusqueda) ||
      p.apellido?.toLowerCase().includes(terminoBusqueda) ||
      p.cargo?.toLowerCase().includes(terminoBusqueda) ||
      p.departamento?.toLowerCase().includes(terminoBusqueda) ||
      p.email?.toLowerCase().includes(terminoBusqueda)
    );
  });

  const personalActivo = personalFiltrado.filter(p => p.estado === "ACTIVO");
  const personalVacaciones = personalFiltrado.filter(p => p.estado === "VACACIONES");
  const personalLicencia = personalFiltrado.filter(p => p.estado === "LICENCIA");
  const personalInactivo = personalFiltrado.filter(p => p.estado === "INACTIVO");

  const renderGrupoPersonal = (titulo, lista) => (
    <div className="personal-categoria-section">
      <h3 className="personal-subtitulo">{titulo}</h3>
      {lista.length === 0 ? (
        <p className="personal-vacio">No hay empleados en esta categoría.</p>
      ) : (
        <div className="personal-listado">
          {lista.map((empleado) => (
            <div key={empleado._id} className="personal-card" onClick={() => setPersonalSeleccionado(empleado)}>
              <div className="personal-card-header">
                <span className="personal-codigo">{empleado.codigo}</span>
                <span className={`personal-estado-badge ${empleado.estado}`}>{empleado.estado}</span>
              </div>
              <div className="personal-card-body">
                <div className="personal-info-item">
                  <span className="personal-info-label">Nombre</span>
                  <span className="personal-info-value">{empleado.nombre} {empleado.apellido}</span>
                </div>
                <div className="personal-info-item">
                  <span className="personal-info-label">Cargo</span>
                  <span className="personal-info-value">{empleado.cargo}</span>
                </div>
                <div className="personal-info-item">
                  <span className="personal-info-label">Departamento</span>
                  <span className="personal-info-value">{empleado.departamento || '—'}</span>
                </div>
                <div className="personal-info-item">
                  <span className="personal-info-label">Email</span>
                  <span className="personal-info-value">{empleado.email || '—'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="personal-container">
      <div className="personal-header">
        <h2>Sistema de Personal</h2>
        <p>Gestiona y controla todo tu personal de manera eficiente</p>
        <div className="personal-busqueda-bar">
          <input
            type="text"
            className="personal-busqueda"
            placeholder="Buscar por código, nombre, cargo, departamento o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button className="btn-ayuda" onClick={() => setMostrarAyuda(true)} title="Ver ayuda">
            ❓ Ayuda
          </button>
          <button className="btn-nuevo-personal" onClick={() => setMostrarModalCrear(true)}>
            + Nuevo Empleado
          </button>
        </div>
      </div>

      <div className="personal-categorias-container">
        {renderGrupoPersonal("Personal activo", personalActivo)}
        {renderGrupoPersonal("Personal en vacaciones", personalVacaciones)}
        {renderGrupoPersonal("Personal con licencia", personalLicencia)}
        {renderGrupoPersonal("Personal inactivo", personalInactivo)}
      </div>

    

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {mostrarAyuda && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">📚 Guía de Uso - Sistema de Personal</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>🔍 Búsqueda</h4>
              <p>Puedes buscar empleados por:</p>
              <ul style={{ marginLeft: '1rem', marginBottom: '1rem' }}>
                <li><strong>Código:</strong> EMP-001, EMP-002, etc.</li>
                <li><strong>Nombre o Apellido:</strong> Juan, Pérez, etc.</li>
                <li><strong>Cargo:</strong> Gerente, Desarrollador, etc.</li>
                <li><strong>Departamento:</strong> Ventas, IT, etc.</li>
                <li><strong>Email:</strong> usuario@empresa.com</li>
              </ul>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>📋 Estados de Personal</h4>
              <ul style={{ marginLeft: '1rem', marginBottom: '1rem' }}>
                <li><strong>🟢 Activo:</strong> Personal trabajando normalmente</li>
                <li><strong>🟡 Vacaciones:</strong> Personal en período de vacaciones</li>
                <li><strong>🟠 Licencia:</strong> Personal con licencia médica o especial</li>
                <li><strong>🔴 Inactivo:</strong> Personal retirado o suspendido</li>
              </ul>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>✨ Funciones Principales</h4>
              <ul style={{ marginLeft: '1rem', marginBottom: '1rem' }}>
                <li><strong>Crear Empleado:</strong> Agregar nuevo personal</li>
                <li><strong>Editar:</strong> Hacer clic en cualquier empleado para editarlo</li>
                <li><strong>Eliminar:</strong> Opción disponible en el modal de edición</li>
                <li><strong>Filtrar:</strong> Usa la barra de búsqueda para encontrar empleados</li>
              </ul>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>⌨️ Atajos de Teclado</h4>
              <ul style={{ marginLeft: '1rem', marginBottom: '1rem' }}>
                <li><strong>Ctrl + N:</strong> Crear nuevo empleado</li>
                <li><strong>Ctrl + F:</strong> Enfocar barra de búsqueda</li>
                <li><strong>Escape:</strong> Cerrar modales</li>
              </ul>
            </div>

            <div className="modal-actions">
              <button className="btn-cerrar" onClick={() => setMostrarAyuda(false)}>
                ✅ Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Personal;