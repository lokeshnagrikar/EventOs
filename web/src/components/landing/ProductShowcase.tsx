"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Kanban, Calendar as CalendarIcon, Shield, Image as ImageIcon, Laptop, Smartphone, Check, Clock, User } from "lucide-react";

export function ProductShowcase() {
  const shouldReduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState("kanban");
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");

  const tabs = [
    { id: "kanban", label: "Pipeline Kanban", icon: <Kanban className="h-4 w-4" /> },
    { id: "calendar", label: "Event Calendar", icon: <CalendarIcon className="h-4 w-4" /> },
    { id: "portal", label: "Client Portal", icon: <Shield className="h-4 w-4" /> },
    { id: "gallery", label: "Media Gallery", icon: <ImageIcon className="h-4 w-4" /> },
  ];

  // Dummy Kanban Columns
  const kanbanColumns = [
    {
      title: "Inquiries",
      count: 3,
      border: "border-purple-500/20",
      items: [
        { client: "Riya & Karan", event: "Wedding Setup", budget: "₹15,00,000", source: "Instagram" },
        { client: "Microsoft India", event: "Annual Tech Summit", budget: "₹30,00,000", source: "Website" },
      ],
    },
    {
      title: "Proposal Sent",
      count: 2,
      border: "border-pink-500/20",
      items: [
        { client: "Aanya Verma", event: "Birthday Bash", budget: "₹5,00,000", source: "Referral" },
      ],
    },
    {
      title: "Booked & Paid",
      count: 4,
      border: "border-cyan-500/20",
      items: [
        { client: "Sanjay Shah", event: "Anniversary Gala", budget: "₹8,50,000", source: "Instagram" },
      ],
    },
  ];

  // Dummy Calendar Timeline
  const calendarTimeline = [
    { time: "09:00 AM", event: "Photographer Team Check-in", status: "Done", type: "ops" },
    { time: "11:30 AM", event: "Floral Backdrop Decoration", status: "In Progress", type: "decor" },
    { time: "02:00 PM", event: "Sound Check & LED Wall Setup", status: "Pending", type: "tech" },
    { time: "05:00 PM", event: "Guest Entry & Welcome Mocktail", status: "Pending", type: "event" },
  ];

  return (
    <section className="py-24 border-b border-zinc-900 bg-[#09090B] relative overflow-hidden" id="showcase">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-cyan-950/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-12 right-[10%] w-[350px] h-[350px] bg-purple-950/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-4 text-left max-w-2xl">
            <span className="text-xs font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-[#06B6D4] uppercase block">
              Dynamic Interfaces
            </span>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Visual tools designed for production velocity.
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Step into the operating system. Click through our primary client interface views to preview how your team and clients interact.
            </p>
          </div>

          {/* Desktop/Mobile Switcher */}
          <div className="flex bg-zinc-950/80 border border-zinc-900 p-1 rounded-xl w-fit">
            <button
              onClick={() => setDeviceMode("desktop")}
              className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
                deviceMode === "desktop"
                  ? "bg-zinc-900 text-white shadow-inner"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              aria-label="Desktop Preview"
            >
              <Laptop className="h-3.5 w-3.5" />
              <span>Desktop</span>
            </button>
            <button
              onClick={() => setDeviceMode("mobile")}
              className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
                deviceMode === "mobile"
                  ? "bg-zinc-900 text-white shadow-inner"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              aria-label="Mobile Preview"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Mobile</span>
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-2 mb-8 bg-zinc-950/40 p-1.5 rounded-xl border border-zinc-900 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2 rounded-lg flex items-center gap-2 text-xs sm:text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {activeTab === tab.id && (
                <motion.span
                  layoutId="activeShowcaseTab"
                  className="absolute inset-0 bg-zinc-900 border border-zinc-800 rounded-lg shadow-inner"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {tab.icon}
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Preview Area */}
        <div className="relative w-full flex justify-center">
          <div
            className={`w-full transition-all duration-500 ${
              deviceMode === "mobile" ? "max-w-xs sm:max-w-sm" : "max-w-5xl"
            }`}
          >
            {/* Main Window Mockup */}
            <div className="rounded-2xl border border-zinc-800 bg-[#0c0c0e]/95 shadow-2xl relative overflow-hidden">
              {/* Top window dots */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-zinc-900/80 bg-zinc-950/40">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
              </div>

              {/* Window Content */}
              <div className="p-6 min-h-[400px] text-left relative">
                <AnimatePresence mode="wait">
                  {activeTab === "kanban" && (
                    <motion.div
                      key="kanban"
                      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                        <div>
                          <h4 className="text-sm font-bold text-white">CRM Leads Kanban</h4>
                          <p className="text-[11px] text-zinc-500">Drag & drop leads across sales milestones</p>
                        </div>
                      </div>

                      <div className={`grid grid-cols-1 ${deviceMode === "mobile" ? "" : "sm:grid-cols-3"} gap-4`}>
                        {kanbanColumns.map((col) => (
                          <div key={col.title} className="p-3 bg-zinc-950/60 border border-zinc-900 rounded-xl space-y-3">
                            <div className="flex justify-between items-center px-1">
                              <span className="text-xs font-bold text-zinc-300">{col.title}</span>
                              <span className="text-[10px] font-bold bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 rounded text-zinc-400">
                                {col.count}
                              </span>
                            </div>

                            <div className="space-y-2">
                              {col.items.map((item) => (
                                <div
                                  key={item.client}
                                  className={`p-3 rounded-lg border bg-[#0e0e11] hover:border-purple-500/20 transition-all ${col.border} cursor-grab active:cursor-grabbing`}
                                >
                                  <span className="text-[10px] bg-purple-950/30 text-purple-400 font-bold px-1.5 py-0.5 rounded border border-purple-500/10 inline-block mb-2">
                                    {item.source}
                                  </span>
                                  <h5 className="text-xs font-bold text-white">{item.client}</h5>
                                  <p className="text-[10px] text-zinc-500 mt-0.5">{item.event}</p>
                                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-zinc-900">
                                    <span className="text-[10px] font-semibold text-zinc-400">Est. Budget</span>
                                    <span className="text-xs font-extrabold text-[#06B6D4]">{item.budget}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "calendar" && (
                    <motion.div
                      key="calendar"
                      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                        <div>
                          <h4 className="text-sm font-bold text-white">Event Operations Schedule</h4>
                          <p className="text-[11px] text-zinc-500">Interactive setup timeline for wedding/corporate days</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {calendarTimeline.map((item) => (
                          <div
                            key={item.time}
                            className="p-3 bg-zinc-950/60 border border-zinc-900 rounded-xl flex items-center justify-between gap-4 hover:border-zinc-800 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-extrabold text-purple-400 bg-purple-950/20 border border-purple-500/10 px-2.5 py-1 rounded-lg">
                                {item.time}
                              </span>
                              <div>
                                <h5 className="text-xs font-bold text-zinc-200">{item.event}</h5>
                                <span className="text-[9px] font-semibold text-zinc-500 tracking-wider uppercase">
                                  Category: {item.type}
                                </span>
                              </div>
                            </div>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                item.status === "Done"
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/10"
                                  : item.status === "In Progress"
                                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/10 animate-pulse"
                                  : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                              }`}
                            >
                              {item.status === "Done" && <Check className="h-2.5 w-2.5" />}
                              {item.status === "In Progress" && <Clock className="h-2.5 w-2.5" />}
                              {item.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "portal" && (
                    <motion.div
                      key="portal"
                      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-5"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                        <div>
                          <h4 className="text-sm font-bold text-white">Secure White-Label Client Portal</h4>
                          <p className="text-[11px] text-zinc-500">Client-facing interface matching agency credentials</p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-900 space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center">
                              <User className="h-4 w-4 text-zinc-400" />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-zinc-200">Preeti Gupta (Client)</h5>
                              <p className="text-[10px] text-zinc-500">Engagement ceremony: 18th Oct 2026</p>
                            </div>
                          </div>
                          <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/10 px-2.5 py-0.5 rounded font-bold self-start sm:self-auto">
                            Active Sync Link
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-zinc-900/60 border border-zinc-850 rounded-lg">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Proposal Estimate</span>
                            <span className="text-sm font-bold text-white mt-1 block">Approved & Signed</span>
                          </div>
                          <div className="p-3 bg-zinc-900/60 border border-zinc-850 rounded-lg">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Outstanding Deposit</span>
                            <span className="text-sm font-bold text-pink-400 mt-1 block">₹50,000 PENDING</span>
                          </div>
                        </div>

                        <button className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white rounded-lg text-xs font-bold transition-all shadow-md">
                          Pay Deposit Securely
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "gallery" && (
                    <motion.div
                      key="gallery"
                      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                        <div>
                          <h4 className="text-sm font-bold text-white">Media Gallery Delivery</h4>
                          <p className="text-[11px] text-zinc-500">Passcode-protected digital albums delivered to guests</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="relative aspect-square bg-zinc-900 rounded-lg overflow-hidden border border-zinc-850 group/img">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent z-10" />
                            <div className="h-full w-full bg-gradient-to-tr from-purple-500/10 to-cyan-500/10 flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-zinc-600 group-hover/img:scale-105 transition-transform" />
                            </div>
                            <span className="absolute bottom-2 left-2 text-[9px] font-bold text-white z-20">
                              IMG_083{i}.JPG
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center p-3 bg-zinc-950/60 border border-zinc-900 rounded-lg text-[10px] text-zinc-400">
                        <span>Expiry Link: 30 days remaining</span>
                        <span className="text-purple-400 font-bold hover:underline cursor-pointer">Download All ZIP</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
