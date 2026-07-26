"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { AnimatedBackground } from "./AnimatedBackground";
import { ParticleField } from "./ParticleField";
import { GlassOrb } from "./GlassOrb";
import { ProgressRing } from "./ProgressRing";
import { useLoadingProgress } from "./useLoadingProgress";
import { EASE_PREMIUM } from "./animations";

import { EventOsLogo } from "@/components/ui/EventOsLogo";

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
    <AnimatePresence mode="wait">
      {!isExiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.95, ease: [0.7, 0, 0.2, 1] }
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
              scale: 4.5,
              opacity: 0,
              filter: "blur(14px)",
              transition: { duration: 0.9, ease: [0.7, 0, 0.2, 1] }
            }}
            className="flex flex-col items-center justify-center z-10 max-w-sm w-full px-6 text-center space-y-7"
          >
            {/* 1. Large Brand Mark Silhouette with Shimmer Effect */}
            <div className="relative flex flex-col items-center gap-4">
              
              {/* Transparent Floating EventOS Monogram Logo */}
              <motion.div
                animate={{ 
                  y: [0, -8, 0],
                  filter: [
                    "drop-shadow(0 0 20px rgba(168,85,247,0.4)) drop-shadow(0 0 40px rgba(236,72,153,0.25))",
                    "drop-shadow(0 0 35px rgba(236,72,153,0.65)) drop-shadow(0 0 60px rgba(168,85,247,0.4))",
                    "drop-shadow(0 0 20px rgba(168,85,247,0.4)) drop-shadow(0 0 40px rgba(236,72,153,0.25))"
                  ]
                }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="relative flex items-center justify-center py-2"
              >
                <EventOsLogo size={105} animated={true} />
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
