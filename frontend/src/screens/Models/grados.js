import { useEffect, useMemo, useState } from "react";

/** Ajusta esta constante si ya tienes REACT_APP_API_URL en .env */
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
  // ------ Estados ------
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

  // ------ Helpers ------
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

  // ------ Cargar lista ------
  async function fetchList(p = 1) {
    try {
      setLoading(true);
      setPage(p);
      const res = await fetch(`${API}?${params}`);
      const json = await res.json();
      setItems(json.items || []);
      setTotal(json.total || 0);
      setPages(json.pages || 1);
    } catch (e) {
      console.error(e);
      alert("No se pudo cargar la lista de grados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // ------ Validaciones ------
  function validate(current) {
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
  }

  // ------ Abrir Crear / Editar ------
  function openCreate() {
    setForm(initialForm());
    setErrors({});
    setEditing(false);
    setShowModal(true);
  }

  function openEdit(item) {
    setForm({
      ...item,
      fecha_actualizacion: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    });
    setErrors({});
    setEditing(true);
    setShowModal(true);
  }

  // ------ Guardar ------
  async function save() {
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    try {
      setLoading(true);
      const method = editing ? "PUT" : "POST";
      const url = editing ? `${API}/${form._id}` : API;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
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

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json.message || "Ocurrió un error al guardar.");
        return;
      }

      setShowModal(false);
      fetchList(page);
    } catch (e) {
      console.error(e);
      alert("No se pudo guardar el registro.");
    } finally {
      setLoading(false);
    }
  }

  // ------ Desactivar / Restaurar ------
  async function softDelete(id) {
    if (!window.confirm("¿Desactivar este grado?")) return;
    try {
      setLoading(true);
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j.message || "No se pudo desactivar.");
      } else {
        fetchList(page);
      }
    } finally {
      setLoading(false);
    }
  }

  async function restore(id) {
    try {
      setLoading(true);
      const res = await fetch(`${API}/${id}/restaurar`, { method: "PATCH" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j.message || "No se pudo restaurar.");
      } else {
        fetchList(page);
      }
    } finally {
      setLoading(false);
    }
  }

  // ------ Render ------
  return (
    <div className="content-wrapper p-3">
      <section className="content-header">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <h1 className="m-0">Gestión de Grados</h1>
          <button className="btn btn-primary" onClick={openCreate}>
            <i className="fas fa-plus me-2" /> Nuevo grado
          </button>
        </div>
      </section>

      <section className="content">
        <div className="container-fluid">
          {/* Filtros */}
          <div className="card">
            <div className="card-body row g-2">
              <div className="col-md-4">
                <input
                  className="form-control"
                  placeholder="Buscar por nombre, descripción o materia…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchList(1)}
                />
              </div>
              <div className="col-md-3">
                <select className="form-select" value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
                  <option value="">Estado (todos)</option>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
              <div className="col-md-3">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Año académico"
                  value={anioFilter}
                  onChange={(e) => setAnioFilter(e.target.value)}
                />
              </div>
              <div className="col-md-2 d-grid">
                <button className="btn btn-outline-secondary" onClick={() => fetchList(1)}>
                  <i className="fas fa-search me-1" /> Buscar
                </button>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="card">
            <div className="card-body table-responsive p-0">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Grado</th>
                    <th>Año</th>
                    <th>Créditos</th>
                    <th>Horas</th>
                    <th>Estado</th>
                    <th className="text-end" style={{ width: 220 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((g) => (
                    <tr key={g._id}>
                      <td className="align-middle">{g.grado}</td>
                      <td className="align-middle">{g.anio_academico}</td>
                      <td className="align-middle">{g.total_creditos}</td>
                      <td className="align-middle">{g.total_horas_semanales}</td>
                      <td className="align-middle">
                        <span className={`badge ${g.estado === "Activo" ? "bg-success" : "bg-secondary"}`}>{g.estado}</span>
                      </td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-warning me-2" onClick={() => openEdit(g)}>
                          <i className="fas fa-edit me-1" /> Editar
                        </button>
                        {g.estado === "Activo" ? (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => softDelete(g._id)}>
                            <i className="fas fa-ban me-1" /> Desactivar
                          </button>
                        ) : (
                          <button className="btn btn-sm btn-outline-success" onClick={() => restore(g._id)}>
                            <i className="fas fa-undo me-1" /> Restaurar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="text-center text-muted p-4">Sin registros.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación simple */}
            <div className="card-footer d-flex justify-content-between align-items-center">
              <small>Total: {total}</small>
              <div className="btn-group">
                <button className="btn btn-outline-secondary btn-sm" disabled={page <= 1} onClick={() => fetchList(page - 1)}>
                  «
                </button>
                <span className="btn btn-outline-secondary btn-sm disabled">Página {page} de {pages}</span>
                <button className="btn btn-outline-secondary btn-sm" disabled={page >= pages} onClick={() => fetchList(page + 1)}>
                  »
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="modal fade show" style={{ display: "block", background: "rgba(0,0,0,.35)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editing ? "Editar grado" : "Nuevo grado"}</h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Grado *</label>
                    <input
                      className={`form-control ${errors.grado ? "is-invalid" : ""}`}
                      value={form.grado}
                      onChange={(e) => setForm({ ...form, grado: e.target.value })}
                    />
                    {errors.grado && <div className="invalid-feedback">{errors.grado}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Año académico *</label>
                    <input
                      type="number"
                      className={`form-control ${errors.anio_academico ? "is-invalid" : ""}`}
                      value={form.anio_academico}
                      onChange={(e) => setForm({ ...form, anio_academico: e.target.value })}
                    />
                    {errors.anio_academico && <div className="invalid-feedback">{errors.anio_academico}</div>}
                  </div>

                  <div className="col-12">
                    <label className="form-label">Descripción</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={form.descripcion}
                      onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Créditos</label>
                    <input
                      type="number"
                      className={`form-control ${errors.total_creditos ? "is-invalid" : ""}`}
                      value={form.total_creditos}
                      onChange={(e) => setForm({ ...form, total_creditos: e.target.value })}
                    />
                    {errors.total_creditos && <div className="invalid-feedback">{errors.total_creditos}</div>}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Horas semanales</label>
                    <input
                      type="number"
                      className={`form-control ${errors.total_horas_semanales ? "is-invalid" : ""}`}
                      value={form.total_horas_semanales}
                      onChange={(e) => setForm({ ...form, total_horas_semanales: e.target.value })}
                    />
                    {errors.total_horas_semanales && <div className="invalid-feedback">{errors.total_horas_semanales}</div>}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Estado</label>
                    <select
                      className={`form-select ${errors.estado ? "is-invalid" : ""}`}
                      value={form.estado}
                      onChange={(e) => setForm({ ...form, estado: e.target.value })}
                    >
                      <option>Activo</option>
                      <option>Inactivo</option>
                    </select>
                    {errors.estado && <div className="invalid-feedback">{errors.estado}</div>}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={save} disabled={loading}>
                  {loading ? "Guardando..." : (editing ? "Guardar cambios" : "Crear")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

