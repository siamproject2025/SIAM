import axios from "axios";
import { auth } from "../components/authentication/Auth";

const client = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000",
  timeout: 10000,
});

client.interceptors.request.use(async (config) => {
  const token = await auth?.currentUser?.getIdToken?.();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;

