"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  Clock,
  FileText,
  DollarSign,
  Calendar,
  ArrowRight,
  Layers,
  MapPin,
  Sparkles,
  Users,
  CheckCircle2,
  FileSpreadsheet,
  HelpCircle,
  Camera,
  Heart,
  CloudLightning,
  Settings,
  ChevronDown,
  UserCheck,
  TrendingUp,
  Award
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface Quote {
  id: string;
  quoteNumber: string;
  status: "DRAFT" | "SENT" | "VIEWED" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  total: number;
}

interface Invoice {
  id: string;
  totalAmount: number;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
  dueDate: string;
}

interface EventItem {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate: string;
  location?: string;
}

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  scheduledTime: string;
  completed: boolean;
}

// Visual booking tracker stages
const STAGES = [
  { key: "INQUIRY", label: "Inquiry Received", pct: 10 },
  { key: "QUOTE_SENT", label: "Quote Sent", pct: 20 },
  { key: "QUOTE_ACCEPTED", label: "Quote Accepted", pct: 35 },
  { key: "CONFIRMED", label: "Booking Confirmed", pct: 50 },
  { key: "PLANNING", label: "Planning", pct: 65 },
  { key: "PREPARATION", label: "Preparation", pct: 75 },
  { key: "EVENT_DAY", label: "Event Day", pct: 85 },
  { key: "PROCESSING", label: "Media Processing", pct: 95 },
  { key: "COMPLETED", label: "Completed", pct: 100 }
];

export default function ClientDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userName, setUserName] = useState("Client");

  // Local state checklist (mocking interactive checklist items persistence)
  const [checklist, setChecklist] = useState([
    { id: "guest", label: "Guest list confirmed", completed: true, deadline: "July 2", role: "Client" },
    { id: "decor", label: "Decoration finalized", completed: true, deadline: "July 5", role: "Planner" },
    { id: "food", label: "Food & catering finalized", completed: false, deadline: "July 12", role: "Client" },
    { id: "photo", label: "Photography details confirmed", completed: false, deadline: "July 18", role: "Planner" },
    { id: "music", label: "Music & DJ booked", completed: false, deadline: "July 20", role: "Client" },
    { id: "payment", label: "Initial deposit completed", completed: true, deadline: "June 25", role: "Client" }
  ]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cookieName = decodeURIComponent(
        document.cookie
          .split("; ")
          .find(row => row.startsWith("user_name="))
          ?.split("=")[1] || ""
      );
      if (cookieName) {
        setUserName(cookieName);
      }
    }
  }, []);

  // 1. Fetch Quotes
  const { data: quotesData, isLoading: loadingQuotes } = useQuery<{ data: Quote[] }>({
    queryKey: ["clientQuotes"],
    queryFn: async () => {
      const res = await api.get("/crm/quotes/client");
      return res.data;
    }
  });

  // 2. Fetch Invoices
  const { data: invoicesData, isLoading: loadingInvoices } = useQuery<{ data: Invoice[] }>({
    queryKey: ["clientInvoices"],
    queryFn: async () => {
      const res = await api.get("/events/invoices/client");
      return res.data;
    }
  });

  // 3. Fetch Events
  const { data: eventsData, isLoading: loadingEvents } = useQuery<{ data: EventItem[] }>({
    queryKey: ["clientEvents"],
    queryFn: async () => {
      const res = await api.get("/events/client");
      return res.data;
    }
  });

  // 4. Fetch Timeline
  const { data: timelineData, isLoading: loadingTimeline } = useQuery<{ data: TimelineItem[] }>({
    queryKey: ["clientTimeline"],
    queryFn: async () => {
      const res = await api.get("/events/client/timeline");
      return res.data;
    }
  });

  const clientQuotes = quotesData?.data || [];
  const clientInvoices = invoicesData?.data || [];
  const eventsList = eventsData?.data || [];
  const clientTimeline = timelineData?.data || [];

  const activeEvent = eventsList[0] || null;

  // Ticker Countdown math
  const daysRemaining = useMemo(() => {
    if (!activeEvent) return 0;
    const diff = new Date(activeEvent.startDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [activeEvent]);

  // Billing math
  const totalBalanceDue = useMemo(() => {
    return clientInvoices
      .filter(i => i.status !== "PAID" && i.status !== "CANCELLED")
      .reduce((sum, i) => sum + i.totalAmount, 0);
  }, [clientInvoices]);

  const totalPaid = useMemo(() => {
    return clientInvoices
      .filter(i => i.status === "PAID")
      .reduce((sum, i) => sum + i.totalAmount, 0);
  }, [clientInvoices]);

  const totalInvoiceValue = totalPaid + totalBalanceDue;
  const paidPercent = totalInvoiceValue > 0 ? Math.round((totalPaid / totalInvoiceValue) * 100) : 0;

  // Active progress stage selection mapping
  const currentStage = useMemo(() => {
    if (!activeEvent) return STAGES[0];
    const status = activeEvent.status.toUpperCase();
    if (status === "CONFIRMED") return STAGES[3];
    if (status === "IN_PROGRESS") return STAGES[6];
    if (status === "COMPLETED") return STAGES[8];
    return STAGES[4]; // Default to planning
  }, [activeEvent]);

  const nextMilestone = useMemo(() => {
    return clientTimeline
      .filter(t => !t.completed)
      .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())[0];
  }, [clientTimeline]);

  const checklistProgress = useMemo(() => {
    const done = checklist.filter((c) => c.completed).length;
    return Math.round((done / checklist.length) * 100);
  }, [checklist]);

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((c) => (c.id === id ? { ...c, completed: !c.completed } : c))
    );
  };

  // Recharts Chart Details
  const analyticsData = [
    { name: "Contracts", progress: clientQuotes.filter(q => q.status === "ACCEPTED").length * 100 || 100 },
    { name: "Payments", progress: paidPercent },
    { name: "Checklists", progress: checklistProgress },
    { name: "Timeline", progress: currentStage.pct }
  ];

  const isLoading = loadingQuotes || loadingInvoices || loadingEvents || loadingTimeline;

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <span className="h-8 w-8 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Compiling Event Overview...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-in text-zinc-300 select-none">
      
      {/* ─── DYNAMIC WELCOME HEADER ─── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-800 relative">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 font-bold shrink-0">
            <UserCheck size={20} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              Welcome, {userName} <Sparkles className="text-purple-400 animate-pulse" size={18} />
            </h2>
            <p className="text-[11px] text-zinc-450 mt-1 font-bold">
              EventOS Client Portal &bull; Syncing coordinates in real-time with Sneha Rao.
            </p>
          </div>
        </div>
        
        {/* Days remaining countdown circular progress widget */}
        {activeEvent && (
          <div className="flex items-center gap-4 bg-[#111113]/90 border border-zinc-800 p-4.5 rounded-2xl relative shadow-md overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/5 to-transparent blur-[15px] pointer-events-none" />
            <div className="text-center">
              <span className="text-[8px] text-zinc-550 uppercase font-black tracking-widest block">Days Countdown</span>
              <span className="text-xl font-black text-purple-400 font-mono mt-0.5 block">{daysRemaining}</span>
            </div>
            <div className="h-8 w-px bg-zinc-800" />
            <div>
              <span className="text-[8px] text-zinc-550 uppercase font-black tracking-widest block">Schedule Date</span>
              <span className="text-[11px] font-bold text-zinc-300 mt-0.5 block">
                {new Date(activeEvent.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>
        )}
      </header>

      {/* ─── JOURNEY PROGRESS TRACKER ─── */}
      {activeEvent && (
        <div className="p-5 border border-zinc-800 bg-[#141416]/40 rounded-2xl space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-purple-500/[0.02] via-transparent to-transparent pointer-events-none" />
          <div className="flex justify-between items-center text-xs">
            <div>
              <span className="text-[8px] text-zinc-550 uppercase font-black block">Active Journey Status</span>
              <h4 className="font-extrabold text-zinc-250 mt-1 flex items-center gap-1">
                <Award size={13} className="text-purple-400" /> Stage: {currentStage.label}
              </h4>
            </div>
            <span className="px-2.5 py-0.5 bg-purple-550/5 border border-purple-500/20 text-purple-400 font-black rounded-full uppercase text-[8.5px]">
              {currentStage.pct}% Completed
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full bg-zinc-950 border border-zinc-850 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-650 rounded-full transition-all duration-500"
              style={{ width: `${currentStage.pct}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[9px] text-zinc-550 font-bold uppercase tracking-wider">
            <span>Live Coordinator: Sneha Rao</span>
            <span>Location: {activeEvent.location || "Delhi NCR"}</span>
          </div>
        </div>
      )}

      {/* ─── BENTO GRID STATS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Outstanding Balance */}
        <div onClick={() => router.push("/portal/invoices")} className="p-5 rounded-2xl border border-zinc-800 bg-[#111113]/30 hover:border-purple-500/25 shadow flex flex-col justify-between h-[130px] cursor-pointer transition-all duration-300 relative group">
          <span className="text-[9px] font-black text-zinc-550 uppercase tracking-widest block">Outstanding balance</span>
          <div>
            <p className="text-xl font-black text-red-400 font-mono">₹{totalBalanceDue.toLocaleString()}</p>
            <p className="text-[9px] text-zinc-500 mt-1">Installments pending</p>
          </div>
        </div>

        {/* Paid Balance */}
        <div onClick={() => router.push("/portal/invoices")} className="p-5 rounded-2xl border border-zinc-800 bg-[#111113]/30 hover:border-purple-500/25 shadow flex flex-col justify-between h-[130px] cursor-pointer transition-all duration-300 relative group">
          <span className="text-[9px] font-black text-zinc-550 uppercase tracking-widest block">Contract Value Cleared</span>
          <div>
            <p className="text-xl font-black text-emerald-400 font-mono">₹{totalPaid.toLocaleString()}</p>
            <p className="text-[9px] text-zinc-500 mt-1">Receipts ledger updated</p>
          </div>
        </div>

        {/* Photo Gallery Assets */}
        <div onClick={() => router.push("/portal/gallery")} className="p-5 rounded-2xl border border-zinc-800 bg-[#111113]/30 hover:border-purple-500/25 shadow flex flex-col justify-between h-[130px] cursor-pointer transition-all duration-300 relative group">
          <span className="text-[9px] font-black text-zinc-550 uppercase tracking-widest block">Mood board captures</span>
          <div>
            <p className="text-xl font-black text-purple-400 font-mono">248 items</p>
            <p className="text-[9px] text-zinc-500 mt-1">Auto-optimized delivery</p>
          </div>
        </div>

        {/* Documents count */}
        <div onClick={() => router.push("/portal/quotes")} className="p-5 rounded-2xl border border-zinc-800 bg-[#111113]/30 hover:border-purple-500/25 shadow flex flex-col justify-between h-[130px] cursor-pointer transition-all duration-300 relative group">
          <span className="text-[9px] font-black text-zinc-550 uppercase tracking-widest block">Proposals & Agreements</span>
          <div>
            <p className="text-xl font-black text-zinc-200 font-mono">4 files</p>
            <p className="text-[9px] text-zinc-500 mt-1">Proposals & sign-off vaults</p>
          </div>
        </div>

      </div>

      {/* ─── DUAL COLUMN INTERACTION SPACES ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left column: Event details & checklist */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Guest Checklist Card */}
          <div className="p-5 border border-zinc-850 bg-[#111113]/40 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400">Interactive Checklist</h3>
                <p className="text-[10px] text-zinc-550 font-bold mt-0.5">Toggle tasks to update coordinator.</p>
              </div>
              <span className="text-[9.5px] font-mono font-black text-purple-450 bg-purple-550/5 border border-purple-500/10 px-2 py-0.5 rounded-md">
                {checklistProgress}% Completed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklistItem(item.id)}
                  className={cn(
                    "p-3 border rounded-xl bg-zinc-950/20 cursor-pointer flex flex-col justify-between gap-2.5 transition-all duration-200",
                    item.completed ? "border-zinc-850/80 text-zinc-500" : "border-zinc-800 text-zinc-200 hover:border-zinc-700"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn("font-bold text-[10.5px]", item.completed && "line-through")}>{item.label}</span>
                    {item.completed ? <CheckCircle2 size={13} className="text-emerald-500" /> : <div className="h-3.5 w-3.5 rounded-full border border-zinc-700" />}
                  </div>

                  <div className="flex justify-between items-center text-[8.5px] text-zinc-550 font-mono">
                    <span>By: {item.role}</span>
                    <span>Due: {item.deadline}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Event specs Recharts Chart */}
          <div className="p-5 border border-zinc-850 bg-[#111113]/40 rounded-2xl space-y-4">
            <div>
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400">Campaign analytics progress</h3>
              <p className="text-[10px] text-zinc-550 mt-0.5">Overall task completions logged.</p>
            </div>
            
            <div className="h-44 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" />
                  <YAxis stroke="#71717a" />
                  <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a" }} />
                  <Bar dataKey="progress" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right column: Quick Actions & Timeline milestones preview */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Quick Actions Panel */}
          <div className="p-5 border border-zinc-850 bg-[#111113]/40 rounded-2xl space-y-3.5">
            <span className="text-[9.5px] text-zinc-550 uppercase font-black tracking-widest block">Quick Navigation Desk</span>
            
            <div className="space-y-2 text-xs font-bold text-zinc-350">
              <button onClick={() => router.push("/portal/timeline")} className="w-full p-3 border border-zinc-855 bg-zinc-950/20 rounded-xl text-left hover:border-purple-500/25 transition-all flex justify-between items-center group">
                <span>View Timeline details</span>
                <ArrowRight size={12} className="text-zinc-650 group-hover:translate-x-0.5 transition-transform" />
              </button>
              
              <button onClick={() => router.push("/portal/invoices")} className="w-full p-3 border border-zinc-855 bg-zinc-950/20 rounded-xl text-left hover:border-purple-500/25 transition-all flex justify-between items-center group">
                <span>View Invoices & receipts</span>
                <ArrowRight size={12} className="text-zinc-650 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button onClick={() => router.push("/portal/support")} className="w-full p-3 border border-zinc-855 bg-zinc-950/20 rounded-xl text-left hover:border-purple-500/25 transition-all flex justify-between items-center group">
                <span>Contact support desk</span>
                <ArrowRight size={12} className="text-zinc-650 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Next milestone preview */}
          {nextMilestone && (
            <div className="p-5 border border-zinc-850 bg-[#111113]/40 rounded-2xl space-y-3.5">
              <span className="text-[9.5px] text-zinc-550 uppercase font-black tracking-widest block">Next Milestone Task</span>
              <div className="p-4 border border-purple-500/10 bg-purple-550/[0.01] rounded-xl space-y-1.5">
                <span className="text-[8px] font-mono text-purple-400 font-black uppercase tracking-wider">{new Date(nextMilestone.scheduledTime).toLocaleDateString()}</span>
                <h4 className="font-extrabold text-zinc-250 text-xs">{nextMilestone.title}</h4>
                <p className="text-[10px] text-zinc-500 leading-normal font-medium">{nextMilestone.description}</p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
