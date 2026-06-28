"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AuroraTextProps {
  children: React.ReactNode;
  className?: string;
  /** Animation speed in seconds for one full hue cycle. Default: 6 */
  speed?: number;
}

export function AuroraText({ children, className, speed = 6 }: AuroraTextProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <span
        className={cn(
          "bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#06B6D4]",
          className
        )}
      >
        {children}
      </span>
    );
  }

  return (
    <motion.span
      className={cn(
        "bg-clip-text text-transparent inline-block",
        className
      )}
      style={{
        backgroundImage:
          "linear-gradient(135deg, #8B5CF6, #EC4899, #06B6D4, #8B5CF6)",
        backgroundSize: "300% 300%",
      }}
      animate={{
        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
      }}
      transition={{
        duration: speed,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      {children}
    </motion.span>
  );
}
