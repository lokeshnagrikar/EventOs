"use client";

import React from "react";
import { Layers, WifiOff, Zap, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export function Competitors() {
  const points = [
    {
      icon: Layers,
      title: "Single Workspace — Zero Tool Switching",
      description:
        "Stop paying for 4-6 disconnected tools. EventOS combines your CRM, itemized PDF quotes, run-of-show timelines, and photo delivery galleries under one unified dashboard.",
      badge: "All-in-One Engine",
      color: "from-purple-500/10 to-indigo-500/10",
      borderColor: "border-purple-200/80 hover:border-purple-300",
      iconBg: "bg-purple-50 text-purple-600 border-purple-200/80",
    },
    {
      icon: WifiOff,
      title: "Offline Mobile Check-In for Remote Venues",
      description:
        "Banquet lawns, resort gardens, and basement venues often have weak signal. Our PWA allows guest check-in without internet, auto-syncing when back online.",
      badge: "Built for Real Venues",
      color: "from-cyan-500/10 to-blue-500/10",
      borderColor: "border-cyan-200/80 hover:border-cyan-300",
      iconBg: "bg-cyan-50 text-cyan-600 border-cyan-200/80",
    },
    {
      icon: Zap,
      title: "From Lead to Deposit Payment in 1 System",
      description:
        "Convert WhatsApp inquiries into signed PDF proposals in 45 seconds, collect 0% fee UPI QR deposits, and track invoice milestones without leaving the platform.",
      badge: "End-to-End Workflow",
      color: "from-pink-500/10 to-purple-500/10",
      borderColor: "border-pink-200/80 hover:border-pink-300",
      iconBg: "bg-pink-50 text-pink-600 border-pink-200/80",
    },
  ];

  return (
    <section className="py-20 border-b border-slate-200/80 bg-[#F8F7FF] relative overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-3"
        >
          <span className="text-xs font-black uppercase tracking-widest text-purple-700 block font-mono">
            Architectural Advantage
          </span>
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-heading">
            Why EventOS Wins for Event & Wedding Agencies
          </h3>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
            Designed specifically for high-volume event creators who need speed, mobile reliability, and complete operational control.
          </p>
        </motion.div>

        {/* 3-Point Value Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {points.map((pt, idx) => {
            const IconComponent = pt.icon;
            return (
              <motion.div
                key={pt.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`p-7 rounded-2xl border ${pt.borderColor} bg-white/95 backdrop-blur-md shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-5 group`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${pt.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                      <IconComponent size={22} />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {pt.badge}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-base sm:text-lg font-extrabold text-slate-900 font-heading flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      {pt.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                      {pt.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
