import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

const getBaseURL = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('eventosapp.in')) {
      return 'https://api.eventosapp.in/api/v1';
    }
    if (window.location.hostname.includes('onrender.com')) {
      return 'https://eventos-api-gateway.onrender.com/api/v1';
    }
  }
  return 'https://api.eventosapp.in/api/v1';
};

export const apiClient = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Auto attach HttpOnly refresh token cookie
  timeout: 30000, // 30 seconds request timeout
});

// Alias for backwards compatibility
export const api = apiClient;

export const setAccessToken = (token: string | null) => {
  useAuthStore.setState({ accessToken: token });
};

export const getAccessToken = () => {
  return useAuthStore.getState().accessToken;
};

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

// 1. Ingress Request Interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    let token = useAuthStore.getState().accessToken;
    if (!token && typeof window !== 'undefined') {
      token = sessionStorage.getItem('accessToken') || localStorage.getItem('eventos_access_token');
      if (token) {
        useAuthStore.setState({ accessToken: token });
      }
    }
    let activeTenantId = useAuthStore.getState().activeTenantId;
    if (!activeTenantId && typeof window !== 'undefined') {
      activeTenantId = sessionStorage.getItem('activeTenantId') || localStorage.getItem('eventos_active_tenant_id');
      if (activeTenantId) {
        useAuthStore.setState({ activeTenantId });
      }
    }
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (activeTenantId && config.headers) {
      config.headers['X-Tenant-ID'] = activeTenantId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Egress Response Interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Intercept limit exceeded / payment required errors
    if (error.response?.status === 402 || (error.response?.data && (error.response.data as any).error === 'LIMIT_EXCEEDED')) {
      const data = (error.response.data as any).data || {};
      const reason = (error.response.data as any).message || "You have reached your plan limit.";
      const limitName = data.limitName || "Capacity Limit";
      const limitValue = data.limitValue || "Max";
      const currentValue = data.currentValue || "Current";

      const { useLimitStore } = require('../store/limitStore');
      useLimitStore.getState().openLimitModal(reason, limitName, limitValue, currentValue);
      return Promise.reject(error);
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Check if error is 401 and request hasn't been retried yet, skipping auth endpoints
    const isAuthRequest = originalRequest.url?.includes('/auth/login') 
      || originalRequest.url?.includes('/auth/register')
      || originalRequest.url?.includes('/auth/refresh')
      || originalRequest.url?.includes('/auth/switch')
      || originalRequest.url?.includes('/auth/logout');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest._retry = true;
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(apiClient(originalRequest));
            },
            reject: (err: any) => reject(err),
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = useAuthStore.getState().refreshToken 
          || (typeof window !== 'undefined' ? (sessionStorage.getItem('refreshToken') || localStorage.getItem('eventos_refresh_token')) : null);

        const refreshResponse = await axios.post(
          `${getBaseURL()}/auth/refresh`,
          storedRefreshToken ? { refreshToken: storedRefreshToken } : {},
          { withCredentials: true }
        );
        
        const { accessToken: newAccessToken, refreshToken: newRefreshToken, role, firstName, lastName, permissions } = refreshResponse.data.data;
        
        // Update store with new access token and updated user metadata
        const currentState = useAuthStore.getState();
        const updatedUser = currentState.user ? {
          ...currentState.user,
          role: role || currentState.user.role,
          firstName: firstName || currentState.user.firstName,
          lastName: lastName || currentState.user.lastName,
          permissions: permissions || currentState.user.permissions || []
        } : null;

        useAuthStore.setState({ 
          accessToken: newAccessToken,
          refreshToken: newRefreshToken || storedRefreshToken,
          user: updatedUser
        });

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('accessToken', newAccessToken);
          localStorage.setItem('eventos_access_token', newAccessToken);
          if (newRefreshToken) {
            sessionStorage.setItem('refreshToken', newRefreshToken);
            localStorage.setItem('eventos_refresh_token', newRefreshToken);
          }
        }
        
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
          originalRequest.baseURL = getBaseURL();
        }

        processQueue(null, newAccessToken);
        isRefreshing = false;
        
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Clear auth state on refresh failure and redirect to landing modal
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          if (path !== '/' && !path.includes('workspace-select')) {
            useAuthStore.getState().clearAuth();
            window.location.href = '/?login=true&expired=true';
          }
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
