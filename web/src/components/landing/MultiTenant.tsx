"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Users,
  Server,
  KeyRound,
  FileCheck,
  CheckCircle2,
} from "lucide-react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

interface SecurityPoint {
  title: string;
  desc: string;
  icon: string;
  badge: string;
}

const securityPoints: SecurityPoint[] = [
  {
    title: "Tenant Data Isolation",
    desc: "Every agency workspace is strictly segregated. Your client contacts, proposals, budgets and margins are never shared or accessible across accounts.",
    icon: "solar:database-bold-duotone",
    badge: "Strict Isolation",
  },
  {
    title: "Role-Based Access Control",
    desc: "Assign tailored permissions for Lead Planners, On-Site Coordinators, Vendors, and Clients. Team members only see what their role requires.",
    icon: "solar:shield-user-bold-duotone",
    badge: "Granular Roles",
  },
  {
    title: "Secure Encrypted Connections",
    desc: "All client portal sessions, quotation approvals, and invoices use modern TLS encryption in transit with secure, tamper-proof authentication.",
    icon: "solar:lock-keyhole-bold-duotone",
    badge: "TLS Encrypted",
  },
  {
    title: "Team & Financial Permissions",
    desc: "Safeguard your commercial margins. Lock vendor payouts, client invoices, and master contracts so only authorized agency directors can view or edit.",
    icon: "solar:document-text-bold-duotone",
    badge: "Financial Privacy",
  },
  {
    title: "Reliable Cloud Infrastructure",
    desc: "Redundant cloud infrastructure with regular backups ensures your run-of-show schedules and guest lists remain accessible on the day of the event.",
    icon: "solar:server-square-bold-duotone",
    badge: "High Availability",
  },
];

export function MultiTenant() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="security"
      className="py-24 sm:py-32 border-b border-slate-200/80 bg-[#FAF9F6] relative overflow-hidden text-left font-sans"
    >
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-purple-100/25 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-14 sm:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200/80 text-purple-700 text-xs font-bold uppercase tracking-widest">
            <ShieldCheck size={14} className="text-purple-600" />
            <span>Data Security & Privacy</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 font-heading text-balance leading-[1.12]">
            Your Agency Data{" "}
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
              Stays Protected.
            </span>
          </h2>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-medium max-w-2xl mx-auto">
            Your quotations, client contracts, payment schedules and vendor agreements contain sensitive commercial details. EventOS is built to keep them completely isolated and secure.
          </p>
        </motion.div>

        {/* Security Feature Cards & Visual Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto">
          {/* Left: 5 Concrete Security Capabilities */}
          <div className="lg:col-span-7 space-y-3.5 flex flex-col justify-between">
            {securityPoints.map((point, idx) => (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-purple-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-200/70 flex items-center justify-center text-purple-700 shrink-0">
                    <Icon icon={point.icon} className="text-xl" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                        {point.title}
                      </h3>
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                        {point.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {point.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right: Security & Isolation Overview Panel */}
          <motion.div
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 rounded-3xl border border-purple-200/90 bg-white p-6 sm:p-8 flex flex-col justify-between shadow-xl shadow-purple-500/5 relative overflow-hidden"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="text-xs font-black uppercase tracking-wider text-purple-700 font-mono">
                  Agency Workspace Guard
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Isolation Active</span>
                </span>
              </div>

              {/* Role Matrix Mockup */}
              <div className="space-y-3 text-xs">
                <h4 className="font-extrabold text-slate-900 text-sm">
                  Role-Based Permission Matrix
                </h4>
                <div className="space-y-2">
                  {[
                    { role: "Agency Director", scope: "Full financial & team access", badge: "All Access", color: "text-purple-700 bg-purple-50 border-purple-200" },
                    { role: "Lead Planner", scope: "Quotes, timelines & client portal", badge: "Management", color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
                    { role: "On-Site Coordinator", scope: "Day-of-event tasks & run-of-show", badge: "Execution", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
                    { role: "Client Account", scope: "Single event view & quote sign-off", badge: "Client Portal", color: "text-amber-700 bg-amber-50 border-amber-200" },
                  ].map((r, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-extrabold text-slate-900 text-xs">{r.role}</p>
                        <p className="text-[11px] text-slate-500">{r.scope}</p>
                      </div>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border", r.color)}>
                        {r.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Safeguards Checklist */}
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-2 text-xs">
                <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wide block">
                  Guaranteed Standards
                </span>
                <div className="space-y-1.5 text-slate-700 font-medium text-[11px]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>Zero data crossover between agencies</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>PIN-protected client media galleries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>Automated daily database backups</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100 mt-4 text-[11px] text-slate-500 font-medium">
              EventOS keeps technical complexities invisible so your team can focus on client hospitality and event execution with total peace of mind.
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
