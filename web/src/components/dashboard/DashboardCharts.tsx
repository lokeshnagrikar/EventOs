"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Revenue Overview Area Chart ──────────────────────────────────────────────
interface MonthlyRevenueData {
  month: string;
  revenue: number;
}

export function RevenueOverview({ data = [] }: { data?: MonthlyRevenueData[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Fallback high-fidelity data if none provided
  const chartData = data.length > 0 ? data : [
    { month: "Jan", revenue: 45000 },
    { month: "Feb", revenue: 52000 },
    { month: "Mar", revenue: 49000 },
    { month: "Apr", revenue: 63000 },
    { month: "May", revenue: 58000 },
    { month: "Jun", revenue: 85000 },
  ];

  const maxVal = Math.max(...chartData.map((d) => d.revenue)) * 1.15 || 100000;
  const minVal = 0;
  const width = 500;
  const height = 180;
  const padding = 30;

  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const getCoordinates = () => {
    return chartData.map((d, idx) => {
      const x = padding + (idx / (chartData.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((d.revenue - minVal) / (maxVal - minVal)) * chartHeight;
      return { x, y, month: d.month, revenue: d.revenue };
    });
  };

  const coords = getCoordinates();
  
  // Create path strings
  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${height - padding} L ${coords[0].x} ${height - padding} Z`;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#161618]/30 p-5 space-y-4 hover:border-zinc-700/80 transition-all">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Revenue Stream Overview</h3>
          <p className="text-[11px] text-zinc-500">Monthly contract value flow</p>
        </div>
        {hoveredIndex !== null && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-right text-xs bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-lg"
          >
            <span className="font-bold text-zinc-200">{coords[hoveredIndex].month}: </span>
            <span className="font-mono text-purple-450 font-bold">INR {coords[hoveredIndex].revenue.toLocaleString()}</span>
          </motion.div>
        )}
      </div>

      <div className="relative pt-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
          <defs>
            {/* Smooth glowing gradient */}
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
            <line
              key={i}
              x1={padding}
              y1={padding + r * chartHeight}
              x2={width - padding}
              y2={padding + r * chartHeight}
              stroke="#1f1f23"
              strokeDasharray="4,4"
              strokeWidth="1"
            />
          ))}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#areaGradient)" />

          {/* Outline Line */}
          <path d={linePath} fill="none" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Nodes & Interactive Overlays */}
          {coords.map((c, i) => (
            <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}>
              {/* Invisible Hover boundary */}
              <circle cx={c.x} cy={c.y} r="16" fill="transparent" />
              {/* Outer Glow */}
              <circle
                cx={c.x}
                cy={c.y}
                r="6"
                fill="#c084fc"
                className={cn("transition-all opacity-0", hoveredIndex === i && "opacity-25")}
              />
              {/* Inner Node */}
              <circle
                cx={c.x}
                cy={c.y}
                r="3.5"
                fill={hoveredIndex === i ? "#fff" : "#c084fc"}
                stroke="#09090b"
                strokeWidth="1.5"
              />
              {/* X Axis Labels */}
              <text x={c.x} y={height - 8} fill="#52525b" fontSize="9" fontWeight="bold" textAnchor="middle">
                {c.month}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ─── Leads Pipeline Bar Chart ───────────────────────────────────────────────
export function LeadsPipeline({ data = {} }: { data?: Record<string, number> }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const entries: [string, number][] = Object.keys(data).length > 0 ? Object.entries(data) : [
    ["Instagram", 45],
    ["Website", 32],
    ["WhatsApp", 25],
    ["Referral", 18],
    ["Facebook", 12],
  ];

  const maxVal = Math.max(...entries.map(([_, v]) => v)) * 1.1 || 50;
  const width = 300;
  const height = 180;
  const padding = 20;

  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const barGap = 12;
  const barWidth = (chartWidth - barGap * (entries.length - 1)) / entries.length;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#161618]/30 p-5 space-y-4 hover:border-zinc-700/80 transition-all">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Leads Acquisition</h3>
          <p className="text-[11px] text-zinc-500">Pipeline distribution by source</p>
        </div>
        {hoveredIdx !== null && (
          <div className="text-xs font-bold text-pink-400">
            {entries[hoveredIdx][1]} leads
          </div>
        )}
      </div>

      <div className="pt-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
          {entries.map(([source, val], i) => {
            const x = padding + i * (barWidth + barGap);
            const barHeight = (val / maxVal) * chartHeight;
            const y = height - padding - barHeight;

            return (
              <g key={source} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)} className="cursor-pointer">
                {/* Background Shadow Bar */}
                <rect
                  x={x}
                  y={padding}
                  width={barWidth}
                  height={chartHeight}
                  fill="#1f1f23"
                  opacity="0.1"
                  rx="4"
                />
                {/* Active Colored Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={hoveredIdx === i ? "#ec4899" : "#a855f7"}
                  className="transition-colors duration-150"
                  rx="4"
                />
                {/* Label */}
                <text
                  x={x + barWidth / 2}
                  y={height - 5}
                  fill="#52525b"
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="truncate"
                >
                  {source.slice(0, 4)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ─── Booking Status Donut Chart ──────────────────────────────────────────────
export function BookingStatus({ data = {} }: { data?: Record<string, number> }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const raw = Object.keys(data).length > 0 ? data : {
    "Confirmed": 55,
    "Planning": 35,
    "Completed": 20,
    "Cancelled": 8
  };

  const entries = Object.entries(raw);
  const total = entries.reduce((acc, [_, v]) => acc + v, 0);

  // SVG parameters
  const size = 150;
  const center = size / 2;
  const strokeWidth = 14;
  const radius = center - strokeWidth - 10;
  const circumference = 2 * Math.PI * radius;

  let accumulatedAngle = 0;

  const colors = ["#a855f7", "#06b6d4", "#10b981", "#ef4444"];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#161618]/30 p-5 space-y-4 hover:border-zinc-700/80 transition-all flex flex-col justify-between">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Contracts Status</h3>
        <p className="text-[11px] text-zinc-500">Pipeline distribution share</p>
      </div>

      <div className="flex items-center justify-around gap-4 pt-2">
        {/* Donut Circle */}
        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#18181b"
              strokeWidth={strokeWidth}
            />

            {entries.map(([status, val], idx) => {
              const percentage = val / (total || 1);
              const strokeLength = percentage * circumference;
              const strokeOffset = circumference - strokeLength;
              const dashArray = `${strokeLength} ${circumference}`;
              const rot = accumulatedAngle;
              accumulatedAngle += percentage * 360;

              return (
                <circle
                  key={status}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={colors[idx % colors.length]}
                  strokeWidth={hoveredIndex === idx ? strokeWidth + 3 : strokeWidth}
                  strokeDasharray={dashArray}
                  transform={`rotate(${rot} ${center} ${center})`}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-lg font-black text-zinc-150 leading-none">{total}</span>
            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Bookings</span>
          </div>
        </div>

        {/* Legend Grid */}
        <div className="space-y-1.5 text-[10px] font-bold">
          {entries.map(([status, val], idx) => (
            <div
              key={status}
              className={cn("flex items-center gap-2 px-2 py-1 rounded-lg transition-all", hoveredIndex === idx && "bg-zinc-900/60")}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
              <span className="text-zinc-450">{status}</span>
              <span className="text-zinc-300 ml-auto font-mono">{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
