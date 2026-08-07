"use client";

import React from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { FileText, Code, GitPullRequest, Terminal } from "lucide-react";
import { SpotlightCard } from "@/components/ui/spotlight-card";

export default function DocsPage() {
  const codePayload = `{
  "event": "booking.confirmed",
  "timestamp": "2026-07-05T14:32:00Z",
  "data": {
    "bookingId": "bk_98234",
    "client": {
      "name": "Amit Shah",
      "email": "amit@shah.com"
    },
    "eventDetails": {
      "title": "Grand Wedding Ceremony",
      "location": "Lawn Terraces",
      "budget": 280000
    }
  }
}`;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-600 selection:text-white">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 max-w-7xl mx-auto px-6 space-y-20 w-full">
        {/* Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent"
          >
            Developer Platform API
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none"
          >
            Integrate EventOS with Your Core Stack.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base text-zinc-400 font-semibold"
          >
            Construct custom client portals, trigger webhook payloads on booking confirmations, and manage API keys dynamically.
          </motion.p>
        </div>

        {/* API documentation block */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu */}
          <div className="lg:col-span-1 p-6 border border-zinc-850 bg-zinc-950/20 backdrop-blur rounded-2xl h-fit select-none">
            <h3 className="text-xs font-black uppercase text-zinc-300 mb-4 tracking-wider">Documentation Index</h3>
            <ul className="space-y-3.5 text-xs font-bold text-zinc-500">
              <li className="flex items-center gap-2 text-purple-400">
                <FileText size={12} />
                <span>API Keys & Authentication</span>
              </li>
              <li className="flex items-center gap-2 hover:text-zinc-300 cursor-pointer">
                <Code size={12} />
                <span>Webhook triggers: booking.*</span>
              </li>
              <li className="flex items-center gap-2 hover:text-zinc-300 cursor-pointer">
                <GitPullRequest size={12} />
                <span>REST API: /v1/invoices</span>
              </li>
              <li className="flex items-center gap-2 hover:text-zinc-300 cursor-pointer">
                <Terminal size={12} />
                <span>Platform SDK Parameters</span>
              </li>
            </ul>
          </div>

          {/* Docs Description & Code */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 border border-zinc-855 bg-zinc-950/20 backdrop-blur rounded-2xl space-y-3">
              <h3 className="text-sm font-black text-white">Webhook Payload Schema</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
                EventOS dispatches automated JSON POST payloads to your configured webhook endpoints when events are confirmed, quotes are accepted, or payments are cleared.
              </p>
            </div>

            {/* Code editor mockup */}
            <div className="p-6 bg-zinc-950 border border-zinc-850 rounded-2xl font-mono text-[10.5px] text-purple-300 space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                <span className="text-zinc-555 font-bold uppercase text-[9.5px]">JSON PAYLOAD (booking.confirmed)</span>
                <span className="text-zinc-500 text-[8.5px] font-black uppercase border rounded px-1.5 py-0.2 bg-black/40">POST Endpoint</span>
              </div>
              <pre className="overflow-x-auto leading-relaxed select-all">
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
