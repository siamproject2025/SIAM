// ============================================================
// ModalCrearOrden.js
// • Diseño unificado con ModalDetalleOrden (clases dn-*)
// • Filtro avanzado de proveedores COMPLETO (modal propio)
// • Todos los campos originales preservados
// • FormData correctamente construido para el backend
// • Validaciones completas
// ============================================================
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, X, Save, FileText, Plus, Trash2,
  Package, Filter, Search
} from 'lucide-react';
import { auth } from "../../../components/authentication/Auth";
import Notification from "../../../components/Notification";

const API_PROV_URL = process.env.REACT_APP_API_URL + "/api/proveedores";

// ── Estilos inline idénticos a ModalDetalleOrden ────────────
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

const TIPOS_PERMITIDOS_MIME = [
  'application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const TABS = [
  { key: "datos",    label: "Datos",    ico: <FileText     size={14} /> },
  { key: "items",    label: "Ítems",    ico: <ShoppingCart size={14} /> },
  { key: "adjuntos", label: "Adjuntos", ico: <Package      size={14} /> },
];

// ── Validación ──────────────────────────────────────────────
const validar = (form) => {
  const e = {};
  if (!form.proveedor_id || form.proveedor_id.trim() === '')
    e.proveedor_id = "Debes seleccionar un proveedor";
  if (!form.fecha || form.fecha.trim() === '')
    e.fecha = "La fecha es obligatoria";
  if (!form.estado)
    e.estado = "El estado es obligatorio";
  if (!form.items || form.items.length === 0)
    e.items = "Debes agregar al menos un ítem";
  else if (form.items.some(i => !i.descripcion?.trim() || i.cantidad <= 0 || i.costoUnit < 0))
    e.items = "Todos los ítems deben tener descripción, cantidad > 0 y costo válido";
  return e;
};

// ─────────────────────────────────────────────────────────────
const ModalCrearOrden = ({ onClose, onCreate }) => {

  // ── Estado principal del formulario ────────────────────────
  const [nuevaOrden, setNuevaOrden] = useState({
    proveedor_id: '',
    estado: 'BORRADOR',
    fecha: new Date().toISOString().split('T')[0],
    items: [],
    recepciones: []
  });

  const [nuevoItem, setNuevoItem] = useState({
    descripcion: '', cantidad: '', costoUnit: ''
  });

  const [adjuntosSeleccionados, setAdjuntosSeleccionados] = useState([]);

  // ── UI state ────────────────────────────────────────────────
  const [tabActiva, setTabActiva]           = useState("datos");
  const [errores, setErrores]               = useState({});
  const [intentoGuardar, setIntentoGuardar] = useState(false);
  const [notificacion, setNotificacion]     = useState(null);

  // ── Proveedores ─────────────────────────────────────────────
  const [proveedores, setProveedores]                 = useState([]);
  const [cargandoProveedores, setCargandoProveedores] = useState(true);

  // ── Búsqueda avanzada (modal separado) ─────────────────────
  const [mostrarBusquedaAvanzada, setMostrarBusquedaAvanzada] = useState(false);
  const [filtros, setFiltros] = useState({
    id_proveedor: '', nombre: '', empresa: '', estado: '', telefono: ''
  });

  const mostrarNotificacion = (mensaje, tipo = 'info') => {
    setNotificacion({ message: mensaje, type: tipo });
  };

  // ── Carga de proveedores ────────────────────────────────────
  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuario no autenticado');
        const token = await user.getIdToken();
        const response = await fetch(API_PROV_URL, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Error al obtener proveedores');
        const data = await response.json();
        setProveedores(data.filter(p => p.estado === 'ACTIVO'));
      } catch (error) {
        console.error('Error cargando proveedores:', error);
        mostrarNotificacion(error.message || 'Error al cargar los proveedores.', 'warning');
      } finally {
        setCargandoProveedores(false);
      }
    };
    fetchProveedores();
  }, []);

  // ── Filtrado avanzado de proveedores ────────────────────────
  const proveedoresFiltrados = useMemo(() => {
    return proveedores.filter(proveedor => {
      const coincideId = !filtros.id_proveedor ||
        (proveedor.id_proveedor && proveedor.id_proveedor.toString().toLowerCase()
          .includes(filtros.id_proveedor.toLowerCase()));
      const coincideNombre = !filtros.nombre ||
        (proveedor.nombre && proveedor.nombre.toLowerCase().includes(filtros.nombre.toLowerCase()));
      const coincideEmpresa = !filtros.empresa ||
        (proveedor.empresa && proveedor.empresa.toLowerCase().includes(filtros.empresa.toLowerCase()));
      const coincideEstado = !filtros.estado || proveedor.estado === filtros.estado;
      const coincideTelefono = !filtros.telefono ||
        (proveedor.telefono && proveedor.telefono.toString().includes(filtros.telefono));
      return coincideId && coincideNombre && coincideEmpresa && coincideEstado && coincideTelefono;
    });
  }, [proveedores, filtros]);

  const limpiarFiltros = () => setFiltros({
    id_proveedor: '', nombre: '', empresa: '', estado: '', telefono: ''
  });

  const seleccionarProveedor = (proveedorId) => {
    setNuevaOrden(p => ({ ...p, proveedor_id: proveedorId }));
    setMostrarBusquedaAvanzada(false);
    limpiarFiltros();
    if (intentoGuardar && errores.proveedor_id) {
      setErrores(p => { const n = { ...p }; delete n.proveedor_id; return n; });
    }
  };

  const proveedorSeleccionado = proveedores.find(p => p._id === nuevaOrden.proveedor_id);

  // ── Cambio de campo ─────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevaOrden(p => ({ ...p, [name]: value }));
    if (intentoGuardar && errores[name]) {
      setErrores(p => { const n = { ...p }; delete n[name]; return n; });
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
  
  return `${year}-${month}-${day}`;
};
  // ── Ítems ───────────────────────────────────────────────────
  const handleAgregarItem = () => {
    if (!nuevoItem.descripcion || !nuevoItem.cantidad || nuevoItem.costoUnit === '') {
      mostrarNotificacion('Por favor completa todos los campos del ítem', 'warning');
      return;
    }
    const cantidad  = parseFloat(nuevoItem.cantidad);
    const costoUnit = parseFloat(nuevoItem.costoUnit);
    if (cantidad <= 0) { mostrarNotificacion('La cantidad debe ser mayor a 0', 'warning'); return; }
    if (costoUnit < 0) { mostrarNotificacion('El costo no puede ser negativo', 'warning'); return; }
    setNuevaOrden(p => ({
      ...p,
      items: [...p.items, { descripcion: nuevoItem.descripcion.trim(), cantidad, costoUnit }]
    }));
    setNuevoItem({ descripcion: '', cantidad: '', costoUnit: '' });
    if (errores.items) setErrores(p => { const n = { ...p }; delete n.items; return n; });
  };

  const handleEliminarItem = (index) => {
    setNuevaOrden(p => ({ ...p, items: p.items.filter((_, i) => i !== index) }));
  };

  const handleEditarItem = (idx, campo, valor) => {
    const items = nuevaOrden.items.map((item, i) =>
      i === idx
        ? { ...item, [campo]: (campo === 'cantidad' || campo === 'costoUnit') ? (parseFloat(valor) || 0) : valor }
        : item
    );
    setNuevaOrden(p => ({ ...p, items }));
  };

  // ── Adjuntos ────────────────────────────────────────────────
  const handleSeleccionarAdjuntos = (e) => {
    const archivos = Array.from(e.target.files || []);
    if (adjuntosSeleccionados.length + archivos.length > 5) {
      mostrarNotificacion('Máximo 5 adjuntos por orden', 'warning');
      e.target.value = '';
      return;
    }
    const validos = archivos.filter(archivo => {
      if (!TIPOS_PERMITIDOS_MIME.includes(archivo.type)) {
        mostrarNotificacion(`${archivo.name}: tipo no permitido`, 'warning'); return false;
      }
      if (archivo.size > 10 * 1024 * 1024) {
        mostrarNotificacion(`${archivo.name}: excede 10 MB`, 'warning'); return false;
      }
      return true;
    });
    setAdjuntosSeleccionados(p => [...p, ...validos]);
    e.target.value = '';
  };

  const handleEliminarAdjunto = (index) => {
    setAdjuntosSeleccionados(p => p.filter((_, i) => i !== index));
  };

  const total = nuevaOrden.items.reduce(
    (acc, item) => acc + (item.cantidad || 0) * (item.costoUnit || 0), 0
  );

  const tabTieneError = (key) => {
    if (key === "datos") return !!(errores.proveedor_id || errores.fecha || errores.estado);
    if (key === "items") return !!errores.items;
    return false;
  };

  // ── Crear orden ──────────────────────────────────────────────
  const handleCrear = () => {
    setIntentoGuardar(true);
    const errs = validar(nuevaOrden);
    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      if (errs.proveedor_id || errs.fecha || errs.estado) setTabActiva("datos");
      else if (errs.items) setTabActiva("items");
      return;
    }
    setErrores({});
    if (adjuntosSeleccionados.length > 0) {
      const formData = new FormData();
      formData.append('datos', JSON.stringify(nuevaOrden));
      adjuntosSeleccionados.forEach(archivo => formData.append('adjuntos', archivo));
      onCreate(formData, true);
    } else {
      onCreate(nuevaOrden, false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <>
      {notificacion && (
        <Notification
          message={notificacion.message}
          type={notificacion.type}
          onClose={() => setNotificacion(null)}
        />
      )}

      {/* ── OVERLAY PRINCIPAL ── */}
      <motion.div
        className="dn-overlay"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ zIndex: 1000 }}
      >
        <motion.div
          className="dn-modal"
          onClick={e => e.stopPropagation()}
          initial={{ scale: 0.85, y: 40 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.85, y: 40 }}
          transition={{ type: "spring", damping: 22 }}
          style={{ maxWidth: 780 }}
        >
          {/* Header */}
          <div className="dn-modal-header">
            <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShoppingCart size={20} /> Crear Nueva Orden de Compra
            </h3>
            <button className="dn-modal-close" onClick={onClose}><X size={18} /></button>
          </div>

          {/* Tabs */}
          <div className="dn-modal-tabs">
            {TABS.map(t => (
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

                {/* ── Selector de proveedor + botón búsqueda avanzada ── */}
                <div className={`dn-form-group${errores.proveedor_id ? " dn-field-error" : ""}`} style={{ gridColumn: "1 / -1" }}>
                  <label>
                    Proveedor *{" "}
                    {cargandoProveedores && (
                      <span style={{ color: "#9c8fcf", fontWeight: 400, fontSize: ".8rem" }}>(Cargando...)</span>
                    )}
                  </label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <select
                      name="proveedor_id"
                      value={nuevaOrden.proveedor_id}
                      onChange={handleChange}
                      disabled={cargandoProveedores}
                      className={errores.proveedor_id ? "dn-input-err" : ""}
                      style={{ flex: 1 }}
                    >
                      <option value="">Seleccione un proveedor</option>
                      {proveedores.map(p => (
                        <option key={p._id} value={p._id}>
                          {p.id_proveedor ? `ID: ${p.id_proveedor} - ` : ''}{p.nombre}{p.empresa ? ` (${p.empresa})` : ''}
                        </option>
                      ))}
                    </select>
                    {/* BOTÓN BÚSQUEDA AVANZADA — PRESERVADO */}
                    <button
                      type="button"
                      onClick={() => setMostrarBusquedaAvanzada(true)}
                      title="Búsqueda avanzada de proveedores"
                      style={S.btnSm("#6C4FBF")}
                    >
                      <Filter size={14} /> Búsqueda avanzada
                    </button>
                  </div>
                  {errores.proveedor_id && <span className="dn-err-msg">{errores.proveedor_id}</span>}
                </div>

                {/* Info del proveedor seleccionado */}
                {proveedorSeleccionado && (
                  <div style={{
                    gridColumn: "1 / -1",
                    background: "#F0ECFF", border: "1px solid #C9BAEF",
                    borderRadius: 10, padding: "12px 16px"
                  }}>
                    <div style={{ fontSize: ".8rem", fontWeight: 700, color: "#6C4FBF", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".05em" }}>
                      ✓ Información del Proveedor
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: "4px 16px", fontSize: ".84rem", color: "#4a3880" }}>
                      {proveedorSeleccionado.id_proveedor && <span><strong>ID:</strong> {proveedorSeleccionado.id_proveedor}</span>}
                      <span><strong>Nombre:</strong> {proveedorSeleccionado.nombre}</span>
                      {proveedorSeleccionado.empresa  && <span><strong>Empresa:</strong> {proveedorSeleccionado.empresa}</span>}
                      {proveedorSeleccionado.telefono && <span><strong>Teléfono:</strong> {proveedorSeleccionado.telefono}</span>}
                      {proveedorSeleccionado.email    && (
                        <span style={{ gridColumn: "1 / -1" }}><strong>Email:</strong> {proveedorSeleccionado.email}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Fecha */}
                <div className={`dn-form-group${errores.fecha ? " dn-field-error" : ""}`}>
                  <label>Fecha de Creación *</label>
                  <input
                    type="date"
                    name="fecha"
                    value={formatFechaDatetimeLocal(nuevaOrden.fecha)}
                    onChange={handleChange}
                    className={errores.fecha ? "dn-input-err" : ""}
                  />
                  {errores.fecha && <span className="dn-err-msg">{errores.fecha}</span>}
                </div>

                {/* Estado */}
                <div className={`dn-form-group${errores.estado ? " dn-field-error" : ""}`}>
                  <label>Estado Actual *</label>
                  <select
                    name="estado"
                    value={nuevaOrden.estado}
                    onChange={handleChange}
                    className={errores.estado ? "dn-input-err" : ""}
                  >
                    <option value="BORRADOR"> Borrador</option>
                    <option value="ENVIADA"> Enviada</option>
                    <option value="RECIBIDA"> Recibida</option>
                    <option value="CERRADA"> Cerrada</option>
                  </select>
                  {errores.estado && <span className="dn-err-msg">{errores.estado}</span>}
                </div>

              </div>
            </div>
          )}

          {/* ══ TAB: Ítems ══ */}
          {tabActiva === "items" && (
            <div className="dn-tab-content">
              {/* Formulario nuevo ítem */}
              <div className="dn-form-section-title">Agregar Ítem</div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto auto", gap: 8, marginBottom: 14, alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Descripción del ítem"
                  value={nuevoItem.descripcion}
                  onChange={e => setNuevoItem(p => ({ ...p, descripcion: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleAgregarItem()}
                  style={{ border: "2px solid #E0D9F5", borderRadius: 8, padding: "8px 12px", fontSize: ".86rem", fontFamily: "inherit", outline: "none", color: "#2D2250", background: "#FAF9FF" }}
                />
                <input
                  type="number" placeholder="Cantidad" min="1" step="1"
                  value={nuevoItem.cantidad}
                  onChange={e => setNuevoItem(p => ({ ...p, cantidad: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleAgregarItem()}
                  style={{ border: "2px solid #E0D9F5", borderRadius: 8, padding: "8px 10px", fontSize: ".86rem", fontFamily: "inherit", outline: "none", color: "#2D2250", background: "#FAF9FF", textAlign: "center" }}
                />
                <input
                  type="number" placeholder="Costo ($)" min="0" step="0.01"
                  value={nuevoItem.costoUnit}
                  onChange={e => setNuevoItem(p => ({ ...p, costoUnit: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleAgregarItem()}
                  style={{ border: "2px solid #E0D9F5", borderRadius: 8, padding: "8px 10px", fontSize: ".86rem", fontFamily: "inherit", outline: "none", color: "#2D2250", background: "#FAF9FF", textAlign: "right" }}
                />
                <button type="button" onClick={handleAgregarItem} style={S.btnSm("#6C4FBF")} title="Agregar ítem (Enter)">
                  <Plus size={13} /> Agregar
                </button>
                <button
                  type="button"
                  onClick={() => setNuevoItem({ descripcion: '', cantidad: '', costoUnit: '' })}
                  style={S.btnSm("#FDE8E8", "#E74C3C")}
                  title="Limpiar campos"
                >
                  <X size={13} />
                </button>
              </div>

              {errores.items && (
                <div style={{ background: "#FDE8E8", borderLeft: "4px solid #E74C3C", padding: "10px 14px", borderRadius: 8, marginBottom: 12, color: "#7a1010", fontSize: ".85rem" }}>
                  ⚠️ {errores.items}
                </div>
              )}

              {/* Tabla ítems agregados */}
              <div className="dn-form-section-title">Ítems de la Orden ({nuevaOrden.items.length})</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".86rem" }}>
                  <thead>
                    <tr style={{ background: "#F0ECFF" }}>
                      <th style={{ padding: "9px 10px", textAlign: "left",   color: "#6C4FBF", fontWeight: 700, borderBottom: "2px solid #E0D9F5" }}>Descripción</th>
                      <th style={{ padding: "9px 10px", textAlign: "center", color: "#6C4FBF", fontWeight: 700, borderBottom: "2px solid #E0D9F5", width: 100 }}>Cantidad</th>
                      <th style={{ padding: "9px 10px", textAlign: "right",  color: "#6C4FBF", fontWeight: 700, borderBottom: "2px solid #E0D9F5", width: 140 }}>Costo Unit.</th>
                      <th style={{ padding: "9px 10px", textAlign: "right",  color: "#6C4FBF", fontWeight: 700, borderBottom: "2px solid #E0D9F5", width: 130 }}>Subtotal</th>
                      <th style={{ padding: "9px 10px", textAlign: "center", color: "#6C4FBF", fontWeight: 700, borderBottom: "2px solid #E0D9F5", width: 60  }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {nuevaOrden.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #E0D9F5", background: idx % 2 === 0 ? "white" : "#FAF9FF" }}>
                        <td style={{ padding: "7px 8px" }}>
                          <input
                            value={item.descripcion}
                            onChange={e => handleEditarItem(idx, "descripcion", e.target.value)}
                            style={{ width: "100%", border: "2px solid #E0D9F5", borderRadius: 7, padding: "7px 10px", fontFamily: "inherit", fontSize: ".85rem", color: "#2D2250", background: "#FAF9FF", outline: "none" }}
                          />
                        </td>
                        <td style={{ padding: "7px 8px" }}>
                          <input
                            type="number" min="1"
                            value={item.cantidad}
                            onChange={e => handleEditarItem(idx, "cantidad", e.target.value)}
                            style={{ width: "100%", border: "2px solid #E0D9F5", borderRadius: 7, padding: "7px 8px", fontFamily: "inherit", fontSize: ".85rem", color: "#2D2250", background: "#FAF9FF", outline: "none", textAlign: "center" }}
                          />
                        </td>
                        <td style={{ padding: "7px 8px" }}>
                          <input
                            type="number" min="0" step="0.01"
                            value={item.costoUnit}
                            onChange={e => handleEditarItem(idx, "costoUnit", e.target.value)}
                            style={{ width: "100%", border: "2px solid #E0D9F5", borderRadius: 7, padding: "7px 8px", fontFamily: "inherit", fontSize: ".85rem", color: "#2D2250", background: "#FAF9FF", outline: "none", textAlign: "right" }}
                          />
                        </td>
                        <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: 700, color: "#6C4FBF" }}>
                          L. {((item.cantidad || 0) * (item.costoUnit || 0)).toLocaleString("es-HN", { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "7px 8px", textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleEliminarItem(idx)}
                            style={{ background: "#FDE8E8", color: "#E74C3C", border: "none", borderRadius: 7, padding: "5px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {nuevaOrden.items.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "28px", color: "#bbb", fontSize: ".88rem" }}>
                          No hay ítems. Usa el formulario de arriba y presiona Agregar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {nuevaOrden.items.length > 0 && (
                <div style={{ marginTop: 14, padding: "12px 18px", background: "#F0ECFF", borderRadius: 10, textAlign: "right", fontWeight: 800, fontSize: "1.05rem", color: "#6C4FBF" }}>
                  Total: L. {total.toLocaleString("es-HN", { minimumFractionDigits: 2 })}
                </div>
              )}
            </div>
          )}

          {/* ══ TAB: Adjuntos ══ */}
          {tabActiva === "adjuntos" && (
            <div className="dn-tab-content">
              <div className="dn-form-section-title">📎 Adjuntos (Opcional — Máx. 5 archivos)</div>

              <div style={{
                border: "2px dashed #C9BAEF", borderRadius: 12, padding: "28px 20px",
                textAlign: "center", marginBottom: 16, background: "#FAF9FF"
              }}>
                <Package size={36} color="#C9BAEF" style={{ marginBottom: 10 }} />
                <p style={{ color: "#888", fontSize: ".88rem", margin: "0 0 14px" }}>
                  PDF, imágenes o documentos Word/Excel · Máx. 10 MB c/u
                </p>
                <label style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "10px 20px", borderRadius: 10, fontSize: ".86rem", fontWeight: 700,
                  background: adjuntosSeleccionados.length >= 5 ? "#e0e0e0" : "#6C4FBF",
                  color: adjuntosSeleccionados.length >= 5 ? "#aaa" : "white",
                  cursor: adjuntosSeleccionados.length >= 5 ? "not-allowed" : "pointer"
                }}>
                  📄 Seleccionar Archivos
                  <input
                    type="file"
                    id="adjuntos-input"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
                    onChange={handleSeleccionarAdjuntos}
                    disabled={adjuntosSeleccionados.length >= 5}
                    style={{ display: "none" }}
                  />
                </label>
                <p style={{ color: "#bbb", fontSize: ".8rem", marginTop: 8 }}>
                  {adjuntosSeleccionados.length}/5 archivos seleccionados
                </p>
              </div>

              {adjuntosSeleccionados.length > 0 && (
                <div style={{ border: "1px solid #E0D9F5", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ background: "#F0ECFF", padding: "8px 14px", fontSize: ".82rem", fontWeight: 700, color: "#6C4FBF" }}>
                    Archivos adjuntos ({adjuntosSeleccionados.length}/5):
                  </div>
                  {adjuntosSeleccionados.map((archivo, idx) => (
                    <div key={idx} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 14px", borderBottom: "1px solid #F0ECFF",
                      background: idx % 2 === 0 ? "white" : "#FAF9FF"
                    }}>
                      <span style={{ fontSize: ".86rem", color: "#333" }}>
                        📄 {archivo.name}
                        <span style={{ color: "#aaa", marginLeft: 8, fontSize: ".8rem" }}>
                          ({(archivo.size / 1024).toFixed(0)} KB)
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEliminarAdjunto(idx)}
                        style={{ background: "#FDE8E8", color: "#E74C3C", border: "none", borderRadius: 7, padding: "4px 12px", cursor: "pointer", fontSize: ".8rem", fontWeight: 700 }}
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Footer ── */}
          <div className="dn-modal-footer">
            <button type="button" style={S.btn("#E0D9F5", "#6C4FBF")} onClick={onClose}>
              Cancelar
            </button>
            <button type="button" style={S.btn("#6C4FBF")} onClick={handleCrear}>
              <Save size={15} /> Crear Orden
            </button>
          </div>

        </motion.div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════
          MODAL DE BÚSQUEDA AVANZADA DE PROVEEDORES — COMPLETO
      ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {mostrarBusquedaAvanzada && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: "rgba(0,0,0,0.75)",
              display: "flex", justifyContent: "center", alignItems: "center",
              zIndex: 2000
            }}
            onClick={() => { setMostrarBusquedaAvanzada(false); limpiarFiltros(); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 22 }}
              onClick={e => e.stopPropagation()}
              style={{
                maxWidth: 1000, width: "95%", maxHeight: "90vh", overflowY: "auto",
                background: "white", borderRadius: 16,
                boxShadow: "0 25px 60px rgba(108,79,191,.25)"
              }}
            >
              {/* Header búsqueda avanzada */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "20px 24px", borderBottom: "2px solid #E0D9F5",
                background: "linear-gradient(135deg, #6C4FBF 0%, #8B6FD4 100%)",
                borderRadius: "16px 16px 0 0"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Search size={20} color="white" />
                  <h3 style={{ margin: 0, color: "white", fontSize: "1.05rem", fontWeight: 700 }}>
                    Búsqueda Avanzada de Proveedores
                  </h3>
                </div>
                <button
                  onClick={() => { setMostrarBusquedaAvanzada(false); limpiarFiltros(); }}
                  style={{ background: "rgba(255,255,255,.2)", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "white", display: "flex", alignItems: "center" }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: "24px" }}>
                {/* Sección de filtros */}
                <div style={{
                  background: "#F4F3FB", padding: "20px", borderRadius: 12,
                  marginBottom: 20, border: "1px solid #E0D9F5"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <Filter size={15} color="#6C4FBF" />
                    <h4 style={{ margin: 0, color: "#2D2250", fontSize: ".95rem", fontWeight: 700 }}>
                      Criterios de Búsqueda
                    </h4>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", marginBottom: "1rem" }}>
                    {/* ID Proveedor */}
                    <div>
                      <label style={{ display: "block", marginBottom: 6, color: "#4a3880", fontSize: ".88rem", fontWeight: 600 }}>
                        ID Proveedor
                      </label>
                      <input
                        type="text"
                        placeholder="Buscar por ID..."
                        value={filtros.id_proveedor}
                        onChange={e => setFiltros(p => ({ ...p, id_proveedor: e.target.value }))}
                        style={{ width: "100%", padding: "10px 12px", border: "2px solid #E0D9F5", borderRadius: 8, fontSize: ".88rem", boxSizing: "border-box", outline: "none", fontFamily: "inherit", color: "#2D2250", background: "white" }}
                        onFocus={e => e.target.style.borderColor = "#6C4FBF"}
                        onBlur={e => e.target.style.borderColor = "#E0D9F5"}
                      />
                    </div>
                    {/* Nombre */}
                    <div>
                      <label style={{ display: "block", marginBottom: 6, color: "#4a3880", fontSize: ".88rem", fontWeight: 600 }}>
                        Nombre del Proveedor
                      </label>
                      <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={filtros.nombre}
                        onChange={e => setFiltros(p => ({ ...p, nombre: e.target.value }))}
                        style={{ width: "100%", padding: "10px 12px", border: "2px solid #E0D9F5", borderRadius: 8, fontSize: ".88rem", boxSizing: "border-box", outline: "none", fontFamily: "inherit", color: "#2D2250", background: "white" }}
                        onFocus={e => e.target.style.borderColor = "#6C4FBF"}
                        onBlur={e => e.target.style.borderColor = "#E0D9F5"}
                      />
                    </div>
                    {/* Empresa */}
                    <div>
                      <label style={{ display: "block", marginBottom: 6, color: "#4a3880", fontSize: ".88rem", fontWeight: 600 }}>
                        Empresa
                      </label>
                      <input
                        type="text"
                        placeholder="Buscar por empresa..."
                        value={filtros.empresa}
                        onChange={e => setFiltros(p => ({ ...p, empresa: e.target.value }))}
                        style={{ width: "100%", padding: "10px 12px", border: "2px solid #E0D9F5", borderRadius: 8, fontSize: ".88rem", boxSizing: "border-box", outline: "none", fontFamily: "inherit", color: "#2D2250", background: "white" }}
                        onFocus={e => e.target.style.borderColor = "#6C4FBF"}
                        onBlur={e => e.target.style.borderColor = "#E0D9F5"}
                      />
                    </div>
                    {/* Teléfono */}
                    <div>
                      <label style={{ display: "block", marginBottom: 6, color: "#4a3880", fontSize: ".88rem", fontWeight: 600 }}>
                        Teléfono
                      </label>
                      <input
                        type="text"
                        placeholder="Buscar por teléfono..."
                        value={filtros.telefono}
                        onChange={e => setFiltros(p => ({ ...p, telefono: e.target.value }))}
                        style={{ width: "100%", padding: "10px 12px", border: "2px solid #E0D9F5", borderRadius: 8, fontSize: ".88rem", boxSizing: "border-box", outline: "none", fontFamily: "inherit", color: "#2D2250", background: "white" }}
                        onFocus={e => e.target.style.borderColor = "#6C4FBF"}
                        onBlur={e => e.target.style.borderColor = "#E0D9F5"}
                      />
                    </div>
                    {/* Estado */}
                    <div>
                      <label style={{ display: "block", marginBottom: 6, color: "#4a3880", fontSize: ".88rem", fontWeight: 600 }}>
                        Estado
                      </label>
                      <select
                        value={filtros.estado}
                        onChange={e => setFiltros(p => ({ ...p, estado: e.target.value }))}
                        style={{ width: "100%", padding: "10px 12px", border: "2px solid #E0D9F5", borderRadius: 8, fontSize: ".88rem", boxSizing: "border-box", outline: "none", fontFamily: "inherit", color: "#2D2250", background: "white" }}
                        onFocus={e => e.target.style.borderColor = "#6C4FBF"}
                        onBlur={e => e.target.style.borderColor = "#E0D9F5"}
                      >
                        <option value="">Todos los estados</option>
                        <option value="ACTIVO">Activo</option>
                        <option value="INACTIVO">Inactivo</option>
                        <option value="SUSPENDIDO">Suspendido</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button type="button" onClick={limpiarFiltros} style={S.btnSm("#E0D9F5", "#6C4FBF")}>
                      <X size={13} /> Limpiar Filtros
                    </button>
                  </div>
                </div>

                {/* Resultados */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <h4 style={{ margin: 0, color: "#2D2250", fontSize: ".95rem" }}>Resultados:</h4>
                    <span style={{
                      background: "#6C4FBF", color: "white", borderRadius: 20,
                      padding: "2px 10px", fontSize: ".8rem", fontWeight: 700
                    }}>
                      {proveedoresFiltrados.length} {proveedoresFiltrados.length === 1 ? "proveedor" : "proveedores"}
                    </span>
                  </div>

                  {proveedoresFiltrados.length === 0 ? (
                    <div style={{
                      textAlign: "center", padding: "2rem", background: "#FAF9FF",
                      borderRadius: 10, color: "#888", border: "1px solid #E0D9F5"
                    }}>
                      <Search size={28} color="#C9BAEF" style={{ marginBottom: 8 }} />
                      <p style={{ margin: 0, fontSize: ".88rem" }}>
                        No se encontraron proveedores con los criterios actuales.
                      </p>
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto", border: "1px solid #E0D9F5", borderRadius: 10, overflow: "hidden" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".88rem" }}>
                        <thead>
                          <tr style={{ background: "#F0ECFF", borderBottom: "2px solid #E0D9F5" }}>
                            <th style={{ padding: "12px 14px", textAlign: "left",   color: "#6C4FBF", fontWeight: 700 }}>ID</th>
                            <th style={{ padding: "12px 14px", textAlign: "left",   color: "#6C4FBF", fontWeight: 700 }}>Nombre</th>
                            <th style={{ padding: "12px 14px", textAlign: "left",   color: "#6C4FBF", fontWeight: 700 }}>Empresa</th>
                            <th style={{ padding: "12px 14px", textAlign: "left",   color: "#6C4FBF", fontWeight: 700 }}>Teléfono</th>
                            <th style={{ padding: "12px 14px", textAlign: "left",   color: "#6C4FBF", fontWeight: 700 }}>Email</th>
                            <th style={{ padding: "12px 14px", textAlign: "center", color: "#6C4FBF", fontWeight: 700 }}>Estado</th>
                            <th style={{ padding: "12px 14px", textAlign: "center", color: "#6C4FBF", fontWeight: 700 }}>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {proveedoresFiltrados.map((proveedor, idx) => (
                            <tr
                              key={proveedor._id}
                              style={{
                                borderBottom: "1px solid #E0D9F5",
                                background: nuevaOrden.proveedor_id === proveedor._id
                                  ? "#F0ECFF"
                                  : idx % 2 === 0 ? "white" : "#FAF9FF",
                                transition: "background .15s"
                              }}
                              onMouseEnter={e => {
                                if (nuevaOrden.proveedor_id !== proveedor._id)
                                  e.currentTarget.style.background = "#F4F3FB";
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background =
                                  nuevaOrden.proveedor_id === proveedor._id
                                    ? "#F0ECFF"
                                    : idx % 2 === 0 ? "white" : "#FAF9FF";
                              }}
                            >
                              <td style={{ padding: "10px 14px", color: "#6C4FBF", fontWeight: 600 }}>
                                {proveedor.id_proveedor || "—"}
                              </td>
                              <td style={{ padding: "10px 14px", color: "#2D2250", fontWeight: 500 }}>
                                {proveedor.nombre}
                              </td>
                              <td style={{ padding: "10px 14px", color: "#666" }}>
                                {proveedor.empresa || "—"}
                              </td>
                              <td style={{ padding: "10px 14px", color: "#666" }}>
                                {proveedor.telefono || "—"}
                              </td>
                              <td style={{ padding: "10px 14px", color: "#666", fontSize: ".83rem" }}>
                                {proveedor.email
                                  ? <a href={`mailto:${proveedor.email}`} style={{ color: "#6C4FBF", textDecoration: "none" }}>{proveedor.email}</a>
                                  : "—"}
                              </td>
                              <td style={{ padding: "10px 14px", textAlign: "center" }}>
                                <span style={{
                                  display: "inline-block", padding: "3px 10px", borderRadius: 20,
                                  fontSize: ".78rem", fontWeight: 700,
                                  background: proveedor.estado === "ACTIVO" ? "#ecfdf5" : "#fee2e2",
                                  color:      proveedor.estado === "ACTIVO" ? "#065f46" : "#991b1b"
                                }}>
                                  {proveedor.estado}
                                </span>
                              </td>
                              <td style={{ padding: "10px 14px", textAlign: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => seleccionarProveedor(proveedor._id)}
                                  style={S.btnSm(
                                    nuevaOrden.proveedor_id === proveedor._id ? "#27AE60" : "#6C4FBF"
                                  )}
                                >
                                  {nuevaOrden.proveedor_id === proveedor._id ? "✓ Seleccionado" : "Seleccionar"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Cerrar búsqueda avanzada */}
                <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => { setMostrarBusquedaAvanzada(false); limpiarFiltros(); }}
                    style={S.btn("#E74C3C")}
                  >
                    <X size={15} /> Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ModalCrearOrden;