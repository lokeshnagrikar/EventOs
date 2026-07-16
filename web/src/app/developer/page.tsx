"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Code2,
  Terminal,
  Activity,
  Key,
  Globe,
  Compass,
  Cpu,
  TrendingUp,
  Clock,
  CheckCircle,
  FileCode,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageShell from "@/components/ui/PageShell";

// Component submodules
import ApiKeyManager from "@/components/developer/ApiKeyManager";
import WebhookManager from "@/components/developer/WebhookManager";
import ApiPlayground from "@/components/developer/ApiPlayground";
import IntegrationMarketplace from "@/components/developer/IntegrationMarketplace";
import PerformanceDashboard from "@/components/developer/PerformanceDashboard";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

// Analytics metrics chart
const MOCK_LATENCY_DATA = [
  { name: "00:00", latency: 120 },
  { name: "04:00", latency: 135 },
  { name: "08:00", latency: 110 },
  { name: "12:00", latency: 154 },
  { name: "16:00", latency: 125 },
  { name: "20:00", latency: 118 },
];

export default function DeveloperPage() {
  const router = useRouter();

  // Top level module tabs
  const [currentModule, setCurrentModule] = useState<"overview" | "keys" | "webhooks" | "playground" | "marketplace" | "performance">("overview");

  return (
    <PageShell
      title="Developer Center & Marketplace"
      subtitle="Manage developer API credentials, inspect webhook triggers retry logs, and discover application connectors."
    >
      <div className="space-y-6 select-none text-zinc-300">
        
        {/* ── TOP LEVEL TAB NAVIGATION ─────────────────────────────────────── */}
        <div className="flex flex-wrap border-b border-zinc-850 text-xs font-black uppercase tracking-wider text-zinc-500">
          {[
            { id: "overview" as const, label: "Overview & Analytics", icon: Activity },
            { id: "keys" as const, label: "API Access Keys", icon: Key },
            { id: "webhooks" as const, label: "Webhooks Logs", icon: Globe },
            { id: "playground" as const, label: "API Playground", icon: Terminal },
            { id: "marketplace" as const, label: "App Marketplace", icon: Compass },
            { id: "performance" as const, label: "Performance & Diagnostics", icon: Cpu },
          ].map((tab) => {
            const active = currentModule === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentModule(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3.5 border-b-2 transition-all cursor-pointer",
                  active
                    ? "border-purple-650 text-purple-400 font-bold"
                    : "border-transparent text-zinc-500 hover:text-zinc-350"
                )}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── TAB 1: OVERVIEW & ANALYTICS ─────────────────────────────────── */}
        {currentModule === "overview" && (
          <div className="space-y-6">
            
            {/* KPI Counter Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-5 border border-zinc-855 bg-zinc-950/20 backdrop-blur-md rounded-2xl">
                <p className="text-2xl font-black text-white">15,280</p>
                <p className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider mt-1">API Requests (24h)</p>
              </div>

              <div className="p-5 border border-zinc-855 bg-zinc-950/20 backdrop-blur-md rounded-2xl">
                <p className="text-2xl font-black text-emerald-450">98.2%</p>
                <p className="text-[10px] text-zinc-555 font-bold uppercase tracking-wider mt-1">Webhook Deliveries</p>
              </div>

              <div className="p-5 border border-zinc-855 bg-zinc-950/20 backdrop-blur-md rounded-2xl">
                <p className="text-2xl font-black text-white">125 ms</p>
                <p className="text-[10px] text-zinc-555 font-bold uppercase tracking-wider mt-1">Average Response Latency</p>
              </div>

              <div className="p-5 border border-zinc-855 bg-zinc-950/20 backdrop-blur-md rounded-2xl">
                <p className="text-2xl font-black text-white">4,200 / 10k</p>
                <p className="text-[10px] text-zinc-555 font-bold uppercase tracking-wider mt-1">Rate Limit Usage</p>
              </div>
            </div>

            {/* Recharts Analytics Latency graph */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 p-6 border border-zinc-850 bg-zinc-950/10 rounded-3xl space-y-4">
                <div>
                  <span className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Metrics Monitoring</span>
                  <h4 className="text-xs font-black uppercase text-zinc-200 mt-0.5">Average API Latency Distribution</h4>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_LATENCY_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.3} />
                      <XAxis dataKey="name" stroke="#52525b" fontSize={9} tickLine={false} />
                      <YAxis stroke="#52525b" fontSize={9} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#000", border: "1px solid #27272a" }} />
                      <Area type="monotone" dataKey="latency" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.06} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Developer SDK center info */}
              <div className="p-6 border border-purple-950/20 bg-purple-950/[0.02] rounded-3xl space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <FileCode size={14} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-zinc-200">Developer SDKs</h4>
                    <p className="text-[8px] text-zinc-555 font-bold uppercase tracking-wider">Official integration modules</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-semibold text-zinc-450 leading-relaxed">
                  <p>Build custom automations using our client SDK libraries. Available packages:</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {["NodeJS", "Python SDK", "Go Client", "PHP Library"].map((sdk) => (
                      <span key={sdk} className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-zinc-900 border border-zinc-850 text-zinc-400">
                        {sdk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ── TAB 2: API KEYS ─────────────────────────────────────────────── */}
        {currentModule === "keys" && (
          <ApiKeyManager />
        )}

        {/* ── TAB 3: WEBHOOKS & LOGS ──────────────────────────────────────── */}
        {currentModule === "webhooks" && (
          <WebhookManager />
        )}

        {/* ── TAB 4: API PLAYGROUND ────────────────────────────────────────── */}
        {currentModule === "playground" && (
          <ApiPlayground />
        )}

        {/* ── TAB 5: APP MARKETPLACE ──────────────────────────────────────── */}
        {currentModule === "marketplace" && (
          <IntegrationMarketplace />
        )}

        {/* ── TAB 6: PERFORMANCE & DIAGNOSTICS ────────────────────────────── */}
        {currentModule === "performance" && (
          <PerformanceDashboard />
        )}

      </div>
    </PageShell>
  );
}
