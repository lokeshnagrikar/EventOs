"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
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
  Target
} from "lucide-react";

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col items-center justify-center p-6 gap-3">
        <Loader2 className="animate-spin text-purple-500" size={32} />
        <h2 className="font-bold text-sm">Aggregating Workspace Records...</h2>
        <p className="text-zinc-550 text-xs">This takes a second to query multi-service ledger balances.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex flex-col relative overflow-hidden transition-all duration-200">
      
      {/* Background glow effects to match landing page theme */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Top Navbar */}
      <nav className="h-16 border-b border-zinc-800 bg-[#111113]/80 backdrop-blur px-6 flex items-center justify-between z-25 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="h-8 w-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-zinc-700/50"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">Workspace Analytics</span>
            <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-zinc-450 font-semibold uppercase font-mono">Reports</span>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-850 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Intelligence Center</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Analyze business metrics, lead acquisitions, budget conversions, and event operation pipelines.
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-850 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("revenue")}
            className={`px-5 py-3 border-b-2 transition-all ${
              activeTab === "revenue"
                ? "border-purple-600 text-purple-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Revenue Statement
          </button>
          <button
            onClick={() => setActiveTab("leads")}
            className={`px-5 py-3 border-b-2 transition-all ${
              activeTab === "leads"
                ? "border-purple-600 text-purple-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Leads & Pipeline
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`px-5 py-3 border-b-2 transition-all ${
              activeTab === "events"
                ? "border-purple-600 text-purple-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Event Cataloging
          </button>
          <button
            onClick={() => setActiveTab("conversion")}
            className={`px-5 py-3 border-b-2 transition-all ${
              activeTab === "conversion"
                ? "border-purple-600 text-purple-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Sales Conversion
          </button>
        </div>

        {/* --- REVENUE REPORT TAB --- */}
        {activeTab === "revenue" && (
          <div className="space-y-6 animate-fade-in">
            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-[#111113]/40 border border-zinc-850 rounded-xl space-y-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Total Received Revenue</span>
                <p className="text-2xl font-extrabold font-mono text-emerald-400">INR {totalRevenueBooked.toLocaleString()}</p>
                <p className="text-[10px] text-zinc-400">From successful transactions</p>
              </div>
              <div className="p-5 bg-[#111113]/40 border border-zinc-850 rounded-xl space-y-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Outstanding Receivable</span>
                <p className="text-2xl font-extrabold font-mono text-amber-500">INR {outstandingInvoiced.toLocaleString()}</p>
                <p className="text-[10px] text-zinc-400">From unpaid or draft statements</p>
              </div>
              <div className="p-5 bg-[#111113]/40 border border-zinc-850 rounded-xl space-y-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Total Invoice Statement Volume</span>
                <p className="text-2xl font-extrabold font-mono text-purple-400">
                  INR {(totalRevenueBooked + outstandingInvoiced).toLocaleString()}
                </p>
                <p className="text-[10px] text-zinc-400">Total generated billing amount</p>
              </div>
            </div>

            {/* Custom SVG Trend Chart */}
            <div className="p-6 bg-[#111113]/30 border border-zinc-850 rounded-xl space-y-4">
              <h3 className="text-sm font-bold">Monthly Revenue Distribution</h3>
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

            {/* Ledger summary */}
            <div className="p-6 bg-[#111113]/30 border border-zinc-850 rounded-xl space-y-4">
              <h3 className="text-sm font-bold">Payment Methods Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["UPI", "CASH", "CARD", "BANK_TRANSFER"].map(method => {
                  const amt = paymentsStats?.byMethod?.[method]?.sum || 0;
                  return (
                    <div key={method} className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-lg text-center space-y-1">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase">{method.replace("_", " ")}</span>
                      <p className="text-sm font-bold font-mono text-zinc-200">INR {amt.toLocaleString()}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* --- LEADS REPORT TAB --- */}
        {activeTab === "leads" && (
          <div className="space-y-6 animate-fade-in">
            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-4 bg-[#111113]/40 border border-zinc-850 rounded-xl space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Total Leads Acquired</span>
                <p className="text-2xl font-extrabold font-mono text-purple-400">{totalLeads}</p>
              </div>
              <div className="p-4 bg-[#111113]/40 border border-zinc-850 rounded-xl space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Converted (Booked)</span>
                <p className="text-2xl font-extrabold font-mono text-emerald-400">{bookedLeads}</p>
              </div>
              <div className="p-4 bg-[#111113]/40 border border-zinc-850 rounded-xl space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Active Pipeline</span>
                <p className="text-2xl font-extrabold font-mono text-amber-500">{activeLeads}</p>
              </div>
              <div className="p-4 bg-[#111113]/40 border border-zinc-850 rounded-xl space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Lost / Dropped</span>
                <p className="text-2xl font-extrabold font-mono text-red-500">{lostLeads}</p>
              </div>
            </div>

            {/* Funnel distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Funnel */}
              <div className="p-5 bg-[#111113]/30 border border-zinc-850 rounded-xl space-y-4">
                <h3 className="text-sm font-bold">Leads Stage Distribution</h3>
                <div className="space-y-3.5">
                  {["NEW", "CONTACTED", "PROPOSAL_SENT", "NEGOTIATION", "BOOKED", "LOST"].map(stage => {
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

              {/* Source list */}
              <div className="p-5 bg-[#111113]/30 border border-zinc-850 rounded-xl space-y-4">
                <h3 className="text-sm font-bold">Acquisition Channels</h3>
                <div className="space-y-3.5">
                  {Object.entries(leadSources).map(([source, count]) => {
                    const pct = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
                    return (
                      <div key={source} className="space-y-1 text-xs">
                        <div className="flex justify-between text-[11px] font-bold text-zinc-300">
                          <span>{source}</span>
                          <span className="font-mono text-zinc-400">{count} ({pct.toFixed(0)}%)</span>
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

        {/* --- EVENTS REPORT TAB --- */}
        {activeTab === "events" && (
          <div className="space-y-6 animate-fade-in">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-[#111113]/40 border border-zinc-850 rounded-xl text-center space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Completed Events</span>
                <p className="text-3xl font-extrabold font-mono text-emerald-400">{completedEvents}</p>
              </div>
              <div className="p-5 bg-[#111113]/40 border border-zinc-850 rounded-xl text-center space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">In Planning Phase</span>
                <p className="text-3xl font-extrabold font-mono text-purple-400">{planningEvents}</p>
              </div>
              <div className="p-5 bg-[#111113]/40 border border-zinc-850 rounded-xl text-center space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">In Progress</span>
                <p className="text-3xl font-extrabold font-mono text-amber-500">{activeEvents}</p>
              </div>
            </div>

            {/* Event Distribution list */}
            <div className="p-6 bg-[#111113]/30 border border-zinc-850 rounded-xl space-y-4">
              <h3 className="text-sm font-bold">Event Type Ratios</h3>
              <div className="space-y-4">
                {Object.entries(eventTypes).map(([type, count]) => {
                  const pct = totalEvents > 0 ? (count / totalEvents) * 100 : 0;
                  return (
                    <div key={type} className="space-y-1 text-xs">
                      <div className="flex justify-between font-bold text-zinc-350">
                        <span>{type}</span>
                        <span className="font-mono text-zinc-450">{count} events</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-650 rounded-full"
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

        {/* --- SALES CONVERSION TAB --- */}
        {activeTab === "conversion" && (
          <div className="space-y-6 animate-fade-in">
            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-[#111113]/40 border border-zinc-850 rounded-xl flex items-center justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Sales Conversion Ratio</span>
                  <p className="text-3xl font-extrabold font-mono text-purple-400">{conversionRate.toFixed(1)}%</p>
                  <p className="text-[10px] text-zinc-400">Percentage of leads that book an event</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-600/10 flex items-center justify-center text-purple-400">
                  <Target size={22} />
                </div>
              </div>
              <div className="p-6 bg-[#111113]/40 border border-zinc-850 rounded-xl flex items-center justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Average Deal Value</span>
                  <p className="text-3xl font-extrabold font-mono text-emerald-400">INR {averageDealSize.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                  <p className="text-[10px] text-zinc-400">Average budget for Booked leads</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-600/10 flex items-center justify-center text-emerald-400">
                  <Award size={22} />
                </div>
              </div>
            </div>

            {/* Pipeline Efficiency description */}
            <div className="p-6 bg-[#111113]/30 border border-zinc-850 rounded-xl space-y-4">
              <h3 className="text-sm font-bold">Sales Pipeline Health Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="p-4 border border-zinc-800 rounded-lg space-y-1 bg-zinc-900/20">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">Lead Velocity</span>
                  <p className="text-sm font-bold text-zinc-300">Fast</p>
                  <p className="text-[9px] text-zinc-500">Avg conversion within 6 days of draft proposal</p>
                </div>
                <div className="p-4 border border-zinc-800 rounded-lg space-y-1 bg-zinc-900/20">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">Leakage Rate</span>
                  <p className="text-sm font-bold text-zinc-300">{(totalLeads > 0 ? (lostLeads / totalLeads) * 100 : 0).toFixed(0)}%</p>
                  <p className="text-[9px] text-zinc-500">Leads lost at negotiation or proposal stage</p>
                </div>
                <div className="p-4 border border-zinc-800 rounded-lg space-y-1 bg-zinc-900/20">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">Avg Lead Value</span>
                  <p className="text-sm font-bold text-zinc-300">
                    INR {(leadsStats?.averageBudget || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}
                  </p>
                  <p className="text-[9px] text-zinc-500 font-mono">Average value of all pipeline leads</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
