// ============================================================
// BibliotecaTest.jsx
// FIX #1 ALTO   — Campos APA: autor corporativo, año publicación,
//                 ciudad, editorial, ISBN/ISSN, edición
// FIX #2 ALTO   — Filtros avanzados: grado, clase, autor, editorial
// FIX #3 MEDIO  — Edición de metadatos de libros ya cargados
// ============================================================
import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import axios from "axios";
import useUserRole from "./hooks/useUserRole";
import "../styles/Models/Biblioteca.css";
import { auth } from "../components/authentication/Auth";
import ConfirmDialog from "./ConfirmDialog/ConfirmDialog";
import { loadingController } from "../api/loadingController";
import {
  FiSearch, FiUpload, FiDownload, FiBook, FiX, FiFilter,
  FiUsers, FiAward, FiFileText, FiStar, FiCalendar, FiBookOpen,
  FiTrash2, FiFile, FiArrowUp, FiArrowDown, FiChevronLeft, FiChevronRight,
  FiChevronsLeft, FiChevronsRight, FiAlertCircle, FiCheckCircle, FiInfo,
  FiUser, FiEdit2
} from 'react-icons/fi';
import WithPermission from "./Permisos/WithPermission";

export default function BibliotecaTest() {
  const { userRole, cargando } = useUserRole();

  const [libros, setLibros]             = useState([]);
  const [filterValue, setFilterValue]   = useState("");
  const [tipoFiltro, setTipoFiltro]     = useState("todos");
  // FIX #2: filtros avanzados
  const [filtroGrado, setFiltroGrado]   = useState("");
  const [filtroClase, setFiltroClase]   = useState("");
  const [filtroAutor, setFiltroAutor]   = useState("");
  const [filtroEdit, setFiltroEdit]     = useState("");
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);
  const [sortDescriptor, setSortDescriptor] = useState({ column:"fecha", direction:"descending" });
  const [page, setPage]                 = useState(1);
  const [rowsPerPage, setRowsPerPage]   = useState(10);
  const [mostrarModal, setMostrarModal] = useState(false);
  // FIX #3: modo edición
  const [libroEditando, setLibroEditando] = useState(null);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading]           = useState(false);
  const fileInputRef                    = useRef(null);

  // FIX #1: campos del formulario extendidos con APA
  const formVacio = () => ({
    titulo:'', autor:'', autor_corporativo:'', anio_publicacion:'',
    ciudad:'', editorial:'', edicion:'', isbn:'',
    grado:'', clase:'', observacion:'', archivo:null,
  });
  const [form, setForm] = useState(formVacio());

  const API_URL = process.env.REACT_APP_API_URL + "/api/biblioteca";

  const cargarLibros = async () => {
    setLoading(true);
    try {
      loadingController.start();
      const user  = auth.currentUser;
      if (!user) throw new Error("No autenticado");
      const token = await user.getIdToken();
      const res   = await axios.get(API_URL, { headers:{ Authorization:`Bearer ${token}` } });
      setLibros(res.data);
    } catch (err) {
      showNotification(err.message || "Error al cargar libros", "error");
    } finally { setLoading(false); loadingController.stop(); }
  };

  useEffect(() => { if (!cargando) cargarLibros(); }, [cargando]);

  // Estadísticas
  const totalLibros    = libros.length;
  const librosPDF      = libros.filter(l => l.archivoUrl?.endsWith('.pdf')).length;
  const librosRecientes = libros.filter(l => new Date(l.fechaCreacion) > new Date(Date.now()-30*24*60*60*1000)).length;

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // ── SUBMIT (crear o editar) ──────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo?.trim())  { showNotification("El título es obligatorio", "error"); return; }
    if (!form.autor?.trim())   { showNotification("El autor es obligatorio", "error"); return; }
    if (!form.grado?.trim())   { showNotification("El grado es obligatorio", "error"); return; }
    if (!form.clase?.trim())   { showNotification("La clase es obligatoria", "error"); return; }
    if (!libroEditando && !form.archivo) { showNotification("Selecciona un archivo", "error"); return; }

    const ext = form.archivo?.name.split('.').pop().toLowerCase();
    if (form.archivo && !['pdf','epub'].includes(ext)) { showNotification("Solo PDF o EPUB", "error"); return; }

    try {
      const user  = auth.currentUser;
      if (!user) throw new Error("No autenticado");
      const token = await user.getIdToken();
      const fd    = new FormData();

      // FIX #1: todos los campos APA
      ['titulo','autor','autor_corporativo','anio_publicacion','ciudad','editorial','edicion','isbn','grado','clase','observacion'].forEach(k => {
        if (form[k]) fd.append(k, form[k]);
      });
      if (form.archivo) fd.append("archivo", form.archivo);

      if (libroEditando) {
        // FIX #3: editar metadatos
        await axios.put(`${API_URL}/${libroEditando._id}`, fd, { headers:{ "Content-Type":"multipart/form-data", Authorization:`Bearer ${token}` } });
        showNotification("Libro actualizado exitosamente", "success");
      } else {
        await axios.post(API_URL, fd, { headers:{ "Content-Type":"multipart/form-data", Authorization:`Bearer ${token}` } });
        showNotification("Libro subido exitosamente", "success");
      }

      resetModal(); cargarLibros();
    } catch (err) {
      showNotification(err.message || "Error al guardar", "error");
    }
  };

  const resetModal = () => {
    setForm(formVacio());
    setLibroEditando(null);
    setMostrarModal(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // FIX #3: abrir modal en modo edición
  const abrirEdicion = (libro) => {
    setLibroEditando(libro);
    setForm({
      titulo:            libro.titulo            || '',
      autor:             libro.autor             || '',
      autor_corporativo: libro.autor_corporativo || '',
      anio_publicacion:  libro.anio_publicacion  || '',
      ciudad:            libro.ciudad            || '',
      editorial:         libro.editorial         || '',
      edicion:           libro.edicion           || '',
      isbn:              libro.isbn              || '',
      grado:             libro.grado             || '',
      clase:             libro.clase             || '',
      observacion:       libro.observacion       || '',
      archivo: null,
    });
    setMostrarModal(true);
  };

  // Eliminar
  const [showConfirm, setShowConfirm]       = useState(false);
  const [libroAEliminar, setLibroAEliminar] = useState(null);

  const confirmarEliminacion = async () => {
    setShowConfirm(false);
    if (!libroAEliminar) return;
    try {
      loadingController.start();
      const token = await (await auth.currentUser).getIdToken();
      await axios.delete(`${API_URL}/${libroAEliminar._id}`, { headers:{ Authorization:`Bearer ${token}` } });
      cargarLibros();
      showNotification(`"${libroAEliminar.titulo}" eliminado`, "success");
      setLibroAEliminar(null);
    } catch (err) { showNotification("No se pudo eliminar", "error"); }
    finally { loadingController.stop(); }
  };

  // FIX #2: valores únicos para los filtros desplegables
  const gradosUnicos    = useMemo(() => [...new Set(libros.map(l=>l.grado).filter(Boolean))].sort(), [libros]);
  const clasesUnicas    = useMemo(() => [...new Set(libros.map(l=>l.clase).filter(Boolean))].sort(), [libros]);
  const editorialesUnicas = useMemo(() => [...new Set(libros.map(l=>l.editorial).filter(Boolean))].sort(), [libros]);

  // Filtrado con todos los filtros activos — FIX #2
  const filteredItems = useMemo(() => {
    let r = [...libros];
    if (filterValue) {
      const t = filterValue.toLowerCase();
      r = r.filter(l => l.titulo?.toLowerCase().includes(t) || l.autor?.toLowerCase().includes(t) || l.autor_corporativo?.toLowerCase().includes(t) || l.grado?.toLowerCase().includes(t) || l.clase?.toLowerCase().includes(t) || l.editorial?.toLowerCase().includes(t));
    }
    if (tipoFiltro !== "todos") r = r.filter(l => l.archivoUrl?.split('.').pop().toLowerCase() === tipoFiltro);
    // FIX #2: filtros avanzados
    if (filtroGrado)  r = r.filter(l => l.grado    === filtroGrado);
    if (filtroClase)  r = r.filter(l => l.clase    === filtroClase);
    if (filtroAutor)  r = r.filter(l => l.autor?.toLowerCase().includes(filtroAutor.toLowerCase()) || l.autor_corporativo?.toLowerCase().includes(filtroAutor.toLowerCase()));
    if (filtroEdit)   r = r.filter(l => l.editorial?.toLowerCase().includes(filtroEdit.toLowerCase()));
    return r;
  }, [libros, filterValue, tipoFiltro, filtroGrado, filtroClase, filtroAutor, filtroEdit]);

  const sortedItems = useMemo(() => (
    [...filteredItems].sort((a,b) => {
      let fa = sortDescriptor.column==='fecha' ? new Date(a.fechaCreacion) : a[sortDescriptor.column];
      let fb = sortDescriptor.column==='fecha' ? new Date(b.fechaCreacion) : b[sortDescriptor.column];
      const cmp = fa<fb?-1:fa>fb?1:0;
      return sortDescriptor.direction==='descending'?-cmp:cmp;
    })
  ), [filteredItems, sortDescriptor]);

  const pages = Math.ceil(sortedItems.length / rowsPerPage) || 1;
  const items = useMemo(() => sortedItems.slice((page-1)*rowsPerPage, page*rowsPerPage), [page, sortedItems, rowsPerPage]);

  const handleSort = (col) => setSortDescriptor(p => ({ column:col, direction: p.column===col&&p.direction==='ascending'?'descending':'ascending' }));
  const getSortIcon = (col) => sortDescriptor.column!==col?null:sortDescriptor.direction==='ascending'?<FiArrowUp className="sort-icon"/>:<FiArrowDown className="sort-icon"/>;
  const hayFiltrosActivos = filtroGrado||filtroClase||filtroAutor||filtroEdit;

  // ── Campos de formulario ─────────────────────────────────
  const fInp = { padding:'9px 12px', border:'2px solid #E0D9F5', borderRadius:8, fontFamily:'inherit', fontSize:'.87rem', color:'#2D2250', outline:'none', width:'100%', background:'#FAF9FF' };

  if (cargando) return <div className="biblioteca-loading"><FiBook size={40}/><p>Cargando...</p></div>;

  return (
    <div className="biblioteca-container">
      {/* Encabezado */}
      <motion.div className="biblioteca-header" initial={{opacity:0,y:-30}} animate={{opacity:1,y:0}} transition={{duration:.7,type:"spring",stiffness:100}}>
        <motion.div className="header-gradient" initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}} transition={{delay:.1,duration:.6}}>
          <div className="header-content">
            <motion.h2 initial={{opacity:0,x:-50}} animate={{opacity:1,x:0}} transition={{delay:.2,duration:.5}}>
              <FiBook size={36} className="header-main-icon"/>
              Biblioteca Digital
              <motion.div animate={{rotate:[0,10,-10,0],scale:[1,1.1,1]}} transition={{duration:2,repeat:Infinity,repeatDelay:5}} className="floating-main-icon">
                <FiBookOpen size={32}/>
              </motion.div>
            </motion.h2>
            <motion.p initial={{opacity:0,x:-50}} animate={{opacity:1,x:0}} transition={{delay:.3,duration:.5}} className="header-subtitle">
              Gestiona tu colección de libros con formato de referencia APA
            </motion.p>
            <motion.div className="header-stats" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.4,duration:.5}}>
              {[{ico:<FiBook size={20}/>,val:totalLibros,lbl:'Total Libros'},{ico:<FiFileText size={20}/>,val:librosPDF,lbl:'Libros PDF'},{ico:<FiAward size={20}/>,val:librosRecientes,lbl:'Recientes'}].map((s,i)=>(
                <motion.div key={i} className="stat-item" whileHover={{scale:1.05,y:-2}} transition={{type:"spring",stiffness:300}}>
                  <div className="stat-icon">{s.ico}</div>
                  <div className="stat-text"><div className="stat-value" style={{color:"white"}}>{s.val}</div><div className="stat-label" style={{color:"white"}}>{s.lbl}</div></div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Barra de búsqueda y filtros */}
        <motion.div className="biblioteca-top-content" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.5,duration:.5}}>
          <div className="biblioteca-filters-row">
            <div className="search-container">
              <FiSearch size={18}/>
              <input type="text" placeholder="Buscar por título, autor, editorial, grado, clase..." value={filterValue} onChange={e=>setFilterValue(e.target.value)} className="search-input"/>
              {filterValue&&<button className="search-clear" onClick={()=>setFilterValue('')}><FiX size={14}/></button>}
            </div>
            <div className="filter-tipo-wrapper">
              <FiFilter size={18}/>
              <select value={tipoFiltro} onChange={e=>setTipoFiltro(e.target.value)} className="filter-select">
                <option value="todos">Todos los formatos</option>
                <option value="pdf">PDF</option>
                <option value="epub">EPUB</option>
              </select>
            </div>
            {/* FIX #2: botón filtros avanzados */}
            <button className="filter-select" style={{background:mostrarFiltrosAvanzados||hayFiltrosActivos?'#EDE9FF':'',color:hayFiltrosActivos?'#6C4FBF':'',cursor:'pointer',border:'2px solid #E0D9F5'}} onClick={()=>setMostrarFiltrosAvanzados(p=>!p)}>
              <FiFilter size={14} style={{marginRight:4}}/> Filtros {hayFiltrosActivos&&`(${[filtroGrado,filtroClase,filtroAutor,filtroEdit].filter(Boolean).length})`}
            </button>
            <WithPermission requiredPermissions={["CREAR_BIBLIOTECA"]}>
              <motion.button className="btn-subir-libro" onClick={()=>{setLibroEditando(null);setForm(formVacio());setMostrarModal(true);}} whileHover={{scale:1.08}} whileTap={{scale:.95}} transition={{type:"spring",stiffness:300}}>
                <FiUpload size={18}/> Subir Libro
              </motion.button>
            </WithPermission>
          </div>

          {/* FIX #2: panel de filtros avanzados */}
          <AnimatePresence>
            {mostrarFiltrosAvanzados && (
              <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} style={{overflow:'hidden',marginTop:8}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,padding:'12px 0'}}>
                  {[
                    {label:'Grado', value:filtroGrado, setter:setFiltroGrado, options:gradosUnicos},
                    {label:'Clase', value:filtroClase, setter:setFiltroClase, options:clasesUnicas},
                    {label:'Editorial', value:filtroEdit, setter:setFiltroEdit, options:editorialesUnicas},
                  ].map(({label,value,setter,options})=>(
                    <div key={label}>
                      <label style={{fontSize:'.75rem',fontWeight:700,color:'#7A6FA0',textTransform:'uppercase',display:'block',marginBottom:4}}>{label}</label>
                      <select className="filter-select" style={{width:'100%'}} value={value} onChange={e=>setter(e.target.value)}>
                        <option value="">Todos</option>
                        {options.map(o=><option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                  <div>
                    <label style={{fontSize:'.75rem',fontWeight:700,color:'#7A6FA0',textTransform:'uppercase',display:'block',marginBottom:4}}>Autor</label>
                    <input style={{...fInp,fontSize:'.85rem'}} placeholder="Buscar autor..." value={filtroAutor} onChange={e=>setFiltroAutor(e.target.value)}/>
                  </div>
                  {hayFiltrosActivos&&<button onClick={()=>{setFiltroGrado('');setFiltroClase('');setFiltroAutor('');setFiltroEdit('');}} style={{gridColumn:'1/-1',border:'2px dashed #C4B5E8',background:'none',borderRadius:8,color:'#6C4FBF',fontWeight:700,padding:'6px',cursor:'pointer',fontSize:'.84rem'}}>× Limpiar filtros avanzados</button>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="biblioteca-meta-row">
            <span className="libro-count"><FiBook size={14}/> Total: {sortedItems.length} {sortedItems.length===1?'libro':'libros'}{hayFiltrosActivos?` (filtrados de ${libros.length})`:''}</span>
            <div className="rows-per-page">
              <span>Filas por página:</span>
              <select value={rowsPerPage} onChange={e=>{setRowsPerPage(Number(e.target.value));setPage(1);}} className="rows-select">
                <option value="5">5</option><option value="10">10</option><option value="15">15</option><option value="20">20</option>
              </select>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Tabla */}
      <div className="table-container">
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-state"><FiBook size={40} className="loading-spinner"/><p>Cargando libros...</p></div>
          ) : (
            <table className="biblioteca-table">
              <thead>
                <tr>
                  <th onClick={()=>handleSort("titulo")} className="sortable th-titulo"><div className="th-content">TÍTULO {getSortIcon("titulo")}</div></th>
                  {/* FIX #1: columna autor con autor corporativo */}
                  <th onClick={()=>handleSort("autor")} className="sortable"><div className="th-content">AUTOR {getSortIcon("autor")}</div></th>
                  {/* FIX #1: año de publicación */}
                  <th onClick={()=>handleSort("anio_publicacion")} className="sortable"><div className="th-content">AÑO {getSortIcon("anio_publicacion")}</div></th>
                  {/* FIX #1: editorial */}
                  <th onClick={()=>handleSort("editorial")} className="sortable"><div className="th-content">EDITORIAL {getSortIcon("editorial")}</div></th>
                  <th onClick={()=>handleSort("grado")} className="sortable th-grado"><div className="th-content">GRADO {getSortIcon("grado")}</div></th>
                  <th onClick={()=>handleSort("clase")} className="sortable th-clase"><div className="th-content">CLASE {getSortIcon("clase")}</div></th>
                  <th className="th-formato"><div className="th-content"><FiFileText size={14}/> FORMATO</div></th>
                  <th className="th-acciones"><div className="th-content"><FiUsers size={14}/> ACCIONES</div></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan="8" className="empty-state"><div className="empty-content"><FiBook size={40} className="empty-icon"/><p>No se encontraron libros</p><small>Ajusta los filtros o sube un nuevo libro</small></div></td></tr>
                ) : items.map(libro => (
                  <tr key={libro._id} className="table-row">
                    <td className="cell-titulo">
                      <div className="titulo-wrapper">
                        <span className="file-icon">{libro.archivoUrl ? <FiFileText className="file-icon-pdf"/> : <FiFile/>}</span>
                        <div>
                          <span className="titulo-text">{libro.titulo}</span>
                          {libro.isbn&&<div style={{fontSize:'.72rem',color:'#7A6FA0'}}>ISBN: {libro.isbn}</div>}
                        </div>
                      </div>
                    </td>
                    {/* FIX #1: autor + autor corporativo */}
                    <td><div style={{fontWeight:600,fontSize:'.85rem'}}>{libro.autor}</div>{libro.autor_corporativo&&<div style={{fontSize:'.75rem',color:'#7A6FA0'}}>{libro.autor_corporativo}</div>}</td>
                    <td>{libro.anio_publicacion||<span style={{color:'#aaa',fontSize:'.8rem'}}>—</span>}</td>
                    {/* FIX #1: editorial + ciudad */}
                    <td><div style={{fontSize:'.85rem'}}>{libro.editorial||'—'}</div>{libro.ciudad&&<div style={{fontSize:'.75rem',color:'#7A6FA0'}}>{libro.ciudad}</div>}</td>
                    <td className="cell-grado">{libro.grado}</td>
                    <td className="cell-clase">{libro.clase}</td>
                    <td className="cell-formato">
                      {libro.archivoUrl ? <span className="formato-badge pdf">PDF</span> : <span className="formato-badge sin-archivo"><FiAlertCircle size={10}/> N/A</span>}
                    </td>
                    <td className="cell-acciones">
                      <div className="action-buttons">
                        {libro.archivoUrl&&<motion.a href={libro.archivoUrl} download target="_blank" rel="noopener noreferrer" className="btn-descargar" title="Descargar" whileHover={{scale:1.05}} whileTap={{scale:.95}}><FiDownload size={14}/> Descargar</motion.a>}
                        {/* FIX #3: botón editar metadatos */}
                        <WithPermission requiredPermissions={["CREAR_BIBLIOTECA"]}>
                          <motion.button onClick={()=>abrirEdicion(libro)} className="btn-descargar" title="Editar metadatos" style={{background:'#EDE9FF',color:'#6C4FBF',border:'none'}} whileHover={{scale:1.05}} whileTap={{scale:.95}}><FiEdit2 size={14}/></motion.button>
                        </WithPermission>
                        <WithPermission requiredPermissions={["ELIMINAR_BIBLIOTECA"]}>
                          <motion.button onClick={()=>{setLibroAEliminar(libro);setShowConfirm(true);}} className="btn btn-danger" title="Eliminar" whileHover={{scale:1.1}} whileTap={{scale:.9}} style={{border:'2px solid red',color:'white',padding:'8px',display:'flex',alignItems:'center',gap:'4px'}}><FiTrash2 size={16}/></motion.button>
                        </WithPermission>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {items.length>0&&(
          <div className="pagination-container">
            <div className="pagination-info"><FiInfo size={14}/> Mostrando {(page-1)*rowsPerPage+1} - {Math.min(page*rowsPerPage,sortedItems.length)} de {sortedItems.length}</div>
            <div className="pagination-controls">
              <motion.button onClick={()=>setPage(1)} disabled={page===1} className="pagination-button" whileHover={{scale:1.05}} whileTap={{scale:.95}}><FiChevronsLeft size={14}/></motion.button>
              <motion.button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="pagination-button" whileHover={{scale:1.05}} whileTap={{scale:.95}}><FiChevronLeft size={14}/> Anterior</motion.button>
              <span className="pagination-pages">Página {page} de {pages}</span>
              <motion.button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page===pages} className="pagination-button" whileHover={{scale:1.05}} whileTap={{scale:.95}}>Siguiente <FiChevronRight size={14}/></motion.button>
              <motion.button onClick={()=>setPage(pages)} disabled={page===pages} className="pagination-button" whileHover={{scale:1.05}} whileTap={{scale:.95}}><FiChevronsRight size={14}/></motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Modal subir / editar libro */}
      <AnimatePresence>
        {mostrarModal && (
          <motion.div className="modal-overlay" onClick={resetModal} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <motion.div className="modal-content" onClick={e=>e.stopPropagation()} style={{maxWidth:620,maxHeight:'92vh',overflow:'auto'}} initial={{scale:.8,y:50}} animate={{scale:1,y:0}} exit={{scale:.8,y:50}} transition={{type:"spring",damping:20}}>
              <div className="modal-header">
                <h3>{libroEditando?<><FiEdit2/> Editar Metadatos</>:<><FiUpload/> Subir Nuevo Libro</>}</h3>
                <button onClick={resetModal} className="modal-close"><FiX size={20}/></button>
              </div>
              <form onSubmit={handleSubmit} className="modal-form">
                {/* FIX #1: título de sección APA */}
                <p style={{fontSize:'.78rem',fontWeight:700,color:'#6C4FBF',textTransform:'uppercase',letterSpacing:'.05em',margin:'0 0 10px',paddingBottom:4,borderBottom:'2px solid #EDE9FF'}}>📚 Identificación del recurso</p>
                <div className="form-group">
                  <label><FiBook size={14}/> Título *</label>
                  <input type="text" value={form.titulo} onChange={e=>setForm(p=>({...p,titulo:e.target.value}))} className="form-input" required placeholder="Título completo de la obra"/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div className="form-group">
                    <label><FiUsers size={14}/> Autor(es) *</label>
                    <input type="text" value={form.autor} onChange={e=>setForm(p=>({...p,autor:e.target.value}))} className="form-input" required placeholder="Apellido, N."/>
                  </div>
                  {/* FIX #1: autor corporativo */}
                  <div className="form-group">
                    <label><FiUsers size={14}/> Autor corporativo</label>
                    <input type="text" value={form.autor_corporativo} onChange={e=>setForm(p=>({...p,autor_corporativo:e.target.value}))} className="form-input" placeholder="Ej: UNESCO, OPS"/>
                  </div>
                  {/* FIX #1: año de publicación */}
                  <div className="form-group">
                    <label><FiCalendar size={14}/> Año de publicación</label>
                    <input type="number" min="1800" max={new Date().getFullYear()+1} value={form.anio_publicacion} onChange={e=>setForm(p=>({...p,anio_publicacion:e.target.value}))} className="form-input" placeholder="Ej: 2023"/>
                  </div>
                  {/* FIX #1: edición */}
                  <div className="form-group">
                    <label>Edición</label>
                    <input type="text" value={form.edicion} onChange={e=>setForm(p=>({...p,edicion:e.target.value}))} className="form-input" placeholder="Ej: 3ra edición"/>
                  </div>
                  {/* FIX #1: editorial */}
                  <div className="form-group">
                    <label>Editorial</label>
                    <input type="text" value={form.editorial} onChange={e=>setForm(p=>({...p,editorial:e.target.value}))} className="form-input" placeholder="Nombre de la editorial"/>
                  </div>
                  {/* FIX #1: ciudad */}
                  <div className="form-group">
                    <label>Ciudad de publicación</label>
                    <input type="text" value={form.ciudad} onChange={e=>setForm(p=>({...p,ciudad:e.target.value}))} className="form-input" placeholder="Ej: Bogotá, Colombia"/>
                  </div>
                  {/* FIX #1: ISBN */}
                  <div className="form-group">
                    <label>ISBN / ISSN</label>
                    <input type="text" value={form.isbn} onChange={e=>setForm(p=>({...p,isbn:e.target.value}))} className="form-input" placeholder="978-..."/>
                  </div>
                </div>
                <p style={{fontSize:'.78rem',fontWeight:700,color:'#6C4FBF',textTransform:'uppercase',letterSpacing:'.05em',margin:'14px 0 10px',paddingBottom:4,borderBottom:'2px solid #EDE9FF'}}>📖 Clasificación académica</p>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div className="form-group">
                    <label>Grado *</label>
                    <input type="text" value={form.grado} onChange={e=>setForm(p=>({...p,grado:e.target.value}))} className="form-input" required placeholder="Ej: Primero, Segundo…"/>
                  </div>
                  <div className="form-group">
                    <label>Clase *</label>
                    <input type="text" value={form.clase} onChange={e=>setForm(p=>({...p,clase:e.target.value}))} className="form-input" required placeholder="Ej: Matemática"/>
                  </div>
                </div>
                <div className="form-group">
                  <label><FiInfo size={14}/> Observación</label>
                  <textarea value={form.observacion} onChange={e=>setForm(p=>({...p,observacion:e.target.value}))} className="form-textarea" placeholder="Notas adicionales (resumen, recomendaciones, etc.)"/>
                </div>
                <div className="form-group">
                  <label><FiFileText size={14}/> Archivo (PDF o EPUB){!libroEditando&&' *'}</label>
                  {libroEditando&&<p style={{fontSize:'.78rem',color:'#7A6FA0',marginBottom:6}}>Deja en blanco para conservar el archivo actual.</p>}
                  <div className="file-input-wrapper">
                    <input ref={fileInputRef} type="file" accept=".pdf,.epub" onChange={e=>setForm(p=>({...p,archivo:e.target.files[0]||null}))} className="file-input" required={!libroEditando}/>
                    {form.archivo&&<div className="file-selected"><FiCheckCircle size={14}/> {form.archivo.name}</div>}
                  </div>
                </div>
                <div className="modal-actions">
                  <motion.button type="button" onClick={resetModal} className="btn-cancelar" whileHover={{scale:1.05}} whileTap={{scale:.95}}><FiX size={14}/> Cancelar</motion.button>
                  <motion.button type="submit" className="btn-guardar" whileHover={{scale:1.05}} whileTap={{scale:.95}}>{libroEditando?<><FiCheckCircle size={14}/> Guardar Cambios</>:<><FiUpload size={14}/> Subir Libro</>}</motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification */}
      <AnimatePresence>
        {notification&&(
          <motion.div className={`notification notification-${notification.type}`} initial={{opacity:0,y:-50,x:100}} animate={{opacity:1,y:0,x:0}} exit={{opacity:0,y:-50,x:100}} transition={{type:"spring",damping:20}}>
            <span className="notification-icon">{notification.type==='success'?<FiCheckCircle size={20}/>:notification.type==='error'?<FiAlertCircle size={20}/>:<FiInfo size={20}/>}</span>
            <span className="notification-message">{notification.message}</span>
            <button onClick={()=>setNotification(null)} className="notification-close"><FiX size={14}/></button>
          </motion.div>
        )}
      </AnimatePresence>

      {showConfirm&&<ConfirmDialog message={`¿Seguro que deseas eliminar "${libroAEliminar?.titulo}"?`} onConfirm={confirmarEliminacion} onCancel={()=>setShowConfirm(false)} visible={showConfirm}/>}
    </div>
  );
}