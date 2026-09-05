import { create } from "zustand";

export type AuthModalMode = "login" | "register" | "logout" | "waitlist";

interface AuthModalState {
  isOpen: boolean;
  mode: AuthModalMode;
  prefilledEmail?: string;
  isLogoutOpen: boolean;
  openModal: (mode: AuthModalMode, email?: string) => void;
  closeModal: () => void;
  openLogoutModal: () => void;
  closeLogoutModal: () => void;
  setMode: (mode: AuthModalMode) => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  mode: "login",
  prefilledEmail: undefined,
  isLogoutOpen: false,
  openModal: (mode, email) => {
    if (mode === "logout") {
      set({ isLogoutOpen: true });
    } else {
      set({ isOpen: true, mode, prefilledEmail: email });
    }
  },
  closeModal: () => set({ isOpen: false, prefilledEmail: undefined }),
  openLogoutModal: () => set({ isLogoutOpen: true }),
  closeLogoutModal: () => set({ isLogoutOpen: false }),
  setMode: (mode) => set({ mode }),
}));
