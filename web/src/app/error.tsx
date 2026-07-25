"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, Home, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError Boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full bg-[#09090B] text-zinc-100 flex items-center justify-center p-6 overflow-hidden relative selection:bg-purple-600/35 selection:text-white font-sans">
      {/* Background Radial & Grid Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-950/15 blur-[140px] rounded-full pointer-events-none z-0" />

      <div className="w-full max-w-md z-10 relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-zinc-950/60 border border-red-500/30 rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.8),0_0_40px_rgba(239,68,68,0.1)] backdrop-blur-2xl p-8 relative overflow-hidden text-center space-y-6"
        >
          {/* Top Line Accent */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-red-500 via-purple-600 to-pink-500" />

          {/* SVG Vector Illustration for Error */}
          <div className="relative flex items-center justify-center mx-auto my-2">
            <svg className="w-32 h-32" viewBox="0 0 140 140" fill="none">
              <circle cx="70" cy="70" r="56" fill="url(#err_bg)" fillOpacity="0.15" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4 4" />
              {/* Shield Hexagon */}
              <path d="M70 34L100 48V76C100 94 70 106 70 106C70 106 40 94 40 76V48L70 34Z" fill="#450A0A" stroke="#F87171" strokeWidth="2" />
              <path d="M70 54V74" stroke="#FCA5A5" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="70" cy="84" r="2.5" fill="#FCA5A5" />
              <defs>
                <radialGradient id="err_bg" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(70 70) scale(56)">
                  <stop stopColor="#EF4444" />
                  <stop offset="1" stopColor="#09090B" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-red-950/60 border border-red-500/30 text-red-400 inline-block font-mono">
              System Boundary Handled
            </span>
            <h1 className="text-2xl font-black tracking-tight text-white font-heading">
              Application Error
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto font-semibold">
              An unexpected runtime error occurred. EventOS safeguards have preserved your workspace session.
            </p>
          </div>

          {error.message && (
            <div className="p-3 bg-zinc-950/80 border border-zinc-850 rounded-xl text-left font-mono text-[9.5px] text-zinc-400 break-all max-h-24 overflow-y-auto scrollbar-none">
              <span className="text-red-400 font-bold block mb-1">TRACE ERROR:</span>
              {error.message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-900">
            <button
              onClick={() => reset()}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-red-500/20 active:scale-95 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Retry Session</span>
            </button>
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 rounded-xl text-xs font-extrabold transition-all active:scale-95 cursor-pointer"
            >
              <Home size={14} />
              <span>Go Dashboard</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
