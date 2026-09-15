"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Icon } from "@iconify/react";
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  CreditCard,
  Lock,
  Eye,
  Smartphone,
  Laptop,
  Check,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";

type PortalTab = "overview" | "quote" | "payments" | "timeline" | "tasks" | "documents" | "gallery";

interface TabItem {
  id: PortalTab;
  label: string;
  icon: string;
}

const portalTabs: TabItem[] = [
  { id: "overview", label: "Event Details", icon: "solar:home-smile-bold-duotone" },
  { id: "quote", label: "Quote Approval", icon: "solar:document-text-bold-duotone" },
  { id: "payments", label: "Payment Status", icon: "solar:wallet-money-bold-duotone" },
  { id: "timeline", label: "Event Timeline", icon: "solar:calendar-bold-duotone" },
  { id: "tasks", label: "Tasks", icon: "solar:checklist-minimalistic-bold-duotone" },
  { id: "documents", label: "Documents", icon: "solar:folder-with-files-bold-duotone" },
  { id: "gallery", label: "Gallery", icon: "solar:gallery-bold-duotone" },
];

export function ClientPortalPreview() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<PortalTab>("overview");
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const [downloadedReceipt, setDownloadedReceipt] = useState(false);
  const [downloadedDoc, setDownloadedDoc] = useState<string | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);

  // Interactive task list micro-interaction
  const [taskList, setTaskList] = useState([
    { id: "t1", task: "Approve dinner menu selection & desserts", done: true, tag: "Client Action" },
    { id: "t2", task: "Sign off on floral mandap sample fabric", done: true, tag: "Client Action" },
    { id: "t3", task: "Submit VIP airport pickup guest manifest", done: true, tag: "Guest Ops" },
    { id: "t4", task: "Final song selection for couple entry", done: false, tag: "Pending Action" },
  ]);

  const handleToggleTask = (id: string) => {
    setTaskList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const handleDownloadReceipt = () => {
    setDownloadedReceipt(true);
    setTimeout(() => setDownloadedReceipt(false), 2200);
  };

  const handleDownloadDoc = (name: string) => {
    setDownloadedDoc(name);
    setTimeout(() => setDownloadedDoc(null), 2200);
  };

  const handleCopyPin = () => {
    navigator.clipboard?.writeText?.("9281");
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const completedTasksCount = taskList.filter((t) => t.done).length;

  const handleCtaClick = () => {
    analytics.trackCta("client_portal_cta", "See the Client Experience", "client_portal");
    router.push("/portal");
  };

  return (
    <section
      id="portal-preview"
      className="py-24 sm:py-32 bg-[#FAF9F6] border-b border-slate-200/80 relative overflow-hidden font-sans text-left"
    >
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] bg-purple-100/30 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-indigo-100/25 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200/80 text-purple-700 text-xs font-extrabold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Dedicated Client Experience</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 font-heading text-balance leading-[1.12]">
            Give Your Clients a{" "}
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
              Better Experience.
            </span>
          </h2>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-medium max-w-2xl mx-auto">
            Stop sending clients across WhatsApp, Google Drive and email. Give every client one professional place to manage their event.
          </p>

          {/* Demo Data Disclaimer Badge */}
          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span>DEMO DATA PREVIEW • Illustrative client portal demonstration</span>
            </span>
          </div>
        </motion.div>

        {/* Portal Showcase Frame */}
        <div className="w-full max-w-5xl mx-auto">
          {/* Top Control Bar: Tab selector & Device preview toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
            {/* Horizontal Tabs */}
            <div className="flex items-center gap-1 p-1 bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-x-auto max-w-full scrollbar-none">
              {portalTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                      isActive
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    <Icon icon={tab.icon} className="text-sm" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Desktop / Mobile Switcher */}
            <div className="flex items-center gap-1 p-1 bg-white border border-slate-200/90 rounded-xl shadow-xs shrink-0">
              <button
                onClick={() => setDeviceMode("desktop")}
                className={cn(
                  "p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                  deviceMode === "desktop" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
                )}
                aria-label="Desktop view"
              >
                <Laptop size={14} />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                onClick={() => setDeviceMode("mobile")}
                className={cn(
                  "p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                  deviceMode === "mobile" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
                )}
                aria-label="Mobile view"
              >
                <Smartphone size={14} />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>
          </div>

          {/* Portal Container */}
          <div className="flex justify-center">
            <div
              className={cn(
                "w-full transition-all duration-300",
                deviceMode === "mobile" ? "max-w-md" : "max-w-5xl"
              )}
            >
              <div className="rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/50 overflow-hidden text-left">
                {/* Simulated Portal Top Header */}
                <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-purple-600 flex items-center justify-center text-white font-extrabold text-xs shadow-xs">
                      SL
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">
                        Sen Luxury Weddings
                      </h4>
                      <p className="text-[10px] text-slate-400">Client Portal • Powered by EventOS</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-purple-300 bg-purple-950/70 border border-purple-800/60 px-2.5 py-0.5 rounded-full">
                    DEMO DATA
                  </span>
                </div>

                {/* Client Hero Banner */}
                <div className="p-6 bg-gradient-to-r from-purple-50 via-indigo-50/50 to-pink-50 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-700 bg-white px-2.5 py-1 rounded-full border border-purple-200 shadow-2xs inline-block mb-1.5">
                      Wedding Celebration
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                      Preeti & Arjun
                    </h3>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>Taj Hotel Delhi</span>
                      <span>•</span>
                      <span>18–20 October 2026</span>
                      <span>•</span>
                      <span>450 Confirmed Guests</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-3 py-1 rounded-full">
                      <CheckCircle2 size={13} className="text-emerald-700" />
                      <span>Planning Active</span>
                    </span>
                  </div>
                </div>

                {/* Tab Content Panels */}
                <div className="p-4 sm:p-7 min-h-[380px] bg-white">
                  <AnimatePresence mode="wait">
                    {/* 1. OVERVIEW / EVENT DETAILS */}
                    {activeTab === "overview" && (
                      <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Venue</span>
                            <p className="text-xs font-extrabold text-slate-900">Taj Hotel Delhi</p>
                            <p className="text-[10px] text-slate-500">Main Lawn & Banquets</p>
                          </div>

                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Guest Count</span>
                            <p className="text-xs font-extrabold text-slate-900">450 Guests</p>
                            <p className="text-[10px] text-emerald-600 font-bold">100% RSVP Managed</p>
                          </div>

                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Proposal</span>
                            <p className="text-xs font-extrabold text-slate-900">Signed & Accepted</p>
                            <p className="text-[10px] text-purple-700 font-bold">Quote #QT-088</p>
                          </div>

                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lead Planner</span>
                            <p className="text-xs font-extrabold text-slate-900">Ananya Sen</p>
                            <p className="text-[10px] text-slate-500">+91 WhatsApp Support</p>
                          </div>
                        </div>

                        {/* Recent Planner Notification */}
                        <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <Icon icon="solar:bell-bold-duotone" className="text-purple-600 text-lg shrink-0" />
                            <span className="text-slate-800 font-semibold text-[11px] sm:text-xs">
                              Your agency planner updated the Sangeet timeline. Sangeet entry is set for 07:30 PM.
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-purple-700 font-bold shrink-0 ml-2">Today, 2:30 PM</span>
                        </div>
                      </motion.div>
                    )}

                    {/* 2. QUOTE APPROVAL */}
                    {activeTab === "quote" && (
                      <motion.div
                        key="quote"
                        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div>
                            <span className="text-[10px] font-bold text-pink-600 uppercase tracking-widest">Proposal #QT-2026-088</span>
                            <h4 className="text-sm font-extrabold text-slate-900">Wedding Celebration Proposal (Sample)</h4>
                          </div>
                          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Accepted & Signed Online ✓
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          {[
                            { item: "Mandap & Floral Stage Scenography", amount: "₹6,50,000" },
                            { item: "Sound System, LED Wall & Lighting Rigging", amount: "₹4,20,000" },
                            { item: "Hospitality Crew & Gate Coordination", amount: "₹1,80,000" },
                            { item: "Catering & Banquet Management (450 pax)", amount: "₹4,61,000" },
                          ].map((row, i) => (
                            <div key={i} className="flex justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                              <span className="font-semibold text-slate-700">{row.item}</span>
                              <span className="font-bold text-slate-900 font-mono">{row.amount}</span>
                            </div>
                          ))}

                          <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 flex justify-between items-center text-xs font-bold">
                            <span className="text-slate-800">Total Contract Value (incl. 18% GST)</span>
                            <span className="text-sm font-black text-purple-800 font-mono">₹17,11,000</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* 3. PAYMENT STATUS */}
                    {activeTab === "payments" && (
                      <motion.div
                        key="payments"
                        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Payment Schedules</span>
                            <h4 className="text-sm font-extrabold text-slate-900">Milestone Advances</h4>
                          </div>
                          <span className="text-xs font-bold text-slate-500">Tax Invoice Dispatched</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                            <span className="text-[10px] font-extrabold text-emerald-700 uppercase">30% Booking Advance</span>
                            <p className="text-base font-black text-slate-900 font-mono">₹5,13,300</p>
                            <span className="text-[10px] font-bold text-emerald-700 block">Cleared via UPI ✓</span>
                          </div>

                          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                            <span className="text-[10px] font-extrabold text-amber-700 uppercase">40% Mid Milestone</span>
                            <p className="text-base font-black text-slate-900 font-mono">₹6,84,400</p>
                            <span className="text-[10px] font-bold text-amber-700 block">Due 10 Oct 2026</span>
                          </div>

                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase">30% Final Settlement</span>
                            <p className="text-base font-black text-slate-900 font-mono">₹5,13,300</p>
                            <span className="text-[10px] font-bold text-slate-500 block">On Event Completion</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium">Download GST Invoice #INV-2026-041 (PDF)</span>
                          <button
                            type="button"
                            onClick={handleDownloadReceipt}
                            className={cn(
                              "text-xs font-bold transition-all flex items-center gap-1.5 px-3 py-1 rounded-lg cursor-pointer select-none",
                              downloadedReceipt
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : "text-purple-700 hover:bg-purple-50 hover:underline"
                            )}
                          >
                            {downloadedReceipt ? (
                              <>
                                <CheckCircle2 size={13} className="text-emerald-600" />
                                <span>Receipt Downloaded ✓</span>
                              </>
                            ) : (
                              <>
                                <Download size={13} />
                                <span>Download Receipt</span>
                              </>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* 4. EVENT TIMELINE */}
                    {activeTab === "timeline" && (
                      <motion.div
                        key="timeline"
                        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                            Day-of-Event Timeline: 18 Oct 2026
                          </h4>
                          <span className="text-[10px] font-bold text-purple-700">Minute-by-Minute Live Sync</span>
                        </div>

                        <div className="space-y-2 text-xs">
                          {[
                            { time: "08:00 AM", title: "Floral Mandap & Stage Ingress", status: "Completed ✓", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
                            { time: "10:15 AM", title: "JBL Sound Check & Bass Balance", status: "Completed ✓", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
                            { time: "03:30 PM", title: "Baraat Welcome & PWA Gate Check-In", status: "Up Next", color: "text-purple-700 bg-purple-50 border-purple-200" },
                            { time: "07:30 PM", title: "Sangeet Stage Pyrotechnics & Grand Entry", status: "Scheduled", color: "text-slate-600 bg-slate-100 border-slate-200" },
                          ].map((cue, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-xs font-bold text-purple-700 shrink-0">{cue.time}</span>
                                <span className="font-bold text-slate-800">{cue.title}</span>
                              </div>
                              <span className={cn("text-[10px] px-2.5 py-0.5 rounded-full border font-bold", cue.color)}>
                                {cue.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* 5. TASKS (INTERACTIVE CLICK-TO-CHECK) */}
                    {activeTab === "tasks" && (
                      <motion.div
                        key="tasks"
                        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                              Client Action Items & Planner Checklist
                            </h4>
                            <p className="text-[10px] text-slate-400">Click any task to toggle status</p>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-mono">
                            {completedTasksCount} of {taskList.length} Completed
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          {taskList.map((t) => (
                            <div
                              key={t.id}
                              onClick={() => handleToggleTask(t.id)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleToggleTask(t.id)}
                              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 transition-all duration-150 cursor-pointer select-none active:scale-[0.99]"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                <div
                                  className={cn(
                                    "h-4 w-4 rounded-md flex items-center justify-center text-[10px] text-white transition-all duration-200 shrink-0",
                                    t.done ? "bg-emerald-600 scale-100" : "bg-white border-2 border-slate-300"
                                  )}
                                >
                                  {t.done && "✓"}
                                </div>
                                <span
                                  className={cn(
                                    "transition-all duration-200 truncate",
                                    t.done ? "text-slate-400 line-through" : "text-slate-900 font-bold"
                                  )}
                                >
                                  {t.task}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                                {t.tag}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* 6. IMPORTANT DOCUMENTS */}
                    {activeTab === "documents" && (
                      <motion.div
                        key="documents"
                        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                            Important Event Documents & Agreements
                          </h4>
                          <span className="text-[10px] font-bold text-slate-500">Secure Vault</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {[
                            { name: "Master Event Agreement (Signed).pdf", size: "2.4 MB", date: "15 Jun 2026" },
                            { name: "Taj Hotel Delhi Lawn Blueprint & Layout.dwg", size: "8.1 MB", date: "22 Jun 2026" },
                            { name: "GST Tax Invoice #INV-2026-041.pdf", size: "320 KB", date: "02 Jul 2026" },
                            { name: "Sound & Stage Fire NOC Certificate.pdf", size: "1.1 MB", date: "10 Jul 2026" },
                          ].map((doc, i) => (
                            <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                <FileText className="w-5 h-5 text-purple-600 shrink-0" />
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 truncate text-[11px]">{doc.name}</p>
                                  <p className="text-[10px] text-slate-400">{doc.size} • {doc.date}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDownloadDoc(doc.name)}
                                className="text-purple-600 hover:text-purple-800 shrink-0 p-1.5 rounded-lg hover:bg-purple-50 transition cursor-pointer"
                                aria-label={`Download ${doc.name}`}
                              >
                                {downloadedDoc === doc.name ? (
                                  <CheckCircle2 size={15} className="text-emerald-600" />
                                ) : (
                                  <Download size={14} />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* 7. GALLERY */}
                    {activeTab === "gallery" && (
                      <motion.div
                        key="gallery"
                        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div>
                            <button
                              type="button"
                              onClick={handleCopyPin}
                              className="text-[10px] font-bold text-amber-800 font-mono bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                              title="Click to copy gallery PIN"
                            >
                              {copiedPin ? "PIN Copied ✓" : "PIN: 9281 • Click to Copy"}
                            </button>
                            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide mt-1">
                              High-Res 4K Wedding Album Deliverables
                            </h4>
                          </div>
                          <span className="text-xs font-bold text-purple-700">1,450 Photos Proofed</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { title: "Baraat Grand Arrival", tag: "Arrival", size: "18.4 MB" },
                            { title: "Mandap Vows Ceremony", tag: "Ritual", size: "24.1 MB" },
                            { title: "Couple Reception Portrait", tag: "Portraits", size: "32.0 MB" },
                            { title: "Sangeet Drone Highlights", tag: "4K Drone", size: "128 MB" },
                          ].map((photo, i) => (
                            <div key={i} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                              <div className="aspect-video rounded-xl bg-purple-100/50 flex items-center justify-center border border-purple-200/60">
                                <Icon icon="solar:gallery-bold-duotone" className="text-2xl text-purple-600" />
                              </div>
                              <div>
                                <span className="text-[9px] font-bold text-purple-700 uppercase">{photo.tag}</span>
                                <h5 className="text-[11px] font-bold text-slate-900 truncate">{photo.title}</h5>
                                <span className="text-[10px] text-slate-400 font-mono">{photo.size}</span>
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

        {/* CTA Button */}
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={handleCtaClick}
            className="relative inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-sm font-extrabold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-purple-500 shadow-lg shadow-purple-500/25 active:scale-[0.97] transition-all duration-200 cursor-pointer group overflow-hidden"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full duration-700 transition-transform ease-in-out" />
            <span className="relative z-10">See the Client Experience</span>
            <ArrowRight className="w-4 h-4 text-purple-200 group-hover:translate-x-1 transition-transform relative z-10" />
          </button>
        </div>
      </div>
    </section>
  );
}
