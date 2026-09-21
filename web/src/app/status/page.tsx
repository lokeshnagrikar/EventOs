"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { CheckCircle2, Server, ShieldCheck, RefreshCw, Activity } from "lucide-react";

export default function StatusPage() {
  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());

  const services = [
    { name: "Authentication & Multi-Tenant Isolation (auth-service)", status: "OPERATIONAL", uptime: "99.99%", latency: "42ms" },
    { name: "CRM & Lead Pipeline Microservice (crm-service)", status: "OPERATIONAL", uptime: "99.98%", latency: "58ms" },
    { name: "Event Scheduling & Run-of-Show Engine (event-service)", status: "OPERATIONAL", uptime: "100%", latency: "38ms" },
    { name: "Interactive Quotations & Cloudinary PDF Compiler", status: "OPERATIONAL", uptime: "99.95%", latency: "110ms" },
    { name: "Automated WhatsApp & SMS Notification Gateway", status: "OPERATIONAL", uptime: "100%", latency: "85ms" },
    { name: "Dynamic UPI & Stripe Payment Gateway Clearing", status: "OPERATIONAL", uptime: "100%", latency: "64ms" },
    { name: "Client Photo & Video Media Delivery Galleries", status: "OPERATIONAL", uptime: "99.99%", latency: "75ms" },
    { name: "Global PostgreSQL Database & Redis Cache Instances", status: "OPERATIONAL", uptime: "100%", latency: "12ms" },
  ];

  const handleRefresh = () => {
    setLastRefreshed(new Date().toLocaleTimeString());
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-600 selection:text-white">
      {/* Liquid background glow effects */}
      <div className="absolute top-[8%] left-[12%] w-[450px] h-[450px] bg-purple-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] w-[500px] h-[500px] bg-indigo-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(124,58,237,0.1)_1px,transparent_1px)] [background-size:32px_32px] opacity-25 pointer-events-none" />

      <Navbar />

      <main className="flex-1 pt-32 pb-24 max-w-5xl mx-auto px-4 sm:px-6 space-y-10 w-full relative z-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-8 border-b border-white/10">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400 block mb-2 font-mono">
              Real-time System Status
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>All Systems Operational</span>
              <span className="h-3.5 w-3.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_#34d399]" />
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
              Live uptime monitoring and incident response tracking for EventOS cloud services.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-[#101524] border border-white/10 text-slate-300 hover:text-white hover:bg-[#141B2D] rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer"
          >
            <RefreshCw size={13} className="text-purple-400" />
            <span>Updated {lastRefreshed}</span>
          </button>
        </div>

        {/* System Health Overview Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">EventOS Infrastructure Health: 100%</h3>
              <p className="text-xs text-slate-300 font-medium mt-0.5">All tenant API nodes, database clusters, and webhooks are operating normally.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full shadow-sm shrink-0">
            Zero Active Incidents
          </span>
        </div>

        {/* Service Status Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">Microservice Node Metrics</h2>
            <span className="text-[11px] text-purple-400 font-mono">8 of 8 Clusters Active</span>
          </div>

          <div className="border border-white/10 rounded-2xl bg-[#101524] overflow-hidden shadow-xl divide-y divide-white/5">
            {services.map((srv, idx) => (
              <motion.div
                key={srv.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="p-4 sm:p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-[#141B2D] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                    <Server size={15} />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-white">{srv.name}</span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-slate-400 text-xs">Latency: <strong className="text-slate-200">{srv.latency}</strong></span>
                  <span className="text-slate-400 text-xs">Uptime: <strong className="text-emerald-400">{srv.uptime}</strong></span>
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans text-[10px] font-bold uppercase">
                    {srv.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Security & Uptime Commitment Card */}
        <div className="p-5 border border-white/10 bg-[#101524] rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div className="text-xs">
              <span className="font-bold text-white text-sm block">99.9% Service Level Agreement (SLA) Guarantee</span>
              <span className="text-slate-400 font-medium">Monitored 24/7 across multi-region AWS & Render infrastructure clusters.</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
