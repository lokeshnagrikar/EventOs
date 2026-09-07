"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EventOsLogo } from "@/components/ui/EventOsLogo";
import { useLoadingProgress } from "./useLoadingProgress";

interface PreloaderProps {
  onComplete: () => void;
}

export function Preloader({ onComplete }: PreloaderProps) {
  // Fast, snappy, professional progress curve: 1100ms total
  const { progress, isComplete } = useLoadingProgress(1100);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Lock scrolling on mount
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // When loading completes, brief pause then graceful exit
  useEffect(() => {
    if (isComplete) {
      const delay = setTimeout(() => {
        setIsExiting(true);
      }, 180);

      return () => clearTimeout(delay);
    }
  }, [isComplete]);

  // Trigger onComplete when exit transition ends
  useEffect(() => {
    if (isExiting) {
      const cleanup = setTimeout(() => {
        document.body.style.overflow = "";
        onComplete();
      }, 420);

      return () => clearTimeout(cleanup);
    }
  }, [isExiting, onComplete]);

  return (
    <AnimatePresence mode="wait">
      {!isExiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 0.98,
            transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] }
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#080A11] select-none overflow-hidden"
        >
          {/* Subtle Ambient Radial Light (Pure Luxury Royal Indigo Glow) */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(99,102,241,0.12),transparent_75%)] pointer-events-none" />

          {/* Micro Specular Accent Dots (Subtle Star Dust, zero spiderweb lines) */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:32px_32px] opacity-40 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center justify-center max-w-sm w-full px-6 text-center space-y-6">
            {/* 1. Official EventOS Logo with Crisp Breathing Illumination */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex items-center justify-center py-2"
            >
              <motion.div
                animate={{
                  y: [0, -4, 0],
                  filter: [
                    "drop-shadow(0 0 24px rgba(99,102,241,0.3))",
                    "drop-shadow(0 0 36px rgba(124,58,237,0.45))",
                    "drop-shadow(0 0 24px rgba(99,102,241,0.3))"
                  ]
                }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <EventOsLogo size={92} animated={true} />
              </motion.div>
            </motion.div>

            {/* 2. Authoritative, Clean Brand Typography */}
            <div className="space-y-1.5">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-sans">
                EventOS
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-[0.25em] font-medium font-mono pl-[0.25em]">
                The Operating System for Event Businesses
              </p>
            </div>

            {/* 3. High-Precision Hairline Progress Indicator */}
            <div className="space-y-2.5 pt-2 flex flex-col items-center">
              <div className="w-36 h-[2px] bg-white/[0.08] rounded-full overflow-hidden relative shadow-[0_0_12px_rgba(99,102,241,0.3)]">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 transition-all duration-150 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <span className="font-mono text-[9.5px] text-slate-500 font-bold select-none tracking-widest">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
