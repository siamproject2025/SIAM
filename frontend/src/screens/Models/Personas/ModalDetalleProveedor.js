// ============================================================
// ModalDetalleProveedor.js
// Diseño IDÉNTICO al ModalDetalleBien:
//   • Overlay + modal con clases dn-*
//   • Pestañas: Datos | Auditoría
//   • Punto rojo animado en pestaña con errores
//   • Banner "cambios sin guardar"
//   • Shake en campos inválidos al intentar guardar
//   • Botones Eliminar / Cancelar / Guardar en footer (igual estilo S.btn)
//   • AnimatePresence + spring de framer-motion
//   • Conserva TODOS los campos y validaciones originales de Proveedores
// ============================================================
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit, X, Save, Plus, Trash2,
  FileText, Clock, UserCheck, Building2,
} from "lucide-react";
import ConfirmDialog from "../../../components/ConfirmDialog/ConfirmDialog";

// ── Mapa campo → pestaña ──────────────────────────────────────
const TAB_DE_CAMPO = {
  nombre:    "datos",
  empresa:   "datos",
  email:     "datos",
  telefono:  "datos",
  direccion: "datos",
  ciudad:    "datos",
  pais:      "datos",
  rtn:       "datos",
};

// ── Validación ────────────────────────────────────────────────
const validar = (form) => {
  const e = {};
  if (!form.nombre?.trim())
    e.nombre = "El nombre es obligatorio";
  if (!form.empresa?.trim())
    e.empresa = "La empresa es obligatoria";
  if (!form.email?.trim())
    e.email = "El email es obligatorio";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    e.email = "El email no tiene un formato válido";
  if (!form.telefono?.trim())
    e.telefono = "El teléfono es obligatorio";
  if (!form.direccion?.trim())
    e.direccion = "La dirección es obligatoria";
  if (!form.ciudad?.trim())
    e.ciudad = "La ciudad es obligatoria";
  if (!form.pais?.trim())
    e.pais = "El país es obligatorio";
  if (!form.rtn?.trim())
    e.rtn = "El RTN es obligatorio";
  else if (form.rtn.length !== 14)
    e.rtn = "El RTN debe tener exactamente 14 dígitos";
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

// ── Formulario vacío para modo crear ─────────────────────────
const FORM_VACIO = {
  nombre: "", empresa: "", email: "", telefono: "",
  direccion: "", ciudad: "", pais: "", contacto: "",
  sitio_web: "", rtn: "", tipo_proveedor: "PRODUCTOS",
  estado: "ACTIVO", calificacion: 5, notas: "",
  condiciones_pago: "", tiempo_entrega_promedio: "",
};

const generarIdProveedor = () => {
  const t = Date.now().toString();
  const r = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return parseInt(t.slice(-3) + r);
};

// ─────────────────────────────────────────────────────────────
const ModalDetalleProveedor = ({
  proveedor,
  modoCrear = false,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [form, setForm] = useState(
    modoCrear ? { ...FORM_VACIO } : { ...proveedor }
  );
  const [errores,           setErrores]           = useState({});
  const [intentoGuardar,    setIntentoGuardar]    = useState(false);
  const [hayCambios,        setHayCambios]        = useState(modoCrear);
  const [tabActiva,         setTabActiva]         = useState("datos");
  const [showConfirm,       setShowConfirm]       = useState(false);
  const [showConfirmCerrar, setShowConfirmCerrar] = useState(false);

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
    if (hayCambios && !modoCrear) setShowConfirmCerrar(true);
    else onClose();
  };

  // ── Handlers ───────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    // RTN: solo números, máx 14
    if (name === "rtn") {
      const solo = value.replace(/\D/g, "").slice(0, 14);
      setForm(p => ({ ...p, rtn: solo }));
      setHayCambios(true);
      limpiarError("rtn");
      return;
    }
    setForm(p => ({ ...p, [name]: value }));
    setHayCambios(true);
    limpiarError(name);
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
      nombre:                  form.nombre,
      empresa:                 form.empresa,
      email:                   form.email,
      telefono:                form.telefono,
      direccion:               form.direccion,
      ciudad:                  form.ciudad,
      pais:                    form.pais,
      contacto:                form.contacto || "",
      sitio_web:               form.sitio_web || "",
      rtn:                     form.rtn,
      tipo_proveedor:          form.tipo_proveedor || "PRODUCTOS",
      estado:                  form.estado || "ACTIVO",
      calificacion:            parseInt(form.calificacion) || 5,
      notas:                   form.notas || "",
      condiciones_pago:        form.condiciones_pago || "",
      tiempo_entrega_promedio: form.tiempo_entrega_promedio
        ? parseInt(form.tiempo_entrega_promedio) : undefined,
    };

    if (modoCrear) {
      onCreate({ ...payload, id_proveedor: generarIdProveedor() });
    } else {
      onUpdate(proveedor._id, payload);
    }
    setHayCambios(false);
  };

  // ── Render de pestañas ─────────────────────────────────────
  const renderTabs = () => (
    <>
      {/* Barra de pestañas */}
      <div className="dn-modal-tabs">
        {[
          { key: "datos",     label: "Datos",     ico: <FileText    size={14} /> },
          { key: "auditoria", label: "Auditoría", ico: <Clock       size={14} />, hidden: modoCrear },
        ].filter(t => !t.hidden).map(t => (
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

          {/* Sección 1 — Identidad Legal */}
          <div className="dn-form-section-title">
            <Building2 size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
            Ficha de Identidad Legal
          </div>
          <div className="dn-form-grid">

            <div className={`dn-form-group${clsGrupo("nombre")}`}>
              <label>Nombre <span className="req">*</span></label>
              <input
                name="nombre"
                value={form.nombre || ""}
                onChange={handleChange}
                placeholder="Nombre del proveedor"
                className={errores.nombre ? "dn-input-err" : ""}
              />
              {errores.nombre && <span className="dn-err-msg">{errores.nombre}</span>}
            </div>

              <div className={`dn-form-group${clsGrupo("rtn")}`}>
              <label>RTN <span className="req">*</span></label>
              <input
                name="rtn"
                value={form.rtn || ""}
                onChange={handleChange}
                placeholder="Ej: 08011985123456"
                maxLength={14}
                inputMode="numeric"
                className={errores.rtn ? "dn-input-err" : ""}
              />
              {(form.rtn || "").length > 0 && (form.rtn || "").length < 14 && (
                <small className="dn-hint" style={{ color: "#E74C3C" }}>{(form.rtn || "").length}/14 dígitos</small>
              )}
              {(form.rtn || "").length === 14 && (
                <small className="dn-hint" style={{ color: "#16a34a" }}>✓ RTN válido</small>
              )}
              {errores.rtn && <span className="dn-err-msg">{errores.rtn}</span>}
            </div>


            <div className={`dn-form-group${clsGrupo("empresa")}`}>
              <label>Empresa <span className="req">*</span></label>
              <input
                name="empresa"
                value={form.empresa || ""}
                onChange={handleChange}
                placeholder="Nombre de la empresa"
                className={errores.empresa ? "dn-input-err" : ""}
              />
              {errores.empresa && <span className="dn-err-msg">{errores.empresa}</span>}
            </div>

          
            <div className="dn-form-group">
              <label>Tipo de Proveedor</label>
              <select name="tipo_proveedor" value={form.tipo_proveedor || "PRODUCTOS"} onChange={handleChange}>
                <option value="PRODUCTOS">PRODUCTOS</option>
                <option value="SERVICIOS">SERVICIOS</option>
                <option value="MIXTO">MIXTO</option>
              </select>
            </div>
          </div>

          {/* Sección 2 — Contacto */}
          <div className="dn-form-section-title" style={{ marginTop: 20 }}>
            Canales de Comunicación
          </div>
          <div className="dn-form-grid">

            <div className={`dn-form-group${clsGrupo("email")}`}>
              <label>Email <span className="req">*</span></label>
              <input
                type="email"
                name="email"
                value={form.email || ""}
                onChange={handleChange}
                placeholder="correo@empresa.com"
                className={errores.email ? "dn-input-err" : ""}
              />
              {errores.email && <span className="dn-err-msg">{errores.email}</span>}
            </div>

            <div className={`dn-form-group${clsGrupo("telefono")}`}>
              <label>Teléfono <span className="req">*</span></label>
              <input
                name="telefono"
                value={form.telefono || ""}
                onChange={handleChange}
                placeholder="+504 9999-9999"
                className={errores.telefono ? "dn-input-err" : ""}
              />
              {errores.telefono && <span className="dn-err-msg">{errores.telefono}</span>}
            </div>

            <div className="dn-form-group">
              <label>Persona de Contacto</label>
              <input
                name="contacto"
                value={form.contacto || ""}
                onChange={handleChange}
                placeholder="Nombre del contacto"
              />
            </div>

            <div className="dn-form-group">
              <label>Sitio Web</label>
              <input
                name="sitio_web"
                value={form.sitio_web || ""}
                onChange={handleChange}
                placeholder="https://empresa.com"
              />
            </div>
          </div>

          {/* Sección 3 — Ubicación */}
          <div className="dn-form-section-title" style={{ marginTop: 20 }}>
            Ubicación
          </div>
          <div className="dn-form-grid">

            <div className={`dn-form-group dn-full${clsGrupo("direccion")}`}>
              <label>Dirección <span className="req">*</span></label>
              <input
                name="direccion"
                value={form.direccion || ""}
                onChange={handleChange}
                placeholder="Dirección completa"
                className={errores.direccion ? "dn-input-err" : ""}
              />
              {errores.direccion && <span className="dn-err-msg">{errores.direccion}</span>}
            </div>

            <div className={`dn-form-group${clsGrupo("ciudad")}`}>
              <label>Ciudad <span className="req">*</span></label>
              <input
                name="ciudad"
                value={form.ciudad || ""}
                onChange={handleChange}
                placeholder="Tegucigalpa"
                className={errores.ciudad ? "dn-input-err" : ""}
              />
              {errores.ciudad && <span className="dn-err-msg">{errores.ciudad}</span>}
            </div>

            <div className={`dn-form-group${clsGrupo("pais")}`}>
              <label>País <span className="req">*</span></label>
              <input
                name="pais"
                value={form.pais || ""}
                onChange={handleChange}
                placeholder="Honduras"
                className={errores.pais ? "dn-input-err" : ""}
              />
              {errores.pais && <span className="dn-err-msg">{errores.pais}</span>}
            </div>
          </div>

          {/* Sección 4 — Condiciones Comerciales */}
          <div className="dn-form-section-title" style={{ marginTop: 20 }}>
            Condiciones Comerciales
          </div>
          <div className="dn-form-grid">

            <div className="dn-form-group">
              <label>Estado</label>
              <select name="estado" value={form.estado || "ACTIVO"} onChange={handleChange}>
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
                <option value="SUSPENDIDO">SUSPENDIDO</option>
              </select>
            </div>

            <div className="dn-form-group">
              <label>Condiciones de Pago</label>
              <input
                name="condiciones_pago"
                value={form.condiciones_pago || ""}
                onChange={handleChange}
                placeholder="Ej: 30 días"
              />
            </div>

            <div className="dn-form-group">
              <label>Tiempo de Entrega (días)</label>
              <input
                type="number"
                name="tiempo_entrega_promedio"
                value={form.tiempo_entrega_promedio || ""}
                onChange={handleChange}
                placeholder="Días promedio"
                min="0"
              />
            </div>

            <div className="dn-form-group">
              <label>Calificación (1–5)</label>
              <select
                name="calificacion"
                value={form.calificacion || 5}
                onChange={handleChange}
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{"★".repeat(n) + "☆".repeat(5 - n)} ({n})</option>
                ))}
              </select>
            </div>

            <div className="dn-form-group dn-full">
              <label>Notas internas</label>
              <textarea
                name="notas"
                value={form.notas || ""}
                onChange={handleChange}
                placeholder="Comentarios, condiciones especiales, historial..."
                maxLength={500}
                rows={3}
              />
              <small className="dn-char">{(form.notas || "").length}/500</small>
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: Auditoría ══ */}
      {tabActiva === "auditoria" && !modoCrear && (
        <div className="dn-tab-content">
          <div className="dn-form-section-title">Auditoría del Proveedor</div>
          <div className="dn-audit-card">

            {/* Creación */}
            <div className="dn-audit-row">
              <UserCheck size={16} className="dn-audit-ico" />
              <div>
                <div className="dn-audit-label">Creación</div>
                <div className="dn-audit-val">
                  Creado por:{" "}
                  <strong>{proveedor.creado_por_email || proveedor.creado_por || "N/D"}</strong>
                  &nbsp;·&nbsp;
                  Fecha:{" "}
                  <strong>{formatFecha(proveedor.fecha_creacion || proveedor.createdAt)}</strong>
                </div>
              </div>
            </div>

            {/* Última actualización */}
            {(proveedor.actualizado_por || proveedor.actualizado_por_email || proveedor.updatedAt) && (
              <div className="dn-audit-row">
                <Clock size={16} className="dn-audit-ico" />
                <div>
                  <div className="dn-audit-label">Última Actualización</div>
                  <div className="dn-audit-val">
                    Por:{" "}
                    <strong>{proveedor.actualizado_por_email || proveedor.actualizado_por || "N/D"}</strong>
                    &nbsp;·&nbsp;
                    <strong>{formatFecha(proveedor.fecha_actualizacion || proveedor.updatedAt)}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* IDs */}
            <div className="dn-audit-ids">
              <small>ID del proveedor: <strong>{proveedor._id}</strong></small>
              <small>ID numérico: <strong>#{proveedor.id_proveedor}</strong></small>
              <small>Estado: <strong>{proveedor.estado || "N/D"}</strong></small>
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
          <h3>
            {modoCrear ? <Plus size={20} /> : <Edit size={20} />}
            {" "}
            {modoCrear ? "Nuevo Proveedor" : "Editar Proveedor"}
          </h3>
          <button className="dn-modal-close" onClick={handleCerrar}><X size={18} /></button>
        </div>

        {/* Banner cambios sin guardar */}
        {hayCambios && !modoCrear && (
          <div className="dn-unsaved-banner">⚠️ Tienes cambios sin guardar</div>
        )}

        {/* Formulario con pestañas */}
        <form onSubmit={handleGuardar} noValidate>
          {renderTabs()}

          {/* Footer */}
          <div className="dn-modal-footer">
            {!modoCrear && (
              <button
                type="button"
                style={S.btn("#E74C3C")}
                onClick={() => setShowConfirm(true)}
              >
                Eliminar
              </button>
            )}
            <button type="button" style={S.btn("#E0D9F5", "#6C4FBF")} onClick={handleCerrar}>
              Cancelar
            </button>
            <button type="submit" style={S.btn("#6C4FBF")}>
              {modoCrear
                ? <> Guardar</>
                : <> Guardar</>
              }
            </button>
          </div>
        </form>

        {/* Confirm eliminar */}
        {showConfirm && (
          <ConfirmDialog
            message={`¿Seguro que deseas eliminar el proveedor "${form.nombre}"?`}
            onConfirm={() => {
              if (proveedor?._id) onDelete(proveedor._id);
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

const S = {
  btn: (bg, col = "#fff") => ({
    display: "inline-flex", alignItems: "center", gap: 7,
    padding: "10px 20px", borderRadius: 10, fontSize: ".86rem",
    fontWeight: 700, border: "none", cursor: "pointer",
    background: bg, color: col, fontFamily: "inherit", transition: "all .18s",
  }),
};

export default ModalDetalleProveedor;