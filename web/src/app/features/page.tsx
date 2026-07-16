"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Calendar, Wallet, ImageIcon, Sparkles, Layout, HelpCircle } from "lucide-react";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { cn } from "@/lib/utils";

const FEATURES_DEEP = [
  {
    id: "crm",
    title: "Leads & CRM Pipeline",
    icon: Users,
    overview: "Run your customer acquisition funnel on autopilot.",
    details: "Track inbound inquiries, automate customer surveys, accept digital contract signatures, and configure pipeline stages (Leads -> Qualified -> Quote accepted).",
    faqs: [
      { q: "Can I import existing client logs?", a: "Yes, you can upload standard CSV spreadsheets to import client details and contacts into our CRM database module." },
      { q: "Does it support custom lead forms?", a: "Yes. EventOS offers custom code snippets and iframe widgets to embed lead forms directly onto your WordPress or Squarespace sites." },
    ],
  },
  {
    id: "events",
    title: "Event & Task Logistics",
    icon: Calendar,
    overview: "Manage photographer schedules, guest timings, and staging rosters.",
    details: "Real-time calendar systems that indicate double-booking resource clashes, assign vendor checklists, and coordinate timeline runs.",
    faqs: [
      { q: "Can coordinators view schedules on mobile?", a: "Yes. The dashboard is fully responsive. Coordinators can view assigned events and mark checklists completed from any tablet or phone." },
    ],
  },
  {
    id: "gallery",
    title: "Client Proofing Gallery",
    icon: ImageIcon,
    overview: "Deliver high-resolution photo portfolios securely.",
    details: "AWS-backed secure photo galleries with granular download controls. Restrict high-res files access until milestone payments are logged in the invoicing ledger.",
    faqs: [
      { q: "What files sizes are supported?", a: "We support high-resolution RAW, JPEG, and PNG images up to 100 MB per file, optimized for rapid client page loads." },
      { q: "How are gallery downloads secured?", a: "Downloads are secured via signed CloudFront links that expire automatically to prevent unauthorized scraping." },
    ],
  },
  {
    id: "finance",
    title: "Payments & Invoicing Ledger",
    icon: Wallet,
    overview: "Milestone payment schedules and automatic reminders.",
    details: "Integrate Stripe and UPI gateways to collect payments automatically. Generate automated invoices, tax sheets, and cash flow forecasting reports.",
    faqs: [
      { q: "Which payment gateways do you support?", a: "We support Stripe for credit card payments and standard UPI gateway integration for regional banks transfers." },
    ],
  },
];

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState("crm");
  const featureData = FEATURES_DEEP.find((f) => f.id === activeTab) || FEATURES_DEEP[0];

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-650 selection:text-white">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 max-w-7xl mx-auto px-6 space-y-20 w-full">
        {/* Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent"
          >
            SaaS Feature Matrix
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none"
          >
            Event Management Engines. Consolidate Workloads.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base text-zinc-400 font-semibold"
          >
            Ditch multiple subscription costs. EventOS integrates CRM, invoicing ledgers, calendars, and secure galleries in a single workspace.
          </motion.p>
        </div>

        {/* Modular Tabs Selector */}
        <div className="flex flex-wrap justify-center gap-2 select-none">
          {FEATURES_DEEP.map((feat) => {
            const Icon = feat.icon;
            const isActive = feat.id === activeTab;
            return (
              <button
                key={feat.id}
                onClick={() => setActiveTab(feat.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                  isActive
                    ? "bg-purple-500/10 text-purple-400 border-purple-500/25 shadow-lg shadow-purple-500/5"
                    : "bg-zinc-950/40 text-zinc-450 hover:text-zinc-200 border-zinc-850 hover:border-zinc-700"
                )}
              >
                <Icon size={13} />
                {feat.title}
              </button>
            );
          })}
        </div>

        {/* Dynamic Detail Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-[#121214]/10 border border-zinc-850 p-8 rounded-3xl"
          >
            <div className="space-y-4">
              <span className="text-[9px] text-purple-450 uppercase font-black tracking-widest block font-mono">Module Specification</span>
              <h3 className="text-xl font-black text-white">{featureData.title}</h3>
              <p className="text-xs text-zinc-300 font-bold leading-relaxed">{featureData.overview}</p>
              <p className="text-xs text-zinc-500 leading-relaxed font-semibold">{featureData.details}</p>
            </div>

            <div className="space-y-4">
              <span className="text-[9px] text-purple-450 uppercase font-black tracking-widest block font-mono">Module FAQ</span>
              <div className="space-y-3">
                {featureData.faqs.map((faq) => (
                  <div key={faq.q} className="p-4 border border-zinc-850 bg-zinc-950/40 rounded-xl space-y-1.5">
                    <h4 className="text-[11px] font-black text-zinc-200 flex items-center gap-1.5">
                      <HelpCircle size={12} className="text-purple-400 shrink-0" />
                      {faq.q}
                    </h4>
                    <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed pl-4.5">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* CTA */}
        <div className="p-12 border border-zinc-800 bg-zinc-955 rounded-3xl text-center space-y-4 select-none">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Experience EventOS platform features live</h3>
          <p className="text-xs text-zinc-400 font-semibold max-w-xl mx-auto leading-relaxed">
            One-click interactive demo access to the client portal and developer marketplace dashboard, no sign-up or credit card authorization required.
          </p>
          <button className="px-6 py-2.5 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition cursor-pointer">
            Explore Interactive Demo
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
