import { useEffect, useMemo, useState } from "react";
import { auth } from "../../../components/authentication/Auth";
import "../../../styles/grados.css"
import { motion, AnimatePresence } from "framer-motion";
import { Apple, Book, Calendar, X, Trash2, Users, User, Search } from "lucide-react";
import ConfirmDialog from '../../../components/ConfirmDialog/ConfirmDialog';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
const API = `${API_BASE}/api/grados`;

// Formulario inicial con los campos que tu backend exige (timestamp)
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
  const [gradosUnicos, setGradosUnicos] = useState([]); // Para tu filtro de nombres
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  // Estados para el Modal de Alumnos
  const [showAlumnosModal, setShowAlumnosModal] = useState(false);
  const [alumnosList, setAlumnosList] = useState([]);
  const [gradoNombreSeleccionado, setGradoNombreSeleccionado] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(initialForm());
  const [errors, setErrors] = useState({});

  const [gradoAEliminar, setGradoAEliminar] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Generar query params
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
      
      // Inyectamos el conteo y la lista de alumnos para cada grado
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

      // Cargar filtro de grados únicos si está vacío
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
          timestamp: new Date().toISOString() // Aseguramos que el backend reciba lo que pide
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
      {/* HEADER (Manteniendo tu estilo con framer-motion) */}
      <header className="grados-header-custom">
        <div className="header-content p-5 text-white bg-primary rounded-bottom-4 shadow">
          <div className="d-flex align-items-center gap-3">
            <Calendar size={40} />
            <div>
              <h1 className="h2 fw-bold mb-0">Gestión de Grados</h1>
              <p className="opacity-75">Administra secciones y consulta alumnos matriculados.</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container-fluid px-5 mt-4">
        <button className="btn btn-primary mb-4 shadow-sm" onClick={openCreate}>
          + Nuevo Grado
        </button>

        {/* FILTRO POR GRADOS REGISTRADOS (Como pediste en tus instrucciones) */}
        <div className="grados-filters-card mb-4 p-3 bg-white shadow-sm rounded">
          <div className="row g-3 align-items-end">
            <div className="col-md-9">
              <label className="form-label fw-bold">Filtrar por Grado:</label>
              <select className="form-select" value={q} onChange={(e) => setQ(e.target.value)}>
                <option value="">Todos los grados registrados</option>
                {gradosUnicos.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <button className="btn btn-outline-primary w-100" onClick={() => fetchList(1)}>
                <Search size={18} className="me-2" /> Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* TABLA */}
        <div className="grados-table-card shadow-sm bg-white rounded">
          <table className="table table-hover mb-0">
            <thead className="table-light">
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
                    <button 
                      className="btn btn-sm btn-light border d-flex align-items-center gap-2"
                      onClick={() => verAlumnos(g)}
                    >
                      <Users size={14} className="text-primary" />
                      {g.totalAlumnos} Alumnos
                    </button>
                  </td>
                  <td>
                    <span className={`badge ${g.estado === 'Activo' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                      {g.estado}
                    </span>
                  </td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => openEdit(g)}>Editar</button>
                    {g.totalAlumnos === 0 && (
                       <button className="btn btn-sm btn-outline-danger" onClick={() => { setGradoAEliminar(g); setShowConfirm(true); }}>
                         <Trash2 size={14} />
                       </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL LISTA DE ALUMNOS */}
      <AnimatePresence>
        {showAlumnosModal && (
          <div className="grados-modal-overlay">
            <motion.div className="grados-modal-content" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="grados-modal-header d-flex justify-content-between">
                <h5 className="mb-0">Alumnos en {gradoNombreSeleccionado}</h5>
                <button className="btn-close" onClick={() => setShowAlumnosModal(false)}></button>
              </div>
              <div className="grados-modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {alumnosList.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {alumnosList.map((al, idx) => (
                      <div key={idx} className="list-group-item d-flex align-items-center gap-3">
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
              <div className="modal-footer">
                <button className="btn btn-secondary w-100" onClick={() => setShowAlumnosModal(false)}>Cerrar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL CREAR/EDITAR (Mantiene tus campos de registro exitoso) */}
      {showModal && (
        <div className="grados-modal-overlay">
          <div className="grados-modal-content">
            <div className="grados-modal-header">
              <h5 className="mb-0">{editing ? "Editar" : "Nuevo"} Grado</h5>
              <X className="cursor-pointer" onClick={() => setShowModal(false)} />
            </div>
            <div className="grados-modal-body">
              <div className="row g-3">
                <div className="col-md-12">
                  <label className="form-label">Nombre del Grado *</label>
                  <input className="form-control" value={form.grado} onChange={e => setForm({...form, grado: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Año *</label>
                  <input type="number" className="form-control" value={form.anio_academico} onChange={e => setForm({...form, anio_academico: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Aula *</label>
                  <input className="form-control" value={form.aula} onChange={e => setForm({...form, aula: e.target.value})} />
                </div>
                <div className="col-md-12">
                  <label className="form-label">Estado</label>
                  <select className="form-select" value={form.estado} onChange={e => setForm({...form, estado: e.target.value})}>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer d-flex gap-2">
              <button className="btn btn-light border" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}>{loading ? "Guardando..." : "Confirmar Registro"}</button>
            </div>
          </div>
        </div>
      )}

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