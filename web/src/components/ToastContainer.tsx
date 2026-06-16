"use client";

import React from "react";
import { useToastStore } from "@/lib/toastStore";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === "success";
        const isError = toast.type === "error";

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg transition-all duration-300 animate-slide-in
              ${
                isSuccess
                  ? "bg-emerald-950/70 border-emerald-500/30 text-emerald-200"
                  : isError
                  ? "bg-rose-950/70 border-rose-500/30 text-rose-200"
                  : "bg-zinc-900/80 border-zinc-800 text-zinc-200"
              }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle size={18} className="text-emerald-400" />}
              {isError && <AlertCircle size={18} className="text-rose-400" />}
              {!isSuccess && !isError && <Info size={18} className="text-purple-400" />}
            </div>

            <div className="flex-1 text-xs font-semibold leading-relaxed">
              {toast.message}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-zinc-400 hover:text-zinc-200 transition-colors p-0.5 rounded hover:bg-zinc-800"
              aria-label="Close notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
