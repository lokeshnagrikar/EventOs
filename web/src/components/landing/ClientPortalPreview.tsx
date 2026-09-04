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
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Client Portal</p>
            <h4 className="text-sm font-bold text-slate-900">Preeti & Arjun — Wedding</h4>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
            Active
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Event Date", value: "18 Oct 2026", icon: "solar:calendar-bold", color: "text-indigo-600" },
            { label: "Venue", value: "Taj Hotel, Delhi", icon: "solar:map-point-bold", color: "text-pink-600" },
            { label: "Guest Count", value: "450 Guests", icon: "solar:users-group-bold", color: "text-purple-600" },
            { label: "Planner", value: "Sen Weddings", icon: "solar:user-check-bold", color: "text-cyan-600" },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 shadow-xs">
              <div className="flex items-center gap-1.5">
                <Icon icon={item.icon} className={`text-sm ${item.color}`} />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{item.label}</span>
              </div>
              <p className="text-xs font-bold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center gap-2">
          <Icon icon="solar:bell-bold-duotone" className="text-indigo-600 text-lg shrink-0" />
          <span className="text-[10px] text-indigo-900 font-semibold">
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
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <p className="text-[10px] font-bold text-pink-600 uppercase tracking-widest">Quote #QT-2026-088</p>
            <h4 className="text-sm font-bold text-slate-900">Wedding Event Proposal</h4>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold">
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
            <div key={row.item} className="flex justify-between items-center px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/80 text-[10px]">
              <span className="text-slate-600 font-medium">{row.item}</span>
              <span className="font-bold text-slate-900">{row.amount}</span>
            </div>
          ))}
          <div className="flex justify-between items-center px-3 py-2.5 rounded-lg bg-pink-50 border border-pink-200 text-[10px]">
            <span className="font-bold text-slate-900">Total (incl. 18% GST)</span>
            <span className="font-black text-pink-600 text-xs">₹17,11,000</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-[11px] font-bold text-white shadow-xs">
            ✓ Accept Proposal
          </button>
          <button className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-50">
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
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Invoice #INV-2026-041</p>
            <h4 className="text-sm font-bold text-slate-900">Deposit Payment (50%)</h4>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold">
            Due Today
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3 shadow-xs">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Invoice Amount</span>
            <span className="font-bold text-slate-900">₹8,55,500</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Due Date</span>
            <span className="font-bold text-amber-600">19 Jun 2026</span>
          </div>
          <div className="h-px bg-slate-200" />
          <div className="flex justify-between items-center">
            <span className="text-xs font-extrabold text-slate-900">Total Due</span>
            <span className="text-base font-black text-emerald-600">₹8,55,500</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Pay with</p>
          {["UPI / Google Pay", "Net Banking", "Credit / Debit Card"].map((method) => (
            <button
              key={method}
              className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-200 text-left text-[11px] font-bold text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all flex items-center justify-between shadow-xs"
            >
              <span>{method}</span>
              <Icon icon="solar:arrow-right-bold" className="text-slate-400 text-sm" />
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
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest">Event Day Timeline</p>
            <h4 className="text-sm font-bold text-slate-900">18 Oct 2026 — Wedding Day</h4>
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
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                      : item.current
                      ? "bg-cyan-50 border-cyan-300 text-cyan-700 font-bold"
                      : "bg-slate-100 border-slate-200 text-slate-400"
                  }`}
                >
                  {item.done ? "✓" : i + 1}
                </div>
                {i < 5 && <div className={`w-px h-5 ${item.done ? "bg-emerald-300" : "bg-slate-200"}`} />}
              </div>
              <div className="pb-3">
                <span className="font-mono text-[9px] font-bold text-slate-500">{item.time}</span>
                <p className={`text-[11px] font-bold ${item.done ? "text-slate-500" : item.current ? "text-cyan-700" : "text-slate-800"}`}>
                  {item.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "whatsapp",
    label: "WhatsApp Triggers",
    icon: "solar:chat-round-dots-bold-duotone",
    preview: (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">WhatsApp Auto-Bot</p>
            <h4 className="text-sm font-bold text-slate-900">Client Conversation Thread</h4>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 font-sans text-xs">
          <div className="flex flex-col items-start space-y-1">
            <span className="text-[9px] font-bold text-slate-500">Priya Sharma (Bride) • 02:14 PM</span>
            <div className="p-2.5 rounded-2xl rounded-tl-none bg-white border border-slate-200 text-slate-800 max-w-[85%] leading-relaxed text-[11px] shadow-xs">
              "Hey! Have you updated the Mandap floral staging timeline?"
            </div>
          </div>

          <div className="flex flex-col items-end space-y-1">
            <span className="text-[9px] font-bold text-emerald-600">EventOS Bot ✓✓ • 02:15 PM</span>
            <div className="p-2.5 rounded-2xl rounded-tr-none bg-emerald-50 border border-emerald-200 text-emerald-950 max-w-[85%] leading-relaxed text-[11px] shadow-xs font-medium">
              "Hi Priya! 🌸 Stage Mandap setup is 100% complete. Here is your live event link: <span className="underline font-mono text-emerald-700">eventos.app/share/p-9281</span>"
            </div>
          </div>

          <div className="flex flex-col items-start space-y-1">
            <span className="text-[9px] font-bold text-slate-500">Priya Sharma • 02:16 PM</span>
            <div className="p-2.5 rounded-2xl rounded-tl-none bg-white border border-slate-200 text-slate-800 max-w-[85%] leading-relaxed text-[11px] shadow-xs">
              "Awesome! Clearing deposit payment right now."
            </div>
          </div>

          <div className="flex flex-col items-end space-y-1">
            <span className="text-[9px] font-bold text-emerald-600">EventOS Bot ✓✓ • 02:17 PM</span>
            <div className="p-2.5 rounded-2xl rounded-tr-none bg-emerald-50 border border-emerald-200 text-emerald-950 max-w-[85%] leading-relaxed text-[11px] shadow-xs font-medium">
              "Deposit payment of ₹1,50,000 received via GPay UPI ✓✓. Receipt #EOS-INV-928 generated!"
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

const features = [
  { icon: "solar:shield-check-bold-duotone", label: "Isolated & Secure", desc: "Each client sees only their data — zero cross-contamination." },
  { icon: "solar:link-circle-bold-duotone", label: "Unique Invite Link", desc: "One-click setup. Clients register via a secure invitation URL." },
  { icon: "solar:smartphone-bold-duotone", label: "Mobile-First Design", desc: "Optimized for phones — clients access on-the-go." },
  { icon: "solar:pallete-bold-duotone", label: "White-Label Ready", desc: "Custom domain + logo mapping for Professional & Agency plans." },
];

export function ClientPortalPreview() {
  const shouldReduceMotion = useReducedMotion();
  const [activeView, setActiveView] = useState("dashboard");

  const currentView = portalViews.find((v) => v.id === activeView)!;

  return (
    <section
      className="py-24 border-b border-slate-200/80 bg-[#FAF9F6] relative overflow-hidden"
      id="portal-preview"
    >
      {/* Background glows */}
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-purple-100/30 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-[350px] h-[350px] bg-indigo-100/30 blur-[100px] rounded-full pointer-events-none -translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-16"
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 uppercase">
            <Icon icon="solar:shield-user-bold-duotone" className="text-indigo-600 text-base" />
            White-Label Client Portal
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-heading text-balance">
            Give your clients a{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]">
              premium experience.
            </span>
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
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
              <p className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest">Preview Portal View</p>
              <div className="grid grid-cols-2 gap-2">
                {portalViews.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setActiveView(view.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl text-left border transition-all duration-200 ${
                      activeView === view.id
                        ? "border-indigo-500/40 bg-indigo-500/10 text-slate-900 font-bold"
                        : "border-slate-200/80 bg-white/80 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm"
                    }`}
                  >
                    <Icon
                      icon={view.icon}
                      className={`text-lg shrink-0 ${activeView === view.id ? "text-indigo-600" : "text-slate-500"}`}
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
                    <Icon icon={feat.icon} className="text-indigo-600 text-xl" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">{feat.label}</h4>
                    <p className="text-xs text-slate-600 font-medium mt-0.5 leading-relaxed" suppressHydrationWarning>{feat.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-extrabold hover:opacity-90 transition-all shadow-md shadow-indigo-500/10 w-full sm:w-auto">
                <Icon icon="solar:arrow-right-bold" className="text-base" />
                Try the Portal Demo
              </button>
              <button className="px-5 py-3 rounded-xl border border-slate-200/80 bg-white/80 text-slate-700 text-sm font-extrabold hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm w-full sm:w-auto">
                Learn More
              </button>
            </div>
          </motion.div>

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
            <div className="relative rounded-2xl border border-slate-200/90 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl overflow-hidden">
              {/* Window dots */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 bg-slate-50/80">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                </div>
                <div className="text-[10px] font-mono text-slate-600 bg-white px-3 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                  portal.eventos.io/client/preeti-arjun
                </div>
                <div className="w-8" />
              </div>

              {/* Tab Navigation inside portal */}
              <div className="flex gap-1 px-4 pt-2.5 pb-0 border-b border-slate-200/80 bg-slate-50/40">
                {portalViews.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setActiveView(view.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold rounded-t-lg transition-all relative border-b-2 -mb-px ${
                      activeView === view.id
                        ? "text-indigo-600 border-indigo-600 bg-white shadow-xs"
                        : "text-slate-500 border-transparent hover:text-slate-900"
                    }`}
                  >
                    <Icon icon={view.icon} className="text-sm" />
                    <span className="hidden sm:inline">{view.label}</span>
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="p-5 min-h-[360px] bg-white">
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
              className="absolute -bottom-4 -right-4 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/95 border border-slate-200/90 backdrop-blur-md shadow-xl shadow-slate-900/5"
            >
              <Icon icon="solar:shield-check-bold-duotone" className="text-emerald-600 text-xl" />
              <div>
                <p className="text-[11px] font-extrabold text-slate-900">Tenant Isolated</p>
                <p className="text-[10px] text-slate-500 font-medium">Zero data cross-contamination</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
