// ============================================================
// Parametros.jsx — consume API real en lugar de solo localStorage
// - GET al montar: carga desde el backend
// - PUT al guardar: persiste en MongoDB
// - localStorage como caché local (fallback si la API falla)
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { auth } from '../components/authentication/Auth';
import {
  Settings, Save, RotateCcw, Building2, Phone, Mail,
  MapPin, User, Globe, Image, Music, Eye, EyeOff,
  CheckCircle, AlertTriangle, Upload, Trash2, Info, Loader
} from 'lucide-react';
import Notification from '../components/Notification';

// ── Clave localStorage (caché) ────────────────────────────────
export const PARAMS_KEY = 'siam_parametros';
const API_URL = process.env.REACT_APP_API_URL + "/api/parametros";
// ── Valores por defecto ───────────────────────────────────────
export const DEFAULTS = {
  nombre_institucion:  'Escuela Experimental de Niños para la Música',
  siglas:              'S.I.A.M.',
  slogan:              'Sistema Integrado Administrativo Musical',
  descripcion_hero:    'Plataforma digital para la gestión académica, administrativa y operativa de escuelas de música',
  directora:           'Lic. Rosario de Fátima Mejía Aguilar',
  cargo_directora:     'Directora, Escuela Experimental de Niños para la Música',
  testimonio:          'Sistema que mejora la eficiencia y la calidad del servicio educativo musical.',
  telefono:            '+504 8797-1675',
  correo:              'esc.experimentalmusica@gmail.com',
  direccion:           'Colonia Hato de Enmedio, sector 2 Contiguo a la Iglesia de los Santos de los Últimos Días, Tegucigalpa, Honduras',
  ciudad:              'Tegucigalpa, Honduras',
  desarrollado_por:    'Estudiantes de Informática Administrativa, UNAH',
  mapa_embed_url:      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3931.562882243273!2d-87.1767392!3d14.0727637!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8f6fbcd070775acd%3A0x30d484aaca34d4cf!2sEscuela%20Experimental%20De%20Ni%C3%B1os%20Para%20La%20M%C3%BAsica!5e0!3m2!1ses!2shn!4v1699999999999',
  color_primario:      '#6C4FBF',
  color_secundario:    '#9B59B6',
  stat_eficiencia:     '70',
  stat_reduccion:      '100',
  stat_acceso:         '24',
  stat_estudiantes:    '500',
  faq: [
    { question: '¿Qué es S.I.A.M.?',                   answer: 'S.I.A.M. es un Sistema Integrado Administrativo Musical diseñado para optimizar y automatizar los procesos clave de instituciones musicales, desde la matrícula hasta el control de inventario.' },
    { question: '¿Qué problemas resuelve S.I.A.M.?',   answer: 'Resuelve problemas como procesos manuales de matrícula, desorganización en horarios, control limitado de inventario, falta de trazabilidad en compras y comunicación institucional dispersa.' },
    { question: '¿Qué tecnologías utiliza S.I.A.M.?',  answer: 'Utiliza React y JavaScript en el frontend, Express.js en el backend, MongoDB como base de datos y APIs privadas seguras para integración.' },
    { question: '¿Cómo mejora la eficiencia institucional?', answer: 'Aumenta en más del 70% la eficiencia en tareas administrativas, reduce errores en procesos críticos y proporciona acceso centralizado a información 24/7.' },
    { question: '¿Quién puede utilizar S.I.A.M.?',     answer: 'Está diseñado para escuelas de música, conservatorios y cualquier institución educativa musical que necesite gestionar sus procesos administrativos y académicos.' },
  ],
};

// ── Hook público para leer parámetros (landing + otros módulos) ──
// Primero intenta la API, fallback a localStorage, fallback a DEFAULTS
export function useParametros() {
  const [params, setParams] = useState(() => {
    try {
      const s = localStorage.getItem(PARAMS_KEY);
      return s ? { ...DEFAULTS, ...JSON.parse(s) } : { ...DEFAULTS };
    } catch { return { ...DEFAULTS }; }
  });

  useEffect(() => {
    // Fetch público sin token (GET es abierto)
    axios.get(API_URL)
      .then(res => {
        const merged = { ...DEFAULTS, ...res.data };
        setParams(merged);
        // Actualizar caché local
        localStorage.setItem(PARAMS_KEY, JSON.stringify(merged));
      })
      .catch(() => {
        // Si la API falla, quedarse con lo del localStorage
      });
    // Escuchar cambios desde otra pestaña ()
    const handler = (e) => {
      if (e.key === PARAMS_KEY) {
        try {
          const s = e.newValue;
          if (s) setParams({ ...DEFAULTS, ...JSON.parse(s) });
        } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return params;
}

// ── CSS inline ────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Poppins:wght@700;800&display=swap');
  .pm-wrap { font-family:'Nunito',sans-serif; background:#F4F3FB; min-height:100vh; color:#2D2250; }
  .pm-header { background:linear-gradient(135deg,#6C4FBF 0%,#9B59B6 100%); padding:28px 36px 36px; position:relative; overflow:hidden; }
  .pm-header::before { content:''; position:absolute; inset:0; background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3C/g%3E%3C/svg%3E"); pointer-events:none; }
  .pm-hi { position:relative; z-index:1; }
  .pm-ht { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
  .pm-htitle { font-family:'Poppins',sans-serif; font-size:1.65rem; font-weight:800; color:#fff; display:flex; align-items:center; gap:12px; }
  .pm-sub { color:rgba(255,255,255,.8); font-size:.9rem; }
  .pm-body { padding:28px 36px; }
  .pm-tabs { display:flex; gap:0; padding:0 36px; background:#4B3090; overflow-x:auto; }
  .pm-tab { padding:13px 20px; font-size:.86rem; font-weight:700; cursor:pointer; border:none; background:transparent; color:rgba(255,255,255,.6); border-bottom:3px solid transparent; transition:all .2s; font-family:inherit; white-space:nowrap; display:flex; align-items:center; gap:7px; }
  .pm-tab:hover { color:#fff; }
  .pm-tab.active { color:#fff; border-bottom-color:#fff; }
  .pm-card { background:#fff; border-radius:14px; border:1px solid #E0D9F5; box-shadow:0 2px 16px rgba(108,79,191,.07); margin-bottom:22px; overflow:hidden; }
  .pm-card-header { padding:16px 22px; background:#FAF9FF; border-bottom:1px solid #E0D9F5; display:flex; align-items:center; gap:10px; }
  .pm-card-title { font-family:'Poppins',sans-serif; font-size:.95rem; font-weight:700; color:#6C4FBF; }
  .pm-card-desc { font-size:.8rem; color:#7A6FA0; margin-top:2px; }
  .pm-card-body { padding:22px; }
  .pm-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }
  .pm-full { grid-column:1/-1; }
  .pm-field { display:flex; flex-direction:column; gap:5px; }
  .pm-label { font-size:.77rem; font-weight:700; color:#7A6FA0; text-transform:uppercase; letter-spacing:.04em; display:flex; align-items:center; gap:6px; }
  .pm-input, .pm-textarea, .pm-select { padding:10px 13px; border:2px solid #E0D9F5; border-radius:9px; font-family:inherit; font-size:.9rem; color:#2D2250; background:#FAF9FF; outline:none; width:100%; transition:border-color .2s,box-shadow .2s; }
  .pm-input:focus, .pm-textarea:focus, .pm-select:focus { border-color:#6C4FBF; box-shadow:0 0 0 3px rgba(108,79,191,.1); background:#fff; }
  .pm-textarea { resize:vertical; min-height:80px; }
  .pm-hint { font-size:.74rem; color:#7A6FA0; margin-top:3px; }
  .pm-color-row { display:flex; align-items:center; gap:10px; }
  .pm-color-preview { width:38px; height:38px; border-radius:8px; border:2px solid #E0D9F5; cursor:pointer; flex-shrink:0; }
  .pm-color-input { opacity:0; position:absolute; width:0; height:0; }
  .pm-btn { display:inline-flex; align-items:center; gap:7px; padding:11px 22px; border-radius:10px; font-size:.87rem; font-weight:700; border:none; cursor:pointer; font-family:inherit; transition:all .18s; }
  .pm-primary { background:#6C4FBF; color:#fff; } .pm-primary:hover { background:#4B3090; }
  .pm-primary:disabled { background:#9f90d0; cursor:not-allowed; }
  .pm-ghost { background:#E0D9F5; color:#6C4FBF; } .pm-ghost:hover { background:#6C4FBF; color:#fff; }
  .pm-danger { background:#FDE8E8; color:#E74C3C; } .pm-danger:hover { background:#E74C3C; color:#fff; }
  .pm-action-bar { display:flex; gap:12px; align-items:center; padding:20px 36px; background:#fff; border-top:1px solid #E0D9F5; position:sticky; bottom:0; z-index:10; box-shadow:0 -4px 20px rgba(108,79,191,.07); }
  .pm-saved-badge { display:inline-flex; align-items:center; gap:6px; background:#D4F5E2; color:#1a7a40; padding:6px 14px; border-radius:20px; font-size:.8rem; font-weight:700; }
  .pm-preview-box { background:#F0ECFF; border:2px solid #C4B5E8; border-radius:12px; padding:16px 20px; }
  .pm-preview-title { font-size:.78rem; font-weight:700; color:#6C4FBF; text-transform:uppercase; letter-spacing:.05em; margin-bottom:10px; display:flex; align-items:center; gap:6px; }
  .pm-preview-landing { border-radius:10px; overflow:hidden; border:2px solid #E0D9F5; }
  .pm-preview-bar { background:linear-gradient(135deg,#6C4FBF,#9B59B6); padding:8px 16px; display:flex; align-items:center; gap:8px; }
  .pm-preview-content { background:#fff; padding:16px; }
  .pm-preview-h1 { font-family:'Poppins',sans-serif; font-size:1rem; font-weight:800; color:#2D2250; margin-bottom:4px; }
  .pm-preview-p { font-size:.78rem; color:#7A6FA0; }
  .pm-preview-contact { display:flex; flex-direction:column; gap:6px; margin-top:10px; }
  .pm-preview-row { display:flex; align-items:center; gap:8px; font-size:.78rem; color:#2D2250; }
  .pm-faq-item { background:#FAF9FF; border:1px solid #E0D9F5; border-radius:10px; padding:14px 18px; margin-bottom:10px; }
  .pm-faq-q { font-weight:700; font-size:.88rem; margin-bottom:6px; color:#2D2250; }
  .pm-faq-del { float:right; background:#FDE8E8; color:#E74C3C; border:none; cursor:pointer; border-radius:6px; padding:3px 8px; font-size:.75rem; font-weight:700; }
  .pm-faq-add { border:2px dashed #C4B5E8; border-radius:10px; padding:14px; text-align:center; cursor:pointer; color:#6C4FBF; font-weight:700; font-size:.86rem; transition:background .15s; }
  .pm-faq-add:hover { background:#F0ECFF; }
  .pm-stat-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
  .pm-stat-card { background:#FAF9FF; border:1px solid #E0D9F5; border-radius:10px; padding:14px; }
  .pm-stat-label { font-size:.75rem; font-weight:700; color:#7A6FA0; text-transform:uppercase; letter-spacing:.04em; margin-bottom:8px; }
  .pm-stat-row { display:flex; align-items:center; gap:8px; }
  .pm-stat-num { font-size:1.5rem; font-weight:800; color:#6C4FBF; }
  .pm-stat-suffix { font-size:.9rem; color:#7A6FA0; font-weight:700; }
  .pm-info-box { background:#E8F4FD; border-left:4px solid #2980B9; border-radius:9px; padding:10px 14px; font-size:.84rem; color:#0c4a6e; margin-bottom:16px; display:flex; gap:8px; }
  .pm-warn-box { background:#FFF3E0; border-left:4px solid #F39C12; border-radius:9px; padding:10px 14px; font-size:.84rem; color:#713f12; margin-bottom:16px; display:flex; gap:8px; }
  .pm-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:4rem; gap:1rem; color:#7A6FA0; font-size:.95rem; }
  .spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }
  @media(max-width:700px) { .pm-header{padding:18px 14px 22px;} .pm-body{padding:14px;} .pm-tabs{padding:0 8px;} .pm-grid{grid-template-columns:1fr;} .pm-action-bar{padding:14px;} }
`;

const Sec = ({ icon, title, desc, children }) => (
  <div className="pm-card">
    <div className="pm-card-header">
      <span style={{ color:'#6C4FBF' }}>{icon}</span>
      <div>
        <div className="pm-card-title">{title}</div>
        {desc && <div className="pm-card-desc">{desc}</div>}
      </div>
    </div>
    <div className="pm-card-body">{children}</div>
  </div>
);

const Field = ({ label, hint, full, children }) => (
  <div className="pm-field" style={full ? { gridColumn:'1/-1' } : {}}>
    <label className="pm-label">{label}</label>
    {children}
    {hint && <span className="pm-hint">{hint}</span>}
  </div>
);

// ============================================================
export default function Parametros() {
  const [tab, setTab]               = useState('institucion');
  const [params, setParams]         = useState({ ...DEFAULTS });
  const [saved, setSaved]           = useState(false);
  const [dirty, setDirty]           = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);
  const [saving, setSaving]         = useState(false);
  const [notification, setNotification] = useState(null);
  const [showPreview, setShowPreview]   = useState(false);

  // ── Cargar desde API al montar ────────────────────────────
  useEffect(() => {
    axios.get(API_URL)
      .then(res => {
        const merged = { ...DEFAULTS, ...res.data };
        setParams(merged);
        localStorage.setItem(PARAMS_KEY, JSON.stringify(merged));
      })
      .catch(() => {
        // Fallback a localStorage si la API no responde
        try {
          const s = localStorage.getItem(PARAMS_KEY);
          if (s) setParams({ ...DEFAULTS, ...JSON.parse(s) });
        } catch {}
        setNotification({ message: 'No se pudo conectar con el servidor. Mostrando datos locales.', type: 'warning' });
      })
      .finally(() => setLoadingInit(false));
  }, []);

  const set = (k, v) => { setParams(p => ({ ...p, [k]: v })); setDirty(true); setSaved(false); };
  const setFaq = (i, field, v) => {
    const arr = [...params.faq];
    arr[i] = { ...arr[i], [field]: v };
    set('faq', arr);
  };
  const addFaq = () => set('faq', [...params.faq, { question: '', answer: '' }]);
  const delFaq = (i) => set('faq', params.faq.filter((_, idx) => idx !== i));

  // ── Guardar en API ────────────────────────────────────────
const handleSave = async () => {
  setSaving(true);
  try {
    const user = auth.currentUser;
    if (!user) {
      setNotification({ message: "Sesión expirada", type: 'error' });
      return;
    }

    const token = await user.getIdToken(true);
    const res = await axios.put(API_URL, params, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      }
    });

    const updated = { ...DEFAULTS, ...res.data };
    setParams(updated);
    localStorage.setItem(PARAMS_KEY, JSON.stringify(updated));

    setSaved(true);
    setDirty(false);

    // --- NOTIFICACIÓN PEQUEÑA (ESTILO TOAST) ---
    const { default: Swal } = await import('sweetalert2');
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });

    Toast.fire({
      icon: 'success',
      title: 'Configuración guardada exitosamente'
    });
    // -------------------------------------------

    setTimeout(() => setSaved(false), 4000);
  } catch (err) {
    const msg = err.response?.data?.error || err.message || "Error al guardar";
    setNotification({ message: msg, type: 'error' });
  } finally {
    setSaving(false);
  }
};

  // ── Restaurar predeterminados ─────────────────────────────
  const handleReset = async () => {
    const { default: Swal } = await import('sweetalert2');
    const r = await Swal.fire({
      title: '¿Restaurar valores predeterminados?',
      text: 'Se sobreescribirán los datos guardados en el servidor.',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#E74C3C', cancelButtonColor: '#6C4FBF',
      confirmButtonText: 'Sí, restaurar', cancelButtonText: 'Cancelar',
    });
    if (!r.isConfirmed) return;
    setParams({ ...DEFAULTS });
    setDirty(true);
    setSaved(false);
    
  };

  const TABS = [
    { id:'institucion',  label:'Institución',    icon:<Building2 size={15}/> },
    { id:'contacto',     label:'Contacto',        icon:<Phone size={15}/> },
    { id:'landing',      label:'Textos Landing',  icon:<Globe size={15}/> },
    { id:'estadisticas', label:'Estadísticas',    icon:<Settings size={15}/> },
    { id:'faq',          label:'FAQ',             icon:<Info size={15}/> },
    { id:'colores',      label:'Colores',         icon:<Image size={15}/> },
  ];

  if (loadingInit) return (
    <div className="pm-wrap"><style>{CSS}</style>
      <div className="pm-loading">
        <Loader size={36} className="spin" color="#6C4FBF"/>
        <span>Cargando parámetros del sistema...</span>
      </div>
    </div>
  );

  return (
    <div className="pm-wrap">
      <style>{CSS}</style>

      {/* Header */}
      <motion.div className="pm-header"
        initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{duration:.5,type:'spring',stiffness:120}}>
        <div className="pm-hi">
          <div className="pm-ht">
            <div className="pm-htitle">
              <motion.span initial={{rotate:-180,scale:0}} animate={{rotate:0,scale:1}} transition={{type:'spring',stiffness:200,delay:.2}}>
                <Settings size={34} color="white"/>
              </motion.span>
              Parámetros del Sistema
            </div>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              {saved && (
                <motion.span className="pm-saved-badge" initial={{opacity:0,scale:.8}} animate={{opacity:1,scale:1}}>
                  <CheckCircle size={14}/> Guardado en servidor
                </motion.span>
              )}
              <button className="pm-btn" style={{background:'rgba(255,255,255,.18)',color:'#fff',border:'1px solid rgba(255,255,255,.3)'}}
                onClick={()=>setShowPreview(p=>!p)}>
                {showPreview ? <EyeOff size={15}/> : <Eye size={15}/>}
                {showPreview ? 'Ocultar preview' : 'Ver preview'}
              </button>
            </div>
          </div>
          <p className="pm-sub">Configura los datos institucionales guardados en el servidor. La landing page los lee automáticamente.</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="pm-tabs">
        {TABS.map(t=>(
          <button key={t.id} className={`pm-tab${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="pm-body">
        {dirty && (
          <div className="pm-warn-box">
            <AlertTriangle size={16} style={{flexShrink:0,marginTop:1}}/>
            Tienes cambios sin guardar. Haz clic en "Guardar Cambios" para persistirlos en el servidor.
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.18}}>

            {/* ══ Institución ══ */}
            {tab==='institucion' && (
              <>
                <div className="pm-info-box"><Info size={15} style={{flexShrink:0,marginTop:1}}/>Estos datos aparecen en el encabezado, hero y footer de la landing page.</div>
                <Sec icon={<Building2 size={18}/>} title="Datos de la Institución" desc="Información principal que se muestra en toda la plataforma">
                  <div className="pm-grid">
                    <Field label="Nombre de la Institución">
                      <input className="pm-input" value={params.nombre_institucion} onChange={e=>set('nombre_institucion',e.target.value)}/>
                    </Field>
                    <Field label="Siglas / Nombre del Sistema">
                      <input className="pm-input" value={params.siglas} onChange={e=>set('siglas',e.target.value)}/>
                    </Field>
                    <Field label="Slogan del Sistema" full>
                      <input className="pm-input" value={params.slogan} onChange={e=>set('slogan',e.target.value)}/>
                    </Field>
                  </div>
                </Sec>
                <Sec icon={<User size={18}/>} title="Dirección / Autoridad">
                  <div className="pm-grid">
                    <Field label="Nombre del Director/a">
                      <input className="pm-input" value={params.directora} onChange={e=>set('directora',e.target.value)}/>
                    </Field>
                    <Field label="Cargo Oficial">
                      <input className="pm-input" value={params.cargo_directora} onChange={e=>set('cargo_directora',e.target.value)}/>
                    </Field>
                  </div>
                </Sec>
                <Sec icon={<Music size={18}/>} title="Desarrollado por">
                  <Field label="Créditos del desarrollo" full>
                    <input className="pm-input" value={params.desarrollado_por} onChange={e=>set('desarrollado_por',e.target.value)}/>
                  </Field>
                </Sec>
                {showPreview && (
                  <div className="pm-preview-box" style={{marginTop:16}}>
                    <div className="pm-preview-title"><Eye size={13}/> Preview — Barra de navegación</div>
                    <div className="pm-preview-landing">
                      <div className="pm-preview-bar">
                        <span style={{color:'#fff',fontWeight:800,fontSize:'.85rem',display:'flex',alignItems:'center',gap:6}}>
                          <Music size={14}/> {params.siglas}
                        </span>
                      </div>
                      <div className="pm-preview-content">
                        <div className="pm-preview-h1">{params.siglas} — {params.slogan}</div>
                        <div className="pm-preview-p">{params.nombre_institucion}</div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ══ Contacto ══ */}
            {tab==='contacto' && (
              <>
                <div className="pm-info-box"><Info size={15} style={{flexShrink:0,marginTop:1}}/>Esta información aparece en la sección "Contacto" de la landing page.</div>
                <Sec icon={<Phone size={18}/>} title="Información de Contacto">
                  <div className="pm-grid">
                    <Field label="Teléfono">
                      <input className="pm-input" value={params.telefono} onChange={e=>set('telefono',e.target.value)} placeholder="+504 0000-0000"/>
                    </Field>
                    <Field label="Correo Electrónico">
                      <input className="pm-input" type="email" value={params.correo} onChange={e=>set('correo',e.target.value)}/>
                    </Field>
                    <Field label="Dirección Completa" full>
                      <textarea className="pm-textarea" value={params.direccion} onChange={e=>set('direccion',e.target.value)} rows={3}/>
                    </Field>
                    <Field label="Ciudad / País">
                      <input className="pm-input" value={params.ciudad} onChange={e=>set('ciudad',e.target.value)}/>
                    </Field>
                  </div>
                </Sec>
                <Sec icon={<MapPin size={18}/>} title="Mapa Integrado (Google Maps)">
                  <div className="pm-field">
                    <label className="pm-label">URL de embed de Google Maps</label>
                    <textarea className="pm-textarea" rows={3} value={params.mapa_embed_url} onChange={e=>set('mapa_embed_url',e.target.value)}/>
                    <span className="pm-hint">Google Maps → tu ubicación → Compartir → Insertar mapa → copia la URL del src="..."</span>
                  </div>
                  {params.mapa_embed_url && (
                    <div style={{marginTop:14,borderRadius:10,overflow:'hidden',border:'2px solid #E0D9F5'}}>
                      <iframe title="preview-mapa" src={params.mapa_embed_url} width="100%" height="220" style={{border:0,display:'block'}} loading="lazy"/>
                    </div>
                  )}
                </Sec>
                {showPreview && (
                  <div className="pm-preview-box">
                    <div className="pm-preview-title"><Eye size={13}/> Preview — Sección Contacto</div>
                    <div className="pm-preview-contact">
                      <div className="pm-preview-row"><Phone size={13} color="#6C4FBF"/><span>{params.telefono}</span></div>
                      <div className="pm-preview-row"><Mail size={13} color="#6C4FBF"/><span>{params.correo}</span></div>
                      <div className="pm-preview-row"><MapPin size={13} color="#6C4FBF"/><span>{params.direccion}</span></div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ══ Textos Landing ══ */}
            {tab==='landing' && (
              <>
                <div className="pm-info-box"><Info size={15} style={{flexShrink:0,marginTop:1}}/>Estos textos aparecen en el hero y sección de testimonios de la landing page.</div>
                <Sec icon={<Globe size={18}/>} title="Sección Hero (portada)">
                  <Field label="Descripción principal del Hero" full>
                    <textarea className="pm-textarea" rows={3} value={params.descripcion_hero} onChange={e=>set('descripcion_hero',e.target.value)}/>
                    <span className="pm-hint">Se muestra debajo del título S.I.A.M. en la portada.</span>
                  </Field>
                </Sec>
                <Sec icon={<User size={18}/>} title="Sección Testimonios">
                  <div className="pm-grid">
                    <Field label="Texto del Testimonio" full>
                      <textarea className="pm-textarea" rows={3} value={params.testimonio} onChange={e=>set('testimonio',e.target.value)}/>
                    </Field>
                    <Field label="Nombre del autor">
                      <input className="pm-input" value={params.directora} onChange={e=>set('directora',e.target.value)}/>
                    </Field>
                    <Field label="Cargo del autor">
                      <input className="pm-input" value={params.cargo_directora} onChange={e=>set('cargo_directora',e.target.value)}/>
                    </Field>
                  </div>
                </Sec>
              </>
            )}

            {/* ══ Estadísticas ══ */}
            {tab==='estadisticas' && (
              <>
                <div className="pm-info-box"><Info size={15} style={{flexShrink:0,marginTop:1}}/>Estos números aparecen animados en la sección "Beneficios Institucionales" de la landing.</div>
                <Sec icon={<Settings size={18}/>} title="Estadísticas Animadas" desc="Los valores se animan al hacer scroll en la landing">
                  <div className="pm-stat-grid">
                    {[
                      { key:'stat_eficiencia', label:'Eficiencia en tareas administrativas', suffix:'%' },
                      { key:'stat_reduccion',  label:'Reducción de errores en procesos',     suffix:'%' },
                      { key:'stat_acceso',     label:'Acceso centralizado (horas)',           suffix:'/7' },
                      { key:'stat_estudiantes',label:'Estudiantes beneficiados',              suffix:'+' },
                    ].map(s=>(
                      <div key={s.key} className="pm-stat-card">
                        <div className="pm-stat-label">{s.label}</div>
                        <div className="pm-stat-row">
                          <input className="pm-input" type="number" min="0" max="9999"
                            style={{maxWidth:90,textAlign:'center',fontWeight:800,fontSize:'1.1rem',color:'#6C4FBF'}}
                            value={params[s.key]} onChange={e=>set(s.key,e.target.value)}/>
                          <span className="pm-stat-suffix">{s.suffix}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Sec>
              </>
            )}

            {/* ══ FAQ ══ */}
            {tab==='faq' && (
              <>
                <div className="pm-info-box"><Info size={15} style={{flexShrink:0,marginTop:1}}/>Las preguntas frecuentes se muestran en la sección FAQ de la landing.</div>
                <Sec icon={<Info size={18}/>} title="Preguntas Frecuentes" desc={`${params.faq.length} pregunta(s) configurada(s)`}>
                  {params.faq.map((item,i)=>(
                    <div key={i} className="pm-faq-item">
                      <button className="pm-faq-del" onClick={()=>delFaq(i)}>× Eliminar</button>
                      <div className="pm-faq-q">Pregunta {i+1}</div>
                      <div className="pm-field" style={{marginBottom:8}}>
                        <label className="pm-label">Pregunta</label>
                        <input className="pm-input" value={item.question} onChange={e=>setFaq(i,'question',e.target.value)}/>
                      </div>
                      <div className="pm-field">
                        <label className="pm-label">Respuesta</label>
                        <textarea className="pm-textarea" rows={3} value={item.answer} onChange={e=>setFaq(i,'answer',e.target.value)}/>
                      </div>
                    </div>
                  ))}
                  <div className="pm-faq-add" onClick={addFaq}>+ Agregar nueva pregunta</div>
                </Sec>
              </>
            )}

            {/* ══ Colores ══ */}
            {tab==='colores' && (
              <>
                <div className="pm-info-box"><Info size={15} style={{flexShrink:0,marginTop:1}}/>Los colores se aplican en el gradiente del header, tabs y botones de toda la plataforma.</div>
                <Sec icon={<Image size={18}/>} title="Colores Institucionales">
                  <div className="pm-grid">
                    {[
                      { key:'color_primario',   label:'Color Primario (gradiente inicio)' },
                      { key:'color_secundario', label:'Color Secundario (gradiente fin)'  },
                    ].map(c=>(
                      <div key={c.key} className="pm-field">
                        <label className="pm-label">{c.label}</label>
                        <div className="pm-color-row">
                          <div className="pm-color-preview" style={{background:params[c.key]}}
                            onClick={()=>document.getElementById(`color-${c.key}`).click()}>
                            <input id={`color-${c.key}`} type="color" className="pm-color-input"
                              value={params[c.key]} onChange={e=>set(c.key,e.target.value)}/>
                          </div>
                          <input className="pm-input" value={params[c.key]} onChange={e=>set(c.key,e.target.value)} placeholder="#6C4FBF" style={{fontFamily:'monospace'}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:18,borderRadius:12,overflow:'hidden',border:'1px solid #E0D9F5'}}>
                    <div style={{background:`linear-gradient(135deg,${params.color_primario},${params.color_secundario})`,padding:'18px 24px',color:'#fff',fontFamily:'Poppins,sans-serif',fontWeight:800,fontSize:'1rem',display:'flex',alignItems:'center',gap:10}}>
                      <Music size={18}/> {params.siglas} — Vista previa del gradiente
                    </div>
                  </div>
                </Sec>
              </>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Barra de acciones fija */}
      <div className="pm-action-bar">
        <button className="pm-btn pm-primary" onClick={handleSave} disabled={saving}>
          {saving ? <><Loader size={15} className="spin"/> Guardando...</> : <><Save size={16}/> Guardar Cambios</>}
        </button>
        <button className="pm-btn pm-ghost" onClick={handleReset} disabled={saving}>
          <RotateCcw size={15}/> Restaurar predeterminados
        </button>
        {dirty && !saving && <span style={{fontSize:'.82rem',color:'#b45309',fontWeight:700}}>⚠ Cambios sin guardar</span>}
        {saved && (
          <motion.span className="pm-saved-badge" initial={{opacity:0}} animate={{opacity:1}}>
            <CheckCircle size={13}/> Guardado en MongoDB
          </motion.span>
        )}
      </div>

      {notification && (
        <Notification message={notification.message} type={notification.type}
          onClose={()=>setNotification(null)} duration={5000}/>
      )}
    </div>
  );
}