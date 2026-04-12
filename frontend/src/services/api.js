// src/services/api.js
import axios from "axios";
import { auth } from "../components/authentication/Auth"; // AJUSTA RUTA SI ES NECESARIO

const API_URL = process.env.REACT_APP_API_URL || "/api";

const api = axios.create({
  baseURL: API_URL + "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar token Firebase
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;

      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error) => Promise.reject(error)
);

// Interceptor para errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
     
      window.location.href = "/bitacora";
    }
    return Promise.reject(error);
  }
);

export default api;
