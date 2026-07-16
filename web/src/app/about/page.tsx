"use client";

import React from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Award, Compass, Heart, Users } from "lucide-react";
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

        {/* Team Section Placeholder */}
        <div className="p-12 border border-zinc-850 bg-[#121214]/10 rounded-3xl text-center space-y-6 select-none">
          <div className="space-y-2 max-w-xl mx-auto">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Globally Distributed Engineering & Product Team</h3>
            <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
              We are a team of SaaS designers, Postgres developers, AWS architects, and CRM strategists obsessed with delivering high-fidelity performance.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
