"use client";

import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  User, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Phone, 
  Briefcase, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Bookmark
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  eventType: string;
  eventDate?: string;
  budget: number;
  leadSource: string;
  status: string;
  notes?: string;
  assignedUserId?: string;
  contact?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  };
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
}

interface KanbanBoardProps {
  leads: Lead[];
  teamMembers: TeamMember[];
  onStageChange: (leadId: string, newStatus: string) => void;
  onLeadClick: (leadId: string) => void;
}

const COLUMNS = [
  { id: "NEW", label: "New Lead", color: "border-purple-500/30 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/10" },
  { id: "CONTACTED", label: "Contacted", color: "border-cyan-500/30 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-500/10" },
  { id: "QUALIFIED", label: "Qualified", color: "border-blue-500/30 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10" },
  { id: "PROPOSAL_SENT", label: "Proposal", color: "border-pink-500/30 text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-500/10" },
  { id: "NEGOTIATION", label: "Negotiating", color: "border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10" },
  { id: "WON", label: "Won / Booked", color: "border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10" },
  { id: "LOST", label: "Lost", color: "border-red-500/30 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10" },
  { id: "ARCHIVED", label: "Archived", color: "border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800/40" },
];

interface LeadMetadata {
  notesText: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  score: number;
  referral: string;
  probability: number;
  tags: string[];
}

function parseLeadMetadata(lead: Lead): LeadMetadata {
  const defaults: LeadMetadata = {
    notesText: lead.notes || "",
    priority: "MEDIUM",
    score: 50,
    referral: "",
    probability: 50,
    tags: []
  };

  if (lead.notes && lead.notes.startsWith("{")) {
    try {
      const parsed = JSON.parse(lead.notes);
      return {
        notesText: parsed.notes || "",
        priority: parsed.priority || "MEDIUM",
        score: typeof parsed.score === "number" ? parsed.score : 50,
        referral: parsed.referral || "",
        probability: typeof parsed.probability === "number" ? parsed.probability : 50,
        tags: Array.isArray(parsed.tags) ? parsed.tags : []
      };
    } catch (e) {}
  }
  return defaults;
}

export default function KanbanBoard({
  leads = [],
  teamMembers = [],
  onStageChange,
  onLeadClick,
}: KanbanBoardProps) {

  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    // Convert UI status column IDs back to standard backend statuses if needed
    let targetStatus = destination.droppableId;
    onStageChange(draggableId, targetStatus);
  };

  const getLeadsByStatus = (statusId: string) => {
    if (statusId === "WON") {
      return leads.filter((l) => ["WON", "BOOKED", "COMPLETED"].includes(l.status));
    }
    return leads.filter((l) => l.status === statusId);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex overflow-x-auto gap-5 pb-6 select-none items-start h-[calc(100vh-300px)] min-h-[500px]">
        {COLUMNS.map((col) => {
          const colLeads = getLeadsByStatus(col.id);
          const colTotalBudget = colLeads.reduce((sum, l) => sum + (l.budget || 0), 0);

          return (
            <div 
              key={col.id} 
              className="flex-1 min-w-[280px] max-w-[340px] rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-100/60 dark:bg-[#0c0d12]/80 flex flex-col max-h-full overflow-hidden shadow-sm"
            >
              {/* Column Header */}
              <div className="p-4 border-b border-slate-200/90 dark:border-white/[0.06] bg-slate-200/60 dark:bg-[#121319] flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase", col.color)}>
                    {col.label}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold">{colLeads.length}</span>
                </div>
                <span className="text-[10px] font-mono font-extrabold text-slate-700 dark:text-zinc-300">
                  ₹{(colTotalBudget / 100000).toFixed(1)} L
                </span>
              </div>

              {/* Droppable Card area */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex-1 overflow-y-auto p-3 space-y-3 min-h-[150px] transition-colors",
                      snapshot.isDraggingOver ? "bg-purple-500/[0.04]" : "bg-transparent"
                    )}
                  >
                    {colLeads.map((lead, idx) => {
                      const assignee = teamMembers.find((m) => m.id === lead.assignedUserId);
                      const assigneeName = assignee ? `${assignee.firstName} ${assignee.lastName[0]}.` : "Unassigned";
                      const meta = parseLeadMetadata(lead);

                      const priorityColor = 
                        meta.priority === "HIGH" ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" :
                        meta.priority === "MEDIUM" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" :
                        "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700";

                      const scoreColor = 
                        meta.score >= 70 ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" :
                        meta.score >= 40 ? "text-amber-600 dark:text-amber-400 bg-amber-500/10" :
                        "text-red-600 dark:text-red-400 bg-red-500/10";

                      return (
                        <Draggable key={lead.id} draggableId={lead.id} index={idx}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={provided.draggableProps.style as React.CSSProperties}
                              onClick={() => onLeadClick(lead.id)}
                              className={cn(
                                "p-4 border rounded-xl bg-white dark:bg-[#13141a] hover:border-purple-500/50 transition-all cursor-pointer space-y-3.5 select-none relative group shadow-sm hover:shadow-lg",
                                snapshot.isDragging
                                  ? "border-purple-600 bg-white dark:bg-[#1a1b24] shadow-2xl scale-[1.02]"
                                  : "border-slate-200/90 dark:border-white/[0.08]"
                              )}
                            >
                              {/* Client Info row */}
                              <div className="flex justify-between items-start gap-3">
                                <div className="space-y-1">
                                  <span className="font-extrabold text-xs text-slate-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-tight block">
                                    {lead.name}
                                  </span>
                                  <span className="text-[9px] text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider block">
                                    {lead.leadSource} {meta.referral ? `• ${meta.referral}` : ""}
                                  </span>
                                </div>

                                {/* Avatar Badge */}
                                <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-purple-500/15 border border-slate-200 dark:border-purple-500/30 flex items-center justify-center text-[10px] font-black text-slate-700 dark:text-purple-300 shrink-0 select-none">
                                  {getInitials(lead.name)}
                                </div>
                              </div>

                              {/* Tags row */}
                              {meta.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                  {meta.tags.slice(0, 3).map(t => (
                                    <span key={t} className="px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded text-[8px] font-bold text-slate-600 dark:text-zinc-300">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Specs row */}
                              <div className="flex justify-between items-center text-[10px] font-bold border-t border-slate-100 dark:border-white/[0.06] pt-2.5">
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 rounded-md font-bold">
                                  {lead.eventType}
                                </span>
                                <span className="font-mono tabular-nums font-extrabold text-emerald-600 dark:text-emerald-400">
                                  ₹{lead.budget ? lead.budget.toLocaleString("en-IN") : "0"}
                                </span>
                              </div>

                              {/* Footer details (Lead Score & Priority indicators) */}
                              <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 dark:text-zinc-400 pt-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-extrabold border uppercase", priorityColor)}>
                                    {meta.priority}
                                  </span>
                                  <span className={cn("px-1.5 py-0.5 rounded-full text-[8px] font-mono font-bold flex items-center gap-1", scoreColor)}>
                                    <TrendingUp size={8} />
                                    {meta.score}
                                  </span>
                                </div>
                                <span className="text-slate-600 dark:text-zinc-300 font-semibold max-w-[85px] truncate">
                                  {assigneeName}
                                </span>
                              </div>

                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                    {colLeads.length === 0 && (
                      <div className="text-center py-8 text-slate-400 dark:text-zinc-600 italic text-[10px]">
                        Drop leads here
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
