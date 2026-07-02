import { create } from 'zustand';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
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
  
  setAuth: (accessToken: string, user: UserProfile, activeTenantId: string, memberships: WorkspaceMembership[]) => void;
  updateActiveTenant: (tenantId: string, accessToken: string, role: string, permissions: string[]) => void;
  clearAuth: () => void;
}

// Hydrate initial state from sessionStorage safely on client-side
const getInitialState = () => {
  if (typeof window === 'undefined') {
    return {
      user: null,
      activeTenantId: null,
      memberships: [],
    };
  }
  
  try {
    const user = sessionStorage.getItem('user');
    const activeTenantId = sessionStorage.getItem('activeTenantId');
    const memberships = sessionStorage.getItem('memberships');
    
    return {
      user: user ? JSON.parse(user) : null,
      activeTenantId: activeTenantId || null,
      memberships: memberships ? JSON.parse(memberships) : [],
    };
  } catch (e) {
    return {
      user: null,
      activeTenantId: null,
      memberships: [],
    };
  }
};

const initialState = getInitialState();

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: initialState.user,
  activeTenantId: initialState.activeTenantId,
  memberships: initialState.memberships,
  isAuthenticated: !!initialState.activeTenantId,

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
      // Revoke middleware session cookies
      document.cookie = "hasSession=; Path=/; Max-Age=0; SameSite=Lax";
    }
  },
}));
