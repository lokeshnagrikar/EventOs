import { create } from 'zustand';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  role: string;
  permissions: string[];
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
  refreshToken: string | null;
  user: UserProfile | null;
  activeTenantId: string | null;
  memberships: WorkspaceMembership[];
  isAuthenticated: boolean;
  
  initializeAuth: () => void;
  setAuth: (accessToken: string, user: UserProfile, activeTenantId: string, memberships: WorkspaceMembership[], refreshToken?: string | null) => void;
  updateActiveTenant: (tenantId: string, accessToken: string, role: string, permissions: string[], refreshToken?: string | null) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  activeTenantId: null,
  memberships: [],
  isAuthenticated: false,

  initializeAuth: () => {
    if (typeof window === 'undefined') return;
    try {
      const accessToken = sessionStorage.getItem('accessToken') || localStorage.getItem('eventos_access_token');
      const refreshToken = sessionStorage.getItem('refreshToken') || localStorage.getItem('eventos_refresh_token');
      const user = sessionStorage.getItem('user') || localStorage.getItem('eventos_user_profile');
      const activeTenantId = sessionStorage.getItem('activeTenantId') || localStorage.getItem('eventos_active_tenant_id');
      const memberships = sessionStorage.getItem('memberships') || localStorage.getItem('eventos_memberships');
      
      if (accessToken && activeTenantId) {
        set({
          accessToken,
          refreshToken: refreshToken || null,
          user: user ? JSON.parse(user) : null,
          activeTenantId: activeTenantId,
          memberships: memberships ? JSON.parse(memberships) : [],
          isAuthenticated: true,
        });
      } else if (activeTenantId) {
        set({
          accessToken: accessToken || null,
          refreshToken: refreshToken || null,
          user: user ? JSON.parse(user) : null,
          activeTenantId: activeTenantId,
          memberships: memberships ? JSON.parse(memberships) : [],
          isAuthenticated: !!accessToken,
        });
      }
    } catch (e) {
      console.error("Failed to initialize auth from storage", e);
    }
  },

  setAuth: (accessToken, user, activeTenantId, memberships, refreshToken = null) => {
    set({
      accessToken,
      refreshToken,
      user,
      activeTenantId,
      memberships,
      isAuthenticated: true,
    });
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('accessToken', accessToken);
      localStorage.setItem('eventos_access_token', accessToken);
      if (refreshToken) {
        sessionStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('eventos_refresh_token', refreshToken);
      }
      sessionStorage.setItem('activeTenantId', activeTenantId);
      localStorage.setItem('eventos_active_tenant_id', activeTenantId);
      sessionStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('eventos_user_profile', JSON.stringify(user));
      sessionStorage.setItem('memberships', JSON.stringify(memberships));
      localStorage.setItem('eventos_memberships', JSON.stringify(memberships));
      
      // Cookie for SSR / Middleware
      document.cookie = `hasSession=true; Path=/; Max-Age=604800; SameSite=Lax`;
      document.cookie = `accessToken=${accessToken}; Path=/; Max-Age=3600; SameSite=Lax`;
    }
  },

  updateActiveTenant: (tenantId, accessToken, role, permissions, refreshToken = null) => {
    set((state) => {
      const updatedUser = state.user ? { ...state.user, role, permissions } : null;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('accessToken', accessToken);
        localStorage.setItem('eventos_access_token', accessToken);
        if (refreshToken) {
          sessionStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('eventos_refresh_token', refreshToken);
        }
        sessionStorage.setItem('activeTenantId', tenantId);
        localStorage.setItem('eventos_active_tenant_id', tenantId);
        if (updatedUser) {
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
          localStorage.setItem('eventos_user_profile', JSON.stringify(updatedUser));
        }
        document.cookie = `hasSession=true; Path=/; Max-Age=604800; SameSite=Lax`;
        document.cookie = `accessToken=${accessToken}; Path=/; Max-Age=3600; SameSite=Lax`;
      }
      return {
        accessToken,
        refreshToken: refreshToken || state.refreshToken,
        activeTenantId: tenantId,
        user: updatedUser,
        isAuthenticated: true,
      };
    });
  },

  setRefreshToken: (refreshToken) => {
    set({ refreshToken });
    if (typeof window !== 'undefined' && refreshToken) {
      sessionStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('eventos_refresh_token', refreshToken);
    }
  },

  clearAuth: () => {
    set({
      accessToken: null,
      refreshToken: null,
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
      document.cookie = "hasSession=; Path=/; Max-Age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "user_role=; Path=/; Max-Age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "user_name=; Path=/; Max-Age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "accessToken=; Path=/; Max-Age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  },
}));
