import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import ModalCrearActividad from '../screens/Models/Actividades/ModalCrearActividad';
import ModalDetalleActividad from '../screens/Models/Actividades/ModalDetalleActividad';
import Notification from '../components/Notification';
import '../../src/styles/Models/Actividades.css';
import { auth } from "..//components/authentication/Auth";

import { 
  Calendar,
  Clock,
  MapPin,
  Users,
  Award,
  Plus,
  HelpCircle,
  Search,
  Star,
  Target,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL+"/api/actividades";

const Actividades = () => {
  const [actividades, setActividades] = useState([]);
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [notification, setNotification] = useState(null);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  useEffect(() => {
  const cargarActividades = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');

      const token = await user.getIdToken(); // 🔹 Obtener token JWT

      const res = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ Token incluido
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) throw new Error('Error al obtener las actividades');
      const data = await res.json();
      setActividades(data);
    } catch (err) {
      console.error('Error al obtener las actividades:', err);
    }
  };

  cargarActividades();
}, []);

  // Calcular estadísticas
  const totalActividades = actividades.length;
  const actividadesHoyCount = actividades.filter(a => categorizarActividad(a.fecha) === 'HOY').length;
  const actividadesProximasCount = actividades.filter(a => categorizarActividad(a.fecha) === 'PROXIMA').length;
  const actividadesFuturasCount = actividades.filter(a => categorizarActividad(a.fecha) === 'FUTURA').length;
  const actividadesFinalizadasCount = actividades.filter(a => categorizarActividad(a.fecha) === 'FINALIZADA').length;

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

    // 🔹 Obtener token del usuario autenticado
    const user = auth.currentUser;
    if (!user) {
      showNotification('No estás autenticado', 'error');
      return;
    }
    const token = await user.getIdToken();

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` // ✅ Token agregado
      },
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

    // 🔹 Obtener token del usuario autenticado
    const user = auth.currentUser;
    if (!user) {
      showNotification('No estás autenticado', 'error');
      return;
    }
    const token = await user.getIdToken();

    const res = await fetch(`${API_URL}/${actividadActualizada._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` // ✅ Token agregado
      },
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
    // 🔹 Obtener token del usuario autenticado
    const user = auth.currentUser;
    if (!user) {
      showNotification('No estás autenticado', 'error');
      return;
    }
    const token = await user.getIdToken();

    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}` // ✅ Token agregado
      }
    });

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
};//
  // Categorizar actividades según la fecha
function categorizarActividad(fechaActividad) {
  const fecha = new Date(fechaActividad);
  const hoy = new Date();

  hoy.setHours(0, 0, 0, 0);
  fecha.setHours(0, 0, 0, 0);

  if (fecha.getTime() === hoy.getTime()) return 'HOY';
  if (fecha > hoy && (fecha - hoy) <= 7 * 24 * 60 * 60 * 1000) return 'PROXIMA';
  if (fecha > hoy) return 'FUTURA';
  if (fecha < hoy) return 'FINALIZADA';
  
  return 'DESCONOCIDA';
}

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

  const renderGrupoActividades = (titulo, lista, color) => (
    <motion.div 
      className="actividad-categoria-section"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div 
        className="actividad-categoria-header"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="actividad-subtitulo">
          <motion.div
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            style={{ color }}
          >
            <Calendar size={20} />
          </motion.div>
          {titulo} ({lista.length})
        </h3>
      </motion.div>

      {lista.length === 0 ? (
        <motion.p 
          className="actividad-vacio"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          No hay actividades en esta categoría.
        </motion.p>
      ) : (
        <motion.div 
          className="actividad-listado"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {lista.map((actividad, index) => {
            const categoria = categorizarActividad(actividad.fecha);
            return (
              <motion.div 
                key={actividad._id} 
                className="actividad-card" 
                onClick={() => setActividadSeleccionada(actividad)}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  delay: Math.min(index * 0.05, 1),
                  duration: 0.4,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
              >
                <div className="actividad-card-header">
                  <span className={`actividad-estado-badge ${categoria}`}>
                    {categoria === 'HOY' && <AlertCircle size={14} />}
                    {categoria === 'PROXIMA' && <Clock size={14} />}
                    {categoria === 'FUTURA' && <Target size={14} />}
                    {categoria === 'FINALIZADA' && <CheckCircle size={14} />}
                    {categoria === 'HOY' && 'HOY'}
                    {categoria === 'PROXIMA' && 'PRÓXIMA'}
                    {categoria === 'FUTURA' && 'FUTURA'}
                    {categoria === 'FINALIZADA' && 'FINALIZADA'}
                  </span>
                  <span className="actividad-fecha">{formatearFecha(actividad.fecha)}</span>
                </div>
                <div className="actividad-card-body">
                  <div className="actividad-info-item full-width">
                    <span className="actividad-info-label">Nombre</span>
                    <span className="actividad-info-value actividad-nombre">{actividad.nombre}</span>
                  </div>
                  <div className="actividad-info-item">
                    <span className="actividad-info-label">
                      <MapPin size={14} />
                      Lugar
                    </span>
                    <span className="actividad-info-value">{actividad.lugar}</span>
                  </div>
                  <div className="actividad-info-item full-width">
                    <span className="actividad-info-label">Descripción</span>
                    <span className="actividad-info-value actividad-descripcion">{actividad.descripcion}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );

  return (
    <div className="actividad-container">
      {/* 🎨 ENCABEZADO MEJORADO */}
      <motion.div 
        className="actividad-header"
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
                <Calendar size={36} fill="white" color="white" />
              </motion.div>
              Sistema de Actividades
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                className="floating-main-icon"
              >
                <Target size={32} color="white" />
              </motion.div>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="header-subtitle"
            >
              Organiza y gestiona todas tus actividades programadas de manera profesional
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
                <div className="stat-icon">
                  <Calendar size={20} color="white" />
                </div>
                <div className="stat-text">
                  <div className="stat-value" style={{color:"white"}}>{totalActividades}</div>
                  <div className="stat-label"  style={{color:"white"}}>Total Actividades</div>
                </div>
              </motion.div>

              <motion.div 
                className="stat-item"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
              >
                <div className="stat-icon">
                  <AlertCircle size={20} color="white" />
                </div>
                <div className="stat-text">
                  <div className="stat-value"  style={{color:"white"}}>{actividadesHoyCount}</div>
                  <div className="stat-label"  style={{color:"white"}}>Para Hoy</div>
                </div>
              </motion.div>

              <motion.div 
                className="stat-item"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
              >
                <div className="stat-icon">
                  <Clock size={20} color="white" />
                </div>
                <div className="stat-text">
                  <div className="stat-value"  style={{color:"white"}}>{actividadesProximasCount}</div>
                  <div className="stat-label"  style={{color:"white"}}>Próximas</div>
                </div>
              </motion.div>

              <motion.div 
                className="stat-item"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
              >
                <div className="stat-icon">
                  <CheckCircle size={20} color="white" />
                </div>
                <div className="stat-text">
                  <div className="stat-value"  style={{color:"white"}}>{actividadesFinalizadasCount}</div>
                  <div className="stat-label"  style={{color:"white"}}>Finalizadas</div>
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
                <Users size={20} color="white" />
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
                <Award size={20} color="white" />
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
                <Star size={20} color="white" />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* BARRA DE BÚSQUEDA Y ACCIONES */}
        <motion.div 
          className="actividad-busqueda-bar"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div style={{ position: 'relative', flex: 1 }}>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}
            >
              <Search size={18} />
            </motion.div>
            <input
              type="text"
              className="actividad-busqueda"
              placeholder="Buscar por nombre, lugar o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          
          <motion.button 
            className="btn-ayuda" 
            onClick={() => setMostrarAyuda(true)} 
            title="Ver ayuda"
            whileHover={{ scale: 1.08, boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)" }}
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
          
          <motion.button 
            className="btn-nueva-actividad" 
            onClick={() => setMostrarModalCrear(true)}
            whileHover={{ 
              scale: 1.08, 
              boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
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
            Nueva Actividad
          </motion.button>
        </motion.div>
      </motion.div>

      {/* CONTENIDO PRINCIPAL */}
      <motion.div 
        className="actividad-categorias-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {renderGrupoActividades("Actividades de Hoy", actividadesHoy, "#FF6B6B")}
        {renderGrupoActividades("Próximos 7 días", actividadesProximas, "#FFD93D")}
        {renderGrupoActividades("Actividades futuras", actividadesFuturas, "#6BCF7F")}
        {renderGrupoActividades("Actividades finalizadas", actividadesFinalizadas, "#4D4D4D")}
      </motion.div>

      {/* Modales y notificaciones (mantener igual) */}
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

      {/* Modal Ayuda (mantener igual) */}
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

            <div className="modal-actions-actividades">
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