// ============================================================
// Directiva.jsx — REDISEÑO COMPLETO
// • Header estilo mm-* (igual a Sistema de Bienes)
// • TABLA: usa clases bienes-table, bienes-btn-icon, estado-badge,
//   codigo-chip, bienes-action-buttons — 100% igual a Bienes
// • Modales: diseño dn-* con tabs Información | Cargo | Fotografía | Auditoría
// • Auditoría completa: creado_por, fecha_creacion_sistema,
//   actualizado_por, fecha_actualizacion
// ============================================================
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import "../../../styles/Directiva.css";
import { auth } from "../../../components/authentication/Auth";
import { loadingController } from "../../../api/loadingController";
import {
  Users, Mail, Phone, Briefcase, FileText, Search,
  HelpCircle, Plus, Edit, Trash2, X, Save, Check, Filter,
  UserCheck, Clock, Shield, Camera, AlertTriangle, ImagePlus, Upload,
  Download,
} from 'lucide-react';
import ConfirmDialog from '../../../components/ConfirmDialog/ConfirmDialog';
import Notification from "../../../components/Notification";
import * as XLSX from "xlsx";
import WithPermission from '../../../components/Permisos/WithPermission';

const API_URL       = process.env.REACT_APP_API_URL + "/api/directiva";
const API_CATALOGOS = process.env.REACT_APP_API_URL + "/api/catalogos";

// ── Estilos inline S.btn — idénticos a Bienes/Proveedores ──
const S = {
  btn: (bg, col = "#fff") => ({
    display: "inline-flex", alignItems: "center", gap: 7,
    padding: "10px 20px", borderRadius: 10, fontSize: ".86rem",
    fontWeight: 700, border: "none", cursor: "pointer",
    background: bg, color: col, fontFamily: "inherit", transition: "all .18s",
  }),
};

// ── Columnas de tabla ──────────────────────────────────────
const columns = [
  { name: "NOMBRE",    uid: "nombre",             sortable: true  },
  { name: "IDENTIDAD", uid: "numero_identidad",   sortable: true  },
  { name: "CARGO",     uid: "cargo",              sortable: true  },
  { name: "VIGENCIA",  uid: "fecha_inicio_cargo", sortable: true  },
  { name: "EMPRESA",   uid: "empresa",            sortable: false },
  { name: "ESTADO",    uid: "estado",             sortable: true  },
  { name: "ACCIONES",  uid: "acciones",           sortable: false },
];

const estadosOptions = [
  { name: "Todos",      uid: "todos"      },
  { name: "Activo",     uid: "activo"     },
  { name: "Inactivo",   uid: "inactivo"   },
  { name: "Suspendido", uid: "suspendido" },
];

const ROWS = 15;

// ── Iniciales para avatar ──────────────────────────────────
const iniciales = (n = "") => {
  const p = n.trim().split(" ").filter(Boolean);
  if (!p.length) return "?";
  if (p.length === 1) return p[0][0].toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

// ── Helper fecha ───────────────────────────────────────────
const formatFecha = (fecha) => {
  if (!fecha || fecha === "null") return "No registrado";
  const s = typeof fecha === "string" ? fecha : new Date(fecha).toISOString();
  const datePart = s.slice(0, 10);
  const [y, m, d] = datePart.split("-");
  if (s.includes("T")) return `${d}/${m}/${y} ${s.slice(11, 16)}`;
  return `${d}/${m}/${y}`;
};

const fmtFecha = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = (typeof iso === "string" ? iso : new Date(iso).toISOString()).slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

// ── Mapa campo→tab para punto rojo ──────────────────────────
const TAB_DE_CAMPO = {
  nombre: "info", email: "info", telefono: "info", numero_identidad: "info",
  cargo: "cargo", fecha_inicio_cargo: "cargo",
};

// ── Formulario vacío ───────────────────────────────────────
const formVacio = () => ({
  nombre: "", cargo: "", email: "", telefono: "",
  numero_identidad: "", empresa: "", estado: "activo",
  fecha_inicio_cargo: "", fecha_fin_cargo: "", motivo_salida: "",
  fecha_registro: new Date().toISOString().split("T")[0],
  notas: "", foto: null,
});

// ─────────────────────────────────────────────────────────────
const Directiva = () => {
  const [miembros,         setMiembros]         = useState([]);
  const [filterValue,      setFilterValue]      = useState("");
  const [estadoFiltro,     setEstadoFiltro]     = useState("todos");
  const [sortDesc,         setSortDesc]         = useState({ column: "nombre", direction: "ascending" });
  const [page,             setPage]             = useState(1);
  const [notification,     setNotification]     = useState(null);
  const [mostrarAyuda,     setMostrarAyuda]     = useState(false);
  const [loading,          setLoading]          = useState(false);
  const [seleccionados,    setSeleccionados]    = useState([]);
  const [showConfirmBulk,  setShowConfirmBulk]  = useState(false);

  // Catálogo dinámico de cargos (igual que Personal/Donaciones)
  const [catCargo, setCatCargo] = useState([]);

  // Modal crear
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [tabActivo,          setTabActivo]         = useState("info");
  const [errors,             setErrors]            = useState({});
  const [fotoPreview,        setFotoPreview]       = useState(null);
  const [hayCambios,         setHayCambios]        = useState(false);

  // Modal editar
  const [miembroEditando,     setMiembroEditando]     = useState(null);
  const [tabEdicion,          setTabEdicion]          = useState("info");
  const [errorsEdit,          setErrorsEdit]          = useState({});
  const [fotoPreviewEdit,     setFotoPreviewEdit]     = useState(null);
  const [hayCambiosEdit,      setHayCambiosEdit]      = useState(false);
  const [showConfirmCerrar,   setShowConfirmCerrar]   = useState(false);

  // Eliminar
  const [showConfirm,       setShowConfirm]       = useState(false);
  const [miembroAEliminar,  setMiembroAEliminar]  = useState(null);

  const [formData, setFormData] = useState(formVacio());

  useEffect(() => { cargarMiembros(); }, []);

  // ── Carga de catálogo de cargos (igual que Personal) ──────
  useEffect(() => {
    const cargarCatalogos = async () => {
      const cargarCat = async (endpoint, setter) => {
        try {
          const res = await fetch(`${API_CATALOGOS}/directiva/${endpoint}`);
          if (!res.ok) return;
          const data = await res.json();
          const arr  = Array.isArray(data) ? data : data.data;
          if (arr && arr.length > 0) {
            setter(arr.map(item => ({
              valor:    item.valor,
              etiqueta: item.etiqueta || item.valor,
            })));
          }
        } catch (err) {
          console.error(`Error cargando catálogo ${endpoint}:`, err);
        }
      };

      await cargarCat("cargo", setCatCargo);
    };
    cargarCatalogos();
  }, []);

  const cargarMiembros = async () => {
    try {
      setLoading(true); loadingController.start();
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Error al cargar");
      const data = await res.json();
      setMiembros(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
    } catch (err) {
      showNotification("Error al cargar los miembros", "error");
      setMiembros([]);
    } finally { setLoading(false); loadingController.stop(); }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // ── Foto handler ───────────────────────────────────────────
  const handleFotoChange = (e, setPreview) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { alert("La foto no debe superar 3 MB"); return; }
    if (!file.type.startsWith("image/")) { alert("Solo imágenes"); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setFormData(p => ({ ...p, foto: reader.result.split(",")[1] }));
    };
    reader.readAsDataURL(file);
  };

  // ── Validación ─────────────────────────────────────────────
  const validar = (fd) => {
    const e = {};
    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!fd.nombre?.trim())                       e.nombre = "El nombre es obligatorio";
    else if (!soloLetras.test(fd.nombre.trim()))  e.nombre = "Solo letras y espacios";
    if (!fd.cargo?.trim())                        e.cargo  = "El cargo es obligatorio";
    if (!fd.email?.trim())                        e.email  = "El email es obligatorio";
    if (!fd.telefono)                             e.telefono = "El teléfono es obligatorio";
    else if (!/^\d+$/.test(fd.telefono.toString())) e.telefono = "Solo números";
    if (!fd.numero_identidad?.trim())             e.numero_identidad = "El número de identidad es obligatorio";
    if (!fd.fecha_inicio_cargo)                   e.fecha_inicio_cargo = "La fecha de inicio del cargo es requerida";
    return e;
  };

  // ── CRUD ──────────────────────────────────────────────────
  const handleCrearMiembro = async (e) => {
    e.preventDefault();
    const errs = validar(formData);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const primer = Object.keys(errs)[0];
      if (TAB_DE_CAMPO[primer]) setTabActivo(TAB_DE_CAMPO[primer]);
      return;
    }
    try {
      const user = auth.currentUser;
      if (!user) { showNotification("No autenticado", "error"); return; }
     const token = await user.getIdToken();
      const payload = {
        ...formData,
        fecha_registro: new Date(formData.fecha_registro),
        creado_por: user.email || "sistema",
        fecha_creacion_sistema: new Date().toISOString(),
      };
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Error al crear"); }
      await cargarMiembros();
      setMostrarModalCrear(false);
      setFormData(formVacio()); setFotoPreview(null); setErrors({}); setHayCambios(false);
      showNotification(`Miembro "${formData.nombre}" creado exitosamente`, "success");
    } catch (err) { showNotification(err.message, "error"); }
  };

  const handleEditarMiembro = async (e) => {
    e.preventDefault();
    const errs = validar(formData);
    if (Object.keys(errs).length > 0) {
      setErrorsEdit(errs);
      const primer = Object.keys(errs)[0];
      if (TAB_DE_CAMPO[primer]) setTabEdicion(TAB_DE_CAMPO[primer]);
      return;
    }
    try {
      loadingController.start();
      const user = auth.currentUser;
      if (!user) throw new Error("No autenticado");
      const token = await user.getIdToken();
      const payload = {
        ...formData,
        fecha_registro: new Date(formData.fecha_registro),
        actualizado_por: user.email,
        fecha_actualizacion: new Date().toISOString(),
      };
      const res = await fetch(`${API_URL}/${miembroEditando._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Error al editar"); }
      await cargarMiembros();
      setMiembroEditando(null); setFormData(formVacio()); setFotoPreviewEdit(null);
      setErrorsEdit({}); setHayCambiosEdit(false);
      showNotification(`Miembro "${formData.nombre}" actualizado`, "success");
    } catch (err) { showNotification(err.message, "error"); }
    finally { loadingController.stop(); }
  };

  const confirmarEliminacion = async () => {
    setShowConfirm(false);
    if (!miembroAEliminar) return;
    try {
      loadingController.start();
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_URL}/${miembroAEliminar._id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      await cargarMiembros();
      setMiembroEditando(null); setFormData(formVacio());
      showNotification(`"${miembroAEliminar.nombre}" eliminado`, "success");
      setMiembroAEliminar(null);
    } catch (err) { showNotification(err.message, "error"); }
    finally { loadingController.stop(); }
  };

  const handleEliminarMiembro = async (id) => {
    const m = miembros.find(x => x._id === id);
    setMiembroAEliminar(m);
    setShowConfirm(true);
  };

  const handleOpenEditModal = (miembro) => {
    setMiembroEditando(miembro);
    setFormData({
      nombre:             miembro.nombre            || "",
      cargo:              miembro.cargo             || "",
      email:              miembro.email             || "",
      telefono:           miembro.telefono          || "",
      numero_identidad:   miembro.numero_identidad  || "",
      empresa:            miembro.empresa           || "",
      estado:             miembro.estado            || "activo",
      fecha_inicio_cargo: miembro.fecha_inicio_cargo ? new Date(miembro.fecha_inicio_cargo).toISOString().split("T")[0] : "",
      fecha_fin_cargo:    miembro.fecha_fin_cargo    ? new Date(miembro.fecha_fin_cargo).toISOString().split("T")[0]    : "",
      motivo_salida:      miembro.motivo_salida     || "",
      fecha_registro:     miembro.fecha_registro    ? new Date(miembro.fecha_registro).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      notas:              miembro.notas             || "",
      foto:               miembro.foto              || null,
    });
    setFotoPreviewEdit(miembro.foto ? `data:image/jpeg;base64,${miembro.foto}` : null);
    setTabEdicion("info"); setErrorsEdit({}); setHayCambiosEdit(false);
  };

  const handleCloseEditModal = () => {
    if (hayCambiosEdit) { setShowConfirmCerrar(true); return; }
    setMiembroEditando(null); setFormData(formVacio());
    setFotoPreviewEdit(null); setErrorsEdit({}); setHayCambiosEdit(false);
  };

  // ── Filtrado + ordenamiento ────────────────────────────────
  const { filteredItems, metrics } = useMemo(() => {
    let f = [...miembros];
    if (filterValue) {
      const q = filterValue.toLowerCase();
      f = f.filter(m =>
        m.nombre?.toLowerCase().includes(q) ||
        m.cargo?.toLowerCase().includes(q)  ||
        m.email?.toLowerCase().includes(q)  ||
        m.numero_identidad?.toLowerCase().includes(q)
      );
    }
    if (estadoFiltro !== "todos") f = f.filter(m => m.estado === estadoFiltro);
    return {
      filteredItems: f,
      metrics: {
        activos:     miembros.filter(m => m.estado === "activo").length,
        inactivos:   miembros.filter(m => m.estado === "inactivo").length,
        suspendidos: miembros.filter(m => m.estado === "suspendido").length,
        total:       miembros.length,
      },
    };
  }, [miembros, filterValue, estadoFiltro]);

  const sortedItems = useMemo(() => {
    if (!sortDesc.column) return filteredItems;
    return [...filteredItems].sort((a, b) => {
      const x = String(a[sortDesc.column] || "");
      const y = String(b[sortDesc.column] || "");
      const c = x.localeCompare(y);
      return sortDesc.direction === "descending" ? -c : c;
    });
  }, [filteredItems, sortDesc]);

  const pages = Math.ceil(sortedItems.length / ROWS) || 1;
  const currentItems = useMemo(() => {
    const s = (page - 1) * ROWS;
    return sortedItems.slice(s, s + ROWS);
  }, [page, sortedItems]);

  const handleSort = (uid) => {
    const col = columns.find(c => c.uid === uid);
    if (!col?.sortable) return;
    setSortDesc(p => ({
      column: uid,
      direction: p.column === uid && p.direction === "ascending" ? "descending" : "ascending",
    }));
  };

  const pageNums = () => {
    const nums = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) nums.push(i);
    return nums;
  };

  // ── Estado badge class ─────────────────────────────────────
  const estadoBadgeClass = (e) => ({
    activo:     "estado-badge estado-activo",
    inactivo:   "estado-badge estado-inactivo",
    suspendido: "estado-badge estado-mantenimiento",
  }[e?.toLowerCase()] || "estado-badge");

  // ── Excel ─────────────────────────────────────────────────
  const handleExportarExcel = () => {
    if (filteredItems.length === 0) { showNotification("No hay miembros para exportar.", "error"); return; }
    const data = filteredItems.map((m, i) => ({
      "N°": i + 1,
      Nombre: m.nombre,
      Identidad: m.numero_identidad || "—",
      Cargo: m.cargo,
      Email: m.email,
      Teléfono: m.telefono,
      Empresa: m.empresa || "—",
      Estado: m.estado?.toUpperCase() || "—",
      "Inicio Cargo": fmtFecha(m.fecha_inicio_cargo),
      "Fin Cargo":    fmtFecha(m.fecha_fin_cargo),
    }));
    const ws = XLSX.utils.json_to_sheet(data, { origin: "A6" });
    const wb = XLSX.utils.book_new();
    XLSX.utils.sheet_add_aoa(ws, [
      ["ESCUELA EXPERIMENTAL DE NIÑOS PARA LA MÚSICA"],
      ["SISTEMA INTEGRADO ADMINISTRATIVO MUSICAL - S.I.A.M."],
      [""], ["DIRECTIVA"], [""],
    ], { origin: "A1" });
    const fecha = new Date().toLocaleDateString("es-HN");
    XLSX.utils.book_append_sheet(wb, ws, "Directiva");
    XLSX.writeFile(wb, `Directiva_${fecha.replace(/\//g, "-")}.xlsx`);
  };

  // ── Tab helper ─────────────────────────────────────────────
  const tabTieneError = (key, errs) =>
    Object.keys(errs).some(c => TAB_DE_CAMPO[c] === key);

  // ── Formulario compartido ──────────────────────────────────
  const renderFormulario = ({
    onSubmit, esEdicion, miembro,
    tab, setTab,
    errs, setErrs,
    preview, setPreview,
    hasCambios, setHasCambios,
    onCancel,
  }) => {
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(p => ({ ...p, [name]: value }));
      setHasCambios(true);
      if (errs[name]) setErrs(p => { const n = { ...p }; delete n[name]; return n; });
    };

    const tabBtn = (key, label, ico) => (
      <button
        key={key} type="button"
        className={`dn-tab-btn${tab === key ? " active" : ""}${tabTieneError(key, errs) ? " has-error" : ""}`}
        onClick={() => setTab(key)}
      >
        {ico} {label}
        {tabTieneError(key, errs) && <span className="dn-tab-error-dot" />}
      </button>
    );

    return (
      <form onSubmit={onSubmit} noValidate>
        {/* Tabs */}
        <div className="dn-modal-tabs">
          {tabBtn("info",   "Información",  <FileText  size={14} />)}
          {tabBtn("cargo",  "Cargo",        <Briefcase size={14} />)}
          {tabBtn("foto",   "Fotografía",   <Camera    size={14} />)}
          {esEdicion && tabBtn("auditoria", "Auditoría", <Clock size={14} />)}
        </div>

        {/* TAB: Información */}
        {tab === "info" && (
          <div className="dn-tab-content">
            <div className="dn-form-section-title">Datos Personales</div>
            <div className="dn-form-grid">

              <div className={`dn-form-group${errs.nombre ? " dn-field-error" : ""}`}>
                <label>Nombre Completo <span className="req">*</span></label>
                <input name="nombre" value={formData.nombre} onChange={handleChange}
                  placeholder="Nombre y apellido" className={errs.nombre ? "dn-input-err" : ""} />
                {errs.nombre && <span className="dn-err-msg">{errs.nombre}</span>}
              </div>

              <div className={`dn-form-group${errs.numero_identidad ? " dn-field-error" : ""}`}>
                <label>Número de Identidad <span className="req">*</span></label>
                <input name="numero_identidad" value={formData.numero_identidad} onChange={handleChange}
                  placeholder="0000-0000-00000" className={errs.numero_identidad ? "dn-input-err" : ""} />
                {errs.numero_identidad && <span className="dn-err-msg">{errs.numero_identidad}</span>}
              </div>

              <div className={`dn-form-group${errs.email ? " dn-field-error" : ""}`}>
                <label>Correo Electrónico <span className="req">*</span></label>
                <input name="email" type="email" value={formData.email} onChange={handleChange}
                  placeholder="correo@ejemplo.com" className={errs.email ? "dn-input-err" : ""} />
                {errs.email && <span className="dn-err-msg">{errs.email}</span>}
              </div>

              <div className={`dn-form-group${errs.telefono ? " dn-field-error" : ""}`}>
                <label>Teléfono <span className="req">*</span></label>
                <input name="telefono" value={formData.telefono} onChange={handleChange}
                  placeholder="Número de teléfono" className={errs.telefono ? "dn-input-err" : ""} />
                {errs.telefono && <span className="dn-err-msg">{errs.telefono}</span>}
              </div>

              <div className="dn-form-group">
                <label>Empresa / Institución</label>
                <input name="empresa" value={formData.empresa} onChange={handleChange}
                  placeholder="Empresa u organización" />
              </div>

              <div className="dn-form-group">
                <label>Estado</label>
                <select name="estado" value={formData.estado} onChange={handleChange}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="suspendido">Suspendido</option>
                </select>
              </div>

              <div className="dn-form-group">
                <label>Fecha de Registro</label>
                <input name="fecha_registro" type="date" value={formData.fecha_registro} onChange={handleChange} />
              </div>

              <div className="dn-form-group dn-full">
                <label>Notas</label>
                <textarea name="notas" value={formData.notas} onChange={handleChange}
                  placeholder="Observaciones adicionales..." rows="2" />
              </div>
            </div>
          </div>
        )}

        {/* TAB: Cargo */}
        {tab === "cargo" && (
          <div className="dn-tab-content">
            <div className="dn-form-section-title">Cargo y Vigencia</div>
            <div className="dn-form-grid">

              {/* ── Cargo — dinámico desde catálogo ── */}
              <div className={`dn-form-group dn-full${errs.cargo ? " dn-field-error" : ""}`}>
                <label>Cargo en la Directiva <span className="req">*</span></label>
                <select
                  name="cargo"
                  value={formData.cargo}
                  onChange={handleChange}
                  className={errs.cargo ? "dn-input-err" : ""}
                >
                  <option value="">Seleccionar cargo...</option>
                  {catCargo.map(c => (
                    <option key={c.valor} value={c.valor}>{c.etiqueta}</option>
                  ))}
                </select>
                {errs.cargo && <span className="dn-err-msg">{errs.cargo}</span>}
              </div>

              <div className={`dn-form-group${errs.fecha_inicio_cargo ? " dn-field-error" : ""}`}>
                <label>Fecha de Inicio en el Cargo <span className="req">*</span></label>
                <input name="fecha_inicio_cargo" type="date" value={formData.fecha_inicio_cargo} onChange={handleChange}
                  className={errs.fecha_inicio_cargo ? "dn-input-err" : ""} />
                {errs.fecha_inicio_cargo
                  ? <span className="dn-err-msg">{errs.fecha_inicio_cargo}</span>
                  : <small className="dn-hint">Fecha real de inicio del cargo</small>}
              </div>

              <div className="dn-form-group">
                <label>Fecha de Finalización Prevista</label>
                <input name="fecha_fin_cargo" type="date" value={formData.fecha_fin_cargo}
                  onChange={handleChange} min={formData.fecha_inicio_cargo || undefined} />
                <small className="dn-hint">Dejar en blanco si aún está vigente</small>
              </div>

              {formData.fecha_fin_cargo && (
                <div className="dn-form-group dn-full">
                  <label>
                    <AlertTriangle size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                    Motivo de Salida / Fin de Cargo
                  </label>
                  <textarea name="motivo_salida" value={formData.motivo_salida} onChange={handleChange}
                    placeholder="Ej: Renuncia voluntaria, fin de período, destitución..." rows="3" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: Fotografía */}
        {tab === "foto" && (
          <div className="dn-tab-content">
            <div className="dn-form-section-title">Fotografía del Miembro</div>
            <div className="dn-upload-area">
              {preview ? (
                <div className="dn-preview-wrap">
                  <img src={preview} alt="Preview" className="dn-img-preview" />
                  <div className="dn-preview-actions">
                    <input type="file" accept="image/*"
                      onChange={e => { handleFotoChange(e, setPreview); setHasCambios(true); }}
                      style={{ display: "none" }} id="dir-foto-replace" />
                    <label htmlFor="dir-foto-replace" className="dn-btn-secondary">
                      <Upload size={15} /> Cambiar foto
                    </label>
                    <button type="button" style={S.btn("#E74C3C")}
                      onClick={() => { setPreview(null); setFormData(p => ({ ...p, foto: null })); setHasCambios(true); }}>
                      <X size={15} /> Eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="dn-upload-empty">
                  <Upload size={42} color="#9b59b6" style={{ marginBottom: "0.75rem" }} />
                  <p>Arrastra una imagen o haz clic para seleccionar</p>
                  <input type="file" accept="image/*"
                    onChange={e => { handleFotoChange(e, setPreview); setHasCambios(true); }}
                    style={{ display: "none" }} id="dir-foto-new" />
                  <label htmlFor="dir-foto-new" className="dn-btn-primary-sm">
                    <ImagePlus size={16} /> Seleccionar imagen
                  </label>
                  <small>JPG, PNG · máx. 3 MB</small>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: Auditoría */}
        {tab === "auditoria" && esEdicion && miembro && (
          <div className="dn-tab-content">
            <div className="dn-form-section-title">Auditoría del Miembro</div>
            <div className="dn-audit-card">
              <div className="dn-audit-row">
                <UserCheck size={16} className="dn-audit-ico" />
                <div>
                  <div className="dn-audit-label">Creación</div>
                  <div className="dn-audit-val">
                    Creado por: <strong>{miembro.creado_por || "N/D"}</strong>
                    &nbsp;·&nbsp;
                    Fecha: <strong>{formatFecha(miembro.fecha_creacion_sistema || miembro.fecha_registro || miembro.createdAt)}</strong>
                  </div>
                </div>
              </div>
              {(miembro.actualizado_por || miembro.fecha_actualizacion || miembro.updatedAt) && (
                <div className="dn-audit-row">
                  <Clock size={16} className="dn-audit-ico" />
                  <div>
                    <div className="dn-audit-label">Última Actualización</div>
                    <div className="dn-audit-val">
                      Por: <strong>{miembro.actualizado_por || "N/D"}</strong>
                      &nbsp;·&nbsp;
                      <strong>{formatFecha(miembro.fecha_actualizacion || miembro.updatedAt)}</strong>
                    </div>
                  </div>
                </div>
              )}
              <div className="dn-audit-ids">
                <small>ID: <strong>{miembro._id}</strong></small>
                <small>Estado: <strong>{miembro.estado || "N/D"}</strong></small>
                {miembro.numero_identidad && <small>Identidad: <strong>{miembro.numero_identidad}</strong></small>}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="dn-modal-footer">
          {esEdicion && (
            <button type="button" style={S.btn("#E74C3C")}
              onClick={() => { setMiembroAEliminar(miembro); setShowConfirm(true); }}>
             Eliminar
            </button>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" style={S.btn("#E0D9F5", "#6C4FBF")} onClick={onCancel}>
             Cancelar
            </button>
            <button type="submit" style={S.btn("#6C4FBF")}>
              {esEdicion ? <>Guardar</> : <>Guardar</>}
            </button>
          </div>
        </div>
      </form>
    );
  };

  // ══════════════════════════════════════════════════════════
  return (
    <div className="bienes-app">

      {/* ── HEADER estilo mm-* (idéntico a Bienes) ── */}
      <motion.div className="mm-header"
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 120 }}>
        <div className="mm-hi">
          <div className="mm-ht">
            <motion.div className="mm-htitle"
              initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <motion.span initial={{ rotate: -180, scale: 0 }} animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}>
                <Users size={34} color="white" fill="white" />
              </motion.span>
              Gestión de Directiva
            </motion.div>
          </div>

          <motion.p className="mm-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            Administra los miembros de la directiva con plena identificación y trazabilidad
          </motion.p>

          <motion.div className="mm-stats" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            {[
              { ico: <Users     size={18} color="white" />, val: filteredItems.length, lbl: filteredItems.length === miembros.length ? "Total" : "Filtrados" },
              { ico: <UserCheck size={18} color="white" />, val: filteredItems.filter(m => m.estado === "activo").length,     lbl: "Activos"     },
              { ico: <Clock     size={18} color="white" />, val: filteredItems.filter(m => m.estado === "inactivo").length,   lbl: "Inactivos"   },
              { ico: <Shield    size={18} color="white" />, val: filteredItems.filter(m => m.estado === "suspendido").length, lbl: "Suspendidos" },
            ].map((s, i) => (
              <motion.div key={i} className="mm-stat"
                whileHover={{ scale: 1.04, y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
                <div className="mm-stat-ico">{s.ico}</div>
                <div>
                  <div className="mm-stat-val">{s.val}</div>
                  <div className="mm-stat-lbl">{s.lbl}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* ── BARRA DE ACCIONES (idéntica a Bienes) ── */}
      <div className="bienes-action-area">

        {/* Fila 1: búsqueda + botones */}
        <div className="bienes-action-bar">
          <div className="bienes-search-wrapper">
            <span className="bienes-search-icon"><Search size={16} /></span>
            <input type="text" className="bienes-search-input"
              placeholder="Buscar por nombre, cargo, email o identidad..."
              value={filterValue}
              onChange={e => { setFilterValue(e.target.value); setPage(1); }} />
            {filterValue && (
              <button className="bienes-search-clear" onClick={() => setFilterValue("")}>×</button>
            )}
          </div>

          <div className="bienes-bar-buttons">
            {seleccionados.length > 0 && (
              <button type="button" style={S.btn("#E74C3C")} onClick={() => setShowConfirmBulk(true)}>
                <Trash2 size={15} /> Eliminar ({seleccionados.length})
              </button>
            )}
            <button style={S.btn("#E0D9F5", "#6C4FBF")} onClick={() => setMostrarAyuda(true)}>
              <HelpCircle size={15} /> Ayuda
            </button>
            <button style={S.btn("#27AE60")} onClick={handleExportarExcel}>
              <Download size={15} /> Excel
            </button>
             <WithPermission requiredPermissions={["CREAR_DIRECTIVA"]}>
            <button style={S.btn("#6C4FBF")} onClick={() => {
              setFormData(formVacio()); setFotoPreview(null);
              setErrors({}); setTabActivo("info"); setHayCambios(false);
              setMostrarModalCrear(true);
            }}>
              <Plus size={15} /> Nuevo Miembro
            </button>
            </WithPermission>
          </div>
        </div>

        {/* Fila 2: pills de estado */}
        <div className="bienes-filters-bar">
          <div className="bienes-filter-group">
            <span className="bienes-filter-label"><Filter size={13} /> Estado:</span>
            <div className="bienes-filter-pills">
              {estadosOptions.map(op => (
                <button key={op.uid}
                  className={`bienes-pill${estadoFiltro === op.uid ? " active" : ""}`}
                  onClick={() => { setEstadoFiltro(op.uid); setPage(1); }}>
                  {op.name}
                </button>
              ))}
            </div>
          </div>
          {estadoFiltro !== "todos" && (
            <button className="bienes-clear-filters"
              onClick={() => { setEstadoFiltro("todos"); setPage(1); }}>
              ✕ Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── TABLA (clases bienes-table — 100% idéntica a Bienes) ── */}
      <div className="bienes-container">
        <div className="bienes-table-wrapper">

          <div className="bienes-results-info">
            <span>
              Mostrando <strong>{Math.min((page - 1) * ROWS + 1, sortedItems.length)}</strong>–<strong>{Math.min(page * ROWS, sortedItems.length)}</strong> de <strong>{sortedItems.length}</strong> miembro{sortedItems.length !== 1 ? "s" : ""}
              {filterValue && <span className="filtrado-tag"> · filtrado de {miembros.length}</span>}
            </span>
            {seleccionados.length > 0 && (
              <span className="seleccionados-info">{seleccionados.length} seleccionado(s)</span>
            )}
          </div>

          <div className="bienes-table-scroll">
            <table className="bienes-table">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>
                    <input type="checkbox" className="bienes-checkbox"
                      checked={currentItems.length > 0 && currentItems.every(m => seleccionados.includes(m._id))}
                      onChange={e => {
                        if (e.target.checked) setSeleccionados(p => [...new Set([...p, ...currentItems.map(m => m._id)])]);
                        else setSeleccionados(p => p.filter(id => !currentItems.map(m => m._id).includes(id)));
                      }} />
                  </th>
                  {columns.map(col => (
                    <th key={col.uid}
                      className={col.sortable ? "sortable" : ""}
                      onClick={() => handleSort(col.uid)}>
                      {col.name}
                      {col.sortable && sortDesc.column === col.uid && (
                        <span className="sort-arrow">{sortDesc.direction === "ascending" ? " ↑" : " ↓"}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && miembros.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="bienes-no-results">
                      <div className="bienes-empty-state">
                        <Users size={40} color="#ccc" />
                        <p>Cargando miembros...</p>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="bienes-no-results">
                      <div className="bienes-empty-state">
                        <Users size={40} color="#ccc" />
                        <p>No se encontraron miembros con los filtros actuales</p>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.map(m => (
                  <tr key={m._id} className={seleccionados.includes(m._id) ? "row-selected" : ""}>

                    {/* Checkbox */}
                    <td>
                      <input type="checkbox" className="bienes-checkbox"
                        checked={seleccionados.includes(m._id)}
                        onChange={e => {
                          if (e.target.checked) setSeleccionados(p => [...p, m._id]);
                          else setSeleccionados(p => p.filter(id => id !== m._id));
                        }} />
                    </td>

                    {/* Nombre + avatar */}
                    <td>
                      <div className="bienes-nombre-cell" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="dir-avatar">
                          {m.foto
                            ? <img src={`data:image/jpeg;base64,${m.foto}`} alt="" />
                            : iniciales(m.nombre)}
                        </div>
                        <div>
                          <div className="nombre">{m.nombre}</div>
                          <div className="descripcion-preview">{m.email}</div>
                          {m.creado_por && <div style={{ fontSize: "0.68rem", color: "#bbb" }}>Reg. por {m.creado_por}</div>}
                        </div>
                      </div>
                    </td>

                    {/* Identidad */}
                    <td className="bienes-td-codigo">
                      {m.numero_identidad
                        ? <span className="codigo-chip">{m.numero_identidad}</span>
                        : <span style={{ color: "#ef4444", fontSize: "0.76rem", fontWeight: 600 }}>⚠ Sin identidad</span>}
                    </td>

                    {/* Cargo */}
                    <td>
                      <span className="bienes-categoria-badge">{m.cargo}</span>
                    </td>

                    {/* Vigencia */}
                    <td className="bienes-td-fecha">
                      {m.fecha_inicio_cargo && (
                        <span>{fmtFecha(m.fecha_inicio_cargo)}</span>
                      )}
                      {m.fecha_fin_cargo
                        ? <span style={{ color: "#b45309", fontWeight: 600, marginLeft: 4 }}>→ {fmtFecha(m.fecha_fin_cargo)}</span>
                        : m.fecha_inicio_cargo && <span style={{ color: "#16a34a", fontWeight: 600, marginLeft: 4 }}> En curso</span>}
                    </td>

                    {/* Empresa */}
                    <td style={{ color: "#555", fontSize: "0.85rem" }}>
                      {m.empresa || "—"}
                    </td>

                    {/* Estado */}
                    <td>
                      <span className={estadoBadgeClass(m.estado)}>{m.estado?.toUpperCase()}</span>
                    </td>

                    {/* Acciones */}
                    <td>
                      <div className="bienes-action-buttons">
                        <WithPermission requiredPermissions={["ACTUALIZAR_DIRECTIVA"]}>
                        <button className="bienes-btn-icon edit" title="Editar"
                          onClick={() => handleOpenEditModal(m)}>
                          <Edit size={15} />
                        </button>
                        </WithPermission>
                         <WithPermission requiredPermissions={["ACTUALIZAR_DIRECTIVA"]}>
                        <button className="bienes-btn-icon delete" title="Eliminar"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar a "${m.nombre}"?`)) handleEliminarMiembro(m._id);
                          }}>
                          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                          </svg>
                        </button>
                        </WithPermission>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="bienes-pagination">
            <div className="bienes-pagination-info">
              Página <strong>{page}</strong> de <strong>{pages}</strong>
            </div>
            <div className="bienes-pagination-controls">
              <button className="bienes-page-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
              <button className="bienes-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
              {pageNums().map(n => (
                <button key={n} className={`bienes-page-btn${page === n ? " active" : ""}`} onClick={() => setPage(n)}>{n}</button>
              ))}
              <button className="bienes-page-btn" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>›</button>
              <button className="bienes-page-btn" onClick={() => setPage(pages)} disabled={page === pages}>»</button>
            </div>
          </div>
        </div>
      </div>

      {/* ══ MODAL CREAR ═══════════════════════════════════════ */}
      <AnimatePresence>
        {mostrarModalCrear && (
          <motion.div className="dn-overlay"
            onClick={() => { if (!hayCambios) { setMostrarModalCrear(false); setFormData(formVacio()); setFotoPreview(null); setErrors({}); } }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="dn-modal" onClick={e => e.stopPropagation()}
              initial={{ scale: 0.85, y: 40 }} animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 40 }} transition={{ type: "spring", damping: 22 }}>

              <div className="dn-modal-header">
                <h3><Plus size={20} /> Agregar Nuevo Miembro</h3>
                <button className="dn-modal-close" onClick={() => {
                  setMostrarModalCrear(false); setFormData(formVacio()); setFotoPreview(null); setErrors({});
                }}><X size={18} /></button>
              </div>
              {hayCambios && <div className="dn-unsaved-banner">⚠️ Tienes cambios sin guardar</div>}

              {renderFormulario({
                onSubmit: handleCrearMiembro, esEdicion: false, miembro: null,
                tab: tabActivo, setTab: setTabActivo,
                errs: errors, setErrs: setErrors,
                preview: fotoPreview, setPreview: setFotoPreview,
                hasCambios: hayCambios, setHasCambios: setHayCambios,
                onCancel: () => {
                  setMostrarModalCrear(false); setFormData(formVacio());
                  setFotoPreview(null); setErrors({}); setHayCambios(false);
                },
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ MODAL EDITAR ══════════════════════════════════════ */}
      <AnimatePresence>
        {miembroEditando && (
          <motion.div className="dn-overlay" onClick={handleCloseEditModal}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="dn-modal" onClick={e => e.stopPropagation()}
              initial={{ scale: 0.85, y: 40 }} animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 40 }} transition={{ type: "spring", damping: 22 }}>

              <div className="dn-modal-header">
                <h3><Edit size={20} /> Editar: {miembroEditando.nombre}</h3>
                <button className="dn-modal-close" onClick={handleCloseEditModal}><X size={18} /></button>
              </div>
              {hayCambiosEdit && <div className="dn-unsaved-banner">⚠️ Tienes cambios sin guardar</div>}

              {renderFormulario({
                onSubmit: handleEditarMiembro, esEdicion: true, miembro: miembroEditando,
                tab: tabEdicion, setTab: setTabEdicion,
                errs: errorsEdit, setErrs: setErrorsEdit,
                preview: fotoPreviewEdit, setPreview: setFotoPreviewEdit,
                hasCambios: hayCambiosEdit, setHasCambios: setHayCambiosEdit,
                onCancel: handleCloseEditModal,
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ MODAL AYUDA ═══════════════════════════════════════ */}
      {mostrarAyuda && (
        <div className="bienes-modal-overlay">
          <div className="bienes-modal sm">
            <div className="bienes-modal-header">
              <h3 className="bienes-modal-title"><Users size={20} /> Ayuda – Directiva</h3>
              <button className="bienes-modal-close" onClick={() => setMostrarAyuda(false)}>✕</button>
            </div>
            <div className="bienes-modal-body">
              <div className="bienes-help-section">
                <div className="bienes-help-title">Campos del miembro</div>
                <ul className="bienes-help-list">
                  <li><strong>Número de Identidad:</strong> Obligatorio y único por miembro.</li>
                  <li><strong>Foto:</strong> Identificación visual en el sistema.</li>
                  <li><strong>Cargo y Vigencia:</strong> Fecha de inicio, fin y motivo de salida.</li>
                  <li><strong>Catálogo de cargos:</strong> Los cargos disponibles se administran desde la API.</li>
                  <li><strong>Auditoría:</strong> El sistema registra automáticamente quién y cuándo.</li>
                </ul>
              </div>
              <div className="bienes-help-section">
                <div className="bienes-help-title">Estados</div>
                <div className="bienes-estados-grid">
                  {[
                    { icon: <UserCheck size={14} color="var(--bienes-success)" />, label: "ACTIVO – Miembro en funciones" },
                    { icon: <Clock     size={14} color="var(--bienes-danger)"  />, label: "INACTIVO – Ya no ocupa el cargo" },
                    { icon: <Shield    size={14} color="var(--bienes-warning)" />, label: "SUSPENDIDO – En proceso administrativo" },
                  ].map((s, i) => (
                    <div key={i} className="bienes-estado-item">{s.icon} {s.label}</div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bienes-modal-footer">
              <button className="bienes-btn bienes-btn-primary" onClick={() => setMostrarAyuda(false)}>
                Cerrar Ayuda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ CONFIRM ELIMINAR ══════════════════════════════════ */}
      {showConfirm && (
        <ConfirmDialog
          message={`¿Eliminar a "${miembroAEliminar?.nombre}"?`}
          onConfirm={confirmarEliminacion}
          onCancel={() => { setShowConfirm(false); setMiembroAEliminar(null); }}
          visible={showConfirm}
        />
      )}

      {/* ══ CONFIRM ELIMINAR MASIVO ═══════════════════════════ */}
      {showConfirmBulk && (
        <ConfirmDialog
          message={`¿Eliminar ${seleccionados.length} miembro(s) seleccionado(s)?`}
          onConfirm={() => {
            seleccionados.forEach(id => handleEliminarMiembro(id));
            setSeleccionados([]); setShowConfirmBulk(false);
          }}
          onCancel={() => setShowConfirmBulk(false)}
          visible={showConfirmBulk}
        />
      )}

      {/* ══ CONFIRM CERRAR CON CAMBIOS ════════════════════════ */}
      {showConfirmCerrar && (
        <ConfirmDialog
          message="Tienes cambios sin guardar. ¿Seguro que deseas cerrar?"
          onConfirm={() => {
            setShowConfirmCerrar(false);
            setMiembroEditando(null); setFormData(formVacio());
            setFotoPreviewEdit(null); setErrorsEdit({}); setHayCambiosEdit(false);
          }}
          onCancel={() => setShowConfirmCerrar(false)}
          visible={showConfirmCerrar}
        />
      )}

      {/* ══ NOTIFICACIÓN ══════════════════════════════════════ */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default Directiva;