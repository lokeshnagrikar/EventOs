"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Plus,
  ArrowLeft,
  Filter,
  Grid,
  List,
  Calendar,
  Layers,
  Search,
  SlidersHorizontal,
  Clock,
  Sparkles,
  Download,
  Upload,
  GitMerge,
  Trash2,
  RefreshCw,
  AlertTriangle,
  FileSpreadsheet,
  Award,
  ChevronRight,
  TrendingUp,
  LineChart,
  PieChart,
  UserCheck,
  CheckCircle2,
  Users,
  CheckSquare,
  Square,
  Check,
  Building,
  HelpCircle,
  FileText,
  Activity as ActivityIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useBillingStore } from "@/store/billingStore";

// Custom CRM Components
import CrmKpis from "@/components/crm/CrmKpis";
import SmartFilters from "@/components/crm/SmartFilters";
import AdvancedTable from "@/components/crm/AdvancedTable";
import KanbanBoard from "@/components/crm/KanbanBoard";
import ListView from "@/components/crm/ListView";
import TimelineView from "@/components/crm/TimelineView";
import LeadDrawer from "@/components/crm/LeadDrawer";
import { PageSkeleton, TableSkeleton, KanbanSkeleton } from "@/components/ui/skeletons";
import PageShell from "@/components/ui/PageShell";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToastStore } from "@/lib/toastStore";
import { useOnboardingStore } from "@/store/onboardingStore";

// ─── Interfaces ──────────────────────────────────────────────────────────────
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

interface Activity {
  id: string;
  type: string;
  description: string;
  activityType: string;
  createdAt: string;
}

interface LeadsResponse {
  data: Lead[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalElements: number;
  };
}

export default function CrmPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const addToast = useToastStore((state) => state.addToast);
  const { completeStep } = useOnboardingStore();

  // Selected Lead state
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Layout Tab selection with Compact view mode support and local storage memory
  const [viewMode, setViewMode] = useState<"dashboard" | "board" | "list" | "compact" | "table" | "timeline" | "recycle">("dashboard");

  // Selection state for Bulk Actions
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Saved Views State
  const [savedViews] = useState([
    { id: "all", label: "All Leads" },
    { id: "weddings", label: "My Weddings" },
    { id: "pending", label: "Pending Quotes" },
    { id: "luxury", label: "Luxury Clients" },
    { id: "corporate", label: "Corporate Events" },
    { id: "followups", label: "Today's Follow-ups" }
  ]);
  const [activeSavedView, setActiveSavedView] = useState("all");

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [eventTypeFilter, setEventTypeFilter] = useState("ALL");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "budgetDesc" | "budgetAsc">("newest");
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);

  // Quick-Add Lead state
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddName, setQuickAddName] = useState("");
  const [quickAddPhone, setQuickAddPhone] = useState("");
  const [quickAddEmail, setQuickAddEmail] = useState("");
  const [quickAddType, setQuickAddType] = useState("WEDDING");
  const [quickAddBudget, setQuickAddBudget] = useState("");
  const [quickAddSource, setQuickAddSource] = useState("Website");

  // Import Leads state
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvRawText, setCsvRawText] = useState("");

  // Duplicate leads state
  const [duplicateGroups, setDuplicateGroups] = useState<Lead[][]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // Client-side Recycle Bin state
  const [recycleBin, setRecycleBin] = useState<Lead[]>([]);

  // Mount logic + Local Storage loading
  useEffect(() => {
    setMounted(true);
    
    // Load last selected view mode
    const lastView = localStorage.getItem("crm_last_view_mode");
    if (lastView && ["dashboard", "board", "list", "compact", "table", "timeline", "recycle"].includes(lastView)) {
      setViewMode(lastView as any);
    }

    // Load Recycle Bin
    const stored = localStorage.getItem("crm_recycle_bin");
    if (stored) {
      try {
        setRecycleBin(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  const handleSetViewMode = (mode: typeof viewMode) => {
    setViewMode(mode);
    localStorage.setItem("crm_last_view_mode", mode);
  };

  // Fetch leads (filtered on server)
  const { data: leadsResponse, isLoading } = useQuery<LeadsResponse>({
    queryKey: ["leads", currentPage, searchQuery, sourceFilter, assigneeFilter, minBudget, maxBudget, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("size", "100");
      
      const backendSort = sortBy === "budgetDesc" 
        ? "budget,desc" 
        : sortBy === "budgetAsc" 
          ? "budget,asc" 
          : "createdAt,desc";
      params.append("sort", backendSort);
      
      if (searchQuery) {
        params.append("query", searchQuery);
      }
      if (sourceFilter && sourceFilter !== "ALL") {
        params.append("source", sourceFilter);
      }
      if (assigneeFilter && assigneeFilter !== "ALL" && assigneeFilter !== "UNASSIGNED") {
        params.append("assignedUserId", assigneeFilter);
      }
      if (minBudget) {
        params.append("minBudget", minBudget);
      }
      if (maxBudget) {
        params.append("maxBudget", maxBudget);
      }
      
      const response = await api.get(`/crm/leads?${params.toString()}`);
      return response.data;
    },
    enabled: mounted
  });

  const leads = useMemo<Lead[]>(() => {
    if (Array.isArray(leadsResponse?.data)) return leadsResponse.data;
    if (Array.isArray((leadsResponse as any)?.content)) return (leadsResponse as any).content;
    if (Array.isArray(leadsResponse)) return leadsResponse as any;
    return [];
  }, [leadsResponse]);
  const pagination = leadsResponse?.pagination;

  // Calculate duplicate leads (sharing email or phone)
  useEffect(() => {
    if (!leads.length) return;
    const emailMap: Record<string, Lead[]> = {};
    const phoneMap: Record<string, Lead[]> = {};

    leads.forEach((l) => {
      const email = (l.contact?.email || l.email || "").trim().toLowerCase();
      const phone = (l.contact?.phone || l.phone || "").trim();
      
      if (email && email.includes("@")) {
        if (!emailMap[email]) emailMap[email] = [];
        emailMap[email].push(l);
      }
      if (phone && phone.length >= 10) {
        if (!phoneMap[phone]) phoneMap[phone] = [];
        phoneMap[phone].push(l);
      }
    });

    const groups: Lead[][] = [];
    const addedIds = new Set<string>();

    const evaluateGroups = (map: Record<string, Lead[]>) => {
      Object.values(map).forEach((group) => {
        if (group.length > 1) {
          const groupToPush = group.filter(l => !addedIds.has(l.id));
          if (groupToPush.length > 1) {
            groupToPush.forEach(l => addedIds.add(l.id));
            groups.push(groupToPush);
          }
        }
      });
    };

    evaluateGroups(emailMap);
    evaluateGroups(phoneMap);
    setDuplicateGroups(groups);
  }, [leads]);

  // Client-side local filtering for priority & eventType (which are parsed from notes JSON)
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      let priority = "MEDIUM";
      let eventType = l.eventType || "WEDDING";
      
      if (l.notes && l.notes.startsWith("{")) {
        try {
          const parsed = JSON.parse(l.notes);
          priority = parsed.priority || "MEDIUM";
        } catch (e) {}
      }

      const matchesPriority = priorityFilter === "ALL" || priority === priorityFilter;
      const matchesEventType = eventTypeFilter === "ALL" || eventType === eventTypeFilter;
      return matchesPriority && matchesEventType;
    });
  }, [leads, priorityFilter, eventTypeFilter]);

  // Fetch team members for assignment
  const { data: teamResponse } = useQuery<{ data: TeamMember[] }>({
    queryKey: ["teamMembers"],
    queryFn: async () => {
      const response = await api.get("/auth/settings/team");
      return response.data;
    },
    enabled: mounted
  });

  const teamMembers = teamResponse?.data || [];

  // Fetch activities for selected lead
  const { data: activitiesResponse, refetch: refetchActivities } = useQuery<{ data: Activity[] }>({
    queryKey: ["activities", selectedLeadId],
    queryFn: async () => {
      if (!selectedLeadId) return { data: [] };
      const response = await api.get(`/crm/leads/${selectedLeadId}/activities`);
      return response.data;
    },
    enabled: !!selectedLeadId && mounted
  });

  const activities = activitiesResponse?.data || [];

  // ─── Mutations ──────────────────────────────────────────────────────────────
  const updateStatusMutation = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      const response = await api.patch(`/crm/leads/${leadId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      addToast("Lead stage updated successfully ✓", "success");
      if (selectedLeadId) refetchActivities();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || "Failed to update lead status";
      addToast(msg, "error");
    }
  });

  const updateLeadMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const response = await api.put(`/crm/leads/${selectedLeadId}`, updatedData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      refetchActivities();
      addToast("Lead updated successfully ✓", "success");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || "Failed to update lead";
      addToast(msg, "error");
    }
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (idToDelete: string) => {
      await api.delete(`/crm/leads/${idToDelete}`);
    },
    onSuccess: (_, deletedId) => {
      const deletedLead = leads.find(l => l.id === deletedId);
      if (deletedLead) {
        const updatedBin = [deletedLead, ...recycleBin];
        setRecycleBin(updatedBin);
        localStorage.setItem("crm_recycle_bin", JSON.stringify(updatedBin));
      }
      setSelectedLeadId(null);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      addToast("Lead moved to Recycle Bin", "info");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || "Failed to delete lead";
      addToast(msg, "error");
    }
  });

  const quickAddLeadMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (!useBillingStore.getState().checkLimit("leads")) {
        throw new Error("LIMIT_EXCEEDED");
      }
      return (await api.post("/crm/leads", payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setShowQuickAddModal(false);
      setQuickAddName("");
      setQuickAddPhone("");
      setQuickAddEmail("");
      setQuickAddBudget("");
      addToast("Lead proposal logged successfully ✓", "success");
      completeStep("add_lead");
    },
    onError: (err: any) => {
      if (err.message === "LIMIT_EXCEEDED") return;
      const msg = err.response?.data?.error?.message 
        || err.response?.data?.message 
        || err.response?.data?.detail 
        || err.message 
        || "Failed to create lead. Please verify server connection.";
      addToast(msg, "error");
    }
  });

  const addActivityMutation = useMutation({
    mutationFn: async ({ leadId, type, description }: { leadId: string; type: string; description: string }) => {
      const response = await api.post(`/crm/leads/${leadId}/activities`, { type, description });
      return response.data;
    },
    onSuccess: () => {
      refetchActivities();
      addToast("Activity logged ✓", "success");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || "Failed to log activity";
      addToast(msg, "error");
    }
  });

  // Action Handlers
  const handleStageChange = (leadId: string, newStatus: string) => {
    updateStatusMutation.mutate({ leadId, status: newStatus });
  };

  const handleUpdateLead = (updatedData: any) => {
    updateLeadMutation.mutate(updatedData);
  };

  const handleDeleteLead = (id?: string) => {
    const targetId = id || selectedLeadId;
    if (targetId) deleteLeadMutation.mutate(targetId);
  };

  const handleAddActivity = (type: string, description: string) => {
    if (!selectedLeadId) return;
    addActivityMutation.mutate({ leadId: selectedLeadId, type, description });
  };

  const handleClearFilters = () => {
    setSourceFilter("ALL");
    setAssigneeFilter("ALL");
    setPriorityFilter("ALL");
    setEventTypeFilter("ALL");
    setMinBudget("");
    setMaxBudget("");
    setSortBy("newest");
    setCurrentPage(0);
    setActiveSavedView("all");
  };

  // Saved Views filter apply
  const handleApplySavedView = (viewId: string) => {
    setActiveSavedView(viewId);
    if (viewId === "all") {
      handleClearFilters();
    } else if (viewId === "weddings") {
      handleClearFilters();
      setEventTypeFilter("WEDDING");
    } else if (viewId === "pending") {
      handleClearFilters();
      setSourceFilter("Website");
    } else if (viewId === "luxury") {
      handleClearFilters();
      setMinBudget("500000");
    } else if (viewId === "corporate") {
      handleClearFilters();
      setEventTypeFilter("CORPORATE");
    } else if (viewId === "followups") {
      handleClearFilters();
      setPriorityFilter("HIGH");
    }
    addToast(`Applied Saved View: ${savedViews.find(v => v.id === viewId)?.label}`, "success");
  };

  // Bulk Actions
  const handleToggleSelectLead = (id: string) => {
    setSelectedLeadIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkAssign = async () => {
    const defaultPlanner = teamMembers[0]?.id;
    if (!defaultPlanner) return;
    try {
      for (const id of selectedLeadIds) {
        const lead = leads.find(l => l.id === id);
        if (lead) {
          await api.put(`/crm/leads/${id}`, {
            ...lead,
            assignedUserId: defaultPlanner
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setSelectedLeadIds([]);
      addToast(`Assigned ${selectedLeadIds.length} leads successfully`, "success");
    } catch (e) {
      addToast("Failed to assign leads", "error");
    }
  };

  const handleBulkMove = async () => {
    try {
      for (const id of selectedLeadIds) {
        await api.patch(`/crm/leads/${id}/status`, { status: "QUALIFIED" });
      }
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setSelectedLeadIds([]);
      addToast(`Moved ${selectedLeadIds.length} leads to Qualified`, "success");
    } catch (e) {
      addToast("Failed to move stages", "error");
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Move ${selectedLeadIds.length} leads to Recycle Bin?`)) {
      try {
        for (const id of selectedLeadIds) {
          await api.delete(`/crm/leads/${id}`);
        }
        queryClient.invalidateQueries({ queryKey: ["leads"] });
        setSelectedLeadIds([]);
        addToast("Bulk deletion completed", "info");
      } catch (e) {
        addToast("Failed bulk delete", "error");
      }
    }
  };

  const handleBulkExport = () => {
    const selectedLeads = leads.filter(l => selectedLeadIds.includes(l.id));
    const headers = ["Name", "Phone", "Email", "Event Type", "Budget", "Status"];
    const rows = selectedLeads.map(l => [l.name, l.phone || "", l.email || "", l.eventType, l.budget, l.status]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `EventOS_CRM_Bulk_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSelectedLeadIds([]);
  };

  // Merge Duplicate Leads handler
  const handleMergeLeads = async (keepLead: Lead, discardLead: Lead) => {
    const combinedBudget = Number(keepLead.budget || 0) + Number(discardLead.budget || 0);
    const combinedNotes = `Merged Lead with: ${discardLead.name}. Discarded notes: ${discardLead.notes || "None"}. \nOriginal notes: ${keepLead.notes || ""}`;

    try {
      await api.put(`/crm/leads/${keepLead.id}`, {
        name: keepLead.name,
        eventType: keepLead.eventType,
        eventDate: keepLead.eventDate,
        budget: combinedBudget,
        leadSource: keepLead.leadSource,
        notes: combinedNotes,
        assignedUserId: keepLead.assignedUserId || discardLead.assignedUserId || null
      });

      await api.delete(`/crm/leads/${discardLead.id}`);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setShowDuplicateModal(false);
      addToast("Leads merged successfully ✓", "success");
    } catch (e) {
      addToast("Failed to merge leads", "error");
    }
  };

  // Restore deleted lead
  const handleRestoreLead = async (lead: Lead) => {
    try {
      await api.post("/crm/leads", {
        name: lead.name,
        phone: lead.phone || lead.contact?.phone || "9999999999",
        email: lead.email || lead.contact?.email || null,
        eventType: lead.eventType,
        eventDate: lead.eventDate || new Date().toISOString().split("T")[0],
        budget: lead.budget,
        leadSource: lead.leadSource,
        notes: lead.notes || ""
      });

      const updatedBin = recycleBin.filter(l => l.id !== lead.id);
      setRecycleBin(updatedBin);
      localStorage.setItem("crm_recycle_bin", JSON.stringify(updatedBin));
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      addToast("Lead restored to pipeline", "success");
    } catch (e) {
      addToast("Failed restoration", "error");
    }
  };

  // CSV Import handler
  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvRawText.trim()) return;

    const lines = csvRawText.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || i === 0 && line.toLowerCase().includes("name")) continue; // skip header
      const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
      if (cols.length >= 3) {
        try {
          await api.post("/crm/leads", {
            name: cols[0],
            phone: cols[1],
            email: cols[2] || null,
            eventType: cols[3] || "WEDDING",
            eventDate: cols[4] || new Date().toISOString().split("T")[0],
            budget: Number(cols[5]) || 100000,
            leadSource: cols[6] || "Imported",
            notes: cols[7] || ""
          });
        } catch (err) {}
      }
    }
    queryClient.invalidateQueries({ queryKey: ["leads"] });
    setShowImportModal(false);
    setCsvRawText("");
    addToast("CSV Leads imported successfully", "success");
  };

  // CRM Homepage statistics calculation
  const crmHomepageStats = useMemo(() => {
    const total = filteredLeads.length;
    const active = filteredLeads.filter(l => ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION"].includes(l.status)).length;
    const pipelineVal = filteredLeads.reduce((sum, l) => sum + (l.budget || 0), 0);
    
    const wonCount = filteredLeads.filter(l => ["WON", "BOOKED"].includes(l.status)).length;
    const lostCount = filteredLeads.filter(l => l.status === "LOST").length;
    
    const convRate = total > 0 ? (wonCount / total) * 100 : 33.3;
    const avgDeal = active > 0 ? pipelineVal / active : 120000;

    // Follow-ups high priority count
    const followups = filteredLeads.filter(l => {
      if (l.notes && l.notes.startsWith("{")) {
        try {
          const parsed = JSON.parse(l.notes);
          return !!parsed.followUpDate || !!parsed.reminder;
        } catch {
          return false;
        }
      }
      return false;
    }).length;

    return { total, active, pipelineVal, wonCount, lostCount, convRate, avgDeal, followups };
  }, [filteredLeads]);

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {duplicateGroups.length > 0 && (
        <button
          onClick={() => setShowDuplicateModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-xl transition shrink-0"
        >
          <AlertTriangle size={13} className="animate-pulse" />
          <span>{duplicateGroups.length} Duplicates</span>
        </button>
      )}

      {/* Smart Saved Views bar */}
      <div className="hidden sm:flex bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] p-1 rounded-xl text-[10px] font-bold shrink-0">
        {savedViews.slice(0, 4).map(v => (
          <button
            key={v.id}
            onClick={() => handleApplySavedView(v.id)}
            className={cn(
              "px-3 py-1 rounded-lg transition-all cursor-pointer font-bold",
              activeSavedView === v.id
                ? "bg-white dark:bg-white/[0.1] text-purple-600 dark:text-purple-300 shadow-sm"
                : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowFiltersPanel(!showFiltersPanel)}
        className={cn(
          "px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shrink-0",
          showFiltersPanel 
            ? "bg-purple-500/15 border-purple-500/40 text-purple-700 dark:text-purple-300 shadow-sm" 
            : "bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-zinc-300"
        )}
      >
        <Filter size={13} />
        <span>Filters</span>
      </button>
      
      <button
        onClick={() => setShowImportModal(true)}
        className="px-3 py-2 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 transition cursor-pointer shrink-0 hidden sm:flex items-center gap-1.5"
      >
        <Upload size={13} />
        <span>Import CSV</span>
      </button>

      <button 
        onClick={() => {
          if (!useBillingStore.getState().checkLimit("leads")) return;
          setShowQuickAddModal(true);
        }}
        className="flex items-center gap-1.5 sm:gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 active:scale-[0.98] cursor-pointer shrink-0"
      >
        <Plus size={14} />
        <span>Log Lead</span>
      </button>
    </div>
  );

  return (
    <PageShell
      title="CRM Workspace"
      subtitle="Track leads, manage conversions, and nurture event customer lifecycle."
      actions={headerActions}
    >
      {/* Smart Filters Panel */}
      <AnimatePresence>
        {showFiltersPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-slate-50/50 dark:bg-[#111218]/40 border-b border-slate-200/90 dark:border-white/[0.08] shrink-0"
          >
            <SmartFilters
              sourceFilter={sourceFilter}
              setSourceFilter={setSourceFilter}
              assigneeFilter={assigneeFilter}
              setAssigneeFilter={setAssigneeFilter}
              minBudget={minBudget}
              setMinBudget={setMinBudget}
              maxBudget={maxBudget}
              setMaxBudget={setMaxBudget}
              sortBy={sortBy}
              setSortBy={setSortBy}
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
              eventTypeFilter={eventTypeFilter}
              setEventTypeFilter={setEventTypeFilter}
              teamMembers={teamMembers}
              onClear={handleClearFilters}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/90 dark:border-white/[0.08] pb-4 shrink-0 select-none">
        <div className="relative w-full max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
            <Search size={14} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(0);
            }}
            placeholder="Search name, phone, email, venue, quote..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs placeholder-slate-400 dark:placeholder-zinc-500 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all font-semibold"
          />
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] p-1 rounded-xl self-start font-semibold overflow-x-auto no-scrollbar max-w-full touch-pan-x">
          {(["dashboard", "board", "table", "list", "compact", "timeline", "recycle"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleSetViewMode(mode)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase font-bold rounded-lg transition-all cursor-pointer shrink-0 whitespace-nowrap",
                viewMode === mode
                  ? "bg-white dark:bg-white/[0.1] text-purple-600 dark:text-purple-300 shadow-sm"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              {mode === "dashboard" && <LineChart size={12} />}
              {mode === "board" && <Grid size={12} />}
              {mode === "table" && <SlidersHorizontal size={12} />}
              {mode === "list" && <List size={12} />}
              {mode === "compact" && <Layers size={12} />}
              {mode === "timeline" && <Calendar size={12} />}
              {mode === "recycle" && <Trash2 size={12} />}
              <span>{mode} {mode === "recycle" ? "Bin" : ""}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CRM Main Workspace Display */}
      <div className="flex-1 overflow-auto pt-2">
        {isLoading ? (
          <PageSkeleton />
        ) : leads.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Leads Yet"
            description="Let's log your first client and start tracking conversions!"
            primaryAction={{
              label: "Log Lead",
              onClick: () => {
                if (!useBillingStore.getState().checkLimit("leads")) return;
                setShowQuickAddModal(true);
              }
            }}
            secondaryAction={{
              label: "Import CSV",
              onClick: () => setShowImportModal(true)
            }}
          />
        ) : filteredLeads.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No Results Found"
            description="We couldn't find any leads matching your active filters. Try resetting them."
            primaryAction={{
              label: "Clear Filters",
              onClick: handleClearFilters
            }}
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {/* CRM HOME / DASHBOARD VIEW */}
              {viewMode === "dashboard" && (
                <div className="space-y-6">
                  {/* Top Stats Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Total Leads", val: crmHomepageStats.total, suffix: "", icon: Users, color: "text-purple-600 dark:text-purple-400" },
                      { label: "Active Clients", val: crmHomepageStats.active, suffix: "", icon: CheckCircle2, color: "text-blue-600 dark:text-blue-400" },
                      { label: "Pipeline Value", val: `₹${(crmHomepageStats.pipelineVal / 100000).toFixed(1)}L`, suffix: "", icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400" },
                      { label: "Conversion Rate", val: `${crmHomepageStats.convRate.toFixed(1)}%`, suffix: "", icon: Award, color: "text-pink-600 dark:text-pink-400" },
                      { label: "Average Deal Size", val: `₹${(crmHomepageStats.avgDeal / 100000).toFixed(1)}L`, suffix: "", icon: Building, color: "text-cyan-600 dark:text-cyan-400" },
                      { label: "Won This Month", val: crmHomepageStats.wonCount, suffix: "", icon: Check, color: "text-emerald-600 dark:text-emerald-400" },
                      { label: "Lost This Month", val: crmHomepageStats.lostCount, suffix: "", icon: Trash2, color: "text-red-600 dark:text-red-400" },
                      { label: "Follow-ups Today", val: crmHomepageStats.followups, suffix: "", icon: Clock, color: "text-amber-600 dark:text-amber-500" }
                    ].map((st) => {
                      const Icon = st.icon;
                      return (
                        <div
                          key={st.label}
                          className="p-5 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 backdrop-blur-xl rounded-2xl flex items-center justify-between hover:border-purple-500/30 transition shadow-sm"
                        >
                          <div>
                            <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">{st.label}</span>
                            <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block tracking-tight">{st.val}</span>
                          </div>
                          <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-center shrink-0">
                            <Icon size={18} className={st.color} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Below Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Pipeline & Recent activity */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Pipeline summary */}
                      <div className="p-6 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 backdrop-blur-xl rounded-2xl space-y-4 shadow-sm">
                        <h3 className="text-xs font-black uppercase text-slate-900 dark:text-zinc-300 tracking-wider">Leads Pipeline Distribution</h3>
                        <div className="space-y-4">
                          {["NEW", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON"].map((stage) => {
                            const count = filteredLeads.filter(l => l.status === stage).length;
                            return (
                              <div key={stage} className="space-y-1.5 text-xs font-bold">
                                <div className="flex justify-between items-center text-slate-600 dark:text-zinc-400">
                                  <span>{stage}</span>
                                  <span className="text-slate-900 dark:text-white font-mono">{count} Leads</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full" style={{ width: `${(count / (filteredLeads.length || 1)) * 100}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Recently Added Leads */}
                      <div className="p-6 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 backdrop-blur-xl rounded-2xl space-y-4 shadow-sm">
                        <h3 className="text-xs font-black uppercase text-slate-900 dark:text-zinc-300 tracking-wider">Recently Added Leads</h3>
                        <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                          {filteredLeads.slice(0, 3).map((l) => (
                            <div key={l.id} onClick={() => setSelectedLeadId(l.id)} className="py-3.5 flex justify-between items-center hover:bg-slate-50/70 dark:hover:bg-white/[0.02] px-2.5 rounded-xl cursor-pointer transition">
                              <div>
                                <span className="font-extrabold text-slate-900 dark:text-white block text-sm">{l.name}</span>
                                <span className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{l.eventType} • {l.contact?.phone || l.phone || "No phone"}</span>
                              </div>
                              <span className="font-mono text-emerald-600 dark:text-emerald-400 text-xs font-bold">₹{l.budget?.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Tasks, Activity & Upcoming Meetings */}
                    <div className="lg:col-span-1 space-y-6">
                      {/* Recent Activities list */}
                      <div className="p-6 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 backdrop-blur-xl rounded-2xl space-y-4 shadow-sm">
                        <h3 className="text-xs font-black uppercase text-slate-900 dark:text-zinc-300 tracking-wider flex items-center gap-1.5">
                          <ActivityIcon size={14} className="text-purple-600 dark:text-purple-400" />
                          Recent Activity Feed
                        </h3>
                        <div className="relative pl-3.5 border-l-2 border-purple-200 dark:border-purple-500/30 space-y-3.5 text-xs font-semibold">
                          <div className="relative">
                            <div className="absolute -left-[18px] top-1 h-2 w-2 rounded-full bg-purple-600" />
                            <span className="text-slate-900 dark:text-zinc-200 block">Lead updated: Rohan & Meera</span>
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">10 mins ago</span>
                          </div>
                          <div className="relative">
                            <div className="absolute -left-[18px] top-1 h-2 w-2 rounded-full bg-purple-600" />
                            <span className="text-slate-900 dark:text-zinc-200 block">New proposal estimates logged</span>
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">1 hour ago</span>
                          </div>
                        </div>
                      </div>

                      {/* Meetings list */}
                      <div className="p-6 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 backdrop-blur-xl rounded-2xl space-y-4 shadow-sm">
                        <h3 className="text-xs font-black uppercase text-slate-900 dark:text-zinc-300 tracking-wider flex items-center gap-1.5">
                          <Calendar size={14} className="text-purple-600 dark:text-purple-400" />
                          Upcoming CRM Meetings
                        </h3>
                        <div className="space-y-3">
                          <div className="p-3.5 border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/80 dark:bg-white/[0.02] rounded-xl text-xs">
                            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-extrabold uppercase tracking-wider block">Today, 04:30 PM</span>
                            <span className="font-bold text-slate-900 dark:text-zinc-200 block pt-0.5">Budget Negotiation - Rohan G.</span>
                          </div>
                          <div className="p-3.5 border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/80 dark:bg-white/[0.02] rounded-xl text-xs">
                            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-extrabold block uppercase tracking-wider">Tomorrow, 11:00 AM</span>
                            <span className="font-bold text-slate-900 dark:text-zinc-200 block pt-0.5">Initial onboarding - TechCorp</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* KANBAN VIEW */}
              {viewMode === "board" && (
                <KanbanBoard
                  leads={filteredLeads}
                  teamMembers={teamMembers}
                  onStageChange={handleStageChange}
                  onLeadClick={setSelectedLeadId}
                />
              )}

              {/* TABLE VIEW */}
              {viewMode === "table" && (
                <AdvancedTable
                  leads={filteredLeads}
                  teamMembers={teamMembers}
                  onLeadClick={setSelectedLeadId}
                  searchQuery={searchQuery}
                  pagination={pagination}
                  onPageChange={setCurrentPage}
                  selectedLeadIds={selectedLeadIds}
                  onToggleSelectLead={handleToggleSelectLead}
                  onSelectAllLeads={setSelectedLeadIds}
                />
              )}

              {/* LIST VIEW */}
              {viewMode === "list" && (
                <ListView
                  leads={filteredLeads}
                  teamMembers={teamMembers}
                  onLeadClick={setSelectedLeadId}
                  selectedLeadIds={selectedLeadIds}
                  onToggleSelectLead={handleToggleSelectLead}
                />
              )}

              {/* COMPACT VIEW */}
              {viewMode === "compact" && (
                <ListView
                  leads={filteredLeads}
                  teamMembers={teamMembers}
                  onLeadClick={setSelectedLeadId}
                  selectedLeadIds={selectedLeadIds}
                  onToggleSelectLead={handleToggleSelectLead}
                  isCompact={true}
                />
              )}

              {/* TIMELINE VIEW */}
              {viewMode === "timeline" && (
                <TimelineView
                  leads={filteredLeads}
                  teamMembers={teamMembers}
                  onLeadClick={setSelectedLeadId}
                />
              )}

              {/* RECYCLE BIN */}
              {viewMode === "recycle" && (
                <div className="space-y-4 font-semibold text-xs select-none">
                  <div className="border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 backdrop-blur-xl rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-200/90 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-zinc-400">
                      Soft-Deleted Leads Recycle Bin
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                      {recycleBin.map((lead) => (
                        <div key={lead.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-zinc-200 block text-sm">{lead.name}</span>
                            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">{lead.eventType} • ₹{lead.budget?.toLocaleString()}</span>
                          </div>
                          <button
                            onClick={() => handleRestoreLead(lead)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold rounded-xl transition cursor-pointer text-xs"
                          >
                            <RefreshCw size={13} />
                            <span>Restore Lead</span>
                          </button>
                        </div>
                      ))}
                      {recycleBin.length === 0 && (
                        <div className="p-12 text-center text-slate-400 dark:text-zinc-500 italic">
                          No soft-deleted leads inside the Recycle Bin.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Floating Bulk Actions Bar */}
      <AnimatePresence>
        {selectedLeadIds.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 dark:bg-[#0c0c0e]/95 border border-purple-500/30 shadow-2xl rounded-2xl px-6 py-3 flex items-center gap-6 text-xs text-slate-200 select-none backdrop-blur-xl"
          >
            <span className="font-extrabold text-white text-[11px] uppercase tracking-wider font-mono">
              {selectedLeadIds.length} Selected
            </span>
            <div className="h-4 w-px bg-slate-700 dark:bg-zinc-800" />
            <div className="flex items-center gap-2.5">
              <button 
                onClick={handleBulkAssign}
                className="hover:text-purple-400 font-bold flex items-center gap-1 bg-slate-800 dark:bg-zinc-900 border border-slate-700 dark:border-zinc-800 px-3 py-1.5 rounded-xl cursor-pointer transition"
              >
                Assign
              </button>
              <button 
                onClick={handleBulkMove}
                className="hover:text-purple-400 font-bold flex items-center gap-1 bg-slate-800 dark:bg-zinc-900 border border-slate-700 dark:border-zinc-800 px-3 py-1.5 rounded-xl cursor-pointer transition"
              >
                Move Stage
              </button>
              <button 
                onClick={handleBulkDelete}
                className="hover:text-red-400 font-bold flex items-center gap-1 bg-slate-800 dark:bg-zinc-900 border border-slate-700 dark:border-zinc-800 px-3 py-1.5 rounded-xl cursor-pointer transition"
              >
                Delete
              </button>
              <button 
                onClick={handleBulkExport}
                className="hover:text-white font-bold flex items-center gap-1 bg-slate-800 dark:bg-zinc-900 border border-slate-700 dark:border-zinc-800 px-3 py-1.5 rounded-xl cursor-pointer transition"
              >
                Export CSV
              </button>
            </div>
            <button 
              onClick={() => setSelectedLeadIds([])}
              className="text-[10px] text-slate-400 hover:text-white uppercase font-bold cursor-pointer"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lead Details Slide-Over Drawer */}
      <AnimatePresence>
        {selectedLeadId && (
          <>
            <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedLeadId(null)} />
            <LeadDrawer
              leadId={selectedLeadId}
              onClose={() => setSelectedLeadId(null)}
              leads={leads}
              teamMembers={teamMembers}
              activities={activities}
              onUpdateLead={handleUpdateLead}
              onDeleteLead={handleDeleteLead}
              onAddActivity={handleAddActivity}
            />
          </>
        )}
      </AnimatePresence>

      {/* Log Quick Add Lead Modal */}
      <AnimatePresence>
        {showQuickAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowQuickAddModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-[#111218] border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-2xl p-6 z-50 text-xs text-slate-700 dark:text-zinc-300 font-semibold"
            >
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-4">Log New Lead Proposal</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const trimmedName = quickAddName.trim();
                  const trimmedPhone = quickAddPhone.trim();
                  const trimmedEmail = quickAddEmail.trim();

                  if (!trimmedName) {
                    addToast("Client name is required", "error");
                    return;
                  }
                  if (!trimmedPhone) {
                    addToast("Phone number is required", "error");
                    return;
                  }

                  quickAddLeadMutation.mutate({
                    name: trimmedName,
                    phone: trimmedPhone,
                    email: trimmedEmail ? trimmedEmail : null,
                    eventType: quickAddType,
                    eventDate: new Date().toISOString().split("T")[0],
                    budget: Number(quickAddBudget) || 100000,
                    leadSource: quickAddSource,
                    notes: ""
                  });
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">Client Name *</label>
                  <input
                    type="text"
                    required
                    disabled={quickAddLeadMutation.isPending}
                    value={quickAddName}
                    onChange={(e) => setQuickAddName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 transition"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">Phone Number *</label>
                    <input
                      type="text"
                      required
                      disabled={quickAddLeadMutation.isPending}
                      value={quickAddPhone}
                      onChange={(e) => setQuickAddPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">Email Address</label>
                    <input
                      type="email"
                      disabled={quickAddLeadMutation.isPending}
                      value={quickAddEmail}
                      onChange={(e) => setQuickAddEmail(e.target.value)}
                      placeholder="e.g. rahul@example.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 transition"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">Event Class</label>
                    <select
                      disabled={quickAddLeadMutation.isPending}
                      value={quickAddType}
                      onChange={(e) => setQuickAddType(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-purple-500 disabled:opacity-50 transition"
                    >
                      <option value="WEDDING">Wedding</option>
                      <option value="BIRTHDAY">Birthday</option>
                      <option value="ENGAGEMENT">Engagement</option>
                      <option value="CORPORATE">Corporate Summit</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">Estimated Budget (INR)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      disabled={quickAddLeadMutation.isPending}
                      value={quickAddBudget}
                      onChange={(e) => setQuickAddBudget(e.target.value)}
                      placeholder="e.g. 250000"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 transition"
                    />
                  </div>
                </div>
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowQuickAddModal(false)}
                    className="flex-1 py-2.5 border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={quickAddLeadMutation.isPending}
                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-purple-600/20"
                  >
                    {quickAddLeadMutation.isPending ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      "Log Proposal"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CSV Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowImportModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-[#111218] border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-2xl p-6 z-50 text-xs text-slate-700 dark:text-zinc-300 font-semibold"
            >
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-1">Import CRM Leads via CSV</h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-4">Paste CSV rows below. Format: Name, Phone, Email, EventType, EventDate, Budget, Source, Notes</p>
              <form onSubmit={handleCsvImport} className="space-y-4">
                <textarea
                  required
                  rows={6}
                  value={csvRawText}
                  onChange={(e) => setCsvRawText(e.target.value)}
                  placeholder={`"Amit Sharma","9876543210","amit@gmail.com","WEDDING","2026-10-12",250000,"Instagram","Needs pastel theme floral"`}
                  className="w-full p-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white font-mono text-[11px] focus:outline-none focus:border-purple-500 transition resize-none"
                />
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="flex-1 py-2.5 border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold cursor-pointer transition shadow-md shadow-purple-600/20"
                  >
                    Import Pasted Records
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Duplicate Leads Merge Modal */}
      <AnimatePresence>
        {showDuplicateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDuplicateModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#111218] border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-2xl p-6 z-50 text-xs text-slate-700 dark:text-zinc-300 font-semibold max-h-[80vh] overflow-y-auto"
            >
              <h3 className="font-extrabold text-base text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-2">
                <AlertTriangle size={18} />
                CRM De-duplication Roster
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-4">We detected client profiles with matching email coordinates or phone lines. Choose which record to maintain.</p>
              
              <div className="space-y-4">
                {duplicateGroups.map((group, idx) => {
                  const leadA = group[0];
                  const leadB = group[1];
                  if (!leadA || !leadB) return null;
                  return (
                    <div key={idx} className="p-4 border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] rounded-xl space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/[0.06] pb-2 text-xs">
                        <span className="text-slate-600 dark:text-zinc-300">Matching coordinates: <strong className="text-slate-900 dark:text-white">{leadA.email || leadA.phone}</strong></span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#161618]/50 rounded-xl space-y-1">
                          <span className="text-slate-900 dark:text-white block font-bold text-xs">{leadA.name}</span>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">{leadA.eventType} • Budget: ₹{leadA.budget?.toLocaleString()}</span>
                          <button
                            onClick={() => handleMergeLeads(leadA, leadB)}
                            className="mt-2 w-full py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-sm"
                          >
                            Keep {leadA.name.split(" ")[0]}
                          </button>
                        </div>
                        <div className="p-3 border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#161618]/50 rounded-xl space-y-1">
                          <span className="text-slate-900 dark:text-white block font-bold text-xs">{leadB.name}</span>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">{leadB.eventType} • Budget: ₹{leadB.budget?.toLocaleString()}</span>
                          <button
                            onClick={() => handleMergeLeads(leadB, leadA)}
                            className="mt-2 w-full py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-sm"
                          >
                            Keep {leadB.name.split(" ")[0]}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
