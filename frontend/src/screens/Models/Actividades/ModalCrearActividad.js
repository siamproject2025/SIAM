// ============================================================
// ModalCrearActividad.jsx
//
// Acepta prop `fechaInicial` que viene del CalendarioActividades
// cuando el usuario hace clic en un día. Si viene, pre-rellena
// la fecha. Ahora con selector de color para los eventos.
// ============================================================
import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

const getLocalISOTime = () => {
  const now = new Date();
  const off = now.getTimezoneOffset() * 60000;
  return new Date(now - off).toISOString().slice(0, 16);
};

// Colores disponibles
const COLORES_EVENTO = {
  azul:     { nombre: 'Azul',      hex: '#3B82F6' },
  verde:    { nombre: 'Verde',     hex: '#22C55E' },
  amarillo: { nombre: 'Amarillo',  hex: '#EAB308' },
  morado:   { nombre: 'Morado',    hex: '#A855F7' },
  rojo:     { nombre: 'Rojo',      hex: '#EF4444' }
};

const ModalCrearActividad = ({ onClose, onCreate, fechaInicial = null }) => {
  const [nuevaActividad, setNuevaActividad] = useState({
    nombre:      '',
    fecha:       fechaInicial || '',
    lugar:       '',
    descripcion: '',
    color:       'morado' // Color por defecto
  });

  const fechaMinima = getLocalISOTime();
  const handleCrear = () => onCreate(nuevaActividad);

  const inp = {
    width: '100%', padding: '0.75rem',
    border: '1.5px solid #E0D9F5', borderRadius: 8,
    fontFamily: 'inherit', fontSize: '.9rem',
    color: '#2D2250', background: '#FAF9FF', outline: 'none',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>

        {/* Header con X estándar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1.5px solid #E0D9F5',
        }}>
          <h3 className="modal-title" style={{ margin: 0 }}>📅 Crear Nueva Actividad</h3>
          <button onClick={onClose} style={{
            background: '#F0F0F0', border: 'none', borderRadius: 8,
            width: 32, height: 32, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: '#555',
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
            <label>Nombre de la Actividad *</label>
            <input type="text" style={inp}
              value={nuevaActividad.nombre}
              onChange={e => setNuevaActividad({ ...nuevaActividad, nombre: e.target.value })}
              placeholder="Ej: Reunión de equipo"/>
          </div>
          <div className="form-group">
            <label>Fecha y Hora *</label>
            <input type="datetime-local" style={inp}
              value={nuevaActividad.fecha}
              min={fechaMinima}
              onChange={e => setNuevaActividad({ ...nuevaActividad, fecha: e.target.value })}/>
            {fechaInicial && (
              <span style={{ fontSize: '.75rem', color: '#6C4FBF', marginTop: 3, display: 'block' }}>
                📅 Fecha preseleccionada desde el calendario
              </span>
            )}
          </div>
          <div className="form-group">
            <label>Lugar *</label>
            <input type="text" style={inp}
              value={nuevaActividad.lugar}
              onChange={e => setNuevaActividad({ ...nuevaActividad, lugar: e.target.value })}
              placeholder="Ej: Sala de juntas"/>
          </div>
          <div className="form-group full-width">
            <label>Descripción *</label>
            <textarea style={{ ...inp, resize: 'vertical', minHeight: 80 }}
              value={nuevaActividad.descripcion}
              onChange={e => setNuevaActividad({ ...nuevaActividad, descripcion: e.target.value })}
              placeholder="Describe el objetivo y detalles de la actividad..."/>
          </div>

          {/* Selector de color */}
          <div className="form-group full-width">
            <label>Color del Evento *</label>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              {Object.entries(COLORES_EVENTO).map(([key, color]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNuevaActividad({ ...nuevaActividad, color: key })}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: color.hex,
                    border: nuevaActividad.color === key ? '3px solid #333' : '2px solid #ddd',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  title={color.nombre}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          padding: '12px 20px', borderTop: '1.5px solid #E0D9F5',
        }}>
          <button onClick={onClose} style={{
            padding: '8px 16px', borderRadius: 9, border: '1.5px solid #E0D9F5',
            background: '#F8F7FF', color: '#6C4FBF', fontWeight: 700,
            fontSize: '.84rem', cursor: 'pointer',
          }}>
            Cancelar
          </button>
          <button onClick={handleCrear} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 18px', borderRadius: 9, border: 'none',
            background: '#6C4FBF', color: '#fff',
            fontWeight: 700, fontSize: '.84rem', cursor: 'pointer',
            transition: 'background .15s',
          }}
            onMouseEnter={e=>e.currentTarget.style.background='#4B3090'}
            onMouseLeave={e=>e.currentTarget.style.background='#6C4FBF'}>
            <Plus size={14}/> Crear Actividad
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalCrearActividad;
