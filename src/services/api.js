import axios from "axios";

import { getEnv } from "../utils/env";

const API_BASE_URL = getEnv("VITE_API_BASE_URL") || "http://localhost:8081/api/v1";

export const API_URL = API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let handleAuthError = null;

export const setAuthErrorHandler = (handler) => {
  handleAuthError = handler;
};

api.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith("/")) {
    config.url = config.url.substring(1);
  }

  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const { data } = error.response;

      if (error.response.status === 401 && handleAuthError) {
        handleAuthError();
      }

      const errorMessage =
        data?.message || (typeof data === "string" ? data : null) || "An error occurred";

      const err = new Error(errorMessage);

      err.status = error.response.status;

      err.data = data;

      return Promise.reject(err);
    }

    if (error.request) {
      return Promise.reject(new Error("Network error. Is the Subgrid server running?"));
    }

    return Promise.reject(error);
  },
);

export default api;
