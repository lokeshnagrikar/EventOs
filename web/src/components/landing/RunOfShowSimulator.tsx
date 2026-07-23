"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sparkles, Calendar, CheckCircle2, AlertTriangle, RefreshCw, Zap, ArrowRight, Clock } from "lucide-react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { useAuthModalStore } from "@/store/authModalStore";

interface TimelineItem {
  id: string;
  time: string;
  title: string;
  vendor: string;
  location: string;
  status: "completed" | "conflict" | "resolved" | "scheduled";
  conflictText?: string;
  resolutionText?: string;
}

const initialItems: TimelineItem[] = [
  {
    id: "t1",
    time: "08:00 AM",
    title: "Stage Rigging & Floral Arch Ingress",
    vendor: "Luxury Decor Co. & SoundWorks",
    location: "Main Lawn Stage",
    status: "completed",
  },
  {
    id: "t2",
    time: "11:30 AM",
    title: "DJ Sound Check & Bass Leveling",
    vendor: "BeatSync DJ & Catering Staff",
    location: "Grand Ballroom & Stage",
    status: "conflict",
    conflictText: "⚠️ Timeline Overlap Detected: Sound Check overlaps with Live Flambé Catering Prep.",
    resolutionText: "✓ AI Auto-Shifted DJ Sound Check to 10:45 AM (0 Conflict Guaranteed).",
  },
  {
    id: "t3",
    time: "02:00 PM",
    title: "VIP Guest Reception & PWA Check-In",
    vendor: "EventOS Mobile Gateways",
    location: "South Gate Entrance",
    status: "scheduled",
  },
  {
    id: "t4",
    time: "06:30 PM",
    title: "Grand Entrance & Pyrotechnics Launch",
    vendor: "PyroTech & Event Coordinators",
    location: "Center Stage",
    status: "scheduled",
  },
];

export function RunOfShowSimulator() {
  const shouldReduceMotion = useReducedMotion();
  const openModal = useAuthModalStore((state) => state.openModal);

  const [items, setItems] = useState<TimelineItem[]>(initialItems);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [isResolved, setIsResolved] = useState<boolean>(false);

  const handleResolveConflict = () => {
    setIsResolving(true);
    setTimeout(() => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === "t2"
            ? { ...item, time: "10:45 AM", status: "resolved" }
            : item
        )
      );
      setIsResolving(false);
      setIsResolved(true);
    }, 1100);
  };

  const handleReset = () => {
    setItems(initialItems);
    setIsResolved(false);
  };

  return (
    <section className="py-24 bg-[#09090b] relative overflow-hidden border-b border-white/5 font-sans" id="timeline-simulator">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[500px] h-[300px] bg-purple-600/10 blur-[130px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[250px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-widest backdrop-blur-md">
            <Sparkles size={13} className="text-cyan-400" /> Interactive Timeline Simulator
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-heading leading-tight">
            See how AI resolves venue schedule overlaps in real-time
          </h2>

          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Test the EventOS AI Auto-Scheduler below. Click the conflict button to watch the AI automatically resolve vendor timeline collisions.
          </p>
        </motion.div>

        {/* Timeline Simulator Console */}
        <div className="max-w-4xl mx-auto rounded-3xl border border-white/10 bg-neutral-900/60 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl space-y-8 relative overflow-hidden">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Calendar size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-heading">Royal Gala Run-of-Show</h3>
                <span className="text-xs text-zinc-400">Live Timeline · 1,200 Attendees · Grand Banquet Lawn</span>
              </div>
            </div>

            {/* Action Trigger */}
            <div className="flex items-center gap-3">
              {!isResolved ? (
                <button
                  onClick={handleResolveConflict}
                  disabled={isResolving}
                  className="py-2.5 px-5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 border border-amber-400/40 flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  {isResolving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>AI Re-calculating Schedule...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={14} className="fill-white" />
                      <span>Resolve Conflict with AI Co-pilot</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleReset}
                  className="py-2 px-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw size={12} />
                  <span>Reset Simulation</span>
                </button>
              )}
            </div>
          </div>

          {/* Interactive Timeline List */}
          <div className="space-y-4 relative">
            <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-purple-500 via-cyan-500 to-zinc-800 z-0 hidden sm:block" />

            {items.map((item) => {
              const isConflict = item.status === "conflict";
              const isItemResolved = item.status === "resolved";

              return (
                <motion.div
                  key={item.id}
                  layout
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className={cn(
                    "relative z-10 p-4 sm:p-5 rounded-2xl border transition-all duration-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
                    isConflict
                      ? "bg-amber-500/10 border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)]"
                      : isItemResolved
                      ? "bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                      : "bg-white/[0.02] border-white/10 hover:border-white/20"
                  )}
                >
                  <div className="flex items-start sm:items-center gap-4">
                    {/* Time Pill */}
                    <div className={cn(
                      "px-3 py-1.5 rounded-xl font-mono text-xs font-black shrink-0 border flex items-center gap-1.5",
                      isConflict
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : isItemResolved
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-white/5 text-zinc-300 border-white/10"
                    )}>
                      <Clock size={12} />
                      <span>{item.time}</span>
                    </div>

                    {/* Details */}
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white font-heading">{item.title}</h4>
                      <p className="text-xs text-zinc-400">{item.vendor} · <span className="text-zinc-500">{item.location}</span></p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {item.status === "completed" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                        <CheckCircle2 size={12} /> Completed
                      </span>
                    )}

                    {isConflict && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-extrabold animate-pulse">
                        <AlertTriangle size={12} /> Conflict Overlap
                      </span>
                    )}

                    {isItemResolved && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-extrabold">
                        <CheckCircle2 size={12} /> AI Resolved
                      </span>
                    )}

                    {item.status === "scheduled" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-[11px] font-semibold">
                        Scheduled
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Dynamic Conflict Callout Banner */}
          <AnimatePresence mode="wait">
            {!isResolved ? (
              <motion.div
                key="conflict-banner"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle size={16} className="shrink-0 text-amber-400" />
                  <span><strong>Warning:</strong> DJ Sound Check overlaps with Live Flambé Catering. Click above to let AI auto-shift times.</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="resolved-banner"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                  <span><strong>AI Success:</strong> Schedule optimized! 0 vendor overlaps found across 1,200 attendees.</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer CTA */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-zinc-400">Automate your run-of-show timelines with EventOS AI.</span>
            <button
              onClick={() => openModal("register")}
              className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all duration-300 flex items-center gap-2 cursor-pointer"
            >
              <span>Build Your AI Timelines</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
