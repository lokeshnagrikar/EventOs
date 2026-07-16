"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/lib/toastStore";
import { ArrowRight } from "lucide-react";

const TIMEZONES = [
  "Asia/Kolkata (IST)",
  "US/Eastern (EST)",
  "US/Pacific (PST)",
  "Europe/London (GMT)",
  "Asia/Singapore (SGT)",
];

const TIME_SLOTS = [
  "10:00 AM",
  "11:30 AM",
  "02:00 PM",
  "03:30 PM",
  "05:00 PM",
];

const DATE_OPTIONS = [
  { day: "Mon", date: "Jul 6", full: "Monday, July 6" },
  { day: "Tue", date: "Jul 7", full: "Tuesday, July 7" },
  { day: "Wed", date: "Jul 8", full: "Wednesday, July 8" },
  { day: "Thu", date: "Jul 9", full: "Thursday, July 9" },
  { day: "Fri", date: "Jul 10", full: "Friday, July 10" },
];

export default function BookDemoPage() {
  const addToast = useToastStore((state) => state.addToast);
  const [meetingType, setMeetingType] = useState(30);
  const [selectedDate, setSelectedDate] = useState("Jul 6");
  const [selectedTime, setSelectedTime] = useState("10:00 AM");
  const [timezone, setTimezone] = useState("Asia/Kolkata (IST)");
  const [step, setStep] = useState(1); // 1: Schedule, 2: Qualify, 3: Confirmed

  // Form states
  const [companySize, setCompanySize] = useState("6-20");
  const [industry, setIndustry] = useState("wedding");
  const [requirements, setRequirements] = useState("");

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
    addToast("Meeting scheduled successfully! Calendar invite dispatched. 📅", "success");
  };

  const selectedDateFull = DATE_OPTIONS.find((d) => d.date === selectedDate)?.full || "";

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-650 selection:text-white">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 max-w-7xl mx-auto px-6 space-y-12 w-full">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Acquisition Scheduler
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none">
            Schedule a Live Architecture Demo.
          </h1>
          <p className="text-base text-zinc-400 font-semibold">
            Align on custom migration strategies, multi-tenant security clearances, or custom branding models with our core engineers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
          {/* Info Column */}
          <div className="lg:col-span-1 p-6 border border-zinc-850 bg-zinc-950/20 backdrop-blur rounded-2xl flex flex-col justify-between space-y-6 select-none">
            <div className="space-y-4 text-xs font-semibold text-zinc-400">
              <div className="space-y-1">
                <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider block">Meeting Type</span>
                <p className="text-sm font-extrabold text-white">{meetingType} Min Live Product Review</p>
              </div>

              {step >= 2 && (
                <div className="space-y-2 pt-4 border-t border-zinc-900">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Icon icon="solar:calendar-bold" className="text-purple-400 text-sm" />
                    <span>{selectedDateFull}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Icon icon="solar:clock-circle-bold" className="text-purple-400 text-sm" />
                    <span>{selectedTime} ({timezone})</span>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-zinc-900 space-y-3">
                <span className="text-[9px] text-zinc-555 font-black uppercase tracking-widest block">Supported integrations</span>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-300 font-bold">
                  <div className="flex items-center gap-1.5 p-2 bg-zinc-900/60 border border-zinc-850 rounded-xl">
                    <Icon icon="simple-icons:googlecalendar" className="text-red-400" /> Google Calendar
                  </div>
                  <div className="flex items-center gap-1.5 p-2 bg-zinc-900/60 border border-zinc-850 rounded-xl">
                    <Icon icon="simple-icons:microsoftoutlook" className="text-blue-450" /> Outlook
                  </div>
                  <div className="flex items-center gap-1.5 p-2 bg-zinc-900/60 border border-zinc-850 rounded-xl">
                    <Icon icon="simple-icons:zoom" className="text-cyan-400" /> Zoom Meet
                  </div>
                  <div className="flex items-center gap-1.5 p-2 bg-zinc-900/60 border border-zinc-850 rounded-xl">
                    <Icon icon="simple-icons:googlemeet" className="text-emerald-450" /> Google Meet
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-zinc-500 font-semibold italic border-t border-zinc-900 pt-4 leading-relaxed">
              We sync with your calendar settings to avoid scheduling clashes.
            </div>
          </div>

          {/* Booking Scheduler Console Column */}
          <div className="lg:col-span-2 p-8 border border-zinc-850 bg-[#121214]/20 backdrop-blur rounded-2xl flex flex-col justify-center items-center relative select-none min-h-[400px]">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full space-y-6"
                >
                  {/* Select Meeting Type */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">1. Select Duration</label>
                    <div className="flex gap-2">
                      {[30, 45, 60].map((dur) => (
                        <button
                          key={dur}
                          onClick={() => setMeetingType(dur)}
                          className={cn(
                            "flex-1 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer",
                            meetingType === dur ? "border-purple-500 bg-purple-500/10 text-purple-400" : "border-zinc-850 hover:border-zinc-700"
                          )}
                        >
                          {dur} Min
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Select Timezone */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">2. Select Your Timezone</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 px-3 py-2 rounded-xl text-xs text-white focus:outline-none cursor-pointer"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">3. Select Date</label>
                    <div className="grid grid-cols-5 gap-2 text-center text-xs">
                      {DATE_OPTIONS.map((d) => (
                        <button
                          key={d.date}
                          onClick={() => setSelectedDate(d.date)}
                          className={cn(
                            "p-2 border rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer",
                            selectedDate === d.date ? "border-purple-500 bg-purple-500/10 text-purple-400" : "border-zinc-850 hover:border-zinc-700"
                          )}
                        >
                          <span className="text-[9px] text-zinc-555 block font-bold uppercase">{d.day}</span>
                          <span className="font-extrabold">{d.date.replace("Jul ", "")}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">4. Select Time Slot</label>
                    <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono">
                      {TIME_SLOTS.map((t) => (
                        <button
                          key={t}
                          onClick={() => setSelectedTime(t)}
                          className={cn(
                            "py-2 border rounded-xl transition-all cursor-pointer",
                            selectedTime === t ? "border-purple-500 bg-purple-500/10 text-purple-450 font-black" : "border-zinc-850 hover:border-zinc-700 text-zinc-350"
                          )}
                        >
                          {t.replace(" PM", "").replace(" AM", "")}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setStep(2)}
                      className="flex items-center gap-1 px-5 py-2 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Next Step <ArrowRight size={12} />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full space-y-5"
                >
                  <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs font-semibold text-zinc-400">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Company Size</label>
                      <select
                        value={companySize}
                        onChange={(e) => setCompanySize(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-850 px-3 py-2 rounded-xl text-white focus:outline-none cursor-pointer"
                      >
                        <option value="solo">Solo Planner</option>
                        <option value="1-5">1-5 Employees</option>
                        <option value="6-20">6-20 Employees</option>
                        <option value="21-100">21-100 Employees</option>
                        <option value="100+">100+ Employees</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Industry Segment</label>
                      <select
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-850 px-3 py-2 rounded-xl text-white focus:outline-none cursor-pointer"
                      >
                        <option value="wedding">Wedding Planning Agency</option>
                        <option value="corporate">Corporate Events Organizer</option>
                        <option value="studio">Photography Company</option>
                        <option value="production">Staging & AV Production House</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Specific Platform Requirements</label>
                      <textarea
                        required
                        value={requirements}
                        onChange={(e) => setRequirements(e.target.value)}
                        placeholder="E.g. We want to migrate 500+ past client folders from ClickUp, set up logical schema isolated Postgres schemas, and connect 3 custom domains..."
                        rows={3}
                        className="w-full bg-zinc-950 border border-zinc-850 px-3 py-2 rounded-xl text-white focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button
                        onClick={() => setStep(1)}
                        className="px-4 py-2 border border-zinc-850 hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-white cursor-pointer transition font-bold"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 px-6 py-2 bg-purple-650 hover:bg-purple-600 text-white rounded-xl font-bold transition cursor-pointer"
                      >
                        Confirm Booking
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-4"
                >
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                    <Icon icon="solar:check-circle-bold" className="text-2xl" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-white uppercase tracking-tight">Demo Booking Confirmed!</h3>
                    <p className="text-[10.5px] text-zinc-450 leading-relaxed max-w-sm">
                      We have sent a Google Meet invite with calendar attachments to your email. See you on {selectedDateFull} at {selectedTime}!
                    </p>
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="px-5 py-2 border border-zinc-850 hover:bg-zinc-900 text-zinc-350 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition"
                  >
                    Schedule Another Meeting
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
