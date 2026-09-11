"use client";

import React from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Award, Compass, Heart, Users, Instagram, ArrowRight } from "lucide-react";
import { SpotlightCard } from "@/components/ui/spotlight-card";

export default function AboutPage() {
  const values = [
    { name: "SaaS Transparency", desc: "No hidden payment gateway surcharges or platform quotas markups. We deliver clear pricing matrices.", icon: Compass },
    { name: "Client-Centric UX", desc: "Creating self-service portals that make quote signing, scheduling, and invoice clearances zero friction.", icon: Heart },
    { name: "Secure Architecture", desc: "Rigid multi-tenant schema isolation ensuring security compliance standards are met at scale.", icon: Award },
    { name: "Collaborative Roster", desc: "Equipping coordinators,Managers, and photographers with real-time WebSocket synchronization.", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-650 selection:text-white">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 max-w-7xl mx-auto px-6 space-y-20 w-full">
        {/* Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent"
          >
            Our Mission & Story
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none"
          >
            Consolidating Operations. Empowering Agencies.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base text-zinc-400 font-semibold"
          >
            We started EventOS in 2024 to solve a simple problem: event planners and media companies were wasting hours juggling separate software for calendars, invoicing, CRM, and asset proofing.
          </motion.p>
        </div>

        {/* Our values */}
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[10px] text-purple-450 uppercase font-black tracking-widest block font-mono">Corporate guidelines</span>
            <h3 className="text-lg font-black text-white">Our Core Value System</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            {values.map((v, idx) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={v.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex"
                >
                  <SpotlightCard className="p-6 rounded-2xl border border-zinc-850 bg-zinc-950/20 backdrop-blur w-full flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                        <Icon size={14} />
                      </div>
                      <h3 className="text-xs font-black uppercase text-zinc-200">{v.name}</h3>
                      <p className="text-[10.5px] text-zinc-500 leading-relaxed font-semibold">{v.desc}</p>
                    </div>
                  </SpotlightCard>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Founder Spotlight */}
        <div className="p-8 sm:p-12 border border-zinc-800/80 bg-gradient-to-br from-zinc-950/90 via-[#121214] to-purple-950/30 rounded-3xl space-y-6 select-none max-w-4xl mx-auto shadow-2xl hover:border-purple-500/30 transition-all duration-300">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="relative shrink-0 group/photo cursor-pointer">
              <img
                src="/founder-profile/lokesh-nagrikar.png"
                alt="Lokesh Nagrikar - Founder of EventOS"
                className="h-24 w-24 rounded-full object-cover border-2 border-purple-500/50 shadow-xl transition-all duration-300 group-hover/photo:scale-105 group-hover/photo:border-purple-400"
              />
              <span className="absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center" title="Online · Building EventOS">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#121214]" />
              </span>
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-[10px] text-purple-400 uppercase font-black tracking-widest font-mono">
                  Solo Founder & Architect
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Online · Building in Nagpur</span>
                </span>
              </div>
              <h3 className="text-2xl font-black text-white">Lokesh Nagrikar</h3>
              <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                Building EventOS out of Nagpur, Maharashtra, India. Dedicated to replacing the fragile mess of spreadsheets, WhatsApp groups, and late-night proposal drafting for independent event creators and wedding agencies across India.
              </p>
              <div className="pt-3 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <motion.a
                  href="https://www.instagram.com/solo.founder.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white shadow-lg shadow-pink-500/25 overflow-hidden group/insta cursor-pointer transition-all"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] transition-all duration-300 group-hover/insta:opacity-95" />
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/insta:translate-x-full duration-700 transition-transform ease-in-out" />
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Instagram size={14} />
                    <span>@solo.founder.ai on Instagram</span>
                  </span>
                </motion.a>
                <a
                  href="/founder-story"
                  className="inline-flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <span>Read the full story</span>
                  <ArrowRight size={13} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
