import axios from "axios";

const EXECUTION_API_URL =
  process.env.NEXT_PUBLIC_EXECUTION_API_URL || "http://localhost:8082";

const executionApi = axios.create({
  baseURL: EXECUTION_API_URL,
  headers: { "Content-Type": "application/json" },
});

executionApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

executionApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default executionApi;
