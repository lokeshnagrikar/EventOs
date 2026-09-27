"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShinyButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  borderRadius?: string;
}

export function ShinyButton({
  children,
  onClick,
  className = "",
  borderRadius = "1rem",
}: ShinyButtonProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.025 }}
      whileTap={{ scale: 0.975 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
      onClick={onClick}
      className={cn(
        "group relative isolate overflow-hidden px-8 py-4 font-black transition-all duration-300 cursor-pointer select-none",
        "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white",
        "shadow-xl shadow-purple-600/35 hover:shadow-2xl hover:shadow-purple-600/60",
        "border border-white/25 hover:border-white/40 active:border-white/50",
        className
      )}
      style={{
        borderRadius,
      }}
    >
      {/* 1. Animated Shimmer Light Beam (Framer Motion infinite sweep) */}
      <motion.span
        aria-hidden="true"
        animate={{
          x: ["-180%", "260%"],
        }}
        transition={{
          repeat: Infinity,
          duration: 2.4,
          ease: "easeInOut",
          repeatDelay: 0.6,
        }}
        className="pointer-events-none absolute inset-y-0 w-3/4 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent blur-[2px]"
      />

      {/* 2. Top-edge Specular Reflection (Glass highlight) */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"
      />

      {/* 3. Radial Core Ambient Glow */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.3)_0%,transparent_70%)] opacity-70 group-hover:opacity-100 transition-opacity duration-300"
      />

      {/* 4. Button Content Layer */}
      <span className="relative z-10 flex items-center justify-center gap-2 text-sm sm:text-base font-extrabold tracking-wide drop-shadow-sm">
        {children}
      </span>
    </motion.button>
  );
}

export default ShinyButton;
