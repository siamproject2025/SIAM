import React, { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ModalDetalleOrden = ({ orden, onClose, onUpdate, onDelete }) => {
  const [ordenEditada, setOrdenEditada] = useState({ ...orden });
  const [nuevoItem, setNuevoItem] = useState({
    descripcion: '',
    cantidad: '',
    costoUnit: ''
  });

  const handleEditarItem = (idx, campo, valor) => {
    const nuevosItems = ordenEditada.items.map((item, i) =>
      i === idx
        ? {
            ...item,
            [campo]: campo === 'cantidad' || campo === 'costoUnit'
              ? parseFloat(valor) || 0
              : valor,
          }
        : item
    );
    setOrdenEditada({ ...ordenEditada, items: nuevosItems });
  };

  const handleAgregarItem = () => {
    if (!nuevoItem.descripcion || !nuevoItem.cantidad || !nuevoItem.costoUnit) return;
    const item = {
      descripcion: nuevoItem.descripcion,
      cantidad: parseFloat(nuevoItem.cantidad),
      costoUnit: parseFloat(nuevoItem.costoUnit)
    };
    setOrdenEditada({
      ...ordenEditada,
      items: [...(ordenEditada.items || []), item]
    });
    setNuevoItem({ descripcion: '', cantidad: '', costoUnit: '' });
  };

  const handleEliminarItem = (idx) => {
    const nuevosItems = ordenEditada.items.filter((_, i) => i !== idx);
    setOrdenEditada({ ...ordenEditada, items: nuevosItems });
  };

  const calcularTotal = (items) =>
    items?.reduce((acc, item) => acc + item.cantidad * item.costoUnit, 0).toFixed(2);

  const handleGuardar = () => {
    // Asegurar que la fecha de creación se mantenga si no se ha cambiado
    const ordenParaGuardar = {
      ...ordenEditada,
      fecha: ordenEditada.fecha || new Date().toISOString().split('T')[0]
    };
    onUpdate(ordenParaGuardar);
  };

  const handleEliminar = () => {
    if (window.confirm('¿Seguro que deseas eliminar esta orden?')) {
      onDelete(ordenEditada._id);
    }
  };

  const handleDescargarPDF = () => {
    const doc = new jsPDF();
    doc.text(`Orden de Compra - ${ordenEditada.numero}`, 14, 20);
    doc.text(`Proveedor ID: ${ordenEditada.proveedor_id}`, 14, 30);
    doc.text(`Estado: ${ordenEditada.estado}`, 14, 40);
    doc.text(`Fecha: ${ordenEditada.fecha || 'No especificada'}`, 14, 50);

    const rows = ordenEditada.items.map((item) => [
      item.descripcion,
      item.cantidad,
      `$${item.costoUnit.toFixed(2)}`,
      `$${(item.cantidad * item.costoUnit).toFixed(2)}`
    ]);

    doc.autoTable({
      startY: 60,
      head: [['Descripción', 'Cantidad', 'Costo Unitario', 'Subtotal']],
      body: rows
    });

    const total = calcularTotal(ordenEditada.items);
    doc.text(`Total: $${total}`, 14, doc.lastAutoTable.finalY + 10);
    doc.save(`orden_${ordenEditada.numero}.pdf`);
  };


  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">📋 Detalle de la Orden</h3>

        <div className="modal-form-grid">
          <div className="form-group">
            <label>Número de Orden</label>
            <input
              type="text"
              value={ordenEditada.numero}
              onChange={(e) => setOrdenEditada({ ...ordenEditada, numero: e.target.value })}
              placeholder="Ej: ORD-001"
            />
          </div>

          <div className="form-group">
            <label>ID Proveedor</label>
            <input
              type="text"
              value={ordenEditada.proveedor_id}
              onChange={(e) => setOrdenEditada({ ...ordenEditada, proveedor_id: e.target.value })}
              placeholder="Ej: PROV-001"
            />
          </div>

          <div className="form-group">
            <label>Estado Actual</label>
            <select
              value={ordenEditada.estado}
              onChange={(e) => setOrdenEditada({ ...ordenEditada, estado: e.target.value })}
            >
              <option value="BORRADOR">📝 BORRADOR</option>
              <option value="ENVIADA">📤 ENVIADA</option>
              <option value="RECIBIDA">📦 RECIBIDA</option>
              <option value="CERRADA">✅ CERRADA</option>
            </select>
          </div>

          <div className="form-group">
            <label>Fecha de Creación</label>
            <input
              type="date"
              value={ordenEditada.fecha?.slice(0, 10) || ''}
              onChange={(e) => setOrdenEditada({ ...ordenEditada, fecha: e.target.value })}
            />
          </div>
        </div>

        <h4>📦 Ítems de la Orden</h4>
        
        {/* Sección para agregar nuevos ítems 
        <div className="agregar-item-section">
          <h5>➕ Agregar Nuevo Ítem</h5>
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
        </div>*/}

        {/* Tabla de ítems existentes */}
        <div className="orden-tabla-container">
          <table className="orden-tabla">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Costo Unitario</th>
                <th>Subtotal</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenEditada.items?.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      type="text"
                      value={item.descripcion}
                      onChange={(e) => handleEditarItem(idx, 'descripcion', e.target.value)}
                      placeholder="Descripción del ítem"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.cantidad}
                      onChange={(e) => handleEditarItem(idx, 'cantidad', e.target.value)}
                      min="1"
                      step="1"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.costoUnit}
                      onChange={(e) => handleEditarItem(idx, 'costoUnit', e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td className="subtotal-cell">${(item.cantidad * item.costoUnit).toFixed(2)}</td>
                  <td>
                    <button 
                      className="btn-eliminar-item" 
                      onClick={() => handleEliminarItem(idx)}
                      title="Eliminar ítem"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="total-section">
          <h4>💰 Total: ${calcularTotal(ordenEditada.items)}</h4>
        </div>

        <div className="modal-actions">
          <button className="btn-guardar" onClick={handleGuardar}>💾 Guardar Cambios</button>
          <button className="btn-eliminar" onClick={handleEliminar}>🗑️ Eliminar</button>
          <button className="btn-descargar" onClick={handleDescargarPDF}>📄 Descargar PDF</button>
          <button className="btn-cerrar" onClick={onClose}>❌ Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default ModalDetalleOrden;