"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Icon } from "@iconify/react";
import { SpotlightCard } from "@/components/ui/spotlight-card";

const features = [
  {
    icon: "solar:users-group-rounded-bold-duotone",
    title: "CRM & Lead Pipeline",
    description:
      "Visual Kanban board tracking prospective clients, budgets, dates, and deal stages. Never let an event lead slip through.",
    badge: "Pipeline",
    iconColor: "#8B5CF6",
    spotlightColor: "rgba(139,92,246,0.15)",
    borderColor: "rgba(139,92,246,0.35)",
    colSpan: "md:col-span-1",
  },
  {
    icon: "solar:document-text-bold-duotone",
    title: "Smart Quotes & Proposals",
    description:
      "Draft professional digital estimates. Send line-item proposals with digital signature acceptance and automatic lead conversion.",
    badge: "Conversion",
    iconColor: "#EC4899",
    spotlightColor: "rgba(236,72,153,0.15)",
    borderColor: "rgba(236,72,153,0.35)",
    colSpan: "md:col-span-1",
  },
  {
    icon: "solar:calendar-bold-duotone",
    title: "Event Timelines & Coordination",
    description:
      "Map out event schedules, manage task assignments, assign photographer/vendor roles, and sync with calendars across your team.",
    badge: "Operations",
    iconColor: "#06B6D4",
    spotlightColor: "rgba(6,182,212,0.15)",
    borderColor: "rgba(6,182,212,0.35)",
    colSpan: "md:col-span-1",
  },
  {
    icon: "solar:wallet-money-bold-duotone",
    title: "Invoices & Payments",
    description:
      "Generate drafts from accepted quotes. Set split payment milestones, log card/bank deposits, and track accounting ledgers with full history.",
    badge: "Billing",
    iconColor: "#10B981",
    spotlightColor: "rgba(16,185,129,0.15)",
    borderColor: "rgba(16,185,129,0.35)",
    colSpan: "md:col-span-2",
    wide: true,
  },
  {
    icon: "solar:shield-user-bold-duotone",
    title: "Secure Client Portal",
    description:
      "Give clients a dedicated, white-label dashboard to accept proposals, pay deposit invoices, and view active timelines. Zero friction.",
    badge: "Collaboration",
    iconColor: "#6366F1",
    spotlightColor: "rgba(99,102,241,0.15)",
    borderColor: "rgba(99,102,241,0.35)",
    colSpan: "md:col-span-1",
  },
  {
    icon: "solar:gallery-bold-duotone",
    title: "Gallery & Media Delivery",
    description:
      "Upload high-resolution event media. Deliver secure passcode-protected albums with custom download permissions and expiry links.",
    badge: "Media Delivery",
    iconColor: "#F59E0B",
    spotlightColor: "rgba(245,158,11,0.15)",
    borderColor: "rgba(245,158,11,0.35)",
    colSpan: "md:col-span-2",
    wide: true,
  },
];

export function Features() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      className="py-24 border-b border-zinc-900 bg-[#09090B] relative overflow-hidden"
      id="features"
    >
      {/* Background radial gradients */}
      <div className="absolute bottom-0 right-[15%] w-[400px] h-[400px] bg-purple-950/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-12 left-[10%] w-[350px] h-[350px] bg-cyan-950/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-16"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 uppercase">
            <Icon icon="solar:widget-bold-duotone" className="text-purple-400 text-sm" />
            End-to-End Operating System
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-heading text-balance">
            Everything your agency needs,{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              in one workspace.
            </span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Stop stitching together 6 different subscriptions. EventOS brings leads, proposals, timelines, invoices, client portals, and secure gallery sharing into a single tenant database.
          </p>
        </motion.div>

        {/* Feature Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((feat, idx) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: shouldReduceMotion ? 0 : idx * 0.07 }}
              className={feat.colSpan}
            >
              <SpotlightCard
                spotlightColor={feat.spotlightColor}
                borderColor={feat.borderColor}
                className="h-full group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md p-6 flex flex-col gap-4 hover:border-white/[0.1] hover:bg-white/[0.04] transition-all duration-300 hover:shadow-2xl"
              >
                {/* Icon + Badge Row */}
                <div className="flex items-center justify-between">
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: `${feat.iconColor}18`,
                      border: `1px solid ${feat.iconColor}30`,
                    }}
                  >
                    <Icon icon={feat.icon} style={{ color: feat.iconColor }} className="text-2xl" />
                  </div>
                  <span
                    className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                    style={{
                      background: `${feat.iconColor}18`,
                      color: feat.iconColor,
                      border: `1px solid ${feat.iconColor}30`,
                    }}
                  >
                    {feat.badge}
                  </span>
                </div>

                {/* Text */}
                <div className="space-y-2 text-left">
                  <h3 className="text-base font-bold text-zinc-100 group-hover:text-white transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-zinc-500 text-xs leading-relaxed">{feat.description}</p>
                </div>

                {/* Wide card extra content */}
                {feat.wide && (
                  <div className="flex items-center gap-3 pt-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex-1 h-1.5 rounded-full"
                        style={{ background: `${feat.iconColor}${i === 1 ? "80" : i === 2 ? "40" : "20"}` }}
                      />
                    ))}
                    <span className="text-[10px] font-bold" style={{ color: feat.iconColor }}>
                      Auto-tracked
                    </span>
                  </div>
                )}

                {/* Hover bottom bar */}
                <div
                  className="h-0.5 w-0 group-hover:w-full absolute bottom-0 left-0 transition-all duration-400 rounded-b-2xl"
                  style={{ background: `linear-gradient(to right, ${feat.iconColor}, transparent)` }}
                />
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
