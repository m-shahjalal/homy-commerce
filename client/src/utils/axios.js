import axios from "axios";

const url =
  process.env.NODE_ENV === "production"
    ? "https://ccom.onrender.com/api"
    : "http://localhost:4000/api";

const instance = axios.create({ baseURL: url });

instance.interceptors.request.use(
  (config) => {
    if (!config.headers.Authorization) {
      const user = JSON.parse(localStorage.getItem("user")) || {};
      if (user.token) config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (err) => {
    console.error(err);
    return Promise.reject(err);
  },
);

export default instance;
