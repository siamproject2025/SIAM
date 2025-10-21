// screens/Models/donaciones.js
import React, { useState, useEffect } from 'react';
import Notification from '../../components/Notification';
import '../../styles/Models/Bienes.css';

// Configurar la URL base de la API
const API_URL = 'http://localhost:5000/api/donaciones';

const Donaciones = () => {
  const [donaciones, setDonaciones] = useState([]);
  const [donacionSeleccionada, setDonacionSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [notification, setNotification] = useState(null);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    id_almacen: '',
    fecha: new Date().toISOString().split('T')[0],
    cantidad_donacion: '',
    descripcion: '',
    tipo_donacion: 'Alimentos',
    observaciones: ''
  });

  const tiposDonacion = [
    'Alimentos',
    'Vestimenta',
    'Medicina',
    'Enseres',
    'Bebidas',
    'Útiles escolares',
    'Productos de higiene',
    'Otro'
  ];

  useEffect(() => {
    cargarDonaciones();
  }, );

  const cargarDonaciones = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al cargar donaciones');
      const data = await res.json();
      setDonaciones(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Error al obtener donaciones:', err);
      showNotification('Error al cargar las donaciones', 'error');
      setDonaciones([]);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  const resetForm = () => {
    setFormData({
      id_almacen: '',
      fecha: new Date().toISOString().split('T')[0],
      cantidad_donacion: '',
      descripcion: '',
      tipo_donacion: 'Alimentos',
      observaciones: ''
    });
  };

  const handleCrearDonacion = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.id_almacen || !formData.fecha || !formData.cantidad_donacion) {
        showNotification('Por favor completa todos los campos obligatorios', 'error');
        return;
      }

      const datosDonacion = {
        id_almacen: parseInt(formData.id_almacen),
        fecha: formData.fecha,
        cantidad_donacion: parseFloat(formData.cantidad_donacion),
        descripcion: formData.descripcion.trim(),
        tipo_donacion: formData.tipo_donacion,
        observaciones: formData.observaciones.trim()
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosDonacion)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al crear la donación');
      }
      
      const donacionCreada = await res.json();
      setDonaciones([donacionCreada, ...donaciones]);
      setMostrarModalCrear(false);
      resetForm();
      showNotification(`Donación de ${donacionCreada.tipo_donacion} registrada exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al crear la donación', 'error');
    }
  };

  const handleEditarDonacion = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.id_almacen || !formData.fecha || !formData.cantidad_donacion) {
        showNotification('Por favor completa todos los campos obligatorios', 'error');
        return;
      }

      const datosActualizados = {
        id_almacen: parseInt(formData.id_almacen),
        fecha: formData.fecha,
        cantidad_donacion: parseFloat(formData.cantidad_donacion),
        descripcion: formData.descripcion.trim(),
        tipo_donacion: formData.tipo_donacion,
        observaciones: formData.observaciones.trim()
      };

      const idToUpdate = donacionSeleccionada._id || donacionSeleccionada.id_donacion;
      const res = await fetch(`${API_URL}/${idToUpdate}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosActualizados)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al editar la donación');
      }
      
      const actualizado = await res.json();
      setDonaciones(donaciones.map(d => (d._id || d.id_donacion) === (actualizado._id || actualizado.id_donacion) ? actualizado : d));
      setDonacionSeleccionada(null);
      resetForm();
      showNotification(`Donación actualizada exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al editar la donación', 'error');
    }
  };

  const handleEliminarDonacion = async () => {
    const donacionAEliminar = donaciones.find(d => (d._id || d.id_donacion) === (donacionSeleccionada._id || donacionSeleccionada.id_donacion));
    if (!window.confirm(`¿Seguro que deseas eliminar esta donación de ${donacionAEliminar?.tipo_donacion}?`)) return;
    
    try {
      const idToDelete = donacionSeleccionada._id || donacionSeleccionada.id_donacion;
      const res = await fetch(`${API_URL}/${idToDelete}`, { method: 'DELETE' });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al eliminar la donación');
      }
      
      setDonaciones(donaciones.filter(d => (d._id || d.id_donacion) !== idToDelete));
      setDonacionSeleccionada(null);
      resetForm();
      showNotification(`Donación eliminada exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al eliminar la donación', 'error');
    }
  };

  const donacionesFiltradas = donaciones.filter(d => {
    const terminoBusqueda = busqueda.toLowerCase();
    return (
      d.tipo_donacion?.toLowerCase().includes(terminoBusqueda) ||
      d.descripcion?.toLowerCase().includes(terminoBusqueda) ||
      d.id_almacen?.toString().includes(terminoBusqueda) ||
      d.cantidad_donacion?.toString().includes(terminoBusqueda)
    );
  });

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getTipoIcon = (tipo) => {
    const icons = {
      'Alimentos': '🍎',
      'Vestimenta': '👕',
      'Medicina': '💊',
      'Enseres': '🪑',
      'Bebidas': '🥤',
      'Útiles escolares': '📚',
      'Productos de higiene': '🧼',
      'Otro': '📦'
    };
    return icons[tipo] || '📦';
  };

  const handleOpenEditModal = (donacion) => {
    setDonacionSeleccionada(donacion);
    setFormData({
      id_almacen: donacion.id_almacen || '',
      fecha: new Date(donacion.fecha).toISOString().split('T')[0],
      cantidad_donacion: donacion.cantidad_donacion || '',
      descripcion: donacion.descripcion || '',
      tipo_donacion: donacion.tipo_donacion || 'Alimentos',
      observaciones: donacion.observaciones || ''
    });
  };

  const handleCloseModals = () => {
    setMostrarModalCrear(false);
    setDonacionSeleccionada(null);
    resetForm();
  };

  return (
    <div className="bien-container">
      <div className="bien-header">
        <h2>Sistema de Donaciones</h2>
        <p>Gestiona y controla todas las donaciones recibidas</p>
        <div className="bien-busqueda-bar">
          <input
            type="text"
            className="bien-busqueda"
            placeholder="Buscar por tipo, descripción, almacén o cantidad..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button className="btn-ayuda" onClick={() => setMostrarAyuda(true)} title="Ver ayuda">
            ❓ Ayuda
          </button>
          <button className="btn-ayuda" onClick={() => setMostrarModalCrear(true)} title="Registrar nueva donación">
            ➕ Nueva Donación
          </button>
        </div>
      </div>

      {loading && donaciones.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Cargando donaciones...</p>
        </div>
      ) : (
        <div className="bien-categorias-container">
          <div className="bien-categoria-section activos">
            <div className="bien-categoria-header">
              <h3 className="bien-subtitulo">📦 Todas las Donaciones ({donacionesFiltradas.length})</h3>
            </div>
            
            {donacionesFiltradas.length === 0 ? (
              <p className="bien-vacio">No hay donaciones registradas.</p>
            ) : (
              <div className="bien-listado">
                {donacionesFiltradas.map((donacion) => (
                  <div 
                    key={donacion._id || donacion.id_donacion} 
                    className="bien-card" 
                    onClick={() => handleOpenEditModal(donacion)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="bien-card-header">
                      <span className="bien-codigo">
                        {getTipoIcon(donacion.tipo_donacion)} {donacion.tipo_donacion}
                      </span>
                      <span className="bien-estado-badge activo">
                        Almacén {donacion.id_almacen}
                      </span>
                    </div>
                    <div className="bien-card-body">
                      <div className="bien-info-row">
                        <span className="bien-info-label">ID DONACIÓN</span>
                        <span className="bien-info-value" style={{ fontWeight: 'bold', color: '#FF9800' }}>
                          {donacion.id_donacion || donacion._id}
                        </span>
                      </div>
                      
                      <div className="bien-info-row">
                        <span className="bien-info-label">FECHA</span>
                        <span className="bien-info-value">{formatDate(donacion.fecha)}</span>
                      </div>
                      
                      <div className="bien-info-row">
                        <span className="bien-info-label">CANTIDAD</span>
                        <span className="bien-info-value" style={{ fontWeight: 'bold', color: '#4CAF50', fontSize: '1.1rem' }}>
                          {donacion.cantidad_donacion}
                        </span>
                      </div>
                      
                      {donacion.descripcion && (
                        <div className="bien-info-row">
                          <span className="bien-info-label">DESCRIPCIÓN</span>
                          <span className="bien-info-value" style={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {donacion.descripcion}
                          </span>
                        </div>
                      )}
                      
                      {donacion.observaciones && (
                        <div className="bien-info-row">
                          <span className="bien-info-label">OBSERVACIONES</span>
                          <span className="bien-info-value" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: '0.9rem',
                            color: '#666'
                          }}>
                            {donacion.observaciones}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Crear Donación */}
      {mostrarModalCrear && (
        <div className="modal-overlay" onClick={handleCloseModals}>
          <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">➕ Registrar Nueva Donación</h3>
            <form onSubmit={handleCrearDonacion}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>ID Almacén *</label>
                    <input
                      type="number"
                      value={formData.id_almacen}
                      onChange={(e) => setFormData({...formData, id_almacen: e.target.value})}
                      placeholder="Número de almacén"
                      required
                      min="1"
                    />
                  </div>

                  <div className="form-group">
                    <label>Fecha *</label>
                    <input
                      type="date"
                      value={formData.fecha}
                      onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Tipo de Donación *</label>
                    <select
                      value={formData.tipo_donacion}
                      onChange={(e) => setFormData({...formData, tipo_donacion: e.target.value})}
                      required
                    >
                      {tiposDonacion.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {getTipoIcon(tipo)} {tipo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Cantidad *</label>
                    <input
                      type="number"
                      value={formData.cantidad_donacion}
                      onChange={(e) => setFormData({...formData, cantidad_donacion: e.target.value})}
                      placeholder="Cantidad recibida"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    placeholder="Describe la donación recibida..."
                    rows="3"
                    maxLength={1000}
                  />
                  <small style={{ color: '#666', fontSize: '0.85rem' }}>
                    {formData.descripcion.length}/1000 caracteres
                  </small>
                </div>

                <div className="form-group">
                  <label>Observaciones</label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                    placeholder="Observaciones adicionales..."
                    rows="2"
                    maxLength={500}
                  />
                  <small style={{ color: '#666', fontSize: '0.85rem' }}>
                    {formData.observaciones.length}/500 caracteres
                  </small>
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn-cancelar" onClick={handleCloseModals}>
                  ❌ Cancelar
                </button>
                <button type="submit" className="btn-guardar">
                  ✅ Registrar Donación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Donación */}
      {donacionSeleccionada && (
        <div className="modal-overlay" onClick={handleCloseModals}>
          <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">✏️ Editar Donación</h3>
            <form onSubmit={handleEditarDonacion}>
              <div className="form-grid">
                <div className="form-group">
                  <label>ID Almacén *</label>
                  <input
                    type="number"
                    value={formData.id_almacen}
                    onChange={(e) => setFormData({...formData, id_almacen: e.target.value})}
                    required
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Fecha *</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tipo de Donación *</label>
                  <select
                    value={formData.tipo_donacion}
                    onChange={(e) => setFormData({...formData, tipo_donacion: e.target.value})}
                    required
                  >
                    {tiposDonacion.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {getTipoIcon(tipo)} {tipo}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Cantidad *</label>
                  <input
                    type="number"
                    value={formData.cantidad_donacion}
                    onChange={(e) => setFormData({...formData, cantidad_donacion: e.target.value})}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Descripción</label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    rows="3"
                    maxLength={1000}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Observaciones</label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                    rows="2"
                    maxLength={500}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-eliminar" onClick={handleEliminarDonacion}>
                  🗑️ Eliminar
                </button>
                <button type="button" className="btn-cancelar" onClick={handleCloseModals}>
                  ❌ Cancelar
                </button>
                <button type="submit" className="btn-guardar">
                  ✅ Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Modal Ayuda */}
      {mostrarAyuda && (
        <div className="modal-overlay" onClick={() => setMostrarAyuda(false)}>
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '80vh', overflow: 'auto', paddingBottom: '80px' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">📚 Guía de Uso - Sistema de Donaciones</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem', fontSize: '1rem' }}>🔍 Búsqueda</h4>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Busca por tipo, descripción, almacén o cantidad.</p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem', fontSize: '1rem' }}>📋 Tipos de Donación</h4>
              <ul style={{ marginLeft: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <li><strong>🍎 Alimentos:</strong> Donaciones de alimentos</li>
                <li><strong>👕 Vestimenta:</strong> Ropa y calzado</li>
                <li><strong>💊 Medicina:</strong> Medicamentos y suministros médicos</li>
                <li><strong>🪑 Enseres:</strong> Muebles y enseres</li>
                <li><strong>🥤 Bebidas:</strong> Bebidas y líquidos</li>
                <li><strong>📚 Útiles escolares:</strong> Material educativo</li>
                <li><strong>🧼 Productos de higiene:</strong> Artículos de limpieza</li>
                <li><strong>📦 Otro:</strong> Otras donaciones</li>
              </ul>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem', fontSize: '1rem' }}>✨ Funciones</h4>
              <ul style={{ marginLeft: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <li>Clic en tarjeta para ver/editar detalles</li>
                <li>Registro con fecha automática</li>
                <li>Búsqueda en tiempo real</li>
                <li>Vista unificada de todas las donaciones</li>
                <li>Iconos visuales por tipo</li>
              </ul>
            </div>

            <div style={{ 
              position: 'sticky', 
              bottom: '0', 
              left: '0', 
              right: '0', 
              padding: '1rem', 
              background: 'white', 
              borderTop: '1px solid #e0e0e0',
              marginLeft: '-1.5rem',
              marginRight: '-1.5rem',
              marginBottom: '-1.5rem',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <button 
                className="btn-cerrar" 
                onClick={() => setMostrarAyuda(false)}
                style={{ width: '200px' }}
              >
                ✅ Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Donaciones;