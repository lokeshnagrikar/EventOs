"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  MessageSquareWarning,
  Zap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Clock,
  HardDrive,
  Check,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Maximize2
} from "lucide-react";
import { Icon } from "@iconify/react";
import { useAuthModalStore } from "@/store/authModalStore";

export function ChaosVsEventOsSlider() {
  const shouldReduceMotion = useReducedMotion();
  const openModal = useAuthModalStore((state) => state.openModal);

  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage (0 to 100)
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove]
  );

  const handleStopDrag = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleStopDrag);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleStopDrag);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleStopDrag);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleStopDrag);
    };
  }, [isDragging, handleMouseMove, handleTouchMove, handleStopDrag]);

  return (
    <section className="py-24 bg-[#0B0F19] text-white relative overflow-hidden select-none border-y border-slate-800">
      {/* Background Top Specular Line */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-purple-600/10 blur-[150px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <Sliders size={14} className="text-purple-400" />
            <span>Interactive Before & After Comparison</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading tracking-tight text-white">
            The Chaos You Live In vs.{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
              The EventOS Standard
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">
            Drag the slider horizontally to experience the stark difference between juggling 5 disconnected tools and running a unified agency command center.
          </p>

          {/* Quick Preset Buttons */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setSliderPosition(15)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                sliderPosition < 30
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  : "bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white"
              }`}
            >
              The Chaos (15%)
            </button>
            <button
              onClick={() => setSliderPosition(50)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                sliderPosition >= 30 && sliderPosition <= 70
                  ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                  : "bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white"
              }`}
            >
              50 / 50 Split
            </button>
            <button
              onClick={() => setSliderPosition(85)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                sliderPosition > 70
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white"
              }`}
            >
              EventOS (85%)
            </button>
          </div>
        </div>

        {/* Interactive Split Slider Container */}
        <div
          ref={containerRef}
          className="relative w-full h-[540px] sm:h-[500px] rounded-3xl overflow-hidden border-2 border-slate-700/80 shadow-2xl shadow-purple-950/40 cursor-ew-resize select-none touch-none"
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
        >
          {/* ── 1. RIGHT LAYER: WITH EVENTOS (Clean, Modern, Automated) ── */}
          <div className="absolute inset-0 bg-[#070B14] p-6 sm:p-10 flex flex-col justify-between overflow-hidden">
            {/* Top Bar Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="h-8 w-8 rounded-xl bg-purple-600 text-white font-extrabold text-xs flex items-center justify-center shadow-md shadow-purple-500/30">
                  OS
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                    <span>EventOS Command Center</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Live Production v1.0
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">1 Unified Multi-Tenant Workspace for Indian Agencies</p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-400 font-mono">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All 12 Modules Synced</span>
              </div>
            </div>

            {/* EventOS 4 High-Tech Value Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-auto">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-1.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> 45-Second Quotes
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">18% GST Auto-Split</span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  Kapoor Grand Sangeet Proposal (₹9.14 Lakh)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Itemized line items, digital signature stamp, and 1-click WhatsApp share ready.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/30 space-y-1.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1">
                    <QrCode size={12} /> 0% Fee UPI QR Advances
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">₹2,74,350 Cleared</span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  30-40-30 Milestone Auto-Invoicing
                </h4>
                <p className="text-[11px] text-slate-400">
                  Zero manual follow-up calls. Clients scan UPI QR to lock event dates instantly.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-1.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                    <Clock size={12} /> Real-Time Stage Cues
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">0 Overlaps</span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  Live Run-of-Show Synchronization
                </h4>
                <p className="text-[11px] text-slate-400">
                  Baraat delay auto-shifts Sangeet pyro to 08:50 PM. Sound, Emcee & Crew notified.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-pink-500/30 space-y-1.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-pink-400 flex items-center gap-1">
                    <Sparkles size={12} /> AI Face-Match Gallery
                  </span>
                  <span className="text-[10px] font-mono text-pink-400 font-bold">0 Drive Links</span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  1,200 RAW Photos Delivered in 3 Seconds
                </h4>
                <p className="text-[11px] text-slate-400">
                  Guests snap a selfie to instantly find all their photos. No storage quota limits.
                </p>
              </div>
            </div>

            {/* Bottom Performance Strip */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <ShieldCheck size={14} /> 100% Tenant Data Isolation
              </span>
              <span className="font-mono text-purple-300 font-bold">14+ Hours Reclaimed Weekly</span>
            </div>
          </div>

          {/* ── 2. LEFT LAYER: THE CHAOS (24 Excel Tabs, Lost Cues, Canva) ── */}
          <div
            className="absolute inset-y-0 left-0 bg-[#160B0E] border-r border-rose-500/50 p-6 sm:p-10 flex flex-col justify-between overflow-hidden shadow-2xl z-10"
            style={{ width: `${sliderPosition}%` }}
          >
            <div className="w-[850px] max-w-none flex flex-col justify-between h-full">
              {/* Top Messy Window Titlebar */}
              <div className="flex items-center justify-between pb-4 border-b border-rose-900/50">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-rose-600" />
                    <span className="h-3 w-3 rounded-full bg-amber-600" />
                    <span className="h-3 w-3 rounded-full bg-slate-700" />
                  </div>
                  <div className="flex gap-2 pl-3 text-xs font-mono text-rose-300/80 truncate">
                    <span className="bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/60">
                      Wedding_Budget_Final_v7_edit.xlsx
                    </span>
                    <span className="hidden sm:inline bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/60">
                      WhatsApp Web (47 unread)
                    </span>
                    <span className="hidden sm:inline bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/60">
                      Canva (Not Responding)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-rose-400 font-mono">
                  <AlertTriangle size={14} />
                  <span>The Chaos Today</span>
                </div>
              </div>

              {/* 4 Chaotic Friction Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-auto">
                <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-700/60 space-y-1.5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1">
                      <FileSpreadsheet size={12} /> 4 Hours in Excel & Canva
                    </span>
                    <span className="text-[10px] font-mono text-rose-400 font-bold">Manual Math</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-rose-200">
                    Broken Formulas & GST Calculation Errors
                  </h4>
                  <p className="text-[11px] text-rose-300/70">
                    Retyping items into Word templates at 1 AM. Clients finding GST math discrepancies.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-700/60 space-y-1.5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <AlertTriangle size={12} /> Unpaid 30% Advances
                    </span>
                    <span className="text-[10px] font-mono text-rose-400 font-bold">Pending 14 Days</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-rose-200">
                    Awkward Follow-Up Calls & Delays
                  </h4>
                  <p className="text-[11px] text-rose-300/70">
                    Chasing uncle and groom for booking checks while sound and stage vendors demand advances.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-700/60 space-y-1.5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1">
                      <MessageSquareWarning size={12} /> 15 WhatsApp Groups
                    </span>
                    <span className="text-[10px] font-mono text-rose-400 font-bold">Lost Stage Cues</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-rose-200">
                    11 PM Stage Fireworks Miscommunication
                  </h4>
                  <p className="text-[11px] text-rose-300/70">
                    Important cue sheets lost in endless group chats. Sound and pyrotechnics out of sync.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-700/60 space-y-1.5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1">
                      <HardDrive size={12} /> Expiring Drive Links
                    </span>
                    <span className="text-[10px] font-mono text-rose-400 font-bold">Storage Full</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-rose-200">
                    Angry Relatives Begging for Photos
                  </h4>
                  <p className="text-[11px] text-rose-300/70">
                    Links expire after 30 days. Guests scroll through 2,000 photos to find 2 pictures.
                  </p>
                </div>
              </div>

              {/* Bottom Frustration Strip */}
              <div className="pt-3 border-t border-rose-900/50 flex items-center justify-between text-xs text-rose-300/80 font-medium">
                <span className="text-rose-400 font-bold flex items-center gap-1.5">
                  <AlertTriangle size={14} /> 5 Disconnected Tools · Constant Burnout
                </span>
                <span className="font-mono text-rose-300">18+ Hours Wasted Weekly</span>
              </div>
            </div>
          </div>

          {/* ── 3. DRAGGABLE SEPARATOR & SLIDER HANDLE ─────────────────── */}
          <div
            className="absolute top-0 bottom-0 z-20 pointer-events-none flex items-center justify-center -translate-x-1/2"
            style={{ left: `${sliderPosition}%` }}
          >
            {/* Glowing Vertical Line */}
            <div className="w-[3px] h-full bg-gradient-to-b from-purple-400 via-white to-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.8)]" />

            {/* Circular Glass Handle Knob */}
            <div className="absolute top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/95 text-slate-900 border-2 border-purple-500 shadow-2xl flex items-center justify-center gap-0.5 cursor-ew-resize pointer-events-auto hover:scale-110 active:scale-95 transition-transform duration-150">
              <ChevronLeft size={16} className="text-purple-700" />
              <div className="h-4 w-[1px] bg-slate-300" />
              <ChevronRight size={16} className="text-purple-700" />
            </div>
          </div>

          {/* Floating Pill Badges (Left & Right indicator tags) */}
          <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
            <span className="px-3 py-1 rounded-full bg-rose-950/90 text-rose-300 border border-rose-700/80 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-md">
              ← The Chaos
            </span>
          </div>
          <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
            <span className="px-3 py-1 rounded-full bg-purple-950/90 text-purple-300 border border-purple-500/80 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-md">
              With EventOS →
            </span>
          </div>
        </div>

        {/* Bottom Conversion Bar */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-white font-heading">
              Ready to leave the 15-WhatsApp-group chaos behind?
            </h4>
            <p className="text-xs text-slate-400">
              We are onboarding our founding cohort of 25 agencies. Direct 1-on-1 setup with founder Lokesh.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => openModal("waitlist")}
            className="py-3.5 px-7 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span>Claim 1 of 25 Founding Slots (50% Off)</span>
            <ArrowRight size={16} />
          </motion.button>
        </div>
      </div>
    </section>
  );
}
