// ============================================================
// StudentForm.jsx — Formulario de expediente del alumno
//
// Adaptado al modelo Estudiante.js real del backend.
// Los campos nuevos (alergias, enfermedades, medicamentos,
// pediatra, vacunas_al_dia, estado, anio_matricula,
// creado_por) se envían en req.body via FormData y el
// controlador los acepta con { ...req.body }.
//
// CORRECCIONES:
// #4  — Campos médicos: alergias, enfermedades, medicamentos,
//        pediatra, vacunas_al_dia
// #5  — Campo estado: activo / inactivo
// #6  — Errores específicos por campo con lista detallada
// #9  — Validación edad entre 4 y 18 años
// #10 — Etiquetas diferenciadas de teléfonos
// #11 — Parentesco completo
// ============================================================
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, ImagePlus, Upload } from 'lucide-react';
import axios from 'axios';
import { auth } from '../components/authentication/Auth';

const API_HOST   = process.env.REACT_APP_API_URL;
const API_GRADOS = `${API_HOST}/api/grados`;
const CURRENT_YEAR = new Date().getFullYear();

// ── Calcula edad desde fecha de nacimiento ───────────────────
const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return '';
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const mes = hoy.getMonth() - nac.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
};

// Estado inicial alineado con el modelo Estudiante.js
const INIT_STATE = {
  // Modelo original
  nombre_completo:         '',
  fecha_nacimiento:        '',
  edad:                    '',
  genero:                  '',
  id_documento:            '',
  residencia_direccion:    '',
  telefono_alumno:         '',   // FIX #10
  grado_a_matricular:      '',
  escuela_anterior:        '',
  notas_grado_anterior:    '',
  nombre_encargado:        '',
  parentesco_encargado:    '',   // FIX #11
  id_documento_encargado:  '',
  telefono_encargado:      '',   // FIX #10
  email_encargado:         '',
  contacto_emergencia_nombre:    '',
  contacto_emergencia_telefono:  '',
  imagen:                  null,
  foto_preview:            null,
  // Campos nuevos (aceptados via ...req.body en el controlador)
  estado:          'activo',     // FIX #5
  alergias:        '',           // FIX #4
  enfermedades:    '',           // FIX #4
  medicamentos:    '',           // FIX #4
  pediatra:        '',           // FIX #4
  vacunas_al_dia:  false,        // FIX #4
};

// ── Estilos ──────────────────────────────────────────────────
const S = {
  sec:    { marginBottom: 24 },
  title:  { display:'flex', alignItems:'center', gap:8, fontFamily:'Poppins,sans-serif', fontSize:'.88rem', fontWeight:700, color:'#6C4FBF', marginBottom:12, paddingBottom:8, borderBottom:'2px solid #E0D9F5' },
  grid:   { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:13 },
  full:   { gridColumn: '1/-1' },
  field:  { display:'flex', flexDirection:'column', gap:4 },
  label:  { fontSize:'.77rem', fontWeight:700, color:'#7A6FA0', textTransform:'uppercase', letterSpacing:'.04em' },
  req:    { color:'#E74C3C' },
  inp:    (e) => ({
    padding:'9px 12px',
    border:`2px solid ${e?'#E74C3C':'#E0D9F5'}`,
    borderRadius:8, fontFamily:'inherit', fontSize:'.88rem',
    color:'#2D2250', background:e?'#FFF8F8':'#FAF9FF',
    outline:'none', width:'100%', transition:'border-color .2s',
  }),
  inpRO:  { padding:'9px 12px', border:'2px solid #E0D9F5', borderRadius:8, fontFamily:'inherit', fontSize:'.88rem', color:'#6C4FBF', fontWeight:700, background:'#F0ECFF', outline:'none', width:'100%' },
  sel:    (e) => ({
    padding:'9px 12px',
    border:`2px solid ${e?'#E74C3C':'#E0D9F5'}`,
    borderRadius:8, fontFamily:'inherit', fontSize:'.88rem',
    color:'#2D2250', background:'#FAF9FF', outline:'none', width:'100%',
  }),
  ta:     { padding:'9px 12px', border:'2px solid #E0D9F5', borderRadius:8, fontFamily:'inherit', fontSize:'.88rem', color:'#2D2250', background:'#FAF9FF', outline:'none', width:'100%', resize:'vertical', minHeight:70 },
  errMsg: { fontSize:'.73rem', color:'#E74C3C', fontWeight:600 },
  banner: { display:'flex', gap:10, alignItems:'flex-start', padding:'11px 14px', borderRadius:10, marginBottom:14, fontSize:'.85rem', background:'#FDE8E8', borderLeft:'4px solid #E74C3C', color:'#7a1010' },
  info:   { display:'flex', gap:10, alignItems:'flex-start', padding:'10px 14px', borderRadius:9, marginBottom:12, fontSize:'.84rem', background:'#E8F4FD', borderLeft:'4px solid #2980B9', color:'#0c4a6e' },
  foot:   { display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:16, borderTop:'1px solid #E0D9F5', marginTop:8 },
  btn:    (bg, col='#fff') => ({
    display:'inline-flex', alignItems:'center', gap:7,
    padding:'10px 20px', borderRadius:10, fontSize:'.86rem',
    fontWeight:700, border:'none', cursor:'pointer',
    background:bg, color:col, fontFamily:'inherit', transition:'all .18s',
  }),
  upload: { border:'2px dashed #C4B5E8', borderRadius:12, padding:'26px 20px', textAlign:'center', background:'#FAF9FF' },
};

const Field = ({ label, required, error, full, children }) => (
  <div style={{ ...S.field, ...(full ? S.full : {}) }}>
    <label style={S.label}>{label}{required&&<span style={S.req}> *</span>}</label>
    {children}
    {error&&<span style={S.errMsg}>{error}</span>}
  </div>
);

// ============================================================
const StudentForm = ({ student, onSubmit, onCancel, onDelete, isEdit = false }) => {
  const [formData, setFormData]               = useState({ ...INIT_STATE });
  const [errors, setErrors]                   = useState({});
  const [showNotification, setShowNotification] = useState(false);
  const [grados, setGrados]                   = useState([]);
  const [loadingGrados, setLoadingGrados]     = useState(false);

  // ── Obtener grados (idéntico al original) ────────────────
  const obtenerGrados = async () => {
    try {
      setLoadingGrados(true);
      const user  = auth.currentUser;
      const token = await user.getIdToken();
      const res   = await axios.get(API_GRADOS, { headers: { Authorization: `Bearer ${token}` } });
      setGrados(res.data.items.map(i => ({ _id: i._id, nombre: i.grado })));
    } catch (error) {
      console.error('Error al cargar los grados:', error);
      setGrados([
        {_id:'1',nombre:'Primer Grado'}, {_id:'2',nombre:'Segundo Grado'},
        {_id:'3',nombre:'Tercer Grado'}, {_id:'4',nombre:'Cuarto Grado'},
        {_id:'5',nombre:'Quinto Grado'}, {_id:'6',nombre:'Sexto Grado'},
      ]);
    } finally { setLoadingGrados(false); }
  };

  useEffect(() => { obtenerGrados(); }, []);

  // ── Cargar datos al editar ───────────────────────────────
  useEffect(() => {
    if (student) {
      const f = { ...INIT_STATE, ...student };
      if (student.fecha_nacimiento) {
        f.fecha_nacimiento = student.fecha_nacimiento.split('T')[0];
        f.edad = calcularEdad(f.fecha_nacimiento);
      }
      // Booleano desde string que puede venir de MongoDB
      f.vacunas_al_dia = student.vacunas_al_dia === true || student.vacunas_al_dia === 'true';
      f.foto_preview = student.imagen && student.imagen !== 'null'
        ? `data:image/png;base64,${student.imagen}` : null;
      setFormData(f);
    }
  }, [student]);

  // ── Handlers ────────────────────────────────────────────
  const clrErr = (name) => {
    if (errors[name]) setErrors(p => { const n={...p}; delete n[name]; return n; });
  };

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

  // ── Foto ────────────────────────────────────────────────
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
    if (formData.foto_preview && !formData.foto_preview.startsWith('data:')) {
      URL.revokeObjectURL(formData.foto_preview);
    }
    setFormData(p => ({ ...p, imagen: null, foto_preview: null }));
  };

  // ── Validación — FIX #6, #9 ─────────────────────────────
  const validateForm = () => {
    const newErrors = {};

    // Campos requeridos con mensajes específicos — FIX #6
    const requeridos = {
      nombre_completo:        'El nombre completo',
      fecha_nacimiento:       'La fecha de nacimiento',
      genero:                 'El género',
      id_documento:           'El número de acta de nacimiento',
      residencia_direccion:   'La dirección de residencia',
      grado_a_matricular:     'El grado a matricular',
      nombre_encargado:       'El nombre del encargado',
      parentesco_encargado:   'El parentesco del encargado',
      id_documento_encargado: 'El documento del encargado',
      telefono_encargado:     'El teléfono del encargado',
    };
    Object.entries(requeridos).forEach(([f, lbl]) => {
      if (!formData[f]?.toString().trim()) newErrors[f] = `${lbl} es requerido`;
    });

    // Solo letras
    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    ['nombre_completo','nombre_encargado','contacto_emergencia_nombre'].forEach(f => {
      if (formData[f] && !soloLetras.test(formData[f]))
        newErrors[f] = 'Este campo solo debe contener letras';
    });

    // Solo números en documentos
    const soloNums = /^\d+$/;
    ['id_documento','id_documento_encargado'].forEach(f => {
      if (formData[f] && !soloNums.test(formData[f]))
        newErrors[f] = 'El documento debe contener solo números';
    });

    // Email — FIX #6
    if (formData.email_encargado && !/\S+@\S+\.\S+/.test(formData.email_encargado))
      newErrors.email_encargado = 'El formato del email no es válido (ej: nombre@correo.com)';

    // Teléfonos mínimo 8 — FIX #6
    ['telefono_alumno','telefono_encargado','contacto_emergencia_telefono'].forEach(f => {
      if (formData[f] && formData[f].length < 8)
        newErrors[f] = 'El teléfono debe tener al menos 8 dígitos';
    });

    // FIX #9: validación de edad entre 4 y 18
    const edad = parseInt(formData.edad);
    if (formData.fecha_nacimiento) {
      if (isNaN(edad)) {
        newErrors.fecha_nacimiento = 'La fecha ingresada no es válida';
      } else if (edad < 4) {
        newErrors.fecha_nacimiento = `Edad calculada: ${edad} años. El mínimo permitido es 4 años`;
      } else if (edad > 18) {
        newErrors.fecha_nacimiento = `Edad calculada: ${edad} años. El máximo permitido es 18 años`;
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 6000);
    }
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const clean = { ...formData };
    delete clean.foto_preview;
    if (isEdit && !(clean.imagen instanceof File)) delete clean.imagen;
    onSubmit(clean);
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <>
      {/* FIX #6: banner con lista de errores específicos */}
      {showNotification && (
        <div style={S.banner}>
          ⚠
          <div style={{flex:1}}>
            <strong>Hay {Object.keys(errors).length} error(es) en el formulario:</strong>
            <ul style={{margin:'5px 0 0 0',paddingLeft:18,fontSize:'.82rem',lineHeight:1.6}}>
              {Object.values(errors).slice(0,6).map((e,i)=><li key={i}>{e}</li>)}
              {Object.keys(errors).length>6&&<li>...y {Object.keys(errors).length-6} más</li>}
            </ul>
          </div>
          <button style={{border:'none',background:'none',cursor:'pointer',color:'#7a1010',fontSize:'1.1rem',flexShrink:0}}
            onClick={()=>setShowNotification(false)}>×</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="student-form">
        <div className="form-sections">

          {/* ── Sección 1: Datos del Alumno ── */}
          <div style={S.sec}>
            <div style={S.title}>👤 Datos del Alumno</div>
            <div style={S.grid}>

              <Field label="Nombre Completo" required error={errors.nombre_completo}>
                <input style={S.inp(errors.nombre_completo)} name="nombre_completo"
                  value={formData.nombre_completo} onChange={handleChange}/>
              </Field>

              <Field label="Fecha de Nacimiento" required error={errors.fecha_nacimiento}>
                <input type="date" style={S.inp(errors.fecha_nacimiento)} name="fecha_nacimiento"
                  value={formData.fecha_nacimiento} onChange={handleChange}
                  max={`${CURRENT_YEAR}-12-31`} min={`${CURRENT_YEAR-100}-01-01`}/>
              </Field>

              {/* FIX #9: edad calculada con validación visual */}
              <Field label="Edad (calculada automáticamente)">
                <input style={{
                  ...S.inpRO,
                  color: parseInt(formData.edad) < 4 || parseInt(formData.edad) > 18 ? '#E74C3C' : '#6C4FBF'
                }}
                  value={formData.edad !== '' ? `${formData.edad} años` : ''} readOnly/>
              </Field>

              <Field label="Género" required error={errors.genero}>
                <select style={S.sel(errors.genero)} name="genero" value={formData.genero} onChange={handleChange}>
                  <option value="">Seleccionar...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </Field>

              <Field label="Número de Acta de Nacimiento" required error={errors.id_documento}>
                <input style={S.inp(errors.id_documento)} name="id_documento"
                  value={formData.id_documento} onChange={handleNumericChange} inputMode="numeric"/>
              </Field>

              {/* FIX #5: campo estado */}
              <Field label="Estado del Alumno">
                <select style={S.sel(false)} name="estado" value={formData.estado} onChange={handleChange}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo — Baja temporal o definitiva</option>
                </select>
              </Field>

              <Field label="Dirección de Residencia" required error={errors.residencia_direccion} full>
                <input style={S.inp(errors.residencia_direccion)} name="residencia_direccion"
                  value={formData.residencia_direccion} onChange={handleChange}/>
              </Field>

              {/* FIX #10: etiqueta diferenciada */}
              <Field label="Teléfono del Alumno (no del encargado)" error={errors.telefono_alumno}>
                <input style={S.inp(errors.telefono_alumno)} name="telefono_alumno"
                  value={formData.telefono_alumno} onChange={handlePhoneChange}
                  inputMode="numeric" maxLength="15" placeholder="Solo números"/>
              </Field>

            </div>
          </div>

          {/* ── Sección 2: Datos Médicos — FIX #4 ── */}
          <div style={S.sec}>
            <div style={S.title}>🏥 Datos Médicos / Expediente de Salud</div>
            <div style={S.info}>
              ℹ Esta información es confidencial y su registro es
              <strong> obligación legal</strong> de la institución.
            </div>
            <div style={S.grid}>

              <Field label="Alergias conocidas">
                <input style={S.inp(false)} name="alergias" value={formData.alergias}
                  onChange={handleChange} placeholder="Ej: Polen, Penicilina, Mariscos..."/>
              </Field>

              <Field label="Enfermedades crónicas">
                <input style={S.inp(false)} name="enfermedades" value={formData.enfermedades}
                  onChange={handleChange} placeholder="Ej: Asma, Diabetes..."/>
              </Field>

              <Field label="Medicamentos que toma actualmente">
                <input style={S.inp(false)} name="medicamentos" value={formData.medicamentos}
                  onChange={handleChange} placeholder="Medicamento y dosis"/>
              </Field>

              <Field label="Nombre del Pediatra / Médico">
                <input style={S.inp(false)} name="pediatra" value={formData.pediatra}
                  onChange={handleChange}/>
              </Field>

              <div style={S.field}>
                <label style={S.label}>Esquema de vacunas</label>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:700,paddingTop:6}}>
                  <input type="checkbox" name="vacunas_al_dia" checked={!!formData.vacunas_al_dia}
                    onChange={handleChange} style={{width:16,height:16,accentColor:'#6C4FBF'}}/>
                  Vacunas al día
                </label>
              </div>

            </div>
          </div>

          {/* ── Sección 3: Datos Académicos ── */}
          <div style={S.sec}>
            <div style={S.title}>📚 Datos Académicos</div>
            <div style={S.grid}>

              <Field label="Grado a Matricular" required error={errors.grado_a_matricular}>
                <select style={S.sel(errors.grado_a_matricular)} name="grado_a_matricular"
                  value={formData.grado_a_matricular} onChange={handleChange} disabled={loadingGrados}>
                  <option value="">{loadingGrados?'Cargando grados...':'Seleccionar grado...'}</option>
                  {grados.map(g=><option key={g._id} value={g._id}>{g.nombre}</option>)}
                </select>
              </Field>

              <Field label="Escuela Anterior">
                <input style={S.inp(false)} name="escuela_anterior"
                  value={formData.escuela_anterior} onChange={handleChange}/>
              </Field>

              <Field label="Notas del Grado Anterior" full>
                <textarea style={S.ta} name="notas_grado_anterior"
                  value={formData.notas_grado_anterior} onChange={handleChange}
                  placeholder="Observaciones o notas académicas del período anterior..."/>
              </Field>

            </div>
          </div>

          {/* ── Sección 4: Encargado — FIX #10, #11 ── */}
          <div style={S.sec}>
            <div style={S.title}>👨‍👩‍👦 Datos del Padre / Encargado</div>
            <div style={S.grid}>

              <Field label="Nombre Completo del Encargado" required error={errors.nombre_encargado}>
                <input style={S.inp(errors.nombre_encargado)} name="nombre_encargado"
                  value={formData.nombre_encargado} onChange={handleChange}/>
              </Field>

              {/* FIX #11: lista completa de parentescos */}
              <Field label="Parentesco con el Alumno" required error={errors.parentesco_encargado}>
                <select style={S.sel(errors.parentesco_encargado)} name="parentesco_encargado"
                  value={formData.parentesco_encargado} onChange={handleChange}>
                  <option value="">Seleccionar parentesco...</option>
                  <option value="Padre">Padre</option>
                  <option value="Madre">Madre</option>
                  <option value="Abuelo">Abuelo</option>
                  <option value="Abuela">Abuela</option>
                  <option value="Tío">Tío</option>
                  <option value="Tía">Tía</option>
                  <option value="Hermano">Hermano</option>
                  <option value="Hermana">Hermana</option>
                  <option value="Tutor Legal">Tutor Legal</option>
                  <option value="Otro">Otro</option>
                </select>
              </Field>

              <Field label="Documento de Identificación del Encargado" required error={errors.id_documento_encargado}>
                <input style={S.inp(errors.id_documento_encargado)} name="id_documento_encargado"
                  value={formData.id_documento_encargado} onChange={handleNumericChange}
                  inputMode="numeric" pattern="[0-9]*" maxLength="20"/>
              </Field>

              {/* FIX #10: etiqueta diferenciada */}
              <Field label="Teléfono del Encargado" required error={errors.telefono_encargado}>
                <input style={S.inp(errors.telefono_encargado)} name="telefono_encargado"
                  value={formData.telefono_encargado} onChange={handlePhoneChange}
                  inputMode="numeric" maxLength="15" placeholder="Solo números"/>
              </Field>

              <Field label="Email del Encargado" error={errors.email_encargado} full>
                <input type="email" style={S.inp(errors.email_encargado)} name="email_encargado"
                  value={formData.email_encargado} onChange={handleChange}
                  placeholder="nombre@correo.com"/>
              </Field>

            </div>
          </div>

          {/* ── Sección 5: Contacto de Emergencia ── */}
          <div style={S.sec}>
            <div style={S.title}>🚨 Contacto de Emergencia (diferente al encargado)</div>
            <div style={S.grid}>

              <Field label="Nombre del Contacto" error={errors.contacto_emergencia_nombre}>
                <input style={S.inp(errors.contacto_emergencia_nombre)} name="contacto_emergencia_nombre"
                  value={formData.contacto_emergencia_nombre} onChange={handleChange}/>
              </Field>

              <Field label="Teléfono de Emergencia" error={errors.contacto_emergencia_telefono}>
                <input style={S.inp(errors.contacto_emergencia_telefono)} name="contacto_emergencia_telefono"
                  value={formData.contacto_emergencia_telefono} onChange={handlePhoneChange}
                  inputMode="numeric" maxLength="15" placeholder="Solo números"/>
              </Field>

              {/* Foto — igual que el original */}
              <div style={{...S.field, gridColumn:'1/-1'}}>
                <label style={{...S.label,display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                  <ImagePlus size={14}/> Foto del Alumno
                </label>
                {formData.foto_preview ? (
                  <div style={{textAlign:'center'}}>
                    <img src={formData.foto_preview} alt="Preview"
                      style={{maxWidth:150,maxHeight:150,borderRadius:10,objectFit:'cover',border:'2px solid #E0D9F5',marginBottom:10}}/>
                    <div style={{display:'flex',gap:10,justifyContent:'center'}}>
                      <motion.button type="button" onClick={eliminarFoto}
                        whileHover={{scale:1.04}} whileTap={{scale:.96}}
                        style={S.btn('#FDE8E8','#E74C3C')}>
                        <Trash2 size={14}/> Eliminar foto
                      </motion.button>
                      <input type="file" accept="image/*" onChange={handleFotoChange}
                        style={{display:'none'}} id="sf-foto-replace"/>
                      <label htmlFor="sf-foto-replace"
                        style={{...S.btn('#EDE9FF','#6C4FBF'),cursor:'pointer'}}>
                        <Upload size={14}/> Cambiar foto
                      </label>
                    </div>
                  </div>
                ) : (
                  <div style={S.upload}>
                    <Upload size={36} color="#8B6FDF" style={{marginBottom:8}}/>
                    <p style={{color:'#7A6FA0',marginBottom:12,fontSize:'.88rem'}}>
                      Arrastra una imagen o haz clic para seleccionar
                    </p>
                    <input type="file" accept="image/*" onChange={handleFotoChange}
                      style={{display:'none'}} id="sf-foto-new"/>
                    <label htmlFor="sf-foto-new"
                      style={{...S.btn('#6C4FBF'),cursor:'pointer'}}>
                      <ImagePlus size={15}/> Seleccionar imagen
                    </label>
                    <small style={{display:'block',marginTop:10,color:'#aaa',fontSize:'.8rem'}}>
                      Formatos: JPG, PNG · Máx. 5MB
                    </small>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>{/* /form-sections */}

        {/* Botones de acción */}
        <div style={S.foot}>
          <div>
            {isEdit && onDelete && (
              <button type="button" style={S.btn('#E74C3C')} onClick={onDelete}>
                <Trash2 size={15}/> Eliminar
              </button>
            )}
          </div>
          <div style={{display:'flex',gap:10}}>
            <button type="button" style={S.btn('#E0D9F5','#6C4FBF')} onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" style={S.btn('#6C4FBF')}>
              <i className="fas fa-save"/> {isEdit?'Actualizar':'Guardar'}
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default StudentForm;