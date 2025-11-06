// frontend/src/services/gradosApi.js
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
const api = axios.create({
  baseURL: `${API_BASE}/api/grados`,
  timeout: 10000,
});

const handle = async (p) => {
  const r = await p;
  // El backend puede responder {grados:[...]}, {items:[...]}, {data:[...]}, o un objeto
  return r.data?.grados ?? r.data?.items ?? r.data?.data ?? r.data;
};

const gradosApi = {
  ping: () => handle(api.get("/ping")),
  listar: (params = {}) => handle(api.get("/", { params })),
  obtener: (id) => handle(api.get(`/${id}`)),
  crear: (payload) => handle(api.post("/", payload)),
  actualizar: (id, payload) => handle(api.put(`/${id}`, payload)),
  eliminar: (id) => handle(api.delete(`/${id}`)),
  restaurar: (id) => handle(api.patch(`/${id}/restaurar`)),
};

export default gradosApi;

