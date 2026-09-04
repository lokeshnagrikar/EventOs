"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Calculator, Sparkles, TrendingUp, Clock, ShieldCheck, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import { Icon } from "@iconify/react";
import { useAuthModalStore } from "@/store/authModalStore";
import { cn } from "@/lib/utils";

interface AgencyPreset {
  id: string;
  name: string;
  events: number;
  budget: number;
  team: number;
  icon: string;
}

const PRESETS: AgencyPreset[] = [
  { id: "wedding", name: "Boutique Wedding Planner", events: 6, budget: 800000, team: 4, icon: "solar:heart-bold-duotone" },
  { id: "corporate", name: "Corporate Event House", events: 15, budget: 450000, team: 8, icon: "solar:case-bold-duotone" },
  { id: "production", name: "Sound & Stage Production", events: 22, budget: 350000, team: 12, icon: "solar:music-note-bold-duotone" },
];

export function RoiCalculator() {
  const shouldReduceMotion = useReducedMotion();
  const openModal = useAuthModalStore((state) => state.openModal);

  // State sliders
  const [eventsPerMonth, setEventsPerMonth] = useState<number>(8);
  const [avgBudget, setAvgBudget] = useState<number>(500000);
  const [teamSize, setTeamSize] = useState<number>(4);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Calculations
  const totalMonthlyVolume = eventsPerMonth * avgBudget;
  const hoursSavedPerMonth = Math.round(eventsPerMonth * 14.5 + teamSize * 3);
  const revenueRecoveredPerMonth = Math.round(eventsPerMonth * avgBudget * 0.065);
  const annualValueCreated = (hoursSavedPerMonth * 650 + revenueRecoveredPerMonth) * 12;
  const estimatedRoiMultiplier = Math.max(4, Math.round(annualValueCreated / 71988));

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} Lakh`;
    return `₹${val.toLocaleString()}`;
  };

  const applyPreset = (preset: AgencyPreset) => {
    setActivePreset(preset.id);
    setEventsPerMonth(preset.events);
    setAvgBudget(preset.budget);
    setTeamSize(preset.team);
  };

  return (
    <section className="py-24 bg-[#FAF9F6] relative overflow-hidden border-b border-slate-200/80 font-sans" id="roi-calculator">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-purple-100/30 blur-[140px] rounded-full pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-700 text-xs font-bold uppercase tracking-widest backdrop-blur-md font-mono">
            <Calculator size={13} className="text-purple-600" /> Interactive Agency Yield Calculator
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight font-heading leading-tight">
            Calculate your agency's time & revenue gains
          </h2>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
            See how much manual coordination time, scope leakage, and uncollected milestone deposits EventOS recovers for your team every month.
          </p>
        </motion.div>

        {/* Preset Selector Chips */}
        <div className="flex flex-wrap justify-center items-center gap-3 mb-10">
          <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wide mr-1">Quick Presets:</span>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-extrabold transition border flex items-center gap-2 cursor-pointer active:scale-95",
                activePreset === p.id
                  ? "bg-purple-900 border-purple-500/50 text-white shadow-md"
                  : "bg-white/80 border-slate-200/80 text-slate-700 hover:text-slate-900 hover:border-slate-300 shadow-sm"
              )}
            >
              <Icon icon={p.icon} className="text-purple-600 text-sm" />
              <span>{p.name}</span>
            </button>
          ))}
        </div>

        {/* Calculator Widget Container */}
        <div className="grid lg:grid-cols-12 gap-8 max-w-6xl mx-auto items-stretch">
          {/* Left Column: Interactive Sliders */}
          <motion.div
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-xl p-6 sm:p-8 space-y-8 flex flex-col justify-between shadow-xl shadow-slate-200/40 relative overflow-hidden"
          >
            <div className="space-y-7">
              <div className="flex flex-wrap justify-between items-center gap-2 pb-3 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Icon icon="solar:slider-vertical-bold-duotone" className="text-purple-600" />
                  <span>Configure Agency Parameters</span>
                </h3>
                <span className="text-[10px] font-mono font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                  Monthly Volume: {formatCurrency(totalMonthlyVolume)}
                </span>
              </div>

              {/* Slider 1: Events per Month */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-800">Events Managed per Month</label>
                  <span className="font-extrabold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 font-mono">
                    {eventsPerMonth} Events
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={40}
                  value={eventsPerMonth}
                  onChange={(e) => {
                    setActivePreset(null);
                    setEventsPerMonth(Number(e.target.value));
                  }}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-bold font-mono">
                  <span>1 Event</span>
                  <span>20 Events</span>
                  <span>40+ Events</span>
                </div>
              </div>

              {/* Slider 2: Average Event Budget */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-800">Average Event Budget / Quote Value</label>
                  <span className="font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-mono">
                    {formatCurrency(avgBudget)}
                  </span>
                </div>
                <input
                  type="range"
                  min={50000}
                  max={3000000}
                  step={50000}
                  value={avgBudget}
                  onChange={(e) => {
                    setActivePreset(null);
                    setAvgBudget(Number(e.target.value));
                  }}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-bold font-mono">
                  <span>₹50K</span>
                  <span>₹15 Lakh</span>
                  <span>₹30 Lakh+</span>
                </div>
              </div>

              {/* Slider 3: Team Members */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-800">Coordinators & Team Seats</label>
                  <span className="font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 font-mono">
                    {teamSize} Members
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={teamSize}
                  onChange={(e) => {
                    setActivePreset(null);
                    setTeamSize(Number(e.target.value));
                  }}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-bold font-mono">
                  <span>1 Solo Coordinator</span>
                  <span>10 Seats</span>
                  <span>20 Seats</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-500 font-medium">
              <ShieldCheck size={16} className="text-purple-600 shrink-0" />
              <span>Yield benchmarks calibrated from 10,000+ Indian wedding & event agency operations.</span>
            </div>
          </motion.div>

          {/* Right Column: Dynamic Results Cards */}
          <motion.div
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 rounded-3xl border border-purple-200/90 bg-white/95 backdrop-blur-xl p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-xl shadow-purple-500/10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-purple-100/40 blur-3xl pointer-events-none" />

            <div>
              <span className="text-[10px] font-black uppercase text-purple-700 tracking-widest block mb-1 font-mono">
                Realized Agency Monthly Yield
              </span>
              <h4 className="text-2xl font-black text-slate-900 font-heading">Monthly Time & Capital Recovered</h4>

              {/* Dynamic Stats Grid */}
              <div className="space-y-4 mt-6">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block font-bold">Time Reclaimed</span>
                      <span className="text-xl font-black text-slate-900 font-mono">{hoursSavedPerMonth} hrs/mo</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-purple-700 font-bold bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full font-mono">
                    +{Math.round(hoursSavedPerMonth / 8)} Days Saved
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block font-bold">Scope Leakage Recovered</span>
                      <span className="text-xl font-black text-emerald-600 font-mono">{formatCurrency(revenueRecoveredPerMonth)}/mo</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-mono">
                    Protected
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border-2 border-purple-200/90 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-[10px] font-black text-purple-800 uppercase tracking-widest block font-mono">Estimated Annual Return</span>
                    <span className="text-3xl font-black text-purple-900 font-mono tracking-tight">{estimatedRoiMultiplier}x ROI</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block font-bold">Annual Net Value</span>
                    <span className="text-base font-black text-purple-700 font-mono">{formatCurrency(annualValueCreated)}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => openModal("register")}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-extrabold text-xs transition-all duration-300 shadow-lg shadow-purple-600/20 border border-purple-400/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 group"
            >
              <span>Activate Your Agency Yield — Start 14-Day Free Trial</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
