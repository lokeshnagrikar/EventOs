"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Icon } from "@iconify/react";
import {
  Calendar,
  ArrowRight,
  CheckCircle2,
  Download,
  Share2,
  Lock,
  User,
  Sparkles,
  ShieldCheck,
  CreditCard,
  FileText,
  Users,
  Clock,
  QrCode,
  Check,
  Laptop,
  Smartphone,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";
import { useAuthModalStore } from "@/store/authModalStore";

type TabId = "crm" | "quotes" | "payments" | "timeline" | "portal" | "gallery";

interface TabConfig {
  id: TabId;
  label: string;
  icon: string;
  tagline: string;
}

const tabs: TabConfig[] = [
  { id: "crm", label: "CRM", icon: "solar:users-group-rounded-bold-duotone", tagline: "Visual lead pipeline & client inquiries" },
  { id: "quotes", label: "Quotes", icon: "solar:document-text-bold-duotone", tagline: "18% GST interactive proposals & line items" },
  { id: "payments", label: "Payments", icon: "solar:wallet-money-bold-duotone", tagline: "Milestone advances & UPI payment tracking" },
  { id: "timeline", label: "Event Timeline", icon: "solar:calendar-bold-duotone", tagline: "Minute-by-minute run-of-show & vendor cues" },
  { id: "portal", label: "Client Portal", icon: "solar:shield-user-bold-duotone", tagline: "Dedicated white-label client approval center" },
  { id: "gallery", label: "Gallery", icon: "solar:gallery-bold-duotone", tagline: "High-res media albums with passcode sharing" },
];

export function ProductShowcase() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const openModal = useAuthModalStore((state) => state.openModal);

  const [activeTab, setActiveTab] = useState<TabId>("crm");
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Playable UI Simulation states
  const [simulationToast, setSimulationToast] = useState<string | null>(null);
  const [milestone2Paid, setMilestone2Paid] = useState(false);
  const [whatsappFollowupSent, setWhatsappFollowupSent] = useState(false);
  const [quoteSentState, setQuoteSentState] = useState(false);
  const [timelineItems, setTimelineItems] = useState([
    { id: 1, time: "08:00 AM", title: "Floral Mandap & Stage Scenography Ingress", crew: "Royal Decor Crew", location: "Banquets Lawn", status: "Completed" },
    { id: 2, time: "10:15 AM", title: "JBL Line Array Sound Check & Bass Leveling", crew: "BeatSync Audio", location: "Grand Ballroom", status: "Auto-Resolved" },
    { id: 3, time: "03:30 PM", title: "Baraat Welcome & Offline PWA Gate Check-In", crew: "Hospitality Lead", location: "Main Gate", status: "Scheduled" },
    { id: 4, time: "07:30 PM", title: "Sangeet Pyrotechnics & 40ft LED Rigging", crew: "PyroTech Team", location: "Stage Arena", status: "Scheduled" },
  ]);

  const triggerToast = (msg: string) => {
    setSimulationToast(msg);
    setTimeout(() => {
      setSimulationToast((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  const handleToggleMilestone2 = () => {
    const nextState = !milestone2Paid;
    setMilestone2Paid(nextState);
    if (nextState) {
      triggerToast("Payment of ₹5,90,000 cleared via UPI & tax invoice dispatched");
    } else {
      triggerToast("Milestone payment marked as pending");
    }
  };

  const handleSendFollowup = () => {
    setWhatsappFollowupSent(true);
    triggerToast("WhatsApp quote reminder delivered to Rohan (+91 98201...)");
  };

  const handleSendQuote = () => {
    setQuoteSentState(true);
    triggerToast("Digital GST proposal with payment link published to client portal");
  };

  const handleToggleTimelineItem = (id: number) => {
    setTimelineItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === "Completed" ? "Scheduled" : "Completed";
          triggerToast(`Timeline: "${item.title.slice(0, 20)}..." marked as ${nextStatus}`);
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
  };

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight") {
      const nextIndex = (index + 1) % tabs.length;
      setActiveTab(tabs[nextIndex].id);
    } else if (e.key === "ArrowLeft") {
      const prevIndex = (index - 1 + tabs.length) % tabs.length;
      setActiveTab(tabs[prevIndex].id);
    }
  };

  const handleBookDemo = () => {
    analytics.trackCta("showcase_book_demo", "Book a Free Demo", "showcase");
    router.push("/book-demo");
  };

  const handleStartTrial = () => {
    analytics.trackCta("showcase_start_trial", "Start 14-Day Free Trial", "showcase");
    openModal("register");
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText("https://secure.eventos.in/portal/pooja-rohan?pin=9281");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadZip = () => {
    setDownloadingZip(true);
    setDownloadProgress(15);
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setDownloadingZip(false), 1200);
          return 100;
        }
        return prev + 25;
      });
    }, 300);
  };

  return (
    <section
      id="showcase"
      className="py-24 sm:py-32 bg-white border-b border-slate-200/80 relative overflow-hidden font-sans text-left"
    >
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[850px] h-[400px] bg-purple-100/35 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[300px] bg-indigo-100/30 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-12"
        >
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200/80 text-purple-700 text-xs font-extrabold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Interactive Product Tour
          </span>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 font-heading text-balance leading-[1.12]">
            See How{" "}
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
              EventOS Works.
            </span>
          </h2>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-medium max-w-2xl mx-auto">
            Everything your team needs, connected in one workspace.
          </p>
        </motion.div>

        {/* 6 Tabs Navigation Strip */}
        <div className="flex justify-center mb-8">
          <div
            role="tablist"
            aria-label="EventOS Features Preview"
            className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200/90 max-w-full overflow-x-auto scrollbar-none shadow-inner"
          >
            {tabs.map((tab, idx) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer whitespace-nowrap select-none",
                    isActive
                      ? "text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-showcase-tab-bg"
                      className="absolute inset-0 bg-slate-900 rounded-xl -z-10 shadow-sm"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  <Icon icon={tab.icon} className="text-base sm:text-lg shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Large Product Workspace Visual (Full-scale desktop browser canvas) */}
        <div className="w-full max-w-6xl mx-auto">
          <div className="rounded-3xl border border-slate-800 bg-[#0B0F19] shadow-[0_25px_70px_rgba(0,0,0,0.35)] overflow-hidden">
            {/* Top Browser Bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[11px] text-slate-400 font-mono ml-3 select-none flex items-center gap-1">
                  <span className="text-purple-400 font-bold">https://</span>app.eventos.in/workspace/
                  <span className="text-white font-semibold">{activeTab}</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Product Preview</span>
                </span>
              </div>
            </div>

            {/* Large Tab Display Panel */}
            <div
              id={`tabpanel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
              className="p-4 sm:p-7 min-h-[460px] sm:min-h-[520px] bg-[#0F172A] relative flex flex-col justify-between overflow-hidden"
            >
              {/* Subtle background grid pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(#334155_1.2px,transparent_1.2px)] [background-size:22px_22px] opacity-25 pointer-events-none" />

              {/* Floating Simulation Toast */}
              <AnimatePresence>
                {simulationToast && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-4 right-4 z-40 max-w-sm flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/95 border border-purple-500/50 text-white text-xs shadow-2xl shadow-purple-950/90 backdrop-blur-md"
                  >
                    <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                      ✓
                    </div>
                    <span className="font-semibold text-[11px] text-purple-100">{simulationToast}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {/* 1. CRM TAB */}
                {activeTab === "crm" && (
                  <motion.div
                    key="crm"
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -12 }}
                    transition={{ duration: 0.2 }}
                    className="relative z-10 space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                      <div>
                        <h3 className="text-base font-extrabold text-white font-heading flex items-center gap-2">
                          <span>Wedding & Event CRM Pipeline</span>
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                            24 Active Inquiries
                          </span>
                        </h3>
                        <p className="text-xs text-slate-400">Track client budgets, follow-ups, and conversion milestones</p>
                      </div>
                      <span className="text-xs text-slate-300 font-mono bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700/60 self-start sm:self-auto">
                        Season Pipeline: ₹1.45 Cr
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Column 1: New Inquiries */}
                      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-purple-400">1. New Inquiries</span>
                          <span className="text-[10px] font-bold bg-purple-950 text-purple-300 px-2 py-0.5 rounded">3</span>
                        </div>
                        <div className="space-y-2.5">
                          <div className="p-3 rounded-xl bg-[#090D16] border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-extrabold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                                Instagram Lead
                              </span>
                              <span className="text-[10px] font-mono text-emerald-400 font-bold">₹25,00,000</span>
                            </div>
                            <h4 className="text-xs font-bold text-white">Riya & Karan</h4>
                            <p className="text-[11px] text-slate-400">Royal Lawn 3-Day Wedding • Udaipur</p>
                          </div>

                          <div className="p-3 rounded-xl bg-[#090D16] border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-extrabold text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                                Direct Referral
                              </span>
                              <span className="text-[10px] font-mono text-emerald-400 font-bold">₹12,00,000</span>
                            </div>
                            <h4 className="text-xs font-bold text-white">Simran Kapoor</h4>
                            <p className="text-[11px] text-slate-400">25th Anniversary Gala • Grand Hyatt</p>
                          </div>
                        </div>
                      </div>

                      {/* Column 2: Proposal Sent */}
                      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-pink-400">2. Proposal Review</span>
                          <span className="text-[10px] font-bold bg-pink-950 text-pink-300 px-2 py-0.5 rounded">2</span>
                        </div>
                        <div className="space-y-2.5">
                          <div className="p-3 rounded-xl bg-[#090D16] border border-pink-500/20 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-extrabold text-pink-300 bg-pink-950/60 px-2 py-0.5 rounded border border-pink-800/40">
                                Proposal #QT-088
                              </span>
                              <span className="text-[10px] font-mono text-pink-300 font-bold">₹35,00,000</span>
                            </div>
                            <h4 className="text-xs font-bold text-white">Pooja & Rohan</h4>
                            <p className="text-[11px] text-slate-400">Client viewed quote 3 times today</p>
                            <button
                              onClick={handleSendFollowup}
                              className="w-full mt-2 text-[10px] font-extrabold py-1.5 px-2 rounded-lg bg-pink-950/70 hover:bg-pink-900 text-pink-200 border border-pink-700/60 active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Icon icon={whatsappFollowupSent ? "solar:check-circle-bold" : "solar:chat-round-dots-bold"} className="text-xs text-pink-400" />
                              <span>{whatsappFollowupSent ? "WhatsApp Follow-up Sent ✓" : "Send WhatsApp Follow-up"}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Column 3: Booked & Advance Cleared */}
                      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-emerald-400">3. Booked & Paid</span>
                          <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded">4</span>
                        </div>
                        <div className="space-y-2.5">
                          <div className="p-3 rounded-xl bg-[#090D16] border border-emerald-500/30 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-extrabold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                                30% Deposit Cleared
                              </span>
                              <span className="text-[10px] font-mono text-emerald-400 font-bold">₹18,50,000</span>
                            </div>
                            <h4 className="text-xs font-bold text-white">Sanjay & Meera Shah</h4>
                            <p className="text-[11px] text-slate-400">Contract Signed • Dates Confirmed</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. QUOTES TAB */}
                {activeTab === "quotes" && (
                  <motion.div
                    key="quotes"
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -12 }}
                    transition={{ duration: 0.2 }}
                    className="relative z-10 space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                      <div>
                        <h3 className="text-base font-extrabold text-white font-heading">
                          Interactive Digital Proposal Builder (GST Ready)
                        </h3>
                        <p className="text-xs text-slate-400">Draft proposals in 60 seconds with itemized decor, tech & crew rates</p>
                      </div>
                      <button
                        onClick={handleSendQuote}
                        className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-400/40 self-start sm:self-auto active:scale-95 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Icon icon={quoteSentState ? "solar:check-circle-bold" : "solar:plain-bold-duotone"} className="text-sm" />
                        <span>{quoteSentState ? "Proposal Dispatched ✓" : "Send 18% GST Proposal"}</span>
                      </button>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                      {/* Quote items table */}
                      <div className="space-y-2">
                        {[
                          { item: "Floral Mandap & Grand Entry Scenography", category: "Decor", qty: "1 Set", rate: "₹6,50,000" },
                          { item: "JBL Line Array Sound + 40ft LED Curved Wall", category: "Production Tech", qty: "3 Days", rate: "₹4,20,000" },
                          { item: "VIP Hospitality Crew & PWA Gate Management", category: "Hospitality Crew", qty: "12 Staff", rate: "₹1,80,000" },
                        ].map((row, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#090D16] border border-slate-800/80 text-xs">
                            <div className="min-w-0 pr-2">
                              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">{row.category}</span>
                              <h4 className="font-bold text-white truncate">{row.item}</h4>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] text-slate-400 block">{row.qty}</span>
                              <span className="font-extrabold text-white font-mono">{row.rate}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* GST Calculation Summary Bar */}
                      <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-slate-300">Subtotal: ₹12,50,000 + <strong>18% GST (₹2,25,000)</strong></span>
                          <p className="text-[11px] text-purple-300">Milestone: 30% Booking Advance = ₹4,42,500</p>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-white font-mono">Total: ₹14,75,000</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 3. PAYMENTS TAB */}
                {activeTab === "payments" && (
                  <motion.div
                    key="payments"
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -12 }}
                    transition={{ duration: 0.2 }}
                    className="relative z-10 space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                      <div>
                        <h3 className="text-base font-extrabold text-white font-heading">
                          Milestone Payments & Automated Invoicing
                        </h3>
                        <p className="text-xs text-slate-400">Collect booking advances via UPI QR or bank transfer with zero manual chasing</p>
                      </div>
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-lg">
                        Cleared Today: {milestone2Paid ? "₹10,32,500" : "₹4,42,500"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Milestone 1 */}
                      <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/40 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-400">1. Booking Advance (30%)</span>
                          <span className="text-[9px] bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded font-extrabold">CLEARED ✓</span>
                        </div>
                        <p className="text-xl font-black text-white font-mono">₹4,42,500</p>
                        <p className="text-[11px] text-slate-400">Paid via UPI • Tax invoice #INV-041 dispatched</p>
                      </div>

                      {/* Milestone 2 (Playable) */}
                      <div className={cn(
                        "p-4 rounded-2xl bg-slate-900/90 border transition-all duration-300 space-y-2",
                        milestone2Paid ? "border-emerald-500/50 bg-emerald-950/20" : "border-slate-800"
                      )}>
                        <div className="flex items-center justify-between text-xs">
                          <span className={cn("font-bold", milestone2Paid ? "text-emerald-400" : "text-slate-300")}>
                            2. Production Lock (40%)
                          </span>
                          <span className={cn(
                            "text-[9px] px-2 py-0.5 rounded font-extrabold",
                            milestone2Paid ? "bg-emerald-900 text-emerald-300" : "bg-amber-900 text-amber-300"
                          )}>
                            {milestone2Paid ? "CLEARED ✓" : "DUE 10 OCT"}
                          </span>
                        </div>
                        <p className="text-xl font-black text-white font-mono">₹5,90,000</p>
                        <p className="text-[11px] text-slate-400">
                          {milestone2Paid ? "Paid via UPI • Tax invoice #INV-042 dispatched" : "Auto-WhatsApp reminder scheduled 3 days prior"}
                        </p>
                        <button
                          onClick={handleToggleMilestone2}
                          className={cn(
                            "w-full mt-2 text-[10px] font-extrabold py-1.5 px-2.5 rounded-lg active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer",
                            milestone2Paid
                              ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                              : "bg-purple-600 hover:bg-purple-500 text-white shadow-xs"
                          )}
                        >
                          <Icon icon={milestone2Paid ? "solar:restart-bold" : "solar:wallet-bold"} className="text-xs" />
                          <span>{milestone2Paid ? "Mark as Pending" : "Simulate Payment Cleared"}</span>
                        </button>
                      </div>

                      {/* Milestone 3 */}
                      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-300">3. Final Delivery (30%)</span>
                          <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-extrabold">ON DELIVERY</span>
                        </div>
                        <p className="text-xl font-black text-white font-mono">₹4,42,500</p>
                        <p className="text-[11px] text-slate-400">Unlocked upon high-res gallery handover</p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#090D16] border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-purple-400 shrink-0" />
                        <span className="text-slate-300">
                          Instant Client Payment Link: <strong className="text-white">eventos.in/pay/inv-041</strong>
                        </span>
                      </div>
                      <span className="text-[10px] text-purple-400 font-bold hover:underline cursor-pointer">
                        Download GST Invoice (PDF) →
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* 4. EVENT TIMELINE TAB */}
                {activeTab === "timeline" && (
                  <motion.div
                    key="timeline"
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -12 }}
                    transition={{ duration: 0.2 }}
                    className="relative z-10 space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                      <div>
                        <h3 className="text-base font-extrabold text-white font-heading">
                          Run-of-Show & Live Conflict Detector
                        </h3>
                        <p className="text-xs text-slate-400">Minute-by-minute cues • Click any row to toggle completion</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full self-start sm:self-auto">
                        0 Venue Overlaps Detected
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {timelineItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleTimelineItem(item.id)}
                          className="p-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs cursor-pointer transition active:scale-[0.99] group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-purple-400 font-bold shrink-0">{item.time}</span>
                            <div>
                              <h4 className={cn("font-bold text-white transition", item.status === "Completed" && "line-through text-slate-400")}>
                                {item.title}
                              </h4>
                              <p className="text-[11px] text-slate-400">{item.crew} • {item.location}</p>
                            </div>
                          </div>
                          <span className={cn(
                            "text-[10px] px-2.5 py-0.5 rounded font-extrabold self-start sm:self-auto transition",
                            item.status === "Completed" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" :
                            item.status === "Auto-Resolved" ? "bg-purple-950 text-purple-300 border border-purple-800" :
                            "bg-slate-800 text-slate-300 group-hover:border-purple-400/40"
                          )}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 5. CLIENT PORTAL TAB */}
                {activeTab === "portal" && (
                  <motion.div
                    key="portal"
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -12 }}
                    transition={{ duration: 0.2 }}
                    className="relative z-10 space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                      <div>
                        <h3 className="text-base font-extrabold text-white font-heading">
                          Branded Client Experience Portal
                        </h3>
                        <p className="text-xs text-slate-400">Give high-net-worth clients an impressive, dedicated link — zero apps required</p>
                      </div>
                      <span className="text-xs font-bold text-purple-400 bg-purple-950/60 border border-purple-800/60 px-3 py-1 rounded-full self-start sm:self-auto">
                        Client: Pooja & Rohan
                      </span>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-xl bg-[#090D16] border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Event Dates</span>
                          <p className="text-xs font-bold text-white">18–20 Oct 2026</p>
                        </div>
                        <div className="p-3 rounded-xl bg-[#090D16] border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Venue</span>
                          <p className="text-xs font-bold text-white">Taj Palace, Delhi</p>
                        </div>
                        <div className="p-3 rounded-xl bg-[#090D16] border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Guest List</span>
                          <p className="text-xs font-bold text-white">450 Confirmed</p>
                        </div>
                        <div className="p-3 rounded-xl bg-[#090D16] border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Proposal</span>
                          <p className="text-xs font-bold text-emerald-400">Approved ✓</p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-slate-200 text-[11px]">
                            Planner updated the dinner sequence. Client received instant WhatsApp confirmation.
                          </span>
                        </div>
                        <button
                          onClick={handleCopyShareLink}
                          className="text-[11px] font-bold text-purple-300 hover:text-white flex items-center gap-1 shrink-0 ml-2"
                        >
                          <Copy size={12} />
                          <span>{copiedLink ? "Copied!" : "Copy Portal Link"}</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 6. GALLERY TAB */}
                {activeTab === "gallery" && (
                  <motion.div
                    key="gallery"
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -12 }}
                    transition={{ duration: 0.2 }}
                    className="relative z-10 space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                      <div>
                        <h3 className="text-base font-extrabold text-white font-heading flex items-center gap-2">
                          <span>High-Res Deliverables & Client Gallery</span>
                          <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
                            <Lock size={10} className="inline mr-1" /> PIN: 9281
                          </span>
                        </h3>
                        <p className="text-xs text-slate-400">Cloudinary-powered client photo proofing with download permissions</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopyShareLink}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <Share2 size={12} className="text-purple-400" />
                          <span>{copiedLink ? "Link Copied!" : "Share Link"}</span>
                        </button>
                        <button
                          onClick={handleDownloadZip}
                          disabled={downloadingZip}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <Download size={12} />
                          <span>{downloadingZip ? `${downloadProgress}%` : "Download ZIP (2.4 GB)"}</span>
                        </button>
                      </div>
                    </div>

                    {downloadingZip && (
                      <div className="space-y-1 font-mono text-[10px] p-2.5 bg-amber-950/40 border border-amber-500/30 rounded-xl">
                        <div className="flex justify-between text-amber-300 font-bold">
                          <span>PREPARING HIGH-RES PROOFING ARCHIVE...</span>
                          <span>{downloadProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${downloadProgress}%` }} />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { title: "Baraat_Grand_Ingress.JPG", tag: "Lawn Entrance", size: "18.4 MB" },
                        { title: "Mandap_Decor_Stage.RAW", tag: "Stage Rigging", size: "45.2 MB" },
                        { title: "Sangeet_Drone_4K.MP4", tag: "Drone Footage", size: "320 MB" },
                        { title: "Couple_Portraits_HighRes.JPG", tag: "Proofing Album", size: "28.5 MB" },
                      ].map((item, i) => (
                        <div key={i} className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 group">
                          <div className="aspect-video rounded-xl bg-gradient-to-tr from-purple-950/40 to-slate-800 flex items-center justify-center border border-slate-800/80">
                            <Icon icon="solar:gallery-bold-duotone" className="text-2xl text-purple-400 group-hover:scale-110 transition-transform" />
                          </div>
                          <div>
                            <span className="text-[9px] text-amber-400 font-bold font-mono">{item.tag}</span>
                            <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">{item.size}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom Showcase Bar */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
                <span className="text-slate-400 font-medium">
                  {tabs.find((t) => t.id === activeTab)?.tagline}
                </span>
                <span className="text-purple-400 font-bold flex items-center gap-1">
                  <span>Included in all EventOS agency plans</span>
                  <Check size={14} />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action CTAs: Book a Free Demo & Start 14-Day Free Trial */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleBookDemo}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-extrabold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-500 shadow-lg shadow-purple-500/25 active:scale-[0.98] transition-all duration-200 cursor-pointer group"
          >
            <Calendar className="w-4 h-4 text-purple-200" />
            <span>Book a Free Demo</span>
            <ArrowRight className="w-4 h-4 text-purple-200 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={handleStartTrial}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-slate-800 bg-slate-100 hover:bg-slate-200/80 border border-slate-300/80 shadow-xs active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>Start 14-Day Free Trial</span>
          </button>
        </div>
      </div>
    </section>
  );
}
