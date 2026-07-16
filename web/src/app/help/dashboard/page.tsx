"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LifeBuoy,
  CheckCircle2,
  Clock,
  Smile,
  Search,
  User,
  Users,
  Trash2,
  AlertCircle,
  HelpCircle,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageShell from "@/components/ui/PageShell";
import EmptyState from "@/components/ui/EmptyState";
import { useToastStore } from "@/lib/toastStore";
import { INITIAL_NPS_FEEDBACK, NpsFeedbackItem } from "@/lib/successData";
import { getAIConfig } from "@/lib/aiProvider";

interface Ticket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  createdAt: string;
  assignedTo?: string;
}

const PRIORITY_COLORS = {
  low: "bg-zinc-800 text-zinc-400",
  medium: "bg-blue-500/10 text-blue-400",
  high: "bg-amber-500/10 text-amber-400",
  critical: "bg-red-500/10 text-red-400",
};

export default function SuccessDashboardPage() {
  const router = useRouter();
  const { addToast } = useToastStore();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [feedbackList, setFeedbackList] = useState<NpsFeedbackItem[]>([]);
  const [mounted, setMounted] = useState(false);

  const [activeSubTab, setActiveSubTab] = useState<"tickets" | "nps">("tickets");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
    // Load tickets
    const storedTickets = localStorage.getItem("eventos_support_tickets");
    if (storedTickets) {
      try { setTickets(JSON.parse(storedTickets)); } catch { /* ignore */ }
    }

    // Load NPS Feedback
    const storedFeedback = localStorage.getItem("eventos_nps_feedback");
    if (storedFeedback) {
      try {
        setFeedbackList(JSON.parse(storedFeedback));
      } catch {
        setFeedbackList(INITIAL_NPS_FEEDBACK);
      }
    } else {
      setFeedbackList(INITIAL_NPS_FEEDBACK);
      localStorage.setItem("eventos_nps_feedback", JSON.stringify(INITIAL_NPS_FEEDBACK));
    }
  }, []);

  const saveTickets = (updated: Ticket[]) => {
    setTickets(updated);
    localStorage.setItem("eventos_support_tickets", JSON.stringify(updated));
  };

  const handleResolveTicket = (id: string) => {
    const updated = tickets.map((t) => {
      if (t.id === id) {
        addToast(`Ticket ${id} marked as resolved.`, "success");
        return { ...t, status: "resolved" as const };
      }
      return t;
    });
    saveTickets(updated);
  };

  const handleAssignAgent = (id: string, agent: string) => {
    const updated = tickets.map((t) => {
      if (t.id === id) {
        addToast(`Ticket assigned to ${agent}.`, "info");
        return { ...t, assignedTo: agent, status: "in_progress" as const };
      }
      return t;
    });
    saveTickets(updated);
  };

  const handleDeleteTicket = (id: string) => {
    const updated = tickets.filter((t) => t.id !== id);
    saveTickets(updated);
    addToast("Ticket permanently deleted.", "success");
  };

  const filteredTickets = useMemo(() => {
    if (!searchQuery.trim()) return tickets;
    const q = searchQuery.toLowerCase();
    return tickets.filter((t) => t.subject.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
  }, [tickets, searchQuery]);

  const filteredNps = useMemo(() => {
    if (!searchQuery.trim()) return feedbackList;
    const q = searchQuery.toLowerCase();
    return feedbackList.filter((f) => f.suggestion.toLowerCase().includes(q) || f.user.toLowerCase().includes(q));
  }, [feedbackList, searchQuery]);

  // SLA Calculation
  const avgResponseTime = "4.2 hours";
  const csatScore = "94.6%";

  if (!mounted) return null;

  return (
    <PageShell
      title="Customer Success Console"
      subtitle="Track open support tickets, monitor average response SLA times, and analyze customer feedback logs."
      breadcrumbs={[{ label: "Help Center", href: "/help" }, { label: "Admin Console" }]}
    >
      <div className="space-y-6 select-none text-zinc-300">
        
        {/* ── KPI METRICS CARDS ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 border border-zinc-855 bg-zinc-950/20 backdrop-blur-md rounded-2xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-2xl font-black text-white">
                  {tickets.filter((t) => t.status === "open" || t.status === "in_progress").length}
                </p>
                <p className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider mt-1">Open Tickets</p>
              </div>
              <div className="h-8 w-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <LifeBuoy size={14} />
              </div>
            </div>
          </div>

          <div className="p-5 border border-zinc-855 bg-zinc-950/20 backdrop-blur-md rounded-2xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-2xl font-black text-white">
                  {tickets.filter((t) => t.status === "resolved" || t.status === "closed").length}
                </p>
                <p className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider mt-1">Resolved Tickets</p>
              </div>
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={14} />
              </div>
            </div>
          </div>

          <div className="p-5 border border-zinc-855 bg-zinc-950/20 backdrop-blur-md rounded-2xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-2xl font-black text-white">{avgResponseTime}</p>
                <p className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider mt-1">Avg SLA Response Time</p>
              </div>
              <div className="h-8 w-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Clock size={14} />
              </div>
            </div>
          </div>

          <div className="p-5 border border-zinc-855 bg-zinc-950/20 backdrop-blur-md rounded-2xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-2xl font-black text-white">{csatScore}</p>
                <p className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider mt-1">Customer CSAT Score</p>
              </div>
              <div className="h-8 w-8 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                <Smile size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* ── SUB-TABS SELECTOR ────────────────────────────────────────────── */}
        <div className="flex border-b border-zinc-850 text-xs font-black uppercase tracking-wider text-zinc-500">
          <button
            onClick={() => { setActiveSubTab("tickets"); setSearchQuery(""); }}
            className={cn(
              "px-5 py-3 border-b-2 transition-all cursor-pointer",
              activeSubTab === "tickets"
                ? "border-purple-650 text-purple-400 font-bold"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            )}
          >
            Manage Support Tickets ({tickets.length})
          </button>
          <button
            onClick={() => { setActiveSubTab("nps"); setSearchQuery(""); }}
            className={cn(
              "px-5 py-3 border-b-2 transition-all cursor-pointer",
              activeSubTab === "nps"
                ? "border-purple-650 text-purple-400 font-bold"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            )}
          >
            NPS & Feedback Logs ({feedbackList.length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-550">
            <Search size={13} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeSubTab === "tickets" ? "Search tickets..." : "Search feedback..."}
            className="w-full pl-9 pr-4 py-2 bg-zinc-950/40 border border-zinc-850 rounded-xl text-xs placeholder-zinc-650 text-zinc-200 focus:outline-none"
          />
        </div>

        {/* ── TICKETS MANAGEMENT TAB ──────────────────────────────────────── */}
        {activeSubTab === "tickets" && (
          <div className="space-y-4">
            {filteredTickets.length === 0 ? (
              <EmptyState icon={LifeBuoy} title="No support tickets" description="No support tickets matches search terms." />
            ) : (
              <div className="border border-zinc-850 rounded-2xl bg-zinc-950/20 overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-zinc-950/40 text-[9px] font-black uppercase tracking-wider text-zinc-550 border-b border-zinc-850/60">
                      <tr>
                        <th className="px-5 py-3">Ticket ID</th>
                        <th className="px-5 py-3">Subject</th>
                        <th className="px-5 py-3">Category</th>
                        <th className="px-5 py-3 text-center">Priority</th>
                        <th className="px-5 py-3 text-center">Created Date</th>
                        <th className="px-5 py-3 text-center">Assigned Agent</th>
                        <th className="px-5 py-3 text-center">Status</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850/40">
                      {filteredTickets.map((t) => (
                        <tr key={t.id} className="hover:bg-zinc-900/10 transition-colors group">
                          <td className="px-5 py-3.5 font-mono text-zinc-500 font-bold">{t.id}</td>
                          <td className="px-5 py-3.5 font-bold text-zinc-200">
                            <div className="flex flex-col">
                              <span>{t.subject}</span>
                              <span className="text-[9px] text-zinc-550 font-semibold line-clamp-1 mt-0.5">{t.description.slice(0, 80)}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-semibold">
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-zinc-900 border border-zinc-850 text-purple-400">
                              {t.category}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center font-bold">
                            <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider", PRIORITY_COLORS[t.priority as keyof typeof PRIORITY_COLORS] || "bg-zinc-800 text-zinc-400")}>
                              {t.priority}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center font-semibold text-zinc-500 font-mono text-[10px]">
                            {new Date(t.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <select
                              value={t.assignedTo || ""}
                              onChange={(e) => handleAssignAgent(t.id, e.target.value)}
                              className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-bold text-zinc-300 focus:outline-none"
                            >
                              <option value="">Unassigned</option>
                              <option value="Roy Admin">Roy Admin</option>
                              <option value="Sarah CS agent">Sarah CS Agent</option>
                              <option value="Alex Support">Alex Support</option>
                            </select>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={cn(
                              "px-2 py-0.5 rounded-md text-[8px] font-black uppercase border tracking-wider",
                              t.status === "resolved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : t.status === "in_progress" ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            )}>
                              {t.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex justify-end items-center gap-2">
                              {t.status !== "resolved" && (
                                <button
                                  onClick={() => handleResolveTicket(t.id)}
                                  className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  Resolve
                                </button>
                              )}
                              <button onClick={() => handleDeleteTicket(t.id)} className="p-1 text-zinc-700 hover:text-red-500 transition-colors cursor-pointer opacity-0 group-hover:opacity-100">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── NPS & FEEDBACK TAB ──────────────────────────────────────────── */}
        {activeSubTab === "nps" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNps.map((feed) => (
              <div key={feed.id} className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{feed.emoji}</span>
                    <div>
                      <h4 className="text-xs font-extrabold text-zinc-200">{feed.user}</h4>
                      <p className="text-[8px] text-zinc-600 font-mono mt-0.5">{new Date(feed.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {/* NPS score badge */}
                  <span className={cn(
                    "h-8 w-8 rounded-xl flex items-center justify-center font-black text-xs border shadow-sm",
                    feed.score >= 9 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : feed.score >= 7 ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      : "bg-red-500/10 border-red-500/20 text-red-400"
                  )}>
                    {feed.score}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed font-semibold">{feed.suggestion}</p>

                <div className="flex justify-end pt-2 border-t border-zinc-850/50">
                  <span className="text-[8px] text-purple-400/60 font-black uppercase bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded-md">
                    {feed.category}
                  </span>
                </div>
              </div>
            ))}
            {filteredNps.length === 0 && (
              <div className="md:col-span-2">
                <EmptyState icon={Smile} title="No feedback logs" description="No customer feedback rating logs recorded." />
              </div>
            )}
          </div>
        )}

      </div>
    </PageShell>
  );
}
