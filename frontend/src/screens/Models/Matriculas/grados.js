// ============================================================
// GradosPage.jsx
// CAMBIOS en el modal de alumnos:
// - Muestra datos relevantes: nombre, documento, grado, estado
//   (NO el _id de MongoDB)
// - Cada alumno es una card clicable que abre un drawer lateral
//   con el expediente completo del alumno
// - Buscador dentro del modal
// - Scroll suave, todos los alumnos visibles
// ============================================================
import { useEffect, useMemo, useState } from "react";
import { auth } from "../../../components/authentication/Auth";
import "../../../styles/grados.css";
import { motion, AnimatePresence } from "framer-motion";
import { Book, X, Trash2, Users, User, Search, Gift, ChevronRight, Phone, Mail, AlertCircle } from "lucide-react";
import ConfirmDialog from '../../../components/ConfirmDialog/ConfirmDialog';
import WithPermission from "../../../components/Permisos/WithPermission";
import Notification from '../../../components/Notification';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
const API      = `${API_BASE}/api/grados`;

const GRADOS_BASE = ["Primero","Segundo","Tercero","Cuarto","Quinto","Sexto","Séptimo","Octavo","Noveno","Décimo"];
const SECCIONES   = ["A","B","C","D","E","F"];

const initialForm = () => ({
  _id:null, grado:"", seccion:"A", descripcion:"",
  anio_academico: new Date().getFullYear(),
  aula:"", estado:"Activo",
  fecha_actualizacion: new Date().toISOString(),
  timestamp: new Date().toISOString(),
});

const gradoCompleto = (g, s) => (!g ? "" : s ? `${g} ${s}` : g);

// ── Iniciales para avatar ─────────────────────────────────────
const iniciales = (n = "") => {
  const p = n.trim().split(" ").filter(Boolean);
  if (!p.length) return "?";
  if (p.length === 1) return p[0][0].toUpperCase();
  return (p[0][0] + p[p.length-1][0]).toUpperCase();
};

// ── CSS inline ────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Poppins:wght@700;800&display=swap');

  /* ── Badge sección ── */
  .gs-badge-seccion { display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;background:#EDE9FF;color:#6C4FBF;font-weight:800;font-size:.85rem; }
  .gs-grado-full { font-weight:700;color:#2D2250; }
  .gs-grado-sub  { font-size:.75rem;color:#7A6FA0;margin-top:1px; }
  .gs-badge-info { display:inline-flex;align-items:center;gap:6px;background:#E8F4FD;color:#0c4a6e;padding:8px 14px;border-radius:8px;font-size:.82rem;border-left:3px solid #2980B9;margin-bottom:14px; }
  .gs-preview { background:#F0ECFF;border:1px solid #C4B5E8;border-radius:8px;padding:10px 14px;font-size:.82rem;color:#6C4FBF;font-weight:700;display:flex;align-items:center;gap:8px; }
  .gs-preview-label { font-size:.72rem;color:#7A6FA0;font-weight:600;text-transform:uppercase;letter-spacing:.04em; }

  /* ── Modal alumnos: overlay ── */
  .ga-overlay {
    position:fixed;inset:0;background:rgba(30,20,60,.55);
    z-index:9999;display:flex;align-items:flex-start;justify-content:flex-end;
    backdrop-filter:blur(4px);
  }

  /* ── Panel lateral de alumnos ── */
  .ga-panel {
    width:420px;max-width:96vw;height:100vh;
    background:#F4F3FB;display:flex;flex-direction:column;
    box-shadow:-8px 0 40px rgba(108,79,191,.18);
  }
  .ga-panel-header {
    background:linear-gradient(135deg,#6C4FBF,#9B59B6);
    padding:20px 22px 16px;flex-shrink:0;
  }
  .ga-panel-header h2 { font-family:'Poppins',sans-serif;font-size:1rem;font-weight:800;color:#fff;margin:0 0 4px; }
  .ga-panel-header p  { font-size:.82rem;color:rgba(255,255,255,.8);margin:0; }
  .ga-panel-close {
    position:absolute;top:16px;right:16px;
    background:rgba(255,255,255,.2);border:none;border-radius:8px;
    color:#fff;cursor:pointer;padding:6px;display:flex;
  }
  .ga-panel-close:hover { background:rgba(255,255,255,.35); }

  /* ── Buscador ── */
  .ga-search {
    padding:14px 16px 10px;flex-shrink:0;
    display:flex;align-items:center;gap:10px;
    background:#fff;border-bottom:1px solid #E0D9F5;
  }
  .ga-search input {
    flex:1;border:2px solid #E0D9F5;border-radius:10px;
    padding:8px 13px;font-family:inherit;font-size:.88rem;color:#2D2250;
    outline:none;background:#FAF9FF;
  }
  .ga-search input:focus { border-color:#6C4FBF; }

  /* ── Lista de alumnos ── */
  .ga-list { flex:1;overflow-y:auto;padding:12px; }
  .ga-list::-webkit-scrollbar { width:4px; }
  .ga-list::-webkit-scrollbar-thumb { background:#C4B5E8;border-radius:4px; }

  /* ── Card alumno ── */
  .ga-card {
    background:#fff;border-radius:12px;border:1px solid #E0D9F5;
    padding:12px 14px;margin-bottom:8px;
    display:flex;align-items:center;gap:12px;
    cursor:pointer;transition:all .18s;
  }
  .ga-card:hover { border-color:#6C4FBF;box-shadow:0 4px 16px rgba(108,79,191,.12);transform:translateX(3px); }
  .ga-avatar {
    width:40px;height:40px;border-radius:50%;flex-shrink:0;
    background:linear-gradient(135deg,#6C4FBF,#9B59B6);
    display:flex;align-items:center;justify-content:center;
    font-weight:800;font-size:.88rem;color:#fff;
  }
  .ga-card-name { font-weight:700;font-size:.9rem;color:#2D2250; }
  .ga-card-doc  { font-size:.76rem;color:#7A6FA0;margin-top:1px; }
  .ga-card-grade {
    margin-left:auto;display:inline-flex;align-items:center;
    padding:3px 9px;border-radius:20px;
    background:#EDE9FF;color:#6C4FBF;font-size:.73rem;font-weight:700;white-space:nowrap;
  }
  .ga-card-chevron { color:#C4B5E8;flex-shrink:0; }

  /* ── Estado badge ── */
  .ga-estado-activo   { background:#D4F5E2;color:#1a7a40; }
  .ga-estado-inactivo { background:#FDE8E8;color:#b02a2a; }

  /* ── Drawer detalle alumno ── */
  .ga-drawer-overlay {
    position:fixed;inset:0;background:rgba(30,20,60,.4);
    z-index:10000;display:flex;align-items:flex-start;justify-content:flex-end;
  }
  .ga-drawer {
    width:380px;max-width:95vw;height:100vh;background:#fff;
    overflow-y:auto;box-shadow:-8px 0 40px rgba(0,0,0,.2);
    display:flex;flex-direction:column;
  }
  .ga-drawer::-webkit-scrollbar { width:4px; }
  .ga-drawer::-webkit-scrollbar-thumb { background:#C4B5E8;border-radius:4px; }
  .ga-drawer-header {
    background:linear-gradient(135deg,#6C4FBF,#9B59B6);
    padding:22px 20px;position:sticky;top:0;z-index:1;flex-shrink:0;
  }
  .ga-drawer-header h3 { font-family:'Poppins',sans-serif;font-size:1rem;font-weight:800;color:#fff;margin:0 0 2px; }
  .ga-drawer-header p  { font-size:.8rem;color:rgba(255,255,255,.8);margin:0; }
  .ga-drawer-body { padding:18px;flex:1; }
  .ga-section-title {
    font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;
    color:#6C4FBF;margin:16px 0 8px;padding-bottom:6px;border-bottom:2px solid #EDE9FF;
  }
  .ga-field-grid { display:grid;grid-template-columns:1fr 1fr;gap:10px; }
  .ga-field-full { grid-column:1/-1; }
  .ga-field { background:#FAF9FF;border-radius:9px;padding:10px 13px;border:1px solid #E0D9F5; }
  .ga-field-label { font-size:.7rem;font-weight:700;color:#7A6FA0;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px; }
  .ga-field-value { font-size:.86rem;font-weight:600;color:#2D2250; }
  .ga-close-drawer {
    display:flex;align-items:center;gap:6px;
    background:#EDE9FF;color:#6C4FBF;border:none;border-radius:10px;
    padding:10px 18px;font-weight:700;font-size:.87rem;cursor:pointer;
    margin:16px 18px;font-family:inherit;
  }
  .ga-close-drawer:hover { background:#6C4FBF;color:#fff; }

  .ga-empty { text-align:center;padding:40px 20px;color:#7A6FA0; }
  .ga-empty p { font-size:.88rem;margin-top:10px; }

  .ga-count-badge {
    display:inline-flex;align-items:center;gap:5px;
    background:rgba(255,255,255,.2);border-radius:20px;
    padding:3px 10px;font-size:.78rem;font-weight:700;color:#fff;
    margin-top:6px;
  }
`;

export default function GradosPage() {
  const [items, setItems]               = useState([]);
  const [gradosUnicos, setGradosUnicos] = useState([]);
  const [page, setPage]                 = useState(1);
  const [pages, setPages]               = useState(1);
  const [total, setTotal]               = useState(0);
  const [q, setQ]                       = useState("");
  const [loading, setLoading]           = useState(false);

  // Modal alumnos
  const [showAlumnosPanel, setShowAlumnosPanel]         = useState(false);
  const [alumnosList, setAlumnosList]                   = useState([]);
  const [gradoNombreSeleccionado, setGradoNombreSeleccionado] = useState("");
  const [busquedaAlumnos, setBusquedaAlumnos]           = useState("");
  const [alumnoDetalle, setAlumnoDetalle]               = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(false);
  const [form, setForm]           = useState(initialForm());
  const [errors, setErrors]       = useState({});

  const [gradoAEliminar, setGradoAEliminar] = useState(null);
  const [showConfirm, setShowConfirm]       = useState(false);

  const [notification, setNotification] = useState(null);
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const params = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page)); p.set("limit","10");
    if (q) p.set("q", q); p.set("sort","grado:asc");
    return p.toString();
  }, [page, q]);

  const fetchWithToken = async (url, options = {}) => {
    const user = auth.currentUser;
    if (!user) throw new Error("No autenticado");
    const token = await user.getIdToken();
    const res = await fetch(url, {
      ...options,
      headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}`, ...(options.headers||{}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Error");
    return data;
  };

  const fetchList = async (p = 1) => {
    try {
      setLoading(true); setPage(p);
      const data = await fetchWithToken(`${API}?${params}`);
      const itemsConAlumnos = await Promise.all(
        (data.items || []).map(async (grado) => {
          try {
            const resMat = await fetchWithToken(`${API_BASE}/api/matriculas?grado_a_matricular=${grado._id}`);
            return { ...grado, totalAlumnos: resMat.count || 0, listaAlumnos: resMat.data || [] };
          } catch {
            return { ...grado, totalAlumnos: 0, listaAlumnos: [] };
          }
        })
      );
      setItems(itemsConAlumnos);
      setTotal(data.total || 0); setPages(data.pages || 1);
      if (gradosUnicos.length === 0 && data.items) {
        setGradosUnicos([...new Set(data.items.map(i => i.grado))].sort());
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchList(page); }, [params]);

  const validate = (c) => {
    const e = {};
    if (!c.grado?.trim())   e.grado   = "El nombre del grado es requerido.";
    if (!c.seccion?.trim()) e.seccion  = "La sección es requerida.";
    if (!c.aula?.trim())    e.aula     = "El aula es requerida.";
    return e;
  };

  const openCreate = () => { setForm(initialForm()); setErrors({}); setEditing(false); setShowModal(true); };

  const openEdit = (item) => {
    let gradoBase = item.grado || "", seccion = item.seccion || "";
    if (!seccion && gradoBase) {
      const p = gradoBase.trim().split(" ");
      if (p.length >= 2 && SECCIONES.includes(p[p.length-1].toUpperCase())) {
        seccion = p[p.length-1].toUpperCase(); gradoBase = p.slice(0,-1).join(" ");
      }
    }
    setForm({ ...item, grado:gradoBase, seccion:seccion||"A", fecha_actualizacion:new Date().toISOString(), timestamp:new Date().toISOString() });
    setErrors({}); setEditing(true); setShowModal(true);
  };

  const verAlumnos = (grado) => {
    setAlumnosList(grado.listaAlumnos || []);
    setGradoNombreSeleccionado(gradoCompleto(grado.grado, grado.seccion));
    setBusquedaAlumnos("");
    setShowAlumnosPanel(true);
  };

  const save = async () => {
    const e = validate(form); setErrors(e);
    if (Object.keys(e).length > 0) return;
    try {
      setLoading(true);
      const method = editing ? "PUT" : "POST";
      const url    = editing ? `${API}/${form._id}` : API;
      await fetchWithToken(url, {
        method,
        body: JSON.stringify({
          ...form,
          grado:          gradoCompleto(form.grado, form.seccion),
          seccion:        form.seccion,
          anio_academico: Number(form.anio_academico),
          timestamp:      new Date().toISOString(),
        }),
      });
      setShowModal(false); fetchList(page);
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  // Alumnos filtrados por búsqueda
  const alumnosFiltrados = useMemo(() => {
    if (!busquedaAlumnos) return alumnosList;
    const t = busquedaAlumnos.toLowerCase();
    return alumnosList.filter(a =>
      a.nombre_completo?.toLowerCase().includes(t) ||
      a.id_documento?.toLowerCase().includes(t)
    );
  }, [alumnosList, busquedaAlumnos]);

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="grados-container">
      <style>{CSS}</style>

      {/* Header */}
      <motion.div className="donacion-header" style={{ marginBottom:'0' }}
        initial={{ opacity:0, y:-30 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:.7, type:"spring", stiffness:100 }}>
        <motion.div className="header-gradient"
          initial={{ opacity:0, scale:.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay:.1, duration:.6 }}>
          <div className="header-content">
            <motion.h2 initial={{ opacity:0, x:-50 }} animate={{ opacity:1, x:0 }} transition={{ delay:.2, duration:.5 }}>
              <motion.div initial={{ rotate:-180, scale:0 }} animate={{ rotate:0, scale:1 }}
                transition={{ type:"spring", stiffness:200, damping:15, delay:.3 }}>
                <Book size={36} fill="white" color="white"/>
              </motion.div>
              Sistema de Grados y Secciones
              <motion.div animate={{ rotate:[0,10,-10,0], scale:[1,1.1,1] }}
                transition={{ duration:2, repeat:Infinity, repeatDelay:5 }} style={{ marginLeft:'auto' }}>
                <Gift size={32} color="white"/>
              </motion.div>
            </motion.h2>
            <motion.p initial={{ opacity:0, x:-50 }} animate={{ opacity:1, x:0 }} transition={{ delay:.3, duration:.5 }}>
              Administra los grados académicos y sus secciones de manera independiente.
            </motion.p>
          </div>
        </motion.div>
      </motion.div>

      {/* Toolbar */}
      <div className="container-fluid mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <WithPermission requiredPermissions={["CREAR_GRADOS"]}>
            <button className="grados-btn-primary" onClick={openCreate}>+ Nuevo Grado</button>
          </WithPermission>
          <div className="grados-filters-card" style={{ minWidth:'400px' }}>
            <div className="grados-filters-body d-flex gap-2">
              <select className="grados-form-select w-100" value={q} onChange={e => setQ(e.target.value)}>
                <option value="">Todos los grados registrados</option>
                {gradosUnicos.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <button className="grados-btn-search" style={{ width:'auto', padding:'10px' }} onClick={() => fetchList(1)}>
                <Search size={18}/>
              </button>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="grados-table-card">
          <table className="grados-table">
            <thead>
              <tr>
                <th>Grado</th>
                <th>Sección</th>
                <th>Año</th>
                <th>Aula</th>
                <th>Matriculados</th>
                <th>Estado</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map(g => {
                let gradoBase = g.grado || "", seccion = g.seccion || "";
                if (!seccion && gradoBase) {
                  const p = gradoBase.trim().split(" ");
                  if (p.length >= 2 && SECCIONES.includes(p[p.length-1].toUpperCase())) {
                    seccion = p[p.length-1].toUpperCase(); gradoBase = p.slice(0,-1).join(" ");
                  }
                }
                return (
                  <tr key={g._id}>
                    <td><div className="gs-grado-full">{gradoBase}</div>{g.descripcion&&<div className="gs-grado-sub">{g.descripcion}</div>}</td>
                    <td>{seccion ? <span className="gs-badge-seccion">{seccion}</span> : <span style={{ color:'#aaa', fontSize:'.8rem' }}>—</span>}</td>
                    <td>{g.anio_academico}</td>
                    <td>{g.aula}</td>
                    <td>
                      <button className="btn btn-sm btn-light border d-flex align-items-center gap-2" onClick={() => verAlumnos(g)}>
                        <Users size={14} className="text-primary"/>
                        {g.totalAlumnos} Alumnos
                      </button>
                    </td>
                    <td>
                      <span className={g.estado==='Activo'?'grados-badge-active':'grados-badge-inactive'}>{g.estado}</span>
                    </td>
                    <td className="text-end">
                      <WithPermission requiredPermissions={["ACTUALIZAR_GRADOS"]}>
                        <button className="grados-btn-edit" onClick={() => openEdit(g)}>Editar</button>
                      </WithPermission>
                      {g.totalAlumnos === 0 && (
                        <WithPermission requiredPermissions={["ELIMINAR_GRADOS"]}>
                          <button className="grados-btn-deactivate" onClick={() => { setGradoAEliminar(g); setShowConfirm(true); }}>
                            <Trash2 size={14}/>
                          </button>
                        </WithPermission>
                      )}
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && !loading && (
                <tr><td colSpan={7} className="text-center py-4 text-muted">No se encontraron grados registrados.</td></tr>
              )}
            </tbody>
          </table>
          <div className="grados-pagination d-flex justify-content-between align-items-center">
            <span className="grados-pagination-info">Total: {total} registros</span>
            <div>
              <button className="grados-pagination-btn" disabled={page<=1} onClick={() => setPage(page-1)}>«</button>
              <button className="grados-pagination-btn grados-pagination-btn-active">{page}</button>
              <button className="grados-pagination-btn" disabled={page>=pages} onClick={() => setPage(page+1)}>»</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Panel lateral de alumnos (slide-in desde la derecha) ── */}
      <AnimatePresence>
        {showAlumnosPanel && (
          <motion.div className="ga-overlay"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => { setShowAlumnosPanel(false); setAlumnoDetalle(null); }}>
            <motion.div className="ga-panel"
              initial={{ x:"100%" }} animate={{ x:0 }} exit={{ x:"100%" }}
              transition={{ type:"spring", damping:28, stiffness:280 }}
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="ga-panel-header" style={{ position:"relative" }}>
                <h2>Alumnos matriculados</h2>
                <p>Grado: <strong>{gradoNombreSeleccionado}</strong></p>
                <div className="ga-count-badge"><Users size={12}/> {alumnosFiltrados.length} de {alumnosList.length}</div>
                <button className="ga-panel-close" onClick={() => { setShowAlumnosPanel(false); setAlumnoDetalle(null); }}>
                  <X size={18}/>
                </button>
              </div>

              {/* Buscador */}
              <div className="ga-search">
                <Search size={15} color="#7A6FA0"/>
                <input placeholder="Buscar por nombre o documento..."
                  value={busquedaAlumnos} onChange={e => setBusquedaAlumnos(e.target.value)}/>
                {busquedaAlumnos && (
                  <button style={{ border:"none", background:"none", cursor:"pointer", color:"#7A6FA0" }}
                    onClick={() => setBusquedaAlumnos("")}>×</button>
                )}
              </div>

              {/* Lista */}
              <div className="ga-list">
                {alumnosFiltrados.length === 0 ? (
                  <div className="ga-empty">
                    <AlertCircle size={36} style={{ opacity:.3 }}/>
                    <p>{busquedaAlumnos ? "No hay alumnos con esa búsqueda." : "No hay alumnos matriculados en este grado."}</p>
                  </div>
                ) : alumnosFiltrados.map((al, idx) => (
                  <motion.div key={al._id || idx} className="ga-card"
                    initial={{ opacity:0, x:12 }} animate={{ opacity:1, x:0 }}
                    transition={{ delay: idx * 0.03, type:"spring", stiffness:300, damping:24 }}
                    onClick={() => setAlumnoDetalle(al)}>
                    <div className="ga-avatar">{iniciales(al.nombre_completo)}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="ga-card-name" style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {al.nombre_completo}
                      </div>
                      <div className="ga-card-doc">Doc: {al.id_documento || "—"}</div>
                    </div>
                    <span className={`ga-card-grade`} style={{ flexShrink:0 }}>
                      {al.edad ? `${al.edad} años` : gradoNombreSeleccionado}
                    </span>
                    <ChevronRight size={14} className="ga-card-chevron"/>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Drawer de detalle del alumno ── */}
      <AnimatePresence>
        {alumnoDetalle && (
          <motion.div className="ga-drawer-overlay"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setAlumnoDetalle(null)}>
            <motion.div className="ga-drawer"
              initial={{ x:"100%" }} animate={{ x:0 }} exit={{ x:"100%" }}
              transition={{ type:"spring", damping:28, stiffness:300 }}
              onClick={e => e.stopPropagation()}>

              <div className="ga-drawer-header">
                <div className="ga-avatar" style={{ width:48, height:48, fontSize:"1.1rem", marginBottom:8 }}>
                  {iniciales(alumnoDetalle.nombre_completo)}
                </div>
                <h3>{alumnoDetalle.nombre_completo}</h3>
                <p>{gradoNombreSeleccionado} · {alumnoDetalle.edad ? `${alumnoDetalle.edad} años` : ""}</p>
              </div>

              <div className="ga-drawer-body">
                {/* Datos personales */}
                <div className="ga-section-title">Datos Personales</div>
                <div className="ga-field-grid">
                  <div className="ga-field">
                    <div className="ga-field-label">Documento</div>
                    <div className="ga-field-value">{alumnoDetalle.id_documento || "—"}</div>
                  </div>
                  <div className="ga-field">
                    <div className="ga-field-label">Edad</div>
                    <div className="ga-field-value">{alumnoDetalle.edad ? `${alumnoDetalle.edad} años` : "—"}</div>
                  </div>
                  <div className="ga-field">
                    <div className="ga-field-label">Género</div>
                    <div className="ga-field-value">{alumnoDetalle.genero || "—"}</div>
                  </div>
                  <div className="ga-field">
                    <div className="ga-field-label">Estado</div>
                    <div className="ga-field-value">
                      <span className={`ga-card-grade ${(alumnoDetalle.estado||'activo')==='activo'?'ga-estado-activo':'ga-estado-inactivo'}`}
                        style={{ fontSize:'.78rem', padding:'3px 9px' }}>
                        {alumnoDetalle.estado || "activo"}
                      </span>
                    </div>
                  </div>
                  <div className="ga-field ga-field-full">
                    <div className="ga-field-label">Dirección</div>
                    <div className="ga-field-value">{alumnoDetalle.residencia_direccion || "—"}</div>
                  </div>
                  {alumnoDetalle.telefono_alumno && (
                    <div className="ga-field">
                      <div className="ga-field-label">Teléfono</div>
                      <div className="ga-field-value">{alumnoDetalle.telefono_alumno}</div>
                    </div>
                  )}
                </div>

                {/* Encargado */}
                {alumnoDetalle.nombre_encargado && (<>
                  <div className="ga-section-title">Encargado</div>
                  <div className="ga-field-grid">
                    <div className="ga-field ga-field-full">
                      <div className="ga-field-label">Nombre</div>
                      <div className="ga-field-value">{alumnoDetalle.nombre_encargado}</div>
                    </div>
                    <div className="ga-field">
                      <div className="ga-field-label">Parentesco</div>
                      <div className="ga-field-value">{alumnoDetalle.parentesco_encargado || "—"}</div>
                    </div>
                    <div className="ga-field">
                      <div className="ga-field-label">Teléfono</div>
                      <div className="ga-field-value">{alumnoDetalle.telefono_encargado || "—"}</div>
                    </div>
                    {alumnoDetalle.email_encargado && (
                      <div className="ga-field ga-field-full">
                        <div className="ga-field-label">Email</div>
                        <div className="ga-field-value">{alumnoDetalle.email_encargado}</div>
                      </div>
                    )}
                  </div>
                </>)}

                {/* Médico */}
                {(alumnoDetalle.alergias || alumnoDetalle.enfermedades) && (<>
                  <div className="ga-section-title">Datos Médicos</div>
                  <div className="ga-field-grid">
                    {alumnoDetalle.alergias && <div className="ga-field"><div className="ga-field-label">Alergias</div><div className="ga-field-value">{alumnoDetalle.alergias}</div></div>}
                    {alumnoDetalle.enfermedades && <div className="ga-field"><div className="ga-field-label">Enfermedades</div><div className="ga-field-value">{alumnoDetalle.enfermedades}</div></div>}
                    <div className="ga-field"><div className="ga-field-label">Vacunas al día</div><div className="ga-field-value">{alumnoDetalle.vacunas_al_dia ? "Sí" : "No"}</div></div>
                  </div>
                </>)}
              </div>

              <button className="ga-close-drawer" onClick={() => setAlumnoDetalle(null)}>
                ← Volver a la lista
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Crear / Editar */}
      <AnimatePresence>
        {showModal && (
          <div className="grados-modal-overlay">
            <motion.div className="grados-modal-content"
              initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }}>
              <div className="grados-modal-header d-flex justify-content-between align-items-center">
                <h2 className="grados-modal-title">{editing?"Editar":"Nuevo"} Grado</h2>
                <button className="grados-modal-close" onClick={() => setShowModal(false)}><X size={20}/></button>
              </div>
              <div className="grados-modal-body">
                <div className="gs-badge-info">
                  ℹ El <strong>Grado</strong> y la <strong>Sección</strong> son campos separados.
                  Se guardarán como "{gradoCompleto(form.grado, form.seccion) || 'Ejemplo: Sexto B'}".
                </div>
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="grados-form-label">Grado <span style={{ color:'#E74C3C' }}>*</span></label>
                    <select className={`grados-modal-input${errors.grado?' is-invalid':''}`}
                      value={form.grado} onChange={e => setForm({...form, grado:e.target.value})}>
                      <option value="">Seleccionar grado...</option>
                      {GRADOS_BASE.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    {errors.grado && <small className="text-danger">{errors.grado}</small>}
                  </div>
                  <div className="col-md-4">
                    <label className="grados-form-label">Sección <span style={{ color:'#E74C3C' }}>*</span></label>
                    <select className={`grados-modal-input${errors.seccion?' is-invalid':''}`}
                      value={form.seccion} onChange={e => setForm({...form, seccion:e.target.value})}>
                      <option value="">Seleccionar...</option>
                      {SECCIONES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.seccion && <small className="text-danger">{errors.seccion}</small>}
                  </div>
                  {(form.grado || form.seccion) && (
                    <div className="col-12">
                      <div className="gs-preview">
                        <span className="gs-preview-label">Se guardará como:</span>
                        <strong style={{ fontSize:'1rem' }}>{gradoCompleto(form.grado, form.seccion)}</strong>
                      </div>
                    </div>
                  )}
                  <div className="col-md-6">
                    <label className="grados-form-label">Año Académico</label>
                    <input type="number" className="grados-modal-input" value={form.anio_academico}
                      onChange={e => setForm({...form, anio_academico:e.target.value})}/>
                  </div>
                  <div className="col-md-6">
                    <label className="grados-form-label">Aula <span style={{ color:'#E74C3C' }}>*</span></label>
                    <input className={`grados-modal-input${errors.aula?' is-invalid':''}`}
                      value={form.aula} onChange={e => setForm({...form, aula:e.target.value})}
                      placeholder="Ej: Aula 101"/>
                    {errors.aula && <small className="text-danger">{errors.aula}</small>}
                  </div>
                  <div className="col-md-12">
                    <label className="grados-form-label">Descripción (opcional)</label>
                    <input className="grados-modal-input" value={form.descripcion}
                      onChange={e => setForm({...form, descripcion:e.target.value})}
                      placeholder="Ej: Grupo de instrumentos de viento"/>
                  </div>
                  <div className="col-md-12">
                    <label className="grados-form-label">Estado</label>
                    <select className="grados-modal-input" value={form.estado}
                      onChange={e => setForm({...form, estado:e.target.value})}>
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="grados-modal-footer d-flex gap-2 justify-content-end">
                <button className="grados-modal-btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="grados-modal-btn-save" onClick={save}>
                  {loading ? "Guardando..." : "Confirmar Registro"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        visible={showConfirm}
        onConfirm={async () => {
          await fetchWithToken(`${API}/${gradoAEliminar._id}`, { method:"DELETE" });
          setShowConfirm(false); fetchList(page);
        }}
        onCancel={() => setShowConfirm(false)}
      />
<AnimatePresence>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </AnimatePresence>
  </div>
  
      
  );
}