"use client";

import React, { useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";

const portalViews = [
  {
    id: "dashboard",
    label: "Event Dashboard",
    icon: "solar:home-bold-duotone",
    preview: (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Client Portal</p>
            <h4 className="text-sm font-bold text-white">Preeti & Arjun — Wedding</h4>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-bold">
            Active
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Event Date", value: "18 Oct 2026", icon: "solar:calendar-bold", color: "text-indigo-400" },
            { label: "Venue", value: "Taj Hotel, Delhi", icon: "solar:map-point-bold", color: "text-pink-400" },
            { label: "Guest Count", value: "450 Guests", icon: "solar:users-group-bold", color: "text-purple-400" },
            { label: "Planner", value: "Sen Weddings", icon: "solar:user-check-bold", color: "text-cyan-400" },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60 space-y-1">
              <div className="flex items-center gap-1.5">
                <Icon icon={item.icon} className={`text-sm ${item.color}`} />
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">{item.label}</span>
              </div>
              <p className="text-xs font-bold text-zinc-200">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2">
          <Icon icon="solar:bell-bold-duotone" className="text-indigo-400 text-lg shrink-0" />
          <span className="text-[10px] text-indigo-300 font-medium">
            Your planner has updated the event timeline. Review new changes.
          </span>
        </div>
      </div>
    ),
  },
  {
    id: "quote",
    label: "Review Quote",
    icon: "solar:document-text-bold-duotone",
    preview: (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">Quote #QT-2026-088</p>
            <h4 className="text-sm font-bold text-white">Wedding Event Proposal</h4>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 font-bold">
            Pending Review
          </span>
        </div>

        <div className="space-y-2">
          {[
            { item: "Floral & Stage Decoration", amount: "₹5,00,000" },
            { item: "Photography & Videography", amount: "₹3,50,000" },
            { item: "Catering (450 pax)", amount: "₹4,50,000" },
            { item: "LED Wall & Sound System", amount: "₹1,50,000" },
          ].map((row) => (
            <div key={row.item} className="flex justify-between items-center px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60 text-[10px]">
              <span className="text-zinc-400">{row.item}</span>
              <span className="font-bold text-white">{row.amount}</span>
            </div>
          ))}
          <div className="flex justify-between items-center px-3 py-2.5 rounded-lg bg-pink-500/10 border border-pink-500/20 text-[10px]">
            <span className="font-bold text-white">Total (incl. 18% GST)</span>
            <span className="font-extrabold text-pink-400">₹17,11,000</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-[11px] font-bold text-white">
            ✓ Accept Proposal
          </button>
          <button className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-zinc-400">
            Message
          </button>
        </div>
      </div>
    ),
  },
  {
    id: "invoice",
    label: "Pay Invoice",
    icon: "solar:wallet-money-bold-duotone",
    preview: (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Invoice #INV-2026-041</p>
            <h4 className="text-sm font-bold text-white">Deposit Payment (50%)</h4>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 font-bold">
            Due Today
          </span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/60 space-y-3">
          <div className="flex justify-between text-[10px]">
            <span className="text-zinc-500">Invoice Amount</span>
            <span className="font-bold text-white">₹8,55,500</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-zinc-500">Due Date</span>
            <span className="font-bold text-amber-400">19 Jun 2026</span>
          </div>
          <div className="h-px bg-zinc-800" />
          <div className="flex justify-between">
            <span className="text-xs font-bold text-white">Total Due</span>
            <span className="text-base font-extrabold text-emerald-400">₹8,55,500</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Pay with</p>
          {["UPI / Google Pay", "Net Banking", "Credit / Debit Card"].map((method) => (
            <button
              key={method}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-left text-[11px] font-semibold text-zinc-300 hover:border-emerald-500/30 hover:text-white transition-all flex items-center justify-between"
            >
              {method}
              <Icon icon="solar:arrow-right-bold" className="text-zinc-600 text-sm" />
            </button>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "timeline",
    label: "View Timeline",
    icon: "solar:clock-square-bold-duotone",
    preview: (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Event Day Timeline</p>
            <h4 className="text-sm font-bold text-white">18 Oct 2026 — Wedding Day</h4>
          </div>
        </div>

        <div className="relative space-y-1">
          {[
            { time: "07:00", label: "Photographer Team Arrival", done: true },
            { time: "09:00", label: "Bridal Suite Setup", done: true },
            { time: "11:00", label: "Floral Décor Installed", done: true },
            { time: "14:00", label: "Sound & LED Check", done: false, current: true },
            { time: "17:00", label: "Guest Arrival & Mocktails", done: false },
            { time: "19:30", label: "Ceremony Begins", done: false },
          ].map((item, i) => (
            <div key={item.time} className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-0.5 shrink-0">
                <div
                  className={`h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-extrabold border transition-all ${
                    item.done
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                      : item.current
                      ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400 animate-pulse"
                      : "bg-zinc-900 border-zinc-800 text-zinc-600"
                  }`}
                >
                  {item.done ? "✓" : i + 1}
                </div>
                {i < 5 && <div className={`w-px h-5 ${item.done ? "bg-emerald-500/30" : "bg-zinc-800"}`} />}
              </div>
              <div className="pb-3">
                <span className="font-mono text-[9px] font-bold text-zinc-500">{item.time}</span>
                <p className={`text-[10px] font-semibold ${item.done ? "text-zinc-500" : item.current ? "text-cyan-300" : "text-zinc-400"}`}>
                  {item.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

const features = [
  { icon: "solar:shield-check-bold-duotone", label: "Isolated & Secure", desc: "Each client sees only their data — zero cross-contamination." },
  { icon: "solar:link-circle-bold-duotone", label: "Unique Invite Link", desc: "One-click setup. Clients register via a secure invitation URL." },
  { icon: "solar:smartphone-bold-duotone", label: "Mobile-First Design", desc: "Optimized for phones — clients access on-the-go." },
  { icon: "solar:pallete-bold-duotone", label: "White-Label Ready", desc: "Custom domain + logo mapping for Growth & Enterprise plans." },
];

export function ClientPortalPreview() {
  const shouldReduceMotion = useReducedMotion();
  const [activeView, setActiveView] = useState("dashboard");

  const currentView = portalViews.find((v) => v.id === activeView)!;

  return (
    <section
      className="py-24 border-b border-zinc-900 bg-[#09090B] relative overflow-hidden"
      id="portal-preview"
    >
      {/* Background glows */}
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-[350px] h-[350px] bg-purple-500/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-16"
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 uppercase">
            <Icon icon="solar:shield-user-bold-duotone" className="text-indigo-400 text-base" />
            White-Label Client Portal
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-heading text-balance">
            Give your clients a{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]">
              premium experience.
            </span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Every client gets a dedicated, secure portal — no extra app required. They can approve quotes, pay invoices, view timelines, and access galleries in one branded link.
          </p>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — Feature list */}
          <motion.div
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-8"
          >
            {/* Portal View Selector */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Preview Portal View</p>
              <div className="grid grid-cols-2 gap-2">
                {portalViews.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setActiveView(view.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl text-left border transition-all duration-200 ${
                      activeView === view.id
                        ? "border-indigo-500/40 bg-indigo-500/10 text-white"
                        : "border-zinc-800 bg-zinc-950/40 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                    }`}
                  >
                    <Icon
                      icon={view.icon}
                      className={`text-lg shrink-0 ${activeView === view.id ? "text-indigo-400" : "text-zinc-600"}`}
                    />
                    <span className="text-xs font-bold">{view.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Feature Points */}
            <div className="space-y-4">
              {features.map((feat, i) => (
                <motion.div
                  key={feat.label}
                  initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
                  className="flex items-start gap-4"
                >
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Icon icon={feat.icon} className="text-indigo-400 text-xl" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-200">{feat.label}</h4>
                    <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{feat.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold hover:opacity-90 transition-all shadow-md shadow-indigo-500/10">
                <Icon icon="solar:arrow-right-bold" className="text-base" />
                Try the Portal Demo
              </button>
              <button className="px-5 py-3 rounded-xl border border-zinc-800 text-zinc-400 text-sm font-bold hover:text-white hover:border-zinc-700 transition-all">
                Learn More
              </button>
            </div>
          </motion.div>

          {/* Right — Portal Mockup */}
          <motion.div
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            {/* Glow behind mockup */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent blur-2xl rounded-3xl pointer-events-none" />

            {/* Mockup Window */}
            <div className="relative rounded-2xl border border-zinc-800 bg-[#0c0c0e]/95 shadow-[0_0_60px_rgba(99,102,241,0.08)] overflow-hidden">
              {/* Window dots */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-zinc-900 bg-zinc-950/60">
                <div className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
                <div className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
                <div className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
                <span className="text-[10px] font-mono text-zinc-600 ml-2">portal.eventos.io/client/preeti-arjun</span>
              </div>

              {/* Tab Navigation inside portal */}
              <div className="flex gap-1 px-4 pt-3 pb-0 border-b border-zinc-900">
                {portalViews.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setActiveView(view.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold rounded-t-lg transition-all relative border-b-2 -mb-px ${
                      activeView === view.id
                        ? "text-indigo-400 border-indigo-500 bg-indigo-500/5"
                        : "text-zinc-600 border-transparent hover:text-zinc-400"
                    }`}
                  >
                    <Icon icon={view.icon} className="text-sm" />
                    <span className="hidden sm:inline">{view.label}</span>
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="p-5 min-h-[360px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeView}
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {currentView.preview}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Floating security badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="absolute -bottom-4 -right-4 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 shadow-xl"
            >
              <Icon icon="solar:shield-check-bold-duotone" className="text-emerald-400 text-xl" />
              <div>
                <p className="text-[10px] font-extrabold text-white">Tenant Isolated</p>
                <p className="text-[9px] text-zinc-500">Zero data cross-contamination</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
