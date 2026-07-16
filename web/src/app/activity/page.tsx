"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Filter,
  User,
  CreditCard,
  FileText,
  Image as ImageIcon,
  Users,
  Calendar,
  Layers,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Download,
  Info,
  Clock,
  Terminal,
  Zap,
  Globe,
  Settings,
  Shield,
  Trash2,
  Lock,
  X,
  AlertCircle,
  Pin,
  Bot,
  Laptop,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageShell from "@/components/ui/PageShell";
import EmptyState from "@/components/ui/EmptyState";
import { useToastStore } from "@/lib/toastStore";
import { useAuthStore } from "@/store/authStore";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import {
  INITIAL_AUDIT_LOGS,
  AdvancedAuditLog,
  MOCK_DEVICES_INITIAL,
} from "@/lib/activityData";

const SEVERITY_COLORS = {
  low: "bg-zinc-800 text-zinc-400 border-zinc-700/50",
  medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  high: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse",
};

const LOG_ICONS: Record<string, React.ElementType> = {
  Lead: Users,
  Event: Calendar,
  Invoice: CreditCard,
  Quote: FileText,
  Gallery: ImageIcon,
  Security: Shield,
  System: Settings,
  Member: User,
};

export default function ActivityLogPage() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const { user } = useAuthStore();

  const [logs, setLogs] = useState<AdvancedAuditLog[]>([]);
  const [devices, setDevices] = useState<typeof MOCK_DEVICES_INITIAL>([]);
  const [mounted, setMounted] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<"timeline" | "security" | "insights">("timeline");

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [datePreset, setDatePreset] = useState("ALL");

  // Expanded log (shows side-by-side diff comparison)
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Notes drawer
  const [activeNoteLog, setActiveNoteLog] = useState<AdvancedAuditLog | null>(null);
  const [noteInput, setNoteInput] = useState("");

  // Live simulator state
  const [isLiveEnabled, setIsLiveEnabled] = useState(true);

  useEffect(() => {
    setMounted(true);
    const storedLogs = localStorage.getItem("eventos_audit_logs");
    const storedDevices = localStorage.getItem("eventos_audit_devices");

    if (storedLogs) {
      try { setLogs(JSON.parse(storedLogs)); } catch { setLogs(INITIAL_AUDIT_LOGS); }
    } else {
      setLogs(INITIAL_AUDIT_LOGS);
      localStorage.setItem("eventos_audit_logs", JSON.stringify(INITIAL_AUDIT_LOGS));
    }

    if (storedDevices) {
      try { setDevices(JSON.parse(storedDevices)); } catch { setDevices(MOCK_DEVICES_INITIAL); }
    } else {
      setDevices(MOCK_DEVICES_INITIAL);
      localStorage.setItem("eventos_audit_devices", JSON.stringify(MOCK_DEVICES_INITIAL));
    }
  }, []);

  // Live WebSocket Action simulator
  useEffect(() => {
    if (!isLiveEnabled || !mounted) return;

    const interval = setInterval(() => {
      const actions = [
        { name: "Lead", act: "CREATE", desc: "Acquired new sangeet event lead", severity: "low" as const, actor: "Siddharth Wedding Lead" },
        { name: "Invoice", act: "UPDATE", desc: "Updated invoice payment terms", severity: "medium" as const, actor: "Roy Wedding Admin" },
        { name: "Security", act: "LOGIN", desc: "User authenticated successfully", severity: "low" as const, actor: "Sarah CS Agent" },
        { name: "Quote", act: "UPDATE", desc: "Client accepted event quotation props", severity: "medium" as const, actor: "Ananya Bride Quote" },
      ];
      const selected = actions[Math.floor(Math.random() * actions.length)];

      const newLog: AdvancedAuditLog = {
        id: `AUD-${Math.random().toString(36).substring(7).toUpperCase()}`,
        entityName: selected.name as any,
        entityId: `evt-${Date.now()}`,
        action: selected.act as any,
        performedBy: selected.actor,
        actorEmail: `${selected.actor.toLowerCase().replace(/ /g, "")}@eventos.dev`,
        ipAddress: "192.168.1.112",
        severity: selected.severity,
        createdAt: new Date().toISOString(),
        diffs: [
          { fieldName: "Operation type", previousValue: "Draft status", newValue: selected.desc }
        ]
      };

      setLogs((prev) => {
        const next = [newLog, ...prev];
        localStorage.setItem("eventos_audit_logs", JSON.stringify(next));
        return next;
      });

      addToast(`Real-time Audit log: ${selected.name} ${selected.act}`, "info");
    }, 15000); // Trigger simulated WS logs every 15 seconds

    return () => clearInterval(interval);
  }, [isLiveEnabled, mounted, addToast]);

  const saveLogs = (updated: AdvancedAuditLog[]) => {
    setLogs(updated);
    localStorage.setItem("eventos_audit_logs", JSON.stringify(updated));
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = logs.map((l) => {
      if (l.id === id) {
        const nextPin = !l.isPinned;
        addToast(nextPin ? "Activity event pinned to top." : "Activity event unpinned.", "info");
        return { ...l, isPinned: nextPin };
      }
      return l;
    });
    saveLogs(updated);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNoteLog) return;

    const updated = logs.map((l) => {
      if (l.id === activeNoteLog.id) {
        return { ...l, notes: noteInput };
      }
      return l;
    });

    saveLogs(updated);
    setNoteInput("");
    setActiveNoteLog(null);
    addToast("Internal admin note saved to log record.", "success");
  };

  // Filters logic
  const filteredLogs = useMemo(() => {
    let items = [...logs];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (l) =>
          l.performedBy.toLowerCase().includes(q) ||
          l.entityName.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q) ||
          l.ipAddress.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q)
      );
    }

    // Severity filter
    if (severityFilter !== "ALL") {
      items = items.filter((l) => l.severity === severityFilter);
    }

    // Module filter
    if (moduleFilter !== "ALL") {
      items = items.filter((l) => l.entityName === moduleFilter);
    }

    // Date Presets (Today, Last 7 Days)
    if (datePreset !== "ALL") {
      const now = Date.now();
      if (datePreset === "TODAY") {
        const todayStr = new Date().toDateString();
        items = items.filter((l) => new Date(l.createdAt).toDateString() === todayStr);
      } else if (datePreset === "7DAYS") {
        const boundary = now - 7 * 24 * 3600 * 1000;
        items = items.filter((l) => new Date(l.createdAt).getTime() >= boundary);
      } else if (datePreset === "30DAYS") {
        const boundary = now - 30 * 24 * 3600 * 1000;
        items = items.filter((l) => new Date(l.createdAt).getTime() >= boundary);
      }
    }

    // Prioritize pinned logs
    return items.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [logs, searchQuery, severityFilter, moduleFilter, datePreset]);

  // Export
  const handleExport = (format: "csv" | "json") => {
    addToast(`Streaming audit trail chunk nodes to ${format.toUpperCase()}...`, "info");
    setTimeout(() => {
      let content = "";
      if (format === "csv") {
        const headers = "ID,Actor,Module,Action,IP Address,Severity,Timestamp\n";
        const rows = filteredLogs
          .map((l) => `${l.id},"${l.performedBy}",${l.entityName},${l.action},${l.ipAddress},${l.severity},${l.createdAt}`)
          .join("\n");
        content = headers + rows;
      } else {
        content = JSON.stringify(filteredLogs, null, 2);
      }

      const blob = new Blob([content], { type: format === "csv" ? "text/csv" : "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `audit_trail_report.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast("Audit log export completed successfully.", "success");
    }, 1000);
  };

  // Recharts metric
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((l) => {
      counts[l.entityName] = (counts[l.entityName] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [logs]);

  // AI Summary computed insight logs
  const aiSummaryText = useMemo(() => {
    const total = logs.length;
    const criticals = logs.filter((l) => l.severity === "critical").length;
    const leadsCount = logs.filter((l) => l.entityName === "Lead").length;
    const invoiceCount = logs.filter((l) => l.entityName === "Invoice").length;

    return `AI Summary: Detected ${total} audit operations this week. Flagged ${criticals} security alerts (check access denied logs). Operations logged: ${leadsCount} CRM lead pipeline modifications, and ${invoiceCount} client billing changes.`;
  }, [logs]);

  const relativeTime = (timeString: string) => {
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return "Recently";
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  if (!mounted) return null;

  return (
    <PageShell
      title="Enterprise Audit & Activity Center"
      subtitle="Workspace-wide activities ledger logs with immutable security traces and side-by-side value diff checks."
      actions={
        <div className="flex gap-2 print:hidden">
          <button
            onClick={() => handleExport("csv")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Download size={13} />
            CSV Export
          </button>
          <button
            onClick={() => handleExport("json")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Download size={13} />
            JSON
          </button>
        </div>
      }
    >
      <div className="space-y-6 select-none text-zinc-300">
        
        {/* ── TOP TABS ────────────────────────────────────────────────────── */}
        <div className="flex border-b border-zinc-850 text-xs font-black uppercase tracking-wider text-zinc-550 print:hidden">
          {[
            { id: "timeline" as const, label: "Global Activity Timeline", icon: Clock },
            { id: "security" as const, label: "Security & Device Session Logs", icon: Shield },
            { id: "insights" as const, label: "AI Co-pilot Activity Analysis", icon: Bot },
          ].map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 border-b-2 transition-all cursor-pointer",
                  active
                    ? "border-purple-650 text-purple-400 font-bold"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── TAB 1: GLOBAL TIMELINE & AUDIT TRAILS ────────────────────────── */}
        {activeTab === "timeline" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Sidebar Sticky Filters */}
            <div className="lg:col-span-1 space-y-6 print:hidden">
              <div className="p-5 border border-zinc-855 bg-zinc-950/20 rounded-2xl space-y-4">
                <h3 className="text-xs font-black uppercase text-zinc-200 flex items-center gap-1.5">
                  <SlidersHorizontal size={13} />
                  Filter Audit Trail
                </h3>

                {/* Live toggle */}
                <div className="flex justify-between items-center py-2 border-b border-zinc-850/50">
                  <span className="text-[9px] font-black uppercase text-zinc-550">Live updates</span>
                  <button
                    onClick={() => setIsLiveEnabled(!isLiveEnabled)}
                    className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border transition-all cursor-pointer",
                      isLiveEnabled
                        ? "bg-purple-500/10 border-purple-500/20 text-purple-450"
                        : "bg-zinc-900 border-zinc-850 text-zinc-500"
                    )}
                  >
                    {isLiveEnabled ? "ENABLED" : "PAUSED"}
                  </button>
                </div>

                {/* Search */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Search string</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by actor, IP..."
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs placeholder-zinc-700 text-zinc-200 focus:outline-none"
                  />
                </div>

                {/* Module */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Target Module</label>
                  <select
                    value={moduleFilter}
                    onChange={(e) => setModuleFilter(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none"
                  >
                    <option value="ALL">All Modules</option>
                    <option value="Lead">CRM Lead</option>
                    <option value="Event">Event Planner</option>
                    <option value="Invoice">Finance Invoices</option>
                    <option value="Quote">Event Quotes</option>
                    <option value="Gallery">Media Gallery</option>
                    <option value="Security">Security Policy</option>
                  </select>
                </div>

                {/* Severity */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Severity Level</label>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none"
                  >
                    <option value="ALL">All Severities</option>
                    <option value="low">Low Severity</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical incident</option>
                  </select>
                </div>

                {/* Date presets */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Date range</label>
                  <select
                    value={datePreset}
                    onChange={(e) => setDatePreset(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none"
                  >
                    <option value="ALL">All dates</option>
                    <option value="TODAY">Logged Today</option>
                    <option value="7DAYS">Last 7 Days</option>
                    <option value="30DAYS">Last Month</option>
                  </select>
                </div>

              </div>
            </div>

            {/* GitHub-style Timeline */}
            <div className="lg:col-span-3 space-y-6">
              
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-zinc-550 tracking-wider">Timeline Feed ({filteredLogs.length} events)</h3>
                <span className="text-[8px] font-black uppercase text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">Immutable logs</span>
              </div>

              {filteredLogs.length === 0 ? (
                <EmptyState icon={Clock} title="No activity recorded" description="No audit log entities match selected search filters." />
              ) : (
                <div className="relative border-l border-zinc-850/80 ml-4 pl-6 space-y-6">
                  {filteredLogs.map((log) => {
                    const Icon = LOG_ICONS[log.entityName] || Settings;
                    const isExpanded = expandedLogId === log.id;
                    return (
                      <div key={log.id} className="relative group/timeline">
                        
                        {/* Bullet point Node */}
                        <div className={cn(
                          "absolute -left-9 top-1.5 h-6 w-6 rounded-full border flex items-center justify-center shadow-md",
                          log.isPinned ? "bg-amber-400/10 border-amber-500/30 text-amber-400"
                            : "bg-zinc-950 border-zinc-850 text-zinc-400"
                        )}>
                          <Icon size={11} />
                        </div>

                        <div className="p-4 border border-zinc-855 bg-zinc-950/25 rounded-2xl hover:border-zinc-800 transition-colors space-y-3 cursor-pointer" onClick={() => setExpandedLogId(isExpanded ? null : log.id)}>
                          
                          {/* Top Row: User details, date, Pin trigger */}
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="h-7 w-7 rounded-xl bg-purple-500/15 border border-purple-500/20 text-purple-400 shrink-0 flex items-center justify-center font-extrabold text-[10px]">
                                {log.performedBy.slice(0,2).toUpperCase()}
                              </div>
                              <div className="truncate">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-bold text-zinc-200">{log.performedBy}</span>
                                  <span className="text-[9px] text-zinc-550 font-semibold truncate">({log.actorEmail})</span>
                                </div>
                                <p className="text-[9px] text-zinc-500 mt-0.5 flex items-center gap-1.5">
                                  <span>{log.action}</span>
                                  <span>•</span>
                                  <span>IP: {log.ipAddress}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={cn("px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider border", SEVERITY_COLORS[log.severity])}>
                                {log.severity}
                              </span>
                              
                              <button onClick={(e) => handleTogglePin(log.id, e)} className="text-zinc-650 hover:text-amber-400 cursor-pointer transition-colors">
                                <Pin size={11} fill={log.isPinned ? "#fbbf24" : "none"} className={log.isPinned ? "text-amber-400" : ""} />
                              </button>
                            </div>
                          </div>

                          {/* Brief operation Diff details Summary */}
                          <div className="flex justify-between items-center text-[11px] text-zinc-350 font-semibold bg-zinc-900/10 p-2.5 rounded-xl border border-zinc-850/40">
                            <span className="truncate">{log.entityName} update ID: {log.entityId}</span>
                            <span className="text-[9px] text-zinc-550 font-mono shrink-0">{relativeTime(log.createdAt)}</span>
                          </div>

                          {/* Expandable diff comparison (Previous vs New value) */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden space-y-3 pt-3 border-t border-zinc-850/50 text-xs font-semibold"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <h4 className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Side-by-side Audit Diff</h4>
                                
                                <div className="space-y-2.5">
                                  {log.diffs?.map((d, di) => (
                                    <div key={di} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2 bg-zinc-950 border border-zinc-850/60 rounded-xl">
                                      <div className="text-[9px] font-black uppercase text-purple-400 truncate flex items-center">{d.fieldName}</div>
                                      <div className="p-2 bg-red-500/5 border border-red-500/10 rounded-lg text-[10px] font-mono text-red-400 break-words">
                                        <span className="block text-[8px] font-bold text-zinc-550 uppercase">PREVIOUS</span>
                                        {d.previousValue}
                                      </div>
                                      <div className="p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-[10px] font-mono text-emerald-400 break-words">
                                        <span className="block text-[8px] font-bold text-zinc-550 uppercase">NEW</span>
                                        {d.newValue}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Pinned Note display / Save Note trigger */}
                                {log.notes ? (
                                  <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
                                    <span className="text-[8px] font-black uppercase text-amber-500 flex items-center gap-1"><Info size={9} /> Internal note</span>
                                    <p className="text-[10px] text-zinc-350">{log.notes}</p>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => { setActiveNoteLog(log); setNoteInput(""); }}
                                    className="text-[9px] text-purple-400 font-extrabold hover:underline cursor-pointer"
                                  >
                                    + Add internal note / pin remark
                                  </button>
                                )}

                              </motion.div>
                            )}
                          </AnimatePresence>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── TAB 2: SECURITY & SESSION AUDIT ──────────────────────────────── */}
        {activeTab === "security" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Active Sessions Devices */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-zinc-550 tracking-wider">Active Device Sessions</h3>
              <div className="space-y-3">
                {devices.map((dev, idx) => (
                  <div key={idx} className="p-4 border border-zinc-855 bg-zinc-950/20 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                          <Laptop size={14} />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-zinc-200">{dev.device}</h4>
                          <p className="text-[9px] text-zinc-500 font-semibold">{dev.browser}</p>
                        </div>
                      </div>

                      {dev.current && (
                        <span className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Current Device
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center border-t border-zinc-850/50 pt-2 text-[9px] text-zinc-500 font-semibold">
                      <span>IP: {dev.ip} ({dev.location})</span>
                      <span className="font-mono text-zinc-600">{dev.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Exception Incidents */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xs font-black uppercase text-zinc-550 tracking-wider">Security Exception Incidents</h3>
              
              <div className="border border-zinc-850 rounded-2xl bg-zinc-950/20 divide-y divide-zinc-850/50 overflow-hidden">
                {logs.filter((l) => l.action === "FAILED_LOGIN" || l.action === "DENIED" || l.severity === "critical").map((log) => (
                  <div key={log.id} className="p-4 flex items-center justify-between gap-6 hover:bg-zinc-900/10 transition-colors">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold text-zinc-250 truncate">{log.performedBy} ({log.actorEmail})</span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-red-500/15 border border-red-500/20 text-red-400">
                          {log.action}
                        </span>
                      </div>
                      <p className="text-[9px] text-zinc-500 font-semibold flex items-center gap-1.5">
                        <span>IP Address: {log.ipAddress}</span>
                        <span>•</span>
                        <span>Time: {new Date(log.createdAt).toLocaleTimeString()}</span>
                      </p>
                    </div>

                    <span className="text-[9px] text-red-400 font-bold shrink-0">CRITICAL FLAG</span>
                  </div>
                ))}
                {logs.filter((l) => l.action === "FAILED_LOGIN" || l.action === "DENIED" || l.severity === "critical").length === 0 && (
                  <div className="p-8 text-center text-xs text-zinc-550 font-bold uppercase">
                    No security exception warnings logged.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ── TAB 3: AI INSIGHT CO-PILOT ───────────────────────────────────── */}
        {activeTab === "insights" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* AI Insights Card */}
            <div className="lg:col-span-2 p-6 border border-purple-950/30 bg-purple-950/5 rounded-3xl space-y-4 relative overflow-hidden">
              <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-purple-500/[0.03] blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-pink-500/[0.03] blur-3xl pointer-events-none" />

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Bot size={18} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase text-zinc-200 tracking-wider">AI Activity Summarizer</h3>
                  <p className="text-[9px] text-zinc-550 font-bold uppercase tracking-wider">Workspace operations anomaly scanner</p>
                </div>
              </div>

              <div className="p-4 bg-zinc-950/60 border border-zinc-850 rounded-2xl text-xs font-semibold leading-relaxed text-zinc-300">
                {aiSummaryText}
              </div>

              <div className="pt-2 flex justify-between items-center text-[10px] text-zinc-500 font-semibold border-t border-zinc-850/50">
                <span>Summary updated just now</span>
                <span className="text-purple-400 font-extrabold flex items-center gap-1"><Zap size={10} /> Powered by EventOS Intelligence</span>
              </div>
            </div>

            {/* Logs frequency chart */}
            <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Activity Frequency</span>
                <h4 className="font-extrabold text-zinc-200 mt-0.5 text-xs">Logged Module Distribution</h4>
              </div>

              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" stroke="#52525b" fontSize={9} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#000", border: "1px solid #27272a" }} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {/* ── NOTES DRAWER MODAL ───────────────────────────────────────────── */}
        <AnimatePresence>
          {activeNoteLog && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-5"
              >
                <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
                  <h3 className="text-xs font-black uppercase text-zinc-200 tracking-wider">Add Internal Note</h3>
                  <button onClick={() => setActiveNoteLog(null)} className="text-zinc-500 hover:text-white cursor-pointer"><X size={16} /></button>
                </div>

                <form onSubmit={handleSaveNote} className="space-y-4">
                  <div className="p-3 bg-zinc-900/50 border border-zinc-850 rounded-xl text-[10px] space-y-1">
                    <p className="font-bold text-zinc-300">Target log ID: {activeNoteLog.id}</p>
                    <p className="text-zinc-500">Actor: {activeNoteLog.performedBy} ({activeNoteLog.action})</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-zinc-555 tracking-wider">Note content</label>
                    <textarea
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Enter admin remarks, exception comments, or audit flags..."
                      required
                      rows={3}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveNoteLog(null)}
                      className="px-4 py-2 border border-zinc-850 hover:bg-zinc-850 text-zinc-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Save Note
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
