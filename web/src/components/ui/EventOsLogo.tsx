"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface EventOsLogoProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

export function EventOsLogo({ className, size = 48, animated = true }: EventOsLogoProps) {
  return (
    <div className={cn("relative inline-flex items-center justify-center select-none", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          {/* Main Metallic Brand Gradient */}
          <linearGradient id="eo_clean_grad" x1="20" y1="30" x2="180" y2="170" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="45%" stopColor="#A855F7" />
            <stop offset="75%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>

          {/* Spark Center Radiant Gradient */}
          <linearGradient id="eo_clean_spark" x1="120" y1="80" x2="150" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F472B6" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>

          {/* Soft Ambient Glow Filter */}
          <filter id="eo_clean_glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ── LETTER 'E' ── */}
        <motion.path
          d="M 30 50 L 95 50 L 85 68 L 52 68 L 52 88 L 82 88 L 76 104 L 52 104 L 52 132 L 95 132 L 95 150 L 30 150 Z"
          fill="url(#eo_clean_grad)"
          animate={animated ? { opacity: [0.92, 1, 0.92] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* ── LETTER 'O' ── */}
        <motion.path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M 135 48 C 163.165 48 186 70.835 186 99 C 186 127.165 163.165 150 135 150 C 106.835 150 84 127.165 84 99 C 84 70.835 106.835 48 135 48 Z M 135 72 C 149.912 72 162 84.088 162 99 C 162 113.912 149.912 126 135 126 C 120.088 126 108 113.912 108 99 C 108 84.088 120.088 72 135 72 Z"
          fill="url(#eo_clean_grad)"
          animate={animated ? { opacity: [0.92, 1, 0.92] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* ── RADIANT 4-POINTED SPARK IN 'O' ── */}
        <motion.path
          d="M 135 76 Q 135 99 155 99 Q 135 99 135 122 Q 135 99 115 99 Q 135 99 135 76 Z"
          fill="url(#eo_clean_spark)"
          animate={animated ? { rotate: [0, 180, 360], scale: [0.9, 1.15, 0.9] } : {}}
          transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "135px 99px" }}
          filter="url(#eo_clean_glow)"
        />

        {/* ── SWIRLING ORBITAL SWOOSH RING ── */}
        <motion.path
          d="M 20 140 C 25 175, 120 185, 180 90 C 190 75, 194 58, 192 48"
          stroke="url(#eo_clean_grad)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          animate={animated ? { strokeWidth: [4.5, 6, 4.5] } : {}}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* ── ORBITAL SATELLITE NODE ── */}
        <motion.circle
          cx="188"
          cy="52"
          r="7"
          fill="#EC4899"
          animate={animated ? { scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <circle
          cx="188"
          cy="52"
          r="5.5"
          fill="url(#eo_clean_spark)"
        />
      </svg>
    </div>
  );
}

export default EventOsLogo;
