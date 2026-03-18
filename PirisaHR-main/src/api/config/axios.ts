import axios from "axios";

import { BACKEND_ORIGIN } from "./backend";

// Prefer explicit API base; otherwise derive from backend origin; otherwise same-origin /api
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (BACKEND_ORIGIN ? `${BACKEND_ORIGIN}/api` : "/api");

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
