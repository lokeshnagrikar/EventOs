"use client";

import React, { useState } from "react";
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
  AlertCircle
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
import { useToastStore } from "@/lib/toastStore";

// Monthly Financial Performance Data
const MONTHLY_PERFORMANCE = [
  { month: "Jan", revenue: 2800000, expenses: 1650000, profit: 1150000 },
  { month: "Feb", revenue: 3400000, expenses: 1950000, profit: 1450000 },
  { month: "Mar", revenue: 4200000, expenses: 2400000, profit: 1800000 },
  { month: "Apr", revenue: 3900000, expenses: 2200000, profit: 1700000 },
  { month: "May", revenue: 5100000, expenses: 2900000, profit: 2200000 },
  { month: "Jun", revenue: 4850000, expenses: 2820000, profit: 2030000 }
];

// Expense Category Breakdown Data
const EXPENSE_CATEGORIES = [
  { name: "Stage & Decor", value: 987000, color: "#8b5cf6" },
  { name: "Catering & F&B", value: 789600, color: "#ec4899" },
  { name: "Sound & Concert AV", value: 564000, color: "#06b6d4" },
  { name: "Cinematography & Media", value: 282000, color: "#10b981" },
  { name: "Crew & Logistics", value: 197400, color: "#f59e0b" }
];

// Per-Event Profitability Breakdown
interface EventProfitItem {
  id: string;
  name: string;
  client: string;
  date: string;
  revenue: number;
  expenses: number;
  status: "Paid" | "Pending" | "Partial";
}

const EVENT_PROFIT_DATA: EventProfitItem[] = [
  {
    id: "EVT-101",
    name: "Royal Palace Wedding Reception",
    client: "Ananya Mehta & Kabir",
    date: "May 20, 2026",
    revenue: 1850000,
    expenses: 1020000,
    status: "Paid"
  },
  {
    id: "EVT-102",
    name: "Apex TechX Annual Gala 2026",
    client: "Apex Corp Ltd",
    date: "Jun 04, 2026",
    revenue: 1400000,
    expenses: 780000,
    status: "Paid"
  },
  {
    id: "EVT-103",
    name: "Subhub Award Night & Concert",
    client: "Subhub Media Group",
    date: "Jun 18, 2026",
    revenue: 950000,
    expenses: 590000,
    status: "Partial"
  },
  {
    id: "EVT-104",
    name: "Luxury Beachfront Cocktail",
    client: "Kapoor Family Trust",
    date: "Jul 02, 2026",
    revenue: 650000,
    expenses: 430000,
    status: "Pending"
  }
];

export function EventFinancialAnalytics() {
  const addToast = useToastStore((state) => state.addToast);
  const [currency, setCurrency] = useState<"INR" | "USD" | "EUR">("INR");
  const [timeRange, setTimeRange] = useState("H1 2026");

  const currencySymbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : "€";
  const currencyMultiplier = currency === "INR" ? 1 : currency === "USD" ? 0.012 : 0.011;

  const formatAmount = (num: number) => {
    const converted = num * currencyMultiplier;
    if (currency === "INR") {
      return `${currencySymbol}${Math.round(converted).toLocaleString("en-IN")}`;
    }
    return `${currencySymbol}${Math.round(converted).toLocaleString("en-US")}`;
  };

  const handleExportReport = () => {
    addToast("Exported Financial Analytics Report (PDF / CSV)", "success");
  };

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
            Monitor revenue, vendor payouts, margin health, and per-event net profitability.
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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center text-xs text-zinc-400 font-bold uppercase tracking-wider">
            <span>Total Gross Revenue</span>
            <DollarSign size={16} className="text-purple-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {formatAmount(4850000)}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
            <ArrowUpRight size={14} />
            <span>+18.4% vs last month</span>
          </div>
        </div>

        {/* Vendor Expenses */}
        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-xs text-zinc-400 font-bold uppercase tracking-wider">
            <span>Production & Vendor Payouts</span>
            <Layers size={16} className="text-pink-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {formatAmount(2820000)}
          </div>
          <div className="text-[11px] text-zinc-400 font-mono">
            58.1% of Gross Revenue
          </div>
        </div>

        {/* Net Profit Margin */}
        <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-2xl space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center text-xs text-purple-300 font-bold uppercase tracking-wider">
            <span>Net Profit Margin</span>
            <TrendingUp size={16} className="text-purple-400" />
          </div>
          <div className="text-2xl font-black font-mono text-purple-300">
            {formatAmount(2030000)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-400">
            <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/40 rounded-md font-mono">
              41.9% Margin
            </span>
            <span>Healthy Ratio</span>
          </div>
        </div>

        {/* Pending Receivables */}
        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-xs text-zinc-400 font-bold uppercase tracking-wider">
            <span>Unpaid Invoices</span>
            <AlertCircle size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {formatAmount(640000)}
          </div>
          <div className="text-[11px] text-amber-400 font-bold">
            3 Client Contracts Outstanding
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
              <p className="text-[10px] text-zinc-400 mt-0.5">Historical growth across H1 2026</p>
            </div>
            <span className="text-xs font-mono text-zinc-400">H1 2026</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_PERFORMANCE} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="month" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} tickFormatter={(val) => `₹${val / 100000}L`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#09090b", borderColor: "#3f3f46", borderRadius: "12px", fontSize: "11px" }}
                  formatter={(value: any) => formatAmount(Number(value))}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Area type="monotone" dataKey="revenue" name="Gross Revenue" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="expenses" name="Vendor Expenses" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart: Production Expense Allocation Donut (4 Cols) */}
        <div className="lg:col-span-4 p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
            <PieChartIcon size={14} />
            <span>Cost Allocation Breakdown</span>
          </h3>

          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={EXPENSE_CATEGORIES} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                  {EXPENSE_CATEGORIES.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#09090b", borderColor: "#3f3f46", borderRadius: "12px", fontSize: "11px" }}
                  formatter={(val: any) => formatAmount(Number(val))}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            {EXPENSE_CATEGORIES.map((cat) => (
              <div key={cat.name} className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-zinc-300">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="truncate max-w-[130px]">{cat.name}</span>
                </div>
                <span className="font-mono font-bold text-white">{formatAmount(cat.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-Event Net Profitability Table */}
      <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
            <ShieldCheck size={14} />
            <span>Per-Event Profitability Audit</span>
          </h3>
          <span className="text-xs text-zinc-400">{EVENT_PROFIT_DATA.length} Active Events Audited</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 uppercase text-[9px] font-bold">
                <th className="py-2.5 px-3">Event & Client</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Revenue</th>
                <th className="py-2.5 px-3 text-right">Expenses</th>
                <th className="py-2.5 px-3 text-right">Net Profit</th>
                <th className="py-2.5 px-3 text-right">Margin %</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {EVENT_PROFIT_DATA.map((evt) => {
                const netProfit = evt.revenue - evt.expenses;
                const marginPercent = Math.round((netProfit / evt.revenue) * 100);

                return (
                  <tr key={evt.id} className="hover:bg-zinc-800/40 transition">
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{evt.name}</div>
                      <div className="text-[10px] text-zinc-400">{evt.client} • {evt.id}</div>
                    </td>
                    <td className="py-3 px-3 text-zinc-400 font-mono text-[11px]">{evt.date}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">{formatAmount(evt.revenue)}</td>
                    <td className="py-3 px-3 text-right font-mono text-pink-400">{formatAmount(evt.expenses)}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">{formatAmount(netProfit)}</td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono font-bold rounded-lg text-[10px]">
                        {marginPercent}%
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
      </div>
    </div>
  );
}
