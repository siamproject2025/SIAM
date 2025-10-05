import React, { useEffect, useState } from "react";
import ModalCrearBien from './Bienes/ModalCrearBien';
import ModalDetalleBien from './Bienes/ModalDetalleBien';
import '../../styles/Models/Bienes.css'

const API_URL = "http://localhost:5000/api/bienes";

const Bienes = () => {
  const [bienes, setBienes] = useState([]);
  const [bienSeleccionado, setBienSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setBienes(data))
      .catch(err => console.error('Error al obtener los bienes:', err));
  }, []);

  const handleCrearBien = async (nuevoBien) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoBien)
      });
      if (!res.ok) throw new Error('Error al crear el bien');
      const bienCreado = await res.json();
      setBienes([...bienes, bienCreado]);
      setMostrarModalCrear(false);
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleEditarBien = async (bienActualizado) => {
    try {
      const res = await fetch(`${API_URL}/${bienActualizado._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bienActualizado)
      });
      if (!res.ok) throw new Error('Error al editar el bien.');
      const actualizada = await res.json();
      setBienes(bienes.map(b => b._id === actualizada._id ? actualizada : b));
      setBienSeleccionado(null);
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleEliminarBien = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este bien?")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar el bien');
      setBienes(bienes.filter(b => b._id !== id));
      setBienSeleccionado(null);
    } catch (err) {
      console.error(err.message);
    }
  };

  const bienesFiltrados = bienes.filter(b =>
    b.codigo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="bien-container">
      <div className="bien-header">
        <h2>Sistema de Bienes</h2>
        <p>Gestiona y controla todos tus bienes de manera eficiente</p>
        <div className="bien-busqueda-bar">
          <input
            type="text"
            className="bien-busqueda"
            placeholder="Buscar por código de bien..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button className="btn-nueva-bien" onClick={() => setMostrarModalCrear(true)}>
            + Nuevo Bien
          </button>
        </div>
      </div>

      <h3 className="bien-subtitulo">Lista de bienes</h3>
      {bienesFiltrados.length === 0 ? (
        <p className="bien-vacio">No hay bienes registrados.</p>
      ) : (
        <div className="bien-listado">
          {bienesFiltrados.map((bien) => (
            <div key={bien._id} className="bien-card" onClick={() => setBienSeleccionado(bien)}>
              <div className="bien-card-header">
                <span className="bien-codigo">{bien.codigo}</span>
              </div>
              <div className="bien-card-body">
                <div className="bien-info-row">
                  <span><strong>Descripción:</strong> {bien.descripcion}</span>
                  <span><strong>Categoría:</strong> {bien.categoria || '—'}</span>
                </div>
                <div className="bien-info-row">
                  <span><strong>Valor:</strong> {bien.valor}</span>
                  <span><strong>Estado:</strong> {bien.estado}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {mostrarModalCrear && (
        <ModalCrearBien
          onClose={() => setMostrarModalCrear(false)}
          onCreate={handleCrearBien}
        />
      )}

      {bienSeleccionado && (
        <ModalDetalleBien
          bien={bienSeleccionado}
          onClose={() => setBienSeleccionado(null)}
          onUpdate={handleEditarBien}
          onDelete={handleEliminarBien}
        />
      )}
    </div>
  );
};

export default Bienes;