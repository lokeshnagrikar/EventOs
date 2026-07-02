"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  SlidersHorizontal
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSocket } from "@/context/SocketContext";
import { api } from "@/lib/api";

interface ActivityLog {
  id: string;
  user: string;
  action: string;
  details: string;
  category: "sales" | "operations" | "files" | "billing";
  time: string;
  badgeColor: string;
}

const formatTimeAgo = (createdAt: any) => {
  if (!createdAt) return "Recently";
  let date = new Date();
  if (Array.isArray(createdAt)) {
    const [year, month, day, hour, minute, second] = createdAt;
    date = new Date(year, (month || 1) - 1, day || 1, hour || 0, minute || 0, second || 0);
  } else {
    date = new Date(createdAt);
  }
  if (isNaN(date.getTime())) return "Recently";
  
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
};

export default function ActivityLogPage() {
  const router = useRouter();
  const { status, subscribe } = useSocket();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "sales" | "operations" | "files" | "billing">("all");

  const [logs, setLogs] = useState<ActivityLog[]>([
    { id: "1", user: "Lokesh Nagrikar", action: "created booking #EV-2026-902", details: "Assigned contract for Rohan & Meera Wedding Gala", category: "sales", time: "10 mins ago", badgeColor: "border-purple-900/40 text-purple-400" },
    { id: "2", user: "Rahul Sharma", action: "uploaded gallery images", details: "Added 128 high-res photos to Client Portal portal", category: "files", time: "2 hours ago", badgeColor: "border-cyan-900/40 text-cyan-400" },
    { id: "3", user: "Payment Bridge", action: "cleared invoice #INV-2026-039", details: "INR 85,000 processed via UPI instant gateway", category: "billing", time: "5 hours ago", badgeColor: "border-emerald-900/40 text-emerald-450" },
    { id: "4", user: "Lokesh Nagrikar", action: "converted lead", details: "Siddharth & Ananya proposal signed by customer", category: "sales", time: "1 day ago", badgeColor: "border-purple-900/40 text-purple-400" },
    { id: "5", user: "System Scheduler", action: "sent milestone payment reminder", details: "Emailed Amit Shah regarding overdue INV-2026-042", category: "billing", time: "2 days ago", badgeColor: "border-amber-900/40 text-amber-500" },
    { id: "6", user: "Priya Varma", action: "assigned staff availability", details: "Assigned coordinator Amit & Priya to TechCorp Summit", category: "operations", time: "3 days ago", badgeColor: "border-blue-900/40 text-blue-400" },
    { id: "7", user: "System Engine", action: "generated tax statement", details: "18% GST tax schedule attached to booking INV-2026-042", category: "billing", time: "4 days ago", badgeColor: "border-emerald-900/40 text-emerald-450" },
  ]);

  useEffect(() => {
    async function loadLogs() {
      try {
        const [teamRes, auditRes] = await Promise.all([
          api.get("/auth/settings/team"),
          api.get("/auth/settings/audit")
        ]);
        
        const teamList = teamRes.data?.data || [];
        const rawLogs = auditRes.data?.data || [];
        
        if (rawLogs.length > 0) {
          const mappedLogs = rawLogs.map((log: any) => {
            const member = teamList.find((m: any) => m.id === log.userId);
            const userDisplay = member 
              ? `${member.firstName} ${member.lastName}` 
              : (log.userId ? "Workspace Admin" : "System");
              
            let category: "sales" | "operations" | "files" | "billing" = "operations";
            const act = (log.action || "").toUpperCase();
            if (act.includes("LEAD") || act.includes("BOOKING") || act.includes("CLIENT")) category = "sales";
            else if (act.includes("FILE") || act.includes("MEDIA") || act.includes("GALLERY")) category = "files";
            else if (act.includes("BILL") || act.includes("PAY") || act.includes("INVOICE") || act.includes("TAX")) category = "billing";
            
            let formattedAction = (log.action || "").toLowerCase().replace(/_/g, " ");
            if (formattedAction.includes("login")) formattedAction = "logged in to the platform";
            else if (formattedAction.includes("switch")) formattedAction = "switched active console workspace";
            
            return {
              id: log.id || Math.random().toString(),
              user: userDisplay,
              action: formattedAction,
              details: log.details || `Triggered event ${log.action}`,
              category,
              time: formatTimeAgo(log.createdAt),
              badgeColor: category === "sales" 
                ? "border-purple-900/40 text-purple-400"
                : category === "files"
                ? "border-cyan-900/40 text-cyan-400"
                : category === "billing"
                ? "border-emerald-900/40 text-emerald-450"
                : "border-blue-900/40 text-blue-400"
            };
          });
          setLogs(mappedLogs);
        }
      } catch (err) {
        console.error("Failed to load live activity logs:", err);
      }
    }
    loadLogs();
  }, []);

  useEffect(() => {
    if (status !== "CONNECTED") return;

    const unsubscribeActivity = subscribe("/topic/activity", (payload: any) => {
      const newLog: ActivityLog = {
        id: Math.random().toString(36).substring(7),
        user: payload.user || "System",
        action: payload.action || "performed workspace update",
        details: payload.details || payload.message || "Activity recorded.",
        category: payload.category || "operations",
        time: "Just now",
        badgeColor: payload.category === "sales" 
          ? "border-purple-900/40 text-purple-400"
          : payload.category === "files"
          ? "border-cyan-900/40 text-cyan-400"
          : payload.category === "billing"
          ? "border-emerald-900/40 text-emerald-450"
          : "border-blue-900/40 text-blue-400"
      };
      setLogs((prev) => [newLog, ...prev]);
    });

    return () => {
      unsubscribeActivity();
    };
  }, [status]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "all" || log.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (cat: ActivityLog["category"]) => {
    switch (cat) {
      case "sales": return <Users size={12} />;
      case "files": return <ImageIcon size={12} />;
      case "billing": return <CreditCard size={12} />;
      case "operations": return <Calendar size={12} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex flex-col relative overflow-hidden transition-all duration-200">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Top Navbar */}
      <nav className="h-16 border-b border-zinc-800 bg-[#111113]/85 backdrop-blur px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="h-8 w-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-zinc-700/50 cursor-pointer"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">Activity Logs</span>
            <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-zinc-400 font-bold uppercase tracking-wider font-mono">Audit Trail</span>
          </div>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:text-white rounded-xl text-xs font-bold text-zinc-400 transition-all cursor-pointer"
        >
          <RefreshCw size={12} />
          Sync Logs
        </button>
      </nav>

      {/* Main Container */}
      <main className="flex-1 p-6 space-y-6 max-w-4xl mx-auto w-full z-10">
        
        {/* Title Header */}
        <div className="border-b border-zinc-850 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Workspace Audit Timeline</h2>
            <p className="text-xs text-zinc-400">Track and review administrative actions, payment triggers, and operational edits.</p>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between bg-zinc-950/20 border border-zinc-850/80 p-3 rounded-2xl backdrop-blur-md">
          {/* Category Tabs */}
          <div className="flex bg-zinc-900 border border-zinc-800/80 p-0.5 rounded-xl self-start overflow-x-auto text-[10px] font-bold uppercase select-none">
            {([
              { key: "all", label: "All Logs" },
              { key: "sales", label: "Sales & CRM" },
              { key: "operations", label: "Operations" },
              { key: "files", label: "Files & Media" },
              { key: "billing", label: "Ledger / Billing" }
            ] as const).map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap",
                  activeCategory === cat.key ? "bg-zinc-800 text-purple-400" : "text-zinc-550 hover:text-zinc-350"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64 flex items-center">
            <Search size={13} className="absolute left-3 text-zinc-550" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-650 transition-colors"
            />
          </div>
        </div>

        {/* Visual Timeline Section */}
        <div className="border border-zinc-850 bg-[#111113]/30 rounded-2xl p-6 relative">
          <div className="absolute top-6 right-6 flex items-center gap-1 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
            <SlidersHorizontal size={10} className="text-purple-400" />
            Live Streams
          </div>

          {/* Timeline Node Tree */}
          <div className="relative border-l border-zinc-800/80 pl-6 ml-3.5 space-y-6 py-2">
            {filteredLogs.map((log) => (
              <div key={log.id} className="relative group">
                {/* Node point marker */}
                <span className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center text-[7px] text-zinc-500 group-hover:border-purple-500 group-hover:text-purple-400 transition-colors">
                  {getCategoryIcon(log.category)}
                </span>

                <div className="p-4 border border-zinc-850 bg-zinc-950/20 rounded-xl hover:border-zinc-800 hover:bg-zinc-900/10 transition-all space-y-1.5">
                  <div className="flex justify-between items-start gap-3">
                    <div className="text-xs font-semibold">
                      <strong className="text-zinc-200">{log.user}</strong>
                      <span className="text-zinc-400 font-medium"> {log.action}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-medium shrink-0 whitespace-nowrap">
                      {log.time}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-500 font-medium">{log.details}</p>

                  <div className="flex items-center gap-2 pt-1">
                    <span className={cn("px-2 py-0.5 border rounded-full text-[8px] font-black uppercase tracking-wider", log.badgeColor)}>
                      {log.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <div className="py-12 text-center text-zinc-550 italic text-xs font-medium">
                No activity logs match your search.
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
