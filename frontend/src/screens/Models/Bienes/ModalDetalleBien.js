import React, { useState } from 'react';

const ModalDetalleBien = ({ bien, onClose, onUpdate, onDelete }) => {
  const [bienEditado, setBienEditado] = useState({ ...bien });

  const handleGuardar = () => {
    const actualizado = {
      ...bienEditado,
      valor: parseFloat(bienEditado.valor),
      fechaIngreso: new Date(bienEditado.fechaIngreso)
    };
    onUpdate(actualizado);
  };

  const handleEliminar = () => {
    if (window.confirm('¿Seguro que deseas eliminar este bien?')) {
      onDelete(bienEditado._id);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">📋 Detalle del Bien</h3>

        <div className="modal-form-grid">
          <div className="form-group">
            <label>Código del Bien</label>
            <input
              type="text"
              value={bienEditado.codigo}
              onChange={(e) => setBienEditado({ ...bienEditado, codigo: e.target.value })}
              placeholder="Ej: BIEN-001"
            />
          </div>

          <div className="form-group">
            <label>Nombre del Bien</label>
            <input
              type="text"
              value={bienEditado.nombre}
              onChange={(e) => setBienEditado({ ...bienEditado, nombre: e.target.value })}
              placeholder="Ej: Laptop Dell"
            />
          </div>

          <div className="form-group">
            <label>Categoría</label>
            <input
              type="text"
              value={bienEditado.categoria}
              onChange={(e) => setBienEditado({ ...bienEditado, categoria: e.target.value })}
              placeholder="Ej: Tecnología"
            />
          </div>

          <div className="form-group">
            <label>Estado Actual</label>
            <select
              value={bienEditado.estado}
              onChange={(e) => setBienEditado({ ...bienEditado, estado: e.target.value })}
            >
              <option value="ACTIVO">🟢 ACTIVO</option>
              <option value="INACTIVO">🔴 INACTIVO</option>
              <option value="MANTENIMIENTO">🟡 MANTENIMIENTO</option>
              <option value="PRESTAMO">🔵 PRESTAMO</option>
            </select>
          </div>

          <div className="form-group">
            <label>Valor ($)</label>
            <input
              type="number"
              value={bienEditado.valor}
              onChange={(e) => setBienEditado({ ...bienEditado, valor: e.target.value })}
              placeholder="Ej: 1500.00"
            />
          </div>

          <div className="form-group">
            <label>Fecha de Ingreso</label>
            <input
              type="date"
              value={bienEditado.fechaIngreso?.slice(0, 10)}
              onChange={(e) => setBienEditado({ ...bienEditado, fechaIngreso: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group full-width">
          <label>Descripción Detallada</label>
          <textarea
            value={bienEditado.descripcion}
            onChange={(e) => setBienEditado({ ...bienEditado, descripcion: e.target.value })}
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
          <button className="btn-guardar" onClick={handleGuardar}>💾 Guardar Cambios</button>
          <button className="btn-eliminar" onClick={handleEliminar}>🗑️ Eliminar</button>
          <button className="btn-cerrar" onClick={onClose}>❌ Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default ModalDetalleBien;