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
  FileSpreadsheet
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  Pie
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

function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.floor(value);
    if (start === end) {
      setCount(end);
      return;
    }
    const duration = 0.5;
    const increment = Math.max(1, Math.ceil(end / 30));
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function FinanceWorkspace({ defaultTab = "dashboard" }: { defaultTab?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(defaultTab);

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [selectedBookingId, setSelectedBookingId] = useState("");
  
  // Column Width Resizing State (Mock interaction)
  const [colWidths, setColWidths] = useState({
    number: 120,
    customer: 160,
    booking: 120,
    dueDate: 120,
    status: 120,
    total: 120
  });

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
    }
  });

  // Reset forms
  const resetInvoiceForm = () => {
    setInvBookingId("");
    setInvClientName("");
    setInvClientEmail("");
    setInvSubtotal("");
    setInvTax("18");
    setInvDiscount("0");
    setInvBilling("");
    setInvNotes("");
    setErrorText("");
  };

  const resetPaymentForm = () => {
    setPayBookingId("");
    setPayAmount("");
    setPayMethod("UPI");
    setPayRef("");
    setPayNotes("");
    setPayDate(new Date().toISOString().slice(0, 16));
    setErrorText("");
  };

  const resetExpenseForm = () => {
    setExpCategory("MISCELLANEOUS");
    setExpDesc("");
    setExpAmount("");
    setExpMethod("UPI");
    setExpStatus("PAID");
    setErrorText("");
  };

  // Handle invoice linked booking selection
  const handleInvoiceBookingChange = (id: string) => {
    setInvBookingId(id);
    const selected = bookings.find((b) => b.id === id);
    if (selected) {
      const remaining = Math.max(0, selected.totalAmount - selected.paidAmount);
      setInvSubtotal(remaining.toString());
      setInvClientName(selected.clientName || `Client for Booking ${selected.bookingNumber}`);
    }
  };

  // KPI calculations
  const kpis = useMemo(() => {
    const activeInvoices = invoices.filter((i) => i.status !== "CANCELLED");
    const totalInvoiced = activeInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const paidInvoicesVolume = invoices
      .filter((i) => i.status === "PAID")
      .reduce((sum, i) => sum + i.totalAmount, 0);

    const outstanding = Math.max(0, totalInvoiced - paidInvoicesVolume);
    const paidInvoicesCount = invoices.filter((i) => i.status === "PAID").length;
    const overdueCount = invoices.filter((i) => i.status === "OVERDUE").length;

    // Collection rate
    const collectionRate = totalInvoiced > 0 ? Math.round((paidInvoicesVolume / totalInvoiced) * 100) : 100;

    // Revenue today/week/month (based on payment date)
    const now = new Date();
    const todayStr = now.toDateString();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    let revenueToday = 0;
    let revenueWeek = 0;
    let revenueMonth = 0;

    payments.forEach((p) => {
      if (p.status !== "COMPLETED") return;
      const pDate = new Date(p.paymentDate);
      
      // Today
      if (pDate.toDateString() === todayStr) {
        revenueToday += p.amount;
      }
      // Week
      if (pDate >= oneWeekAgo) {
        revenueWeek += p.amount;
      }
      // Month
      if (pDate.getMonth() === thisMonth && pDate.getFullYear() === thisYear) {
        revenueMonth += p.amount;
      }
    });

    return {
      revenueToday,
      revenueWeek,
      revenueMonth,
      outstanding,
      paidInvoicesVolume,
      paidInvoicesCount,
      overdueCount,
      collectionRate
    };
  }, [invoices, payments]);

  // Recharts Revenue Trend Data
  const revenueTrendData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const ledger: Record<string, { month: string; Revenue: number; Expenses: number }> = {};
    
    // Initialize past 6 months
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const key = `${m.getFullYear()}-${m.getMonth()}`;
      ledger[key] = {
        month: monthNames[m.getMonth()],
        Revenue: 0,
        Expenses: 0
      };
    }

    payments.forEach((p) => {
      if (p.status !== "COMPLETED") return;
      const pDate = new Date(p.paymentDate);
      const key = `${pDate.getFullYear()}-${pDate.getMonth()}`;
      if (ledger[key]) {
        ledger[key].Revenue += p.amount;
      }
    });

    return Object.values(ledger);
  }, [payments]);

  // Recharts Expense Category Pie data
  const expenseCategoryData = useMemo(() => {
    if (!expenses.length) {
      return [
        { name: "Venue", value: 120000, color: "#a855f7" },
        { name: "Catering", value: 180000, color: "#ec4899" },
        { name: "Decor", value: 90000, color: "#3b82f6" },
        { name: "Photography", value: 65000, color: "#10b981" }
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

  // Filters for Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((i) => {
      const matchSearch =
        i.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "ALL" || i.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  // Filters for Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch =
        (p.transactionReference || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.notes || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchMethod = methodFilter === "ALL" || p.paymentMethod === methodFilter;
      return matchSearch && matchMethod;
    });
  }, [payments, searchQuery, methodFilter]);

  // Tax calculations summary
  const taxSummary = useMemo(() => {
    const cgst = kpis.paidInvoicesVolume * 0.09;
    const sgst = kpis.paidInvoicesVolume * 0.09;
    const totalTax = cgst + sgst;
    return { cgst, sgst, totalTax };
  }, [kpis.paidInvoicesVolume]);

  const isLoading = invoicesLoading || paymentsLoading || bookingsLoading;

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex flex-col relative overflow-hidden transition-all duration-200">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Top Navbar */}
      <nav className="h-16 border-b border-zinc-800 bg-[#0c0c0e]/85 backdrop-blur px-6 flex items-center justify-between z-20 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="h-8 w-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-zinc-800/80"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">Finance & Accounting</span>
            <span className="text-[10px] px-2 py-0.5 bg-purple-950/40 border border-purple-900/50 rounded text-purple-400 font-extrabold uppercase tracking-wider font-mono">
              Enterprise Hub
            </span>
          </div>
        </div>

        {/* Global Finance Search */}
        <div className="hidden md:flex items-center gap-2 max-w-xs relative flex-1">
          <Search size={13} className="absolute left-3 text-zinc-550" />
          <input
            type="text"
            placeholder="Search invoice, client, reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-900/60 border border-zinc-800 focus:border-purple-650 rounded-lg text-xs text-white focus:outline-none transition-colors"
          />
        </div>
      </nav>

      {/* Tab Selection Row */}
      <div className="border-b border-zinc-850 bg-[#0c0c0e]/50 backdrop-blur z-10 px-6 py-2 select-none flex flex-wrap gap-2">
        {[
          { key: "dashboard", label: "Dashboard", icon: Wallet },
          { key: "invoices", label: "Invoices", icon: FileSpreadsheet },
          { key: "payments", label: "Payments", icon: Coins },
          { key: "expenses", label: "Expenses", icon: CreditCard },
          { key: "tax", label: "Tax & GST", icon: Percent },
          { key: "reports", label: "Financial Reports", icon: TrendingUp },
          { key: "automation", label: "Automation Rules", icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSearchQuery("");
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                isActive
                  ? "bg-purple-600/10 text-purple-450 border border-purple-550/20"
                  : "text-zinc-450 hover:text-zinc-200 border border-transparent hover:bg-zinc-900/40"
              )}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Container */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full z-10 overflow-y-auto">
        
        {/* ──────────────────────────────────────────────── */}
        {/* TAB 1: DASHBOARD VIEW                           */}
        {/* ──────────────────────────────────────────────── */}
        {activeTab === "dashboard" && (
          <div className="space-y-6 animate-fade-in">
            {/* KPI metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="Revenue This Month"
                value={kpis.revenueMonth}
                subtitle="Cleared collections"
                icon={Coins}
                trend={{ value: 14, isPositive: true }}
                sparklineData={[40, 50, 48, 65, kpis.revenueMonth / 1000]}
                gradientAccent="from-purple-500 to-indigo-500"
              />
              <KpiCard
                title="Outstanding Balance"
                value={kpis.outstanding}
                subtitle="Uncollected receivables"
                icon={DollarSign}
                trend={{ value: 2.4, isPositive: false }}
                sparklineData={[30, 28, 32, 29, kpis.outstanding / 1000]}
                gradientAccent="from-amber-500 to-yellow-500"
              />
              <KpiCard
                title="Collection Rate"
                value={`${kpis.collectionRate}%`}
                subtitle="Billed vs Paid Ratio"
                icon={Percent}
                trend={{ value: 6.8, isPositive: true }}
                sparklineData={[80, 82, 85, 88, kpis.collectionRate]}
                gradientAccent="from-emerald-500 to-teal-500"
              />
              <KpiCard
                title="Overdue Invoices"
                value={kpis.overdueCount}
                subtitle="Requires follow-up"
                icon={AlertCircle}
                trend={{ value: 0, isPositive: true }}
                sparklineData={[1, 0, 2, 0, kpis.overdueCount]}
                gradientAccent="from-red-500 to-orange-500"
              />
            </div>

            {/* Sub-KPIs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 border border-zinc-850 bg-[#121214]/40 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Revenue Today</span>
                  <h4 className="text-lg font-black text-zinc-200 mt-1">₹{kpis.revenueToday.toLocaleString()}</h4>
                </div>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <TrendingUp size={14} />
                </div>
              </div>
              <div className="p-4 border border-zinc-850 bg-[#121214]/40 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Revenue This Week</span>
                  <h4 className="text-lg font-black text-zinc-200 mt-1">₹{kpis.revenueWeek.toLocaleString()}</h4>
                </div>
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Coins size={14} />
                </div>
              </div>
              <div className="p-4 border border-zinc-850 bg-[#121214]/40 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Average Payment Time</span>
                  <h4 className="text-lg font-black text-zinc-200 mt-1">4.8 Days</h4>
                </div>
                <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                  <Clock size={14} />
                </div>
              </div>
            </div>

            {/* Graphs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Cash Flow / Revenue graph */}
              <div className="lg:col-span-2 p-5 border border-zinc-850 bg-[#121214]/30 backdrop-blur rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-350">Income & Revenue History</h3>
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
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="month" stroke="#71717a" />
                      <YAxis stroke="#71717a" />
                      <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", color: "#f4f4f5" }} />
                      <Area type="monotone" dataKey="Revenue" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#revenueGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Expense Category distribution */}
              <div className="lg:col-span-1 p-5 border border-zinc-850 bg-[#121214]/30 backdrop-blur rounded-2xl space-y-4 flex flex-col justify-between">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-350">Expenses by Category</h3>
                <div className="h-44 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {expenseCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {expenseCategoryData.slice(0, 4).map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-zinc-400 truncate">{entry.name} (₹{Math.round(entry.value/1000)}k)</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Recent Payments and Invoices Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Recent settled payments */}
              <div className="p-5 border border-zinc-850 bg-[#121214]/20 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-350">Recent Transactions</h3>
                  <button onClick={() => setActiveTab("payments")} className="text-[10px] text-purple-400 hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                  {payments.slice(0, 4).map((p) => (
                    <div key={p.id} className="flex justify-between items-center p-3 bg-zinc-900/30 border border-zinc-850 rounded-xl hover:bg-zinc-900/50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                          <Coins size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-200">Ref: {p.transactionReference || "N/A"}</p>
                          <p className="text-[10px] text-zinc-500">{new Date(p.paymentDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-black text-emerald-400">₹{p.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  {payments.length === 0 && <p className="text-xs text-zinc-550 text-center py-6">No transactions recorded.</p>}
                </div>
              </div>

              {/* Upcoming / Overdue bills */}
              <div className="p-5 border border-zinc-850 bg-[#121214]/20 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-350">Outstanding Invoices</h3>
                  <button onClick={() => setActiveTab("invoices")} className="text-[10px] text-purple-400 hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                  {invoices.filter((i) => i.status !== "PAID" && i.status !== "CANCELLED").slice(0, 4).map((inv) => {
                    const pillClass = STATUS_PILLS[inv.status] || "border-zinc-800 text-zinc-400";
                    return (
                      <div key={inv.id} className="flex justify-between items-center p-3 bg-zinc-900/30 border border-zinc-850 rounded-xl hover:bg-zinc-900/50 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-zinc-950 flex items-center justify-center text-zinc-450 border border-zinc-850">
                            <FileText size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-200">{inv.clientName}</p>
                            <p className="text-[10px] text-zinc-500">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
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

        {/* ──────────────────────────────────────────────── */}
        {/* TAB 2: INVOICE MANAGER VIEW                      */}
        {/* ──────────────────────────────────────────────── */}
        {activeTab === "invoices" && (
          <div className="space-y-6 animate-fade-in">
            {/* Header controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-850 pb-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative max-w-xs flex-1">
                  <Search size={13} className="absolute left-3 top-2.5 text-zinc-550" />
                  <input
                    type="text"
                    placeholder="Search invoices..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 bg-[#121214]/60 border border-zinc-800 focus:border-purple-650 rounded-lg text-xs text-white focus:outline-none transition-colors w-64"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-xs focus:outline-none font-bold"
                >
                  <option value="ALL">All Statuses</option>
                  {INVOICE_STATUSES.filter(s => s !== "ALL").map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => { resetInvoiceForm(); setIsInvoiceModalOpen(true); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                <Plus size={13} />
                Generate Invoice
              </button>
            </div>

            {/* Invoices Table */}
            <div className="overflow-x-auto border border-zinc-850 bg-[#121214]/20 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-850 bg-zinc-950/20 text-zinc-550 font-black uppercase text-[8.5px] tracking-wider select-none">
                    <th className="p-4" style={{ width: colWidths.number }}>Invoice No</th>
                    <th className="p-4" style={{ width: colWidths.customer }}>Customer</th>
                    <th className="p-4" style={{ width: colWidths.booking }}>Linked Booking</th>
                    <th className="p-4" style={{ width: colWidths.dueDate }}>Due Date</th>
                    <th className="p-4" style={{ width: colWidths.status }}>Status</th>
                    <th className="p-4" style={{ width: colWidths.total }}>Grand Total</th>
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
                        <td className="p-4">
                          <span className={cn("px-2.5 py-0.5 border rounded-full text-[8.5px] font-black uppercase", statusClass)}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-black text-emerald-450">₹{inv.totalAmount.toLocaleString()}</td>
                        <td className="p-4 text-right flex justify-end gap-3 items-center">
                          <button
                            onClick={() => router.push(`/invoices/${inv.id}`)}
                            className="text-purple-400 hover:text-purple-300 font-bold inline-flex items-center gap-0.5 hover:underline"
                          >
                            Workspace <ArrowUpRight size={12} />
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

        {/* ──────────────────────────────────────────────── */}
        {/* TAB 3: PAYMENTS LEDGER VIEW                      */}
        {/* ──────────────────────────────────────────────── */}
        {activeTab === "payments" && (
          <div className="space-y-6 animate-fade-in">
            {/* Header controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-850 pb-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative max-w-xs flex-1">
                  <Search size={13} className="absolute left-3 top-2.5 text-zinc-550" />
                  <input
                    type="text"
                    placeholder="Search transaction reference..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 bg-[#121214]/60 border border-zinc-800 focus:border-purple-650 rounded-lg text-xs text-white focus:outline-none transition-colors w-64"
                  />
                </div>
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-xs focus:outline-none font-bold"
                >
                  <option value="ALL">All Payment Methods</option>
                  {["UPI", "CASH", "CARD", "BANK_TRANSFER", "CHEQUE"].map((m) => (
                    <option key={m} value={m}>{m.replace("_", " ")}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => { resetPaymentForm(); setIsPaymentModalOpen(true); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                <Plus size={13} />
                Record Payment
              </button>
            </div>

            {/* Payments Table */}
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
                        <td className="p-4 font-bold text-zinc-400">{p.paymentMethod}</td>
                        <td className="p-4 font-mono text-zinc-300">{p.transactionReference || "N/A"}</td>
                        <td className="p-4">{new Date(p.paymentDate).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 border border-emerald-500/20 bg-emerald-500/5 text-emerald-450 rounded-full text-[8.5px] font-black uppercase">
                            {p.status}
                          </span>
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

        {/* ──────────────────────────────────────────────── */}
        {/* TAB 4: EXPENSES TRACKER VIEW                     */}
        {/* ──────────────────────────────────────────────── */}
        {activeTab === "expenses" && (
          <div className="space-y-6 animate-fade-in">
            {/* Header selection and CRUD button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-850 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-zinc-400">Select Booking Budget Context:</span>
                <select
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-xs focus:outline-none font-bold"
                >
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>{b.bookingNumber} (&bull; Cost: ₹{b.totalAmount.toLocaleString()})</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => { resetExpenseForm(); setIsExpenseModalOpen(true); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                <Plus size={13} />
                Log Expense
              </button>
            </div>

            {/* Expenses List */}
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
                        <span className={cn(
                          "px-2 py-0.5 border rounded-full text-[8.5px] font-black uppercase",
                          e.status === "PAID" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-450" : "border-amber-500/20 bg-amber-500/5 text-amber-500"
                        )}>
                          {e.status}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-black text-rose-400">₹{e.amount.toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => deleteExpenseMutation.mutate(e.id)}
                          className="p-1 text-zinc-550 hover:text-red-500 rounded bg-zinc-950/20 hover:bg-red-500/10 transition-colors"
                        >
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

        {/* ──────────────────────────────────────────────── */}
        {/* TAB 5: TAX & GST VIEW                            */}
        {/* ──────────────────────────────────────────────── */}
        {activeTab === "tax" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-zinc-900/30 border border-zinc-850 rounded-2xl space-y-1">
                <span className="text-[10px] text-zinc-550 font-black uppercase">CGST Collected (9%)</span>
                <p className="text-xl font-mono font-black text-zinc-200">₹{taxSummary.cgst.toLocaleString()}</p>
                <p className="text-[9px] text-zinc-500">Central Goods and Services Tax</p>
              </div>
              <div className="p-5 bg-zinc-900/30 border border-zinc-850 rounded-2xl space-y-1">
                <span className="text-[10px] text-zinc-550 font-black uppercase">SGST Collected (9%)</span>
                <p className="text-xl font-mono font-black text-zinc-200">₹{taxSummary.sgst.toLocaleString()}</p>
                <p className="text-[9px] text-zinc-500">State Goods and Services Tax</p>
              </div>
              <div className="p-5 bg-zinc-900/30 border border-zinc-850 rounded-2xl space-y-1">
                <span className="text-[10px] text-zinc-550 font-black uppercase">Total GST Liability</span>
                <p className="text-xl font-mono font-black text-purple-400">₹{taxSummary.totalTax.toLocaleString()}</p>
                <p className="text-[9px] text-zinc-500">Accumulated tax from settled invoices</p>
              </div>
            </div>

            <div className="p-6 bg-[#121214]/20 border border-zinc-850 rounded-2xl space-y-4">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-350">GST Rules Audit Table</h3>
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
                    {invoices.filter((i) => i.status === "PAID").slice(0, 5).map((inv) => {
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

        {/* ──────────────────────────────────────────────── */}
        {/* TAB 6: FINANCIAL REPORTS VIEW                    */}
        {/* ──────────────────────────────────────────────── */}
        {activeTab === "reports" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center border-b border-zinc-850 pb-4">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-350">Company Ledger Balance Sheet</h3>
              <div className="flex gap-2 text-xs">
                <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-850 rounded-xl text-[10px] font-bold">
                  <Download size={12} /> Export Excel
                </button>
                <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-850 rounded-xl text-[10px] font-bold">
                  <Printer size={12} /> Print PDF
                </button>
              </div>
            </div>

            {/* Profit & Loss mock sheet */}
            <div className="p-6 bg-[#121214]/20 border border-zinc-850 rounded-3xl space-y-6">
              <div className="border-b border-zinc-850 pb-4 text-center">
                <h2 className="text-sm font-black text-zinc-250">Profit & Loss Statement</h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">FY 2026-2027 &bull; Realtime Accounting Ledger</p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Income */}
                <div className="space-y-2">
                  <div className="flex justify-between font-black uppercase text-[10px] text-purple-400">
                    <span>Operating Revenue</span>
                    <span>INR</span>
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
                    <span>Operating Expenses</span>
                    <span>INR</span>
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
                    <span className="font-mono">₹3,35,000</span>
                  </div>
                </div>

                {/* Net Summary */}
                <div className="border-t border-zinc-800 pt-4 flex justify-between font-black text-sm text-emerald-450 bg-emerald-950/5 p-4 rounded-xl border border-emerald-900/10">
                  <span>Net Operating Profit</span>
                  <span className="font-mono">₹{Math.max(0, kpis.paidInvoicesVolume - 335000).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────── */}
        {/* TAB 7: WORKFLOW AUTOMATION VIEW                  */}
        {/* ──────────────────────────────────────────────── */}
        {activeTab === "automation" && (
          <div className="space-y-6 animate-fade-in select-none">
            <div className="p-6 bg-[#121214]/20 border border-zinc-850 rounded-2xl space-y-4">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-350">Accounting Automation Rules</h3>
              <p className="text-[10px] text-zinc-550 leading-relaxed">Define system triggers to draft invoices, dispatch email reminders, and log transaction receipts without manual overhead.</p>

              <div className="space-y-4 pt-2">
                {[
                  { title: "Booking Confirmation Hook", desc: "Automatically draft an invoice for remaining balances when a booking is set to 'CONFIRMED'.", active: true },
                  { title: "Auto-Dispatch Invoice Receipt", desc: "Dispatch payment receipts via client portal email automatically upon status change to 'PAID'.", active: true },
                  { title: "Smart Payment Reminders", desc: "Send automated email reminders to client email 3 days before payment due dates.", active: false },
                  { title: "Overdue Auto-Escalations", desc: "Transition invoice status to 'OVERDUE' and apply late payment policy parameters once past due date.", active: true }
                ].map((rule, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-zinc-900/30 border border-zinc-850 rounded-2xl hover:bg-zinc-900/50 transition-colors">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">{rule.title}</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed max-w-[480px]">{rule.desc}</p>
                    </div>
                    <div className={cn(
                      "px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border",
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

      </main>

      {/* ──────────────────────────────────────────────── */}
      {/* MODAL: GENERATE INVOICE                          */}
      {/* ──────────────────────────────────────────────── */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#111113] border border-zinc-850 rounded-2xl shadow-2xl p-6 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/15 via-transparent to-transparent pointer-events-none" />

            <div className="flex justify-between items-center pb-4 border-b border-zinc-850 mb-4 z-10 relative">
              <div>
                <h2 className="text-sm font-extrabold text-white">Generate Client Invoice Receipt</h2>
                <p className="text-[10px] text-zinc-550 mt-0.5">Provision line items, billing details, and outstanding balances.</p>
              </div>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white">
                <X size={14} />
              </button>
            </div>

            {errorText && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400 rounded-lg">
                {errorText}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setErrorText("");
                if (!invBookingId) {
                  setErrorText("Please link the invoice to an active booking.");
                  return;
                }
                createInvoiceMutation.mutate({
                  bookingId: invBookingId,
                  subtotal: parseFloat(invSubtotal) || 0,
                  tax: parseFloat(invTax) || 0,
                  discount: parseFloat(invDiscount) || 0,
                  dueDate: new Date(invDueDate).toISOString(),
                  clientName: invClientName,
                  clientEmail: invClientEmail || undefined,
                  billingAddress: invBilling || undefined,
                  notes: invNotes || undefined
                });
              }}
              className="space-y-4 text-xs z-10 relative"
            >
              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-550 uppercase font-black">Associated Booking</label>
                <select
                  required
                  value={invBookingId}
                  onChange={(e) => handleInvoiceBookingChange(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                >
                  <option value="">-- Choose Booking --</option>
                  {bookings.map((b) => <option key={b.id} value={b.id}>{b.bookingNumber} (&bull; ₹{b.totalAmount.toLocaleString()})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-550 uppercase font-black">Client Name</label>
                  <input type="text" required value={invClientName} onChange={(e) => setInvClientName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-550 uppercase font-black">Client Email</label>
                  <input type="email" value={invClientEmail} onChange={(e) => setInvClientEmail(e.target.value)} placeholder="name@domain.com"
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-550 uppercase font-black">Subtotal (INR)</label>
                  <input type="number" required value={invSubtotal} onChange={(e) => setInvSubtotal(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-550 uppercase font-black">Tax Rate (%)</label>
                  <input type="number" value={invTax} onChange={(e) => setInvTax(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-550 uppercase font-black">Discount (INR)</label>
                  <input type="number" value={invDiscount} onChange={(e) => setInvDiscount(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-550 uppercase font-black">Due Date</label>
                <input type="datetime-local" required value={invDueDate} onChange={(e) => setInvDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-550 uppercase font-black">Billing Address</label>
                <input type="text" value={invBilling} onChange={(e) => setInvBilling(e.target.value)} placeholder="123 Corporate Lane, Delhi"
                  className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-850">
                <button type="button" onClick={() => setIsInvoiceModalOpen(false)} className="px-4 py-2 border border-zinc-805 bg-zinc-900 rounded-lg text-zinc-300">
                  Cancel
                </button>
                <button type="submit" disabled={createInvoiceMutation.isPending} className="px-4 py-2 bg-purple-650 hover:bg-purple-750 text-white rounded-lg font-bold">
                  {createInvoiceMutation.isPending ? "Generating..." : "Generate Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────── */}
      {/* MODAL: RECORD PAYMENT                            */}
      {/* ──────────────────────────────────────────────── */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#111113] border border-zinc-850 rounded-2xl shadow-2xl p-6 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/15 via-transparent to-transparent pointer-events-none" />

            <div className="flex justify-between items-center pb-4 border-b border-zinc-850 mb-4 z-10 relative">
              <div>
                <h2 className="text-sm font-extrabold text-white">Record Transaction</h2>
                <p className="text-[10px] text-zinc-550 mt-0.5">Register customer balance collections directly onto system books.</p>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white">
                <X size={14} />
              </button>
            </div>

            {errorText && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400 rounded-lg">
                {errorText}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setErrorText("");
                if (!payBookingId) {
                  setErrorText("Please link the payment to an active booking.");
                  return;
                }
                const amt = parseFloat(payAmount);
                if (isNaN(amt) || amt <= 0) {
                  setErrorText("Please specify a valid payment amount.");
                  return;
                }
                recordPaymentMutation.mutate({
                  bookingId: payBookingId,
                  amount: amt,
                  paymentMethod: payMethod,
                  transactionReference: payRef || undefined,
                  notes: payNotes || undefined,
                  paymentDate: new Date(payDate).toISOString()
                });
              }}
              className="space-y-4 text-xs z-10 relative"
            >
              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-550 uppercase font-black">Associated Booking</label>
                <select
                  required
                  value={payBookingId}
                  onChange={(e) => setPayBookingId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                >
                  <option value="">-- Choose Booking --</option>
                  {bookings.map((b) => <option key={b.id} value={b.id}>{b.bookingNumber} (&bull; Outstanding: ₹{(b.totalAmount - b.paidAmount).toLocaleString()})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-550 uppercase font-black">Payment Amount (INR)</label>
                  <input type="number" required value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="50000"
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-550 uppercase font-black">Payment Method</label>
                  <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-bold">
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
                  <input type="text" value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="TXN789012"
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-550 uppercase font-black">Paid Date</label>
                  <input type="datetime-local" required value={payDate} onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-550 uppercase font-black">Notes</label>
                <input type="text" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Deposit balance payment..."
                  className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-850">
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 border border-zinc-805 bg-zinc-900 rounded-lg text-zinc-300">
                  Cancel
                </button>
                <button type="submit" disabled={recordPaymentMutation.isPending} className="px-4 py-2 bg-purple-650 hover:bg-purple-750 text-white rounded-lg font-bold">
                  {recordPaymentMutation.isPending ? "Logging..." : "Log Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────── */}
      {/* MODAL: LOG EXPENSE                               */}
      {/* ──────────────────────────────────────────────── */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#111113] border border-zinc-850 rounded-2xl shadow-2xl p-6 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/15 via-transparent to-transparent pointer-events-none" />

            <div className="flex justify-between items-center pb-4 border-b border-zinc-850 mb-4 z-10 relative">
              <div>
                <h2 className="text-sm font-extrabold text-white">Log Direct Expense</h2>
                <p className="text-[10px] text-zinc-550 mt-0.5">Deduct vendor costs and equipment rentals against the selected event budget.</p>
              </div>
              <button onClick={() => setIsExpenseModalOpen(false)} className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white">
                <X size={14} />
              </button>
            </div>

            {errorText && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400 rounded-lg">
                {errorText}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setErrorText("");
                const amt = parseFloat(expAmount);
                if (isNaN(amt) || amt <= 0) {
                  setErrorText("Please enter a valid expense amount.");
                  return;
                }
                createExpenseMutation.mutate({
                  category: expCategory,
                  description: expDesc,
                  amount: amt,
                  paymentMethod: expMethod,
                  status: expStatus,
                  expenseDate: new Date().toISOString()
                });
              }}
              className="space-y-4 text-xs z-10 relative"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-550 uppercase font-black">Budget Category</label>
                  <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white">
                    <option value="VENUE">Venue Rentals</option>
                    <option value="CATERING">Catering & Food</option>
                    <option value="PHOTOGRAPHY">Photography & Video</option>
                    <option value="DECORATION">Decoration & Florist</option>
                    <option value="TRANSPORT">Logistics & Transport</option>
                    <option value="MISCELLANEOUS">Miscellaneous / Fees</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-550 uppercase font-black">Payment Method</label>
                  <select value={expMethod} onChange={(e) => setExpMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white">
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
                  <input type="number" required value={expAmount} onChange={(e) => setExpAmount(e.target.value)} placeholder="15000"
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-550 uppercase font-black">Approval Status</label>
                  <select value={expStatus} onChange={(e) => setExpStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-bold">
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

              {/* simulated receipt dropzone */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-550 uppercase font-black">Receipt Upload (JPG / PDF)</label>
                <div className="border border-dashed border-zinc-800 rounded-xl p-6 text-center text-zinc-550 hover:border-purple-900 hover:text-zinc-400 transition-all cursor-pointer">
                  <Download size={16} className="mx-auto mb-1" />
                  <span className="text-[10px]">Drag receipt file here or click to choose file</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-850">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="px-4 py-2 border border-zinc-805 bg-zinc-900 rounded-lg text-zinc-300">
                  Cancel
                </button>
                <button type="submit" disabled={createExpenseMutation.isPending} className="px-4 py-2 bg-purple-650 hover:bg-purple-750 text-white rounded-lg font-bold">
                  {createExpenseMutation.isPending ? "Adding..." : "Log Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────── */}
      {/* MODAL: TRANSACTION LOGGED SUCCESS POPUP          */}
      {/* ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {isSuccessOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-[#121214] border border-zinc-850 rounded-2xl shadow-2xl p-6 text-center space-y-4"
            >
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
                <CheckCircle2 size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-white">Payment Receipt Settled</h3>
                <p className="text-[10px] text-zinc-500">Transaction logged and verified on local ledger books.</p>
              </div>
              <button
                onClick={() => setIsSuccessOpen(false)}
                className="w-full py-2 bg-purple-650 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// KPI Subcomponent inside the file
interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: any;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  sparklineData?: number[];
  gradientAccent?: string;
}

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  sparklineData = [10, 15, 12, 22, 18, 30, 25],
  gradientAccent = "from-purple-500 to-pink-500",
}: KpiCardProps) {
  const [displayValue, setDisplayValue] = useState<number | string>(typeof value === "number" ? 0 : value);

  useEffect(() => {
    if (typeof value !== "number") {
      setDisplayValue(value);
      return;
    }
    let start = 0;
    const end = value;
    if (start === end) return;
    const duration = 0.6;
    const timer = setInterval(() => {
      start += Math.ceil(end / 25);
      if (start >= end) {
        clearInterval(timer);
        setDisplayValue(end);
      } else {
        setDisplayValue(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  const drawSparkline = () => {
    const width = 100;
    const height = 30;
    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;
    const points = sparklineData
      .map((val, idx) => {
        const x = (idx / (sparklineData.length - 1)) * width;
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
      <div className={cn("absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br opacity-5 blur-[40px] rounded-full group-hover:opacity-10 transition-opacity", gradientAccent)} />
      
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest block">{title}</span>
          <p className="text-xl font-extrabold tracking-tight text-zinc-200">
            {typeof displayValue === "number" ? `₹${displayValue.toLocaleString()}` : displayValue}
          </p>
        </div>
        <div className={cn("h-8 w-8 rounded-xl bg-gradient-to-tr flex items-center justify-center text-white shadow-md shadow-black/40", gradientAccent)}>
          <Icon size={14} className="text-zinc-100" />
        </div>
      </div>

      <div className="flex justify-between items-end pt-4 border-t border-zinc-900/60 mt-2">
        <div className="space-y-1">
          {trend && (
            <div className={cn("flex items-center gap-1 text-[11px] font-bold", trend.isPositive ? "text-emerald-500" : "text-red-500")}>
              {trend.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              <span>{trend.value}%</span>
              <span className="text-zinc-650 font-normal text-[9px] lowercase">vs past month</span>
            </div>
          )}
          <span className="text-[10px] text-zinc-500 font-semibold block leading-none">{subtitle}</span>
        </div>

        <div className="h-8 w-20 opacity-60 group-hover:opacity-100 transition-opacity">
          <svg viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            <polyline
              fill="none"
              stroke={trend?.isPositive ? "#10b981" : "#ef4444"}
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
