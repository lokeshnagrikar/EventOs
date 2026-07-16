import { create } from "zustand";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: ToastAction;
  createdAt: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (
    message: string,
    type?: ToastType,
    options?: { duration?: number; title?: string; action?: ToastAction }
  ) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = "info", options = {}) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = options.duration ?? 4000;
    const toast: Toast = {
      id,
      message,
      type,
      duration,
      title: options.title,
      action: options.action,
      createdAt: Date.now(),
    };

    set((state) => ({
      toasts: [...state.toasts.slice(-4), toast], // keep max 5
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
