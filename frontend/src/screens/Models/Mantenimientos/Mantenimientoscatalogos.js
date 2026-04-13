// MantenimientosCatalogos.jsx
// Pantalla de mantenimiento para todos los catálogos del sistema.
// Usa el mismo header (mm-*) y diseño de Bienes/Donaciones.

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Plus, Edit2, Trash2, X, Save, Search,
  ChevronRight, ToggleLeft, ToggleRight, Package,
  Users, Gift, BookOpen, Award, Clock, Tag,
  CheckCircle, AlertCircle, Loader2, RefreshCw,
} from "lucide-react";
import "./Mantenimientoscatalogos.css";
import WithPermission from "../../../components/Permisos/WithPermission";

// ── Config ──────────────────────────────────────────────────
const API = process.env.REACT_APP_API_URL + "/api/catalogos";

// ── Definición de módulos ────────────────────────────────────
const MODULOS = [
  {
    key: "matricula",
    label: "Matrícula",
    icon: <BookOpen size={18} />,
    color: "#3B82F6",
    tipos: [
      { key: "parentesco_encargado", label: "Parentesco del Encargado" },
      { key: "tipo",       label: "Tipo de Documento" },
    ],
  },
  {
    key: "personal",
    label: "Personal",
    icon: <Users size={18} />,
    color: "#10B981",
    tipos: [
      { key: "tipo_contrato",     label: "Tipo de Contrato" },
      { key: "area_trabajo",      label: "Área de Trabajo" },
      { key: "cargo",             label: "Cargo / Asignación" },
      { key: "horario_preferido", label: "Horario Preferido" },
    ],
  },
  {
    key: "donaciones",
    label: "Donaciones",
    icon: <Gift size={18} />,
    color: "#F59E0B",
    tipos: [
      { key: "tipo_donacion", label: "Tipo de Donación" },
      { key: "id_almacen", label: "Tipo de almacen" },
    ],
  },
  {
    key: "bienes",
    label: "Bienes",
    icon: <Package size={18} />,
    color: "#8B5CF6",
    tipos: [
      { key: "categoria",      label: "Categoría" },
      { key: "tipo_asignacion", label: "Tipo de Asignación" },
    ],
  },
  {
    key: "directiva",
    label: "Directiva",
    icon: <Award size={18} />,
    color: "#EF4444",
    tipos: [
      { key: "cargo", label: "Cargo" },
    ],
  },
  {
    key: "horarios",
    label: "Horarios",
    icon: <Clock size={18} />,
    color: "#EC4899",
    tipos: [
      { key: "asignatura", label: "Asignatura" },
    ],
  },
];

// ── Toast ────────────────────────────────────────────────────
const Toast = ({ toasts }) => (
  <div className="mnt-toast-container">
    <AnimatePresence>
      {toasts.map(t => (
        <motion.div
          key={t.id}
          className={`mnt-toast mnt-toast--${t.type}`}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 60 }}
        >
          {t.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {t.msg}
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

// ── Modal Crear/Editar ───────────────────────────────────────
const ModalForm = ({ item, modulo, tipo, tipoLabel, onClose, onSave }) => {
  const isEdit = !!item;
  const [form, setForm] = useState({
    valor:       item?.valor       || "",
    etiqueta:    item?.etiqueta    || "",
    descripcion: item?.descripcion || "",
    orden:       item?.orden       ?? 0,
  });
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);

  const validar = () => {
    const e = {};
    if (!form.valor.trim()) e.valor = "El valor es obligatorio";
    return e;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    // Campo "valor": solo mayúsculas, letras (incluye acentuadas), números y guiones bajos.
    // No se permiten espacios ni símbolos especiales.
    const sanitized = name === "valor"
      ? value.toUpperCase().replace(/[^A-Z0-9_ÁÉÍÓÚÜÑ]/g, "")
      : value;
    setForm(p => ({ ...p, [name]: sanitized }));
    if (errores[name]) setErrores(p => { const n = { ...p }; delete n[name]; return n; });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validar();
    if (Object.keys(errs).length) { setErrores(errs); return; }

    setLoading(true);
    try {
      const body = isEdit
        ? { valor: form.valor, etiqueta: form.etiqueta, descripcion: form.descripcion, orden: Number(form.orden) }
        : { modulo, tipo, valor: form.valor, etiqueta: form.etiqueta, descripcion: form.descripcion, orden: Number(form.orden) };

      const url    = isEdit ? `${API}/${item._id}` : API;
      const method = isEdit ? "PUT" : "POST";

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.mensaje);
      onSave(data.data, isEdit ? "edit" : "create");
    } catch (err) {
      setErrores({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div className="mnt-overlay" onClick={onClose}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="mnt-modal" onClick={e => e.stopPropagation()}
        initial={{ scale: 0.88, y: 30 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.88, y: 30 }} transition={{ type: "spring", damping: 22 }}>

        {/* Header modal */}
        <div className="mnt-modal-header">
          <h3>{isEdit ? <><Edit2 size={18}/> Editar valor</> : <><Plus size={18}/> Nuevo valor</>}</h3>
          <button className="mnt-modal-close" onClick={onClose}><X size={17}/></button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mnt-modal-body">
            {/* Badge módulo+tipo */}
            <div className="mnt-modal-badge">
              <Tag size={13}/> {MODULOS.find(m => m.key === modulo)?.label} → {tipoLabel}
            </div>

            {errores.general && (
              <div className="mnt-alert mnt-alert--danger">{errores.general}</div>
            )}

            {/* Valor */}
            <div className="mnt-field">
              <label className="mnt-label">Valor <span className="req">*</span></label>
              <input
                name="valor"
                value={form.valor}
                onChange={handleChange}
                className={`mnt-input${errores.valor ? " error" : ""}`}
                placeholder="Ej: TIEMPO_COMPLETO, MATEMATICAS…"
                style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}
                autoComplete="off"
                spellCheck={false}
              />
              {errores.valor
                ? <span className="mnt-err">{errores.valor}</span>
                : <span className="mnt-hint">Solo mayúsculas, números y guión bajo ( _ ). Sin espacios ni símbolos.</span>
              }
            </div>

            {/* Etiqueta */}
            <div className="mnt-field">
              <label className="mnt-label">Etiqueta legible <span className="mnt-optional">(opcional)</span></label>
              <input
                name="etiqueta" value={form.etiqueta} onChange={handleChange}
                className="mnt-input"
                placeholder="Ej: Tiempo Completo (si el valor es código)"
              />
            </div>

            {/* Descripción */}
            <div className="mnt-field">
              <label className="mnt-label">Descripción <span className="mnt-optional">(opcional)</span></label>
              <textarea
                name="descripcion" value={form.descripcion} onChange={handleChange}
                className="mnt-textarea" rows={2}
                placeholder="Notas adicionales…"
              />
            </div>

            {/* Orden */}
            <div className="mnt-field mnt-field--sm">
              <label className="mnt-label">Orden de aparición</label>
              <input
                name="orden" type="number" min={0} value={form.orden} onChange={handleChange}
                className="mnt-input"
              />
            </div>
          </div>

          {/* Footer modal */}
          <div className="mnt-modal-footer">
            <button type="button" className="mnt-btn mnt-btn--ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="mnt-btn mnt-btn--primary" disabled={loading}>
              {loading ? <Loader2 size={15} className="spin"/> : <Save size={15}/>}
              {isEdit ? "Actualizar" : "Guardar"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// ── Modal Confirmar eliminación ──────────────────────────────
const ModalConfirm = ({ item, onClose, onConfirm, loading }) => (
  <motion.div className="mnt-overlay" onClick={onClose}
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <motion.div className="mnt-modal mnt-modal--sm" onClick={e => e.stopPropagation()}
      initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
      <div className="mnt-modal-header mnt-modal-header--danger">
        <h3><Trash2 size={18}/> Eliminar registro</h3>
        <button className="mnt-modal-close" onClick={onClose}><X size={17}/></button>
      </div>
      <div className="mnt-modal-body">
        <p style={{ margin: 0 }}>
          ¿Seguro que deseas eliminar <strong>"{item.etiqueta || item.valor}"</strong>?<br/>
          <small style={{ color: "#6B7280" }}>Esta acción no se puede deshacer.</small>
        </p>
      </div>
      <div className="mnt-modal-footer">
        <button className="mnt-btn mnt-btn--ghost" onClick={onClose}>Cancelar</button>
        <button className="mnt-btn mnt-btn--danger" onClick={onConfirm} disabled={loading}>
          {loading ? <Loader2 size={15} className="spin"/> : <Trash2 size={15}/>}
          Eliminar
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// ════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════
const MantenimientosCatalogos = () => {
  const [moduloActivo, setModuloActivo]   = useState(MODULOS[0]);
  const [tipoActivo,   setTipoActivo]     = useState(MODULOS[0].tipos[0]);
  const [items,        setItems]          = useState([]);
  const [loading,      setLoading]        = useState(false);
  const [busqueda,     setBusqueda]       = useState("");
  const [modalForm,    setModalForm]      = useState(null); // null | { item? }
  const [modalDel,     setModalDel]       = useState(null); // null | item
  const [delLoading,   setDelLoading]     = useState(false);
  const [toasts,       setToasts]         = useState([]);

  // ── Toast helper ─────────────────────────────────────────
  const toast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  // ── Carga datos ──────────────────────────────────────────
  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/${moduloActivo.key}/${tipoActivo.key}`);
      const data = await res.json();
      if (data.ok) setItems(data.data);
    } catch {
      toast("Error al cargar los datos", "error");
    } finally {
      setLoading(false);
    }
  }, [moduloActivo.key, tipoActivo.key, toast]);

  useEffect(() => { cargar(); }, [cargar]);

  // ── Cambiar módulo ───────────────────────────────────────
  const handleModulo = (mod) => {
    setModuloActivo(mod);
    setTipoActivo(mod.tipos[0]);
    setBusqueda("");
  };

  // ── Guardar (crear/editar) ───────────────────────────────
  const handleSave = (saved, action) => {
    if (action === "create") {
      setItems(p => [...p, saved]);
      toast("Registro creado correctamente ✓");
    } else {
      setItems(p => p.map(i => i._id === saved._id ? saved : i));
      toast("Registro actualizado correctamente ✓");
    }
    setModalForm(null);
  };

  // ── Toggle activo ────────────────────────────────────────
  const handleToggle = async (item) => {
    try {
      const res  = await fetch(`${API}/${item._id}/toggle`, { method: "PATCH" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.mensaje);
      setItems(p => p.map(i => i._id === item._id ? data.data : i));
      toast(`${data.data.activo ? "Activado" : "Desactivado"} correctamente`);
    } catch (e) {
      toast(e.message, "error");
    }
  };

  // ── Eliminar ─────────────────────────────────────────────
  const handleDelete = async () => {
    setDelLoading(true);
    try {
      const res  = await fetch(`${API}/${modalDel._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.mensaje);
      setItems(p => p.filter(i => i._id !== modalDel._id));
      toast("Registro eliminado correctamente");
      setModalDel(null);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setDelLoading(false);
    }
  };

  // ── Filtrar ───────────────────────────────────────────────
  const filtrados = items.filter(i =>
    i.valor.toLowerCase().includes(busqueda.toLowerCase()) ||
    (i.etiqueta || "").toLowerCase().includes(busqueda.toLowerCase()) ||
    (i.descripcion || "").toLowerCase().includes(busqueda.toLowerCase())
  );

  const activos   = items.filter(i => i.activo).length;
  const inactivos = items.length - activos;

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="mnt-app">

      {/* ── HEADER (idéntico al de Bienes) ── */}
      <motion.div
        className="mm-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
      >
        <div className="mm-hi">
          <div className="mm-ht">
            <motion.div
              className="mm-htitle"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <motion.span
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              >
                <Settings size={34} color="white" fill="rgba(255,255,255,0.3)" />
              </motion.span>
              Mantenimiento de Catálogos
            </motion.div>
          </div>

          <motion.p
            className="mm-sub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Administra los valores de catálogos usados en Matrícula, Personal, Donaciones, Bienes, Directiva y Horarios
          </motion.p>

          {/* Stats */}
          <motion.div
            className="mm-stats"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            {[
              { ico: <Tag size={18} color="white"/>,         val: items.length,  lbl: "Total" },
              { ico: <CheckCircle size={18} color="white"/>, val: activos,        lbl: "Activos" },
              { ico: <AlertCircle size={18} color="white"/>, val: inactivos,      lbl: "Inactivos" },
              { ico: moduloActivo.icon,                      val: MODULOS.length, lbl: "Módulos" },
            ].map((s, i) => (
              <motion.div key={i} className="mm-stat"
                whileHover={{ scale: 1.04, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}>
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

      {/* ── CONTENIDO PRINCIPAL ── */}
      <div className="mnt-content">

        {/* ── SIDEBAR DE MÓDULOS ── */}
        <motion.aside
          className="mnt-sidebar"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mnt-sidebar-title">Módulos</div>

          {MODULOS.map(mod => (
            <div key={mod.key} className="mnt-sidebar-group">
              <button
                className={`mnt-sidebar-mod ${moduloActivo.key === mod.key ? "active" : ""}`}
                style={{ "--mod-color": mod.color }}
                onClick={() => handleModulo(mod)}
              >
                <span className="mnt-sidebar-mod-ico">{mod.icon}</span>
                <span className="mnt-sidebar-mod-label">{mod.label}</span>
                <ChevronRight size={14} className="mnt-sidebar-arrow" />
              </button>

              {/* Sub-tipos del módulo activo */}
              <AnimatePresence>
                {moduloActivo.key === mod.key && (
                  <motion.div
                    className="mnt-sidebar-tipos"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    {mod.tipos.map(t => (
                      <button
                        key={t.key}
                        className={`mnt-sidebar-tipo ${tipoActivo.key === t.key ? "active" : ""}`}
                        style={{ "--mod-color": mod.color }}
                        onClick={() => { setTipoActivo(t); setBusqueda(""); }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.aside>

        {/* ── PANEL DERECHO ── */}
        <motion.section
          className="mnt-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          {/* Toolbar */}
          <div className="mnt-toolbar">
            <div className="mnt-toolbar-left">
              <div className="mnt-panel-badge" style={{ background: `${moduloActivo.color}18`, color: moduloActivo.color, border: `1.5px solid ${moduloActivo.color}30` }}>
                {moduloActivo.icon}
                <strong>{moduloActivo.label}</strong>
                <span className="mnt-sep">›</span>
                {tipoActivo.label}
              </div>
              <span className="mnt-count">{filtrados.length} registro{filtrados.length !== 1 ? "s" : ""}</span>
            </div>

            <div className="mnt-toolbar-right">
              {/* Búsqueda */}
              <div className="mnt-search-wrap">
                <Search size={15} className="mnt-search-ico" />
                <input
                  className="mnt-search"
                  placeholder="Buscar…"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                />
                {busqueda && (
                  <button className="mnt-search-clear" onClick={() => setBusqueda("")}>
                    <X size={13}/>
                  </button>
                )}
              </div>

              {/* Refrescar */}
              <button className="mnt-btn mnt-btn--ghost mnt-btn--icon" onClick={cargar} title="Recargar">
                <RefreshCw size={15} className={loading ? "spin" : ""} />
              </button>

              {/* Nuevo */}
              <WithPermission requiredPermissions={"CREAR_MANTENIMIENTOS"}>
              <button
                className="mnt-btn mnt-btn--primary"
                onClick={() => setModalForm({})}
              >
                <Plus size={15} /> Nuevo
              </button>
              </WithPermission>
            </div>
          </div>

          {/* Tabla */}
          <div className="mnt-table-wrap">
            {loading ? (
              <div className="mnt-loading">
                <Loader2 size={30} className="spin" />
                <span>Cargando…</span>
              </div>
            ) : filtrados.length === 0 ? (
              <div className="mnt-empty">
                <Tag size={40} style={{ opacity: 0.3 }} />
                <p>{busqueda ? "Sin resultados para la búsqueda" : "No hay registros aún. ¡Agrega el primero!"}</p>
                {!busqueda && (
                  <button className="mnt-btn mnt-btn--primary" onClick={() => setModalForm({})}>
                    <Plus size={15} /> Agregar
                  </button>
                )}
              </div>
            ) : (
              <table className="mnt-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Valor</th>
                    <th>Etiqueta</th>
                    <th>Descripción</th>
                    <th>Orden</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtrados.map((item, idx) => (
                      <motion.tr
                        key={item._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ delay: idx * 0.03 }}
                        className={!item.activo ? "mnt-row--inactive" : ""}
                      >
                        <td className="mnt-td-num">{idx + 1}</td>
                        <td>
                          <span className="mnt-valor-pill" style={{ background: `${moduloActivo.color}15`, color: moduloActivo.color }}>
                            {item.valor}
                          </span>
                        </td>
                        <td className="mnt-td-etiqueta">{item.etiqueta || <span className="mnt-na">—</span>}</td>
                        <td className="mnt-td-desc">{item.descripcion || <span className="mnt-na">—</span>}</td>
                        <td className="mnt-td-orden">{item.orden}</td>
                        <td>
                          <button
                            className={`mnt-toggle ${item.activo ? "mnt-toggle--on" : "mnt-toggle--off"}`}
                            onClick={() => handleToggle(item)}
                            title={item.activo ? "Desactivar" : "Activar"}
                          >
                            {item.activo
                              ? <><ToggleRight size={16}/> Activo</>
                              : <><ToggleLeft  size={16}/> Inactivo</>
                            }
                          </button>
                        </td>
                        <td>
                          <div className="mnt-actions">
                             <WithPermission requiredPermissions={"ACTUALIZAR_MANTENIMIENTOS"}>
                            <button
                              className="mnt-action-btn mnt-action-btn--edit"
                              onClick={() => setModalForm({ item })}
                              title="Editar"
                            >
                              <Edit2 size={14}/>
                            </button>
                            </WithPermission>
                            <WithPermission requiredPermissions={"ELIMINAR_MANTENIMIENTOS"}>
                            <button
                              className="mnt-action-btn mnt-action-btn--del"
                              onClick={() => setModalDel(item)}
                              title="Eliminar"
                            >
                              <Trash2 size={14}/>
                            </button>
                            </WithPermission>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>
        </motion.section>
      </div>

      {/* ── MODALES ── */}
      <AnimatePresence>
        {modalForm !== null && (
          <ModalForm
            key="form"
            item={modalForm.item || null}
            modulo={moduloActivo.key}
            tipo={tipoActivo.key}
            tipoLabel={tipoActivo.label}
            onClose={() => setModalForm(null)}
            onSave={handleSave}
          />
        )}
        {modalDel && (
          <ModalConfirm
            key="del"
            item={modalDel}
            onClose={() => setModalDel(null)}
            onConfirm={handleDelete}
            loading={delLoading}
          />
        )}
      </AnimatePresence>

      {/* ── TOASTS ── */}
      <Toast toasts={toasts} />
    </div>
  );
};

export default MantenimientosCatalogos;