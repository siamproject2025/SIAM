import React, { useState } from 'react';

const ModalCrearOrden = ({ onClose, onCreate, ordenesExistentes = [] }) => {
  const [nuevaOrden, setNuevaOrden] = useState({
    numero: '',
    proveedor_id: '',
    estado: 'BORRADOR',
    fecha: new Date().toISOString().split('T')[0], // Fecha actual por defecto
    items: [],
    recepciones: []
  });

  const [nuevoItem, setNuevoItem] = useState({
    descripcion: '',
    cantidad: '',
    costoUnit: ''
  });

  // Obtener proveedores únicos de las órdenes existentes
  const proveedoresUnicos = [...new Set(ordenesExistentes.map(orden => orden.proveedor_id).filter(Boolean))];

  const handleAgregarItem = () => {
    if (!nuevoItem.descripcion || !nuevoItem.cantidad || !nuevoItem.costoUnit) return;
    const item = {
      descripcion: nuevoItem.descripcion,
      cantidad: parseFloat(nuevoItem.cantidad),
      costoUnit: parseFloat(nuevoItem.costoUnit)
    };
    setNuevaOrden({
      ...nuevaOrden,
      items: [...nuevaOrden.items, item]
    });
    setNuevoItem({ descripcion: '', cantidad: '', costoUnit: '' });
  };

  const handleCrear = () => {
    onCreate(nuevaOrden); // El padre se encarga de guardar y cerrar
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">✨ Crear Nueva Orden de Compra</h3>

        <div className="modal-form-grid">
          <div className="form-group">
            <label>Número de Orden *</label>
            <input
              type="text"
              value={nuevaOrden.numero}
              onChange={(e) => setNuevaOrden({ ...nuevaOrden, numero: e.target.value })}
              placeholder="Ej: ORD-001"
            />
          </div>

          <div className="form-group">
            <label>ID Proveedor *</label>
            <input
              type="text"
              value={nuevaOrden.proveedor_id}
              onChange={(e) => setNuevaOrden({ ...nuevaOrden, proveedor_id: e.target.value })}
              placeholder="Ej: PROV-001"
            />
            {proveedoresUnicos.length > 0 && (
              <div className="proveedores-sugerencias">
                <label className="proveedores-label">💡 Proveedores existentes:</label>
                <div className="proveedores-lista">
                  {proveedoresUnicos.map((proveedor, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="proveedor-sugerencia"
                      onClick={() => setNuevaOrden({ ...nuevaOrden, proveedor_id: proveedor })}
                    >
                      {proveedor}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Fecha de Creación *</label>
            <input
              type="date"
              value={nuevaOrden.fecha}
              onChange={(e) => setNuevaOrden({ ...nuevaOrden, fecha: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Estado Actual *</label>
            <select
              value={nuevaOrden.estado}
              onChange={(e) => setNuevaOrden({ ...nuevaOrden, estado: e.target.value })}
            >
              <option value="BORRADOR">📝 Borrador</option>
              <option value="ENVIADA">📤 Enviada</option>
              <option value="RECIBIDA">📦 Recibida</option>
              <option value="CERRADA">✅ Cerrada</option>
            </select>
          </div>
        </div>

        <h4>📦 Ítems de la Orden</h4>
        <div className="item-row">
          <input
            type="text"
            placeholder="Descripción del ítem"
            value={nuevoItem.descripcion}
            onChange={(e) => setNuevoItem({ ...nuevoItem, descripcion: e.target.value })}
          />
          <input
            type="number"
            placeholder="Cantidad"
            value={nuevoItem.cantidad}
            onChange={(e) => setNuevoItem({ ...nuevoItem, cantidad: e.target.value })}
            min="1"
            step="1"
          />
          <input
            type="number"
            placeholder="Costo Unitario ($)"
            value={nuevoItem.costoUnit}
            onChange={(e) => setNuevoItem({ ...nuevoItem, costoUnit: e.target.value })}
            min="0"
            step="0.01"
          />
          <button
            className="btn-cancel-item"
            onClick={() => setNuevoItem({ descripcion: '', cantidad: '', costoUnit: '' })}
            title="Limpiar campos"
          >
            ✖
          </button>
        </div>

        <button className="btn-agregar" onClick={handleAgregarItem}>
          ➕ Agregar Ítem
        </button>

        {nuevaOrden.items.length > 0 && (
          <div className="item-list-container">
            <h5>Ítems agregados ({nuevaOrden.items.length}):</h5>
            <ul className="item-list">
              {nuevaOrden.items.map((item, idx) => (
                <li key={idx} className="item-list-item">
                  <span className="item-descripcion">{item.descripcion}</span>
                  <span className="item-cantidad">Cant: {item.cantidad}</span>
                  <span className="item-costo">$ {item.costoUnit.toFixed(2)}</span>
                  <span className="item-subtotal">Subtotal: $ {(item.cantidad * item.costoUnit).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="total-preview">
              <strong>Total: $ {nuevaOrden.items.reduce((acc, item) => acc + item.cantidad * item.costoUnit, 0).toFixed(2)}</strong>
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-cancelar" onClick={onClose}>❌ Cancelar</button>
          <button className="btn-crear" onClick={handleCrear}>✨ Crear Orden</button>
        </div>
      </div>
    </div>
  );
};

export default ModalCrearOrden;