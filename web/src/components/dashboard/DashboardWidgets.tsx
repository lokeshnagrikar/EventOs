"use client";

import React, { useState } from "react";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  DollarSign, 
  ArrowRight,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Trash2,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CardSkeleton } from "@/components/ui/skeletons";

const formatEventDate = (dateVal: any) => {
  if (!dateVal) return "TBD";
  let date = new Date();
  if (Array.isArray(dateVal)) {
    const [year, month, day] = dateVal;
    date = new Date(year, (month || 1) - 1, day || 1);
  } else {
    date = new Date(dateVal);
  }
  if (isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// ─── Upcoming Events Widget ──────────────────────────────────────────────────
interface EventItem {
  id: string;
  name: string;
  type: string;
  location: string;
  startDate: string;
}

export function UpcomingEventsWidget({ 
  events = [], 
  isLoading = false 
}: { 
  events?: EventItem[]; 
  isLoading?: boolean;
}) {
  if (isLoading) return <CardSkeleton />;

  return (
    <div className="p-6 rounded-2xl border border-zinc-800 bg-[#161618]/30 hover:border-zinc-700/80 transition-colors space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
        <Calendar size={13} className="text-purple-400" />
        Upcoming schedules
      </h3>

      <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
        {events.map((evt) => (
          <div key={evt.id} className="flex justify-between items-center p-3 border border-zinc-850 rounded-xl bg-zinc-950/20 hover:border-purple-500/20 hover:bg-purple-500/[0.01] transition-all text-xs font-medium">
            <div>
              <span className="font-extrabold text-zinc-200 block">{evt.name}</span>
              <span className="text-[10px] text-zinc-550 block pt-0.5">{evt.type} • {evt.location || "Venue TBA"}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md font-bold">
                {formatEventDate(evt.startDate)}
              </span>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="text-center py-8 text-zinc-500 italic text-[11px]">
            No upcoming events scheduled.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Recent Leads Widget ─────────────────────────────────────────────────────
interface LeadItem {
  id: string;
  name: string;
  phone: string;
  eventType: string;
  budget: number;
}

export function RecentLeadsWidget({ 
  leads = [], 
  isLoading = false 
}: { 
  leads?: LeadItem[]; 
  isLoading?: boolean;
}) {
  if (isLoading) return <CardSkeleton />;

  return (
    <div className="p-6 rounded-2xl border border-zinc-800 bg-[#161618]/30 hover:border-zinc-700/80 transition-colors space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
        <Users size={13} className="text-purple-400" />
        Recent enquiries
      </h3>

      <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
        {leads.map((l) => (
          <div key={l.id} className="flex justify-between items-center p-3 border border-zinc-850 rounded-xl bg-zinc-950/20 hover:border-purple-500/20 hover:bg-purple-500/[0.01] transition-all text-xs font-medium">
            <div>
              <span className="font-extrabold text-zinc-200 block">{l.name}</span>
              <span className="text-[10px] text-zinc-550 block pt-0.5">{l.eventType} • {l.phone}</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-emerald-450 font-mono">
                ₹{l.budget ? l.budget.toLocaleString() : "0"}
              </span>
            </div>
          </div>
        ))}
        {leads.length === 0 && (
          <div className="text-center py-8 text-zinc-500 italic text-[11px]">
            No active lead enquiries.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Team Activity Feed Widget ───────────────────────────────────────────────
interface ActivityLog {
  id: string;
  time: string;
  message: string;
}

export function TeamActivityFeedWidget({ 
  logs = [], 
  isLoading = false 
}: { 
  logs?: ActivityLog[]; 
  isLoading?: boolean;
}) {
  if (isLoading) return <CardSkeleton />;

  return (
    <div className="p-6 rounded-2xl border border-zinc-800 bg-[#161618]/30 hover:border-zinc-700/80 transition-colors space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
        <Sparkles size={13} className="text-purple-400" />
        Activity Feed
      </h3>

      <div className="relative border-l border-zinc-850 pl-4 space-y-5 ml-2 py-1 max-h-[280px] overflow-y-auto">
        {logs.map((log, idx) => (
          <motion.div 
            key={log.id} 
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="relative"
          >
            {/* Timeline node */}
            <span className="absolute -left-[21px] mt-1 h-2.5 w-2.5 rounded-full bg-purple-500 ring-4 ring-[#111113]" />
            
            <div className="flex justify-between items-start gap-3">
              <p className="text-[11px] text-zinc-300 font-medium leading-normal">{log.message}</p>
              <span className="text-[9px] text-zinc-550 shrink-0 font-bold whitespace-nowrap">{log.time}</span>
            </div>
          </motion.div>
        ))}
        {logs.length === 0 && (
          <div className="text-zinc-500 italic text-[11px] py-6 text-center -ml-4">
            No activity logs found.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Booking Timeline progress Widget ─────────────────────────────────────────
export function BookingTimelineWidget({ isLoading = false }: { isLoading?: boolean }) {
  if (isLoading) return <CardSkeleton />;

  const TIMELINE_STEPS = [
    { label: "Lead Logged", date: "Jan 12", completed: true },
    { label: "Quote Drafted", date: "Jan 15", completed: true },
    { label: "Contract Signed", date: "Jan 18", completed: true },
    { label: "Advance Received", date: "Jan 20", completed: true },
    { label: "Final Execution", date: "Pending", completed: false },
  ];

  return (
    <div className="p-6 rounded-2xl border border-zinc-800 bg-[#161618]/30 hover:border-zinc-700/80 transition-colors space-y-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Standard Booking Sequence</h3>
        <p className="text-[11px] text-zinc-550">Active milestones tracker</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 overflow-x-auto relative">
        {TIMELINE_STEPS.map((step, idx) => (
          <div key={idx} className="flex sm:flex-col items-center gap-3 sm:gap-2 relative flex-1 min-w-[90px]">
            {/* Connector line */}
            {idx < TIMELINE_STEPS.length - 1 && (
              <div className="hidden sm:block absolute left-1/2 top-4 w-full h-[2px] bg-zinc-800 -z-10" />
            )}
            
            {/* Completion circle */}
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center border font-bold text-xs shrink-0 shadow-lg",
              step.completed
                ? "bg-purple-500/10 border-purple-500 text-purple-400"
                : "bg-zinc-950 border-zinc-800 text-zinc-650"
            )}>
              {idx + 1}
            </div>

            <div className="text-left sm:text-center">
              <span className="text-[10px] font-bold text-zinc-200 block">{step.label}</span>
              <span className="text-[9px] text-zinc-500 block font-semibold">{step.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Quote Funnel Pipeline Widget ────────────────────────────────────────────
export function QuotePipelineWidget({ isLoading = false }: { isLoading?: boolean }) {
  if (isLoading) return <CardSkeleton />;

  const FUNNEL_ITEMS = [
    { label: "New leads", value: "INR 18.2 L", percent: 100, color: "bg-purple-500" },
    { label: "Quotes Drafted", value: "INR 12.4 L", percent: 68, color: "bg-pink-500" },
    { label: "Quotes Sent", value: "INR 8.5 L", percent: 46, color: "bg-blue-500" },
    { label: "Booked contracts", value: "INR 5.2 L", percent: 28, color: "bg-emerald-500" },
  ];

  return (
    <div className="p-6 rounded-2xl border border-zinc-800 bg-[#161618]/30 hover:border-zinc-700/80 transition-colors space-y-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Leads-to-Bookings Funnel</h3>
        <p className="text-[11px] text-zinc-550">Quote pipeline progression value</p>
      </div>

      <div className="space-y-3 pt-2">
        {FUNNEL_ITEMS.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-zinc-400">{item.label}</span>
              <div className="flex gap-2">
                <span className="text-zinc-200">{item.value}</span>
                <span className="text-zinc-550 font-normal">({item.percent}%)</span>
              </div>
            </div>
            {/* Funnel Progress indicator */}
            <div className="h-2 w-full bg-zinc-900 border border-zinc-850 rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.percent}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
