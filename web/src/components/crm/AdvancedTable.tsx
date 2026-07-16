"use client";

import React, { useState } from "react";
import { 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Search, 
  SlidersHorizontal,
  Plus,
  HelpCircle,
  Clock,
  Briefcase,
  DollarSign,
  Square,
  CheckSquare
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

interface AdvancedTableProps {
  leads: Lead[];
  teamMembers: TeamMember[];
  onLeadClick: (leadId: string) => void;
  searchQuery?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalElements: number;
  };
  onPageChange?: (page: number) => void;
  selectedLeadIds?: string[];
  onToggleSelectLead?: (leadId: string) => void;
  onSelectAllLeads?: (leadIds: string[]) => void;
}

function Highlight({ text, search }: { text: string; search: string }) {
  if (!search || !text) return <span>{text}</span>;
  const parts = text.split(new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, "gi"));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === search.toLowerCase() ? (
          <mark key={i} className="bg-purple-650 text-white rounded px-0.5 font-bold">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

export default function AdvancedTable({
  leads = [],
  teamMembers = [],
  onLeadClick,
  searchQuery = "",
  pagination,
  onPageChange,
  selectedLeadIds = [],
  onToggleSelectLead,
  onSelectAllLeads,
}: AdvancedTableProps) {
  const [sortField, setSortField] = useState<keyof Lead>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (field: keyof Lead) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedLeads = [...leads].sort((a, b) => {
    let valA = a[sortField] || "";
    let valB = b[sortField] || "";
    if (typeof valA === "number" && typeof valB === "number") {
      return sortDirection === "asc" ? valA - valB : valB - valA;
    }
    return sortDirection === "asc" 
      ? String(valA).localeCompare(String(valB)) 
      : String(valB).localeCompare(String(valA));
  });

  const exportToCSV = () => {
    const headers = ["Name", "Phone", "Email", "Event Type", "Event Date", "Budget", "Source", "Status"];
    const rows = sortedLeads.map((l) => [
      l.name,
      l.phone || "",
      l.email || "",
      l.eventType,
      l.eventDate || "",
      l.budget,
      l.leadSource,
      l.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EventOS_CRM_Leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      case "WON":
      case "BOOKED":
      case "COMPLETED":
        return "border-emerald-500/20 bg-emerald-500/5 text-emerald-455";
      case "LOST":
        return "border-red-500/20 bg-red-500/5 text-red-405";
      case "ARCHIVED":
        return "border-zinc-500/20 bg-zinc-550/5 text-zinc-400";
      default:
        return "border-zinc-800 bg-zinc-900 text-zinc-400";
    }
  };

  const allSelected = sortedLeads.length > 0 && sortedLeads.every(l => selectedLeadIds.includes(l.id));

  const handleSelectAll = () => {
    if (!onSelectAllLeads) return;
    if (allSelected) {
      // Unselect all in current view
      const leadIdsToKeep = selectedLeadIds.filter(id => !sortedLeads.some(l => l.id === id));
      onSelectAllLeads(leadIdsToKeep);
    } else {
      // Select all in current view
      const uniqueIds = Array.from(new Set([...selectedLeadIds, ...sortedLeads.map(l => l.id)]));
      onSelectAllLeads(uniqueIds);
    }
  };

  return (
    <div className="border border-zinc-900 bg-zinc-950/20 rounded-2xl overflow-hidden flex flex-col justify-between">
      
      {/* Header Toolbar */}
      <div className="p-4 border-b border-zinc-900 bg-zinc-950/40 flex items-center justify-between gap-4 flex-wrap">
        <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest">Leads Ledger</span>
        
        <button
          onClick={exportToCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-300 transition-all cursor-pointer"
        >
          <Download size={13} />
          Export Ledger
        </button>
      </div>

      {/* Table grid */}
      <div className="overflow-x-auto text-xs font-semibold">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-900 bg-zinc-900/30 text-zinc-500 font-bold select-none">
              {onToggleSelectLead && (
                <th className="p-4 w-10">
                  <div 
                    onClick={handleSelectAll}
                    className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white transition cursor-pointer"
                  >
                    {allSelected ? <CheckSquare size={13} className="text-purple-400" /> : <Square size={13} />}
                  </div>
                </th>
              )}
              <th className="p-4 cursor-pointer hover:text-zinc-300 transition-colors" onClick={() => handleSort("name")}>
                Client Name <ArrowUpDown size={11} className="inline ml-1 opacity-70" />
              </th>
              <th className="p-4">Contact Coordinates</th>
              <th className="p-4 cursor-pointer hover:text-zinc-300 transition-colors" onClick={() => handleSort("eventType")}>
                Event Type <ArrowUpDown size={11} className="inline ml-1 opacity-70" />
              </th>
              <th className="p-4 cursor-pointer hover:text-zinc-300 transition-colors" onClick={() => handleSort("eventDate")}>
                Event Date <ArrowUpDown size={11} className="inline ml-1 opacity-70" />
              </th>
              <th className="p-4 cursor-pointer hover:text-zinc-300 transition-colors" onClick={() => handleSort("budget")}>
                Budget Allocation <ArrowUpDown size={11} className="inline ml-1 opacity-70" />
              </th>
              <th className="p-4">Source</th>
              <th className="p-4 cursor-pointer hover:text-zinc-300 transition-colors" onClick={() => handleSort("status")}>
                Pipeline Stage <ArrowUpDown size={11} className="inline ml-1 opacity-70" />
              </th>
              <th className="p-4">Account Manager</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/60 font-medium">
            {sortedLeads.map((lead) => {
              const assignee = teamMembers.find((m) => m.id === lead.assignedUserId);
              const assigneeName = assignee ? `${assignee.firstName} ${assignee.lastName}` : "Unassigned";
              const isSelected = selectedLeadIds.includes(lead.id);

              return (
                <tr
                  key={lead.id}
                  onClick={() => onLeadClick(lead.id)}
                  className={cn(
                    "hover:bg-[#161618]/30 transition-all cursor-pointer",
                    isSelected ? "bg-purple-550/[0.02] border-l-2 border-l-purple-500" : ""
                  )}
                >
                  {onToggleSelectLead && (
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <div 
                        onClick={() => onToggleSelectLead(lead.id)}
                        className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white transition cursor-pointer"
                      >
                        {isSelected ? <CheckSquare size={13} className="text-purple-400" /> : <Square size={13} />}
                      </div>
                    </td>
                  )}
                  
                  {/* Name with Highlight */}
                  <td className="p-4 font-bold text-zinc-200">
                    <Highlight text={lead.name} search={searchQuery} />
                  </td>
                  
                  {/* Contact */}
                  <td className="p-4 text-zinc-450 space-y-0.5">
                    <div className="text-zinc-300">
                      <Highlight text={lead.phone || ""} search={searchQuery} />
                    </div>
                    <div className="text-[10px] text-zinc-550">
                      <Highlight text={lead.email || ""} search={searchQuery} />
                    </div>
                  </td>
                  
                  {/* Event Type */}
                  <td className="p-4">
                    <span className="px-2 py-0.5 border border-zinc-850 bg-zinc-900/60 text-zinc-400 rounded-md font-bold">
                      {lead.eventType}
                    </span>
                  </td>
                  
                  {/* Event Date */}
                  <td className="p-4 text-zinc-450">
                    {lead.eventDate ? new Date(lead.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </td>
                  
                  {/* Budget */}
                  <td className="p-4 font-mono font-bold text-emerald-450">
                    ₹{lead.budget ? lead.budget.toLocaleString() : "0"}
                  </td>
                  
                  {/* Lead Source */}
                  <td className="p-4 text-zinc-500">
                    {lead.leadSource}
                  </td>
                  
                  {/* Status */}
                  <td className="p-4">
                    <span className={cn("inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold border tracking-wide uppercase", getStatusColor(lead.status))}>
                      {lead.status}
                    </span>
                  </td>
                  
                  {/* Manager */}
                  <td className="p-4 text-zinc-400">
                    {assigneeName}
                  </td>
                </tr>
              );
            })}
            {leads.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-12 text-zinc-500 italic">
                  No records match the active workspace filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && onPageChange && pagination.totalPages > 1 && (
        <div className="p-4 border-t border-zinc-900 bg-zinc-950/40 flex items-center justify-between text-xs select-none">
          <span className="text-zinc-500 font-bold">
            Page {pagination.currentPage + 1} of {pagination.totalPages}
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 0}
              className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-50 transition-all cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages - 1}
              className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-50 transition-all cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
