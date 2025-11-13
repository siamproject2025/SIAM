// api.js
import axios from "axios";
import { loadingController } from ".././../api/loadingController"

const api = axios.create({
  baseURL:process.env.REACT_APP_API_URL,
});

// Interceptor antes de la petición
api.interceptors.request.use((config) => {
  loadingController.start();
  return config;
});

// Interceptor cuando termina o falla
api.interceptors.response.use(
  (response) => {
    loadingController.stop();
    return response;
  },
  (error) => {
    loadingController.stop();
    return Promise.reject(error);
  }
);

export default api;
