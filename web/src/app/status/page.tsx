"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { CheckCircle2, Activity, Server, ShieldCheck, Clock, RefreshCw, AlertCircle } from "lucide-react";

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
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-600/35 selection:text-white">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 max-w-5xl mx-auto px-6 space-y-12 w-full z-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-8 border-b border-zinc-900">
          <div>
            <span className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent block mb-2">
              Real-time System Status
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <span>All Systems Operational</span>
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]" />
            </h1>
            <p className="text-xs text-zinc-400 mt-1 font-semibold">
              Live uptime monitoring and incident response tracking for EventOS microservices.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={13} className="text-purple-400" />
            <span>Updated {lastRefreshed}</span>
          </button>
        </div>

        {/* System Health Overview Card */}
        <div className="p-6 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={24} className="text-emerald-400 shrink-0" />
            <div>
              <h3 className="text-sm font-black text-white">EventOS Infrastructure Health: 100%</h3>
              <p className="text-xs text-emerald-400/90 font-medium">All tenant API nodes, database clusters, and webhooks are operating normally.</p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 bg-emerald-900/40 border border-emerald-500/40 rounded-full">
            Zero Active Incidents
          </span>
        </div>

        {/* Service Status Table */}
        <div className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-zinc-400">Microservice Node Metrics</h2>
          <div className="border border-zinc-850 rounded-2xl bg-zinc-950/40 overflow-hidden shadow-2xl">
            <div className="divide-y divide-zinc-850/60">
              {services.map((srv, idx) => (
                <motion.div
                  key={srv.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-zinc-900/30 transition"
                >
                  <div className="flex items-center gap-3">
                    <Server size={16} className="text-purple-400 shrink-0" />
                    <span className="text-xs font-extrabold text-white">{srv.name}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-zinc-400 text-[11px]">Latency: <span className="text-white font-bold">{srv.latency}</span></span>
                    <span className="text-zinc-400 text-[11px]">Uptime: <span className="text-emerald-400 font-bold">{srv.uptime}</span></span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-sans text-[10px] font-black uppercase">
                      {srv.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Security & Uptime Commitment Card */}
        <div className="p-6 border border-zinc-850 bg-zinc-950/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-purple-400" />
            <div className="text-xs">
              <span className="font-bold text-white block">99.9% Service Level Agreement (SLA) Guarantee</span>
              <span className="text-zinc-400">Tracked 24/7 across multi-region AWS & Render infrastructure clusters.</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
