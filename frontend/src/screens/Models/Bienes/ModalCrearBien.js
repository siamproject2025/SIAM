import React, { useState } from 'react';

const ModalCrearBien = ({ onClose, onCreate }) => {
  const [nuevoBien, setNuevoBien] = useState({
    codigo: '',
    descripcion: '',
    categoria: '',
    estado: '',
    valor: '',
    fechaIngreso: ''
  });

  const handleCrear = () => {
    const bienFinal = {
      ...nuevoBien,
      valor: parseFloat(nuevoBien.valor),
      fechaIngreso: new Date(nuevoBien.fechaIngreso)
    };
    onCreate(bienFinal);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">✨ Crear Nuevo Bien</h3>

        <div className="form-group">
          <label>Código</label>
          <input
            type="text"
            value={nuevoBien.codigo}
            onChange={(e) => setNuevoBien({ ...nuevoBien, codigo: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Descripción</label>
          <input
            type="text"
            value={nuevoBien.descripcion}
            onChange={(e) => setNuevoBien({ ...nuevoBien, descripcion: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Categoría</label>
          <input
            type="text"
            value={nuevoBien.categoria}
            onChange={(e) => setNuevoBien({ ...nuevoBien, categoria: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Estado</label>
          <select
            value={nuevoBien.estado}
            onChange={(e) => setNuevoBien({ ...nuevoBien, estado: e.target.value })}
          >
            <option value="">Seleccionar</option>
            <option value="ACTIVO">ACTIVO</option>
            <option value="INACTIVO">INACTIVO</option>
            <option value="EN USO">EN USO</option>
            <option value="DADO DE BAJA">DADO DE BAJA</option>
          </select>
        </div>

        <div className="form-group">
          <label>Valor</label>
          <input
            type="number"
            value={nuevoBien.valor}
            onChange={(e) => setNuevoBien({ ...nuevoBien, valor: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Fecha de Ingreso</label>
          <input
            type="date"
            value={nuevoBien.fechaIngreso}
            onChange={(e) => setNuevoBien({ ...nuevoBien, fechaIngreso: e.target.value })}
          />
        </div>

        <div className="modal-actions">
          <button className="btn-cancelar" onClick={onClose}>Cancelar</button>
          <button className="btn-crear" onClick={handleCrear}>Crear Bien</button>
        </div>
      </div>
    </div>
  );
};

export default ModalCrearBien;