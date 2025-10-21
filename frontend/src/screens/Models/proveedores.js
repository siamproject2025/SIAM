// screens/Models/proveedores.js
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
    id_proveedor: '',
    nombre: '',
    empresa: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    pais: '',
    contacto: '',
    sitio_web: '',
    rtn: '',
    tipo_proveedor: 'PRODUCTOS',
    estado: 'ACTIVO',
    calificacion: 5,
    notas: '',
    condiciones_pago: '',
    tiempo_entrega_promedio: ''
  });

  useEffect(() => {
    cargarProveedores();
  }, );

  const cargarProveedores = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al cargar proveedores');
      const data = await res.json();
      setProveedores(data);
    } catch (err) {
      console.error('Error al obtener los proveedores:', err);
      showNotification('Error al cargar los proveedores', 'error');
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  const resetForm = () => {
    setFormData({
      id_proveedor: '',
      nombre: '',
      empresa: '',
      email: '',
      telefono: '',
      direccion: '',
      ciudad: '',
      pais: '',
      contacto: '',
      sitio_web: '',
      rtn: '',
      tipo_proveedor: 'PRODUCTOS',
      estado: 'ACTIVO',
      calificacion: 5,
      notas: '',
      condiciones_pago: '',
      tiempo_entrega_promedio: ''
    });
  };

  const generarIdProveedor = () => {
    // Genera un ID único basado en timestamp y número aleatorio
    return Date.now();
  };

  const handleCrearProveedor = async (e) => {
    e.preventDefault();
    
    try {
      // Validaciones
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

      // Preparar datos con ID generado
      const datosProveedor = {
        ...formData,
        id_proveedor: generarIdProveedor(),
        // Convertir campos numéricos
        calificacion: parseInt(formData.calificacion) || 5,
        tiempo_entrega_promedio: formData.tiempo_entrega_promedio ? 
          parseInt(formData.tiempo_entrega_promedio) : undefined
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosProveedor)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al crear el proveedor');
      }
      
      const proveedorCreado = await res.json();
      setProveedores([proveedorCreado, ...proveedores]);
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

      // Preparar datos actualizados
      const datosActualizados = {
        ...formData,
        calificacion: parseInt(formData.calificacion) || 5,
        tiempo_entrega_promedio: formData.tiempo_entrega_promedio ? 
          parseInt(formData.tiempo_entrega_promedio) : undefined
      };

      const res = await fetch(`${API_URL}/${proveedorSeleccionado._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosActualizados)
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
      p.pais?.toLowerCase().includes(terminoBusqueda) ||
      p.contacto?.toLowerCase().includes(terminoBusqueda)
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
      id_proveedor: proveedor.id_proveedor || '',
      nombre: proveedor.nombre || '',
      empresa: proveedor.empresa || '',
      email: proveedor.email || '',
      telefono: proveedor.telefono || '',
      direccion: proveedor.direccion || '',
      ciudad: proveedor.ciudad || '',
      pais: proveedor.pais || '',
      contacto: proveedor.contacto || '',
      sitio_web: proveedor.sitio_web || '',
      rtn: proveedor.rtn || '',
      tipo_proveedor: proveedor.tipo_proveedor || 'PRODUCTOS',
      estado: proveedor.estado || 'ACTIVO',
      calificacion: proveedor.calificacion || 5,
      notas: proveedor.notas || '',
      condiciones_pago: proveedor.condiciones_pago || '',
      tiempo_entrega_promedio: proveedor.tiempo_entrega_promedio || ''
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
        <h3 className="bien-subtitulo">{titulo} ({lista.length})</h3>
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
                <div className="bien-info-row">
                  <span className="bien-info-label">ID PROVEEDOR</span>
                  <span className="bien-info-value" style={{ fontWeight: 'bold', color: '#FF9800' }}>
                    {proveedor.id_proveedor}
                  </span>
                </div>
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
          <button className="btn-ayuda" onClick={() => setMostrarModalCrear(true)} title="Crear nuevo proveedor">
            ➕ Nuevo Proveedor
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
          <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">➕ Crear Nuevo Proveedor</h3>
            <form onSubmit={handleCrearProveedor}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Información Básica */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                </div>

                {/* Contacto */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Persona de Contacto</label>
                    <input
                      type="text"
                      value={formData.contacto}
                      onChange={(e) => setFormData({...formData, contacto: e.target.value})}
                      placeholder="Nombre del contacto"
                    />
                  </div>

                  <div className="form-group">
                    <label>RTN</label>
                    <input
                      type="text"
                      value={formData.rtn}
                      onChange={(e) => setFormData({...formData, rtn: e.target.value})}
                      placeholder="RTN del proveedor"
                    />
                  </div>
                </div>

                {/* Ubicación */}
                <div className="form-group">
                  <label>Dirección</label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                    placeholder="Dirección completa"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                </div>

                {/* Información Comercial */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Tipo</label>
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
                    <label>Calificación</label>
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
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Condiciones de Pago</label>
                    <input
                      type="text"
                      value={formData.condiciones_pago}
                      onChange={(e) => setFormData({...formData, condiciones_pago: e.target.value})}
                      placeholder="Ej: 30 días"
                    />
                  </div>

                  <div className="form-group">
                    <label>Tiempo Entrega (días)</label>
                    <input
                      type="number"
                      value={formData.tiempo_entrega_promedio}
                      onChange={(e) => setFormData({...formData, tiempo_entrega_promedio: e.target.value})}
                      placeholder="Días promedio"
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Sitio Web</label>
                  <input
                    type="url"
                    value={formData.sitio_web}
                    onChange={(e) => setFormData({...formData, sitio_web: e.target.value})}
                    placeholder="https://www.ejemplo.com"
                  />
                </div>

                <div className="form-group">
                  <label>Notas</label>
                  <textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({...formData, notas: e.target.value})}
                    placeholder="Notas adicionales..."
                    rows="3"
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn-cancelar" onClick={handleCloseModals}>
                  ❌ Cancelar
                </button>
                <button type="submit" className="btn-guardar">
                  ✅ Guardar Cambiosar
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
          <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">✏️ Editar Proveedor</h3>
            <form onSubmit={handleEditarProveedor}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Empresa</label>
                  <input
                    type="text"
                    value={formData.empresa}
                    onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono *</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Contacto</label>
                  <input
                    type="text"
                    value={formData.contacto}
                    onChange={(e) => setFormData({...formData, contacto: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>RTN</label>
                  <input
                    type="text"
                    value={formData.rtn}
                    onChange={(e) => setFormData({...formData, rtn: e.target.value})}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Dirección</label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Ciudad</label>
                  <input
                    type="text"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>País</label>
                  <input
                    type="text"
                    value={formData.pais}
                    onChange={(e) => setFormData({...formData, pais: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Tipo</label>
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
                  <label>Calificación</label>
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

                <div className="form-group">
                  <label>Condiciones de Pago</label>
                  <input
                    type="text"
                    value={formData.condiciones_pago}
                    onChange={(e) => setFormData({...formData, condiciones_pago: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Tiempo Entrega (días)</label>
                  <input
                    type="number"
                    value={formData.tiempo_entrega_promedio}
                    onChange={(e) => setFormData({...formData, tiempo_entrega_promedio: e.target.value})}
                    min="0"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Sitio Web</label>
                  <input
                    type="url"
                    value={formData.sitio_web}
                    onChange={(e) => setFormData({...formData, sitio_web: e.target.value})}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Notas</label>
                  <textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({...formData, notas: e.target.value})}
                    rows="3"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-eliminar" onClick={handleEliminarProveedor}>
                  🗑️ Eliminar
                </button>
                <button type="button" className="btn-cancelar" onClick={handleCloseModals}>
                  ❌ Cancel
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