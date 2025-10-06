import React, { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ModalDetalleOrden = ({ orden, onClose, onUpdate, onDelete }) => {
  const [ordenEditada, setOrdenEditada] = useState({ ...orden });

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

  const calcularTotal = (items) =>
    items?.reduce((acc, item) => acc + item.cantidad * item.costoUnit, 0).toFixed(2);

  const handleGuardar = () => {
    onUpdate(ordenEditada);
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

    const rows = ordenEditada.items.map((item) => [
      item.descripcion,
      item.cantidad,
      `$${item.costoUnit.toFixed(2)}`,
      `$${(item.cantidad * item.costoUnit).toFixed(2)}`
    ]);

    doc.autoTable({
      startY: 50,
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
        <h3 className="modal-title">Detalle de la Orden</h3>
        <p><strong>Número:</strong> {ordenEditada.numero}</p>
        <p><strong>Proveedor ID:</strong> {ordenEditada.proveedor_id}</p>

        <label><strong>Estado:</strong></label>
        <select
          value={ordenEditada.estado}
          onChange={(e) => setOrdenEditada({ ...ordenEditada, estado: e.target.value })}
        >
          <option value="BORRADOR">BORRADOR</option>
          <option value="ENVIADA">ENVIADA</option>
          <option value="RECIBIDA">RECIBIDA</option>
          <option value="CERRADA">CERRADA</option>
        </select>

        <table className="orden-tabla">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Cantidad</th>
              <th>Costo Unitario</th>
              <th>Subtotal</th>
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
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={item.cantidad}
                    onChange={(e) => handleEditarItem(idx, 'cantidad', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={item.costoUnit}
                    onChange={(e) => handleEditarItem(idx, 'costoUnit', e.target.value)}
                  />
                </td>
                <td>${(item.cantidad * item.costoUnit).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h4>Total: ${calcularTotal(ordenEditada.items)}</h4>

        <div className="modal-actions">
          <button className="btn-guardar" onClick={handleGuardar}>Guardar Cambios</button>
          <button className="btn-eliminar" onClick={handleEliminar}>Eliminar</button>
          <button className="btn-descargar" onClick={handleDescargarPDF}>Descargar PDF</button>
          <button className="btn-cerrar" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default ModalDetalleOrden;