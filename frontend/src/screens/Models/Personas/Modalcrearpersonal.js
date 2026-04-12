// ============================================================
// ModalCrearPersonal.jsx
// Modal para crear empleado con upload de documentos a Drive
// Catálogos dinámicos desde API (igual que Bienes)
// ============================================================
import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Users, Upload, X, Plus, Trash2, FileText, AlertCircle, Camera } from "lucide-react";

const TIPOS_DOC = [
  { value: "DPI",          label: "DPI / Cédula"          },
  { value: "PASAPORTE",    label: "Pasaporte"              },
  { value: "LICENCIA",     label: "Licencia de Conducir"   },
  { value: "ANTECEDENTES", label: "Antecedentes Penales"   },
  { value: "TITULO",       label: "Título Académico"       },
  { value: "CERTIFICADO",  label: "Certificado"            },
  { value: "CONTRATO",     label: "Contrato"               },
  { value: "OTRO",         label: "Otro"                   },
];

const NIVELES = ["BASICO","INTERMEDIO","AVANZADO","EXPERTO"];
const ESTADOS = ["ACTIVO","VACACIONES","LICENCIA","INACTIVO"];

const initForm = () => ({
  nombres: "", apellidos: "", numero_identidad: "",
  tipo_contrato: "", estado: "ACTIVO",
  area_trabajo: "", telefono: "", direccion_correo: "",
  salario: "", fecha_ingreso: "", fecha_salida: "", motivo_salida: "",
  cargo_asignacion: { cargo: "", horario_preferido: "", fecha_asignacion: "" },
});

const ModalCrearPersonal = ({
  onClose, onCreate,
  catTipoContrato = [],
  catAreaTrabajo  = [],
  catCargo        = [],
  catHorario      = [],
}) => {
  const [form,           setForm]           = useState(initForm());
  const [especialidades, setEspecialidades] = useState([]);
  const [documentos,     setDocumentos]     = useState([]);
  const [imagenPreview,  setImagenPreview]  = useState(null);
  const [imagenFile,     setImagenFile]     = useState(null);
  const [errors,         setErrors]         = useState({});
  const [tab,            setTab]            = useState("basico");
  const fileDocRef = useRef(null);
  const fileImgRef = useRef(null);

  const set      = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const setCargo = (field, val) => setForm(f => ({ ...f, cargo_asignacion: { ...f.cargo_asignacion, [field]: val } }));

  const handleImagen = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagenFile(file);
    setImagenPreview(URL.createObjectURL(file));
  };

  const addEsp = () => setEspecialidades(p => [...p, { nombre: "", nivel: "INTERMEDIO" }]);
  const setEsp = (i, field, val) => setEspecialidades(p => p.map((e, idx) => idx===i ? { ...e, [field]: val } : e));
  const delEsp = (i) => setEspecialidades(p => p.filter((_,idx) => idx !== i));

  const handleDocFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const nuevos = files.map(f => ({
      file: f, tipo_documento: "OTRO",
      descripcion: f.name.replace(/\.[^.]+$/, ""), preview: f.name
    }));
    setDocumentos(p => [...p, ...nuevos].slice(0, 10));
    e.target.value = "";
  };
  const setDoc = (i, field, val) => setDocumentos(p => p.map((d, idx) => idx===i ? { ...d, [field]: val } : d));
  const delDoc = (i) => setDocumentos(p => p.filter((_,idx) => idx !== i));

  const validate = () => {
    const e = {};
    if (!form.nombres.trim())           e.nombres = "Requerido";
    if (!form.apellidos.trim())         e.apellidos = "Requerido";
    if (!form.numero_identidad.trim())  e.numero_identidad = "Requerido";
    if (!form.tipo_contrato)            e.tipo_contrato = "Requerido";
    if (!form.telefono.trim())          e.telefono = "Requerido";
    if (!form.direccion_correo.trim())  e.direccion_correo = "Requerido";
    if (!form.cargo_asignacion.cargo)   e.cargo = "Requerido";
    if (!form.cargo_asignacion.horario_preferido) e.horario_preferido = "Requerido";
    if (!form.cargo_asignacion.fecha_asignacion)  e.fecha_asignacion = "Requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) { setTab("basico"); return; }
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === "cargo_asignacion") fd.append("cargo_asignacion", JSON.stringify(v));
      else if (v !== null && v !== undefined && v !== "") fd.append(k, v);
    });
    fd.append("especialidades", JSON.stringify(especialidades.filter(e => e.nombre.trim())));
    if (imagenFile) fd.append("imagen", imagenFile);
    const meta = documentos.map(d => ({ tipo_documento: d.tipo_documento, descripcion: d.descripcion }));
    fd.append("documentos_meta", JSON.stringify(meta));
    documentos.forEach(d => fd.append("documentos", d.file));
    onCreate(fd);
  };

  const TABS = [
    { id: "basico",  label: "Datos Básicos" },
    { id: "laboral", label: "Info Laboral"  },
    { id: "docs",    label: `Documentos (${documentos.length})` },
  ];

  return (
    <div className="per-modal-overlay">
      <motion.div className="per-modal lg" initial={{ opacity:0, y:-20, scale:0.96 }} animate={{ opacity:1, y:0, scale:1 }} transition={{ duration:0.25 }}>

        {/* Header */}
        <div className="per-modal-header">
          <h3 className="per-modal-title"><Users size={20}/> Nuevo Empleado</h3>
          <button className="per-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="per-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`per-tab${tab===t.id?" active":""}`} onClick={() => setTab(t.id)}>
              {t.label}
              {Object.keys(errors).length > 0 && t.id === "basico" && <span className="per-tab-err">!</span>}
            </button>
          ))}
        </div>

        <div className="per-modal-body">

          {/* ══ TAB: DATOS BÁSICOS ══ */}
          {tab === "basico" && (
            <>
              <div className="per-form-section">
                <div className="per-section-title"><Camera size={15}/> Foto de Perfil</div>
                <div className="per-upload-area" onClick={() => fileImgRef.current?.click()}>
                  {imagenPreview
                    ? <img src={imagenPreview} alt="preview" className="per-foto-preview"/>
                    : <><Camera size={32} color="#C4B5E8"/><p style={{ marginTop:8, color:"#aaa", fontSize:".83rem" }}>Haz clic para seleccionar foto</p></>
                  }
                  <input ref={fileImgRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleImagen}/>
                </div>
                {imagenPreview && (
                  <button className="per-btn per-btn-secondary" style={{ marginTop:8 }} onClick={() => { setImagenFile(null); setImagenPreview(null); }}>
                    <X size={13}/> Quitar foto
                  </button>
                )}
              </div>

              <div className="per-form-section">
                <div className="per-section-title"><Users size={15}/> Identificación</div>
                <div className="per-form-grid">
                  <div className="per-form-group">
                    <label className="per-form-label">Nombres <span className="req">*</span></label>
                    <input className={`per-input${errors.nombres?" error":""}`} type="text" value={form.nombres} onChange={e => set("nombres", e.target.value)} placeholder="Nombres completos"/>
                    {errors.nombres && <span className="per-error-msg">{errors.nombres}</span>}
                  </div>
                  <div className="per-form-group">
                    <label className="per-form-label">Apellidos <span className="req">*</span></label>
                    <input className={`per-input${errors.apellidos?" error":""}`} type="text" value={form.apellidos} onChange={e => set("apellidos", e.target.value)} placeholder="Apellidos completos"/>
                    {errors.apellidos && <span className="per-error-msg">{errors.apellidos}</span>}
                  </div>
                  <div className="per-form-group">
                    <label className="per-form-label">N° Identidad <span className="req">*</span></label>
                    <input className={`per-input${errors.numero_identidad?" error":""}`} type="text" value={form.numero_identidad} onChange={e => set("numero_identidad", e.target.value)} placeholder="0801-1990-12345"/>
                    {errors.numero_identidad && <span className="per-error-msg">{errors.numero_identidad}</span>}
                  </div>
                  <div className="per-form-group">
                    <label className="per-form-label">Teléfono <span className="req">*</span></label>
                    <input className={`per-input${errors.telefono?" error":""}`} type="text" value={form.telefono} onChange={e => set("telefono", e.target.value)} placeholder="9999-9999"/>
                    {errors.telefono && <span className="per-error-msg">{errors.telefono}</span>}
                  </div>
                  <div className="per-form-group full">
                    <label className="per-form-label">Correo electrónico <span className="req">*</span></label>
                    <input className={`per-input${errors.direccion_correo?" error":""}`} type="email" value={form.direccion_correo} onChange={e => set("direccion_correo", e.target.value)} placeholder="correo@ejemplo.com"/>
                    {errors.direccion_correo && <span className="per-error-msg">{errors.direccion_correo}</span>}
                  </div>
                </div>
              </div>

              <div className="per-form-section">
                <div className="per-section-title" style={{ justifyContent:"space-between" }}>
                  <span>Especialidades</span>
                  <button className="per-btn per-btn-secondary" style={{ padding:"5px 12px", fontSize:".8rem" }} onClick={addEsp}>
                    <Plus size={13}/> Agregar
                  </button>
                </div>
                {especialidades.length === 0 && (
                  <p style={{ color:"#aaa", fontSize:".83rem", textAlign:"center", padding:"12px 0" }}>Sin especialidades registradas</p>
                )}
                {especialidades.map((esp, i) => (
                  <div key={i} className="per-esp-row">
                    <input className="per-input" type="text" placeholder="Nombre de la especialidad" value={esp.nombre}
                      onChange={e => setEsp(i,"nombre",e.target.value)} style={{ flex:2 }}/>
                    <select className="per-select" value={esp.nivel} onChange={e => setEsp(i,"nivel",e.target.value)} style={{ flex:1 }}>
                      {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <button className="per-btn-icon delete" onClick={() => delEsp(i)}><Trash2 size={13}/></button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ══ TAB: INFO LABORAL ══ */}
          {tab === "laboral" && (
            <>
              <div className="per-form-section">
                <div className="per-section-title">Contrato y Estado</div>
                <div className="per-form-grid">
                  {/* Tipo contrato — dinámico */}
                  <div className="per-form-group">
                    <label className="per-form-label">Tipo de Contrato <span className="req">*</span></label>
                    <select className={`per-select${errors.tipo_contrato?" error":""}`} value={form.tipo_contrato} onChange={e => set("tipo_contrato",e.target.value)}>
                      <option value="">Seleccionar...</option>
                      {catTipoContrato.map(c => <option key={c.valor} value={c.valor}>{c.etiqueta}</option>)}
                    </select>
                    {errors.tipo_contrato && <span className="per-error-msg">{errors.tipo_contrato}</span>}
                  </div>
                  {/* Estado */}
                  <div className="per-form-group">
                    <label className="per-form-label">Estado</label>
                    <select className="per-select" value={form.estado} onChange={e => set("estado",e.target.value)}>
                      {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  {/* Área de trabajo — dinámica */}
                  <div className="per-form-group">
                    <label className="per-form-label">Área de Trabajo</label>
                    <select className="per-select" value={form.area_trabajo} onChange={e => set("area_trabajo",e.target.value)}>
                      <option value="">Seleccionar área...</option>
                      {catAreaTrabajo.map(a => <option key={a.valor} value={a.valor}>{a.etiqueta}</option>)}
                    </select>
                  </div>
                  <div className="per-form-group">
                    <label className="per-form-label">Salario (Lps)</label>
                    <input className="per-input" type="number" min="0" value={form.salario} onChange={e => set("salario",e.target.value)} placeholder="0.00"/>
                  </div>
                </div>
              </div>

              <div className="per-form-section">
                <div className="per-section-title">Cargo Asignado</div>
                <div className="per-form-grid">
                  {/* Cargo — dinámico */}
                  <div className="per-form-group">
                    <label className="per-form-label">Cargo <span className="req">*</span></label>
                    <select className={`per-select${errors.cargo?" error":""}`} value={form.cargo_asignacion.cargo} onChange={e => setCargo("cargo",e.target.value)}>
                      <option value="">Seleccionar cargo...</option>
                      {catCargo.map(c => <option key={c.valor} value={c.valor}>{c.etiqueta}</option>)}
                    </select>
                    {errors.cargo && <span className="per-error-msg">{errors.cargo}</span>}
                  </div>
                  {/* Horario — dinámico */}
                  <div className="per-form-group">
                    <label className="per-form-label">Horario Preferido <span className="req">*</span></label>
                    <select className={`per-select${errors.horario_preferido?" error":""}`} value={form.cargo_asignacion.horario_preferido} onChange={e => setCargo("horario_preferido",e.target.value)}>
                      <option value="">Seleccionar...</option>
                      {catHorario.map(h => <option key={h.valor} value={h.valor}>{h.etiqueta}</option>)}
                    </select>
                    {errors.horario_preferido && <span className="per-error-msg">{errors.horario_preferido}</span>}
                  </div>
                  <div className="per-form-group">
                    <label className="per-form-label">Fecha de Asignación <span className="req">*</span></label>
                    <input className={`per-input${errors.fecha_asignacion?" error":""}`} type="date" value={form.cargo_asignacion.fecha_asignacion} onChange={e => setCargo("fecha_asignacion",e.target.value)}/>
                    {errors.fecha_asignacion && <span className="per-error-msg">{errors.fecha_asignacion}</span>}
                  </div>
                  <div className="per-form-group">
                    <label className="per-form-label">Fecha de Ingreso</label>
                    <input className="per-input" type="date" value={form.fecha_ingreso} onChange={e => set("fecha_ingreso",e.target.value)}/>
                  </div>
                  <div className="per-form-group">
                    <label className="per-form-label">Fecha de Salida</label>
                    <input className="per-input" type="date" value={form.fecha_salida} onChange={e => set("fecha_salida",e.target.value)}/>
                  </div>
                  <div className="per-form-group">
                    <label className="per-form-label">Motivo de Salida</label>
                    <input className="per-input" type="text" value={form.motivo_salida} onChange={e => set("motivo_salida",e.target.value)} placeholder="Ej: Renuncia voluntaria"/>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ══ TAB: DOCUMENTOS ══ */}
          {tab === "docs" && (
            <div className="per-form-section">
              <div className="per-section-title" style={{ justifyContent:"space-between" }}>
                <span><FileText size={15}/> Documentos del Expediente</span>
                <span style={{ fontSize:".76rem", color:"#aaa", fontWeight:400 }}>Se guardan en Google Drive</span>
              </div>
              <div className="per-info-banner">
                <AlertCircle size={16} style={{ flexShrink:0, marginTop:2 }}/>
                <span>Los documentos se subirán a Google Drive al guardar. Obligatorio para personal que trabaja con menores: DPI, Antecedentes.</span>
              </div>
              {documentos.map((doc, i) => (
                <div key={i} className="per-doc-card">
                  <div className="per-doc-icon"><FileText size={20} color="#6C4FBF"/></div>
                  <div className="per-doc-info">
                    <select className="per-select" value={doc.tipo_documento} onChange={e => setDoc(i,"tipo_documento",e.target.value)} style={{ marginBottom:6 }}>
                      {TIPOS_DOC.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <input className="per-input" type="text" placeholder="Descripción del documento" value={doc.descripcion} onChange={e => setDoc(i,"descripcion",e.target.value)}/>
                    <span className="per-doc-filename">{doc.file.name}</span>
                  </div>
                  <button className="per-btn-icon delete" onClick={() => delDoc(i)}><X size={14}/></button>
                </div>
              ))}
              <div className="per-drop-zone" onClick={() => fileDocRef.current?.click()}>
                <Upload size={32} color="#C4B5E8"/>
                <p>Los documentos se guardan automáticamente en Google Drive</p>
                <button className="per-btn per-btn-primary" style={{ marginTop:10 }} onClick={e => { e.stopPropagation(); fileDocRef.current?.click(); }}>
                  <Upload size={14}/> Seleccionar documento
                </button>
                <span className="per-upload-hint">PDF, JPG, PNG · Máx. 10MB · Máx. 10 documentos</span>
              </div>
              <input ref={fileDocRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display:"none" }} onChange={handleDocFiles}/>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="per-modal-footer">
          <div style={{ fontSize:".78rem", color:"#aaa" }}>El código se generará automáticamente</div>
          <div style={{ display:"flex", gap:".75rem" }}>
            <button className="per-btn per-btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="per-btn per-btn-primary" onClick={handleSubmit}><Plus size={15}/> Crear Empleado</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ModalCrearPersonal;