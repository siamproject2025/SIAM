import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Notification from '../../../components/Notification';
import ConfirmDialog from '../../../components/ConfirmDialog/ConfirmDialog';

const ModalDetalleOrden = ({
  orden,
  onClose,
  onUpdate,
  onDelete,
  proveedores = []
}) => {
  // 🔹 Estado para notificaciones
  const [notificacion, setNotificacion] = useState(null);



  //const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // 🔹 Mostrar notificación
 const mostrarNotificacion = (mensaje, tipo = 'info', duration = 3000) => {
  setNotificacion({ message: mensaje, type: tipo, duration });
};  

  // 🔹 Estado de edición
  const [ordenEditada, setOrdenEditada] = useState(() => {
    const ordenNormalizada = { ...orden };
    if (ordenNormalizada.proveedor_id && typeof ordenNormalizada.proveedor_id === 'object') {
      ordenNormalizada.proveedor_id = ordenNormalizada.proveedor_id._id;
    }
    return ordenNormalizada;
  });

  // 🔹 Función para calcular total
  const calcularTotal = (items = []) =>
    items.reduce((acc, item) => acc + (item.cantidad || 0) * (item.costoUnit || 0), 0).toFixed(2);

  const handleEditarItem = (idx, campo, valor) => {
    const nuevosItems = ordenEditada.items.map((item, i) =>
      i === idx
        ? {
            ...item,
            [campo]:
              campo === 'cantidad' || campo === 'costoUnit'
                ? parseFloat(valor) || 0
                : valor,
          }
        : item
    );
    setOrdenEditada({ ...ordenEditada, items: nuevosItems });
  };

 const handleEliminarItem = (idx) => {
  const nuevosItems = ordenEditada.items.filter((_, i) => i !== idx);
  setOrdenEditada({ ...ordenEditada, items: nuevosItems });
  mostrarNotificacion('Ítem eliminado correctamente', 'info');
};

const handleGuardar = () => {
  if (!ordenEditada.numero || ordenEditada.numero.trim() === '') {
    mostrarNotificacion('El número de orden es obligatorio', 'warning');
    return;
  }

  if (!ordenEditada.proveedor_id) {
    mostrarNotificacion('Debes seleccionar un proveedor antes de guardar la orden', 'warning');
    return;
  }

  if (!ordenEditada.items || ordenEditada.items.length === 0) {
    mostrarNotificacion('La orden debe tener al menos un ítem', 'warning');
    return;
  }

  const itemsInvalidos = ordenEditada.items.some(
    item => !item.descripcion || item.cantidad <= 0 || item.costoUnit < 0
  );

  if (itemsInvalidos) {
    mostrarNotificacion('Todos los ítems deben tener descripción, cantidad mayor a 0 y costo válido', 'warning');
    return;
  }

  onUpdate(ordenEditada);
  mostrarNotificacion('Orden actualizada exitosamente', 'success');
};


const handleEliminar = () => {
  onDelete(ordenEditada._id); // ✅ delega al padre
};



  const handleDescargarPDF = () => {
    try {
      const doc = new jsPDF();

      const proveedorObj = typeof ordenEditada.proveedor_id === 'string' 
        ? proveedores.find(p => p._id === ordenEditada.proveedor_id)
        : orden.proveedor_id;

      doc.setFontSize(16);
      doc.text(`Orden de Compra - ${ordenEditada.numero}`, 14, 20);

      doc.setFontSize(12);
      doc.text(
        `Proveedor: ${proveedorObj?.nombre || 'N/A'} (${proveedorObj?.empresa || 'N/A'})`,
        14,
        30
      );
      doc.text(`Estado: ${ordenEditada.estado}`, 14, 40);

      const fechaHoraActual = new Date();
      const fechaFormateada = fechaHoraActual.toLocaleDateString("es-ES");
      const horaFormateada = fechaHoraActual.toLocaleTimeString("es-ES", {
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Fecha: ${fechaFormateada} ${horaFormateada}`, 14, 50);

      const rows = ordenEditada.items.map((item) => [
        item.descripcion,
        item.cantidad,
        `$${item.costoUnit.toFixed(2)}`,
        `$${(item.cantidad * item.costoUnit).toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: 60,
        head: [['Descripción', 'Cantidad', 'Costo Unitario', 'Subtotal']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] }
      });

      const total = calcularTotal(ordenEditada.items);
      const finalY = doc.lastAutoTable?.finalY || 60;
      doc.setFontSize(14);
      doc.text(`Total: $${total}`, 14, finalY + 10);
      doc.save(`orden_${ordenEditada.numero}.pdf`);

      mostrarNotificacion('PDF descargado exitosamente', 'success');
    } catch (error) {
      mostrarNotificacion('Error al generar el PDF', 'error');
      console.error('Error PDF:', error);
    }
  };

  const obtenerNombreProveedor = () => {
    if (typeof ordenEditada.proveedor_id === 'string') {
      const prov = proveedores.find(p => p._id === ordenEditada.proveedor_id);
      return prov ? `${prov.nombre} (${prov.empresa})` : 'Proveedor no encontrado';
    }
    return orden.proveedor_id?.nombre 
      ? `${orden.proveedor_id.nombre} (${orden.proveedor_id.empresa})` 
      : 'Sin proveedor';
  };

return (
  <div className="modal-overlay bg-dark bg-opacity-50 d-flex justify-content-center align-items-center position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 1050 }}>
    <div className="modal-content bg-white p-4 rounded shadow w-100" style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
      <h3 className="modal-title mb-4 text-primary fw-bold">📋 Detalle de la Orden</h3>

      {/* Datos generales */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <label className="form-label fw-semibold">Número de Orden</label>
          <input
            type="text"
            className="form-control"
            value={ordenEditada.numero}
            onChange={(e) => setOrdenEditada({ ...ordenEditada, numero: e.target.value })}
            placeholder="Ej: ORD-001"
          />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Estado Actual</label>
          <select
            className="form-select"
            value={ordenEditada.estado}
            onChange={(e) => setOrdenEditada({ ...ordenEditada, estado: e.target.value })}
          >
            <option value="BORRADOR">📝 BORRADOR</option>
            <option value="ENVIADA">📤 ENVIADA</option>
            <option value="RECIBIDA">📦 RECIBIDA</option>
            <option value="CERRADA">✅ CERRADA</option>
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Fecha de Creación</label>
          <input
            type="date"
            className="form-control"
            value={ordenEditada.fecha?.slice(0, 10) || ''}
            onChange={(e) => setOrdenEditada({ ...ordenEditada, fecha: e.target.value })}
          />
        </div>
      </div>

      {/* Tabla de ítems */}
      <h4 className="mb-3 text-secondary">📦 Ítems de la Orden</h4>
      <div className="table-responsive mb-4">
        <table className="table table-bordered align-middle">
          <thead className="table-light">
            <tr>
              <th>Descripción</th>
              <th style={{ width: '120px' }}>Cantidad</th>
              <th style={{ width: '150px' }}>Costo Unitario</th>
              <th style={{ width: '150px' }}>Subtotal</th>
              <th style={{ width: '80px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ordenEditada.items?.map((item, idx) => (
              <tr key={idx}>
                <td>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={item.descripcion}
                    onChange={(e) => handleEditarItem(idx, 'descripcion', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={item.cantidad}
                    onChange={(e) => handleEditarItem(idx, 'cantidad', e.target.value)}
                    min="1"
                    step="1"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={item.costoUnit}
                    onChange={(e) => handleEditarItem(idx, 'costoUnit', e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </td>
                <td className="text-end fw-bold">
                  L.{ (item.cantidad * item.costoUnit).toFixed(2) }
                </td>
                <td className="text-center">
                  <button
                    className="btn btn-sm btn-outline-danger"
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

      {/* Total */}
      <div className="text-end mb-4">
        <h4 className="fw-bold text-success">💰 Total: ${calcularTotal(ordenEditada.items)}</h4>
      </div>

      {/* Botones de acción */}
      <div className="modal-actions-orden d-flex flex-wrap gap-2 justify-content-end">
        <button className="btn btn-success" onClick={handleGuardar}>
          Guardar Cambios
        </button>
        <button className="btn btn-danger" onClick={handleEliminar}>
          Eliminar
        </button>
        <button className="btn btn-primary" onClick={handleDescargarPDF}>
          Descargar PDF
        </button>
        <button className="btn btn-secondary" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>







    {/* Notificación */}
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

export default ModalDetalleOrden;