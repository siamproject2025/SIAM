import React, { useState, useEffect } from 'react';
import { auth } from "..//..//../components/authentication/Auth";

import Notification from "../../../components/Notification";

const API_URL = process.env.REACT_APP_API_URL+"/api/proveedores"

const ModalCrearOrden = ({ onClose, onCreate }) => {
  const [nuevaOrden, setNuevaOrden] = useState({
    numero: '',
    proveedor_id: '',
    estado: 'BORRADOR',
    fecha: new Date().toISOString().split('T')[0],
    items: [],
    recepciones: []
  });

  const [nuevoItem, setNuevoItem] = useState({
    descripcion: '',
    cantidad: '',
    costoUnit: ''
  });

  // Estado para notificaciones
const [notificacion, setNotificacion] = useState(null);

const mostrarNotificacion = (mensaje, tipo = 'info', duracion = 3000) => {
  setNotificacion({ message: mensaje, type: tipo, duration: duracion });
};


  // Estado para proveedores obtenidos desde la API
  const [proveedores, setProveedores] = useState([]);
  const [cargandoProveedores, setCargandoProveedores] = useState(true);

  // 🔹 Llamada a la API de proveedores
  useEffect(() => {
  const fetchProveedores = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');
      const token = await user.getIdToken();

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}` // ✅ Token agregado
        }
      });

      if (!response.ok) throw new Error('Error al obtener proveedores');
      const data = await response.json();

      // Filtrar solo proveedores activos
      const proveedoresActivos = data.filter(p => p.estado === 'ACTIVO');
      setProveedores(proveedoresActivos);
      setCargandoProveedores(false);
    } catch (error) {
      console.error('Error cargando proveedores:', error);
      setCargandoProveedores(false);
      mostrarNotificacion(
        error.message || 'Error al cargar los proveedores. Verifica la conexión con el servidor.',
        'warning'
      );
    }
  };

  fetchProveedores();
}, []);


  // Agregar ítem
  const handleAgregarItem = () => {
    if (!nuevoItem.descripcion || !nuevoItem.cantidad || !nuevoItem.costoUnit) {
      mostrarNotificacion('Por favor completa todos los campos del ítem', 'warning');
      return;
    }
    
    const cantidad = parseFloat(nuevoItem.cantidad);
    const costoUnit = parseFloat(nuevoItem.costoUnit);
    
    if (cantidad <= 0 || costoUnit < 0) {
      mostrarNotificacion('La cantidad debe ser mayor a 0 y el costo no puede ser negativo,', 'warning');
      return;
    }
    
    const item = {
      descripcion: nuevoItem.descripcion,
      cantidad: cantidad,
      costoUnit: costoUnit
    };
    
    setNuevaOrden({
      ...nuevaOrden,
      items: [...nuevaOrden.items, item]
    });
    setNuevoItem({ descripcion: '', cantidad: '', costoUnit: '' });
  };

  // Eliminar ítem
  const handleEliminarItem = (index) => {
    setNuevaOrden({
      ...nuevaOrden,
      items: nuevaOrden.items.filter((_, i) => i !== index)
    });
  };

  // Crear orden (validar campos obligatorios)
 const handleCrear = () => {
  // Validar número de orden
  if (!nuevaOrden.numero || nuevaOrden.numero.trim() === '') {
    mostrarNotificacion('El número de orden es obligatorio', 'warning');
    return;
  }

  // Validar proveedor
  if (!nuevaOrden.proveedor_id || nuevaOrden.proveedor_id.trim() === '') {
    mostrarNotificacion('Debes seleccionar un proveedor', 'warning');
    return;
  }

  // Validar fecha
  if (!nuevaOrden.fecha || nuevaOrden.fecha.trim() === '') {
    mostrarNotificacion('La fecha de creación es obligatoria', 'warning');
    return;
  }

  // Validar estado
  if (!nuevaOrden.estado || nuevaOrden.estado.trim() === '') {
    mostrarNotificacion('El estado de la orden es obligatorio', 'warning');
    return;
  }

  // Validar ítems
  if (!nuevaOrden.items || nuevaOrden.items.length === 0) {
    mostrarNotificacion('Debes agregar al menos un ítem a la orden', 'warning');
    return;
  }

  // Validar cada ítem
  const itemsInvalidos = nuevaOrden.items.some(
    item =>
      !item.descripcion ||
      item.cantidad <= 0 ||
      item.costoUnit < 0
  );

  if (itemsInvalidos) {
    mostrarNotificacion('Todos los ítems deben tener descripción, cantidad mayor a 0 y costo válido', 'warning');
    return;
  }

  // Si todo está bien, crear la orden
  onCreate(nuevaOrden);
  mostrarNotificacion('Orden creada exitosamente', 'success');
};


  // Calcular total
  const total = nuevaOrden.items.reduce(
    (acc, item) => acc + item.cantidad * item.costoUnit,
    0
  );

  // Obtener nombre del proveedor seleccionado
  const proveedorSeleccionado = proveedores.find(p => p._id === nuevaOrden.proveedor_id);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
        <h3 className="modal-title">✨ Crear Nueva Orden de Compra</h3>

        <div className="modal-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Número de orden */}
          <div className="form-group">
            <label>Número de Orden *</label>
            <input
              type="text"
              value={nuevaOrden.numero}
              onChange={(e) => setNuevaOrden({ ...nuevaOrden, numero: e.target.value })}
              placeholder="Ej: ORD-001"
              required
            />
          </div>

          {/* 🔹 Selector de proveedor mejorado */}
          <div className="form-group">
            <label>Proveedor * {cargandoProveedores && '(Cargando...)'}</label>
            <select
              value={nuevaOrden.proveedor_id}
              onChange={(e) => setNuevaOrden({ ...nuevaOrden, proveedor_id: e.target.value })}
              disabled={cargandoProveedores}
              required
            >
              <option value="">Seleccione un proveedor</option>
              {proveedores.map((prov) => (
                <option key={prov._id} value={prov._id}>
                  ID: {prov.id_proveedor} - {prov.nombre} {prov.empresa ? `(${prov.empresa})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div className="form-group">
            <label>Fecha de Creación *</label>
            <input
              type="date"
              value={nuevaOrden.fecha}
              onChange={(e) => setNuevaOrden({ ...nuevaOrden, fecha: e.target.value })}
              required
            />
          </div>

          {/* Estado */}
          <div className="form-group">
            <label>Estado Actual *</label>
            <select
              value={nuevaOrden.estado}
              onChange={(e) => setNuevaOrden({ ...nuevaOrden, estado: e.target.value })}
              required
            >
              <option value="BORRADOR">📝 Borrador</option>
              <option value="ENVIADA">📤 Enviada</option>
              <option value="RECIBIDA">📦 Recibida</option>
              <option value="CERRADA">✅ Cerrada</option>
            </select>
          </div>
        </div>

        {/* Mostrar información del proveedor seleccionado */}
        {proveedorSeleccionado && (
          <div style={{
            background: '#f0f9ff',
            padding: '1rem',
            borderRadius: '8px',
            marginTop: '1rem',
            border: '1px solid #0ea5e9'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#0369a1', fontSize: '0.9rem' }}>
              📋 Información del Proveedor
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div><strong>ID:</strong> {proveedorSeleccionado.id_proveedor}</div>
              <div><strong>Nombre:</strong> {proveedorSeleccionado.nombre}</div>
              {proveedorSeleccionado.empresa && (
                <div><strong>Empresa:</strong> {proveedorSeleccionado.empresa}</div>
              )}
              {proveedorSeleccionado.telefono && (
                <div><strong>Teléfono:</strong> {proveedorSeleccionado.telefono}</div>
              )}
              {proveedorSeleccionado.email && (
                <div style={{ gridColumn: '1 / -1' }}><strong>Email:</strong> {proveedorSeleccionado.email}</div>
              )}
            </div>
          </div>
        )}

        {/* Sección ítems */}
        <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>📦 Ítems de la Orden</h4>

        <div className="item-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <input
            type="text"
            placeholder="Descripción del ítem"
            value={nuevoItem.descripcion}
            onChange={(e) => setNuevoItem({ ...nuevoItem, descripcion: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && handleAgregarItem()}
          />
          <input
            type="number"
            placeholder="Cantidad"
            value={nuevoItem.cantidad}
            onChange={(e) => setNuevoItem({ ...nuevoItem, cantidad: e.target.value })}
            min="1"
            step="1"
            onKeyPress={(e) => e.key === 'Enter' && handleAgregarItem()}
          />
          <input
            type="number"
            placeholder="Costo ($)"
            value={nuevoItem.costoUnit}
            onChange={(e) => setNuevoItem({ ...nuevoItem, costoUnit: e.target.value })}
            min="0"
            step="0.01"
            onKeyPress={(e) => e.key === 'Enter' && handleAgregarItem()}
          />
          <button
            className="btn-cancel-item"
            onClick={() => setNuevoItem({ descripcion: '', cantidad: '', costoUnit: '' })}
            title="Limpiar campos"
            style={{ padding: '0.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            ✖
          </button>
        </div>

        <button 
          className="btn-agregar" 
          onClick={handleAgregarItem}
          style={{ width: '100%', padding: '0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ➕ Agregar Ítem
        </button>

        {/* Lista de ítems agregados */}
        {nuevaOrden.items.length > 0 && (
          <div className="item-list-container" style={{ marginTop: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem' }}>
            <h5 style={{ margin: '0 0 0.75rem 0' }}>Ítems agregados ({nuevaOrden.items.length}):</h5>
            <ul className="item-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {nuevaOrden.items.map((item, idx) => (
                <li 
                  key={idx} 
                  className="item-list-item"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: idx % 2 === 0 ? '#f9fafb' : 'white',
                    borderRadius: '4px',
                    marginBottom: '0.5rem',
                    alignItems: 'center',
                    fontSize: '0.9rem'
                  }}
                >
                  <span style={{ fontWeight: '500' }}>{item.descripcion}</span>
                  <span>Cant: {item.cantidad}</span>
                  <span>$ {item.costoUnit.toFixed(2)}</span>
                  <span style={{ fontWeight: 'bold', color: '#059669' }}>
                    $ {(item.cantidad * item.costoUnit).toFixed(2)}
                  </span>
                  <button 
                    className="btn-delete-item" 
                    onClick={() => handleEliminarItem(idx)}
                    style={{ padding: '0.25rem 0.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    🗑
                  </button>
                </li>
              ))}
            </ul>
            <div 
              className="total-preview"
              style={{
                marginTop: '1rem',
                padding: '1rem',
                background: '#ecfdf5',
                borderRadius: '4px',
                textAlign: 'right',
                fontSize: '1.1rem'
              }}
            >
              <strong style={{ color: '#059669' }}>Total: $ {total.toFixed(2)}</strong>
            </div>
          </div>
        )}

        {/* Acciones del modal */}
        <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button 
            className="btn-cancelar" 
            onClick={onClose}
            style={{ padding: '0.75rem 1.5rem', background: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ❌ Cancelar
          </button>
          <button 
            className="btn-crear" 
            onClick={handleCrear}
            style={{ padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            disabled={nuevaOrden.items.length === 0}
          >
            ✨ Crear Orden
          </button>
        </div>
      </div>
      {notificacion && (
          <Notification
         message={notificacion.message}
          type={notificacion.type}
          duration={notificacion.duration}
           onClose={() => setNotificacion(null)}
          />
        )}
    </div>
  );
};

export default ModalCrearOrden;