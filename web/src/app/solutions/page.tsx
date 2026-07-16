"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Calendar, Coins, ImageIcon, ShieldCheck, HelpCircle } from "lucide-react";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { cn } from "@/lib/utils";

const SECTORS = [
  {
    id: "wedding",
    title: "Wedding Agencies",
    icon: Users,
    subtitle: "Deliver unforgettable personal journeys with white-labeled client workspaces.",
    painPoints: "Planners spend 18+ hours per wedding coordindating between vendors, guest RSVPs, and contracts.",
    solution: "EventOS consolidates client onboarding questionnaires, florist checklists, invoice payments, and photo proofing galleries under one client portal.",
    metric: "+42% client conversion rates via interactive sangeet/wedding quotes.",
  },
  {
    id: "corporate",
    title: "Corporate Agencies",
    icon: Calendar,
    subtitle: "Conferences, summits, and shareholder panels managed with rigid audit logs.",
    painPoints: "Corporate organizers struggle with multi-level quote approvals, strict vendor SLA deadlines, and custom billing clearances.",
    solution: "Configure complex vendor checklists, custom role-based staff assignments, tax invoicing ledgers, and secure export spreadsheets.",
    metric: "100% invoice collections achieved 14 days faster.",
  },
  {
    id: "photography",
    title: "Photography Companies",
    icon: ImageIcon,
    subtitle: "Gigabytes of memories curated and delivered in premium proofing galleries.",
    painPoints: "Traditional file sharing platforms lack contract signing, milestone invoicing, and download permissions.",
    solution: "Secure AWS-powered image galleries that restrict high-res downloads until payment invoice clearances are logged.",
    metric: "450k+ media assets delivered securely without upload latency.",
  },
  {
    id: "production",
    title: "Production Houses",
    icon: Coins,
    subtitle: "Roster assignments, stage logistics, and vendor schedules synced in real-time.",
    painPoints: "Coordinator scheduling conflicts and staging equipment roster clashes leading to operational delays.",
    solution: "Real-time calendar timelines with alert centers mapping overlapping resource schedules and photographer rosters.",
    metric: "Zero resource scheduling conflicts in 2025.",
  },
];

export default function SolutionsPage() {
  const [activeSector, setActiveSector] = useState("wedding");
  const sectorData = SECTORS.find((s) => s.id === activeSector) || SECTORS[0];

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
            SaaS Solutions Matrix
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none"
          >
            Tailored Workflows for Every Event Sector.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base text-zinc-400 font-semibold"
          >
            How premium planners, corporate bureaus, studio photographers, and production houses run their operational engines on EventOS.
          </motion.p>
        </div>

        {/* Sector Tabs Selection */}
        <div className="flex flex-wrap justify-center gap-2 select-none">
          {SECTORS.map((sector) => {
            const Icon = sector.icon;
            const isActive = sector.id === activeSector;
            return (
              <button
                key={sector.id}
                onClick={() => setActiveSector(sector.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                  isActive
                    ? "bg-purple-500/10 text-purple-400 border-purple-500/25 shadow-lg shadow-purple-500/5"
                    : "bg-zinc-950/40 text-zinc-450 hover:text-zinc-200 border-zinc-850 hover:border-zinc-700"
                )}
              >
                <Icon size={13} />
                {sector.title}
              </button>
            );
          })}
        </div>

        {/* Dynamic Sector Specification Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSector}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-[#121214]/10 border border-zinc-850 p-8 rounded-3xl"
          >
            <div className="space-y-5">
              <span className="text-[9px] text-purple-450 uppercase font-black tracking-widest block font-mono">INDUSTRY USE CASE</span>
              <h3 className="text-xl font-black text-white">{sectorData.title}</h3>
              <p className="text-xs text-zinc-300 font-bold leading-relaxed">{sectorData.subtitle}</p>

              <div className="space-y-4 pt-3 border-t border-zinc-900 text-xs">
                <div className="space-y-1">
                  <span className="text-red-400/90 uppercase text-[9px] font-black tracking-wider block">Operational Pain Points:</span>
                  <p className="text-zinc-500 leading-relaxed font-semibold">{sectorData.painPoints}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-purple-400 uppercase text-[9px] font-black tracking-wider block">How EventOS Resolves It:</span>
                  <p className="text-zinc-400 leading-relaxed font-semibold">{sectorData.solution}</p>
                </div>
              </div>
            </div>

            {/* Visual KPI / ROI Block */}
            <div className="p-8 bg-zinc-950/40 border border-zinc-850 rounded-2xl flex flex-col justify-center items-center text-center space-y-3 font-mono">
              <span className="text-[8.5px] text-zinc-555 font-black uppercase tracking-widest">Target Business Result</span>
              <h4 className="text-xl sm:text-2xl font-black text-white leading-tight">{sectorData.metric}</h4>
              <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed">
                Aggregated from audits of active corporate organizations operating on EventOS.
              </p>
              <div className="pt-4 w-full border-t border-zinc-900/60 flex justify-around text-[9px] font-bold text-zinc-555">
                <span className="flex items-center gap-1"><ShieldCheck size={11} className="text-purple-400" /> SECURED DATA</span>
                <span>AWS LOG Isolated</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Solutions Comparison FAQ teaser */}
        <div className="p-12 border border-zinc-800 bg-zinc-950 rounded-3xl text-center space-y-4 select-none">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Need a custom migration strategy?</h3>
          <p className="text-xs text-zinc-400 font-semibold max-w-xl mx-auto leading-relaxed">
            Our SaaS migration managers can safely import your legacy CRM clients, calendar items, invoices, and folders from ClickUp, Monday.com, or HubSpot.
          </p>
          <button className="px-6 py-2.5 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition cursor-pointer">
            Explore Migration Wizard
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
