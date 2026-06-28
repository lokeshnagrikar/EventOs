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

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-[#09090B] text-zinc-100 transition-colors duration-300",
        className
      )}
      {...props}
    >
      {/* Background ambient auroras */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className={cn(
            "absolute -inset-[10px] opacity-40 filter blur-[120px] will-change-transform",
            !shouldReduceMotion && "animate-[aurora_20s_infinite_alternate]"
          )}
          style={{
            background: `
              radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.25) 0%, transparent 40%),
              radial-gradient(circle at 80% 40%, rgba(6, 182, 212, 0.25) 0%, transparent 45%),
              radial-gradient(circle at 40% 70%, rgba(236, 72, 153, 0.2) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(99, 102, 241, 0.18) 0%, transparent 45%)
            `,
          }}
        />
        {/* Subtle overlay grid for tech aesthetic */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
      </div>

      <div className="relative z-10 w-full">
        {children}
      </div>

      <style jsx global>{`
        @keyframes aurora {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.95);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
