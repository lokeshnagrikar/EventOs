"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  Plus,
  Trash2,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  CreditCard,
  Calendar,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Inbox,
  AlertCircle,
  FileText,
  Percent,
  CheckCircle2,
  Activity,
  Layers,
  ArrowLeft,
  Printer,
  Download,
  Clock,
  ShieldCheck,
  Eye,
  RefreshCw,
  Mail,
  Bell,
  Settings,
  X,
  Sparkles,
  ChevronRight,
  QrCode,
  FileSpreadsheet,
  BookOpen,
  Users,
  Building,
  Receipt,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowRight,
  Check,
  Ban
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageShell from "@/components/ui/PageShell";
import EmptyState from "@/components/ui/EmptyState";
import { TableSkeleton, DashboardSkeleton } from "@/components/ui/skeletons";
import { useToastStore } from "@/lib/toastStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  Legend
} from "recharts";

interface Invoice {
  id: string;
  bookingId: string;
  invoiceNumber: string;
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  dueDate: string;
  status: string;
  clientName: string;
  clientEmail?: string;
  createdAt: string;
  billingAddress?: string;
  notes?: string;
}

interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  paymentMethod: string;
  transactionReference?: string;
  status: "PENDING" | "PENDING_VERIFICATION" | "COMPLETED" | "REFUNDED" | "FAILED";
  paymentDate: string;
  notes?: string;
}

interface Booking {
  id: string;
  bookingNumber: string;
  totalAmount: number;
  paidAmount: number;
  clientName?: string;
}

interface Expense {
  id: string;
  bookingId: string;
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  paymentMethod?: string;
  status: string;
}

const INVOICE_STATUSES = ["ALL", "DRAFT", "SENT", "VIEWED", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"];
const STATUS_PILLS: Record<string, string> = {
  DRAFT: "border-zinc-800 bg-zinc-800/20 text-zinc-400",
  SENT: "border-blue-500/20 bg-blue-500/5 text-blue-400",
  VIEWED: "border-cyan-500/20 bg-cyan-500/5 text-cyan-400",
  PARTIAL: "border-indigo-500/20 bg-indigo-500/5 text-indigo-400",
  PAID: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
  OVERDUE: "border-rose-500/20 bg-rose-500/5 text-rose-400",
  CANCELLED: "border-zinc-800 bg-zinc-900/10 text-zinc-600"
};

const PAYMENT_STATUS_PILLS: Record<string, string> = {
  PENDING: "border-amber-500/20 bg-amber-500/5 text-amber-400",
  PENDING_VERIFICATION: "border-yellow-500/20 bg-yellow-500/5 text-yellow-400",
  COMPLETED: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
  REFUNDED: "border-purple-500/20 bg-purple-500/5 text-purple-400",
  FAILED: "border-red-500/20 bg-red-500/5 text-red-400"
};

export default function FinanceWorkspace({ defaultTab = "dashboard" }: { defaultTab?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const { completeStep } = useOnboardingStore();
  const [activeTab, setActiveTab] = useState(defaultTab);

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [cashFlowPeriod, setCashFlowPeriod] = useState<"week" | "month" | "quarter" | "year">("month");

  // Modal forms
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [errorText, setErrorText] = useState("");

  // Invoice Form State
  const [invBookingId, setInvBookingId] = useState("");
  const [invClientName, setInvClientName] = useState("");
  const [invClientEmail, setInvClientEmail] = useState("");
  const [invSubtotal, setInvSubtotal] = useState("");
  const [invTax, setInvTax] = useState("18");
  const [invDiscount, setInvDiscount] = useState("0");
  const [invDueDate, setInvDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16));
  const [invBilling, setInvBilling] = useState("");
  const [invNotes, setInvNotes] = useState("");

  // Payment Form State
  const [payBookingId, setPayBookingId] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("UPI");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 16));

  // Expense Form State
  const [expCategory, setExpCategory] = useState("MISCELLANEOUS");
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expMethod, setExpMethod] = useState("UPI");
  const [expStatus, setExpStatus] = useState("PAID");

  // 1. Fetch Invoices
  const { data: invoicesResponse, isLoading: invoicesLoading } = useQuery<{ data: Invoice[] }>({
    queryKey: ["invoices"],
    queryFn: async () => {
      const res = await api.get("/events/invoices");
      return res.data;
    }
  });
  const invoices = useMemo(() => invoicesResponse?.data || [], [invoicesResponse]);

  // 2. Fetch Payments
  const { data: paymentsResponse, isLoading: paymentsLoading } = useQuery<{ data: Payment[] }>({
    queryKey: ["payments"],
    queryFn: async () => {
      const res = await api.get("/events/payments");
      return res.data;
    }
  });
  const payments = useMemo(() => paymentsResponse?.data || [], [paymentsResponse]);

  // 3. Fetch Bookings
  const { data: bookingsResponse, isLoading: bookingsLoading } = useQuery<{ data: Booking[] }>({
    queryKey: ["bookings"],
    queryFn: async () => {
      const res = await api.get("/events/bookings");
      return res.data;
    }
  });
  const bookings = useMemo(() => bookingsResponse?.data || [], [bookingsResponse]);

  // 4. Fetch Selected Booking Expenses
  const { data: expensesResponse, isLoading: expensesLoading } = useQuery<{ data: Expense[] }>({
    queryKey: ["expenses", selectedBookingId],
    queryFn: async () => {
      if (!selectedBookingId) return { data: [] };
      const res = await api.get(`/bookings/${selectedBookingId}/budget/expenses`);
      return res.data;
    },
    enabled: !!selectedBookingId
  });
  const expenses = useMemo(() => expensesResponse?.data || [], [expensesResponse]);

  // Set initial selected booking once loaded
  useEffect(() => {
    if (bookings.length > 0 && !selectedBookingId) {
      setSelectedBookingId(bookings[0].id);
    }
  }, [bookings, selectedBookingId]);

  // Mutations
  const createInvoiceMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/events/invoices", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setIsInvoiceModalOpen(false);
      resetInvoiceForm();
      addToast("Invoice generated and queued successfully", "success");
      completeStep("generate_invoice");
    },
    onError: (err: any) => {
      setErrorText(err.response?.data?.error?.message || "Failed to create invoice.");
    }
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/events/payments", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setIsPaymentModalOpen(false);
      setIsSuccessOpen(true);
      resetPaymentForm();
    },
    onError: (err: any) => {
      setErrorText(err.response?.data?.error?.message || "Failed to log payment.");
    }
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post(`/bookings/${selectedBookingId}/budget/expenses`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", selectedBookingId] });
      setIsExpenseModalOpen(false);
      resetExpenseForm();
      addToast("Expense logged to budget ledger", "success");
    },
    onError: (err: any) => {
      setErrorText(err.response?.data?.error?.message || "Failed to log expense.");
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const res = await api.delete(`/bookings/${selectedBookingId}/budget/expenses/${expenseId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", selectedBookingId] });
      addToast("Expense entry removed", "success");
    }
  });

  // Reset forms
  const resetInvoiceForm = () => {
    setInvBookingId(""); setInvClientName(""); setInvClientEmail(""); setInvSubtotal(""); setInvTax("18"); setInvDiscount("0"); setInvBilling(""); setInvNotes(""); setErrorText("");
  };

  const resetPaymentForm = () => {
    setPayBookingId(""); setPayAmount(""); setPayMethod("UPI"); setPayRef(""); setPayNotes(""); setPayDate(new Date().toISOString().slice(0, 16)); setErrorText("");
  };

  const resetExpenseForm = () => {
    setExpCategory("MISCELLANEOUS"); setExpDesc(""); setExpAmount(""); setExpMethod("UPI"); setExpStatus("PAID"); setErrorText("");
  };

  const handleInvoiceBookingChange = (id: string) => {
    setInvBookingId(id);
    const selected = bookings.find((b) => b.id === id);
    if (selected) {
      const remaining = Math.max(0, selected.totalAmount - selected.paidAmount);
      setInvSubtotal(remaining.toString());
      setInvClientName(selected.clientName || `Client for Booking ${selected.bookingNumber}`);
    }
  };

  // ═══════════════════════════════════════════════
  // KPI calculations
  // ═══════════════════════════════════════════════
  const kpis = useMemo(() => {
    const activeInvoices = invoices.filter((i) => i.status !== "CANCELLED");
    const totalInvoiced = activeInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const paidInvoicesVolume = invoices
      .filter((i) => i.status === "PAID")
      .reduce((sum, i) => sum + i.totalAmount, 0);

    const outstanding = Math.max(0, totalInvoiced - paidInvoicesVolume);
    const paidInvoicesCount = invoices.filter((i) => i.status === "PAID").length;
    const overdueCount = invoices.filter((i) => i.status === "OVERDUE").length;
    const collectionRate = totalInvoiced > 0 ? Math.round((paidInvoicesVolume / totalInvoiced) * 100) : 100;

    const now = new Date();
    const todayStr = now.toDateString();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    let revenueToday = 0;
    let revenueWeek = 0;
    let revenueMonth = 0;
    let revenueYear = 0;
    let refundedAmount = 0;

    payments.forEach((p) => {
      if (p.status === "REFUNDED") {
        refundedAmount += p.amount;
        return;
      }
      if (p.status !== "COMPLETED") return;
      const pDate = new Date(p.paymentDate);
      if (pDate.toDateString() === todayStr) revenueToday += p.amount;
      if (pDate >= oneWeekAgo) revenueWeek += p.amount;
      if (pDate.getMonth() === thisMonth && pDate.getFullYear() === thisYear) revenueMonth += p.amount;
      if (pDate.getFullYear() === thisYear) revenueYear += p.amount;
    });

    // Simulated expenses total (from logged expenses or estimated)
    const estimatedExpenses = 335000;
    const netProfit = paidInvoicesVolume - estimatedExpenses;
    const profitMargin = paidInvoicesVolume > 0 ? Math.round((netProfit / paidInvoicesVolume) * 100) : 0;

    return {
      revenueToday, revenueWeek, revenueMonth, revenueYear,
      outstanding, paidInvoicesVolume, paidInvoicesCount, overdueCount,
      collectionRate, refundedAmount, totalInvoiced, estimatedExpenses,
      netProfit, profitMargin
    };
  }, [invoices, payments]);

  // ═══════════════════════════════════════════════
  // Chart Data
  // ═══════════════════════════════════════════════
  const revenueTrendData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const ledger: Record<string, { month: string; Revenue: number; Expenses: number; Profit: number }> = {};
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const key = `${m.getFullYear()}-${m.getMonth()}`;
      ledger[key] = { month: monthNames[m.getMonth()], Revenue: 0, Expenses: 0, Profit: 0 };
    }

    payments.forEach((p) => {
      if (p.status !== "COMPLETED") return;
      const pDate = new Date(p.paymentDate);
      const key = `${pDate.getFullYear()}-${pDate.getMonth()}`;
      if (ledger[key]) ledger[key].Revenue += p.amount;
    });

    // Simulated expense distribution
    Object.values(ledger).forEach((entry) => {
      entry.Expenses = Math.round(entry.Revenue * 0.35);
      entry.Profit = entry.Revenue - entry.Expenses;
    });

    return Object.values(ledger);
  }, [payments]);

  const expenseCategoryData = useMemo(() => {
    if (!expenses.length) {
      return [
        { name: "Venue", value: 120000, color: "#a855f7" },
        { name: "Catering", value: 180000, color: "#ec4899" },
        { name: "Decor", value: 90000, color: "#3b82f6" },
        { name: "Photography", value: 65000, color: "#10b981" },
        { name: "Marketing", value: 35000, color: "#f59e0b" }
      ];
    }
    const categories: Record<string, number> = {};
    expenses.forEach((e) => {
      categories[e.category] = (categories[e.category] || 0) + e.amount;
    });
    const colors = ["#a855f7", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
    return Object.entries(categories).map(([name, value], i) => ({
      name: name.charAt(0) + name.slice(1).toLowerCase(),
      value,
      color: colors[i % colors.length]
    }));
  }, [expenses]);

  const paymentMethodData = useMemo(() => {
    const methods: Record<string, number> = {};
    payments.filter(p => p.status === "COMPLETED").forEach(p => {
      methods[p.paymentMethod] = (methods[p.paymentMethod] || 0) + p.amount;
    });
    const colors = ["#a855f7", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
    return Object.entries(methods).map(([name, value], i) => ({
      name: name.replace("_", " "),
      value,
      color: colors[i % colors.length]
    }));
  }, [payments]);

  // Filters
  const filteredInvoices = useMemo(() => {
    return invoices.filter((i) => {
      const matchSearch = i.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) || i.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "ALL" || i.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch = (p.transactionReference || "").toLowerCase().includes(searchQuery.toLowerCase()) || (p.notes || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchMethod = methodFilter === "ALL" || p.paymentMethod === methodFilter;
      return matchSearch && matchMethod;
    });
  }, [payments, searchQuery, methodFilter]);

  // Tax calculations
  const taxSummary = useMemo(() => {
    const cgst = kpis.paidInvoicesVolume * 0.09;
    const sgst = kpis.paidInvoicesVolume * 0.09;
    const igst = 0;
    const totalTax = cgst + sgst + igst;
    return { cgst, sgst, igst, totalTax };
  }, [kpis.paidInvoicesVolume]);

  const isLoading = invoicesLoading || paymentsLoading || bookingsLoading;

  if (isLoading) {
    return (
      <PageShell title="Finance & Accounting" subtitle="Monitor event reservation ledgers, payment progress, and contract milestones.">
        {activeTab === "dashboard" || activeTab === "cashflow" || activeTab === "reports" ? <DashboardSkeleton /> : <TableSkeleton />}
      </PageShell>
    );
  }

  const TABS = [
    { key: "dashboard", label: "Overview", icon: Wallet },
    { key: "cashflow", label: "Cash Flow", icon: BarChart3 },
    { key: "invoices", label: "Invoices", icon: FileSpreadsheet },
    { key: "payments", label: "Payments", icon: Coins },
    { key: "expenses", label: "Expenses", icon: CreditCard },
    { key: "ledger", label: "Ledger", icon: BookOpen },
    { key: "vendorpay", label: "Vendor Payouts", icon: Building },
    { key: "tax", label: "Tax & GST", icon: Percent },
    { key: "reports", label: "P&L Reports", icon: TrendingUp },
    { key: "automation", label: "Automation", icon: Settings }
  ];

  return (
    <PageShell
      title="Finance & Accounting Hub"
      subtitle="Monitor event reservation ledgers, payment progress, and contract milestones."
    >
      {/* Global Finance Tab Selection */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-850 pb-4 select-none">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSearchQuery(""); }}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                  isActive
                    ? "bg-purple-600/10 text-purple-400 border border-purple-550/20"
                    : "text-zinc-500 hover:text-zinc-300 border border-transparent hover:bg-zinc-900/40"
                )}
              >
                <Icon size={12} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full max-w-xs">
          <Search size={13} className="absolute left-3 top-2.5 text-zinc-550" />
          <input
            type="text"
            placeholder="Search invoice, client, reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-950/40 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-purple-650 transition-all font-semibold"
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* TAB 1: FINANCIAL OVERVIEW DASHBOARD             */}
      {/* ═══════════════════════════════════════════════ */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Top KPI Grid: 4 primary metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FinanceKpiCard title="Monthly Revenue" value={kpis.revenueMonth} icon={Coins} trend={{ value: 14, isPositive: true }} accent="from-purple-500 to-indigo-500" sparkData={[40, 50, 48, 65, kpis.revenueMonth / 1000]} />
            <FinanceKpiCard title="Outstanding Balance" value={kpis.outstanding} icon={DollarSign} trend={{ value: 2.4, isPositive: false }} accent="from-amber-500 to-yellow-500" sparkData={[30, 28, 32, 29, kpis.outstanding / 1000]} />
            <FinanceKpiCard title="Net Profit" value={kpis.netProfit} icon={TrendingUp} trend={{ value: kpis.profitMargin, isPositive: kpis.netProfit > 0 }} accent="from-emerald-500 to-teal-500" sparkData={[20, 25, 22, 30, kpis.netProfit / 1000]} />
            <FinanceKpiCard title="Overdue Invoices" value={kpis.overdueCount} icon={AlertCircle} trend={{ value: 0, isPositive: true }} accent="from-red-500 to-orange-500" sparkData={[1, 0, 2, 0, kpis.overdueCount]} isCount />
          </div>

          {/* Secondary KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Revenue Today", value: `₹${kpis.revenueToday.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-400" },
              { label: "Revenue This Week", value: `₹${kpis.revenueWeek.toLocaleString()}`, icon: Coins, color: "text-purple-400" },
              { label: "Annual Revenue", value: `₹${kpis.revenueYear.toLocaleString()}`, icon: BarChart3, color: "text-blue-400" },
              { label: "Collection Rate", value: `${kpis.collectionRate}%`, icon: CheckCircle2, color: "text-cyan-400" },
              { label: "Refunds Issued", value: `₹${kpis.refundedAmount.toLocaleString()}`, icon: RefreshCw, color: "text-rose-400" },
              { label: "Avg Payment Time", value: "4.8 Days", icon: Clock, color: "text-zinc-400" }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="p-3.5 border border-zinc-850 bg-[#121214]/40 rounded-2xl flex items-center justify-between hover:border-zinc-700 transition">
                  <div>
                    <span className="text-[9px] text-zinc-550 uppercase font-black tracking-wider block">{item.label}</span>
                    <span className="text-sm font-black text-zinc-200 mt-0.5 block">{item.value}</span>
                  </div>
                  <Icon size={14} className={item.color} />
                </div>
              );
            })}
          </div>

          {/* Charts Grid: Revenue + Expense Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-5 border border-zinc-850 bg-[#121214]/30 backdrop-blur rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-350">Income & Revenue Trend</h3>
                <span className="text-[10px] text-zinc-500 font-bold">Past 6 Months</span>
              </div>
              <div className="h-56 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="month" stroke="#71717a" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#71717a" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", color: "#f4f4f5", fontSize: 11 }} />
                    <Area type="monotone" dataKey="Revenue" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#revenueGrad)" />
                    <Area type="monotone" dataKey="Profit" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#profitGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-1 p-5 border border-zinc-850 bg-[#121214]/30 backdrop-blur rounded-2xl space-y-4 flex flex-col justify-between">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-350">Expenses by Category</h3>
              <div className="h-44 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expenseCategoryData} cx="50%" cy="50%" innerRadius={48} outerRadius={68} paddingAngle={4} dataKey="value">
                      {expenseCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {expenseCategoryData.slice(0, 5).map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-zinc-400 truncate">{entry.name} (₹{Math.round(entry.value/1000)}k)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Payments + Outstanding Invoices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 border border-zinc-850 bg-[#121214]/20 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-350">Recent Transactions</h3>
                <button onClick={() => setActiveTab("payments")} className="text-[10px] text-purple-400 hover:underline cursor-pointer">View All</button>
              </div>
              <div className="space-y-3">
                {payments.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex justify-between items-center p-3 bg-zinc-900/30 border border-zinc-850 rounded-xl hover:bg-zinc-900/50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <Coins size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-200">Ref: {p.transactionReference || "N/A"}</p>
                        <p className="text-[10px] text-zinc-500">{new Date(p.paymentDate).toLocaleDateString()} • {p.paymentMethod}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-black text-emerald-400 block">₹{p.amount.toLocaleString()}</span>
                      <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded border inline-block mt-0.5", PAYMENT_STATUS_PILLS[p.status] || "border-zinc-800 text-zinc-500")}>{p.status}</span>
                    </div>
                  </div>
                ))}
                {payments.length === 0 && <p className="text-xs text-zinc-550 text-center py-6">No transactions recorded.</p>}
              </div>
            </div>

            <div className="p-5 border border-zinc-850 bg-[#121214]/20 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-350">Outstanding Invoices</h3>
                <button onClick={() => setActiveTab("invoices")} className="text-[10px] text-purple-400 hover:underline cursor-pointer">View All</button>
              </div>
              <div className="space-y-3">
                {invoices.filter((i) => i.status !== "PAID" && i.status !== "CANCELLED").slice(0, 5).map((inv) => {
                  const pillClass = STATUS_PILLS[inv.status] || "border-zinc-800 text-zinc-400";
                  return (
                    <div key={inv.id} className="flex justify-between items-center p-3 bg-zinc-900/30 border border-zinc-850 rounded-xl hover:bg-zinc-900/50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-zinc-950 flex items-center justify-center text-zinc-450 border border-zinc-850">
                          <FileText size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-200">{inv.clientName}</p>
                          <p className="text-[10px] text-zinc-500">Due: {new Date(inv.dueDate).toLocaleDateString()} • {inv.invoiceNumber}</p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-mono text-xs font-black text-zinc-250">₹{inv.totalAmount.toLocaleString()}</p>
                        <span className={cn("px-2 py-0.5 border rounded-full text-[8px] font-black uppercase inline-block", pillClass)}>{inv.status}</span>
                      </div>
                    </div>
                  );
                })}
                {invoices.length === 0 && <p className="text-xs text-zinc-550 text-center py-6">No outstanding invoices.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* TAB 2: CASH FLOW DASHBOARD                      */}
      {/* ═══════════════════════════════════════════════ */}
      {activeTab === "cashflow" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-350">Cash Flow Analysis</h3>
            <div className="flex bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg">
              {(["week", "month", "quarter", "year"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setCashFlowPeriod(p)}
                  className={cn("px-2.5 py-1 text-[9px] font-black rounded-md uppercase tracking-wider transition-all cursor-pointer", cashFlowPeriod === p ? "bg-zinc-800 text-purple-400" : "text-zinc-500 hover:text-zinc-300")}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Income vs Expense bar chart */}
          <div className="p-5 border border-zinc-850 bg-[#121214]/30 backdrop-blur rounded-2xl space-y-4">
            <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider">Revenue vs Expenses</h4>
            <div className="h-64 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="month" stroke="#71717a" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#71717a" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", color: "#f4f4f5", fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10, color: "#71717a" }} />
                  <Bar dataKey="Revenue" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Profit Trend + Payment Methods */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 border border-zinc-850 bg-[#121214]/30 backdrop-blur rounded-2xl space-y-4">
              <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider">Profit Trend</h4>
              <div className="h-48 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="month" stroke="#71717a" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#71717a" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", fontSize: 11 }} />
                    <Line type="monotone" dataKey="Profit" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: "#10b981" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-5 border border-zinc-850 bg-[#121214]/30 backdrop-blur rounded-2xl space-y-4 flex flex-col justify-between">
              <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider">Payment Methods Distribution</h4>
              <div className="h-44 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentMethodData} cx="50%" cy="50%" innerRadius={42} outerRadius={64} paddingAngle={4} dataKey="value">
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={`method-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {paymentMethodData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-zinc-400 truncate">{entry.name} (₹{Math.round(entry.value/1000)}k)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* TAB 3: INVOICE MANAGER                          */}
      {/* ═══════════════════════════════════════════════ */}
      {activeTab === "invoices" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-850 pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative max-w-xs flex-1">
                <Search size={13} className="absolute left-3 top-2.5 text-zinc-550" />
                <input type="text" placeholder="Search invoices..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-[#121214]/60 border border-zinc-800 focus:border-purple-650 rounded-lg text-xs text-white focus:outline-none transition-colors w-64" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-xs focus:outline-none font-bold">
                <option value="ALL">All Statuses</option>
                {INVOICE_STATUSES.filter(s => s !== "ALL").map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={() => { resetInvoiceForm(); setIsInvoiceModalOpen(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer">
              <Plus size={13} /> Generate Invoice
            </button>
          </div>

          <div className="overflow-x-auto border border-zinc-850 bg-[#121214]/20 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-850 bg-zinc-950/20 text-zinc-550 font-black uppercase text-[8.5px] tracking-wider select-none">
                  <th className="p-4">Invoice No</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Linked Booking</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Grand Total</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/40 text-zinc-350">
                {filteredInvoices.map((inv) => {
                  const statusClass = STATUS_PILLS[inv.status] || "border-zinc-800 text-zinc-400";
                  const bookingNum = bookings.find((b) => b.id === inv.bookingId)?.bookingNumber || "Unassigned";
                  return (
                    <tr key={inv.id} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="p-4 font-mono font-bold text-zinc-400">{inv.invoiceNumber}</td>
                      <td className="p-4 font-extrabold text-zinc-200">{inv.clientName}</td>
                      <td className="p-4 font-mono">{bookingNum}</td>
                      <td className="p-4">{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td className="p-4"><span className={cn("px-2.5 py-0.5 border rounded-full text-[8.5px] font-black uppercase", statusClass)}>{inv.status}</span></td>
                      <td className="p-4 font-mono font-black text-emerald-450">₹{inv.totalAmount.toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => router.push(`/invoices/${inv.id}`)} className="text-purple-400 hover:text-purple-300 font-bold inline-flex items-center gap-0.5 hover:underline cursor-pointer">
                          View <ArrowUpRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredInvoices.length === 0 && (
              <div className="p-16 text-center space-y-2 border-t border-zinc-850">
                <Inbox className="h-8 w-8 mx-auto text-zinc-650" />
                <p className="text-xs text-zinc-450 font-bold">No invoices found matching current filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* TAB 4: PAYMENTS LEDGER                          */}
      {/* ═══════════════════════════════════════════════ */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-850 pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative max-w-xs flex-1">
                <Search size={13} className="absolute left-3 top-2.5 text-zinc-550" />
                <input type="text" placeholder="Search transaction reference..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-[#121214]/60 border border-zinc-800 focus:border-purple-650 rounded-lg text-xs text-white focus:outline-none transition-colors w-64" />
              </div>
              <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-xs focus:outline-none font-bold">
                <option value="ALL">All Payment Methods</option>
                {["UPI", "CASH", "CARD", "BANK_TRANSFER", "CHEQUE"].map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
              </select>
            </div>
            <button onClick={() => { resetPaymentForm(); setIsPaymentModalOpen(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer">
              <Plus size={13} /> Record Payment
            </button>
          </div>

          {/* Payment Timeline Visualizer */}
          <div className="p-5 border border-zinc-850 bg-[#121214]/20 rounded-2xl space-y-4">
            <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider">Payment Timeline</h4>
            <div className="relative pl-5 border-l border-zinc-800 space-y-4">
              {filteredPayments.slice(0, 8).map((p) => (
                <div key={p.id} className="relative">
                  <div className={cn("absolute -left-[23px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-[#0c0c0e]",
                    p.status === "COMPLETED" ? "bg-emerald-500" : p.status === "REFUNDED" ? "bg-purple-500" : p.status === "FAILED" ? "bg-red-500" : "bg-amber-500"
                  )} />
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-zinc-200">₹{p.amount.toLocaleString()} via {p.paymentMethod.replace("_", " ")}</span>
                      <span className="text-[10px] text-zinc-500 block">Ref: {p.transactionReference || "N/A"} • {new Date(p.paymentDate).toLocaleString()}</span>
                    </div>
                    <span className={cn("text-[8px] font-bold px-2 py-0.5 rounded border", PAYMENT_STATUS_PILLS[p.status] || "border-zinc-800 text-zinc-500")}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payments table */}
          <div className="overflow-x-auto border border-zinc-850 bg-[#121214]/20 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-850 bg-zinc-950/20 text-zinc-550 font-black uppercase text-[8.5px] tracking-wider">
                  <th className="p-4">Transaction ID</th>
                  <th className="p-4">Linked Booking</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Reference No</th>
                  <th className="p-4">Paid Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/40 text-zinc-350">
                {filteredPayments.map((p) => {
                  const bookingNum = bookings.find((b) => b.id === p.bookingId)?.bookingNumber || "Unassigned";
                  return (
                    <tr key={p.id} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="p-4 font-mono text-zinc-400">{p.id.substring(0, 13)}</td>
                      <td className="p-4 font-bold text-zinc-200">Booking {bookingNum}</td>
                      <td className="p-4 font-bold text-zinc-400">{p.paymentMethod.replace("_", " ")}</td>
                      <td className="p-4 font-mono text-zinc-300">{p.transactionReference || "N/A"}</td>
                      <td className="p-4">{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={cn("px-2 py-0.5 border rounded-full text-[8.5px] font-black uppercase", PAYMENT_STATUS_PILLS[p.status] || "border-zinc-800 text-zinc-400")}>{p.status}</span>
                      </td>
                      <td className="p-4 text-right font-mono font-black text-emerald-450">₹{p.amount.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredPayments.length === 0 && (
              <div className="p-16 text-center space-y-2 border-t border-zinc-850">
                <Inbox className="h-8 w-8 mx-auto text-zinc-650" />
                <p className="text-xs text-zinc-450 font-bold">No payments transaction logged.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* TAB 5: EXPENSES TRACKER                         */}
      {/* ═══════════════════════════════════════════════ */}
      {activeTab === "expenses" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-850 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-zinc-400">Budget Context:</span>
              <select value={selectedBookingId} onChange={(e) => setSelectedBookingId(e.target.value)}
                className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-xs focus:outline-none font-bold">
                {bookings.map((b) => <option key={b.id} value={b.id}>{b.bookingNumber} (₹{b.totalAmount.toLocaleString()})</option>)}
              </select>
            </div>
            <button onClick={() => { resetExpenseForm(); setIsExpenseModalOpen(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer">
              <Plus size={13} /> Log Expense
            </button>
          </div>

          <div className="overflow-x-auto border border-zinc-850 bg-[#121214]/20 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-850 bg-zinc-950/20 text-zinc-550 font-black uppercase text-[8.5px] tracking-wider">
                  <th className="p-4">Category</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Logged Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/40 text-zinc-350">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-zinc-900/10 transition-colors">
                    <td className="p-4 font-bold text-zinc-200">{e.category}</td>
                    <td className="p-4 text-zinc-300">{e.description}</td>
                    <td className="p-4 font-medium text-zinc-400">{e.paymentMethod || "N/A"}</td>
                    <td className="p-4">{new Date(e.expenseDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={cn("px-2 py-0.5 border rounded-full text-[8.5px] font-black uppercase",
                        e.status === "PAID" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-450" : "border-amber-500/20 bg-amber-500/5 text-amber-500"
                      )}>{e.status}</span>
                    </td>
                    <td className="p-4 font-mono font-black text-rose-400">₹{e.amount.toLocaleString()}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => deleteExpenseMutation.mutate(e.id)}
                        className="p-1 text-zinc-550 hover:text-red-500 rounded bg-zinc-950/20 hover:bg-red-500/10 transition-colors cursor-pointer">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expenses.length === 0 && (
              <div className="p-16 text-center space-y-2 border-t border-zinc-850">
                <Inbox className="h-8 w-8 mx-auto text-zinc-650" />
                <p className="text-xs text-zinc-450 font-bold">No expenses logged for this booking budget.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* TAB 6: ACCOUNTING LEDGER                        */}
      {/* ═══════════════════════════════════════════════ */}
      {activeTab === "ledger" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-zinc-850 pb-4">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-350">General Accounting Ledger</h3>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 rounded-xl text-[10px] font-bold cursor-pointer">
                <Download size={12} /> Export CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-zinc-850 bg-[#121214]/20 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-850 bg-zinc-950/20 text-zinc-550 font-black uppercase text-[8.5px] tracking-wider">
                  <th className="p-4">Date</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Reference</th>
                  <th className="p-4 text-right">Debit</th>
                  <th className="p-4 text-right">Credit</th>
                  <th className="p-4 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/40 text-zinc-350">
                {/* Opening Balance */}
                <tr className="bg-zinc-950/30">
                  <td className="p-4 font-mono text-zinc-500">01 Jan 2026</td>
                  <td className="p-4 font-bold text-zinc-200">Opening Balance — FY 2026-27</td>
                  <td className="p-4"><span className="px-2 py-0.5 border border-blue-500/20 bg-blue-500/5 text-blue-400 rounded text-[8px] font-bold">OPENING</span></td>
                  <td className="p-4 font-mono text-zinc-500">SYS-INIT</td>
                  <td className="p-4 text-right font-mono">—</td>
                  <td className="p-4 text-right font-mono">—</td>
                  <td className="p-4 text-right font-mono font-black text-zinc-200">₹0</td>
                </tr>
                {/* Generate from payments */}
                {payments.filter(p => p.status === "COMPLETED").slice(0, 10).map((p, idx) => {
                  const runningBalance = payments.filter(pp => pp.status === "COMPLETED").slice(0, idx + 1).reduce((sum, pp) => sum + pp.amount, 0);
                  return (
                    <tr key={p.id} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="p-4 font-mono text-zinc-500">{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td className="p-4 font-semibold text-zinc-300">Payment via {p.paymentMethod.replace("_", " ")}</td>
                      <td className="p-4"><span className="px-2 py-0.5 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 rounded text-[8px] font-bold">INCOME</span></td>
                      <td className="p-4 font-mono text-zinc-500">{p.transactionReference || p.id.substring(0, 8)}</td>
                      <td className="p-4 text-right font-mono">—</td>
                      <td className="p-4 text-right font-mono text-emerald-400">₹{p.amount.toLocaleString()}</td>
                      <td className="p-4 text-right font-mono font-black text-zinc-200">₹{runningBalance.toLocaleString()}</td>
                    </tr>
                  );
                })}
                {/* Closing Balance */}
                <tr className="bg-zinc-950/30">
                  <td className="p-4 font-mono text-zinc-500">Today</td>
                  <td className="p-4 font-bold text-zinc-200">Closing Balance</td>
                  <td className="p-4"><span className="px-2 py-0.5 border border-purple-500/20 bg-purple-500/5 text-purple-400 rounded text-[8px] font-bold">CLOSING</span></td>
                  <td className="p-4 font-mono text-zinc-500">—</td>
                  <td className="p-4 text-right font-mono">—</td>
                  <td className="p-4 text-right font-mono">—</td>
                  <td className="p-4 text-right font-mono font-black text-emerald-400">₹{kpis.paidInvoicesVolume.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* TAB 7: VENDOR PAYOUTS                           */}
      {/* ═══════════════════════════════════════════════ */}
      {activeTab === "vendorpay" && (
        <div className="space-y-6">
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-350 border-b border-zinc-850 pb-4">Vendor Payout Management</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { vendor: "Royal Florals", category: "Decor", amount: 120000, status: "COMPLETED", method: "BANK_TRANSFER" },
              { vendor: "Gourmet Catering", category: "Catering", amount: 180000, status: "COMPLETED", method: "UPI" },
              { vendor: "Starlight Beats", category: "Music", amount: 50000, status: "PENDING", method: "UPI" },
              { vendor: "Snap Studios", category: "Photography", amount: 85000, status: "SCHEDULED", method: "BANK_TRANSFER" },
              { vendor: "Royal Transport", category: "Logistics", amount: 35000, status: "COMPLETED", method: "CASH" },
              { vendor: "MakeupPro Studio", category: "Beauty", amount: 25000, status: "PENDING", method: "UPI" }
            ].map((vp) => (
              <div key={vp.vendor} className="p-4 border border-zinc-850 bg-[#161618]/30 rounded-2xl space-y-3 hover:border-zinc-700 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-extrabold text-zinc-200 text-xs block">{vp.vendor}</span>
                    <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider block mt-0.5">{vp.category}</span>
                  </div>
                  <span className={cn("text-[8px] font-bold px-2 py-0.5 rounded-full border uppercase",
                    vp.status === "COMPLETED" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" :
                    vp.status === "SCHEDULED" ? "border-blue-500/20 bg-blue-500/5 text-blue-400" :
                    "border-amber-500/20 bg-amber-500/5 text-amber-400"
                  )}>{vp.status}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-zinc-900/60">
                  <span className="font-mono text-sm font-black text-zinc-200">₹{vp.amount.toLocaleString()}</span>
                  <span className="text-[9px] text-zinc-500 font-bold">{vp.method.replace("_", " ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* TAB 8: TAX & GST                                */}
      {/* ═══════════════════════════════════════════════ */}
      {activeTab === "tax" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 bg-zinc-900/30 border border-zinc-850 rounded-2xl space-y-1">
              <span className="text-[10px] text-zinc-550 font-black uppercase">CGST (9%)</span>
              <p className="text-xl font-mono font-black text-zinc-200">₹{taxSummary.cgst.toLocaleString()}</p>
              <p className="text-[9px] text-zinc-500">Central Goods & Services</p>
            </div>
            <div className="p-5 bg-zinc-900/30 border border-zinc-850 rounded-2xl space-y-1">
              <span className="text-[10px] text-zinc-550 font-black uppercase">SGST (9%)</span>
              <p className="text-xl font-mono font-black text-zinc-200">₹{taxSummary.sgst.toLocaleString()}</p>
              <p className="text-[9px] text-zinc-500">State Goods & Services</p>
            </div>
            <div className="p-5 bg-zinc-900/30 border border-zinc-850 rounded-2xl space-y-1">
              <span className="text-[10px] text-zinc-550 font-black uppercase">IGST</span>
              <p className="text-xl font-mono font-black text-zinc-200">₹{taxSummary.igst.toLocaleString()}</p>
              <p className="text-[9px] text-zinc-500">Inter-State (Not Applicable)</p>
            </div>
            <div className="p-5 bg-zinc-900/30 border border-zinc-850 rounded-2xl space-y-1">
              <span className="text-[10px] text-zinc-550 font-black uppercase">Total GST Liability</span>
              <p className="text-xl font-mono font-black text-purple-400">₹{taxSummary.totalTax.toLocaleString()}</p>
              <p className="text-[9px] text-zinc-500">Accumulated tax from settled invoices</p>
            </div>
          </div>

          <div className="p-6 bg-[#121214]/20 border border-zinc-850 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-350">GST Compliance Audit Table</h3>
              <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 rounded-xl text-[10px] font-bold cursor-pointer">
                <Download size={12} /> Export Tax Report
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-850 text-zinc-550 font-black uppercase text-[8.5px] tracking-wider">
                    <th className="pb-3">Transaction</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Billed State</th>
                    <th className="pb-3 text-right">Taxable Value</th>
                    <th className="pb-3 text-right">CGST (9%)</th>
                    <th className="pb-3 text-right">SGST (9%)</th>
                    <th className="pb-3 text-right">Total GST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/40 text-zinc-350">
                  {invoices.filter((i) => i.status === "PAID").slice(0, 8).map((inv) => {
                    const taxable = inv.subtotal;
                    const cgstAmt = taxable * 0.09;
                    const sgstAmt = taxable * 0.09;
                    return (
                      <tr key={inv.id}>
                        <td className="py-3 font-mono font-bold text-zinc-400">{inv.invoiceNumber}</td>
                        <td className="py-3 font-semibold text-zinc-300">Intra-State GST</td>
                        <td className="py-3">Delhi NCR</td>
                        <td className="py-3 text-right font-mono">₹{taxable.toLocaleString()}</td>
                        <td className="py-3 text-right font-mono text-zinc-400">₹{cgstAmt.toLocaleString()}</td>
                        <td className="py-3 text-right font-mono text-zinc-400">₹{sgstAmt.toLocaleString()}</td>
                        <td className="py-3 text-right font-mono font-black text-emerald-450">₹{(cgstAmt + sgstAmt).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* TAB 9: P&L FINANCIAL REPORTS                    */}
      {/* ═══════════════════════════════════════════════ */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-zinc-850 pb-4">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-350">Company Ledger Balance Sheet</h3>
            <div className="flex gap-2 text-xs">
              <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 rounded-xl text-[10px] font-bold cursor-pointer">
                <Download size={12} /> Export Excel
              </button>
              <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 rounded-xl text-[10px] font-bold cursor-pointer">
                <Printer size={12} /> Print PDF
              </button>
            </div>
          </div>

          <div className="p-6 bg-[#121214]/20 border border-zinc-850 rounded-3xl space-y-6">
            <div className="border-b border-zinc-850 pb-4 text-center">
              <h2 className="text-sm font-black text-zinc-250">Profit & Loss Statement</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">FY 2026-2027 &bull; Realtime Accounting Ledger</p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Income */}
              <div className="space-y-2">
                <div className="flex justify-between font-black uppercase text-[10px] text-purple-400">
                  <span>Operating Revenue</span><span>INR</span>
                </div>
                <div className="flex justify-between text-zinc-300 pl-4 border-l border-zinc-800">
                  <span>Event Contract Collections</span>
                  <span className="font-mono">₹{kpis.paidInvoicesVolume.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-300 pl-4 border-l border-zinc-800">
                  <span>Tax Claims Return</span>
                  <span className="font-mono">₹0</span>
                </div>
                <div className="flex justify-between font-bold border-t border-zinc-850/60 pt-2 text-zinc-200">
                  <span>Gross Operating Income</span>
                  <span className="font-mono">₹{kpis.paidInvoicesVolume.toLocaleString()}</span>
                </div>
              </div>

              {/* Expenses */}
              <div className="space-y-2 pt-4">
                <div className="flex justify-between font-black uppercase text-[10px] text-rose-400">
                  <span>Operating Expenses</span><span>INR</span>
                </div>
                <div className="flex justify-between text-zinc-300 pl-4 border-l border-zinc-800">
                  <span>Vendor Payments (Decor & Setup)</span>
                  <span className="font-mono">₹1,80,000</span>
                </div>
                <div className="flex justify-between text-zinc-300 pl-4 border-l border-zinc-800">
                  <span>Venue Rent Allocations</span>
                  <span className="font-mono">₹1,20,000</span>
                </div>
                <div className="flex justify-between text-zinc-300 pl-4 border-l border-zinc-800">
                  <span>Marketing & Logistics</span>
                  <span className="font-mono">₹35,000</span>
                </div>
                <div className="flex justify-between font-bold border-t border-zinc-850/60 pt-2 text-zinc-200">
                  <span>Total Operating Expenses</span>
                  <span className="font-mono">₹{kpis.estimatedExpenses.toLocaleString()}</span>
                </div>
              </div>

              {/* Net Summary */}
              <div className="border-t border-zinc-800 pt-4 flex justify-between font-black text-sm text-emerald-450 bg-emerald-950/5 p-4 rounded-xl border border-emerald-900/10">
                <span>Net Operating Profit</span>
                <span className="font-mono">₹{Math.max(0, kpis.netProfit).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* TAB 10: WORKFLOW AUTOMATION                      */}
      {/* ═══════════════════════════════════════════════ */}
      {activeTab === "automation" && (
        <div className="space-y-6 select-none">
          <div className="p-6 bg-[#121214]/20 border border-zinc-850 rounded-2xl space-y-4">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-350">Accounting Automation Rules</h3>
            <p className="text-[10px] text-zinc-550 leading-relaxed">Define system triggers to draft invoices, dispatch email reminders, and log transaction receipts without manual overhead.</p>

            <div className="space-y-4 pt-2">
              {[
                { title: "Booking Confirmation Hook", desc: "Automatically draft an invoice for remaining balances when a booking is set to 'CONFIRMED'.", active: true },
                { title: "Auto-Dispatch Invoice Receipt", desc: "Dispatch payment receipts via client portal email automatically upon status change to 'PAID'.", active: true },
                { title: "Smart Payment Reminders", desc: "Send automated email reminders to client email 3 days before payment due dates.", active: false },
                { title: "Overdue Auto-Escalations", desc: "Transition invoice status to 'OVERDUE' and apply late payment policy parameters once past due date.", active: true },
                { title: "Tax Auto-Calculation", desc: "Automatically calculate and apply GST (CGST + SGST) at 18% on all new invoices.", active: true },
                { title: "Recurring Reminder Schedule", desc: "Send follow-up reminders every 7 days for unpaid invoices exceeding ₹50,000.", active: false }
              ].map((rule, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-zinc-900/30 border border-zinc-850 rounded-2xl hover:bg-zinc-900/50 transition-colors">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">{rule.title}</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed max-w-[480px]">{rule.desc}</p>
                  </div>
                  <div className={cn(
                    "px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border cursor-pointer",
                    rule.active ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" : "border-zinc-800 bg-zinc-900 text-zinc-550"
                  )}>
                    {rule.active ? "ENABLED" : "DISABLED"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* MODALS                                          */}
      {/* ═══════════════════════════════════════════════ */}

      {/* MODAL: GENERATE INVOICE */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="absolute inset-0" onClick={() => setIsInvoiceModalOpen(false)} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-[#111113] border border-zinc-850 rounded-2xl shadow-2xl p-6 overflow-hidden relative z-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_var(--tw-gradient-stops))] from-purple-950/15 via-transparent to-transparent pointer-events-none" />
            <div className="flex justify-between items-center pb-4 border-b border-zinc-850 mb-4 z-10 relative">
              <div>
                <h2 className="text-sm font-extrabold text-white">Generate Client Invoice</h2>
                <p className="text-[10px] text-zinc-550 mt-0.5">Provision line items, billing details, and outstanding balances.</p>
              </div>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"><X size={14} /></button>
            </div>

            {errorText && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400 rounded-lg">{errorText}</div>}

            <form onSubmit={(e) => {
              e.preventDefault(); setErrorText("");
              if (!invBookingId) { setErrorText("Please link the invoice to an active booking."); return; }
              createInvoiceMutation.mutate({
                bookingId: invBookingId, subtotal: parseFloat(invSubtotal) || 0, tax: parseFloat(invTax) || 0, discount: parseFloat(invDiscount) || 0,
                dueDate: new Date(invDueDate).toISOString(), clientName: invClientName, clientEmail: invClientEmail || undefined, billingAddress: invBilling || undefined, notes: invNotes || undefined
              });
            }} className="space-y-4 text-xs z-10 relative">
              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-550 uppercase font-black">Associated Booking</label>
                <select required value={invBookingId} onChange={(e) => handleInvoiceBookingChange(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white">
                  <option value="">-- Choose Booking --</option>
                  {bookings.map((b) => <option key={b.id} value={b.id}>{b.bookingNumber} (₹{b.totalAmount.toLocaleString()})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-550 uppercase font-black">Client Name</label>
                  <input type="text" required value={invClientName} onChange={(e) => setInvClientName(e.target.value)} className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-550 uppercase font-black">Client Email</label>
                  <input type="email" value={invClientEmail} onChange={(e) => setInvClientEmail(e.target.value)} placeholder="name@domain.com" className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-550 uppercase font-black">Subtotal (INR)</label>
                  <input type="number" required value={invSubtotal} onChange={(e) => setInvSubtotal(e.target.value)} className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-550 uppercase font-black">Tax Rate (%)</label>
                  <input type="number" value={invTax} onChange={(e) => setInvTax(e.target.value)} className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-550 uppercase font-black">Discount (INR)</label>
                  <input type="number" value={invDiscount} onChange={(e) => setInvDiscount(e.target.value)} className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-550 uppercase font-black">Due Date</label>
                <input type="datetime-local" required value={invDueDate} onChange={(e) => setInvDueDate(e.target.value)} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-850">
                <button type="button" onClick={() => setIsInvoiceModalOpen(false)} className="px-4 py-2 border border-zinc-800 bg-zinc-900 rounded-lg text-zinc-300 cursor-pointer">Cancel</button>
                <button type="submit" disabled={createInvoiceMutation.isPending} className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white rounded-lg font-bold cursor-pointer">
                  {createInvoiceMutation.isPending ? "Generating..." : "Generate Invoice"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: RECORD PAYMENT */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="absolute inset-0" onClick={() => setIsPaymentModalOpen(false)} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-[#111113] border border-zinc-850 rounded-2xl shadow-2xl p-6 overflow-hidden relative z-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_var(--tw-gradient-stops))] from-purple-950/15 via-transparent to-transparent pointer-events-none" />
            <div className="flex justify-between items-center pb-4 border-b border-zinc-850 mb-4 z-10 relative">
              <div>
                <h2 className="text-sm font-extrabold text-white">Record Transaction</h2>
                <p className="text-[10px] text-zinc-550 mt-0.5">Register customer balance collections directly onto system books.</p>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"><X size={14} /></button>
            </div>

            {errorText && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400 rounded-lg">{errorText}</div>}

            <form onSubmit={(e) => {
              e.preventDefault(); setErrorText("");
              if (!payBookingId) { setErrorText("Please link the payment to an active booking."); return; }
              const amt = parseFloat(payAmount);
              if (isNaN(amt) || amt <= 0) { setErrorText("Please specify a valid payment amount."); return; }
              recordPaymentMutation.mutate({
                bookingId: payBookingId, amount: amt, paymentMethod: payMethod,
                transactionReference: payRef || undefined, notes: payNotes || undefined, paymentDate: new Date(payDate).toISOString()
              });
            }} className="space-y-4 text-xs z-10 relative">
              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-550 uppercase font-black">Associated Booking</label>
                <select required value={payBookingId} onChange={(e) => setPayBookingId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white">
                  <option value="">-- Choose Booking --</option>
                  {bookings.map((b) => <option key={b.id} value={b.id}>{b.bookingNumber} (Outstanding: ₹{(b.totalAmount - b.paidAmount).toLocaleString()})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-550 uppercase font-black">Payment Amount (INR)</label>
                  <input type="number" required value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="50000" className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-550 uppercase font-black">Payment Method</label>
                  <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-bold">
                    <option value="UPI">UPI / NetBanking</option>
                    <option value="CASH">Cash Delivery</option>
                    <option value="CARD">Credit/Debit Card</option>
                    <option value="BANK_TRANSFER">Direct Wire Transfer</option>
                    <option value="CHEQUE">Cheque Draft</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-550 uppercase font-black">Reference Number</label>
                  <input type="text" value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="TXN789012" className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-550 uppercase font-black">Paid Date</label>
                  <input type="datetime-local" required value={payDate} onChange={(e) => setPayDate(e.target.value)} className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-850">
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 border border-zinc-800 bg-zinc-900 rounded-lg text-zinc-300 cursor-pointer">Cancel</button>
                <button type="submit" disabled={recordPaymentMutation.isPending} className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white rounded-lg font-bold cursor-pointer">
                  {recordPaymentMutation.isPending ? "Logging..." : "Log Transaction"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: LOG EXPENSE */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="absolute inset-0" onClick={() => setIsExpenseModalOpen(false)} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-[#111113] border border-zinc-850 rounded-2xl shadow-2xl p-6 overflow-hidden relative z-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_var(--tw-gradient-stops))] from-purple-950/15 via-transparent to-transparent pointer-events-none" />
            <div className="flex justify-between items-center pb-4 border-b border-zinc-850 mb-4 z-10 relative">
              <div>
                <h2 className="text-sm font-extrabold text-white">Log Direct Expense</h2>
                <p className="text-[10px] text-zinc-550 mt-0.5">Deduct vendor costs and equipment rentals against the selected event budget.</p>
              </div>
              <button onClick={() => setIsExpenseModalOpen(false)} className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"><X size={14} /></button>
            </div>

            {errorText && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400 rounded-lg">{errorText}</div>}

            <form onSubmit={(e) => {
              e.preventDefault(); setErrorText("");
              const amt = parseFloat(expAmount);
              if (isNaN(amt) || amt <= 0) { setErrorText("Please enter a valid expense amount."); return; }
              createExpenseMutation.mutate({
                category: expCategory, description: expDesc, amount: amt, paymentMethod: expMethod, status: expStatus, expenseDate: new Date().toISOString()
              });
            }} className="space-y-4 text-xs z-10 relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-550 uppercase font-black">Budget Category</label>
                  <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white">
                    <option value="VENUE">Venue Rentals</option>
                    <option value="CATERING">Catering & Food</option>
                    <option value="PHOTOGRAPHY">Photography & Video</option>
                    <option value="DECORATION">Decoration & Florist</option>
                    <option value="TRANSPORT">Logistics & Transport</option>
                    <option value="ACCOMMODATION">Accommodation</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="SALARY">Staff Salary</option>
                    <option value="MISCELLANEOUS">Miscellaneous / Fees</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-550 uppercase font-black">Payment Method</label>
                  <select value={expMethod} onChange={(e) => setExpMethod(e.target.value)} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white">
                    <option value="UPI">UPI Transfer</option>
                    <option value="CASH">Cash Settlement</option>
                    <option value="CARD">Company Card</option>
                    <option value="BANK_TRANSFER">Bank Wire</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-550 uppercase font-black">Expense Cost (INR)</label>
                  <input type="number" required value={expAmount} onChange={(e) => setExpAmount(e.target.value)} placeholder="15000" className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-550 uppercase font-black">Approval Status</label>
                  <select value={expStatus} onChange={(e) => setExpStatus(e.target.value)} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-bold">
                    <option value="PAID">PAID</option>
                    <option value="PENDING">PENDING APPROVAL</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-550 uppercase font-black">Item Description</label>
                <input type="text" required value={expDesc} onChange={(e) => setExpDesc(e.target.value)} placeholder="Premium lighting rigs, stage floral items..."
                  className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-550 uppercase font-black">Receipt Upload (JPG / PDF)</label>
                <div className="border border-dashed border-zinc-800 rounded-xl p-6 text-center text-zinc-550 hover:border-purple-900 hover:text-zinc-400 transition-all cursor-pointer">
                  <Download size={16} className="mx-auto mb-1" />
                  <span className="text-[10px]">Drag receipt file here or click to choose file</span>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-850">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="px-4 py-2 border border-zinc-800 bg-zinc-900 rounded-lg text-zinc-300 cursor-pointer">Cancel</button>
                <button type="submit" disabled={createExpenseMutation.isPending} className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white rounded-lg font-bold cursor-pointer">
                  {createExpenseMutation.isPending ? "Adding..." : "Log Expense"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* SUCCESS POPUP */}
      <AnimatePresence>
        {isSuccessOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-[#121214] border border-zinc-850 rounded-2xl shadow-2xl p-6 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
                <CheckCircle2 size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-white">Payment Receipt Settled</h3>
                <p className="text-[10px] text-zinc-500">Transaction logged and verified on local ledger books.</p>
              </div>
              <button onClick={() => setIsSuccessOpen(false)}
                className="w-full py-2 bg-purple-650 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer">
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </PageShell>
  );
}

// ═══════════════════════════════════════════════
// FINANCE KPI CARD SUBCOMPONENT
// ═══════════════════════════════════════════════
function FinanceKpiCard({ title, value, icon: Icon, trend, accent, sparkData, isCount = false }: {
  title: string;
  value: number;
  icon: any;
  trend: { value: number; isPositive: boolean };
  accent: string;
  sparkData: number[];
  isCount?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.floor(value);
    if (start === end) { setDisplayValue(end); return; }
    const timer = setInterval(() => {
      start += Math.max(1, Math.ceil(end / 25));
      if (start >= end) { clearInterval(timer); setDisplayValue(end); } else { setDisplayValue(start); }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  const drawSparkline = () => {
    const width = 100;
    const height = 30;
    const max = Math.max(...sparkData);
    const min = Math.min(...sparkData);
    const range = max - min || 1;
    const points = sparkData
      .map((val, idx) => {
        const x = (idx / (sparkData.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 4) - 2;
        return `${x},${y}`;
      })
      .join(" ");
    return { points, width, height };
  };

  const { points, width, height } = drawSparkline();

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="relative rounded-2xl border border-zinc-800 bg-[#141416]/40 p-5 flex flex-col justify-between min-h-[140px] hover:shadow-[0_0_30px_rgba(168,85,247,0.02)] group overflow-hidden select-none transition-colors"
    >
      <div className={cn("absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br opacity-5 blur-[40px] rounded-full group-hover:opacity-10 transition-opacity", accent)} />
      
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest block">{title}</span>
          <p className="text-xl font-extrabold tracking-tight text-zinc-200">
            {isCount ? displayValue : `₹${displayValue.toLocaleString()}`}
          </p>
        </div>
        <div className={cn("h-8 w-8 rounded-xl bg-gradient-to-tr flex items-center justify-center text-white shadow-md shadow-black/40", accent)}>
          <Icon size={14} className="text-zinc-100" />
        </div>
      </div>

      <div className="flex justify-between items-end pt-4 border-t border-zinc-900/60 mt-2">
        <div className="space-y-1">
          <div className={cn("flex items-center gap-1 text-[11px] font-bold", trend.isPositive ? "text-emerald-500" : "text-red-500")}>
            {trend.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            <span>{trend.value}%</span>
            <span className="text-zinc-650 font-normal text-[9px] lowercase">vs past month</span>
          </div>
        </div>

        <div className="h-8 w-20 opacity-60 group-hover:opacity-100 transition-opacity">
          <svg viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            <polyline
              fill="none"
              stroke={trend.isPositive ? "#10b981" : "#ef4444"}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
