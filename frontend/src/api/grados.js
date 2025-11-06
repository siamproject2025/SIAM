import client from "./client";

export const gradosApi = {
  listar: () => client.get("/api/grados"),
  obtener: (id) => client.get(`/api/grados/${id}`),
  crear: (data) => client.post("/api/grados", data),
  actualizar: (id, data) => client.put(`/api/grados/${id}`, data),
  eliminar: (id) => client.delete(`/api/grados/${id}`),
};

