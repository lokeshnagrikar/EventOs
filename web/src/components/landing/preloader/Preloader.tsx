"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { AnimatedBackground } from "./AnimatedBackground";
import { ParticleField } from "./ParticleField";
import { GlassOrb } from "./GlassOrb";
import { ProgressRing } from "./ProgressRing";
import { LoadingStages } from "./LoadingStages";
import { BootTerminal } from "./BootTerminal";
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
    // Lock scrolling on mount
    document.body.style.overflow = "hidden";

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
            y: "-8%",
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
            className="flex flex-col items-center z-10 max-w-sm w-full px-6 text-center space-y-9"
          >
            {/* Centerpiece Assembly */}
            <div className="relative flex items-center justify-center h-56 w-56">
              
              {/* ORBIT SYSTEM (Rings Layered Behind Orb) */}
              
              {/* Ring 1: solid thin line */}
              <div className="absolute h-[132px] w-[132px] rounded-full border border-white/[0.04] pointer-events-none" />

              {/* Ring 2: dashed rotating ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute h-[168px] w-[168px] rounded-full border border-dashed border-purple-500/10 pointer-events-none"
              />

              {/* Ring 3: glowing gradient arc */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                className="absolute h-[190px] w-[190px] rounded-full border-t border-r border-transparent border-t-cyan-500/20 border-r-pink-500/20 pointer-events-none filter blur-[0.5px]"
              />

              {/* Ring 4: tiny orbit particles */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
                className="absolute h-[220px] w-[220px] rounded-full pointer-events-none"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[3.5px] w-[3.5px] rounded-full bg-cyan-400/40 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3.5px] w-[3.5px] rounded-full bg-pink-400/40 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
              </motion.div>

              {/* SVG Spring Progress Ring */}
              <div className="absolute inset-0 flex items-center justify-center">
                <ProgressRing progress={progress} />
              </div>

              {/* Floating Glass Orb centerpiece */}
              <div className="absolute inset-0 flex items-center justify-center">
                <GlassOrb />
              </div>
            </div>

            {/* Typography Header */}
            <div className="space-y-1.5 pt-1">
              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5, ease: EASE_PREMIUM }}
                className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-purple-100 to-purple-300 drop-shadow-md select-none"
              >
                Event<span className="text-purple-400">OS</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.45 }}
                transition={{ delay: 0.25, duration: 0.5, ease: EASE_PREMIUM }}
                className="text-[8px] text-zinc-400 uppercase tracking-[0.25em] font-black pl-[0.25em]"
              >
                The Operating System for Event Businesses
              </motion.p>
            </div>

            {/* Dynamic Loading Stages */}
            <LoadingStages progress={progress} />

            {/* Live Boot logs console */}
            <BootTerminal progress={progress} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
