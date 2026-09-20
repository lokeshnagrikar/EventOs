import { create } from 'zustand';
import { setClientCookie, clearClientCookie } from '@/lib/clientCookies';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  role: string;
  permissions: string[];
  profileImage?: string;
}

export interface WorkspaceMembership {
  tenantId: string;
  companyId: string;
  companyName: string;
  role: string;
  status: string;
}

interface AuthState {
  accessToken: string | null;
  user: UserProfile | null;
  activeTenantId: string | null;
  memberships: WorkspaceMembership[];
  isAuthenticated: boolean;
  
  initializeAuth: () => void;
  setAuth: (accessToken: string, user: UserProfile, activeTenantId: string, memberships: WorkspaceMembership[], refreshToken?: string) => void;
  updateActiveTenant: (tenantId: string, accessToken: string, role: string, permissions: string[]) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  clearAuth: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  activeTenantId: null,
  memberships: [],
  isAuthenticated: false,

  initializeAuth: () => {
    if (typeof window === 'undefined') return;
    try {
      const accessToken = sessionStorage.getItem('accessToken') || localStorage.getItem('eventos_access_token') || localStorage.getItem('accessToken');
      const user = sessionStorage.getItem('user') || localStorage.getItem('eventos_user_profile');
      const activeTenantId = sessionStorage.getItem('activeTenantId') || localStorage.getItem('eventos_active_tenant_id');
      const memberships = sessionStorage.getItem('memberships') || localStorage.getItem('eventos_memberships');
      
      if (accessToken) {
        set({
          accessToken,
          user: user ? JSON.parse(user) : null,
          activeTenantId: activeTenantId || "00000000-0000-0000-0000-000000000000",
          memberships: memberships ? JSON.parse(memberships) : [],
          isAuthenticated: true,
        });
      } else if (activeTenantId) {
        set({
          accessToken: null,
          user: user ? JSON.parse(user) : null,
          activeTenantId: activeTenantId,
          memberships: memberships ? JSON.parse(memberships) : [],
          isAuthenticated: false,
        });
      }
    } catch (e) {
      console.error("Failed to initialize auth from storage", e);
    }
  },

  setAuth: (accessToken, user, activeTenantId, memberships, refreshToken) => {
    set({
      accessToken,
      user,
      activeTenantId,
      memberships,
      isAuthenticated: true,
    });
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('accessToken', accessToken);
      localStorage.setItem('eventos_access_token', accessToken);
      sessionStorage.setItem('activeTenantId', activeTenantId);
      localStorage.setItem('eventos_active_tenant_id', activeTenantId);
      sessionStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('eventos_user_profile', JSON.stringify(user));
      sessionStorage.setItem('memberships', JSON.stringify(memberships));
      localStorage.setItem('eventos_memberships', JSON.stringify(memberships));

      if (refreshToken) {
        sessionStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('eventos_refresh_token', refreshToken);
      }
      
      // Cookie for SSR / Middleware
      setClientCookie("hasSession", "true", 604800);
      setClientCookie("accessToken", accessToken, 3600);
      if (user?.role) setClientCookie("user_role", user.role, 604800);
      if (user?.firstName) setClientCookie("user_name", user.firstName, 604800);
    }
  },

  updateActiveTenant: (tenantId, accessToken, role, permissions) => {
    set((state) => {
      const updatedUser = state.user ? { ...state.user, role, permissions } : null;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('accessToken', accessToken);
        localStorage.setItem('eventos_access_token', accessToken);
        sessionStorage.setItem('activeTenantId', tenantId);
        localStorage.setItem('eventos_active_tenant_id', tenantId);
        if (updatedUser) {
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
          localStorage.setItem('eventos_user_profile', JSON.stringify(updatedUser));
        }
        setClientCookie("hasSession", "true", 604800);
        setClientCookie("accessToken", accessToken, 3600);
        if (role) setClientCookie("user_role", role, 604800);
      }
      return {
        accessToken,
        activeTenantId: tenantId,
        user: updatedUser,
        isAuthenticated: true,
      };
    });
  },

  updateUserProfile: (profile) => {
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, ...profile };
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('user', JSON.stringify(updated));
        localStorage.setItem('eventos_user_profile', JSON.stringify(updated));
        if (updated.firstName) {
          localStorage.setItem('user_name', `${updated.firstName} ${updated.lastName || ''}`.trim());
        }
      }
      return { user: updated };
    });
  },

  clearAuth: () => {
    set({
      accessToken: null,
      user: null,
      activeTenantId: null,
      memberships: [],
      isAuthenticated: false,
    });
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      localStorage.removeItem("eventos_access_token");
      localStorage.removeItem("eventos_refresh_token");
      localStorage.removeItem("eventos_active_tenant_id");
      localStorage.removeItem("eventos_user_profile");
      localStorage.removeItem("eventos_memberships");
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_role");
      localStorage.removeItem("eventos_last_user");
      // Revoke middleware session cookies
      clearClientCookie("hasSession");
      clearClientCookie("user_role");
      clearClientCookie("user_name");
      clearClientCookie("accessToken");
    }
  },

  logout: async () => {
    try {
      if (typeof window !== 'undefined') {
        const token = sessionStorage.getItem('accessToken') || localStorage.getItem('eventos_access_token');
        const activeTenantId = sessionStorage.getItem('activeTenantId') || localStorage.getItem('eventos_active_tenant_id');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        if (activeTenantId) {
          headers['X-Tenant-ID'] = activeTenantId;
        }

        let baseURL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!baseURL) {
          if (window.location.hostname.includes('eventosapp.in')) {
            baseURL = 'https://api.eventosapp.in/api/v1';
          } else if (window.location.hostname.includes('onrender.com')) {
            baseURL = 'https://eventos-api-gateway.onrender.com/api/v1';
          } else {
            baseURL = 'http://localhost:8080/api/v1';
          }
        }
        await fetch(`${baseURL}/auth/logout`, {
          method: 'POST',
          headers,
          credentials: 'include',
        }).catch(() => {});
      }
    } finally {
      useAuthStore.getState().clearAuth();
    }
  },
}));
