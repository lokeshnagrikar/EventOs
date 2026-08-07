"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Icon } from "@iconify/react";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { SpotlightCard } from "@/components/ui/spotlight-card";

const modules = [
  {
    id: "crm",
    icon: "solar:users-group-rounded-bold-duotone",
    label: "CRM & Lead Pipeline",
    color: "from-purple-500/10 to-purple-500/5",
    borderHover: "rgba(139,92,246,0.4)",
    spotlightColor: "rgba(139,92,246,0.12)",
    iconColor: "#8B5CF6",
    badge: "Acquisition",
    description: "Visual Kanban board. Track leads, budgets, and conversion stages in real time.",
    mini: (
      <div className="mt-4 space-y-2">
        {[
          { label: "Inquiries", count: 8, color: "bg-purple-100 text-purple-900" },
          { label: "Proposal Sent", count: 3, color: "bg-pink-100 text-pink-900" },
          { label: "Booked", count: 5, color: "bg-cyan-100 text-cyan-900" },
        ].map((col) => (
          <div key={col.label} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-extrabold text-slate-700">{col.label}</span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${col.color}`}>{col.count}</span>
          </div>
        ))}
      </div>
    ),
    colSpan: 1 as const,
  },
  {
    id: "quotes",
    icon: "solar:document-text-bold-duotone",
    label: "Smart Quotes & Proposals",
    color: "from-pink-500/10 to-pink-500/5",
    borderHover: "rgba(236,72,153,0.4)",
    spotlightColor: "rgba(236,72,153,0.12)",
    iconColor: "#EC4899",
    badge: "Conversion",
    description: "Line-item digital proposals. Clients sign online, auto-convert to bookings instantly.",
    mini: (
      <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
        <div className="flex justify-between text-[10px]">
          <span className="text-slate-600 font-semibold">Subtotal</span>
          <span className="font-extrabold text-slate-900">₹14,50,000</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-slate-600 font-semibold">GST 18%</span>
          <span className="font-extrabold text-slate-900">₹2,61,000</span>
        </div>
        <div className="h-px bg-slate-200" />
        <div className="flex justify-between text-[10px]">
          <span className="font-extrabold text-slate-900">Total</span>
          <span className="font-extrabold text-pink-600">₹17,11,000</span>
        </div>
        <button className="w-full mt-2 py-1.5 rounded-md bg-gradient-to-r from-pink-600 to-purple-600 text-[10px] font-bold text-white shadow-sm">
          Accept & Sign →
        </button>
      </div>
    ),
    colSpan: 1 as const,
  },
  {
    id: "invoices",
    icon: "solar:wallet-money-bold-duotone",
    label: "Invoices & Payments",
    color: "from-emerald-500/10 to-emerald-500/5",
    borderHover: "rgba(16,185,129,0.4)",
    spotlightColor: "rgba(16,185,129,0.12)",
    iconColor: "#10B981",
    badge: "Finance",
    description: "Generate milestone invoices from accepted quotes. Track UPI, bank transfers, and card deposits.",
    mini: (
      <div className="mt-4 space-y-2">
        {[
          { label: "Deposit (50%)", amount: "₹8,55,000", status: "Paid", statusColor: "text-emerald-700" },
          { label: "Mid-Event (25%)", amount: "₹4,27,500", status: "Pending", statusColor: "text-amber-700" },
          { label: "Final (25%)", amount: "₹4,27,500", status: "Upcoming", statusColor: "text-slate-500" },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[9px] font-bold text-slate-600 block">{row.label}</span>
              <span className="text-xs font-black text-slate-900">{row.amount}</span>
            </div>
            <span className={`text-[10px] font-extrabold ${row.statusColor}`}>{row.status}</span>
          </div>
        ))}
      </div>
    ),
    colSpan: 1 as const,
  },
  {
    id: "timelines",
    icon: "solar:calendar-bold-duotone",
    label: "Event Timelines & Tasks",
    color: "from-cyan-500/10 to-indigo-500/5",
    borderHover: "rgba(6,182,212,0.4)",
    spotlightColor: "rgba(6,182,212,0.12)",
    iconColor: "#06B6D4",
    badge: "Operations",
    description: "Drag-and-drop task boards. Assign vendors, staff, and photographers to event milestones.",
    mini: (
      <div className="mt-4 space-y-2">
        {[
          { time: "09:00", label: "Team Check-in", done: true },
          { time: "11:30", label: "Décor Setup", done: true },
          { time: "14:00", label: "Sound Check", done: false },
          { time: "17:00", label: "Guest Arrival", done: false },
        ].map((item) => (
          <div key={item.time} className="flex items-center gap-2 py-1 px-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-mono text-[9px] font-extrabold text-cyan-700 w-10 shrink-0">{item.time}</span>
            <span className="text-[10px] text-slate-800 font-bold flex-1">{item.label}</span>
            <div className={`h-2.5 w-2.5 rounded-full ${item.done ? "bg-emerald-500" : "bg-slate-300"}`} />
          </div>
        ))}
      </div>
    ),
    colSpan: 2 as const,
  },
  {
    id: "gallery",
    icon: "solar:gallery-bold-duotone",
    label: "Secure Gallery Delivery",
    color: "from-amber-500/10 to-orange-500/5",
    borderHover: "rgba(245,158,11,0.4)",
    spotlightColor: "rgba(245,158,11,0.12)",
    iconColor: "#F59E0B",
    badge: "Media",
    description: "Cloudinary-powered media albums. Passcode protection, expiry links, and granular download controls.",
    mini: (
      <div className="mt-4 grid grid-cols-4 gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="aspect-square rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center"
          >
            <Icon icon="solar:gallery-minimalistic-bold" className="text-amber-700 text-base" />
          </div>
        ))}
        <div className="col-span-4 flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 mt-1">
          <span className="text-[9px] text-slate-600 font-semibold">Expires in 30 days</span>
          <span className="text-[9px] font-bold text-amber-700">Download ZIP →</span>
        </div>
      </div>
    ),
    colSpan: 2 as const,
  },
  {
    id: "portal",
    icon: "solar:shield-user-bold-duotone",
    label: "White-Label Client Portal",
    color: "from-indigo-500/10 to-violet-500/5",
    borderHover: "rgba(99,102,241,0.4)",
    spotlightColor: "rgba(99,102,241,0.12)",
    iconColor: "#6366F1",
    badge: "Collaboration",
    description: "Dedicated client dashboard. Accept quotes, pay invoices, view timelines — no extra login required.",
    mini: (
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-700 font-extrabold">Proposal Status</span>
          <span className="text-[10px] font-bold text-emerald-700">✓ Accepted</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-700 font-extrabold">Outstanding Payment</span>
          <span className="text-[10px] font-bold text-pink-700">₹50,000</span>
        </div>
        <button className="w-full py-1.5 rounded-md bg-gradient-to-r from-indigo-600 to-violet-600 text-[10px] font-bold text-white shadow-sm">
          Pay Now →
        </button>
      </div>
    ),
    colSpan: 1 as const,
  },
];

export function Modules() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      className="py-24 border-b border-[#E5E7EB] bg-[#FFFFFF] relative overflow-hidden"
      id="modules"
    >
      {/* Background glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-purple-100/30 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[250px] bg-indigo-100/30 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-16"
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#7C3AED] uppercase">
            <Icon icon="solar:widget-bold-duotone" className="text-[#7C3AED] text-base" />
            Complete Module Suite
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#111827] font-heading text-balance">
            Six integrated modules.{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#A855F7]">
              One unified workspace.
            </span>
          </h2>
          <p className="text-[#4B5563] text-sm sm:text-base leading-relaxed font-medium">
            Every EventOS module talks to the others. A lead becomes a quote becomes a booking becomes an invoice becomes a gallery — automatically.
          </p>
        </motion.div>

        {/* Bento Grid of Modules */}
        <BentoGrid>
          {modules.map((mod, idx) => (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: shouldReduceMotion ? 0 : idx * 0.07 }}
              className={mod.colSpan === 2 ? "md:col-span-2" : "md:col-span-1"}
            >
              <SpotlightCard
                spotlightColor={mod.spotlightColor}
                borderColor={mod.borderHover}
                className="h-full rounded-2xl border border-slate-200/90 bg-white/70 backdrop-blur-2xl backdrop-saturate-[1.8] p-6 group hover:border-purple-400 hover:bg-white/90 transition-all duration-500 shadow-[0_10px_30px_rgba(124,58,237,0.06),inset_0_1px_1.5px_rgba(255,255,255,0.95)] hover:shadow-[0_16px_40px_rgba(124,58,237,0.15),inset_0_1px_1.5px_rgba(255,255,255,1)] relative overflow-hidden"
              >
                {/* Top specular glass sheen line */}
                <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-purple-300/60 to-transparent pointer-events-none" />
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${mod.iconColor}18`, border: `1px solid ${mod.iconColor}30` }}
                    >
                      <Icon
                        icon={mod.icon}
                        style={{ color: mod.iconColor }}
                        className="text-2xl"
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                        {mod.label}
                      </h3>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: `${mod.iconColor}18`,
                          color: mod.iconColor,
                          border: `1px solid ${mod.iconColor}30`,
                        }}
                      >
                        {mod.badge}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="mt-3 text-slate-600 text-xs leading-relaxed font-medium">{mod.description}</p>

                {/* Mini Preview with smooth group-hover scale transition */}
                <div className="transition-transform duration-500 group-hover:scale-[1.02] origin-bottom">
                  {mod.mini}
                </div>

                {/* Bottom hover bar */}
                <div
                  className="h-0.5 w-0 group-hover:w-full absolute bottom-0 left-0 transition-all duration-500 rounded-b-2xl"
                  style={{ background: `linear-gradient(to right, ${mod.iconColor}, transparent)` }}
                />
              </SpotlightCard>
            </motion.div>
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}
