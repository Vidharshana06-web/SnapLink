import axios from "axios";

const API = axios.create({
  baseURL: "https://snaplink-backend-7s7p.onrender.com/api",
});

// Interceptor to inject JWT authorization token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("snaplink_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
