"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";

interface Quote {
  id: string;
  quoteNumber: string;
  status: "DRAFT" | "SENT" | "APPROVED" | "REJECTED";
  total: number;
}

interface Invoice {
  id: string;
  totalAmount: number;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
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

export default function ClientDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("Client");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("user_name");
      if (storedName) {
        setUserName(storedName);
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

  // Metrics
  const pendingQuotesCount = clientQuotes.filter(q => q.status === "SENT").length;
  const unpaidInvoicesTotal = clientInvoices
    .filter(i => i.status !== "PAID" && i.status !== "CANCELLED")
    .reduce((sum, i) => sum + i.totalAmount, 0);
  const nextMilestone = clientTimeline
    .filter(t => !t.completed)
    .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())[0];

  const isLoading = loadingQuotes || loadingInvoices || loadingEvents || loadingTimeline;

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="animate-spin text-purple-500" size={32} />
        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Compiling Event Overview...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-in">
      {/* Dynamic Welcome Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Hello, {userName} <Sparkles className="text-purple-400" size={20} />
          </h2>
          <p className="text-xs text-zinc-400 mt-1.5">
            Welcome to your Client Portal. Here is a real-time summary of your upcoming event coordinates, billing, and proposals.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-[#111113]/90 border border-zinc-800 px-4 py-2 rounded-xl text-xs font-semibold">
          <span className="text-zinc-500">Active Bookings:</span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 font-bold font-mono">
            {eventsList.length}
          </span>
        </div>
      </header>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Next Milestone Card */}
        <div className="p-6 rounded-2xl border border-zinc-850 bg-[#111113]/55 shadow-sm flex flex-col justify-between min-h-[150px] relative overflow-hidden group hover:border-purple-650/40 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Next Milestone</span>
            <div className="h-8 w-8 rounded-full bg-purple-600/10 flex items-center justify-center text-purple-400">
              <Clock size={14} />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-200 truncate">
              {nextMilestone ? nextMilestone.title : "All tasks complete!"}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1.5 font-medium">
              {nextMilestone
                ? `Due: ${new Date(nextMilestone.scheduledTime).toLocaleDateString()}`
                : "No outstanding timeline events."}
            </p>
          </div>
        </div>

        {/* Proposals Pending Card */}
        <div className="p-6 rounded-2xl border border-zinc-850 bg-[#111113]/55 shadow-sm flex flex-col justify-between min-h-[150px] group hover:border-purple-650/40 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Pending Proposals</span>
            <div className="h-8 w-8 rounded-full bg-purple-600/10 flex items-center justify-center text-purple-400">
              <FileText size={14} />
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-3xl font-black text-white">{pendingQuotesCount}</p>
              <p className="text-[10px] text-zinc-500 mt-1">Awaiting contract feedback</p>
            </div>
            <button
              onClick={() => router.push("/portal/quotes")}
              className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-purple-400 hover:text-purple-300 transition-all shadow-sm"
              aria-label="View Proposals"
            >
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Unpaid Balance Card */}
        <div className="p-6 rounded-2xl border border-zinc-850 bg-[#111113]/55 shadow-sm flex flex-col justify-between min-h-[150px] group hover:border-purple-650/40 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Outstanding Balance</span>
            <div className="h-8 w-8 rounded-full bg-purple-600/10 flex items-center justify-center text-purple-400">
              <DollarSign size={14} />
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-2xl font-black text-white font-mono">INR {unpaidInvoicesTotal.toLocaleString()}</p>
              <p className="text-[10px] text-zinc-500 mt-1">Due across active statements</p>
            </div>
            <button
              onClick={() => router.push("/portal/invoices")}
              className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-purple-400 hover:text-purple-300 transition-all shadow-sm"
              aria-label="View Invoices"
            >
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Sub-grid Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Active Bookings Details */}
        <div className="p-6 rounded-2xl border border-zinc-850 bg-[#111113]/40 space-y-6">
          <div>
            <h3 className="text-sm font-bold uppercase text-zinc-400 tracking-wider">Active Event Profile</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Specifications of active bookings, timelines, and budgets.</p>
          </div>
          
          <div className="space-y-4">
            {eventsList.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 border border-dashed border-zinc-850 rounded-xl bg-zinc-950/20 text-xs">
                No active bookings registered under this profile.
              </div>
            ) : (
              eventsList.map((event) => (
                <div
                  key={event.id}
                  className="p-4 border border-zinc-850 rounded-xl bg-zinc-900/35 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-200">{event.name}</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 font-semibold uppercase">{event.type}</p>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-900/30 font-bold uppercase rounded-md">
                      {event.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-3.5 border-t border-zinc-850/60 text-[10px] text-zinc-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={11} className="text-zinc-550 shrink-0" />
                      <span>{new Date(event.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={11} className="text-zinc-550 shrink-0" />
                      <span className="truncate">{event.location || "TBD (To Be Determined)"}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Timeline Quick Preview */}
        <div className="p-6 rounded-2xl border border-zinc-850 bg-[#111113]/40 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold uppercase text-zinc-400 tracking-wider">Timeline Milestones</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">Upcoming task actions and checkpoints.</p>
            </div>
            <button
              onClick={() => router.push("/portal/timeline")}
              className="text-[11px] text-purple-400 font-bold hover:underline"
            >
              Full Schedule
            </button>
          </div>

          <div className="relative border-l border-zinc-850 pl-5 space-y-6 text-xs ml-2 py-1">
            {clientTimeline.length === 0 ? (
              <div className="text-center py-10 text-zinc-550 text-[11px]">
                Milestones will appear once your timeline is compiled.
              </div>
            ) : (
              clientTimeline.slice(0, 3).map((item) => (
                <div key={item.id} className="relative">
                  <div className={`absolute -left-[23px] top-0.5 h-2.5 w-2.5 rounded-full ring-4 ring-[#111113] ${
                    item.completed ? "bg-emerald-500" : "bg-purple-650"
                  }`} />
                  <p className="font-bold text-[10px] text-zinc-500 font-mono">
                    {new Date(item.scheduledTime).toLocaleDateString()}
                  </p>
                  <h4 className={`text-xs font-bold text-zinc-200 mt-0.5 ${item.completed ? "line-through text-zinc-500" : ""}`}>
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-zinc-450 mt-1 leading-normal">{item.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
