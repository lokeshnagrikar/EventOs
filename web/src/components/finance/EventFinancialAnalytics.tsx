"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/ui/EmptyState";
import { useToastStore } from "@/lib/toastStore";

export interface EventFinancialAnalyticsProps {
  invoices?: any[];
  payments?: any[];
  bookings?: any[];
  expenses?: any[];
  eventsList?: any[];
  kpis?: {
    revenueToday: number;
    revenueWeek: number;
    revenueMonth: number;
    revenueYear: number;
    outstanding: number;
    paidInvoicesVolume: number;
    paidInvoicesCount: number;
    overdueCount: number;
    collectionRate: number;
    refundedAmount: number;
    totalInvoiced: number;
    estimatedExpenses: number;
    netProfit: number;
    profitMargin: number;
  };
  revenueTrendData?: { month: string; Revenue: number; Expenses: number; Profit: number }[];
  expenseCategoryData?: { name: string; value: number; color: string }[];
  onCreateInvoice?: () => void;
  onRecordPayment?: () => void;
}

export function EventFinancialAnalytics({
  invoices = [],
  payments = [],
  bookings = [],
  expenses = [],
  eventsList = [],
  kpis,
  revenueTrendData = [],
  expenseCategoryData = [],
  onCreateInvoice,
  onRecordPayment,
}: EventFinancialAnalyticsProps) {
  const addToast = useToastStore((state) => state.addToast);
  const [currency, setCurrency] = useState<"INR" | "USD" | "EUR">("INR");

  const currencySymbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : "€";
  const currencyMultiplier = currency === "INR" ? 1 : currency === "USD" ? 0.012 : 0.011;

  const formatAmount = (num: number) => {
    const converted = (num || 0) * currencyMultiplier;
    if (currency === "INR") {
      return `${currencySymbol}${Math.round(converted).toLocaleString("en-IN")}`;
    }
    return `${currencySymbol}${Math.round(converted).toLocaleString("en-US")}`;
  };

  // Real KPIs calculations
  const grossRevenue = kpis?.paidInvoicesVolume ?? 0;
  const vendorPayouts = kpis?.estimatedExpenses ?? 0;
  const netProfit = kpis?.netProfit ?? (grossRevenue - vendorPayouts);
  const profitMarginPercent = kpis?.profitMargin ?? (grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0);
  const outstandingInvoices = kpis?.outstanding ?? 0;

  const unpaidInvoicesList = useMemo(() => {
    return invoices.filter((i) => i.status !== "PAID" && i.status !== "CANCELLED");
  }, [invoices]);

  // Per-Event Profitability derived dynamically from real bookings & expenses
  const eventProfitData = useMemo(() => {
    if (!bookings || bookings.length === 0) {
      // If bookings empty, check if eventsList has items
      if (eventsList && eventsList.length > 0) {
        return eventsList.map((e) => {
          const rev = Number(e.budget) || 0;
          return {
            id: e.id ? e.id.slice(0, 8) : "EVT-1",
            name: e.name || "Event",
            client: e.clientName || "Direct Client",
            date: e.startDate ? new Date(e.startDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Upcoming",
            revenue: rev,
            expenses: 0,
            netProfit: rev,
            marginPercent: rev > 0 ? 100 : 0,
            status: (e.status === "COMPLETED" ? "Paid" : "Pending") as "Paid" | "Pending" | "Partial"
          };
        });
      }
      return [];
    }

    return bookings.map((b) => {
      const rev = Number(b.totalAmount) || Number(b.paidAmount) || 0;
      const paid = Number(b.paidAmount) || 0;
      
      // Calculate matching expenses for this booking
      const bookingExpenses = (expenses || [])
        .filter((exp) => exp.bookingId === b.id)
        .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

      const profit = rev - bookingExpenses;
      const margin = rev > 0 ? Math.round((profit / rev) * 100) : 0;

      let statusStr: "Paid" | "Pending" | "Partial" = "Pending";
      if (paid >= rev && rev > 0) {
        statusStr = "Paid";
      } else if (paid > 0) {
        statusStr = "Partial";
      }

      return {
        id: b.bookingNumber || b.id.slice(0, 8),
        name: b.eventTitle || b.eventType || `Booking #${b.bookingNumber || b.id.slice(0, 6)}`,
        client: b.clientName || "Client",
        date: b.eventDate ? new Date(b.eventDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Upcoming",
        revenue: rev,
        expenses: bookingExpenses,
        netProfit: profit,
        marginPercent: margin,
        status: statusStr
      };
    });
  }, [bookings, eventsList, expenses]);

  // Handle live CSV export
  const handleExportReport = () => {
    if (eventProfitData.length === 0 && grossRevenue === 0) {
      addToast("No financial records to export yet.", "info");
      return;
    }

    let csvContent = "Event ID,Event Name,Client,Date,Revenue,Expenses,Net Profit,Margin %,Status\n";
    if (eventProfitData.length > 0) {
      eventProfitData.forEach((row) => {
        csvContent += `"${row.id}","${row.name}","${row.client}","${row.date}",${row.revenue},${row.expenses},${row.netProfit},"${row.marginPercent}%","${row.status}"\n`;
      });
    } else {
      csvContent += `"OVERVIEW","Workspace Summary","All Clients","${new Date().toLocaleDateString()}",${grossRevenue},${vendorPayouts},${netProfit},"${profitMarginPercent}%","Active"\n`;
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `event_financial_analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Save to export history
    try {
      const stored = localStorage.getItem("eventos_exports_history");
      const currentHistory = stored ? JSON.parse(stored) : [];
      const newEntry = {
        id: `EXP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        generatedBy: "Workspace Admin",
        date: new Date().toISOString(),
        module: "Financial Analytics & Margins",
        format: "CSV",
        size: `${(csvContent.length / 1024).toFixed(1)} KB`,
        status: "ready"
      };
      localStorage.setItem("eventos_exports_history", JSON.stringify([newEntry, ...currentHistory]));
    } catch {}

    addToast("Exported Financial Analytics Report (CSV)", "success");
  };

  // Has any financial data at all?
  const hasFinancialActivity = grossRevenue > 0 || vendorPayouts > 0 || unpaidInvoicesList.length > 0 || eventProfitData.length > 0;

  return (
    <div className="w-full space-y-6 text-white">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-zinc-950/80 border border-purple-500/20 rounded-2xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Live Event Financial Analytics & Margins
            </h2>
            <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-[10px] rounded-full uppercase">
              Real-Time Sync
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Monitor real revenue, vendor payouts, margin health, and per-event net profitability.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Currency Switcher */}
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-0.5 text-xs font-mono">
            {(["INR", "USD", "EUR"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  currency === c
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {c === "INR" ? "₹ INR" : c === "USD" ? "$ USD" : "€ EUR"}
              </button>
            ))}
          </div>

          <Button
            type="button"
            onClick={handleExportReport}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-purple-950/40 cursor-pointer"
          >
            <Download size={14} />
            <span>Export Analytics</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid (100% Real Live Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center text-xs text-zinc-400 font-bold uppercase tracking-wider">
            <span>Total Gross Revenue</span>
            <DollarSign size={16} className="text-purple-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {formatAmount(grossRevenue)}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-400">
            <span>{kpis?.collectionRate ?? 0}% collection rate</span>
          </div>
        </div>

        {/* Vendor Expenses */}
        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-xs text-zinc-400 font-bold uppercase tracking-wider">
            <span>Production & Vendor Payouts</span>
            <Layers size={16} className="text-pink-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {formatAmount(vendorPayouts)}
          </div>
          <div className="text-[11px] text-zinc-400 font-mono">
            {grossRevenue > 0
              ? `${((vendorPayouts / grossRevenue) * 100).toFixed(1)}% of Gross Revenue`
              : `${expenses.length} logged expense entries`}
          </div>
        </div>

        {/* Net Profit Margin */}
        <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-2xl space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center text-xs text-purple-300 font-bold uppercase tracking-wider">
            <span>Net Profit Margin</span>
            <TrendingUp size={16} className="text-purple-400" />
          </div>
          <div className="text-2xl font-black font-mono text-purple-300">
            {formatAmount(netProfit)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-400">
            <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/40 rounded-md font-mono">
              {profitMarginPercent}% Margin
            </span>
            <span>{profitMarginPercent >= 0 ? "Healthy Ratio" : "Deficit"}</span>
          </div>
        </div>

        {/* Pending Receivables */}
        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-xs text-zinc-400 font-bold uppercase tracking-wider">
            <span>Unpaid Invoices</span>
            <AlertCircle size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {formatAmount(outstandingInvoices)}
          </div>
          <div className="text-[11px] text-amber-400 font-bold">
            {unpaidInvoicesList.length === 0
              ? "All invoices fully settled"
              : `${unpaidInvoicesList.length} outstanding invoice${unpaidInvoicesList.length === 1 ? "" : "s"}`}
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Chart: Monthly Revenue vs Expense Trend (8 Cols) */}
        <div className="lg:col-span-8 p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <BarChart3 size={14} />
                <span>Monthly Revenue vs. Production Expense</span>
              </h3>
              <p className="text-[10px] text-zinc-400 mt-0.5">Rolling 6-month historical cash flow</p>
            </div>
            <span className="text-xs font-mono text-zinc-400">Live Ledger</span>
          </div>

          <div className="h-64 w-full">
            {revenueTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenueLive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpensesLive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="month" stroke="#71717a" fontSize={11} />
                  <YAxis
                    stroke="#71717a"
                    fontSize={11}
                    tickFormatter={(val) => {
                      if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                      if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
                      return `₹${val}`;
                    }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#09090b", borderColor: "#3f3f46", borderRadius: "12px", fontSize: "11px" }}
                    formatter={(value: any) => [formatAmount(Number(value)), ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                  <Area type="monotone" dataKey="Revenue" name="Gross Revenue" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenueLive)" />
                  <Area type="monotone" dataKey="Expenses" name="Vendor Expenses" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorExpensesLive)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center border border-dashed border-zinc-850 rounded-xl text-zinc-500 text-xs gap-2">
                <BarChart3 size={24} className="opacity-40 text-purple-400" />
                <span>No revenue or expense trend recorded yet.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Chart: Production Expense Allocation Donut (4 Cols) */}
        <div className="lg:col-span-4 p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <PieChartIcon size={14} />
              <span>Cost Allocation Breakdown</span>
            </h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">Distribution across expense categories</p>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center">
            {expenseCategoryData.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center border border-dashed border-zinc-850 rounded-xl text-zinc-500 text-xs gap-2">
                <PieChartIcon size={24} className="opacity-40 text-purple-400" />
                <span>No expenses recorded yet.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {expenseCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#09090b", borderColor: "#3f3f46", borderRadius: "12px", fontSize: "11px" }}
                    formatter={(val: any) => [formatAmount(Number(val)), "Amount"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-1.5 text-xs">
            {expenseCategoryData.slice(0, 5).map((cat) => (
              <div key={cat.name} className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-zinc-300">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="truncate max-w-[130px]">{cat.name}</span>
                </div>
                <span className="font-mono font-bold text-white">{formatAmount(cat.value)}</span>
              </div>
            ))}
            {expenseCategoryData.length === 0 && (
              <div className="text-[10px] text-zinc-500 text-center italic py-2">
                Categories appear dynamically when expenses are logged.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Per-Event Net Profitability Table */}
      <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <ShieldCheck size={14} />
              <span>Per-Event Profitability Audit</span>
            </h3>
            <span className="text-xs text-zinc-400">
              ({eventProfitData.length} Event{eventProfitData.length === 1 ? "" : "s"} Audited)
            </span>
          </div>

          {onCreateInvoice && (
            <button
              onClick={onCreateInvoice}
              className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer transition"
            >
              <Plus size={13} />
              <span>New Invoice</span>
            </button>
          )}
        </div>

        {eventProfitData.length === 0 ? (
          <EmptyState
            variant="invoices"
            title="No Per-Event Profit Audits Yet"
            description="When you create bookings or events and log vendor expenses, each event's revenue, vendor payouts, and net profit margins will be audited here in real-time."
            primaryAction={
              onCreateInvoice
                ? {
                    label: "Create First Invoice",
                    onClick: onCreateInvoice
                  }
                : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-850 text-zinc-500 uppercase text-[9px] font-bold">
                  <th className="py-2.5 px-3">Event & Client</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Revenue</th>
                  <th className="py-2.5 px-3 text-right">Expenses</th>
                  <th className="py-2.5 px-3 text-right">Net Profit</th>
                  <th className="py-2.5 px-3 text-right">Margin %</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/80">
                {eventProfitData.map((evt) => {
                  return (
                    <tr key={evt.id} className="hover:bg-zinc-800/40 transition">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{evt.name}</div>
                        <div className="text-[10px] text-zinc-400">{evt.client} • {evt.id}</div>
                      </td>
                      <td className="py-3 px-3 text-zinc-400 font-mono text-[11px]">{evt.date}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">{formatAmount(evt.revenue)}</td>
                      <td className="py-3 px-3 text-right font-mono text-pink-400">{formatAmount(evt.expenses)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">{formatAmount(evt.netProfit)}</td>
                      <td className="py-3 px-3 text-right">
                        <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono font-bold rounded-lg text-[10px]">
                          {evt.marginPercent}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          evt.status === "Paid"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : evt.status === "Partial"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                        }`}>
                          {evt.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
