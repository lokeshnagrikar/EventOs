"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { EASE_PREMIUM } from "./animations";

interface ProgressRingProps {
  progress: number;
}

export const ProgressRing = React.memo(function ProgressRing({ progress }: ProgressRingProps) {
  const radius = 64;
  const strokeWidth = 2.5;
  const size = 144;
  
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);
  const strokeDashoffset = useMemo(() => {
    return circumference * (1 - progress / 100);
  }, [progress, circumference]);

  const isComplete = progress >= 100;

  return (
    <div className="relative flex items-center justify-center pointer-events-none" style={{ width: size, height: size }}>
      {/* SVG Ring Container */}
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
          
          {/* Radial Glow Filter for 100% completion pulse */}
          <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.02)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress Circle (Spring Animated Offset) */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ 
            strokeDashoffset,
            scale: isComplete ? [1, 1.03, 1] : 1
          }}
          style={{
            filter: isComplete ? "url(#glowFilter) drop-shadow(0px 0px 8px rgba(168,85,247,0.7))" : "drop-shadow(0px 0px 4px rgba(168,85,247,0.3))"
          }}
          transition={{
            strokeDashoffset: { type: "spring", stiffness: 60, damping: 14 },
            scale: { duration: 0.6, ease: EASE_PREMIUM }
          }}
        />
      </svg>

      {/* Percentage Display Inside Ring (placed below the central Orb layout via absolute overlay) */}
      <div className="absolute bottom-3 font-mono text-[9px] font-bold text-zinc-400 tracking-wider flex items-center justify-center z-20">
        <motion.span
          animate={{ scale: isComplete ? [1, 1.1, 1] : 1 }}
          transition={{ duration: 0.3 }}
        >
          {Math.round(progress)}%
        </motion.span>
      </div>
    </div>
  );
});
