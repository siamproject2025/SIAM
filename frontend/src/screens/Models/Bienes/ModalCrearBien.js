import React, { useState } from 'react';

const ModalCrearBien = ({ onClose, onCreate }) => {
  const [nuevoBien, setNuevoBien] = useState({
    codigo: '',
    nombre: '',
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

        <div className="modal-form-grid">
          <div className="form-group">
            <label>Código del Bien *</label>
            <input
              type="text"
              value={nuevoBien.codigo}
              onChange={(e) => setNuevoBien({ ...nuevoBien, codigo: e.target.value })}
              placeholder="Ej: BIEN-001"
            />
          </div>

          <div className="form-group">
            <label>Nombre del Bien *</label>
            <input
              type="text"
              value={nuevoBien.nombre}
              onChange={(e) => setNuevoBien({ ...nuevoBien, nombre: e.target.value })}
              placeholder="Ej: Laptop Dell"
            />
          </div>

          <div className="form-group">
            <label>Categoría</label>
            <input
              type="text"
              value={nuevoBien.categoria}
              onChange={(e) => setNuevoBien({ ...nuevoBien, categoria: e.target.value })}
              placeholder="Ej: Tecnología"
            />
          </div>

          <div className="form-group">
            <label>Estado Inicial *</label>
            <select
              value={nuevoBien.estado}
              onChange={(e) => setNuevoBien({ ...nuevoBien, estado: e.target.value })}
            >
              <option value="">Seleccionar estado</option>
              <option value="ACTIVO">🟢 ACTIVO</option>
              <option value="INACTIVO">🔴 INACTIVO</option>
              <option value="MANTENIMIENTO">🟡 MANTENIMIENTO</option>
              <option value="PRESTAMO">🔵 PRESTAMO</option>
            </select>
          </div>

          <div className="form-group">
            <label>Valor ($) *</label>
            <input
              type="number"
              value={nuevoBien.valor}
              onChange={(e) => setNuevoBien({ ...nuevoBien, valor: e.target.value })}
              placeholder="Ej: 1500.00"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>Fecha de Ingreso *</label>
            <input
              type="date"
              value={nuevoBien.fechaIngreso}
              onChange={(e) => setNuevoBien({ ...nuevoBien, fechaIngreso: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group full-width">
          <label>Descripción Detallada</label>
          <textarea
            value={nuevoBien.descripcion}
            onChange={(e) => setNuevoBien({ ...nuevoBien, descripcion: e.target.value })}
            placeholder="Describe las características y detalles del bien..."
            rows="3"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              resize: 'vertical'
            }}
          />
        </div>

        <div className="modal-actions">
          <button className="btn-cancelar" onClick={onClose}>❌ Cancelar</button>
          <button className="btn-crear" onClick={handleCrear}>✨ Crear Bien</button>
        </div>
      </div>
    </div>
  );
};

export default ModalCrearBien;