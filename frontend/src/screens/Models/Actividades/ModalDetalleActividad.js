import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Trash2, Edit, FileText, Clock, UserCheck } from 'lucide-react';
import ConfirmDialog from '../../../components/ConfirmDialog/ConfirmDialog';
import { auth } from '../../../components/authentication/Auth';
import WithPermission from '../../../components/Permisos/WithPermission';

const utcToHNInput = (utcStr) => {
  if (!utcStr) return '';
  try {
    const partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Tegucigalpa',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date(utcStr));

    const get = (t) => partes.find(p => p.type === t)?.value ?? '00';
    const h   = get('hour') === '24' ? '00' : get('hour');
    return `${get('year')}-${get('month')}-${get('day')}T${h}:${get('minute')}`;
  } catch { return ''; }
};

const formatAuditFecha = (utcStr) => {
  if (!utcStr || utcStr === 'null') return 'No registrado';
  try {
    return new Intl.DateTimeFormat('es-HN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
      timeZone: 'America/Tegucigalpa',
    }).format(new Date(utcStr));
  } catch { return utcStr; }
};

const TAB_DE_CAMPO = {
  nombre: 'datos', fecha: 'datos', lugar: 'datos', descripcion: 'datos',
};

const validar = (form) => {
  const e = {};
  if (!form.nombre?.trim())      e.nombre      = 'El nombre es obligatorio';
  if (!form.fecha)               e.fecha       = 'La fecha y hora son obligatorias';
  if (!form.lugar?.trim())       e.lugar       = 'El lugar es obligatorio';
  if (!form.descripcion?.trim()) e.descripcion = 'La descripción es obligatoria';
  return e;
};

const COLORES = {
  azul:     { nombre: 'Azul',     hex: '#3B82F6' },
  verde:    { nombre: 'Verde',    hex: '#22C55E' },
  amarillo: { nombre: 'Amarillo', hex: '#EAB308' },
  morado:   { nombre: 'Morado',   hex: '#A855F7' },
  rojo:     { nombre: 'Rojo',     hex: '#EF4444' },
};

const S = {
  btn: (bg, col = '#fff', disabled = false) => ({
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '10px 20px', borderRadius: 10, fontSize: '.86rem',
    fontWeight: 700, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    background: bg, color: col, fontFamily: 'inherit', transition: 'all .18s',
    opacity: disabled ? 0.65 : 1,
  }),
  inp: (err) => ({
    padding: '9px 12px', border: `2px solid ${err ? '#E74C3C' : '#E0D9F5'}`,
    borderRadius: 8, fontFamily: 'inherit', fontSize: '.88rem',
    color: '#2D2250', background: err ? '#FFF8F8' : '#FAF9FF',
    outline: 'none', width: '100%', transition: 'border-color .2s',
  }),
};

const ModalDetalleActividad = ({ actividad, onClose, onUpdate, onDelete }) => {
  const actividadId = actividad?._id || actividad?.id;

  const [form, setForm] = useState({
    ...actividad,
    fecha: utcToHNInput(actividad.fecha),
  });
  const [errores,           setErrores]           = useState({});
  const [errorServidor,     setErrorServidor]      = useState('');
  const [intentoGuardar,    setIntentoGuardar]     = useState(false);
  const [hayCambios,        setHayCambios]         = useState(false);
  const [guardando,         setGuardando]          = useState(false);
  const [tabActiva,         setTabActiva]          = useState('datos');
  const [showConfirm,       setShowConfirm]        = useState(false);
  const [showConfirmCerrar, setShowConfirmCerrar]  = useState(false);

  const limpiarError = (name) => {
    if (intentoGuardar && errores[name]) {
      setErrores(p => { const n = { ...p }; delete n[name]; return n; });
    }
    if (errorServidor) setErrorServidor('');
  };

  const tabTieneError = (key) => Object.keys(errores).some(c => TAB_DE_CAMPO[c] === key);

  const handleCerrar = () => {
    if (hayCambios) setShowConfirmCerrar(true);
    else onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setHayCambios(true);
    limpiarError(name);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setIntentoGuardar(true);
    setErrorServidor('');

    if (!actividadId) {
      setErrorServidor('Error interno: la actividad no tiene un ID válido.');
      return;
    }

    const errs = validar(form);
    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      const primer = Object.keys(errs)[0];
      if (TAB_DE_CAMPO[primer]) setTabActiva(TAB_DE_CAMPO[primer]);
      return;
    }
    setErrores({});
    setGuardando(true);

    const user              = auth.currentUser;
    const emailActualizador = user?.email || user?.displayName || 'Usuario';
    const usuarioId         = user?.uid || user?.id;

    // form.fecha es "YYYY-MM-DDTHH:MM" en hora HN → convertir a UTC
    const [fechaStr, horaStr] = form.fecha.split('T');
    const [y, m, d]           = fechaStr.split('-').map(Number);
    const [hh, mm]            = horaStr.split(':').map(Number);
    const fechaUTC            = new Date(Date.UTC(y, m - 1, d, hh + 6, mm));

    try {
      await onUpdate({
        _id:                   actividadId,
        nombre:                form.nombre,
        fecha:                 fechaUTC.toISOString(),
        lugar:                 form.lugar,
        descripcion:           form.descripcion,
        categoria:             form.categoria,
        color:                 form.color,
        usuario:               usuarioId,
        actualizado_por_email: emailActualizador,
        fecha_actualizacion:   new Date().toISOString(),
      });

      setHayCambios(false);

    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        'Error al guardar los cambios. Intenta de nuevo.';
      setErrorServidor(msg);

      const camposError = err?.response?.data?.errores || err?.data?.errores;
      if (camposError) {
        setErrores(camposError);
        const primer = Object.keys(camposError)[0];
        if (TAB_DE_CAMPO[primer]) setTabActiva(TAB_DE_CAMPO[primer]);
      }
    } finally {
      setGuardando(false);
    }
  };

  const renderTabs = () => (
    <>
      <div className="dn-modal-tabs">
        {[
          { key: 'datos',     label: 'Datos',     ico: <FileText size={14} /> },
          { key: 'auditoria', label: 'Auditoría', ico: <Clock size={14} /> },
        ].map(tab => (
          <button key={tab.key} type="button"
            className={`dn-tab-btn${tabActiva === tab.key ? ' active' : ''}`}
            onClick={() => setTabActiva(tab.key)}>
            {tab.ico} {tab.label}
            {tabTieneError(tab.key) && <span className="dn-tab-error-dot" />}
          </button>
        ))}
      </div>

      {tabActiva === 'datos' && (
        <div className="dn-tab-content">
          <div className="dn-form-section-title"><Edit size={15} /> Información de la Actividad</div>

          {errorServidor && (
            <div style={{
              background: '#FFF0F0', border: '1.5px solid #E74C3C', borderRadius: 8,
              padding: '10px 14px', marginBottom: 12, color: '#C0392B',
              fontSize: '.84rem', fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center',
            }}>
              ⚠️ {errorServidor}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 13 }}>

            <div style={{ gridColumn: '1/-1' }}>
              <label className="dn-label">Nombre <span style={{ color: '#E74C3C' }}>*</span></label>
              <input type="text" name="nombre" value={form.nombre} onChange={handleChange}
                placeholder="Ej: Reunión de equipo" style={S.inp(errores.nombre)} />
              {errores.nombre && <span style={{ fontSize: '.73rem', color: '#E74C3C', fontWeight: 600 }}>{errores.nombre}</span>}
            </div>

            <div>
              <label className="dn-label">Fecha y Hora (HN) <span style={{ color: '#E74C3C' }}>*</span></label>
              <input type="datetime-local" name="fecha" value={form.fecha} onChange={handleChange}
                style={S.inp(errores.fecha)} />
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
                placeholder="Describe el objetivo y detalles..."
                style={{ ...S.inp(errores.descripcion), resize: 'vertical', minHeight: 90 }} />
              {errores.descripcion && <span style={{ fontSize: '.73rem', color: '#E74C3C', fontWeight: 600 }}>{errores.descripcion}</span>}
            </div>

            <div style={{ gridColumn: '1/-1' }}>
              <label className="dn-label">Color del Evento</label>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                {Object.entries(COLORES).map(([key, c]) => (
                  <button key={key} type="button"
                    onClick={() => { setForm(p => ({ ...p, color: key })); setHayCambios(true); }}
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
      )}

      {tabActiva === 'auditoria' && (
        <div className="dn-tab-content">
          <div className="dn-form-section-title">Auditoría de la Actividad</div>
          <div className="dn-audit-card">
            <div className="dn-audit-row">
              <UserCheck size={16} className="dn-audit-ico" />
              <div>
                <div className="dn-audit-label">Creación</div>
                <div className="dn-audit-val">
                  Categoría: <strong>{actividad.creado_por_email || 'general'}</strong>
                  &nbsp;·&nbsp;
                  Registrado: <strong>{formatAuditFecha(actividad.createdAt)}</strong>
                </div>
              </div>
            </div>

            {(actividad.actualizado_por_email || actividad.updatedAt) && (
              <div className="dn-audit-row">
                <Clock size={16} className="dn-audit-ico" />
                <div>
                  <div className="dn-audit-label">Última Actualización</div>
                  <div className="dn-audit-val">
                    {actividad.actualizado_por_email && (
                      <>Por: <strong>{actividad.actualizado_por_email}</strong>&nbsp;·&nbsp;</>
                    )}
                    <strong>{formatAuditFecha(actividad.fecha_actualizacion || actividad.updatedAt)}</strong>
                  </div>
                </div>
              </div>
            )}

            <div className="dn-audit-ids">
              <small>ID: <strong>{actividadId || '—'}</strong></small>
              <small>Color: <strong>{actividad.color || 'morado'}</strong></small>
              <small>Categoría: <strong>{actividad.categoria || 'general'}</strong></small>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <motion.div className="dn-overlay" onClick={handleCerrar}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="dn-modal" onClick={e => e.stopPropagation()}
        initial={{ scale: .85, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .85, y: 40 }}
        transition={{ type: 'spring', damping: 22 }}>

        <div className="dn-modal-header">
          <h3><Edit size={20} /> Editar Actividad</h3>
          <button className="dn-modal-close" onClick={handleCerrar}><X size={18} /></button>
        </div>

        {hayCambios && (
          <div className="dn-unsaved-banner">⚠️ Tienes cambios sin guardar</div>
        )}

        <form onSubmit={handleGuardar} noValidate>
          {renderTabs()}
          <div className="dn-modal-footer">
               <WithPermission requiredPermissions={"ELIMINAR_ACTIVIDADES"}>
             
            <button type="button" style={S.btn('#E74C3C')} onClick={() => setShowConfirm(true)}>
              Eliminar
            </button>
            </WithPermission>
            <button type="button" style={S.btn('#E0D9F5', '#6C4FBF')} onClick={handleCerrar}>
              Cancelar
            </button>
               <WithPermission requiredPermissions={"ACTUALIZAR_ACTIVIDADES"}>
             
            <button type="submit" disabled={guardando} style={S.btn('#6C4FBF', '#fff', guardando)}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
            </WithPermission>
          </div>
        </form>

        {showConfirm && (
          <ConfirmDialog
            message={`¿Seguro que deseas eliminar "${form.nombre}"?`}
            onConfirm={() => { onDelete(actividadId); setShowConfirm(false); }}
            onCancel={() => setShowConfirm(false)}
            visible={showConfirm}
          />
        )}
        {showConfirmCerrar && (
          <ConfirmDialog
            message="Tienes cambios sin guardar. ¿Seguro que deseas cerrar?"
            onConfirm={() => { setShowConfirmCerrar(false); onClose(); }}
            onCancel={() => setShowConfirmCerrar(false)}
            visible={showConfirmCerrar}
          />
        )}
      </motion.div>
    </motion.div>
  );
};

export default ModalDetalleActividad;