"use client";

import React from "react";
import { Clock, Calendar, DollarSign, User } from "lucide-react";
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

interface TimelineViewProps {
  leads: Lead[];
  teamMembers: TeamMember[];
  onLeadClick: (leadId: string) => void;
}

export default function TimelineView({ leads = [], teamMembers = [], onLeadClick }: TimelineViewProps) {
  // Sort leads by eventDate chronologically (leads with dates first)
  const sortedLeads = [...leads].sort((a, b) => {
    if (!a.eventDate) return 1;
    if (!b.eventDate) return -1;
    return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW":
        return "border-purple-500/20 bg-purple-500/5 text-purple-400";
      case "QUALIFIED":
        return "border-blue-500/20 bg-blue-500/5 text-blue-400";
      case "PROPOSAL_SENT":
        return "border-pink-500/20 bg-pink-500/5 text-pink-400";
      case "NEGOTIATION":
        return "border-amber-500/20 bg-amber-500/5 text-amber-400";
      case "BOOKED":
      case "WON":
      case "COMPLETED":
        return "border-emerald-500/20 bg-emerald-500/5 text-emerald-400";
      case "LOST":
        return "border-red-500/20 bg-red-500/5 text-red-400";
      default:
        return "border-zinc-800 bg-zinc-900 text-zinc-400";
    }
  };

  return (
    <div className="relative border-l border-zinc-900 ml-4 pl-6 space-y-6 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
      {sortedLeads.map((lead, idx) => {
        const assignee = teamMembers.find((m) => m.id === lead.assignedUserId);
        const assigneeName = assignee ? `${assignee.firstName} ${assignee.lastName}` : "Unassigned";

        return (
          <div key={lead.id} className="relative group">
            {/* Chronological node */}
            <span className="absolute -left-[31px] mt-1 h-3.5 w-3.5 rounded-full bg-purple-600 ring-4 ring-[#09090b] group-hover:scale-110 transition-transform" />
            
            <div 
              onClick={() => onLeadClick(lead.id)}
              className="p-5 border border-zinc-900 bg-[#161618]/30 hover:border-zinc-800 hover:bg-[#161618]/50 transition-all rounded-2xl cursor-pointer space-y-3 max-w-xl text-xs font-semibold"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="font-extrabold text-sm text-zinc-150 block group-hover:text-purple-400 transition-colors">
                    {lead.name}
                  </span>
                  <span className="text-[10px] text-zinc-550 block pt-0.5">
                    {lead.eventType}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-900/30 px-2 py-0.5 rounded-md font-bold block">
                    {lead.eventDate ? new Date(lead.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Date Pending"}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2.5 border-t border-zinc-900/60 text-[10px] font-bold text-zinc-500">
                <span className="font-mono text-emerald-450 text-xs">
                  ₹{lead.budget ? lead.budget.toLocaleString() : "0"}
                </span>

                <span className={cn("px-2.5 py-0.5 rounded-full border text-[9px]", getStatusColor(lead.status))}>
                  {lead.status}
                </span>

                <span className="text-zinc-500">
                  {assigneeName}
                </span>
              </div>
            </div>
          </div>
        );
      })}
      {leads.length === 0 && (
        <div className="text-center py-12 border border-dashed border-zinc-900 rounded-2xl text-zinc-500 italic -ml-4">
          No records match active parameters.
        </div>
      )}
    </div>
  );
}
