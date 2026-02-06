import React, { useState } from 'react';

const ModalDetalleActividad = ({ actividad, onClose, onUpdate, onDelete }) => {
  // CORRECCIÓN: Función para convertir fecha de DB a formato local para el input
  const formatForInput = (dateString) => {
    const d = new Date(dateString);
    // Esto obtiene los componentes locales y los une en el formato YYYY-MM-DDTHH:mm
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [actividadEditada, setActividadEditada] = useState({
    ...actividad,
    fecha: formatForInput(actividad.fecha) // Usamos la nueva función local
  });
  const handleGuardar = () => {
    onUpdate(actividadEditada);
  };

  const handleEliminar = () => {
   
      onDelete(actividadEditada._id);
    
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title"> Detalle de Actividad</h3>

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
          <button className="btn btn-guardar-donaciones" onClick={handleGuardar}>Guardar Cambios</button>
          <button className="btn btn-danger" onClick={handleEliminar}>Eliminar</button>
          <button className="btn btn-dark" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default ModalDetalleActividad;