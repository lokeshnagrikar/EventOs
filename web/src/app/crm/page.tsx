"use client";

import React, { useState, useEffect } from "react";
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
  UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Custom CRM Components
import CrmKpis from "@/components/crm/CrmKpis";
import SmartFilters from "@/components/crm/SmartFilters";
import AdvancedTable from "@/components/crm/AdvancedTable";
import KanbanBoard from "@/components/crm/KanbanBoard";
import ListView from "@/components/crm/ListView";
import TimelineView from "@/components/crm/TimelineView";
import LeadDrawer from "@/components/crm/LeadDrawer";
import { PageSkeleton } from "@/components/ui/skeletons";

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

  // Selected Lead state
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Layout Tab selection
  const [viewMode, setViewMode] = useState<"dashboard" | "board" | "list" | "table" | "timeline" | "recycle">("dashboard");

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

  useEffect(() => {
    setMounted(true);
    // Load Recycle Bin
    const stored = localStorage.getItem("crm_recycle_bin");
    if (stored) {
      try {
        setRecycleBin(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  // 1. Fetch leads (filtered on server)
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

  const leads = leadsResponse?.data || [];
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
  const filteredLeads = leads.filter((l) => {
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

  // 2. Fetch team members for assignment
  const { data: teamResponse } = useQuery<{ data: TeamMember[] }>({
    queryKey: ["teamMembers"],
    queryFn: async () => {
      const response = await api.get("/auth/settings/team");
      return response.data;
    },
    enabled: mounted
  });

  const teamMembers = teamResponse?.data || [];

  // 3. Fetch activities for selected lead
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
      if (selectedLeadId) refetchActivities();
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
    }
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (idToDelete: string) => {
      await api.delete(`/crm/leads/${idToDelete}`);
    },
    onSuccess: (_, deletedId) => {
      // Find deleted lead to add to Recycle Bin
      const deletedLead = leads.find(l => l.id === deletedId);
      if (deletedLead) {
        const updatedBin = [deletedLead, ...recycleBin];
        setRecycleBin(updatedBin);
        localStorage.setItem("crm_recycle_bin", JSON.stringify(updatedBin));
      }
      setSelectedLeadId(null);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    }
  });

  const quickAddLeadMutation = useMutation({
    mutationFn: async (payload: any) => {
      return (await api.post("/crm/leads", payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setShowQuickAddModal(false);
      // Reset form
      setQuickAddName("");
      setQuickAddPhone("");
      setQuickAddEmail("");
      setQuickAddBudget("");
    }
  });

  const addActivityMutation = useMutation({
    mutationFn: async ({ leadId, type, description }: { leadId: string; type: string; description: string }) => {
      const response = await api.post(`/crm/leads/${leadId}/activities`, { type, description });
      return response.data;
    },
    onSuccess: () => {
      refetchActivities();
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
  };

  // Merge Duplicate Leads handler
  const handleMergeLeads = async (keepLead: Lead, discardLead: Lead) => {
    // Combine notes, sum budget
    const combinedBudget = Number(keepLead.budget || 0) + Number(discardLead.budget || 0);
    const combinedNotes = `Merged Lead with: ${discardLead.name}. Discarded notes: ${discardLead.notes || "None"}. \nOriginal notes: ${keepLead.notes || ""}`;

    try {
      // Update keeper lead
      await api.put(`/crm/leads/${keepLead.id}`, {
        name: keepLead.name,
        eventType: keepLead.eventType,
        eventDate: keepLead.eventDate,
        budget: combinedBudget,
        leadSource: keepLead.leadSource,
        notes: combinedNotes,
        assignedUserId: keepLead.assignedUserId || discardLead.assignedUserId || null
      });

      // Delete discarded lead
      await api.delete(`/crm/leads/${discardLead.id}`);

      // Refresh list
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setShowDuplicateModal(false);
    } catch (e) {
      console.error("Merging failed", e);
    }
  };

  // Bulk CSV Import parser
  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvRawText.trim()) return;

    // Parse lines: Name, Phone, Email, EventType, Budget, Source, Notes
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
        } catch (err) {
          console.error("Failed to import line:", line, err);
        }
      }
    }
    queryClient.invalidateQueries({ queryKey: ["leads"] });
    setShowImportModal(false);
    setCsvRawText("");
  };

  // Restore deleted lead
  const handleRestoreLead = async (lead: Lead) => {
    try {
      // Re-create lead
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

      // Remove from Local Recycle Bin
      const updatedBin = recycleBin.filter(l => l.id !== lead.id);
      setRecycleBin(updatedBin);
      localStorage.setItem("crm_recycle_bin", JSON.stringify(updatedBin));

      queryClient.invalidateQueries({ queryKey: ["leads"] });
    } catch (e) {
      console.error("Restoration failed", e);
    }
  };

  if (!mounted) return null;
  if (isLoading) return <PageSkeleton />;

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex flex-col relative overflow-hidden transition-all duration-200">
      
      {/* Background glow effects to match landing page theme */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Top Navbar Header */}
      <nav className="h-16 border-b border-zinc-800 bg-[#111113]/80 backdrop-blur px-6 flex items-center justify-between z-20 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push("/dashboard")}
            className="h-8 w-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-zinc-700/50 cursor-pointer"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base text-zinc-150">CRM Workspace</span>
            <span className="text-[10px] px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded font-bold uppercase tracking-wider">Enterprise Suite</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Duplicate leads banner trigger */}
          {duplicateGroups.length > 0 && (
            <button
              onClick={() => setShowDuplicateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-450 text-xs font-bold rounded-xl transition"
            >
              <AlertTriangle size={13} className="animate-pulse" />
              <span>{duplicateGroups.length} Duplicates Found</span>
            </button>
          )}

          <button
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={cn(
              "px-3 py-1.5 border rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer",
              showFiltersPanel 
                ? "bg-purple-950/20 border-purple-500/40 text-purple-400" 
                : "bg-zinc-900 border-zinc-850 hover:bg-zinc-800 text-zinc-350"
            )}
          >
            <Filter size={13} />
            Filters
          </button>
          
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 transition"
          >
            <Upload size={13} className="inline mr-1" />
            Import CSV
          </button>

          <button 
            onClick={() => setShowQuickAddModal(true)}
            className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer"
          >
            <Plus size={14} />
            Log Lead
          </button>
        </div>
      </nav>

      {/* Collapsible Filter Panel */}
      <AnimatePresence>
        {showFiltersPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#111113]/40 border-b border-zinc-900 shrink-0"
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

      {/* Main Workspace Frame */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full overflow-hidden flex flex-col justify-between">
        
        {/* KPI metrics row */}
        <CrmKpis leads={leads} totalElements={pagination?.totalElements} />

        {/* View selection toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-4 shrink-0 select-none">
          <div className="relative w-full max-w-xs">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Search size={13} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(0);
              }}
              placeholder="Search leads by name, email, phone..."
              className="w-full pl-9 pr-4 py-1.5 bg-zinc-950/40 border border-zinc-850 rounded-xl text-xs placeholder-zinc-550 text-zinc-200 focus:outline-none focus:border-purple-650 transition-all font-semibold"
            />
          </div>

          {/* View Mode Tabs */}
          <div className="flex bg-zinc-950/60 border border-zinc-850 p-0.5 rounded-xl self-start font-semibold">
            {(["dashboard", "board", "table", "list", "timeline", "recycle"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase font-bold rounded-lg transition-all cursor-pointer",
                  viewMode === mode ? "bg-zinc-800 text-purple-400" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {mode === "dashboard" && <LineChart size={11} />}
                {mode === "board" && <Grid size={11} />}
                {mode === "table" && <SlidersHorizontal size={11} />}
                {mode === "list" && <List size={11} />}
                {mode === "timeline" && <Calendar size={11} />}
                {mode === "recycle" && <Trash2 size={11} />}
                <span>{mode} {mode === "recycle" ? "Bin" : "View"}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Workspace Display Area */}
        <div className="flex-1 overflow-auto pt-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {/* Premium CRM Analytics Dashboard */}
              {viewMode === "dashboard" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Forecast Forecast Chart */}
                  <div className="p-6 border border-zinc-850 bg-[#161618]/30 rounded-2xl md:col-span-2 space-y-4">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-purple-400" />
                      Sales Projection & Revenue Forecast
                    </h3>
                    <div className="h-[220px] flex items-end justify-between gap-4 pt-8">
                      {[15, 28, 22, 38, 48, 55, 62, 70, 85, 95].map((val, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                          <div
                            className="w-full bg-gradient-to-t from-purple-600 to-pink-500 rounded-t-lg transition-all duration-1000"
                            style={{ height: `${val}%` }}
                          />
                          <span className="text-[9px] text-zinc-550 font-bold">M{idx+1}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Leaderboard and Categories */}
                  <div className="p-6 border border-zinc-850 bg-[#161618]/30 rounded-2xl space-y-5">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <PieChart size={14} className="text-purple-400" />
                      Top Event Categories
                    </h3>
                    <div className="space-y-3.5">
                      {[
                        { type: "Weddings", count: 18, budget: "₹1.2 Cr", percent: "52%" },
                        { type: "Corporate Summits", count: 12, budget: "₹85 L", percent: "31%" },
                        { type: "Birthday Galas", count: 8, budget: "₹25 L", percent: "11%" },
                        { type: "Engagement Parties", count: 4, budget: "₹15 L", percent: "6%" },
                      ].map((cat) => (
                        <div key={cat.type} className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-zinc-200 block">{cat.type}</span>
                            <span className="text-[10px] text-zinc-500 font-medium">{cat.count} Deals • {cat.budget}</span>
                          </div>
                          <span className="text-purple-450 font-black">{cat.percent}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Response Times & Action Items */}
                  <div className="p-6 border border-zinc-850 bg-[#161618]/30 rounded-2xl space-y-4">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock size={14} className="text-purple-400" />
                      SLA Response Times
                    </h3>
                    <div className="space-y-3 font-semibold text-xs">
                      <div className="p-3 bg-zinc-900/60 border border-zinc-850 rounded-xl flex justify-between items-center">
                        <span className="text-zinc-400">Average response speed</span>
                        <span className="text-emerald-400 font-extrabold">12 mins</span>
                      </div>
                      <div className="p-3 bg-zinc-900/60 border border-zinc-850 rounded-xl flex justify-between items-center">
                        <span className="text-zinc-400">First-contact SLA status</span>
                        <span className="text-emerald-400 font-extrabold">98.2%</span>
                      </div>
                    </div>
                  </div>

                  {/* Planner Performance */}
                  <div className="p-6 border border-zinc-850 bg-[#161618]/30 rounded-2xl space-y-4 md:col-span-2">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <UserCheck size={14} className="text-purple-400" />
                      Planner Performance Leaderboard
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                      {[
                        { name: "Lokesh Nagrikar", deals: 15, conversion: "74%", sales: "₹45 L" },
                        { name: "Shreya Gupta", deals: 12, conversion: "68%", sales: "₹38 L" },
                        { name: "Rahul Sharma", deals: 9, conversion: "55%", sales: "₹28 L" },
                        { name: "Priya Patel", deals: 6, conversion: "48%", sales: "₹18 L" },
                      ].map((planner) => (
                        <div key={planner.name} className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-xl flex justify-between items-center">
                          <div>
                            <span className="font-bold text-zinc-200 block">{planner.name}</span>
                            <span className="text-[10px] text-zinc-500">{planner.deals} Closed Deals • {planner.conversion} Conversion</span>
                          </div>
                          <span className="text-emerald-450 font-black">{planner.sales}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {viewMode === "board" && (
                <KanbanBoard
                  leads={filteredLeads}
                  teamMembers={teamMembers}
                  onStageChange={handleStageChange}
                  onLeadClick={setSelectedLeadId}
                />
              )}

              {viewMode === "table" && (
                <AdvancedTable
                  leads={filteredLeads}
                  teamMembers={teamMembers}
                  onLeadClick={setSelectedLeadId}
                  searchQuery={searchQuery}
                  pagination={pagination}
                  onPageChange={setCurrentPage}
                />
              )}

              {viewMode === "list" && (
                <ListView
                  leads={filteredLeads}
                  teamMembers={teamMembers}
                  onLeadClick={setSelectedLeadId}
                />
              )}

              {viewMode === "timeline" && (
                <TimelineView
                  leads={filteredLeads}
                  teamMembers={teamMembers}
                  onLeadClick={setSelectedLeadId}
                />
              )}

              {/* Recycle Bin / Soft Deleted leads */}
              {viewMode === "recycle" && (
                <div className="space-y-4 font-semibold text-xs select-none">
                  <div className="border border-zinc-900 bg-zinc-950/20 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-900 bg-zinc-950/40 text-[10px] uppercase font-bold tracking-widest text-zinc-450">
                      Soft-Deleted Leads Recycle Bin
                    </div>
                    <div className="divide-y divide-zinc-900/60">
                      {recycleBin.map((lead) => (
                        <div key={lead.id} className="p-4 flex items-center justify-between hover:bg-[#161618]/20 transition">
                          <div>
                            <span className="font-bold text-zinc-200 block">{lead.name}</span>
                            <span className="text-[10px] text-zinc-500 font-medium">{lead.eventType} • ₹{lead.budget?.toLocaleString()}</span>
                          </div>
                          <button
                            onClick={() => handleRestoreLead(lead)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/10 border border-purple-500/20 hover:bg-purple-600/20 text-purple-400 rounded-xl transition"
                          >
                            <RefreshCw size={12} />
                            Restore Lead
                          </button>
                        </div>
                      ))}
                      {recycleBin.length === 0 && (
                        <div className="p-12 text-center text-zinc-650 italic">
                          No soft-deleted leads inside the Recycle Bin.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </main>

      {/* Slide-In Details Drawer */}
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

      {/* Quick-Add Lead Modal overlay */}
      {showQuickAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md p-6 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl text-white space-y-4 relative">
            <button onClick={() => setShowQuickAddModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
              <XIcon size={16} />
            </button>
            <h3 className="text-base font-bold">Quick Log Lead</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                quickAddLeadMutation.mutate({
                  name: quickAddName,
                  phone: quickAddPhone || "9999999999",
                  email: quickAddEmail || null,
                  eventType: quickAddType,
                  eventDate: new Date().toISOString().split("T")[0],
                  budget: Number(quickAddBudget) || 100000,
                  leadSource: quickAddSource,
                  notes: ""
                });
              }}
              className="space-y-4 text-xs font-semibold"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-550 uppercase">Client Name</label>
                <input
                  type="text"
                  value={quickAddName}
                  onChange={(e) => setQuickAddName(e.target.value)}
                  placeholder="Rahul Saxena"
                  required
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-550 uppercase">Phone</label>
                  <input
                    type="text"
                    value={quickAddPhone}
                    onChange={(e) => setQuickAddPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-550 uppercase">Email</label>
                  <input
                    type="email"
                    value={quickAddEmail}
                    onChange={(e) => setQuickAddEmail(e.target.value)}
                    placeholder="rahul@mail.com"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-550 uppercase">Event Type</label>
                  <select
                    value={quickAddType}
                    onChange={(e) => setQuickAddType(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                  >
                    <option value="WEDDING">Wedding</option>
                    <option value="BIRTHDAY">Birthday</option>
                    <option value="ENGAGEMENT">Engagement</option>
                    <option value="CORPORATE">Corporate</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-550 uppercase">Budget (INR)</label>
                  <input
                    type="number"
                    value={quickAddBudget}
                    onChange={(e) => setQuickAddBudget(e.target.value)}
                    placeholder="250000"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={quickAddLeadMutation.isPending}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold"
              >
                {quickAddLeadMutation.isPending ? "Logging..." : "Log Lead"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal overlay */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl text-white space-y-4 relative">
            <button onClick={() => setShowImportModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
              <XIcon size={16} />
            </button>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Upload size={16} className="text-purple-400" />
              Bulk Import CRM Leads
            </h3>
            <p className="text-xs text-zinc-450">
              Format: Name, Phone, Email, EventType, Budget, Source, Notes. Paste raw comma-separated rows below.
            </p>
            <form onSubmit={handleCsvImport} className="space-y-4 text-xs font-semibold">
              <textarea
                value={csvRawText}
                onChange={(e) => setCsvRawText(e.target.value)}
                placeholder={`Kapoor Wedding Decor,9876543210,kapoor@mail.com,WEDDING,500000,Referral,Wants led stage\nJain Anniversary,8888888888,jain@mail.com,BIRTHDAY,150000,Instagram,Pastel colors`}
                rows={8}
                className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-[11px] leading-relaxed focus:outline-none"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold"
              >
                Verify & Bulk Import
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Duplicate Leads Merger Modal overlay */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-xl p-6 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl text-white space-y-4 relative">
            <button onClick={() => setShowDuplicateModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
              <XIcon size={16} />
            </button>
            <h3 className="text-base font-bold flex items-center gap-2">
              <GitMerge size={16} className="text-purple-400" />
              Resolve Duplicate Leads
            </h3>
            <p className="text-xs text-zinc-450 font-medium">
              We identified matching emails/phones. Select which lead to retain and merge details.
            </p>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {duplicateGroups.map((group, idx) => {
                const leadA = group[0];
                const leadB = group[1];
                return (
                  <div key={idx} className="p-4 bg-zinc-900/60 border border-zinc-850 rounded-xl space-y-3 text-xs font-semibold">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Group #{idx+1}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg space-y-2">
                        <span className="font-extrabold text-zinc-200 block">{leadA.name}</span>
                        <p className="text-[10px] text-zinc-500 font-medium">{leadA.email || leadA.contact?.email} • {leadA.phone || leadA.contact?.phone}</p>
                        <button
                          onClick={() => handleMergeLeads(leadA, leadB)}
                          className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold text-[10px] transition mt-2"
                        >
                          Keep & Merge Details
                        </button>
                      </div>
                      <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg space-y-2">
                        <span className="font-extrabold text-zinc-200 block">{leadB.name}</span>
                        <p className="text-[10px] text-zinc-500 font-medium">{leadB.email || leadB.contact?.email} • {leadB.phone || leadB.contact?.phone}</p>
                        <button
                          onClick={() => handleMergeLeads(leadB, leadA)}
                          className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold text-[10px] transition mt-2"
                        >
                          Keep & Merge Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Inline fallback wrapper for X icon since standard lucide X matches other imports
function XIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}
