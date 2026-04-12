// ============================================================
// ModalDetallePersonal.jsx
// Modal editar empleado con gestión de documentos en Drive
// Catálogos dinámicos desde API (igual que Bienes)
// ============================================================
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Upload, X, Plus, Trash2, FileText, AlertCircle, Camera, ExternalLink, Clock, UserCheck } from "lucide-react";

const TIPOS_DOC = [
  { value: "DPI",          label: "DPI / Cédula"        },
  { value: "PASAPORTE",    label: "Pasaporte"            },
  { value: "LICENCIA",     label: "Licencia de Conducir" },
  { value: "ANTECEDENTES", label: "Antecedentes Penales" },
  { value: "TITULO",       label: "Título Académico"     },
  { value: "CERTIFICADO",  label: "Certificado"          },
  { value: "CONTRATO",     label: "Contrato"             },
  { value: "OTRO",         label: "Otro"                 },
];

const NIVELES = ["BASICO","INTERMEDIO","AVANZADO","EXPERTO"];
const ESTADOS = ["ACTIVO","VACACIONES","LICENCIA","INACTIVO"];

const ModalDetallePersonal = ({
  empleado, onClose, onUpdate, onDelete,
  catTipoContrato = [],
  catAreaTrabajo  = [],
  catCargo        = [],
  catHorario      = [],
}) => {
  const [form, setForm] = useState({
    nombres:          empleado.nombres          || "",
    apellidos:        empleado.apellidos        || "",
    numero_identidad: empleado.numero_identidad || "",
    tipo_contrato:    empleado.tipo_contrato    || "",
    estado:           empleado.estado           || "ACTIVO",
    area_trabajo:     empleado.area_trabajo     || "",
    telefono:         empleado.telefono         || "",
    direccion_correo: empleado.direccion_correo || "",
    salario:          empleado.salario          || "",
    fecha_ingreso:    empleado.fecha_ingreso    ? empleado.fecha_ingreso.slice(0,10) : "",
    fecha_salida:     empleado.fecha_salida     ? empleado.fecha_salida.slice(0,10)  : "",
    motivo_salida:    empleado.motivo_salida    || "",
    cargo_asignacion: {
      cargo:             empleado.cargo_asignacion?.cargo             || "",
      horario_preferido: empleado.cargo_asignacion?.horario_preferido || "",
      fecha_asignacion:  empleado.cargo_asignacion?.fecha_asignacion
        ? new Date(empleado.cargo_asignacion.fecha_asignacion).toISOString().slice(0,10) : "",
    },
  });
  const [especialidades,   setEspecialidades]   = useState(
    (empleado.especialidades || []).map(e => ({ nombre: e.nombre || "", nivel: e.nivel || "INTERMEDIO" }))
  );
  const [docsExistentes,   setDocsExistentes]   = useState(empleado.documentacion || []);
  const [docsEliminar,     setDocsEliminar]     = useState([]);
  const [nuevosDocumentos, setNuevosDocumentos] = useState([]);
  const [imagenPreview,    setImagenPreview]    = useState(
    empleado.imagen ? `data:${empleado.tipo_imagen};base64,${empleado.imagen}` : null
  );
  const [imagenFile,       setImagenFile]       = useState(null);
  const [errors,           setErrors]           = useState({});
  const [tab,              setTab]              = useState("basico");
  const [unsaved,          setUnsaved]          = useState(false);

  const fileDocRef = useRef(null);
  const fileImgRef = useRef(null);

  useEffect(() => { setUnsaved(true); }, [form, especialidades, nuevosDocumentos, docsEliminar, imagenFile]);

  const setF = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const setC = (field, val) => setForm(f => ({ ...f, cargo_asignacion: { ...f.cargo_asignacion, [field]: val } }));

  const handleImagen = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagenFile(file);
    setImagenPreview(URL.createObjectURL(file));
  };

  const addEsp = () => setEspecialidades(p => [...p, { nombre:"", nivel:"INTERMEDIO" }]);
  const setEsp = (i, field, val) => setEspecialidades(p => p.map((e, idx) => idx===i ? { ...e, [field]:val } : e));
  const delEsp = (i) => setEspecialidades(p => p.filter((_,idx) => idx !== i));

  const handleDocFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const nuevos = files.map(f => ({ file: f, tipo_documento:"OTRO", descripcion: f.name.replace(/\.[^.]+$/,""), preview: f.name }));
    setNuevosDocumentos(p => [...p, ...nuevos].slice(0, 10 - docsExistentes.length));
    e.target.value = "";
  };
  const setNuevoDoc = (i, field, val) => setNuevosDocumentos(p => p.map((d,idx) => idx===i ? { ...d, [field]:val } : d));
  const delNuevoDoc = (i) => setNuevosDocumentos(p => p.filter((_,idx) => idx !== i));

  const marcarEliminar = (doc) => {
    setDocsEliminar(p => [...p, doc.drive_file_id]);
    setDocsExistentes(p => p.filter(d => d.drive_file_id !== doc.drive_file_id));
  };

  const validate = () => {
    const e = {};
    if (!form.nombres.trim())          e.nombres = "Requerido";
    if (!form.apellidos.trim())        e.apellidos = "Requerido";
    if (!form.numero_identidad.trim()) e.numero_identidad = "Requerido";
    if (!form.tipo_contrato)           e.tipo_contrato = "Requerido";
    if (!form.telefono.trim())         e.telefono = "Requerido";
    if (!form.direccion_correo.trim()) e.direccion_correo = "Requerido";
    if (!form.cargo_asignacion.cargo)              e.cargo = "Requerido";
    if (!form.cargo_asignacion.horario_preferido)  e.horario_preferido = "Requerido";
    if (!form.cargo_asignacion.fecha_asignacion)   e.fecha_asignacion = "Requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) { setTab("basico"); return; }
    const fd = new FormData();
    Object.entries(form).forEach(([k,v]) => {
      if (k === "cargo_asignacion") fd.append("cargo_asignacion", JSON.stringify(v));
      else if (v !== null && v !== undefined && v !== "") fd.append(k, v);
    });
    fd.append("especialidades", JSON.stringify(especialidades.filter(e => e.nombre.trim())));
    if (imagenFile) fd.append("imagen", imagenFile);
    if (docsEliminar.length > 0) fd.append("documentos_eliminar", JSON.stringify(docsEliminar));
    const meta = nuevosDocumentos.map(d => ({ tipo_documento: d.tipo_documento, descripcion: d.descripcion }));
    fd.append("documentos_meta", JSON.stringify(meta));
    nuevosDocumentos.forEach(d => fd.append("documentos", d.file));
    onUpdate(empleado._id, fd);
  };

  const fmtFecha = (iso) => {
    if (!iso || iso === "null") return "No registrado";
    const s = typeof iso === "string" ? iso : new Date(iso).toISOString();
    const [y, m, d] = s.slice(0,10).split("-");
    return s.includes("T") ? `${d}/${m}/${y} ${s.slice(11,16)}` : `${d}/${m}/${y}`;
  };

  const TABS = [
    { id:"basico",    label:"Datos Básicos" },
    { id:"laboral",   label:"Info Laboral"  },
    { id:"docs",      label:`Documentos (${docsExistentes.length + nuevosDocumentos.length})` },
    { id:"auditoria", label:"Auditoría"     },
  ];

  return (
    <div className="per-modal-overlay">
      <motion.div className="per-modal lg" initial={{ opacity:0, y:-20, scale:0.96 }} animate={{ opacity:1, y:0, scale:1 }} transition={{ duration:0.25 }}>

        <div className="per-modal-header">
          <h3 className="per-modal-title">
            <Users size={20}/>
            Editar Expediente — <span style={{ fontWeight:400, opacity:.85 }}>{empleado.codigo}</span>
          </h3>
          <button className="per-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="per-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`per-tab${tab===t.id?" active":""}`} onClick={() => setTab(t.id)}>
              {t.label}
              {Object.keys(errors).length > 0 && t.id==="basico" && <span className="per-tab-err">!</span>}
            </button>
          ))}
        </div>

        <div className="per-modal-body">

          {/* ══ TAB: DATOS BÁSICOS ══ */}
          {tab === "basico" && (
            <>
              <div className="per-form-section">
                <div className="per-section-title">Código de Empleado</div>
                <input className="per-input per-input-readonly" type="text" value={empleado.codigo} readOnly/>
              </div>
              <div className="per-form-section">
                <div className="per-section-title"><Camera size={15}/> Foto de Perfil</div>
                <div className="per-upload-area" onClick={() => fileImgRef.current?.click()}>
                  {imagenPreview
                    ? <img src={imagenPreview} alt="preview" className="per-foto-preview"/>
                    : <><Camera size={32} color="#C4B5E8"/><p style={{ marginTop:8, color:"#aaa", fontSize:".83rem" }}>Haz clic para cambiar foto</p></>
                  }
                  <input ref={fileImgRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleImagen}/>
                </div>
              </div>
              <div className="per-form-section">
                <div className="per-section-title"><Users size={15}/> Identificación</div>
                <div className="per-form-grid">
                  <div className="per-form-group">
                    <label className="per-form-label">Nombres <span className="req">*</span></label>
                    <input className={`per-input${errors.nombres?" error":""}`} type="text" value={form.nombres} onChange={e => setF("nombres",e.target.value)}/>
                    {errors.nombres && <span className="per-error-msg">{errors.nombres}</span>}
                  </div>
                  <div className="per-form-group">
                    <label className="per-form-label">Apellidos <span className="req">*</span></label>
                    <input className={`per-input${errors.apellidos?" error":""}`} type="text" value={form.apellidos} onChange={e => setF("apellidos",e.target.value)}/>
                    {errors.apellidos && <span className="per-error-msg">{errors.apellidos}</span>}
                  </div>
                  <div className="per-form-group">
                    <label className="per-form-label">N° Identidad <span className="req">*</span></label>
                    <input className={`per-input${errors.numero_identidad?" error":""}`} type="text" value={form.numero_identidad} onChange={e => setF("numero_identidad",e.target.value)}/>
                    {errors.numero_identidad && <span className="per-error-msg">{errors.numero_identidad}</span>}
                  </div>
                  <div className="per-form-group">
                    <label className="per-form-label">Teléfono <span className="req">*</span></label>
                    <input className={`per-input${errors.telefono?" error":""}`} type="text" value={form.telefono} onChange={e => setF("telefono",e.target.value)}/>
                    {errors.telefono && <span className="per-error-msg">{errors.telefono}</span>}
                  </div>
                  <div className="per-form-group full">
                    <label className="per-form-label">Correo electrónico <span className="req">*</span></label>
                    <input className={`per-input${errors.direccion_correo?" error":""}`} type="email" value={form.direccion_correo} onChange={e => setF("direccion_correo",e.target.value)}/>
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
                    <select className={`per-select${errors.tipo_contrato?" error":""}`} value={form.tipo_contrato} onChange={e => setF("tipo_contrato",e.target.value)}>
                      <option value="">Seleccionar...</option>
                      {catTipoContrato.map(c => <option key={c.valor} value={c.valor}>{c.etiqueta}</option>)}
                    </select>
                    {errors.tipo_contrato && <span className="per-error-msg">{errors.tipo_contrato}</span>}
                  </div>
                  {/* Estado */}
                  <div className="per-form-group">
                    <label className="per-form-label">Estado</label>
                    <select className="per-select" value={form.estado} onChange={e => setF("estado",e.target.value)}>
                      {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  {/* Área de trabajo — dinámica */}
                  <div className="per-form-group">
                    <label className="per-form-label">Área de Trabajo</label>
                    <select className="per-select" value={form.area_trabajo} onChange={e => setF("area_trabajo",e.target.value)}>
                      <option value="">Seleccionar área...</option>
                      {catAreaTrabajo.map(a => <option key={a.valor} value={a.valor}>{a.etiqueta}</option>)}
                    </select>
                  </div>
                  <div className="per-form-group">
                    <label className="per-form-label">Salario (Lps)</label>
                    <input className="per-input" type="number" min="0" value={form.salario} onChange={e => setF("salario",e.target.value)}/>
                  </div>
                </div>
              </div>

              <div className="per-form-section">
                <div className="per-section-title">Cargo Asignado</div>
                <div className="per-form-grid">
                  {/* Cargo — dinámico */}
                  <div className="per-form-group">
                    <label className="per-form-label">Cargo <span className="req">*</span></label>
                    <select className={`per-select${errors.cargo?" error":""}`} value={form.cargo_asignacion.cargo} onChange={e => setC("cargo",e.target.value)}>
                      <option value="">Seleccionar cargo...</option>
                      {catCargo.map(c => <option key={c.valor} value={c.valor}>{c.etiqueta}</option>)}
                    </select>
                    {errors.cargo && <span className="per-error-msg">{errors.cargo}</span>}
                  </div>
                  {/* Horario — dinámico */}
                  <div className="per-form-group">
                    <label className="per-form-label">Horario Preferido <span className="req">*</span></label>
                    <select className={`per-select${errors.horario_preferido?" error":""}`} value={form.cargo_asignacion.horario_preferido} onChange={e => setC("horario_preferido",e.target.value)}>
                      <option value="">Seleccionar...</option>
                      {catHorario.map(h => <option key={h.valor} value={h.valor}>{h.etiqueta}</option>)}
                    </select>
                    {errors.horario_preferido && <span className="per-error-msg">{errors.horario_preferido}</span>}
                  </div>
                  <div className="per-form-group">
                    <label className="per-form-label">Fecha de Asignación <span className="req">*</span></label>
                    <input className={`per-input${errors.fecha_asignacion?" error":""}`} type="date" value={form.cargo_asignacion.fecha_asignacion} onChange={e => setC("fecha_asignacion",e.target.value)}/>
                    {errors.fecha_asignacion && <span className="per-error-msg">{errors.fecha_asignacion}</span>}
                  </div>
                  <div className="per-form-group">
                    <label className="per-form-label">Fecha de Ingreso</label>
                    <input className="per-input" type="date" value={form.fecha_ingreso} onChange={e => setF("fecha_ingreso",e.target.value)}/>
                  </div>
                  <div className="per-form-group">
                    <label className="per-form-label">Fecha de Salida</label>
                    <input className="per-input" type="date" value={form.fecha_salida} onChange={e => setF("fecha_salida",e.target.value)}/>
                  </div>
                  <div className="per-form-group">
                    <label className="per-form-label">Motivo de Salida</label>
                    <input className="per-input" type="text" value={form.motivo_salida} onChange={e => setF("motivo_salida",e.target.value)} placeholder="Ej: Renuncia voluntaria"/>
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
                <span style={{ fontSize:".76rem", color:"#aaa", fontWeight:400 }}>Guardados en Google Drive</span>
              </div>
              {docsExistentes.length > 0 && (
                <div style={{ marginBottom:16 }}>
                  <p style={{ fontSize:".78rem", fontWeight:700, color:"#7a6fa0", textTransform:"uppercase", letterSpacing:".04em", marginBottom:8 }}>
                    Guardados en Drive
                  </p>
                  {docsExistentes.map((doc, i) => (
                    <div key={i} className="per-doc-card per-doc-saved">
                      <div className="per-doc-icon"><FileText size={20} color="#22c55e"/></div>
                      <div className="per-doc-info">
                        <span className="per-doc-tipo">{doc.tipo_documento}</span>
                        <span className="per-doc-desc">{doc.descripcion || doc.nombre_archivo}</span>
                        <a href={doc.drive_url} target="_blank" rel="noreferrer" className="per-doc-drive-link">
                          <ExternalLink size={12}/> Ver en Drive
                        </a>
                      </div>
                      <button className="per-btn-icon delete" title="Quitar del expediente" onClick={() => marcarEliminar(doc)}>
                        <X size={14}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {nuevosDocumentos.map((doc, i) => (
                <div key={`new-${i}`} className="per-doc-card">
                  <div className="per-doc-icon"><FileText size={20} color="#6C4FBF"/></div>
                  <div className="per-doc-info">
                    <select className="per-select" value={doc.tipo_documento} onChange={e => setNuevoDoc(i,"tipo_documento",e.target.value)} style={{ marginBottom:6 }}>
                      {TIPOS_DOC.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <input className="per-input" type="text" placeholder="Descripción" value={doc.descripcion} onChange={e => setNuevoDoc(i,"descripcion",e.target.value)}/>
                    <span className="per-doc-filename">{doc.file.name}</span>
                  </div>
                  <button className="per-btn-icon delete" onClick={() => delNuevoDoc(i)}><X size={14}/></button>
                </div>
              ))}
              <div className="per-drop-zone" onClick={() => fileDocRef.current?.click()}>
                <Upload size={32} color="#C4B5E8"/>
                <p>Los documentos se guardan automáticamente en Google Drive</p>
                <button className="per-btn per-btn-primary" style={{ marginTop:10 }} onClick={e => { e.stopPropagation(); fileDocRef.current?.click(); }}>
                  <Upload size={14}/> Seleccionar documento
                </button>
                <span className="per-upload-hint">PDF, JPG, PNG · Máx. 10MB · Máx. {10 - docsExistentes.length} documentos más</span>
              </div>
              <input ref={fileDocRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display:"none" }} onChange={handleDocFiles}/>
            </div>
          )}

          {/* ══ TAB: AUDITORÍA ══ */}
          {tab === "auditoria" && (
            <div className="per-form-section">
              <div className="per-section-title"><Clock size={15}/> Auditoría del Empleado</div>
              <div className="per-audit-card">
                <div className="per-audit-row">
                  <UserCheck size={16} className="per-audit-ico"/>
                  <div>
                    <div className="per-audit-label">Creación</div>
                    <div className="per-audit-val">
                      Registrado por: <strong>{empleado.creado_por_email || empleado.creado_por || "N/D"}</strong>
                      &nbsp;·&nbsp; Fecha: <strong>{fmtFecha(empleado.fecha_creacion || empleado.createdAt)}</strong>
                    </div>
                  </div>
                </div>
                {(empleado.actualizado_por || empleado.actualizado_por_email || empleado.updatedAt) && (
                  <div className="per-audit-row">
                    <Clock size={16} className="per-audit-ico"/>
                    <div>
                      <div className="per-audit-label">Última Actualización</div>
                      <div className="per-audit-val">
                        Por: <strong>{empleado.actualizado_por_email || empleado.actualizado_por || "N/D"}</strong>
                        &nbsp;·&nbsp; <strong>{fmtFecha(empleado.fecha_actualizacion || empleado.updatedAt)}</strong>
                      </div>
                    </div>
                  </div>
                )}
                <div className="per-audit-row">
                  <FileText size={16} className="per-audit-ico"/>
                  <div>
                    <div className="per-audit-label">Ciclo Laboral</div>
                    <div className="per-audit-val">
                      Ingreso: <strong>{fmtFecha(empleado.fecha_ingreso)}</strong>
                      {empleado.fecha_salida && <>&nbsp;·&nbsp; Salida: <strong>{fmtFecha(empleado.fecha_salida)}</strong></>}
                      {empleado.motivo_salida && <>&nbsp;·&nbsp; Motivo: <strong>{empleado.motivo_salida}</strong></>}
                    </div>
                  </div>
                </div>
                <div className="per-audit-ids">
                  <small>ID: <strong>{empleado._id}</strong></small>
                  <small>Código: <strong>{empleado.codigo}</strong></small>
                  <small>Estado: <strong>{empleado.estado}</strong></small>
                  {empleado.numero_identidad && <small>Identidad: <strong>{empleado.numero_identidad}</strong></small>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="per-modal-footer per-footer-space-between">
          <button className="per-btn per-btn-danger" onClick={() => {
            if (window.confirm(`¿Eliminar al empleado "${empleado.nombres} ${empleado.apellidos}"?`)) onDelete(empleado._id);
          }}>
            <Trash2 size={15}/> Eliminar
          </button>
          <div style={{ display:"flex", gap:".75rem" }}>
            <button className="per-btn per-btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="per-btn per-btn-primary" onClick={handleSubmit}>Actualizar</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ModalDetallePersonal;