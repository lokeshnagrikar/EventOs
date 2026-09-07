"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { EventOsLogo } from "@/components/ui/EventOsLogo";

interface ProcessingLoaderProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  progress?: number;
  statusText?: string;
  type?: "pdf" | "export" | "payment" | "ai" | "default";
}

export default function ProcessingLoader({
  isOpen,
  title = "Processing Workspace Request...",
  subtitle = "EventOS services are processing your operation.",
  progress,
  statusText = "Synchronizing database records...",
  type = "default"
}: ProcessingLoaderProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl font-sans select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-sm bg-[#0B0F19]/95 border border-white/[0.1] rounded-3xl p-7 text-center shadow-[0_30px_90px_rgba(0,0,0,0.85),0_0_30px_rgba(99,102,241,0.15)] overflow-hidden space-y-6"
        >
          {/* Top Subtle Specular Highlight */}
          <div className="absolute top-0 inset-x-6 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent pointer-events-none" />

          {/* Minimalist Dual-Ring Spinner with EventOS Logo */}
          <div className="relative flex items-center justify-center mx-auto my-2">
            <div className="relative w-20 h-20 flex items-center justify-center">
              {/* Outer Smooth Indigo Track */}
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
              
              {/* Spinning High-Speed Arc */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 border-r-indigo-400/60"
              />

              {/* Center Logo */}
              <div className="relative z-10 flex items-center justify-center">
                <EventOsLogo size={36} animated={false} />
              </div>
            </div>
          </div>

          {/* Clean Enterprise Typography */}
          <div className="space-y-1.5">
            <h3 className="text-base font-black text-white tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto font-medium">
              {subtitle}
            </p>
          </div>

          {/* Progress Bar (Optional) */}
          {typeof progress === "number" && (
            <div className="space-y-1.5 font-mono text-[10px]">
              <div className="flex justify-between font-bold text-slate-400">
                <span className="tracking-wider">PROGRESS</span>
                <span className="text-indigo-400">{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/[0.06] border border-white/[0.08] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {/* Live Status Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10.5px] font-medium text-slate-300 shadow-inner">
            <Loader2 size={12} className="animate-spin text-indigo-400" />
            <span className="font-mono text-indigo-300/90">{statusText}</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
