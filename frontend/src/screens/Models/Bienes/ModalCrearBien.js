// ============================================================
// ModalCrearBien.js
// Diseño idéntico al modal de Donaciones:
//   • Overlay + modal con clases dn-*
//   • Pestañas: Datos | Fotografía | Auditoría
//   • Punto rojo animado en pestaña con errores
//   • Shake en campos inválidos al intentar guardar
//   • Banner "cambios sin guardar"
//   • AnimatePresence + spring de framer-motion
// ============================================================
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, Save, ImagePlus, Upload, Trash2,
  FileText, Clock, AlertCircle, CheckCircle,
} from "lucide-react";

// ── Código provisional ────────────────────────────────────────
const generarCodigoTemp = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BIEN-${year}-${rand}`;
};

const EMPTY = () => ({
  codigo:          generarCodigoTemp(),
  nombre:          "",
  descripcion:     "",
  categoria:       "",
  estado:          "ACTIVO",
  valor:           "",
  fechaIngreso:    "",
  fecha_salida:    "",
  asignado_a:      "",
  tipo_asignacion: "",
  imagen:          null,
  foto_preview:    null,
});

// ── Mapa campo → pestaña ──────────────────────────────────────
const TAB_DE_CAMPO = {
  nombre:       "datos",
  categoria:    "datos",
  estado:       "datos",
  valor:        "datos",
  fechaIngreso: "datos",
};

// ── Validación ────────────────────────────────────────────────
const validar = (form) => {
  const e = {};
  if (!form.nombre.trim())                       e.nombre       = "Nombre obligatorio";
  if (!form.categoria)                           e.categoria    = "Seleccione una categoría";
  if (!form.estado)                              e.estado       = "Seleccione un estado";
  if (!form.valor || Number(form.valor) <= 0)    e.valor        = "Valor debe ser mayor a 0";
  if (!form.fechaIngreso)                        e.fechaIngreso = "Fecha de entrada obligatoria";
  return e;
};

// ─────────────────────────────────────────────────────────────
const ModalCrearBien = ({ onClose, onCreate, categoriasDisponibles = [] }) => {
  const [form,          setForm]          = useState(EMPTY());
  const [errores,       setErrores]       = useState({});
  const [intentoGuardar,setIntentoGuardar]= useState(false);
  const [tabActiva,     setTabActiva]     = useState("datos");
  const [hayCambios,    setHayCambios]    = useState(false);

  // Revocar blob al desmontar
  useEffect(() => {
    return () => {
      if (form.foto_preview?.startsWith("blob:")) URL.revokeObjectURL(form.foto_preview);
    };
  }, [form.foto_preview]);

  // ── Helpers ────────────────────────────────────────────────
  const limpiarError = (name) => {
    if (intentoGuardar && errores[name]) {
      setErrores(p => { const n = { ...p }; delete n[name]; return n; });
    }
  };

  const tabTieneError = (key) =>
    Object.keys(errores).some(c => TAB_DE_CAMPO[c] === key);

  const clsGrupo = (campo) =>
    errores[campo] ? " dn-field-error" : "";

  // ── Handlers ───────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setHayCambios(true);
    limpiarError(name);
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrores(p => ({ ...p, imagen: "La imagen no debe superar 5 MB" }));
      return;
    }
    if (!file.type.startsWith("image/")) {
      setErrores(p => ({ ...p, imagen: "Solo se permiten imágenes" }));
      return;
    }
    if (form.foto_preview?.startsWith("blob:")) URL.revokeObjectURL(form.foto_preview);
    setForm(p => ({ ...p, imagen: file, foto_preview: URL.createObjectURL(file) }));
    setHayCambios(true);
  };

  const eliminarFoto = () => {
    if (form.foto_preview?.startsWith("blob:")) URL.revokeObjectURL(form.foto_preview);
    setForm(p => ({ ...p, imagen: null, foto_preview: null }));
    setHayCambios(true);
  };

  const handleGuardar = (e) => {
    e.preventDefault();
    setIntentoGuardar(true);
    const errs = validar(form);
    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      const primer = Object.keys(errs)[0];
      if (TAB_DE_CAMPO[primer]) setTabActiva(TAB_DE_CAMPO[primer]);
      return;
    }
    setErrores({});
    const payload = {
      ...form,
      valor:       parseFloat(form.valor),
      fechaIngreso: form.fechaIngreso ? new Date(form.fechaIngreso) : null,
      fecha_salida: form.fecha_salida ? new Date(form.fecha_salida) : null,
    };
    delete payload.foto_preview;
    onCreate(payload);
  };

  // ── Categorías agrupadas ───────────────────────────────────
  const grupos = categoriasDisponibles.reduce((acc, cat) => {
    const g = cat.grupo || "General";
    if (!acc[g]) acc[g] = [];
    acc[g].push(cat);
    return acc;
  }, {});

  // ── Render de pestañas ─────────────────────────────────────
  const renderTabs = () => (
    <>
      {/* ── Barra de pestañas ── */}
      <div className="dn-modal-tabs">
        {[
          { key: "datos",    label: "Datos",     ico: <FileText  size={14} /> },
          { key: "imagen",   label: "Fotografía",ico: <ImagePlus size={14} /> },
          { key: "auditoria",label: "Auditoría", ico: <Clock     size={14} /> },
        ].map(t => (
          <button
            key={t.key}
            type="button"
            className={`dn-tab-btn${tabActiva === t.key ? " active" : ""}${tabTieneError(t.key) ? " has-error" : ""}`}
            onClick={() => setTabActiva(t.key)}
          >
            {t.ico} {t.label}
            {tabTieneError(t.key) && (
              <span className="dn-tab-error-dot" aria-label="campos requeridos" />
            )}
          </button>
        ))}
      </div>

      {/* ══ TAB: Datos ══ */}
      {tabActiva === "datos" && (
        <div className="dn-tab-content">

          {/* Identificación */}
          <div className="dn-form-section-title">Identificación del Bien</div>
          <div className="dn-form-grid">

            {/* Código (readonly) */}
            <div className="dn-form-group">
              <label>Código (autogenerado)</label>
              <input
                value={form.codigo}
                readOnly
                title="Generado automáticamente por el sistema"
                style={{ color: "#6C4FBF", fontWeight: 700, background: "#f0ecff", cursor: "default" }}
              />
            </div>

            {/* Nombre */}
            <div className={`dn-form-group${clsGrupo("nombre")}`}>
              <label>Nombre del Bien <span className="req">*</span></label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ej: Laptop Dell Inspiron"
                className={errores.nombre ? "dn-input-err" : ""}
              />
              {errores.nombre && <span className="dn-err-msg">{errores.nombre}</span>}
            </div>

            {/* Categoría */}
            <div className={`dn-form-group${clsGrupo("categoria")}`}>
              <label>Categoría <span className="req">*</span></label>
              <select
                name="categoria"
                value={form.categoria}
                onChange={handleChange}
                className={errores.categoria ? "dn-input-err" : ""}
              >
                <option value="">Seleccione una categoría</option>
                {Object.entries(grupos).map(([grupo, cats]) => (
                  <optgroup key={grupo} label={grupo}>
                    {cats.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                  </optgroup>
                ))}
              </select>
              {errores.categoria && <span className="dn-err-msg">{errores.categoria}</span>}
            </div>

            {/* Estado */}
            <div className={`dn-form-group${clsGrupo("estado")}`}>
              <label>Estado Inicial <span className="req">*</span></label>
              <select
                name="estado"
                value={form.estado}
                onChange={handleChange}
                className={errores.estado ? "dn-input-err" : ""}
              >
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
                <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                <option value="PRESTAMO">PRÉSTAMO</option>
              </select>
              {errores.estado && <span className="dn-err-msg">{errores.estado}</span>}
            </div>

            {/* Valor */}
            <div className={`dn-form-group${clsGrupo("valor")}`}>
              <label>Valor (Lps.) <span className="req">*</span></label>
              <input
                type="number"
                name="valor"
                value={form.valor}
                onChange={handleChange}
                placeholder="Ej: 15000.00"
                step="0.01"
                min="0"
                className={errores.valor ? "dn-input-err" : ""}
              />
              {errores.valor && <span className="dn-err-msg">{errores.valor}</span>}
            </div>

            {/* Descripción */}
            <div className="dn-form-group dn-full">
              <label>Descripción</label>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                placeholder="Características, modelo, serie, observaciones..."
                maxLength={1000}
                rows={3}
              />
              <small className="dn-char">{form.descripcion.length}/1000</small>
            </div>
          </div>

          {/* Fechas */}
          <div className="dn-form-section-title" style={{ marginTop: 20 }}>Fechas del Activo</div>
          <div className="dn-form-grid">

            <div className={`dn-form-group${clsGrupo("fechaIngreso")}`}>
              <label>Fecha de Entrada <span className="req">*</span></label>
              <input
                type="date"
                name="fechaIngreso"
                value={form.fechaIngreso}
                onChange={handleChange}
                max={new Date().toISOString().split("T")[0]}
                className={errores.fechaIngreso ? "dn-input-err" : ""}
              />
              {errores.fechaIngreso
                ? <span className="dn-err-msg">{errores.fechaIngreso}</span>
                : <small className="dn-hint">Fecha real de ingreso del activo</small>}
            </div>

            <div className="dn-form-group">
              <label>Fecha de Salida / Baja</label>
              <input
                type="date"
                name="fecha_salida"
                value={form.fecha_salida}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Asignación */}
          <div className="dn-form-section-title" style={{ marginTop: 20 }}>Asignación del Bien</div>
          <div className="dn-form-grid">

            <div className="dn-form-group">
              <label>Tipo de Asignación</label>
              <select name="tipo_asignacion" value={form.tipo_asignacion} onChange={handleChange}>
                <option value="">Sin asignación específica</option>
                <option value="Persona">Persona</option>
                <option value="Aula">Aula</option>
                <option value="Departamento">Departamento</option>
                <option value="Almacén">Almacén</option>
              </select>
            </div>

            <div className="dn-form-group">
              <label>Asignado A</label>
              <input
                name="asignado_a"
                value={form.asignado_a}
                onChange={handleChange}
                placeholder={
                  form.tipo_asignacion === "Persona"     ? "Nombre del responsable" :
                  form.tipo_asignacion === "Aula"        ? "Ej: Aula 3-B" :
                  form.tipo_asignacion === "Departamento"? "Ej: Depto. de Cuerdas" :
                  "Persona, aula o departamento"
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: Fotografía ══ */}
      {tabActiva === "imagen" && (
        <div className="dn-tab-content">
          <div className="dn-form-section-title">Fotografía del Bien</div>
          <div className="dn-upload-area">
            {form.foto_preview ? (
              <div className="dn-preview-wrap">
                <img src={form.foto_preview} alt="Preview" className="dn-img-preview" />
                <div className="dn-preview-actions">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFotoChange}
                    style={{ display: "none" }}
                    id="bien-foto-replace"
                  />
                  <label htmlFor="bien-foto-replace" className="dn-btn-secondary">
                    <Upload size={15} /> Cambiar foto
                  </label>
                  <button type="button" className="dn-btn-danger-sm" onClick={eliminarFoto}>
                    <X size={15} /> Eliminar
                  </button>
                </div>
              </div>
            ) : (
              <div className="dn-upload-empty">
                <Upload size={42} color="#9b59b6" style={{ marginBottom: "0.75rem" }} />
                <p>Arrastra una imagen o haz clic para seleccionar</p>
                <input
                  type="file"
                  accept=".jpg,.jpeg,image/*"
                  onChange={handleFotoChange}
                  style={{ display: "none" }}
                  id="bien-foto-upload"
                />
                <label htmlFor="bien-foto-upload" className="dn-btn-primary-sm">
                  <ImagePlus size={16} /> Seleccionar imagen
                </label>
                <small>JPG, JPEG — máx. 5 MB</small>
                {errores.imagen && <span className="dn-err-msg">{errores.imagen}</span>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ TAB: Auditoría ══ */}
      {tabActiva === "auditoria" && (
        <div className="dn-tab-content">
          <p style={{ color: "#999", textAlign: "center", padding: "2rem" }}>
            La auditoría estará disponible luego de guardar el bien.
          </p>
        </div>
      )}
    </>
  );

  // ── JSX principal ──────────────────────────────────────────
  return (
    <motion.div
      className="dn-overlay"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="dn-modal"
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.85, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 40 }}
        transition={{ type: "spring", damping: 22 }}
      >
        {/* Header */}
        <div className="dn-modal-header">
          <h3><Plus size={20} /> Registrar Nuevo Bien</h3>
          <button className="dn-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Banner cambios sin guardar */}
        {hayCambios && (
          <div className="dn-unsaved-banner">⚠️ Tienes cambios sin guardar</div>
        )}

        {/* Formulario con pestañas */}
        <form onSubmit={handleGuardar} noValidate>
          {renderTabs()}

          {/* Footer */}
          <div className="dn-modal-footer">
            <button type="button" className="dn-btn-cancel" onClick={onClose}>
              <X size={15} /> Cancelar
            </button>
            <button type="submit" className="dn-btn-save">
              <Save size={15} /> Guardar Bien
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ModalCrearBien;