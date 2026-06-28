"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  /** Number of columns to span (1-3). Default: 1 */
  colSpan?: 1 | 2 | 3;
  /** Number of rows to span (1-2). Default: 1 */
  rowSpan?: 1 | 2;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-3 auto-rows-auto gap-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function BentoCard({
  children,
  className,
  colSpan = 1,
  rowSpan = 1,
}: BentoCardProps) {
  const colSpanClass = {
    1: "md:col-span-1",
    2: "md:col-span-2",
    3: "md:col-span-3",
  }[colSpan];

  const rowSpanClass = {
    1: "md:row-span-1",
    2: "md:row-span-2",
  }[rowSpan];

  return (
    <div
      className={cn(
        colSpanClass,
        rowSpanClass,
        "rounded-2xl border border-zinc-900 bg-zinc-950/40 overflow-hidden transition-all duration-300",
        className
      )}
    >
      {children}
    </div>
  );
}
