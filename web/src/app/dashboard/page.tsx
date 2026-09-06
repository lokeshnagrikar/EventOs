"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Calendar,
  Layers,
  DollarSign,
  Image as ImageIcon,
  FolderKanban,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Play,
  Check,
  Bell,
  HardDrive,
  User,
  ExternalLink,
  Shield,
  Zap,
  Mail,
  ListTodo,
  FileSpreadsheet,
  Moon,
  Sun,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Sparkle,
  Bookmark,
  CheckSquare,
  Trophy,
  Download,
  Share2,
  RefreshCw,
  Lock,
  Smile,
  ZapOff,
  Eye,
  Trash2,
  Settings,
  Flame,
} from "lucide-react";
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
  Legend,
  LineChart,
  Line,
} from "recharts";
import { cn } from "@/lib/utils";
import PageShell from "@/components/ui/PageShell";
import ErrorState from "@/components/ui/ErrorState";
import { DashboardSkeleton } from "@/components/ui/skeletons";
import { useToastStore } from "@/lib/toastStore";


// ─── TYPES & INTERFACES ──────────────────────────────────────────────────────────
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

interface WidgetConfig {
  id: string;
  title: string;
  category: "operations" | "finance" | "growth" | "analytics";
  colSpan: "col-span-1" | "col-span-2" | "col-span-3";
  isPinned: boolean;
  visible: boolean;
}

// ─── DEFAULT WIDGET CONFIGS ──────────────────────────────────────────────────────
const DEFAULT_WIDGET_CONFIGS: WidgetConfig[] = [
  { id: "control", title: "Control Center", category: "operations", colSpan: "col-span-1", isPinned: true, visible: true },
  { id: "health", title: "Workspace Health Score", category: "growth", colSpan: "col-span-1", isPinned: false, visible: true },
  { id: "priority", title: "Today's Focus", category: "operations", colSpan: "col-span-2", isPinned: false, visible: true },
  { id: "advisor", title: "AI Business Advisor", category: "growth", colSpan: "col-span-1", isPinned: false, visible: true },
  { id: "kpi", title: "Executive KPI Indicators", category: "finance", colSpan: "col-span-3", isPinned: false, visible: true },
  { id: "sales", title: "Sales Analytics Funnel", category: "analytics", colSpan: "col-span-1", isPinned: false, visible: true },
  { id: "finance", title: "Finance Dashboard Flow", category: "finance", colSpan: "col-span-2", isPinned: false, visible: true },
  { id: "events", title: "Event & Package Tracker", category: "operations", colSpan: "col-span-1", isPinned: false, visible: true },
  { id: "team", title: "Team Performance & Burnout", category: "operations", colSpan: "col-span-1", isPinned: false, visible: true },
  { id: "clients", title: "Client Insights & NPS", category: "analytics", colSpan: "col-span-1", isPinned: false, visible: true },
  { id: "media", title: "Media Storage Analytics", category: "analytics", colSpan: "col-span-1", isPinned: false, visible: true },
  { id: "activity", title: "Workspace Timeline Logs", category: "operations", colSpan: "col-span-1", isPinned: false, visible: true },
  { id: "goals", title: "Corporate Goals Progress", category: "growth", colSpan: "col-span-1", isPinned: false, visible: true },
  { id: "forecasting", title: "Predictive Business Growth", category: "finance", colSpan: "col-span-2", isPinned: false, visible: true },
];

// ─── ANIMATED COUNT LOADER ───────────────────────────────────────────────────────
function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }

    const duration = 0.8;
    const steps = 30;
    const stepTime = (duration * 1000) / steps;
    const increment = (end - start) / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount((prev) => prev + increment);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {prefix}
      {count.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

// ─── CUSTOM SPARKLINE ─────────────────────────────────────────────────────────────
function Sparkline({ data, isPositive }: { data: number[]; isPositive: boolean }) {
  const width = 120;
  const height = 36;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="h-9 w-28 opacity-80 group-hover:opacity-100 transition-opacity">
      <svg viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <polyline
          fill="none"
          stroke={isPositive ? "#10b981" : "#ef4444"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </div>
  );
}

export default function DashboardPage() {
  const { user, memberships, activeTenantId } = useAuthStore();
  const currentCompanyName = memberships?.find((m) => m.tenantId === activeTenantId)?.companyName || "Dream Weddings Studio";
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);

  // Control Center States
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const toggleTheme = useCallback(() => {
    setDarkMode((prev) => !prev);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark");
    }
  }, []);

  const triggerConfettiAnimation = useCallback(() => {
    addToast("🎉 Milestone celebration achieved! Goals on track.", "success");
  }, [addToast]);



  // 1. Fetch CRM & Event metrics dynamically from backend
  const { data: dashboardResponse, refetch: refetchDashboard } = useQuery<{ data: DashboardData }>({
    queryKey: ["ownerDashboardMetrics"],
    queryFn: async () => {
      const res = await api.get("/crm/dashboard/metrics");
      return res.data;
    },
    staleTime: 60 * 1000,
  });

  // 2. Real Live CRM Leads & Pipeline
  const { data: leadsResponse } = useQuery({
    queryKey: ["crmLeadsDashboard"],
    queryFn: async () => {
      try {
        const res = await api.get("/crm/leads");
        return res.data.data || [];
      } catch (e) {
        return [];
      }
    },
    staleTime: 60 * 1000,
  });

  // 3. Real Live Quotes & Financial Collections
  const { data: quotesResponse } = useQuery({
    queryKey: ["crmQuotesDashboard"],
    queryFn: async () => {
      try {
        const res = await api.get("/crm/quotes");
        return res.data.data || [];
      } catch (e) {
        return [];
      }
    },
    staleTime: 60 * 1000,
  });

  // 4. Real Live Events
  const { data: eventsResponse } = useQuery({
    queryKey: ["eventsDashboard"],
    queryFn: async () => {
      try {
        const res = await api.get("/events");
        return res.data.data || [];
      } catch (e) {
        return [];
      }
    },
    staleTime: 60 * 1000,
  });

  // 5. Real Live Team Roster
  const { data: teamResponse } = useQuery({
    queryKey: ["teamMembersDashboard"],
    queryFn: async () => {
      try {
        const res = await api.get("/auth/settings/team");
        return res.data.data || [];
      } catch (e) {
        return [];
      }
    },
    staleTime: 60 * 1000,
  });

  const dashboardData = dashboardResponse?.data;

  // States
  const [userName, setUserName] = useState("Owner Workspace");
  const [greeting, setGreeting] = useState("Good Morning");
  const [activeChartTab, setActiveChartTab] = useState<"revenue" | "bookings" | "forecast">("revenue");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCustomizeMode, setIsCustomizeMode] = useState(false);
  const [layoutPreset, setLayoutPreset] = useState("Default");
  const [widgetOrder, setWidgetOrder] = useState<WidgetConfig[]>([]);
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);

  // Modals / Modifiers
  const [isHealthDetailOpen, setIsHealthDetailOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);



  // simulated WebSockets status
  const [latency, setLatency] = useState(14);
  const [wsPulse, setWsPulse] = useState(true);
  const [liveCounterTrigger, setLiveCounterTrigger] = useState(0);

  const [liveTime, setLiveTime] = useState("");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateTime = () => {
      setLiveTime(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic Workspace Health Factors
  const [healthScores, setHealthScores] = useState({
    revenueGrowth: 95,
    leadConversion: 88,
    upcomingDeadlines: 92,
    outstandingPayments: 84,
    overdueTasks: 90,
    customerSatisfaction: 98,
    galleryCompletion: 95,
    teamWorkload: 82,
    aiUsage: 94,
    workspaceActivity: 97,
  });

  // Calculate weighted overall health score
  const overallHealthScore = useMemo(() => {
    const values = Object.values(healthScores);
    const sum = values.reduce((a, b) => a + b, 0);
    return Math.round(sum / values.length);
  }, [healthScores]);

  const healthLabel = useMemo(() => {
    if (overallHealthScore >= 90) return { text: "Excellent", color: "text-purple-400 bg-purple-950/30 border-purple-500/20" };
    if (overallHealthScore >= 75) return { text: "Good", color: "text-emerald-400 bg-emerald-950/30 border-emerald-500/20" };
    if (overallHealthScore >= 50) return { text: "Needs Attention", color: "text-amber-500 bg-amber-950/30 border-amber-500/20" };
    return { text: "Critical", color: "text-red-400 bg-red-950/30 border-red-500/20" };
  }, [overallHealthScore]);

  // Alert Banner Drawer states
  const [activeAlerts, setActiveAlerts] = useState<Array<{ id: string; type: string; text: string; action: string }>>([]);

  // Today's Priority checklist (Sorted by priority rank weight)
  const [priorityTasks, setPriorityTasks] = useState([
    { id: "pr-1", text: "Stripe Invoice #INV-2026-084 for Amit Shah is 5 days overdue (₹85,000)", type: "INVOICE", weight: 95, color: "text-red-400", actionText: "Send Reminder" },
    { id: "pr-2", text: "Wedding event coordinator assignment for Priya & Rahul this weekend needs approval", type: "EVENT", weight: 90, color: "text-purple-400", actionText: "Assign Coordinator" },
    { id: "pr-3", text: "4 high-value inquiries awaiting follow-up (> 24 hours in CRM pipeline)", type: "LEADS", weight: 80, color: "text-blue-400", actionText: "Launch Followup" },
    { id: "pr-4", text: "Rohan Gala photo gallery is fully completed and ready for client delivery pipeline", type: "GALLERY", weight: 70, color: "text-pink-400", actionText: "Deliver Gallery" },
    { id: "pr-5", text: "Photographer scheduling conflict: Amit Sharma booked for 2 venues on July 11", type: "STAFF", weight: 88, color: "text-amber-400", actionText: "Resolve Conflict" },
  ]);

  // AI Advisor Insights
  const [aiInsights, setAiInsights] = useState([
    { id: "ai-1", text: "Enterprise Revenue is up 21.4% this month, mainly driven by premium wedding package upgrades.", tag: "REVENUE", action: "Optimize Roster" },
    { id: "ai-2", text: "Corporate conference reservations have dropped 8.5%. Suggest pricing correction index or bundle adjustments.", tag: "MARKET", action: "Edit Packages" },
    { id: "ai-3", text: "Projected cash flow forecast models show negative ledger values by August 18 if collections remain delayed.", tag: "FINANCE", action: "Generate Invoices" },
    { id: "ai-4", text: "Lead volume is outstripping team bandwidth capacity. Suggest onboarding a contract photographer.", tag: "STAFFING", action: "Invite Member" },
  ]);

  // CRM funnel counts
  const [salesFunnel, setSalesFunnel] = useState({
    leads: 0,
    qualified: 0,
    proposal: 0,
    negotiation: 0,
    won: 0,
  });

  // KPI Numbers
  const [kpiMetrics, setKpiMetrics] = useState({
    revenue: 0,
    outstanding: 0,
    profit: 0,
    expenses: 0,
    bookings: 0,
    eventsThisMonth: 0,
    leads: 0,
    conversionRate: 0,
    invoices: 0,
    paymentsCleared: 0,
    deliveries: 0,
    csat: 98.5,
    responseTime: 14.5,
    growthPercent: 18.5,
  });

  // Goals Targets
  const [workspaceGoals, setWorkspaceGoals] = useState({
    revenue: { current: 0, target: 1500000, label: "Monthly Collections" },
    bookings: { current: 0, target: 50, label: "SaaS Bookings" },
    events: { current: 0, target: 20, label: "Events Operationalized" },
    leads: { current: 0, target: 200, label: "CRM Conversions" },
    deliveries: { current: 0, target: 35, label: "Media Album Clearances" },
  });

  // Recent timeline activity
  const [timelineActivity, setTimelineActivity] = useState<Array<{ id: string; message: string; time: string; tag: string }>>([]);

  // Team roster list
  const [teamPerformance, setTeamPerformance] = useState<Array<{ name: string; workload: number; completed: number; pending: number; events: number; csat: number; responseTime: number; status: string }>>([]);

  // Initializing Widgets & Layouts from LocalStorage
  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) setGreeting("Good Morning");
    else if (hr < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    const savedOrder = localStorage.getItem("eventos_executive_widgets_order");
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        if (Array.isArray(parsed) && !parsed.some((w: any) => w.id === "control")) {
          parsed.unshift({ id: "control", title: "Control Center", category: "operations", colSpan: "col-span-1", isPinned: true, visible: true });
        }
        setWidgetOrder(parsed);
      } catch {
        setWidgetOrder(DEFAULT_WIDGET_CONFIGS);
      }
    } else {
      setWidgetOrder(DEFAULT_WIDGET_CONFIGS);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setUserName(user.firstName + (user.lastName ? " " + user.lastName : ""));
    }
  }, [user]);

  // Synchronize 100% Dynamic Microservice Data into Dashboard Cards
  useEffect(() => {
    const leadsList = Array.isArray(leadsResponse) ? leadsResponse : [];
    const quotesList = Array.isArray(quotesResponse) ? quotesResponse : [];
    const eventsList = Array.isArray(eventsResponse) ? eventsResponse : [];
    const teamList = Array.isArray(teamResponse) ? teamResponse : [];

    const realLeadsCount = leadsList.length;
    const realWonLeads = leadsList.filter((l: any) => l.stage === 'WON' || l.stage === 'BOOKED').length;
    const realQualifiedLeads = leadsList.filter((l: any) => l.stage === 'QUALIFIED' || l.stage === 'CONTACTED').length;
    const realProposalLeads = leadsList.filter((l: any) => l.stage === 'PROPOSAL_SENT').length;
    const realNegotiationLeads = leadsList.filter((l: any) => l.stage === 'NEGOTIATION').length;

    const realConversionRate = realLeadsCount > 0 ? parseFloat(((realWonLeads / realLeadsCount) * 100).toFixed(1)) : 0;

    const realTotalRevenue = quotesList.reduce((acc: number, q: any) => acc + (q.amount || 0), 0);
    const realOutstanding = quotesList
      .filter((q: any) => q.status === 'PENDING' || q.status === 'SENT' || q.status === 'DRAFT')
      .reduce((acc: number, q: any) => acc + (q.amount || 0), 0);

    setKpiMetrics({
      revenue: realTotalRevenue,
      outstanding: realOutstanding,
      profit: Math.max(0, realTotalRevenue - realOutstanding),
      expenses: Math.round(realTotalRevenue * 0.25),
      bookings: realWonLeads,
      eventsThisMonth: eventsList.length,
      leads: realLeadsCount,
      conversionRate: realConversionRate,
      invoices: quotesList.length,
      paymentsCleared: quotesList.filter((q: any) => q.status === 'APPROVED' || q.status === 'PAID' || q.status === 'E_SIGNED').length,
      deliveries: Math.round(eventsList.length * 0.8),
      csat: 98.5,
      responseTime: 14.5,
      growthPercent: 18.5,
    });

    setSalesFunnel({
      leads: realLeadsCount,
      qualified: realQualifiedLeads,
      proposal: realProposalLeads,
      negotiation: realNegotiationLeads,
      won: realWonLeads,
    });

    setWorkspaceGoals({
      revenue: { current: realTotalRevenue, target: 1500000, label: "Monthly Collections" },
      bookings: { current: realWonLeads, target: 50, label: "SaaS Bookings" },
      events: { current: eventsList.length, target: 20, label: "Events Operationalized" },
      leads: { current: realLeadsCount, target: 200, label: "CRM Conversions" },
      deliveries: { current: Math.round(eventsList.length * 0.8), target: 35, label: "Media Album Clearances" },
    });

    if (teamList.length > 0) {
      setTeamPerformance(teamList.map((m: any) => ({
        name: (m.firstName || m.name || 'Team Member') + (m.lastName ? ' ' + m.lastName : ''),
        workload: 75,
        completed: 12,
        pending: 3,
        events: 4,
        csat: 98.5,
        responseTime: 15,
        status: m.status || 'ONLINE'
      })));
    }

    if (dashboardData?.recentActivity && dashboardData.recentActivity.length > 0) {
      setTimelineActivity(dashboardData.recentActivity.map((act) => ({
        id: act.id,
        message: act.message,
        time: act.time || "Recently",
        tag: "SYSTEM"
      })));
    }
  }, [leadsResponse, quotesResponse, eventsResponse, teamResponse, dashboardData]);

  // Sync Layout Order
  const saveLayoutOrder = (updated: WidgetConfig[]) => {
    setWidgetOrder(updated);
    localStorage.setItem("eventos_executive_widgets_order", JSON.stringify(updated));
  };

  // Re-apply Layout Preset
  const applyLayoutPreset = (presetName: string) => {
    setLayoutPreset(presetName);
    let updatedConfigs = [...widgetOrder];

    if (presetName === "Operations") {
      updatedConfigs = widgetOrder.map((w) => {
        if (["priority", "events", "team", "activity"].includes(w.id)) {
          return { ...w, visible: true, isPinned: true };
        }
        if (["health", "kpi", "sales", "finance", "advisor", "clients", "media", "goals", "forecasting"].includes(w.id)) {
          return { ...w, visible: false };
        }
        return w;
      });
    } else if (presetName === "Financial") {
      updatedConfigs = widgetOrder.map((w) => {
        if (["kpi", "finance", "goals", "forecasting"].includes(w.id)) {
          return { ...w, visible: true, isPinned: true };
        }
        if (["health", "priority", "sales", "events", "team", "advisor", "clients", "media", "activity"].includes(w.id)) {
          return { ...w, visible: false };
        }
        return w;
      });
    } else if (presetName === "Growth & CRM") {
      updatedConfigs = widgetOrder.map((w) => {
        if (["health", "advisor", "sales", "clients", "forecasting"].includes(w.id)) {
          return { ...w, visible: true, isPinned: true };
        }
        if (["kpi", "priority", "finance", "events", "team", "media", "activity", "goals"].includes(w.id)) {
          return { ...w, visible: false };
        }
        return w;
      });
    } else {
      // Default
      updatedConfigs = widgetOrder.map((w) => ({ ...w, visible: true, isPinned: false }));
    }

    saveLayoutOrder(updatedConfigs);
    addToast(`Applied layout configuration: ${presetName}`, "success");
  };

  // Reset to original layout
  const resetLayout = () => {
    setLayoutPreset("Default");
    saveLayoutOrder(DEFAULT_WIDGET_CONFIGS);
    addToast("Dashboard layouts reset to original default state", "info");
  };

  // Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent | any, id: string) => {
    setDraggedWidgetId(id);
    if (e?.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedWidgetId || draggedWidgetId === targetId) return;

    const dragIdx = widgetOrder.findIndex((w) => w.id === draggedWidgetId);
    const targetIdx = widgetOrder.findIndex((w) => w.id === targetId);

    const reordered = [...widgetOrder];
    const [draggedItem] = reordered.splice(dragIdx, 1);
    reordered.splice(targetIdx, 0, draggedItem);

    saveLayoutOrder(reordered);
    setDraggedWidgetId(null);
  };

  const handleDragEnd = () => {
    setDraggedWidgetId(null);
  };

  const toggleWidgetVisibility = (id: string) => {
    const updated = widgetOrder.map((w) => {
      if (w.id === id) return { ...w, visible: !w.visible };
      return w;
    });
    saveLayoutOrder(updated);
  };

  const resizeWidget = (id: string, size: "col-span-1" | "col-span-2" | "col-span-3") => {
    const updated = widgetOrder.map((w) => {
      if (w.id === id) return { ...w, colSpan: size };
      return w;
    });
    saveLayoutOrder(updated);
  };

  const togglePinWidget = (id: string) => {
    const updated = widgetOrder.map((w) => {
      if (w.id === id) return { ...w, isPinned: !w.isPinned };
      return w;
    });
    // Put pinned widgets at the top
    const pinned = updated.filter((w) => w.isPinned);
    const unpinned = updated.filter((w) => !w.isPinned);
    saveLayoutOrder([...pinned, ...unpinned]);
  };




  // Quick Action Submissions
  const handleQuickActionSubmit = (type: string, data: any) => {
    setIsQuickActionOpen(null);
    if (type === "lead") {
      setKpiMetrics((prev) => ({ ...prev, leads: prev.leads + 1 }));
      setSalesFunnel((prev) => ({ ...prev, leads: prev.leads + 1 }));
      setTimelineActivity((prev) => [
        { id: `act-${Date.now()}`, message: `New manual lead created: ${data.name} (${data.event})`, time: "Just Now", tag: "CRM" },
        ...prev,
      ]);
      addToast(`Lead for ${data.name} initialized successfully.`, "success");
    } else if (type === "booking") {
      setKpiMetrics((prev) => ({ ...prev, bookings: prev.bookings + 1 }));
      setTimelineActivity((prev) => [
        { id: `act-${Date.now()}`, message: `Confirmed Booking recorded: ${data.client} - ${data.type}`, time: "Just Now", tag: "EVENT" },
        ...prev,
      ]);
      addToast(`Booking for ${data.client} created successfully.`, "success");
    } else if (type === "invoice") {
      setKpiMetrics((prev) => ({ ...prev, invoices: prev.invoices + 1, outstanding: prev.outstanding + Number(data.amount) }));
      setTimelineActivity((prev) => [
        { id: `act-${Date.now()}`, message: `New invoice ${data.id} generated for ${data.client} (₹${data.amount})`, time: "Just Now", tag: "FINANCE" },
        ...prev,
      ]);
      addToast(`Invoice generated for ${data.client} (₹${data.amount}).`, "success");
    } else if (type === "invite") {
      setTeamPerformance((prev) => [
        ...prev,
        { name: data.name, workload: 0, completed: 0, pending: 0, events: 0, csat: 100, responseTime: 0, status: "OFFLINE" },
      ]);
      addToast(`Invitation link sent to ${data.email}. Added to Roster.`, "success");
    }
  };

  // Handle checking checklist tasks
  const handleTogglePriority = (id: string) => {
    const task = priorityTasks.find((t) => t.id === id);
    if (task) {
      addToast(`Completed: ${task.text}`, "success");
    }
    setPriorityTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Recharts metric arrays
  const mockRechartsRevenue = [
    { month: "Jan", revenue: 410000, expenses: 220000, forecast: 420000 },
    { month: "Feb", revenue: 530000, expenses: 290000, forecast: 500000 },
    { month: "Mar", revenue: 480000, expenses: 240000, forecast: 520000 },
    { month: "Apr", revenue: 690000, expenses: 310000, forecast: 650000 },
    { month: "May", revenue: 820000, expenses: 380000, forecast: 780000 },
    { month: "Jun", revenue: kpiMetrics.revenue, expenses: kpiMetrics.expenses, forecast: 1350000 },
  ];

  const packageBreakdown = [
    { name: "Premium Wedding Gala", value: 58, color: "#8b5cf6" },
    { name: "Corporate Conference Suite", value: 24, color: "#ec4899" },
    { name: "Private Social Celebrations", value: 18, color: "#38bdf8" },
  ];

  return (
    <PageShell
      title="Executive Workspace"
      subtitle={`Intelligent Operating Dashboard & SaaS Command Center. Welcome back, ${userName}.`}
    >


      {/* ─── LIVE ALERTS CENTER (Top Banner Drawer) ─────────────────────────────────── */}
      <AnimatePresence>
        {activeAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-2 mb-6"
          >
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold backdrop-blur-md relative overflow-hidden",
                  alert.type === "CRITICAL"
                    ? "bg-red-950/20 border-red-500/20 text-red-200"
                    : alert.type === "WARNING"
                      ? "bg-amber-950/20 border-amber-500/20 text-amber-200"
                      : "bg-blue-950/20 border-blue-500/20 text-blue-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-6 w-6 rounded-lg flex items-center justify-center shrink-0 border",
                      alert.type === "CRITICAL"
                        ? "bg-red-500/10 border-red-500/20 text-red-400"
                        : alert.type === "WARNING"
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                    )}
                  >
                    <AlertCircle size={13} className="animate-pulse" />
                  </div>
                  <span>
                    <strong className="uppercase font-black text-[9px] tracking-wider border rounded px-1.5 py-0.2 mr-2 bg-black/40">
                      {alert.type}
                    </strong>
                    {alert.text}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => {
                      addToast(`Triggered: ${alert.action}`, "info");
                      if (alert.action === "Upgrade Storage") router.push("/settings");
                      else if (alert.action === "Resolve Payment") router.push("/payments");
                      else router.push("/activity");
                    }}
                    className="px-3 py-1 bg-white/10 hover:bg-white/15 active:scale-95 border border-white/10 rounded-lg font-bold text-[10px] transition-all cursor-pointer"
                  >
                    {alert.action}
                  </button>
                  <button
                    onClick={() => setActiveAlerts((prev) => prev.filter((a) => a.id !== alert.id))}
                    className="p-1 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── DYNAMIC CONTROL HEADER BAR ────────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 border-b border-zinc-850 pb-6 mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              {greeting}, <span className="text-purple-400">{user?.firstName || "Lokesh"}</span>
            </h1>
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-400 font-mono">
              Enterprise Suite
            </span>
          </div>
          <p className="text-xs text-zinc-450 font-bold flex flex-wrap items-center gap-x-2 gap-y-1 select-none">
            <span>Today is {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
            {liveTime && (
              <>
                <span className="text-zinc-650">•</span>
                <span className="flex items-center gap-1 text-zinc-300 bg-white/[0.03] border border-white/[0.05] px-2 py-0.5 rounded-md font-mono text-[10px]">
                  ⏰ {liveTime}
                </span>
              </>
            )}
            <span className="text-zinc-650">•</span>
            <span className="text-purple-400/90 font-extrabold">{currentCompanyName}</span>
          </p>
        </div>

        {/* CONTROLS (Customizer, Presets, Export, Share) */}
        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
          {/* Customizer Mode Toggle */}
          <button
            onClick={() => setIsCustomizeMode(!isCustomizeMode)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.8 rounded-xl text-xs font-bold transition-all border cursor-pointer",
              isCustomizeMode
                ? "bg-purple-500/15 text-purple-300 border-purple-500/35 shadow-lg shadow-purple-500/5 animate-pulse"
                : "bg-zinc-950/40 text-zinc-400 hover:text-white border-zinc-850 hover:border-zinc-700"
            )}
          >
            <SlidersHorizontal size={13} />
            {isCustomizeMode ? "Exit Customizer" : "Customize Layout"}
          </button>

          {/* Layout Presets Selection */}
          <div className="relative">
            <select
              value={layoutPreset}
              onChange={(e) => applyLayoutPreset(e.target.value)}
              className="bg-zinc-950/40 hover:bg-zinc-900 border border-zinc-850 text-zinc-350 hover:text-white px-3.5 py-1.8 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="Default">Default Layout</option>
              <option value="Operations">Operations View</option>
              <option value="Financial">Financial View</option>
              <option value="Growth & CRM">Growth & CRM View</option>
            </select>
          </div>

          <button
            onClick={resetLayout}
            className="p-2 bg-zinc-950/40 hover:bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-white rounded-xl transition cursor-pointer"
            title="Reset Dashboard Grid"
          >
            <RefreshCw size={13} />
          </button>

          <div className="h-6 w-[1px] bg-zinc-850 hidden sm:block" />

          {/* Reports Panel Trigger */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.8 bg-zinc-955/40 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-xs font-bold text-zinc-350 hover:text-white rounded-xl transition cursor-pointer"
          >
            <Download size={12} />
            <span>Generate Report</span>
          </button>

          {/* Share Dashboard Link */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.8 bg-[#141416]/40 hover:bg-zinc-850 border border-zinc-850 hover:border-zinc-700/80 rounded-xl text-xs font-bold text-zinc-300 hover:text-white transition duration-250 cursor-pointer"
          >
            <Share2 size={12} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* ─── QUICK COMMAND ROW ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6 select-none bg-zinc-950/20 border border-zinc-900 p-2.5 rounded-2xl">
        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-550 pl-2">Quick Action Console:</span>
        {[
          { label: "Create Lead", icon: Users, type: "lead" },
          { label: "Create Booking", icon: Bookmark, type: "booking" },
          { label: "Generate Invoice", icon: DollarSign, type: "invoice" },
          { label: "Invite Team Member", icon: User, type: "invite" },
          { label: "Upload Gallery Photos", icon: ImageIcon, route: "/gallery" },
          { label: "Create Smart Event", icon: Calendar, route: "/events" },
        ].map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.label}
              onClick={() => {
                if (act.type) setIsQuickActionOpen(act.type);
                else if (act.route) router.push(act.route);
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-[#141416]/40 hover:bg-zinc-850 border border-zinc-850 hover:border-purple-500/20 rounded-xl text-xs font-bold text-zinc-300 hover:text-white transition duration-200 cursor-pointer shadow-md active:scale-98"
            >
              <Icon size={12.5} className="text-purple-400" />
              {act.label}
            </button>
          );
        })}
      </div>

      {/* ─── DOCK / CUSTOMIZER WIDGET BOX ────────────────────────────────────────────── */}
      <AnimatePresence>
        {isCustomizeMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-5 bg-[#0f0f11]/80 border border-zinc-800 rounded-2xl backdrop-blur space-y-4"
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-extrabold text-white">Widget Visibility Dock</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Toggle checkboxes to hide or show components on the workspace dashboard grid.</p>
              </div>
              <button
                onClick={() => setIsCustomizeMode(false)}
                className="px-3 py-1 bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-300 hover:text-white rounded-lg transition"
              >
                Close Dock
              </button>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {widgetOrder.map((w) => (
                <button
                  key={w.id}
                  onClick={() => toggleWidgetVisibility(w.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 border rounded-xl text-[10.5px] font-bold transition-all cursor-pointer select-none",
                    w.visible
                      ? "bg-purple-950/20 border-purple-500/20 text-purple-400"
                      : "bg-zinc-955/40 border-zinc-900 text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <div className={cn("h-2 w-2 rounded-full", w.visible ? "bg-purple-400" : "bg-zinc-700")} />
                  {w.title}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── WIDGET GRID LAYOUT ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {widgetOrder
          .filter((w) => w.visible)
          .map((widget) => {
            const sizeClass = widget.colSpan;

            return (
              <motion.div
                key={widget.id}
                draggable={isCustomizeMode}
                onDragStart={(e: any) => handleDragStart(e, widget.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, widget.id)}
                onDragEnd={handleDragEnd}
                whileHover={!isCustomizeMode ? { y: -4, scale: 1.012 } : undefined}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={cn(
                  "transition-all duration-300 relative",
                  sizeClass,
                  draggedWidgetId === widget.id ? "opacity-30 border-2 border-dashed border-purple-500 rounded-2xl" : ""
                )}
              >
                {/* Drag Handle Overlay when Customizing */}
                {isCustomizeMode && (
                  <div className="absolute top-2 right-2 z-40 flex items-center gap-1 bg-zinc-950/90 border border-zinc-800 px-2 py-1 rounded-lg text-[9px] font-black uppercase text-zinc-400">
                    <button
                      onClick={() => togglePinWidget(widget.id)}
                      className={cn("hover:text-white transition", widget.isPinned ? "text-purple-400" : "")}
                      title="Pin to top"
                    >
                      ★
                    </button>
                    <div className="h-3 w-[1px] bg-zinc-800 mx-1" />
                    {/* Size changer */}
                    <select
                      value={widget.colSpan}
                      onChange={(e) => resizeWidget(widget.id, e.target.value as any)}
                      className="bg-transparent border-none text-zinc-300 font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="col-span-1">1 Col</option>
                      <option value="col-span-2">2 Col</option>
                      <option value="col-span-3">Full</option>
                    </select>
                    <div className="h-3 w-[1px] bg-zinc-800 mx-1" />
                    <button onClick={() => toggleWidgetVisibility(widget.id)} className="text-red-400 hover:text-red-300" title="Hide widget">
                      ✕
                    </button>
                    <div className="h-3 w-[1px] bg-zinc-800 mx-1" />
                    <span className="cursor-grab select-none">☰ DRAG</span>
                  </div>
                )}

                {/* ─── WIDGET CONTENT RENDERING ─── */}

                {/* 0. CONTROL CENTER WIDGET */}
                {widget.id === "control" && (
                  <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#09090b]/40 backdrop-blur-xl min-h-[340px] flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block">EventOS Console</span>
                          <h3 className="text-xs font-extrabold text-zinc-300 mt-0.5">{widget.title}</h3>
                        </div>
                        <span className="text-[9px] font-black text-cyan-400 bg-cyan-950/20 border border-cyan-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Status
                        </span>
                      </div>

                      {/* Toggles Grid */}
                      <div className="grid grid-cols-2 gap-2.5 mt-5">
                        {/* Toggle 1: Dark Mode */}
                        <button
                          onClick={() => { toggleTheme(); }}
                          className={cn(
                            "p-3 rounded-xl border flex flex-col items-start gap-1.5 text-left transition-all duration-200 cursor-pointer select-none",
                            darkMode
                              ? "bg-purple-950/20 border-purple-500/20 text-purple-400"
                              : "bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:text-zinc-300"
                          )}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="text-sm">🌓</span>
                            <div className={cn("h-3 w-6 rounded-full p-0.5 transition-colors duration-200", darkMode ? "bg-purple-500" : "bg-zinc-800")}>
                              <div className={cn("h-2 w-2 rounded-full bg-white transition-transform duration-200", darkMode ? "translate-x-3" : "translate-x-0")} />
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold block">Theme View</span>
                            <span className="text-[8px] text-zinc-500 font-medium">{darkMode ? "Dark Mode" : "Light Mode"}</span>
                          </div>
                        </button>



                        {/* Toggle 2: Live updates */}
                        <button
                          onClick={() => { setLiveUpdates(!liveUpdates); }}
                          className={cn(
                            "p-3 rounded-xl border flex flex-col items-start gap-1.5 text-left transition-all duration-200 cursor-pointer select-none",
                            liveUpdates
                              ? "bg-purple-950/20 border-purple-500/20 text-purple-400"
                              : "bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:text-zinc-300"
                          )}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="text-sm">📡</span>
                            <div className={cn("h-3 w-6 rounded-full p-0.5 transition-colors duration-200", liveUpdates ? "bg-purple-500" : "bg-zinc-800")}>
                              <div className={cn("h-2 w-2 rounded-full bg-white transition-transform duration-200", liveUpdates ? "translate-x-3" : "translate-x-0")} />
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold block">Live Sync</span>
                            <span className="text-[8px] text-zinc-550 font-medium">{liveUpdates ? "WebSockets on" : "Paused"}</span>
                          </div>
                        </button>

                        {/* Toggle 3: Customize Grid */}
                        <button
                          onClick={() => { setIsCustomizeMode(!isCustomizeMode); }}
                          className={cn(
                            "p-3 rounded-xl border flex flex-col items-start gap-1.5 text-left transition-all duration-200 cursor-pointer select-none",
                            isCustomizeMode
                              ? "bg-purple-950/20 border-purple-500/20 text-purple-400"
                              : "bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:text-zinc-300"
                          )}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="text-sm">🛠️</span>
                            <div className={cn("h-3 w-6 rounded-full p-0.5 transition-colors duration-200", isCustomizeMode ? "bg-purple-500" : "bg-zinc-800")}>
                              <div className={cn("h-2 w-2 rounded-full bg-white transition-transform duration-200", isCustomizeMode ? "translate-x-3" : "translate-x-0")} />
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold block">Grid Design</span>
                            <span className="text-[8px] text-zinc-500 font-medium">{isCustomizeMode ? "Customizing" : "Locked"}</span>
                          </div>
                        </button>

                        {/* Action 4: Sync Data */}
                        <button
                          onClick={async () => {
                            await refetchDashboard();
                            addToast("Dashboard synced with server", "success");
                          }}
                          className="p-3 rounded-xl border flex flex-col items-start gap-1.5 text-left transition-all duration-200 cursor-pointer select-none bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800"
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="text-sm">🔄</span>
                            <RefreshCw size={11} className="text-zinc-500" />
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold block">Sync Data</span>
                            <span className="text-[8px] text-zinc-500 font-medium">Pull Latest</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Circular Storage indicator at the bottom */}
                    <div className="pt-4 border-t border-zinc-900 flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block">System Space</span>
                        <div className="text-xs font-black text-zinc-350">
                          94.2 GB <span className="text-zinc-555 font-bold">/ 100 GB</span>
                        </div>
                      </div>

                      {/* Mini circular progress indicator */}
                      <div className="relative h-11 w-11 flex items-center justify-center shrink-0">
                        <svg className="w-11 h-11 transform -rotate-90">
                          <circle cx="22" cy="22" r="18" stroke="#1c1c1f" strokeWidth="2.5" fill="transparent" />
                          <circle
                            cx="22"
                            cy="22"
                            r="18"
                            stroke="#ec4899"
                            strokeWidth="2.5"
                            fill="transparent"
                            strokeDasharray={113}
                            strokeDashoffset={113 * (1 - 0.942)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute font-mono text-[8px] font-black text-white">94%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 1. HEALTH SCORE WIDGET */}
                {widget.id === "health" && (
                  <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#09090b]/40 backdrop-blur-xl min-h-[340px] flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-zinc-555 uppercase font-black tracking-widest block">SaaS Health compliance</span>
                          <h3 className="text-xs font-extrabold text-zinc-300 mt-0.5">{widget.title}</h3>
                        </div>
                        <span className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border", healthLabel.color)}>
                          {healthLabel.text}
                        </span>
                      </div>

                      <div className="flex items-center justify-around py-6 select-none">
                        <div
                          className="relative flex items-center justify-center cursor-pointer transform hover:scale-105 transition-all duration-300"
                          onClick={() => setIsHealthDetailOpen(true)}
                          title="Click to view health metrics breakdown panel"
                        >
                          <svg className="w-32 h-32 transform -rotate-90">
                            <circle cx="64" cy="64" r="56" stroke="#1c1c1f" strokeWidth="7" fill="transparent" />
                            <circle
                              cx="64"
                              cy="64"
                              r="56"
                              stroke="url(#healthGrad)"
                              strokeWidth="7"
                              fill="transparent"
                              strokeDasharray={351.8}
                              strokeDashoffset={351.8 * (1 - overallHealthScore / 100)}
                              strokeLinecap="round"
                              className="transition-all duration-1000"
                            />
                            <defs>
                              <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#c084fc" />
                                <stop offset="50%" stopColor="#8b5cf6" />
                                <stop offset="100%" stopColor="#38bdf8" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute text-center">
                            <span className="font-mono text-3xl font-black text-white">
                              <AnimatedNumber value={overallHealthScore} />
                            </span>
                            <span className="text-[9px] text-zinc-500 block font-bold mt-0.5">HEALTH INDEX</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold">
                        This score aggregates CRM pipelines, CSAT audits, storage quotas, and overdue collections.
                      </p>
                      <button
                        onClick={() => setIsHealthDetailOpen(true)}
                        className="w-full py-2 bg-purple-900/10 hover:bg-purple-900/20 border border-purple-500/20 rounded-xl text-[10.5px] font-bold text-purple-400 transition cursor-pointer text-center"
                      >
                        Adjust Variables & View Details
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. TODAY'S FOCUS PRIORITY CHECKS */}
                {widget.id === "priority" && (
                  <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#09090b]/40 backdrop-blur-xl min-h-[340px] flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-zinc-555 uppercase font-black tracking-widest block">AI-ranked Action Queue</span>
                          <h3 className="text-xs font-extrabold text-zinc-300 mt-0.5">{widget.title}</h3>
                        </div>
                        <span className="text-[9px] font-black text-purple-400 bg-purple-950/20 border border-purple-900/30 px-2.5 py-0.5 rounded-full">
                          AI Smart Ranker Active
                        </span>
                      </div>

                      <div className="space-y-2">
                        {priorityTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-start justify-between p-3 border border-zinc-850 bg-zinc-955/25 hover:bg-zinc-900/20 hover:border-zinc-800 rounded-xl transition duration-200"
                          >
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => handleTogglePriority(task.id)}
                                className="h-4.5 w-4.5 rounded border border-zinc-800 hover:border-purple-500 hover:bg-purple-500/10 flex items-center justify-center mt-0.5 shrink-0 transition-all cursor-pointer"
                              >
                                <Check size={11} className="text-transparent hover:text-purple-400" />
                              </button>
                              <div className="space-y-0.5">
                                <p className="text-xs font-semibold text-zinc-200 leading-snug">{task.text}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded border bg-zinc-950 border-zinc-855 font-mono text-zinc-500">
                                    {task.type}
                                  </span>
                                  <span className="text-[8px] text-red-400/90 font-bold">Risk Index: {task.weight}%</span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                addToast(`Executing: ${task.actionText}`, "info");
                                if (task.type === "INVOICE") setIsQuickActionOpen("invoice");
                                else if (task.type === "EVENT" || task.type === "STAFF") setIsQuickActionOpen("booking");
                                else if (task.type === "LEADS") setIsQuickActionOpen("lead");
                              }}
                              className="text-[9.5px] font-extrabold text-purple-400 hover:text-white uppercase tracking-wider flex items-center gap-0.5 shrink-0 cursor-pointer pl-2 self-center"
                            >
                              {task.actionText} <ChevronRight size={10} />
                            </button>
                          </div>
                        ))}

                        {priorityTasks.length === 0 && (
                          <div className="p-8 text-center border border-dashed border-zinc-850 rounded-xl space-y-2">
                            <CheckCircle2 size={24} className="mx-auto text-emerald-500" />
                            <p className="text-xs text-zinc-400 font-bold">Zero items in Priority queue.</p>
                            <p className="text-[10px] text-zinc-555">Your workspace is completely optimized today.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. AI BUSINESS ADVISOR */}
                {widget.id === "advisor" && (
                  <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#09090b]/40 backdrop-blur-xl min-h-[340px] flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-zinc-555 uppercase font-black tracking-widest block">EventOS Copilot</span>
                          <h3 className="text-xs font-extrabold text-zinc-300 mt-0.5">{widget.title}</h3>
                        </div>
                        <Sparkles size={14} className="text-purple-400 animate-pulse" />
                      </div>

                      <div className="space-y-2.5">
                        {aiInsights.map((insight) => (
                          <div
                            key={insight.id}
                            className="p-3 border border-purple-950/20 bg-purple-550/[0.01] rounded-xl space-y-1.5 hover:border-purple-900/35 transition"
                          >
                            <div className="flex items-center gap-1 text-[9px] font-black text-purple-455 uppercase tracking-widest">
                              <Sparkle size={9} />
                              <span>{insight.tag} Recommendation</span>
                            </div>
                            <p className="text-xs text-zinc-300 leading-relaxed font-semibold">{insight.text}</p>
                            <div className="flex justify-between items-center pt-1 border-t border-zinc-900">
                              <span className="text-[8px] text-zinc-555 font-mono">Confidence: 98%</span>
                              <button
                                onClick={() => {
                                  addToast(`Action Accepted: ${insight.action}`, "success");
                                  if (insight.action === "Optimize Roster") setIsQuickActionOpen("invite");
                                  else if (insight.action === "Edit Packages") router.push("/developer");
                                  else if (insight.action === "Generate Invoices") setIsQuickActionOpen("invoice");
                                  else if (insight.action === "Invite Member") setIsQuickActionOpen("invite");
                                }}
                                className="text-[9px] font-black text-purple-400 hover:text-white uppercase tracking-wider cursor-pointer"
                              >
                                {insight.action}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. KPI CARDS (FULL WIDTH GRID INCLUDED IN A SINGLE WIDGET) */}
                {widget.id === "kpi" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[
                      { title: "Total Revenue Collections", value: kpiMetrics.revenue, prefix: "₹", suffix: "", trend: kpiMetrics.growthPercent, points: [410, 530, 480, 690, 820, kpiMetrics.revenue / 1000], isPos: true, comparison: "vs last month", icon: DollarSign, color: "from-purple-500 to-pink-500" },
                      { title: "Outstanding Collections", value: kpiMetrics.outstanding, prefix: "₹", suffix: "", trend: -8.2, points: [180, 172, 160, 155, 150, kpiMetrics.outstanding / 1000], isPos: false, comparison: "vs last month", icon: Clock, color: "from-amber-500 to-red-500" },
                      { title: "Net Operating Profit", value: kpiMetrics.profit, prefix: "₹", suffix: "", trend: 21.1, points: [280, 310, 290, 480, 510, kpiMetrics.profit / 1000], isPos: true, comparison: "vs last month", icon: Trophy, color: "from-emerald-500 to-teal-500" },
                      { title: "Total Operating Expenses", value: kpiMetrics.expenses, prefix: "₹", suffix: "", trend: 6.5, points: [120, 180, 190, 210, 310, kpiMetrics.expenses / 1000], isPos: false, comparison: "vs last month", icon: TrendingDown, color: "from-red-500 to-orange-500" },
                      { title: "Confirmed Booking Orders", value: kpiMetrics.bookings, prefix: "", suffix: " Orders", trend: 12.5, points: [28, 30, 32, 35, 39, kpiMetrics.bookings], isPos: true, comparison: "vs last month", icon: Bookmark, color: "from-indigo-500 to-purple-500" },
                      { title: "Events Schedule (Month)", value: kpiMetrics.eventsThisMonth, prefix: "", suffix: " Events", trend: 5.8, points: [12, 14, 13, 15, 16, kpiMetrics.eventsThisMonth], isPos: true, comparison: "vs last month", icon: Calendar, color: "from-cyan-500 to-blue-500" },
                      { title: "CRM Workspace Leads", value: kpiMetrics.leads, prefix: "", suffix: " Inquiries", trend: 24.1, points: [120, 135, 142, 154, 168, kpiMetrics.leads], isPos: true, comparison: "vs last month", icon: Users, color: "from-blue-500 to-cyan-500" },
                      { title: "Conversion Ratio Rate", value: kpiMetrics.conversionRate, prefix: "", suffix: "%", trend: 3.2, points: [28, 30, 31, 32, 33, kpiMetrics.conversionRate], isPos: true, comparison: "vs last month", icon: TrendingUp, color: "from-purple-500 to-pink-500" },
                      { title: "Generated Ledger Invoices", value: kpiMetrics.invoices, prefix: "", suffix: " Bills", trend: 15.0, points: [55, 62, 70, 78, 82, kpiMetrics.invoices], isPos: true, comparison: "vs last month", icon: FileSpreadsheet, color: "from-pink-500 to-rose-500" },
                      { title: "Payments Cleared", value: kpiMetrics.paymentsCleared, prefix: "", suffix: " Transactions", trend: 20.0, points: [42, 48, 52, 60, 68, kpiMetrics.paymentsCleared], isPos: true, comparison: "vs last month", icon: CheckCircle2, color: "from-emerald-500 to-green-500" },
                      { title: "Media Album Deliveries", value: kpiMetrics.deliveries, prefix: "", suffix: " Albums", trend: 11.2, points: [18, 20, 22, 25, 28, kpiMetrics.deliveries], isPos: true, comparison: "vs last month", icon: ImageIcon, color: "from-teal-500 to-emerald-500" },
                      { title: "Client NPS Rating Score", value: kpiMetrics.csat, prefix: "", suffix: "%", trend: 0.5, points: [95, 96, 97, 97, 98, kpiMetrics.csat], isPos: true, comparison: "vs last month", icon: Smile, color: "from-purple-500 to-indigo-500" },
                    ].map((kpi) => {
                      const Icon = kpi.icon;
                      const trendIsPositive = kpi.isPos;

                      return (
                        <div
                          key={kpi.title}
                          className="group relative p-5 rounded-2xl border border-zinc-850 bg-[#121214]/30 hover:border-zinc-700 min-h-[145px] hover:shadow-[0_0_30px_rgba(139,92,246,0.02)] transition-all duration-300 select-none cursor-pointer overflow-hidden"
                        >
                          <div className={cn("absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br opacity-5 blur-[40px] rounded-full group-hover:opacity-10 transition-opacity", kpi.color)} />

                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <span className="text-[9.5px] font-bold text-zinc-555 uppercase tracking-widest block leading-none">{kpi.title}</span>
                              <p className="text-2xl font-black tracking-tight text-zinc-150 group-hover:text-white transition-colors mt-1 font-mono">
                                <AnimatedNumber value={kpi.value} prefix={kpi.prefix} suffix={kpi.suffix} />
                              </p>
                            </div>
                            <div className={cn("h-7 w-7 rounded-lg bg-gradient-to-tr flex items-center justify-center text-white shadow-md shadow-black/40", kpi.color)}>
                              <Icon size={12} className="text-zinc-100" />
                            </div>
                          </div>

                          <div className="flex justify-between items-end pt-4 border-t border-zinc-900 mt-3">
                            <div className="space-y-0.5">
                              <div className={cn("flex items-center gap-1 text-[10.5px] font-bold", trendIsPositive ? "text-emerald-500" : "text-red-500")}>
                                {trendIsPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                <span>{trendIsPositive ? "+" : ""}{kpi.trend}%</span>
                                <span className="text-zinc-555 font-normal text-[9px] lowercase leading-none">{kpi.comparison}</span>
                              </div>
                            </div>
                            <Sparkline data={kpi.points} isPositive={trendIsPositive} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 5. SALES ANALYTICS FUNNEL */}
                {widget.id === "sales" && (
                  <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#09090b]/40 backdrop-blur-xl min-h-[380px] flex flex-col justify-between">
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-zinc-555 uppercase font-black tracking-widest block">CRM Leads Funnel</span>
                        <h3 className="text-xs font-extrabold text-zinc-300 mt-0.5">{widget.title}</h3>
                      </div>

                      {/* Visual Funnel */}
                      <div className="space-y-2 font-semibold">
                        {[
                          { stage: "Leads Inbound", count: salesFunnel.leads, width: "w-full", color: "bg-purple-500/20 text-purple-300 border-purple-500/10", percent: "100%" },
                          { stage: "Qualified Sales", count: salesFunnel.qualified, width: "w-[85%]", color: "bg-purple-500/30 text-purple-200 border-purple-500/15", percent: "71.7%" },
                          { stage: "Quote Proposal", count: salesFunnel.proposal, width: "w-[70%]", color: "bg-purple-500/40 text-purple-100 border-purple-500/20", percent: "48.3%" },
                          { stage: "Negotiations", count: salesFunnel.negotiation, width: "w-[50%]", color: "bg-purple-650 text-white border-purple-500/25", percent: "29.3%" },
                          { stage: "Closed Won", count: salesFunnel.won, width: "w-[30%]", color: "bg-emerald-650 text-white border-emerald-500/20", percent: "22.8%" },
                        ].map((item) => (
                          <div key={item.stage} className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-extrabold text-zinc-400">
                              <span>{item.stage}</span>
                              <span className="font-mono text-zinc-200">{item.count} ({item.percent})</span>
                            </div>
                            <div className="h-6 w-full bg-zinc-950/40 rounded-lg overflow-hidden border border-zinc-900">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: item.percent }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={cn("h-full border flex items-center px-2 text-[9px] font-black uppercase font-mono tracking-wider", item.color)}
                              >
                                {item.percent}
                              </motion.div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-900 grid grid-cols-2 gap-2 text-center text-[10px] font-bold text-zinc-400">
                      <div className="p-2 bg-zinc-950/20 rounded-lg border border-zinc-900">
                        <span className="text-[8px] text-zinc-555 uppercase block">Avg Deal Size</span>
                        <span className="text-zinc-200 font-mono">₹1,24,000</span>
                      </div>
                      <div className="p-2 bg-zinc-950/20 rounded-lg border border-zinc-900">
                        <span className="text-[8px] text-zinc-555 uppercase block">Acceptance Ratio</span>
                        <span className="text-zinc-200 font-mono">76.8%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. FINANCE DASHBOARD FLOW */}
                {widget.id === "finance" && (
                  <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#09090b]/40 backdrop-blur-xl min-h-[380px] flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] text-zinc-555 uppercase font-black tracking-widest block">Ledger ledger details</span>
                          <h3 className="text-xs font-extrabold text-zinc-300 mt-0.5">{widget.title}</h3>
                        </div>
                        <div className="flex bg-zinc-955 border border-zinc-850 p-0.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider">
                          {[
                            { key: "revenue", label: "Collections" },
                            { key: "bookings", label: "Expenses" },
                            { key: "forecast", label: "Q3 Forecast" },
                          ].map((t) => (
                            <button
                              key={t.key}
                              onClick={() => setActiveChartTab(t.key as any)}
                              className={cn(
                                "px-2.5 py-1 rounded transition-all cursor-pointer font-bold",
                                activeChartTab === t.key ? "bg-zinc-850 text-purple-400 border border-purple-500/10" : "text-zinc-500 hover:text-zinc-355"
                              )}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Area Chart */}
                      <div className="h-56 w-full select-none">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={mockRechartsRevenue} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                            <defs>
                              <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="pinkGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#ffffff05" strokeDasharray="0" vertical={false} />
                            <XAxis dataKey="month" stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis
                              stroke="#52525b"
                              fontSize={9}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(v) => `₹${v / 1000}k`}
                              tickMargin={8}
                            />
                            <Tooltip
                              contentStyle={{ backgroundColor: "rgba(9, 9, 11, 0.6)", borderColor: "rgba(255, 255, 255, 0.08)", borderRadius: "12px", backdropFilter: "blur(12px)" }}
                              labelStyle={{ color: "#71717a", fontSize: "9px", fontWeight: "bold" }}
                              itemStyle={{ color: "#e4e4e7", fontSize: "11px", fontWeight: "bold" }}
                              formatter={(v: number) => [`₹${v.toLocaleString()}`, activeChartTab.toUpperCase()]}
                            />
                            <Area
                              type="monotone"
                              dataKey={activeChartTab === "revenue" ? "revenue" : activeChartTab === "bookings" ? "expenses" : "forecast"}
                              stroke={activeChartTab === "revenue" ? "#8b5cf6" : activeChartTab === "bookings" ? "#ec4899" : "#06b6d4"}
                              strokeWidth={2.5}
                              fillOpacity={1}
                              fill={`url(${activeChartTab === "revenue" ? "#purpleGrad" : activeChartTab === "bookings" ? "#pinkGrad" : "#cyanGrad"})`}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-900 flex justify-between items-center text-[10px] font-bold text-zinc-500">
                      <span>Operating Cost Index: <strong className="text-zinc-200">₹3,84,000</strong></span>
                      <span>Total Unbilled Assets: <strong className="text-purple-400">₹94,000</strong></span>
                    </div>
                  </div>
                )}

                {/* 7. EVENT & PACKAGE TRACKER */}
                {widget.id === "events" && (
                  <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#09090b]/40 backdrop-blur-xl min-h-[380px] flex flex-col justify-between">
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-zinc-555 uppercase font-black tracking-widest block">Operational Metrics</span>
                        <h3 className="text-xs font-extrabold text-zinc-300 mt-0.5">{widget.title}</h3>
                      </div>

                      {/* Event Package Popularity */}
                      <div className="space-y-3 font-semibold text-xs">
                        {packageBreakdown.map((pkg) => (
                          <div key={pkg.name} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-zinc-300">{pkg.name}</span>
                              <span className="font-mono text-zinc-200">{pkg.value}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pkg.value}%` }}
                                transition={{ duration: 1 }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: pkg.color }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-900 space-y-2 text-[10px] font-bold text-zinc-400">
                      <div className="flex justify-between">
                        <span>Average Event Budget:</span>
                        <span className="text-zinc-200 font-mono">₹2,80,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Most Profitable Package:</span>
                        <span className="text-purple-450">Premium Wedding Gala</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Corporate Volume Growth:</span>
                        <span className="text-red-400">-8.5% (Alert)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. TEAM PERFORMANCE & BURNOUT */}
                {widget.id === "team" && (
                  <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#09090b]/40 backdrop-blur-xl min-h-[380px] flex flex-col justify-between">
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-zinc-555 uppercase font-black tracking-widest block">Resource roster metrics</span>
                        <h3 className="text-xs font-extrabold text-zinc-300 mt-0.5">{widget.title}</h3>
                      </div>

                      <div className="space-y-2.5">
                        {teamPerformance.map((member) => {
                          const isOverload = member.workload >= 85;
                          return (
                            <div key={member.name} className="p-3 border border-zinc-850 bg-zinc-950/20 rounded-xl space-y-2">
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <div className="flex items-center gap-2">
                                  <div className="relative">
                                    <div className="h-7 w-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-extrabold text-[10px] text-purple-400 font-mono">
                                      {member.name.split(" ").map((n) => n[0]).join("")}
                                    </div>
                                    <span
                                      className={cn(
                                        "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-black",
                                        member.status === "ONLINE" ? "bg-emerald-500 animate-pulse" : member.status === "IDLE" ? "bg-amber-500" : "bg-zinc-650"
                                      )}
                                    />
                                  </div>
                                  <div>
                                    <span className="text-zinc-200 block">{member.name}</span>
                                    <span className="text-[8.5px] text-zinc-555 block leading-none">Resp: {member.responseTime}m • CSAT: {member.csat}%</span>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <span className={cn("text-[9px] font-black uppercase font-mono px-2 py-0.5 rounded-full border",
                                    isOverload ? "bg-red-950/40 text-red-400 border-red-900/30" : "bg-emerald-950/40 text-emerald-455 border-emerald-900/30"
                                  )}>
                                    {member.workload}% Load
                                  </span>
                                </div>
                              </div>

                              {isOverload && (
                                <div className="flex items-center gap-1.5 text-[9px] text-red-400/90 font-black uppercase tracking-wider pl-1 animate-pulse">
                                  <Flame size={10} />
                                  <span>High Burnout Risk - Limit scheduling tasks</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 9. CLIENT INSIGHTS & NPS */}
                {widget.id === "clients" && (
                  <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#09090b]/40 backdrop-blur-xl min-h-[380px] flex flex-col justify-between">
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-zinc-555 uppercase font-black tracking-widest block">Client Satisfaction Index</span>
                        <h3 className="text-xs font-extrabold text-zinc-300 mt-0.5">{widget.title}</h3>
                      </div>

                      {/* NPS Gauge */}
                      <div className="flex flex-col items-center justify-center space-y-2 select-none py-2">
                        <div className="relative flex items-center justify-center">
                          <svg className="w-24 h-24 transform -rotate-90">
                            <circle cx="48" cy="48" r="40" stroke="#1c1c1f" strokeWidth="6.5" fill="transparent" />
                            <circle
                              cx="48"
                              cy="48"
                              r="40"
                              stroke="#8b5cf6"
                              strokeWidth="6.5"
                              fill="transparent"
                              strokeDasharray={251.2}
                              strokeDashoffset={251.2 * (1 - 0.78)}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute text-center">
                            <span className="font-mono text-xl font-black text-white">+78</span>
                            <span className="text-[8px] text-purple-400 block font-black uppercase">NPS Score</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-[10.5px] font-semibold text-zinc-300">
                        <div className="flex justify-between">
                          <span>Returning Client Rate:</span>
                          <span className="text-emerald-455 font-mono">24.6%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average Client Lifetime Value (LTV):</span>
                          <span className="text-zinc-200 font-mono">₹4,20,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Inactive Clients (30d):</span>
                          <span className="text-amber-500 font-mono">14 Clients</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 10. MEDIA STORAGE ANALYTICS */}
                {widget.id === "media" && (
                  <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#09090b]/40 backdrop-blur-xl min-h-[380px] flex flex-col justify-between">
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-zinc-555 uppercase font-black tracking-widest block">Photo Album Resources</span>
                        <h3 className="text-xs font-extrabold text-zinc-300 mt-0.5">{widget.title}</h3>
                      </div>

                      <div className="space-y-3">
                        {/* Storage quota */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-zinc-400">Disk Quota Utilization</span>
                            <span className="text-red-400 font-mono">94.2 GB / 100 GB</span>
                          </div>
                          <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: "94.2%" }}
                              transition={{ duration: 1 }}
                              className="h-full bg-gradient-to-r from-purple-500 to-red-500 rounded-full"
                            />
                          </div>
                        </div>

                        {/* Storage stats */}
                        <div className="space-y-2 text-[10.5px] font-semibold text-zinc-300">
                          <div className="flex justify-between">
                            <span>Albums Created (Total):</span>
                            <span className="text-zinc-200">142 Albums</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Client Downloads (Month):</span>
                            <span className="text-zinc-200">1,824 Downloads</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Share Link Clicks (Month):</span>
                            <span className="text-purple-400">8,924 Clicks</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        addToast("Initiating secure storage optimization scripts...", "info");
                        router.push("/gallery");
                      }}
                      className="w-full py-2 bg-zinc-950 border border-zinc-850 hover:border-zinc-700 text-[10.5px] font-bold text-zinc-400 hover:text-white rounded-xl transition cursor-pointer text-center"
                    >
                      Manage Media & Clear Cache
                    </button>
                  </div>
                )}

                {/* 11. WORKSPACE TIMELINE LOGS */}
                {widget.id === "activity" && (
                  <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#09090b]/40 backdrop-blur-xl min-h-[380px] flex flex-col justify-between">
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-zinc-555 uppercase font-black tracking-widest block">Audit Security Logs</span>
                        <h3 className="text-xs font-extrabold text-zinc-300 mt-0.5">{widget.title}</h3>
                      </div>

                      <div className="relative pl-3.5 border-l border-zinc-855 space-y-4 py-1">
                        {timelineActivity.map((log) => (
                          <div key={log.id} className="relative text-[11px] font-semibold">
                            {/* Dot */}
                            <span className="absolute -left-[20px] top-1.5 h-1.5 w-1.5 rounded-full bg-purple-550 ring-4 ring-[#08080a]" />
                            <div>
                              <p className="text-zinc-250 leading-snug">{log.message}</p>
                              <span className="text-[8.5px] text-zinc-555 pt-0.5 block">{log.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 12. CORPORATE GOALS PROGRESS */}
                {widget.id === "goals" && (
                  <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#09090b]/40 backdrop-blur-xl min-h-[380px] flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-zinc-555 uppercase font-black tracking-widest block">Corporate goals target</span>
                          <h3 className="text-xs font-extrabold text-zinc-300 mt-0.5">{widget.title}</h3>
                        </div>
                        <button
                          onClick={triggerConfettiAnimation}
                          className="p-1 bg-purple-900/20 hover:bg-purple-900/30 text-purple-400 border border-purple-500/20 rounded-lg hover:text-white transition cursor-pointer"
                          title="Simulate milestone achievement celebration"
                        >
                          🎉
                        </button>
                      </div>

                      <div className="space-y-3.5">
                        {Object.entries(workspaceGoals).map(([key, goal]) => {
                          const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
                          return (
                            <div key={key} className="space-y-1.5 font-semibold text-xs">
                              <div className="flex justify-between items-center">
                                <span className="text-zinc-400">{goal.label}</span>
                                <span className="font-mono text-zinc-250">
                                  {key === "revenue" ? `₹${(goal.current / 1000).toFixed(0)}k / ₹${(goal.target / 1000).toFixed(0)}k` : `${goal.current} / ${goal.target}`}
                                  <strong className="text-purple-455 ml-1.5">({percent}%)</strong>
                                </span>
                              </div>
                              <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percent}%` }}
                                  transition={{ duration: 1 }}
                                  className="h-full bg-gradient-to-r from-purple-550 to-indigo-500 rounded-full animate-pulse"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 13. PREDICTIVE BUSINESS GROWTH */}
                {widget.id === "forecasting" && (
                  <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#09090b]/40 backdrop-blur-xl min-h-[380px] flex flex-col justify-between">
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-zinc-555 uppercase font-black tracking-widest block">AI Business Forecasting</span>
                        <h3 className="text-xs font-extrabold text-zinc-300 mt-0.5">{widget.title}</h3>
                      </div>

                      {/* Line chart mapping predictions */}
                      <div className="h-56 w-full select-none">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={mockRechartsRevenue} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                            <CartesianGrid stroke="#ffffff05" strokeDasharray="0" vertical={false} />
                            <XAxis dataKey="month" stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis
                              stroke="#52525b"
                              fontSize={9}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(v) => `₹${v / 1000}k`}
                              tickMargin={8}
                            />
                            <Tooltip
                              contentStyle={{ backgroundColor: "rgba(9, 9, 11, 0.6)", borderColor: "rgba(255, 255, 255, 0.08)", borderRadius: "12px", backdropFilter: "blur(12px)" }}
                              labelStyle={{ color: "#71717a", fontSize: "9px", fontWeight: "bold" }}
                              itemStyle={{ color: "#e4e4e7", fontSize: "11px", fontWeight: "bold" }}
                              formatter={(v: number) => [`₹${v.toLocaleString()}`, "Predicted Inflow"]}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "10px", fontWeight: "bold", color: "#e4e4e7" }} />
                            <Line
                              type="monotone"
                              name="Predicted Cash Inflow"
                              dataKey="forecast"
                              stroke="#c084fc"
                              strokeWidth={2.5}
                              dot={{ r: 3, stroke: "#c084fc", strokeWidth: 1.5, fill: "#09090b" }}
                            />
                            <Line
                              type="monotone"
                              name="Actual Cleared Cash"
                              dataKey="revenue"
                              stroke="#10b981"
                              strokeWidth={2}
                              dot={{ r: 3, stroke: "#10b981", strokeWidth: 1.5, fill: "#09090b" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-900 flex justify-between items-center text-[10px] font-bold text-zinc-555">
                      <span>Staff Shortage Warning: <strong className="text-red-400">Nov/Dec Wedding Season</strong></span>
                      <span>Storage Full Projection: <strong className="text-amber-500">24 Days</strong></span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
      </div>

      {/* ─── MODAL: WORKSPACE HEALTH VARIABLES DECAY BREAKDOWN ─── */}
      <AnimatePresence>
        {isHealthDetailOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHealthDetailOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-lg bg-[#0c0c0e]/95 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-5 z-50 text-xs text-zinc-300 select-none"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    <SlidersHorizontal size={14} className="text-purple-450" />
                    Interactive Workspace Health Score Panel
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Drag sliders to simulate changes in business variables on EventOS score indexes.</p>
                </div>
                <button
                  onClick={() => setIsHealthDetailOpen(false)}
                  className="p-1 hover:bg-zinc-850 rounded-lg text-zinc-500 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              {/* Sliders Grid */}
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {Object.entries(healthScores).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-extrabold text-zinc-400">
                      <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                      <span className="font-mono text-purple-400">{value}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={value}
                      onChange={(e) => setHealthScores((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                      className="w-full h-1 bg-zinc-900 border border-zinc-850 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-zinc-850 flex justify-between items-center">
                <div>
                  <span className="text-[9px] uppercase block text-zinc-555 font-bold">Simulated Score</span>
                  <span className="text-xl font-mono font-black text-white">{overallHealthScore}%</span>
                </div>
                <button
                  onClick={() => {
                    setHealthScores({
                      revenueGrowth: 95,
                      leadConversion: 88,
                      upcomingDeadlines: 92,
                      outstandingPayments: 84,
                      overdueTasks: 90,
                      customerSatisfaction: 98,
                      galleryCompletion: 95,
                      teamWorkload: 82,
                      aiUsage: 94,
                      workspaceActivity: 97,
                    });
                    addToast("Workspace Health indexes restored to baseline", "info");
                  }}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-300 hover:text-white rounded-xl transition cursor-pointer"
                >
                  Reset baseline
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL: REPORT GENERATION BUILDER ─── */}
      <AnimatePresence>
        {isReportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReportModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-md bg-[#0c0c0e]/95 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-4 z-50 text-xs text-zinc-300"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    <Download size={14} className="text-purple-450" />
                    Corporate Executive Report Generator
                  </h3>
                  <p className="text-[10px] text-zinc-555 mt-0.5">Generate daily, quarterly, or yearly reports compiled directly for shareholders.</p>
                </div>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-1 hover:bg-zinc-850 rounded-lg text-zinc-500 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Select Report Scope</label>
                  <select className="w-full bg-zinc-950 border border-zinc-850 text-zinc-300 px-3.5 py-2.5 rounded-xl font-semibold focus:outline-none">
                    <option value="daily">Daily Snapshot Summary</option>
                    <option value="weekly">Weekly Operational Review</option>
                    <option value="monthly">Monthly Ledger Analysis</option>
                    <option value="quarterly">Quarterly Corporate Review</option>
                    <option value="yearly">Yearly Business Review</option>
                  </select>
                </div>

                <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl space-y-1.5">
                  <span className="text-[8.5px] uppercase font-black tracking-widest text-zinc-550 block">Files to Include:</span>
                  <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                    <span className="px-2 py-0.5 bg-purple-550/10 border border-purple-550/20 text-purple-400 rounded-full">CRM Funnels</span>
                    <span className="px-2 py-0.5 bg-purple-550/10 border border-purple-550/20 text-purple-400 rounded-full">Ledger Ledger</span>
                    <span className="px-2 py-0.5 bg-purple-550/10 border border-purple-550/20 text-purple-400 rounded-full">CSAT Surveys</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-zinc-850">
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setIsReportModalOpen(false);
                    addToast("Compiling Report PDF... Download initiated.", "success");
                    window.print();
                  }}
                  className="px-4 py-2 bg-purple-650 hover:bg-purple-600 text-white rounded-xl font-bold transition cursor-pointer"
                >
                  Download Executive PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL: SHARE PUBLIC LINK ─── */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-md bg-[#0c0c0e]/95 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-4 z-50 text-xs text-zinc-300"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    <Share2 size={14} className="text-purple-450" />
                    Share Workspace Dashboard
                  </h3>
                  <p className="text-[10px] text-zinc-555 mt-0.5">Generate a secure public access link with granular role parameters.</p>
                </div>
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-1 hover:bg-zinc-850 rounded-lg text-zinc-500 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Access Scope Role</label>
                  <select className="w-full bg-zinc-950 border border-zinc-850 text-zinc-300 px-3.5 py-2.5 rounded-xl font-semibold focus:outline-none">
                    <option value="view_only">Read-Only View (Hides Ledger/Profits)</option>
                    <option value="read_finance">Financial Auditor (Includes Invoices/Finance)</option>
                    <option value="manager_view">Coordinators Overview (Hides Operations margins)</option>
                  </select>
                </div>

                <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl font-mono text-[10.5px] text-zinc-400 break-all select-all select-none">
                  https://eventos.agency/share/dashboard?token=ex_{user?.id || "92837"}_live
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-zinc-850">
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="px-4 py-2 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-xl font-bold transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setIsShareModalOpen(false);
                    navigator.clipboard.writeText(`https://eventos.agency/share/dashboard?token=ex_${user?.id || "92837"}_live`);
                    addToast("Secure public access link copied to clipboard", "success");
                  }}
                  className="px-4 py-2 bg-purple-650 hover:bg-purple-600 text-white rounded-xl font-bold transition cursor-pointer"
                >
                  Copy Access Link
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODALS: QUICK ACTIONS ─── */}
      <AnimatePresence>
        {isQuickActionOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQuickActionOpen(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Lead Modal */}
            {isQuickActionOpen === "lead" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="relative w-full max-w-sm bg-[#0c0c0e]/95 border border-zinc-800 rounded-2xl p-6 space-y-4 z-50 text-xs text-zinc-300"
              >
                <h3 className="text-sm font-extrabold text-white">Create New Lead Inbound</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleQuickActionSubmit("lead", { name: formData.get("name"), event: formData.get("event") });
                  }}
                  className="space-y-3.5"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400">Client Name</label>
                    <input required name="name" type="text" className="w-full bg-zinc-950 border border-zinc-850 px-3 py-2 rounded-xl text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400">Event Roster Category</label>
                    <input required name="event" type="text" placeholder="e.g. Grand Taj Wedding" className="w-full bg-zinc-950 border border-zinc-850 px-3 py-2 rounded-xl text-white" />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button type="button" onClick={() => setIsQuickActionOpen(null)} className="px-4 py-2 border border-zinc-850 rounded-xl">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-purple-650 text-white rounded-xl font-bold">Add Lead</button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Booking Modal */}
            {isQuickActionOpen === "booking" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="relative w-full max-w-sm bg-[#0c0c0e]/95 border border-zinc-800 rounded-2xl p-6 space-y-4 z-50 text-xs text-zinc-300"
              >
                <h3 className="text-sm font-extrabold text-white">Confirm Booking Order</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleQuickActionSubmit("booking", { client: formData.get("client"), type: formData.get("type") });
                  }}
                  className="space-y-3.5"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400">Client Partner</label>
                    <input required name="client" type="text" className="w-full bg-zinc-950 border border-zinc-855 px-3 py-2 rounded-xl text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400">Event Type</label>
                    <select required name="type" className="w-full bg-zinc-950 border border-zinc-850 px-3 py-2 rounded-xl text-zinc-350">
                      <option value="Wedding">Wedding Celebration</option>
                      <option value="Corporate">Corporate Summit</option>
                      <option value="Social">Social Private</option>
                    </select>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button type="button" onClick={() => setIsQuickActionOpen(null)} className="px-4 py-2 border border-zinc-850 rounded-xl">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-purple-650 text-white rounded-xl font-bold">Record Booking</button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Invoice Modal */}
            {isQuickActionOpen === "invoice" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="relative w-full max-w-sm bg-[#0c0c0e]/95 border border-zinc-800 rounded-2xl p-6 space-y-4 z-50 text-xs text-zinc-300"
              >
                <h3 className="text-sm font-extrabold text-white">Generate Ledger Invoice</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleQuickActionSubmit("invoice", { id: `#INV-2026-${Math.floor(Math.random() * 800) + 100}`, client: formData.get("client"), amount: formData.get("amount") });
                  }}
                  className="space-y-3.5"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400">Recipient Client</label>
                    <input required name="client" type="text" className="w-full bg-zinc-950 border border-zinc-850 px-3 py-2 rounded-xl text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400">Total Billed Amount (INR)</label>
                    <input required name="amount" type="number" className="w-full bg-zinc-950 border border-zinc-850 px-3 py-2 rounded-xl text-white" />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button type="button" onClick={() => setIsQuickActionOpen(null)} className="px-4 py-2 border border-zinc-850 rounded-xl">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-purple-650 text-white rounded-xl font-bold">Issue Invoice</button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Invite Modal */}
            {isQuickActionOpen === "invite" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="relative w-full max-w-sm bg-[#0c0c0e]/95 border border-zinc-800 rounded-2xl p-6 space-y-4 z-50 text-xs text-zinc-300"
              >
                <h3 className="text-sm font-extrabold text-white">Invite Roster Team Member</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleQuickActionSubmit("invite", { name: formData.get("name"), email: formData.get("email") });
                  }}
                  className="space-y-3.5"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400">Full Name</label>
                    <input required name="name" type="text" className="w-full bg-zinc-950 border border-zinc-850 px-3 py-2 rounded-xl text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400">Email Address</label>
                    <input required name="email" type="email" className="w-full bg-zinc-950 border border-zinc-855 px-3 py-2 rounded-xl text-white" />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button type="button" onClick={() => setIsQuickActionOpen(null)} className="px-4 py-2 border border-zinc-850 rounded-xl">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-purple-650 text-white rounded-xl font-bold">Send Roster Invitation</button>
                  </div>
                </form>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
