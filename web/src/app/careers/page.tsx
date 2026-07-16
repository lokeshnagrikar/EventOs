"use client";

import React from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Briefcase, ArrowRight, Smile, Star } from "lucide-react";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { useToastStore } from "@/lib/toastStore";

const OPEN_ROLES = [
  { id: "r-1", title: "Senior Frontend Engineer (React/Next.js)", dept: "Product & Engineering", loc: "Bengaluru (Hybrid)", desc: "Build premium glassmorphism dashboards, optimize Recharts caching layers, and implement micro-animations." },
  { id: "r-2", title: "Principal Postgres Database Architect", dept: "Product & Engineering", loc: "Remote (Global)", desc: "Design logical multi-tenant schema routing contexts, optimize query compliance metrics, and manage KMS encryption." },
  { id: "r-3", title: "AWS Cloud Operations Specialist", dept: "Infrastructure SLA", loc: "Delaware (On-site)", desc: "Manage S3 Private ACL asset buckets, scale CloudFront CDN routes, and secure auto-scaling group groups." },
];

export default function CareersPage() {
  const addToast = useToastStore((state) => state.addToast);

  const handleApply = (roleTitle: string) => {
    addToast(`Application pipeline initiated for: ${roleTitle}`, "success");
  };

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
            Careers at EventOS
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none"
          >
            Shape the Future of SaaS Operations.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base text-zinc-400 font-semibold"
          >
            Help us construct the ultimate, premium executive operating console that power event organizations globally.
          </motion.p>
        </div>

        {/* Culture section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-zinc-400 select-none">
          <div className="p-6 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-2">
            <h3 className="text-xs font-black text-white flex items-center gap-2">
              <Smile size={13} className="text-purple-400" />
              Engineering Excellence
            </h3>
            <p className="leading-relaxed font-semibold">
              We ship code with outfit-level detail, prioritize microsecond load thresholds, and structure reusable component systems.
            </p>
          </div>
          <div className="p-6 border border-zinc-850 bg-zinc-955/20 rounded-2xl space-y-2">
            <h3 className="text-xs font-black text-white flex items-center gap-2">
              <Star size={13} className="text-purple-400" />
              SLA Compliance obsession
            </h3>
            <p className="leading-relaxed font-semibold">
              From database tenant isolation to zero resource scheduling conflicts, we construct interfaces that enterprise owners trust.
            </p>
          </div>
        </div>

        {/* Open Roles list */}
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] text-purple-450 uppercase font-black tracking-widest block font-mono">Join the crew</span>
            <h3 className="text-lg font-black text-white">Active Open Positions</h3>
          </div>

          <div className="space-y-4">
            {OPEN_ROLES.map((role) => (
              <div
                key={role.id}
                className="p-5 border border-zinc-850 bg-[#121214]/15 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <span className="text-[9px] text-purple-450 uppercase tracking-widest font-black block font-mono">
                    {role.dept} • {role.loc}
                  </span>
                  <h4 className="text-sm font-extrabold text-zinc-200">{role.title}</h4>
                  <p className="text-xs text-zinc-500 font-semibold leading-relaxed max-w-2xl">{role.desc}</p>
                </div>
                <button
                  onClick={() => handleApply(role.title)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition shrink-0 self-start md:self-center cursor-pointer"
                >
                  Apply Now <ArrowRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
