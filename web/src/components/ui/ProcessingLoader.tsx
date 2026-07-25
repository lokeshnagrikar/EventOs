"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  subtitle = "EventOS microservices are processing your request.",
  progress,
  statusText = "Syncing multi-tenant database...",
  type = "default"
}: ProcessingLoaderProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl font-sans selection:bg-purple-600/30">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          className="relative w-full max-w-sm bg-[#09090b]/90 border border-purple-500/30 rounded-3xl p-7 text-center shadow-[0_25px_80px_rgba(0,0,0,0.9),0_0_40px_rgba(139,92,246,0.15)] overflow-hidden space-y-5"
        >
          {/* Top Line Accent */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500" />

          {/* SVG Animated Reactor / Loader */}
          <div className="relative flex items-center justify-center mx-auto my-2">
            <svg className="w-24 h-24" viewBox="0 0 100 100" fill="none">
              {/* Outer Pulsing Ring */}
              <circle cx="50" cy="50" r="42" stroke="url(#reactor_grad)" strokeWidth="2.5" strokeDasharray="6 6">
                <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="8s" repeatCount="indefinite" />
              </circle>
              {/* Inner Orbiting Arc */}
              <circle cx="50" cy="50" r="32" stroke="#A855F7" strokeWidth="3" strokeLinecap="round" strokeDasharray="40 160">
                <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="1.8s" repeatCount="indefinite" />
              </circle>
              {/* Core Symbol */}
              <circle cx="50" cy="50" r="20" fill="#18181B" stroke="#EC4899" strokeWidth="1.5" />
              <defs>
                <linearGradient id="reactor_grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#A855F7" />
                  <stop offset="0.5" stopColor="#EC4899" />
                  <stop offset="1" stopColor="#38BDF8" />
                </linearGradient>
              </defs>
            </svg>

            {/* Core Icon Overlay */}
            <div className="absolute inset-0 flex items-center justify-center text-purple-400">
              <Sparkles size={18} className="animate-pulse text-cyan-400" />
            </div>
          </div>

          {/* Labels */}
          <div className="space-y-1.5">
            <h3 className="text-base font-black text-white tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
              {subtitle}
            </p>
          </div>

          {/* Progress Bar (Optional) */}
          {typeof progress === "number" && (
            <div className="space-y-1 font-mono text-[9.5px]">
              <div className="flex justify-between font-bold text-zinc-400">
                <span>PROGRESS</span>
                <span className="text-purple-400 font-mono">{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {/* Live Status Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-[10px] font-bold text-zinc-300">
            <Loader2 size={11} className="animate-spin text-purple-400" />
            <span className="font-mono text-purple-300">{statusText}</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
