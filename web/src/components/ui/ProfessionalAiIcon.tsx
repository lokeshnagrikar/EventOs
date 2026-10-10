"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ProfessionalAiIconProps {
  className?: string;
  size?: number;
  animated?: boolean;
  showGlow?: boolean;
  showLiveDot?: boolean;
  variant?: "standalone" | "launcher" | "header" | "avatar";
}

/**
 * ProfessionalAiIcon
 * A modern, enterprise-grade AI Copilot vector icon inspired by Apple Intelligence,
 * Linear AI, and OpenAI. Uses mathematical astroid/hypocycloid geometry with
 * multi-stop iridescent gradients, luminous depth, and subtle micro-animations.
 */
export function ProfessionalAiIcon({
  className,
  size = 24,
  animated = true,
  showGlow = false,
  showLiveDot = false,
  variant = "standalone",
}: ProfessionalAiIconProps) {
  // SVG Icon Core
  const renderSvg = (svgSize: number) => (
    <svg
      width={svgSize}
      height={svgSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 overflow-visible"
    >
      <defs>
        {/* Core Vibrant Gradient */}
        <linearGradient id="eventos-ai-grad-core" x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor="#C084FC" />   {/* purple-400 */}
          <stop offset="35%" stopColor="#818CF8" />  {/* indigo-400 */}
          <stop offset="70%" stopColor="#38BDF8" />  {/* sky-400 */}
          <stop offset="100%" stopColor="#A855F7" /> {/* purple-500 */}
        </linearGradient>

        {/* Ambient Radial Core Light */}
        <radialGradient id="eventos-ai-radial-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="30%" stopColor="#E9D5FF" stopOpacity="0.6" />
          <stop offset="70%" stopColor="#818CF8" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
        </radialGradient>

        {/* Satellite Micro Spark Gradient */}
        <linearGradient id="eventos-ai-sat-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />  {/* sky-400 */}
          <stop offset="100%" stopColor="#F472B6" /> {/* pink-400 */}
        </linearGradient>

        {/* Specular Edge Highlight */}
        <linearGradient id="eventos-ai-specular" x1="30%" y1="15%" x2="70%" y2="85%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#A855F7" stopOpacity="0.5" />
        </linearGradient>

        {/* Drop shadow filter for depth */}
        <filter id="eventos-ai-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#8B5CF6" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Background Soft Glow Disc */}
      <circle
        cx="50"
        cy="50"
        r="32"
        fill="url(#eventos-ai-radial-glow)"
        className="pointer-events-none"
      />

      {/* Main 4-Point AI Astroid Star */}
      <path
        d="M 50 8 
           C 50 31.5 31.5 50 8 50 
           C 31.5 50 50 68.5 50 92 
           C 50 68.5 68.5 50 92 50 
           C 68.5 50 50 31.5 50 8 Z"
        fill="url(#eventos-ai-grad-core)"
        filter="url(#eventos-ai-shadow)"
      />

      {/* Precision Inner Facet Shimmer */}
      <path
        d="M 50 14 
           C 50 33.5 33.5 50 14 50 
           C 33.5 50 50 66.5 50 86 
           C 50 66.5 66.5 50 86 50 
           C 66.5 50 50 33.5 50 14 Z"
        fill="none"
        stroke="url(#eventos-ai-specular)"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Center Radiant Core Diamond */}
      <polygon
        points="50,42 58,50 50,58 42,50"
        fill="#FFFFFF"
        opacity="0.95"
      />

      {/* Top-Right Satellite Spark */}
      <path
        d="M 76 16 
           C 76 22.5 71 27.5 64.5 27.5 
           C 71 27.5 76 32.5 76 39 
           C 76 32.5 81 27.5 87.5 27.5 
           C 81 27.5 76 22.5 76 16 Z"
        fill="url(#eventos-ai-sat-grad)"
        opacity="0.9"
      />

      {/* Bottom-Left Micro Spark */}
      <path
        d="M 23 68 
           C 23 72.5 19.5 76 15 76 
           C 19.5 76 23 79.5 23 84 
           C 23 79.5 26.5 76 31 76 
           C 26.5 76 23 72.5 23 68 Z"
        fill="url(#eventos-ai-sat-grad)"
        opacity="0.8"
      />
    </svg>
  );

  // 1. Standalone raw icon
  if (variant === "standalone") {
    return (
      <div className={cn("relative inline-flex items-center justify-center select-none", className)}>
        {showGlow && (
          <div
            className="absolute inset-0 rounded-full blur-md -z-10 pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(56,189,248,0.2) 60%, transparent 80%)",
            }}
          />
        )}
        {renderSvg(size)}
      </div>
    );
  }

  // 2. Avatar Variant for chat messages & typing bubbles
  if (variant === "avatar") {
    return (
      <div
        className={cn(
          "relative h-7 w-7 rounded-xl flex items-center justify-center shrink-0 overflow-hidden",
          "bg-gradient-to-br from-purple-500/20 via-indigo-500/15 to-cyan-500/15",
          "border border-purple-400/30 dark:border-purple-400/20 shadow-[0_2px_10px_rgba(124,58,237,0.25)]",
          className
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/10 via-transparent to-white/10 pointer-events-none" />
        {renderSvg(16)}
      </div>
    );
  }

  // 3. Header Variant for Assistant drawer top bar
  if (variant === "header") {
    return (
      <div
        className={cn(
          "relative h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
          "bg-gradient-to-br from-[#1e1b4b]/90 via-[#0f172a]/90 to-[#18181b]/90",
          "border border-purple-400/40 shadow-[0_4px_16px_rgba(147,51,234,0.3)]",
          className
        )}
      >
        <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-purple-500/30 via-cyan-400/20 to-pink-500/30 blur-xs -z-10" />
        {renderSvg(20)}
      </div>
    );
  }

  // 4. Launcher Variant for the main floating Trigger Button Orb
  const orbSize = size || 44;
  return (
    <div
      style={{ width: orbSize, height: orbSize }}
      className={cn(
        "relative rounded-full flex items-center justify-center shrink-0 select-none",
        "bg-gradient-to-tr from-[#160e33] via-[#101432] to-[#0c1328]",
        "border border-purple-400/40 shadow-[0_4px_20px_rgba(147,51,234,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]",
        "group-hover:border-purple-300/70 group-hover:shadow-[0_6px_25px_rgba(147,51,234,0.55)]",
        "transition-all duration-300",
        className
      )}
    >
      {/* Ambient Pulsing Aura */}
      {showGlow && (
        <motion.div
          className="absolute -inset-1.5 rounded-full filter blur-md -z-10 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity"
          style={{
            background:
              "radial-gradient(circle, rgba(168,85,247,0.55) 0%, rgba(99,102,241,0.35) 45%, rgba(6,182,212,0.2) 75%, transparent 100%)",
          }}
          animate={
            animated
              ? {
                  scale: [1, 1.1, 1],
                  opacity: [0.55, 0.8, 0.55],
                }
              : undefined
          }
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Rotating Conic Rim Sheen */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity"
        style={{
          background:
            "conic-gradient(from 180deg at 50% 50%, rgba(168,85,247,0.4) 0deg, rgba(6,182,212,0.4) 120deg, rgba(236,72,153,0.4) 240deg, rgba(168,85,247,0.4) 360deg)",
          maskImage: "radial-gradient(circle, transparent 70%, black 72%)",
          WebkitMaskImage: "radial-gradient(circle, transparent 70%, black 72%)",
        }}
      />

      {/* Centered AI Icon Core */}
      <motion.div
        className="relative z-10 flex items-center justify-center"
        whileHover={animated ? { rotate: [0, -8, 8, 0], scale: 1.08 } : undefined}
        transition={{ duration: 0.5 }}
      >
        {renderSvg(Math.round(orbSize * 0.55))}
      </motion.div>

      {/* Live Status Indicator Dot */}
      {showLiveDot && (
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#0c1024] shadow-[0_0_8px_rgba(52,211,153,0.95)]">
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
        </span>
      )}
    </div>
  );
}

export default ProfessionalAiIcon;
