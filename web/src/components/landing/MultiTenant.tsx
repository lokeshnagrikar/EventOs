"use client";

import React, { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Icon } from "@iconify/react";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { BorderBeam } from "@/components/ui/border-beam";

export function MultiTenant() {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const securityFeatures = [
    {
      title: "Workspace Isolation",
      desc: "Each tenant operates in a completely isolated container with separate DB schemas, avoiding any data leaks.",
      icon: "solar:database-bold-duotone",
      color: "#8B5CF6",
    },
    {
      title: "Role-Based Access Control",
      desc: "Granular permissions for Planners, Coordinators, Vendors, and Clients. Limit visibility to relevant documents.",
      icon: "solar:shield-keyhole-bold-duotone",
      color: "#06B6D4",
    },
    {
      title: "Team Collaboration",
      desc: "Coordinators and planners share tasks, quotes, and timelines in real-time, syncing status updates instantly.",
      icon: "solar:users-group-two-rounded-bold-duotone",
      color: "#EC4899",
    },
  ];

  return (
    <section
      className="py-24 border-b border-[#E5E7EB] bg-[#F8F7FF] relative overflow-hidden"
      id="multi-tenant"
      ref={containerRef}
    >
      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-100/30 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto space-y-4 mb-20"
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#8B5CF6] uppercase">
            <Icon icon="solar:lock-keyhole-minimalistic-bold-duotone" className="text-sm" />
            Security & Infrastructure
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-heading text-balance">
            Enterprise-Grade{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-cyan-600">
              Multi-Tenancy
            </span>
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
            Engineered to secure tenant environments, protect planner databases, and provide isolated guest spaces for client portal approvals.
          </p>
        </motion.div>

        {/* Visual Diagram + Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
        {/* Left Feature Column */}
        <div className="lg:col-span-5 space-y-6 order-2 lg:order-1">
          {securityFeatures.map((feat, idx) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <SpotlightCard className="p-5 bg-white/80 border border-slate-200/80 shadow-md backdrop-blur-md rounded-xl relative overflow-hidden group hover:border-purple-300">
                <div className="flex gap-4">
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border"
                    style={{
                      borderColor: `${feat.color}25`,
                      background: `${feat.color}10`,
                    }}
                  >
                    <Icon icon={feat.icon} style={{ color: feat.color }} className="text-xl" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-slate-900">{feat.title}</h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">{feat.desc}</p>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>

        {/* Right Diagram Column */}
        <div className="lg:col-span-7 order-1 lg:order-2 flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative w-full max-w-lg aspect-[1.15] bg-[#0d0d0f]/40 border border-white/[0.08] backdrop-blur-2xl rounded-2xl p-6 flex flex-col justify-between overflow-hidden shadow-[0_0_50px_rgba(139,92,246,0.06)]"
          >
            <BorderBeam size={220} duration={12} borderWidth={1.5} />
              
              {/* Header inside mockup */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <span className="text-[10px] text-zinc-500 font-mono">WORKSPACE_ROUTING_ROUTER</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded-full flex items-center gap-1">
                  <span className="h-1 w-1 bg-emerald-500 rounded-full animate-pulse" />
                  MFA Secure
                </span>
              </div>

              {/* Graphical Network */}
              <div className="relative flex-1 flex items-center justify-center my-6">
                
                {/* Central Security Hub */}
                <div className="relative z-20 h-16 w-16 bg-zinc-950 border border-purple-500/40 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                  <Icon icon="solar:shield-bold-duotone" className="text-purple-400 text-3xl" />
                  <span className="absolute -bottom-6 text-[9px] font-bold text-purple-400 tracking-wider font-mono">GATEWAY</span>
                </div>

                {/* Animated Connection Lines (SVG) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 400 240">
                  {/* Left Workspace Link */}
                  <path
                    d="M 60,60 Q 200,60 200,120"
                    fill="none"
                    stroke="rgba(139, 92, 246, 0.15)"
                    strokeWidth="2"
                  />
                  {/* Right Workspace Link */}
                  <path
                    d="M 340,60 Q 200,60 200,120"
                    fill="none"
                    stroke="rgba(6, 182, 212, 0.15)"
                    strokeWidth="2"
                  />
                  {/* Bottom Database Link */}
                  <path
                    d="M 200,210 L 200,120"
                    fill="none"
                    stroke="rgba(236, 72, 153, 0.15)"
                    strokeWidth="2"
                  />

                  {/* Flowing Pulses (only when reduced motion is disabled) */}
                  {!shouldReduceMotion && (
                    <>
                      <path
                        d="M 60,60 Q 200,60 200,120"
                        fill="none"
                        stroke="#8B5CF6"
                        strokeWidth="2"
                        strokeDasharray="10 50"
                        className="animate-[dash_4s_linear_infinite]"
                      />
                      <path
                        d="M 340,60 Q 200,60 200,120"
                        fill="none"
                        stroke="#06B6D4"
                        strokeWidth="2"
                        strokeDasharray="10 50"
                        className="animate-[dash_4s_linear_infinite_reverse]"
                      />
                      <path
                        d="M 200,120 L 200,210"
                        fill="none"
                        stroke="#EC4899"
                        strokeWidth="2"
                        strokeDasharray="10 40"
                        className="animate-[dash_3s_linear_infinite]"
                      />
                    </>
                  )}
                </svg>

                {/* Left Workspace Node */}
                <div className="absolute top-2 left-4 z-20 p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-2 shadow-md">
                  <div className="h-7 w-7 rounded bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                    <Icon icon="solar:notebook-bold-duotone" className="text-purple-400 text-sm" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-extrabold text-zinc-200">Planner Tenant #1</h4>
                    <span className="text-[8px] text-zinc-500 block font-mono">elite.eventos.io</span>
                  </div>
                </div>

                {/* Right Workspace Node */}
                <div className="absolute top-2 right-4 z-20 p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-2 shadow-md">
                  <div className="h-7 w-7 rounded bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                    <Icon icon="solar:window-frame-bold-duotone" className="text-cyan-400 text-sm" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-extrabold text-zinc-200">Planner Tenant #2</h4>
                    <span className="text-[8px] text-zinc-500 block font-mono">stellar.eventos.io</span>
                  </div>
                </div>

                {/* Bottom DB Node */}
                <div className="absolute bottom-1 z-20 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-3 shadow-md">
                  <Icon icon="solar:server-square-bold-duotone" className="text-pink-500 text-lg" />
                  <div>
                    <h4 className="text-[10px] font-extrabold text-zinc-200">Schema-Isolated Databases</h4>
                    <span className="text-[8px] text-zinc-500 block">Encrypted at rest · TLS 1.3</span>
                  </div>
                </div>
              </div>

              {/* Node status indicators */}
              <div className="grid grid-cols-3 gap-2 bg-zinc-950 border border-zinc-900 rounded-lg p-2.5 text-[10px] text-zinc-500">
                <div className="flex items-center gap-1.5 justify-center">
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
                  <span>Tenant A: isolated</span>
                </div>
                <div className="flex items-center gap-1.5 justify-center border-x border-zinc-900">
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
                  <span>Tenant B: isolated</span>
                </div>
                <div className="flex items-center gap-1.5 justify-center">
                  <span className="h-1.5 w-1.5 bg-purple-500 rounded-full" />
                  <span>Active SSO session</span>
                </div>
              </div>
            </motion.div>
          </div>

        </div>

      </div>

      <style jsx global>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -120;
          }
        }
      `}</style>
    </section>
  );
}
