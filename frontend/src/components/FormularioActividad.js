import React, { useEffect, useState } from "react";
import ModalCrearActividad from '../screens/Models/Actividades/ModalCrearActividad';
import ModalDetalleActividad from '../screens/Models/Actividades/ModalDetalleActividad';
import Notification from '../components/Notification';
import '../../src/styles/Models/Actividades.css';

const API_URL = "http://localhost:5000/api/actividades";

const Actividades = () => {
  const [actividades, setActividades] = useState([]);
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [notification, setNotification] = useState(null);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setActividades(data))
      .catch(err => console.error('Error al obtener las actividades:', err));
  }, []);

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  const handleCrearActividad = async (nuevaActividad) => {
    try {
      // Validaciones
      if (!nuevaActividad.nombre.trim()) {
        showNotification('El nombre de la actividad es obligatorio', 'error');
        return;
      }
      if (!nuevaActividad.fecha) {
        showNotification('La fecha y hora son obligatorias', 'error');
        return;
      }
      if (!nuevaActividad.lugar.trim()) {
        showNotification('El lugar es obligatorio', 'error');
        return;
      }
      if (!nuevaActividad.descripcion.trim()) {
        showNotification('La descripción es obligatoria', 'error');
        return;
      }

      // Verificar que la fecha no sea pasada
      const fechaActividad = new Date(nuevaActividad.fecha);
      const ahora = new Date();
      if (fechaActividad < ahora) {
        showNotification('No puedes crear una actividad con fecha pasada', 'error');
        return;
      }

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaActividad)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al crear la actividad');
      }
      
      const actividadCreada = await res.json();
      setActividades([...actividades, actividadCreada]);
      setMostrarModalCrear(false);
      showNotification(`Actividad "${actividadCreada.nombre}" creada exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al crear la actividad', 'error');
    }
  };

  const handleEditarActividad = async (actividadActualizada) => {
    try {
      // Validaciones
      if (!actividadActualizada.nombre.trim()) {
        showNotification('El nombre de la actividad es obligatorio', 'error');
        return;
      }
      if (!actividadActualizada.fecha) {
        showNotification('La fecha y hora son obligatorias', 'error');
        return;
      }
      if (!actividadActualizada.lugar.trim()) {
        showNotification('El lugar es obligatorio', 'error');
        return;
      }
      if (!actividadActualizada.descripcion.trim()) {
        showNotification('La descripción es obligatoria', 'error');
        return;
      }

      const res = await fetch(`${API_URL}/${actividadActualizada._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actividadActualizada)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al editar la actividad');
      }
      
      const actualizada = await res.json();
      setActividades(actividades.map(a => a._id === actualizada._id ? actualizada : a));
      setActividadSeleccionada(null);
      showNotification(`Actividad "${actualizada.nombre}" actualizada exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al editar la actividad', 'error');
    }
  };

  const handleEliminarActividad = async (id) => {
    const actividadAEliminar = actividades.find(a => a._id === id);
    if (!window.confirm(`¿Seguro que deseas eliminar la actividad "${actividadAEliminar?.nombre}"?`)) return;
    
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al eliminar la actividad');
      }
      
      setActividades(actividades.filter(a => a._id !== id));
      setActividadSeleccionada(null);
      showNotification(`Actividad "${actividadAEliminar?.nombre}" eliminada exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al eliminar la actividad', 'error');
    }
  };

  // Función para categorizar actividades por estado temporal
  const categorizarActividad = (fecha) => {
    const ahora = new Date();
    const fechaActividad = new Date(fecha);
    const diferenciaDias = Math.ceil((fechaActividad - ahora) / (1000 * 60 * 60 * 24));

    if (diferenciaDias < 0) return 'FINALIZADA';
    if (diferenciaDias === 0) return 'HOY';
    if (diferenciaDias <= 7) return 'PROXIMA';
    return 'FUTURA';
  };

  const actividadesFiltradas = actividades.filter(a => {
    const terminoBusqueda = busqueda.toLowerCase();
    return (
      a.nombre?.toLowerCase().includes(terminoBusqueda) ||
      a.lugar?.toLowerCase().includes(terminoBusqueda) ||
      a.descripcion?.toLowerCase().includes(terminoBusqueda)
    );
  });

  const actividadesHoy = actividadesFiltradas.filter(a => categorizarActividad(a.fecha) === 'HOY');
  const actividadesProximas = actividadesFiltradas.filter(a => categorizarActividad(a.fecha) === 'PROXIMA');
  const actividadesFuturas = actividadesFiltradas.filter(a => categorizarActividad(a.fecha) === 'FUTURA');
  const actividadesFinalizadas = actividadesFiltradas.filter(a => categorizarActividad(a.fecha) === 'FINALIZADA');

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderGrupoActividades = (titulo, lista, icono) => (
    <div className="actividad-categoria-section">
      <h3 className="actividad-subtitulo">{icono} {titulo}</h3>
      {lista.length === 0 ? (
        <p className="actividad-vacio">No hay actividades en esta categoría.</p>
      ) : (
        <div className="actividad-listado">
          {lista.map((actividad) => {
            const categoria = categorizarActividad(actividad.fecha);
            return (
              <div 
                key={actividad._id} 
                className="actividad-card" 
                onClick={() => setActividadSeleccionada(actividad)}
              >
                <div className="actividad-card-header">
                  <span className={`actividad-estado-badge ${categoria}`}>
                    {categoria === 'HOY' && '🔴 HOY'}
                    {categoria === 'PROXIMA' && '🟡 PRÓXIMA'}
                    {categoria === 'FUTURA' && '🟢 FUTURA'}
                    {categoria === 'FINALIZADA' && '⚫ FINALIZADA'}
                  </span>
                  <span className="actividad-fecha">{formatearFecha(actividad.fecha)}</span>
                </div>
                <div className="actividad-card-body">
                  <div className="actividad-info-item full-width">
                    <span className="actividad-info-label">Nombre</span>
                    <span className="actividad-info-value actividad-nombre">{actividad.nombre}</span>
                  </div>
                  <div className="actividad-info-item">
                    <span className="actividad-info-label">📍 Lugar</span>
                    <span className="actividad-info-value">{actividad.lugar}</span>
                  </div>
                  <div className="actividad-info-item full-width">
                    <span className="actividad-info-label">📝 Descripción</span>
                    <span className="actividad-info-value actividad-descripcion">{actividad.descripcion}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="actividad-container">
      <div className="actividad-header">
        <h2>📅 Sistema de Actividades</h2>
        <p>Organiza y gestiona todas tus actividades programadas</p>
        <div className="actividad-busqueda-bar">
          <input
            type="text"
            className="actividad-busqueda"
            placeholder="Buscar por nombre, lugar o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button className="btn-ayuda" onClick={() => setMostrarAyuda(true)} title="Ver ayuda">
            ❓ Ayuda
          </button>
          <button className="btn-nueva-actividad" onClick={() => setMostrarModalCrear(true)}>
            + Nueva Actividad
          </button>
        </div>
      </div>

      <div className="actividad-categorias-container">
        {renderGrupoActividades("Actividades de Hoy", actividadesHoy, "🔴")}
        {renderGrupoActividades("Próximos 7 días", actividadesProximas, "🟡")}
        {renderGrupoActividades("Actividades futuras", actividadesFuturas, "🟢")}
        {renderGrupoActividades("Actividades finalizadas", actividadesFinalizadas, "⚫")}
      </div>

      {mostrarModalCrear && (
        <ModalCrearActividad
          onClose={() => setMostrarModalCrear(false)}
          onCreate={handleCrearActividad}
        />
      )}

      {actividadSeleccionada && (
        <ModalDetalleActividad
          actividad={actividadSeleccionada}
          onClose={() => setActividadSeleccionada(null)}
          onUpdate={handleEditarActividad}
          onDelete={handleEliminarActividad}
        />
      )}

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
            <h3 className="modal-title">📚 Guía de Uso - Sistema de Actividades</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>🔍 Búsqueda</h4>
              <p>Puedes buscar actividades por:</p>
              <ul style={{ marginLeft: '1rem', marginBottom: '1rem' }}>
                <li><strong>Nombre:</strong> Reunión, Capacitación, etc.</li>
                <li><strong>Lugar:</strong> Sala de juntas, Auditorio, etc.</li>
                <li><strong>Descripción:</strong> Cualquier palabra clave</li>
              </ul>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>📋 Categorías Temporales</h4>
              <ul style={{ marginLeft: '1rem', marginBottom: '1rem' }}>
                <li><strong>🔴 Hoy:</strong> Actividades programadas para hoy</li>
                <li><strong>🟡 Próximos 7 días:</strong> Actividades de la próxima semana</li>
                <li><strong>🟢 Futuras:</strong> Actividades programadas a más de 7 días</li>
                <li><strong>⚫ Finalizadas:</strong> Actividades que ya pasaron</li>
              </ul>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>✨ Funciones Principales</h4>
              <ul style={{ marginLeft: '1rem', marginBottom: '1rem' }}>
                <li><strong>Crear Actividad:</strong> Agregar nuevas actividades programadas</li>
                <li><strong>Editar:</strong> Hacer clic en cualquier actividad para modificarla</li>
                <li><strong>Eliminar:</strong> Opción disponible en el modal de edición</li>
                <li><strong>Filtrar:</strong> Usa la barra de búsqueda para encontrar actividades</li>
              </ul>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>⚠️ Importante</h4>
              <ul style={{ marginLeft: '1rem', marginBottom: '1rem' }}>
                <li>No puedes crear actividades con fechas pasadas</li>
                <li>Las actividades se categorizan automáticamente según su fecha</li>
                <li>Recuerda especificar fecha, hora y lugar correctamente</li>
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

export default Actividades;