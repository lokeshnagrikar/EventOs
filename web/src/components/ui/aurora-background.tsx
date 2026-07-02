"use client";

import React from "react";
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
  const shouldReduceMotion = useReducedMotion();
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
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
        "relative w-full overflow-hidden bg-[#09090B] text-zinc-100 transition-colors duration-300",
        className
      )}
      {...props}
    >
      {/* Background ambient auroras */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Layer 1: Clockwise Swirl */}
        <div
          className={cn(
            "absolute -inset-[15px] opacity-45 filter blur-[120px] will-change-transform",
            !shouldReduceMotion && "animate-[aurora-drift_25s_infinite_alternate_ease-in-out]"
          )}
          style={{
            background: `
              radial-gradient(circle at 15% 15%, rgba(124, 58, 237, 0.32) 0%, transparent 45%),
              radial-gradient(circle at 85% 35%, rgba(236, 72, 153, 0.28) 0%, transparent 50%),
              radial-gradient(circle at 45% 75%, rgba(168, 85, 247, 0.25) 0%, transparent 45%)
            `,
          }}
        />
        
        {/* Layer 2: Counter-Clockwise Swirl */}
        <div
          className={cn(
            "absolute -inset-[15px] opacity-40 filter blur-[120px] will-change-transform",
            !shouldReduceMotion && "animate-[aurora-drift-reverse_32s_infinite_alternate_ease-in-out]"
          )}
          style={{
            background: `
              radial-gradient(circle at 75% 15%, rgba(6, 182, 212, 0.18) 0%, transparent 40%),
              radial-gradient(circle at 25% 65%, rgba(236, 72, 153, 0.25) 0%, transparent 48%),
              radial-gradient(circle at 65% 85%, rgba(124, 58, 237, 0.28) 0%, transparent 50%)
            `,
          }}
        />

        {/* Layer 3: Interactive Mouse-Follow Spotlight Glow */}
        {!shouldReduceMotion && showRadialGradient && (
          <div
            className="absolute inset-0 opacity-50 filter blur-[60px] transition-opacity duration-300"
            style={{
              background: `
                radial-gradient(
                  circle 350px at var(--mouse-x, -999px) var(--mouse-y, -999px),
                  rgba(168, 85, 247, 0.20) 0%,
                  rgba(236, 72, 153, 0.10) 40%,
                  rgba(124, 58, 237, 0.04) 75%,
                  transparent 100%
                )
              `,
            }}
          />
        )}

        {/* Subtle glowing dotted grid for modern tech aesthetic */}
        <div 
          className="absolute inset-0 opacity-[0.24]"
          style={{
            backgroundImage: "radial-gradient(#3F3F46 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)"
          }}
        />
      </div>


      <div className="relative z-10 w-full">
        {children}
      </div>

      <style jsx global>{`
        @keyframes aurora-drift {
          0% {
            transform: translate(0px, 0px) scale(1) rotate(0deg);
          }
          50% {
            transform: translate(35px, -50px) scale(1.12) rotate(8deg);
          }
          100% {
            transform: translate(-25px, 25px) scale(0.92) rotate(-8deg);
          }
        }
        @keyframes aurora-drift-reverse {
          0% {
            transform: translate(0px, 0px) scale(1) rotate(0deg);
          }
          50% {
            transform: translate(-40px, 45px) scale(0.92) rotate(-12deg);
          }
          100% {
            transform: translate(25px, -35px) scale(1.08) rotate(12deg);
          }
        }
      `}</style>
    </div>
  );
}
