"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { FileText, Code, GitPullRequest, Terminal, Copy, Check, Sparkles } from "lucide-react";
import { useToastStore } from "@/lib/toastStore";

export default function DocsPage() {
  const addToast = useToastStore((state) => state.addToast);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"keys" | "webhooks" | "invoices" | "sdk">("webhooks");

  const codePayload = `{
  "event": "booking.confirmed",
  "timestamp": "2026-07-05T14:32:00Z",
  "tenantId": "00000000-0000-0000-0000-000000000000",
  "data": {
    "bookingId": "bk_98234",
    "client": {
      "name": "Amit Shah",
      "email": "amit@shah.com",
      "phone": "+91 98765 43210"
    },
    "eventDetails": {
      "title": "Grand Wedding Ceremony",
      "location": "Lawn Terraces, Udaipur",
      "budget": 280000,
      "startDate": "2026-11-20T10:00:00Z"
    },
    "milestones": [
      { "name": "Advance Retainer", "amount": 84000, "status": "PAID" },
      { "name": "Production Advance", "amount": 112000, "status": "PENDING" },
      { "name": "Final Balance", "amount": 84000, "status": "PENDING" }
    ]
  }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(codePayload);
    setCopied(true);
    addToast("Copied webhook payload to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-600 selection:text-white">
      {/* Liquid background glow effects */}
      <div className="absolute top-[8%] left-[12%] w-[450px] h-[450px] bg-purple-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] w-[500px] h-[500px] bg-indigo-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(124,58,237,0.1)_1px,transparent_1px)] [background-size:32px_32px] opacity-25 pointer-events-none" />

      <Navbar />

      <main className="flex-1 pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 space-y-16 w-full relative z-10">
        {/* Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-xs font-bold uppercase tracking-widest text-purple-400"
          >
            <Terminal size={13} className="text-purple-400" />
            Developer Platform API
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight"
          >
            Integrate EventOS with Your Core Stack.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-slate-400 font-medium max-w-2xl mx-auto"
          >
            Construct custom client portals, trigger webhook payloads on booking confirmations, and manage API access credentials dynamically.
          </motion.p>
        </div>

        {/* API documentation block */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Menu */}
          <div className="lg:col-span-1 p-5 border border-white/10 bg-[#101524] rounded-2xl h-fit select-none shadow-lg space-y-4">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Documentation Index</h3>
            <ul className="space-y-2 text-xs font-medium">
              {[
                { id: "keys" as const, label: "API Keys & Authentication", icon: FileText },
                { id: "webhooks" as const, label: "Webhook Triggers: booking.*", icon: Code },
                { id: "invoices" as const, label: "REST API: /v1/invoices", icon: GitPullRequest },
                { id: "sdk" as const, label: "Platform SDK Parameters", icon: Terminal },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <li
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                      activeTab === item.id
                        ? "bg-purple-600/20 text-purple-300 border border-purple-500/30 font-bold"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon size={14} className={activeTab === item.id ? "text-purple-400" : "text-slate-500"} />
                    <span>{item.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Docs Description & Code */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 border border-white/10 bg-[#101524] rounded-2xl space-y-3 shadow-lg">
              <h3 className="text-base font-bold text-white">Webhook Payload Schema (JSON)</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                EventOS dispatches automated JSON POST payloads to your configured webhook endpoints when events are confirmed, quotes are accepted, or payments are cleared.
              </p>
            </div>

            {/* Code editor mockup */}
            <div className="p-6 bg-[#0B0F19] border border-white/10 rounded-2xl font-mono text-xs text-purple-300 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-slate-400 font-bold uppercase text-[11px]">JSON PAYLOAD (booking.confirmed)</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-[#101524] hover:bg-[#171F34] border border-white/10 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check size={12} className="text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy Schema</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="overflow-x-auto leading-relaxed select-all text-[11px] text-slate-300 font-mono">
                {codePayload}
              </pre>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
