// ============================================================
// ModalDetalleBien.js
// Diseño idéntico al modal de Donaciones:
//   • Overlay + modal con clases dn-*
//   • Pestañas: Datos | Fotografía | Auditoría
//   • Punto rojo animado en pestaña con errores
//   • Banner "cambios sin guardar" + banner "anulada" si aplica
//   • Shake en campos inválidos al intentar guardar
//   • Botones Eliminar / Cancelar / Guardar en footer
//   • AnimatePresence + spring de framer-motion
// ============================================================
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit, X, Save, ImagePlus, Upload, Trash2,
  FileText, Clock, UserCheck,
} from "lucide-react";
import ConfirmDialog from "../../../components/ConfirmDialog/ConfirmDialog";

// ── Mapa campo → pestaña ──────────────────────────────────────
const TAB_DE_CAMPO = {
  nombre:       "datos",
  categoria:    "datos",
  estado:       "datos",
  valor:        "datos",
  fecha_entrada:"datos",
};

// ── Validación ────────────────────────────────────────────────
const validar = (form) => {
  const e = {};
  if (!form.nombre?.trim())                       e.nombre       = "Nombre obligatorio";
  if (!form.categoria)                            e.categoria    = "Seleccione una categoría";
  if (!form.estado)                               e.estado       = "Seleccione un estado";
  if (!form.valor || Number(form.valor) <= 0)     e.valor        = "Valor debe ser mayor a 0";
  if (!form.fecha_entrada)                        e.fecha_entrada= "Fecha de entrada obligatoria";
  return e;
};

// ── Helper fecha ──────────────────────────────────────────────
const formatFecha = (fecha) => {
  if (!fecha || fecha === "null") return "No registrado";
  const s = typeof fecha === "string" ? fecha : new Date(fecha).toISOString();
  const datePart = s.slice(0, 10);
  const [y, m, d] = datePart.split("-");
  if (s.includes("T")) {
    const timePart = s.slice(11, 16);
    return `${d}/${m}/${y} ${timePart}`;
  }
  return `${d}/${m}/${y}`;
};

// ─────────────────────────────────────────────────────────────
const ModalDetalleBien = ({ bien, onClose, onUpdate, onDelete, categoriasDisponibles = [] }) => {
  const [form, setForm] = useState({
    ...bien,
    fecha_entrada: bien.fechaIngreso
      ? (typeof bien.fechaIngreso === "string" ? bien.fechaIngreso.slice(0, 10) : new Date(bien.fechaIngreso).toISOString().slice(0, 10))
      : "",
    fecha_salida: bien.fecha_salida
      ? (typeof bien.fecha_salida === "string" ? bien.fecha_salida.slice(0, 10) : new Date(bien.fecha_salida).toISOString().slice(0, 10))
      : "",
    eliminado_por:       bien.eliminado_por       === "null" ? null : bien.eliminado_por,
    eliminado_por_email: bien.eliminado_por_email === "null" ? null : bien.eliminado_por_email,
    fecha_eliminacion:   bien.fecha_eliminacion   === "null" ? null : bien.fecha_eliminacion,
    foto_preview:
      bien.imagen && bien.imagen !== "null" && bien.imagen !== ""
        ? `data:${bien.tipo_imagen || "image/png"};base64,${bien.imagen}`
        : null,
  });

  const [errores,        setErrores]        = useState({});
  const [intentoGuardar, setIntentoGuardar] = useState(false);
  const [hayCambios,     setHayCambios]     = useState(false);
  const [tabActiva,      setTabActiva]      = useState("datos");
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [showConfirmCerrar, setShowConfirmCerrar] = useState(false);

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

  const handleCerrar = () => {
    if (hayCambios) setShowConfirmCerrar(true);
    else onClose();
  };

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

    const dataToUpdate = {
      _id:         bien._id,
      nombre:      form.nombre,
      descripcion: form.descripcion || "",
      categoria:   form.categoria,
      estado:      form.estado,
      valor:       parseFloat(form.valor),
      fechaIngreso:form.fecha_entrada,
    };
    if (form.tipo_asignacion?.trim()) dataToUpdate.tipo_asignacion = form.tipo_asignacion;
    if (form.asignado_a?.trim())      dataToUpdate.asignado_a      = form.asignado_a;
    if (form.fecha_salida?.trim())    dataToUpdate.fecha_salida    = form.fecha_salida;

    if (form.imagen instanceof File) {
      const fd = new FormData();
      Object.entries(dataToUpdate).forEach(([k, v]) => fd.append(k, v));
      fd.append("imagen", form.imagen);
      onUpdate(bien._id, fd);
    } else {
      onUpdate(bien._id, dataToUpdate);
    }
    setHayCambios(false);
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
                value={form.codigo || ""}
                readOnly
                title="El código no puede modificarse"
                style={{ color: "#6C4FBF", fontWeight: 700, background: "#f0ecff", cursor: "default" }}
              />
            </div>

            {/* Nombre */}
            <div className={`dn-form-group${clsGrupo("nombre")}`}>
              <label>Nombre del Bien <span className="req">*</span></label>
              <input
                name="nombre"
                value={form.nombre || ""}
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
                value={form.categoria || ""}
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
              <label>Estado Actual <span className="req">*</span></label>
              <select
                name="estado"
                value={form.estado || ""}
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
                value={form.valor || ""}
                onChange={handleChange}
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
                value={form.descripcion || ""}
                onChange={handleChange}
                placeholder="Características, modelo, serie..."
                maxLength={1000}
                rows={3}
              />
              <small className="dn-char">{(form.descripcion || "").length}/1000</small>
            </div>
          </div>

          {/* Fechas */}
          <div className="dn-form-section-title" style={{ marginTop: 20 }}>Fechas del Activo</div>
          <div className="dn-form-grid">

            <div className={`dn-form-group${clsGrupo("fecha_entrada")}`}>
              <label>Fecha de Entrada <span className="req">*</span></label>
              <input
                type="date"
                name="fecha_entrada"
                value={form.fecha_entrada || ""}
                onChange={handleChange}
                className={errores.fecha_entrada ? "dn-input-err" : ""}
              />
              {errores.fecha_entrada
                ? <span className="dn-err-msg">{errores.fecha_entrada}</span>
                : <small className="dn-hint">Fecha real de ingreso del activo</small>}
            </div>

            <div className="dn-form-group">
              <label>Fecha de Salida / Baja</label>
              <input
                type="date"
                name="fecha_salida"
                value={form.fecha_salida || ""}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Asignación */}
          <div className="dn-form-section-title" style={{ marginTop: 20 }}>Asignación del Bien</div>
          <div className="dn-form-grid">

            <div className="dn-form-group">
              <label>Tipo de Asignación</label>
              <select name="tipo_asignacion" value={form.tipo_asignacion || ""} onChange={handleChange}>
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
                value={form.asignado_a || ""}
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
                    id="bien-foto-editar-replace"
                  />
                  <label htmlFor="bien-foto-editar-replace" className="dn-btn-secondary">
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
                  accept="image/*"
                  onChange={handleFotoChange}
                  style={{ display: "none" }}
                  id="bien-foto-editar-new"
                />
                <label htmlFor="bien-foto-editar-new" className="dn-btn-primary-sm">
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
          <div className="dn-form-section-title">Auditoría del Bien</div>
          <div className="dn-audit-card">

            {/* Creación */}
            <div className="dn-audit-row">
              <UserCheck size={16} className="dn-audit-ico" />
              <div>
                <div className="dn-audit-label">Creación</div>
                <div className="dn-audit-val">
                  Creado por:{" "}
                  <strong>{bien.creado_por_email || bien.creado_por || "N/D"}</strong>
                  &nbsp;·&nbsp;
                  Fecha registro:{" "}
                  <strong>{formatFecha(bien.fecha_creacion || bien.createdAt)}</strong>
                </div>
              </div>
            </div>

            {/* Última actualización */}
            {(bien.actualizado_por || bien.actualizado_por_email || bien.updatedAt) && (
              <div className="dn-audit-row">
                <Clock size={16} className="dn-audit-ico" />
                <div>
                  <div className="dn-audit-label">Última Actualización</div>
                  <div className="dn-audit-val">
                    Por:{" "}
                    <strong>{bien.actualizado_por_email || bien.actualizado_por || "N/D"}</strong>
                    &nbsp;·&nbsp;
                    <strong>{formatFecha(bien.fecha_actualizacion || bien.updatedAt)}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* IDs */}
            <div className="dn-audit-ids">
              <small>ID del bien: <strong>{bien._id}</strong></small>
              <small>Estado: <strong>{bien.estado || "N/D"}</strong></small>
              {bien.codigo && <small>Código: <strong>{bien.codigo}</strong></small>}
            </div>
          </div>
        </div>
      )}
    </>
  );

  // ── JSX principal ──────────────────────────────────────────
  return (
    <motion.div
      className="dn-overlay"
      onClick={handleCerrar}
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
          <h3><Edit size={20} /> Editar Bien</h3>
          <button className="dn-modal-close" onClick={handleCerrar}><X size={18} /></button>
        </div>

        {/* Banners */}
        {hayCambios && (
          <div className="dn-unsaved-banner">⚠️ Tienes cambios sin guardar</div>
        )}

        {/* Formulario con pestañas */}
        <form onSubmit={handleGuardar} noValidate>
          {renderTabs()}

          {/* Footer */}
          <div className="dn-modal-footer">
            <button
              type="button"
              className="dn-btn-delete"
              onClick={() => setShowConfirm(true)}
            >
              <Trash2 size={15} /> Eliminar
            </button>
            <button type="button" className="dn-btn-cancel" onClick={handleCerrar}>
              Cancelar
            </button>
            <button type="submit" className="dn-btn-save">
              <Save size={15} /> Guardar Cambios
            </button>
          </div>
        </form>

        {/* Confirm eliminar */}
        {showConfirm && (
          <ConfirmDialog
            message={`¿Seguro que deseas eliminar el bien "${form.nombre}"?`}
            onConfirm={() => {
              if (bien?._id) onDelete(bien._id);
              setShowConfirm(false);
            }}
            onCancel={() => setShowConfirm(false)}
            visible={showConfirm}
          />
        )}

        {/* Confirm cerrar con cambios */}
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

export default ModalDetalleBien;