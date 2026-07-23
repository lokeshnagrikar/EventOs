"use client";

import React from "react";
import { Check, X, ShieldAlert } from "lucide-react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

const COMPARISON_ROWS = [
  { feature: "Consolidated Workspace (CRM + Ledger + Gallery)", eventos: "✔ Yes", honeybook: "✕ No", hubspot: "✕ No", clickup: "✕ No", pixieset: "✕ No", quickbooks: "✕ No" },
  { feature: "Schema-Based Multi-Tenant DB Isolation", eventos: "✔ Yes (Private Schema)", honeybook: "✕ Shared DB", hubspot: "✕ Shared DB", clickup: "✕ Shared DB", pixieset: "✕ Shared DB", quickbooks: "✕ Shared DB" },
  { feature: "High-Res proofing galleries CDN integration", eventos: "✔ Yes (AWS S3/CloudFront)", honeybook: "✕ No", hubspot: "✕ No", clickup: "✕ No", pixieset: "✔ Yes", quickbooks: "✕ No" },
  { feature: "Timeline Overlap Scheduling Alerts", eventos: "✔ Yes (WebSocket sync)", honeybook: "✕ No", hubspot: "✕ No", clickup: "✔ Yes (Basic)", pixieset: "✕ No", quickbooks: "✕ No" },
  { feature: "Milestone Proposal contract acceptance", eventos: "✔ Yes (Secure E-Sign)", honeybook: "✔ Yes", hubspot: "✕ No", clickup: "✕ No", pixieset: "✕ No", quickbooks: "✕ No" },
  { feature: "Unified Operational Monthly Cost", eventos: "₹1,999 / mo", honeybook: "₹3,200 / mo", hubspot: "₹7,500 / mo", clickup: "₹1,500 / mo", pixieset: "₹2,500 / mo", quickbooks: "₹2,200 / mo" },
];

export function Competitors() {
  return (
    <section className="py-20 border-b border-zinc-900 bg-[#09090B] relative overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-3"
        >
          <span className="text-xs font-bold tracking-widest text-purple-400 uppercase block font-mono">
            Subscription Consolidator
          </span>
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-heading">
            Ditch fragmented bills. Reclaim control.
          </h3>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Why event Planners and photography studio collectives waste ₹28,000+/mo across disconnected tools, and how EventOS replaces them under a single architecture.
          </p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="border border-white/[0.08] rounded-2xl overflow-x-auto bg-white/[0.01] backdrop-blur-xl"
        >
          <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
            <thead>
              <tr className="border-b border-zinc-850 bg-zinc-950/60 font-black text-zinc-300">
                <th className="p-4 uppercase tracking-wider font-extrabold w-[35%]">Feature Sets</th>
                <th className="p-4 uppercase tracking-wider font-extrabold text-center text-purple-400">EventOS</th>
                <th className="p-4 uppercase tracking-wider font-extrabold text-center">HoneyBook</th>
                <th className="p-4 uppercase tracking-wider font-extrabold text-center">HubSpot</th>
                <th className="p-4 uppercase tracking-wider font-extrabold text-center">ClickUp</th>
                <th className="p-4 uppercase tracking-wider font-extrabold text-center">Pixieset</th>
                <th className="p-4 uppercase tracking-wider font-extrabold text-center">QuickBooks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 font-semibold text-zinc-400">
              {COMPARISON_ROWS.map((row, idx) => (
                <tr key={row.feature} className="hover:bg-zinc-900/10 transition">
                  <td className="p-4 text-zinc-200 font-bold">{row.feature}</td>
                  <td className="p-4 text-center font-black text-purple-400 bg-purple-500/5">{row.eventos}</td>
                  <td className="p-4 text-center font-mono">{row.honeybook}</td>
                  <td className="p-4 text-center font-mono">{row.hubspot}</td>
                  <td className="p-4 text-center font-mono">{row.clickup}</td>
                  <td className="p-4 text-center font-mono">{row.pixieset}</td>
                  <td className="p-4 text-center font-mono">{row.quickbooks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}
