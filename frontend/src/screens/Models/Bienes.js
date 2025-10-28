import React, { useEffect, useState } from "react";
import ModalCrearBien from './Bienes/ModalCrearBien';
import ModalDetalleBien from './Bienes/ModalDetalleBien';
import Notification from '../../components/Notification';
import '../../styles/Models/Bienes.css';

const API_URL = "http://localhost:5000/api/bienes";

const Bienes = () => {
  const [bienes, setBienes] = useState([]);
  const [bienSeleccionado, setBienSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [notification, setNotification] = useState(null);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setBienes(data))
      .catch(err => console.error('Error al obtener los bienes:', err));
  }, []);

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  const handleCrearBien = async (nuevoBien) => {
    try {
      // Validaciones
      if (!nuevoBien.codigo.trim()) {
        showNotification('El código del bien es obligatorio', 'error');
        return;
      }
      if (!nuevoBien.nombre.trim()) {
        showNotification('El nombre del bien es obligatorio', 'error');
        return;
      }
      if (!nuevoBien.estado) {
        showNotification('Debe seleccionar un estado inicial', 'error');
        return;
      }
      if (!nuevoBien.valor || nuevoBien.valor <= 0) {
        showNotification('El valor debe ser mayor a 0', 'error');
        return;
      }
      if (!nuevoBien.fechaIngreso) {
        showNotification('La fecha de ingreso es obligatoria', 'error');
        return;
      }

      // Verificar si el código ya existe
      const codigoExistente = bienes.find(b => b.codigo.toLowerCase() === nuevoBien.codigo.toLowerCase());
      if (codigoExistente) {
        showNotification('Ya existe un bien con este código', 'error');
        return;
      }

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoBien)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al crear el bien');
      }
      
      const bienCreado = await res.json();
      setBienes([...bienes, bienCreado]);
      setMostrarModalCrear(false);
      showNotification(`Bien "${bienCreado.nombre}" creado exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al crear el bien', 'error');
    }
  };

  const handleEditarBien = async (bienActualizado) => {
    try {
      // Validaciones
      if (!bienActualizado.codigo.trim()) {
        showNotification('El código del bien es obligatorio', 'error');
        return;
      }
      if (!bienActualizado.nombre.trim()) {
        showNotification('El nombre del bien es obligatorio', 'error');
        return;
      }
      if (!bienActualizado.estado) {
        showNotification('Debe seleccionar un estado', 'error');
        return;
      }
      if (!bienActualizado.valor || bienActualizado.valor <= 0) {
        showNotification('El valor debe ser mayor a 0', 'error');
        return;
      }

      const res = await fetch(`${API_URL}/${bienActualizado._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bienActualizado)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al editar el bien');
      }
      
      const actualizada = await res.json();
      setBienes(bienes.map(b => b._id === actualizada._id ? actualizada : b));
      setBienSeleccionado(null);
      showNotification(`Bien "${actualizada.nombre}" actualizado exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al editar el bien', 'error');
    }
  };

  const handleEliminarBien = async (id) => {
    const bienAEliminar = bienes.find(b => b._id === id);
    if (!window.confirm(`¿Seguro que deseas eliminar el bien "${bienAEliminar?.nombre}"?`)) return;
    
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al eliminar el bien');
      }
      
      setBienes(bienes.filter(b => b._id !== id));
      setBienSeleccionado(null);
      showNotification(`Bien "${bienAEliminar?.nombre}" eliminado exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al eliminar el bien', 'error');
    }
  };

  const bienesFiltrados = bienes.filter(b => {
    const terminoBusqueda = busqueda.toLowerCase();
    return (
      b.codigo?.toLowerCase().includes(terminoBusqueda) ||
      b.nombre?.toLowerCase().includes(terminoBusqueda) ||
      b.categoria?.toLowerCase().includes(terminoBusqueda) ||
      b.descripcion?.toLowerCase().includes(terminoBusqueda)
    );
  });

  const bienesActivos = bienesFiltrados.filter(b => b.estado === "ACTIVO");
  const bienesMantenimiento = bienesFiltrados.filter(b => b.estado === "MANTENIMIENTO");
  const bienesInactivos = bienesFiltrados.filter(b => b.estado === "INACTIVO");
  const bienesPrestados = bienesFiltrados.filter(b => b.estado === "PRESTAMO");

  const renderGrupoBienes = (titulo, lista) => (
    <div className="bien-categoria-section">
      <h3 className="bien-subtitulo">{titulo}</h3>
      {lista.length === 0 ? (
        <p className="bien-vacio">No hay bienes en esta categoría.</p>
      ) : (
        <div className="bien-listado">
          {lista.map((bien) => (
            <div key={bien._id} className="bien-card" onClick={() => setBienSeleccionado(bien)}>
              <div className="bien-card-header">
                <span className="bien-codigo">{bien.codigo}</span>
                <span className={`bien-estado-badge ${bien.estado}`}>{bien.estado}</span>
              </div>
              <div className="bien-card-body">
                <div className="bien-info-item">
                  <span className="bien-info-label">Nombre</span>
                  <span className="bien-info-value">{bien.nombre}</span>
                </div>
                <div className="bien-info-item">
                  <span className="bien-info-label">Categoría</span>
                  <span className="bien-info-value">{bien.categoria || '—'}</span>
                </div>
                <div className="bien-info-item">
                  <span className="bien-info-label">Descripción</span>
                  <span className="bien-info-value">{bien.descripcion}</span>
                </div>
                <div className="bien-info-item">
                  <span className="bien-info-label">Valor</span>
                  <span className="bien-info-value bien-valor">${bien.valor}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bien-container">
      <div className="bien-header">
        <h2>Sistema de Bienes</h2>
        <p>Gestiona y controla todos tus bienes de manera eficiente</p>
        <div className="bien-busqueda-bar">
          <input
            type="text"
            className="bien-busqueda"
            placeholder="Buscar por código, nombre, categoría o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button className="btn-ayuda" onClick={() => setMostrarAyuda(true)} title="Ver ayuda">
            ❓ Ayuda
          </button>
          <button className="btn-nueva-bien" onClick={() => setMostrarModalCrear(true)}>
            + Nuevo Bien
          </button>
        </div>
      </div>

      <div className="bien-categorias-container">
        {renderGrupoBienes("Bienes en uso", bienesActivos)}
        {renderGrupoBienes("Bienes en mantenimiento", bienesMantenimiento)}
        {renderGrupoBienes("Bienes inactivos", bienesInactivos)}
        {renderGrupoBienes("Bienes prestados", bienesPrestados)}
      </div>

      {mostrarModalCrear && (
        <ModalCrearBien
          onClose={() => setMostrarModalCrear(false)}
          onCreate={handleCrearBien}
        />
      )}

      {bienSeleccionado && (
        <ModalDetalleBien
          bien={bienSeleccionado}
          onClose={() => setBienSeleccionado(null)}
          onUpdate={handleEditarBien}
          onDelete={handleEliminarBien}
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
            <h3 className="modal-title">📚 Guía de Uso - Sistema de Bienes</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>🔍 Búsqueda</h4>
              <p>Puedes buscar bienes por:</p>
              <ul style={{ marginLeft: '1rem', marginBottom: '1rem' }}>
                <li><strong>Código:</strong> BIEN-001, BIEN-002, etc.</li>
                <li><strong>Nombre:</strong> Laptop, Mesa, Silla, etc.</li>
                <li><strong>Categoría:</strong> Tecnología, Mobiliario, etc.</li>
                <li><strong>Descripción:</strong> Cualquier palabra en la descripción</li>
              </ul>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>📋 Categorías de Bienes</h4>
              <ul style={{ marginLeft: '1rem', marginBottom: '1rem' }}>
                <li><strong>🟢 En Uso:</strong> Bienes activos y disponibles</li>
                <li><strong>🟡 Mantenimiento:</strong> Bienes en reparación o mantenimiento</li>
                <li><strong>🔴 Inactivos:</strong> Bienes no disponibles o retirados</li>
                <li><strong>🔵 Prestados:</strong> Bienes prestados a terceros</li>
              </ul>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>✨ Funciones Principales</h4>
              <ul style={{ marginLeft: '1rem', marginBottom: '1rem' }}>
                <li><strong>Crear Bien:</strong> Agregar nuevos bienes al inventario</li>
                <li><strong>Editar:</strong> Hacer clic en cualquier bien para editarlo</li>
                <li><strong>Eliminar:</strong> Opción disponible en el modal de edición</li>
                <li><strong>Filtrar:</strong> Usa la barra de búsqueda para encontrar bienes</li>
              </ul>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>⌨️ Atajos de Teclado</h4>
              <ul style={{ marginLeft: '1rem', marginBottom: '1rem' }}>
                <li><strong>Ctrl + N:</strong> Crear nuevo bien</li>
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

export default Bienes;