"use client";

import React from "react";
import { User, Phone, Mail, Clock, DollarSign, Square, CheckSquare } from "lucide-react";
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
  assignedUserId?: string;
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
}

interface ListViewProps {
  leads: Lead[];
  teamMembers: TeamMember[];
  onLeadClick: (leadId: string) => void;
  selectedLeadIds?: string[];
  onToggleSelectLead?: (leadId: string) => void;
  isCompact?: boolean;
}

export default function ListView({ 
  leads = [], 
  teamMembers = [], 
  onLeadClick,
  selectedLeadIds = [],
  onToggleSelectLead,
  isCompact = false
}: ListViewProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW":
        return "border-purple-500/20 bg-purple-500/5 text-purple-400";
      case "CONTACTED":
        return "border-cyan-500/20 bg-cyan-500/5 text-cyan-400";
      case "QUALIFIED":
        return "border-blue-500/20 bg-blue-500/5 text-blue-400";
      case "PROPOSAL_SENT":
        return "border-pink-500/20 bg-pink-500/5 text-pink-400";
      case "NEGOTIATION":
        return "border-amber-500/20 bg-amber-500/5 text-amber-400";
      case "BOOKED":
      case "WON":
      case "COMPLETED":
        return "border-emerald-500/20 bg-emerald-500/5 text-emerald-450";
      case "LOST":
        return "border-red-500/20 bg-red-500/5 text-red-400";
      case "ARCHIVED":
        return "border-zinc-500/20 bg-zinc-500/5 text-zinc-400";
      default:
        return "border-zinc-800 bg-zinc-900 text-zinc-400";
    }
  };

  return (
    <div className={cn("space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1", isCompact ? "space-y-1.5" : "space-y-3")}>
      {leads.map((lead) => {
        const assignee = teamMembers.find((m) => m.id === lead.assignedUserId);
        const assigneeName = assignee ? `${assignee.firstName} ${assignee.lastName[0]}.` : "Unassigned";
        const isSelected = selectedLeadIds.includes(lead.id);

        return (
          <div
            key={lead.id}
            onClick={() => onLeadClick(lead.id)}
            className={cn(
              "border border-zinc-900 bg-[#161618]/30 hover:border-zinc-800 hover:bg-[#161618]/50 transition-all rounded-2xl cursor-pointer flex justify-between items-center gap-4 text-xs font-semibold select-none",
              isCompact ? "p-2.5 rounded-xl" : "p-4",
              isSelected ? "border-purple-550/40 bg-purple-550/[0.02]" : ""
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Checkbox selector */}
              {onToggleSelectLead && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelectLead(lead.id);
                  }}
                  className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition cursor-pointer"
                >
                  {isSelected ? (
                    <CheckSquare size={13} className="text-purple-400" />
                  ) : (
                    <Square size={13} />
                  )}
                </div>
              )}

              {!isCompact && (
                <div className="h-7 w-7 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-400 font-bold shrink-0 text-[10px]">
                  {lead.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              
              <div className="min-w-0">
                <span className={cn("font-extrabold text-zinc-200 block truncate", isCompact ? "text-xs" : "")}>
                  {lead.name}
                </span>
                {!isCompact && (
                  <span className="text-[10px] text-zinc-550 block pt-0.5">
                    {lead.phone || "No phone"} • {lead.email || "No email"}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 text-zinc-450 shrink-0">
              <span className="px-2 py-0.5 border border-zinc-850 bg-zinc-900/60 rounded-md font-bold text-[10px]">
                {lead.eventType}
              </span>
              
              {!isCompact && (
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {lead.eventDate ? new Date(lead.eventDate).toLocaleDateString() : "TBA"}
                </span>
              )}

              <span className="font-mono tabular-nums font-bold text-emerald-450">
                ₹{lead.budget ? lead.budget.toLocaleString("en-IN") : "0"}
              </span>

              <span className={cn("px-2.5 py-0.5 rounded-full border text-[9px] font-bold", getStatusColor(lead.status))}>
                {lead.status}
              </span>

              <span className="text-zinc-500 font-semibold max-w-[85px] truncate">
                {assigneeName}
              </span>
            </div>
          </div>
        );
      })}
      {leads.length === 0 && (
        <div className="text-center py-12 border border-dashed border-zinc-900 rounded-2xl text-zinc-500 italic">
          No records match search parameters.
        </div>
      )}
    </div>
  );
}
