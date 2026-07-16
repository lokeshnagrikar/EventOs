"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Activity,
  Server,
  Shield,
  Users,
  Calendar,
  Image,
  Database,
  Zap,
  Layers,
  Cloud,
  Globe,
  DollarSign,
  Mail,
  Send,
  MessageSquare,
  Volume2,
  Lock,
  PlusCircle,
  Sliders,
  Settings,
  HelpCircle,
  AlertOctagon,
  RefreshCw,
  Search,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageShell from "@/components/ui/PageShell";
import { useToastStore } from "@/lib/toastStore";
import { useAuthStore } from "@/store/authStore";

// Uptime mock days (90 bars)
const UPTIME_BARS = Array.from({ length: 45 }, (_, i) => {
  // Simulate occasional minor outages
  if (i === 12) return "warning";
  if (i === 34) return "offline";
  return "healthy";
});

const DEFAULT_SERVICES = [
  { id: "api", name: "API Gateway", desc: "Main public entrypoint router", status: "healthy" },
  { id: "auth", name: "Authentication Service", desc: "SaaS signup & 2FA credentials", status: "healthy" },
  { id: "crm", name: "CRM Module", desc: "Leads database & pipeline boards", status: "healthy" },
  { id: "events", name: "Event Service", desc: "Timelines & schedules planners", status: "healthy" },
  { id: "bookings", name: "Bookings Engine", desc: "Client contract appointments", status: "healthy" },
  { id: "gallery", name: "Gallery Service", desc: "Photo proofing lock downloads", status: "healthy" },
  { id: "cloudinary", name: "Cloudinary CDN", desc: "Media asset delivery networks", status: "healthy" },
  { id: "stripe", name: "Stripe Payment", desc: "Invoices retainer billing", status: "healthy" },
  { id: "smtp", name: "SMTP Mailer", desc: "System transactional email dispatcher", status: "healthy" },
  { id: "redis", name: "Redis Cache Clusters", desc: "Session storage state management", status: "healthy" },
  { id: "rabbitmq", name: "RabbitMQ", desc: "Async task communication broker", status: "healthy" },
  { id: "postgres", name: "PostgreSQL Database", desc: "Active workspace relations store", status: "healthy" },
  { id: "ws", name: "WebSocket Gateway", desc: "Real-time client synchronization push", status: "healthy" },
  { id: "notif", name: "Notification Hub", desc: "Slack and SMS integration services", status: "healthy" },
  { id: "analytics", name: "Analytics Processor", desc: "Report charts rendering server", status: "healthy" },
];

const DEFAULT_INCIDENTS = [
  {
    id: "inc-1",
    title: "SMTP Dispatch queue delayed logs",
    status: "Resolved",
    severity: "Degraded",
    affected: ["SMTP Mailer"],
    created: "2026-07-06 14:00",
    updates: [
      { time: "14:00", status: "Investigating", msg: "Noticing SMTP connection errors to AWS SES endpoints." },
      { time: "14:45", status: "Resolved", msg: "Resolved. Rotated expired credentials. All emails dispatched." }
    ],
    postmortem: {
      summary: "SMTP credentials expired causing mail delivery failures.",
      rootCause: "Auto-rotation task failed to commit secret keys to vault.",
      prevention: "Added vault alert thresholds for secret rotations."
    }
  },
  {
    id: "inc-2",
    title: "API Gateway websocket connection threshold limits exceeded",
    status: "Resolved",
    severity: "Partial Outage",
    affected: ["API Gateway", "WebSocket Gateway"],
    created: "2026-07-05 09:30",
    updates: [
      { time: "09:30", status: "Investigating", msg: "Client connections dropping intermittently." },
      { time: "10:15", status: "Resolved", msg: "Increased threshold limit on Vercel API Gateway endpoints." }
    ]
  }
];

export default function ServiceStatusDashboard() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Status Dashboard Mode
  const [viewMode, setViewMode] = useState<"public" | "sre">("public");
  
  // Local Database states
  const [services, setServices] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [maintenances, setMaintenances] = useState<any[]>([
    { id: "maint-1", title: "Redis Cache database cluster upgrade", start: "2026-07-12 04:00", end: "2026-07-12 05:00", affected: ["Redis Cache Clusters"], impact: "Minor read limits latency", countdown: "5 days left" }
  ]);

  // Subscription Modal state
  const [showSubModal, setShowSubModal] = useState(false);
  const [subEmail, setSubEmail] = useState("");

  // Search status history query
  const [historySearch, setHistorySearch] = useState("");

  // Create Incident Form states
  const [incTitle, setIncTitle] = useState("");
  const [incSeverity, setIncSeverity] = useState("Degraded");
  const [incDesc, setIncDesc] = useState("");
  const [incAffected, setIncAffected] = useState<string[]>([]);

  // Create Maintenance Form states
  const [maintTitle, setMaintTitle] = useState("");
  const [maintStart, setMaintStart] = useState("");
  const [maintEnd, setMaintEnd] = useState("");
  const [maintAffected, setMaintAffected] = useState<string[]>([]);

  // Postmortem form states
  const [postTargetId, setPostTargetId] = useState<string | null>(null);
  const [postSummary, setPostSummary] = useState("");
  const [postRootCause, setPostRootCause] = useState("");
  const [postPrevention, setPostPrevention] = useState("");

  useEffect(() => {
    setMounted(true);
    // Hydrate Status Databases from localStorage
    const savedServices = localStorage.getItem("eventos_status_services");
    const savedIncidents = localStorage.getItem("eventos_status_incidents");
    const savedMaint = localStorage.getItem("eventos_status_maint");

    if (savedServices) setServices(JSON.parse(savedServices));
    else {
      setServices(DEFAULT_SERVICES);
      localStorage.setItem("eventos_status_services", JSON.stringify(DEFAULT_SERVICES));
    }

    if (savedIncidents) setIncidents(JSON.parse(savedIncidents));
    else {
      setIncidents(DEFAULT_INCIDENTS);
      localStorage.setItem("eventos_status_incidents", JSON.stringify(DEFAULT_INCIDENTS));
    }

    if (savedMaint) setMaintenances(JSON.parse(savedMaint));
  }, []);

  const saveServicesState = (updated: any[]) => {
    setServices(updated);
    localStorage.setItem("eventos_status_services", JSON.stringify(updated));
  };

  const saveIncidentsState = (updated: any[]) => {
    setIncidents(updated);
    localStorage.setItem("eventos_status_incidents", JSON.stringify(updated));
  };

  const saveMaintState = (updated: any[]) => {
    setMaintenances(updated);
    localStorage.setItem("eventos_status_maint", JSON.stringify(updated));
  };

  // Check overall platform status
  const overallSystemState = useMemo(() => {
    const hasOffline = services.some(s => s.status === "offline");
    const hasWarning = services.some(s => s.status === "warning");
    const activeMaint = maintenances.some(m => m.countdown === "Active Now");

    if (hasOffline) return { label: "Major Outage", color: "text-red-400 border-red-500/20 bg-red-500/5", icon: XCircle };
    if (hasWarning) return { label: "Degraded Performance", color: "text-amber-400 border-amber-500/20 bg-amber-500/5", icon: AlertTriangle };
    if (activeMaint) return { label: "Scheduled Maintenance In Progress", color: "text-blue-400 border-blue-500/20 bg-blue-500/5", icon: Calendar };
    return { label: "All Systems Operational", color: "text-emerald-450 border-emerald-500/20 bg-emerald-500/5", icon: CheckCircle };
  }, [services, maintenances]);

  // Outage simulation trigger (Module 8 WebSocket simulation)
  const handleSimulateOutage = (serviceId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "healthy" ? "offline" : "healthy";
    const updated = services.map(s => s.id === serviceId ? { ...s, status: nextStatus } : s);
    saveServicesState(updated);
    
    // Dynamically auto-create an active incident if offline
    if (nextStatus === "offline") {
      const targetService = services.find(s => s.id === serviceId);
      const autoIncident = {
        id: `inc-${Date.now().toString(36)}`,
        title: `CRITICAL OUTAGE: service connectivity issues on ${targetService.name}`,
        status: "Investigating",
        severity: "Major Outage",
        affected: [targetService.name],
        created: new Date().toISOString().replace("T", " ").substring(0, 16),
        updates: [
          { time: "Just now", status: "Investigating", msg: `WebSocket health check ping failed for ${targetService.name}. SRE team is reviewing root metrics.` }
        ]
      };
      saveIncidentsState([autoIncident, ...incidents]);
      addToast(`💥 WebSockets: Simulated outage broadcasted. ${targetService.name} is Offline.`, "error");
    } else {
      addToast(`🔌 WebSockets: Simulated recovery broadcasted. Service is Operational.`, "success");
    }
  };

  // Create manual incident
  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incTitle.trim() || !incDesc.trim()) return;

    const newInc = {
      id: `inc-${Date.now().toString(36)}`,
      title: incTitle,
      status: "Investigating",
      severity: incSeverity,
      affected: incAffected,
      created: new Date().toISOString().replace("T", " ").substring(0, 16),
      updates: [
        { time: "Just now", status: "Investigating", msg: incDesc }
      ]
    };

    // Update affected services statuses to warning/offline matching severity
    const updatedServices = services.map(s => {
      if (incAffected.includes(s.name)) {
        return { ...s, status: incSeverity === "Major Outage" ? "offline" : "warning" };
      }
      return s;
    });

    saveServicesState(updatedServices);
    saveIncidentsState([newInc, ...incidents]);
    setIncTitle("");
    setIncDesc("");
    setIncAffected([]);
    addToast("Incident created and broadcasted.", "success");
  };

  // Add timeline update log to active incident
  const handleAddTimelineUpdate = (id: string, stepStatus: string, msg: string) => {
    const updated = incidents.map(inc => {
      if (inc.id === id) {
        return {
          ...inc,
          status: stepStatus,
          updates: [...inc.updates, { time: new Date().toLocaleTimeString().substring(0, 5), status: stepStatus, msg }]
        };
      }
      return inc;
    });

    // If resolved, recover service statuses
    if (stepStatus === "Resolved") {
      const targetInc = incidents.find(i => i.id === id);
      const updatedServices = services.map(s => {
        if (targetInc.affected.includes(s.name)) {
          return { ...s, status: "healthy" };
        }
        return s;
      });
      saveServicesState(updatedServices);
    }

    saveIncidentsState(updated);
    addToast(`Incident updated to ${stepStatus}`, "info");
  };

  // Publish postmortem
  const handlePublishPostmortem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTargetId || !postSummary || !postRootCause) return;

    const updated = incidents.map(inc => {
      if (inc.id === postTargetId) {
        return {
          ...inc,
          postmortem: {
            summary: postSummary,
            rootCause: postRootCause,
            prevention: postPrevention
          }
        };
      }
      return inc;
    });

    saveIncidentsState(updated);
    setPostTargetId(null);
    setPostSummary("");
    setPostRootCause("");
    setPostPrevention("");
    addToast("Postmortem published to public status board.", "success");
  };

  // Handle scheduled maintenance creation
  const handleCreateMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintTitle.trim()) return;

    const newMaint = {
      id: `maint-${Date.now().toString(36)}`,
      title: maintTitle,
      start: maintStart || "2026-07-12 04:00",
      end: maintEnd || "2026-07-12 05:00",
      affected: maintAffected,
      impact: "Scheduled database structural schema alignment tasks",
      countdown: "Scheduled"
    };

    saveMaintState([newMaint, ...maintenances]);
    setMaintTitle("");
    setMaintAffected([]);
    addToast("Maintenance window scheduled successfully.", "success");
  };

  // Filter historical incidents based on search
  const filteredHistory = useMemo(() => {
    const query = historySearch.toLowerCase();
    return incidents.filter(inc => 
      inc.title.toLowerCase().includes(query) ||
      inc.affected.some((s: string) => s.toLowerCase().includes(query))
    );
  }, [incidents, historySearch]);

  if (!mounted) return null;

  const OverallIcon = overallSystemState.icon;
  const isAdmin = user?.role === "SUPER_ADMIN";

  return (
    <PageShell
      title="Platform Operations & Status"
      subtitle="Transparent operational monitoring and incident ledger for EventOS core services."
      breadcrumbs={[{ label: "Help Center", href: "/help" }, { label: "System Status" }]}
    >
      <div className="space-y-8 select-none text-zinc-300 max-w-6xl">
        
        {/* TOP HUB CONSOLE SWITCHER */}
        <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
          <div className="flex gap-2 text-xs font-bold">
            <button
              onClick={() => setViewMode("public")}
              className={cn("px-4 py-2 border rounded-xl transition cursor-pointer", viewMode === "public" ? "bg-purple-500/10 text-purple-400 border-purple-500/20 font-black" : "border-transparent text-zinc-550")}
            >
              Public Status Board
            </button>
            {isAdmin && (
              <button
                onClick={() => setViewMode("sre")}
                className={cn("px-4 py-2 border rounded-xl transition cursor-pointer flex items-center gap-1.5", viewMode === "sre" ? "bg-purple-650/10 text-purple-400 border-purple-500/20 font-black" : "border-transparent text-zinc-550")}
              >
                <Shield size={12} /> SRE Incident Desk
              </button>
            )}
          </div>

          {viewMode === "public" && (
            <button
              onClick={() => setShowSubModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-[10px] font-black transition cursor-pointer"
            >
              <Bell size={12} /> Subscribe to Alerts
            </button>
          )}
        </div>

        {/* VIEW MODE 1: PUBLIC STATUS BOARD */}
        {viewMode === "public" && (
          <div className="space-y-8 animate-slide-in">
            
            {/* Overall System Status Header */}
            <div className={cn("flex items-center gap-4 p-6 rounded-2xl border", overallSystemState.color)}>
              <div className="h-10 w-10 rounded-2xl bg-zinc-950/40 flex items-center justify-center">
                <OverallIcon size={20} className="shrink-0" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider">{overallSystemState.label}</h2>
                <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                  Live connection via WebSockets • Checked just now
                </p>
              </div>
            </div>

            {/* Visual Scheduled Maintenances Alerts */}
            {maintenances.length > 0 && (
              <div className="space-y-3">
                <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block font-mono">Scheduled Maintenance Windows</span>
                {maintenances.map((m) => (
                  <div key={m.id} className="p-5 border border-blue-500/20 bg-blue-500/5 rounded-2xl space-y-2 flex gap-4 text-xs font-semibold">
                    <Calendar size={18} className="text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-blue-400">{m.title}</h4>
                      <p className="text-[10.5px] text-zinc-400 mt-0.5 leading-normal">{m.impact}</p>
                      <p className="text-[8.5px] text-zinc-500 font-mono mt-2 font-bold uppercase">
                        Scheduled: {m.start} UTC to {m.end} UTC ({m.countdown})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Active/Investigating Incidents */}
            {incidents.filter(i => i.status !== "Resolved").length > 0 && (
              <div className="space-y-3">
                <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block font-mono">Active Incidents</span>
                {incidents.filter(i => i.status !== "Resolved").map((inc) => (
                  <div key={inc.id} className="p-5 border border-red-500/20 bg-red-500/5 rounded-2xl space-y-3 text-xs font-semibold">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-red-400 flex items-center gap-1.5">
                          <AlertOctagon size={14} /> {inc.title}
                        </h4>
                        <span className="text-[8px] text-zinc-500 uppercase font-mono block mt-1">Severity: {inc.severity} | Affected: {inc.affected.join(", ")}</span>
                      </div>
                      <span className="px-1.5 py-0.5 border border-red-500/30 bg-red-500/10 text-red-400 rounded uppercase font-black text-[8px] font-mono">{inc.status}</span>
                    </div>

                    <div className="relative pl-4 border-l border-red-500/20 space-y-3.5 pt-2">
                      {inc.updates.map((upd: any, idx: number) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[21px] top-1.5 h-1.5 w-1.5 rounded-full bg-red-400" />
                          <p className="text-[10.5px] text-zinc-300 leading-normal font-semibold font-sans">
                            <strong className="text-zinc-500 font-mono text-[9.5px] font-bold block mb-0.5">{upd.time} UTC ({upd.status})</strong>
                            {upd.msg}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Service Health Grid with Uptime charts */}
            <div className="space-y-3">
              <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block font-mono">Service Outage & Uptime Ledger</span>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((srv) => (
                  <div key={srv.id} className="p-4 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-extrabold text-zinc-200">{srv.name}</h4>
                        <span className="text-[8px] text-zinc-550 font-semibold">{srv.desc}</span>
                      </div>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[8px] font-black uppercase font-mono border",
                        srv.status === "healthy" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-455" :
                        "border-red-500/20 bg-red-500/5 text-red-450"
                      )}>
                        {srv.status === "healthy" ? "Operational" : "Offline"}
                      </span>
                    </div>

                    {/* Uptime bar visualization */}
                    <div className="space-y-1">
                      <div className="flex gap-0.5 h-4 items-center">
                        {UPTIME_BARS.map((day, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "flex-1 h-full rounded-sm min-w-[2px]",
                              day === "healthy" ? "bg-emerald-500/30 hover:bg-emerald-500" :
                              day === "warning" ? "bg-amber-500/30 hover:bg-amber-500" : "bg-red-500/30 hover:bg-red-500"
                            )}
                            title={`Day ${45 - idx} ago: ${day}`}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between text-[8px] text-zinc-600 font-bold uppercase tracking-wider font-mono">
                        <span>45 Days Ago</span>
                        <span>99.98% Uptime</span>
                        <span>Today</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Historical Incident log with search */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block font-mono">Historical incident timeline reports</span>
                <div className="relative max-w-xs">
                  <Search className="absolute left-3 top-2 text-zinc-650 size-3" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Filter by service name..."
                    className="pl-8 pr-3 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-[9.5px] outline-none font-bold"
                  />
                </div>
              </div>

              <div className="relative pl-6 border-l border-zinc-900 space-y-6">
                {filteredHistory.filter(i => i.status === "Resolved").map((inc) => (
                  <div key={inc.id} className="relative">
                    <div className="absolute -left-[30.5px] top-1.5 h-2 w-2 rounded-full bg-zinc-800 border border-zinc-950" />
                    <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center text-[9px] font-bold font-mono">
                        <span className="text-zinc-300 font-sans font-extrabold">{inc.title}</span>
                        <span className="text-zinc-600">{inc.created}</span>
                      </div>
                      <p className="text-[10px] text-zinc-450 leading-relaxed font-semibold">
                        Resolved inside {inc.updates[inc.updates.length - 1]?.time} update logs. Affected components: {inc.affected.join(", ")}.
                      </p>

                      {/* Postmortem Section */}
                      {inc.postmortem && (
                        <div className="mt-3 p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2 text-[10px] font-semibold">
                          <h5 className="font-extrabold text-purple-400 uppercase text-[9px] tracking-wider">Root Cause Postmortem Report</h5>
                          <p className="text-zinc-300"><strong className="text-zinc-500">Summary:</strong> {inc.postmortem.summary}</p>
                          <p className="text-zinc-300"><strong className="text-zinc-500">Root Cause:</strong> {inc.postmortem.rootCause}</p>
                          <p className="text-zinc-300"><strong className="text-zinc-500">Prevention Measures:</strong> {inc.postmortem.prevention}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* VIEW MODE 2: SRE INTERNAL CONSOLE */}
        {viewMode === "sre" && isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-in text-xs font-semibold">
            
            {/* Left Column: Outage Simulator panel & Schedule Maintenance */}
            <div className="space-y-6">
              
              {/* WebSockets Simulation Toggles */}
              <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
                <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block font-mono">WS Platform Outage Simulator</span>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin font-mono text-[10px]">
                  {services.map((srv) => (
                    <div key={srv.id} className="flex justify-between items-center p-2 border border-zinc-900 bg-zinc-950/40 rounded-xl">
                      <span className="text-zinc-300 font-sans font-bold">{srv.name}</span>
                      <button
                        onClick={() => handleSimulateOutage(srv.id, srv.status)}
                        className={cn(
                          "px-2 py-1 rounded text-[8px] font-black uppercase transition-all cursor-pointer",
                          srv.status === "healthy"
                            ? "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-red-500/30 hover:text-red-400"
                            : "bg-red-950/20 border border-red-500/20 text-red-400"
                        )}
                      >
                        {srv.status === "healthy" ? "Simulate Outage" : "Recover Health"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Schedule Maintenance form */}
              <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
                <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block font-mono">Schedule Maintenance</span>
                <form onSubmit={handleCreateMaintenance} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-zinc-550 tracking-wider">Maintenance Title</label>
                    <input
                      type="text"
                      value={maintTitle}
                      onChange={(e) => setMaintTitle(e.target.value)}
                      placeholder="e.g. PostgreSQL db updates"
                      required
                      className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-lg outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-zinc-555 tracking-wider font-mono">Affected components</label>
                    <select
                      multiple
                      value={maintAffected}
                      onChange={(e) => setMaintAffected(Array.from(e.target.selectedOptions, option => option.value))}
                      className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg outline-none font-bold min-h-24 scrollbar-thin"
                    >
                      {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-purple-650 hover:bg-purple-600 text-white font-bold rounded-lg transition text-[9px] uppercase cursor-pointer"
                  >
                    Schedule Maintenance
                  </button>
                </form>
              </div>

            </div>

            {/* Right columns: Create Incident & Active Timeline management */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Create Manual Incident Form */}
              <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
                <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block font-mono font-bold">Create SRE Incident Alert</span>
                <form onSubmit={handleCreateIncident} className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-black text-zinc-550 tracking-wider">Incident Title</label>
                      <input
                        type="text"
                        value={incTitle}
                        onChange={(e) => setIncTitle(e.target.value)}
                        placeholder="e.g. AWS US-East API latency threshold limit failures"
                        required
                        className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-lg outline-none focus:border-purple-500 font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-black text-zinc-550 tracking-wider">Severity</label>
                      <select
                        value={incSeverity}
                        onChange={(e) => setIncSeverity(e.target.value)}
                        className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg outline-none font-bold"
                      >
                        <option value="Degraded">Degraded Performance</option>
                        <option value="Partial Outage">Partial Outage</option>
                        <option value="Major Outage">Major Outage</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-black text-zinc-550 tracking-wider font-mono">Affected Services</label>
                      <select
                        multiple
                        value={incAffected}
                        onChange={(e) => setIncAffected(Array.from(e.target.selectedOptions, option => option.value))}
                        className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg outline-none font-bold min-h-24 scrollbar-thin"
                      >
                        {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[9px] uppercase font-black text-zinc-550 tracking-wider">Initial Log Description</label>
                    <textarea
                      rows={3}
                      value={incDesc}
                      onChange={(e) => setIncDesc(e.target.value)}
                      placeholder="Noting service connection drops..."
                      required
                      className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-white rounded-lg outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-650 hover:bg-purple-600 text-white font-bold rounded-lg transition text-[9px] uppercase cursor-pointer"
                    >
                      Broadcast Incident
                    </button>
                  </div>
                </form>
              </div>

              {/* Active Incident Controls Timeline */}
              <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
                <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block font-mono">Manage Active Incidents</span>
                <div className="space-y-4">
                  {incidents.filter(i => i.status !== "Resolved").map((inc) => (
                    <div key={inc.id} className="p-4 border border-zinc-900 bg-zinc-950/30 rounded-xl space-y-3">
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-[11px] text-zinc-200">{inc.title}</span>
                        <span className="text-[8px] text-zinc-500 font-mono">Status: {inc.status}</span>
                      </div>
                      
                      {/* Timeline steps updater */}
                      <div className="flex flex-wrap gap-1.5 text-[8.5px] font-black uppercase font-mono">
                        <button
                          onClick={() => handleAddTimelineUpdate(inc.id, "Identified", "Identified the root bottleneck causing resource leak on database threads.")}
                          className="px-2 py-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 rounded border border-zinc-800 transition cursor-pointer"
                        >
                          Identify
                        </button>
                        <button
                          onClick={() => handleAddTimelineUpdate(inc.id, "Monitoring", "Patch deployed. Monitoring queue processing rates.")}
                          className="px-2 py-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 rounded border border-zinc-800 transition cursor-pointer"
                        >
                          Monitor
                        </button>
                        <button
                          onClick={() => handleAddTimelineUpdate(inc.id, "Resolved", "Resolved. Services fully operational.")}
                          className="px-2 py-1 bg-emerald-950/20 border border-emerald-500/20 text-emerald-450 rounded transition cursor-pointer"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => setPostTargetId(inc.id)}
                          className="px-2 py-1 bg-purple-950/20 border border-purple-500/20 text-purple-400 rounded transition cursor-pointer"
                        >
                          RCA Postmortem
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Postmortem report publishing panel */}
              {postTargetId && (
                <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
                  <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block font-mono">Publish Root Cause Analysis (RCA) Postmortem</span>
                  <form onSubmit={handlePublishPostmortem} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-black text-zinc-550 tracking-wider">Postmortem Summary</label>
                      <input
                        type="text"
                        value={postSummary}
                        onChange={(e) => setPostSummary(e.target.value)}
                        placeholder="SMTP Dispatch vault credentials expired"
                        required
                        className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-lg outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-black text-zinc-550 tracking-wider">Root Cause Details</label>
                      <textarea
                        rows={2}
                        value={postRootCause}
                        onChange={(e) => setPostRootCause(e.target.value)}
                        placeholder="Rotate secret engine cron runner timed out"
                        required
                        className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white rounded-lg outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-black text-zinc-550 tracking-wider">Prevention Action Items</label>
                      <textarea
                        rows={2}
                        value={postPrevention}
                        onChange={(e) => setPostPrevention(e.target.value)}
                        placeholder="Migrated credentials management to AWS Vault Manager..."
                        required
                        className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white rounded-lg outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setPostTargetId(null)}
                        className="px-3 py-1.5 border border-zinc-850 text-zinc-500 rounded-lg text-[9px] uppercase transition font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-purple-650 hover:bg-purple-600 text-white font-bold rounded-lg transition text-[9px] uppercase cursor-pointer"
                      >
                        Publish RCA
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>

          </div>
        )}

        {/* ALERT SUBSCRIPTION MODAL */}
        <AnimatePresence>
          {showSubModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-zinc-950 border border-zinc-850 p-6 rounded-3xl space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-black uppercase text-white flex items-center gap-1.5">
                      <Bell size={14} className="text-purple-400" /> Subscribe to Status Updates
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-semibold mt-1">Get notifications when incidents are reported or scheduled maintenance is planned.</p>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!subEmail.trim()) return;
                    setShowSubModal(false);
                    setSubEmail("");
                    addToast("Subscription alert checklist saved!", "success");
                  }}
                  className="space-y-4 text-xs font-semibold"
                >
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-zinc-550">Email Address</label>
                    <input
                      type="email"
                      value={subEmail}
                      onChange={(e) => setSubEmail(e.target.value)}
                      placeholder="alerts@yourdomain.com"
                      required
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-xl outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="p-3 bg-zinc-900/30 border border-zinc-900 rounded-xl space-y-2 text-[10px]">
                    <span className="text-[8.5px] uppercase font-black text-zinc-500 block">Select alert channels</span>
                    <label className="flex items-center gap-2 text-zinc-300">
                      <input type="checkbox" defaultChecked className="accent-purple-500" /> Email Notifications
                    </label>
                    <label className="flex items-center gap-2 text-zinc-300">
                      <input type="checkbox" defaultChecked className="accent-purple-500" /> Browser Push Alerts
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSubModal(false)}
                      className="px-4 py-2 border border-zinc-850 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-650 hover:bg-purple-600 text-white font-bold rounded-xl text-[10px] transition cursor-pointer"
                    >
                      Activate Subscription
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </PageShell>
  );
}
