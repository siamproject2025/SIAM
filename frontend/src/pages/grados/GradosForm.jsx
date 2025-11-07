import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import gradosApi from "../../services/gradosApi";

const empty = {
  grado: "",
  descripcion: "",
  total_creditos: 0,
  total_horas_semanales: 0,
  anio_academico: new Date().getFullYear(),
  estado: "Activo",
  fecha_actualizacion: new Date().toISOString(),
  timestamp: new Date().toISOString(),
};

export default function GradosForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const g = await gradosApi.obtener(id);
        setData(g);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar el grado");
      }
    })();
  }, [id]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (id) await gradosApi.actualizar(id, data);
      else await gradosApi.crear(data);
      navigate("/grados");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-3">
      <h3>{id ? "Editar grado" : "Nuevo grado"}</h3>
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={onSubmit} className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Grado</label>
          <input className="form-control" value={data.grado}
            onChange={(e)=>setData({...data, grado:e.target.value})} required />
        </div>

        <div className="col-md-6">
          <label className="form-label">Año académico</label>
          <input type="number" className="form-control" value={data.anio_academico}
            onChange={(e)=>setData({...data, anio_academico:Number(e.target.value)})} required />
        </div>

        <div className="col-12">
          <label className="form-label">Descripción</label>
          <textarea className="form-control" rows={2} value={data.descripcion}
            onChange={(e)=>setData({...data, descripcion:e.target.value})} />
        </div>

        <div className="col-md-6">
          <label className="form-label">Total créditos</label>
          <input type="number" className="form-control" value={data.total_creditos}
            onChange={(e)=>setData({...data, total_creditos:Number(e.target.value)})} min={0} required />
        </div>

        <div className="col-md-6">
          <label className="form-label">Horas semanales</label>
          <input type="number" className="form-control" value={data.total_horas_semanales}
            onChange={(e)=>setData({...data, total_horas_semanales:Number(e.target.value)})} min={0} required />
        </div>

        <div className="col-md-4">
          <label className="form-label">Estado</label>
          <select className="form-select" value={data.estado}
            onChange={(e)=>setData({...data, estado:e.target.value})}>
            <option>Activo</option>
            <option>Inactivo</option>
          </select>
        </div>

        <div className="col-12 d-flex gap-2">
          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={()=>navigate("/grados")}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

