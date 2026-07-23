"use client";

import React, { useState, useEffect } from "react";
import { useToastStore, ToastType } from "@/lib/toastStore";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={16} className="text-emerald-400" />,
  error: <AlertCircle size={16} className="text-rose-400" />,
  warning: <AlertTriangle size={16} className="text-amber-400" />,
  info: <Info size={16} className="text-purple-400" />,
};

const STYLES: Record<ToastType, string> = {
  success: "bg-emerald-950/80 border-emerald-500/25 text-emerald-200",
  error: "bg-rose-950/80 border-rose-500/25 text-rose-200",
  warning: "bg-amber-950/80 border-amber-500/25 text-amber-200",
  info: "bg-zinc-900/90 border-zinc-700/50 text-zinc-200",
};

const PROGRESS_COLORS: Record<ToastType, string> = {
  success: "bg-emerald-500",
  error: "bg-rose-500",
  warning: "bg-amber-500",
  info: "bg-purple-500",
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch — render nothing on server
  if (!mounted) return null;

  return (
    <div className="fixed top-16 right-6 z-[999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`pointer-events-auto flex flex-col rounded-xl border backdrop-blur-xl shadow-2xl shadow-black/20 overflow-hidden ${STYLES[toast.type]}`}
          >
            <div className="flex items-start gap-3 p-3.5">
              <div className="shrink-0 mt-0.5">{ICONS[toast.type]}</div>

              <div className="flex-1 min-w-0">
                {toast.title && (
                  <p className="text-[11px] font-bold leading-tight mb-0.5 truncate">
                    {toast.title}
                  </p>
                )}
                <p className="text-[11px] font-medium leading-relaxed opacity-90">
                  {toast.message}
                </p>
                {toast.action && (
                  <button
                    onClick={() => {
                      toast.action?.onClick();
                      removeToast(toast.id);
                    }}
                    className="mt-1.5 text-[10px] font-bold underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity"
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-zinc-400 hover:text-zinc-200 transition-colors p-0.5 rounded hover:bg-white/5"
                aria-label="Dismiss notification"
              >
                <X size={13} />
              </button>
            </div>

            {/* Progress bar */}
            {toast.duration && toast.duration > 0 && (
              <div className="h-[2px] w-full bg-white/5">
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: toast.duration / 1000, ease: "linear" }}
                  className={`h-full ${PROGRESS_COLORS[toast.type]}`}
                />
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
