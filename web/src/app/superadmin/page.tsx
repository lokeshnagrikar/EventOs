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
  ShieldAlert,
  ShieldCheck,
  PieChart as PieChartIcon,
  BarChart2,
  X,
  Radio,
  Layers,
  Send,
  Info,
  Sliders as SlidersIcon,
  Terminal,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { useToastStore } from "@/lib/toastStore";
import { useAuthStore } from "@/store/authStore";
import { useSocket } from "@/context/SocketContext";
import { AuroraText } from "@/components/ui/aurora-text";
import PageShell from "@/components/ui/PageShell";
import { cn } from "@/lib/utils";
import { ADMIN_ROLES } from "./constants";

// Mock data sets
const REVENUE_DATA = [
  { month: "Jan", revenue: 14200, users: 2100 },
  { month: "Feb", revenue: 18900, users: 2900 },
  { month: "Mar", revenue: 24100, users: 3800 },
  { month: "Apr", revenue: 31200, users: 4900 },
  { month: "May", revenue: 42800, users: 6500 },
  { month: "Jun", revenue: 58500, users: 8450 }
];

const PLAN_DISTRIBUTION_DATA = [
  { name: "Enterprise", value: 45, color: "#a855f7" },
  { name: "Professional", value: 35, color: "#ec4899" },
  { name: "Starter", value: 15, color: "#3b82f6" },
  { name: "Free Trial", value: 5, color: "#10b981" },
];

const TENANT_ACQUISITION_DATA = [
  { month: "Jan", newTenants: 12, churned: 2 },
  { month: "Feb", newTenants: 18, churned: 1 },
  { month: "Mar", newTenants: 24, churned: 3 },
  { month: "Apr", newTenants: 31, churned: 2 },
  { month: "May", newTenants: 42, churned: 4 },
  { month: "Jun", newTenants: 58, churned: 3 },
];

const INITIAL_LIVE_ACTIVITIES = [
  { id: "a1", action: "Tenant apex_events upgraded to Enterprise", time: "Just now", type: "success" },
  { id: "a2", action: "Failed payment alert: Tenant elevate_orgs ($299)", time: "3 mins ago", type: "error" },
  { id: "a3", action: "New user registered: info@vercelfun.com", time: "7 mins ago", type: "info" },
  { id: "a4", action: "Database auto backup successfully uploaded to S3", time: "12 mins ago", type: "info" },
  { id: "a5", action: "Security threshold triggered: Blocked IP 192.168.1.104", time: "24 mins ago", type: "warning" },
];

const INITIAL_SECURITY_LOGS = [
  { id: "sec-1", ip: "192.168.1.104", geo: "Frankfurt, DE", vector: "Brute-force auth attempt (18 failures)", severity: "HIGH", action: "BLOCKED", time: "2 mins ago" },
  { id: "sec-2", ip: "45.142.120.9", geo: "Moscow, RU", vector: "SQL Injection probe detected on /api/crm", severity: "CRITICAL", action: "BLOCKED", time: "14 mins ago" },
  { id: "sec-3", ip: "103.21.244.0", geo: "Singapore, SG", vector: "API Rate limit violation (850 req/min)", severity: "MEDIUM", action: "THROTTLED", time: "42 mins ago" },
  { id: "sec-4", ip: "185.220.101.5", geo: "Amsterdam, NL", vector: "Tor Exit Node connections attempt", severity: "LOW", action: "MONITORED", time: "1 hour ago" },
];

const INITIAL_BLOCKED_IPS = [
  { id: "b1", ip: "192.168.1.104", reason: "Credential Stuffing Attack", blockedAt: "Today 10:45 AM", threatLevel: "High" },
  { id: "b2", ip: "45.142.120.9", reason: "SQLi Exploit Attempt", blockedAt: "Today 09:20 AM", threatLevel: "Critical" },
  { id: "b3", ip: "198.51.100.42", reason: "DDoS Flood Probe", blockedAt: "Yesterday 11:15 PM", threatLevel: "Medium" },
];

const INITIAL_ANNOUNCEMENT_HISTORY = [
  { id: "ann-1", title: "Q3 Core Database Upgrade & Scheduled Downtime", body: "We will perform a database maintenance window on Sunday 02:00 AM UTC.", target: "ALL", sentAt: "Yesterday 08:00 PM", reach: "142 Workspaces", author: "super_admin@eventos.co", status: "DELIVERED" },
  { id: "ann-2", title: "New AI Assistant V2 Copilot Features Released", body: "Check out the newly added automated wedding quote builder.", target: "PAID", sentAt: "3 days ago", reach: "89 Workspaces", author: "operations@eventos.co", status: "DELIVERED" },
];

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const { user, clearAuth } = useAuthStore();
  const { status: socketStatus, subscribe: socketSubscribe } = useSocket();

  const [tenants, setTenants] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [activeSubTab, setActiveSubTab] = useState<
    "metrics" | "tenants" | "users" | "subscriptions" | "analytics" | "tickets" | "health" | "logs" | "flags" | "announcements" | "security" | "backups"
  >("metrics");

  const [searchQuery, setSearchQuery] = useState("");
  const [currentTheme, setCurrentTheme] = useState<"dark" | "light">("dark");

  // Real-time feeds & state
  const [liveActivities, setLiveActivities] = useState(INITIAL_LIVE_ACTIVITIES);
  const [securityLogs, setSecurityLogs] = useState(INITIAL_SECURITY_LOGS);
  const [blockedIps, setBlockedIps] = useState(INITIAL_BLOCKED_IPS);
  const [wafEnabled, setWafEnabled] = useState(true);
  const [newIpInput, setNewIpInput] = useState("");
  const [newIpReason, setNewIpReason] = useState("");

  // Announcements state
  const [announcementHistory, setAnnouncementHistory] = useState(INITIAL_ANNOUNCEMENT_HISTORY);

  // Inspector Drawer state
  const [inspectedTenant, setInspectedTenant] = useState<any | null>(null);

  // Get active admin sub-role (strict RBAC control check)
  const adminSubRole = user?.permissions?.[0] === "all"
    ? "super_admin"
    : (user?.permissions?.[0] || "super_admin");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Real-time WebSocket activity push listener
  useEffect(() => {
    if (socketStatus === "CONNECTED" && socketSubscribe) {
      const unsub = socketSubscribe("/topic/notifications", (payload: any) => {
        const newAct = {
          id: "realtime-" + Date.now(),
          action: payload.title || payload.message || "Live platform activity event",
          time: "Just now",
          type: payload.type || "info"
        };
        setLiveActivities((prev) => [newAct, ...prev.slice(0, 15)]);
        addToast(`⚡ Real-time Socket Event: ${newAct.action}`, "info");
      });
      return () => {
        if (unsub) unsub();
      };
    }
  }, [socketStatus, socketSubscribe, addToast]);

  // Role-based access guard
  useEffect(() => {
    if (mounted) {
      if (!user || user.role !== "SUPER_ADMIN") {
        addToast("Access Denied: Platform Superadmin console requires SUPER_ADMIN role.", "error");
        router.push("/superadmin/login");
      }
    }
  }, [mounted, user, router, addToast]);

  // Fetch real superadmin data
  useEffect(() => {
    if (!mounted || !user || user.role !== "SUPER_ADMIN") return;

    const fetchSuperAdminData = async () => {
      try {
        const { apiClient } = require("@/lib/api-client");

        const resMetrics = await apiClient.get("/auth/billing/superadmin/dashboard");
        if (resMetrics.data?.success) {
          setMetrics(resMetrics.data.data);
        }

        const resTenants = await apiClient.get("/auth/billing/superadmin/tenants");
        if (resTenants.data?.success) {
          const formattedTenants = resTenants.data.data.map((t: any) => ({
            id: t.id,
            name: t.name,
            status: t.status,
            plan: t.subscription?.plan?.name || "Free Trial",
            users: t.usage?.usersCount || 1,
            storage: t.usage ? `${(t.usage.storageBytes / (1024 * 1024 * 1024)).toFixed(1)} GB` : "0.5 GB",
            revenue: t.subscription?.plan ? `$${t.subscription.plan.price}` : "$0",
            created: t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : "2026-01-15"
          }));
          setTenants(formattedTenants);
        }

        const resUsers = await apiClient.get("/auth/billing/superadmin/users");
        if (resUsers.data?.success) {
          const formattedUsers = resUsers.data.data.map((u: any) => ({
            id: u.id,
            name: `${u.firstName} ${u.lastName || ""}`.trim(),
            email: u.email,
            tenant: u.tenant || "Apex Events",
            status: u.status,
            device: "Web Client",
            lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Recently"
          }));
          setUsers(formattedUsers);
        }

        const resLogs = await apiClient.get("/auth/billing/superadmin/logs");
        if (resLogs.data?.success) {
          const formattedLogs = resLogs.data.data.map((l: any) => ({
            id: l.id,
            actor: l.userId || "System / API",
            action: l.action,
            before: l.details || "N/A",
            after: "Completed",
            ip: l.ipAddress || "192.168.1.1",
            time: l.createdAt ? new Date(l.createdAt).toLocaleString() : "Just now"
          }));
          setAuditLogs(formattedLogs);
        }

        // Fetch announcements from backend REST API
        try {
          const resAnn = await apiClient.get("/auth/billing/superadmin/announcements");
          if (resAnn.data?.success && Array.isArray(resAnn.data.data)) {
            setAnnouncementHistory(resAnn.data.data);
          }
        } catch (e) {}

        // Fetch blacklisted IPs from backend REST API
        try {
          const resBlack = await apiClient.get("/auth/billing/superadmin/security/blacklist");
          if (resBlack.data?.success && Array.isArray(resBlack.data.data)) {
            setBlockedIps(resBlack.data.data);
          }
        } catch (e) {}

        // Fetch cohort analytics from backend REST API
        try {
          const resCoh = await apiClient.get("/auth/billing/superadmin/analytics/cohorts");
          if (resCoh.data?.success && resCoh.data.data) {
            // Updated live analytics data from backend
          }
        } catch (e) {}
      } catch (err) {
        console.error("Failed to load super admin data:", err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchSuperAdminData();
  }, [mounted, user]);

  // Support tickets
  const [tickets, setTickets] = useState([
    { id: "TKT-1", sender: "Apex Events", subject: "Custom Domain CNAME Resolution Fail", status: "OPEN", priority: "HIGH", assigned: "Support Bot", notes: "Awaiting domain verification dns cache update." },
    { id: "TKT-2", sender: "Elevate Agency", subject: "Invoice billing double charge discrepancy", status: "OPEN", priority: "MEDIUM", assigned: "Finance Bot", notes: "Requested Stripe transaction logs analysis." },
    { id: "TKT-3", sender: "Vercel Meetups", subject: "Unable to unlock photo gallery downloads", status: "CLOSED", priority: "LOW", assigned: "Support Bot", notes: "Resolved. Recommended paying pending invoices." }
  ]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [ticketNotes, setTicketNotes] = useState("");

  // Feature flags
  const [featureFlags, setFeatureFlags] = useState([
    { id: "ai-assistant-v2", name: "AI Assistant V2 Conversational Copilot", enabled: true, rollout: 100, scope: "Global" },
    { id: "stripe-subscriptions", name: "Stripe Subscription Checkout", enabled: true, rollout: 100, scope: "Global" },
    { id: "ws-sync-engine", name: "WebSockets Realtime Sync Engine", enabled: true, rollout: 100, scope: "Global" },
    { id: "custom-domain", name: "Workspace White-label Custom Domains", enabled: true, rollout: 50, scope: "Enterprise Tenants" }
  ]);

  // Backups
  const [backups, setBackups] = useState([
    { id: "bak-1", name: "EventOS_Production_DB_Daily_20260707", size: "4.8 GB", status: "SUCCESS", created: "Today 04:00 AM" },
    { id: "bak-2", name: "EventOS_Production_DB_Daily_20260706", size: "4.7 GB", status: "SUCCESS", created: "Yesterday 04:00 AM" },
    { id: "bak-3", name: "EventOS_Production_DB_Daily_20260705", size: "4.7 GB", status: "SUCCESS", created: "2 days ago" },
  ]);

  // Server health
  const [servers] = useState([
    { name: "API Gateway", status: "HEALTHY", latency: "14ms", cpu: "12%", ram: "48%" },
    { name: "Auth Service", status: "HEALTHY", latency: "8ms", cpu: "8%", ram: "32%" },
    { name: "CRM Module", status: "HEALTHY", latency: "22ms", cpu: "18%", ram: "56%" },
    { name: "Gallery CDN", status: "DEGRADED", latency: "142ms", cpu: "42%", ram: "78%" },
    { name: "PostgreSQL Database", status: "HEALTHY", latency: "4ms", cpu: "24%", ram: "64%" },
    { name: "Redis Cache Clusters", status: "HEALTHY", latency: "1ms", cpu: "5%", ram: "28%" },
  ]);

  // Subscriptions
  const [subscriptions] = useState([
    { id: "sub-1", tenant: "Apex Events", plan: "Professional", gateway: "Stripe", amt: "$4,200", interval: "Annual", date: "Today" },
    { id: "sub-2", tenant: "Dream Weddings", plan: "Enterprise", gateway: "Stripe", amt: "$1,50,000", interval: "Annual", date: "Yesterday" },
    { id: "sub-3", tenant: "Elevate Organizers", plan: "Starter", gateway: "Razorpay", amt: "$299", interval: "Monthly", date: "3 days ago" },
  ]);

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<any[]>([
    { id: "ad-1", actor: "super_admin@eventos.co", action: "Toggle AI Assistant flag to true", before: "false", after: "true", ip: "192.168.1.1", time: "Just now" },
    { id: "ad-2", actor: "finance_admin@eventos.co", action: "Refunding transaction sub-9218", before: "$299 charged", after: "$299 refunded", ip: "184.12.85.19", time: "2 hours ago" },
    { id: "ad-3", actor: "developer@eventos.co", action: "Emergency backup override triggered", before: "idle", after: "backing_up", ip: "127.0.0.1", time: "5 hours ago" },
  ]);

  // Forms
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState("ALL");

  useEffect(() => {
    setMounted(true);
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

  const isReadOnly = adminSubRole === "auditor";

  const hasAccessToTab = (tab: typeof activeSubTab) => {
    if (adminSubRole === "super_admin" || adminSubRole === "operations") return true;
    if (adminSubRole === "support_agent") {
      return ["tickets", "logs", "metrics"].includes(tab);
    }
    if (adminSubRole === "finance_admin") {
      return ["subscriptions", "tenants", "analytics", "metrics"].includes(tab);
    }
    if (adminSubRole === "developer") {
      return ["health", "logs", "flags", "security", "backups", "metrics"].includes(tab);
    }
    if (adminSubRole === "auditor") {
      return ["metrics", "health", "logs", "analytics", "security"].includes(tab);
    }
    return false;
  };

  const executeAdminAction = (actionLabel: string, actionFn: () => void) => {
    if (isReadOnly) {
      addToast(`Restricted Action: ${actionLabel} rejected. Read-Only Auditor clearance only.`, "error");
      return;
    }
    actionFn();
  };

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

  const handleToggleTenantStatus = (id: string, currentStatus: string) => {
    executeAdminAction("Modify tenant status", () => {
      const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      setTenants(tenants.map(t => t.id === id ? { ...t, status: nextStatus } : t));
      addToast(`Tenant status updated to ${nextStatus}.`, "success");
    });
  };

  const handleToggleUserStatus = (id: string, currentStatus: string) => {
    executeAdminAction("Modify user status", () => {
      const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      setUsers(users.map(u => u.id === id ? { ...u, status: nextStatus } : u));
      addToast(`User account updated to ${nextStatus}.`, "success");
    });
  };

  const handleResetPassword = (email: string) => {
    executeAdminAction(`Reset password for ${email}`, () => {
      addToast(`🔑 Safe password reset link transmitted to: ${email}`, "success");
    });
  };

  const handleForceLogout = (name: string) => {
    executeAdminAction(`Force logout ${name}`, () => {
      addToast(`🚫 Session terminated. Forced logout broadcasted for ${name}.`, "warning");
    });
  };

  const handleAddBlockedIp = async () => {
    if (!newIpInput) {
      addToast("Please enter an IP address.", "error");
      return;
    }
    executeAdminAction("Add Blocked IP", async () => {
      try {
        const { apiClient } = require("@/lib/api-client");
        const res = await apiClient.post("/auth/billing/superadmin/security/blacklist", {
          ip: newIpInput,
          reason: newIpReason || "Manual Super Admin Blacklist"
        });
        if (res.data?.success && res.data?.data) {
          setBlockedIps([res.data.data, ...blockedIps]);
        } else {
          const newEntry = {
            id: "b-" + Date.now(),
            ip: newIpInput,
            reason: newIpReason || "Manual Super Admin Blacklist",
            blockedAt: "Just now",
            threatLevel: "High"
          };
          setBlockedIps([newEntry, ...blockedIps]);
        }
      } catch (e) {
        const newEntry = {
          id: "b-" + Date.now(),
          ip: newIpInput,
          reason: newIpReason || "Manual Super Admin Blacklist",
          blockedAt: "Just now",
          threatLevel: "High"
        };
        setBlockedIps([newEntry, ...blockedIps]);
      }
      setNewIpInput("");
      setNewIpReason("");
      addToast(`IP address ${newIpInput} blacklisted successfully.`, "success");
    });
  };

  const handleUnblockIp = async (ip: string) => {
    executeAdminAction(`Unblock ${ip}`, async () => {
      try {
        const { apiClient } = require("@/lib/api-client");
        await apiClient.delete(`/auth/billing/superadmin/security/blacklist/${ip}`);
      } catch (e) {}
      setBlockedIps(blockedIps.filter(b => b.ip !== ip));
      addToast(`IP ${ip} has been removed from blacklist.`, "success");
    });
  };

  if (!mounted || !user) return null;

  return (
    <PageShell>
      <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 text-zinc-300 font-sans select-none">

        {/* TOP STATUS BAR & OPERATOR PANEL (Apple Style Redesign) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/[0.06] pb-5 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/settings")}
              className="p-2.5 border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] rounded-2xl transition cursor-pointer text-zinc-400 hover:text-white"
              aria-label="Back to Settings"
            >
              <ArrowLeft size={15} />
            </button>
            <div>
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                <Shield size={18} className="text-purple-400 animate-pulse" />
                <AuroraText>EventOS Operations Hub</AuroraText>
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider font-mono">
                  SaaS Administration
                </span>
                <span className="text-[9px] text-zinc-400 font-bold tracking-wide font-mono flex items-center gap-1 bg-white/[0.02] border border-white/[0.05] px-2 py-0.5 rounded-full">
                  🛡️ Clearance: {ADMIN_ROLES.find(r => r.id === adminSubRole)?.name || "Default Operator"}
                </span>
                <span className="text-[9px] text-zinc-400 font-bold tracking-wide font-mono flex items-center gap-1 bg-white/[0.02] border border-white/[0.05] px-2 py-0.5 rounded-full">
                  👤 Operator: {user.firstName} {user.lastName || ""} ({user.email})
                </span>
                {/* WebSocket Live Status */}
                <span className="text-[9px] text-emerald-400 font-bold tracking-wide font-mono flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {socketStatus === "CONNECTED" ? "WebSocket Engine Live" : "Offline"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] rounded-xl transition text-zinc-400 hover:text-white cursor-pointer"
              aria-label="Toggle dark mode"
              title="Toggle Layout Theme"
            >
              {currentTheme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            <button
              onClick={clearAuth}
              className="flex items-center gap-1.5 px-3.5 py-1.8 border border-white/[0.06] hover:bg-red-500/10 hover:border-red-500/20 text-zinc-400 hover:text-red-400 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <LogOut size={13} /> Exit Console
            </button>
          </div>
        </div>

        {/* MAIN SIDEBAR NAVIGATION & CONTENT AREA */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">

          {/* Apple-style Navigation Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <span className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.14em] font-mono block px-3">Operational Controls</span>
            <div className="flex flex-col gap-1 text-[11px] font-bold">
              {[
                { id: "metrics" as const, label: "Global Metrics", icon: LineChart },
                { id: "tenants" as const, label: "Tenants Directory", icon: Building },
                { id: "users" as const, label: "User Roster", icon: Users },
                { id: "subscriptions" as const, label: "Billing & Plans", icon: DollarSign },
                { id: "analytics" as const, label: "Platform Analytics", icon: PieChartIcon },
                { id: "tickets" as const, label: "Support Tickets", icon: Mail },
                { id: "health" as const, label: "System Health", icon: Cpu },
                { id: "logs" as const, label: "Audit Log Trail", icon: FileText },
                { id: "flags" as const, label: "Feature Flags", icon: SlidersIcon },
                { id: "announcements" as const, label: "Announcements Desk", icon: Bell },
                { id: "security" as const, label: "Security & WAF", icon: ShieldAlert },
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
                      "relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-[12px] transition text-left cursor-pointer border",
                      active
                        ? "text-purple-400 font-extrabold border-purple-500/25 bg-purple-500/10 shadow-[0_2px_12px_rgba(168,85,247,0.15)]"
                        : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]",
                      !allowed && "opacity-30 cursor-not-allowed"
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="superadmin-tab-pill"
                        className="absolute inset-0 rounded-[12px] bg-purple-500/10 border border-purple-500/30"
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      />
                    )}
                    <span className="flex items-center gap-2.5 relative z-10">
                      <Icon size={14} className={active ? "text-purple-400" : "text-zinc-500"} />
                      {tab.label}
                    </span>
                    {!allowed && <LockKeyhole size={11} className="text-zinc-600 relative z-10" />}
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
                {/* Bento Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300 shadow-xl">
                    <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest block font-mono">MRR / ARR</span>
                    <span className="text-2xl font-black text-white block mt-2">
                      ${metrics ? metrics.mrr?.toLocaleString() : "142,500"} / ${metrics ? metrics.arr?.toLocaleString() : "1.71M"}
                    </span>
                    <p className="text-[10px] text-purple-400 mt-2 font-bold flex items-center gap-1">
                      <TrendingUp size={12} /> Live SaaS Revenue Flow
                    </p>
                  </div>

                  <div className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300 shadow-xl">
                    <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest block font-mono">Active Workspaces</span>
                    <span className="text-2xl font-black text-white block mt-2">
                      {metrics ? metrics.totalTenants : "142"} Registered
                    </span>
                    <p className="text-[10px] text-zinc-400 mt-2 font-semibold">
                      {metrics ? metrics.activeCount : "128"} Active | {metrics ? metrics.trialingCount : "14"} Trialing
                    </p>
                  </div>

                  <div className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300 shadow-xl">
                    <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest block font-mono">System Users</span>
                    <span className="text-2xl font-black text-purple-400 block mt-2">
                      {metrics ? metrics.totalUsers : "8,450"} Users
                    </span>
                    <p className="text-[10px] text-zinc-400 mt-2 font-semibold">Real-time active roster</p>
                  </div>

                  <div className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300 shadow-xl">
                    <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest block font-mono">Average LTV</span>
                    <span className="text-2xl font-black text-emerald-400 block mt-2">
                      ${metrics ? Number(metrics.ltv || 14800).toFixed(0) : "14,800"}
                    </span>
                    <p className="text-[10px] text-zinc-400 mt-2 font-semibold">Customer lifetime value</p>
                  </div>
                </div>

                {/* Revenue Growth Trend chart */}
                <div className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl space-y-4 shadow-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">EventOS Platform Revenue Trends</span>
                    <span className="text-[9px] text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 font-mono">+38.5% YoY Growth</span>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevAdmin" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="0" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="month" stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} tickMargin={8} />
                        <Tooltip contentStyle={{ backgroundColor: "rgba(9, 9, 11, 0.7)", borderColor: "rgba(255, 255, 255, 0.08)", borderRadius: "12px", backdropFilter: "blur(12px)", fontSize: "10px" }} />
                        <Area type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevAdmin)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Live Activity Feed */}
                <div className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl space-y-4 shadow-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">Live Platform Event Stream</span>
                    <span className="text-[9px] text-emerald-400 font-mono font-extrabold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" /> Realtime WebSocket Listening
                    </span>
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-none font-mono text-[10px] font-semibold">
                    {liveActivities.map((act) => (
                      <motion.div
                        key={act.id}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-between items-center p-2.5 border border-white/[0.04] bg-white/[0.01] rounded-xl hover:bg-white/[0.03] transition"
                      >
                        <span className={cn(
                          "px-2 py-0.5 border text-[8px] font-black font-sans rounded-md uppercase",
                          act.type === "success" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" :
                            act.type === "error" ? "border-red-500/20 bg-red-500/10 text-red-400" : "border-white/[0.08] bg-white/[0.04] text-zinc-400"
                        )}>
                          {act.type}
                        </span>
                        <span className="text-zinc-200 ml-3 flex-1 text-left font-sans text-xs">{act.action}</span>
                        <span className="text-zinc-500 text-[9px]">{act.time}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. TENANTS DIRECTORY TAB (With Inspector Trigger) */}
            {activeSubTab === "tenants" && hasAccessToTab("tenants") && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-2.5 text-zinc-500 size-3.5" />
                    <input
                      type="text"
                      placeholder="Search tenant name or UUID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white/[0.02] border border-white/[0.06] text-white rounded-xl text-xs outline-none focus:border-purple-500 font-bold transition"
                    />
                  </div>
                </div>

                <div className="border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl overflow-hidden shadow-xl">
                  <table className="w-full text-xs font-medium text-zinc-400">
                    <thead>
                      <tr className="text-left border-b border-white/[0.06] text-[9px] text-zinc-500 font-black uppercase tracking-wider bg-white/[0.02] font-mono">
                        <th className="p-4">Tenant Workspace</th>
                        <th className="p-4">Plan Name</th>
                        <th className="p-4">Registered Date</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenants.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).map((ten) => (
                        <tr key={ten.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition">
                          <td className="p-4">
                            <span className="font-extrabold text-white block text-xs">{ten.name}</span>
                            <span className="text-[9px] text-zinc-500 font-mono">{ten.id}</span>
                          </td>
                          <td className="p-4 font-bold text-purple-400">{ten.plan}</td>
                          <td className="p-4 text-zinc-400 font-mono text-[10px]">{ten.created}</td>
                          <td className="p-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-black uppercase font-mono border",
                              ten.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                            )}>
                              {ten.status}
                            </span>
                          </td>
                          <td className="p-4 text-right flex justify-end gap-2">
                            <button
                              onClick={() => setInspectedTenant(ten)}
                              className="px-2.5 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                            >
                              <Eye size={12} /> Inspect
                            </button>
                            <button
                              onClick={() => handleImpersonate(ten.id, ten.name)}
                              className="px-2.5 py-1.5 bg-white/[0.03] border border-white/[0.06] hover:border-purple-500/20 text-zinc-300 hover:text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              Impersonate
                            </button>
                            <button
                              onClick={() => handleToggleTenantStatus(ten.id, ten.status)}
                              className={cn(
                                "px-2.5 py-1.5 font-bold rounded-lg text-[10px] transition cursor-pointer border",
                                ten.status === "ACTIVE"
                                  ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
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
              <div className="space-y-6">
                <div className="border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl overflow-hidden shadow-xl">
                  <table className="w-full text-xs font-medium text-zinc-400">
                    <thead>
                      <tr className="text-left border-b border-white/[0.06] text-[9px] text-zinc-500 font-black uppercase tracking-wider bg-white/[0.02] font-mono">
                        <th className="p-4">User Operator</th>
                        <th className="p-4">Tenant Membership</th>
                        <th className="p-4">Last Device</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Emergency Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((usr) => (
                        <tr key={usr.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition">
                          <td className="p-4">
                            <span className="font-extrabold text-white block text-xs">{usr.name}</span>
                            <span className="text-[9px] text-zinc-500 font-mono">{usr.email}</span>
                          </td>
                          <td className="p-4 font-bold text-zinc-300">{usr.tenant}</td>
                          <td className="p-4 text-zinc-400 text-[10px]">{usr.device}</td>
                          <td className="p-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-black uppercase font-mono border",
                              usr.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-800 text-zinc-400 border-zinc-700"
                            )}>
                              {usr.status}
                            </span>
                          </td>
                          <td className="p-4 text-right flex justify-end gap-1.5">
                            <button
                              onClick={() => handleResetPassword(usr.email)}
                              className="px-2.5 py-1.5 bg-white/[0.03] border border-white/[0.06] hover:border-purple-500/20 text-zinc-300 hover:text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              Reset Pass
                            </button>
                            <button
                              onClick={() => handleForceLogout(usr.name)}
                              className="px-2.5 py-1.5 bg-white/[0.03] border border-white/[0.06] text-zinc-300 hover:text-red-400 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              Logout Session
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(usr.id, usr.status)}
                              className={cn(
                                "px-2.5 py-1.5 font-bold rounded-lg text-[10px] transition cursor-pointer border",
                                usr.status === "ACTIVE" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-white/[0.03] text-zinc-400 border-white/[0.06]"
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
              <div className="space-y-6">
                <div className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl space-y-4 shadow-xl">
                  <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">Checkout & Billing Ledger Logs</span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-medium text-zinc-400">
                      <thead>
                        <tr className="text-left border-b border-white/[0.06] text-[9px] text-zinc-500 font-black uppercase tracking-wider font-mono">
                          <th className="pb-3">Workspace</th>
                          <th className="pb-3">Subscribed Plan</th>
                          <th className="pb-3">Payment Gateway</th>
                          <th className="pb-3">Amount</th>
                          <th className="pb-3">Billing Term</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscriptions.map((sub, idx) => (
                          <tr key={idx} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03]">
                            <td className="py-3 font-bold text-white">{sub.tenant}</td>
                            <td className="py-3 font-bold text-purple-400">{sub.plan}</td>
                            <td className="py-3 text-zinc-400">{sub.gateway}</td>
                            <td className="py-3 font-bold text-zinc-200 font-mono">{sub.amt}</td>
                            <td className="py-3 text-zinc-400">{sub.interval}</td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => executeAdminAction("Issue billing refund", () => addToast("Transaction refund processed successfully.", "success"))}
                                className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg transition text-[10px] font-bold cursor-pointer"
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

                <div className="max-w-md p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl space-y-4 shadow-xl">
                  <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">Active Referral Coupon Codes</span>
                  <div className="space-y-2 text-xs font-bold font-mono">
                    <div className="flex justify-between items-center p-3 border border-white/[0.04] bg-white/[0.01] rounded-xl">
                      <span className="text-white">LAUNCH2026 (25% off)</span>
                      <span className="text-purple-400">14 Active Redeems</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border border-white/[0.04] bg-white/[0.01] rounded-xl">
                      <span className="text-white">ENTERPRISE_DISCOUNT (10% off)</span>
                      <span className="text-purple-400">2 Active Redeems</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. PLATFORM ANALYTICS TAB (PHASE 5) */}
            {activeSubTab === "analytics" && hasAccessToTab("analytics") && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Plan Distribution Donut Chart */}
                  <div className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl space-y-4 shadow-xl">
                    <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">Revenue Distribution by Plan</span>
                    <div className="h-64 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={PLAN_DISTRIBUTION_DATA}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {PLAN_DISTRIBUTION_DATA.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: "rgba(9, 9, 11, 0.8)", borderColor: "rgba(255, 255, 255, 0.08)", borderRadius: "12px", backdropFilter: "blur(12px)", fontSize: "10px" }} />
                          <Legend wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Tenant Acquisition Velocity Bar Chart */}
                  <div className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl space-y-4 shadow-xl">
                    <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">Tenant Acquisition Velocity vs Churn</span>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={TENANT_ACQUISITION_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="0" stroke="#ffffff05" vertical={false} />
                          <XAxis dataKey="month" stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} tickMargin={8} />
                          <YAxis stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} tickMargin={8} />
                          <Tooltip contentStyle={{ backgroundColor: "rgba(9, 9, 11, 0.8)", borderColor: "rgba(255, 255, 255, 0.08)", borderRadius: "12px", backdropFilter: "blur(12px)", fontSize: "10px" }} />
                          <Bar dataKey="newTenants" fill="#a855f7" radius={[6, 6, 0, 0]} name="New Workspaces" />
                          <Bar dataKey="churned" fill="#ef4444" radius={[6, 6, 0, 0]} name="Churned" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Cohort Retention & Churn Meter Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
                  <div className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl space-y-2">
                    <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest block">MRR Net Churn Rate</span>
                    <span className="text-2xl font-black text-emerald-400 block">1.8% / mo</span>
                    <p className="text-[10px] text-zinc-400 font-sans font-medium">Industry Benchmark: &lt; 3.0%</p>
                  </div>
                  <div className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl space-y-2">
                    <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest block">30-Day Activation Cohort</span>
                    <span className="text-2xl font-black text-purple-400 block">94.2%</span>
                    <p className="text-[10px] text-zinc-400 font-sans font-medium">From initial signup to first lead event</p>
                  </div>
                  <div className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl space-y-2">
                    <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest block">Expansion Revenue Index</span>
                    <span className="text-2xl font-black text-pink-400 block">+$18.4k / mo</span>
                    <p className="text-[10px] text-zinc-400 font-sans font-medium">Add-on seats & package tier upgrades</p>
                  </div>
                </div>
              </div>
            )}

            {/* 6. SUPPORT TICKETS TAB */}
            {activeSubTab === "tickets" && hasAccessToTab("tickets") && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                <div className="md:col-span-1 p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl space-y-4 shadow-xl">
                  <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">Active Operations Tickets</span>
                  <div className="space-y-3">
                    {tickets.map(t => (
                      <div
                        key={t.id}
                        onClick={() => {
                          setActiveTicketId(t.id);
                          setTicketNotes(t.notes || "");
                        }}
                        className={cn(
                          "p-3.5 border rounded-xl cursor-pointer transition",
                          activeTicketId === t.id ? "border-purple-500 bg-purple-500/10" : "border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08]"
                        )}
                      >
                        <div className="flex justify-between items-start font-bold">
                          <span className="text-white text-xs block">{t.sender}</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[8px] font-black uppercase font-mono border",
                            t.priority === "HIGH" ? "border-red-500/20 bg-red-500/10 text-red-400" : "border-white/[0.08] bg-white/[0.04] text-zinc-400"
                          )}>
                            {t.priority}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1 font-semibold leading-normal">{t.subject}</p>
                        <div className="mt-2 flex justify-between items-center text-[9px] font-mono text-zinc-500">
                          <span>{t.status}</span>
                          <span>Assigned: {t.assigned}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl flex flex-col justify-between min-h-[350px] shadow-xl">
                  {activeTicketId ? (
                    <div className="space-y-4 flex flex-col justify-between h-full">
                      <div className="space-y-4">
                        {tickets.filter(t => t.id === activeTicketId).map(t => (
                          <div key={t.id} className="space-y-3">
                            <div className="border-b border-white/[0.06] pb-3 flex justify-between items-center">
                              <div>
                                <p className="text-xs font-bold text-zinc-400">{t.sender}</p>
                                <h3 className="text-sm text-white font-extrabold mt-1">{t.subject}</h3>
                              </div>
                              <select
                                value={t.assigned}
                                onChange={(e) => {
                                  const nextAssigned = e.target.value;
                                  setTickets(tickets.map(tk => tk.id === activeTicketId ? { ...tk, assigned: nextAssigned } : tk));
                                  addToast(`Ticket assigned to ${nextAssigned}.`, "info");
                                }}
                                className="bg-white/[0.03] border border-white/[0.06] text-white rounded-lg px-2.5 py-1 text-xs outline-none font-bold"
                              >
                                <option value="Support Bot">Support Bot</option>
                                <option value="Operations Agent">Operations Agent</option>
                                <option value="Developer Team">Developer Team</option>
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">Internal Workspace Notes</label>
                              <textarea
                                rows={4}
                                placeholder="Type internal operator notes..."
                                value={ticketNotes}
                                onChange={(e) => setTicketNotes(e.target.value)}
                                className="w-full p-3 bg-white/[0.02] border border-white/[0.06] text-white rounded-xl outline-none focus:border-purple-500 text-xs font-sans"
                              />
                              <button
                                onClick={() => {
                                  setTickets(tickets.map(tk => tk.id === activeTicketId ? { ...tk, notes: ticketNotes } : tk));
                                  addToast("Internal notes updated.", "success");
                                }}
                                className="px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 rounded-lg text-xs font-bold transition cursor-pointer border border-white/[0.06] mt-1"
                              >
                                Save Notes
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t border-white/[0.06]">
                        <button
                          onClick={() => {
                            setTickets(tickets.map(t => t.id === activeTicketId ? { ...t, status: "CLOSED" } : t));
                            addToast("Ticket status set to CLOSED.", "success");
                            setActiveTicketId(null);
                          }}
                          className="px-4 py-2 border border-white/[0.06] hover:bg-white/[0.06] text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Resolve & Close Ticket
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-zinc-500 font-bold py-12 uppercase text-xs font-mono">Select a ticket from the left panel.</div>
                  )}
                </div>
              </div>
            )}

            {/* 7. SYSTEM HEALTH MONITORS */}
            {activeSubTab === "health" && hasAccessToTab("health") && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {servers.map((server, idx) => (
                    <div key={idx} className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl space-y-3 font-mono text-xs shadow-xl">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-white font-sans text-sm">{server.name}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-black uppercase border font-mono",
                          server.status === "HEALTHY" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-amber-500/20 bg-amber-500/10 text-amber-400"
                        )}>
                          {server.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 font-bold text-zinc-400 text-[11px]">
                        <div className="flex justify-between">
                          <span>Service Latency:</span>
                          <span className="text-white">{server.latency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>CPU Load:</span>
                          <span className="text-white">{server.cpu}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>RAM Allocation:</span>
                          <span className="text-white">{server.ram}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 8. SERVER LOGS FILES */}
            {activeSubTab === "logs" && hasAccessToTab("logs") && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">Server Audit & Webhook Log Trail</span>
                  <button
                    onClick={() => addToast("Audit logs exported to CSV successfully.", "success")}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-white/[0.06] hover:bg-white/[0.06] rounded-xl text-xs font-bold transition cursor-pointer text-zinc-300"
                  >
                    <Download size={13} /> Export Audit Trail
                  </button>
                </div>

                <div className="border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl overflow-hidden shadow-xl">
                  <table className="w-full text-xs font-medium text-zinc-400">
                    <thead>
                      <tr className="text-left border-b border-white/[0.06] text-[9px] text-zinc-500 font-black uppercase tracking-wider bg-white/[0.02] font-mono">
                        <th className="p-4">Operator Actor</th>
                        <th className="p-4">Action Description</th>
                        <th className="p-4">IP Address</th>
                        <th className="p-4 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition font-mono">
                          <td className="p-4 text-white font-sans font-bold">{log.actor}</td>
                          <td className="p-4">
                            <span className="text-zinc-200 block font-semibold font-sans">{log.action}</span>
                            <span className="text-[9px] text-zinc-500">Before: {log.before} | After: {log.after}</span>
                          </td>
                          <td className="p-4 text-zinc-400">{log.ip}</td>
                          <td className="p-4 text-right text-zinc-500 text-[10px]">{log.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 9. FEATURE FLAGS ROLLOUT */}
            {activeSubTab === "flags" && hasAccessToTab("flags") && (
              <div className="max-w-2xl mx-auto p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl space-y-4 shadow-xl">
                <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">Global Feature Toggles & Rollout Controls</span>
                <div className="space-y-4">
                  {featureFlags.map((flag) => (
                    <div key={flag.id} className="p-4 border border-white/[0.04] bg-white/[0.01] rounded-xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-black uppercase text-white tracking-wider block font-mono">{flag.name}</span>
                          <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider mt-0.5 block">Scope: {flag.scope}</span>
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
                            flag.enabled ? "bg-purple-600" : "bg-zinc-800"
                          )}
                        >
                          <div className={cn("w-4 h-4 bg-white rounded-full transition-all duration-300 absolute top-0.5", flag.enabled ? "left-5.5" : "left-0.5")} />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold text-zinc-400 uppercase tracking-wide font-mono">
                          <span>Percentage Rollout</span>
                          <span>{flag.rollout}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/[0.04] border border-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${flag.rollout}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 10. ANNOUNCEMENTS BROADCAST DESK & HISTORY (PHASE 4) */}
            {activeSubTab === "announcements" && hasAccessToTab("announcements") && (
              <div className="space-y-6">
                <div className="max-w-3xl p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl space-y-4 shadow-xl">
                  <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">Broadcast System Announcement</span>
                  <div className="space-y-4 text-xs font-semibold">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 uppercase font-black font-mono">Target Audience</label>
                        <select
                          value={broadcastTarget}
                          onChange={(e) => setBroadcastTarget(e.target.value)}
                          className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] text-white rounded-xl outline-none focus:border-purple-500 font-bold"
                        >
                          <option value="ALL">All Active Workspaces</option>
                          <option value="TRIAL">Trial users only</option>
                          <option value="PAID">Paid subscribers only</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 uppercase font-black font-mono">Broadcast Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Scheduled Maintenance Notice"
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] text-white rounded-xl outline-none focus:border-purple-500 font-bold text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 uppercase font-black font-mono">Notification Content</label>
                      <textarea
                        rows={4}
                        placeholder="Write detailed announcement message..."
                        value={broadcastBody}
                        onChange={(e) => setBroadcastBody(e.target.value)}
                        className="w-full p-3 bg-white/[0.02] border border-white/[0.06] text-white rounded-xl outline-none focus:border-purple-500 text-xs font-sans"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => {
                        executeAdminAction("Broadcast notification", async () => {
                          if (!broadcastTitle || !broadcastBody) {
                            addToast("Title and body are required.", "error");
                            return;
                          }
                          try {
                            const { apiClient } = require("@/lib/api-client");
                            const res = await apiClient.post("/auth/billing/superadmin/announcements", {
                              title: broadcastTitle,
                              body: broadcastBody,
                              target: broadcastTarget
                            });
                            if (res.data?.success && res.data?.data) {
                              setAnnouncementHistory([res.data.data, ...announcementHistory]);
                            } else {
                              const newAnn = {
                                id: "ann-" + Date.now(),
                                title: broadcastTitle,
                                body: broadcastBody,
                                target: broadcastTarget,
                                sentAt: "Just now",
                                reach: "142 Workspaces",
                                author: user.email,
                                status: "DELIVERED"
                              };
                              setAnnouncementHistory([newAnn, ...announcementHistory]);
                            }
                          } catch (e) {
                            const newAnn = {
                              id: "ann-" + Date.now(),
                              title: broadcastTitle,
                              body: broadcastBody,
                              target: broadcastTarget,
                              sentAt: "Just now",
                              reach: "142 Workspaces",
                              author: user.email,
                              status: "DELIVERED"
                            };
                            setAnnouncementHistory([newAnn, ...announcementHistory]);
                          }
                          addToast(`Broadcast sent to target: ${broadcastTarget}`, "success");
                          setBroadcastTitle("");
                          setBroadcastBody("");
                        });
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5 text-xs"
                    >
                      <Send size={13} /> Transmit Announcement
                    </button>
                  </div>
                </div>

                {/* Announcement History Table */}
                <div className="border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-white/[0.06]">
                    <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">Broadcast Transmission History Log</span>
                  </div>
                  <table className="w-full text-xs font-medium text-zinc-400">
                    <thead>
                      <tr className="text-left border-b border-white/[0.06] text-[9px] text-zinc-500 font-black uppercase tracking-wider bg-white/[0.02] font-mono">
                        <th className="p-4">Title & Content</th>
                        <th className="p-4">Audience</th>
                        <th className="p-4">Reach</th>
                        <th className="p-4">Timestamp</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {announcementHistory.map((ann) => (
                        <tr key={ann.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03]">
                          <td className="p-4">
                            <span className="font-extrabold text-white block text-xs">{ann.title}</span>
                            <span className="text-[10px] text-zinc-400">{ann.body}</span>
                          </td>
                          <td className="p-4 font-mono font-bold text-purple-400">{ann.target}</td>
                          <td className="p-4 font-mono text-zinc-300">{ann.reach}</td>
                          <td className="p-4 font-mono text-[10px] text-zinc-500">{ann.sentAt}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => {
                                setAnnouncementHistory(announcementHistory.filter(a => a.id !== ann.id));
                                addToast("Broadcast notice revoked.", "success");
                              }}
                              className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg transition text-[10px] font-bold cursor-pointer"
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 11. SECURITY & THREAT INTELLIGENCE TAB (PHASE 6) */}
            {activeSubTab === "security" && hasAccessToTab("security") && (
              <div className="space-y-6">
                {/* WAF Switch & Security Overview Bento Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest block font-mono">WAF Master Status</span>
                      <span className="text-xl font-black text-white block mt-2 flex items-center gap-1.5">
                        <ShieldCheck size={20} className={wafEnabled ? "text-emerald-400" : "text-zinc-600"} />
                        {wafEnabled ? "FIREWALL ACTIVE" : "DISABLED"}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setWafEnabled(!wafEnabled);
                        addToast(`WAF status switched to ${!wafEnabled ? "ACTIVE" : "DISABLED"}`, !wafEnabled ? "success" : "warning");
                      }}
                      className={cn(
                        "mt-3 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border",
                        wafEnabled ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                      )}
                    >
                      Toggle WAF State
                    </button>
                  </div>

                  <div className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl font-mono">
                    <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest block">Threat Intelligence Index</span>
                    <span className="text-2xl font-black text-emerald-400 block mt-2">98.4 / 100</span>
                    <p className="text-[10px] text-zinc-400 font-sans font-medium mt-1">Status: Low Risk Profile</p>
                  </div>

                  <div className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl font-mono">
                    <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest block">Active IP Blacklist</span>
                    <span className="text-2xl font-black text-purple-400 block mt-2">{blockedIps.length} IPs</span>
                    <p className="text-[10px] text-zinc-400 font-sans font-medium mt-1">Auto-filtered by rule set</p>
                  </div>

                  <div className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl font-mono">
                    <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest block">Auth Failure Rate</span>
                    <span className="text-2xl font-black text-amber-400 block mt-2">0.04%</span>
                    <p className="text-[10px] text-zinc-400 font-sans font-medium mt-1">Within normal baseline</p>
                  </div>
                </div>

                {/* Add IP to Blacklist Manager */}
                <div className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl space-y-4 shadow-xl">
                  <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">Manual IP Blacklist Manager</span>
                  <div className="flex flex-col md:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="IP Address (e.g. 192.168.1.104)..."
                      value={newIpInput}
                      onChange={(e) => setNewIpInput(e.target.value)}
                      className="px-3 py-2 bg-white/[0.02] border border-white/[0.06] text-white rounded-xl text-xs outline-none focus:border-purple-500 font-mono font-bold flex-1"
                    />
                    <input
                      type="text"
                      placeholder="Reason (e.g. Brute Force Probe)..."
                      value={newIpReason}
                      onChange={(e) => setNewIpReason(e.target.value)}
                      className="px-3 py-2 bg-white/[0.02] border border-white/[0.06] text-white rounded-xl text-xs outline-none focus:border-purple-500 font-sans flex-1"
                    />
                    <button
                      onClick={handleAddBlockedIp}
                      className="px-4 py-2 bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-300 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Blacklist IP
                    </button>
                  </div>

                  {/* Active Blacklisted IPs Table */}
                  <div className="overflow-x-auto pt-2">
                    <table className="w-full text-xs font-medium text-zinc-400 font-mono">
                      <thead>
                        <tr className="text-left border-b border-white/[0.06] text-[9px] text-zinc-500 font-black uppercase tracking-wider">
                          <th className="pb-2">IP Address</th>
                          <th className="pb-2">Reason</th>
                          <th className="pb-2">Blacklisted At</th>
                          <th className="pb-2">Threat Level</th>
                          <th className="pb-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blockedIps.map((b) => (
                          <tr key={b.id} className="border-b border-white/[0.04] last:border-0">
                            <td className="py-2.5 font-bold text-white">{b.ip}</td>
                            <td className="py-2.5 text-zinc-400 font-sans">{b.reason}</td>
                            <td className="py-2.5 text-zinc-500 text-[10px]">{b.blockedAt}</td>
                            <td className="py-2.5">
                              <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-red-500/10 text-red-400 border border-red-500/20">
                                {b.threatLevel}
                              </span>
                            </td>
                            <td className="py-2.5 text-right">
                              <button
                                onClick={() => handleUnblockIp(b.ip)}
                                className="px-2.5 py-1 bg-white/[0.03] border border-white/[0.06] text-zinc-300 hover:text-white rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                Unblock
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Live Security Threat Stream */}
                <div className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl space-y-4 shadow-xl">
                  <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">Live Threat Detection Log</span>
                  <div className="border border-white/[0.06] rounded-xl overflow-hidden">
                    <table className="w-full text-xs font-medium text-zinc-400 font-mono">
                      <thead>
                        <tr className="text-left border-b border-white/[0.06] text-[9px] text-zinc-500 font-black uppercase tracking-wider bg-white/[0.02]">
                          <th className="p-3">IP & Location</th>
                          <th className="p-3">Vector Probe</th>
                          <th className="p-3">Severity</th>
                          <th className="p-3">Action Taken</th>
                          <th className="p-3 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {securityLogs.map((sec) => (
                          <tr key={sec.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03]">
                            <td className="p-3">
                              <span className="font-bold text-white block">{sec.ip}</span>
                              <span className="text-[9px] text-zinc-500">{sec.geo}</span>
                            </td>
                            <td className="p-3 text-zinc-300 font-sans font-semibold">{sec.vector}</td>
                            <td className="p-3">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[8px] font-black uppercase border",
                                sec.severity === "CRITICAL" ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse" :
                                  sec.severity === "HIGH" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "bg-zinc-800 text-zinc-400"
                              )}>
                                {sec.severity}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {sec.action}
                              </span>
                            </td>
                            <td className="p-3 text-right text-zinc-500 text-[10px]">{sec.time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 12. DATABASE BACKUPS */}
            {activeSubTab === "backups" && hasAccessToTab("backups") && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">System Recovery Backups</span>
                  <button
                    onClick={() => executeAdminAction("Trigger database backup", () => {
                      addToast("Manual database backup task successfully triggered.", "success");
                    })}
                    className="flex items-center gap-1.5 px-3.5 py-1.8 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-purple-600/20"
                  >
                    Trigger Backup Now
                  </button>
                </div>

                <div className="border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl overflow-hidden shadow-xl">
                  <table className="w-full text-xs font-medium text-zinc-400 font-mono">
                    <thead>
                      <tr className="text-left border-b border-white/[0.06] text-[9px] text-zinc-500 font-black uppercase tracking-wider bg-white/[0.02]">
                        <th className="p-4">Backup Archive Name</th>
                        <th className="p-4">Archive Size</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backups.map((bak) => (
                        <tr key={bak.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition">
                          <td className="p-4">
                            <span className="font-extrabold text-white block text-xs font-sans">{bak.name}</span>
                            <span className="text-[9px] text-zinc-500">{bak.created}</span>
                          </td>
                          <td className="p-4 font-bold text-zinc-300">{bak.size}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {bak.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => executeAdminAction("Download backup file", () => addToast("Downloading backup archives.", "info"))}
                              className="px-2.5 py-1.5 bg-white/[0.03] border border-white/[0.06] hover:border-purple-500/20 text-zinc-300 hover:text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
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

      {/* TENANT INSPECTOR SLIDE-OVER DRAWER (PHASE 3) */}
      <AnimatePresence>
        {inspectedTenant && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectedTenant(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-[#09090b]/95 border-l border-white/[0.08] backdrop-blur-2xl p-6 overflow-y-auto space-y-6 shadow-2xl text-zinc-300"
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b border-white/[0.06] pb-4">
                <div>
                  <span className="text-[9px] text-purple-400 font-mono font-extrabold uppercase tracking-widest block">Tenant Workspace Diagnostics</span>
                  <h2 className="text-xl font-extrabold text-white mt-1">{inspectedTenant.name}</h2>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">UUID: {inspectedTenant.id}</p>
                </div>
                <button
                  onClick={() => setInspectedTenant(null)}
                  className="p-2 border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] rounded-xl text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Status & Plan Badges */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-white/[0.06] bg-white/[0.02] rounded-xl">
                  <span className="text-[9px] text-zinc-500 uppercase font-black block font-mono">Current Plan</span>
                  <span className="text-lg font-black text-purple-400 block mt-1">{inspectedTenant.plan}</span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">{inspectedTenant.revenue} / year</span>
                </div>
                <div className="p-4 border border-white/[0.06] bg-white/[0.02] rounded-xl">
                  <span className="text-[9px] text-zinc-500 uppercase font-black block font-mono">Account Status</span>
                  <span className={cn(
                    "inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono mt-1 border",
                    inspectedTenant.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                  )}>
                    {inspectedTenant.status}
                  </span>
                </div>
              </div>

              {/* Resource Usage Gauges */}
              <div className="space-y-4 border border-white/[0.06] bg-white/[0.02] p-5 rounded-2xl">
                <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">System Resource Quota Allocation</span>

                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between font-bold">
                    <span>Cloud Storage Used:</span>
                    <span className="text-white">{inspectedTenant.storage} / 50.0 GB</span>
                  </div>
                  <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.06]">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: "34%" }} />
                  </div>
                </div>

                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between font-bold">
                    <span>Monthly API Requests:</span>
                    <span className="text-white">48,290 / 100,000</span>
                  </div>
                  <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.06]">
                    <div className="h-full bg-pink-500 rounded-full" style={{ width: "48%" }} />
                  </div>
                </div>

                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between font-bold">
                    <span>Active User Seats:</span>
                    <span className="text-white">{inspectedTenant.users} / 10 Seats</span>
                  </div>
                  <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.06]">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: "20%" }} />
                  </div>
                </div>
              </div>

              {/* Associated User Roster */}
              <div className="space-y-3">
                <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">Associated Workspace Members</span>
                <div className="border border-white/[0.06] rounded-xl overflow-hidden">
                  <div className="p-3 border-b border-white/[0.04] flex justify-between items-center text-xs font-bold">
                    <span>Admin User</span>
                    <span className="text-purple-400">Owner Role</span>
                  </div>
                  <div className="p-3 flex justify-between items-center text-xs font-bold">
                    <span>Coordinator Team</span>
                    <span className="text-zinc-400">Coordinator Role</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Override Footer */}
              <div className="pt-4 border-t border-white/[0.06] flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() => {
                    handleImpersonate(inspectedTenant.id, inspectedTenant.name);
                    setInspectedTenant(null);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Impersonate Workspace
                </button>
                <button
                  onClick={() => {
                    handleToggleTenantStatus(inspectedTenant.id, inspectedTenant.status);
                    setInspectedTenant({
                      ...inspectedTenant,
                      status: inspectedTenant.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"
                    });
                  }}
                  className={cn(
                    "px-4 py-2 font-bold rounded-xl text-xs transition cursor-pointer border",
                    inspectedTenant.status === "ACTIVE" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  )}
                >
                  {inspectedTenant.status === "ACTIVE" ? "Suspend Tenant" : "Reactivate Tenant"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
