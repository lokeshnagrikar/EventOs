"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Kanban, Calendar as CalendarIcon, Shield, Image as ImageIcon, Laptop, Smartphone, Check, Clock, User, Lock, Download, Share2, Sparkles, KeyRound } from "lucide-react";
import { Icon } from "@iconify/react";

export function ProductShowcase() {
  const shouldReduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState("kanban");
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [copiedPasscode, setCopiedPasscode] = useState(false);

  const tabs = [
    { id: "kanban", label: "Pipeline Kanban", icon: <Kanban className="h-4 w-4" /> },
    { id: "calendar", label: "Event Calendar", icon: <CalendarIcon className="h-4 w-4" /> },
    { id: "portal", label: "Client Portal", icon: <Shield className="h-4 w-4" /> },
    { id: "gallery", label: "Media Delivery Reel", icon: <ImageIcon className="h-4 w-4" /> },
  ];

  // Dummy Kanban Columns
  const kanbanColumns = [
    {
      title: "Inquiries",
      count: 3,
      border: "border-purple-500/20",
      items: [
        { client: "Riya & Karan", event: "Royal Lawn Wedding", budget: "₹15,00,000", source: "Instagram" },
        { client: "Microsoft India", event: "Annual Tech Summit", budget: "₹30,00,000", source: "Website" },
      ],
    },
    {
      title: "Proposal Sent",
      count: 2,
      border: "border-pink-500/20",
      items: [
        { client: "Aanya Verma", event: "Birthday Gala", budget: "₹5,00,000", source: "Referral" },
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
    { time: "11:30 AM", event: "Floral Backdrop Scenography", status: "In Progress", type: "decor" },
    { time: "02:00 PM", event: "Sound Check & LED Wall Setup", status: "Pending", type: "tech" },
    { time: "05:00 PM", event: "Guest Entry & Welcome Mocktail", status: "Pending", type: "event" },
  ];

  const galleryItems = [
    { name: "Baraat_Ingress_4K.JPG", size: "18.4 MB", type: "IMAGE", tag: "Lawn Entrance" },
    { name: "Stage_Mandap_Decor_01.RAW", size: "45.2 MB", type: "IMAGE", tag: "Stage Rigging" },
    { name: "Sangeet_Drone_4K.MP4", size: "320.0 MB", type: "VIDEO", tag: "Drone Reel" },
    { name: "Couple_Reception_Portrait.RAW", size: "52.1 MB", type: "IMAGE", tag: "Portrait" },
  ];

  const handleStartDownload = () => {
    setIsDownloading(true);
    setDownloadProgress(10);
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsDownloading(false), 1500);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  const handleCopyPasscode = () => {
    navigator.clipboard.writeText("https://eventos.app/share/gallery-p928?pin=9281");
    setCopiedPasscode(true);
    setTimeout(() => setCopiedPasscode(false), 2000);
  };

  return (
    <section className="py-24 border-b border-[#E5E7EB] bg-[#FFFFFF] relative overflow-hidden font-sans" id="showcase">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-purple-100/30 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-12 right-[10%] w-[350px] h-[350px] bg-indigo-100/30 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-4 text-left max-w-2xl">
            <span className="text-xs font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-[#06B6D4] uppercase block">
              Dynamic Interfaces
            </span>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-heading">
              Visual tools designed for production velocity.
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              Step into the operating system. Click through our primary client interface views to preview how your team and clients interact.
            </p>
          </div>

          {/* Desktop/Mobile Switcher */}
          <div className="flex bg-white/80 border border-slate-200/80 p-1 rounded-xl w-fit shadow-sm">
            <button
              onClick={() => setDeviceMode("desktop")}
              className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
                deviceMode === "desktop"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
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
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              aria-label="Mobile Preview"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Mobile</span>
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex overflow-x-auto max-w-full flex-nowrap sm:flex-wrap gap-2 mb-8 bg-white/80 p-1.5 rounded-xl border border-slate-200/80 w-fit shadow-sm scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2 rounded-lg flex items-center gap-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {activeTab === tab.id && (
                <motion.span
                  layoutId="activeShowcaseTab"
                  className="absolute inset-0 bg-slate-900 border border-slate-800 rounded-lg shadow-sm"
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
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e]/45 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
              {/* Top window dots */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-zinc-900/80 bg-zinc-950/40">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
                <span className="text-[10px] text-zinc-500 font-mono ml-2 select-none">
                  {activeTab === "gallery" ? "admin.eventos.io/gallery/share-album-928" : "admin.eventos.io/dashboard"}
                </span>
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
                            className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-900 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-bold text-purple-400">{item.time}</span>
                              <span className="text-xs font-bold text-white">{item.event}</span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 font-bold">
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
                      {/* Gallery Header */}
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-zinc-900">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-white">Royal Palace Wedding — 4K Media Album</h4>
                            <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/30 text-[9px] font-bold flex items-center gap-1 font-mono">
                              <Lock size={10} /> PIN: 9281
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5">3,420 4K Photos & High-Bitrate Drone Reels Delivered</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCopyPasscode}
                            className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Share2 size={12} className="text-purple-400" />
                            <span>{copiedPasscode ? "Invite Link Copied ✓" : "Share Client Link"}</span>
                          </button>
                          <button
                            onClick={handleStartDownload}
                            disabled={isDownloading}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-amber-950 cursor-pointer"
                          >
                            <Download size={12} />
                            <span>{isDownloading ? `Downloading ${downloadProgress}%...` : "Download All (3.4 GB)"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Download Progress Bar */}
                      {isDownloading && (
                        <div className="space-y-1 font-mono text-[9px] p-2 bg-amber-950/40 border border-amber-500/30 rounded-xl">
                          <div className="flex justify-between text-amber-300 font-bold">
                            <span>COMPRESSING HIGH-RES ZIP ARCHIVE...</span>
                            <span>{downloadProgress}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${downloadProgress}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Media Thumbnails Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {galleryItems.map((item, i) => (
                          <div key={i} className="relative aspect-square bg-zinc-900/80 rounded-2xl overflow-hidden border border-zinc-800 group/img shadow-md">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
                            <div className="h-full w-full bg-gradient-to-tr from-purple-500/15 via-pink-500/10 to-amber-500/15 flex items-center justify-center">
                              <ImageIcon className="h-7 w-7 text-zinc-400 group-hover/img:scale-110 transition-transform duration-300" />
                            </div>
                            <span className="absolute top-2 left-2 text-[8.5px] font-black text-amber-300 bg-black/60 border border-amber-500/30 px-1.5 py-0.5 rounded-md z-20 font-mono">
                              {item.tag}
                            </span>
                            <div className="absolute bottom-2 left-2 right-2 text-[9px] font-bold text-white z-20 truncate">
                              <span className="block truncate font-mono">{item.name}</span>
                              <span className="text-[8px] text-zinc-400 block font-mono">{item.size}</span>
                            </div>
                          </div>
                        ))}
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
