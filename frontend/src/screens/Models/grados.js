import { useEffect, useMemo, useState } from "react";
import { auth } from "../../components/authentication/Auth";
import "../../styles/grados.css"
import { motion, AnimatePresence } from "framer-motion";
import { Apple, Book, Calendar, Table2, X, FileText, Image, Trash2 } from "lucide-react";
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
const API = `${API_BASE}/api/grados`;

const initialForm = () => ({
  _id: null,
  grado: "",
  descripcion: "",
  anio_academico: new Date().getFullYear(),
  total_creditos: 0,
  total_horas_semanales: 0,
  estado: "Activo",
  fecha_actualizacion: new Date().toISOString(),
  timestamp: new Date().toISOString(),
});

export default function GradosPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [anioFilter, setAnioFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(initialForm());
  const [errors, setErrors] = useState({});

  // Generar query params
  const params = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("limit", "10");
    if (q) p.set("q", q);
    if (estadoFilter) p.set("estado", estadoFilter);
    if (anioFilter) p.set("anio_academico", anioFilter);
    p.set("sort", "grado:asc");
    return p.toString();
  }, [page, q, estadoFilter, anioFilter]);

  // ------ Función genérica para peticiones con token ------
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

  // ------ Cargar lista de grados ------
  const fetchList = async (p = 1) => {
    try {
      setLoading(true);
      setPage(p);
      const data = await fetchWithToken(`${API}?${params}`);
      setItems(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo cargar la lista de grados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // ------ Validación de formulario ------
  const validate = (current) => {
    const e = {};
    if (!current.grado?.trim()) e.grado = "El nombre del grado es requerido.";
    if (!String(current.anio_academico).trim()) e.anio_academico = "El año académico es requerido.";
    if (Number.isNaN(Number(current.anio_academico)) || Number(current.anio_academico) < 1900 || Number(current.anio_academico) > 2100) {
      e.anio_academico = "El año debe estar entre 1900 y 2100.";
    }
    if (Number(current.total_creditos) < 0) e.total_creditos = "Los créditos no pueden ser negativos.";
    if (Number(current.total_horas_semanales) < 0) e.total_horas_semanales = "Las horas no pueden ser negativas.";
    if (!["Activo", "Inactivo"].includes(current.estado)) e.estado = "Estado inválido.";
    return e;
  };

  // ------ Abrir Modal ------
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

  // ------ Guardar ------
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
          grado: form.grado,
          descripcion: form.descripcion,
          anio_academico: Number(form.anio_academico),
          total_creditos: Number(form.total_creditos),
          total_horas_semanales: Number(form.total_horas_semanales),
          estado: form.estado,
          fecha_actualizacion: form.fecha_actualizacion,
          timestamp: form.timestamp,
        }),
      });

      setShowModal(false);
      fetchList(page);
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo guardar el registro.");
    } finally {
      setLoading(false);
    }
  };

  // ------ Desactivar / Restaurar ------
  const softDelete = async (id) => {
    if (!window.confirm("¿Desactivar este grado?")) return;
    try {
      setLoading(true);
      await fetchWithToken(`${API}/${id}`, { method: "DELETE" });
      fetchList(page);
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo desactivar.");
    } finally {
      setLoading(false);
    }
  };

  const restore = async (id) => {
    try {
      setLoading(true);
      await fetchWithToken(`${API}/${id}/restaurar`, { method: "PATCH" });
      fetchList(page);
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo restaurar.");
    } finally {
      setLoading(false);
    }
  };

  // ------ Eliminar permanentemente ------

const [gradoAEliminar, setGradoAEliminar] = useState(null);
const [showConfirm, setShowConfirm] = useState(false);
const prepararEliminacionGrado = (grado) => {
  setGradoAEliminar(grado);
  setShowConfirm(true);
};

const confirmarEliminacionGrado = async () => {
  setShowConfirm(false);
  if (!gradoAEliminar) return;

  try {
    setLoading(true);
    await fetchWithToken(`${API}/${gradoAEliminar._id}`, { method: "DELETE" });
    fetchList(page);
  } catch (err) {
    console.error(err);
    alert(err.message || "No se pudo eliminar permanentemente.");
  } finally {
    setLoading(false);
    setGradoAEliminar(null);
  }
};

const cancelarEliminacionGrado = () => {
  setShowConfirm(false);
  setGradoAEliminar(null);
};



  const hardDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar permanentemente este grado? Esta acción no se puede deshacer.")) return;
    try {
      setLoading(true);
      await fetchWithToken(`${API}/${id}`, { method: "DELETE" });
      fetchList(page);
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo eliminar permanentemente.");
    } finally {
      setLoading(false);
    }
  };

  // ------ Render ------
  return (
    <div className="grados-container">
      <motion.div
        className="donacion-header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, type: "spring", stiffness: 100 }}
      >
        <motion.div
          className="header-gradient"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <div className="header-content">
            <motion.h2
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.3,
                }}
              >
                <Calendar size={36} fill="white" color="white" />
              </motion.div>
              Creación y gestión de grados.
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                style={{ marginLeft: "auto" }}
              >
                <Calendar size={32} color="white" />
              </motion.div>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Crea tus grados y gestiona tus espacios físicos.
            </motion.p>

            <motion.div
              className="floating-icons"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <motion.div
                className="floating-icon"
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Calendar size={20} color="white" />
              </motion.div>
              <motion.div
                className="floating-icon"
                animate={{
                  y: [0, -15, 0],
                  rotate: [0, -8, 8, 0],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
              >
                <Apple size={20} color="white" />
              </motion.div>
              <motion.div
                className="floating-icon"
                animate={{
                  y: [0, -12, 0],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 4.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
              >
                <Book size={20} color="white" />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      <button className="grados-btn-primary" style={{color:"white",marginLeft:"15px", marginBottom:"10px"}} onClick={openCreate}>
        Nuevo Grado
      </button>

      <section className="content">
        <div className="container-fluid">
          {/* Filtros */}
          <div className="grados-filters-card">
            <div className="grados-filters-body row g-2">
              <div className="col-md-4">
                <input
                  className="grados-form-control"
                  placeholder="Buscar por nombre, descripción o materia…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchList(1)}
                />
              </div>
              <div className="col-md-3">
                <select className="grados-form-select" value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
                  <option value="">Estado (todos)</option>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
              <div className="col-md-3">
                <input
                  type="number"
                  className="grados-form-control"
                  placeholder="Año académico"
                  value={anioFilter}
                  onChange={(e) => setAnioFilter(e.target.value)}
                />
              </div>
              <div className="col-md-2 d-grid">
                <button className="grados-btn-search" onClick={() => fetchList(1)}>
                  <i className="fas fa-search me-1" /> Buscar
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de grados */}
          <div className="grados-table-card">
            <div className="card-body table-responsive p-0">
              <table className="grados-table">
                <thead>
                  <tr>
                    <th>Grado</th>
                    <th>Año</th>
                    <th>Créditos</th>
                    <th>Horas</th>
                    <th>Estado</th>
                    <th className="text-end" style={{ width: 280 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length > 0 ? items.map((g) => (
                    <tr key={g._id}>
                      <td className="align-middle">{g.grado}</td>
                      <td className="align-middle">{g.anio_academico}</td>
                      <td className="align-middle">{g.total_creditos}</td>
                      <td className="align-middle">{g.total_horas_semanales}</td>
                      <td className="align-middle">
                        <span className={`grados-badge-${g.estado === "Activo" ? "active" : "inactive"}`}>
                          {g.estado}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <button className="grados-btn-edit" onClick={() => openEdit(g)}>
                            <i className="fas fa-edit me-1" /> Editar
                          </button>
                          {g.estado === "Activo" ? (
                            <button className="grados-btn-deactivate" onClick={() => softDelete(g._id)}>
                              <i className="fas fa-ban me-1" /> Desactivar
                            </button>
                          ) : (
                            <button className="grados-btn-restore" onClick={() => restore(g._id)}>
                              <i className="fas fa-undo me-1" /> Restaurar
                            </button>
                          )}
                          <button 
  className="grados-btn-delete" 
  onClick={() => prepararEliminacionGrado(g)}
  title="Eliminar permanentemente"
>
  <Trash2 size={14} />
</button>


                        </div>
                        
                      </td>
                    </tr>
                  )) : !loading && (
                    <tr>
                      <td colSpan={6} className="text-center text-muted p-4">Sin registros.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="grados-pagination d-flex justify-content-between align-items-center">
              <small className="grados-pagination-info">Total: {total}</small>
              <div className="btn-group">
                <button 
                  className="grados-pagination-btn" 
                  disabled={page <= 1} 
                  onClick={() => fetchList(page - 1)}
                >
                  «
                </button>
                <span className="grados-pagination-btn grados-pagination-btn-active">
                  Página {page} de {pages}
                </span>
                <button 
                  className="grados-pagination-btn" 
                  disabled={page >= pages} 
                  onClick={() => fetchList(page + 1)}
                >
                  »
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="grados-modal-overlay">
          <div className="grados-modal-content">
            <div className="grados-modal-header">
              <h5 className="grados-modal-title">{editing ? "Editar grado" : "Nuevo grado"}</h5>
              <button className="grados-modal-close" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="grados-modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="grados-form-label">Grado *</label>
                  <input
                    className={`grados-modal-input ${errors.grado ? "is-invalid" : ""}`}
                    value={form.grado}
                    onChange={(e) => setForm({ ...form, grado: e.target.value })}
                  />
                  {errors.grado && <div className="grados-invalid-feedback">{errors.grado}</div>}
                </div>
                <div className="col-md-6">
                  <label className="grados-form-label">Año académico *</label>
                  <input
                    type="number"
                    className={`grados-modal-input ${errors.anio_academico ? "is-invalid" : ""}`}
                    value={form.anio_academico}
                    onChange={(e) => setForm({ ...form, anio_academico: e.target.value })}
                  />
                  {errors.anio_academico && <div className="grados-invalid-feedback">{errors.anio_academico}</div>}
                </div>

                <div className="col-12">
                  <label className="grados-form-label">Descripción</label>
                  <input
                    className="grados-modal-input"
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  />
                </div>

                <div className="col-md-4">
                  <label className="grados-form-label">Créditos</label>
                  <input
                    type="number"
                    className={`grados-modal-input ${errors.total_creditos ? "is-invalid" : ""}`}
                    value={form.total_creditos}
                    onChange={(e) => setForm({ ...form, total_creditos: e.target.value })}
                  />
                  {errors.total_creditos && <div className="grados-invalid-feedback">{errors.total_creditos}</div>}
                </div>
                <div className="col-md-4">
                  <label className="grados-form-label">Horas semanales</label>
                  <input
                    type="number"
                    className={`grados-modal-input ${errors.total_horas_semanales ? "is-invalid" : ""}`}
                    value={form.total_horas_semanales}
                    onChange={(e) => setForm({ ...form, total_horas_semanales: e.target.value })}
                  />
                  {errors.total_horas_semanales && <div className="grados-invalid-feedback">{errors.total_horas_semanales}</div>}
                </div>
                <div className="col-md-4">
                  <label className="grados-form-label">Estado</label><br/>
                  <select
                    className={`grados-modal-input ${errors.estado ? "is-invalid" : ""}`}
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  >
                    <option>Activo</option>
                    <option>Inactivo</option>
                  </select>
                  {errors.estado && <div className="grados-invalid-feedback">{errors.estado}</div>}
                </div>
              </div>
            </div>
            <div className="grados-modal-footer">
              <button className="grados-modal-btn-cancel" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="grados-modal-btn-save" onClick={save} disabled={loading}>
                {loading ? "Guardando..." : (editing ? "Guardar cambios" : "Crear")}
              </button>
            </div>
          </div>
        </div>
      )}
      {showConfirm && (
  <ConfirmDialog
    message={`¿Estás seguro de que quieres eliminar permanentemente el grado "${gradoAEliminar?.nombre}"? Esta acción no se puede deshacer.`}
    onConfirm={confirmarEliminacionGrado}
    onCancel={cancelarEliminacionGrado}
    visible={showConfirm}
  />
)}
    </div>
    
  );
}