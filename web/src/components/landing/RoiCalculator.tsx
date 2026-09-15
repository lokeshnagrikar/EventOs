"use client";

import React, { useState, useEffect } from "react";
import { motion, useReducedMotion, useMotionValue, animate } from "framer-motion";
import {
  Clock,
  Calendar,
  Users,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Info,
  Sparkles,
} from "lucide-react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";
import { useAuthModalStore } from "@/store/authModalStore";

function AnimatedCounter({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const shouldReduceMotion = useReducedMotion();
  const motionVal = useMotionValue(value);
  const [displayVal, setDisplayVal] = useState(value);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayVal(value);
      return;
    }
    const controls = animate(motionVal, value, {
      duration: 0.35,
      ease: "easeOut",
      onUpdate: (latest) => {
        if (decimals > 0) {
          setDisplayVal(Number(latest.toFixed(decimals)));
        } else {
          setDisplayVal(Math.round(latest));
        }
      },
    });
    return () => controls.stop();
  }, [value, decimals, shouldReduceMotion]);

  return <span>{displayVal.toLocaleString("en-IN")}</span>;
}

interface Preset {
  id: string;
  name: string;
  events: number;
  avgValue: number;
  team: number;
  adminHours: number;
  icon: string;
}

const PRESETS: Preset[] = [
  {
    id: "boutique",
    name: "Boutique Wedding Planner",
    events: 4,
    avgValue: 800000,
    team: 3,
    adminHours: 16,
    icon: "solar:heart-bold-duotone",
  },
  {
    id: "destination",
    name: "Destination Wedding Agency",
    events: 8,
    avgValue: 1500000,
    team: 6,
    adminHours: 18,
    icon: "solar:star-bold-duotone",
  },
  {
    id: "corporate",
    name: "Corporate & Social Events",
    events: 12,
    avgValue: 400000,
    team: 5,
    adminHours: 10,
    icon: "solar:case-bold-duotone",
  },
];

export function RoiCalculator() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const openModal = useAuthModalStore((state) => state.openModal);

  // 4 Core Inputs
  const [monthlyEvents, setMonthlyEvents] = useState<number>(4);
  const [avgEventValue, setAvgEventValue] = useState<number>(600000);
  const [teamMembers, setTeamMembers] = useState<number>(4);
  const [hoursPerEvent, setHoursPerEvent] = useState<number>(14);
  const [activePreset, setActivePreset] = useState<string | null>("boutique");

  // Calculations (Conservative 35% admin reduction through centralized workflows)
  const totalMonthlyAdminSpent = monthlyEvents * hoursPerEvent;
  const adminHoursSavedMonthly = Math.max(2, Math.round(totalMonthlyAdminSpent * 0.35));
  const yearlyTimeRecoveredHours = adminHoursSavedMonthly * 12;
  const workingDaysRecovered = Math.round(yearlyTimeRecoveredHours / 8);
  const hoursPerTeamMember = Math.max(1, Math.round((adminHoursSavedMonthly / teamMembers) * 10) / 10);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} Lakh`;
    return `₹${val.toLocaleString("en-IN")}`;
  };

  const applyPreset = (preset: Preset) => {
    setActivePreset(preset.id);
    setMonthlyEvents(preset.events);
    setAvgEventValue(preset.avgValue);
    setTeamMembers(preset.team);
    setHoursPerEvent(preset.adminHours);
  };

  const handleBookDemo = () => {
    analytics.trackCta("calculator_book_demo", "Book a Free Demo", "roi_calculator");
    router.push("/demo");
  };

  const handleStartTrial = () => {
    analytics.trackCta("calculator_start_trial", "Start 14-Day Free Trial", "roi_calculator");
    openModal("register");
  };

  return (
    <section
      id="time-calculator"
      className="py-24 sm:py-32 bg-[#FAF9F6] relative overflow-hidden border-b border-slate-200/80 font-sans text-left"
    >
      {/* Background radial tints */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-purple-100/25 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200/80 text-purple-700 text-xs font-bold uppercase tracking-widest">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span>Operational Efficiency Estimator</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight font-heading leading-[1.12]">
            See How EventOS Can{" "}
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">
              Simplify Your Workflow.
            </span>
          </h2>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-medium max-w-2xl mx-auto">
            Stop losing days to quotation drafting, timeline coordination and WhatsApp chasing. Estimate how much admin time your team recovers with EventOS.
          </p>

          {/* Quick Presets */}
          <div className="pt-2 flex flex-wrap justify-center items-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-1">Agency Profile:</span>
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer active:scale-95 duration-150",
                  activePreset === p.id
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs scale-[1.02]"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <Icon icon={p.icon} className="text-sm" />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Calculator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto items-stretch">
          {/* Left Column: 4 Transparent Inputs */}
          <div className="lg:col-span-7 rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 space-y-6 shadow-xl shadow-slate-200/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-600" />
                  <span>Your Agency Details</span>
                </h3>
                <span className="text-[11px] font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                  <AnimatedCounter value={totalMonthlyAdminSpent} /> Total Admin Hrs/Mo
                </span>
              </div>

              <div className="space-y-6">
                {/* Input 1: Monthly events */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-600" />
                      <span>Monthly Events</span>
                    </label>
                    <span className="font-mono font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md">
                      {monthlyEvents} {monthlyEvents === 1 ? "event" : "events"} / mo
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={25}
                    step={1}
                    value={monthlyEvents}
                    onChange={(e) => {
                      setActivePreset(null);
                      setMonthlyEvents(Number(e.target.value));
                    }}
                    style={{
                      background: `linear-gradient(to right, #9333ea ${((monthlyEvents - 1) / (25 - 1)) * 100}%, #f1f5f9 ${((monthlyEvents - 1) / (25 - 1)) * 100}%)`,
                    }}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>1 event</span>
                    <span>12 events</span>
                    <span>25 events</span>
                  </div>
                </div>

                {/* Input 2: Average event value */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Average Event Value</span>
                    </label>
                    <span className="font-mono font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md">
                      {formatCurrency(avgEventValue)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={100000}
                    max={3000000}
                    step={50000}
                    value={avgEventValue}
                    onChange={(e) => {
                      setActivePreset(null);
                      setAvgEventValue(Number(e.target.value));
                    }}
                    style={{
                      background: `linear-gradient(to right, #059669 ${((avgEventValue - 100000) / (3000000 - 100000)) * 100}%, #f1f5f9 ${((avgEventValue - 100000) / (3000000 - 100000)) * 100}%)`,
                    }}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>₹1 Lakh</span>
                    <span>₹15 Lakh</span>
                    <span>₹30 Lakh+</span>
                  </div>
                </div>

                {/* Input 3: Team members */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Team Members</span>
                    </label>
                    <span className="font-mono font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md">
                      {teamMembers} {teamMembers === 1 ? "person" : "people"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    step={1}
                    value={teamMembers}
                    onChange={(e) => {
                      setActivePreset(null);
                      setTeamMembers(Number(e.target.value));
                    }}
                    style={{
                      background: `linear-gradient(to right, #4f46e5 ${((teamMembers - 1) / (20 - 1)) * 100}%, #f1f5f9 ${((teamMembers - 1) / (20 - 1)) * 100}%)`,
                    }}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>1 solo planner</span>
                    <span>10 members</span>
                    <span>20 members</span>
                  </div>
                </div>

                {/* Input 4: Hours spent on admin per event */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Hours Spent on Admin per Event</span>
                    </label>
                    <span className="font-mono font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md">
                      {hoursPerEvent} hrs / event
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={30}
                    step={1}
                    value={hoursPerEvent}
                    onChange={(e) => {
                      setActivePreset(null);
                      setHoursPerEvent(Number(e.target.value));
                    }}
                    style={{
                      background: `linear-gradient(to right, #d97706 ${((hoursPerEvent - 5) / (30 - 5)) * 100}%, #f1f5f9 ${((hoursPerEvent - 5) / (30 - 5)) * 100}%)`,
                    }}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>5 hrs (Light admin)</span>
                    <span>15 hrs (Average)</span>
                    <span>30 hrs (Heavy coordination)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Transparent Calculation Note */}
            <div className="pt-4 border-t border-slate-100 flex items-start gap-2.5 text-[11px] text-slate-500 leading-relaxed">
              <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <span>
                <strong>Transparent Formula:</strong> Assumes a conservative 35% reduction in repetitive admin tasks (manual quote drafting, WhatsApp update chasing, timeline reconciliations, and payment reminders). Formula: (Monthly Events × Admin Hours per Event) × 35%.
              </span>
            </div>
          </div>

          {/* Right Column: Realistic Outputs */}
          <div className="lg:col-span-5 rounded-3xl border border-purple-200/90 bg-white p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-xl shadow-purple-500/10 relative overflow-hidden">
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-700 font-mono block mb-1">
                  Estimated Impact
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                  Time Reclaimed for Real Client Work
                </h4>
              </div>

              {/* Output Metric 1: Monthly Admin Hours Saved */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900">
                    Estimated Admin Hours Saved
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-purple-700 border border-purple-200 font-mono">
                    Monthly
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-purple-900 font-mono">
                    <AnimatedCounter value={adminHoursSavedMonthly} />
                  </span>
                  <span className="text-sm font-bold text-purple-700">hours / month</span>
                </div>
                <p className="text-[11px] text-purple-800 font-medium pt-1">
                  ≈ <AnimatedCounter value={hoursPerTeamMember} decimals={1} /> hours saved per team member every month
                </p>
              </div>

              {/* Output Metric 2: Yearly Time Recovered */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Estimated Yearly Time Recovered
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200 font-mono">
                    Annual
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
                    <AnimatedCounter value={yearlyTimeRecoveredHours} />
                  </span>
                  <span className="text-sm font-bold text-slate-600">hours / year</span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  Equivalent to ≈ <strong><AnimatedCounter value={workingDaysRecovered} /> full 8-hour working days</strong> of productive time.
                </p>
                {workingDaysRecovered >= 15 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 mt-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Equivalent to gaining an extra full-time coordinator!</span>
                  </motion.div>
                )}
              </div>

              {/* Trust Reassurance Checklist */}
              <div className="space-y-2 text-xs text-slate-600 font-medium pt-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>No duplicate quote data entry</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Automated milestone payment tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Client timeline updates in one shared portal</span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-2.5 pt-4">
              <button
                onClick={handleBookDemo}
                className="w-full relative overflow-hidden py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-purple-500 text-white font-extrabold text-xs transition-all duration-200 shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97] group"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
                <span>Book a Free Demo</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={handleStartTrial}
                className="w-full py-2.5 px-6 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition border border-slate-200 flex items-center justify-center cursor-pointer active:scale-[0.97]"
              >
                Start 14-Day Free Trial
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
