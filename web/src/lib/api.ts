import axios from "axios";
import { useAuthStore } from "../store/authStore";

// Axios client pointed to next.config.ts rewrites path (/api/v1 -> Gateway port 8080)
export const api = axios.create({
  baseURL: "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Send HTTP cookies (refreshToken) automatically
});

export const setAccessToken = (token: string | null) => {
  useAuthStore.setState({ accessToken: token });
};

export const getAccessToken = () => {
  return useAuthStore.getState().accessToken;
};

// Request Interceptor: Attach bearer tokens and tenant context from Zustand store
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    const activeTenantId = useAuthStore.getState().activeTenantId;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (activeTenantId && config.headers) {
      config.headers["X-Tenant-ID"] = activeTenantId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Catch 401 and attempt token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        axios.post(
          "/api/v1/auth/refresh",
          {},
          { withCredentials: true }
        )
          .then((refreshResponse) => {
            const newAccessToken = refreshResponse.data.data.accessToken;
            setAccessToken(newAccessToken);
            
            // IMPORTANT: After a Spring Boot trailing-slash redirect, Axios mutates
            // originalRequest.url to the absolute backend URL. Reset to relative path.
            if (originalRequest.url && originalRequest.url.startsWith("http")) {
              const match = originalRequest.url.match(/\/api\/v1(\/.*)/);
              if (match) {
                originalRequest.url = match[1]; // relative path like /events/
              }
            }
            // Clear baseURL override if Axios set it to an absolute url during redirect
            if (originalRequest.baseURL && originalRequest.baseURL.startsWith("http://localhost:8")) {
              originalRequest.baseURL = "/api/v1";
            }

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            processQueue(null, newAccessToken);
            resolve(api(originalRequest));
          })
          .catch((refreshError) => {
            processQueue(refreshError, null);
            setAccessToken(null);
            useAuthStore.getState().clearAuth();
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
            reject(refreshError);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }
    return Promise.reject(error);
  }
);
