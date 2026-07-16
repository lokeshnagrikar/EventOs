"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  DollarSign,
  Users,
  Building,
  Calendar,
  Layers,
  ArrowRight,
  Shield,
  HelpCircle,
  Play,
  ArrowLeft,
  X,
  Check,
  Send,
  Loader2,
  Trash2,
  Lock,
  Plus,
  PlusCircle,
  FileText,
  CreditCard,
  MessageSquare,
  Search,
  CheckSquare,
  Activity,
  Sliders,
  ChevronRight,
  UserCheck,
  Info,
  Clock,
  Eye,
  AlertCircle
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { Icon } from "@iconify/react";
import { useToastStore } from "@/lib/toastStore";
import { cn } from "@/lib/utils";
import { useAuthModalStore } from "@/store/authModalStore";

// Mock revenue data
const REVENUE_DATA = [
  { month: "Jan", revenue: 24000, profit: 16000 },
  { month: "Feb", revenue: 32000, profit: 21000 },
  { month: "Mar", revenue: 48000, profit: 34000 },
  { month: "Apr", revenue: 64000, profit: 45000 },
  { month: "May", revenue: 89000, profit: 62000 },
  { month: "Jun", revenue: 114500, profit: 82000 }
];

// Prepopulated Leads
const MOCK_LEADS = [
  { id: "1", client: "Emma & Daniel", event: "Garden Wedding", status: "QUALIFIED", budget: "$35,000", date: "July 8, 2026" },
  { id: "2", client: "Sophia & James", event: "Plaza Ballroom", status: "NEGOTIATION", budget: "$55,000", date: "July 10, 2026" },
  { id: "3", client: "Mia & Lucas", event: "Ocean Cliff Resort", status: "PROPOSAL", budget: "$42,000", date: "July 12, 2026" },
  { id: "4", client: "Ava & Noah", event: "Rustic Vineyard", status: "LEAD", budget: "$28,000", date: "Aug 15, 2026" },
  { id: "5", client: "Isabella & Liam", event: "Modern Loft Gala", status: "WON", budget: "$48,000", date: "Completed" }
];

// Prepopulated Quotes
const MOCK_QUOTES = [
  { id: "Q-928", client: "Emma & Daniel", items: "Full Planning + Custom Floral", total: "$12,500", status: "ACCEPTED" },
  { id: "Q-929", client: "Sophia & James", items: "Premium Staging, Audio & Lighting", total: "$18,200", status: "PENDING" },
  { id: "Q-930", client: "Mia & Lucas", items: "Month-Of Coordination Package", total: "$6,500", status: "SENT" },
  { id: "Q-931", client: "Olivia & Ethan", items: "Elite Destination Roster Plan", total: "$22,000", status: "ACCEPTED" }
];

// Prepopulated Invoices
const MOCK_INVOICES = [
  { id: "INV-921", client: "Emma & Daniel", desc: "Retainer Deposit (30%)", amount: "$3,750", status: "PAID", method: "Credit Card" },
  { id: "INV-922", client: "Olivia & Ethan", desc: "Midway Milestone Payment", amount: "$8,800", status: "PAID", method: "Bank Transfer" },
  { id: "INV-923", client: "Mia & Lucas", desc: "Booking Deposit (20%)", amount: "$1,300", status: "OVERDUE", method: "N/A" },
  { id: "INV-924", client: "Sophia & James", desc: "Full Contract Clearance", amount: "$18,200", status: "OPEN", method: "N/A" }
];

// Prepopulated Events
const MOCK_EVENTS = [
  { time: "09:00 AM", task: "Florals & Arbors setup", staff: "Sarah Johnson", status: "COMPLETED" },
  { time: "11:30 AM", task: "Soundcheck & Mic adjustments", staff: "Dave Miller", status: "IN_PROGRESS" },
  { time: "02:00 PM", task: "Catering check-in & Table layouts", staff: "Elena Rostova", status: "PENDING" },
  { time: "04:30 PM", task: "Guest Arrivals & Welcoming", staff: "Marcus Brody", status: "PENDING" }
];

// Prepopulated Galleries
const MOCK_GALLERIES = [
  { name: "Emma & Daniel Wedding", count: "342 photos", size: "4.8 GB", status: "LOCKED" },
  { name: "Isabella & Liam Gala", count: "512 photos", size: "8.2 GB", status: "UNLOCKED" },
  { name: "Ava & Noah Proposal Shoot", count: "120 photos", size: "2.1 GB", status: "UNLOCKED" }
];

export default function InteractiveDemoPage() {
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);
  const openModal = useAuthModalStore((state) => state.openModal);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [tourStep, setTourStep] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");
  const [appliedDiscountPercent, setAppliedDiscountPercent] = useState(0);

  // AI Chat States
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string; rawReport?: any }>>([
    { sender: "ai", text: "Welcome to the EventOS AI Assistant. Click any prompt below to test drive my operations query capabilities!" }
  ]);
  const [aiTyping, setAiTyping] = useState(false);

  // Guided Tour definition
  const TOUR_STEPS = [
    {
      title: "Welcome to Dream Weddings Studio 🌟",
      desc: "This is your Live Demo environment. You're logged in as Sarah Johnson, Owner of Dream Weddings Studio. We've preloaded realistic sandbox data so you can explore the workflow.",
      tab: "dashboard",
      target: "#demo-badge"
    },
    {
      title: "Executive Workspace Dashboard 📊",
      desc: "See overall operational health, priority risks, outstanding cash flows, and time saved in real-time. This command center guides your daily activities.",
      tab: "dashboard",
      target: "#dashboard-metrics"
    },
    {
      title: "Planner CRM Pipeline 👥",
      desc: "Manage client leads, track budgets, and transition inquiries through stages. Let's switch to the CRM view to see the preloaded client list.",
      tab: "crm",
      target: "#crm-view"
    },
    {
      title: "Interactive Smart Quotes 📄",
      desc: "Generate packages, estimated timelines, and proposals. Clients can approve contracts and submit digital signatures instantly via our portal.",
      tab: "quotes",
      target: "#quotes-view"
    },
    {
      title: "Run-of-Show Timelines 📅",
      desc: "Track vendor coordination rosters, staging times, and staff duties. Conflicts are flagged automatically to prevent layout overlaps.",
      tab: "events",
      target: "#events-view"
    },
    {
      title: "Proofing Galleries & Lock Deliveries 🖼️",
      desc: "Deliver high-res wedding photos directly to clients. The 'Lock Downloads' toggle automatically blocks client file saving until milestone invoices are paid.",
      tab: "gallery",
      target: "#gallery-view"
    },
    {
      title: "Client Portal Simulation 🌐",
      desc: "This is what your wedding couples see. They can review estimates, sign contracts, and pay retainer milestones directly from their portal.",
      tab: "portal",
      target: "#portal-view"
    },
    {
      title: "AI Chat Assistant 🤖",
      desc: "Ask the AI assistant to summarize pending balances, project monthly earnings, or outline upcoming tasks. Try clicking any quick-query prompt in the chat console.",
      tab: "ai",
      target: "#ai-view"
    },
    {
      title: "SaaS Billing Portal 💳",
      desc: "Review your active subscription plan, manage user seats, add payment methods, apply coupons, and customize tax rates.",
      tab: "billing",
      target: "#billing-view"
    },
    {
      title: "Ready to launch your workspace? 🚀",
      desc: "Create your free workspace in 30 seconds to lock in this premium brand template and start managing your events in style.",
      tab: "dashboard",
      target: "#cta-button"
    }
  ];

  // Auto update tab based on tour step
  useEffect(() => {
    if (TOUR_STEPS[tourStep]) {
      setActiveTab(TOUR_STEPS[tourStep].tab);
    }
  }, [tourStep]);

  // Real-time activity toasts simulation
  useEffect(() => {
    const alerts = [
      "New lead generated: Ava & Noah (Rustic Vineyard)",
      "Payment of $3,750 received from Emma & Daniel",
      "New photo upload completed for album: Emma & Daniel Wedding",
      "Invoice INV-921 marked as PAID",
      "AI generated a quote proposal for Sophia & James",
      "Staff member Marcus Brody joined planning roster",
      "Booking confirmed: Grand Hotel Corporate Gala"
    ];

    const interval = setInterval(() => {
      const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];
      addToast(randomAlert, "success");
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const triggerUpgrade = (reason: string) => {
    setUpgradeReason(reason);
    setShowUpgradeModal(true);
  };

  const handleAiQuery = (query: string) => {
    if (aiTyping) return;

    setChatMessages((prev) => [...prev, { sender: "user", text: query }]);
    setAiTyping(true);

    setTimeout(() => {
      let reply = "";
      let report: any = null;

      if (query.includes("revenue")) {
        reply = "Dream Weddings Studio has generated $12,450.00 USD in revenue today across 3 cleared milestone invoices. Here is the profit margins report:";
        report = { title: "Revenue Summary", val: "$12,450.00", desc: "July 5, 2026 Payments" };
      } else if (query.includes("quote")) {
        reply = "Proposal estimate successfully generated for 'Grand Hotel Corporate Gala':\n- 100 Guests\n- Premium Decor, Lighting & Sound\n- Total estimate: $10,000 USD.";
      } else if (query.includes("weddings")) {
        reply = "Here are the 3 upcoming weddings for the next 7 days:\n1. Emma & Daniel - July 8 (Garden Estate)\n2. Sophia & James - July 10 (Plaza Ballroom)\n3. Mia & Lucas - July 12 (Ocean Cliff Resort)";
      } else if (query.includes("invoices")) {
        reply = "There are currently 4 outstanding invoices totaling $9,800.00 USD. The largest is invoice INV-923 ($1,300) for Mia & Lucas, due in 2 days.";
      } else {
        reply = "Predicted July 2026 revenue is $64,200.00 USD based on 8 booked weddings and contract milestone schedules (92% confidence index).";
      }

      setChatMessages((prev) => [...prev, { sender: "ai", text: reply, rawReport: report }]);
      setAiTyping(false);
      addToast("AI Assistant responded.", "success");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans relative selection:bg-purple-650 selection:text-white overflow-hidden">
      
      {/* Floating Read-Only Badge */}
      <div id="demo-badge" className="fixed top-3 left-1/2 -translate-x-1/2 z-[99] px-4 py-1.5 border border-purple-500/20 bg-purple-950/40 backdrop-blur-md rounded-full shadow-lg flex items-center gap-2 select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
        <span className="text-[9px] font-black tracking-widest uppercase text-purple-300">Demo Mode (Read Only)</span>
      </div>

      {/* Main Workspace Layout Container */}
      <div className="flex-1 flex min-h-screen pt-12">

        {/* Sidebar */}
        <aside className="w-64 border-r border-zinc-900 bg-[#09090B] p-5 space-y-6 shrink-0 flex flex-col justify-between hidden md:flex">
          <div className="space-y-6">
            
            {/* Owner Profile Header */}
            <div className="flex items-center gap-3 p-2 border border-zinc-850 bg-zinc-950/40 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-sm">
                SJ
              </div>
              <div className="text-left">
                <h3 className="text-xs font-bold text-white">Sarah Johnson</h3>
                <p className="text-[9px] text-zinc-550 uppercase tracking-wider font-semibold">Dream Weddings Studio</p>
              </div>
            </div>

            {/* Navigation Lists */}
            <nav className="space-y-1.5 text-xs font-bold" aria-label="Demo Sidebar">
              {[
                { id: "dashboard", label: "Executive Dashboard", icon: "solar:widget-bold-duotone" },
                { id: "crm", label: "Planner CRM", icon: "solar:users-group-rounded-bold-duotone" },
                { id: "quotes", label: "Proposals & Quotes", icon: "solar:document-text-bold-duotone" },
                { id: "events", label: "Events Timeline", icon: "solar:calendar-bold-duotone" },
                { id: "gallery", label: "Proofing Galleries", icon: "solar:gallery-bold-duotone" },
                { id: "portal", label: "Client Portal", icon: "solar:window-frame-bold-duotone" },
                { id: "ai", label: "AI Assistant Chat", icon: "solar:chat-line-bold-duotone" },
                { id: "billing", label: "Billing & Seats", icon: "solar:wallet-money-bold-duotone" }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition text-left cursor-pointer",
                    activeTab === item.id 
                      ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30 border border-transparent"
                  )}
                >
                  <Icon icon={item.icon} className="text-sm shrink-0" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Sidebar Footer CTA */}
          <div className="space-y-3">
            <div className="p-4 border border-zinc-850 bg-zinc-950/20 rounded-2xl text-center space-y-2">
              <span className="text-[8px] font-black uppercase tracking-wider text-purple-400">Unlock All Features</span>
              <p className="text-[9px] text-zinc-500 leading-relaxed font-semibold">Convert your sandbox into a fully active trial account.</p>
              <button
                onClick={() => triggerUpgrade("Start free trial and begin customizing brand configurations.")}
                className="w-full py-2 bg-gradient-to-r from-purple-650 to-pink-650 hover:opacity-90 text-white font-bold rounded-xl text-[9px] transition active:scale-98"
              >
                Create Workspace
              </button>
            </div>
            <button
              onClick={() => router.push("/")}
              className="w-full text-center text-[10px] font-black uppercase text-zinc-500 hover:text-zinc-300 transition"
            >
              Back to Landing
            </button>
          </div>
        </aside>

        {/* Content Shell */}
        <main className="flex-1 bg-[#09090B] p-6 overflow-y-auto max-h-[calc(100vh-3rem)]">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* MODULE CONTENT SWITCHER */}
            <AnimatePresence mode="wait">
              
              {/* EXECUTIVE DASHBOARD VIEW */}
              {activeTab === "dashboard" && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="space-y-6"
                  id="dashboard-metrics"
                >
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                    <div>
                      <h1 className="text-base font-black uppercase tracking-wider text-white">Executive Command Center</h1>
                      <p className="text-[10px] text-zinc-555 uppercase tracking-widest font-black mt-1">Sarah Johnson • Premium Wedding Agency</p>
                    </div>
                    <button
                      onClick={() => triggerUpgrade("Export workspace financials.")}
                      className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-white font-bold rounded-xl text-[10px] transition flex items-center gap-1.5"
                    >
                      Export Report
                    </button>
                  </div>

                  {/* Highlight Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
                    {[
                      { label: "Annual Revenue", val: "$114,500", icon: "solar:banknote-bold-duotone", trend: "+24.5% month-over-month", color: "text-purple-400" },
                      { label: "Total Bookings", val: "34 Events", icon: "solar:calendar-bold-duotone", trend: "8 Destination weddings", color: "text-pink-400" },
                      { label: "Active Pipelines", val: "40+ Leads", icon: "solar:users-group-rounded-bold-duotone", trend: "15 Qualified, 10 proposals", color: "text-cyan-400" },
                      { label: "Operational Risk", val: "Clean", icon: "solar:shield-bold-duotone", trend: "No staff roster conflicts", color: "text-emerald-400" }
                    ].map((m, idx) => (
                      <div key={idx} className="p-5 border border-zinc-850 bg-[#111113]/40 rounded-2xl space-y-3 font-semibold">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-zinc-550 uppercase font-black tracking-wider">{m.label}</span>
                          <Icon icon={m.icon} className={cn("text-base", m.color)} />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-white font-mono">{m.val}</h3>
                          <p className="text-[9px] text-zinc-550 font-mono">{m.trend}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Revenue Growth Chart */}
                  <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
                    <span className="text-[9px] text-zinc-550 uppercase font-black tracking-wider block">Financial Performance Margin</span>
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="month" stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
                          <YAxis stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ background: "#09090b", borderColor: "#27272a", borderRadius: "12px", fontSize: "10px" }} />
                          <Area type="monotone" dataKey="revenue" name="Total Revenue" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PLANNER CRM VIEW */}
              {activeTab === "crm" && (
                <motion.div
                  key="crm"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="space-y-6"
                  id="crm-view"
                >
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                    <div>
                      <h1 className="text-base font-black uppercase tracking-wider text-white">CRM Pipeline Manager</h1>
                      <p className="text-[10px] text-zinc-555 uppercase tracking-widest font-black mt-1">40+ Leads active in planning cycle</p>
                    </div>
                    <button
                      onClick={() => triggerUpgrade("Create custom client records.")}
                      className="px-3.5 py-2 bg-gradient-to-r from-purple-650 to-pink-650 text-white font-bold rounded-xl text-[10px] transition flex items-center gap-1"
                    >
                      <Plus size={12} /> Add Prospect
                    </button>
                  </div>

                  {/* Kanban Pipeline Board */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {["LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON"].map((col) => (
                      <div key={col} className="p-4 border border-zinc-855 bg-zinc-950/20 rounded-2xl space-y-3 min-h-[300px]">
                        <span className="text-[8px] text-zinc-555 uppercase font-black tracking-wider block">{col}</span>
                        <div className="space-y-2">
                          {MOCK_LEADS.filter(l => l.status === col).map(l => (
                            <div key={l.id} className="p-3 border border-zinc-900 bg-zinc-950/40 rounded-xl space-y-2 cursor-pointer hover:border-zinc-800 transition">
                              <h4 className="text-[11px] font-bold text-white leading-none">{l.client}</h4>
                              <p className="text-[9px] text-zinc-550 font-medium font-sans">{l.event}</p>
                              <div className="flex justify-between text-[9px] font-bold font-mono border-t border-zinc-900 pt-1.5">
                                <span className="text-purple-400">{l.budget}</span>
                                <span className="text-zinc-550 text-[8px]">{l.date}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* PROPOSALS & QUOTES VIEW */}
              {activeTab === "quotes" && (
                <motion.div
                  key="quotes"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="space-y-6"
                  id="quotes-view"
                >
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                    <div>
                      <h1 className="text-base font-black uppercase tracking-wider text-white">Smart Proposals Console</h1>
                      <p className="text-[10px] text-zinc-555 uppercase tracking-widest font-black mt-1">25 proposals drafted & registered</p>
                    </div>
                    <button
                      onClick={() => triggerUpgrade("Draft customized package estimates.")}
                      className="px-3.5 py-2 bg-gradient-to-r from-purple-650 to-pink-650 text-white font-bold rounded-xl text-[10px] transition flex items-center gap-1"
                    >
                      <Plus size={12} /> Draft Proposal
                    </button>
                  </div>

                  {/* Table listing proposals */}
                  <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs font-semibold text-zinc-400 font-mono">
                        <thead>
                          <tr className="text-left border-b border-zinc-850 pb-2 text-[9px] text-zinc-555 font-black uppercase tracking-wider">
                            <th className="pb-2">Proposal ID</th>
                            <th className="pb-2">Client Name</th>
                            <th className="pb-2">Package Items</th>
                            <th className="pb-2">Total Budget</th>
                            <th className="pb-2">Status</th>
                            <th className="pb-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {MOCK_QUOTES.map((q) => (
                            <tr key={q.id} className="border-b border-zinc-900 last:border-0 hover:bg-zinc-955/30">
                              <td className="py-3 font-bold text-zinc-300">{q.id}</td>
                              <td className="py-3 text-zinc-200">{q.client}</td>
                              <td className="py-3 text-zinc-500 font-sans">{q.items}</td>
                              <td className="py-3 font-bold text-zinc-300">{q.total}</td>
                              <td className="py-3">
                                <span className={cn(
                                  "px-1.5 py-0.5 border rounded-full text-[8px] font-black uppercase tracking-wider font-sans",
                                  q.status === "ACCEPTED" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-450" : "border-amber-500/20 bg-amber-500/5 text-amber-400"
                                )}>
                                  {q.status}
                                </span>
                              </td>
                              <td className="py-3 text-right font-sans">
                                <button
                                  onClick={() => triggerUpgrade("Revise and send proposals to clients.")}
                                  className="text-purple-400 hover:text-purple-300 font-bold"
                                >
                                  Edit & Send
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* EVENTS TIMELINE VIEW */}
              {activeTab === "events" && (
                <motion.div
                  key="events"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="space-y-6"
                  id="events-view"
                >
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                    <div>
                      <h1 className="text-base font-black uppercase tracking-wider text-white">Staging Timeline & Roster</h1>
                      <p className="text-[10px] text-zinc-555 uppercase tracking-widest font-black mt-1">Garden weddings timing schedule</p>
                    </div>
                    <button
                      onClick={() => triggerUpgrade("Add timing tasks and schedules.")}
                      className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-white font-bold rounded-xl text-[10px] transition flex items-center gap-1.5"
                    >
                      <Plus size={12} /> Add Task
                    </button>
                  </div>

                  {/* Hour blocks layout */}
                  <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
                    {MOCK_EVENTS.map((ev, idx) => (
                      <div key={idx} className="flex gap-4 items-start p-3 border border-zinc-900 bg-zinc-955/40 rounded-xl">
                        <div className="text-[10px] font-black font-mono text-purple-450 pt-0.5 shrink-0 w-16">{ev.time}</div>
                        <div className="flex-1 space-y-1">
                          <h4 className="text-[11px] font-bold text-white leading-none">{ev.task}</h4>
                          <p className="text-[9px] text-zinc-550 font-medium">Assigned Coordinator: {ev.staff}</p>
                        </div>
                        <span className={cn(
                          "px-1.5 py-0.5 border rounded-full text-[8px] font-black uppercase tracking-wider font-sans",
                          ev.status === "COMPLETED" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-450" :
                            ev.status === "IN_PROGRESS" ? "border-purple-500/20 bg-purple-500/5 text-purple-450" :
                              "border-zinc-800 bg-zinc-900/30 text-zinc-400"
                        )}>
                          {ev.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* GALLERY VIEW */}
              {activeTab === "gallery" && (
                <motion.div
                  key="gallery"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="space-y-6"
                  id="gallery-view"
                >
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                    <div>
                      <h1 className="text-base font-black uppercase tracking-wider text-white">Client Photo Proofs</h1>
                      <p className="text-[10px] text-zinc-555 uppercase tracking-widest font-black mt-1">High-res CDN image albums delivery</p>
                    </div>
                    <button
                      onClick={() => triggerUpgrade("Upload proof photos.")}
                      className="px-3.5 py-2 bg-gradient-to-r from-purple-650 to-pink-650 text-white font-bold rounded-xl text-[10px] transition flex items-center gap-1"
                    >
                      <Plus size={12} /> Create Album
                    </button>
                  </div>

                  {/* Album list */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {MOCK_GALLERIES.map((g, idx) => (
                      <div key={idx} className="p-5 border border-zinc-850 bg-[#111113]/40 rounded-2xl space-y-4">
                        <div className="w-full h-28 rounded-xl bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-600 relative overflow-hidden">
                          <Building className="opacity-10" size={32} />
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent flex items-end p-3">
                            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">{g.count} • {g.size}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-[11px] font-black text-white">{g.name}</h4>
                            <p className="text-[9px] text-zinc-550 font-semibold font-sans mt-0.5">Proofing Client Link</p>
                          </div>
                          
                          {/* Lock download toggle */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] text-zinc-555 uppercase font-black font-sans">Lock</span>
                            <button
                              onClick={() => triggerUpgrade("Toggle client download lock restrictions.")}
                              className={cn(
                                "w-8 h-4 rounded-full p-0.5 transition-all duration-300 relative cursor-pointer",
                                g.status === "LOCKED" ? "bg-purple-650" : "bg-zinc-800"
                              )}
                            >
                              <div className={cn("w-3 h-3 bg-white rounded-full transition-all duration-300 absolute top-0.5", g.status === "LOCKED" ? "left-4.5" : "left-0.5")} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* CLIENT PORTAL VIEW */}
              {activeTab === "portal" && (
                <motion.div
                  key="portal"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="space-y-6"
                  id="portal-view"
                >
                  <div className="border-b border-zinc-900 pb-4">
                    <h1 className="text-base font-black uppercase tracking-wider text-white">Client Portal Preview</h1>
                    <p className="text-[10px] text-zinc-555 uppercase tracking-widest font-black mt-1">What your wedding couples and corporate clients see</p>
                  </div>

                  <div className="p-6 border border-purple-500/20 bg-[#111113]/40 rounded-3xl space-y-6 max-w-2xl mx-auto">
                    <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs">EO</div>
                        <div>
                          <h4 className="text-[11px] font-bold text-white leading-none">Dream Weddings Portal</h4>
                          <span className="text-[8px] text-zinc-555 uppercase font-black tracking-wider block mt-0.5">Emma & Daniel Wedding</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full border border-emerald-500/25 bg-emerald-500/5 text-[8px] text-emerald-450 font-black uppercase font-mono">Retainer Paid</span>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase text-zinc-200">Contract Proposals & Approvals</h3>
                      <div className="p-4 border border-zinc-900 bg-zinc-950/40 rounded-2xl space-y-3 font-semibold text-xs">
                        <p className="flex justify-between text-zinc-400"><span>Milestone Invoice:</span> <span className="text-white">$3,750.00</span></p>
                        <p className="flex justify-between text-zinc-400"><span>Estimated total:</span> <span className="text-white">$12,500.00</span></p>
                        <p className="flex justify-between text-zinc-400"><span>Date of Wedding:</span> <span className="text-purple-400">July 8, 2026</span></p>
                      </div>

                      <div className="border border-zinc-900 bg-zinc-950/20 p-4 rounded-2xl flex justify-between items-center">
                        <div>
                          <span className="text-[8px] text-zinc-555 uppercase font-black tracking-wider block">Signature Log</span>
                          <span className="text-[10px] text-zinc-300 font-mono font-bold mt-1 block">Signed by: Emma Vance (2026-06-01)</span>
                        </div>
                        <CheckCircleIcon />
                      </div>

                      <button
                        onClick={() => triggerUpgrade("Simulate quote acceptance and stripe deposits.")}
                        className="w-full py-2.5 bg-gradient-to-r from-purple-650 to-pink-650 hover:opacity-90 text-white font-bold rounded-xl text-[10px] transition active:scale-98"
                      >
                        Accept Proposal & Pay Retainer
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* AI CHAT VIEW */}
              {activeTab === "ai" && (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="space-y-6"
                  id="ai-view"
                >
                  <div className="border-b border-zinc-900 pb-4">
                    <h1 className="text-base font-black uppercase tracking-wider text-white">AI Operations Assistant</h1>
                    <p className="text-[10px] text-zinc-555 uppercase tracking-widest font-black mt-1">Predict cash flow and audit pending rosters</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Chat Area */}
                    <div className="lg:col-span-8 p-5 border border-zinc-850 bg-zinc-950/20 rounded-3xl flex flex-col justify-between min-h-[380px]">
                      <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
                        {chatMessages.map((m, idx) => (
                          <div key={idx} className={cn("flex flex-col max-w-[85%] text-xs font-semibold p-3.5 rounded-2xl space-y-2", m.sender === "user" ? "bg-purple-950/20 border border-purple-500/25 ml-auto text-zinc-200" : "bg-zinc-950/50 border border-zinc-900 mr-auto text-zinc-300")}>
                            <span className="text-[8px] text-zinc-555 uppercase font-black tracking-widest font-mono">{m.sender === "user" ? "Sarah Johnson" : "AI Assistant"}</span>
                            <p className="leading-relaxed font-sans">{m.text}</p>
                            {m.rawReport && (
                              <div className="p-3 border border-zinc-900 bg-zinc-950 rounded-xl font-mono text-[10px] flex justify-between items-center">
                                <div>
                                  <span className="text-[8px] text-zinc-555 block uppercase tracking-wider">{m.rawReport.title}</span>
                                  <span className="text-emerald-450 font-bold mt-1 block">{m.rawReport.val}</span>
                                </div>
                                <span className="text-[8px] text-zinc-500">{m.rawReport.desc}</span>
                              </div>
                            )}
                          </div>
                        ))}

                        {aiTyping && (
                          <div className="flex gap-2.5 items-center mr-auto bg-zinc-950/50 border border-zinc-900 p-3 rounded-2xl">
                            <Loader2 className="animate-spin text-purple-500 size-3" />
                            <span className="text-[10px] text-zinc-500 font-bold font-sans">AI is running analytical prediction modeling...</span>
                          </div>
                        )}
                      </div>

                      {/* AI prompt options */}
                      <div className="border-t border-zinc-900 pt-4 space-y-3 mt-4">
                        <span className="text-[8px] text-zinc-555 uppercase font-black tracking-wider block">Select Sandbox Prompt Question</span>
                        <div className="flex flex-wrap gap-2">
                          {[
                            "Show today's revenue",
                            "Generate contract proposal",
                            "Predict next month's revenue",
                            "Upcoming weddings list",
                            "Summary of pending invoices"
                          ].map((q) => (
                            <button
                              key={q}
                              onClick={() => handleAiQuery(q)}
                              disabled={aiTyping}
                              className="px-2.5 py-1.5 border border-zinc-900 hover:border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:text-zinc-200 font-bold rounded-xl text-[9px] transition cursor-pointer"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Feature Callout Panel */}
                    <div className="lg:col-span-4 p-5 border border-zinc-850 bg-[#111113]/40 rounded-3xl space-y-4">
                      <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block">AI Assistant Features</span>
                      <div className="space-y-4 text-xs font-semibold">
                        {[
                          { title: "Generate Estimate Roster", desc: "Instantly draft quotes and pricing milestones." },
                          { title: "Revenue Forecasting", desc: "Utilizes statistical modeling to predict pipeline margins." },
                          { title: "Roster Collision checks", desc: "Verifies staff timing overlaps across contracts." }
                        ].map((call, idx) => (
                          <div key={idx} className="p-3 border border-zinc-900 bg-zinc-950/40 rounded-xl space-y-1">
                            <h4 className="text-purple-400 text-[10px] uppercase font-black tracking-wider flex items-center gap-1.5">
                              <Sparkles size={10} /> {call.title}
                            </h4>
                            <p className="text-[9px] text-zinc-500 leading-normal font-sans">{call.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* BILLING PORTAL VIEW */}
              {activeTab === "billing" && (
                <motion.div
                  key="billing"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="space-y-6"
                  id="billing-view"
                >
                  <div className="border-b border-zinc-900 pb-4">
                    <h1 className="text-base font-black uppercase tracking-wider text-white">Billing Settings Console</h1>
                    <p className="text-[10px] text-zinc-550 uppercase tracking-widest font-black mt-1">Review subscription renewal milestones, invoices, and limits.</p>
                  </div>

                  {/* Top Stats Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                    <div className="p-5 border border-zinc-850 bg-[#111113]/40 rounded-2xl space-y-4">
                      <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block">Subscription Tier</span>
                      <div className="space-y-2.5 font-bold font-mono">
                        <p className="flex justify-between text-zinc-400"><span>Current Plan:</span> <span className="text-purple-450">Starter Plan</span></p>
                        <p className="flex justify-between text-zinc-400"><span>Billing Cycle:</span> <span>MONTHLY</span></p>
                        <p className="flex justify-between text-zinc-400"><span>Renewal Date:</span> <span>2026-08-01</span></p>
                        <p className="flex justify-between text-zinc-400"><span>Status:</span> <span className="px-2 py-0.5 rounded-full border border-emerald-500/25 bg-emerald-500/5 text-[8px] text-emerald-450 uppercase font-sans font-black">Active</span></p>
                      </div>
                    </div>

                    <div className="p-5 border border-zinc-850 bg-[#111113]/40 rounded-2xl space-y-4 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] text-zinc-555 uppercase font-black tracking-widest block">Limits Allocation</span>
                        <p className="text-[10px] text-zinc-400 mt-2 font-semibold font-sans">Workspace seats: 1 / 5 used.</p>
                      </div>
                      <button
                        onClick={() => triggerUpgrade("Upgrade plan limits to secure more active team members.")}
                        className="w-full py-2 bg-gradient-to-r from-purple-650 to-pink-650 text-white font-bold rounded-xl text-[9px] transition text-center"
                      >
                        Upgrade Plan Limits
                      </button>
                    </div>

                    <div className="p-5 border border-zinc-850 bg-[#111113]/40 rounded-2xl space-y-4">
                      <span className="text-[9px] text-zinc-555 uppercase font-black tracking-widest block">Applied Discount</span>
                      <p className="text-[10px] text-zinc-400 font-bold font-mono">Discount status: {appliedDiscountPercent > 0 ? `${appliedDiscountPercent}% recurring coupon active` : "No active discount coupons"}</p>
                    </div>
                  </div>

                  {/* Payment Invoice Logs */}
                  <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
                    <span className="text-[9px] text-zinc-555 uppercase font-black tracking-widest block">Billing Invoices Log</span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px] font-medium text-zinc-455 font-mono">
                        <thead>
                          <tr className="text-left border-b border-zinc-855 pb-2 text-[9px] text-zinc-550 font-black uppercase tracking-wider">
                            <th className="pb-2">Invoice ID</th>
                            <th className="pb-2">Details</th>
                            <th className="pb-2">Amount</th>
                            <th className="pb-2">Payment Method</th>
                            <th className="pb-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {MOCK_INVOICES.map((inv, idx) => (
                            <tr key={idx} className="border-b border-zinc-900 last:border-0 hover:bg-zinc-950/30">
                              <td className="py-2.5 font-bold text-zinc-300">{inv.id}</td>
                              <td className="py-2.5 text-zinc-500 font-sans">{inv.desc}</td>
                              <td className="py-2.5 font-bold text-zinc-250">{inv.amount}</td>
                              <td className="py-2.5 text-zinc-550 font-sans">{inv.method}</td>
                              <td className="py-2.5">
                                <span className={cn(
                                  "px-1.5 py-0.5 border rounded-full text-[8px] font-black uppercase tracking-wider font-sans",
                                  inv.status === "PAID" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-450" :
                                    inv.status === "OVERDUE" ? "border-red-500/20 bg-red-500/5 text-red-400" :
                                      "border-zinc-800 bg-zinc-900/30 text-zinc-400"
                                )}>
                                  {inv.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </main>
      </div>

      {/* FIXED GUIDED TOUR NAVIGATION TOOLBAR */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] w-full max-w-3xl px-4">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="p-5 border border-purple-500/30 bg-zinc-955/90 backdrop-blur-md rounded-2xl shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded border border-purple-500/30 uppercase font-black tracking-widest font-mono">
                Live Guided Tour ({tourStep + 1} / {TOUR_STEPS.length})
              </span>
              <button
                onClick={() => {
                  setTourStep(0);
                  addToast("Demo environment simulated reset! All states restored.", "success");
                }}
                className="px-2 py-0.5 border border-zinc-800 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 rounded text-[9px] font-bold cursor-pointer transition uppercase"
                title="Reset demo data/state"
              >
                Reset Demo
              </button>
              <button
                onClick={() => {
                  router.push("/dashboard");
                  addToast("Exiting demo environment.", "info");
                }}
                className="px-2 py-0.5 border border-red-500/20 hover:bg-red-950/20 text-red-400 rounded text-[9px] font-bold cursor-pointer transition uppercase"
                title="Exit to App Dashboard"
              >
                Exit Demo
              </button>
            </div>
            <h4 className="text-xs font-black text-white mt-1">{TOUR_STEPS[tourStep].title}</h4>
            <p className="text-[10px] text-zinc-405 font-semibold leading-relaxed font-sans">{TOUR_STEPS[tourStep].desc}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0 select-none text-[10px] font-bold">
            {tourStep > 0 && (
              <button
                onClick={() => setTourStep((prev) => prev - 1)}
                className="px-3 py-1.5 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg cursor-pointer transition"
              >
                Previous
              </button>
            )}
            
            {tourStep < TOUR_STEPS.length - 1 ? (
              <button
                onClick={() => setTourStep((prev) => prev + 1)}
                className="px-4 py-1.5 bg-gradient-to-r from-purple-650 to-pink-650 text-white rounded-lg cursor-pointer transition-all hover:shadow-lg font-black"
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={() => {
                  setTourStep(0);
                  addToast("Tour restarted. Enjoy exploring!", "success");
                }}
                className="px-4 py-1.5 bg-purple-650 hover:bg-purple-600 text-white rounded-lg cursor-pointer transition font-black"
              >
                Restart Tour
              </button>
            )}

            <button
              onClick={() => {
                setTourStep(TOUR_STEPS.length - 1);
                addToast("Skipped to trial creation. Let's build your active account!", "success");
              }}
              className="text-[9px] text-zinc-500 hover:text-zinc-400 transition ml-2 uppercase font-black"
            >
              Skip
            </button>
          </div>
        </motion.div>
      </div>

      {/* UPGRADE TRIAL REDIRECT MODAL DIALOG */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpgradeModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-purple-500/20 bg-zinc-950 p-6 space-y-5 shadow-2xl"
            >
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-sm font-black uppercase text-white tracking-wider">Upgrade to Active Workspace</h3>
                <p className="text-[9px] text-zinc-550 uppercase font-black tracking-widest leading-normal">
                  You discovered a premium feature!
                </p>
              </div>

              <p className="text-[10px] text-zinc-400 font-semibold font-sans leading-relaxed text-center">
                "{upgradeReason}" To perform modifications, save data, customize templates, and unlock custom domain routing, register your free trial workspace.
              </p>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 py-2.5 border border-zinc-850 hover:bg-zinc-900 rounded-xl transition text-[10px] font-bold"
                >
                  Keep Exploring
                </button>
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    openModal("register");
                  }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-purple-650 to-pink-650 text-white font-bold rounded-xl hover:opacity-90 transition text-[10px]"
                >
                  Start Free Trial
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Inline custom verification components to avoid import breaks
function CheckCircleIcon() {
  return (
    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-450 shrink-0">
      <Check size={16} />
    </div>
  );
}
