"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Icon } from "@iconify/react";
import { CheckCircle2, ArrowRight, Sparkles, ChevronRight, Layers, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowStep {
  number: string;
  title: string;
  shortDesc: string;
  icon: string;
  color: string;
  bgLight: string;
  borderColor: string;
  previewTitle: string;
  previewBadge: string;
  previewDetails: { label: string; value: string }[];
  previewNote: string;
}

const steps: WorkflowStep[] = [
  {
    number: "01",
    title: "LEAD",
    shortDesc: "Capture and organize every enquiry.",
    icon: "solar:user-plus-bold-duotone",
    color: "text-purple-600",
    bgLight: "bg-purple-50",
    borderColor: "border-purple-200",
    previewTitle: "Inquiry Pipeline & Lead Capture",
    previewBadge: "New Lead",
    previewDetails: [
      { label: "Client", value: "Pooja & Rohan" },
      { label: "Event Type", value: "Destination Wedding (3 Days)" },
      { label: "Est. Budget", value: "₹35,00,000" },
      { label: "Channel", value: "Website Contact Form" },
    ],
    previewNote: "Auto-synced into pipeline without manual spreadsheet entry.",
  },
  {
    number: "02",
    title: "QUOTE",
    shortDesc: "Create professional quotations and proposals.",
    icon: "solar:document-text-bold-duotone",
    color: "text-pink-600",
    bgLight: "bg-pink-50",
    borderColor: "border-pink-200",
    previewTitle: "Smart Proposal & Line-Item Estimate",
    previewBadge: "Proposal Drafted",
    previewDetails: [
      { label: "Proposal #", value: "QT-2026-088" },
      { label: "Production", value: "Floral Mandap, Rigging, Stage" },
      { label: "Tax Breakup", value: "18% GST Itemized" },
      { label: "Advance Term", value: "30% Upon Digital Approval" },
    ],
    previewNote: "Clients review, sign and accept directly on their phone.",
  },
  {
    number: "03",
    title: "BOOKING",
    shortDesc: "Convert approved quotes into active events.",
    icon: "solar:check-square-bold-duotone",
    color: "text-indigo-600",
    bgLight: "bg-indigo-50",
    borderColor: "border-indigo-200",
    previewTitle: "Contract Lock & Event Onboarding",
    previewBadge: "Booking Confirmed",
    previewDetails: [
      { label: "Event ID", value: "#EVT-ROYAL-928" },
      { label: "Dates Locked", value: "18–20 Oct 2026" },
      { label: "Venue", value: "Taj Palace Banquets, Delhi" },
      { label: "Status", value: "Converted from Quote #088" },
    ],
    previewNote: "Zero re-typing. The signed quote becomes an active project.",
  },
  {
    number: "04",
    title: "PAYMENT",
    shortDesc: "Track advances, milestones and invoices.",
    icon: "solar:wallet-money-bold-duotone",
    color: "text-emerald-600",
    bgLight: "bg-emerald-50",
    borderColor: "border-emerald-200",
    previewTitle: "Milestone Billing & Instant Receipts",
    previewBadge: "Advance Cleared",
    previewDetails: [
      { label: "Deposit Amount", value: "₹10,50,000" },
      { label: "Payment Mode", value: "UPI / Corporate Bank Transfer" },
      { label: "Next Milestone", value: "40% 7 Days Before Sangeet" },
      { label: "GST Receipt", value: "Auto-Generated & Sent" },
    ],
    previewNote: "Clients pay in one click. Invoices reconcile automatically.",
  },
  {
    number: "05",
    title: "PLAN",
    shortDesc: "Create timelines, tasks and coordinate your team.",
    icon: "solar:calendar-bold-duotone",
    color: "text-blue-600",
    bgLight: "bg-blue-50",
    borderColor: "border-blue-200",
    previewTitle: "Run-of-Show & Vendor Assignments",
    previewBadge: "Timeline Active",
    previewDetails: [
      { label: "Stage Ingress", value: "08:00 AM • Floral & Decor Team" },
      { label: "Sound Check", value: "10:15 AM • Line Array Bass Test" },
      { label: "Baraat Gate", value: "03:30 PM • Hospitality Escort" },
      { label: "Conflict Engine", value: "0 Overlaps Guaranteed" },
    ],
    previewNote: "Minute-by-minute cues shared with crew via live link.",
  },
  {
    number: "06",
    title: "EVENT",
    shortDesc: "Manage execution with mobile-friendly workflows.",
    icon: "solar:smartphone-bold-duotone",
    color: "text-amber-600",
    bgLight: "bg-amber-50",
    borderColor: "border-amber-200",
    previewTitle: "Event-Day Ground Coordination",
    previewBadge: "Execution Live",
    previewDetails: [
      { label: "Gate Check-In", value: "Offline PWA QR Scanner" },
      { label: "Guest Count", value: "450 RSVP Verified" },
      { label: "WhatsApp Alert", value: "Directions Sent to VIP Guests" },
      { label: "Crew Status", value: "12 Coordinators Synced" },
    ],
    previewNote: "Works even with zero mobile signal inside banquet halls.",
  },
  {
    number: "07",
    title: "DELIVER",
    shortDesc: "Share galleries and final deliverables through the client portal.",
    icon: "solar:gallery-bold-duotone",
    color: "text-violet-600",
    bgLight: "bg-violet-50",
    borderColor: "border-violet-200",
    previewTitle: "White-Label Client Media Delivery",
    previewBadge: "Reel Published",
    previewDetails: [
      { label: "Client Portal", value: "secure.eventos.in/pooja-rohan" },
      { label: "High-Res Photos", value: "1,450 Edited Assets" },
      { label: "Access Security", value: "Passcode & Expiry Controls" },
      { label: "Client Action", value: "Photo Proofing & Download" },
    ],
    previewNote: "Branded delivery without expiring Google Drive links.",
  },
];

export function Workflow() {
  const shouldReduceMotion = useReducedMotion();
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const currentStep = steps[activeStepIndex];

  return (
    <section
      id="workflow"
      className="py-24 sm:py-32 bg-[#FAF9F6] border-b border-slate-200/80 relative overflow-hidden font-sans text-left"
    >
      {/* Background Soft Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-purple-100/30 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-12 right-1/4 w-[400px] h-[250px] bg-indigo-100/30 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-14 sm:mb-18"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200/80 text-purple-700 text-xs font-extrabold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Connected Workflow
          </span>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 font-heading leading-[1.12] text-balance">
            From First Enquiry to{" "}
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
              Final Delivery.
            </span>
          </h2>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-medium max-w-2xl mx-auto">
            One connected workflow for your entire event.
          </p>

          {/* Standalone Key Callout Statement */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-purple-200/90 shadow-sm text-xs sm:text-sm font-extrabold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>One connected workflow. No duplicate data entry.</span>
            </div>
          </div>
        </motion.div>

        {/* ------------------------------------------------------------- */}
        {/* DESKTOP LAYOUT: Horizontal Connected Sequence (7 Stages)     */}
        {/* ------------------------------------------------------------- */}
        <div className="hidden lg:block space-y-8">
          {/* Horizontal Track */}
          <div className="grid grid-cols-7 gap-3 relative">
            {steps.map((step, idx) => {
              const isActive = activeStepIndex === idx;
              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => setActiveStepIndex(idx)}
                  className={cn(
                    "relative text-left p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between group h-full",
                    isActive
                      ? "bg-white border-purple-500/80 shadow-lg shadow-purple-500/10 -translate-y-1.5"
                      : "bg-white/80 border-slate-200/90 hover:bg-white hover:border-slate-300 shadow-xs hover:-translate-y-0.5"
                  )}
                >
                  {/* Active highlight top strip */}
                  {isActive && (
                    <motion.div
                      layoutId="active-workflow-bar"
                      className="absolute top-0 inset-x-4 h-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
                    />
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-[11px] font-black font-mono tracking-wider transition-colors",
                          isActive ? "text-purple-700 font-bold" : "text-slate-400 group-hover:text-slate-600"
                        )}
                      >
                        {step.number}
                      </span>
                      <div
                        className={cn(
                          "h-8 w-8 rounded-xl flex items-center justify-center border transition-all",
                          step.bgLight,
                          step.borderColor,
                          step.color
                        )}
                      >
                        <Icon icon={step.icon} className="text-base" />
                      </div>
                    </div>

                    <div>
                      <h3
                        className={cn(
                          "text-xs font-black uppercase tracking-wider font-heading transition-colors",
                          isActive ? "text-slate-900" : "text-slate-700 group-hover:text-slate-900"
                        )}
                      >
                        {step.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug font-medium line-clamp-2">
                        {step.shortDesc}
                      </p>
                    </div>
                  </div>

                  {/* Flow Arrow to next node */}
                  {idx < steps.length - 1 && (
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                      <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shadow-xs">
                        <ChevronRight size={12} />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Step Preview Screen */}
          <motion.div
            key={currentStep.number}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-3xl border border-purple-200/90 bg-white p-7 sm:p-8 shadow-md relative overflow-hidden"
          >
            <div className="flex items-center justify-between pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center border", currentStep.bgLight, currentStep.borderColor, currentStep.color)}>
                  <Icon icon={currentStep.icon} className="text-xl" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                      Step {currentStep.number} • {currentStep.title}
                    </span>
                    <span className="text-xs font-bold text-slate-400">→</span>
                    <span className="text-xs font-extrabold text-slate-800">{currentStep.shortDesc}</span>
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900 mt-0.5 font-heading">
                    {currentStep.previewTitle}
                  </h4>
                </div>
              </div>

              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {currentStep.previewBadge}
              </span>
            </div>

            {/* Micro Details Grid */}
            <div className="grid grid-cols-4 gap-4 pt-5">
              {currentStep.previewDetails.map((detail) => (
                <div key={detail.label} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {detail.label}
                  </span>
                  <p className="text-xs font-extrabold text-slate-900 truncate">
                    {detail.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Bottom Benefit Callout */}
            <div className="mt-5 p-3 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center justify-between text-xs">
              <span className="text-purple-900 font-semibold">
                ✓ {currentStep.previewNote}
              </span>
              <div className="flex items-center gap-1 text-[11px] font-bold text-purple-700">
                <span>Next: {steps[(activeStepIndex + 1) % steps.length].title}</span>
                <ArrowRight size={12} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* MOBILE & TABLET LAYOUT: Vertical Connected Timeline (1-7)    */}
        {/* ------------------------------------------------------------- */}
        <div className="lg:hidden relative space-y-6">
          {/* Vertical Connecting Line */}
          <div className="absolute left-[26px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-purple-500 via-indigo-500 to-violet-500 pointer-events-none" />

          {steps.map((step, idx) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: idx * 0.06 }}
              className="relative flex items-start gap-4"
            >
              {/* Timeline Icon Node */}
              <div
                className={cn(
                  "relative z-10 h-13 w-13 rounded-2xl flex items-center justify-center border-2 bg-white shadow-md shrink-0",
                  step.borderColor
                )}
              >
                <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center", step.bgLight, step.color)}>
                  <Icon icon={step.icon} className="text-lg" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-slate-900 text-white text-[9px] font-extrabold flex items-center justify-center font-mono shadow-xs">
                  {step.number}
                </span>
              </div>

              {/* Step Card */}
              <div className="flex-1 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-700 font-heading">
                    {step.title}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    Step {step.number}
                  </span>
                </div>

                <p className="text-sm font-bold text-slate-900 leading-snug">
                  {step.shortDesc}
                </p>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 font-medium">
                  {step.previewNote}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
