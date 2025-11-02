import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ModalDetalleOrden = ({ orden, onClose, onUpdate, onDelete }) => {
  const [ordenEditada, setOrdenEditada] = useState({ ...orden });
  const [nuevoItem, setNuevoItem] = useState({
    descripcion: '',
    cantidad: '',
    costoUnit: ''
  });

   const [proveedores, setProveedores] = useState([]);
    const [cargandoProveedores, setCargandoProveedores] = useState(true);
  

    // 🕒 Obtener fecha y hora actual en Honduras
  const fechaActual = new Date().toLocaleString("es-ES", {
    timeZone: "America/Tegucigalpa",
  });

    // 🔹 Llamada a la API de proveedores
    useEffect(() => {
      const fetchProveedores = async () => {
        try {
          const response = await fetch('http://localhost:5000/api/proveedores');
          if (!response.ok) throw new Error('Error al obtener proveedores');
          const data = await response.json();
  
          // Filtrar solo proveedores activos
          const proveedoresActivos = data.filter(p => p.estado === 'ACTIVO');
          setProveedores(proveedoresActivos);
          setCargandoProveedores(false);
        } catch (error) {
          console.error('Error cargando proveedores:', error);
          setCargandoProveedores(false);
          alert('Error al cargar los proveedores. Verifica la conexión con el servidor.');
        }
      };
      fetchProveedores();
    }, []);

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
    // Obtener fecha y hora actuales en formato DD/MM/YYYY HH:MM
    const fechaHoraActual = new Date();
    const fechaFormateada = fechaHoraActual.toLocaleDateString("es-ES"); // DD/MM/YYYY
    const horaFormateada = fechaHoraActual.toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' }); // HH:MM

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
      body: rows
    });

    // 🟢 Agregado: calcular total antes de imprimirlo
    const total = calcularTotal(ordenEditada.items);
    const finalY = doc.lastAutoTable?.finalY || 60;

    doc.text(`Total: $${total}`, 14, finalY + 10);
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
  <select
    value={ordenEditada.proveedor_id?._id || ordenEditada.proveedor_id || ''}
    onChange={(e) =>
      setOrdenEditada({
        ...ordenEditada,
        proveedor_id: e.target.value, // Guarda solo el _id
      })
    }
  >
    {ordenEditada.proveedor_id && (
      <option value={ordenEditada.proveedor_id._id}>
        ID: {ordenEditada.proveedor_id.id_proveedor} - {ordenEditada.proveedor_id.nombre}{' '}
        {ordenEditada.proveedor_id.empresa ? `(${ordenEditada.proveedor_id.empresa})` : ''}
      </option>
    )}

    {proveedores.map((prov) => (
      <option key={prov._id} value={prov._id}>
        ID: {prov.id_proveedor} - {prov.nombre} {prov.empresa ? `(${prov.empresa})` : ''}
      </option>
    ))}
  </select>

  {console.log("Prueba de proveedor", ordenEditada.proveedor_id)}
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
