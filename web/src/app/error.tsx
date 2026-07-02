"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring or console in production
    console.error("[GlobalError Boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full bg-[#09090B] text-zinc-100 flex items-center justify-center p-4 overflow-hidden relative selection:bg-purple-600/35 selection:text-white">
      {/* Decorative radial gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(#1c1917_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-15 pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-550/10 blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="w-full max-w-[440px] z-10 relative">
        <div className="bg-white/[0.01] border border-white/[0.08] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.3)] shadow-purple-500/[0.03] backdrop-blur-xl p-6 sm:p-8 relative overflow-hidden transition-all duration-300">
          {/* Top Line Accent */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-red-500 via-purple-650 to-pink-500 opacity-90" />

          <div className="text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 select-none">
              <AlertOctagon size={22} className="animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-450">
                Application Error
              </h2>
              <p className="text-[11px] text-zinc-450 leading-relaxed max-w-[280px] mx-auto">
                An unexpected runtime crash occurred. EventOS safe-guards have recovered your session.
              </p>
            </div>

            {error.message && (
              <div className="p-3 bg-zinc-950/70 border border-zinc-850 rounded-xl text-left font-mono text-[9px] text-zinc-400 break-all max-h-24 overflow-y-auto scrollbar-none">
                <span className="text-red-400/80 font-bold block mb-1">LOG DETAIL:</span>
                {error.message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-850">
              <button
                onClick={() => reset()}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 rounded-xl text-xs font-bold border border-zinc-700/50 cursor-pointer transition-colors active:scale-[0.98]"
              >
                <RotateCcw size={12} />
                Try Again
              </button>
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors active:scale-[0.98]"
              >
                <Home size={12} />
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
