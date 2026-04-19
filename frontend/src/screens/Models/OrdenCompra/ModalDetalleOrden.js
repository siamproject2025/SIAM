// ============================================================
// ModalDetalleOrden.js
// Fixes:
//  - handleGuardar: llamada correcta a onUpdate sin e.preventDefault() incorrecto
//  - proveedor_id: normalizado correctamente al inicializar
//  - validación de numero deshabilitada (es autoincremental, no editable)
//  - items: edición inline con números sin NaN
//  - PDF: usa moneda HNL correctamente
//  - onDelete recibe orden._id directamente
// ============================================================
import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit, X, Save, FileText, Clock, UserCheck,
  ShoppingCart, Trash2, Download, Plus
} from "lucide-react";
import jsPDF       from "jspdf";
import autoTable   from "jspdf-autotable";
import ConfirmDialog from "../../../components/ConfirmDialog/ConfirmDialog";

// ── Mapa campo → pestaña ──────────────────────────────────────
const TAB_DE_CAMPO = {
  estado: "datos",
  fecha:  "datos",
  items:  "items",
};

// ── Validación ─────────────────────────────────────────────
const validar = (form) => {
  const e = {};
  if (!form.estado)                                            e.estado = "El estado es obligatorio";
  if (!form.items || form.items.length === 0)                  e.items  = "La orden debe tener al menos un ítem";
  else if (form.items.some(i => !i.descripcion?.trim() || (i.cantidad || 0) <= 0 || (i.costoUnit || 0) < 0))
    e.items = "Todos los ítems deben tener descripción, cantidad > 0 y costo válido";
  return e;
};

// ── Helper fecha ────────────────────────────────────────────
const formatFecha = (fecha) => {
  if (!fecha || fecha === "null") return "No registrado";
  try {
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return "No registrado";
    // UTC a GMT-6 Honduras (America/Tegucigalpa)
    const offsetMs = -6 * 60 * 60 * 1000;
    const local = new Date(date.getTime() + offsetMs);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(local.getUTCDate())}/${pad(local.getUTCMonth() + 1)}/${local.getUTCFullYear()} ${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`;
  } catch {
    return "No registrado";
  }
};

const formatFechaDatetimeLocal = (fecha) => {
  if (!fecha) return "";
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return "";
  
  // Formato: YYYY-MM-DDThh:mm
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// ── Estilos inline ──────────────────────────────────────────
const S = {
  btn: (bg, col = "#fff") => ({
    display: "inline-flex", alignItems: "center", gap: 7,
    padding: "10px 20px", borderRadius: 10, fontSize: ".86rem",
    fontWeight: 700, border: "none", cursor: "pointer",
    background: bg, color: col, fontFamily: "inherit", transition: "all .18s"
  }),
  btnSm: (bg, col = "#fff") => ({
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "6px 14px", borderRadius: 8, fontSize: ".8rem",
    fontWeight: 700, border: "none", cursor: "pointer",
    background: bg, color: col, fontFamily: "inherit"
  }),
};

// ─────────────────────────────────────────────────────────────
const ModalDetalleOrden = ({ orden, onClose, onUpdate, onDelete, proveedores = [] }) => {

  // FIX: Normalizar proveedor_id al objeto o al string _id correctamente
  const [form, setForm] = useState(() => {
    const o = { ...orden };
    // Si proveedor_id es un objeto populate, extraer el _id
    if (o.proveedor_id && typeof o.proveedor_id === "object" && o.proveedor_id._id) {
      o.proveedor_id = o.proveedor_id._id;
    }
    // Normalizar items: asegurar que cantidad y costoUnit sean números
    o.items = (o.items || []).map(i => ({
      ...i,
      cantidad:  Number(i.cantidad)  || 0,
      costoUnit: Number(i.costoUnit) || 0,
    }));
    return {
      ...o,
      fecha: o.fecha
        ? (typeof o.fecha === "string" ? o.fecha.slice(0, 10) : new Date(o.fecha).toISOString().slice(0, 10))
        : "",
    };
  });

  const [errores,           setErrores]           = useState({});
  const [intentoGuardar,    setIntentoGuardar]     = useState(false);
  const [hayCambios,        setHayCambios]         = useState(false);
  const [tabActiva,         setTabActiva]          = useState("datos");
  const [showConfirm,       setShowConfirm]        = useState(false);
  const [showConfirmCerrar, setShowConfirmCerrar]  = useState(false);

  // ── Calcular total ────────────────────────────────────────
  const calcularTotal = useCallback((items = []) =>
    items.reduce((acc, i) => acc + (Number(i.cantidad) || 0) * (Number(i.costoUnit) || 0), 0), []);

  const limpiarError = (name) => {
    if (intentoGuardar && errores[name]) {
      setErrores(p => { const n = { ...p }; delete n[name]; return n; });
    }
  };

  const tabTieneError = (key) =>
    Object.keys(errores).some(c => TAB_DE_CAMPO[c] === key);

  const handleCerrar = () => {
    if (hayCambios) setShowConfirmCerrar(true);
    else onClose();
  };

  // ── Cambios en campos simples ─────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setHayCambios(true);
    limpiarError(name);
  };

  // ── Ítems ─────────────────────────────────────────────────
  const handleEditarItem = (idx, campo, valor) => {
    const nuevosItems = form.items.map((item, i) =>
      i === idx
        ? {
            ...item,
            [campo]: (campo === "cantidad" || campo === "costoUnit")
              ? (valor === "" ? "" : parseFloat(valor) || 0)
              : valor
          }
        : item
    );
    setForm(p => ({ ...p, items: nuevosItems }));
    setHayCambios(true);
    limpiarError("items");
  };

  const handleEliminarItem = (idx) => {
    setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
    setHayCambios(true);
  };

  const handleAgregarItem = () => {
    setForm(p => ({
      ...p,
      items: [...(p.items || []), { descripcion: "", cantidad: 1, costoUnit: 0 }]
    }));
    setHayCambios(true);
  };

  // ── Guardar ───────────────────────────────────────────────
  // FIX: No recibe evento aquí; se llama desde button type="button" + onClick
  const handleGuardar = () => {
    setIntentoGuardar(true);
    // Normalizar items antes de validar (valores vacíos → 0)
    const formNormalizado = {
      ...form,
      items: form.items.map(i => ({
        ...i,
        cantidad:  Number(i.cantidad)  || 0,
        costoUnit: Number(i.costoUnit) || 0,
      }))
    };
    const errs = validar(formNormalizado);
    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      const primer = Object.keys(errs)[0];
      if (TAB_DE_CAMPO[primer]) setTabActiva(TAB_DE_CAMPO[primer]);
      return;
    }
    setErrores({});
    onUpdate(formNormalizado._id, formNormalizado);
    setHayCambios(false);
  };

  // ── PDF ───────────────────────────────────────────────────
  const handleDescargarPDF = () => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const provObj = typeof form.proveedor_id === "string"
        ? proveedores.find(p => p._id === form.proveedor_id)
        : orden.proveedor_id;

      try { doc.addImage("/Logo1.png", "PNG", 15, 10, 25, 25); }
      catch { /* logo opcional */ }

      doc.setFontSize(16);
      doc.setTextColor(0, 102, 204);
      doc.setFont("helvetica", "bold");
      doc.text("Escuela Experimental de Niños para la Música", 105, 20, { align: "center" });
      doc.setDrawColor(0, 102, 204);
      doc.line(14, 25, 196, 25);
      doc.setFontSize(14);
      doc.text("ORDEN DE COMPRA", 105, 35, { align: "center" });

      const fechaActual = new Date().toLocaleDateString("es-HN");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);

      doc.text(`Empresa: Escuela Experimental de Niños para la Música`, 14, 48);
      doc.text(`No. Orden: ${form.numero || "N/A"}`, 140, 48);
      doc.text(`Dirección: Colonia Kennedy, Tegucigalpa`, 14, 55);
      doc.text(`Fecha emisión: ${fechaActual}`, 140, 55);
      doc.text(`Estado: ${form.estado || "N/A"}`, 14, 62);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 102, 204);
      doc.text("Proveedor:", 14, 75);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      doc.text(`Empresa: ${provObj?.empresa || "N/A"}`,     14, 82);
      doc.text(`Contacto: ${provObj?.nombre || "N/A"}`,     14, 89);
      doc.text(`Dirección: ${provObj?.direccion || "N/A"}`, 14, 96);
      doc.text(`Teléfono: ${provObj?.telefono || "N/A"}`,   14, 103);

      doc.setDrawColor(200, 200, 200);
      doc.line(14, 108, 196, 108);

      const rows = (form.items || []).map(item => [
        item.descripcion,
        item.cantidad,
        `L. ${Number(item.costoUnit).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`,
        `L. ${(Number(item.cantidad) * Number(item.costoUnit)).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`
      ]);

      autoTable(doc, {
        startY: 114,
        head:   [["Descripción", "Cantidad", "Costo Unitario", "Subtotal"]],
        body:   rows,
        theme:  "grid",
        headStyles:  { fillColor: [0, 102, 204], textColor: 255, fontStyle: "bold" },
        styles:      { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 25, halign: "center" },
          2: { cellWidth: 40, halign: "right"  },
          3: { cellWidth: 35, halign: "right"  },
        },
      });

      const finalY  = doc.lastAutoTable.finalY + 8;
      const total   = calcularTotal(form.items || []);
      const totalFmt = `L. ${total.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;

      doc.setFont("helvetica", "normal");
      doc.text("SUBTOTAL:", 120, finalY);
      doc.text(totalFmt, 194, finalY, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("TOTAL:", 120, finalY + 10);
      doc.text(totalFmt, 194, finalY + 10, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(130, 130, 130);
      doc.text(
        "Documento generado por la Escuela Experimental de Niños para la Música - S.I.A.M.",
        105, 285, { align: "center" }
      );

      doc.save(`Orden_${form.numero || "nueva"}.pdf`);
    } catch (err) {
      console.error("Error generando PDF:", err);
    }
  };

  // ── Render pestañas ───────────────────────────────────────
  const renderTabs = () => (
    <>
      {/* Barra de pestañas */}
      <div className="dn-modal-tabs">
        {[
          { key: "datos",     label: "Datos",     ico: <FileText     size={14} /> },
          { key: "items",     label: "Ítems",     ico: <ShoppingCart size={14} /> },
          { key: "auditoria", label: "Auditoría", ico: <Clock        size={14} /> },
        ].map(t => (
          <button
            key={t.key}
            type="button"
            className={`dn-tab-btn${tabActiva === t.key ? " active" : ""}${tabTieneError(t.key) ? " has-error" : ""}`}
            onClick={() => setTabActiva(t.key)}
          >
            {t.ico} {t.label}
            {tabTieneError(t.key) && <span className="dn-tab-error-dot" />}
          </button>
        ))}
      </div>

      {/* ══ TAB: Datos ══ */}
      {tabActiva === "datos" && (
        <div className="dn-tab-content">
          <div className="dn-form-section-title">Información de la Orden</div>
          <div className="dn-form-grid">

            {/* Número (solo lectura — autogenerado por el servidor) */}
            <div className="dn-form-group">
              <label>Número de Orden</label>
              <input
                value={form.numero || "(autogenerado)"}
                readOnly
                style={{ background: "#F4F3FB", color: "#9c8fcf", cursor: "not-allowed" }}
              />
            </div>

            {/* Estado */}
            <div className={`dn-form-group${errores.estado ? " dn-field-error" : ""}`}>
              <label>Estado Actual <span style={{ color: "#E74C3C" }}>*</span></label>
              <select
                name="estado"
                value={form.estado || ""}
                onChange={handleChange}
                className={errores.estado ? "dn-input-err" : ""}
              >
                <option value="BORRADOR">BORRADOR</option>
                <option value="ENVIADA">ENVIADA</option>
                <option value="RECIBIDA">RECIBIDA</option>
                <option value="CERRADA">CERRADA</option>
              </select>
              {errores.estado && <span className="dn-err-msg">{errores.estado}</span>}
            </div>

            {/* Fecha */}
            <div className="dn-form-group">
              <label>Fecha de la Orden</label>
              <input
                type="datetime-local"
                name="fecha"
                value={formatFechaDatetimeLocal(form.fecha || "")}
                onChange={handleChange}
              />
            </div>

            {/* Proveedor */}
            <div className="dn-form-group">
              <label>Proveedor</label>
              <select
                name="proveedor_id"
                value={form.proveedor_id || ""}
                onChange={handleChange}
              >
                <option value="">— Sin proveedor —</option>
                {proveedores.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.nombre}{p.empresa ? ` — ${p.empresa}` : ''}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Resumen total */}
          <div className="dn-form-section-title" style={{ marginTop: 20 }}>Resumen</div>
          <div style={{
            background: "#F4F3FB", border: "1px solid #E0D9F5",
            borderRadius: 12, padding: "14px 18px",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <span style={{ fontWeight: 600, color: "#7A6FA0" }}>
              {form.items?.length || 0} ítem(s) ·&nbsp;
              {form.items?.reduce((s, i) => s + (Number(i.cantidad) || 0), 0) || 0} unidades
            </span>
            <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#6C4FBF" }}>
              Total: L.&nbsp;{calcularTotal(form.items || []).toLocaleString("es-HN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      {/* ══ TAB: Ítems ══ */}
      {tabActiva === "items" && (
        <div className="dn-tab-content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="dn-form-section-title" style={{ marginBottom: 0 }}>Ítems de la Orden</div>
            <button type="button" style={S.btnSm("#6C4FBF")} onClick={handleAgregarItem}>
              <Plus size={13} /> Agregar ítem
            </button>
          </div>

          {errores.items && (
            <div style={{ background: "#FDE8E8", borderLeft: "4px solid #E74C3C", padding: "10px 14px", borderRadius: 8, marginBottom: 12, color: "#7a1010", fontSize: ".85rem" }}>
              ⚠️ {errores.items}
            </div>
          )}

          {/* Tabla ítems */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".86rem" }}>
              <thead>
                <tr style={{ background: "#F0ECFF" }}>
                  <th style={{ padding: "9px 10px", textAlign: "left",   color: "#6C4FBF", fontWeight: 700, borderBottom: "2px solid #E0D9F5" }}>Descripción</th>
                  <th style={{ padding: "9px 10px", textAlign: "center", color: "#6C4FBF", fontWeight: 700, borderBottom: "2px solid #E0D9F5", width: 100 }}>Cantidad</th>
                  <th style={{ padding: "9px 10px", textAlign: "right",  color: "#6C4FBF", fontWeight: 700, borderBottom: "2px solid #E0D9F5", width: 140 }}>Costo Unit.</th>
                  <th style={{ padding: "9px 10px", textAlign: "right",  color: "#6C4FBF", fontWeight: 700, borderBottom: "2px solid #E0D9F5", width: 130 }}>Subtotal</th>
                  <th style={{ padding: "9px 10px", textAlign: "center", color: "#6C4FBF", fontWeight: 700, borderBottom: "2px solid #E0D9F5", width: 70  }}></th>
                </tr>
              </thead>
              <tbody>
                {(form.items || []).map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #E0D9F5" }}>
                    <td style={{ padding: "7px 8px" }}>
                      <input
                        value={item.descripcion || ""}
                        onChange={e => handleEditarItem(idx, "descripcion", e.target.value)}
                        placeholder="Descripción del producto"
                        style={{ width: "100%", border: "2px solid #E0D9F5", borderRadius: 7, padding: "7px 10px", fontFamily: "inherit", fontSize: ".85rem", color: "#2D2250", background: "#FAF9FF", outline: "none" }}
                      />
                    </td>
                    <td style={{ padding: "7px 8px" }}>
                      <input
                        type="number"
                        value={item.cantidad === "" ? "" : (item.cantidad ?? "")}
                        onChange={e => handleEditarItem(idx, "cantidad", e.target.value)}
                        min="1"
                        style={{ width: "100%", border: "2px solid #E0D9F5", borderRadius: 7, padding: "7px 8px", fontFamily: "inherit", fontSize: ".85rem", color: "#2D2250", background: "#FAF9FF", outline: "none", textAlign: "center" }}
                      />
                    </td>
                    <td style={{ padding: "7px 8px" }}>
                      <input
                        type="number"
                        value={item.costoUnit === "" ? "" : (item.costoUnit ?? "")}
                        onChange={e => handleEditarItem(idx, "costoUnit", e.target.value)}
                        min="0" step="0.01"
                        style={{ width: "100%", border: "2px solid #E0D9F5", borderRadius: 7, padding: "7px 8px", fontFamily: "inherit", fontSize: ".85rem", color: "#2D2250", background: "#FAF9FF", outline: "none", textAlign: "right" }}
                      />
                    </td>
                    <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: 700, color: "#6C4FBF" }}>
                      L.&nbsp;{((Number(item.cantidad) || 0) * (Number(item.costoUnit) || 0)).toLocaleString("es-HN", { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: "7px 8px", textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => handleEliminarItem(idx)}
                        style={{ background: "#FDE8E8", color: "#E74C3C", border: "none", borderRadius: 7, padding: "5px 8px", cursor: "pointer", fontWeight: 700, display: "inline-flex", alignItems: "center" }}
                        title="Eliminar ítem"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
                {(!form.items || form.items.length === 0) && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "#aaa", fontSize: ".88rem" }}>
                      No hay ítems. Haz clic en "Agregar ítem" para comenzar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Total */}
          {(form.items || []).length > 0 && (
            <div style={{ marginTop: 14, padding: "12px 18px", background: "#F0ECFF", borderRadius: 10, textAlign: "right", fontWeight: 800, fontSize: "1.05rem", color: "#6C4FBF" }}>
              Total: L.&nbsp;{calcularTotal(form.items || []).toLocaleString("es-HN", { minimumFractionDigits: 2 })}
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: Auditoría ══ */}
      {tabActiva === "auditoria" && (
        <div className="dn-tab-content">
          <div className="dn-form-section-title">Auditoría de la Orden</div>
          <div className="dn-audit-card">
            <div className="dn-audit-row">
              <UserCheck size={16} className="dn-audit-ico" />
              <div>
                <div className="dn-audit-label">Creación</div>
                <div className="dn-audit-val">
                  Creado por: <strong>{orden.creado_por_email || orden.creado_por || "N/D"}</strong>
                  &nbsp;·&nbsp;
                  Fecha: <strong>{formatFecha(orden.fecha_creacion || orden.createdAt)}</strong>
                </div>
              </div>
            </div>

            {(orden.actualizado_por || orden.actualizado_por_email || orden.updatedAt) && (
              <div className="dn-audit-row">
                <Clock size={16} className="dn-audit-ico" />
                <div>
                  <div className="dn-audit-label">Última Actualización</div>
                  <div className="dn-audit-val">
                    Por: <strong>{orden.actualizado_por_email || orden.actualizado_por || "N/D"}</strong>
                    &nbsp;·&nbsp;
                    <strong>{formatFecha(orden.fecha_actualizacion || orden.updatedAt)}</strong>
                  </div>
                </div>
              </div>
            )}

            <div className="dn-audit-ids">
              <small>ID: <strong>{orden._id}</strong></small>
              <small>Estado: <strong>{orden.estado || "N/D"}</strong></small>
              {orden.numero && <small>Número: <strong>{orden.numero}</strong></small>}
            </div>
          </div>
        </div>
      )}
    </>
  );

  // ── JSX principal ────────────────────────────────────────
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
          <h3><Edit size={20} /> Detalle de la Orden</h3>
          <button className="dn-modal-close" onClick={handleCerrar}><X size={18} /></button>
        </div>

        {/* Banner cambios sin guardar */}
        <AnimatePresence>
          {hayCambios && (
            <motion.div
              className="dn-unsaved-banner"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              ⚠️ Tienes cambios sin guardar
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contenido con pestañas */}
        <div>
          {renderTabs()}
        </div>

        {/* Footer — FIX: botón "Actualizar" es type="button" + onClick, NO submit de form */}
        <div className="dn-modal-footer">
         
          <button type="button" style={S.btn("#2980B9")} onClick={handleDescargarPDF}>
            <Download size={15} /> PDF
          </button>
           <button type="button" style={S.btn("#E74C3C")} onClick={() => setShowConfirm(true)}>
            Eliminar
          </button>
          <button type="button" style={S.btn("#E0D9F5", "#6C4FBF")} onClick={handleCerrar}>
            Cancelar
          </button>
          {/* FIX: onClick directo, no dependiente de form submit */}
          <button type="button" style={S.btn("#6C4FBF")} onClick={handleGuardar}>
            Guardar
          </button>
        </div>

        {/* Confirm eliminar */}
        {showConfirm && (
          <ConfirmDialog
            message={`¿Seguro que deseas eliminar la orden "${form.numero || orden._id}"?`}
            onConfirm={() => {
              setShowConfirm(false);
              if (orden?._id) onDelete(orden._id);
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

export default ModalDetalleOrden;