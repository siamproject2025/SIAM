import React, { useState } from 'react';
import Notification from '../../../components/Notification';
const ModalDetalleActividad = ({ actividad, onClose, onUpdate, onDelete, showNotification }) => {
  const [actividadEditada, setActividadEditada] = useState({
    ...actividad,
    fecha: new Date(actividad.fecha).toISOString().slice(0, 16)
  });

const handleGuardar = () => {
  if (!actividadEditada.nombre.trim()) {
    showNotification('El nombre de la actividad es obligatorio', 'error');
    return;
  }
  if (!actividadEditada.fecha) {
    showNotification('La fecha y hora son obligatorias', 'error');
    return;
  }
  if (!actividadEditada.lugar.trim()) {
    showNotification('El lugar es obligatorio', 'error');
    return;
  }
  if (!actividadEditada.descripcion.trim()) {
    showNotification('La descripción es obligatoria', 'error');
    return;
  }

  const fechaActividad = new Date(actividadEditada.fecha);
  const ahora = new Date();
  if (fechaActividad < ahora) {
    showNotification('No puedes guardar una actividad con fecha pasada', 'error');
    return;
  }

  onUpdate(actividadEditada);
};


const handleEliminar = () => {
  showNotification(`Preparando eliminación de "${actividadEditada.nombre}"`, 'info');
  onDelete(actividadEditada._id);
};

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">📋 Detalle de Actividad</h3>

        <div className="modal-form-grid">
          <div className="form-group full-width">
            <label>Nombre de la Actividad</label>
            <input
              type="text"
              value={actividadEditada.nombre}
              onChange={(e) => setActividadEditada({ ...actividadEditada, nombre: e.target.value })}
              placeholder="Ej: Reunión de equipo"
            />
          </div>

          <div className="form-group">
            <label>Fecha y Hora</label>
            <input
              type="datetime-local"
              value={actividadEditada.fecha}
              onChange={(e) => setActividadEditada({ ...actividadEditada, fecha: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Lugar</label>
            <input
              type="text"
              value={actividadEditada.lugar}
              onChange={(e) => setActividadEditada({ ...actividadEditada, lugar: e.target.value })}
              placeholder="Ej: Sala de juntas"
            />
          </div>

          <div className="form-group full-width">
            <label>Descripción</label>
            <textarea
              value={actividadEditada.descripcion}
              onChange={(e) => setActividadEditada({ ...actividadEditada, descripcion: e.target.value })}
              placeholder="Describe el objetivo y detalles de la actividad..."
              rows="4"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-guardar" onClick={handleGuardar}>Guardar Cambios</button>
          <button className="btn btn-danger" onClick={handleEliminar}>Eliminar</button>
          <button className="btn-cerrar" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default ModalDetalleActividad;