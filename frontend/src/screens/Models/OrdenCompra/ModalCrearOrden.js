import React, { useState } from 'react';

const ModalCrearOrden = ({ onClose, onCreate }) => {
  const [nuevaOrden, setNuevaOrden] = useState({
    numero: '',
    proveedor_id: '',
    estado: 'BORRADOR',
    items: [],
    recepciones: []
  });

  const [nuevoItem, setNuevoItem] = useState({
    descripcion: '',
    cantidad: '',
    costoUnit: ''
  });

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

        <div className="form-group">
          <label>Número de Orden</label>
          <input
            type="text"
            value={nuevaOrden.numero}
            onChange={(e) => setNuevaOrden({ ...nuevaOrden, numero: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>ID Proveedor</label>
          <input
            type="text"
            value={nuevaOrden.proveedor_id}
            onChange={(e) => setNuevaOrden({ ...nuevaOrden, proveedor_id: e.target.value })}
          />
        </div>

        <h4>Ítems de la Orden</h4>
        <div className="item-row">
          <input
            type="text"
            placeholder="Descripción"
            value={nuevoItem.descripcion}
            onChange={(e) => setNuevoItem({ ...nuevoItem, descripcion: e.target.value })}
          />
          <input
            type="number"
            placeholder="Cantidad"
            value={nuevoItem.cantidad}
            onChange={(e) => setNuevoItem({ ...nuevoItem, cantidad: e.target.value })}
          />
          <input
            type="number"
            placeholder="Costo Unitario"
            value={nuevoItem.costoUnit}
            onChange={(e) => setNuevoItem({ ...nuevoItem, costoUnit: e.target.value })}
          />
          <button
            className="btn-cancel-item"
            onClick={() => setNuevoItem({ descripcion: '', cantidad: '', costoUnit: '' })}
          >
            ✖
          </button>
        </div>

        <button className="btn-agregar" onClick={handleAgregarItem}>+ Agregar Ítem</button>

        {nuevaOrden.items.length > 0 && (
          <ul className="item-list">
            {nuevaOrden.items.map((item, idx) => (
              <li key={idx}>
                {item.descripcion} – Cant: {item.cantidad} – $ {item.costoUnit.toFixed(2)}
              </li>
            ))}
          </ul>
        )}

        <div className="modal-actions">
          <button className="btn-cancelar" onClick={onClose}>Cancelar</button>
          <button className="btn-crear" onClick={handleCrear}>Crear Orden</button>
        </div>
      </div>
    </div>
  );
};

export default ModalCrearOrden;