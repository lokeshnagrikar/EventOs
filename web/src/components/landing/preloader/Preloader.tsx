"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { AnimatedBackground } from "./AnimatedBackground";
import { ParticleField } from "./ParticleField";
import { GlassOrb } from "./GlassOrb";
import { ProgressRing } from "./ProgressRing";
import { useLoadingProgress } from "./useLoadingProgress";
import { EASE_PREMIUM } from "./animations";

interface PreloaderProps {
  onComplete: () => void;
}

export function Preloader({ onComplete }: PreloaderProps) {
  const { progress, isComplete } = useLoadingProgress(2800); // 2.8s target loading time
  const [isExiting, setIsExiting] = useState(false);

  // Mouse Parallax coordinates (Framer Motion values for 60fps)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Parallax transform limited to 8px
  const parallaxX = useTransform(mouseX, [-400, 400], [-8, 8]);
  const parallaxY = useTransform(mouseY, [-400, 400], [-8, 8]);

  useEffect(() => {
    // Lock scrolling and force top on mount
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);

    const isMouseDevice = window.matchMedia("(pointer: fine)").matches;

    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      mouseX.set(e.clientX - centerX);
      mouseY.set(e.clientY - centerY);
    };

    if (isMouseDevice) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      if (isMouseDevice) {
        window.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, [mouseX, mouseY]);

  // Handle post-loading delay and exit trigger
  useEffect(() => {
    if (isComplete) {
      const delay = setTimeout(() => {
        setIsExiting(true);
      }, 700); // Allow complete state to be seen for 700ms

      return () => clearTimeout(delay);
    }
  }, [isComplete]);

  // Cleanup body scroll on exit complete
  useEffect(() => {
    if (isExiting) {
      const cleanup = setTimeout(() => {
        document.body.style.overflow = "";
        onComplete();
      }, 850); // Wait for transition out to finish

      return () => clearTimeout(cleanup);
    }
  }, [isExiting, onComplete]);



  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.8, ease: EASE_PREMIUM }
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#09090B] select-none overflow-hidden"
        >
          {/* Cinematic Animated Background Mesh */}
          <AnimatedBackground />

          {/* Drifting Particle Field */}
          <ParticleField />

          {/* Parallax Container holding the UI layout */}
          <motion.div
            style={{ x: parallaxX, y: parallaxY }}
            exit={{
              scale: 2.5,
              opacity: 0,
              filter: "blur(10px)",
              transition: { duration: 0.75, ease: EASE_PREMIUM }
            }}
            className="flex flex-col items-center justify-center z-10 max-w-sm w-full px-6 text-center space-y-7"
          >
            {/* 1. Large Brand Mark Silhouette with Shimmer Effect */}
            <div className="relative flex flex-col items-center gap-4">
              
              {/* Floating Sparkles Icon Silhouette */}
              <motion.div
                animate={{ 
                  y: [0, -6, 0],
                  filter: ["drop-shadow(0 0 10px rgba(168,85,247,0.25))", "drop-shadow(0 0 20px rgba(236,72,153,0.45))", "drop-shadow(0 0 10px rgba(168,85,247,0.25))"]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-500 to-cyan-500 flex items-center justify-center text-white shadow-xl relative overflow-hidden"
              >
                {/* Diagonal shine line sweeping on the icon */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent w-[40%] -skew-x-12"
                  style={{
                    left: `${(progress * 1.5) - 40}%`
                  }}
                />
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 3v18M3 12h18M12 3l3.5 5.5L21 12l-5.5 3.5L12 21l-3.5-5.5L3 12l5.5-3.5L12 3z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>

              {/* Shimmering Text Logo */}
              <div className="space-y-1">
                <h1 
                  className="text-4xl font-black tracking-tighter bg-clip-text text-transparent select-none bg-gradient-to-r from-[#18181b] via-purple-300 via-pink-300 via-cyan-300 to-[#18181b] bg-[length:200%_auto] transition-all"
                  style={{
                    backgroundPositionX: `${100 - progress}%`
                  }}
                >
                  EventOS
                </h1>
                <p className="text-[8px] text-zinc-500 uppercase tracking-[0.25em] font-black pl-[0.25em]">
                  The Operating System for Event Businesses
                </p>
              </div>
            </div>

            {/* 2. Minimalist Monospace Progress Value */}
            <div className="space-y-2 pt-1 flex flex-col items-center">
              <span className="font-mono text-[9px] text-zinc-500 font-bold select-none tracking-wider">
                {Math.round(progress)}%
              </span>
              
              <div className="w-24 h-[1px] bg-white/[0.04] rounded-full overflow-hidden relative">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
