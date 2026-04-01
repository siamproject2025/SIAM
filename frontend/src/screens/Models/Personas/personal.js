// ============================================================
// Personal.jsx — Gestión de Personal
// Diseño alineado a Sistema de Bienes
// Incluye: código autogenerado, docs en Drive, tabla estilizada
// ============================================================
import React, { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import {
  Users, Search, Plus, Download, HelpCircle,
  CheckCircle, XCircle, Edit, Trash2, Eye,
  Filter, UserPlus, Upload, X, FileText, AlertCircle
} from "lucide-react";
import { auth } from "../../../components/authentication/Auth";
import { loadingController } from "../../../api/loadingController";
import Notification from "../../../components/Notification";
import ModalCrearPersonal from "./Modalcrearpersonal";
import ModalDetallePersonal from "./Modaldetallepersonal";
import "../../../styles/Personal.css";

const API_URL = process.env.REACT_APP_API_URL + "/api/personal";

const COLS = [
  { uid: "codigo",           name: "CÓDIGO",       sortable: true  },
  { uid: "nombre",           name: "EMPLEADO",      sortable: true  },
  { uid: "cargo",            name: "CARGO",         sortable: true  },
  { uid: "area_trabajo",     name: "ÁREA",          sortable: true  },
  { uid: "tipo_contrato",    name: "CONTRATO",      sortable: false },
  { uid: "fecha_ingreso",    name: "F. INGRESO",    sortable: true  },
  { uid: "estado",           name: "ESTADO",        sortable: true  },
  { uid: "acciones",         name: "ACCIONES",      sortable: false },
];

const ESTADO_OPTS = [
  { uid: "all",       name: "Todos"      },
  { uid: "ACTIVO",    name: "Activo"     },
  { uid: "VACACIONES",name: "Vacaciones" },
  { uid: "LICENCIA",  name: "Licencia"   },
  { uid: "INACTIVO",  name: "Inactivo"   },
];

const CARGO_OPTS = [
  { uid: "all",           name: "Todos los cargos" },
  { uid: "DOCENTE",       name: "Docente"          },
  { uid: "DIRECTOR",      name: "Director"         },
  { uid: "LIMPIEZA",      name: "Limpieza"         },
  { uid: "GUARDIA",       name: "Guardia"          },
  { uid: "SERVICIO_SOCIAL", name: "Servicio Social"},
];

const ROWS = 15;

const fmtFechaLocal = (iso) => {
  if (!iso || iso === "null") return "—";
  const part = (typeof iso === "string" ? iso : new Date(iso).toISOString()).slice(0, 10);
  const [y, m, d] = part.split("-");
  return `${d}/${m}/${y}`;
};

const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

// ── Estado badge class ─────────────────────────────────────
const estadoBadge = (e) => ({
  ACTIVO:     "per-estado-badge per-activo",
  VACACIONES: "per-estado-badge per-vacaciones",
  LICENCIA:   "per-estado-badge per-licencia",
  INACTIVO:   "per-estado-badge per-inactivo",
}[e] || "per-estado-badge");

// ══════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════
const Personal = () => {
  const [personal,          setPersonal]          = useState([]);
  const [filterValue,       setFilterValue]       = useState("");
  const [estadoFiltro,      setEstadoFiltro]      = useState("all");
  const [cargoFiltro,       setCargoFiltro]       = useState("all");
  const [especialFiltro,    setEspecialFiltro]    = useState("");
  const [sortDesc,          setSortDesc]          = useState({ column: "codigo", direction: "ascending" });
  const [page,              setPage]              = useState(1);
  const [seleccionados,     setSeleccionados]     = useState([]);
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [empleadoSelec,     setEmpleadoSelec]     = useState(null);
  const [notification,      setNotification]      = useState(null);
  const [showCargoMenu,     setShowCargoMenu]     = useState(false);
  const [mostrarAyuda,      setMostrarAyuda]      = useState(false);
  const [fechaDesde,        setFechaDesde]        = useState("");
  const [fechaHasta,        setFechaHasta]        = useState("");

  const cargoMenuRef = useRef(null);

  // ── Carga inicial ──────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      try {
        loadingController.start();
        const token = await auth.currentUser?.getIdToken();
        const res   = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error("Error al obtener personal");
        setPersonal(await res.json());
      } catch (err) { console.error(err); }
      finally { loadingController.stop(); }
    };
    cargar();
  }, []);

  useEffect(() => {
    const fn = (e) => {
      if (cargoMenuRef.current && !cargoMenuRef.current.contains(e.target)) setShowCargoMenu(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // ── Métricas + filtrado ────────────────────────────────
  const { filteredItems, metrics } = useMemo(() => {
    let f = [...personal];
    if (filterValue) {
      const q = filterValue.toLowerCase();
      f = f.filter(p =>
        p.codigo?.toLowerCase().includes(q)       ||
        p.nombres?.toLowerCase().includes(q)      ||
        p.apellidos?.toLowerCase().includes(q)    ||
        p.area_trabajo?.toLowerCase().includes(q) ||
        p.direccion_correo?.toLowerCase().includes(q)
      );
    }
    if (estadoFiltro !== "all") f = f.filter(p => p.estado === estadoFiltro);
    if (cargoFiltro  !== "all") f = f.filter(p => p.cargo_asignacion?.cargo === cargoFiltro);
    if (especialFiltro) {
      const q = especialFiltro.toLowerCase();
      f = f.filter(p => p.especialidades?.some(e => e.nombre?.toLowerCase().includes(q)));
    }
    if (fechaDesde) f = f.filter(p => { const s = (p.fecha_ingreso || "").slice(0,10); return s >= fechaDesde; });
    if (fechaHasta) f = f.filter(p => { const s = (p.fecha_ingreso || "").slice(0,10); return s <= fechaHasta; });
    return {
      filteredItems: f,
      metrics: {
        total:      personal.length,
        activos:    personal.filter(p => p.estado === "ACTIVO").length,
        inactivos:  personal.filter(p => p.estado === "INACTIVO").length,
        docentes:   personal.filter(p => p.cargo_asignacion?.cargo === "DOCENTE").length,
      }
    };
  }, [personal, filterValue, estadoFiltro, cargoFiltro, especialFiltro, fechaDesde, fechaHasta]);

  // ── Ordenamiento + paginación ──────────────────────────
  const sortedItems = useMemo(() => {
    if (!sortDesc.column) return filteredItems;
    return [...filteredItems].sort((a, b) => {
      const va = sortDesc.column === "nombre" ? `${a.apellidos} ${a.nombres}` : a[sortDesc.column];
      const vb = sortDesc.column === "nombre" ? `${b.apellidos} ${b.nombres}` : b[sortDesc.column];
      const c  = (va ?? "") < (vb ?? "") ? -1 : (va ?? "") > (vb ?? "") ? 1 : 0;
      return sortDesc.direction === "descending" ? -c : c;
    });
  }, [filteredItems, sortDesc]);

  const pages        = Math.ceil(sortedItems.length / ROWS) || 1;
  const currentItems = useMemo(() => sortedItems.slice((page-1)*ROWS, page*ROWS), [page, sortedItems]);

  const handleSort = (uid) => {
    const col = COLS.find(c => c.uid === uid);
    if (!col?.sortable) return;
    setSortDesc(p => ({ column: uid, direction: p.column === uid && p.direction === "ascending" ? "descending" : "ascending" }));
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // ── CRUD ───────────────────────────────────────────────
  const handleCrear = async (fd) => {
    try {
      loadingController.start();
      const token = await auth.currentUser?.getIdToken();
      const res   = await fetch(API_URL, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      const { data } = await res.json();
      setPersonal(p => [data, ...p]);
      setMostrarModalCrear(false);
      showNotification(`Empleado "${data.nombres} ${data.apellidos}" creado. Código: ${data.codigo}`, "success");
    } catch (err) { showNotification(err.message || "Error al crear el empleado", "error"); }
    finally { loadingController.stop(); }
  };

  const handleActualizar = async (id, fd) => {
    try {
      loadingController.start();
      const token = await auth.currentUser?.getIdToken();
      const res   = await fetch(`${API_URL}/${id}`, { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      const { data } = await res.json();
      setPersonal(p => p.map(e => e._id === data._id ? data : e));
      setEmpleadoSelec(null);
      showNotification(`Empleado actualizado correctamente`, "success");
    } catch (err) { showNotification(err.message || "Error al actualizar", "error"); }
    finally { loadingController.stop(); }
  };

  const handleEliminar = async (id) => {
    const emp = personal.find(p => p._id === id);
    try {
      loadingController.start();
      const token = await auth.currentUser?.getIdToken();
      const res   = await fetch(`${API_URL}/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      setPersonal(p => p.filter(e => e._id !== id));
      setEmpleadoSelec(null);
      showNotification(`Empleado "${emp?.nombres} ${emp?.apellidos}" eliminado`, "success");
    } catch (err) { showNotification(err.message || "Error al eliminar", "error"); }
    finally { loadingController.stop(); }
  };

  // ── Excel ──────────────────────────────────────────────
  const handleExcel = () => {
    if (filteredItems.length === 0) { showNotification("No hay datos para exportar.", "error"); return; }
    const data = filteredItems.map((p, i) => ({
      "N°": i+1,
      "Código":         p.codigo,
      "Nombres":        p.nombres,
      "Apellidos":      p.apellidos,
      "Identidad":      p.numero_identidad,
      "Cargo":          p.cargo_asignacion?.cargo || "—",
      "Área":           p.area_trabajo || "—",
      "Contrato":       p.tipo_contrato,
      "Estado":         p.estado,
      "Teléfono":       p.telefono,
      "Correo":         p.direccion_correo,
      "Salario (Lps)":  p.salario || 0,
      "F. Ingreso":     fmtFechaLocal(p.fecha_ingreso),
      "Especialidades": (p.especialidades || []).map(e => e.nombre).join(", "),
    }));
    const ws = XLSX.utils.json_to_sheet(data, { origin: "A6" });
    const wb = XLSX.utils.book_new();
    XLSX.utils.sheet_add_aoa(ws, [
      ["ESCUELA EXPERIMENTAL DE NIÑOS PARA LA MÚSICA"],
      ["SISTEMA INTEGRADO ADMINISTRATIVO MUSICAL - S.I.A.M."],
      [""], ["LISTA DE PERSONAL"], [""],
    ], { origin: "A1" });
    ws["!cols"] = [{ wch:4 },{ wch:14 },{ wch:18 },{ wch:18 },{ wch:14 },{ wch:16 },{ wch:16 },{ wch:14 },{ wch:12 },{ wch:14 },{ wch:28 },{ wch:14 },{ wch:12 },{ wch:30 }];
    XLSX.utils.book_append_sheet(wb, ws, "Personal");
    const fecha = new Date().toLocaleDateString("es-HN").replace(/\//g,"-");
    XLSX.writeFile(wb, `Lista_Personal_${fecha}.xlsx`);
  };

  const pageNums = () => {
    const nums = [];
    for (let i = Math.max(1, page-2); i <= Math.min(pages, page+2); i++) nums.push(i);
    return nums;
  };

  const hayFiltros = estadoFiltro !== "all" || cargoFiltro !== "all" || especialFiltro || fechaDesde || fechaHasta;

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="per-app">

      {/* ── HEADER ── */}
      <motion.div
        className="per-header"
        initial={{ opacity:0, y:-20 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.5, type:"spring", stiffness:120 }}
      >
        <div className="per-hi">
          <div className="per-ht">
            <motion.div className="per-htitle" initial={{ opacity:0, x:-30 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.15 }}>
              <motion.span initial={{ rotate:-180, scale:0 }} animate={{ rotate:0, scale:1 }} transition={{ type:"spring", stiffness:200, delay:0.2 }}>
                <Users size={34} color="white" fill="white" />
              </motion.span>
              Sistema de Personal
            </motion.div>
          </div>
          <motion.p className="per-sub" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}>
            Gestión completa del expediente de empleados de la institución
          </motion.p>
          <motion.div className="per-stats" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}>
            {[
              { ico: <Users size={18} color="white"/>,       val: filteredItems.length, lbl: filteredItems.length === personal.length ? "Total Personal" : "Filtrados" },
              { ico: <CheckCircle size={18} color="white"/>, val: metrics.activos,      lbl: "Activos"   },
              { ico: <XCircle size={18} color="white"/>,     val: metrics.inactivos,    lbl: "Inactivos" },
              { ico: <UserPlus size={18} color="white"/>,    val: metrics.docentes,     lbl: "Docentes"  },
            ].map((s, i) => (
              <motion.div key={i} className="per-stat" whileHover={{ scale:1.04, y:-2 }} transition={{ type:"spring", stiffness:300 }}>
                <div className="per-stat-ico">{s.ico}</div>
                <div>
                  <div className="per-stat-val">{s.val}</div>
                  <div className="per-stat-lbl">{s.lbl}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* ── BARRA DE ACCIONES ── */}
      <div className="per-action-area">
        <div className="per-action-bar">
          <div className="per-search-wrapper">
            <span className="per-search-icon"><Search size={16}/></span>
            <input
              type="text"
              className="per-search-input"
              placeholder="Buscar por código, nombre, área, correo..."
              value={filterValue}
              onChange={e => { setFilterValue(e.target.value); setPage(1); }}
            />
            {filterValue && <button className="per-search-clear" onClick={() => setFilterValue("")}>×</button>}
          </div>
          <div className="per-bar-buttons">
            {seleccionados.length > 0 && (
              <button className="per-btn per-btn-danger" >
                <Trash2 size={15}/> Eliminar ({seleccionados.length})
              </button>
            )}
            <button className="per-btn per-btn-help"  onClick={() => setMostrarAyuda(true)}><HelpCircle size={15}/> Ayuda</button>
            <button className="per-btn per-btn-excel" onClick={handleExcel}><Download size={15}/> Excel</button>
            <button className="per-btn per-btn-primary" onClick={() => setMostrarModalCrear(true)}><Plus size={15}/> Agregar empleado</button>
          </div>
        </div>

        {/* Filtros */}
        <div className="per-filters-bar">
          {/* Estado pills */}
          <div className="per-filter-group">
            <span className="per-filter-label"><Filter size={13}/> Estado:</span>
            <div className="per-filter-pills">
              {ESTADO_OPTS.map(op => (
                <button key={op.uid} className={`per-pill${estadoFiltro === op.uid ? " active" : ""}`}
                  onClick={() => { setEstadoFiltro(op.uid); setPage(1); }}>
                  {op.name}
                </button>
              ))}
            </div>
          </div>

          {/* Cargo dropdown */}
          <div className="per-filter-group">
            <span className="per-filter-label">Cargo:</span>
            <div className="per-dropdown-wrapper" ref={cargoMenuRef}>
              <button className={`per-filter-select${cargoFiltro !== "all" ? " has-value" : ""}`}
                onClick={() => setShowCargoMenu(!showCargoMenu)}>
                {CARGO_OPTS.find(c => c.uid === cargoFiltro)?.name || "Todos los cargos"}<ChevronDown/>
              </button>
              {showCargoMenu && (
                <div className="per-dropdown-menu">
                  {CARGO_OPTS.map(op => (
                    <div key={op.uid} className={`per-dropdown-item${cargoFiltro === op.uid ? " active" : ""}`}
                      onClick={() => { setCargoFiltro(op.uid); setShowCargoMenu(false); setPage(1); }}>
                      {cargoFiltro === op.uid && <span className="chk">✓</span>} {op.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Especialidad — fix #7 */}
          <div className="per-filter-group">
            <span className="per-filter-label">Especialidad:</span>
            <div className="per-search-wrapper" style={{ minWidth:180, maxWidth:220 }}>
              <span className="per-search-icon"><Search size={13}/></span>
              <input type="text" className="per-search-input" placeholder="Filtrar especialidad..."
                value={especialFiltro}
                onChange={e => { setEspecialFiltro(e.target.value); setPage(1); }}
                style={{ paddingLeft:"2rem", paddingRight: especialFiltro ? "2rem" : "0.75rem" }}
              />
              {especialFiltro && <button className="per-search-clear" onClick={() => setEspecialFiltro("")}>×</button>}
            </div>
          </div>

          {/* Rango fechas */}
          <div className="per-filter-group">
            <span className="per-filter-label">Ingreso:</span>
            <div className="per-date-range">
              <input type="date" className="per-date-input" value={fechaDesde} onChange={e => { setFechaDesde(e.target.value); setPage(1); }} title="Desde"/>
              <span className="per-date-sep">→</span>
              <input type="date" className="per-date-input" value={fechaHasta} onChange={e => { setFechaHasta(e.target.value); setPage(1); }} title="Hasta"/>
              {(fechaDesde || fechaHasta) && <button className="per-date-clear" onClick={() => { setFechaDesde(""); setFechaHasta(""); }}>×</button>}
            </div>
          </div>

          {hayFiltros && (
            <button className="per-clear-filters" onClick={() => { setEstadoFiltro("all"); setCargoFiltro("all"); setEspecialFiltro(""); setFechaDesde(""); setFechaHasta(""); setPage(1); }}>
              ✕ Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── TABLA ── */}
      <div className="per-container">
        <div className="per-table-wrapper">
          <div className="per-results-info">
            <span>
              Mostrando <strong>{Math.min((page-1)*ROWS+1, sortedItems.length)}</strong>–<strong>{Math.min(page*ROWS, sortedItems.length)}</strong> de <strong>{sortedItems.length}</strong> empleados
              {filterValue && <span className="per-filtrado-tag"> · filtrado de {personal.length}</span>}
            </span>
            {seleccionados.length > 0 && <span className="per-seleccionados-info">{seleccionados.length} seleccionado(s)</span>}
          </div>

          <div className="per-table-scroll">
            <table className="per-table">
              <thead>
                <tr>
                  <th style={{ width:44 }}>
                    <input type="checkbox" className="per-checkbox"
                      checked={currentItems.length > 0 && currentItems.every(p => seleccionados.includes(p._id))}
                      onChange={e => {
                        if (e.target.checked) setSeleccionados(prev => [...new Set([...prev, ...currentItems.map(p => p._id)])]);
                        else setSeleccionados(prev => prev.filter(id => !currentItems.map(p => p._id).includes(id)));
                      }}
                    />
                  </th>
                  {COLS.map(col => (
                    <th key={col.uid} className={col.sortable ? "sortable" : ""} onClick={() => handleSort(col.uid)}>
                      {col.name}
                      {col.sortable && sortDesc.column === col.uid && (
                        <span className="per-sort-arrow">{sortDesc.direction === "ascending" ? " ↑" : " ↓"}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={COLS.length + 1}>
                      <div className="per-empty-state">
                        <Users size={40} color="#ccc"/>
                        <p>No se encontraron empleados con los filtros actuales</p>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.map(emp => (
                  <tr key={emp._id} className={seleccionados.includes(emp._id) ? "row-selected" : ""}>
                    <td>
                      <input type="checkbox" className="per-checkbox"
                        checked={seleccionados.includes(emp._id)}
                        onChange={e => {
                          if (e.target.checked) setSeleccionados(p => [...p, emp._id]);
                          else setSeleccionados(p => p.filter(id => id !== emp._id));
                        }}
                      />
                    </td>

                    {/* Código chip */}
                    <td className="per-td-codigo">
                      <span className="per-codigo-chip">{emp.codigo}</span>
                    </td>

                    {/* Empleado */}
                    <td>
                      <div className="per-nombre-cell">
                        {emp.imagen ? (
                          <img src={`data:${emp.tipo_imagen};base64,${emp.imagen}`} alt="" className="per-avatar"/>
                        ) : (
                          <div className="per-avatar-placeholder">
                            {(emp.nombres?.[0] || "")}{(emp.apellidos?.[0] || "")}
                          </div>
                        )}
                        <div>
                          <div className="per-nombre">{emp.apellidos}, {emp.nombres}</div>
                          <div className="per-correo">{emp.direccion_correo}</div>
                        </div>
                      </div>
                    </td>

                    {/* Cargo */}
                    <td>
                      <span className="per-cargo-badge">{emp.cargo_asignacion?.cargo?.replace(/_/g," ") || "—"}</span>
                    </td>

                    {/* Área */}
                    <td className="per-td-area">{emp.area_trabajo || <span className="per-sin">—</span>}</td>

                    {/* Contrato */}
                    <td><span className="per-contrato-chip">{emp.tipo_contrato?.replace(/_/g," ") || "—"}</span></td>

                    {/* Fecha ingreso */}
                    <td className="per-td-fecha">{fmtFechaLocal(emp.fecha_ingreso)}</td>

                    {/* Estado */}
                    <td><span className={estadoBadge(emp.estado)}>{emp.estado}</span></td>

                    {/* Acciones */}
                    <td>
                      <div className="per-action-buttons">
                        <button className="per-btn-icon edit" title="Editar" onClick={() => setEmpleadoSelec(emp)}>
                          <Edit size={15}/>
                        </button>
                        <button className="per-btn-icon delete" title="Eliminar" onClick={() => {
                          if (window.confirm(`¿Eliminar a "${emp.nombres} ${emp.apellidos}"?`)) handleEliminar(emp._id);
                        }}>
                          <Trash2 size={15}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="per-pagination">
            <div className="per-pagination-info">Página <strong>{page}</strong> de <strong>{pages}</strong></div>
            <div className="per-pagination-controls">
              <button className="per-page-btn" onClick={() => setPage(1)} disabled={page===1}>«</button>
              <button className="per-page-btn" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}>‹</button>
              {pageNums().map(n => (
                <button key={n} className={`per-page-btn${page===n?" active":""}`} onClick={() => setPage(n)}>{n}</button>
              ))}
              <button className="per-page-btn" onClick={() => setPage(p => Math.min(pages,p+1))} disabled={page===pages}>›</button>
              <button className="per-page-btn" onClick={() => setPage(pages)} disabled={page===pages}>»</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modales ── */}
      {mostrarModalCrear && (
        <ModalCrearPersonal onClose={() => setMostrarModalCrear(false)} onCreate={handleCrear}/>
      )}
      {empleadoSelec && (
        <ModalDetallePersonal
          empleado={empleadoSelec}
          onClose={() => setEmpleadoSelec(null)}
          onUpdate={handleActualizar}
          onDelete={handleEliminar}
        />
      )}

      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)}/>
      )}

      {/* ── Modal Ayuda ── */}
      {mostrarAyuda && (
        <div className="per-modal-overlay">
          <div className="per-modal sm">
            <div className="per-modal-header">
              <h3 className="per-modal-title"><Users size={20}/> Ayuda – Gestión de Personal</h3>
              <button className="per-modal-close" onClick={() => setMostrarAyuda(false)}>✕</button>
            </div>
            <div className="per-modal-body">
              <div className="per-help-section">
                <div className="per-help-title">Funcionalidades principales</div>
                <ul className="per-help-list">
                  <li><strong>Código autogenerado:</strong> Formato EMP-YYYY-XXXX, sin ingreso manual</li>
                  <li><strong>Documentos en Drive:</strong> DPI, pasaporte, antecedentes, títulos, etc.</li>
                  <li><strong>Especialidades:</strong> Registra múltiples especialidades con nivel</li>
                  <li><strong>Filtro por especialidad:</strong> Búsqueda específica en el campo de especialidad</li>
                  <li><strong>Ciclo laboral:</strong> Fecha de ingreso, salida y motivo de egreso</li>
                  <li><strong>Auditoría:</strong> Registro de quién creó/actualizó cada empleado</li>
                </ul>
              </div>
              <div className="per-help-section">
                <div className="per-help-title">Estados del empleado</div>
                <div className="per-estados-grid">
                  {[
                    { lbl: "ACTIVO – Actualmente laborando",         cls: "per-activo"     },
                    { lbl: "VACACIONES – En período vacacional",     cls: "per-vacaciones" },
                    { lbl: "LICENCIA – Con licencia aprobada",       cls: "per-licencia"   },
                    { lbl: "INACTIVO – Ya no labora",                cls: "per-inactivo"   },
                  ].map((s, i) => (
                    <div key={i} className="per-estado-item">
                      <span className={`per-estado-badge ${s.cls}`}>{s.lbl.split("–")[0].trim()}</span>
                      {s.lbl}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="per-modal-footer">
              <button className="per-btn per-btn-primary" onClick={() => setMostrarAyuda(false)}>Cerrar Ayuda</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Personal;