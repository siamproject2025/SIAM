import React, { useState } from 'react';

const ModalCrearActividad = ({ onClose, onCreate }) => {
  const [nuevaActividad, setNuevaActividad] = useState({
    nombre: '',
    fecha: '',
    lugar: '',
    descripcion: ''
  });

  // Fecha mínima (ahora)
  const fechaMinima = new Date().toISOString().slice(0, 16);

  const handleCrear = () => {
    onCreate(nuevaActividad);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title"> Crear Nueva Actividad</h3>

        <div className="modal-form-grid">
          <div className="form-group full-width">
            <label>Nombre de la Actividad *</label>
            <input
              type="text"
              value={nuevaActividad.nombre}
              onChange={(e) => setNuevaActividad({ ...nuevaActividad, nombre: e.target.value })}
              placeholder="Ej: Reunión de equipo"
            />
          </div>

          <div className="form-group">
            <label>Fecha y Hora *</label>
            <input
              type="datetime-local"
              value={nuevaActividad.fecha}
              min={fechaMinima}
              onChange={(e) => setNuevaActividad({ ...nuevaActividad, fecha: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Lugar *</label>
            <input
              type="text"
              value={nuevaActividad.lugar}
              onChange={(e) => setNuevaActividad({ ...nuevaActividad, lugar: e.target.value })}
              placeholder="Ej: Sala de juntas"
            />
          </div>

          <div className="form-group full-width">
            <label>Descripción *</label>
            <textarea
              value={nuevaActividad.descripcion}
              onChange={(e) => setNuevaActividad({ ...nuevaActividad, descripcion: e.target.value })}
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
          <button className="btn btn-dark" onClick={onClose}>Cancelar</button>
          <button className="btn btn-guardar-donaciones" onClick={handleCrear}>Crear Actividad</button>
        </div>
      </div>
    </div>
  );
};

export default ModalCrearActividad;