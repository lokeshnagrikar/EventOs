"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sparkles, Calendar, CheckCircle2, AlertTriangle, RefreshCw, Zap, ArrowRight, Clock, Volume2, ShieldCheck, MessageSquare } from "lucide-react";
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
    title: "Floral Mandap & Stage Scenography Ingress",
    vendor: "Royal Stage Decorators & Scenography",
    location: "Royal Banquet Lawns",
    status: "completed",
  },
  {
    id: "t2",
    time: "11:00 AM",
    title: "JBL Line Array Sound Check & Bass Leveling",
    vendor: "BeatSync DJ & Catering Technical Staff",
    location: "Grand Ballroom Stage",
    status: "conflict",
    conflictText: "⚠️ Timeline Overlap Detected: Heavy Sound Check overlaps with Live Flambé Catering Setup in Ballroom.",
    resolutionText: "✓ AI Auto-Shifted Sound Check to 10:15 AM (0 Venue Conflict Guaranteed).",
  },
  {
    id: "t3",
    time: "02:30 PM",
    title: "Baraat Welcome & Offline PWA Gate Check-In",
    vendor: "EventOS Mobile Gateways & Hospitality Crew",
    location: "South Entrance Gate",
    status: "scheduled",
  },
  {
    id: "t4",
    time: "07:30 PM",
    title: "Sangeet Stage Pyrotechnics & 40ft LED Screen Rigging",
    vendor: "PyroTech & Video Rigging Roster",
    location: "Main Stage Arena",
    status: "scheduled",
  },
];

export function RunOfShowSimulator() {
  const shouldReduceMotion = useReducedMotion();
  const openModal = useAuthModalStore((state) => state.openModal);

  const [items, setItems] = useState<TimelineItem[]>(initialItems);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [isResolved, setIsResolved] = useState<boolean>(false);
  const [whatsappSent, setWhatsappSent] = useState<boolean>(false);

  const handleResolveConflict = () => {
    setIsResolving(true);
    setTimeout(() => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === "t2"
            ? { ...item, time: "10:15 AM", status: "resolved" }
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
    setWhatsappSent(false);
  };

  const handleSendWhatsapp = () => {
    setWhatsappSent(true);
    setTimeout(() => setWhatsappSent(false), 3000);
  };

  return (
    <section className="py-24 bg-transparent relative overflow-hidden border-b border-purple-500/10 font-sans" id="timeline-simulator">
      {/* Background Radial Glows */}
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
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 uppercase">
            <Icon icon="solar:star-shine-bold-duotone" className="text-purple-400 text-sm" />
            AI Co-Pilot & Run-of-Show Engine
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-heading text-balance">
            Zero Venue Slot Conflicts.{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
              100% Automated.
            </span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed font-medium">
            Test the live AI Conflict Engine below. When sound checks, stage rigging, or catering prep overlap, EventOS automatically recalculates the optimal run-of-show schedule and alerts vendors on WhatsApp.
          </p>
        </motion.div>

        {/* Interactive Simulator Shell */}
        <div className="max-w-4xl mx-auto bg-zinc-950/70 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.8),0_0_40px_rgba(168,85,247,0.12)] backdrop-blur-2xl relative overflow-hidden space-y-6">
          {/* Top Line Accent */}
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500" />

          {/* Simulator Bar Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-zinc-850">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-950/60 border border-purple-500/30 px-3 py-1 rounded-full inline-block mb-1 font-mono">
                LIVE DEMO • Event ID: #EOS-ROYAL-928
              </span>
              <h3 className="text-lg font-black text-white">Royal Palace Wedding — Run of Show Timeline</h3>
            </div>

            <div className="flex items-center gap-2">
              {!isResolved ? (
                <button
                  onClick={handleResolveConflict}
                  disabled={isResolving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/20 active:scale-95 transition flex items-center gap-2 cursor-pointer"
                >
                  {isResolving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin text-white" />
                      <span>AI Recalculating Schedule...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={14} className="text-cyan-300" />
                      <span>Run AI Conflict Resolver</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSendWhatsapp}
                    className="px-4 py-2 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition hover:bg-emerald-900/60 flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare size={13} className="text-emerald-400" />
                    <span>{whatsappSent ? "Vendor Alert Sent ✓" : "Notify Vendor on WhatsApp"}</span>
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition cursor-pointer"
                  >
                    Reset Demo
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Feed Container */}
          <div className="space-y-4 relative">
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={cn(
                  "p-4 sm:p-5 rounded-2xl border transition-all text-xs relative overflow-hidden",
                  item.status === "completed" && "bg-zinc-900/30 border-zinc-800 text-zinc-400",
                  item.status === "scheduled" && "bg-zinc-900/50 border-zinc-800 text-zinc-300",
                  item.status === "conflict" && "bg-amber-950/30 border-amber-500/50 text-amber-200 shadow-[0_0_30px_rgba(245,158,11,0.15)] animate-pulse",
                  item.status === "resolved" && "bg-emerald-950/30 border-emerald-500/50 text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-24 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center font-mono font-black text-sm text-purple-300 shrink-0">
                      {item.time}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                        <span>{item.title}</span>
                        {item.id === "t2" && item.status === "conflict" && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-zinc-400 font-semibold mt-0.5">
                        {item.vendor} • <span className="text-zinc-300">{item.location}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border font-mono",
                      item.status === "completed" && "bg-zinc-900 text-zinc-400 border-zinc-800",
                      item.status === "scheduled" && "bg-purple-950/60 text-purple-300 border-purple-500/30",
                      item.status === "conflict" && "bg-amber-950 text-amber-400 border-amber-500/50 font-bold",
                      item.status === "resolved" && "bg-emerald-950 text-emerald-400 border-emerald-500/50 font-bold"
                    )}>
                      {item.status === "completed" ? "Done ✓" :
                       item.status === "scheduled" ? "Scheduled" :
                       item.status === "conflict" ? "Slot Overlap" : "AI Shifted ✓"}
                    </span>
                  </div>
                </div>

                {/* Banner Notes for Conflict & Resolution */}
                <AnimatePresence mode="wait">
                  {item.conflictText && item.status === "conflict" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-[11px] font-bold flex items-center gap-2"
                    >
                      <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                      <span>{item.conflictText}</span>
                    </motion.div>
                  )}

                  {item.resolutionText && item.status === "resolved" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-2"
                    >
                      <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                      <span>{item.resolutionText}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Simulator Footer Security Note */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-zinc-500 font-bold border-t border-zinc-900">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-purple-400" />
              <span>Multi-Vendor Conflict Resolution Algorithm v2.4 Active</span>
            </div>
            <button
              onClick={() => openModal("register")}
              className="text-purple-400 hover:text-purple-300 transition flex items-center gap-1 font-extrabold cursor-pointer"
            >
              <span>Unlock AI Scheduler for Your Agency</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
