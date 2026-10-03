"use client";

import React, { useState, useEffect } from "react";
import { useToastStore, ToastType } from "@/lib/toastStore";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />,
  error: <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />,
  warning: <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />,
  info: <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />,
};

const BADGE_STYLES: Record<ToastType, string> = {
  success: "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400",
  error: "bg-rose-500/15 border border-rose-500/30 text-rose-400",
  warning: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
  info: "bg-sky-500/15 border border-sky-500/30 text-sky-400",
};

const STYLES: Record<ToastType, string> = {
  success: "bg-zinc-950/90 border-emerald-500/30 text-emerald-200 shadow-emerald-950/30",
  error: "bg-zinc-950/90 border-rose-500/30 text-rose-200 shadow-rose-950/30",
  warning: "bg-zinc-950/90 border-amber-500/30 text-amber-200 shadow-amber-950/30",
  info: "bg-zinc-950/90 border-zinc-700/60 text-zinc-200 shadow-black/40",
};

const PROGRESS_COLORS: Record<ToastType, string> = {
  success: "bg-emerald-500",
  error: "bg-rose-500",
  warning: "bg-amber-500",
  info: "bg-sky-500",
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) return null;

  // Show only top 3 latest toasts on screen to prevent mobile clutter
  const visibleToasts = toasts.slice(-3);

  return (
    <div 
      className="fixed top-3 inset-x-3 sm:inset-x-auto sm:top-5 sm:right-5 z-[99999] pointer-events-none flex flex-col items-center sm:items-end gap-2 max-w-md sm:max-w-sm sm:w-full mx-auto"
      role="region"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((toast) => {
          const hasTitle = Boolean(toast.title);

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.92, transition: { duration: 0.18 } }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.x) > 50) {
                  removeToast(toast.id);
                }
              }}
              className={`pointer-events-auto w-full flex flex-col rounded-xl sm:rounded-2xl border backdrop-blur-2xl shadow-xl overflow-hidden select-none touch-pan-y ${STYLES[toast.type]}`}
            >
              <div className={`flex ${hasTitle ? "items-start" : "items-center"} gap-2.5 px-3 py-2.5 sm:px-3.5 sm:py-3`}>
                {/* Compact Circular Icon Badge */}
                <div className={`shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center ${hasTitle ? "mt-0.5" : ""} ${BADGE_STYLES[toast.type]}`}>
                  {ICONS[toast.type]}
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0 pr-1">
                  {hasTitle && (
                    <p className="text-[11px] sm:text-xs font-semibold leading-tight text-white mb-0.5 truncate">
                      {toast.title}
                    </p>
                  )}
                  <p className="text-[11px] sm:text-xs font-medium leading-snug text-zinc-200/90 break-words line-clamp-3">
                    {toast.message}
                  </p>
                  {toast.action && (
                    <button
                      onClick={() => {
                        toast.action?.onClick();
                        removeToast(toast.id);
                      }}
                      className="mt-1.5 text-[10px] sm:text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
                    >
                      {toast.action.label}
                    </button>
                  )}
                </div>

                {/* Dismiss button */}
                <button
                  onClick={() => removeToast(toast.id)}
                  className="shrink-0 p-1 -mr-0.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 active:scale-95 transition-all"
                  aria-label="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Ultra-slim progress bar */}
              {toast.duration && toast.duration > 0 && (
                <div className="h-[2px] w-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: toast.duration / 1000, ease: "linear" }}
                    className={`h-full ${PROGRESS_COLORS[toast.type]}`}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
