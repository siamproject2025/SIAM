// ============================================================
// StudentForm.jsx
// CAMBIOS:
// - Nueva pestaña "Transporte" con datos de ruta/conductor
// - Campos de nombre, parentesco, id, teléfono en encargados: OBLIGATORIOS
// - Validación visual en rojo con mensajes claros
// - Campos médicos con textarea amplios
// - Múltiples encargados (hasta 3)
// - Documentos subidos a Google Drive
// ============================================================
import React, { useState, useEffect } from 'react';
import { Trash2, ImagePlus, Upload, Plus, X, FileText, Phone, Bus, User } from 'lucide-react';
import axios from 'axios';
import { auth } from '../components/authentication/Auth';

const API_HOST      = process.env.REACT_APP_API_URL;
const API_GRADOS    = `${API_HOST}/api/grados`;
const API_CATALOGOS = `${API_HOST}/api/catalogos`;
const CURRENT_YEAR  = new Date().getFullYear();

const PARENTESCOS_FALLBACK = [
  "Padre","Madre","Abuelo","Abuela","Tío","Tía",
  "Hermano","Hermana","Tutor Legal","Padrino","Madrina","Otro",
];

const TIPOS_DOC_FALLBACK = [
  { value: 'identidad',          label: 'Copia de Identidad / Acta de Nacimiento' },
  { value: 'partida_nacimiento', label: 'Partida de Nacimiento' },
  { value: 'acta_compromiso',    label: 'Acta de Compromiso' },
  { value: 'constancia_notas',   label: 'Constancia de Notas' },
  { value: 'certificado_salud',  label: 'Certificado de Salud' },
  { value: 'otro',               label: 'Otro Documento' },
];

const cargarCatalogo = async (modulo, tipo) => {
  try {
    const res  = await fetch(`${API_CATALOGOS}/${modulo}/${tipo}`);
    if (!res.ok) return null;
    const data = await res.json();
    const arr  = Array.isArray(data) ? data : data.data;
    if (!arr || arr.length === 0) return null;
    return arr
      .filter(item => item.activo !== false)
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  } catch (err) {
    console.error(`Error cargando catálogo ${modulo}/${tipo}:`, err);
    return null;
  }
};

const encargadoVacio = () => ({
  nombre_encargado:       '',
  parentesco_encargado:   '',
  id_documento_encargado: '',
  telefono_encargado:     '',
  email_encargado:        '',
  es_principal:           false,
});

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return '';
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const mes = hoy.getMonth() - nac.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
};

const INIT = {
  nombre_completo:         '',
  fecha_nacimiento:        '',
  edad:                    '',
  genero:                  '',
  id_documento:            '',
  residencia_direccion:    '',
  telefono_alumno:         '',
  grado_a_matricular:      '',
  escuela_anterior:        '',
  notas_grado_anterior:    '',
  estado:                  'activo',
  alergias:                '',
  enfermedades:            '',
  medicamentos:            '',
  pediatra_nombre:         '',
  pediatra_telefono:       '',
  vacunas_al_dia:          false,
  imagen:                  null,
  foto_preview:            null,
  contacto_emergencia_nombre:   '',
  contacto_emergencia_telefono: '',
  encargados:              [encargadoVacio()],
  documentos:              [],
  usa_transporte:          false,
  transporte_ruta:         '',
  transporte_conductor_nombre: '',
  transporte_conductor_telefono: '',
  transporte_placa:        '',
  transporte_empresa:      '',
  transporte_punto_recogida: '',
  transporte_observaciones:  '',
};

const S = {
  sec:   { marginBottom: 24 },
  title: { display:'flex', alignItems:'center', gap:8, fontFamily:'Poppins,sans-serif', fontSize:'.88rem', fontWeight:700, color:'#6C4FBF', marginBottom:12, paddingBottom:8, borderBottom:'2px solid #E0D9F5' },
  grid:  { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:13 },
  full:  { gridColumn:'1/-1' },
  field: { display:'flex', flexDirection:'column', gap:4 },
  label: { fontSize:'.77rem', fontWeight:700, color:'#7A6FA0', textTransform:'uppercase', letterSpacing:'.04em' },
  req:   { color:'#E74C3C' },
  inp:   (e) => ({ padding:'9px 12px', border:`2px solid ${e?'#E74C3C':'#E0D9F5'}`, borderRadius:8, fontFamily:'inherit', fontSize:'.88rem', color:'#2D2250', background:e?'#FFF8F8':'#FAF9FF', outline:'none', width:'100%', transition:'border-color .2s, background .2s' }),
  inpRO: { padding:'9px 12px', border:'2px solid #E0D9F5', borderRadius:8, fontFamily:'inherit', fontSize:'.88rem', color:'#6C4FBF', fontWeight:700, background:'#F0ECFF', outline:'none', width:'100%' },
  sel:   (e) => ({ padding:'9px 12px', border:`2px solid ${e?'#E74C3C':'#E0D9F5'}`, borderRadius:8, fontFamily:'inherit', fontSize:'.88rem', color:'#2D2250', background: e ? '#FFF8F8' : '#FAF9FF', outline:'none', width:'100%' }),
  ta:    (e) => ({ padding:'9px 12px', border:`2px solid ${e?'#E74C3C':'#E0D9F5'}`, borderRadius:8, fontFamily:'inherit', fontSize:'.88rem', color:'#2D2250', background: e ? '#FFF8F8' : '#FAF9FF', outline:'none', width:'100%', resize:'vertical', minHeight:90 }),
  errMsg:{ fontSize:'.73rem', color:'#E74C3C', fontWeight:600, display:'flex', alignItems:'center', gap:4 },
  banner:{ display:'flex', gap:10, alignItems:'flex-start', padding:'11px 14px', borderRadius:10, marginBottom:14, fontSize:'.85rem', background:'#FDE8E8', borderLeft:'4px solid #E74C3C', color:'#7a1010' },
  info:  { display:'flex', gap:10, alignItems:'flex-start', padding:'10px 14px', borderRadius:9, marginBottom:12, fontSize:'.84rem', background:'#E8F4FD', borderLeft:'4px solid #2980B9', color:'#0c4a6e' },
  warn:  { display:'flex', gap:10, alignItems:'flex-start', padding:'10px 14px', borderRadius:9, marginBottom:12, fontSize:'.84rem', background:'#FFF8E1', borderLeft:'4px solid #F39C12', color:'#7B4F00' },
  foot:  { display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:16, borderTop:'1px solid #E0D9F5', marginTop:8 },
  btn:   (bg, col='#fff') => ({ display:'inline-flex', alignItems:'center', gap:7, padding:'10px 20px', borderRadius:10, fontSize:'.86rem', fontWeight:700, border:'none', cursor:'pointer', background:bg, color:col, fontFamily:'inherit', transition:'all .18s' }),
  upload:{ border:'2px dashed #C4B5E8', borderRadius:12, padding:'26px 20px', textAlign:'center', background:'#FAF9FF' },
  card:  { background:'#F4F3FB', border:'1px solid #E0D9F5', borderRadius:12, padding:'14px 16px', marginBottom:12, position:'relative' },
  cardTitle: { fontFamily:'Poppins,sans-serif', fontSize:'.82rem', fontWeight:700, color:'#6C4FBF', marginBottom:10, display:'flex', alignItems:'center', gap:6 },
  delBtn:{ position:'absolute', top:10, right:10, background:'#FDE8E8', color:'#E74C3C', border:'none', borderRadius:7, padding:'5px 8px', cursor:'pointer', fontSize:'.8rem', fontWeight:700, display:'flex', alignItems:'center', gap:4 },
  hint:  { fontSize:'.72rem', color:'#9CA3AF', marginTop:2 },
  transportCard: { background:'#F0F7FF', border:'2px solid #BFD7F0', borderRadius:12, padding:'16px', marginBottom:14 },
  transportTitle:{ fontFamily:'Poppins,sans-serif', fontSize:'.84rem', fontWeight:700, color:'#1a6ea8', marginBottom:12, display:'flex', alignItems:'center', gap:6 },
};

const Field = ({ label, required, error, full, children, hint }) => (
  <div style={{ ...S.field, ...(full ? S.full : {}) }}>
    <label style={S.label}>
      {label}
      {required && <span style={S.req}> *</span>}
    </label>
    {children}
    {error && (
      <span style={S.errMsg}>
        <span style={{fontSize:'.85rem'}}>⚠</span> {error}
      </span>
    )}
    {hint && !error && <span style={S.hint}>{hint}</span>}
  </div>
);

// ============================================================
const StudentForm = ({ student, onSubmit, onCancel, onDelete, isEdit = false }) => {
  const [formData, setFormData]     = useState({ ...INIT });
  const [errors, setErrors]         = useState({});
  const [showBanner, setShowBanner] = useState(false);
  const [grados, setGrados]         = useState([]);
  const [loadingGrados, setLoadingGrados] = useState(false);
  const [tabActivo, setTabActivo]   = useState('datos');

  const [catParentescos, setCatParentescos] = useState([]);
  const [catTiposDoc,    setCatTiposDoc]    = useState([]);
  const [loadingCats,    setLoadingCats]    = useState(true);

  useEffect(() => {
    const init = async () => {
      setLoadingCats(true);
      const [parentescos, tiposDoc] = await Promise.all([
        cargarCatalogo('matricula', 'parentesco_encargado'),
        cargarCatalogo('matricula', 'tipo'),
      ]);
      if (parentescos && parentescos.length > 0) {
        setCatParentescos(parentescos.map(p => ({ valor: p.valor, etiqueta: p.etiqueta || p.valor })));
      } else {
        setCatParentescos(PARENTESCOS_FALLBACK.map(p => ({ valor: p, etiqueta: p })));
      }
      if (tiposDoc && tiposDoc.length > 0) {
        setCatTiposDoc(tiposDoc.map(t => ({ value: t.valor, label: t.etiqueta || t.valor })));
      } else {
        setCatTiposDoc(TIPOS_DOC_FALLBACK);
      }
      setLoadingCats(false);
    };
    init();
  }, []);

  const obtenerGrados = async () => {
    try {
      setLoadingGrados(true);
      const user  = auth.currentUser;
      const token = await user.getIdToken();
      const res = await axios.get(`${API_GRADOS}?limit=100&estado=Activo`, { headers: { Authorization: `Bearer ${token}` } });
      setGrados(res.data.items.map(i => ({ _id: i._id, nombre: i.grado })));
    } catch {
      setGrados([
        {_id:'1',nombre:'Primer Grado'},
        {_id:'2',nombre:'Segundo Grado'},
        {_id:'3',nombre:'Tercer Grado'},
        {_id:'4',nombre:'Cuarto Grado'},
        {_id:'5',nombre:'Quinto Grado'},
        {_id:'6',nombre:'Sexto Grado'},
      ]);
    } finally { setLoadingGrados(false); }
};
  useEffect(() => { obtenerGrados(); }, []);

  useEffect(() => {
    if (student) {
      const f = { ...INIT, ...student };
      if (student.fecha_nacimiento) {
        f.fecha_nacimiento = student.fecha_nacimiento.split('T')[0];
        f.edad = calcularEdad(f.fecha_nacimiento);
      }
      f.vacunas_al_dia = student.vacunas_al_dia === true || student.vacunas_al_dia === 'true';
      f.usa_transporte = student.usa_transporte === true || student.usa_transporte === 'true';
      f.foto_preview = student.imagen && student.imagen !== 'null' ? `data:image/png;base64,${student.imagen}` : null;

      if (!student.encargados || !student.encargados.length) {
        f.encargados = [{
          nombre_encargado:       student.nombre_encargado       || '',
          parentesco_encargado:   student.parentesco_encargado   || '',
          id_documento_encargado: student.id_documento_encargado || '',
          telefono_encargado:     student.telefono_encargado     || '',
          email_encargado:        student.email_encargado        || '',
          es_principal:           true,
        }];
      }

      if (student.pediatra && !student.pediatra_nombre) {
        f.pediatra_nombre   = student.pediatra;
        f.pediatra_telefono = '';
      }

      f.documentos = student.documentos || [];
      setFormData(f);
    }
  }, [student]);

  // ── Encargados ──────────────────────────────────────────────
  const addEncargado = () => {
    if (formData.encargados.length >= 3) return;
    setFormData(p => ({ ...p, encargados: [...p.encargados, encargadoVacio()] }));
  };

  const removeEncargado = (i) => {
    if (formData.encargados.length <= 1) return;
    setFormData(p => ({ ...p, encargados: p.encargados.filter((_, idx) => idx !== i) }));
  };

  const updateEncargado = (i, field, value) => {
    setFormData(p => {
      const arr = [...p.encargados];
      arr[i] = { ...arr[i], [field]: value };
      return { ...p, encargados: arr };
    });
    if (errors[`enc_${i}_${field}`]) {
      setErrors(p => { const n={...p}; delete n[`enc_${i}_${field}`]; return n; });
    }
  };

  // ── Documentos ──────────────────────────────────────────────
  const addDocumento = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('El documento no debe superar 10MB'); return; }
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) { alert('Solo PDF, JPG o PNG'); return; }
    const tipoDefault = catTiposDoc[0]?.value || 'otro';
    setFormData(p => ({
      ...p,
      documentos: [...p.documentos, {
        tipo:   tipoDefault,
        nombre: file.name,
        file,
        tamaño: (file.size / 1024).toFixed(0) + ' KB',
        nuevo:  true,
      }]
    }));
    e.target.value = '';
  };

  const updateDocTipo = (i, tipo) => {
    setFormData(p => {
      const arr = [...p.documentos];
      arr[i] = { ...arr[i], tipo };
      return { ...p, documentos: arr };
    });
  };

  const removeDocumento = (i) => {
    setFormData(p => ({ ...p, documentos: p.documentos.filter((_, idx) => idx !== i) }));
  };

  // ── Handlers ────────────────────────────────────────────────
  const clrErr = (name) => { if (errors[name]) setErrors(p => { const n={...p}; delete n[name]; return n; }); };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'fecha_nacimiento') {
      setFormData(p => ({ ...p, fecha_nacimiento: value, edad: calcularEdad(value) }));
    } else {
      setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    }
    clrErr(name);
  };

  const handlePhoneChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value.replace(/[^\d]/g, '') }));
    clrErr(name);
  };

  const handleNumericChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value.replace(/\D/g, '') }));
    clrErr(name);
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('La imagen no debe superar 5MB'); return; }
    if (!file.type.startsWith('image/')) { alert('Solo se permiten imágenes'); return; }
    setFormData(prev => {
      if (prev.foto_preview && !prev.foto_preview.startsWith('data:')) URL.revokeObjectURL(prev.foto_preview);
      return { ...prev, imagen: file, foto_preview: URL.createObjectURL(file) };
    });
  };

  const eliminarFoto = () => {
    if (formData.foto_preview && !formData.foto_preview.startsWith('data:')) URL.revokeObjectURL(formData.foto_preview);
    setFormData(p => ({ ...p, imagen: null, foto_preview: null }));
  };

  // ── Validación ──────────────────────────────────────────────
  const validateForm = () => {
    const newErrors = {};

    // Campos básicos obligatorios
    const req = {
      nombre_completo:      'El nombre completo',
      fecha_nacimiento:     'La fecha de nacimiento',
      genero:               'El género',
      id_documento:         'El número de acta de nacimiento',
      residencia_direccion: 'La dirección de residencia',
      grado_a_matricular:   'El grado a matricular',
    };
    Object.entries(req).forEach(([f, lbl]) => {
      if (!formData[f]?.toString().trim()) newErrors[f] = `${lbl} es requerido`;
    });

    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (formData.nombre_completo && !soloLetras.test(formData.nombre_completo))
      newErrors.nombre_completo = 'Solo se permiten letras';
    if (formData.id_documento && !/^\d+$/.test(formData.id_documento))
      newErrors.id_documento = 'Solo se permiten números';

    const edad = parseInt(formData.edad);
    if (formData.fecha_nacimiento) {
      if (isNaN(edad)) newErrors.fecha_nacimiento = 'Fecha no válida';
      else if (edad < 4)  newErrors.fecha_nacimiento = `Edad: ${edad} años. Mínimo 4 años`;
      else if (edad > 18) newErrors.fecha_nacimiento = `Edad: ${edad} años. Máximo 18 años`;
    }

    // Encargados — todos los campos son obligatorios
    formData.encargados.forEach((enc, i) => {
      if (!enc.nombre_encargado?.trim())
        newErrors[`enc_${i}_nombre`]     = 'El nombre del encargado es requerido';
      if (!enc.parentesco_encargado?.trim())
        newErrors[`enc_${i}_parentesco`] = 'El parentesco es requerido';
      if (!enc.id_documento_encargado?.trim())
        newErrors[`enc_${i}_id`]         = 'El documento de identidad es requerido';
      if (!enc.telefono_encargado?.trim())
        newErrors[`enc_${i}_telefono`]   = 'El teléfono es requerido';
      if (enc.email_encargado && !/\S+@\S+\.\S+/.test(enc.email_encargado))
        newErrors[`enc_${i}_email`]      = 'Email inválido';
    });

    // Transporte — si usa transporte, ruta y conductor son obligatorios
    if (formData.usa_transporte) {
      if (!formData.transporte_ruta?.trim())
        newErrors['transporte_ruta'] = 'La ruta de transporte es requerida';
      if (!formData.transporte_conductor_nombre?.trim())
        newErrors['transporte_conductor_nombre'] = 'El nombre del conductor es requerido';
      if (!formData.transporte_conductor_telefono?.trim())
        newErrors['transporte_conductor_telefono'] = 'El teléfono del conductor es requerido';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 8000);
      // Saltar a la primera pestaña con errores
      const errKeys = Object.keys(newErrors);
      if (errKeys.some(k => ['nombre_completo','fecha_nacimiento','genero','id_documento','residencia_direccion','telefono_alumno','foto_preview'].includes(k)))
        setTabActivo('datos');
      else if (errKeys.some(k => k.startsWith('enc_')))
        setTabActivo('encargados');
      else if (errKeys.some(k => k.startsWith('transporte_')))
        setTabActivo('transporte');
      else if (errKeys.includes('grado_a_matricular'))
        setTabActivo('academico');
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const clean = { ...formData };
    delete clean.foto_preview;
    if (isEdit && !(clean.imagen instanceof File)) delete clean.imagen;

    if (clean.encargados && clean.encargados.length > 0) {
      const principal = clean.encargados.find(e => e.es_principal) || clean.encargados[0];
      clean.nombre_encargado       = principal.nombre_encargado;
      clean.parentesco_encargado   = principal.parentesco_encargado;
      clean.id_documento_encargado = principal.id_documento_encargado;
      clean.telefono_encargado     = principal.telefono_encargado;
      clean.email_encargado        = principal.email_encargado;
    }
    clean.encargados = JSON.stringify(clean.encargados || []);

    const archivosNuevos = (clean.documentos || []).filter(d => d.nuevo && d.file instanceof File);
    const docsExistentes = (clean.documentos || [])
      .filter(d => !d.nuevo)
      .map(({ file, nuevo, tamano, ...rest }) => rest);

    clean.documentos          = JSON.stringify(docsExistentes);
    clean.documentosMeta      = JSON.stringify(archivosNuevos.map(d => ({ tipo: d.tipo })));
    clean._archivosDocumentos = archivosNuevos.map(d => d.file);

    onSubmit(clean);
  };

  // ── Conteo de errores por pestaña ───────────────────────────
  const errCount = {
    datos:      Object.keys(errors).filter(k => ['nombre_completo','fecha_nacimiento','genero','id_documento','residencia_direccion'].includes(k)).length,
    medicos:    0,
    academico:  Object.keys(errors).filter(k => k === 'grado_a_matricular').length,
    encargados: Object.keys(errors).filter(k => k.startsWith('enc_')).length,
    documentos: 0,
    transporte: Object.keys(errors).filter(k => k.startsWith('transporte_')).length,
  };

  const tabs = [
    { id:'datos',      label:'Datos del Alumno',  errores: errCount.datos },
    { id:'medicos',    label:'Datos Médicos',      errores: errCount.medicos },
    { id:'academico',  label:'Académico',          errores: errCount.academico },
    { id:'encargados', label:`Encargados (${formData.encargados.length})`, errores: errCount.encargados },
    { id:'transporte', label:'Transporte',         errores: errCount.transporte },
    { id:'documentos', label:`Documentos (${formData.documentos.length})`, errores: errCount.documentos },
  ];

  const tabStyle = (id) => ({
    padding:'9px 16px', border:'none',
    background: tabActivo===id ? '#6C4FBF' : '#EDE9FF',
    color: tabActivo===id ? '#fff' : (errCount[id] > 0 ? '#E74C3C' : '#6C4FBF'),
    borderRadius:'8px 8px 0 0',
    fontWeight:700, fontSize:'.82rem', cursor:'pointer', fontFamily:'inherit',
    transition:'all .18s', whiteSpace:'nowrap',
    outline: errCount[id] > 0 && tabActivo !== id ? '2px solid #E74C3C' : 'none',
    position:'relative',
  });

  return (
    <>
      {showBanner && (
        <div style={S.banner}>
          <span style={{fontSize:'1.1rem'}}>⚠</span>
          <div style={{flex:1}}>
            <strong>Hay {Object.keys(errors).length} campo(s) con errores:</strong>
            <ul style={{margin:'5px 0 0',paddingLeft:18,fontSize:'.82rem',lineHeight:1.8}}>
              {Object.values(errors).slice(0,8).map((e,i)=>(
                <li key={i} style={{color:'#c0392b'}}>{e}</li>
              ))}
              {Object.keys(errors).length>8&&<li>...y {Object.keys(errors).length-8} más</li>}
            </ul>
          </div>
          <button style={{border:'none',background:'none',cursor:'pointer',color:'#7a1010',fontSize:'1.2rem',fontWeight:700}} onClick={()=>setShowBanner(false)}>×</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{display:'flex',gap:4,marginBottom:0,flexWrap:'wrap',borderBottom:'2px solid #E0D9F5',paddingBottom:0}}>
        {tabs.map(t=>(
          <button key={t.id} style={tabStyle(t.id)} onClick={()=>setTabActivo(t.id)} type="button">
            {t.label}
            {t.errores > 0 && (
              <span style={{
                display:'inline-flex',alignItems:'center',justifyContent:'center',
                width:16,height:16,borderRadius:'50%',background:'#E74C3C',color:'#fff',
                fontSize:'.65rem',fontWeight:800,marginLeft:5,
              }}>{t.errores}</span>
            )}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{paddingTop:16}}>

          {/* ── Tab: Datos del Alumno ── */}
          {tabActivo === 'datos' && (
            <div style={S.grid}>
              <Field label="Nombre Completo" required error={errors.nombre_completo}>
                <input style={S.inp(errors.nombre_completo)} name="nombre_completo" value={formData.nombre_completo} onChange={handleChange} placeholder="Ej: María López González"/>
              </Field>
              <Field label="Fecha de Nacimiento" required error={errors.fecha_nacimiento}>
                <input type="date" style={S.inp(errors.fecha_nacimiento)} name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} max={`${CURRENT_YEAR}-12-31`}/>
              </Field>
              <Field label="Edad (calculada automáticamente)">
                <input style={{...S.inpRO, color: parseInt(formData.edad)<4||parseInt(formData.edad)>18?'#E74C3C':'#6C4FBF'}} value={formData.edad!==''?`${formData.edad} años`:''} readOnly/>
              </Field>
              <Field label="Género" required error={errors.genero}>
                <select style={S.sel(errors.genero)} name="genero" value={formData.genero} onChange={handleChange}>
                  <option value="">Seleccionar...</option>
                  <option>Masculino</option><option>Femenino</option><option>Otro</option>
                </select>
              </Field>
              <Field label="Número de Acta de Nacimiento" required error={errors.id_documento}>
                <input style={S.inp(errors.id_documento)} name="id_documento" value={formData.id_documento} onChange={handleNumericChange} inputMode="numeric" placeholder="Solo números"/>
              </Field>
              <Field label="Estado del Alumno">
                <select style={S.sel(false)} name="estado" value={formData.estado} onChange={handleChange}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </Field>
              <Field label="Dirección de Residencia" required error={errors.residencia_direccion} full>
                <input style={S.inp(errors.residencia_direccion)} name="residencia_direccion" value={formData.residencia_direccion} onChange={handleChange} placeholder="Colonia, Calle, Número de casa..."/>
              </Field>
              <Field label="Teléfono del Alumno">
                <input style={S.inp(false)} name="telefono_alumno" value={formData.telefono_alumno} onChange={handlePhoneChange} inputMode="numeric" maxLength="15" placeholder="Solo números"/>
              </Field>
              <div style={{...S.field, gridColumn:'1/-1'}}>
                <label style={S.label}>Foto del Alumno</label>
                {formData.foto_preview ? (
                  <div style={{textAlign:'center'}}>
                    <img src={formData.foto_preview} alt="Preview" style={{maxWidth:150,maxHeight:150,borderRadius:10,objectFit:'cover',border:'2px solid #E0D9F5',marginBottom:10}}/>
                    <div style={{display:'flex',gap:10,justifyContent:'center'}}>
                      <button type="button" onClick={eliminarFoto} style={S.btn('#FDE8E8','#E74C3C')}><Trash2 size={14}/> Eliminar</button>
                      <input type="file" accept="image/*" onChange={handleFotoChange} style={{display:'none'}} id="sf-foto-replace"/>
                      <label htmlFor="sf-foto-replace" style={{...S.btn('#EDE9FF','#6C4FBF'),cursor:'pointer'}}><Upload size={14}/> Cambiar</label>
                    </div>
                  </div>
                ) : (
                  <div style={S.upload}>
                    <Upload size={32} color="#8B6FDF" style={{marginBottom:6}}/>
                    <p style={{color:'#7A6FA0',marginBottom:10,fontSize:'.88rem'}}>Arrastra una imagen o haz clic para seleccionar</p>
                    <input type="file" accept="image/*" onChange={handleFotoChange} style={{display:'none'}} id="sf-foto-new"/>
                    <label htmlFor="sf-foto-new" style={{...S.btn('#6C4FBF'),cursor:'pointer'}}><ImagePlus size={14}/> Seleccionar imagen</label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Tab: Datos Médicos ── */}
          {tabActivo === 'medicos' && (
            <>
              <div style={S.info}>ℹ Esta información es confidencial y de uso exclusivo del personal autorizado.</div>
              <div style={S.grid}>
                <Field label="Alergias conocidas" full>
                  <textarea style={S.ta(false)} name="alergias" value={formData.alergias} onChange={handleChange} placeholder="Ej: Polen, Penicilina, Mariscos, látex... Describe síntomas si los conoces."/>
                </Field>
                <Field label="Enfermedades crónicas o condiciones de salud" full>
                  <textarea style={S.ta(false)} name="enfermedades" value={formData.enfermedades} onChange={handleChange} placeholder="Ej: Asma (leve/moderado/severo), Diabetes tipo 1, Epilepsia, TDAH..."/>
                </Field>
                <Field label="Medicamentos actuales (nombre, dosis y frecuencia)" full>
                  <textarea style={S.ta(false)} name="medicamentos" value={formData.medicamentos} onChange={handleChange} placeholder="Ej: Salbutamol 100mcg — 2 inhalaciones si hay crisis. Ritalín 10mg — 1 tableta en la mañana."/>
                </Field>
                <Field label="Nombre del Pediatra / Médico tratante">
                  <input style={S.inp(false)} name="pediatra_nombre" value={formData.pediatra_nombre} onChange={handleChange} placeholder="Dr./Dra. Nombre Completo"/>
                </Field>
                <Field label="Teléfono del Pediatra / Médico">
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <Phone size={16} color="#7A6FA0" style={{flexShrink:0}}/>
                    <input style={S.inp(false)} name="pediatra_telefono" value={formData.pediatra_telefono} onChange={handlePhoneChange} inputMode="numeric" maxLength="15" placeholder="Solo números"/>
                  </div>
                </Field>
                <div style={S.field}>
                  <label style={S.label}>Esquema de vacunas</label>
                  <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:700,paddingTop:6}}>
                    <input type="checkbox" name="vacunas_al_dia" checked={!!formData.vacunas_al_dia} onChange={handleChange} style={{width:16,height:16,accentColor:'#6C4FBF'}}/>
                    Vacunas al día
                  </label>
                </div>
                <Field label="Contacto de Emergencia (nombre)" error={errors.contacto_emergencia_nombre}>
                  <input style={S.inp(errors.contacto_emergencia_nombre)} name="contacto_emergencia_nombre" value={formData.contacto_emergencia_nombre} onChange={handleChange}/>
                </Field>
                <Field label="Teléfono de Emergencia" error={errors.contacto_emergencia_telefono}>
                  <input style={S.inp(errors.contacto_emergencia_telefono)} name="contacto_emergencia_telefono" value={formData.contacto_emergencia_telefono} onChange={handlePhoneChange} inputMode="numeric" maxLength="15"/>
                </Field>
              </div>
            </>
          )}

          {/* ── Tab: Académico ── */}
          {tabActivo === 'academico' && (
            <div style={S.grid}>
              <Field label="Grado a Matricular" required error={errors.grado_a_matricular}>
                <select style={S.sel(errors.grado_a_matricular)} name="grado_a_matricular" value={formData.grado_a_matricular} onChange={handleChange} disabled={loadingGrados}>
                  <option value="">{loadingGrados?'Cargando...':'Seleccionar grado...'}</option>
                  {grados.map(g=><option key={g._id} value={g._id}>{g.nombre}</option>)}
                </select>
              </Field>
              <Field label="Escuela Anterior">
                <input style={S.inp(false)} name="escuela_anterior" value={formData.escuela_anterior} onChange={handleChange}/>
              </Field>
              <Field label="Notas del Grado Anterior" full>
                <textarea style={S.ta(false)} name="notas_grado_anterior" value={formData.notas_grado_anterior} onChange={handleChange} placeholder="Observaciones o notas académicas del período anterior..."/>
              </Field>
            </div>
          )}

          {/* ── Tab: Encargados ── */}
          {tabActivo === 'encargados' && (
            <>
              <div style={S.info}>
                ℹ Todos los campos marcados con <span style={{color:'#E74C3C',fontWeight:700}}>*</span> son obligatorios para cada encargado. Puedes registrar hasta 3 encargados.
              </div>
              {formData.encargados.map((enc, i) => (
                <div key={i} style={{
                  ...S.card,
                  border: Object.keys(errors).some(k => k.startsWith(`enc_${i}_`)) ? '2px solid #E74C3C' : '1px solid #E0D9F5',
                  background: Object.keys(errors).some(k => k.startsWith(`enc_${i}_`)) ? '#FFF8F8' : '#F4F3FB',
                }}>
                  <div style={S.cardTitle}>
                    <User size={14}/>
                    Encargado {i + 1}{i===0?' (Principal)':''}
                    {enc.parentesco_encargado && ` — ${enc.parentesco_encargado}`}
                    {Object.keys(errors).some(k => k.startsWith(`enc_${i}_`)) && (
                      <span style={{background:'#E74C3C',color:'#fff',borderRadius:20,padding:'1px 8px',fontSize:'.7rem',marginLeft:4}}>
                        Datos faltantes
                      </span>
                    )}
                  </div>
                  {formData.encargados.length > 1 && (
                    <button type="button" style={S.delBtn} onClick={() => removeEncargado(i)}>
                      <X size={12}/> Quitar
                    </button>
                  )}
                  <div style={S.grid}>
                    <Field label="Nombre Completo" required error={errors[`enc_${i}_nombre`]}>
                      <input style={S.inp(errors[`enc_${i}_nombre`])} value={enc.nombre_encargado} onChange={e=>updateEncargado(i,'nombre_encargado',e.target.value)} placeholder="Nombre completo del encargado"/>
                    </Field>

                    <Field label="Parentesco" required error={errors[`enc_${i}_parentesco`]}>
                      {loadingCats ? (
                        <input style={{...S.inp(false), color:'#aaa'}} value="Cargando catálogo..." readOnly/>
                      ) : (
                        <select
                          style={S.sel(errors[`enc_${i}_parentesco`])}
                          value={enc.parentesco_encargado}
                          onChange={e => updateEncargado(i, 'parentesco_encargado', e.target.value)}
                        >
                          <option value="">Seleccionar parentesco...</option>
                          {catParentescos.map(p => (
                            <option key={p.valor} value={p.valor}>{p.etiqueta}</option>
                          ))}
                        </select>
                      )}
                      {!loadingCats && !errors[`enc_${i}_parentesco`] && (
                        <span style={S.hint}>Valores administrables en Mantenimiento → Matrícula → Parentesco</span>
                      )}
                    </Field>

                    {/* Documento de identidad — ahora OBLIGATORIO */}
                    <Field label="Documento de Identidad" required error={errors[`enc_${i}_id`]}>
                      <input
                        style={S.inp(errors[`enc_${i}_id`])}
                        value={enc.id_documento_encargado}
                        onChange={e=>updateEncargado(i,'id_documento_encargado',e.target.value.replace(/\D/g,''))}
                        inputMode="numeric" maxLength="20"
                        placeholder="Solo números"
                      />
                    </Field>

                    {/* Teléfono — OBLIGATORIO */}
                    <Field label="Teléfono" required error={errors[`enc_${i}_telefono`]}>
                      <input
                        style={S.inp(errors[`enc_${i}_telefono`])}
                        value={enc.telefono_encargado}
                        onChange={e=>updateEncargado(i,'telefono_encargado',e.target.value.replace(/[^\d]/g,''))}
                        inputMode="numeric" maxLength="15"
                        placeholder="Solo números"
                      />
                    </Field>

                    <Field label="Email (opcional)" error={errors[`enc_${i}_email`]} full>
                      <input type="email" style={S.inp(errors[`enc_${i}_email`])} value={enc.email_encargado} onChange={e=>updateEncargado(i,'email_encargado',e.target.value)} placeholder="nombre@correo.com"/>
                    </Field>
                  </div>
                </div>
              ))}
              {formData.encargados.length < 3 && (
                <button type="button" onClick={addEncargado}
                  style={{...S.btn('#EDE9FF','#6C4FBF'), border:'2px dashed #C4B5E8', borderRadius:10, padding:'10px 20px', width:'100%', justifyContent:'center', marginTop:4}}>
                  <Plus size={15}/> Agregar otro encargado ({formData.encargados.length}/3)
                </button>
              )}
            </>
          )}

          {/* ── Tab: TRANSPORTE ── */}
          {tabActivo === 'transporte' && (
            <>
              <div style={S.info}>
                <Bus size={16} style={{flexShrink:0}}/>
                <span>Registra aquí si el alumno utiliza servicio de transporte escolar o privado.</span>
              </div>

              {/* Toggle principal */}
              <div style={{...S.card, border: '2px solid #BFD7F0', background:'#F0F7FF', marginBottom:20}}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                  <div style={{display:'flex', alignItems:'center', gap:10}}>
                    <Bus size={20} color="#1a6ea8"/>
                    <div>
                      <div style={{fontWeight:700, color:'#1a6ea8', fontSize:'.92rem'}}>¿El alumno usa transporte?</div>
                      <div style={{fontSize:'.78rem', color:'#5a8ab0', marginTop:2}}>Activa esta opción para registrar los datos del servicio</div>
                    </div>
                  </div>
                  <label style={{display:'flex', alignItems:'center', gap:10, cursor:'pointer'}}>
                    <span style={{fontSize:'.85rem', fontWeight:700, color: formData.usa_transporte ? '#27AE60' : '#7A6FA0'}}>
                      {formData.usa_transporte ? 'Sí, usa transporte' : 'No usa transporte'}
                    </span>
                    <div
                      onClick={() => setFormData(p => ({...p, usa_transporte: !p.usa_transporte}))}
                      style={{
                        width:48, height:26, borderRadius:13,
                        background: formData.usa_transporte ? '#27AE60' : '#CBD5E0',
                        position:'relative', cursor:'pointer', transition:'background .2s',
                      }}
                    >
                      <div style={{
                        position:'absolute', top:3, left: formData.usa_transporte ? 25 : 3,
                        width:20, height:20, borderRadius:'50%', background:'#fff',
                        boxShadow:'0 2px 4px rgba(0,0,0,.2)', transition:'left .2s',
                      }}/>
                    </div>
                  </label>
                </div>
              </div>

              {formData.usa_transporte && (
                <>
                  {/* Datos del Conductor */}
                  <div style={S.transportCard}>
                    <div style={S.transportTitle}><User size={15}/> Datos del Conductor</div>
                    <div style={S.grid}>
                      <Field label="Nombre del Conductor" required error={errors.transporte_conductor_nombre}>
                        <input style={S.inp(errors.transporte_conductor_nombre)} name="transporte_conductor_nombre" value={formData.transporte_conductor_nombre} onChange={handleChange} placeholder="Nombre completo del conductor"/>
                      </Field>
                      <Field label="Teléfono del Conductor" required error={errors.transporte_conductor_telefono}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <Phone size={16} color="#1a6ea8" style={{flexShrink:0}}/>
                          <input style={S.inp(errors.transporte_conductor_telefono)} name="transporte_conductor_telefono" value={formData.transporte_conductor_telefono} onChange={handlePhoneChange} inputMode="numeric" maxLength="15" placeholder="Solo números"/>
                        </div>
                      </Field>
                    </div>
                  </div>

                  {/* Datos de la Ruta */}
                  <div style={S.transportCard}>
                    <div style={S.transportTitle}><Bus size={15}/> Datos de la Ruta</div>
                    <div style={S.grid}>
                      <Field label="Ruta / Número de Ruta" required error={errors.transporte_ruta}>
                        <input style={S.inp(errors.transporte_ruta)} name="transporte_ruta" value={formData.transporte_ruta} onChange={handleChange} placeholder="Ej: Ruta 12, Zona Norte..."/>
                      </Field>
                      <Field label="Placa del Vehículo">
                        <input style={S.inp(false)} name="transporte_placa" value={formData.transporte_placa} onChange={handleChange} placeholder="Ej: AAB-1234"/>
                      </Field>
                      <Field label="Empresa / Servicio de Transporte">
                        <input style={S.inp(false)} name="transporte_empresa" value={formData.transporte_empresa} onChange={handleChange} placeholder="Nombre de la empresa o 'Particular'"/>
                      </Field>
                      <Field label="Punto de Recogida">
                        <input style={S.inp(false)} name="transporte_punto_recogida" value={formData.transporte_punto_recogida} onChange={handleChange} placeholder="Dirección o punto de referencia"/>
                      </Field>
                      <Field label="Observaciones del Transporte" full>
                        <textarea style={S.ta(false)} name="transporte_observaciones" value={formData.transporte_observaciones} onChange={handleChange} placeholder="Horarios especiales, instrucciones al conductor, notas importantes..."/>
                      </Field>
                    </div>
                  </div>
                </>
              )}

              {!formData.usa_transporte && (
                <div style={{textAlign:'center', padding:'40px 20px', color:'#5a8ab0'}}>
                  <Bus size={48} style={{opacity:.2, marginBottom:12}}/>
                  <p style={{fontWeight:700}}>Sin transporte registrado</p>
                  <p style={{fontSize:'.84rem'}}>Activa la opción de arriba si el alumno utiliza transporte escolar o privado.</p>
                </div>
              )}
            </>
          )}

          {/* ── Tab: Documentos ── */}
          {tabActivo === 'documentos' && (
            <>
              <div style={S.info}>ℹ Adjunta documentos requeridos para la matrícula. Los archivos se guardan en Google Drive. Formatos: PDF, JPG, PNG · Máx. 10MB.</div>
              {formData.documentos.map((doc, i) => (
                <div key={i} style={{...S.card, display:'flex', alignItems:'center', gap:12}}>
                  <FileText size={20} color="#6C4FBF" style={{flexShrink:0}}/>
                  <div style={{flex:1}}>
                    {loadingCats ? (
                      <input style={{...S.inp(false), marginBottom:4, color:'#aaa'}} value="Cargando tipos..." readOnly/>
                    ) : (
                      <select style={{...S.sel(false), marginBottom:6}} value={doc.tipo} onChange={e => updateDocTipo(i, e.target.value)}>
                        {catTiposDoc.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    )}
                    {doc.archivoUrl ? (
                      <div style={{fontSize:'.8rem',display:'flex',alignItems:'center',gap:6}}>
                        <span style={{color:'#27AE60',fontWeight:700}}>✓ Guardado en Drive</span>
                        <span style={{color:'#aaa'}}>—</span>
                        <a href={doc.archivoUrl} target="_blank" rel="noopener noreferrer" style={{color:'#6C4FBF',fontWeight:700,textDecoration:'none'}}>
                          {catTiposDoc.find(t => t.value === doc.tipo)?.label || doc.tipo}
                        </a>
                      </div>
                    ) : (
                      <div style={{fontSize:'.8rem',color:'#7A6FA0',display:'flex',alignItems:'center',gap:6}}>
                        <span style={{color:'#F39C12',fontWeight:700}}>⏳ Pendiente de subir</span>
                        <span>— {doc.nombre} ({doc.tamaño})</span>
                      </div>
                    )}
                  </div>
                  <button type="button" style={S.delBtn} onClick={()=>removeDocumento(i)}><X size={12}/>Quitar</button>
                </div>
              ))}
              {formData.documentos.length < 6 && (
                <div style={S.upload}>
                  <FileText size={32} color="#8B6FDF" style={{marginBottom:6}}/>
                  <p style={{color:'#7A6FA0',marginBottom:10,fontSize:'.88rem'}}>Los documentos se guardan automáticamente en Google Drive</p>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={addDocumento} style={{display:'none'}} id="sf-doc-new"/>
                  <label htmlFor="sf-doc-new" style={{...S.btn('#6C4FBF'),cursor:'pointer'}}><Upload size={14}/> Seleccionar documento</label>
                  <small style={{display:'block',marginTop:10,color:'#aaa',fontSize:'.8rem'}}>PDF, JPG, PNG · Máx. 10MB · Máx. 6 documentos</small>
                </div>
              )}
            </>
          )}
        </div>

        {/* Botones de acción */}
        <div style={S.foot}>
          <div>{isEdit&&onDelete&&<button type="button" style={S.btn('#E74C3C')} onClick={onDelete}><Trash2 size={14}/> Eliminar</button>}</div>
          <div style={{display:'flex',gap:10}}>
            <button type="button" style={S.btn('#E0D9F5','#6C4FBF')} onClick={onCancel}>Cancelar</button>
            <button type="submit" style={S.btn('#6C4FBF')}>
              {isEdit ? '✓ Guardar Cambios' : '✓ Registrar Matrícula'}
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default StudentForm;