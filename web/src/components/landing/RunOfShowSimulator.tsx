"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  FileText,
  Calendar,
  UserCheck,
  CheckCircle2,
  Sliders,
  ArrowRight,
  ShieldCheck,
  Clock,
  Send,
  Edit3,
  ListTodo,
} from "lucide-react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { useAuthModalStore } from "@/store/authModalStore";

type CapabilityId = "proposal" | "timeline" | "leads";

interface Capability {
  id: CapabilityId;
  title: string;
  shortDesc: string;
  badge: string;
  icon: string;
}

const capabilities: Capability[] = [
  {
    id: "proposal",
    title: "AI Proposal Assistant",
    shortDesc: "Generate professional proposal drafts faster.",
    badge: "Draft & Quotation",
    icon: "solar:document-text-bold-duotone",
  },
  {
    id: "timeline",
    title: "AI Timeline Assistant",
    shortDesc: "Turn event details into structured timelines and tasks.",
    badge: "Operations & Schedule",
    icon: "solar:calendar-bold-duotone",
  },
  {
    id: "leads",
    title: "AI Lead Insights",
    shortDesc: "Identify promising leads and prioritize follow-ups.",
    badge: "CRM & Enquiry",
    icon: "solar:users-group-rounded-bold-duotone",
  },
];

export function RunOfShowSimulator() {
  const shouldReduceMotion = useReducedMotion();
  const openModal = useAuthModalStore((state) => state.openModal);
  const [activeTab, setActiveTab] = useState<CapabilityId>("proposal");

  return (
    <section
      id="ai-assistant"
      className="py-24 sm:py-32 bg-[#FAF9F6] relative overflow-hidden border-b border-slate-200/80 font-sans text-left"
    >
      {/* Subtle ambient glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-purple-100/25 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[250px] bg-indigo-100/20 blur-[120px] rounded-full pointer-events-none" />

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
            <span>Smart Assistance</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 font-heading text-balance leading-[1.12]">
            Let AI Handle{" "}
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
              the Busywork.
            </span>
          </h2>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-medium max-w-2xl mx-auto">
            Use AI to speed up repetitive work while keeping your team in control.
          </p>

          {/* Main Control Pledge */}
          <div className="pt-2">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-2xs">
              <Sliders className="w-3.5 h-3.5 text-purple-600" />
              <span>AI helps you work faster. You stay in control.</span>
            </span>
          </div>
        </motion.div>

        {/* 3 Capabilities Grid Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-5xl mx-auto">
          {capabilities.map((cap) => {
            const isActive = activeTab === cap.id;
            return (
              <button
                key={cap.id}
                onClick={() => setActiveTab(cap.id)}
                className={cn(
                  "p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden group",
                  isActive
                    ? "bg-white border-purple-500/80 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/40"
                    : "bg-white/80 hover:bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs"
                )}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-600 to-indigo-600" />
                )}

                <div className="flex items-center justify-between gap-2 mb-3">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                      isActive
                        ? "bg-purple-600 text-white shadow-xs"
                        : "bg-purple-50 text-purple-600 group-hover:bg-purple-100/70"
                    )}
                  >
                    <Icon icon={cap.icon} className="text-xl" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 font-mono">
                    {cap.badge}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 mb-1">
                  {cap.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {cap.shortDesc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Interactive Assistant Preview Canvas */}
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
            {/* Window Top Bar */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/80 inline-block" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 inline-block" />
                <span className="text-slate-400 font-mono text-[11px] ml-2">
                  EventOS Assistant Workspace
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-purple-300 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Human-in-the-Loop • Final Review Required</span>
              </div>
            </div>

            {/* Dynamic Assistant Previews */}
            <div className="p-6 sm:p-8 min-h-[380px]">
              <AnimatePresence mode="wait">
                {/* 1. AI PROPOSAL ASSISTANT */}
                {activeTab === "proposal" && (
                  <motion.div
                    key="proposal"
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Prompt Brief Box */}
                    <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wide">
                            Enquiry Input
                          </span>
                          <p className="text-xs font-extrabold text-slate-900">
                            3-Day Destination Wedding • 450 Guests • Taj Hotel Delhi
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-purple-800 bg-white px-3 py-1 rounded-full border border-purple-200 shadow-2xs shrink-0">
                        Proposal Draft Ready
                      </span>
                    </div>

                    {/* Generated Structured Draft */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                          Suggested Line Items & Deliverables (Editable)
                        </h4>
                        <span className="text-[11px] text-slate-500 font-semibold">
                          Based on agency pricing templates
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {[
                          {
                            category: "Stage & Decor",
                            title: "Mandap Scenography & Floral Pathways",
                            notes: "Custom fresh florals with Rajasthani canopy",
                          },
                          {
                            category: "Sound & Light",
                            title: "Dual Line Array & Ambience Truss Rigging",
                            notes: "Sound check 3 hours before baraat ingress",
                          },
                          {
                            category: "Hospitality",
                            title: "Airport Escorts & Front Desk PWA Check-In",
                            notes: "Crew coordination for 450 guests",
                          },
                          {
                            category: "Catering Management",
                            title: "Banquet Flow & Live Counter Logistics",
                            notes: "Coordinated with venue chef timeline",
                          },
                        ].map((item, i) => (
                          <div
                            key={i}
                            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-purple-700 uppercase">
                                {item.category}
                              </span>
                              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <p className="font-bold text-slate-900 text-xs">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {item.notes}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Review Controls Footer */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          You review and customize every line item before sending to the client.
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => openModal("register")}
                          className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
                        >
                          Customize & Send
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. AI TIMELINE ASSISTANT */}
                {activeTab === "timeline" && (
                  <motion.div
                    key="timeline"
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Brief Box */}
                    <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide">
                            Timeline Generator
                          </span>
                          <p className="text-xs font-extrabold text-slate-900">
                            Structured Day-of-Event Run-of-Show
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-indigo-800 bg-white px-3 py-1 rounded-full border border-indigo-200 shadow-2xs shrink-0">
                        Zero Schedule Clashes
                      </span>
                    </div>

                    {/* Timeline Run List */}
                    <div className="space-y-2.5 text-xs">
                      {[
                        {
                          time: "08:00 AM",
                          cue: "Floral Mandap Ingress & Stage Scenography",
                          vendor: "Royal Stage Decorators",
                          status: "Assigned",
                        },
                        {
                          time: "10:15 AM",
                          cue: "JBL Line Array Sound Check & Bass Balance",
                          vendor: "BeatSync Audio Staff",
                          status: "Buffer Verified",
                        },
                        {
                          time: "03:30 PM",
                          cue: "Baraat Welcome & PWA Gate QR Check-In",
                          vendor: "Hospitality Lead Team",
                          status: "Assigned",
                        },
                        {
                          time: "07:30 PM",
                          cue: "Sangeet Pyrotechnics & Couple Grand Entry",
                          vendor: "PyroTech Crew",
                          status: "Scheduled",
                        },
                      ].map((slot, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-extrabold text-indigo-700 shrink-0 w-20">
                              {slot.time}
                            </span>
                            <div>
                              <p className="font-bold text-slate-900">{slot.cue}</p>
                              <p className="text-[11px] text-slate-500">{slot.vendor}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shrink-0">
                            {slot.status}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Planner Control Note */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <ListTodo className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>
                          Reorder cues with drag-and-drop or adjust times manually whenever plans change.
                        </span>
                      </div>
                      <button
                        onClick={() => openModal("register")}
                        className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer shrink-0"
                      >
                        Adjust Timeline
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 3. AI LEAD INSIGHTS */}
                {activeTab === "leads" && (
                  <motion.div
                    key="leads"
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Brief Box */}
                    <div className="p-4 rounded-2xl bg-pink-50/60 border border-pink-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-pink-600 text-white flex items-center justify-center shrink-0">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-pink-700 uppercase tracking-wide">
                            Enquiry Intelligence
                          </span>
                          <p className="text-xs font-extrabold text-slate-900">
                            Actionable Follow-Up Prioritization
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-pink-800 bg-white px-3 py-1 rounded-full border border-pink-200 shadow-2xs shrink-0">
                        Prompt Follow-Up Suggested
                      </span>
                    </div>

                    {/* Sample Leads Priority Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            High Intent
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">WhatsApp Enquiry</span>
                        </div>
                        <h5 className="font-extrabold text-slate-900 text-sm">
                          Meera & Rohan • Dec 2026
                        </h5>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Confirmed venue date at Taj Delhi, 450 guests, comprehensive package requested.
                        </p>
                        <div className="pt-2 border-t border-slate-200/70 text-[11px] font-semibold text-purple-700 flex items-center gap-1.5">
                          <Send size={12} />
                          <span>Suggested: Send customized proposal draft</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                            Venue Shortlisting
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">Website Form</span>
                        </div>
                        <h5 className="font-extrabold text-slate-900 text-sm">
                          Kavita & Siddharth • Nov 2026
                        </h5>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Deciding between Udaipur and Jaipur, 300 guests, budget tier shared.
                        </p>
                        <div className="pt-2 border-t border-slate-200/70 text-[11px] font-semibold text-purple-700 flex items-center gap-1.5">
                          <Clock size={12} />
                          <span>Suggested: Share destination venue comparison deck</span>
                        </div>
                      </div>
                    </div>

                    {/* Planner Control Note */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <ShieldCheck className="w-4 h-4 text-pink-600 shrink-0" />
                        <span>
                          No automated outreach is ever sent without your team’s explicit review and trigger.
                        </span>
                      </div>
                      <button
                        onClick={() => openModal("register")}
                        className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer shrink-0"
                      >
                        Review Enquiries
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Section Bottom CTA / Micro-note */}
        <div className="mt-10 text-center">
          <p className="text-xs text-slate-600 font-medium">
            AI features assist your team behind the scenes — keeping your agency's unique touch front and center.
          </p>
        </div>
      </div>
    </section>
  );
}
