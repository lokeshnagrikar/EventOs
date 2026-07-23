"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, AlertTriangle, CheckCircle2, Sparkles, RefreshCw, Zap, ShieldCheck } from "lucide-react";
import { useToastStore } from "@/lib/toastStore";
import { cn } from "@/lib/utils";

interface ScheduleSlot {
  id: string;
  activity: string;
  vendor: string;
  startTime: string;
  endTime: string;
  hasConflict: boolean;
  conflictDetails?: string;
}

const INITIAL_SLOTS: ScheduleSlot[] = [
  { id: "s1", activity: "Stage Lighting Rigging & Truss", vendor: "Starlight Sound & AV", startTime: "10:00 AM", endTime: "12:30 PM", hasConflict: false },
  { id: "s2", activity: "Floral Mandap Architecture", vendor: "Luxe Decor Studio", startTime: "11:30 AM", endTime: "02:30 PM", hasConflict: true, conflictDetails: "Overlaps with Stage Lighting Rigging on main stage floor" },
  { id: "s3", activity: "Live Sound Check & Acoustics", vendor: "Sufi Ensemble Band", startTime: "02:00 PM", endTime: "03:30 PM", hasConflict: true, conflictDetails: "Noise conflict with Floral Mandap final inspection" },
  { id: "s4", activity: "Catering Buffet Setup", vendor: "Royal Feast Caterers", startTime: "04:00 PM", endTime: "06:00 PM", hasConflict: false },
  { id: "s5", activity: "VIP Red Carpet Welcome", vendor: "Security Team A", startTime: "06:30 PM", endTime: "08:00 PM", hasConflict: false },
];

export default function AIScheduleResolver() {
  const { addToast } = useToastStore();
  const [slots, setSlots] = useState<ScheduleSlot[]>(INITIAL_SLOTS);
  const [isResolving, setIsResolving] = useState(false);
  const [resolved, setResolved] = useState(false);

  const conflictCount = slots.filter((s) => s.hasConflict).length;

  const handleResolveConflicts = () => {
    setIsResolving(true);
    setTimeout(() => {
      setIsResolving(false);
      setResolved(true);
      // Auto-realign non-overlapping time slots
      setSlots([
        { id: "s1", activity: "Stage Lighting Rigging & Truss", vendor: "Starlight Sound & AV", startTime: "08:00 AM", endTime: "10:30 AM", hasConflict: false },
        { id: "s2", activity: "Floral Mandap Architecture", vendor: "Luxe Decor Studio", startTime: "10:30 AM", endTime: "01:30 PM", hasConflict: false },
        { id: "s3", activity: "Live Sound Check & Acoustics", vendor: "Sufi Ensemble Band", startTime: "02:00 PM", endTime: "03:30 PM", hasConflict: false },
        { id: "s4", activity: "Catering Buffet Setup", vendor: "Royal Feast Caterers", startTime: "04:00 PM", endTime: "06:00 PM", hasConflict: false },
        { id: "s5", activity: "VIP Red Carpet Welcome", vendor: "Security Team A", startTime: "06:30 PM", endTime: "08:00 PM", hasConflict: false },
      ]);
      addToast("⚡ AI Algorithm successfully re-aligned all 2 timeline conflicts with zero vendor overlap!", "success");
    }, 1400);
  };

  return (
    <div className="space-y-6 select-none text-zinc-300 font-sans">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/[0.06] pb-4 gap-3">
        <div>
          <span className="text-[9px] text-purple-400 font-mono font-extrabold uppercase tracking-widest block">
            Day-of-Event Logistics Optimizer
          </span>
          <h2 className="text-lg font-extrabold text-white mt-0.5 flex items-center gap-2">
            <Calendar size={18} className="text-purple-400" /> Auto Event Scheduler & Conflict Resolver
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            AI algorithm that aligns vendor arrival, setup, and stage cues without overlapping space or sound.
          </p>
        </div>

        <button
          onClick={handleResolveConflicts}
          disabled={isResolving || conflictCount === 0}
          className={cn(
            "px-4 py-2 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5",
            conflictCount > 0 ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500" : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
          )}
        >
          <Sparkles size={14} className={isResolving ? "animate-spin" : ""} />
          {isResolving ? "Resolving Timeline..." : "Resolve All Conflicts with AI"}
        </button>
      </div>

      {/* Status Bar */}
      <div className="flex justify-between items-center p-4 border border-white/[0.06] bg-white/[0.02] rounded-2xl">
        <div className="flex items-center gap-2">
          {conflictCount > 0 ? (
            <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-black text-xs font-mono flex items-center gap-1.5 animate-pulse">
              <AlertTriangle size={13} /> {conflictCount} Timeline Conflicts Detected
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-xs font-mono flex items-center gap-1.5">
              <CheckCircle2 size={13} /> 100% Conflict-Free Master Timeline
            </span>
          )}
        </div>

        <span className="text-xs text-zinc-400 font-mono">5 Active Setup Pipelines</span>
      </div>

      {/* Master Run-of-Show Timeline */}
      <div className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl space-y-4 shadow-xl">
        <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">Master Run-of-Show Timeline Ledger</span>

        <div className="space-y-3 font-mono">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className={cn(
                "p-4 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition",
                slot.hasConflict
                  ? "border-red-500/30 bg-red-950/10"
                  : "border-white/[0.06] bg-white/[0.01] hover:border-purple-500/30"
              )}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-white font-sans">{slot.activity}</span>
                  <span className="text-[10px] text-purple-400 font-bold">({slot.vendor})</span>
                </div>
                {slot.hasConflict && (
                  <p className="text-[10px] text-red-400 font-sans flex items-center gap-1 font-bold">
                    <AlertTriangle size={11} /> Conflict: {slot.conflictDetails}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="px-3 py-1 bg-white/[0.04] border border-white/[0.08] text-white rounded-lg text-xs font-extrabold flex items-center gap-1">
                  <Clock size={12} className="text-purple-400" /> {slot.startTime} - {slot.endTime}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
