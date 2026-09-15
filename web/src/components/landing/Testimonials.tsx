"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

interface AdvantageItem {
  title: string;
  badge: string;
  description: string;
  icon: string;
  color: string;
  bgLight: string;
  borderColor: string;
}

const advantages: AdvantageItem[] = [
  {
    title: "Milestone Advances & 18% GST Invoicing",
    badge: "Cashflow Control",
    description:
      "Structure 30% booking advances, mid-milestones, and final balances with itemized 18% GST tax receipts. No manual Excel calculations or invoice chasing.",
    icon: "solar:bill-check-bold-duotone",
    color: "text-purple-600",
    bgLight: "bg-purple-50",
    borderColor: "border-purple-200/80",
  },
  {
    title: "Offline-Ready On-Site Execution",
    badge: "Day-of-Event",
    description:
      "Access minute-by-minute run-of-show cues, crew task assignments, and VIP guest lists even in remote farmhouses or basement banquet halls with zero mobile signal.",
    icon: "solar:smartphone-bold-duotone",
    color: "text-indigo-600",
    bgLight: "bg-indigo-50",
    borderColor: "border-indigo-200/80",
  },
  {
    title: "One Professional Client Portal",
    badge: "Client Experience",
    description:
      "Replace lost WhatsApp threads, expiring Google Drive links, and messy email chains with a single branded portal for quote approvals, payment receipts, and photo proofing.",
    icon: "solar:shield-user-bold-duotone",
    color: "text-emerald-600",
    bgLight: "bg-emerald-50",
    borderColor: "border-emerald-200/80",
  },
  {
    title: "Direct Founder Setup & Onboarding",
    badge: "1-on-1 Support",
    description:
      "No impersonal ticket queues. Work directly with our founding team to configure your quotation templates, event timelines, and agency workflows ahead of peak wedding season.",
    icon: "solar:user-hand-up-bold-duotone",
    color: "text-pink-600",
    bgLight: "bg-pink-50",
    borderColor: "border-pink-200/80",
  },
];

export function Testimonials() {
  const shouldReduceMotion = useReducedMotion();
  const router = useRouter();

  return (
    <section
      id="testimonials"
      className="py-24 sm:py-32 border-b border-slate-200/80 bg-[#FAF9F6] relative overflow-hidden text-left font-sans"
    >
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-purple-100/25 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-14 sm:mb-18"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200/80 text-purple-700 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Operational Advantage</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 font-heading text-balance leading-[1.12]">
            Built for Indian{" "}
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
              Event Realities.
            </span>
          </h2>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-medium max-w-2xl mx-auto">
            Why event planners, wedding agencies, and boutique production houses choose EventOS over generic software tools.
          </p>
        </motion.div>

        {/* 4 Concrete Advantage Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {advantages.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              className="p-7 sm:p-8 rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-xl hover:border-purple-300/80 transition-all duration-300 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${item.bgLight} ${item.borderColor} ${item.color} shadow-2xs`}
                  >
                    <Icon icon={item.icon} className="text-2xl" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono bg-slate-100 px-2.5 py-1 rounded-full">
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 font-heading leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  {item.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-purple-700">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>Standard across all EventOS plans</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Reassurance Banner */}
        <div className="mt-12 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs">
            <ShieldCheck size={14} className="text-purple-600" />
            <span>Private Beta Cohort • Direct founder onboarding for Indian wedding & event agencies</span>
          </span>
        </div>
      </div>
    </section>
  );
}
