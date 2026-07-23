"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Calculator, Sparkles, TrendingUp, Clock, ShieldCheck, ArrowRight } from "lucide-react";
import { Icon } from "@iconify/react";
import { useAuthModalStore } from "@/store/authModalStore";

export function RoiCalculator() {
  const shouldReduceMotion = useReducedMotion();
  const openModal = useAuthModalStore((state) => state.openModal);

  // State sliders
  const [eventsPerMonth, setEventsPerMonth] = useState<number>(8);
  const [avgBudget, setAvgBudget] = useState<number>(500000);
  const [teamSize, setTeamSize] = useState<number>(4);

  // Calculations
  const hoursSavedPerMonth = Math.round(eventsPerMonth * 14.5 + teamSize * 3);
  const revenueRecoveredPerMonth = Math.round(eventsPerMonth * avgBudget * 0.065);
  const annualValueCreated = (hoursSavedPerMonth * 650 + revenueRecoveredPerMonth) * 12;
  const estimatedRoiMultiplier = Math.round(annualValueCreated / 71988);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} Lakh`;
    return `₹${val.toLocaleString()}`;
  };

  return (
    <section className="py-24 bg-[#09090b] relative overflow-hidden border-b border-white/5 font-sans" id="roi-calculator">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-purple-600/15 via-indigo-600/10 to-cyan-500/15 blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-widest backdrop-blur-md">
            <Calculator size={13} className="text-purple-400" /> Interactive ROI Calculator
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-heading leading-tight">
            Calculate your time & revenue gains with EventOS
          </h2>

          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            See how much manual coordination time and lost deposit revenue EventOS recovers for your agency every month.
          </p>
        </motion.div>

        {/* Calculator Widget Container */}
        <div className="grid lg:grid-cols-12 gap-8 max-w-6xl mx-auto items-stretch">
          {/* Left Column: Interactive Sliders */}
          <motion.div
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 rounded-3xl border border-white/10 bg-neutral-900/50 backdrop-blur-2xl p-6 sm:p-8 space-y-8 flex flex-col justify-between shadow-2xl"
          >
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white font-heading flex items-center gap-2">
                <Icon icon="solar:slider-vertical-bold-duotone" className="text-purple-400" />
                Configure Your Agency Parameters
              </h3>

              {/* Slider 1: Events per Month */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <label className="font-semibold text-zinc-200">Events Managed per Month</label>
                  <span className="font-extrabold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                    {eventsPerMonth} Events
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={40}
                  value={eventsPerMonth}
                  onChange={(e) => setEventsPerMonth(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-bold">
                  <span>1 Event</span>
                  <span>20 Events</span>
                  <span>40+ Events</span>
                </div>
              </div>

              {/* Slider 2: Average Event Budget */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <label className="font-semibold text-zinc-200">Average Event Budget / Value</label>
                  <span className="font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    {formatCurrency(avgBudget)}
                  </span>
                </div>
                <input
                  type="range"
                  min={50000}
                  max={3000000}
                  step={50000}
                  value={avgBudget}
                  onChange={(e) => setAvgBudget(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-bold">
                  <span>₹50K</span>
                  <span>₹15 Lakh</span>
                  <span>₹30 Lakh+</span>
                </div>
              </div>

              {/* Slider 3: Team Members */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <label className="font-semibold text-zinc-200">Coordinators & Team Seats</label>
                  <span className="font-extrabold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                    {teamSize} Members
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={teamSize}
                  onChange={(e) => setTeamSize(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-bold">
                  <span>1 Solo Planner</span>
                  <span>10 Seats</span>
                  <span>20 Seats</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center gap-3 text-xs text-zinc-400">
              <ShieldCheck size={16} className="text-purple-400 shrink-0" />
              <span>Calculations based on 2026 industry benchmarks across 10,000+ agency events.</span>
            </div>
          </motion.div>

          {/* Right Column: Dynamic Results Cards */}
          <motion.div
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 rounded-3xl border border-purple-500/30 bg-gradient-to-b from-neutral-900/90 via-neutral-900/95 to-black backdrop-blur-2xl p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-[0_0_80px_rgba(139,92,246,0.25)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl pointer-events-none" />

            <div>
              <span className="text-[10px] font-black uppercase text-purple-400 tracking-widest block mb-1">
                Estimated Impact Summary
              </span>
              <h4 className="text-2xl font-bold text-white font-heading">Your Monthly Yield</h4>

              {/* Dynamic Stats Grid */}
              <div className="space-y-4 mt-6">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <Clock size={20} />
                    </div>
                    <div>
                      <span className="text-xs text-zinc-400 block font-medium">Time Reclaimed</span>
                      <span className="text-xl font-extrabold text-white font-heading">{hoursSavedPerMonth} hrs/mo</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-purple-300 font-bold bg-purple-500/20 px-2 py-0.5 rounded-full">
                    +{Math.round(hoursSavedPerMonth / 8)} Days Saved
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <span className="text-xs text-zinc-400 block font-medium">Scope Leakage Recovered</span>
                      <span className="text-xl font-extrabold text-emerald-400 font-heading">{formatCurrency(revenueRecoveredPerMonth)}/mo</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full">
                    Protected
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-purple-900/40 border border-purple-400/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest block">Estimated Annual Return</span>
                    <span className="text-3xl font-black text-white font-heading">{estimatedRoiMultiplier}x ROI</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 block">Annual Net Value</span>
                    <span className="text-base font-bold text-purple-300 font-heading">{formatCurrency(annualValueCreated)}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => openModal("register")}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm transition-all duration-300 shadow-lg shadow-purple-600/30 border border-purple-400/40 flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>Unlock Your ROI — Start 14-Day Free Trial</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
