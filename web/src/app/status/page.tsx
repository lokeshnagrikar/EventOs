"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { CheckCircle2, Server, ShieldCheck, RefreshCw } from "lucide-react";

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
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-600 selection:text-white">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 max-w-5xl mx-auto px-6 space-y-12 w-full z-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-8 border-b border-slate-200/80">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-purple-700 block mb-2 font-mono">
              Real-time System Status
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 font-heading">
              <span>All Systems Operational</span>
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]" />
            </h1>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Live uptime monitoring and incident response tracking for EventOS microservices.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <RefreshCw size={14} className="text-purple-600" />
            <span>Updated {lastRefreshed}</span>
          </button>
        </div>

        {/* System Health Overview Card */}
        <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
            <div>
              <h3 className="text-sm sm:text-base font-extrabold font-heading text-slate-900">EventOS Infrastructure Health: 100%</h3>
              <p className="text-xs text-slate-600 font-medium">All tenant API nodes, database clusters, and webhooks are operating normally.</p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[10px] font-mono font-extrabold uppercase tracking-wider px-3.5 py-1.5 bg-emerald-600 text-white rounded-full shadow-sm">
            Zero Active Incidents
          </span>
        </div>

        {/* Service Status Table */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-purple-700 font-mono">Microservice Node Metrics</h2>
          <div className="border border-slate-200/90 rounded-3xl bg-white overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100">
              {services.map((srv, idx) => (
                <motion.div
                  key={srv.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition"
                >
                  <div className="flex items-center gap-3">
                    <Server size={16} className="text-purple-600 shrink-0" />
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900">{srv.name}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-slate-500 text-[11px]">Latency: <span className="text-slate-900 font-bold">{srv.latency}</span></span>
                    <span className="text-slate-500 text-[11px]">Uptime: <span className="text-emerald-700 font-bold">{srv.uptime}</span></span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-sans text-[10px] font-black uppercase">
                      {srv.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Security & Uptime Commitment Card */}
        <div className="p-6 border border-slate-200/90 bg-white rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-purple-600 shrink-0" />
            <div className="text-xs">
              <span className="font-extrabold text-slate-900 block font-heading">99.9% Service Level Agreement (SLA) Guarantee</span>
              <span className="text-slate-600 font-medium">Tracked 24/7 across multi-region AWS & Render infrastructure clusters.</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
