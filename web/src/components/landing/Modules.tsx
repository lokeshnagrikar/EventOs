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
          { label: "Inquiries", count: 8, color: "bg-purple-500/20 text-purple-400" },
          { label: "Proposal Sent", count: 3, color: "bg-pink-500/20 text-pink-400" },
          { label: "Booked", count: 5, color: "bg-cyan-500/20 text-cyan-400" },
        ].map((col) => (
          <div key={col.label} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.02] border border-white/[0.05] backdrop-blur-xs">
            <span className="text-[10px] font-semibold text-zinc-400">{col.label}</span>
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
      <div className="mt-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] backdrop-blur-xs space-y-2">
        <div className="flex justify-between text-[10px]">
          <span className="text-zinc-500">Subtotal</span>
          <span className="font-bold text-zinc-300">₹14,50,000</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-zinc-500">GST 18%</span>
          <span className="font-bold text-zinc-300">₹2,61,000</span>
        </div>
        <div className="h-px bg-zinc-800" />
        <div className="flex justify-between text-[10px]">
          <span className="font-bold text-white">Total</span>
          <span className="font-extrabold text-pink-400">₹17,11,000</span>
        </div>
        <button className="w-full mt-2 py-1.5 rounded-md bg-gradient-to-r from-pink-600/80 to-purple-600/80 text-[10px] font-bold text-white">
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
          { label: "Deposit (50%)", amount: "₹8,55,000", status: "Paid", statusColor: "text-emerald-400" },
          { label: "Mid-Event (25%)", amount: "₹4,27,500", status: "Pending", statusColor: "text-amber-400" },
          { label: "Final (25%)", amount: "₹4,27,500", status: "Upcoming", statusColor: "text-zinc-500" },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.02] border border-white/[0.05] backdrop-blur-xs">
            <div>
              <span className="text-[9px] font-semibold text-zinc-400 block">{row.label}</span>
              <span className="text-xs font-bold text-white">{row.amount}</span>
            </div>
            <span className={`text-[10px] font-bold ${row.statusColor}`}>{row.status}</span>
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
          <div key={item.time} className="flex items-center gap-2 py-1 px-3 rounded-lg bg-white/[0.02] border border-white/[0.05] backdrop-blur-xs">
            <span className="font-mono text-[9px] font-bold text-cyan-400 w-10 shrink-0">{item.time}</span>
            <span className="text-[10px] text-zinc-300 flex-1">{item.label}</span>
            <div className={`h-2.5 w-2.5 rounded-full ${item.done ? "bg-emerald-500" : "bg-zinc-700"}`} />
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
            className="aspect-square rounded-md bg-gradient-to-tr from-amber-500/10 to-orange-500/10 border border-zinc-800/60 flex items-center justify-center"
          >
            <Icon icon="solar:gallery-minimalistic-bold" className="text-zinc-600 text-base" />
          </div>
        ))}
        <div className="col-span-4 flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] backdrop-blur-xs mt-1">
          <span className="text-[9px] text-zinc-500">Expires in 30 days</span>
          <span className="text-[9px] font-bold text-amber-400">Download ZIP →</span>
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
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] backdrop-blur-xs">
          <span className="text-[10px] text-zinc-400">Proposal Status</span>
          <span className="text-[10px] font-bold text-emerald-400">✓ Accepted</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] backdrop-blur-xs">
          <span className="text-[10px] text-zinc-400">Outstanding Payment</span>
          <span className="text-[10px] font-bold text-pink-400">₹50,000</span>
        </div>
        <button className="w-full py-1.5 rounded-md bg-gradient-to-r from-indigo-600/80 to-violet-600/80 text-[10px] font-bold text-white">
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
      className="py-24 border-b border-zinc-900 bg-zinc-950/30 relative overflow-hidden"
      id="modules"
    >
      {/* Background glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[250px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-16"
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 uppercase">
            <Icon icon="solar:widget-bold-duotone" className="text-purple-400 text-base" />
            Complete Module Suite
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-heading text-balance">
            Six integrated modules.{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]">
              One unified workspace.
            </span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
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
              className={`${mod.colSpan === 2 ? "md:col-span-2" : "md:col-span-1"}`}
            >
              <SpotlightCard
                spotlightColor={mod.spotlightColor}
                borderColor={mod.borderHover}
                className="h-full rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md p-6 group hover:border-white/[0.1] hover:bg-white/[0.04] transition-all duration-300"
              >
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
                      <h3 className="text-sm font-bold text-zinc-100 group-hover:text-white transition-colors">
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
                <p className="mt-3 text-zinc-500 text-xs leading-relaxed">{mod.description}</p>

                {/* Mini Preview */}
                {mod.mini}

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
