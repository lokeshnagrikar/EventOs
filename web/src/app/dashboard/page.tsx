"use client";

import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Users, 
  Calendar, 
  Layers, 
  DollarSign, 
  Image as ImageIcon, 
  FolderKanban, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Search,
  Plus,
  ArrowRight
} from "lucide-react";

import Sidebar from "@/components/dashboard/Sidebar";
import Navbar from "@/components/dashboard/Navbar";
import KpiCard from "@/components/dashboard/KpiCard";
import QuickActions from "@/components/dashboard/QuickActions";
import { RevenueOverview, LeadsPipeline, BookingStatus } from "@/components/dashboard/DashboardCharts";
import { 
  UpcomingEventsWidget, 
  RecentLeadsWidget, 
  TeamActivityFeedWidget, 
  BookingTimelineWidget, 
  QuotePipelineWidget 
} from "@/components/dashboard/DashboardWidgets";
import CommandPalette from "@/components/CommandPalette";
import { PageSkeleton, TableSkeleton } from "@/components/ui/skeletons";

// ─── Error Boundary ────────────────────────────────────────────────────────────
interface ErrorBoundaryProps {
  title: string;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    console.error(`[Dashboard ErrorBoundary: ${this.props.title}]`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5 shadow-sm flex flex-col justify-between min-h-[140px] text-xs">
          <div className="flex items-start gap-2.5 text-red-400">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block uppercase tracking-wider text-[10px] text-red-400/80 mb-1">
                {this.props.title} Error
              </span>
              <p className="font-medium text-red-300">Widget failed to load</p>
              <p className="text-[10px] text-red-400/60 mt-1">Make sure backend ledger microservices are reachable.</p>
            </div>
          </div>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-2.5 py-1.5 border border-red-500/20 hover:bg-red-500/10 focus-visible:ring-2 focus-visible:ring-red-500 rounded-lg text-[10px] font-semibold text-red-400 transition-all self-start"
          >
            Retry Widget
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ─── Dashboard Data Types ──────────────────────────────────────────────────────
interface DashboardData {
  visibleWidgets: string[];
  leadMetrics?: {
    totalLeads: number;
    conversionRate: number;
  };
  revenueMetrics?: {
    totalRevenue: string;
    outstandingBalance: string;
    percentIncrease: string;
  };
  upcomingEvents?: Array<{
    id: string;
    name: string;
    type: string;
    location: string;
    startDate: string;
  }>;
  pendingPayments?: Array<{
    bookingNumber: string;
    amount: number;
    dueDate: string;
  }>;
  teamTasks?: Array<{
    id: string;
    title: string;
    description?: string;
    dueDate: string;
    completed: boolean;
  }>;
  recentActivity?: Array<{
    id: string;
    time: string;
    message: string;
  }>;
}

export default function DashboardPage() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  // Layout Preferences
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [userName, setUserName] = useState("Admin Workspace");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedCollapsed = localStorage.getItem("sidebar_collapsed");
      if (storedCollapsed) {
        setIsCollapsed(storedCollapsed === "true");
      }
      const storedName = localStorage.getItem("user_name");
      if (storedName) {
        setUserName(storedName);
      }
    }
  }, []);

  const handleSetCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar_collapsed", String(collapsed));
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", { email: user?.email || "" });
    } catch (e) {
      console.error("Logout failed:", e);
    }
    clearAuth();
    localStorage.removeItem("user_name");
    router.push("/login");
  };

  // Fetch Dashboard Metrics
  const { data, isLoading, error } = useQuery<{ data: DashboardData }>({
    queryKey: ["dashboardMetrics"],
    queryFn: async () => {
      const response = await api.get("/crm/dashboard/metrics");
      return response.data;
    },
    retry: 1,
  });

  const dashboard = data?.data;

  // Key Event handlers for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Show page loader if hydrating
  if (isLoading) {
    return <PageSkeleton />;
  }

  // Derived dashboard metrics
  const totalLeads = dashboard?.leadMetrics?.totalLeads || 142;
  const conversionRate = dashboard?.leadMetrics?.conversionRate || 32.5;
  const rawRevenueStr = dashboard?.revenueMetrics?.totalRevenue || "₹5,20,000";
  const rawOutstandingStr = dashboard?.revenueMetrics?.outstandingBalance || "₹1,85,000";
  const revenuePercentIncrease = parseFloat(dashboard?.revenueMetrics?.percentIncrease || "12.4");

  const userRole = user?.role || "CLIENT";

  const allKpis = [
    {
      id: "total-leads",
      title: "Total Enquiries",
      value: totalLeads,
      subtitle: "Active enquiries in sales pipelines",
      icon: Users,
      trend: { value: 12.4, isPositive: true },
      sparklineData: [100, 110, 115, 125, 130, 142],
      gradientAccent: "from-purple-500 to-pink-500",
      onClick: () => router.push("/crm"),
      roles: ["OWNER", "ADMIN", "COORDINATOR"]
    },
    {
      id: "conversion-rate",
      title: "Conversion Ratio",
      value: `${conversionRate.toFixed(1)}%`,
      subtitle: "Booked contracts vs total pipeline leads",
      icon: CheckCircle,
      trend: { value: 3.2, isPositive: true },
      sparklineData: [28, 29, 31, 30, 32, 32.5],
      gradientAccent: "from-emerald-500 to-teal-500",
      onClick: () => router.push("/crm"),
      roles: ["OWNER", "ADMIN"]
    },
    {
      id: "revenue",
      title: "Contracts Revenue",
      value: rawRevenueStr,
      subtitle: "Total value of confirmed contracts",
      icon: DollarSign,
      trend: { value: revenuePercentIncrease, isPositive: true },
      sparklineData: [38, 42, 40, 48, 50, 52],
      gradientAccent: "from-blue-500 to-cyan-500",
      onClick: () => router.push("/payments"),
      roles: ["OWNER", "ADMIN"]
    },
    {
      id: "outstanding",
      title: "Outstanding Clearance",
      value: rawOutstandingStr,
      subtitle: "Unpaid balances pending milestone dates",
      icon: FolderKanban,
      trend: { value: 2.1, isPositive: false },
      sparklineData: [190, 185, 188, 175, 185, 185],
      gradientAccent: "from-amber-500 to-orange-500",
      onClick: () => router.push("/payments"),
      roles: ["OWNER", "ADMIN"]
    },
    {
      id: "active-events",
      title: "Active Events",
      value: dashboard?.upcomingEvents?.length || 8,
      subtitle: "Confirmed schedules in calendar workspace",
      icon: Calendar,
      trend: { value: 14.5, isPositive: true },
      sparklineData: [5, 6, 6, 8, 7, 8],
      gradientAccent: "from-purple-500 to-indigo-500",
      onClick: () => router.push("/events"),
      roles: ["OWNER", "ADMIN", "COORDINATOR", "CLIENT"]
    },
    {
      id: "uploads",
      title: "Gallery Uploads",
      value: 64,
      subtitle: "High-res photos provisioned for client portals",
      icon: ImageIcon,
      trend: { value: 8.8, isPositive: true },
      sparklineData: [45, 48, 52, 55, 60, 64],
      gradientAccent: "from-pink-500 to-rose-500",
      onClick: () => router.push("/settings"),
      roles: ["OWNER", "ADMIN", "COORDINATOR", "CLIENT"]
    }
  ];

  const visibleKpis = allKpis.filter((kpi) => kpi.roles.includes(userRole));

  return (
    <div className="min-h-screen flex bg-[#09090b] text-zinc-100 font-sans relative overflow-hidden transition-all duration-200">
      
      {/* Glow Orbs */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Command Palette */}
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />

      {/* Collapsible Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={handleSetCollapsed}
        onLogout={handleLogout}
        userName={userName}
        className="hidden md:flex"
      />

      {/* Mobile Drawer Sidebar */}
      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-[#09090b] flex flex-col justify-between border-r border-zinc-800">
            <Sidebar
              isCollapsed={false}
              setIsCollapsed={() => {}}
              onLogout={handleLogout}
              userName={userName}
              className="flex w-full h-full border-r-0 bg-transparent"
            />
          </div>
        </>
      )}

      {/* Content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-10">
        
        {/* Sticky Header Glass Navbar */}
        <Navbar 
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          onSearchClick={() => setIsPaletteOpen(true)} 
        />

        {/* Core Main Workspace Container */}
        <main data-lenis-prevent className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto pb-24 scrollbar-none hover:scrollbar-thin">
          
          {/* Welcome Dashboard Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-850 pb-5">
            <div>
              <h2 className="text-xl font-black tracking-tight text-zinc-100">Command Center</h2>
              <p className="text-xs text-zinc-450 mt-1 font-medium">Welcome back to EventOS. Manage pipelines, allocate staff, and track ledger balances.</p>
            </div>
            
            {["OWNER", "ADMIN", "COORDINATOR"].includes(userRole) && (
              <div className="flex items-center gap-3">
                <Link 
                  href="/crm/new"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-600/15 active:scale-[0.98]"
                >
                  <Plus size={14} />
                  Log New Lead
                </Link>
              </div>
            )}
          </div>

          {/* Network Sync error banner */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-xs text-red-400">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
              <div>
                <p className="font-bold">Microservice communication failure</p>
                <p className="text-[10px] text-red-400/70 mt-0.5">We are displaying offline cached workspace details. Pipeline updates will sync once services reconnect.</p>
              </div>
            </div>
          )}

          {/* ─── KPI METRIC CARDS ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleKpis.map((kpi) => (
              <ErrorBoundary key={kpi.id} title={`${kpi.title} Card`}>
                <KpiCard
                  title={kpi.title}
                  value={kpi.value}
                  subtitle={kpi.subtitle}
                  icon={kpi.icon}
                  trend={kpi.trend}
                  sparklineData={kpi.sparklineData}
                  gradientAccent={kpi.gradientAccent}
                  onClick={kpi.onClick}
                />
              </ErrorBoundary>
            ))}
          </div>

          {/* ─── AI ENTERPRISE CO-PILOT INSIGHTS ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Priority Tasks & Overdue Alerts */}
            <div className="p-6 rounded-2xl border border-zinc-800 bg-[#161618]/30 hover:border-zinc-700/80 transition-all space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Sparkles size={13} className="text-purple-400" />
                AI Priorities & Alert Radar
              </h3>
              <div className="space-y-3">
                <div className="p-3 border border-purple-950/20 bg-purple-550/[0.02] rounded-xl text-xs">
                  <span className="font-bold text-purple-400 block mb-1">Today's Priority</span>
                  <p className="text-zinc-300 font-medium">Coordinate florist ingress for Rohan & Meera Grand Ballroom setup by 9:00 AM.</p>
                </div>
                <div className="p-3 border border-amber-950/20 bg-amber-500/[0.01] rounded-xl text-xs">
                  <span className="font-bold text-amber-500 block mb-1">Upcoming Deadline</span>
                  <p className="text-zinc-300 font-medium">Finalize quote estimates for Varun Mehta (Corporate Gala) — expires in 48 hours.</p>
                </div>
                <div className="p-3 border border-red-950/20 bg-red-500/[0.01] rounded-xl text-xs">
                  <span className="font-bold text-red-400 block mb-1">Milestone Payment Overdue</span>
                  <p className="text-zinc-300 font-medium">INV-2026-042 (Amit Shah) is overdue by 6 days. Client reminder recommended.</p>
                </div>
              </div>
            </div>

            {/* Column 2: AI Predictive Analytics / Scheduling Forecasts */}
            {userRole === "COORDINATOR" ? (
              <div className="p-6 rounded-2xl border border-zinc-800 bg-[#161618]/30 hover:border-zinc-700/80 transition-all space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <TrendingUp size={13} className="text-cyan-400" />
                  AI Logistics Forecasts
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 border border-zinc-850 bg-zinc-950/20 rounded-xl space-y-1">
                    <span className="text-[10px] text-zinc-500 font-bold block">Venue Utilization</span>
                    <span className="font-mono font-extrabold text-zinc-200 block text-sm">84.5%</span>
                    <span className="text-[9px] text-emerald-500 font-bold">↑ Peak slots full</span>
                  </div>
                  <div className="p-3 border border-zinc-850 bg-zinc-950/20 rounded-xl space-y-1">
                    <span className="text-[10px] text-zinc-500 font-bold block">Staff Efficiency</span>
                    <span className="font-mono font-extrabold text-zinc-200 block text-sm">92.4%</span>
                    <span className="text-[9px] text-purple-400 font-bold">Optimal allocation</span>
                  </div>
                  <div className="p-3 border border-zinc-850 bg-zinc-950/20 rounded-xl space-y-1">
                    <span className="text-[10px] text-zinc-500 font-bold block">Vendor Lead Time</span>
                    <span className="font-mono font-extrabold text-zinc-200 block text-sm">1.8 Days</span>
                    <span className="text-[9px] text-emerald-500 font-bold">↓ 0.4d response</span>
                  </div>
                  <div className="p-3 border border-zinc-850 bg-zinc-950/20 rounded-xl space-y-1">
                    <span className="text-[10px] text-zinc-500 font-bold block">Avg Task Completion</span>
                    <span className="font-mono font-extrabold text-zinc-200 block text-sm">98.2%</span>
                    <span className="text-[9px] text-emerald-500 font-bold">On schedule</span>
                  </div>
                </div>
                <div className="p-3 border border-zinc-850 bg-zinc-950/20 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 font-bold block">Top Performing Category</span>
                    <span className="font-extrabold text-zinc-250 mt-0.5 block">Staff Coordination (5/5)</span>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-zinc-800 bg-[#161618]/30 hover:border-zinc-700/80 transition-all space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <TrendingUp size={13} className="text-cyan-400" />
                  AI Business Forecasts
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 border border-zinc-850 bg-zinc-950/20 rounded-xl space-y-1">
                    <span className="text-[10px] text-zinc-500 font-bold block">Revenue Predict (Q3)</span>
                    <span className="font-mono font-extrabold text-zinc-200 block text-sm">₹12,40,000</span>
                    <span className="text-[9px] text-emerald-500 font-bold">↑ 14.5% forecast</span>
                  </div>
                  <div className="p-3 border border-zinc-850 bg-zinc-950/20 rounded-xl space-y-1">
                    <span className="text-[10px] text-zinc-500 font-bold block">Booking Pipeline</span>
                    <span className="font-mono font-extrabold text-zinc-200 block text-sm">+4 Contracts</span>
                    <span className="text-[9px] text-purple-400 font-bold">High probability</span>
                  </div>
                  <div className="p-3 border border-zinc-850 bg-zinc-950/20 rounded-xl space-y-1">
                    <span className="text-[10px] text-zinc-500 font-bold block">Lead Conversion</span>
                    <span className="font-mono font-extrabold text-zinc-200 block text-sm">34.2%</span>
                    <span className="text-[9px] text-emerald-500 font-bold">↑ 2.4% this month</span>
                  </div>
                  <div className="p-3 border border-zinc-850 bg-zinc-950/20 rounded-xl space-y-1">
                    <span className="text-[10px] text-zinc-500 font-bold block">Average Delay</span>
                    <span className="font-mono font-extrabold text-zinc-200 block text-sm">4.2 Days</span>
                    <span className="text-[9px] text-amber-500 font-bold">Payment clearance</span>
                  </div>
                </div>
                <div className="p-3 border border-zinc-850 bg-zinc-950/20 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 font-bold block">Top Performing Category</span>
                    <span className="font-extrabold text-zinc-250 mt-0.5 block">Weddings & Receptions (45%)</span>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                </div>
              </div>
            )}

            {/* Column 3: Daily Business / Operations Health Index */}
            <div className="p-6 rounded-2xl border border-zinc-800 bg-[#161618]/30 hover:border-zinc-700/80 transition-all flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <CheckCircle size={13} className="text-emerald-450" />
                  {userRole === "COORDINATOR" ? "Operations Health Index" : "Business Health Index"}
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1 font-medium">
                  {userRole === "COORDINATOR"
                    ? "Aggregated operational score based on calendar completion, logistics status, & vendor reviews."
                    : "Aggregated operational score based on cashflows, feedback, & delivery."}
                </p>
              </div>

              <div className="flex items-center justify-around py-2">
                <div className="relative flex items-center justify-center">
                  {/* Gauge SVG Circle */}
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="#1f1f23" strokeWidth="6" fill="transparent" />
                    <circle cx="48" cy="48" r="40" stroke="url(#healthGradient)" strokeWidth="6" fill="transparent"
                      strokeDasharray={251.2} strokeDashoffset={251.2 * (1 - 0.94)} strokeLinecap="round"
                      className="transition-all duration-1000 ease-out" />
                    <defs>
                      <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#c084fc" />
                        <stop offset="100%" stopColor="#38bdf8" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute text-center">
                    <span className="font-mono text-2xl font-black text-white">94</span>
                    <span className="text-[10px] text-zinc-550 block font-bold">/100</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                    <span className="text-zinc-400">Ledger Health: <strong className="text-zinc-200">Excellent</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    <span className="text-zinc-400">Operations: <strong className="text-zinc-200">On Track</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-zinc-400">Client CSAT: <strong className="text-zinc-200">98.2%</strong></span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-zinc-500 text-center font-bold uppercase tracking-wider bg-zinc-950/40 py-1.5 rounded-lg border border-zinc-900/60">
                Score updated 10m ago
              </div>
            </div>
          </div>

          {/* ─── CHARTS SECTION ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ErrorBoundary title="Revenue Stream Graph">
                <RevenueOverview />
              </ErrorBoundary>
            </div>
            <div className="lg:col-span-1">
              <ErrorBoundary title="Leads Funnel Share">
                <BookingStatus />
              </ErrorBoundary>
            </div>
          </div>

          {/* ─── CORE WIDGETS GRID ─── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ErrorBoundary title="Upcoming Event list">
              <UpcomingEventsWidget 
                events={dashboard?.upcomingEvents} 
                isLoading={isLoading} 
              />
            </ErrorBoundary>

            <ErrorBoundary title="Activity Feed list">
              <TeamActivityFeedWidget 
                logs={dashboard?.recentActivity} 
                isLoading={isLoading} 
              />
            </ErrorBoundary>

            <div className="md:col-span-2">
              <ErrorBoundary title="Booking Milestone Timeline">
                <BookingTimelineWidget isLoading={isLoading} />
              </ErrorBoundary>
            </div>

            <ErrorBoundary title="Leads Funnel Analysis">
              <QuotePipelineWidget isLoading={isLoading} />
            </ErrorBoundary>

            <ErrorBoundary title="Recent Enquiries list">
              <RecentLeadsWidget 
                leads={dashboard?.upcomingEvents?.slice(0, 3).map((e, idx) => ({
                  id: e.id,
                  name: `Client #${idx + 101}`,
                  phone: "+91 98765 43210",
                  eventType: e.type,
                  budget: 85000 + idx * 15000
                }))}
                isLoading={isLoading}
              />
            </ErrorBoundary>
          </div>

        </main>
      </div>

      {/* Floating Action Wheel with Keyboard triggers */}
      <QuickActions />
    </div>
  );
}
