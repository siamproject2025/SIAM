// screens/Models/proveedores.js// screens/Models/proveedores.js
import React, { useEffect, useState } from "react";
import Notification from '../../components/Notification';
import '../../styles/Models/Bienes.css';

const API_URL = "http://localhost:5000/api/proveedores";

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [notification, setNotification] = useState(null);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    empresa: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    pais: '',
    tipo_proveedor: 'PRODUCTOS',
    estado: 'ACTIVO',
    calificacion: 5,
    notas: ''
  });

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setProveedores(data))
      .catch(err => console.error('Error al obtener los proveedores:', err));
  }, []);

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      empresa: '',
      email: '',
      telefono: '',
      direccion: '',
      ciudad: '',
      pais: '',
      tipo_proveedor: 'PRODUCTOS',
      estado: 'ACTIVO',
      calificacion: 5,
      notas: ''
    });
  };

  const handleCrearProveedor = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.nombre.trim()) {
        showNotification('El nombre del proveedor es obligatorio', 'error');
        return;
      }
      if (!formData.email.trim()) {
        showNotification('El email del proveedor es obligatorio', 'error');
        return;
      }
      if (!formData.telefono) {
        showNotification('El teléfono del proveedor es obligatorio', 'error');
        return;
      }

      const emailExistente = proveedores.find(p => p.email.toLowerCase() === formData.email.toLowerCase());
      if (emailExistente) {
        showNotification('Ya existe un proveedor con este email', 'error');
        return;
      }

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al crear el proveedor');
      }
      
      const proveedorCreado = await res.json();
      setProveedores([...proveedores, proveedorCreado]);
      setMostrarModalCrear(false);
      resetForm();
      showNotification(`Proveedor "${proveedorCreado.nombre}" creado exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al crear el proveedor', 'error');
    }
  };

  const handleEditarProveedor = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.nombre.trim()) {
        showNotification('El nombre del proveedor es obligatorio', 'error');
        return;
      }
      if (!formData.email.trim()) {
        showNotification('El email del proveedor es obligatorio', 'error');
        return;
      }
      if (!formData.telefono) {
        showNotification('El teléfono del proveedor es obligatorio', 'error');
        return;
      }

      const res = await fetch(`${API_URL}/${proveedorSeleccionado._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al editar el proveedor');
      }
      
      const actualizado = await res.json();
      setProveedores(proveedores.map(p => p._id === actualizado._id ? actualizado : p));
      setProveedorSeleccionado(null);
      resetForm();
      showNotification(`Proveedor "${actualizado.nombre}" actualizado exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al editar el proveedor', 'error');
    }
  };

  const handleEliminarProveedor = async () => {
    const proveedorAEliminar = proveedores.find(p => p._id === proveedorSeleccionado._id);
    if (!window.confirm(`¿Seguro que deseas eliminar el proveedor "${proveedorAEliminar?.nombre}"?`)) return;
    
    try {
      const res = await fetch(`${API_URL}/${proveedorSeleccionado._id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al eliminar el proveedor');
      }
      
      setProveedores(proveedores.filter(p => p._id !== proveedorSeleccionado._id));
      setProveedorSeleccionado(null);
      resetForm();
      showNotification(`Proveedor "${proveedorAEliminar?.nombre}" eliminado exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al eliminar el proveedor', 'error');
    }
  };

  const proveedoresFiltrados = proveedores.filter(p => {
    const terminoBusqueda = busqueda.toLowerCase();
    return (
      p.nombre?.toLowerCase().includes(terminoBusqueda) ||
      p.empresa?.toLowerCase().includes(terminoBusqueda) ||
      p.email?.toLowerCase().includes(terminoBusqueda) ||
      p.telefono?.toString().includes(terminoBusqueda) ||
      p.ciudad?.toLowerCase().includes(terminoBusqueda) ||
      p.pais?.toLowerCase().includes(terminoBusqueda)
    );
  });

  const proveedoresActivos = proveedoresFiltrados.filter(p => p.estado === "ACTIVO");
  const proveedoresInactivos = proveedoresFiltrados.filter(p => p.estado === "INACTIVO");
  const proveedoresSuspendidos = proveedoresFiltrados.filter(p => p.estado === "SUSPENDIDO");

  const getEstrellas = (calificacion) => {
    if (!calificacion) return '☆☆☆☆☆';
    return '★'.repeat(calificacion) + '☆'.repeat(5 - calificacion);
  };

  const handleOpenEditModal = (proveedor) => {
    setProveedorSeleccionado(proveedor);
    setFormData({
      nombre: proveedor.nombre || '',
      empresa: proveedor.empresa || '',
      email: proveedor.email || '',
      telefono: proveedor.telefono || '',
      direccion: proveedor.direccion || '',
      ciudad: proveedor.ciudad || '',
      pais: proveedor.pais || '',
      tipo_proveedor: proveedor.tipo_proveedor || 'PRODUCTOS',
      estado: proveedor.estado || 'ACTIVO',
      calificacion: proveedor.calificacion || 5,
      notas: proveedor.notas || ''
    });
  };

  const handleCloseModals = () => {
    setMostrarModalCrear(false);
    setProveedorSeleccionado(null);
    resetForm();
  };

  const renderGrupoProveedores = (titulo, lista, colorClase) => (
    <div className={`bien-categoria-section ${colorClase}`}>
      <div className="bien-categoria-header">
        <h3 className="bien-subtitulo">{titulo}</h3>
      </div>
      {lista.length === 0 ? (
        <p className="bien-vacio">No hay proveedores en esta categoría.</p>
      ) : (
        <div className="bien-listado">
          {lista.map((proveedor) => (
            <div key={proveedor._id} className="bien-card" onClick={() => handleOpenEditModal(proveedor)}>
              <div className="bien-card-header">
                <span className="bien-codigo">{proveedor.nombre}</span>
                <span className={`bien-estado-badge ${proveedor.estado.toLowerCase()}`}>
                  {proveedor.estado}
                </span>
              </div>
              <div className="bien-card-body">
                {proveedor.empresa && (
                  <div className="bien-info-row">
                    <span className="bien-info-label">EMPRESA</span>
                    <span className="bien-info-value">{proveedor.empresa}</span>
                  </div>
                )}
                <div className="bien-info-row">
                  <span className="bien-info-label">EMAIL</span>
                  <span className="bien-info-value">{proveedor.email}</span>
                </div>
                <div className="bien-info-row">
                  <span className="bien-info-label">TELÉFONO</span>
                  <span className="bien-info-value">{proveedor.telefono}</span>
                </div>
                {proveedor.tipo_proveedor && (
                  <div className="bien-info-row">
                    <span className="bien-info-label">TIPO</span>
                    <span className="bien-info-value">{proveedor.tipo_proveedor}</span>
                  </div>
                )}
                {proveedor.ciudad && proveedor.pais && (
                  <div className="bien-info-row">
                    <span className="bien-info-label">UBICACIÓN</span>
                    <span className="bien-info-value">{proveedor.ciudad}, {proveedor.pais}</span>
                  </div>
                )}
                {proveedor.calificacion && (
                  <div className="bien-info-row">
                    <span className="bien-info-label">CALIFICACIÓN</span>
                    <span className="bien-info-value bien-estrellas">{getEstrellas(proveedor.calificacion)}</span>
                  </div>
                )}
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
        <h2>Sistema de Proveedores</h2>
        <p>Gestiona y controla todos tus proveedores de manera eficiente</p>
        <div className="bien-busqueda-bar">
          <input
            type="text"
            className="bien-busqueda"
            placeholder="Buscar por nombre, empresa, email, teléfono, ciudad o país..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button className="btn-ayuda" onClick={() => setMostrarAyuda(true)} title="Ver ayuda">
            ❓ Ayuda
          </button>
          <button className="btn-nuevo-bien" onClick={() => setMostrarModalCrear(true)}>
            + Nuevo Proveedor
          </button>
        </div>
      </div>

      <div className="bien-categorias-container">
        {renderGrupoProveedores("Proveedores activos", proveedoresActivos, "activos")}
        {renderGrupoProveedores("Proveedores inactivos", proveedoresInactivos, "inactivos")}
        {renderGrupoProveedores("Proveedores suspendidos", proveedoresSuspendidos, "suspendidos")}
      </div>

      {/* Modal Crear Proveedor */}
      {mostrarModalCrear && (
        <div className="modal-overlay" onClick={handleCloseModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">➕ Crear Nuevo Proveedor</h3>
            <form onSubmit={handleCrearProveedor}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Nombre del proveedor"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Empresa</label>
                  <input
                    type="text"
                    value={formData.empresa}
                    onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                    placeholder="Nombre de la empresa"
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono *</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    placeholder="+504 1234-5678"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Dirección</label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                    placeholder="Dirección completa"
                  />
                </div>

                <div className="form-group">
                  <label>Ciudad</label>
                  <input
                    type="text"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
                    placeholder="Ciudad"
                  />
                </div>

                <div className="form-group">
                  <label>País</label>
                  <input
                    type="text"
                    value={formData.pais}
                    onChange={(e) => setFormData({...formData, pais: e.target.value})}
                    placeholder="País"
                  />
                </div>

                <div className="form-group">
                  <label>Tipo de Proveedor</label>
                  <select
                    value={formData.tipo_proveedor}
                    onChange={(e) => setFormData({...formData, tipo_proveedor: e.target.value})}
                  >
                    <option value="PRODUCTOS">PRODUCTOS</option>
                    <option value="SERVICIOS">SERVICIOS</option>
                    <option value="MIXTO">MIXTO</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Estado</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                    <option value="SUSPENDIDO">SUSPENDIDO</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Calificación (1-5)</label>
                  <select
                    value={formData.calificacion}
                    onChange={(e) => setFormData({...formData, calificacion: parseInt(e.target.value)})}
                  >
                    <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                    <option value="4">⭐⭐⭐⭐ (4)</option>
                    <option value="3">⭐⭐⭐ (3)</option>
                    <option value="2">⭐⭐ (2)</option>
                    <option value="1">⭐ (1)</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Notas</label>
                  <textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({...formData, notas: e.target.value})}
                    placeholder="Notas adicionales sobre el proveedor..."
                    rows="3"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancelar" onClick={handleCloseModals}>
                  ❌ Cancelar
                </button>
                <button type="submit" className="btn-guardar">
                  ✅ Crear Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Proveedor */}
      {proveedorSeleccionado && (
        <div className="modal-overlay" onClick={handleCloseModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">✏️ Editar Proveedor</h3>
            <form onSubmit={handleEditarProveedor}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Nombre del proveedor"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Empresa</label>
                  <input
                    type="text"
                    value={formData.empresa}
                    onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                    placeholder="Nombre de la empresa"
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono *</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    placeholder="+504 1234-5678"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Dirección</label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                    placeholder="Dirección completa"
                  />
                </div>

                <div className="form-group">
                  <label>Ciudad</label>
                  <input
                    type="text"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
                    placeholder="Ciudad"
                  />
                </div>

                <div className="form-group">
                  <label>País</label>
                  <input
                    type="text"
                    value={formData.pais}
                    onChange={(e) => setFormData({...formData, pais: e.target.value})}
                    placeholder="País"
                  />
                </div>

                <div className="form-group">
                  <label>Tipo de Proveedor</label>
                  <select
                    value={formData.tipo_proveedor}
                    onChange={(e) => setFormData({...formData, tipo_proveedor: e.target.value})}
                  >
                    <option value="PRODUCTOS">PRODUCTOS</option>
                    <option value="SERVICIOS">SERVICIOS</option>
                    <option value="MIXTO">MIXTO</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Estado</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                    <option value="SUSPENDIDO">SUSPENDIDO</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Calificación (1-5)</label>
                  <select
                    value={formData.calificacion}
                    onChange={(e) => setFormData({...formData, calificacion: parseInt(e.target.value)})}
                  >
                    <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                    <option value="4">⭐⭐⭐⭐ (4)</option>
                    <option value="3">⭐⭐⭐ (3)</option>
                    <option value="2">⭐⭐ (2)</option>
                    <option value="1">⭐ (1)</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Notas</label>
                  <textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({...formData, notas: e.target.value})}
                    placeholder="Notas adicionales sobre el proveedor..."
                    rows="3"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-eliminar" onClick={handleEliminarProveedor}>
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
            <h3 className="modal-title">📚 Guía de Uso - Sistema de Proveedores</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem', fontSize: '1rem' }}>🔍 Búsqueda</h4>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Busca por: nombre, empresa, email, teléfono o ubicación.</p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem', fontSize: '1rem' }}>📋 Categorías</h4>
              <ul style={{ marginLeft: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <li><strong>🟢 Activos:</strong> Relación comercial activa</li>
                <li><strong>🔴 Inactivos:</strong> Sin actividad reciente</li>
                <li><strong>🟡 Suspendidos:</strong> Temporalmente suspendidos</li>
              </ul>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem', fontSize: '1rem' }}>🏷️ Tipos</h4>
              <ul style={{ marginLeft: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <li><strong>PRODUCTOS:</strong> Productos físicos</li>
                <li><strong>SERVICIOS:</strong> Proveedores de servicios</li>
                <li><strong>MIXTO:</strong> Productos y servicios</li>
              </ul>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem', fontSize: '1rem' }}>✨ Funciones</h4>
              <ul style={{ marginLeft: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <li>Clic en proveedor para editar</li>
                <li>Sistema de calificación 1-5 estrellas</li>
                <li>Búsqueda en tiempo real</li>
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

export default Proveedores;