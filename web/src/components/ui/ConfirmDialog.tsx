"use client";

import React, { useEffect, useRef } from "react";
import { AlertTriangle, LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  icon?: LucideIcon;
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  icon: Icon = AlertTriangle,
  isLoading = false,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap & escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Auto-focus cancel button for safety
    setTimeout(() => confirmRef.current?.focus(), 50);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const isDestructive = variant === "destructive";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[998] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby={description ? "confirm-dialog-desc" : undefined}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          >
            <div className="w-full max-w-[380px] bg-zinc-900/95 border border-zinc-800/80 rounded-2xl shadow-2xl shadow-black/40 backdrop-blur-xl overflow-hidden">
              {/* Accent line */}
              <div
                className={cn(
                  "h-[2px]",
                  isDestructive
                    ? "bg-gradient-to-r from-red-500 via-rose-500 to-transparent"
                    : "bg-gradient-to-r from-purple-500 via-pink-500 to-transparent"
                )}
              />

              <div className="p-5 space-y-4">
                {/* Icon + Text */}
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "shrink-0 h-10 w-10 rounded-xl border flex items-center justify-center",
                      isDestructive
                        ? "bg-red-500/10 border-red-500/20 text-red-400"
                        : "bg-purple-500/10 border-purple-500/20 text-purple-400"
                    )}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      id="confirm-dialog-title"
                      className="text-sm font-bold text-zinc-100"
                    >
                      {title}
                    </h3>
                    {description && (
                      <p
                        id="confirm-dialog-desc"
                        className="text-[11px] text-zinc-400 leading-relaxed mt-1"
                      >
                        {description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="px-3.5 py-2 text-[11px] font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  >
                    {cancelLabel}
                  </button>
                  <button
                    ref={confirmRef}
                    type="button"
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
                      isDestructive
                        ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/15"
                        : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-600/15"
                    )}
                  >
                    {isLoading && (
                      <svg
                        className="animate-spin h-3 w-3"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    )}
                    {confirmLabel}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
