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
        "relative rounded-2xl border border-zinc-800 bg-[#161618]/30 hover:border-zinc-700/80 p-5 flex flex-col justify-between min-h-[140px] hover:shadow-[0_0_30px_rgba(139,92,246,0.03)] group overflow-hidden select-none transition-colors",
        onClick && "cursor-pointer"
      )}
    >
      {/* Decorative Glow accent */}
      <div className={cn("absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br opacity-5 blur-[40px] rounded-full group-hover:opacity-10 transition-opacity", gradientAccent)} />

      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest block">{title}</span>
          <p className="text-2xl font-extrabold tracking-tight text-zinc-100 group-hover:text-white transition-colors">
            {typeof displayValue === "number" ? displayValue.toLocaleString() : displayValue}
          </p>
        </div>
        
        {/* Glow Badge Icon */}
        <div className={cn("h-8 w-8 rounded-xl bg-gradient-to-tr flex items-center justify-center text-white shadow-md shadow-black/40", gradientAccent)}>
          <Icon size={14} className="text-zinc-100" />
        </div>
      </div>

      <div className="flex justify-between items-end pt-4 border-t border-zinc-900 mt-2">
        <div className="space-y-1">
          {trend && (
            <div className={cn("flex items-center gap-1 text-[11px] font-bold", trend.isPositive ? "text-emerald-500" : "text-red-500")}>
              {trend.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              <span>{trend.value}%</span>
              <span className="text-zinc-550 font-normal text-[10px] lowercase">vs past month</span>
            </div>
          )}
          <span className="text-[10px] text-zinc-500 font-semibold block leading-none">{subtitle}</span>
        </div>

        {/* Sparkline chart */}
        <div className="h-8 w-24 opacity-60 group-hover:opacity-100 transition-opacity">
          <svg viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            <polyline
              fill="none"
              stroke={trend?.isPositive ? "#10b981" : "#ef4444"}
              strokeWidth="1.8"
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
