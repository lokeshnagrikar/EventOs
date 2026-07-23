"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "framer-motion";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children?: React.ReactNode;
  showRadialGradient?: boolean;
}

export function AuroraBackground({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) {
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotionRaw = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shouldReduceMotion = mounted ? shouldReduceMotionRaw : false;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || shouldReduceMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      container.style.setProperty("--mouse-x", `${x}px`);
      container.style.setProperty("--mouse-y", `${y}px`);
    };

    const handleMouseLeave = () => {
      container.style.setProperty("--mouse-x", "-999px");
      container.style.setProperty("--mouse-y", "-999px");
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [shouldReduceMotion]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full overflow-hidden bg-transparent text-zinc-100 transition-colors duration-300",
        className
      )}
      {...props}
    >
      {/* Background ambient auroras & cosmic glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Top Horizontal Light Specular Line */}
        <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />

        {/* Layer 1: Clockwise Swirl */}
        <div
          suppressHydrationWarning
          className={cn(
            "absolute -inset-[15px] opacity-60 filter blur-[110px] will-change-transform",
            !shouldReduceMotion && "animate-[aurora-drift_20s_infinite_alternate_ease-in-out]"
          )}
          style={{
            background: `
              radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.35) 0%, transparent 45%),
              radial-gradient(circle at 80% 30%, rgba(236, 72, 153, 0.30) 0%, transparent 50%),
              radial-gradient(circle at 50% 70%, rgba(99, 102, 241, 0.28) 0%, transparent 45%)
            `,
          }}
        />
        
        {/* Layer 2: Counter-Clockwise Swirl */}
        <div
          suppressHydrationWarning
          className={cn(
            "absolute -inset-[15px] opacity-50 filter blur-[120px] will-change-transform",
            !shouldReduceMotion && "animate-[aurora-drift-reverse_25s_infinite_alternate_ease-in-out]"
          )}
          style={{
            background: `
              radial-gradient(circle at 70% 15%, rgba(6, 182, 212, 0.22) 0%, transparent 40%),
              radial-gradient(circle at 30% 60%, rgba(236, 72, 153, 0.22) 0%, transparent 48%),
              radial-gradient(circle at 60% 80%, rgba(139, 92, 246, 0.32) 0%, transparent 50%)
            `,
          }}
        />

        {/* Layer 3: Interactive Mouse-Follow Spotlight Glow */}
        {!shouldReduceMotion && showRadialGradient && (
          <div
            suppressHydrationWarning
            className="absolute inset-0 opacity-60 filter blur-[50px] transition-opacity duration-300 pointer-events-none"
            style={{
              background: `
                radial-gradient(
                  circle 380px at var(--mouse-x, -999px) var(--mouse-y, -999px),
                  rgba(168, 85, 247, 0.25) 0%,
                  rgba(6, 182, 212, 0.15) 35%,
                  rgba(236, 72, 153, 0.08) 65%,
                  transparent 100%
                )
              `,
            }}
          />
        )}

        {/* Glowing Tech Dot Matrix Grid */}
        <div 
          className="absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage: "radial-gradient(#A1A1AA 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, #000 65%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, #000 65%, transparent 100%)"
          }}
        />
      </div>

      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}
