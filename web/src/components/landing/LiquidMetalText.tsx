"use client";

import React, { useEffect } from "react";

interface LiquidMetalTextProps {
  text: string;
  variant?: "purple" | "silver";
  className?: string;
}

export function LiquidMetalText({
  text,
  variant = "purple",
  className = "",
}: LiquidMetalTextProps) {
  useEffect(() => {
    const styleId = "liquid-metal-text-styles-clean";
    if (typeof document !== "undefined" && !document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes liquidMetalFlowAnim {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .liquid-metal-text-purple {
          background: linear-gradient(
            115deg,
            #7C3AED 0%,
            #A855F7 18%,
            #E9D5FF 32%,
            #FFFFFF 42%,
            #C084FC 52%,
            #8B5CF6 68%,
            #FFFFFF 82%,
            #7C3AED 100%
          );
          background-size: 240% 240%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          display: inline-block;
          animation: liquidMetalFlowAnim 6s ease-in-out infinite;
        }
        .liquid-metal-text-silver {
          background: linear-gradient(
            115deg,
            #94A3B8 0%,
            #CBD5E1 20%,
            #FFFFFF 40%,
            #E2E8F0 60%,
            #FFFFFF 80%,
            #94A3B8 100%
          );
          background-size: 240% 240%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          display: inline-block;
          animation: liquidMetalFlowAnim 6s ease-in-out infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const isSilver = variant === "silver";

  return (
    <span
      className={`${
        isSilver ? "liquid-metal-text-silver" : "liquid-metal-text-purple"
      } select-none transition-transform duration-200 hover:scale-[1.02] ${className}`}
    >
      {text}
    </span>
  );
}
