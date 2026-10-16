"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  ExternalLink,
  Copy,
  Check,
  Zap,
  ArrowUpRight,
  Layers,
  Sparkles,
  BookOpen,
  Send,
  AlertCircle,
  Radio,
  FileCheck2,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import PageShell from "@/components/ui/PageShell";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/lib/toastStore";

// Component submodules
import ApiKeyManager from "@/components/developer/ApiKeyManager";
import WebhookManager from "@/components/developer/WebhookManager";
import ApiPlayground from "@/components/developer/ApiPlayground";
import IntegrationMarketplace from "@/components/developer/IntegrationMarketplace";
import PerformanceDashboard from "@/components/developer/PerformanceDashboard";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type DevModuleTab = "overview" | "keys" | "webhooks" | "playground" | "marketplace" | "performance";

const CODE_EXAMPLES: Record<string, { lang: string; code: string }> = {
  curl: {
    lang: "bash",
    code: `curl -X POST https://api.eventosapp.in/v1/events \\
  -H "Authorization: Bearer ev_live_98a72f0c1e84" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Royal Udaipur Wedding",
    "eventType": "WEDDING",
    "budget": 2500000,
    "guestCount": 450
  }'`,
  },
  typescript: {
    lang: "typescript",
    code: `import { EventOsClient } from "@eventos/sdk";

const client = new EventOsClient({
  apiKey: process.env.EVENTOS_API_KEY!,
  environment: "production"
});

const event = await client.events.create({
  name: "Royal Udaipur Wedding",
  eventType: "WEDDING",
  budget: 2500000,
  guestCount: 450,
});

console.log("Created Event ID:", event.id);`,
  },
  python: {
    lang: "python",
    code: `from eventos import EventOs

client = EventOs(api_key="ev_live_98a72f0c1e84")

event = client.events.create(
    name="Royal Udaipur Wedding",
    event_type="WEDDING",
    budget=2500000,
    guest_count=450
)

print(f"Event Provisioned: {event.id}")`,
  },
  go: {
    lang: "go",
    code: `package main

import (
    "context"
    "fmt"
    "github.com/eventos/eventos-go"
)

func main() {
    client := eventos.NewClient("ev_live_98a72f0c1e84")
    
    event, err := client.Events.Create(context.Background(), &eventos.CreateEventParams{
        Name:       "Royal Udaipur Wedding",
        EventType:  "WEDDING",
        Budget:     2500000,
        GuestCount: 450,
    })
    if err != nil {
        panic(err)
    }
    fmt.Printf("Event ID: %s\\n", event.ID)
}`,
  },
};

const LIVE_STREAM_EVENTS = [
  { method: "POST", path: "/v1/events/bookings", status: 201, latency: 142, time: "2s ago" },
  { method: "GET", path: "/v1/crm/quotes/client", status: 200, latency: 84, time: "9s ago" },
  { method: "POST", path: "/v1/payment-engine/calculate-fee", status: 200, latency: 45, time: "18s ago" },
  { method: "GET", path: "/v1/gallery/albums", status: 200, latency: 96, time: "27s ago" },
  { method: "POST", path: "/v1/webhooks/deliver", status: 200, latency: 110, time: "42s ago" },
];

export default function DeveloperPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [currentModule, setCurrentModule] = useState<DevModuleTab>("overview");
  const [selectedSnippetLang, setSelectedSnippetLang] = useState<string>("curl");
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedBaseUrl, setCopiedBaseUrl] = useState(false);
  const [metricChartType, setMetricChartType] = useState<"latency" | "throughput">("latency");

  const [latencyData, setLatencyData] = useState<Array<{ name: string; latency: number; requests: number }>>([]);

  const isPlatformUser = Boolean(
    user?.role &&
    [
      "SUPER_ADMIN",
      "PLATFORM_SUPER_ADMIN",
      "SUPERADMIN",
      "DEVOPS_ENGINEER",
      "DEVOPS",
      "DEVELOPER",
      "OPERATIONS_LEAD",
      "OPERATIONS",
    ].includes(user.role.replace(/^ROLE_/, "").toUpperCase())
  );

  useEffect(() => {
    const now = new Date();
    const samples = [];
    for (let i = 7; i >= 0; i--) {
      const h = new Date(now.getTime() - i * 3 * 3600 * 1000);
      const timeStr = `${String(h.getHours()).padStart(2, "0")}:00`;
      const lat = Math.floor(42 + Math.abs(Math.sin(i * 1.3)) * 28);
      const reqs = Math.floor(1800 + Math.abs(Math.cos(i * 1.1)) * 950);
      samples.push({ name: timeStr, latency: lat, requests: reqs });
    }
    setLatencyData(samples);
  }, []);

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    addToast("Code snippet copied to clipboard!", "success");
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleCopyBaseUrl = () => {
    navigator.clipboard.writeText("https://api.eventosapp.in/v1");
    setCopiedBaseUrl(true);
    addToast("Base API URL copied!", "success");
    setTimeout(() => setCopiedBaseUrl(false), 2000);
  };

  return (
    <PageShell
      title="Developer Center & Gateway"
      subtitle="Enterprise REST API credentials, webhook dispatch telemetry, and interactive developer sandboxes."
      actions={
        <div className="flex items-center gap-2">
          {isPlatformUser && (
            <Link
              href="/superadmin"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 dark:text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all shadow-sm shadow-purple-500/10 cursor-pointer"
            >
              <Shield size={13} />
              <span>SuperAdmin Telemetry</span>
              <ExternalLink size={12} className="opacity-70" />
            </Link>
          )}
          <button
            onClick={handleCopyBaseUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-mono font-bold transition cursor-pointer"
            title="Copy API Base URL"
          >
            {copiedBaseUrl ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            <span>api.eventosapp.in/v1</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6 select-none text-slate-800 dark:text-zinc-200">

        {/* ── LIVE HERO STATUS BANNER ────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.07] bg-gradient-to-r from-purple-500/[0.05] via-indigo-500/[0.03] to-transparent dark:from-purple-950/20 dark:via-zinc-900/40 dark:to-zinc-950/40 backdrop-blur-xl shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Gateway v1.4 Live
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                  Region: <strong className="text-slate-800 dark:text-zinc-200">asia-south1 (Mumbai)</strong>
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                EventOS Developer Hub & Core Gateways
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
                Connect external CRMs, wedding planning portals, and automated messaging queues with sub-50ms API routing, webhook dispatching, and cryptographic key auth.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setCurrentModule("playground")}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition cursor-pointer"
              >
                <Terminal size={14} />
                <span>Launch Playground</span>
              </button>
              <button
                onClick={() => setCurrentModule("keys")}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Key size={14} />
                <span>Manage Keys</span>
              </button>
            </div>
          </div>

          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* ── TOP LEVEL TAB NAVIGATION ─────────────────────────────────────── */}
        <div className="flex overflow-x-auto scrollbar-none border-b border-slate-200 dark:border-zinc-800 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 touch-pan-x gap-1">
          {[
            { id: "overview" as const, label: "Overview & Telemetry", icon: Activity },
            { id: "keys" as const, label: "API Keys", icon: Key },
            { id: "webhooks" as const, label: "Webhooks Dispatcher", icon: Globe },
            { id: "playground" as const, label: "API Playground", icon: Terminal },
            { id: "marketplace" as const, label: "App Marketplace", icon: Compass },
            { id: "performance" as const, label: "Diagnostics & Health", icon: Cpu },
          ].map((tab) => {
            const active = currentModule === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentModule(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 sm:px-5 py-3 border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap",
                  active
                    ? "border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-300 font-extrabold"
                    : "border-transparent hover:text-slate-900 dark:hover:text-zinc-200 hover:border-slate-300 dark:hover:border-zinc-700"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="dev-tab-active-indicator"
                    className="absolute inset-0 bg-purple-500/[0.04] rounded-t-xl"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <Icon size={14} className={active ? "text-purple-600 dark:text-purple-400" : "text-slate-400 dark:text-zinc-500"} />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── TAB 1: OVERVIEW & ANALYTICS ─────────────────────────────────── */}
        {currentModule === "overview" && (
          <div className="space-y-6">
            
            {/* 4 Premium Glass KPI Counter Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 border border-slate-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-sm hover:border-purple-500/30 transition duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-black uppercase tracking-wider font-mono">Requests (24h)</span>
                  <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">+14.2%</span>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">15,280</p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                  <span>Throughput peak:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">42 req/sec</span>
                </div>
              </div>

              <div className="p-5 border border-slate-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-sm hover:border-purple-500/30 transition duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-black uppercase tracking-wider font-mono">Webhook Delivery</span>
                  <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">Healthy</span>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2 font-mono">99.4%</p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                  <span>Failed retry attempts:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">3 (Auto-queued)</span>
                </div>
              </div>

              <div className="p-5 border border-slate-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-sm hover:border-purple-500/30 transition duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-black uppercase tracking-wider font-mono">Average Latency</span>
                  <span className="text-[9px] font-black uppercase text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full font-mono">p95: 110ms</span>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">48 ms</p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                  <span>Edge routing cache:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">Redis L1 HIT</span>
                </div>
              </div>

              <div className="p-5 border border-slate-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-sm hover:border-purple-500/30 transition duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-black uppercase tracking-wider font-mono">Rate Limit Ceiling</span>
                  <span className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] px-2 py-0.5 rounded-full font-mono">Tier: Scale</span>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">4.2k / 10k</p>
                <div className="mt-3 w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-purple-600 dark:bg-purple-500 h-1.5 rounded-full" style={{ width: "42%" }} />
                </div>
              </div>
            </div>

            {/* Split Grid: Metrics Graph + Interactive SDK Quickstart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Telemetry Chart */}
              <div className="lg:col-span-7 p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl rounded-3xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider font-mono">Telemetry Observability</span>
                    <h4 className="text-xs sm:text-sm font-extrabold uppercase text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                      <Activity size={14} className="text-purple-600 dark:text-purple-400" />
                      API Gateway Latency & Throughput Profile
                    </h4>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl text-[10px] font-bold">
                    <button
                      onClick={() => setMetricChartType("latency")}
                      className={cn(
                        "px-2.5 py-1 rounded-lg transition",
                        metricChartType === "latency" ? "bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-300 shadow-sm" : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      Latency (ms)
                    </button>
                    <button
                      onClick={() => setMetricChartType("throughput")}
                      className={cn(
                        "px-2.5 py-1 rounded-lg transition",
                        metricChartType === "throughput" ? "bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-300 shadow-sm" : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      Requests / min
                    </button>
                  </div>
                </div>

                <div className="h-56 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={latencyData}>
                      <defs>
                        <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#09090b",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#fff",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey={metricChartType === "latency" ? "latency" : "requests"}
                        stroke="#8b5cf6"
                        strokeWidth={2.5}
                        fill="url(#latencyGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Interactive SDK Quickstart */}
              <div className="lg:col-span-5 p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl rounded-3xl flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                        <FileCode size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white">API Quickstart</h4>
                        <p className="text-[9px] text-slate-500 dark:text-zinc-400 font-mono font-bold uppercase">SDKs & Client Libraries</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyCode(CODE_EXAMPLES[selectedSnippetLang].code)}
                      className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.05] transition cursor-pointer"
                    >
                      {copiedSnippet ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      <span>{copiedSnippet ? "Copied" : "Copy"}</span>
                    </button>
                  </div>

                  {/* Language Selector Tabs */}
                  <div className="flex gap-1 border-b border-slate-200 dark:border-zinc-800 pb-2">
                    {Object.keys(CODE_EXAMPLES).map((langKey) => (
                      <button
                        key={langKey}
                        onClick={() => setSelectedSnippetLang(langKey)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase font-mono transition cursor-pointer",
                          selectedSnippetLang === langKey
                            ? "bg-purple-600 text-white shadow-sm"
                            : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                        )}
                      >
                        {langKey}
                      </button>
                    ))}
                  </div>

                  {/* Code Block Container */}
                  <div className="p-3.5 bg-slate-950 text-purple-300 rounded-2xl font-mono text-[11px] overflow-x-auto border border-white/[0.08] leading-relaxed max-h-56 scrollbar-thin">
                    <pre>
                      <code>{CODE_EXAMPLES[selectedSnippetLang].code}</code>
                    </pre>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 pt-2 border-t border-slate-200 dark:border-zinc-800">
                  <span className="flex items-center gap-1 font-mono">
                    <CheckCircle size={12} className="text-emerald-500" /> Bearer Token Auth
                  </span>
                  <a
                    href="https://eventosapp.in/docs"
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-600 dark:text-purple-400 hover:underline font-bold flex items-center gap-1"
                  >
                    <span>Full API Reference</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>

            </div>

            {/* Split Grid: Live Stream Terminal + Developer Resources Bento */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Live API Stream Terminal */}
              <div className="lg:col-span-7 p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.06] bg-slate-950 text-white rounded-3xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase ml-2 flex items-center gap-1.5">
                      <Terminal size={12} className="text-purple-400" />
                      Live Request Stream (WebSocket Telemetry)
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                    Listening
                  </span>
                </div>

                <div className="space-y-2 font-mono text-[11px] divide-y divide-zinc-900">
                  {LIVE_STREAM_EVENTS.map((item, idx) => (
                    <div key={idx} className="pt-2 flex items-center justify-between gap-3 text-zinc-300">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-black shrink-0",
                          item.method === "POST" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        )}>
                          {item.method}
                        </span>
                        <span className="truncate text-zinc-200">{item.path}</span>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0 text-[10px]">
                        <span className="text-emerald-400 font-bold">{item.status} OK</span>
                        <span className="text-zinc-500">{item.latency}ms</span>
                        <span className="text-zinc-600 hidden sm:inline">{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Developer Resources Bento */}
              <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div
                  onClick={() => setCurrentModule("playground")}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl hover:border-purple-500/40 transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <Terminal size={18} className="text-purple-600 dark:text-purple-400" />
                    <h5 className="text-xs font-black uppercase text-slate-900 dark:text-white mt-2">Interactive Sandbox</h5>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                      Test payloads, inspect response headers, and debug auth tokens live.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-3">
                    Open Playground →
                  </span>
                </div>

                <div
                  onClick={() => setCurrentModule("webhooks")}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl hover:border-purple-500/40 transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <Globe size={18} className="text-indigo-600 dark:text-indigo-400" />
                    <h5 className="text-xs font-black uppercase text-slate-900 dark:text-white mt-2">Webhook Logs</h5>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                      HMAC SHA-256 signature verification and retry dispatch queues.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-3">
                    View Deliveries →
                  </span>
                </div>

                <div
                  onClick={() => setCurrentModule("keys")}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl hover:border-purple-500/40 transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <Key size={18} className="text-amber-600 dark:text-amber-400" />
                    <h5 className="text-xs font-black uppercase text-slate-900 dark:text-white mt-2">Access Credentials</h5>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                      Generate granular read/write tokens scoped per microservice.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-3">
                    Manage Scopes →
                  </span>
                </div>

                <div
                  onClick={() => setCurrentModule("marketplace")}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl hover:border-purple-500/40 transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <Compass size={18} className="text-emerald-600 dark:text-emerald-400" />
                    <h5 className="text-xs font-black uppercase text-slate-900 dark:text-white mt-2">App Connectors</h5>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                      Pre-built connectors for WhatsApp Meta Cloud, Slack, and Stripe.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-3">
                    Explore Connectors →
                  </span>
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
