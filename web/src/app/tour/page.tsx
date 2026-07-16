"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/lib/toastStore";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const TOUR_TABS = [
  { id: "dashboard", label: "Executive Workspace", icon: "solar:widget-bold-duotone", desc: "The command center showing overall operational health, priority risks, and cash forecasts." },
  { id: "crm", label: "Planner CRM", icon: "solar:users-group-rounded-bold-duotone", desc: "Track client leads, manage communications pipelines, and view client value statistics." },
  { id: "events", label: "Event Timelines", icon: "solar:calendar-bold-duotone", desc: "Coordinate vendor timing schedules, staging rosters, and planning milestones." },
  { id: "bookings", label: "Smart proposals", icon: "solar:document-text-bold-duotone", desc: "Send interactive quotes, line item lists, and accept e-signatures." },
  { id: "finance", label: "Ledger Invoicing", icon: "solar:wallet-money-bold-duotone", desc: "Configure billing structures, clear milestone invoice schedules, and record receipts." },
  { id: "gallery", label: "Proofing Galleries", icon: "solar:gallery-bold-duotone", desc: "Deliver media proofs to clients with download limits tied to invoice clearances." },
];

const MOCK_FINANCE_DATA = [
  { name: "Jan", revenue: 45000, costs: 12000 },
  { name: "Feb", revenue: 62000, costs: 18000 },
  { name: "Mar", revenue: 84000, costs: 21000 },
  { name: "Apr", revenue: 95000, costs: 22000 },
  { name: "May", revenue: 110000, costs: 25000 },
  { name: "Jun", revenue: 135000, costs: 28000 },
];

export default function ProductTourPage() {
  const addToast = useToastStore((state) => state.addToast);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeCoachmark, setActiveCoachmark] = useState(0);

  const coachmarks: Record<string, string[]> = {
    dashboard: [
      "Welcome to the Executive Workspace. This Circular SVG gauge maps your agency's overall health index.",
      "Track outstanding invoicing collections and planning hours saved via our count tickers.",
      "Check today's priorities checklist sorted automatically by AI operational risk weights."
    ],
    crm: [
      "Review client pipeline stages (Leads, Inquiries, Active planning, Delivered).",
      "Trigger automated emails or customize client questionnaire response logs."
    ],
    events: [
      "Manage coordinator schedules and photographer assignments in real-time.",
      "Timeline overlap indicators highlight conflicts before they impact logistics."
    ],
    bookings: [
      "Click to Accept digital contract signatures and generate dynamic invoices.",
      "Modify pricing options and wedding package estimates interactively."
    ],
    finance: [
      "Set milestone billing points (e.g., 20% retainer deposit, 40% pre-event, 40% gallery release).",
      "Interactive graphs track current agency profits margins."
    ],
    gallery: [
      "Upload raw/JPEG proofing media with instant CloudFront signed CDN delivery.",
      "Turn on 'Lock Downloads' which disables client downloads until invoice payments clear."
    ]
  };

  const currentCoachmarks = coachmarks[activeTab] || [];

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-650 selection:text-white">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 max-w-7xl mx-auto px-6 space-y-12 w-full">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Interactive Product Tour
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none">
            Explore EventOS Modules Live.
          </h1>
          <p className="text-base text-zinc-400 font-semibold">
            Test drive our CRM pipelines, invoice calculators, and timeline boards instantly. Running on mock agency sandbox data.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap justify-center gap-2 select-none border-b border-zinc-900 pb-5">
          {TOUR_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setActiveCoachmark(0);
              }}
              className={cn(
                "flex items-center gap-2.5 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                activeTab === tab.id
                  ? "bg-purple-500/10 text-purple-400 border-purple-500/25 shadow-lg"
                  : "bg-zinc-950/40 text-zinc-450 hover:text-zinc-200 border-zinc-850"
              )}
            >
              <Icon icon={tab.icon} className="text-sm shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Coachmarks Guide Tooltip */}
        <AnimatePresence mode="wait">
          {currentCoachmarks[activeCoachmark] && (
            <motion.div
              key={`${activeTab}-${activeCoachmark}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-5 border border-purple-500/35 bg-purple-950/10 backdrop-blur rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 max-w-4xl mx-auto"
            >
              <div className="space-y-1">
                <span className="text-[9px] text-purple-450 uppercase font-black tracking-widest font-mono">TOUR COACHMARK ({activeCoachmark + 1}/{currentCoachmarks.length})</span>
                <p className="text-xs text-zinc-350 font-bold leading-relaxed">{currentCoachmarks[activeCoachmark]}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 select-none">
                {activeCoachmark > 0 && (
                  <button
                    onClick={() => setActiveCoachmark((prev) => prev - 1)}
                    className="px-3 py-1.5 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg text-[10px] font-bold cursor-pointer transition"
                  >
                    Previous
                  </button>
                )}
                {activeCoachmark < currentCoachmarks.length - 1 ? (
                  <button
                    onClick={() => setActiveCoachmark((prev) => prev + 1)}
                    className="px-3 py-1.5 bg-purple-650 hover:bg-purple-600 text-white rounded-lg text-[10px] font-bold cursor-pointer transition"
                  >
                    Next Guide
                  </button>
                ) : (
                  <button
                    onClick={() => addToast("You finished this module's tour! Try another tab.", "success")}
                    className="px-3 py-1.5 bg-emerald-650 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold cursor-pointer transition"
                  >
                    Got It!
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Interactive Mock Interfaces */}
        <div className="border border-zinc-850 bg-[#121214]/15 rounded-3xl p-6 min-h-[420px] flex items-center justify-center relative overflow-hidden select-none">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />

          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard-mock"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full space-y-6"
              >
                {/* 3 Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <SpotlightCard className="p-5 border border-zinc-850 bg-zinc-950/40 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-zinc-555 font-bold uppercase tracking-wider">Health Index</span>
                      <p className="text-xl font-mono font-black text-white mt-1">94%</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <Icon icon="solar:shield-check-bold-duotone" className="text-xl" />
                    </div>
                  </SpotlightCard>

                  <SpotlightCard className="p-5 border border-zinc-850 bg-zinc-950/40 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-zinc-555 font-bold uppercase tracking-wider">Invoices outstanding</span>
                      <p className="text-xl font-mono font-black text-red-400 mt-1">₹1,85,000</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                      <Icon icon="solar:wallet-bold-duotone" className="text-xl" />
                    </div>
                  </SpotlightCard>

                  <SpotlightCard className="p-5 border border-zinc-850 bg-zinc-950/40 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-zinc-555 font-bold uppercase tracking-wider">Planning hours saved</span>
                      <p className="text-xl font-mono font-black text-emerald-450 mt-1">36.5 hrs</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Icon icon="solar:clock-circle-bold-duotone" className="text-xl" />
                    </div>
                  </SpotlightCard>
                </div>

                {/* Priority Checklist */}
                <div className="p-5 border border-zinc-850 bg-zinc-950/30 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                    <span className="text-xs font-black uppercase text-zinc-300">Action priority queue</span>
                    <span className="text-[9px] text-purple-400 font-bold uppercase border border-purple-500/20 rounded px-2 py-0.5 bg-purple-950/10">AI Evaluated</span>
                  </div>
                  <div className="space-y-3 text-xs font-semibold text-zinc-400">
                    <div className="flex items-center justify-between p-2.5 bg-zinc-900/30 border border-zinc-850 rounded-xl">
                      <span>Florist contract deposit invoice overdue by 4 days</span>
                      <button onClick={() => addToast("Alert notice emailed successfully! ✉", "success")} className="px-3 py-1 bg-purple-650 text-white rounded text-[10px] cursor-pointer">Send Reminder</button>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-zinc-900/30 border border-zinc-850 rounded-xl">
                      <span>Client questionnaire response received: Amit Shah</span>
                      <button onClick={() => addToast("Lead profile status updated to Qualified.", "info")} className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded text-[10px] cursor-pointer">Process Lead</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "crm" && (
              <motion.div
                key="crm-mock"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full space-y-4"
              >
                <span className="text-[10px] text-purple-450 uppercase font-black font-mono">CRM Leads Pipeline Status</span>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { title: "Retained Inquiries", count: 4, bg: "border-zinc-850 bg-zinc-900/20", color: "text-zinc-400" },
                    { title: "Qualified Pipeline", count: 2, bg: "border-purple-500/20 bg-purple-950/5", color: "text-purple-450" },
                    { title: "Proposal Active", count: 5, bg: "border-zinc-850 bg-zinc-900/20", color: "text-zinc-400" },
                    { title: "Deposits Cleared", count: 8, bg: "border-emerald-500/20 bg-emerald-950/5", color: "text-emerald-450" },
                  ].map((col) => (
                    <div key={col.title} className={cn("p-4 border rounded-xl space-y-3", col.bg)}>
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-300">
                        <span>{col.title}</span>
                        <span className={cn("font-mono", col.color)}>{col.count}</span>
                      </div>
                      <div className="h-16 border border-dashed border-zinc-850 rounded-lg flex items-center justify-center text-[9px] text-zinc-555 font-bold italic">
                        Drag cards here
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "events" && (
              <motion.div
                key="events-mock"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full space-y-4"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-purple-450 uppercase font-black font-mono">Event Timeline Schedule Coordinator</span>
                  <span className="text-[9px] text-zinc-555 font-bold">Lawn Venue • Delhi</span>
                </div>
                <div className="border border-zinc-850 rounded-2xl bg-zinc-950/40 p-4 space-y-4">
                  {[
                    { time: "16:00 - 17:00", title: "Floral Staging Crew Setup", staff: "Meera Sen (Coordinator)", overlap: false },
                    { time: "17:30 - 19:00", title: "Catering Vendor Arrival & Load", staff: "Rohan Goel (Manager)", overlap: true },
                    { time: "18:00 - 19:30", title: "Photographer Portfolios Portrait session", staff: "Priya Malik (Photographer)", overlap: true },
                  ].map((item) => (
                    <div key={item.time} className="flex justify-between items-center p-3 bg-zinc-900/60 border border-zinc-850 rounded-xl text-xs font-semibold">
                      <div className="space-y-1">
                        <span className="font-mono text-purple-400 block text-[10px]">{item.time}</span>
                        <span className="text-zinc-200 block font-bold">{item.title}</span>
                        <span className="text-[9px] text-zinc-500 block">Lead: {item.staff}</span>
                      </div>
                      {item.overlap && (
                        <span className="text-[8px] bg-amber-950/40 text-amber-450 border border-amber-900/30 px-2 py-0.5 rounded-full font-black uppercase tracking-wider shrink-0 select-none">
                          Timeline overlap clash
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "bookings" && (
              <motion.div
                key="bookings-mock"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full max-w-2xl border border-zinc-850 bg-zinc-950/40 rounded-2xl p-6 space-y-4 text-xs font-semibold text-zinc-400"
              >
                <div className="border-b border-zinc-900 pb-3 flex justify-between items-center select-none">
                  <div>
                    <h4 className="text-sm font-black text-white">Sangeet Event Proposal</h4>
                    <span className="text-[10px] text-zinc-555">Client: Priya Malhotra</span>
                  </div>
                  <span className="text-purple-450 font-mono text-[10px] font-bold">Quote Value: ₹2,40,000</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2.5 bg-zinc-900/60 border border-zinc-850 rounded-xl">
                    <span>Premium Floral Stage Backdrop decor</span>
                    <span className="font-mono text-white">₹1,10,000</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-zinc-900/60 border border-zinc-850 rounded-xl">
                    <span>Audio visual staging system (JBL array setup)</span>
                    <span className="font-mono text-white">₹1,30,000</span>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 select-none">
                  <button onClick={() => addToast("Proposal signature accepted! Retention invoice dispatched. 🚀", "success")} className="px-4 py-2 bg-purple-650 hover:bg-purple-600 text-white rounded-lg font-bold cursor-pointer transition">
                    Accept Proposal
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === "finance" && (
              <motion.div
                key="finance-mock"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full space-y-4"
              >
                <span className="text-[10px] text-purple-450 uppercase font-black font-mono">Cash Flow Analytics ledger</span>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_FINANCE_DATA}>
                      <defs>
                        <linearGradient id="tourRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#52525b" fontSize={9} fontStyle="bold" />
                      <YAxis stroke="#52525b" fontSize={9} fontStyle="bold" />
                      <Tooltip contentStyle={{ background: "#09090b", borderColor: "#27272a", fontSize: 10 }} />
                      <Area type="monotone" dataKey="revenue" stroke="#8B5CF6" fillOpacity={1} fill="url(#tourRevenueGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {activeTab === "gallery" && (
              <motion.div
                key="gallery-mock"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full space-y-4"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-purple-450 uppercase font-black font-mono">Secure Client Proofing Grid</span>
                  <button onClick={() => addToast("Secure download lock is active. high-res disabled.", "info")} className="text-[8px] bg-red-950/40 text-red-450 border border-red-900/30 px-2 py-0.5 rounded font-black uppercase tracking-wider cursor-pointer">
                    Download Lock Active
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    "/logo/logo.png",
                    "/logo/logo.png",
                    "/logo/logo.png",
                    "/logo/logo.png",
                  ].map((img, idx) => (
                    <div key={idx} className="aspect-square border border-zinc-850 bg-zinc-950/40 rounded-xl relative overflow-hidden group">
                      <img src={img} alt="eo" className="h-full w-full object-contain p-6 opacity-30 group-hover:opacity-50 transition" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold transition cursor-pointer">
                        View Proof
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CTA */}
        <div className="p-12 border border-zinc-800 bg-zinc-955 rounded-3xl text-center space-y-4 select-none">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Ready to unlock full configuration access?</h3>
          <p className="text-xs text-zinc-400 font-semibold max-w-xl mx-auto leading-relaxed">
            Create your workspace in 30 seconds. Connect your custom domain, invite your coordinators crew, and deploy automated invoicing.
          </p>
          <button
            onClick={() => addToast("Initializing signup route...", "info")}
            className="px-6 py-2.5 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Start Free Trial Now
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
