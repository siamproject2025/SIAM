import React, { useEffect, useState } from 'react';
import ModalCrearOrden from './OrdenCompra/ModalCrearOrden';
import ModalDetalleOrden from './OrdenCompra/ModalDetalleOrden';
import Notification from '../../components/Notification';
import '../../styles/Models/ordencompra.css';

const API_URL = "http://localhost:5000/api/compras";

const OrdenCompra = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [notification, setNotification] = useState(null);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setOrdenes(data))
      .catch(err => console.error('Error al obtener órdenes:', err));
  }, []);

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  const handleCrearOrden = async (nuevaOrden) => {
    try {
      // Validaciones
      if (!nuevaOrden.numero.trim()) {
        showNotification('El número de orden es obligatorio', 'error');
        return;
      }
      if (!nuevaOrden.proveedor_id.trim()) {
        showNotification('El ID del proveedor es obligatorio', 'error');
        return;
      }
      if (!nuevaOrden.items || nuevaOrden.items.length === 0) {
        showNotification('Debe agregar al menos un ítem a la orden', 'error');
        return;
      }

      // Verificar si el número ya existe
      const numeroExistente = ordenes.find(o => o.numero.toLowerCase() === nuevaOrden.numero.toLowerCase());
      if (numeroExistente) {
        showNotification('Ya existe una orden con este número', 'error');
        return;
      }

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaOrden)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al crear la orden');
      }
      
      const ordenCreada = await res.json();
      setOrdenes([...ordenes, ordenCreada]);
      setMostrarModalCrear(false);
      showNotification(`Orden "${ordenCreada.numero}" creada exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al crear la orden', 'error');
    }
  };

  const handleEditarOrden = async (ordenActualizada) => {
    try {
      // Validaciones
      if (!ordenActualizada.numero.trim()) {
        showNotification('El número de orden es obligatorio', 'error');
        return;
      }
      if (!ordenActualizada.proveedor_id.trim()) {
        showNotification('El ID del proveedor es obligatorio', 'error');
        return;
      }
      if (!ordenActualizada.items || ordenActualizada.items.length === 0) {
        showNotification('La orden debe tener al menos un ítem', 'error');
        return;
      }

      // Asegurar que la fecha se mantenga si no se ha especificado
      const ordenParaEnviar = {
        ...ordenActualizada,
        fecha: ordenActualizada.fecha || new Date().toISOString().split('T')[0]
      };

      const res = await fetch(`${API_URL}/${ordenActualizada._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ordenParaEnviar)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al editar la orden');
      }
      
      const actualizada = await res.json();
      setOrdenes(ordenes.map(o => o._id === actualizada._id ? actualizada : o));
      setOrdenSeleccionada(null);
      showNotification(`Orden "${actualizada.numero}" actualizada exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al editar la orden', 'error');
    }
  };

  const handleEliminarOrden = async (id) => {
    const ordenAEliminar = ordenes.find(o => o._id === id);
    if (!window.confirm(`¿Seguro que deseas eliminar la orden "${ordenAEliminar?.numero}"?`)) return;
    
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al eliminar la orden');
      }
      
      setOrdenes(ordenes.filter(o => o._id !== id));
      setOrdenSeleccionada(null);
      showNotification(`Orden "${ordenAEliminar?.numero}" eliminada exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al eliminar la orden', 'error');
    }
  };

  const handleVolverDashboard = () => {
    // Redirigir al dashboard
    window.location.href = '/dashboard';
  };

  const ordenesFiltradas = ordenes.filter(o => {
    const terminoBusqueda = busqueda.toLowerCase();
    return (
      o.numero?.toLowerCase().includes(terminoBusqueda) ||
      o.proveedor_id?.toLowerCase().includes(terminoBusqueda) ||
      o.estado?.toLowerCase().includes(terminoBusqueda)
    );
  });

  const ordenesBorrador = ordenesFiltradas.filter(o => o.estado === "BORRADOR");
  const ordenesEnviadas = ordenesFiltradas.filter(o => o.estado === "ENVIADA");
  const ordenesRecibidas = ordenesFiltradas.filter(o => o.estado === "RECIBIDA");
  const ordenesCerradas = ordenesFiltradas.filter(o => o.estado === "CERRADA");

  const renderGrupoOrdenes = (titulo, lista) => (
    <div className="orden-categoria-section">
      <h3 className="orden-subtitulo">{titulo}</h3>
      {lista.length === 0 ? (
        <p className="orden-vacio">No hay órdenes en esta categoría.</p>
      ) : (
        <div className="orden-listado">
          {lista.map((orden) => {
            const total = orden.items?.reduce((acc, item) => acc + item.cantidad * item.costoUnit, 0).toFixed(2) || 0;
            return (
              <div key={orden._id} className="orden-card" onClick={() => setOrdenSeleccionada(orden)}>
                <div className="orden-card-header">
                  <span className="orden-numero">{orden.numero}</span>
                  <span className={`orden-estado-badge ${orden.estado}`}>{orden.estado}</span>
                </div>
                <div className="orden-card-body">
                  <div className="orden-info-item">
                    <span className="orden-info-label">Proveedor</span>
                    <span className="orden-info-value">{orden.proveedor_id}</span>
                  </div>
                  <div className="orden-info-item">
                    <span className="orden-info-label">Fecha</span>
                    <span className="orden-info-value">{orden.fecha ? new Date(orden.fecha).toLocaleDateString('es-ES') : '—'}</span>
                  </div>
                  <div className="orden-info-item">
                    <span className="orden-info-label">Total</span>
                    <span className="orden-info-value orden-total">${total}</span>
                  </div>
                </div>
                
                {/* Mostrar ítems de la orden */}
                {orden.items && orden.items.length > 0 && (
                  <div className="orden-items-preview">
                    <h5>📦 Ítems ({orden.items.length}):</h5>
                    <div className="orden-items-list">
                      {orden.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="orden-item-preview">
                          <span className="item-descripcion">{item.descripcion}</span>
                          <span className="item-cantidad">Cant: {item.cantidad}</span>
                          <span className="item-subtotal">${(item.cantidad * item.costoUnit).toFixed(2)}</span>
                        </div>
                      ))}
                      {orden.items.length > 3 && (
                        <div className="orden-item-more">
                          +{orden.items.length - 3} ítems más...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="orden-container">
      <div className="orden-header">
        <h2>Sistema de Órdenes de Compra</h2>
        <p>Gestiona y controla todas tus órdenes de manera eficiente</p>
        <div className="orden-busqueda-bar">
          <input
            type="text"
            className="orden-busqueda"
                    placeholder="Buscar por número, proveedor o estado..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
                  <button className="btn-ayuda" onClick={() => setMostrarAyuda(true)} title="Ver ayuda">
                    ❓ Ayuda
                  </button>
          <button className="btn-nueva-orden" onClick={() => setMostrarModalCrear(true)}>
            + Nueva Orden
          </button>
        </div>
      </div>

      <div className="orden-categorias-container">
        {renderGrupoOrdenes("Órdenes en borrador", ordenesBorrador)}
        {renderGrupoOrdenes("Órdenes enviadas", ordenesEnviadas)}
        {renderGrupoOrdenes("Órdenes recibidas", ordenesRecibidas)}
        {renderGrupoOrdenes("Órdenes cerradas", ordenesCerradas)}
        </div>

      {mostrarModalCrear && (
        <ModalCrearOrden
          onClose={() => setMostrarModalCrear(false)}
          onCreate={handleCrearOrden}
          ordenesExistentes={ordenes}
        />
      )}

      {ordenSeleccionada && (
        <ModalDetalleOrden
          orden={ordenSeleccionada}
          onClose={() => setOrdenSeleccionada(null)}
          onUpdate={handleEditarOrden}
          onDelete={handleEliminarOrden}
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
            <h3 className="modal-title">📚 Guía de Uso - Sistema de Órdenes</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>🔍 Búsqueda</h4>
              <p>Puedes buscar órdenes por:</p>
              <ul style={{ marginLeft: '1rem', marginBottom: '1rem' }}>
                <li><strong>Número:</strong> ORD-001, ORD-002, etc.</li>
                <li><strong>Proveedor:</strong> ID del proveedor</li>
                <li><strong>Estado:</strong> BORRADOR, ENVIADA, etc.</li>
              </ul>
      </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>📋 Estados de Órdenes</h4>
              <ul style={{ marginLeft: '1rem', marginBottom: '1rem' }}>
                <li><strong>📝 BORRADOR:</strong> Órdenes en proceso de creación</li>
                <li><strong>📤 ENVIADA:</strong> Órdenes enviadas al proveedor</li>
                <li><strong>📦 RECIBIDA:</strong> Órdenes recibidas y verificadas</li>
                <li><strong>✅ CERRADA:</strong> Órdenes completadas</li>
          </ul>
        </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>✨ Funciones Principales</h4>
              <ul style={{ marginLeft: '1rem', marginBottom: '1rem' }}>
                <li><strong>Crear Orden:</strong> Agregar nuevas órdenes de compra</li>
                <li><strong>Editar:</strong> Hacer clic en cualquier orden para editarla</li>
                <li><strong>Eliminar:</strong> Opción disponible en el modal de edición</li>
                <li><strong>PDF:</strong> Descargar órdenes en formato PDF</li>
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

export default OrdenCompra;