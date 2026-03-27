// ============================================================
// ModalCrearBien.js
// CORRECCIONES:
// #1 — asignado_a + tipo_asignacion
// #2 — fecha_entrada + fecha_salida
// #3 — Código autogenerado (readonly)
// #4 — Categorías paramétricas via prop
// #5 — CORRECCIÓN: fecha_entrada → fechaIngreso (coincide con backend)
// ============================================================
import React, { useState, useEffect } from "react";
import { Trash2, ImagePlus, Upload } from "lucide-react";

// Código provisional hasta que el backend lo persista
const generarCodigoTemp = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BIEN-${year}-${rand}`;
};

const INIT = {
  codigo: "",
  nombre: "",
  descripcion: "",
  categoria: "",
  estado: "ACTIVO", // Valor por defecto
  valor: "",
  fechaIngreso: "", // CORREGIDO: antes era fecha_entrada
  fecha_salida: "",
  asignado_a: "",
  tipo_asignacion: "",
  imagen: null,
  foto_preview: null,
};

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
  <div className={`bienes-form-group${full ? " full" : ""}`}>
    <label className="bienes-form-label">
      {label}{required && <span className="req"> *</span>}
    </label>
    {children}
    {error && <span className="bienes-error-msg">{error}</span>}
  </div>
);

const ModalCrearBien = ({ onClose, onCreate, categoriasDisponibles = [] }) => {
  const [form, setForm] = useState({ ...INIT, codigo: generarCodigoTemp() });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    return () => {
      if (form.foto_preview) URL.revokeObjectURL(form.foto_preview);
    };
  }, [form.foto_preview]);

  const clrErr = (name) => {
    if (errors[name]) setErrors((p) => { const n = { ...p }; delete n[name]; return n; });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    clrErr(name);
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { 
      setErrors((p) => ({ ...p, imagen: "La imagen no debe superar 5MB" })); 
      return; 
    }
    if (!file.type.startsWith("image/")) { 
      setErrors((p) => ({ ...p, imagen: "Solo se permiten imágenes" })); 
      return; 
    }
    if (form.foto_preview) URL.revokeObjectURL(form.foto_preview);
    setForm((p) => ({ ...p, imagen: file, foto_preview: URL.createObjectURL(file) }));
    clrErr("imagen");
  };

  const eliminarFoto = () => {
    if (form.foto_preview) URL.revokeObjectURL(form.foto_preview);
    setForm((p) => ({ ...p, imagen: null, foto_preview: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "Nombre obligatorio";
    if (!form.categoria) e.categoria = "Seleccione una categoría";
    if (!form.estado) e.estado = "Seleccione un estado";
    if (!form.valor || Number(form.valor) <= 0) e.valor = "Valor debe ser mayor a 0";
    if (!form.fechaIngreso) e.fechaIngreso = "Fecha de entrada obligatoria"; // CORREGIDO
    return e;
  };

  const handleCrear = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    
    // Preparar datos para enviar al backend
    const dataToSend = {
      ...form,
      valor: parseFloat(form.valor),
      fechaIngreso: new Date(form.fechaIngreso), // CORREGIDO
      fecha_salida: form.fecha_salida ? new Date(form.fecha_salida) : null,
    };
    
    // Eliminar campos que no están en el modelo del backend
    delete dataToSend.foto_preview;
    
    onCreate(dataToSend);
  };

  const grupos = categoriasDisponibles.reduce((acc, cat) => {
    const g = cat.grupo || "General";
    if (!acc[g]) acc[g] = [];
    acc[g].push(cat);
    return acc;
  }, {});

  return (
    <div className="bienes-modal-overlay">
      <div className="bienes-modal">

        <div className="bienes-modal-header">
          <h3 className="bienes-modal-title">Registrar Nuevo Bien</h3>
          <button className="bienes-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="bienes-modal-body">

          {/* Identificación */}
          <div className="bienes-form-section">
            <div className="bienes-section-title">Identificación del Bien</div>
            <div className="bienes-form-grid">

              <Field label="Código (autogenerado)">
                <input className="bienes-input-readonly" value={form.codigo} readOnly
                  title="Generado automáticamente por el sistema" />
              </Field>

              <Field label="Nombre del Bien" required error={errors.nombre}>
                <input className={`bienes-input${errors.nombre ? " error" : ""}`}
                  name="nombre" value={form.nombre} onChange={handleChange}
                  placeholder="Ej: Laptop Dell Inspiron" />
              </Field>

              <Field label="Categoría" required error={errors.categoria}>
                <select className={`bienes-select${errors.categoria ? " error" : ""}`}
                  name="categoria" value={form.categoria} onChange={handleChange}>
                  <option value="">Seleccione una categoría</option>
                  {Object.entries(grupos).map(([grupo, cats]) => (
                    <optgroup key={grupo} label={grupo}>
                      {cats.map((c) => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                    </optgroup>
                  ))}
                </select>
              </Field>

              <Field label="Estado Inicial" required error={errors.estado}>
                <select className={`bienes-select${errors.estado ? " error" : ""}`}
                  name="estado" value={form.estado} onChange={handleChange}>
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                  <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                  <option value="PRESTAMO">PRÉSTAMO</option>
                </select>
              </Field>

              <Field label="Valor (Lps.)" required error={errors.valor}>
                <input className={`bienes-input${errors.valor ? " error" : ""}`}
                  type="number" name="valor" value={form.valor} onChange={handleChange}
                  placeholder="Ej: 15000.00" step="0.01" min="0" />
              </Field>

              <Field label="Descripción" full>
                <textarea className="bienes-textarea" name="descripcion" value={form.descripcion}
                  onChange={handleChange}
                  placeholder="Características, modelo, serie, observaciones..." />
              </Field>

            </div>
          </div>

          {/* Fechas — CORREGIDO: fechaIngreso */}
          <div className="bienes-form-section">
            <div className="bienes-section-title">Fechas del Activo</div>
            <div className="bienes-form-grid">

              <Field label="Fecha de Entrada" required error={errors.fechaIngreso}>
                <input className={`bienes-input${errors.fechaIngreso ? " error" : ""}`}
                  type="date" name="fechaIngreso" value={form.fechaIngreso} onChange={handleChange} />
              </Field>

              <Field label="Fecha de Salida / Baja">
                <input className="bienes-input" type="date" name="fecha_salida"
                  value={form.fecha_salida} onChange={handleChange} />
              </Field>

            </div>
          </div>

          {/* Asignación */}
          <div className="bienes-form-section">
            <div className="bienes-section-title">Asignación del Bien</div>
            <div className="bienes-form-grid">

              <Field label="Tipo de Asignación">
                <select className="bienes-select" name="tipo_asignacion"
                  value={form.tipo_asignacion} onChange={handleChange}>
                  <option value="">Sin asignación específica</option>
                  <option value="Persona">Persona</option>
                  <option value="Aula">Aula</option>
                  <option value="Departamento">Departamento</option>
                  <option value="Almacén">Almacén</option>
                </select>
              </Field>

              <Field label="Asignado A">
                <input className="bienes-input" name="asignado_a" value={form.asignado_a}
                  onChange={handleChange}
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
                    <button type="button" className="bienes-btn bienes-btn-danger" onClick={eliminarFoto}>
                      <Trash2 size={14} /> Eliminar foto
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Upload size={36} color="var(--primary)" style={{ marginBottom: 8 }} />
                  <p style={{ color: "#666", marginBottom: 12, fontSize: ".88rem" }}>
                    Arrastra una imagen o haz clic para seleccionar
                  </p>
                  <input type="file" accept=".jpg,.jpeg,image/*" onChange={handleFotoChange}
                    style={{ display: "none" }} id="bienes-foto-nueva" />
                  <label htmlFor="bienes-foto-nueva" className="bienes-upload-label">
                    <ImagePlus size={16} /> Seleccionar imagen
                  </label>
                  <small className="bienes-upload-hint">Formatos: JPG, JPEG · Máx. 5MB</small>
                  {errors.imagen && <span className="bienes-error-msg">{errors.imagen}</span>}
                </>
              )}
            </div>
          </div>

        </div>

        <div className="bienes-modal-footer">
          <button type="button" style={S.btn('#E0D9F5','#6C4FBF')} onClick={onClose}>Cancelar</button>
          <button type="submit" style={S.btn('#6C4FBF')} onClick={handleCrear}>Guardar</button>
        </div>

      </div>
    </div>
  );
};

export default ModalCrearBien;