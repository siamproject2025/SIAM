// ============================================================
// ModalDetalleBien.js
// CORRECCIONES:
// #1 — asignado_a + tipo_asignacion
// #2 — fecha_entrada + fecha_salida
// #3 — Código readonly
// #4 — Categorías paramétricas via prop
// #5 — Auditoría: mostrar quién creó y quién editó
// #6 — CORRECCIÓN: evitar strings "null" en campos de fecha
// #7 — CORRECCIÓN: pasar correctamente el _id en onDelete
// ============================================================
import React, { useState, useEffect } from "react";
import { ImagePlus, Upload, Trash2, User, Calendar, Clock } from "lucide-react";
import ConfirmDialog from "../../../components/ConfirmDialog/ConfirmDialog";

const Field = ({ label, required, error, full, children }) => (
  <div className={`bienes-form-group${full ? " full" : ""}`}>
    <label className="bienes-form-label">
      {label}{required && <span className="req"> *</span>}
    </label>
    {children}
    {error && <span className="bienes-error-msg">{error}</span>}
  </div>
);
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
const ModalDetalleBien = ({ bien, onClose, onUpdate, onDelete, categoriasDisponibles = [] }) => {
  const [form, setForm] = useState({
    ...bien,
    fecha_entrada: bien.fechaIngreso ? bien.fechaIngreso.slice(0, 10) : "",
    fecha_salida: bien.fecha_salida ? bien.fecha_salida.slice(0, 10) : "",
    // Limpiar valores "null" que vienen como strings
    eliminado_por: bien.eliminado_por === "null" ? null : bien.eliminado_por,
    eliminado_por_email: bien.eliminado_por_email === "null" ? null : bien.eliminado_por_email,
    fecha_eliminacion: bien.fecha_eliminacion === "null" ? null : bien.fecha_eliminacion,
    foto_preview:
      bien.imagen && bien.imagen !== "null" && bien.imagen !== ""
        ? `data:${bien.tipo_imagen || 'image/png'};base64,${bien.imagen}`
        : null,
  });

  const [errors, setErrors] = useState({});
  const [hayCambios, setHayCambios] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showConfirmCerrar, setShowConfirmCerrar] = useState(false);
  const [mostrarAuditoria, setMostrarAuditoria] = useState(false);

  useEffect(() => {
    return () => {
      if (form.foto_preview?.startsWith("blob:")) URL.revokeObjectURL(form.foto_preview);
    };
  }, [form.foto_preview]);

  const clrErr = (name) => {
    if (errors[name]) setErrors((p) => { const n = { ...p }; delete n[name]; return n; });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setHayCambios(true);
    clrErr(name);
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErrors((p) => ({ ...p, imagen: "La imagen no debe superar 5MB" })); return; }
    if (!file.type.startsWith("image/")) { setErrors((p) => ({ ...p, imagen: "Solo se permiten imágenes" })); return; }
    if (form.foto_preview?.startsWith("blob:")) URL.revokeObjectURL(form.foto_preview);
    setForm((p) => ({ ...p, imagen: file, foto_preview: URL.createObjectURL(file) }));
    setHayCambios(true);
  };

  const eliminarFoto = () => {
    if (form.foto_preview?.startsWith("blob:")) URL.revokeObjectURL(form.foto_preview);
    setForm((p) => ({ ...p, imagen: null, foto_preview: null }));
    setHayCambios(true);
  };

  const validate = () => {
    const e = {};
    if (!form.nombre?.trim()) e.nombre = "Nombre obligatorio";
    if (!form.categoria) e.categoria = "Seleccione una categoría";
    if (!form.estado) e.estado = "Seleccione un estado";
    if (!form.valor || Number(form.valor) <= 0) e.valor = "Valor debe ser mayor a 0";
    if (!form.fecha_entrada) e.fecha_entrada = "Fecha de entrada obligatoria";
    return e;
  };

const handleGuardar = async () => {
  const e = validate();
  if (Object.keys(e).length > 0) { setErrors(e); return; }
  
  // Crear objeto simple (sin FormData)
  const dataToUpdate = {
    _id: bien._id,
    nombre: form.nombre,
    descripcion: form.descripcion || "",
    categoria: form.categoria,
    estado: form.estado,
    valor: parseFloat(form.valor),
    fechaIngreso: form.fecha_entrada,
  };
  
  // Agregar campos opcionales
  if (form.tipo_asignacion && form.tipo_asignacion.trim()) {
    dataToUpdate.tipo_asignacion = form.tipo_asignacion;
  }
  if (form.asignado_a && form.asignado_a.trim()) {
    dataToUpdate.asignado_a = form.asignado_a;
  }
  if (form.fecha_salida && form.fecha_salida.trim()) {
    dataToUpdate.fecha_salida = form.fecha_salida;
  }
  
  // Si hay imagen, usar FormData
  if (form.imagen && form.imagen instanceof File) {
    const fd = new FormData();
    fd.append('nombre', dataToUpdate.nombre);
    fd.append('descripcion', dataToUpdate.descripcion);
    fd.append('categoria', dataToUpdate.categoria);
    fd.append('estado', dataToUpdate.estado);
    fd.append('valor', dataToUpdate.valor);
    fd.append('fechaIngreso', dataToUpdate.fechaIngreso);
    fd.append('tipo_asignacion', dataToUpdate.tipo_asignacion || '');
    fd.append('asignado_a', dataToUpdate.asignado_a || '');
    fd.append('fecha_salida', dataToUpdate.fecha_salida || '');
    fd.append('imagen', form.imagen);
    fd.append('_id', bien._id);
    
    onUpdate(bien._id, fd);
  } else {
    // Si no hay imagen, enviar como JSON
    onUpdate(bien._id, dataToUpdate);
  }
  
  setHayCambios(false);
};

  const handleCerrar = () => {
    if (hayCambios) setShowConfirmCerrar(true);
    else onClose();
  };

  // Formatear fecha para mostrar
  const formatFecha = (fecha) => {
    if (!fecha || fecha === "null") return "No registrado";
    // Usamos la cadena ISO directamente para evitar el desfase UTC-6
    // Para timestamps con hora (auditoría) mostramos hora en UTC que es la guardada
    const s = typeof fecha === "string" ? fecha : new Date(fecha).toISOString();
    const datePart = s.slice(0, 10); // YYYY-MM-DD
    const [y, m, d] = datePart.split("-");
    // Si tiene hora (T) la mostramos también
    if (s.includes("T")) {
      const timePart = s.slice(11, 16); // HH:MM
      return `${d}/${m}/${y} ${timePart}`;
    }
    return `${d}/${m}/${y}`;
  };

  const grupos = categoriasDisponibles.reduce((acc, cat) => {
    const g = cat.grupo || "General";
    if (!acc[g]) acc[g] = [];
    acc[g].push(cat);
    return acc;
  }, {});

  return (
    <div className="bienes-modal-overlay">
      <div className="bienes-modal bienes-modal-lg">

        <div className="bienes-modal-header">
          <h3 className="bienes-modal-title"> Editar Bien</h3>
          <button className="bienes-modal-close" onClick={handleCerrar}>✕</button>
        </div>

        <div className="bienes-modal-body">

          {hayCambios && (
            <div className="bienes-unsaved-alert"> Tienes cambios sin guardar</div>
          )}

          {/* Identificación */}
          <div className="bienes-form-section">
            <div className="bienes-section-title">Identificación del Bien</div>
            <div className="bienes-form-grid">

              <Field label="Código (autogenerado)">
                <input className="bienes-input-readonly" value={form.codigo || ""} readOnly
                  title="El código no puede modificarse" />
              </Field>

              <Field label="Nombre del Bien" required error={errors.nombre}>
                <input className={`bienes-input${errors.nombre ? " error" : ""}`}
                  name="nombre" value={form.nombre || ""} onChange={handleChange}
                  placeholder="Ej: Laptop Dell Inspiron" />
              </Field>

              <Field label="Categoría" required error={errors.categoria}>
                <select className={`bienes-select${errors.categoria ? " error" : ""}`}
                  name="categoria" value={form.categoria || ""} onChange={handleChange}>
                  <option value="">Seleccione una categoría</option>
                  {Object.entries(grupos).map(([grupo, cats]) => (
                    <optgroup key={grupo} label={grupo}>
                      {cats.map((c) => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                    </optgroup>
                  ))}
                </select>
              </Field>

              <Field label="Estado Actual" required error={errors.estado}>
                <select className={`bienes-select${errors.estado ? " error" : ""}`}
                  name="estado" value={form.estado || ""} onChange={handleChange}>
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                  <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                  <option value="PRESTAMO">PRÉSTAMO</option>
                </select>
              </Field>

              <Field label="Valor (Lps.)" required error={errors.valor}>
                <input className={`bienes-input${errors.valor ? " error" : ""}`}
                  type="number" name="valor" value={form.valor || ""} onChange={handleChange}
                  step="0.01" min="0" />
              </Field>

              <Field label="Descripción" full>
                <textarea className="bienes-textarea" name="descripcion"
                  value={form.descripcion || ""} onChange={handleChange}
                  placeholder="Características, modelo, serie..." />
              </Field>

            </div>
          </div>

          {/* Fechas */}
          <div className="bienes-form-section">
            <div className="bienes-section-title">Fechas del Activo</div>
            <div className="bienes-form-grid">

              <Field label="Fecha de Entrada" required error={errors.fecha_entrada}>
                <input className={`bienes-input${errors.fecha_entrada ? " error" : ""}`}
                  type="date" name="fecha_entrada" value={form.fecha_entrada || ""} onChange={handleChange} />
              </Field>

              <Field label="Fecha de Salida / Baja">
                <input className="bienes-input" type="date" name="fecha_salida"
                  value={form.fecha_salida || ""} onChange={handleChange} />
              </Field>

            </div>
          </div>

          {/* Asignación */}
          <div className="bienes-form-section">
            <div className="bienes-section-title"> Asignación del Bien</div>
            <div className="bienes-form-grid">

              <Field label="Tipo de Asignación">
                <select className="bienes-select" name="tipo_asignacion"
                  value={form.tipo_asignacion || ""} onChange={handleChange}>
                  <option value="">Sin asignación específica</option>
                  <option value="Persona">Persona</option>
                  <option value="Aula">Aula</option>
                  <option value="Departamento">Departamento</option>
                  <option value="Almacén">Almacén</option>
                </select>
              </Field>

              <Field label="Asignado A">
                <input className="bienes-input" name="asignado_a"
                  value={form.asignado_a || ""} onChange={handleChange}
                  placeholder={
                    form.tipo_asignacion === "Persona" ? "Nombre del responsable" :
                    form.tipo_asignacion === "Aula" ? "Ej: Aula 3-B" :
                    form.tipo_asignacion === "Departamento" ? "Ej: Depto. de Cuerdas" :
                    "Persona, aula o departamento"
                  } />
              </Field>

            </div>
          </div>

          {/* Foto */}
          <div className="bienes-form-section">
            <div className="bienes-section-title"><ImagePlus size={15} /> Foto del Bien</div>
            <div className={`bienes-upload-area${form.foto_preview ? " has-image" : ""}`}>
              {form.foto_preview ? (
                <>
                  <img src={form.foto_preview} alt="Preview" className="bienes-foto-preview" />
                  <div className="bienes-upload-actions">
                    <input type="file" accept=".jpg,.jpeg,image/*" onChange={handleFotoChange}
                      style={{ display: "none" }} id="bienes-foto-editar" />
                    <label htmlFor="bienes-foto-editar" className="bienes-upload-label">
                      <Upload size={14} /> Cambiar foto
                    </label>
                    <button type="submit" style={S.btn('#6C4FBF')}  onClick={eliminarFoto}>
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Upload size={36} color="var(--primary)" style={{ marginBottom: 8 }} />
                  <p style={{ color: "#666", marginBottom: 12, fontSize: ".88rem" }}>
                    Arrastra una imagen o haz clic para seleccionar
                  </p>
                  <input type="file" accept="image/*" onChange={handleFotoChange}
                    style={{ display: "none" }} id="bienes-foto-editar-new" />
                  <label htmlFor="bienes-foto-editar-new" className="bienes-upload-label">
                    <ImagePlus size={16} /> Seleccionar imagen
                  </label>
                  <small className="bienes-upload-hint">Formatos: JPG, JPEG · Máx. 5MB</small>
                </>
              )}
            </div>
          </div>

          {/* ========== SECCIÓN DE AUDITORÍA ========== */}
          <div className="bienes-form-section">
            <div 
              className="bienes-section-title" 
              style={{ cursor: "pointer", justifyContent: "space-between" }}
              onClick={() => setMostrarAuditoria(!mostrarAuditoria)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Clock size={15} /> Auditoría del Bien
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--primary)" }}>
                {mostrarAuditoria ? "▼" : "▶"} Mostrar detalles
              </span>
            </div>

            {mostrarAuditoria && (
              <div style={{ 
                marginTop: "1rem", 
                padding: "1rem", 
                background: "#f8f9fa", 
                borderRadius: "8px",
                borderLeft: "4px solid var(--primary)"
              }}>
                {/* Información de creación */}
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "0.5rem",
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                    color: "#2c3e50"
                  }}>
                    <User size={14} /> Creación
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.85rem" }}>
                    <div>
                      <span style={{ color: "#6c757d" }}>Creado por:</span>
                      <span style={{ marginLeft: "0.5rem", fontWeight: 500 }}>
                        {bien.creado_por_email || bien.creado_por || "No registrado"}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: "#6c757d" }}>Fecha creación:</span>
                      <span style={{ marginLeft: "0.5rem", fontWeight: 500 }}>
                        {formatFecha(bien.fecha_creacion || bien.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Información de última actualización */}
                {(bien.actualizado_por || bien.actualizado_por_email || bien.fecha_actualizacion) && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "0.5rem",
                      marginBottom: "0.5rem",
                      fontWeight: 600,
                      color: "#2c3e50"
                    }}>
                      <Calendar size={14} /> Última Actualización
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.85rem" }}>
                      <div>
                        <span style={{ color: "#6c757d" }}>Actualizado por:</span>
                        <span style={{ marginLeft: "0.5rem", fontWeight: 500 }}>
                          {bien.actualizado_por_email || bien.actualizado_por || "No registrado"}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: "#6c757d" }}>Fecha actualización:</span>
                        <span style={{ marginLeft: "0.5rem", fontWeight: 500 }}>
                          {formatFecha(bien.fecha_actualizacion || bien.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Información adicional */}
                <div style={{ 
                  fontSize: "0.7rem", 
                  color: "#6c757d", 
                  borderTop: "1px solid #e9ecef",
                  paddingTop: "0.75rem",
                  marginTop: "0.5rem"
                }}>
                  <div>ID del bien: <strong>{bien._id}</strong></div>
                  {bien.creado_por && <div>ID creador: {bien.creado_por}</div>}
                  {bien.actualizado_por && <div>ID editor: {bien.actualizado_por}</div>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bienes-modal-footer space-between">
          <button type="button" style={S.btn('#E74C3C')} onClick={() => setShowConfirm(true)}>
            <Trash2 size={15} /> Eliminar Bien
          </button>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button  type="button" style={S.btn('#E0D9F5','#6C4FBF')} className="mm-btn mm-ghost" onClick={handleCerrar}>Cancelar</button>
            <button style={S.btn('#6C4FBF')} className="fas fa-save" onClick={handleGuardar}>Guardar Cambios</button>
          </div>
        </div>

        {showConfirm && (
          <ConfirmDialog
            message={`¿Seguro que deseas eliminar el bien "${form.nombre}"?`}
            onConfirm={() => { 
              // Asegurar que bien._id existe antes de llamar a onDelete
              if (bien && bien._id) {
                onDelete(bien._id);
              } else {
                console.error('Error: bien._id no está definido');
              }
              setShowConfirm(false);
            }}
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

      </div>
    </div>
  );
};

export default ModalDetalleBien;