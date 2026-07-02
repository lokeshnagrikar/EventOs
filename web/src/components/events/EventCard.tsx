"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, DollarSign, Clock, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export interface Event {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  location?: string;
  venueName?: string;
  venueAddress?: string;
  guestCount?: number;
  guestList?: string;
  budget?: number;
  notes?: string;
}

interface EventCardProps {
  event: Event;
  index: number;
}

const EVENT_TYPE_STYLES: Record<string, { label: string; color: string }> = {
  WEDDING: { label: "Wedding", color: "border-pink-500/20 bg-pink-500/5 text-pink-400" },
  BIRTHDAY: { label: "Birthday", color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" },
  ENGAGEMENT: { label: "Engagement", color: "border-purple-500/20 bg-purple-500/5 text-purple-400" },
  CORPORATE: { label: "Corporate", color: "border-blue-500/20 bg-blue-500/5 text-blue-400" }
};

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  PLANNING: { label: "Planning", color: "border-zinc-550/20 bg-zinc-500/5 text-zinc-400" },
  CONFIRMED: { label: "Confirmed", color: "border-blue-500/20 bg-blue-500/5 text-blue-400" },
  IN_PROGRESS: { label: "In Progress", color: "border-amber-500/20 bg-amber-500/5 text-amber-400" },
  COMPLETED: { label: "Completed", color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" },
  CANCELLED: { label: "Cancelled", color: "border-red-500/20 bg-red-500/5 text-red-400" }
};

export default function EventCard({ event, index }: EventCardProps) {
  const router = useRouter();

  // 1. Derived Completion % based on Status
  const completionPercent = useMemo(() => {
    switch (event.status) {
      case "COMPLETED": return 100;
      case "IN_PROGRESS": return 75;
      case "CONFIRMED": return 40;
      case "PLANNING": return 15;
      case "CANCELLED": return 0;
      default: return 10;
    }
  }, [event.status]);

  // 2. Countdown Calculation
  const countdownText = useMemo(() => {
    if (event.status === "COMPLETED") return "Completed";
    if (event.status === "CANCELLED") return "Cancelled";

    const now = new Date();
    const start = new Date(event.startDate);
    const diffTime = start.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      if (new Date(event.endDate) > now) return "In Progress";
      return "Past Event";
    }
    if (diffDays === 0) return "Starts Today";
    if (diffDays === 1) return "Starts Tomorrow";
    if (diffDays <= 30) return `Starts in ${diffDays} days`;
    
    const diffMonths = Math.ceil(diffDays / 30);
    return `Starts in ${diffMonths} m`;
  }, [event.startDate, event.endDate, event.status]);

  // 3. Priority derived from Budget size
  const priority = useMemo(() => {
    const budget = event.budget || 0;
    if (budget >= 500000) return { label: "High", color: "text-red-400 bg-red-500/5 border-red-500/10" };
    if (budget >= 200000) return { label: "Medium", color: "text-amber-400 bg-amber-500/5 border-amber-500/10" };
    return { label: "Low", color: "text-zinc-400 bg-zinc-800/20 border-zinc-700/10" };
  }, [event.budget]);

  // 4. Mapped Style constants
  const typeStyle = EVENT_TYPE_STYLES[event.type] || { label: event.type, color: "border-zinc-800 text-zinc-400 bg-zinc-900/10" };
  const statusStyle = STATUS_STYLES[event.status] || { label: event.status, color: "border-zinc-800 text-zinc-400 bg-zinc-900/10" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.15), ease: [0.215, 0.61, 0.355, 1] }}
      whileHover={{ y: -4, scale: 1.008 }}
      className="group relative rounded-2xl border border-zinc-800 bg-[#141416]/40 hover:border-zinc-700/80 p-5 flex flex-col justify-between h-[235px] hover:shadow-[0_0_30px_rgba(139,92,246,0.03)] overflow-hidden select-none transition-colors"
    >
      {/* Glow Accent Top Right */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[35px] rounded-full group-hover:scale-110 transition-transform" />

      {/* Header Info */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className={cn("px-2.5 py-0.5 border rounded-full text-[9px] font-extrabold tracking-wider uppercase", typeStyle.color)}>
            {typeStyle.label}
          </span>
          <div className="flex items-center gap-1.5">
            <span className={cn("px-2 py-0.5 border rounded text-[9px] font-bold", priority.color)}>
              {priority.label}
            </span>
            <span className={cn("px-2.5 py-0.5 border rounded-full text-[9px] font-extrabold", statusStyle.color)}>
              {statusStyle.label}
            </span>
          </div>
        </div>

        <h3 className="font-extrabold text-sm text-zinc-100 group-hover:text-purple-400 transition-colors leading-snug line-clamp-1">
          {event.name}
        </h3>
        
        {event.venueName ? (
          <span className="text-[10px] text-zinc-550 flex items-center gap-1">
            <MapPin size={11} className="text-zinc-600" /> {event.venueName}
          </span>
        ) : (
          <span className="text-[10px] text-zinc-600 italic">No Venue Assigned</span>
        )}
      </div>

      {/* Budget & Time Meta info */}
      <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400 border-t border-zinc-850/60 pt-3.5">
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="text-zinc-500" />
          <span>{new Date(event.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>
        <div className="flex items-center gap-1.5 justify-end">
          <DollarSign size={12} className="text-emerald-500" />
          <span className="font-bold text-zinc-350">
            {event.budget ? `₹${(event.budget / 100000).toFixed(2)}L` : "₹0L"}
          </span>
        </div>
      </div>

      {/* Progress ring and Countdown bar */}
      <div className="flex items-center justify-between mt-3 gap-3">
        <div className="flex items-center gap-2">
          {/* Progress Ring Mini SVG */}
          <div className="relative h-6 w-6 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-zinc-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-purple-500"
                strokeWidth="3.5"
                strokeDasharray={`${completionPercent}, 100`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-zinc-300">
              {completionPercent}%
            </span>
          </div>
          <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-wider">Completion</span>
        </div>

        <div className="flex items-center gap-1 text-[9px] font-black tracking-wide text-purple-400 bg-purple-950/20 px-2 py-0.5 rounded border border-purple-900/30">
          <Clock size={10} />
          {countdownText}
        </div>
      </div>

      {/* Hover Action Overlay */}
      <div className="absolute inset-0 bg-[#0c0c0e]/90 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3 px-4 z-10">
        <button
          onClick={() => router.push(`/events/${event.id}`)}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-[10px] font-bold transition-all shadow-md active:scale-95"
        >
          Open Workspace
          <ArrowUpRight size={12} />
        </button>
      </div>
    </motion.div>
  );
}
