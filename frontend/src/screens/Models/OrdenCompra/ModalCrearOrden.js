import React, { useState, useEffect } from 'react';
import { auth } from "../../../components/authentication/Auth";
import Notification from "../../../components/Notification";

const API_URL = process.env.REACT_APP_API_URL + "/api/proveedores"

const ModalCrearOrden = ({ onClose, onCreate }) => {
  const [nuevaOrden, setNuevaOrden] = useState({
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

  const [adjuntosSeleccionados, setAdjuntosSeleccionados] = useState([]);

  // Estado para notificaciones
  const [notificacion, setNotificacion] = useState(null);

  const mostrarNotificacion = (mensaje, tipo = 'info', duracion = 3000) => {
    setNotificacion({ message: mensaje, type: tipo, duration: duracion });
  };

  // Estado para proveedores obtenidos desde la API
  const [proveedores, setProveedores] = useState([]);
  const [cargandoProveedores, setCargandoProveedores] = useState(true);

  //  Llamada a la API de proveedores
  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuario no autenticado');
        const token = await user.getIdToken();

        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`
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
      mostrarNotificacion('La cantidad debe ser mayor a 0 y el costo no puede ser negativo', 'warning');
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

  // Manejar adjuntos
  const handleSeleccionarAdjuntos = (e) => {
    const archivos = Array.from(e.target.files || []);
    
    // Validar cantidad máxima
    if (adjuntosSeleccionados.length + archivos.length > 5) {
      mostrarNotificacion('Máximo 5 adjuntos por orden', 'warning');
      return;
    }

    // Validar tipos de archivo
    const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const archivosValidos = archivos.filter(archivo => {
      if (!tiposPermitidos.includes(archivo.type)) {
        mostrarNotificacion(`${archivo.name} no tiene un tipo permitido`, 'warning');
        return false;
      }
      if (archivo.size > 10 * 1024 * 1024) {
        mostrarNotificacion(`${archivo.name} excede 10 MB`, 'warning');
        return false;
      }
      return true;
    });

    setAdjuntosSeleccionados([...adjuntosSeleccionados, ...archivosValidos]);
    e.target.value = '';
  };

  // Eliminar adjunto seleccionado
  const handleEliminarAdjunto = (index) => {
    setAdjuntosSeleccionados(adjuntosSeleccionados.filter((_, i) => i !== index));
  };

  // Crear orden (validar campos obligatorios)
  const handleCrear = () => {
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
      mostrarNotificacion(' Debes agregar al menos un ítem a la orden antes de guardar', 'warning');
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

    // Si todo está bien, crear la orden (sin enviar número, se genera automáticamente)
    // Preparar FormData si hay adjuntos
    if (adjuntosSeleccionados.length > 0) {
      const formData = new FormData();
      
      // Agregar adjuntos
      adjuntosSeleccionados.forEach(archivo => {
        formData.append('adjuntos', archivo);
      });
      
      // Pasar los datos de la orden en el callback
      onCreate(formData, nuevaOrden);
    } else {
      onCreate(null, nuevaOrden);
    }
    // Nota: La notificación se mostrará desde handleCrearOrden en ordencompra.js
  };

  // Calcular total
  const total = nuevaOrden.items.reduce(
    (acc, item) => acc + item.cantidad * item.costoUnit,
    0
  );

  // Obtener nombre del proveedor seleccionado
  const proveedorSeleccionado = proveedores.find(p => p._id === nuevaOrden.proveedor_id);

  return (
    <>
      {/* NOTIFICATION - Renderizado fuera del modal pero en el mismo nivel */}
      {notificacion && (
        <Notification
          message={notificacion.message}
          type={notificacion.type}
          duration={notificacion.duration}
          onClose={() => setNotificacion(null)}
        />
      )}

      {/* MODAL */}
      <div className="modal-overlay" style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        zIndex: 1000 
      }}>
        <div className="modal-content" style={{ 
          maxWidth: '800px', 
          maxHeight: '90vh', 
          overflow: 'auto', 
          background: 'white', 
          borderRadius: '8px', 
          padding: '2rem',
          position: 'relative',
          zIndex: 1001
        }}>
          <h3 className="modal-title"> Crear Nueva Orden de Compra</h3>

          <div className="modal-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/*  Selector de proveedor mejorado */}
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
                <option value="BORRADOR"> Borrador</option>
                <option value="ENVIADA"> Enviada</option>
                <option value="RECIBIDA"> Recibida</option>
                <option value="CERRADA"> Cerrada</option>
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
                 Información del Proveedor
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
          <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}> Ítems de la Orden</h4>

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
              
            </button>
          </div>

          <button 
            className="btn-guardar-donaciones" 
            onClick={handleAgregarItem}
            
          >
            + Agregar Ítem
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

          {/* Sección Adjuntos */}
          <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>📎 Adjuntos (Opcional - Máx 5)</h4>

          <div className="adjuntos-container" style={{ 
            border: '2px dashed #667eea', 
            borderRadius: '8px', 
            padding: '1.5rem', 
            textAlign: 'center',
            background: '#f0f4ff',
            marginBottom: '1rem'
          }}>
            <input
              type="file"
              id="adjuntos-input"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              onChange={handleSeleccionarAdjuntos}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => document.getElementById('adjuntos-input').click()}
              style={{
                background: '#667eea',
                color: 'white',
                border: 'none',
                padding: '0.8rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              📄 Seleccionar Archivos
            </button>
            <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              PDF, imágenes o documentos hasta 10 MB cada uno
            </p>
          </div>

          {/* Lista de adjuntos seleccionados */}
          {adjuntosSeleccionados.length > 0 && (
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
              background: '#fafafa'
            }}>
              <h5 style={{ margin: '0 0 0.75rem 0' }}>Archivos adjuntos ({adjuntosSeleccionados.length}/5):</h5>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {adjuntosSeleccionados.map((archivo, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      background: 'white',
                      marginBottom: '0.5rem',
                      borderRadius: '4px',
                      border: '1px solid #e9ecef'
                    }}
                  >
                    <span style={{ fontSize: '0.9rem', color: '#333' }}>
                      📄 {archivo.name} ({(archivo.size / 1024).toFixed(0)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleEliminarAdjunto(idx)}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sección Adjuntos */}
          

          {/* Acciones del modal */}
          <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button 
              className="btn btn-dark" 
              onClick={onClose}
              
            >
              Cancelar
            </button>
            <button 
              className="btn btn-guardar-donaciones" 
              onClick={handleCrear}
              
            >
              Crear Orden
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModalCrearOrden;