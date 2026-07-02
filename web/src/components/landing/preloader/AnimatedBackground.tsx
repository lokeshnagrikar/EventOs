"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

export const AnimatedBackground = React.memo(function AnimatedBackground() {
  // Use useMemo to avoid re-generating static style properties
  const noiseStyle = useMemo(() => ({
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
    opacity: 0.018,
  }), []);

  return (
    <div className="absolute inset-0 bg-[#09090B] overflow-hidden pointer-events-none">
      {/* Noise/Grain Overlay */}
      <div 
        className="absolute inset-0 z-20 mix-blend-overlay select-none pointer-events-none" 
        style={noiseStyle}
      />

      {/* Subtle Ambient Radial Glows (Mesh Gradient) */}
      
      {/* Glow 1 - Deep Purple (#7C3AED) */}
      <motion.div
        animate={{
          x: [-20, 30, -20],
          y: [-30, 20, -30],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-[#7C3AED]/10 blur-[120px]"
      />

      {/* Glow 2 - Pink/Magenta (#EC4899) */}
      <motion.div
        animate={{
          x: [40, -20, 40],
          y: [20, -30, 20],
          scale: [1.1, 0.9, 1.1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -bottom-[15%] -right-[15%] w-[65vw] h-[65vw] rounded-full bg-[#EC4899]/08 blur-[130px]"
      />

      {/* Glow 3 - Electric Indigo (#6366F1) */}
      <motion.div
        animate={{
          x: [30, -30, 30],
          y: [-10, 40, -10],
          scale: [0.9, 1.1, 0.9],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[30%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-[#6366F1]/06 blur-[110px]"
      />

      {/* Glow 4 - Light Violet (#A855F7) */}
      <motion.div
        animate={{
          x: [-40, 20, -40],
          y: [30, -20, 30],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[10%] right-[10%] w-[45vw] h-[45vw] rounded-full bg-[#A855F7]/08 blur-[100px]"
      />

      {/* Soft Vignette Overlay for Depth */}
      <div className="absolute inset-0 bg-radial-vignette z-10" />
    </div>
  );
});
