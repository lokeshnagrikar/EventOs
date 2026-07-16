"use client";

import React, { useState, useEffect } from "react";
import { 
  Activity, 
  Cpu, 
  Database, 
  Zap, 
  Gauge, 
  LineChart as LineIcon, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Clock 
} from "lucide-react";
import { motion } from "framer-motion";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from "recharts";
import { cn } from "@/lib/utils";

// Mock continuous data stream
const generateInitialLatencyData = () => {
  const data = [];
  const now = new Date();
  for (let i = 9; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000);
    data.push({
      time: `${time.getHours().toString().padStart(2, "0")}:${time.getMinutes().toString().padStart(2, "0")}`,
      latency: Math.floor(Math.random() * 45) + 80,
      dbQueryTime: Math.floor(Math.random() * 15) + 12,
    });
  }
  return data;
};

interface SlowEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  duration: number;
  queries: number;
  status: number;
}

export default function PerformanceDashboard() {
  const [latencyData, setLatencyData] = useState<any[]>([]);
  const [isSimulating, setIsSimulating] = useState(true);
  const [activeTab, setActiveTab] = useState<"vitals" | "backend" | "slow">("vitals");
  
  // Real-time system states
  const [metrics, setMetrics] = useState({
    cpuUsage: 14.2,
    memoryUsage: 42.8,
    dbPoolActive: 4,
    dbPoolIdle: 16,
    redisCacheHitRatio: 94.6,
    activeRabbitQueue: 0,
    fcp: 0.65,
    lcp: 1.15,
    cls: 0.01,
    inp: 85,
  });

  const [slowEndpoints] = useState<SlowEndpoint[]>([
    { method: "GET", path: "/api/v1/crm/leads?limit=5000", duration: 1850, queries: 142, status: 200 },
    { method: "POST", path: "/api/v1/quotes/generate-pdf", duration: 1420, queries: 14, status: 201 },
    { method: "GET", path: "/api/v1/events/dashboard/metrics", duration: 620, queries: 48, status: 200 },
    { method: "GET", path: "/api/v1/gallery/albums/large-cover", duration: 490, queries: 8, status: 200 },
    { method: "PUT", path: "/api/v1/billing/subscriptions/coupon", duration: 410, queries: 18, status: 200 },
  ]);

  // Load initial latency tracking data
  useEffect(() => {
    setLatencyData(generateInitialLatencyData());
  }, []);

  // Set up live diagnostics simulator
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      
      setLatencyData((prev) => {
        const next = [...prev.slice(1)];
        next.push({
          time: timeStr,
          latency: Math.floor(Math.random() * 40) + 85,
          dbQueryTime: Math.floor(Math.random() * 12) + 14,
        });
        return next;
      });

      setMetrics((prev) => ({
        ...prev,
        cpuUsage: +(Math.max(5, Math.min(95, prev.cpuUsage + (Math.random() * 8 - 4)))).toFixed(1),
        memoryUsage: +(Math.max(20, Math.min(85, prev.memoryUsage + (Math.random() * 2 - 1)))).toFixed(1),
        dbPoolActive: Math.floor(Math.random() * 6) + 3,
        redisCacheHitRatio: +(Math.max(90, Math.min(99, prev.redisCacheHitRatio + (Math.random() * 0.4 - 0.2)))).toFixed(1),
        activeRabbitQueue: Math.max(0, prev.activeRabbitQueue + Math.floor(Math.random() * 3) - 1),
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  return (
    <div className="space-y-6">
      
      {/* Simulation Controller header */}
      <div className="flex justify-between items-center bg-zinc-950/20 border border-zinc-850 p-4 rounded-2xl">
        <div>
          <h4 className="text-xs font-black uppercase text-zinc-100 flex items-center gap-1.5">
            <Activity size={14} className="text-purple-400 animate-pulse" />
            Live Platform Diagnostics Console
          </h4>
          <p className="text-[10px] text-zinc-555 font-bold uppercase tracking-wider mt-0.5">
            Real-time infrastructure health and user experience metrics.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsSimulating(!isSimulating)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95",
            isSimulating
              ? "bg-purple-650/15 border-purple-500/30 text-purple-400"
              : "bg-zinc-900 border-zinc-800 text-zinc-500"
          )}
        >
          <RefreshCw size={11} className={cn("transition-transform duration-1000", isSimulating && "animate-spin")} />
          {isSimulating ? "Simulating Live" : "Metrics Paused"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-900 text-xs font-black uppercase tracking-wider text-zinc-500">
        {[
          { id: "vitals" as const, label: "Core Web Vitals", icon: Gauge },
          { id: "backend" as const, label: "Backend & Infrastructure", icon: Cpu },
          { id: "slow" as const, label: "Slow Query Trace Log", icon: AlertTriangle },
        ].map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer",
                active
                  ? "border-purple-650 text-purple-400 font-bold"
                  : "border-transparent text-zinc-500 hover:text-zinc-350"
              )}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Core Web Vitals tab content */}
      {activeTab === "vitals" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* FCP */}
            <div className="p-5 border border-zinc-855 bg-zinc-950/20 rounded-2xl space-y-1">
              <span className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">First Contentful Paint</span>
              <p className="text-xl font-black text-white">{metrics.fcp} s</p>
              <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-1.5 py-0.5 rounded mt-1">
                <CheckCircle size={8} /> Good (&lt;1.8s)
              </span>
            </div>

            {/* LCP */}
            <div className="p-5 border border-zinc-855 bg-zinc-950/20 rounded-2xl space-y-1">
              <span className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Largest Contentful Paint</span>
              <p className="text-xl font-black text-white">{metrics.lcp} s</p>
              <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-1.5 py-0.5 rounded mt-1">
                <CheckCircle size={8} /> Good (&lt;2.5s)
              </span>
            </div>

            {/* CLS */}
            <div className="p-5 border border-zinc-855 bg-zinc-950/20 rounded-2xl space-y-1">
              <span className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Cumulative Layout Shift</span>
              <p className="text-xl font-black text-white">{metrics.cls}</p>
              <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-1.5 py-0.5 rounded mt-1">
                <CheckCircle size={8} /> Perfect (&lt;0.1)
              </span>
            </div>

            {/* INP */}
            <div className="p-5 border border-zinc-855 bg-zinc-950/20 rounded-2xl space-y-1">
              <span className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Interaction to Next Paint</span>
              <p className="text-xl font-black text-white">{metrics.inp} ms</p>
              <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-1.5 py-0.5 rounded mt-1">
                <CheckCircle size={8} /> Fast (&lt;200ms)
              </span>
            </div>

          </div>

          {/* Core Web Vitals latency graph */}
          <div className="p-5 border border-zinc-850 bg-zinc-950/10 rounded-2xl space-y-4">
            <div>
              <span className="text-[8px] font-black uppercase text-zinc-550 tracking-wider">Network Latency distribution</span>
              <h4 className="text-xs font-black uppercase text-zinc-200">Average Gateway response times</h4>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={latencyData}>
                  <defs>
                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.2} />
                  <XAxis dataKey="time" stroke="#52525b" fontSize={9} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={9} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#000", border: "1px solid #27272a" }} />
                  <Area type="monotone" dataKey="latency" name="Gateway Latency" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorLatency)" />
                  <Area type="monotone" dataKey="dbQueryTime" name="Database Fetch Time" stroke="#ec4899" fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Backend & Infrastructure tab content */}
      {activeTab === "backend" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* CPU */}
            <div className="p-5 border border-zinc-855 bg-zinc-950/20 rounded-2xl">
              <p className="text-xs font-bold text-zinc-400">Server CPU Usage</p>
              <p className="text-2xl font-black text-white mt-1">{metrics.cpuUsage}%</p>
              <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mt-2 border border-white/[0.04]">
                <div 
                  className={cn("h-full transition-all duration-500", metrics.cpuUsage > 80 ? "bg-red-500" : "bg-purple-500")}
                  style={{ width: `${metrics.cpuUsage}%` }} 
                />
              </div>
            </div>

            {/* RAM */}
            <div className="p-5 border border-zinc-855 bg-zinc-950/20 rounded-2xl">
              <p className="text-xs font-bold text-zinc-400">Server Memory Usage</p>
              <p className="text-2xl font-black text-white mt-1">{metrics.memoryUsage}%</p>
              <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mt-2 border border-white/[0.04]">
                <div className="h-full bg-pink-500 transition-all duration-500" style={{ width: `${metrics.memoryUsage}%` }} />
              </div>
            </div>

            {/* Redis Hit Ratio */}
            <div className="p-5 border border-zinc-855 bg-zinc-950/20 rounded-2xl">
              <p className="text-xs font-bold text-zinc-400">Redis Cache Hit Ratio</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">{metrics.redisCacheHitRatio}%</p>
              <span className="text-[8px] text-zinc-550 font-bold uppercase tracking-wider block mt-2">Active cache invalidators</span>
            </div>

            {/* DB Pools */}
            <div className="p-5 border border-zinc-855 bg-zinc-950/20 rounded-2xl">
              <p className="text-xs font-bold text-zinc-400">Hikari Database Connections</p>
              <p className="text-2xl font-black text-white mt-1">{metrics.dbPoolActive} Active / {metrics.dbPoolIdle} Idle</p>
              <span className="text-[8px] text-zinc-550 font-bold uppercase tracking-wider block mt-2">Pool capacity: 20 max</span>
            </div>

          </div>

          {/* Infrastructure metrics grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Cache Hits bar chart */}
            <div className="p-5 border border-zinc-850 bg-zinc-950/10 rounded-2xl space-y-4">
              <h4 className="text-xs font-black uppercase text-zinc-200">Cache Efficacy analysis</h4>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: "CRM Metrics", hit: 98, miss: 2 },
                    { name: "Events Lists", hit: 92, miss: 8 },
                    { name: "Payments Hist", hit: 96, miss: 4 },
                    { name: "Metadata Settings", hit: 100, miss: 0 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.15} />
                    <XAxis dataKey="name" stroke="#52525b" fontSize={8} tickLine={false} />
                    <YAxis stroke="#52525b" fontSize={8} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#000", border: "1px solid #27272a" }} />
                    <Bar dataKey="hit" name="Cache Hits" fill="#10b981" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="miss" name="Cache Misses/Bypass" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Microservices metrics queue lists */}
            <div className="p-5 border border-zinc-850 bg-zinc-950/10 rounded-2xl space-y-4">
              <h4 className="text-xs font-black uppercase text-zinc-200">Event Broker Status (RabbitMQ)</h4>
              <div className="space-y-3 pt-1">
                {[
                  { name: "lead.created.queue", inFlight: 0, status: "Healthy" },
                  { name: "quote.signed.queue", inFlight: metrics.activeRabbitQueue, status: metrics.activeRabbitQueue > 3 ? "Warning" : "Healthy" },
                  { name: "invoice.payment.queue", inFlight: 0, status: "Healthy" },
                  { name: "system.notification.queue", inFlight: 0, status: "Healthy" },
                ].map((q) => (
                  <div key={q.name} className="flex justify-between items-center p-2.5 bg-zinc-950/50 border border-zinc-900 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      <span className="text-[11px] font-mono text-zinc-300">{q.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-wider">
                      <span className="text-zinc-500">{q.inFlight} in-flight</span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[8px]",
                        q.status === "Healthy" ? "bg-emerald-500/10 text-emerald-450 border border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      )}>{q.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Slow Query Trace Log tab content */}
      {activeTab === "slow" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs leading-normal">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>
              <strong>Warning</strong>: 5 queries exceeded the performance threshold of 400ms. Consider database scaling or composite indexes for these operations.
            </span>
          </div>

          <div className="border border-zinc-850 rounded-2xl bg-zinc-950/20 overflow-hidden">
            {/* Headers */}
            <div className="grid grid-cols-6 border-b border-zinc-850 bg-zinc-900/40 px-5 py-3 text-[9px] font-black uppercase tracking-wider text-zinc-500">
              <div className="col-span-1">Method</div>
              <div className="col-span-2">Endpoint Path</div>
              <div className="col-span-1 text-right">Duration</div>
              <div className="col-span-1 text-right">SQL Queries</div>
              <div className="col-span-1 text-right">HTTP Status</div>
            </div>

            {/* List */}
            <div className="divide-y divide-zinc-900 text-xs">
              {slowEndpoints.map((item, idx) => (
                <div key={idx} className="grid grid-cols-6 items-center px-5 py-3 hover:bg-white/[0.01]">
                  <div className="col-span-1">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[8px] font-black",
                      item.method === "GET" && "bg-blue-500/10 text-blue-450 border border-blue-500/20",
                      item.method === "POST" && "bg-emerald-500/10 text-emerald-450 border border-emerald-500/20",
                      item.method === "PUT" && "bg-amber-500/10 text-amber-500 border border-amber-500/20",
                    )}>
                      {item.method}
                    </span>
                  </div>
                  <div className="col-span-2 font-mono text-[10px] text-zinc-350 truncate pr-4">{item.path}</div>
                  <div className="col-span-1 text-right font-bold text-rose-450">{item.duration} ms</div>
                  <div className="col-span-1 text-right text-zinc-400">{item.queries}</div>
                  <div className="col-span-1 text-right font-mono text-[10px] text-emerald-400">{item.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
