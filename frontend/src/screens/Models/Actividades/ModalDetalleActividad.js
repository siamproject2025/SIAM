// ============================================================
// ModalDetalleActividad.jsx
//
// Modal editable para ver y modificar detalles de actividades.
// Permite editar todos los campos y eliminar actividades.
// ============================================================
import React, { useState } from 'react';
import { X, Trash2, Save } from 'lucide-react';

// Convierte fecha de DB al formato del input datetime-local
const formatForInput = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const ModalDetalleActividad = ({ actividad, onClose, onUpdate, onDelete }) => {
  const [actividadEditada, setActividadEditada] = useState({
    ...actividad,
    fecha: formatForInput(actividad.fecha),
  });

  const handleGuardar = () => { 
    onUpdate(actividadEditada);
  };

  const handleEliminar = () => { 
    if (window.confirm('¿Estás seguro de que deseas eliminar esta actividad?')) {
      onDelete(actividad._id);
    }
  };

  const inp = {
    width: '100%', 
    padding: '0.75rem',
    border: '1.5px solid #E0D9F5', 
    borderRadius: 8,
    fontFamily: 'inherit', 
    fontSize: '.9rem',
    color: '#2D2250', 
    background: '#FAF9FF', 
    outline: 'none',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>

        {/* Header con título + X estándar */}
        <div style={{
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '16px 20px', 
          borderBottom: '1.5px solid #E0D9F5',
        }}>
          <h3 className="modal-title" style={{ margin: 0 }}>✏️ Editar Actividad</h3>
          <button 
            onClick={onClose} 
            style={{
              background: '#F0F0F0', 
              border: 'none', 
              borderRadius: 8,
              width: 32, 
              height: 32, 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center', 
              cursor: 'pointer', 
              color: '#555',
              transition: 'all .15s',
            }}
            onMouseEnter={e=>{ e.currentTarget.style.background='#E74C3C'; e.currentTarget.style.color='#fff'; }}
            onMouseLeave={e=>{ e.currentTarget.style.background='#F0F0F0'; e.currentTarget.style.color='#555'; }}
            title="Cerrar">
            <X size={17} strokeWidth={2.2}/>
          </button>
        </div>

        <div className="modal-form-grid" style={{ padding: '16px 20px' }}>
          <div className="form-group full-width">
            <label>Nombre de la Actividad</label>
            <input 
              type="text" 
              style={inp}
              value={actividadEditada.nombre}
              onChange={e => setActividadEditada({ ...actividadEditada, nombre: e.target.value })}
              placeholder="Ej: Reunión de equipo"/>
          </div>
          <div className="form-group">
            <label>Fecha y Hora</label>
            <input 
              type="datetime-local" 
              style={inp}
              value={actividadEditada.fecha}
              onChange={e => setActividadEditada({ ...actividadEditada, fecha: e.target.value })}/>
          </div>
          <div className="form-group">
            <label>Lugar</label>
            <input 
              type="text" 
              style={inp}
              value={actividadEditada.lugar}
              onChange={e => setActividadEditada({ ...actividadEditada, lugar: e.target.value })}
              placeholder="Ej: Sala de juntas"/>
          </div>
          <div className="form-group full-width">
            <label>Descripción</label>
            <textarea 
              style={{ ...inp, resize: 'vertical', minHeight: 80 }}
              value={actividadEditada.descripcion}
              onChange={e => setActividadEditada({ ...actividadEditada, descripcion: e.target.value })}
              placeholder="Describe el objetivo y detalles..."/>
          </div>
        </div>

        {/* Acciones — Eliminar separado a la izquierda, Cancelar y Guardar a la derecha */}
        <div className="modal-actions" style={{
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '12px 20px', 
          borderTop: '1.5px solid #E0D9F5',
        }}>
          {/* Eliminar — queda separado visualmente a la izquierda */}
          <button 
            onClick={handleEliminar} 
            style={{
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 6,
              padding: '8px 14px', 
              borderRadius: 9, 
              border: 'none',
              background: '#FDE8E8', 
              color: '#E74C3C',
              fontWeight: 700, 
              fontSize: '.84rem', 
              cursor: 'pointer',
              transition: 'all .15s',
            }}
            onMouseEnter={e=>{ 
              e.currentTarget.style.background='#E74C3C'; 
              e.currentTarget.style.color='#fff'; 
            }}
            onMouseLeave={e=>{ 
              e.currentTarget.style.background='#FDE8E8'; 
              e.currentTarget.style.color='#E74C3C'; 
            }}>
            <Trash2 size={14}/> Eliminar
          </button>

          {/* Cancelar + Guardar — a la derecha */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              onClick={onClose} 
              style={{
                padding: '8px 16px', 
                borderRadius: 9, 
                border: '1.5px solid #E0D9F5',
                background: '#F8F7FF', 
                color: '#6C4FBF', 
                fontWeight: 700,
                fontSize: '.84rem', 
                cursor: 'pointer',
              }}>
              Cancelar
            </button>
            <button 
              onClick={handleGuardar} 
              style={{
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 6,
                padding: '8px 18px', 
                borderRadius: 9, 
                border: 'none',
                background: '#6C4FBF', 
                color: '#fff',
                fontWeight: 700, 
                fontSize: '.84rem', 
                cursor: 'pointer',
                transition: 'background .15s',
              }}
              onMouseEnter={e=>e.currentTarget.style.background='#4B3090'}
              onMouseLeave={e=>e.currentTarget.style.background='#6C4FBF'}>
              <Save size={14}/> Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalDetalleActividad;
