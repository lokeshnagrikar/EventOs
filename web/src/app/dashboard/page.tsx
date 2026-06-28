"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { 
  Calendar, 
  DollarSign, 
  FileText, 
  FolderKanban, 
  Layers, 
  LayoutDashboard, 
  Moon, 
  Plus, 
  Settings, 
  Sun, 
  TrendingUp, 
  User, 
  Users,
  LogOut,
  AlertCircle,
  Calculator,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  Sparkles,
  Search,
  CheckSquare,
  Menu,
  X
} from "lucide-react";
import CommandPalette from "@/components/CommandPalette";

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
    status: string;
    startDate: string;
    location: string;
  }>;
  pendingPayments?: Array<{
    bookingNumber: string;
    dueDate: string;
    amount: number;
    status: string;
  }>;
  recentActivity?: Array<{
    id: string;
    time: string;
    message: string;
  }>;
  teamTasks?: Array<{
    id: string;
    title: string;
    description: string;
    scheduledTime: string;
    completed: boolean;
  }>;
}

// Reusable local Error Boundary for widgets
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; title: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; title: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error(`ErrorBoundary caught an error in widget "${this.props.title}":`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5 shadow-sm flex flex-col justify-between min-h-[140px] text-xs">
          <div className="flex items-start gap-2.5 text-red-400">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block uppercase tracking-wider text-[10px] text-red-400/80 mb-1">
                {this.props.title} Error
              </span>
              <p className="font-medium text-red-300">Widget failed to render</p>
              <p className="text-[10px] text-red-400/60 mt-1">Please sync the database or check system configurations.</p>
            </div>
          </div>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-2.5 py-1.5 border border-red-500/20 hover:bg-red-500/10 focus-visible:ring-2 focus-visible:ring-red-500 rounded text-[10px] font-semibold text-red-400 transition-all self-start focus-visible:outline-none"
          >
            Retry Widget
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function DashboardPage() {
  const { user, clearAuth } = useAuthStore();
  const [darkMode, setDarkMode] = useState(true);
  const [userName, setUserName] = useState("User");
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Read cached username from login session
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("user_name");
      if (storedName) {
        setUserName(storedName);
      }
      const cookieTheme = document.cookie
        .split("; ")
        .find(row => row.startsWith("theme="))
        ?.split("=")[1] || "";
      const isDark = cookieTheme ? cookieTheme === "dark" : true;
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }

    // Command palette global key listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleTheme = () => {
    const nextTheme = !darkMode ? "dark" : "light";
    setDarkMode(!darkMode);
    if (typeof window !== "undefined") {
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      document.cookie = `theme=${nextTheme}; path=/; max-age=31536000; SameSite=Strict`;
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
    window.location.href = "/login";
  };

  // TanStack Query: Fetch dashboard metrics (including dynamic widget list)
  const { data, isLoading, error, refetch } = useQuery<{ data: DashboardData }>({
    queryKey: ["dashboardMetrics"],
    queryFn: async () => {
      const response = await api.get("/crm/dashboard/metrics");
      return response.data;
    },
    retry: 1,
  });

  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    try {
      await api.delete("/crm/dashboard/metrics/cache");
    } catch (e) {
      console.error("Failed to invalidate dashboard cache during manual sync:", e);
    } finally {
      await refetch();
      setIsSyncing(false);
    }
  };

  const dashboard = data?.data;
  const visibleWidgets = dashboard?.visibleWidgets || [];

  const showWidget = (key: string) => visibleWidgets.includes(key);

  // Render Shimmer Loaders during fetch
  const renderShimmer = () => (
    <div className="animate-pulse space-y-3 w-full">
      <div className="h-4 bg-zinc-800/40 rounded w-1/3"></div>
      <div className="h-8 bg-zinc-800/40 rounded w-2/3"></div>
      <div className="h-3 bg-zinc-800/40 rounded w-1/2"></div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground transition-colors duration-200 relative overflow-hidden">
      
      {/* Background glow effects to match landing page theme */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Command palette */}
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />

      {/* Mobile Sticky Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-border bg-card/85 backdrop-blur-md md:hidden relative z-10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-purple-500/20">
            E
          </div>
          <div>
            <h1 className="font-semibold text-base leading-none">EventOS</h1>
            <span className="text-[10px] text-zinc-400">The Event Business OS</span>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 border border-border rounded-md hover:bg-secondary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition-all"
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card p-6 flex flex-col justify-between shrink-0
        transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static md:flex
      `}>
        <div>
          {/* Logo Section */}
          <div className="flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-purple-500/20">
              E
            </div>
            <div>
              <h2 className="font-semibold text-base leading-none">EventOS</h2>
              <span className="text-xs text-zinc-400">The Event Business OS</span>
            </div>
          </div>

          {/* Search Shortcut */}
          <button 
            onClick={() => {
              setIsPaletteOpen(true);
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-border rounded-xl bg-background/50 text-sm text-zinc-400 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition-all mb-6"
          >
            <span className="flex items-center gap-2">
              <Search size={14} className="text-zinc-400" />
              Search workspace...
            </span>
            <kbd className="text-xs bg-muted px-1.5 py-0.5 rounded border border-border font-mono select-none">⌘K</kbd>
          </button>

          {/* Menu Links */}
          <nav className="space-y-1">
            <a 
              href="/dashboard" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition-all shadow-sm shadow-purple-500/5"
            >
              <LayoutDashboard size={18} />
              Dashboard
            </a>
            <a 
              href="/crm" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-foreground hover:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none text-sm transition-all"
            >
              <Users size={18} />
              CRM / Leads
            </a>
            <a 
              href="/events" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-foreground hover:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none text-sm transition-all"
            >
              <Calendar size={18} />
              Events / Calendar
            </a>
            <a 
              href="/bookings" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-foreground hover:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none text-sm transition-all"
            >
              <Layers size={18} />
              Bookings
            </a>
            <a 
              href="/quotes" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-foreground hover:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none text-sm transition-all"
            >
              <FileText size={18} />
              Quotes
            </a>
            <a 
              href="/payments" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-foreground hover:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none text-sm transition-all"
            >
              <DollarSign size={18} />
              Payments
            </a>
            <a 
              href="/invoices" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-foreground hover:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none text-sm transition-all"
            >
              <FileSpreadsheet size={18} />
              Invoices
            </a>
            <a 
              href="/calculator" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-foreground hover:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none text-sm transition-all"
            >
              <Calculator size={18} />
              Budget Calculator
            </a>
          </nav>
        </div>

        {/* User and Settings Footer */}
        <div className="pt-6 border-t border-border mt-8 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-zinc-400">
                <User size={16} />
              </div>
              <div>
                <p className="text-xs font-semibold leading-none">{userName}</p>
                <span className="text-[10px] text-zinc-400 text-ellipsis overflow-hidden max-w-[100px] block">Admin Workspace</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={toggleTheme} 
                className="h-8 w-8 rounded-md bg-secondary hover:bg-border flex items-center justify-center text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition-all"
                aria-label="Toggle theme"
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button 
                onClick={handleLogout} 
                className="h-8 w-8 rounded-md bg-secondary hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center text-zinc-400 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none transition-all"
                aria-label="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
          <a 
            href="/settings" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-foreground hover:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none text-sm transition-all"
          >
            <Settings size={18} />
            Settings
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto space-y-8 relative z-10">
        
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Command Center</h2>
            <p className="text-sm text-zinc-400 font-medium">Welcome back to your EventOS dashboard. Press <kbd className="bg-secondary px-1.5 py-0.5 rounded border text-[10px] font-mono select-none">Ctrl+K</kbd> anywhere to start navigating.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSyncDatabase} 
              disabled={isSyncing || isLoading}
              className="px-3 py-2 border border-border bg-card hover:bg-secondary disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-xl text-xs font-semibold transition-all"
            >
              {isSyncing ? "Syncing..." : "Sync Database"}
            </button>
            <button 
              onClick={() => (window.location.href = "/crm")}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-xl text-sm font-bold transition-all shadow-md shadow-purple-600/10 active:scale-[0.98]"
            >
              <Plus size={16} />
              Create New Lead
            </button>
          </div>
        </header>

        {/* Global Error Banner */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Backend sync failed</p>
              <p className="text-xs text-red-400/80">Make sure the Spring Boot microservices and API Gateway are running. Displaying cached dashboard profiles.</p>
            </div>
          </div>
        )}

        {/* BENTO GRID COMMAND CENTER */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Widget 1: Total Leads */}
          {showWidget("totalLeads") && (
            <ErrorBoundary title="Total Leads">
              <div className="p-6 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between min-h-[140px] hover:border-purple-500/30 hover:shadow-[0_0_25px_rgba(139,92,246,0.06)] transition-all duration-300 group">
                {isLoading ? renderShimmer() : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Active Leads</span>
                      <div className="h-7 w-7 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <FolderKanban size={14} />
                      </div>
                    </div>
                    <div>
                      <p className="text-3xl font-extrabold tracking-tight group-hover:text-purple-450 transition-colors">
                        {dashboard?.leadMetrics?.totalLeads || 0} Leads
                      </p>
                      <p className="text-xs text-zinc-400 mt-1 font-medium">Active sales pipeline tracker</p>
                    </div>
                  </>
                )}
              </div>
            </ErrorBoundary>
          )}

          {/* Widget 2: Conversion Rate */}
          {showWidget("conversionRate") && (
            <ErrorBoundary title="Conversion Rate">
              <div className="p-6 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between min-h-[140px] hover:border-emerald-500/30 hover:shadow-[0_0_25px_rgba(16,185,129,0.06)] transition-all duration-300 group">
                {isLoading ? renderShimmer() : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Conversion Ratio</span>
                      <div className="h-7 w-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <CheckCircle size={14} />
                      </div>
                    </div>
                    <div>
                      <p className="text-3xl font-extrabold tracking-tight group-hover:text-emerald-400 transition-colors">
                        {dashboard?.leadMetrics?.conversionRate?.toFixed(1) || "0.0"}%
                      </p>
                      <p className="text-xs text-zinc-400 mt-1 font-medium">Booked contracts vs total pipelines</p>
                    </div>
                  </>
                )}
              </div>
            </ErrorBoundary>
          )}

          {/* Widget 3: Revenue Overview */}
          {showWidget("revenueMetrics") && (
            <ErrorBoundary title="Revenue Stream">
              <div className="p-6 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between min-h-[140px] md:col-span-1 hover:border-purple-500/30 hover:shadow-[0_0_25px_rgba(139,92,246,0.06)] transition-all duration-300 group">
                {isLoading ? renderShimmer() : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Revenue Stream</span>
                      <div className="h-7 w-7 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <DollarSign size={14} />
                      </div>
                    </div>
                    <div>
                      <p className="text-3xl font-extrabold tracking-tight group-hover:text-purple-450 transition-colors">
                        {dashboard?.revenueMetrics?.totalRevenue || "INR 0"}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-500 mt-2 font-medium">
                        <TrendingUp size={14} />
                        <span>{dashboard?.revenueMetrics?.percentIncrease || "+12%"} vs last month</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ErrorBoundary>
          )}

          {/* Widget 4: Upcoming Events */}
          {showWidget("upcomingEvents") && (
            <ErrorBoundary title="Upcoming Schedules">
              <div className="p-6 rounded-xl border border-border bg-card shadow-sm md:col-span-2 space-y-4 hover:border-purple-500/10 transition-all">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Calendar size={14} className="text-purple-400" />
                  Upcoming Schedules
                </h3>
                {isLoading ? (
                  <div className="space-y-2 py-2">
                    <div className="h-5 bg-zinc-800/40 rounded w-full animate-pulse"></div>
                    <div className="h-5 bg-zinc-800/40 rounded w-5/6 animate-pulse"></div>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    {dashboard?.upcomingEvents?.map((evt) => (
                      <div key={evt.id} className="flex justify-between items-center p-3 border border-border rounded-lg bg-background/50 hover:border-primary/20 transition-all">
                        <div>
                          <span className="font-bold text-zinc-100 block">{evt.name}</span>
                          <span className="text-[10px] text-zinc-400 block pt-0.5">{evt.type} • {evt.location}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold block text-zinc-300">
                            {new Date(evt.startDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    {(!dashboard?.upcomingEvents || dashboard.upcomingEvents.length === 0) && (
                      <p className="text-xs text-zinc-400 italic py-3 text-center">No upcoming events found.</p>
                    )}
                  </div>
                )}
              </div>
            </ErrorBoundary>
          )}

          {/* Widget 5: Pending Payments */}
          {showWidget("pendingPayments") && (
            <ErrorBoundary title="Pending Clearance">
              <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-4 hover:border-purple-500/10 transition-all">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <DollarSign size={14} className="text-purple-400" />
                  Pending Clearance
                </h3>
                {isLoading ? (
                  <div className="space-y-2 py-2">
                    <div className="h-4 bg-zinc-800/40 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-zinc-800/40 rounded w-4/5 animate-pulse"></div>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    {dashboard?.pendingPayments?.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 border border-border rounded-lg bg-background/50 hover:border-purple-500/20 transition-all">
                        <div>
                          <span className="font-bold text-zinc-200 block">{p.bookingNumber}</span>
                          <span className="text-[10px] text-zinc-400 block pt-0.5">Due: {new Date(p.dueDate).toLocaleDateString()}</span>
                        </div>
                        <span className="font-bold font-mono text-amber-500">
                          INR {p.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {(!dashboard?.pendingPayments || dashboard.pendingPayments.length === 0) && (
                      <p className="text-xs text-zinc-400 italic py-3 text-center">No pending payments found.</p>
                    )}
                  </div>
                )}
              </div>
            </ErrorBoundary>
          )}

          {/* Widget 6: Team Tasks */}
          {showWidget("teamTasks") && (
            <ErrorBoundary title="Operational Tasks">
              <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-4 hover:border-purple-500/10 transition-all">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <CheckSquare size={14} className="text-purple-400" />
                  Operational Tasks
                </h3>
                {isLoading ? (
                  <div className="space-y-2 py-2">
                    <div className="h-4 bg-zinc-800/40 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-zinc-800/40 rounded w-3/4 animate-pulse"></div>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    {dashboard?.teamTasks?.map((task) => (
                      <div key={task.id} className="flex items-start gap-2.5 p-3 border border-border rounded-lg bg-background/50 hover:border-purple-500/20 transition-all">
                        <input 
                          type="checkbox" 
                          id={`task-${task.id}`}
                          checked={task.completed} 
                          readOnly
                          aria-label={`Mark task as completed: ${task.title}`}
                          className="mt-0.5 accent-primary h-3.5 w-3.5 rounded cursor-not-allowed focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none" 
                        />
                        <label htmlFor={`task-${task.id}`} className="cursor-not-allowed flex-1">
                          <span className="font-bold text-zinc-200 block">{task.title}</span>
                          <span className="text-[10px] text-zinc-400 block pt-0.5">{task.description}</span>
                        </label>
                      </div>
                    ))}
                    {(!dashboard?.teamTasks || dashboard.teamTasks.length === 0) && (
                      <p className="text-xs text-zinc-400 italic py-3 text-center">All operational tasks checked off.</p>
                    )}
                  </div>
                )}
              </div>
            </ErrorBoundary>
          )}

          {/* Widget 7: Recent Activity Logs */}
          {showWidget("recentActivity") && (
            <ErrorBoundary title="Activity Logs">
              <div className="p-6 rounded-xl border border-border bg-card shadow-sm md:col-span-2 space-y-4 hover:border-purple-500/10 transition-all">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Sparkles size={14} className="text-purple-400" />
                  Activity logs
                </h3>
                {isLoading ? (
                  <div className="space-y-4 py-2">
                    <div className="h-4 bg-zinc-800/40 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-zinc-800/40 rounded w-4/5 animate-pulse"></div>
                  </div>
                ) : (
                  <div className="relative border-l border-border pl-4 space-y-6 text-xs ml-2 py-1">
                    {dashboard?.recentActivity?.map((activity) => (
                      <div key={activity.id} className="relative">
                        <div className="absolute -left-[21px] mt-1 h-2 w-2 rounded-full bg-purple-500 ring-4 ring-card"></div>
                        <p className="font-bold text-[10px] text-zinc-400">{activity.time}</p>
                        <p className="text-zinc-200 mt-0.5 leading-normal">{activity.message}</p>
                      </div>
                    ))}
                    {(!dashboard?.recentActivity || dashboard.recentActivity.length === 0) && (
                      <p className="text-xs text-zinc-400 italic py-2">No recent logs.</p>
                    )}
                  </div>
                )}
              </div>
            </ErrorBoundary>
          )}

        </div>

      </main>

    </div>
  );
}
