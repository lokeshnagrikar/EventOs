"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Icon } from "@iconify/react";
import { ArrowUpRight, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleCard {
  id: string;
  title: string;
  description: string;
  outcomeBadge: string;
  icon: string;
  color: string;
  bgLight: string;
  borderColor: string;
  borderHover: string;
  visualHighlights: string[];
}

const modules: ModuleCard[] = [
  {
    id: "crm",
    title: "CRM & Lead Pipeline",
    description: "Track enquiries, follow-ups and opportunities without losing leads.",
    outcomeBadge: "Pipeline Growth",
    icon: "solar:users-group-rounded-bold-duotone",
    color: "text-purple-600",
    bgLight: "bg-purple-50",
    borderColor: "border-purple-200/80",
    borderHover: "hover:border-purple-400/80 hover:shadow-purple-500/10",
    visualHighlights: ["Visual Kanban Pipeline", "Auto Lead Attribution", "Zero Missed Follow-ups"],
  },
  {
    id: "quotes",
    title: "Smart Quotes & Proposals",
    description: "Create professional proposals and get faster client approvals.",
    outcomeBadge: "Speed to Close",
    icon: "solar:document-text-bold-duotone",
    color: "text-pink-600",
    bgLight: "bg-pink-50",
    borderColor: "border-pink-200/80",
    borderHover: "hover:border-pink-400/80 hover:shadow-pink-500/10",
    visualHighlights: ["Itemized 18% GST Calculations", "One-Click Digital Signatures", "Instant PDF Proposals"],
  },
  {
    id: "payments",
    title: "Invoices & Payments",
    description: "Track advances, milestones and outstanding payments in one place.",
    outcomeBadge: "Cashflow Control",
    icon: "solar:wallet-money-bold-duotone",
    color: "text-emerald-600",
    bgLight: "bg-emerald-50",
    borderColor: "border-emerald-200/80",
    borderHover: "hover:border-emerald-400/80 hover:shadow-emerald-500/10",
    visualHighlights: ["30% / 40% Milestone Schedules", "Instant UPI QR Collection", "Automated Tax Receipts"],
  },
  {
    id: "timelines",
    title: "Event Timelines & Tasks",
    description: "Keep your team aligned from planning to event day.",
    outcomeBadge: "Zero Cues Missed",
    icon: "solar:calendar-bold-duotone",
    color: "text-cyan-600",
    bgLight: "bg-cyan-50",
    borderColor: "border-cyan-200/80",
    borderHover: "hover:border-cyan-400/80 hover:shadow-cyan-500/10",
    visualHighlights: ["Minute-by-Minute Run of Show", "Vendor WhatsApp Alerts", "Timeline Conflict Engine"],
  },
  {
    id: "gallery",
    title: "Secure Gallery Delivery",
    description: "Give clients a professional place to access their event media.",
    outcomeBadge: "Deliverable Security",
    icon: "solar:gallery-bold-duotone",
    color: "text-amber-600",
    bgLight: "bg-amber-50",
    borderColor: "border-amber-200/80",
    borderHover: "hover:border-amber-400/80 hover:shadow-amber-500/10",
    visualHighlights: ["Cloudinary 4K Media Delivery", "Passcode PIN Security", "Granular Download Rights"],
  },
  {
    id: "portal",
    title: "Client Portal",
    description: "Let clients approve, pay, review timelines and access deliverables.",
    outcomeBadge: "Client Delight",
    icon: "solar:shield-user-bold-duotone",
    color: "text-indigo-600",
    bgLight: "bg-indigo-50",
    borderColor: "border-indigo-200/80",
    borderHover: "hover:border-indigo-400/80 hover:shadow-indigo-500/10",
    visualHighlights: ["Dedicated White-Label Link", "Single-Click Milestone Pay", "Real-Time Updates"],
  },
];

export function Modules() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="modules"
      className="py-24 sm:py-32 bg-[#FAF9F6] border-b border-slate-200/80 relative overflow-hidden font-sans text-left"
    >
      {/* Background Soft Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-100/30 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-16 sm:mb-20"
        >
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200/80 text-purple-700 text-xs font-extrabold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Connected Modules
          </span>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 font-heading text-balance leading-[1.12]">
            Everything Your{" "}
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
              Event Agency Needs.
            </span>
          </h2>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-medium max-w-2xl mx-auto">
            Six integrated modules built to manage operations, cashflow, client approvals, and ground execution without switching between disconnected apps.
          </p>
        </motion.div>

        {/* 6 Consistent Cards Grid (3 Columns on Desktop, 2 Columns on Tablet, 1 Column on Mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {modules.map((mod, idx) => (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              whileHover={shouldReduceMotion ? {} : { y: -5, transition: { duration: 0.2 } }}
              className={cn(
                "group relative rounded-3xl border border-slate-200/90 bg-white p-7 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-default",
                mod.borderHover
              )}
            >
              {/* Subtle top corner gradient accent on hover */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-purple-500/5 to-transparent rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="space-y-5 relative z-10">
                {/* Header Row: Icon & Outcome Pill */}
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "h-13 w-13 rounded-2xl flex items-center justify-center border shadow-xs transition-transform duration-300 group-hover:scale-105",
                      mod.bgLight,
                      mod.borderColor,
                      mod.color
                    )}
                  >
                    <Icon icon={mod.icon} className="text-2xl" />
                  </div>

                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100/90 text-slate-600 border border-slate-200/70 group-hover:bg-purple-50 group-hover:text-purple-700 group-hover:border-purple-200 transition-colors">
                    {mod.outcomeBadge}
                  </span>
                </div>

                {/* Title & Short Description */}
                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-slate-900 font-heading leading-snug group-hover:text-purple-700 transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {mod.description}
                  </p>
                </div>
              </div>

              {/* Visual Highlights Strip (Business Outcomes) */}
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-2 relative z-10">
                {mod.visualHighlights.map((highlight, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>

              {/* Bottom decorative border accent */}
              <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-purple-500/0 to-transparent group-hover:via-purple-500/60 transition-all duration-500" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
