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
  user: UserProfile | null;
  activeTenantId: string | null;
  memberships: WorkspaceMembership[];
  isAuthenticated: boolean;
  
  initializeAuth: () => void;
  setAuth: (accessToken: string, user: UserProfile, activeTenantId: string, memberships: WorkspaceMembership[]) => void;
  updateActiveTenant: (tenantId: string, accessToken: string, role: string, permissions: string[]) => void;
  clearAuth: () => void;
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
      const user = sessionStorage.getItem('user');
      const activeTenantId = sessionStorage.getItem('activeTenantId');
      const memberships = sessionStorage.getItem('memberships');
      
      if (activeTenantId) {
        set({
          user: user ? JSON.parse(user) : null,
          activeTenantId: activeTenantId,
          memberships: memberships ? JSON.parse(memberships) : [],
          isAuthenticated: true,
        });
      }
    } catch (e) {
      console.error("Failed to initialize auth from session storage", e);
    }
  },

  setAuth: (accessToken, user, activeTenantId, memberships) => {
    set({
      accessToken,
      user,
      activeTenantId,
      memberships,
      isAuthenticated: true,
    });
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('activeTenantId', activeTenantId);
      sessionStorage.setItem('user', JSON.stringify(user));
      sessionStorage.setItem('memberships', JSON.stringify(memberships));
    }
  },

  updateActiveTenant: (tenantId, accessToken, role, permissions) => {
    set((state) => {
      const updatedUser = state.user ? { ...state.user, role, permissions } : null;
      if (typeof window !== 'undefined' && updatedUser) {
        sessionStorage.setItem('activeTenantId', tenantId);
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
      }
      return {
        accessToken,
        activeTenantId: tenantId,
        user: updatedUser,
        isAuthenticated: true,
      };
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
      // Revoke middleware session cookies and stored profiles
      document.cookie = "hasSession=; Path=/; Max-Age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "user_role=; Path=/; Max-Age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "user_name=; Path=/; Max-Age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "accessToken=; Path=/; Max-Age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_role");
      localStorage.removeItem("eventos_last_user");
    }
  },
}));
