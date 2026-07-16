"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  TrendingUp,
  DollarSign,
  Users,
  Building,
  ArrowLeft,
  Search,
  Sparkles,
  Zap,
  Globe,
  Sliders,
  Bell,
  RefreshCw,
  Cpu,
  Mail,
  Lock,
  ChevronRight,
  LineChart,
  UserCheck,
  Ban,
  Activity,
  FileText,
  Clock,
  Play,
  Pause,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  Database,
  Trash2,
  LockKeyhole,
  CheckCheck,
  Eye,
  SlidersHorizontal,
  FolderOpen,
  ArrowUpRight,
  Download,
  AlertOctagon,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useToastStore } from "@/lib/toastStore";
import { useAuthStore } from "@/store/authStore";
import PageShell from "@/components/ui/PageShell";
import { cn } from "@/lib/utils";
import { ADMIN_ROLES } from "./constants";

// Mock revenue data for charts
const REVENUE_DATA = [
  { month: "Jan", revenue: 14200, users: 2100 },
  { month: "Feb", revenue: 18900, users: 2900 },
  { month: "Mar", revenue: 24100, users: 3800 },
  { month: "Apr", revenue: 31200, users: 4900 },
  { month: "May", revenue: 42800, users: 6500 },
  { month: "Jun", revenue: 58500, users: 8450 }
];

const MOCK_LIVE_ACTIVITIES = [
  { id: "a1", action: "Tenant apex_events upgraded to Enterprise", time: "Just now", type: "success" },
  { id: "a2", action: "Failed payment alert: Tenant elevate_orgs ($299)", time: "3 mins ago", type: "error" },
  { id: "a3", action: "New user registered: info@vercelfun.com", time: "7 mins ago", type: "info" },
  { id: "a4", action: "Database auto backup successfully uploaded to S3", time: "12 mins ago", type: "info" },
  { id: "a5", action: "Security threshold triggered: Blocked IP 192.168.1.104", time: "24 mins ago", type: "warning" },
];

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const { user, clearAuth } = useAuthStore();

  const [tenants, setTenants] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<
    "metrics" | "tenants" | "users" | "subscriptions" | "tickets" | "health" | "logs" | "flags" | "announcements" | "analytics" | "security" | "backups"
  >("metrics");

  const [searchQuery, setSearchQuery] = useState("");
  const [currentTheme, setCurrentTheme] = useState<"dark" | "light">("dark");

  // Get active admin sub-role (strict RBAC control check)
  const adminSubRole = user?.permissions?.[0] || "super_admin";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;

    const fetchSuperAdminData = async () => {
      try {
        const { apiClient } = require("@/lib/api-client");

        // Fetch dashboard metrics
        const resMetrics = await apiClient.get("/auth/billing/superadmin/dashboard");
        if (resMetrics.data?.success) {
          setMetrics(resMetrics.data.data);
        }

        // Fetch tenants
        const resTenants = await apiClient.get("/auth/billing/superadmin/tenants");
        if (resTenants.data?.success) {
          const formattedTenants = resTenants.data.data.map((t: any) => ({
            id: t.id,
            name: t.name,
            status: t.status,
            plan: t.subscription?.plan?.name || "Free Trial",
            users: t.usage?.usersCount || 0,
            storage: t.usage ? `${(t.usage.storageBytes / (1024 * 1024 * 1024)).toFixed(1)} GB` : "0.0 GB",
            revenue: t.subscription?.plan ? `$${t.subscription.plan.price}` : "$0",
            created: t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : "N/A"
          }));
          setTenants(formattedTenants);
        }

        // Fetch users
        const resUsers = await apiClient.get("/auth/billing/superadmin/users");
        if (resUsers.data?.success) {
          const formattedUsers = resUsers.data.data.map((u: any) => ({
            id: u.id,
            name: `${u.firstName} ${u.lastName || ""}`.trim(),
            email: u.email,
            tenant: u.tenant || "None",
            status: u.status,
            device: "Web Client",
            lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never"
          }));
          setUsers(formattedUsers);
        }
      } catch (err) {
        console.error("Failed to load super admin data:", err);
        addToast("Failed to fetch superadmin real-time metrics.", "error");
      } finally {
        setLoadingData(false);
      }
    };

    fetchSuperAdminData();
  }, [mounted, user]);

  // Mock support tickets (priority, status, assign, internal notes)
  const [tickets, setTickets] = useState([
    { id: "TKT-1", sender: "Apex Events", subject: "Custom Domain CNAME Resolution Fail", status: "OPEN", priority: "HIGH", assigned: "Support Bot", notes: "Awaiting domain verification dns cache update." },
    { id: "TKT-2", sender: "Elevate Agency", subject: "Invoice billing double charge discrepancy", status: "OPEN", priority: "MEDIUM", assigned: "Finance Bot", notes: "Requested Stripe transaction logs analysis." },
    { id: "TKT-3", sender: "Vercel Meetups", subject: "Unable to unlock photo gallery downloads", status: "CLOSED", priority: "LOW", assigned: "Support Bot", notes: "Resolved. Recommended paying pending invoices." }
  ]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [ticketNotes, setTicketNotes] = useState("");

  // Mock feature flags (emergency disable, rollout)
  const [featureFlags, setFeatureFlags] = useState([
    { id: "ai-assistant-v2", name: "AI Assistant V2 Conversational Copilot", enabled: true, rollout: 100, scope: "Global" },
    { id: "stripe-subscriptions", name: "Stripe Subscription Checkout", enabled: true, rollout: 100, scope: "Global" },
    { id: "ws-sync-engine", name: "WebSockets Realtime Sync Engine", enabled: false, rollout: 15, scope: "Beta Tenants" },
    { id: "custom-domain", name: "Workspace White-label Custom Domains", enabled: true, rollout: 50, scope: "Enterprise Tenants" }
  ]);

  // Mock database backups
  const [backups, setBackups] = useState([
    { id: "bak-1", name: "EventOS_Production_DB_Daily_20260707", size: "4.8 GB", status: "SUCCESS", created: "Today 04:00 AM" },
    { id: "bak-2", name: "EventOS_Production_DB_Daily_20260706", size: "4.7 GB", status: "SUCCESS", created: "Yesterday 04:00 AM" },
    { id: "bak-3", name: "EventOS_Production_DB_Daily_20260705", size: "4.7 GB", status: "SUCCESS", created: "2 days ago" },
  ]);

  // Mock server status
  const [servers] = useState([
    { name: "API Gateway", status: "HEALTHY", latency: "14ms", cpu: "12%", ram: "48%" },
    { name: "Auth Service", status: "HEALTHY", latency: "8ms", cpu: "8%", ram: "32%" },
    { name: "CRM Module", status: "HEALTHY", latency: "22ms", cpu: "18%", ram: "56%" },
    { name: "Gallery CDN", status: "DEGRADED", latency: "142ms", cpu: "42%", ram: "78%" },
    { name: "PostgreSQL Database", status: "HEALTHY", latency: "4ms", cpu: "24%", ram: "64%" },
    { name: "Redis Cache Clusters", status: "HEALTHY", latency: "1ms", cpu: "5%", ram: "28%" },
  ]);

  // Mock subscription checkouts log
  const [subscriptions] = useState([
    { id: "sub-1", tenant: "Apex Events", plan: "Professional", gateway: "Stripe", amt: "$4,200", interval: "Annual", date: "Today" },
    { id: "sub-2", tenant: "Dream Weddings", plan: "Enterprise", gateway: "Stripe", amt: "$1,50,000", interval: "Annual", date: "Yesterday" },
    { id: "sub-3", tenant: "Elevate Organizers", plan: "Starter", gateway: "Razorpay", amt: "$299", interval: "Monthly", date: "3 days ago" },
  ]);

  // Mock audit logs (who, when, what, before, after)
  const [auditLogs] = useState([
    { id: "ad-1", actor: "super_admin@eventos.co", action: "Toggle AI Assistant flag to true", before: "false", after: "true", ip: "192.168.1.1", time: "Just now" },
    { id: "ad-2", actor: "finance_admin@eventos.co", action: "Refunding transaction sub-9218", before: "$299 charged", after: "$299 refunded", ip: "184.12.85.19", time: "2 hours ago" },
    { id: "ad-3", actor: "developer@eventos.co", action: "Emergency backup override triggered", before: "idle", after: "backing_up", ip: "127.0.0.1", time: "5 hours ago" },
  ]);

  // Form states for broadcasting
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState("ALL");

  useEffect(() => {
    setMounted(true);
    // Enforce global Super Admin protection check
    if (!user || user.role !== "SUPER_ADMIN") {
      addToast("Unauthorized Access: Global administration credentials required.", "error");
      router.push("/superadmin/login");
    }
  }, [user, router, addToast]);

  const toggleTheme = () => {
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    setCurrentTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Helper check: Is current operator restricted to read-only? (Strict RBAC Auditor role check)
  const isReadOnly = adminSubRole === "auditor";

  // Check if current subrole has access to the active tab
  const hasAccessToTab = (tab: typeof activeSubTab) => {
    if (adminSubRole === "super_admin" || adminSubRole === "operations") return true;
    if (adminSubRole === "support_agent") {
      return ["tickets", "logs", "metrics"].includes(tab);
    }
    if (adminSubRole === "finance_admin") {
      return ["subscriptions", "tenants", "analytics", "metrics"].includes(tab);
    }
    if (adminSubRole === "developer") {
      return ["health", "logs", "flags", "backups", "metrics"].includes(tab);
    }
    if (adminSubRole === "auditor") {
      return ["metrics", "health", "logs", "analytics"].includes(tab);
    }
    return false;
  };

  // Mutation Wrapper: Intercept action buttons and display RBAC restrictions
  const executeAdminAction = (actionLabel: string, actionFn: () => void) => {
    if (isReadOnly) {
      addToast(`Restricted Action: ${actionLabel} rejected. Read-Only Auditor clearance only.`, "error");
      return;
    }
    actionFn();
  };

  // Impersonate customer (security bypass)
  const handleImpersonate = (tenantId: string, tenantName: string) => {
    executeAdminAction(`Impersonate ${tenantName}`, async () => {
      try {
        const { apiClient } = require("@/lib/api-client");
        const res = await apiClient.post(`/auth/billing/superadmin/tenants/${tenantId}/impersonate`);
        if (res.data?.success && res.data?.accessToken) {
          const token = res.data.accessToken;
          const payload = JSON.parse(atob(token.split(".")[1]));

          const memberships: import("@/store/authStore").WorkspaceMembership[] = [
            {
              tenantId: payload.tenantId,
              companyId: payload.tenantId,
              companyName: payload.companyName || tenantName,
              role: payload.roles,
              status: "ACTIVE"
            }
          ];

          // Save state in Zustand store
          useAuthStore.getState().setAuth(
            token,
            {
              id: payload.userId,
              email: payload.email,
              firstName: payload.firstName,
              lastName: payload.lastName,
              role: payload.roles,
              permissions: payload.permissions || []
            },
            payload.tenantId,
            memberships
          );

          // Store lightweight session flags
          document.cookie = "hasSession=true; path=/; SameSite=Lax";
          document.cookie = `user_name=${encodeURIComponent(payload.firstName)}; path=/; SameSite=Lax`;
          document.cookie = `user_role=${payload.roles}; path=/; SameSite=Lax`;
          localStorage.setItem("user_name", payload.firstName);
          localStorage.setItem("user_role", payload.roles);

          addToast(`🎭 Security Override: Spawning simulated sandbox for ${tenantName}. Welcome.`, "success");
          router.push("/dashboard");
        } else {
          addToast("Impersonation failed: Invalid response", "error");
        }
      } catch (err: any) {
        console.error("Impersonation failed:", err);
        addToast(err.response?.data?.message || "Failed to impersonate tenant", "error");
      }
    });
  };

  // Suspend/Reactivate tenant
  const handleToggleTenantStatus = (id: string, currentStatus: string) => {
    executeAdminAction("Modify tenant status", () => {
      const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      setTenants(tenants.map(t => t.id === id ? { ...t, status: nextStatus } : t));
      addToast(`Tenant status updated to ${nextStatus}.`, "success");
    });
  };

  // Deactivate/Reactivate user
  const handleToggleUserStatus = (id: string, currentStatus: string) => {
    executeAdminAction("Modify user status", () => {
      const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      setUsers(users.map(u => u.id === id ? { ...u, status: nextStatus } : u));
      addToast(`User account updated to ${nextStatus}.`, "success");
    });
  };

  // Reset user password
  const handleResetPassword = (email: string) => {
    executeAdminAction(`Reset password for ${email}`, () => {
      addToast(`🔑 Safe password reset link transmitted to: ${email}`, "success");
    });
  };

  // Force logout user session
  const handleForceLogout = (name: string) => {
    executeAdminAction(`Force logout ${name}`, () => {
      addToast(`🚫 Session terminated. Forced logout broadcasted for ${name}.`, "warning");
    });
  };

  if (!mounted || !user) return null;

  return (
    <PageShell>
      <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 text-zinc-300 font-sans select-none">

        {/* TOP STATUS BAR & OPERATOR PANEL */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-850 pb-5 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/settings")}
              className="p-2.5 border border-zinc-800 bg-zinc-950/40 rounded-xl hover:bg-zinc-900 transition cursor-pointer"
              aria-label="Back to Settings"
            >
              <ArrowLeft size={15} />
            </button>
            <div>
              <h1 className="text-sm font-black uppercase text-white flex items-center gap-2 tracking-wider">
                <Shield size={16} className="text-purple-500 animate-pulse" />
                EventOS Operations Hub
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-black tracking-widest uppercase font-mono">
                  SaaS Administration
                </span>
                <span className="text-[8px] text-zinc-550 font-bold uppercase tracking-wider font-mono">
                  Clearance: {ADMIN_ROLES.find(r => r.id === adminSubRole)?.name || "Default Operator"}
                </span>
                <span className="text-[8px] text-purple-400 font-bold uppercase tracking-wider font-mono">
                  Operator: {user.firstName} {user.lastName || ""} ({user.email})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark Mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 border border-zinc-855 bg-zinc-950/40 hover:bg-zinc-900 rounded-xl transition text-zinc-400 hover:text-white cursor-pointer"
              aria-label="Toggle dark mode"
              title="Toggle Layout Theme"
            >
              {currentTheme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
            </button>

            {/* Operator Logout */}
            <button
              onClick={clearAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-850 hover:bg-red-950/20 text-zinc-400 hover:text-red-400 rounded-xl text-[10px] font-bold transition cursor-pointer"
            >
              <LogOut size={12} /> Exit Console
            </button>
          </div>
        </div>

        {/* SIDE PANEL TAB VIEW CONTROLS */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">

          {/* Navigation Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <span className="text-[9px] text-zinc-555 font-black uppercase tracking-wider font-mono block px-3">Operational Console</span>
            <div className="flex flex-col gap-1 text-[10.5px] font-bold">
              {[
                { id: "metrics" as const, label: "Global metrics", icon: LineChart },
                { id: "tenants" as const, label: "Tenants Directory", icon: Building },
                { id: "users" as const, label: "User Profiles", icon: Users },
                { id: "subscriptions" as const, label: "Billing & Plans", icon: DollarSign },
                { id: "tickets" as const, label: "Support Tickets", icon: Mail },
                { id: "health" as const, label: "System Health", icon: Cpu },
                { id: "logs" as const, label: "Server Log files", icon: FileText },
                { id: "flags" as const, label: "Feature Flags", icon: Sliders },
                { id: "announcements" as const, label: "Announcements Desk", icon: Bell },
                { id: "backups" as const, label: "Database Backups", icon: Database },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeSubTab === tab.id;
                const allowed = hasAccessToTab(tab.id);
                return (
                  <button
                    key={tab.id}
                    onClick={() => allowed && setActiveSubTab(tab.id)}
                    disabled={!allowed}
                    className={cn(
                      "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition text-left cursor-pointer border",
                      active
                        ? "bg-purple-650/15 border-purple-500/30 text-purple-400 font-extrabold"
                        : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30",
                      !allowed && "opacity-30 cursor-not-allowed"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon size={14} className={active ? "text-purple-400" : "text-zinc-500"} />
                      {tab.label}
                    </span>
                    {!allowed && <LockKeyhole size={10} className="text-zinc-650" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Panel Content */}
          <div className="lg:col-span-5 space-y-6">

            {/* 1. GLOBAL METRICS TAB */}
            {activeSubTab === "metrics" && hasAccessToTab("metrics") && (
              <div className="space-y-6">
                {/* Metric Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl relative overflow-hidden">
                    <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block">MRR / ARR</span>
                    <span className="text-2xl font-black text-white block mt-2">
                      ${metrics ? metrics.mrr?.toLocaleString() : "0"} / ${metrics ? metrics.arr?.toLocaleString() : "0"}
                    </span>
                    <p className="text-[9px] text-purple-400 mt-1 font-semibold flex items-center gap-1 font-sans">
                      <TrendingUp size={12} /> Live SaaS Revenue
                    </p>
                  </div>
                  <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl relative overflow-hidden">
                    <span className="text-[9px] text-zinc-555 uppercase font-black tracking-widest block">Active Workspaces</span>
                    <span className="text-2xl font-black text-white block mt-2">
                      {metrics ? metrics.totalTenants : "0"} Registered
                    </span>
                    <p className="text-[9px] text-zinc-500 mt-1 font-semibold font-sans">
                      {metrics ? metrics.activeCount : "0"} Active | {metrics ? metrics.trialingCount : "0"} Trialing
                    </p>
                  </div>
                  <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl relative overflow-hidden">
                    <span className="text-[9px] text-zinc-555 uppercase font-black tracking-widest block">System Users</span>
                    <span className="text-2xl font-black text-purple-400 block mt-2">
                      {metrics ? metrics.totalUsers : "0"} Users
                    </span>
                    <p className="text-[9px] text-zinc-500 mt-1 font-semibold font-sans">Real-time registered users</p>
                  </div>
                  <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl relative overflow-hidden">
                    <span className="text-[9px] text-zinc-555 uppercase font-black tracking-widest block">Average LTV</span>
                    <span className="text-2xl font-black text-emerald-400 block mt-2">
                      ${metrics ? Number(metrics.ltv || 0).toFixed(0) : "0"}
                    </span>
                    <p className="text-[9px] text-zinc-550 mt-1 font-semibold font-sans">Customer lifetime value estimate</p>
                  </div>
                </div>

                {/* Revenue Growth Trend chart */}
                <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
                  <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block">EventOS Platform Revenue Trends</span>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevAdmin" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1f" vertical={false} />
                        <XAxis dataKey="month" stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #1c1c1f", fontSize: "10px", borderRadius: "12px" }} />
                        <Area type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorRevAdmin)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Live Activity Feed */}
                <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
                  <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block">Live Platform Activity Feed</span>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1 scrollbar-thin font-mono text-[10px] font-semibold">
                    {MOCK_LIVE_ACTIVITIES.map((act) => (
                      <div key={act.id} className="flex justify-between items-center p-2.5 border border-zinc-900 bg-zinc-950/40 rounded-xl">
                        <span className={cn(
                          "px-2 py-0.5 border text-[8px] font-black font-sans rounded-md uppercase",
                          act.type === "success" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" :
                            act.type === "error" ? "border-red-500/20 bg-red-500/5 text-red-450" : "border-zinc-800 bg-zinc-900 text-zinc-500"
                        )}>
                          {act.type}
                        </span>
                        <span className="text-zinc-300 ml-3 flex-1 text-left">{act.action}</span>
                        <span className="text-zinc-550 text-[9px]">{act.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. TENANTS DIRECTORY TAB */}
            {activeSubTab === "tenants" && hasAccessToTab("tenants") && (
              <div className="space-y-6 animate-slide-in">
                <div className="flex justify-between items-center">
                  <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-2.5 text-zinc-555 size-3.5" />
                    <input
                      type="text"
                      placeholder="Search tenant name or UUID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-xl text-[10px] outline-none focus:border-purple-500 font-bold"
                    />
                  </div>
                </div>

                <div className="border border-zinc-850 bg-zinc-950/20 rounded-2xl overflow-hidden">
                  <table className="w-full text-[10px] font-medium text-zinc-400 font-mono">
                    <thead>
                      <tr className="text-left border-b border-zinc-850 pb-2 text-[9px] text-zinc-550 font-black uppercase tracking-wider bg-zinc-900/30">
                        <th className="p-4">Tenant Workspace</th>
                        <th className="p-4">Plan Name</th>
                        <th className="p-4">Registered Date</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions Override</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenants.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).map((ten) => (
                        <tr key={ten.id} className="border-b border-zinc-900 last:border-0 hover:bg-zinc-900/10 transition">
                          <td className="p-4">
                            <span className="font-extrabold text-zinc-200 block text-xs font-sans">{ten.name}</span>
                            <span className="text-[8px] text-zinc-650">{ten.id}</span>
                          </td>
                          <td className="p-4 font-bold text-zinc-300">{ten.plan}</td>
                          <td className="p-4 text-zinc-500">{ten.created}</td>
                          <td className="p-4">
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[8px] font-black uppercase font-sans",
                              ten.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                            )}>
                              {ten.status}
                            </span>
                          </td>
                          <td className="p-4 text-right flex justify-end gap-2">
                            <button
                              onClick={() => handleImpersonate(ten.id, ten.name)}
                              className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-purple-500/20 text-zinc-400 hover:text-white rounded-lg text-[9px] font-bold transition cursor-pointer"
                            >
                              Impersonate
                            </button>
                            <button
                              onClick={() => handleToggleTenantStatus(ten.id, ten.status)}
                              className={cn(
                                "px-2.5 py-1.5 font-bold rounded-lg text-[9px] transition cursor-pointer",
                                ten.status === "ACTIVE"
                                  ? "bg-red-955/20 hover:bg-red-950/40 text-red-400 border border-red-500/20"
                                  : "bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-450 border border-emerald-500/20"
                              )}
                            >
                              {ten.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. USER MANAGEMENT TAB */}
            {activeSubTab === "users" && hasAccessToTab("users") && (
              <div className="space-y-6 animate-slide-in">
                <div className="border border-zinc-850 bg-zinc-950/20 rounded-2xl overflow-hidden animate-slide-in">
                  <table className="w-full text-[10px] font-medium text-zinc-400 font-mono">
                    <thead>
                      <tr className="text-left border-b border-zinc-850 pb-2 text-[9px] text-zinc-550 font-black uppercase tracking-wider bg-zinc-900/30">
                        <th className="p-4">User Operator</th>
                        <th className="p-4">Tenant Membership</th>
                        <th className="p-4">Last Device Roster</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Emergency Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((usr) => (
                        <tr key={usr.id} className="border-b border-zinc-900 last:border-0 hover:bg-zinc-900/10 transition">
                          <td className="p-4">
                            <span className="font-extrabold text-zinc-200 block text-xs font-sans">{usr.name}</span>
                            <span className="text-[8px] text-zinc-650">{usr.email}</span>
                          </td>
                          <td className="p-4 font-bold text-zinc-300">{usr.tenant}</td>
                          <td className="p-4 text-zinc-500 font-sans">{usr.device}</td>
                          <td className="p-4">
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[8px] font-black uppercase font-sans",
                              usr.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-800 text-zinc-500"
                            )}>
                              {usr.status}
                            </span>
                          </td>
                          <td className="p-4 text-right flex justify-end gap-1.5">
                            <button
                              onClick={() => handleResetPassword(usr.email)}
                              className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-purple-500/20 text-zinc-450 hover:text-white rounded-lg text-[9px] font-bold transition cursor-pointer"
                            >
                              Reset Pass
                            </button>
                            <button
                              onClick={() => handleForceLogout(usr.name)}
                              className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 text-zinc-450 hover:text-red-400 rounded-lg text-[9px] font-bold transition cursor-pointer"
                            >
                              Logout Session
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(usr.id, usr.status)}
                              className={cn(
                                "px-2.5 py-1.5 font-bold rounded-lg text-[9px] transition cursor-pointer",
                                usr.status === "ACTIVE" ? "bg-red-955/20 text-red-400 border border-red-500/20" : "bg-zinc-900 text-zinc-500"
                              )}
                            >
                              {usr.status === "ACTIVE" ? "Deactivate" : "Activate"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. BILLING & SUBSCRIPTIONS TAB */}
            {activeSubTab === "subscriptions" && hasAccessToTab("subscriptions") && (
              <div className="space-y-6 animate-slide-in">

                {/* Subscription Ledgers */}
                <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
                  <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block">Checkout & Billing Ledger logs</span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px] font-medium text-zinc-455 font-mono">
                      <thead>
                        <tr className="text-left border-b border-zinc-855 pb-2 text-[9px] text-zinc-550 font-black uppercase tracking-wider">
                          <th className="pb-2">Workspace</th>
                          <th className="pb-2">Subscribed Plan</th>
                          <th className="pb-2">Payment Gateway</th>
                          <th className="pb-2">Amount</th>
                          <th className="pb-2">Billing Term</th>
                          <th className="pb-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscriptions.map((sub, idx) => (
                          <tr key={idx} className="border-b border-zinc-900 last:border-0 hover:bg-zinc-950/30">
                            <td className="py-3 font-bold text-zinc-300">{sub.tenant}</td>
                            <td className="py-3 font-bold text-purple-400">{sub.plan}</td>
                            <td className="py-3 text-zinc-500 font-sans">{sub.gateway}</td>
                            <td className="py-3 font-bold text-zinc-250">{sub.amt}</td>
                            <td className="py-3 text-zinc-500 font-sans">{sub.interval}</td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => executeAdminAction("Issue billing refund", () => addToast("Transaction refund processed successfully.", "success"))}
                                className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 hover:border-red-500/20 text-zinc-500 hover:text-red-400 rounded-lg transition text-[9px] font-bold cursor-pointer"
                              >
                                Refund Charge
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Coupons and Discounts console */}
                <div className="max-w-md p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
                  <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block">Active Referral Coupon Codes</span>
                  <div className="space-y-2 text-[10px] font-bold font-mono">
                    <div className="flex justify-between items-center p-2.5 border border-zinc-900 bg-zinc-950/40 rounded-xl">
                      <span className="text-zinc-200">LAUNCH2026 (25% off)</span>
                      <span className="text-zinc-550">14 Active Redeems</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 border border-zinc-900 bg-zinc-950/40 rounded-xl">
                      <span className="text-zinc-200">ENTERPRISE_DISCOUNT (10% off)</span>
                      <span className="text-zinc-550">2 Active Redeems</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. SUPPORT TICKETS TAB */}
            {activeSubTab === "tickets" && hasAccessToTab("tickets") && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs animate-slide-in">
                {/* Tickets list */}
                <div className="md:col-span-1 p-5 border border-zinc-850 bg-[#111113]/40 rounded-2xl space-y-4">
                  <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block">Active Operations Tickets</span>
                  <div className="space-y-3">
                    {tickets.map(t => (
                      <div
                        key={t.id}
                        onClick={() => {
                          setActiveTicketId(t.id);
                          setTicketNotes(t.notes || "");
                        }}
                        className={cn(
                          "p-3.5 border rounded-xl cursor-pointer hover:border-zinc-700 transition",
                          activeTicketId === t.id ? "border-purple-500 bg-purple-950/10" : "border-zinc-900 bg-zinc-950/30"
                        )}
                      >
                        <div className="flex justify-between items-start font-bold">
                          <span className="text-zinc-250 text-[11px] block">{t.sender}</span>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider font-sans",
                            t.priority === "HIGH" ? "border-red-500/20 bg-red-500/5 text-red-400" : "border-zinc-855 bg-zinc-900 text-zinc-500"
                          )}>
                            {t.priority}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-1 font-semibold leading-normal font-sans">{t.subject}</p>
                        <div className="mt-2.5 flex justify-between items-center text-[8px] font-mono text-zinc-650">
                          <span>{t.status}</span>
                          <span>Assigned: {t.assigned}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ticket conversation details panel */}
                <div className="md:col-span-2 p-5 border border-zinc-850 bg-[#111113]/40 rounded-2xl flex flex-col justify-between min-h-[350px]">
                  {activeTicketId ? (
                    <div className="space-y-4 flex flex-col justify-between h-full">
                      <div className="space-y-4">
                        {tickets.filter(t => t.id === activeTicketId).map(t => (
                          <div key={t.id} className="space-y-3">
                            <div className="border-b border-zinc-900 pb-2 flex justify-between items-center">
                              <div>
                                <p className="text-[11px] font-bold text-zinc-300">{t.sender}</p>
                                <h3 className="text-xs text-white font-extrabold mt-1 font-sans">{t.subject}</h3>
                              </div>
                              <select
                                value={t.assigned}
                                onChange={(e) => {
                                  const nextAssigned = e.target.value;
                                  setTickets(tickets.map(tk => tk.id === activeTicketId ? { ...tk, assigned: nextAssigned } : tk));
                                  addToast(`Ticket assigned to ${nextAssigned}.`, "info");
                                }}
                                className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-2 py-1 text-[9px] outline-none font-bold"
                              >
                                <option value="Support Bot">Support Bot</option>
                                <option value="Operations Agent">Operations Agent</option>
                                <option value="Developer Team">Developer Team</option>
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[9px] text-zinc-455 uppercase font-black block">Internal Workspace Notes</label>
                              <textarea
                                rows={4}
                                placeholder="Type internal operator notes..."
                                value={ticketNotes}
                                onChange={(e) => setTicketNotes(e.target.value)}
                                className="w-full p-3 bg-zinc-900 border border-zinc-850 text-white rounded-xl outline-none focus:border-purple-500 text-[10px]"
                              />
                              <button
                                onClick={() => {
                                  setTickets(tickets.map(tk => tk.id === activeTicketId ? { ...tk, notes: ticketNotes } : tk));
                                  addToast("Internal notes updated.", "success");
                                }}
                                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-350 rounded-lg text-[9px] font-bold transition cursor-pointer border border-zinc-800 mt-1"
                              >
                                Save Notes
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t border-zinc-900">
                        <button
                          onClick={() => {
                            setTickets(tickets.map(t => t.id === activeTicketId ? { ...t, status: "CLOSED" } : t));
                            addToast("Ticket status set to CLOSED.", "success");
                            setActiveTicketId(null);
                          }}
                          className="px-4 py-2 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold transition cursor-pointer"
                        >
                          Resolve & Close
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-zinc-550 font-bold py-12 uppercase text-[10px]">Select a ticket from the left panel.</div>
                  )}
                </div>
              </div>
            )}

            {/* 6. SYSTEM HEALTH MONITORS */}
            {activeSubTab === "health" && hasAccessToTab("health") && (
              <div className="space-y-6 animate-slide-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {servers.map((server, idx) => (
                    <div key={idx} className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-3 font-mono text-[10.5px]">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-white font-sans text-xs">{server.name}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-black uppercase font-sans border",
                          server.status === "HEALTHY" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" : "border-amber-500/20 bg-amber-500/5 text-amber-400"
                        )}>
                          {server.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 font-bold font-mono text-[10px] text-zinc-500">
                        <div className="flex justify-between">
                          <span>Service Latency:</span>
                          <span className="text-zinc-300">{server.latency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>CPU Load:</span>
                          <span className="text-zinc-300">{server.cpu}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>RAM Allocation:</span>
                          <span className="text-zinc-300">{server.ram}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. SERVER LOGS FILES */}
            {activeSubTab === "logs" && hasAccessToTab("logs") && (
              <div className="space-y-6 animate-slide-in">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block font-mono">Server Audit & Webhook Logs</span>
                  <button
                    onClick={() => addToast("Audit logs exported to CSV successfully.", "success")}
                    className="flex items-center gap-1 px-3 py-1.5 border border-zinc-850 hover:bg-zinc-900 rounded-xl text-[10px] font-bold transition cursor-pointer"
                  >
                    <Download size={12} /> Export Logs
                  </button>
                </div>

                <div className="border border-zinc-850 bg-zinc-950/20 rounded-2xl overflow-hidden">
                  <table className="w-full text-[10px] font-medium text-zinc-400 font-mono">
                    <thead>
                      <tr className="text-left border-b border-zinc-850 pb-2 text-[9px] text-zinc-550 font-black uppercase tracking-wider bg-zinc-900/30">
                        <th className="p-4">Operator Actor</th>
                        <th className="p-4">Action Description</th>
                        <th className="p-4">IP Address</th>
                        <th className="p-4 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="border-b border-zinc-900 last:border-0 hover:bg-zinc-900/10 transition">
                          <td className="p-4 text-zinc-200 font-sans font-bold">{log.actor}</td>
                          <td className="p-4">
                            <span className="text-zinc-300 block font-semibold">{log.action}</span>
                            <span className="text-[8px] text-zinc-550">Before: {log.before} | After: {log.after}</span>
                          </td>
                          <td className="p-4 text-zinc-500">{log.ip}</td>
                          <td className="p-4 text-right text-zinc-550">{log.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 8. FEATURE FLAGS ROLLOUT */}
            {activeSubTab === "flags" && hasAccessToTab("flags") && (
              <div className="max-w-2xl mx-auto p-5 border border-zinc-855 bg-[#111113]/40 rounded-2xl space-y-4 animate-slide-in">
                <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block font-mono">Global Feature Toggles & Rollout</span>
                <div className="space-y-4">
                  {featureFlags.map((flag) => (
                    <div key={flag.id} className="p-4 border border-zinc-900 bg-zinc-950/40 rounded-xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black uppercase text-zinc-300 tracking-wider block font-mono">{flag.name}</span>
                          <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5 block">Scope: {flag.scope}</span>
                        </div>
                        <button
                          onClick={() => {
                            executeAdminAction(`Toggle flag ${flag.id}`, () => {
                              const nextVal = !flag.enabled;
                              setFeatureFlags(featureFlags.map(f => f.id === flag.id ? { ...f, enabled: nextVal } : f));
                              addToast(`Flag ${flag.id} has been toggled.`, "success");
                            });
                          }}
                          className={cn(
                            "w-10 h-5 rounded-full p-0.5 transition-all duration-300 relative cursor-pointer",
                            flag.enabled ? "bg-purple-650" : "bg-zinc-800"
                          )}
                        >
                          <div className={cn("w-4 h-4 bg-white rounded-full transition-all duration-300 absolute top-0.5", flag.enabled ? "left-5" : "left-0.5")} />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-bold text-zinc-550 uppercase tracking-wide">
                          <span>Percentage Rollout</span>
                          <span>{flag.rollout}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-900 border border-zinc-850 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${flag.rollout}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 9. ANNOUNCEMENTS BROADCAST */}
            {activeSubTab === "announcements" && hasAccessToTab("announcements") && (
              <div className="max-w-2xl mx-auto p-5 border border-zinc-850 bg-[#111113]/40 rounded-2xl space-y-4 animate-slide-in">
                <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block">Broadcast Announcement Panel</span>
                <div className="space-y-4 text-xs font-semibold">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-455 uppercase font-black">Target Audience</label>
                      <select
                        value={broadcastTarget}
                        onChange={(e) => setBroadcastTarget(e.target.value)}
                        className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-850 text-white rounded-xl outline-none focus:border-purple-500 font-bold"
                      >
                        <option value="ALL">All Active Tenants</option>
                        <option value="TRIAL">Trial users only</option>
                        <option value="PAID">Paid subscribers only</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-455 uppercase font-black">Broadcast Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Server maintenance scheduled for Q3 updates"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-850 text-white rounded-xl outline-none focus:border-purple-500 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-455 uppercase font-black">Notification content</label>
                    <textarea
                      rows={5}
                      placeholder="Write message details..."
                      value={broadcastBody}
                      onChange={(e) => setBroadcastBody(e.target.value)}
                      className="w-full p-3 bg-zinc-900 border border-zinc-850 text-white rounded-xl outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      executeAdminAction("Broadcast notification", () => {
                        if (!broadcastTitle || !broadcastBody) {
                          addToast("Title and body are required.", "error");
                          return;
                        }
                        addToast(`Broadcast sent successfully to target: ${broadcastTarget}`, "success");
                        setBroadcastTitle("");
                        setBroadcastBody("");
                      });
                    }}
                    className="px-4 py-2.5 bg-gradient-to-r from-purple-650 to-pink-650 text-white font-bold rounded-xl shadow-lg transition cursor-pointer"
                  >
                    Send Announcement
                  </button>
                </div>
              </div>
            )}

            {/* 10. DATABASE BACKUPS */}
            {activeSubTab === "backups" && hasAccessToTab("backups") && (
              <div className="space-y-6 animate-slide-in">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block font-mono">System Recovery Backups</span>
                  <button
                    onClick={() => executeAdminAction("Trigger database backup", () => {
                      addToast("Manual database backup task successfully triggered.", "success");
                    })}
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-[10px] font-bold transition cursor-pointer"
                  >
                    Trigger Backup Now
                  </button>
                </div>

                <div className="border border-zinc-850 bg-zinc-950/20 rounded-2xl overflow-hidden">
                  <table className="w-full text-[10px] font-medium text-zinc-400 font-mono">
                    <thead>
                      <tr className="text-left border-b border-zinc-850 pb-2 text-[9px] text-zinc-555 font-black uppercase tracking-wider bg-zinc-900/30">
                        <th className="p-4">Backup File Name</th>
                        <th className="p-4">Backup Size</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backups.map((bak) => (
                        <tr key={bak.id} className="border-b border-zinc-900 last:border-0 hover:bg-zinc-900/10 transition">
                          <td className="p-4">
                            <span className="font-extrabold text-zinc-200 block text-xs font-sans">{bak.name}</span>
                            <span className="text-[8px] text-zinc-655">{bak.created}</span>
                          </td>
                          <td className="p-4 font-bold text-zinc-300">{bak.size}</td>
                          <td className="p-4">
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-455 border border-emerald-500/20">
                              {bak.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => executeAdminAction("Download backup file", () => addToast("Downloading backup archives.", "info"))}
                              className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-purple-500/20 text-zinc-450 hover:text-white rounded-lg text-[9px] font-bold transition cursor-pointer"
                            >
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </PageShell>
  );
}
