"use client";

import React, { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  /** Color of the spotlight glow. Default: purple */
  spotlightColor?: string;
  /** Border color on spotlight. Default: inherit from spotlightColor */
  borderColor?: string;
}

export function SpotlightCard({
  children,
  className,
  spotlightColor = "rgba(139, 92, 246, 0.15)",
  borderColor = "rgba(139, 92, 246, 0.4)",
}: SpotlightCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn("relative overflow-hidden transition-all duration-300", className)}
    >
      {/* Background ambient spotlight glow */}
      {isHovered && (
        <div
          className="pointer-events-none absolute z-0 transition-opacity duration-300"
          style={{
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: `radial-gradient(circle at center, ${spotlightColor} 0%, transparent 70%)`,
            left: position.x - 200,
            top: position.y - 200,
            opacity: 1,
          }}
        />
      )}

      {/* Localized border glow overlay using CSS masking */}
      {isHovered && (
        <div
          className="pointer-events-none absolute inset-0 z-30 rounded-inherit border border-transparent"
          style={{
            background: `radial-gradient(350px circle at ${position.x}px ${position.y}px, ${borderColor}, transparent 80%)`,
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />
      )}

      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
}

