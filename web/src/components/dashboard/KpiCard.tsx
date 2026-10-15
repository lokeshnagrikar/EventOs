"use client";

import React, { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  sparklineData?: number[];
  gradientAccent?: string;
  onClick?: () => void;
}

export default function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  sparklineData = [10, 15, 12, 22, 18, 30, 25],
  gradientAccent = "from-purple-500 to-pink-500",
  onClick,
}: KpiCardProps) {
  // Count up animation
  const [displayValue, setDisplayValue] = useState<number | string>(typeof value === "number" ? 0 : value);

  useEffect(() => {
    if (typeof value !== "number") {
      setDisplayValue(value);
      return;
    }

    let start = 0;
    const end = value;
    if (start === end) return;

    const duration = 0.8; // 800ms
    const stepTime = Math.abs(Math.floor(duration * 1000 / end));
    
    const timer = setInterval(() => {
      start += Math.ceil(end / 20); // Faster increment
      if (start >= end) {
        clearInterval(timer);
        setDisplayValue(end);
      } else {
        setDisplayValue(start);
      }
    }, Math.max(stepTime, 20));

    return () => clearInterval(timer);
  }, [value]);

  // SVG Sparkline Math
  const drawSparkline = () => {
    const width = 100;
    const height = 30;
    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;

    const points = sparklineData
      .map((val, idx) => {
        const x = (idx / (sparklineData.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 4) - 2;
        return `${x},${y}`;
      })
      .join(" ");

    return { points, width, height };
  };

  const { points, width, height } = drawSparkline();

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      onClick={onClick}
      className={cn(
        "relative rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#121319] hover:border-purple-500/40 p-4 sm:p-5 flex flex-col justify-between min-h-[135px] sm:min-h-[145px] hover:shadow-lg dark:hover:shadow-[0_8px_30px_rgba(139,92,246,0.08)] group overflow-hidden select-none transition-all shadow-sm",
        onClick && "cursor-pointer"
      )}
    >
      {/* Decorative Glow accent */}
      <div className={cn("absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br opacity-10 dark:opacity-20 blur-[40px] rounded-full group-hover:opacity-30 transition-opacity", gradientAccent)} />

      <div className="flex justify-between items-start gap-2">
        <div className="space-y-1 min-w-0 flex-1">
          <span className="text-[9.5px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block leading-tight">{title}</span>
          <p className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors font-mono tabular-nums mt-1">
            {typeof displayValue === "number" ? displayValue.toLocaleString("en-IN") : displayValue}
          </p>
        </div>
        
        {/* Glow Badge Icon */}
        <div className={cn("h-8 w-8 rounded-xl bg-gradient-to-tr flex items-center justify-center text-white shadow-md shadow-black/20 shrink-0", gradientAccent)}>
          <Icon size={14} className="text-white" />
        </div>
      </div>

      <div className="flex justify-between items-end pt-3 border-t border-slate-100 dark:border-white/[0.06] mt-2">
        <div className="space-y-1 min-w-0">
          {trend && (
            <div className={cn("flex items-center gap-1 text-[10px] sm:text-[11px] font-bold", trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
              {trend.isPositive ? <ArrowUpRight size={12} className="shrink-0" /> : <ArrowDownRight size={12} className="shrink-0" />}
              <span>{trend.value}%</span>
              <span className="text-slate-400 dark:text-zinc-500 font-normal text-[9px] lowercase hidden xs:inline">vs past month</span>
            </div>
          )}
          <span className="text-[10px] text-slate-600 dark:text-zinc-300 font-semibold block leading-tight">{subtitle}</span>
        </div>

        {/* Sparkline chart */}
        <div className="h-7 sm:h-8 w-16 sm:w-20 opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            <polyline
              fill="none"
              stroke={trend?.isPositive ? "#10b981" : "#8b5cf6"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
