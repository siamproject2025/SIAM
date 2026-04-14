import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Calendar } from 'lucide-react';
import WithPermission from '../../../components/Permisos/WithPermission';

const getMinHN = () => {
  const ahora = new Date(Date.now() - 5 * 60 * 1000);
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Tegucigalpa',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(ahora).replace(' ', 'T');
};

const COLORES = {
  azul:     { nombre: 'Azul',     hex: '#3B82F6' },
  verde:    { nombre: 'Verde',    hex: '#22C55E' },
  amarillo: { nombre: 'Amarillo', hex: '#EAB308' },
  morado:   { nombre: 'Morado',   hex: '#A855F7' },
  rojo:     { nombre: 'Rojo',     hex: '#EF4444' },
};

const S = {
  btn: (bg, col = '#fff') => ({
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '10px 20px', borderRadius: 10, fontSize: '.86rem',
    fontWeight: 700, border: 'none', cursor: 'pointer',
    background: bg, color: col, fontFamily: 'inherit', transition: 'all .18s',
  }),
  inp: (err) => ({
    padding: '9px 12px', border: `2px solid ${err ? '#E74C3C' : '#E0D9F5'}`,
    borderRadius: 8, fontFamily: 'inherit', fontSize: '.88rem',
    color: '#2D2250', background: err ? '#FFF8F8' : '#FAF9FF',
    outline: 'none', width: '100%', transition: 'border-color .2s',
  }),
};

const ModalCrearActividad = ({ onClose, onCreate, fechaInicial = null }) => {
  const [form, setForm] = useState({
    nombre: '', fecha: fechaInicial || '', lugar: '', descripcion: '', color: 'morado',
  });
  const [errores,        setErrores]        = useState({});
  const [intentoGuardar, setIntentoGuardar] = useState(false);

  const fechaMinima = getMinHN();

  const limpiarError = (name) => {
    if (intentoGuardar && errores[name]) {
      setErrores(p => { const n = { ...p }; delete n[name]; return n; });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    limpiarError(name);
  };

  const validar = () => {
    const e = {};
    if (!form.nombre?.trim())      e.nombre      = 'El nombre es obligatorio';
    if (!form.fecha)               e.fecha       = 'La fecha y hora son obligatorias';
    if (!form.lugar?.trim())       e.lugar       = 'El lugar es obligatorio';
    if (!form.descripcion?.trim()) e.descripcion = 'La descripción es obligatoria';
    return e;
  };

  const handleCrear = (e) => {
    e.preventDefault();
    setIntentoGuardar(true);
    const errs = validar();
    if (Object.keys(errs).length > 0) { setErrores(errs); return; }
    setErrores({});

    // form.fecha es "YYYY-MM-DDTHH:MM" en hora Honduras (GMT-6)
    // Convertimos a UTC sumando 6 horas antes de enviar al servidor
    const [fechaStr, horaStr] = form.fecha.split('T');
    const [y, m, d]           = fechaStr.split('-').map(Number);
    const [hh, mm]            = horaStr.split(':').map(Number);
    const fechaUTC            = new Date(Date.UTC(y, m - 1, d, hh + 6, mm));

    onCreate({ ...form, fecha: fechaUTC.toISOString() });
  };

  return (
    <motion.div className="dn-overlay" onClick={onClose}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="dn-modal" onClick={e => e.stopPropagation()}
        initial={{ scale: .85, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .85, y: 40 }}
        transition={{ type: 'spring', damping: 22 }}>

        <div className="dn-modal-header">
          <h3><Calendar size={20} /> Nueva Actividad</h3>
          <button className="dn-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleCrear} noValidate>
          <div className="dn-tab-content">
            <div className="dn-form-section-title"><Calendar size={15} /> Información de la Actividad</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 13 }}>

              <div style={{ gridColumn: '1/-1' }}>
                <label className="dn-label">Nombre <span style={{ color: '#E74C3C' }}>*</span></label>
                <input type="text" name="nombre" value={form.nombre} onChange={handleChange}
                  placeholder="Ej: Reunión de equipo" style={S.inp(errores.nombre)} />
                {errores.nombre && <span style={{ fontSize: '.73rem', color: '#E74C3C', fontWeight: 600 }}>{errores.nombre}</span>}
              </div>

              <div>
                <label className="dn-label">Fecha y Hora (HN) <span style={{ color: '#E74C3C' }}>*</span></label>
                <input type="datetime-local" name="fecha" value={form.fecha} min={fechaMinima}
                  onChange={handleChange} style={S.inp(errores.fecha)} />
                {fechaInicial && (
                  <span style={{ fontSize: '.75rem', color: '#6C4FBF', marginTop: 3, display: 'block' }}>
                    Fecha preseleccionada desde el calendario
                  </span>
                )}
                {errores.fecha && <span style={{ fontSize: '.73rem', color: '#E74C3C', fontWeight: 600 }}>{errores.fecha}</span>}
              </div>

              <div>
                <label className="dn-label">Lugar <span style={{ color: '#E74C3C' }}>*</span></label>
                <input type="text" name="lugar" value={form.lugar} onChange={handleChange}
                  placeholder="Ej: Sala de juntas" style={S.inp(errores.lugar)} />
                {errores.lugar && <span style={{ fontSize: '.73rem', color: '#E74C3C', fontWeight: 600 }}>{errores.lugar}</span>}
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                <label className="dn-label">Descripción <span style={{ color: '#E74C3C' }}>*</span></label>
                <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
                  placeholder="Describe el objetivo y detalles de la actividad..."
                  style={{ ...S.inp(errores.descripcion), resize: 'vertical', minHeight: 90 }} />
                {errores.descripcion && <span style={{ fontSize: '.73rem', color: '#E74C3C', fontWeight: 600 }}>{errores.descripcion}</span>}
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                <label className="dn-label">Color del Evento</label>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  {Object.entries(COLORES).map(([key, c]) => (
                    <button key={key} type="button"
                      onClick={() => setForm(p => ({ ...p, color: key }))}
                      title={c.nombre}
                      style={{
                        width: 36, height: 36, borderRadius: '50%', background: c.hex,
                        border: form.color === key ? '3px solid #333' : '2px solid #ddd',
                        cursor: 'pointer', transition: 'all .2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="dn-modal-footer">
            <div />
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" style={S.btn('#E0D9F5', '#6C4FBF')} onClick={onClose}>
                Cancelar
              </button>
                 <WithPermission requiredPermissions={["CREAR_ACTIVIDADES"]}>
             
              <button type="submit" style={S.btn('#6C4FBF')}>
                Guardar
              </button>
              </WithPermission>

            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ModalCrearActividad;