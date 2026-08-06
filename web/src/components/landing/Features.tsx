"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Icon } from "@iconify/react";
import { SpotlightCard } from "@/components/ui/spotlight-card";

/* Animated Micro SVG Graphics for Bento Grid Cards */
function FeatureMicroGraphic({ type, color }: { type: string; color: string }) {
  switch (type) {
    case "ai_copilot":
      return (
        <div className="h-16 w-full rounded-xl bg-purple-50 border border-purple-200 p-2 flex items-center justify-between overflow-hidden relative group-hover:border-purple-300 transition">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-600 animate-pulse shadow-[0_0_8px_#9333ea]" />
            <span className="text-[9.5px] font-mono text-purple-900 font-bold">AI_SCHEDULER_RESOLVER</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-purple-700">
            <span className="px-1.5 py-0.5 rounded bg-purple-100 border border-purple-300 font-extrabold text-purple-900">0 CONFLICTS</span>
          </div>
        </div>
      );
    case "white_label":
      return (
        <div className="h-16 w-full rounded-xl bg-pink-50 border border-pink-200 p-2.5 flex flex-col justify-between overflow-hidden relative group-hover:border-pink-300 transition">
          <div className="flex items-center justify-between text-[9px] font-bold text-pink-900">
            <span className="font-mono text-pink-700 font-extrabold">events.yourbrand.com</span>
            <span className="h-1.5 w-1.5 rounded-full bg-pink-600" />
          </div>
          <div className="h-2 w-full bg-pink-200/60 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"
              animate={{ width: ["30%", "90%", "60%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
      );
    case "offline_pwa":
      return (
        <div className="h-16 w-full rounded-xl bg-cyan-50 border border-cyan-200 p-2.5 flex items-center justify-between overflow-hidden relative group-hover:border-cyan-300 transition">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-bold text-[10px]">
              PWA
            </div>
            <span className="text-[9.5px] font-extrabold text-cyan-900">Offline Sync Queue</span>
          </div>
          <span className="text-[8.5px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-900 border border-cyan-300">
            Ready (100%)
          </span>
        </div>
      );
    case "whatsapp_messaging":
      return (
        <div className="h-16 w-full rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 flex flex-col justify-between overflow-hidden relative group-hover:border-emerald-300 transition">
          <div className="flex items-center justify-between text-[9px] text-emerald-900 font-bold">
            <span>📲 Auto Payment Reminder</span>
            <span className="text-[8px] text-emerald-700 font-extrabold">Delivered ✓✓</span>
          </div>
          <p className="text-[9.5px] text-emerald-950 font-bold truncate font-mono">
            "Deposit of ₹50,000 confirmed for Royal Lawn Wedding!"
          </p>
        </div>
      );
    case "quotes_generator":
      return (
        <div className="h-16 w-full rounded-xl bg-indigo-50 border border-indigo-200 p-2.5 flex items-center justify-between overflow-hidden relative group-hover:border-indigo-300 transition">
          <div className="space-y-1">
            <span className="text-[9.5px] font-extrabold text-indigo-900 block">Interactive Quote PDF</span>
            <span className="text-[8.5px] font-mono text-indigo-700 font-bold block">Ref #EOS-92810 • 30s</span>
          </div>
          <span className="px-2 py-1 rounded-lg bg-indigo-600 text-white font-black text-[9px]">
            Signed ✓
          </span>
        </div>
      );
    case "media_gallery":
      return (
        <div className="h-16 w-full rounded-xl bg-amber-50 border border-amber-200 p-2 flex items-center justify-between overflow-hidden relative group-hover:border-amber-300 transition">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 font-bold text-xs">
              📸
            </div>
            <div>
              <span className="text-[9.5px] font-extrabold text-amber-900 block">Client Album (3.2 GB)</span>
              <span className="text-[8.5px] text-amber-700 font-bold block">PIN Protected</span>
            </div>
          </div>
          <span className="text-[8.5px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
            Passcode Active
          </span>
        </div>
      );
    case "lead_scoring":
      return (
        <div className="h-16 w-full rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-center justify-between overflow-hidden relative group-hover:border-rose-300 transition">
          <div className="flex items-center gap-4">
            <div className="text-left">
              <span className="text-[9px] font-extrabold text-rose-900 uppercase block">High-Value Lead Score</span>
              <span className="text-xl font-black text-rose-700 font-mono">98 / 100</span>
            </div>
            <div className="h-8 w-[1px] bg-rose-200" />
            <div className="text-left">
              <span className="text-[9px] font-extrabold text-slate-600 uppercase block">Conversion Probability</span>
              <span className="text-xs font-extrabold text-emerald-700">94.2% Very High</span>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-extrabold text-[10px] shadow-md">
            1-Click Retain
          </span>
        </div>
      );
    default:
      return null;
  }
}

const features = [
  {
    type: "ai_copilot",
    icon: "solar:cpu-bold-duotone",
    title: "AI Co-pilot & Auto Scheduler",
    description:
      "AI algorithm that builds optimal vendor & timeline schedules without overlapping venue slots. Automatically resolves run-of-show sound checks and ingress conflicts.",
    badge: "AI Automation",
    iconColor: "#8B5CF6",
    spotlightColor: "rgba(139,92,246,0.15)",
    borderColor: "rgba(139,92,246,0.35)",
    colSpan: "md:col-span-1",
  },
  {
    type: "white_label",
    icon: "solar:shield-user-bold-duotone",
    title: "White-Label Client Portals",
    description:
      "Custom domains (events.yourbrand.com), custom logos, favicons, and tenant color themes. Give clients an enterprise-branded experience.",
    badge: "Branding",
    iconColor: "#EC4899",
    spotlightColor: "rgba(236,72,153,0.15)",
    borderColor: "rgba(236,72,153,0.35)",
    colSpan: "md:col-span-1",
  },
  {
    type: "offline_pwa",
    icon: "solar:smartphone-bold-duotone",
    title: "Mobile Offline Check-In PWA",
    description:
      "Seamless guest check-in for remote banquet lawns and basement venues with zero internet connectivity. Background sync flushes automatically once reconnected.",
    badge: "Offline PWA",
    iconColor: "#06B6D4",
    spotlightColor: "rgba(6,182,212,0.15)",
    borderColor: "rgba(6,182,212,0.35)",
    colSpan: "md:col-span-1",
  },
  {
    type: "whatsapp_messaging",
    icon: "solar:chat-round-dots-bold-duotone",
    title: "Automated WhatsApp & SMS Triggers",
    description:
      "Send automated updates for RSVP confirmations, invoice payment due dates, milestone clearance reminders, and venue direction links.",
    badge: "Messaging",
    iconColor: "#10B981",
    spotlightColor: "rgba(16,185,129,0.15)",
    borderColor: "rgba(16,185,129,0.35)",
    colSpan: "md:col-span-1",
  },
  {
    type: "quotes_generator",
    icon: "solar:document-text-bold-duotone",
    title: "AI Proposal & Quote Generator",
    description:
      "Generate custom branded web & PDF proposals from client briefs in under 30 seconds with line-item scope breakdowns and digital signature clearing.",
    badge: "Quotes",
    iconColor: "#6366F1",
    spotlightColor: "rgba(99,102,241,0.15)",
    borderColor: "rgba(99,102,241,0.35)",
    colSpan: "md:col-span-1",
  },
  {
    type: "media_gallery",
    icon: "solar:gallery-bold-duotone",
    title: "Gallery & Media Delivery",
    description:
      "Upload high-resolution event media. Deliver secure passcode-protected albums with custom download permissions and expiry links.",
    badge: "Media Delivery",
    iconColor: "#F59E0B",
    spotlightColor: "rgba(245,158,11,0.15)",
    borderColor: "rgba(245,158,11,0.35)",
    colSpan: "md:col-span-1",
  },
  {
    type: "lead_scoring",
    icon: "solar:flame-bold-duotone",
    title: "AI Lead Scoring & Churn Predictor",
    description:
      "Intelligently predicts lead conversion likelihood (0-100), flags high-risk client cancellations before they happen, and triggers 1-click retention workflows.",
    badge: "Predictive Intelligence",
    iconColor: "#F43F5E",
    spotlightColor: "rgba(244,63,94,0.15)",
    borderColor: "rgba(244,63,94,0.35)",
    colSpan: "md:col-span-3",
    wide: true,
  },
];

export function Features() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      className="py-24 border-b border-[#E5E7EB] bg-[#F8F7FF] relative overflow-hidden"
      id="features"
    >
      {/* Background radial gradients */}
      <div className="absolute bottom-0 right-[15%] w-[400px] h-[400px] bg-purple-100/30 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-12 left-[10%] w-[350px] h-[350px] bg-indigo-100/30 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-16"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 uppercase">
            <Icon icon="solar:widget-bold-duotone" className="text-purple-600 text-sm" />
            End-to-End Operating System
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-heading text-balance">
            Everything your agency needs,{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              in one workspace.
            </span>
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
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
                className="h-full group relative rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-6 flex flex-col justify-between gap-4 hover:border-purple-300 hover:bg-white transition-all duration-500 shadow-sm hover:shadow-md"
              >
                {/* Feature Graphic */}
                <FeatureMicroGraphic type={feat.type} color={feat.iconColor} />

                {/* Card Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${feat.iconColor}18`, border: `1px solid ${feat.iconColor}30` }}
                    >
                      <Icon icon={feat.icon} style={{ color: feat.iconColor }} className="text-lg" />
                    </div>
                    <span
                      className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider"
                      style={{ background: `${feat.iconColor}18`, color: feat.iconColor, border: `1px solid ${feat.iconColor}30` }}
                    >
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 leading-snug tracking-tight group-hover:text-purple-700 transition-colors">
                    {feat.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {feat.description}
                  </p>
                </div>

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
