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

// Response Interceptor: Catch 401 and attempt token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Post request to Gateway → Auth Service /refresh route (relies on HTTP-only cookie)
        const refreshResponse = await axios.post(
          "/api/v1/auth/refresh",
          {},
          { withCredentials: true }
        );
        
        const newAccessToken = refreshResponse.data.data.accessToken;
        setAccessToken(newAccessToken);
        
        // IMPORTANT: After a Spring Boot trailing-slash redirect, Axios mutates
        // originalRequest.url to the absolute backend URL (e.g. http://localhost:8083/...).
        // Reset the url to the relative path so the retry goes via the Next.js proxy, not direct to backend.
        if (originalRequest.url && originalRequest.url.startsWith("http")) {
          // Extract path after /api/v1
          const match = originalRequest.url.match(/\/api\/v1(\/.*)/);
          if (match) {
            originalRequest.url = match[1]; // relative path like /events/
          }
        }
        // Clear baseURL override if Axios set it to an absolute url during redirect
        if (originalRequest.baseURL && originalRequest.baseURL.startsWith("http://localhost:8")) {
          originalRequest.baseURL = "/api/v1";
        }

        // Re-execute original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed/expired: clear token memory and redirect to login
        setAccessToken(null);
        useAuthStore.getState().clearAuth();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
