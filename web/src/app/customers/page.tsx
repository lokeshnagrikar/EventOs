"use client";

import React from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Users, Quote, CheckCircle, ArrowRight } from "lucide-react";
import { SpotlightCard } from "@/components/ui/spotlight-card";

const CASE_STUDIES = [
  {
    title: "Dream Weddings Studio",
    sector: "Wedding & Portrait Agency",
    result: "+42% Booking Conversion",
    desc: "How a high-end photography collective replaced Dubsado, Pixieset, and QuickBooks with EventOS, leading to faster quotes acceptance and secure media album delivery.",
    quote: "Our clients love the integrated sangeet checklist and proofing portal. Contracts are signed in minutes, and milestone payments clear automatically.",
    author: "Priya Malhotra, Founder",
  },
  {
    title: "TechCorp Summit Planners",
    sector: "Corporate Event Bureau",
    result: "100% Invoices Cleared in 14d",
    desc: "A corporate event agency managing 30 conferences yearly needed strict tenant separation, audit logs, and complex milestone invoicing schedules.",
    quote: "The AWS logically isolated Postgres database schema context gives our legal team complete compliance validation confidence.",
    author: "Amit Sen, Director of Operations",
  },
  {
    title: "Lawn Terraces Production House",
    sector: "Staging & Staging Logistics",
    result: "Zero scheduling conflicts",
    desc: "Managing multiple staging crew coordinators, audio-visual equipment rosters, and florist timings at lawn venues without scheduling clashes.",
    quote: "With real-time WebSockets notifications and calendar overlap indicators, our operations managers allocate staff rosters without error.",
    author: "Rohan Goel, Operations Lead",
  },
];

export default function CustomersPage() {
  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-650 selection:text-white">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 max-w-7xl mx-auto px-6 space-y-24 w-full">
        {/* Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent"
          >
            SaaS Success Metrics
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none"
          >
            Loved by Leading Event Organizations.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base text-zinc-400 font-semibold"
          >
            How agencies scale operation volumes, optimize invoice collections, and secure photographic assets with EventOS.
          </motion.p>
        </div>

        {/* Quantified metrics row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center select-none font-mono">
          {[
            { metric: "₹120M+", label: "Invoices processed securely" },
            { metric: "98.2%", label: "Average Customer CSAT Score" },
            { metric: "14ms", label: "Real-time sync latency" },
          ].map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="p-6 bg-zinc-950/40 border border-zinc-850 rounded-2xl space-y-2"
            >
              <h3 className="text-2xl sm:text-3xl font-black text-white">{item.metric}</h3>
              <p className="text-[10px] text-zinc-555 font-bold uppercase tracking-widest leading-none">{item.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Case Studies grid */}
        <div className="space-y-8">
          <div className="space-y-1">
            <span className="text-[10px] text-purple-450 uppercase font-black tracking-widest block font-mono">Real-world results</span>
            <h3 className="text-lg font-black text-white">Agency Success Stories</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {CASE_STUDIES.map((cs, idx) => (
              <motion.div
                key={cs.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15 }}
                className="flex"
              >
                <SpotlightCard className="p-6 rounded-2xl border border-zinc-850 bg-zinc-950/20 backdrop-blur w-full flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <div className="space-y-1 border-b border-zinc-900 pb-3">
                      <span className="text-[9px] text-purple-400 font-mono font-bold block uppercase">{cs.sector}</span>
                      <h4 className="text-sm font-extrabold text-zinc-200">{cs.title}</h4>
                      <span className="text-xs text-emerald-450 font-black block pt-1 font-mono">{cs.result}</span>
                    </div>
                    <p className="text-[10.5px] text-zinc-500 leading-relaxed font-semibold">{cs.desc}</p>
                    <div className="p-3 bg-zinc-900/60 border border-zinc-850 rounded-xl space-y-2 text-[10.5px] text-zinc-400 font-semibold leading-relaxed relative">
                      <Quote size={12} className="text-purple-450 opacity-40 absolute top-2 right-2" />
                      <p className="italic">"{cs.quote}"</p>
                      <span className="text-[9px] text-zinc-555 font-black block uppercase tracking-wider">— {cs.author}</span>
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="p-12 border border-zinc-800 bg-zinc-950 rounded-3xl text-center space-y-4 select-none">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Become our next success story</h3>
          <p className="text-xs text-zinc-400 font-semibold max-w-xl mx-auto leading-relaxed">
            Get started for free, experience the AWS schema database tenant isolation, and invite your team coords in 30 seconds.
          </p>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition mx-auto cursor-pointer">
            Explore Free Trial <ArrowRight size={12} />
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
