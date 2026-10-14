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
          <mark key={i} className="bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded px-1 font-bold">
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
      l.contact?.phone || l.phone || "",
      l.contact?.email || l.email || "",
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
        return "border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300";
      case "CONTACTED":
        return "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300";
      case "QUALIFIED":
        return "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300";
      case "PROPOSAL_SENT":
        return "border-pink-500/20 bg-pink-500/10 text-pink-700 dark:text-pink-300";
      case "NEGOTIATION":
        return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
      case "WON":
      case "BOOKED":
      case "COMPLETED":
        return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
      case "LOST":
        return "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300";
      case "ARCHIVED":
        return "border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400";
      default:
        return "border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400";
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
    <div className="border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 shadow-sm backdrop-blur-md rounded-2xl overflow-hidden flex flex-col justify-between">
      
      {/* Header Toolbar */}
      <div className="p-4 border-b border-slate-200/90 dark:border-white/[0.08] bg-slate-50/80 dark:bg-zinc-950/40 flex items-center justify-between gap-4 flex-wrap">
        <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Leads Ledger</span>
        
        <button
          onClick={exportToCSV}
          className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-zinc-900/60 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 shadow-sm transition-all cursor-pointer"
        >
          <Download size={13} />
          Export Ledger
        </button>
      </div>

      {/* Table grid */}
      <div className="overflow-x-auto text-xs font-semibold">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/90 dark:border-white/[0.08] bg-slate-100/60 dark:bg-zinc-900/30 text-slate-500 dark:text-zinc-400 font-bold select-none text-[11px]">
              {onToggleSelectLead && (
                <th className="p-4 w-10">
                  <div 
                    onClick={handleSelectAll}
                    className="p-1 hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                  >
                    {allSelected ? <CheckSquare size={14} className="text-purple-600 dark:text-purple-400" /> : <Square size={14} />}
                  </div>
                </th>
              )}
              <th className="p-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => handleSort("name")}>
                Client Name <ArrowUpDown size={11} className="inline ml-1 opacity-70" />
              </th>
              <th className="p-4">Contact Coordinates</th>
              <th className="p-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => handleSort("eventType")}>
                Event Type <ArrowUpDown size={11} className="inline ml-1 opacity-70" />
              </th>
              <th className="p-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => handleSort("eventDate")}>
                Event Date <ArrowUpDown size={11} className="inline ml-1 opacity-70" />
              </th>
              <th className="p-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => handleSort("budget")}>
                Budget Allocation <ArrowUpDown size={11} className="inline ml-1 opacity-70" />
              </th>
              <th className="p-4">Source</th>
              <th className="p-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => handleSort("status")}>
                Pipeline Stage <ArrowUpDown size={11} className="inline ml-1 opacity-70" />
              </th>
              <th className="p-4">Account Manager</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-900/60 font-medium">
            {sortedLeads.map((lead) => {
              const assignee = teamMembers.find((m) => m.id === lead.assignedUserId);
              const assigneeName = assignee ? `${assignee.firstName} ${assignee.lastName}` : "Unassigned";
              const isSelected = selectedLeadIds.includes(lead.id);

              return (
                <tr
                  key={lead.id}
                  onClick={() => onLeadClick(lead.id)}
                  className={cn(
                    "hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-all cursor-pointer",
                    isSelected ? "bg-purple-500/[0.04] dark:bg-purple-500/[0.05] border-l-2 border-l-purple-500" : ""
                  )}
                >
                  {onToggleSelectLead && (
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <div 
                        onClick={() => onToggleSelectLead(lead.id)}
                        className="p-1 hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                      >
                        {isSelected ? <CheckSquare size={14} className="text-purple-600 dark:text-purple-400" /> : <Square size={14} />}
                      </div>
                    </td>
                  )}
                  
                  {/* Name with Highlight */}
                  <td className="p-4 font-bold text-slate-900 dark:text-white">
                    <Highlight text={lead.name} search={searchQuery} />
                  </td>
                  
                  {/* Contact */}
                  <td className="p-4 text-slate-600 dark:text-zinc-400 space-y-0.5">
                    <div className="text-slate-800 dark:text-zinc-200 font-semibold">
                      <Highlight text={lead.contact?.phone || lead.phone || ""} search={searchQuery} />
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                      <Highlight text={lead.contact?.email || lead.email || ""} search={searchQuery} />
                    </div>
                  </td>
                  
                  {/* Event Type */}
                  <td className="p-4">
                    <span className="px-2.5 py-1 border border-slate-200 dark:border-white/[0.08] bg-slate-100/70 dark:bg-white/[0.04] text-slate-700 dark:text-zinc-300 rounded-lg font-semibold text-[11px]">
                      {lead.eventType}
                    </span>
                  </td>
                  
                  {/* Event Date */}
                  <td className="p-4 text-slate-600 dark:text-zinc-400">
                    {lead.eventDate ? new Date(lead.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </td>
                  
                  {/* Budget */}
                  <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{lead.budget ? lead.budget.toLocaleString() : "0"}
                  </td>
                  
                  {/* Lead Source */}
                  <td className="p-4 text-slate-500 dark:text-zinc-400">
                    {lead.leadSource}
                  </td>
                  
                  {/* Status */}
                  <td className="p-4">
                    <span className={cn("inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold border tracking-wide uppercase", getStatusColor(lead.status))}>
                      {lead.status}
                    </span>
                  </td>
                  
                  {/* Manager */}
                  <td className="p-4 text-slate-600 dark:text-zinc-400 font-semibold">
                    {assigneeName}
                  </td>
                </tr>
              );
            })}
            {leads.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-400 dark:text-zinc-500 italic">
                  No records match the active workspace filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && onPageChange && pagination.totalPages > 1 && (
        <div className="p-4 border-t border-slate-200/90 dark:border-white/[0.08] bg-slate-50/80 dark:bg-zinc-950/40 flex items-center justify-between text-xs select-none">
          <span className="text-slate-500 dark:text-zinc-400 font-bold">
            Page {pagination.currentPage + 1} of {pagination.totalPages}
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 0}
              className="h-8 w-8 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 transition-all cursor-pointer shadow-sm"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages - 1}
              className="h-8 w-8 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 transition-all cursor-pointer shadow-sm"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
