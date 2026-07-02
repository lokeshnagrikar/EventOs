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
  { id: "NEW", label: "New Lead", color: "border-purple-500/20 text-purple-400 bg-purple-500/5" },
  { id: "CONTACTED", label: "Contacted", color: "border-cyan-500/20 text-cyan-400 bg-cyan-500/5" },
  { id: "QUALIFIED", label: "Qualified", color: "border-blue-500/20 text-blue-400 bg-blue-500/5" },
  { id: "PROPOSAL_SENT", label: "Proposal", color: "border-pink-500/20 text-pink-400 bg-pink-500/5" },
  { id: "NEGOTIATION", label: "Negotiating", color: "border-amber-500/20 text-amber-400 bg-amber-500/5" },
  { id: "WON", label: "Won / Booked", color: "border-emerald-500/20 text-emerald-450 bg-emerald-500/5" },
  { id: "LOST", label: "Lost", color: "border-red-500/20 text-red-400 bg-red-500/5" },
  { id: "ARCHIVED", label: "Archived", color: "border-zinc-500/20 text-zinc-400 bg-zinc-500/5" },
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
              className="flex-1 min-w-[280px] max-w-[340px] rounded-2xl border border-zinc-900 bg-zinc-950/20 flex flex-col max-h-full overflow-hidden backdrop-blur-md"
            >
              {/* Column Header */}
              <div className="p-4 border-b border-zinc-900/60 bg-zinc-900/20 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase", col.color)}>
                    {col.label}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-bold">{colLeads.length}</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-zinc-400">
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
                      snapshot.isDraggingOver ? "bg-purple-550/[0.02]" : "bg-transparent"
                    )}
                  >
                    {colLeads.map((lead, idx) => {
                      const assignee = teamMembers.find((m) => m.id === lead.assignedUserId);
                      const assigneeName = assignee ? `${assignee.firstName} ${assignee.lastName[0]}.` : "Unassigned";
                      const meta = parseLeadMetadata(lead);

                      const priorityColor = 
                        meta.priority === "HIGH" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        meta.priority === "MEDIUM" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-zinc-800 text-zinc-400 border-zinc-700";

                      const scoreColor = 
                        meta.score >= 70 ? "text-emerald-400 bg-emerald-500/10" :
                        meta.score >= 40 ? "text-amber-400 bg-amber-500/10" :
                        "text-red-400 bg-red-500/10";

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
                                "p-4 border rounded-xl bg-[#161618]/30 hover:bg-zinc-900/10 hover:border-purple-500/30 transition-all cursor-pointer space-y-3.5 select-none relative group backdrop-blur-sm",
                                snapshot.isDragging ? "border-purple-600 bg-zinc-900/90 shadow-2xl scale-[1.02]" : "border-zinc-850/60"
                              )}
                            >
                              {/* Client Info row */}
                              <div className="flex justify-between items-start gap-3">
                                <div className="space-y-1">
                                  <span className="font-extrabold text-xs text-zinc-150 group-hover:text-purple-400 transition-colors leading-tight block">
                                    {lead.name}
                                  </span>
                                  <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-wider block">
                                    {lead.leadSource} {meta.referral ? `• ${meta.referral}` : ""}
                                  </span>
                                </div>

                                {/* Avatar Badge */}
                                <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-zinc-850 to-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-400 shrink-0 select-none">
                                  {getInitials(lead.name)}
                                </div>
                              </div>

                              {/* Tags row */}
                              {meta.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                  {meta.tags.slice(0, 3).map(t => (
                                    <span key={t} className="px-1.5 py-0.5 bg-zinc-900/80 border border-zinc-850 rounded text-[8px] font-bold text-zinc-400">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Specs row */}
                              <div className="flex justify-between items-center text-[10px] font-bold border-t border-zinc-900/40 pt-2.5">
                                <span className="px-2 py-0.5 bg-zinc-900/60 border border-zinc-850 text-zinc-400 rounded-md">
                                  {lead.eventType}
                                </span>
                                <span className="font-mono text-emerald-450">
                                  ₹{lead.budget ? lead.budget.toLocaleString() : "0"}
                                </span>
                              </div>

                              {/* Footer details (Lead Score & Priority indicators) */}
                              <div className="flex justify-between items-center text-[9px] font-bold text-zinc-500 pt-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-extrabold border uppercase", priorityColor)}>
                                    {meta.priority}
                                  </span>
                                  <span className={cn("px-1.5 py-0.5 rounded-full text-[8px] font-mono font-bold flex items-center gap-1", scoreColor)}>
                                    <Sparkles size={8} />
                                    {meta.score}
                                  </span>
                                </div>
                                <span className="text-zinc-500 font-semibold max-w-[85px] truncate">
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
                      <div className="text-center py-8 text-zinc-700 italic text-[10px]">
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
