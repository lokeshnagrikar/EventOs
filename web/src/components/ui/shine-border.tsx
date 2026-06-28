"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ShineBorderProps {
  children: React.ReactNode;
  className?: string;
  color?: string | string[];
  borderWidth?: number;
  duration?: number;
  borderRadius?: number;
}

export function ShineBorder({
  children,
  className,
  color = ["#8B5CF6", "#06B6D4", "#8B5CF6"],
  borderWidth = 1,
  duration = 8,
  borderRadius = 12,
}: ShineBorderProps) {
  const gradient = Array.isArray(color)
    ? `conic-gradient(from 0deg at 50% 50%, ${color.join(", ")})`
    : color;

  return (
    <div
      style={
        {
          "--border-width": `${borderWidth}px`,
          "--duration": `${duration}s`,
          "--border-radius": `${borderRadius}px`,
          "--background-radial-gradient": gradient,
        } as React.CSSProperties
      }
      className={cn(
        "relative rounded-[var(--border-radius)] p-[var(--border-width)] overflow-hidden",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-0 size-full pointer-events-none rounded-[inherit]",
          "before:absolute before:inset-0 before:size-full before:rounded-[inherit] before:p-[var(--border-width)] before:will-change-transform before:content-['']",
          "before:bg-[var(--background-radial-gradient)] before:[mask-composite:exclude] before:![mask-clip:padding-box,border-box] before:![mask-image:linear-gradient(transparent,transparent),linear-gradient(white,white)]",
          "before:animate-shine"
        )}
      />
      <div className="relative z-10 w-full h-full rounded-[calc(var(--border-radius)-var(--border-width))] bg-[#18181B]">
        {children}
      </div>
    </div>
  );
}
