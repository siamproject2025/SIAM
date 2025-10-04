// 📁 OrdenesApp.js
import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import "../../styles/Models/ordencompra.css"

const API_URL = "http://localhost:5000/api/compras";

/*Seguridad
const OrdenCompra = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState("");

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

  // Obtener órdenes al cargar
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setOrdenes(data))
      .catch(err => console.error('Error al obtener órdenes:', err));
  }, []);

  // Agregar ítem
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

  // Crear orden
  const handleCrearOrden = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaOrden)
      });

      if (!res.ok) throw new Error('Error al crear la orden');
      const ordenCreada = await res.json();
      setOrdenes([...ordenes, ordenCreada]);
      setNuevaOrden({
        numero: '',
        proveedor_id: '',
        estado: 'BORRADOR',
        items: [],
        recepciones: []
      });
    } catch (err) {
      console.error(err.message);
    }
  };

  // Editar orden (incluye ítems y estado)
  const handleEditarOrden = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ordenSeleccionada)
      });
      if (!res.ok) throw new Error('Error al editar la orden');
      const ordenActualizada = await res.json();
      setOrdenes(ordenes.map(o => o._id === id ? ordenActualizada : o));
      alert("Orden actualizada con éxito");
    } catch (err) {
      console.error(err.message);
    }
  };

  // Eliminar orden
  const handleEliminarOrden = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta orden?")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar la orden');
      setOrdenes(ordenes.filter(o => o._id !== id));
      setOrdenSeleccionada(null);
    } catch (err) {
      console.error(err.message);
    }
  };

  // Descargar PDF
  const handleDescargarPDF = (orden) => {
    const doc = new jsPDF();
    doc.text(`Orden de Compra - ${orden.numero}`, 14, 20);
    doc.text(`Proveedor ID: ${orden.proveedor_id}`, 14, 30);
    doc.text(`Estado: ${orden.estado}`, 14, 40);

    const rows = orden.items.map(item => [
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

    const total = orden.items.reduce((acc, item) => acc + item.cantidad * item.costoUnit, 0);
    doc.text(`Total: $${total.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 10);

    doc.save(`orden_${orden.numero}.pdf`);
  };

  const calcularTotal = (items) => {
    return items?.reduce((acc, item) => acc + item.cantidad * item.costoUnit, 0).toFixed(2);
  };

  // Manejar edición de ítems dentro de la orden seleccionada
  const handleEditarItem = (idx, campo, valor) => {
    const nuevosItems = ordenSeleccionada.items.map((item, i) =>
      i === idx ? { ...item, [campo]: campo === "cantidad" || campo === "costoUnit" ? parseFloat(valor) || 0 : valor } : item
    );
    setOrdenSeleccionada({ ...ordenSeleccionada, items: nuevosItems });
  };

  // Filtrar órdenes
  const ordenesFiltradas = ordenes.filter(o =>
    o.numero.toLowerCase().includes(busqueda.toLowerCase())
  );
//Segunda parte
  return (
    <div style={{ padding: '20px' }}>
      <h2>Órdenes de Compra</h2>

    
      <input
        type="text"
        placeholder="Buscar por número..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{ marginBottom: '15px', padding: '5px' }}
      />

 
      <h3>Crear nueva orden</h3>
      <input
        type="text"
        name="numero"
        placeholder="Número"
        value={nuevaOrden.numero}
        onChange={(e) => setNuevaOrden({ ...nuevaOrden, numero: e.target.value })}
      />
      <input
        type="text"
        name="proveedor_id"
        placeholder="Proveedor ID"
        value={nuevaOrden.proveedor_id}
        onChange={(e) => setNuevaOrden({ ...nuevaOrden, proveedor_id: e.target.value })}
      />

  
      <div style={{ marginTop: '10px' }}>
        <h4>Agregar ítem</h4>
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
        <button onClick={handleAgregarItem}>Agregar Ítem</button>
      </div>

    
      {nuevaOrden.items.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <h5>Ítems agregados:</h5>
          <ul>
            {nuevaOrden.items.map((item, idx) => (
              <li key={idx}>
                {item.descripcion} – Cant: {item.cantidad} – $ {item.costoUnit.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={handleCrearOrden} style={{ marginTop: '10px' }}>
        Crear Orden
      </button>

      <hr />

      
      <h3>Listado de Órdenes</h3>
      {ordenesFiltradas.length === 0 ? (
        <p>No hay órdenes registradas.</p>
      ) : (
        <div>
          {ordenesFiltradas.map((orden) => (
            <div key={orden._id} style={{ marginBottom: '10px' }}>
              <button onClick={() => setOrdenSeleccionada(orden)}>
                {orden.numero}
              </button>
            </div>
          ))}
        </div>
      )}

      <hr />

     
      {ordenSeleccionada && (
        <div style={{ marginTop: '20px' }}>
          <h3>Detalle de la Orden</h3>
          <p><strong>Número:</strong> {ordenSeleccionada.numero}</p>
          <p><strong>Proveedor ID:</strong> {ordenSeleccionada.proveedor_id}</p>

       
          <label><strong>Estado:</strong></label>
          <select
            value={ordenSeleccionada.estado}
            onChange={(e) => setOrdenSeleccionada({ ...ordenSeleccionada, estado: e.target.value })}
          >
            <option value="BORRADOR">BORRADOR</option>
            <option value="ENVIADA">ENVIADA</option>
            <option value="RECIBIDA">RECIBIDA</option>
            <option value="CERRADA">CERRADA</option>
          </select>


<h4>Ítems (editar):</h4>
<div className="table-wrapper">
  <table border="1" cellPadding="8" cellSpacing="0" style={{ borderCollapse: 'collapse', width: '100%' }}>
    <thead>
      <tr>
        <th>Descripción</th>
        <th>Cantidad</th>
        <th>Costo Unitario</th>
        <th>Subtotal</th>
      </tr>
    </thead>
    <tbody>
      {ordenSeleccionada.items.map((item, idx) => (
        <tr key={idx}>
          <td>
            <input
              type="text"
              value={item.descripcion}
              onChange={(e) => handleEditarItem(idx, "descripcion", e.target.value)}
            />
          </td>
          <td>
            <input
              type="number"
              value={item.cantidad}
              onChange={(e) => handleEditarItem(idx, "cantidad", e.target.value)}
            />
          </td>
          <td>
            <input
              type="number"
              value={item.costoUnit}
              onChange={(e) => handleEditarItem(idx, "costoUnit", e.target.value)}
            />
          </td>
          <td>${(item.cantidad * item.costoUnit).toFixed(2)}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>


<div className="items-cards">
  {ordenSeleccionada.items.map((item, idx) => (
    <div key={idx} className="item-card">
      <p><strong>Descripción:</strong></p>
      <input
        type="text"
        value={item.descripcion}
        onChange={(e) => handleEditarItem(idx, "descripcion", e.target.value)}
      />
      <p><strong>Cantidad:</strong></p>
      <input
        type="number"
        value={item.cantidad}
        onChange={(e) => handleEditarItem(idx, "cantidad", e.target.value)}
      />
      <p><strong>Costo Unitario:</strong></p>
      <input
        type="number"
        value={item.costoUnit}
        onChange={(e) => handleEditarItem(idx, "costoUnit", e.target.value)}
      />
      <p><strong>Subtotal:</strong> ${(item.cantidad * item.costoUnit).toFixed(2)}</p>
    </div>
  ))}
</div>

          <h4 style={{ marginTop: '10px' }}>
            Total: ${calcularTotal(ordenSeleccionada.items)}
          </h4>

          <div style={{ marginTop: '15px' }}>
            <button onClick={() => handleEditarOrden(ordenSeleccionada._id)}>Guardar Cambios</button>
            <button onClick={() => handleEliminarOrden(ordenSeleccionada._id)} style={{ marginLeft: '10px' }}>Eliminar</button>
            <button onClick={() => handleDescargarPDF(ordenSeleccionada)} style={{ marginLeft: '10px' }}>Descargar PDF</button>
            <button onClick={() => setOrdenSeleccionada(null)} style={{ marginLeft: '10px' }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};
*/


const OrdenCompra = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState("");

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

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setOrdenes(data))
      .catch(err => console.error('Error al obtener órdenes:', err));
  }, []);

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

  const handleCrearOrden = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaOrden)
      });
      if (!res.ok) throw new Error('Error al crear la orden');
      const ordenCreada = await res.json();
      setOrdenes([...ordenes, ordenCreada]);
      setNuevaOrden({
        numero: '',
        proveedor_id: '',
        estado: 'BORRADOR',
        items: [],
        recepciones: []
      });
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleEditarOrden = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ordenSeleccionada)
      });
      if (!res.ok) throw new Error('Error al editar la orden');
      const ordenActualizada = await res.json();
      setOrdenes(ordenes.map(o => o._id === id ? ordenActualizada : o));
      alert("Orden actualizada con éxito");
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleEliminarOrden = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta orden?")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar la orden');
      setOrdenes(ordenes.filter(o => o._id !== id));
      setOrdenSeleccionada(null);
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleDescargarPDF = (orden) => {
    const doc = new jsPDF();
    doc.text(`Orden de Compra - ${orden.numero}`, 14, 20);
    doc.text(`Proveedor ID: ${orden.proveedor_id}`, 14, 30);
    doc.text(`Estado: ${orden.estado}`, 14, 40);

    const rows = orden.items.map(item => [
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

    const total = orden.items.reduce((acc, item) => acc + item.cantidad * item.costoUnit, 0);
    doc.text(`Total: $${total.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 10);
    doc.save(`orden_${orden.numero}.pdf`);
  };

  const calcularTotal = (items) => {
    return items?.reduce((acc, item) => acc + item.cantidad * item.costoUnit, 0).toFixed(2);
  };

  const handleEditarItem = (idx, campo, valor) => {
    const nuevosItems = ordenSeleccionada.items.map((item, i) =>
      i === idx ? { ...item, [campo]: campo === "cantidad" || campo === "costoUnit" ? parseFloat(valor) || 0 : valor } : item
    );
    setOrdenSeleccionada({ ...ordenSeleccionada, items: nuevosItems });
  };

  const ordenesFiltradas = ordenes.filter(o =>
    o.numero.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="orden-container">
      <h2 className="orden-title">Órdenes de Compra</h2>

      <input
        type="text"
        className="orden-busqueda"
        placeholder="Buscar por número..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <div className="orden-formulario">
        <h3>Crear nueva orden</h3>
        <input
          type="text"
          name="numero"
          placeholder="Número"
          value={nuevaOrden.numero}
          onChange={(e) => setNuevaOrden({ ...nuevaOrden, numero: e.target.value })}
        />
        <input
          type="text"
          name="proveedor_id"
          placeholder="Proveedor ID"
          value={nuevaOrden.proveedor_id}
          onChange={(e) => setNuevaOrden({ ...nuevaOrden, proveedor_id: e.target.value })}
        />

        <h4>Agregar ítem</h4>
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
        <button className="btn-agregar" onClick={handleAgregarItem}>Agregar Ítem</button>

        {nuevaOrden.items.length > 0 && (
          <ul className="orden-items">
            {nuevaOrden.items.map((item, idx) => (
              <li key={idx}>
                {item.descripcion} – Cant: {item.cantidad} – $ {item.costoUnit.toFixed(2)}
              </li>
            ))}
          </ul>
        )}

        <button className="btn-crear" onClick={handleCrearOrden}>Crear Orden</button>
      </div>

      <h3>Listado de Órdenes</h3>
      {ordenesFiltradas.length === 0 ? (
        <p>No hay órdenes registradas.</p>
      ) : (
        <div className="orden-listado">
          {ordenesFiltradas.map((orden) => (
            <div key={orden._id} className="orden-card">
              <button onClick={() => setOrdenSeleccionada(orden)}>
                {orden.numero}
              </button>
            </div>
          ))}
        </div>
      )}

      {ordenSeleccionada && (
        <div className="orden-detalle">
          <h3>Detalle de la Orden</h3>
          <p><strong>Número:</strong> {ordenSeleccionada.numero}</p>
          <p><strong>Proveedor ID:</strong> {ordenSeleccionada.proveedor_id}</p>

          <label><strong>Estado:</strong></label>
          <select
            value={ordenSeleccionada.estado}
            onChange={(e) => setOrdenSeleccionada({ ...ordenSeleccionada, estado: e.target.value })}
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
              {ordenSeleccionada.items.map((item, idx) => (
                <tr key={idx}>
                  <td>
                                      <input
                    type="text"
                    value={item.descripcion}
                    onChange={(e) => handleEditarItem(idx, "descripcion", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={item.cantidad}
                    onChange={(e) => handleEditarItem(idx, "cantidad", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={item.costoUnit}
                    onChange={(e) => handleEditarItem(idx, "costoUnit", e.target.value)}
                  />
                </td>
                <td>${(item.cantidad * item.costoUnit).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h4>Total: ${calcularTotal(ordenSeleccionada.items)}</h4>

        <div className="orden-botones">
          <button onClick={() => handleEditarOrden(ordenSeleccionada._id)}>Guardar Cambios</button>
          <button onClick={() => handleEliminarOrden(ordenSeleccionada._id)}>Eliminar</button>
          <button onClick={() => handleDescargarPDF(ordenSeleccionada)}>Descargar PDF</button>
          <button onClick={() => setOrdenSeleccionada(null)}>Cerrar</button>
        </div>
      </div>
    )}
  </div>
);
};


export default OrdenCompra;
