import { create } from "zustand";

export type AuthModalMode = "login" | "register";

interface AuthModalState {
  isOpen: boolean;
  mode: AuthModalMode;
  prefilledEmail?: string;
  openModal: (mode: AuthModalMode, email?: string) => void;
  closeModal: () => void;
  setMode: (mode: AuthModalMode) => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  mode: "login",
  prefilledEmail: undefined,
  openModal: (mode, email) => set({ isOpen: true, mode, prefilledEmail: email }),
  closeModal: () => set({ isOpen: false, prefilledEmail: undefined }),
  setMode: (mode) => set({ mode }),
}));
