"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LifeBuoy,
  Bug,
  Sparkles,
  Send,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Paperclip,
  Trash2,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageShell from "@/components/ui/PageShell";
import EmptyState from "@/components/ui/EmptyState";

interface Ticket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  open: { label: "Open", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: AlertCircle },
  in_progress: { label: "In Progress", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Loader2 },
  resolved: { label: "Resolved", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
  closed: { label: "Closed", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20", icon: CheckCircle2 },
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [mounted, setMounted] = useState(false);

  // Form state
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");
  const [formType, setFormType] = useState<"ticket" | "bug" | "feature">("ticket");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [openIds, setOpenIds] = useState<string[]>([]);

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Load tickets from localStorage
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("eventos_support_tickets");
    if (stored) {
      try { setTickets(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const saveTickets = (updatedTickets: Ticket[]) => {
    setTickets(updatedTickets);
    localStorage.setItem("eventos_support_tickets", JSON.stringify(updatedTickets));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newTicket: Ticket = {
        id: `TKT-${Date.now().toString(36).toUpperCase()}`,
        subject,
        category,
        priority,
        description,
        status: "open",
        createdAt: new Date().toISOString(),
      };
      saveTickets([newTicket, ...tickets]);
      setSubject("");
      setDescription("");
      setIsSubmitting(false);
      setSuccessMsg("Ticket submitted successfully! We'll respond within 4-8 business hours.");
      setTimeout(() => setSuccessMsg(""), 5000);
    }, 800);
  };

  const deleteTicket = (id: string) => {
    saveTickets(tickets.filter((t) => t.id !== id));
  };

  if (!mounted) return null;

  return (
    <PageShell
      title="Support Center"
      subtitle="Create tickets, report bugs, and request features"
      breadcrumbs={[{ label: "Help Center", href: "/help" }, { label: "Support" }]}
    >
      <div className="space-y-8 select-none text-zinc-300">
        {/* ── TYPE SELECTOR ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {([
            { type: "ticket" as const, label: "Support Ticket", description: "General help request", icon: LifeBuoy, color: "from-purple-500 to-indigo-500" },
            { type: "bug" as const, label: "Report a Bug", description: "Something isn't working", icon: Bug, color: "from-red-500 to-pink-500" },
            { type: "feature" as const, label: "Feature Request", description: "Suggest an improvement", icon: Sparkles, color: "from-amber-500 to-orange-500" },
          ]).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                onClick={() => setFormType(item.type)}
                className={cn(
                  "text-left p-5 rounded-2xl border transition-all cursor-pointer group",
                  formType === item.type ? "border-purple-500/20 bg-zinc-900/30" : "border-zinc-850 bg-zinc-950/20 hover:border-zinc-700"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("h-9 w-9 rounded-xl bg-gradient-to-tr flex items-center justify-center shadow-md", item.color)}>
                    <Icon size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-zinc-200 group-hover:text-white">{item.label}</p>
                    <p className="text-[9px] text-zinc-550 font-semibold">{item.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* ── TICKET FORM ───────────────────────────────────────────── */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="p-6 border border-zinc-850 rounded-2xl bg-zinc-950/20 space-y-5">
              <h3 className="text-sm font-extrabold text-zinc-200">
                {formType === "ticket" ? "Create Support Ticket" : formType === "bug" ? "Report a Bug" : "Request a Feature"}
              </h3>

              {successMsg && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-bold text-emerald-400">
                  <CheckCircle2 size={14} /> {successMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your issue..."
                  required
                  className="w-full px-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500/30 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500/30 font-semibold"
                  >
                    <option value="general">General</option>
                    <option value="crm">CRM</option>
                    <option value="events">Events</option>
                    <option value="finance">Finance</option>
                    <option value="gallery">Gallery</option>
                    <option value="billing">Billing</option>
                    <option value="authentication">Authentication</option>
                    <option value="technical">Technical</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500/30 font-semibold"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your issue in detail. Include steps to reproduce if reporting a bug..."
                  required
                  rows={5}
                  className="w-full px-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500/30 font-semibold resize-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <button type="button" className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold hover:text-zinc-300 cursor-pointer">
                  <Paperclip size={12} /> Attach Screenshot
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  {isSubmitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>

          {/* ── SLA INFO + CONTACT ────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 border border-zinc-850 rounded-2xl bg-zinc-950/20 space-y-3">
              <h4 className="text-xs font-extrabold text-zinc-300">Response SLA</h4>
              <div className="space-y-2">
                {[
                  { priority: "Critical", time: "< 2 hours", color: "text-red-400" },
                  { priority: "High", time: "< 4 hours", color: "text-amber-400" },
                  { priority: "Medium", time: "4-8 hours", color: "text-blue-400" },
                  { priority: "Low", time: "1-2 business days", color: "text-zinc-400" },
                ].map((sla) => (
                  <div key={sla.priority} className="flex items-center justify-between text-xs">
                    <span className={cn("font-bold", sla.color)}>{sla.priority}</span>
                    <span className="text-zinc-500 font-semibold flex items-center gap-1"><Clock size={9} /> {sla.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 border border-zinc-850 rounded-2xl bg-zinc-950/20 space-y-3">
              <h4 className="text-xs font-extrabold text-zinc-300">Contact Options</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-zinc-400 font-semibold">
                  <MessageSquare size={12} className="text-purple-400" /> support@eventos.dev
                </div>
                <div className="flex items-center gap-2 text-zinc-400 font-semibold">
                  <MessageSquare size={12} className="text-purple-400" /> Workspace Chat (real-time)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SUBMITTED TICKETS ── */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-zinc-500 tracking-wider">Your Tickets</h3>
          {tickets.length === 0 ? (
            <EmptyState icon={LifeBuoy} title="No tickets" description="You haven't submitted any support tickets yet." />
          ) : (
            <div className="border border-zinc-850 rounded-2xl bg-zinc-950/20 divide-y divide-zinc-850/50 overflow-hidden">
              {tickets.map((ticket) => {
                const statusCfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                const StatusIcon = statusCfg.icon;
                const isExpanded = openIds.includes(ticket.id);
                return (
                  <div key={ticket.id} className="transition-all">
                    <div
                      onClick={() => toggleOpen(ticket.id)}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-900/10 cursor-pointer group select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[10px] font-mono text-zinc-600 font-bold shrink-0">{ticket.id}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-200 truncate">{ticket.subject}</p>
                          <p className="text-[9px] text-zinc-550 font-semibold">{ticket.category} • {ticket.priority} priority • {new Date(ticket.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-wider", statusCfg.color)}>
                          <StatusIcon size={9} /> {statusCfg.label}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTicket(ticket.id);
                          }}
                          className="text-zinc-700 hover:text-red-500 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className="border-t border-zinc-900/60 bg-zinc-950/40"
                        >
                          <div className="px-12 py-4 space-y-4">
                            {/* Ticket Description */}
                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block">Description</span>
                              <p className="text-[11px] text-zinc-300 leading-relaxed font-semibold">{ticket.description}</p>
                            </div>

                            {/* Timeline Comments */}
                            <div className="space-y-3">
                              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block">Timeline Comments</span>
                              <div className="space-y-2 border-l border-zinc-850 pl-3 ml-1">
                                <div className="space-y-0.5 relative">
                                  <div className="absolute -left-[16px] top-1.5 h-1.5 w-1.5 rounded-full bg-purple-500" />
                                  <div className="flex items-center justify-between text-[9px] font-bold text-zinc-500">
                                    <span>You (Creator)</span>
                                    <span>{new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <p className="text-[10px] text-zinc-400 font-medium">Submitted this ticket.</p>
                                </div>

                                <div className="space-y-0.5 relative">
                                  <div className="absolute -left-[16px] top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <div className="flex items-center justify-between text-[9px] font-bold text-zinc-500">
                                    <span>EventOS Agent (Automation)</span>
                                    <span>Just now</span>
                                  </div>
                                  <p className="text-[10px] text-emerald-400/90 font-bold">Ticket routed to the Support Queue. Standard response time: {ticket.priority === "critical" ? "< 2 hours" : ticket.priority === "high" ? "< 4 hours" : "4-8 hours"}.</p>
                                </div>
                              </div>
                            </div>

                            {/* System Metadata Card */}
                            <div className="p-3 bg-zinc-900/30 border border-zinc-900 rounded-xl space-y-1">
                              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Diagnostic Metadata</span>
                              <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-zinc-500 font-bold">
                                <div>OS: Windows 11</div>
                                <div>Browser: Chrome v125</div>
                                <div>URL: /help/support</div>
                                <div>Workspace: WS-ROY-WEDDINGS</div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
