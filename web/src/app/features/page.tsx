"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Calendar, Wallet, ImageIcon, HelpCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthModalStore } from "@/store/authModalStore";

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
  const openModal = useAuthModalStore((state) => state.openModal);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-600 selection:text-white">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 max-w-7xl mx-auto px-6 space-y-16 w-full">
        {/* Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-black uppercase tracking-widest text-purple-700 block font-mono"
          >
            SaaS Feature Matrix
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 font-heading leading-tight"
          >
            Event Management Engines. Consolidate Workloads.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base text-slate-600 font-medium"
          >
            Ditch multiple subscription costs. EventOS integrates CRM, invoicing ledgers, calendars, and secure galleries in a single workspace.
          </motion.p>
        </div>

        {/* Modular Tabs Selector */}
        <div className="flex flex-wrap justify-center gap-3 select-none">
          {FEATURES_DEEP.map((feat) => {
            const Icon = feat.icon;
            const isActive = feat.id === activeTab;
            return (
              <button
                key={feat.id}
                onClick={() => setActiveTab(feat.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-extrabold transition-all border cursor-pointer",
                  isActive
                    ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20"
                    : "bg-white text-slate-700 hover:text-slate-900 border-slate-200/80 hover:border-purple-300 shadow-sm"
                )}
              >
                <Icon size={15} />
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
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start bg-white border border-slate-200/90 p-8 sm:p-10 rounded-3xl shadow-sm"
          >
            <div className="space-y-4">
              <span className="text-[10px] text-purple-700 uppercase font-extrabold tracking-widest block font-mono">Module Specification</span>
              <h3 className="text-2xl font-black text-slate-900 font-heading">{featureData.title}</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">{featureData.overview}</p>
              <p className="text-xs text-slate-500 leading-relaxed font-medium pt-2 border-t border-slate-100">{featureData.details}</p>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] text-purple-700 uppercase font-extrabold tracking-widest block font-mono">Module FAQ</span>
              <div className="space-y-3">
                {featureData.faqs.map((faq) => (
                  <div key={faq.q} className="p-5 border border-slate-200/80 bg-slate-50/50 rounded-2xl space-y-1.5">
                    <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2 font-heading">
                      <HelpCircle size={15} className="text-purple-600 shrink-0" />
                      {faq.q}
                    </h4>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed pl-5.5">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* CTA */}
        <div className="p-8 sm:p-12 border border-slate-800 bg-slate-900 text-white rounded-3xl text-center space-y-6 shadow-xl">
          <h3 className="text-xl sm:text-3xl font-black font-heading tracking-tight">Experience EventOS platform features live</h3>
          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl mx-auto leading-relaxed">
            One-click interactive access to your client portal and developer marketplace dashboard, no sign-up or credit card required.
          </p>
          <button
            onClick={() => openModal("register")}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white rounded-full text-xs font-extrabold shadow-lg shadow-purple-500/25 hover:brightness-110 active:scale-95 transition cursor-pointer"
          >
            <span>Start 14-Day Free Trial</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
