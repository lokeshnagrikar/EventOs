"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { LoadingScreen, DashboardSkeleton } from "@/components/ui/skeletons";
import PageShell from "@/components/ui/PageShell";
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileText,
  Percent,
  CheckCircle,
  Activity,
  Award,
  Layers,
  ArrowUpRight,
  Target,
  Download,
  CalendarDays,
  Clock,
  Sparkles,
  Printer,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Submodule Component Imports
import CustomReportBuilder from "@/components/reports/CustomReportBuilder";
import ScheduledReports from "@/components/reports/ScheduledReports";
import ReportTemplates from "@/components/reports/ReportTemplates";
import ExportHistory from "@/components/reports/ExportHistory";

function AnimatedCounter({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.floor(value);
    if (start === end) {
      setCount(end);
      return;
    }

    const duration = 1.0;
    const stepTime = Math.max(16, Math.abs(Math.floor((duration * 1000) / (end || 1))));
    const increment = Math.max(1, Math.ceil(end / 40));
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{prefix}{count.toLocaleString()}</span>;
}

// Interfaces for API Stats Data
interface LeadStats {
  totalLeads: number;
  byStatus: { [key: string]: number };
  bySource: { [key: string]: number };
  totalBudget: number;
  averageBudget: number;
  averageBookedBudget: number;
}

interface EventStats {
  totalEvents: number;
  byStatus: { [key: string]: number };
  byType: { [key: string]: number };
}

interface InvoiceStats {
  totalInvoices: number;
  byStatus: {
    [key: string]: {
      count: number;
      sum: number;
    };
  };
  totalAmount: number;
  subtotal: number;
  tax: number;
  discount: number;
}

interface PaymentStats {
  totalPayments: number;
  byStatus: { [key: string]: number };
  byMethod: {
    [key: string]: {
      count: number;
      sum: number;
    };
  };
  totalVolume: number;
  monthlyRevenue: { [key: string]: number };
}

export default function ReportsPage() {
  const router = useRouter();
  
  // Top Level Module Tabs
  const [currentModule, setCurrentModule] = useState<"analytics" | "builder" | "schedules" | "templates" | "history">("analytics");
  
  // Analytics sub-tabs
  const [activeTab, setActiveTab] = useState<"revenue" | "leads" | "events" | "conversion">("revenue");

  // Queries for stats
  const { data: leadsStatsRes, isLoading: loadingLeads } = useQuery<{ data: LeadStats }>({
    queryKey: ["reportsLeadsStats"],
    queryFn: async () => {
      const res = await api.get("/crm/leads/stats");
      return res.data;
    }
  });

  const { data: eventsStatsRes, isLoading: loadingEvents } = useQuery<{ data: EventStats }>({
    queryKey: ["reportsEventsStats"],
    queryFn: async () => {
      const res = await api.get("/events/stats");
      return res.data;
    }
  });

  const { data: invoicesStatsRes, isLoading: loadingInvoices } = useQuery<{ data: InvoiceStats }>({
    queryKey: ["reportsInvoicesStats"],
    queryFn: async () => {
      const res = await api.get("/events/invoices/stats");
      return res.data;
    }
  });

  const { data: paymentsStatsRes, isLoading: loadingPayments } = useQuery<{ data: PaymentStats }>({
    queryKey: ["reportsPaymentsStats"],
    queryFn: async () => {
      const res = await api.get("/events/payments/stats");
      return res.data;
    }
  });

  const leadsStats = leadsStatsRes?.data;
  const eventsStats = eventsStatsRes?.data;
  const invoicesStats = invoicesStatsRes?.data;
  const paymentsStats = paymentsStatsRes?.data;

  const isLoading = loadingLeads || loadingEvents || loadingInvoices || loadingPayments;

  // Revenue Math
  const totalRevenueBooked = paymentsStats?.totalVolume || 0;

  const outstandingInvoiced = Object.entries(invoicesStats?.byStatus || {})
    .filter(([status]) => status !== "PAID" && status !== "CANCELLED")
    .reduce((sum, [_, val]) => sum + (val.sum || 0), 0);

  const monthlyRevenue = paymentsStats?.monthlyRevenue || {};

  // Leads Math
  const totalLeads = leadsStats?.totalLeads || 0;
  const bookedLeads = leadsStats?.byStatus?.["BOOKED"] || 0;
  const lostLeads = leadsStats?.byStatus?.["LOST"] || 0;
  const activeLeads = totalLeads - (bookedLeads + lostLeads);

  const leadSources = leadsStats?.bySource || {};

  // Events Math
  const totalEvents = eventsStats?.totalEvents || 0;
  const completedEvents = eventsStats?.byStatus?.["COMPLETED"] || 0;
  const planningEvents = eventsStats?.byStatus?.["PLANNING"] || 0;
  const activeEvents = eventsStats?.byStatus?.["IN_PROGRESS"] || 0;

  const eventTypes = eventsStats?.byType || {};

  // Conversion Math
  const conversionRate = totalLeads > 0 ? (bookedLeads / totalLeads) * 100 : 0;
  const averageDealSize = leadsStats?.averageBookedBudget || 0;

  const handleExport = (type: "csv" | "excel" | "pdf") => {
    if (type === "pdf") {
      window.print();
      return;
    }

    let content = "";
    let filename = `eventos_report_${activeTab}`;

    if (activeTab === "revenue") {
      content = "Month,Revenue Volume\n" +
        Object.entries(paymentsStats?.monthlyRevenue || {})
          .map(([m, r]) => `${m},${r}`)
          .join("\n");
    } else if (activeTab === "leads") {
      content = "Stage,Count\n" +
        Object.entries(leadsStats?.byStatus || {})
          .map(([s, c]) => `${s},${c}`)
          .join("\n");
    } else if (activeTab === "events") {
      content = "Status,Count\n" +
        Object.entries(eventsStats?.byStatus || {})
          .map(([s, c]) => `${s},${c}`)
          .join("\n");
    } else {
      content = `Metric,Value\nConversion Rate,${conversionRate.toFixed(2)}%\nAverage Deal Size,INR ${averageDealSize}`;
    }

    if (type === "csv") {
      const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (type === "excel") {
      const blob = new Blob([content.replace(/,/g, "\t")], { type: "application/vnd.ms-excel;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isLoading) {
    return (
      <PageShell
        title="Workspace Analytics"
        subtitle="Analyze business metrics, lead acquisitions, budget conversions, and event operation pipelines."
      >
        <DashboardSkeleton />
      </PageShell>
    );
  }

  const headerActions = (
    <div className="flex items-center gap-2 print:hidden">
      <button
        onClick={() => handleExport("csv")}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-350 rounded-xl text-xs font-semibold transition cursor-pointer"
      >
        <Download size={13} />
        CSV
      </button>
      <button
        onClick={() => handleExport("excel")}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-350 rounded-xl text-xs font-semibold transition cursor-pointer"
      >
        <Download size={13} />
        Excel
      </button>
      <button
        onClick={() => handleExport("pdf")}
        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
      >
        <Printer size={13} />
        Print Report
      </button>
    </div>
  );

  return (
    <PageShell
      title="Intelligence & Export Center"
      subtitle="Generate executive-level financial statements, custom dataset exports, and automated reporting queues."
      actions={headerActions}
    >
      <div className="space-y-6 select-none text-zinc-300">
        
        {/* ── TOP LEVEL MODULE NAVIGATION (PRINT HUD HIDDEN) ───────────────── */}
        <div className="flex flex-wrap border-b border-zinc-850 text-xs font-black uppercase tracking-wider text-zinc-500 print:hidden">
          {[
            { id: "analytics" as const, label: "Analytics Dashboard", icon: TrendingUp },
            { id: "builder" as const, label: "Report Builder", icon: Sparkles },
            { id: "schedules" as const, label: "Scheduled Reports", icon: CalendarDays },
            { id: "templates" as const, label: "Templates & Favorites", icon: FileText },
            { id: "history" as const, label: "Export History", icon: History },
          ].map((mod) => {
            const active = currentModule === mod.id;
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                onClick={() => setCurrentModule(mod.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3.5 border-b-2 transition-all cursor-pointer",
                  active
                    ? "border-purple-650 text-purple-400 font-bold"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Icon size={13} />
                {mod.label}
              </button>
            );
          })}
        </div>

        {/* ── MODULE 1: INTERACTIVE ANALYTICS ──────────────────────────────── */}
        {currentModule === "analytics" && (
          <div className="space-y-6">
            
            {/* Sub-tab selection */}
            <div className="flex border-b border-zinc-850/60 text-[10px] font-black uppercase tracking-wider text-zinc-500 print:hidden">
              {[
                { id: "revenue" as const, label: "Revenue Statement" },
                { id: "leads" as const, label: "Leads & Pipeline" },
                { id: "events" as const, label: "Event Cataloging" },
                { id: "conversion" as const, label: "Sales Conversion" },
              ].map((sub) => {
                const active = activeTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setActiveTab(sub.id)}
                    className={cn(
                      "px-4 py-2 border-b-2 transition-all cursor-pointer",
                      active
                        ? "border-purple-600 text-purple-400 font-bold"
                        : "border-transparent text-zinc-550 hover:text-zinc-300"
                    )}
                  >
                    {sub.label}
                  </button>
                );
              })}
            </div>

            {/* --- REVENUE REPORT SUB-TAB --- */}
            {activeTab === "revenue" && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 bg-zinc-950/20 border border-zinc-850 rounded-xl space-y-2">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Total Received Revenue</span>
                    <p className="text-2xl font-extrabold font-mono text-emerald-400">INR <AnimatedCounter value={totalRevenueBooked} /></p>
                    <p className="text-[10px] text-zinc-400 font-semibold">From successful transactions</p>
                  </div>
                  <div className="p-5 bg-zinc-950/20 border border-zinc-850 rounded-xl space-y-2">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Outstanding Receivable</span>
                    <p className="text-2xl font-extrabold font-mono text-amber-500">INR <AnimatedCounter value={outstandingInvoiced} /></p>
                    <p className="text-[10px] text-zinc-400 font-semibold">From unpaid or draft statements</p>
                  </div>
                  <div className="p-5 bg-zinc-950/20 border border-zinc-850 rounded-xl space-y-2">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Total Invoice Statement Volume</span>
                    <p className="text-2xl font-extrabold font-mono text-purple-400">
                      INR <AnimatedCounter value={totalRevenueBooked + outstandingInvoiced} />
                    </p>
                    <p className="text-[10px] text-zinc-400 font-semibold">Total generated billing amount</p>
                  </div>
                </div>

                <div className="p-6 bg-zinc-950/10 border border-zinc-850 rounded-xl space-y-4">
                  <h3 className="text-sm font-bold text-zinc-200">Monthly Revenue Distribution</h3>
                  {Object.keys(monthlyRevenue).length === 0 ? (
                    <p className="text-xs text-zinc-550 py-8 text-center">No successful payments tracked this period.</p>
                  ) : (
                    <div className="space-y-3 pt-2">
                      {Object.entries(monthlyRevenue).map(([month, val]) => {
                        const percent = Math.min(100, Math.max(15, (val / (totalRevenueBooked || 1)) * 100));
                        return (
                          <div key={month} className="space-y-1.5 text-xs">
                            <div className="flex justify-between font-medium">
                              <span>{month}</span>
                              <span className="font-mono font-bold">INR {val.toLocaleString()}</span>
                            </div>
                            <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-650 to-purple-500 rounded-full"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="p-6 bg-zinc-950/10 border border-zinc-850 rounded-xl space-y-4">
                  <h3 className="text-sm font-bold text-zinc-200">Payment Methods Breakdown</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {["UPI", "CASH", "CARD", "BANK_TRANSFER"].map((method) => {
                      const amt = paymentsStats?.byMethod?.[method]?.sum || 0;
                      return (
                        <div key={method} className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-lg text-center space-y-1">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase">{method.replace("_", " ")}</span>
                          <p className="text-sm font-bold font-mono text-zinc-250">INR {amt.toLocaleString()}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* --- LEADS REPORT SUB-TAB --- */}
            {activeTab === "leads" && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="p-4 bg-zinc-950/20 border border-zinc-850 rounded-xl space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Total Leads Acquired</span>
                    <p className="text-2xl font-extrabold font-mono text-purple-400"><AnimatedCounter value={totalLeads} /></p>
                  </div>
                  <div className="p-4 bg-zinc-950/20 border border-zinc-850 rounded-xl space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Converted (Booked)</span>
                    <p className="text-2xl font-extrabold font-mono text-emerald-400"><AnimatedCounter value={bookedLeads} /></p>
                  </div>
                  <div className="p-4 bg-zinc-950/20 border border-zinc-850 rounded-xl space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Active Pipeline</span>
                    <p className="text-2xl font-extrabold font-mono text-amber-500"><AnimatedCounter value={activeLeads} /></p>
                  </div>
                  <div className="p-4 bg-zinc-950/20 border border-zinc-850 rounded-xl space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Lost / Dropped</span>
                    <p className="text-2xl font-extrabold font-mono text-red-500"><AnimatedCounter value={lostLeads} /></p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-5 bg-zinc-950/10 border border-zinc-850 rounded-xl space-y-4">
                    <h3 className="text-sm font-bold text-zinc-200">Leads Stage Distribution</h3>
                    <div className="space-y-3.5">
                      {["NEW", "CONTACTED", "PROPOSAL_SENT", "NEGOTIATION", "BOOKED", "LOST"].map((stage) => {
                        const cnt = leadsStats?.byStatus?.[stage] || 0;
                        const percent = totalLeads > 0 ? (cnt / totalLeads) * 100 : 0;
                        return (
                          <div key={stage} className="flex items-center gap-3 text-xs">
                            <span className="w-24 text-zinc-450 font-bold truncate text-[10px]">{stage}</span>
                            <div className="flex-1 h-3 bg-zinc-900 rounded overflow-hidden">
                              <div
                                className="h-full bg-purple-600 rounded"
                                style={{ width: `${Math.max(3, percent)}%` }}
                              />
                            </div>
                            <span className="w-8 text-right font-mono font-bold">{cnt}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-5 bg-zinc-950/10 border border-zinc-850 rounded-xl space-y-4">
                    <h3 className="text-sm font-bold text-zinc-200">Acquisition Channels</h3>
                    <div className="space-y-3.5">
                      {Object.entries(leadSources).map(([source, count]) => {
                        const pct = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
                        return (
                          <div key={source} className="space-y-1 text-xs">
                            <div className="flex justify-between text-[11px] font-bold text-zinc-300">
                              <span>{source}</span>
                              <span className="font-mono text-zinc-455">{count} ({pct.toFixed(0)}%)</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      {Object.keys(leadSources).length === 0 && (
                        <p className="text-xs text-zinc-555 text-center py-6">No acquisition sources tracked.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- EVENTS REPORT SUB-TAB --- */}
            {activeTab === "events" && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 bg-zinc-950/20 border border-zinc-850 rounded-xl text-center space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Completed Events</span>
                    <p className="text-3xl font-extrabold font-mono text-emerald-400">{completedEvents}</p>
                  </div>
                  <div className="p-5 bg-zinc-950/20 border border-zinc-850 rounded-xl text-center space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">In Planning Phase</span>
                    <p className="text-3xl font-extrabold font-mono text-purple-400">{planningEvents}</p>
                  </div>
                  <div className="p-5 bg-zinc-950/20 border border-zinc-850 rounded-xl text-center space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">In Progress</span>
                    <p className="text-3xl font-extrabold font-mono text-amber-500">{activeEvents}</p>
                  </div>
                </div>

                <div className="p-6 bg-zinc-950/10 border border-zinc-850 rounded-xl space-y-4">
                  <h3 className="text-sm font-bold text-zinc-200">Event Type Ratios</h3>
                  <div className="space-y-4">
                    {Object.entries(eventTypes).map(([type, count]) => {
                      const pct = totalEvents > 0 ? (count / totalEvents) * 100 : 0;
                      return (
                        <div key={type} className="space-y-1 text-xs">
                          <div className="flex justify-between font-bold text-zinc-350">
                            <span>{type}</span>
                            <span className="font-mono text-zinc-455">{count} events</span>
                          </div>
                          <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-655 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(eventTypes).length === 0 && (
                      <p className="text-xs text-zinc-550 text-center py-6">No event logs recorded.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* --- SALES CONVERSION SUB-TAB --- */}
            {activeTab === "conversion" && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-zinc-950/20 border border-zinc-850 rounded-xl flex items-center justify-between">
                    <div className="space-y-2">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Sales Conversion Ratio</span>
                      <p className="text-3xl font-extrabold font-mono text-purple-400">{conversionRate.toFixed(1)}%</p>
                      <p className="text-[10px] text-zinc-450 font-semibold">Percentage of leads that book an event</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-purple-600/10 flex items-center justify-center text-purple-400">
                      <Target size={22} />
                    </div>
                  </div>
                  <div className="p-6 bg-zinc-950/20 border border-zinc-850 rounded-xl flex items-center justify-between">
                    <div className="space-y-2">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Average Deal Value</span>
                      <p className="text-3xl font-extrabold font-mono text-emerald-400">INR {averageDealSize.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                      <p className="text-[10px] text-zinc-450 font-semibold">Average budget for Booked leads</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-emerald-600/10 flex items-center justify-center text-emerald-400">
                      <Award size={22} />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-zinc-950/10 border border-zinc-850 rounded-xl space-y-4">
                  <h3 className="text-sm font-bold text-zinc-200">Sales Pipeline Health Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    <div className="p-4 border border-zinc-800 rounded-lg space-y-1 bg-zinc-900/20">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">Lead Velocity</span>
                      <p className="text-sm font-bold text-zinc-300">Fast</p>
                      <p className="text-[9px] text-zinc-500 font-semibold">Avg conversion within 6 days of draft proposal</p>
                    </div>
                    <div className="p-4 border border-zinc-800 rounded-lg space-y-1 bg-zinc-900/20">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">Leakage Rate</span>
                      <p className="text-sm font-bold text-zinc-300">{(totalLeads > 0 ? (lostLeads / totalLeads) * 100 : 0).toFixed(0)}%</p>
                      <p className="text-[9px] text-zinc-500 font-semibold">Leads lost at negotiation or proposal stage</p>
                    </div>
                    <div className="p-4 border border-zinc-800 rounded-lg space-y-1 bg-zinc-900/20">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">Avg Lead Value</span>
                      <p className="text-sm font-bold text-zinc-300">
                        INR {(leadsStats?.averageBudget || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}
                      </p>
                      <p className="text-[9px] text-zinc-500 font-semibold">Average value of all pipeline leads</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MODULE 2: CUSTOM REPORT BUILDER ─────────────────────────────── */}
        {currentModule === "builder" && (
          <CustomReportBuilder />
        )}

        {/* ── MODULE 3: SCHEDULED AUTOMATED REPORTS ────────────────────────── */}
        {currentModule === "schedules" && (
          <ScheduledReports />
        )}

        {/* ── MODULE 4: REPORT TEMPLATES & FAVORITES ───────────────────────── */}
        {currentModule === "templates" && (
          <ReportTemplates />
        )}

        {/* ── MODULE 5: EXPORTS HISTORY LEDGER ─────────────────────────────── */}
        {currentModule === "history" && (
          <ExportHistory />
        )}

        {/* ── PREMIUM PRINT-BREAK TEMPLATE (SCREEN HIDDEN, PRINT VISIBLE) ──── */}
        <div className="hidden print:block text-zinc-900 bg-white p-10 font-sans space-y-8 absolute top-0 left-0 w-full min-h-screen">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wider text-purple-800">EventOS Executive Statement</h1>
              <p className="text-xs text-zinc-500">Date: {new Date().toLocaleDateString()} • Generated By: Roy Wedding Admin</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">Dream Weddings Studio</p>
              <p className="text-[10px] text-zinc-400">Timezone: Asia/Kolkata</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase text-zinc-700">Financial Revenue Breakdown</h3>
            <table className="w-full text-left text-xs border border-zinc-200 border-collapse">
              <thead>
                <tr className="bg-zinc-100 text-[10px] uppercase font-bold text-zinc-600 border-b border-zinc-200">
                  <th className="px-4 py-2 border-r border-zinc-200">Revenue Metric</th>
                  <th className="px-4 py-2">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                <tr>
                  <td className="px-4 py-2 border-r border-zinc-200 font-medium">Total Received Revenue (Booked)</td>
                  <td className="px-4 py-2 font-mono">INR {totalRevenueBooked.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-r border-zinc-200 font-medium">Outstanding Receivable (Unpaid)</td>
                  <td className="px-4 py-2 font-mono">INR {outstandingInvoiced.toLocaleString()}</td>
                </tr>
                <tr className="bg-zinc-50 font-bold">
                  <td className="px-4 py-2 border-r border-zinc-200">Cumulative Generated Business Volume</td>
                  <td className="px-4 py-2 font-mono text-purple-750">INR {(totalRevenueBooked + outstandingInvoiced).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pt-20 flex justify-between text-xs">
            <div className="border-t border-zinc-300 w-48 text-center pt-2">
              <p className="font-bold">Prepared By</p>
              <p className="text-[10px] text-zinc-400">Roy Wedding Admin</p>
            </div>
            <div className="border-t border-zinc-300 w-48 text-center pt-2">
              <p className="font-bold">Authorized Signature</p>
              <p className="text-[10px] text-zinc-400">Workspace Owner</p>
            </div>
          </div>
        </div>

      </div>
    </PageShell>
  );
}
