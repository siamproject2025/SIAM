import { useEffect, useMemo, useState } from "react";
import { auth } from "../../../components/authentication/Auth";
import "../../../styles/grados.css";
import { motion, AnimatePresence } from "framer-motion";
import { Apple, Book, Calendar, X, Trash2, Users, User, Search } from "lucide-react";
import ConfirmDialog from '../../../components/ConfirmDialog/ConfirmDialog';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
const API = `${API_BASE}/api/grados`;

const initialForm = () => ({
  _id: null,
  grado: "",
  descripcion: "",
  anio_academico: 2026,
  aula: "",
  estado: "Activo",
  fecha_actualizacion: new Date().toISOString(),
  timestamp: new Date().toISOString(),
});

export default function GradosPage() {
  const [items, setItems] = useState([]);
  const [gradosUnicos, setGradosUnicos] = useState([]); 
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [showAlumnosModal, setShowAlumnosModal] = useState(false);
  const [alumnosList, setAlumnosList] = useState([]);
  const [gradoNombreSeleccionado, setGradoNombreSeleccionado] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(initialForm());
  const [errors, setErrors] = useState({});

  const [gradoAEliminar, setGradoAEliminar] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("limit", "10");
    if (q) p.set("q", q);
    p.set("sort", "grado:asc");
    return p.toString();
  }, [page, q]);

  const fetchWithToken = async (url, options = {}) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuario no autenticado");
    const token = await user.getIdToken();
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Error en la petición");
    return data;
  };

  const fetchList = async (p = 1) => {
    try {
      setLoading(true);
      setPage(p);
      const data = await fetchWithToken(`${API}?${params}`);
      
      const itemsConAlumnos = await Promise.all(
        (data.items || []).map(async (grado) => {
          try {
            const resMat = await fetchWithToken(`${API_BASE}/api/matriculas?grado_a_matricular=${grado._id}`);
            return { 
              ...grado, 
              totalAlumnos: resMat.count || 0, 
              listaAlumnos: resMat.data || [] 
            };
          } catch {
            return { ...grado, totalAlumnos: 0, listaAlumnos: [] };
          }
        })
      );

      setItems(itemsConAlumnos);
      setTotal(data.total || 0);
      setPages(data.pages || 1);

      if (gradosUnicos.length === 0 && data.items) {
        const nombres = [...new Set(data.items.map(i => i.grado))].sort();
        setGradosUnicos(nombres);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(page); }, [params]);

  const validate = (current) => {
    const e = {};
    if (!current.grado?.trim()) e.grado = "El nombre del grado es requerido.";
    if (!current.aula?.trim()) e.aula = "El aula es requerida.";
    return e;
  };

  const openCreate = () => {
    setForm(initialForm());
    setErrors({});
    setEditing(false);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setForm({ ...item, fecha_actualizacion: new Date().toISOString(), timestamp: new Date().toISOString() });
    setErrors({});
    setEditing(true);
    setShowModal(true);
  };

  const verAlumnos = (grado) => {
    setAlumnosList(grado.listaAlumnos || []);
    setGradoNombreSeleccionado(grado.grado);
    setShowAlumnosModal(true);
  };

  const save = async () => {
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    try {
      setLoading(true);
      const method = editing ? "PUT" : "POST";
      const url = editing ? `${API}/${form._id}` : API;

      await fetchWithToken(url, {
        method,
        body: JSON.stringify({
          ...form,
          anio_academico: Number(form.anio_academico),
          timestamp: new Date().toISOString() 
        }),
      });

      setShowModal(false);
      fetchList(page);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grados-container">
      {/* HEADER con tu clase CSS específica */}
      <header className="grados-header">
        <div className="container-fluid">
           <div className="row g-3">
              <Calendar size={40} className="me-3" />
              <div>
                <h1 className="grados-title">Gestión de Grados</h1>
                <p className="mb-0 opacity-75">Administra secciones y consulta alumnos matriculados.</p>
              </div>
           </div>
        </div>
      </header>

      <div className="container-fluid mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <button className="grados-btn-primary" onClick={openCreate}>
            + Nuevo Grado
          </button>

          {/* FILTRO POR GRADOS REGISTRADOS */}
          <div className="grados-filters-card" style={{minWidth: '400px'}}>
            <div className="grados-filters-body d-flex gap-2">
              <select className="grados-form-select w-100" value={q} onChange={(e) => setQ(e.target.value)}>
                <option value="">Todos los grados registrados</option>
                {gradosUnicos.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <button className="grados-btn-search" style={{width: 'auto', padding: '0 15px'}} onClick={() => fetchList(1)}>
                <Search size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* TABLA CON TUS ESTILOS */}
        <div className="grados-table-card">
          <table className="grados-table">
            <thead>
              <tr>
                <th>Grado</th>
                <th>Año</th>
                <th>Aula</th>
                <th>Matriculados</th>
                <th>Estado</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((g) => (
                <tr key={g._id}>
                  <td className="fw-bold">{g.grado}</td>
                  <td>{g.anio_academico}</td>
                  <td>{g.aula}</td>
                  <td>
                    <button className="btn btn-sm btn-light border d-flex align-items-center gap-2" onClick={() => verAlumnos(g)}>
                      <Users size={14} className="text-primary" />
                      {g.totalAlumnos} Alumnos
                    </button>
                  </td>
                  <td>
                    <span className={g.estado === 'Activo' ? 'grados-badge-active' : 'grados-badge-inactive'}>
                      {g.estado}
                    </span>
                  </td>
                  <td className="text-end">
                    <button className="grados-btn-edit" onClick={() => openEdit(g)}>Editar</button>
                    {g.totalAlumnos === 0 && (
                       <button className="grados-btn-deactivate" onClick={() => { setGradoAEliminar(g); setShowConfirm(true); }}>
                         <Trash2 size={14} />
                       </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* PAGINACIÓN CON TUS ESTILOS */}
          <div className="grados-pagination d-flex justify-content-between align-items-center">
            <span className="grados-pagination-info">Total: {total} registros</span>
            <div>
              <button className="grados-pagination-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>«</button>
              <button className="grados-pagination-btn grados-pagination-btn-active">{page}</button>
              <button className="grados-pagination-btn" disabled={page >= pages} onClick={() => setPage(page + 1)}>»</button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL LISTA DE ALUMNOS (Usando tus clases de modal) */}
      <AnimatePresence>
        {showAlumnosModal && (
          <div className="grados-modal-overlay">
            <motion.div className="grados-modal-content" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="grados-modal-header d-flex justify-content-between align-items-center">
                <h2 className="grados-modal-title">Alumnos en {gradoNombreSeleccionado}</h2>
                <button className="grados-modal-close" onClick={() => setShowAlumnosModal(false)}><X size={20} /></button>
              </div>
              <div className="grados-modal-body">
                {alumnosList.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {alumnosList.map((al, idx) => (
                      <div key={idx} className="list-group-item d-flex align-items-center gap-3 border-0 border-bottom">
                        <div className="p-2 bg-light rounded-circle"><User size={20} /></div>
                        <div>
                          <p className="mb-0 fw-bold">{al.nombre_completo}</p>
                          <small className="text-muted">ID: {al.numero_identidad || 'N/A'}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-center py-4 text-muted">No hay alumnos en este grado.</p>}
              </div>
              <div className="grados-modal-footer">
                <button className="grados-modal-btn-cancel w-100" onClick={() => setShowAlumnosModal(false)}>Cerrar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL CREAR/EDITAR (Usando tus clases de modal) */}
      <AnimatePresence>
        {showModal && (
          <div className="grados-modal-overlay">
            <motion.div className="grados-modal-content" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="grados-modal-header d-flex justify-content-between align-items-center">
                <h2 className="grados-modal-title">{editing ? "Editar" : "Nuevo"} Grado</h2>
                <button className="grados-modal-close" onClick={() => setShowModal(false)}><X size={20}/></button>
              </div>
              <div className="grados-modal-body">
                <div className="row g-3">
                  <div className="col-md-12">
                    <label className="grados-form-label">Nombre del Grado *</label>
                    <input className={`grados-modal-input ${errors.grado ? 'is-invalid' : ''}`} value={form.grado} onChange={e => setForm({...form, grado: e.target.value})} />
                    {errors.grado && <small className="text-danger">{errors.grado}</small>}
                  </div>
                  <div className="col-md-6">
                    <label className="grados-form-label">Año *</label>
                    <input type="number" className="grados-modal-input" value={form.anio_academico} onChange={e => setForm({...form, anio_academico: e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <label className="grados-form-label">Aula *</label>
                    <input className="grados-modal-input" value={form.aula} onChange={e => setForm({...form, aula: e.target.value})} />
                    {errors.aula && <small className="text-danger">{errors.aula}</small>}
                  </div>
                  <div className="col-md-12">
                    <label className="grados-form-label">Estado</label>
                    <select className="grados-modal-input" value={form.estado} onChange={e => setForm({...form, estado: e.target.value})}>
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="grados-modal-footer d-flex gap-2 justify-content-end">
                <button className="grados-modal-btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="grados-modal-btn-save" onClick={save}>{loading ? "Guardando..." : "Confirmar Registro"}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        visible={showConfirm}
        onConfirm={async () => {
          await fetchWithToken(`${API}/${gradoAEliminar._id}`, { method: "DELETE" });
          setShowConfirm(false); fetchList(page);
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}