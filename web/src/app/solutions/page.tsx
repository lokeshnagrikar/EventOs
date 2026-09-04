"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Calendar, Coins, ImageIcon, ShieldCheck, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthModalStore } from "@/store/authModalStore";

const SECTORS = [
  {
    id: "wedding",
    title: "Wedding Agencies",
    icon: Users,
    subtitle: "Deliver unforgettable personal journeys with white-labeled client workspaces.",
    painPoints: "Planners spend 18+ hours per wedding coordinating between vendors, guest RSVPs, and contracts.",
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
    metric: "Zero resource scheduling conflicts in 2026.",
  },
];

export default function SolutionsPage() {
  const [activeSector, setActiveSector] = useState("wedding");
  const sectorData = SECTORS.find((s) => s.id === activeSector) || SECTORS[0];
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
            SaaS Solutions Matrix
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 font-heading leading-tight"
          >
            Tailored Workflows for Every Event Sector.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base text-slate-600 font-medium"
          >
            How premium planners, corporate bureaus, studio photographers, and production houses run their operational engines on EventOS.
          </motion.p>
        </div>

        {/* Sector Tabs Selection */}
        <div className="flex flex-wrap justify-center gap-3 select-none">
          {SECTORS.map((sector) => {
            const Icon = sector.icon;
            const isActive = sector.id === activeSector;
            return (
              <button
                key={sector.id}
                onClick={() => setActiveSector(sector.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-extrabold transition-all border cursor-pointer",
                  isActive
                    ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20"
                    : "bg-white text-slate-700 hover:text-slate-900 border-slate-200/80 hover:border-purple-300 shadow-sm"
                )}
              >
                <Icon size={15} />
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
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white border border-slate-200/90 p-8 sm:p-10 rounded-3xl shadow-sm"
          >
            <div className="space-y-5">
              <span className="text-[10px] text-purple-700 uppercase font-extrabold tracking-widest block font-mono">INDUSTRY USE CASE</span>
              <h3 className="text-2xl font-black text-slate-900 font-heading">{sectorData.title}</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">{sectorData.subtitle}</p>

              <div className="space-y-4 pt-4 border-t border-slate-100 text-xs sm:text-sm">
                <div className="space-y-1">
                  <span className="text-pink-600 uppercase text-[10px] font-black tracking-wider block font-mono">Operational Pain Points:</span>
                  <p className="text-slate-600 leading-relaxed font-medium">{sectorData.painPoints}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-purple-700 uppercase text-[10px] font-black tracking-wider block font-mono">How EventOS Resolves It:</span>
                  <p className="text-slate-700 leading-relaxed font-medium">{sectorData.solution}</p>
                </div>
              </div>
            </div>

            {/* Visual KPI / ROI Block */}
            <div className="p-8 bg-purple-50/60 border border-purple-100 rounded-2xl flex flex-col justify-center items-center text-center space-y-4">
              <span className="text-[10px] text-purple-700 font-extrabold uppercase tracking-widest font-mono">Target Business Result</span>
              <h4 className="text-xl sm:text-2xl font-black text-slate-900 font-heading leading-tight">{sectorData.metric}</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Aggregated from audits of active agency accounts operating on EventOS.
              </p>
              <div className="pt-4 w-full border-t border-purple-200/60 flex justify-around text-[11px] font-extrabold text-slate-700">
                <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-purple-600" /> SECURED DATA</span>
                <span>Tenant Isolated</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Custom Migration Callout */}
        <div className="p-8 sm:p-12 border border-slate-800 bg-slate-900 text-white rounded-3xl text-center space-y-4 shadow-xl">
          <h3 className="text-xl sm:text-2xl font-black font-heading tracking-tight">Need a custom migration strategy?</h3>
          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl mx-auto leading-relaxed">
            Our SaaS migration managers can safely import your legacy CRM clients, calendar items, invoices, and folders from ClickUp, Monday.com, or HubSpot.
          </p>
          <button
            onClick={() => openModal("register")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white rounded-full text-xs font-extrabold hover:brightness-110 active:scale-95 transition cursor-pointer shadow-lg shadow-purple-500/20"
          >
            <span>Start Free Trial — No Credit Card</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
