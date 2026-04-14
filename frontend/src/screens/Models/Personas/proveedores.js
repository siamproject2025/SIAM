// ============================================================
// Proveedores.js — Módulo de Gestión de Proveedores
// Diseño idéntico al de Bienes.js:
//   • Header mm-* con framer-motion
//   • Action bar con search, filtros pill, botones S.btn
//   • Tabla bienes-table con paginación
//   • Modal detalle → ModalDetalleProveedor (pestañas dn-*)
// ============================================================
import React, { useEffect, useState, useMemo, useRef } from "react";
import ModalDetalleProveedor from "./ModalDetalleProveedor";
import Notification from "../../../components/Notification";
import * as XLSX from "xlsx";
import "../../../styles/Models/Bienes.css"; // Reutiliza los mismos estilos
import { auth } from "../../../components/authentication/Auth";
import { loadingController } from "../../../api/loadingController";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, HelpCircle, Plus, Download, Filter,
  Truck, CheckCircle, XCircle, Clock, Building2,
  Users, Package, Trash2, Edit
} from "lucide-react";
import ConfirmDialog from "../../../components/ConfirmDialog/ConfirmDialog";
import WithPermission from "../../../components/Permisos/WithPermission";

const API_URL = process.env.REACT_APP_API_URL + "/api/proveedores";

const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

// ── Estilos inline reutilizados de Bienes ──────────────────
const S = {
  btn: (bg, col = "#fff") => ({
    display: "inline-flex", alignItems: "center", gap: 7,
    padding: "10px 20px", borderRadius: 10, fontSize: ".86rem",
    fontWeight: 700, border: "none", cursor: "pointer",
    background: bg, color: col, fontFamily: "inherit", transition: "all .18s",
  }),
};

const columns = [
  { name: "ID",          uid: "id_proveedor",  sortable: true  },
  { name: "NOMBRE",      uid: "nombre",        sortable: true  },
  { name: "EMPRESA",     uid: "empresa",       sortable: true  },
  { name: "CONTACTO",    uid: "email",         sortable: false },
  { name: "UBICACIÓN",   uid: "ciudad",        sortable: true  },
  { name: "TIPO",        uid: "tipo_proveedor",sortable: true  },
  { name: "ESTADO",      uid: "estado",        sortable: true  },
  { name: "CONDICIONES", uid: "condiciones_pago", sortable: false },
  { name: "ENTREGA",     uid: "tiempo_entrega_promedio", sortable: false },
  { name: "ACCIONES",   uid: "acciones",      sortable: false },
];

const estadosOptions = [
  { name: "Todos",      uid: "all"        },
  { name: "Activo",     uid: "ACTIVO"     },
  { name: "Inactivo",   uid: "INACTIVO"   },
  { name: "Suspendido", uid: "SUSPENDIDO" },
];

const tiposOptions = [
  { name: "Todos",     uid: "all"       },
  { name: "Productos", uid: "PRODUCTOS" },
  { name: "Servicios", uid: "SERVICIOS" },
  { name: "Mixto",     uid: "MIXTO"     },
];

const ROWS = 15;

const Proveedores = () => {
  const [proveedores,             setProveedores]             = useState([]);
  const [proveedorSeleccionado,   setProveedorSeleccionado]   = useState(null);
  const [filterValue,             setFilterValue]             = useState("");
  const [estadoFiltro,            setEstadoFiltro]            = useState("all");
  const [tipoFiltro,              setTipoFiltro]              = useState("all");
  const [sortDesc,                setSortDesc]                = useState({ column: "id_proveedor", direction: "ascending" });
  const [page,                    setPage]                    = useState(1);
  const [mostrarModalCrear,       setMostrarModalCrear]       = useState(false);
  const [notification,            setNotification]            = useState(null);
  const [showTipoMenu,            setShowTipoMenu]            = useState(false);
  const [mostrarAyuda,            setMostrarAyuda]            = useState(false);
  const [proveedoresSeleccionados, setProveedoresSeleccionados] = useState([]);
  const [showConfirmBulk,         setShowConfirmBulk]         = useState(false);

  const tipoMenuRef = useRef(null);

  // ── Carga inicial ─────────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      try {
        loadingController.start();
        const token = await auth.currentUser?.getIdToken(true);
        const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error("Error al obtener proveedores");
        setProveedores(await res.json());
      } catch (err) { console.error(err); }
      finally { loadingController.stop(); }
    };
    cargar();
  }, []);

  // Cierre de dropdowns al click fuera
  useEffect(() => {
    const fn = (e) => {
      if (tipoMenuRef.current && !tipoMenuRef.current.contains(e.target)) setShowTipoMenu(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // ── Métricas + filtrado ───────────────────────────────────
  const { filteredItems, metrics } = useMemo(() => {
    let f = [...proveedores];
    if (filterValue) {
      const q = filterValue.toLowerCase();
      f = f.filter((p) =>
        p.nombre?.toLowerCase().includes(q)  ||
        p.empresa?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q)   ||
        p.telefono?.toString().includes(q)   ||
        p.ciudad?.toLowerCase().includes(q)  ||
        p.pais?.toLowerCase().includes(q)    ||
        p.contacto?.toLowerCase().includes(q)||
        p.rtn?.toString().includes(q)
      );
    }
    if (estadoFiltro !== "all") f = f.filter((p) => p.estado === estadoFiltro);
    if (tipoFiltro   !== "all") f = f.filter((p) => p.tipo_proveedor === tipoFiltro);

    return {
      filteredItems: f,
      metrics: {
        activos:    proveedores.filter((p) => p.estado === "ACTIVO").length,
        inactivos:  proveedores.filter((p) => p.estado === "INACTIVO").length,
        suspendidos:proveedores.filter((p) => p.estado === "SUSPENDIDO").length,
        total:      proveedores.length,
      },
    };
  }, [proveedores, filterValue, estadoFiltro, tipoFiltro]);

  // ── Ordenamiento + paginación ─────────────────────────────
  const sortedItems = useMemo(() => {
    if (!sortDesc.column) return filteredItems;
    return [...filteredItems].sort((a, b) => {
      let x = a[sortDesc.column];
      let y = b[sortDesc.column];
      if (typeof x === "number" && typeof y === "number") {
        return sortDesc.direction === "descending" ? y - x : x - y;
      }
      const c = String(x || "").localeCompare(String(y || ""));
      return sortDesc.direction === "descending" ? -c : c;
    });
  }, [filteredItems, sortDesc]);

  const pages = Math.ceil(sortedItems.length / ROWS) || 1;
  const currentItems = useMemo(() => {
    const s = (page - 1) * ROWS;
    return sortedItems.slice(s, s + ROWS);
  }, [page, sortedItems]);

  const handleSort = (uid) => {
    const col = columns.find((c) => c.uid === uid);
    if (!col?.sortable) return;
    setSortDesc((p) => ({
      column: uid,
      direction: p.column === uid && p.direction === "ascending" ? "descending" : "ascending",
    }));
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // ── CRUD ──────────────────────────────────────────────────
  const handleCrearProveedor = async (nuevo) => {
    try {
      loadingController.start();
      const token = await auth.currentUser?.getIdToken(true);
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(nuevo),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      const guardado = await res.json();
      setProveedores((p) => [...p, guardado]);
      setMostrarModalCrear(false);
      showNotification(`Proveedor "${guardado.nombre}" creado exitosamente`, "success");
    } catch (err) { showNotification(err.message || "Error al crear el proveedor", "error"); }
    finally { loadingController.stop(); }
  };

  const handleEditarProveedor = async (id, actualizado) => {
    try {
      loadingController.start();
      const token = await auth.currentUser?.getIdToken(true);
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(actualizado),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      const actualiz = await res.json();
      setProveedores((p) => p.map((prov) => (prov._id === actualiz._id ? actualiz : prov)));
      setProveedorSeleccionado(null);
      showNotification(`Proveedor "${actualiz.nombre}" actualizado exitosamente`, "success");
    } catch (err) { showNotification(err.message || "Error al editar el proveedor", "error"); }
    finally { loadingController.stop(); }
  };

  const handleEliminarProveedor = async (id) => {
    const nombre = proveedores.find((p) => p._id === id)?.nombre;
    try {
      loadingController.start();
      const token = await auth.currentUser?.getIdToken(true);
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      setProveedores((p) => p.filter((prov) => prov._id !== id));
      setProveedorSeleccionado(null);
      showNotification(`Proveedor "${nombre}" eliminado exitosamente`, "success");
    } catch (err) { showNotification(err.message || "Error al eliminar el proveedor", "error"); }
    finally { loadingController.stop(); }
  };

  // ── Excel ─────────────────────────────────────────────────
  const handleExportarExcel = () => {
    if (filteredItems.length === 0) { showNotification("No hay proveedores para exportar.", "error"); return; }
    const data = filteredItems.map((p, i) => ({
      "N°": i + 1,
      ID: p.id_proveedor,
      Nombre: p.nombre,
      Empresa: p.empresa || "—",
      Email: p.email,
      Teléfono: p.telefono,
      Contacto: p.contacto || "—",
      Ciudad: p.ciudad || "—",
      País: p.pais || "—",
      RTN: p.rtn || "—",
      Tipo: p.tipo_proveedor,
      Estado: p.estado,
      "Condiciones Pago": p.condiciones_pago || "—",
      "Entrega (días)": p.tiempo_entrega_promedio || "—",
      "Sitio Web": p.sitio_web || "—",
    }));
    const ws = XLSX.utils.json_to_sheet(data, { origin: "A6" });
    const wb = XLSX.utils.book_new();
    XLSX.utils.sheet_add_aoa(ws, [
      ["ESCUELA EXPERIMENTAL DE NIÑOS PARA LA MÚSICA"],
      ["SISTEMA INTEGRADO ADMINISTRATIVO MUSICAL - S.I.A.M."],
      [""], ["LISTA DE PROVEEDORES"], [""],
    ], { origin: "A1" });
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 14 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 14 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 14 } },
    ];
    const fecha = new Date().toLocaleDateString("es-HN");
    XLSX.utils.book_append_sheet(wb, ws, "Proveedores");
    XLSX.writeFile(wb, `Lista_de_Proveedores_${fecha.replace(/\//g, "-")}.xlsx`);
  };

  // ── Helpers UI ────────────────────────────────────────────
  const estadoBadgeClass = (e) => ({
    ACTIVO:     "estado-badge estado-activo",
    INACTIVO:   "estado-badge estado-inactivo",
    SUSPENDIDO: "estado-badge estado-mantenimiento",
  }[e] || "estado-badge");

  const getTipoLabel = (tipo) => ({
    PRODUCTOS: "Productos",
    SERVICIOS: "Servicios",
    MIXTO:     "Mixto",
  }[tipo] || tipo);

  const getCondicionBadge = (cond) => {
    if (!cond) return { label: "N/A", cls: "" };
    const n = parseInt(cond);
    if (isNaN(n)) return { label: cond, cls: "" };
    if (n <= 15) return { label: `${n}d`, cls: "bienes-categoria-badge" };
    if (n <= 30) return { label: `${n}d`, cls: "estado-badge estado-mantenimiento" };
    return { label: `${n}d`, cls: "estado-badge estado-inactivo" };
  };

  const pageNums = () => {
    const nums = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) nums.push(i);
    return nums;
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="bienes-app">

      {/* ── HEADER ── */}
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
                <Truck size={34} color="white" fill="white" />
              </motion.span>
              Sistema de Proveedores
            </motion.div>
          </div>

          <motion.p
            className="mm-sub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Gestiona y controla todos tus proveedores de manera eficiente
          </motion.p>

          <motion.div
            className="mm-stats"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            {[
              { ico: <Truck size={18} color="white" />,        val: filteredItems.length, lbl: filteredItems.length === proveedores.length ? "Total Proveedores" : "Proveedores filtrados" },
              { ico: <CheckCircle size={18} color="white" />,  val: filteredItems.filter(p => p.estado === "ACTIVO").length,    lbl: "Activos"     },
              { ico: <XCircle size={18} color="white" />,      val: filteredItems.filter(p => p.estado === "INACTIVO").length,  lbl: "Inactivos"   },
              { ico: <Clock size={18} color="white" />,        val: filteredItems.filter(p => p.estado === "SUSPENDIDO").length,lbl: "Suspendidos" },
            ].map((s, i) => (
              <motion.div
                key={i}
                className="mm-stat"
                whileHover={{ scale: 1.04, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
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

      {/* ── BARRA DE ACCIONES ── */}
      <div className="bienes-action-area">

        {/* Fila 1: búsqueda + botones */}
        <div className="bienes-action-bar">
          <div className="bienes-search-wrapper">
            <span className="bienes-search-icon"><Search size={16} /></span>
            <input
              type="text"
              className="bienes-search-input"
              placeholder="Buscar por nombre, empresa, email, teléfono, ciudad, RTN..."
              value={filterValue}
              onChange={(e) => { setFilterValue(e.target.value); setPage(1); }}
            />
            {filterValue && (
              <button className="bienes-search-clear" onClick={() => setFilterValue("")}>×</button>
            )}
          </div>

          <div className="bienes-bar-buttons">
            {proveedoresSeleccionados.length > 0 && (
              <button
                type="button"
                style={S.btn("#E74C3C")}
                onClick={() => setShowConfirmBulk(true)}
              >
                <Trash2 size={15} /> Eliminar ({proveedoresSeleccionados.length})
              </button>
            )}
            <button style={S.btn("#E0D9F5", "#6C4FBF")} onClick={() => setMostrarAyuda(true)}>
              <HelpCircle size={15} /> Ayuda
            </button>
            <button style={S.btn("#27AE60")} onClick={handleExportarExcel}>
              <Download size={15} /> Excel
            </button>
             <WithPermission requiredPermissions={["CREAR_PROVEEDORES"]}>
            <button style={S.btn("#6C4FBF")} onClick={() => setMostrarModalCrear(true)}>
              <Plus size={15} /> Nuevo Proveedor
            </button>
            </WithPermission>
          </div>
        </div>

        {/* Fila 2: filtros */}
        <div className="bienes-filters-bar">

          {/* Filtro Estado — pills */}
          <div className="bienes-filter-group">
            <span className="bienes-filter-label"><Filter size={13} /> Estado:</span>
            <div className="bienes-filter-pills">
              {estadosOptions.map((op) => (
                <button
                  key={op.uid}
                  className={`bienes-pill${estadoFiltro === op.uid ? " active" : ""}`}
                  onClick={() => { setEstadoFiltro(op.uid); setPage(1); }}
                >
                  {op.name}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro Tipo — dropdown */}
          <div className="bienes-filter-group">
            <span className="bienes-filter-label">Tipo:</span>
            <div className="bienes-dropdown-wrapper" ref={tipoMenuRef}>
              <button
                className={`bienes-filter-select${tipoFiltro !== "all" ? " has-value" : ""}`}
                onClick={() => setShowTipoMenu(!showTipoMenu)}
              >
                {tipoFiltro === "all" ? "Todos los tipos" : getTipoLabel(tipoFiltro)}
                <ChevronDown />
              </button>
              {showTipoMenu && (
                <div className="bienes-dropdown-menu">
                  {tiposOptions.map((t) => (
                    <div
                      key={t.uid}
                      className={`bienes-dropdown-item${tipoFiltro === t.uid ? " active" : ""}`}
                      onClick={() => { setTipoFiltro(t.uid); setShowTipoMenu(false); setPage(1); }}
                    >
                      {tipoFiltro === t.uid && <span className="chk">✓</span>} {t.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Limpiar filtros */}
          {(estadoFiltro !== "all" || tipoFiltro !== "all") && (
            <button
              className="bienes-clear-filters"
              onClick={() => { setEstadoFiltro("all"); setTipoFiltro("all"); setPage(1); }}
            >
              ✕ Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── TABLA ── */}
      <div className="bienes-container">
        <div className="bienes-table-wrapper">

          <div className="bienes-results-info">
            <span>
              Mostrando <strong>{Math.min((page - 1) * ROWS + 1, sortedItems.length)}</strong>–<strong>{Math.min(page * ROWS, sortedItems.length)}</strong> de <strong>{sortedItems.length}</strong> proveedores
              {filterValue && <span className="filtrado-tag"> · filtrado de {proveedores.length}</span>}
            </span>
            {proveedoresSeleccionados.length > 0 && (
              <span className="seleccionados-info">{proveedoresSeleccionados.length} seleccionado(s)</span>
            )}
          </div>

          <div className="bienes-table-scroll">
            <table className="bienes-table">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>
                    <input
                      type="checkbox"
                      className="bienes-checkbox"
                      checked={currentItems.length > 0 && currentItems.every(p => proveedoresSeleccionados.includes(p._id))}
                      onChange={(e) => {
                        if (e.target.checked) setProveedoresSeleccionados(prev => [...new Set([...prev, ...currentItems.map(p => p._id)])]);
                        else setProveedoresSeleccionados(prev => prev.filter(id => !currentItems.map(p => p._id).includes(id)));
                      }}
                    />
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col.uid}
                      className={col.sortable ? "sortable" : ""}
                      onClick={() => handleSort(col.uid)}
                    >
                      {col.name}
                      {col.sortable && sortDesc.column === col.uid && (
                        <span className="sort-arrow">{sortDesc.direction === "ascending" ? " ↑" : " ↓"}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="bienes-no-results">
                      <div className="bienes-empty-state">
                        <Truck size={40} color="#ccc" />
                        <p>No se encontraron proveedores con los filtros actuales</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((prov) => {
                    const condBadge = getCondicionBadge(prov.condiciones_pago);
                    return (
                      <tr
                        key={prov._id}
                        className={proveedoresSeleccionados.includes(prov._id) ? "row-selected" : ""}
                      >
                        {/* Checkbox */}
                        <td>
                          <input
                            type="checkbox"
                            className="bienes-checkbox"
                            checked={proveedoresSeleccionados.includes(prov._id)}
                            onChange={(e) => {
                              if (e.target.checked) setProveedoresSeleccionados(p => [...p, prov._id]);
                              else setProveedoresSeleccionados(p => p.filter(id => id !== prov._id));
                            }}
                          />
                        </td>

                        {/* ID */}
                        <td className="bienes-td-codigo">
                          <span className="codigo-chip">#{prov.id_proveedor}</span>
                        </td>

                        {/* Nombre */}
                        <td>
                          <div className="bienes-nombre-cell">
                            <div className="nombre">{prov.nombre}</div>
                            {prov.contacto && (
                              <div className="descripcion-preview">{prov.contacto}</div>
                            )}
                          </div>
                        </td>

                        {/* Empresa */}
                        <td>
                          <span className="bienes-categoria-badge">{prov.empresa || "—"}</span>
                        </td>

                        {/* Contacto: email + teléfono */}
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.8rem", color: "#555" }}>
                            <span title={prov.email} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{prov.email}</span>
                            <span style={{ color: "#888" }}>{prov.telefono}</span>
                          </div>
                        </td>

                        {/* Ubicación */}
                        <td style={{ fontSize: "0.85rem", color: "#555" }}>
                          {prov.ciudad || "—"}
                          {prov.pais && prov.ciudad ? `, ${prov.pais}` : prov.pais || ""}
                        </td>

                        {/* Tipo */}
                        <td>
                          <span className="bienes-categoria-badge">{getTipoLabel(prov.tipo_proveedor)}</span>
                        </td>

                        {/* Estado */}
                        <td>
                          <span className={estadoBadgeClass(prov.estado)}>{prov.estado}</span>
                        </td>

                        {/* Condiciones pago */}
                        <td style={{ textAlign: "center" }}>
                          <span className={condBadge.cls || "bienes-sin-asignar"}>
                            {condBadge.label}
                          </span>
                        </td>

                        {/* Tiempo entrega */}
                        <td style={{ textAlign: "center", fontWeight: 600, color: "#555" }}>
                          {prov.tiempo_entrega_promedio ? `${prov.tiempo_entrega_promedio}d` : "—"}
                        </td>

                        {/* Acciones */}
                        <td>
                          <div className="bienes-action-buttons">
                            <WithPermission requiredPermissions={["ACTUALIZAR_PROVEEDORES"]}>
                            <button
                              className="bienes-btn-icon edit"
                              title="Editar"
                              onClick={() => setProveedorSeleccionado(prov)}
                            >
                              <Edit size={15} />
                            </button>
                            </WithPermission>
                            <WithPermission requiredPermissions={["ELIMINAR_PROVEEDORES"]}>
                            <button
                              className="bienes-btn-icon delete"
                              title="Eliminar"
                              onClick={() => {
                                if (window.confirm(`¿Eliminar "${prov.nombre}"?`)) handleEliminarProveedor(prov._id);
                              }}
                            >
                              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14H6L5 6" />
                                <path d="M10 11v6M14 11v6" />
                                <path d="M9 6V4h6v2" />
                              </svg>
                            </button></WithPermission>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
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
              <button className="bienes-page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
              {pageNums().map((n) => (
                <button key={n} className={`bienes-page-btn${page === n ? " active" : ""}`} onClick={() => setPage(n)}>{n}</button>
              ))}
              <button className="bienes-page-btn" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}>›</button>
              <button className="bienes-page-btn" onClick={() => setPage(pages)} disabled={page === pages}>»</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal Crear (inline simple, mismo patrón que Bienes usa ModalCrearBien) ── */}
      {mostrarModalCrear && (
        <ModalDetalleProveedor
          proveedor={null}
          modoCrear={true}
          onClose={() => setMostrarModalCrear(false)}
          onCreate={handleCrearProveedor}
          onUpdate={handleEditarProveedor}
          onDelete={handleEliminarProveedor}
        />
      )}

      {/* ── Modal Detalle/Editar ── */}
      {proveedorSeleccionado && (
        <ModalDetalleProveedor
          proveedor={proveedorSeleccionado}
          modoCrear={false}
          onClose={() => setProveedorSeleccionado(null)}
          onCreate={handleCrearProveedor}
          onUpdate={handleEditarProveedor}
          onDelete={handleEliminarProveedor}
        />
      )}

      {/* ── Notificación ── */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* ── Confirm eliminación masiva ── */}
      {showConfirmBulk && (
        <ConfirmDialog
          message={`¿Seguro que deseas eliminar ${proveedoresSeleccionados.length} proveedor(es) seleccionado(s)?`}
          onConfirm={() => {
            proveedoresSeleccionados.forEach(id => handleEliminarProveedor(id));
            setProveedoresSeleccionados([]);
            setShowConfirmBulk(false);
          }}
          onCancel={() => setShowConfirmBulk(false)}
          visible={showConfirmBulk}
        />
      )}

      {/* ── Modal Ayuda ── */}
      {mostrarAyuda && (
        <div className="bienes-modal-overlay">
          <div className="bienes-modal sm">
            <div className="bienes-modal-header">
              <h3 className="bienes-modal-title"><Truck size={20} /> Ayuda – Sistema de Proveedores</h3>
              <button className="bienes-modal-close" onClick={() => setMostrarAyuda(false)}>✕</button>
            </div>
            <div className="bienes-modal-body">
              <div className="bienes-help-section">
                <div className="bienes-help-title">Funcionalidades principales</div>
                <ul className="bienes-help-list">
                  <li><strong>Campos obligatorios:</strong> Nombre, Empresa, Email, Teléfono, Dirección, Ciudad, País y RTN (14 dígitos)</li>
                  <li><strong>RTN:</strong> Registro Tributario Nacional — exactamente 14 dígitos numéricos</li>
                  <li><strong>Filtros:</strong> Por estado, tipo y búsqueda libre en tiempo real</li>
                  <li><strong>Auditoría:</strong> Registra quién creó y modificó cada proveedor</li>
                  <li><strong>Exportar Excel:</strong> Incluye todos los campos del directorio</li>
                </ul>
              </div>
              <div className="bienes-help-section">
                <div className="bienes-help-title">Estados comerciales</div>
                <div className="bienes-estados-grid">
                  {[
                    { icon: <CheckCircle size={14} color="var(--bienes-success)" />, label: "ACTIVO – Relación comercial activa" },
                    { icon: <XCircle     size={14} color="var(--bienes-danger)"  />, label: "INACTIVO – Sin actividad reciente"  },
                    { icon: <Clock       size={14} color="var(--bienes-warning)" />, label: "SUSPENDIDO – Temporalmente suspendido" },
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

    </div>
  );
};

export default Proveedores;