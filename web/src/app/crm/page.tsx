"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { api } from "@/lib/api";
import { 
  Plus, 
  ArrowLeft, 
  Phone, 
  Mail, 
  Calendar, 
  Briefcase, 
  Clock, 
  X, 
  Save, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  User,
  MoreVertical,
  ChevronRight,
  Search,
  List,
  LayoutGrid,
  Trash2,
  Edit2,
  Filter,
  Globe,
  MessageSquare,
  Instagram,
  Facebook,
  Award,
  PhoneCall,
  Users,
  AlertTriangle
} from "lucide-react";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5 text-xs text-red-400 space-y-2">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle size={14} />
            Column Error
          </div>
          <p className="text-[10px] text-zinc-400">Failed to render this section.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

interface Lead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  eventType?: string;
  eventDate?: string;
  budget: number;
  status: string;
  leadSource?: string;
  notes?: string;
  assignedUserId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Activity {
  id: string;
  activityType: string;
  description: string;
  createdAt: string;
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: {
    name: string;
  };
}

interface LeadsResponse {
  data: Lead[];
  pagination?: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

const STAGES = [
  { key: "NEW", label: "New Lead", color: "border-purple-500/20 bg-purple-500/5 text-purple-400" },
  { key: "CONTACTED", label: "Contacted", color: "border-blue-500/20 bg-blue-500/5 text-blue-400" },
  { key: "QUOTE_SENT", label: "Quotation Sent", color: "border-amber-500/20 bg-amber-500/5 text-amber-400" },
  { key: "NEGOTIATION", label: "Negotiation", color: "border-orange-500/20 bg-orange-500/5 text-orange-400" },
  { key: "BOOKED", label: "Booked", color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" },
  { key: "COMPLETED", label: "Completed", color: "border-zinc-800/20 bg-zinc-800/5 text-zinc-400" },
  { key: "LOST", label: "Lost", color: "border-red-500/20 bg-red-500/5 text-red-400" }
];

const SOURCES = ["Website", "WhatsApp", "Instagram", "Facebook", "Referral", "Manual"];

export default function CrmPage() {
  const queryClient = useQueryClient();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [newActivityText, setNewActivityText] = useState("");
  const [newActivityType, setNewActivityType] = useState("NOTE");

  // Advanced Filters and Layout State
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "budgetDesc" | "budgetAsc">("newest");
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Pagination and Hydration State
  const [currentPage, setCurrentPage] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    eventType: "",
    eventDate: "",
    budget: 0,
    leadSource: "Website",
    notes: "",
    assignedUserId: ""
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter change handlers that reset pagination
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(0);
  };
  const handleSourceFilterChange = (val: string) => {
    setSourceFilter(val);
    setCurrentPage(0);
  };
  const handleAssigneeFilterChange = (val: string) => {
    setAssigneeFilter(val);
    setCurrentPage(0);
  };
  const handleMinBudgetChange = (val: string) => {
    setMinBudget(val);
    setCurrentPage(0);
  };
  const handleMaxBudgetChange = (val: string) => {
    setMaxBudget(val);
    setCurrentPage(0);
  };
  const handleSortByChange = (val: any) => {
    setSortBy(val);
    setCurrentPage(0);
  };

  // 1. Query leads (paginated/filtered on server)
  const { data: leadsResponse, isLoading } = useQuery<LeadsResponse>({
    queryKey: ["leads", currentPage, searchQuery, sourceFilter, assigneeFilter, minBudget, maxBudget, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("size", "50"); // Fetch up to 50 leads per page
      
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
    }
  });

  const leads = leadsResponse?.data || [];
  const pagination = leadsResponse?.pagination;

  // 2. Query team members for assignment
  const { data: teamResponse } = useQuery<{ data: TeamMember[] }>({
    queryKey: ["teamMembers"],
    queryFn: async () => {
      const response = await api.get("/auth/settings/team");
      return response.data;
    }
  });

  const teamMembers = teamResponse?.data || [];

  // 3. Query selected lead details & activities
  const { data: activitiesResponse, refetch: refetchActivities } = useQuery<{ data: Activity[] }>({
    queryKey: ["activities", selectedLeadId],
    queryFn: async () => {
      if (!selectedLeadId) return { data: [] };
      const response = await api.get(`/crm/leads/${selectedLeadId}/activities`);
      return response.data;
    },
    enabled: !!selectedLeadId
  });

  const activities = activitiesResponse?.data || [];
  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  // Populate Edit Form when a lead is selected or editing starts
  useEffect(() => {
    if (selectedLead) {
      setEditForm({
        name: selectedLead.name,
        phone: selectedLead.phone || "",
        email: selectedLead.email || "",
        eventType: selectedLead.eventType || "",
        eventDate: selectedLead.eventDate || "",
        budget: selectedLead.budget || 0,
        leadSource: selectedLead.leadSource || "Website",
        notes: selectedLead.notes || "",
        assignedUserId: selectedLead.assignedUserId || ""
      });
    }
  }, [selectedLeadId, selectedLead, isEditing]);

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      const response = await api.patch(`/crm/leads/${leadId}/status`, { status });
      return response.data;
    },
    onMutate: async ({ leadId, status }) => {
      const queryKey = ["leads", currentPage, searchQuery, sourceFilter, assigneeFilter, minBudget, maxBudget, sortBy];
      await queryClient.cancelQueries({ queryKey });
      const previousLeads = queryClient.getQueryData<LeadsResponse>(queryKey);
      if (previousLeads) {
        queryClient.setQueryData<LeadsResponse>(queryKey, {
          ...previousLeads,
          data: previousLeads.data.map((lead) =>
            lead.id === leadId ? { ...lead, status } : lead
          ),
        });
      }
      return { previousLeads };
    },
    onError: (err, newVariables, context) => {
      const queryKey = ["leads", currentPage, searchQuery, sourceFilter, assigneeFilter, minBudget, maxBudget, sortBy];
      if (context?.previousLeads) {
        queryClient.setQueryData(queryKey, context.previousLeads);
      }
    },
    onSuccess: () => {
      if (selectedLeadId) {
        refetchActivities();
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
    }
  });

  const updateLeadMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const response = await api.put(`/crm/leads/${selectedLeadId}`, updatedData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
      setIsEditing(false);
      refetchActivities();
    }
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/crm/leads/${selectedLeadId}`);
    },
    onSuccess: () => {
      setSelectedLeadId(null);
      setShowDeleteConfirm(false);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
    }
  });

  const addActivityMutation = useMutation({
    mutationFn: async ({ leadId, type, description }: { leadId: string; type: string; description: string }) => {
      const response = await api.post(`/crm/leads/${leadId}/activities`, { type, description });
      return response.data;
    },
    onSuccess: () => {
      setNewActivityText("");
      refetchActivities();
    }
  });

  // Action Handlers
  const handleStageChange = (leadId: string, newStatus: string) => {
    updateStatusMutation.mutate({ leadId, status: newStatus });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId) return;

    updateLeadMutation.mutate({
      name: editForm.name,
      phone: editForm.phone,
      email: editForm.email,
      eventType: editForm.eventType,
      eventDate: editForm.eventDate,
      budget: editForm.budget,
      leadSource: editForm.leadSource,
      notes: editForm.notes,
      assignedUserId: editForm.assignedUserId || null
    });
  };

  const handleDeleteSubmit = () => {
    if (!selectedLeadId) return;
    deleteLeadMutation.mutate();
  };

  const handleAddActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !newActivityText.trim()) return;

    addActivityMutation.mutate({
      leadId: selectedLeadId,
      type: newActivityType,
      description: newActivityText
    });
  };

  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }
    handleStageChange(draggableId, destination.droppableId);
  };

  // Helper selectors
  const getAssigneeName = (userId?: string) => {
    if (!userId) return "Unassigned";
    const member = teamMembers.find((m) => m.id === userId);
    return member ? `${member.firstName} ${member.lastName}` : "Assigned";
  };

  const getSourceIcon = (source?: string) => {
    switch (source?.toUpperCase()) {
      case "WEBSITE": return <Globe size={12} className="text-blue-400" />;
      case "WHATSAPP": return <MessageSquare size={12} className="text-emerald-400" />;
      case "INSTAGRAM": return <Instagram size={12} className="text-pink-400" />;
      case "FACEBOOK": return <Facebook size={12} className="text-indigo-400" />;
      case "REFERRAL": return <Award size={12} className="text-amber-400" />;
      default: return <User size={12} className="text-zinc-400" />;
    }
  };

  const getActivityIcon = (type?: string) => {
    switch (type?.toUpperCase()) {
      case "CALL": return <PhoneCall size={12} className="text-blue-400" />;
      case "WHATSAPP": return <MessageSquare size={12} className="text-emerald-400" />;
      case "MEETING": return <Users size={12} className="text-purple-400" />;
      default: return <Clock size={12} className="text-zinc-400" />;
    }
  };

  // Client-side filtering only for "Unassigned" case since backend search matches exact assignedUserId
  const displayedLeads = leads.filter((lead) => {
    if (assigneeFilter === "UNASSIGNED") {
      return !lead.assignedUserId;
    }
    return true;
  });

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-400 flex flex-col justify-center items-center gap-2 text-xs">
        <Clock className="animate-spin text-purple-500" size={16} />
        Initializing sales pipeline...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col transition-all duration-200">
      
      {/* Top Header Controls */}
      <nav className="border-b border-zinc-800 bg-[#111113]/80 backdrop-blur px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.href = "/"}
            className="h-8 w-8 rounded-md bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">CRM</span>
            <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">Sales Workspace</span>
          </div>
        </div>

        {/* Search & Layout Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick search input */}
          <div className="relative w-full md:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search leads..."
              className="w-full pl-9 pr-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs placeholder-zinc-400 text-white focus:outline-none focus:border-purple-600"
            />
          </div>

          {/* Filters Toggle */}
          <button 
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`px-3 py-1.5 border rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${showFiltersPanel ? "bg-purple-950/20 border-purple-500/40 text-purple-400" : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800"}`}
          >
            <Filter size={14} />
            Advanced Filters
          </button>

          {/* Layout Mode Toggle */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            <button 
              onClick={() => setViewMode("board")}
              className={`p-1.5 rounded-md transition-all ${viewMode === "board" ? "bg-zinc-800 text-purple-400" : "text-zinc-400 hover:text-zinc-300"}`}
              title="Pipeline Board"
            >
              <LayoutGrid size={14} />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-zinc-800 text-purple-400" : "text-zinc-400 hover:text-zinc-300"}`}
              title="List View"
            >
              <List size={14} />
            </button>
          </div>

          {/* Create Button */}
          <button 
            onClick={() => window.location.href = "/crm/new"}
            className="flex items-center gap-2 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-md"
          >
            <Plus size={14} />
            Log New Lead
          </button>
        </div>
      </nav>

      {/* Advanced Filters Drawer Panel */}
      {showFiltersPanel && (
        <div className="bg-[#111113]/55 border-b border-zinc-800 p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Source</span>
            <select
              value={sourceFilter}
              onChange={(e) => handleSourceFilterChange(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-xs focus:outline-none focus:border-purple-600"
            >
              <option value="ALL">All Sources</option>
              {SOURCES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Assignee</span>
            <select
              value={assigneeFilter}
              onChange={(e) => handleAssigneeFilterChange(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-xs focus:outline-none focus:border-purple-600"
            >
              <option value="ALL">All Members</option>
              <option value="UNASSIGNED">Unassigned</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 col-span-1 md:col-span-2">
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Budget Range (INR)</span>
            <div className="flex gap-2 items-center">
              <input 
                type="number" 
                value={minBudget}
                onChange={(e) => handleMinBudgetChange(e.target.value)}
                placeholder="Min Budget"
                className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs placeholder-zinc-400 text-white focus:outline-none focus:border-purple-600"
              />
              <span className="text-zinc-400 text-xs">to</span>
              <input 
                type="number" 
                value={maxBudget}
                onChange={(e) => handleMaxBudgetChange(e.target.value)}
                placeholder="Max Budget"
                className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs placeholder-zinc-400 text-white focus:outline-none focus:border-purple-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Sort Order</span>
            <select
              value={sortBy}
              onChange={(e) => handleSortByChange(e.target.value as any)}
              className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-xs focus:outline-none focus:border-purple-600"
            >
              <option value="newest">Newest First</option>
              <option value="budgetDesc">Budget: High to Low</option>
              <option value="budgetAsc">Budget: Low to High</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Workspace Board/List rendering */}
      <div className="flex-1 overflow-auto p-6 flex flex-col justify-between">
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex flex-col gap-2 justify-center items-center h-[50vh] text-zinc-400 animate-pulse text-xs">
              <Clock className="animate-spin text-purple-500" size={16} />
              Loading active pipeline boards...
            </div>
          ) : viewMode === "board" ? (
            /* KANBAN BOARD VIEW WITH TOUCH-FRIENDLY DRAG & DROP */
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex overflow-x-auto gap-6 items-start h-full pb-4 select-none">
                {STAGES.map((stage) => {
                  const stageLeads = displayedLeads.filter((l) => l.status === stage.key);

                  return (
                    <Droppable key={stage.key} droppableId={stage.key}>
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`w-80 shrink-0 border rounded-xl p-4 flex flex-col max-h-[75vh] overflow-hidden transition-all duration-200 ${
                            snapshot.isDraggingOver 
                              ? "border-purple-500/50 bg-purple-500/5 shadow-lg shadow-purple-950/5 scale-[1.01]" 
                              : "border-zinc-800/80 bg-[#111113]/40"
                          }`}
                        >
                          {/* Column Header */}
                          <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800/60 shrink-0">
                            <div className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full ${stage.key === 'NEW' ? 'bg-purple-500' : stage.key === 'BOOKED' ? 'bg-emerald-500' : stage.key === 'LOST' ? 'bg-red-500' : 'bg-blue-500'}`} />
                              <h3 className="text-xs font-bold text-zinc-200">{stage.label}</h3>
                            </div>
                            <span className="text-[10px] bg-zinc-800/60 px-2 py-0.5 rounded text-zinc-400 font-bold">
                              {stageLeads.length}
                            </span>
                          </div>

                          {/* Cards Container wrapped in ErrorBoundary */}
                          <ErrorBoundary fallback={
                            <div className="h-24 border border-dashed border-red-900/30 rounded-lg flex flex-col items-center justify-center text-[10px] text-red-400 bg-red-950/5 p-4 space-y-1">
                              <AlertTriangle size={14} />
                              <span>Error rendering column</span>
                            </div>
                          }>
                            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[150px]">
                              {stageLeads.map((lead, index) => (
                                <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                  {(dragProvided, dragSnapshot) => (
                                    <div 
                                      ref={dragProvided.innerRef}
                                      {...dragProvided.draggableProps}
                                      {...dragProvided.dragHandleProps}
                                      onClick={() => setSelectedLeadId(lead.id)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                          e.preventDefault();
                                          setSelectedLeadId(lead.id);
                                        }
                                      }}
                                      tabIndex={0}
                                      role="button"
                                      aria-label={`Lead ${lead.name}, budget ${lead.budget ? `₹${(lead.budget / 100000).toFixed(1)}L` : "₹0"}`}
                                      className={`p-4 rounded-lg border bg-[#18181B] hover:border-purple-500/30 hover:shadow-lg transition-all cursor-grab active:cursor-grabbing space-y-3 group ${
                                        dragSnapshot.isDragging ? "border-purple-500/60 shadow-2xl bg-zinc-900" : "border-zinc-800"
                                      }`}
                                    >
                                      <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-xs text-zinc-200 group-hover:text-purple-400 transition-colors leading-snug">{lead.name}</h4>
                                        <span className="text-[10px] text-emerald-400 font-mono font-bold">
                                          {lead.budget ? `₹${(lead.budget / 100000).toFixed(1)}L` : "₹0"}
                                        </span>
                                      </div>

                                      <div className="space-y-1 text-[10px] text-zinc-400">
                                        {lead.eventType && (
                                          <div className="flex items-center gap-1.5">
                                            <Briefcase size={11} className="text-zinc-400 shrink-0" />
                                            <span>{lead.eventType}</span>
                                          </div>
                                        )}
                                        {lead.eventDate && (
                                          <div className="flex items-center gap-1.5">
                                            <Calendar size={11} className="text-zinc-400 shrink-0" />
                                            <span>{lead.eventDate}</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Owner & Source metadata row */}
                                      <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800/60 text-[10px] shrink-0">
                                        <span className="flex items-center gap-1 text-zinc-400">
                                          {getSourceIcon(lead.leadSource)}
                                          <span className="truncate max-w-[90px]">{lead.leadSource || "Website"}</span>
                                        </span>
                                        
                                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                                          <span className="truncate max-w-[80px]">{getAssigneeName(lead.assignedUserId)}</span>
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                              {stageLeads.length === 0 && (
                                <div className="h-24 border border-dashed border-zinc-800 rounded-lg flex items-center justify-center text-[10px] text-zinc-400 italic select-none">
                                  No leads in stage
                                </div>
                              )}
                            </div>
                          </ErrorBoundary>
                        </div>
                      )}
                    </Droppable>
                  );
                })}
              </div>
            </DragDropContext>
          ) : (
            /* TABLE LIST VIEW WITH SEARCH AND FILTER */
            <ErrorBoundary fallback={
              <div className="p-10 border border-red-500/20 bg-red-500/5 text-center rounded-xl text-red-400 text-xs">
                Failed to render list of leads.
              </div>
            }>
              <div className="w-full border border-zinc-800 bg-[#111113]/30 rounded-xl overflow-hidden shadow-sm animate-in fade-in duration-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-[#18181B] text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                        <th className="px-6 py-3.5">Lead Name</th>
                        <th className="px-6 py-3.5">Budget</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5">Event details</th>
                        <th className="px-6 py-3.5">Source</th>
                        <th className="px-6 py-3.5">Assignee</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-xs">
                      {displayedLeads.map((lead) => (
                        <tr 
                          key={lead.id}
                          onClick={() => setSelectedLeadId(lead.id)}
                          className="hover:bg-zinc-800/35 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-3.5">
                            <div className="font-bold text-zinc-200 hover:text-purple-400 transition-colors">
                              {lead.name}
                            </div>
                            <div className="text-[10px] text-zinc-400 pt-0.5">
                              {lead.email || lead.phone || "No contact info"}
                            </div>
                          </td>
                          <td className="px-6 py-3.5 font-bold font-mono text-emerald-400">
                            ₹{lead.budget?.toLocaleString() || "0"}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${STAGES.find((s) => s.key === lead.status)?.color || "border-zinc-800 bg-zinc-900 text-zinc-400"}`}>
                              {STAGES.find((s) => s.key === lead.status)?.label || lead.status}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-zinc-300">
                            <div className="font-medium">{lead.eventType || "---"}</div>
                            <div className="text-[10px] text-zinc-400 pt-0.5">{lead.eventDate || "---"}</div>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="flex items-center gap-1.5 text-zinc-300 text-[11px]">
                              {getSourceIcon(lead.leadSource)}
                              <span>{lead.leadSource || "Website"}</span>
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-zinc-400">
                            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-medium text-[11px]">
                              {getAssigneeName(lead.assignedUserId)}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {displayedLeads.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-zinc-400 italic text-xs">
                            No active leads found matching the selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </ErrorBoundary>
          )}
        </div>

        {/* Server-Side Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800/60 mt-4 shrink-0 text-xs text-zinc-400">
            <div>
              Showing page <span className="text-zinc-200 font-semibold">{pagination.page + 1}</span> of <span className="text-zinc-200 font-semibold">{pagination.totalPages}</span> ({pagination.totalElements} total leads)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:hover:bg-zinc-900 transition-colors font-semibold"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages - 1, p + 1))}
                disabled={currentPage === pagination.totalPages - 1}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:hover:bg-zinc-900 transition-colors font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Slide-over Drawer wrapped in ErrorBoundary */}
      {selectedLeadId && selectedLead && (
        <ErrorBoundary fallback={
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[#111113] border-l border-zinc-800 p-6 flex flex-col justify-center items-center text-center text-red-400 text-xs space-y-2">
            <AlertTriangle size={24} />
            <span className="font-bold">Error loading profile</span>
            <p className="text-zinc-400">Something went wrong while rendering the details drawer.</p>
            <button 
              onClick={() => setSelectedLeadId(null)}
              className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-semibold"
            >
              Close Drawer
            </button>
          </div>
        }>
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
            {/* Close click blocker */}
            <div className="flex-1" onClick={() => { if (!isEditing) setSelectedLeadId(null); }} />
            
            <div className="w-full max-w-lg bg-[#111113] border-l border-zinc-800 h-full flex flex-col shadow-2xl p-6 overflow-hidden animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="flex justify-between items-start pb-4 border-b border-zinc-800 shrink-0">
                <div>
                  <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">CRM Lead Profile</span>
                  <h2 className="text-lg font-bold mt-1 text-white truncate max-w-[320px]">{selectedLead.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                  {/* Edit Toggle */}
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${isEditing ? "bg-zinc-855 hover:bg-zinc-800 text-zinc-300" : "bg-purple-650 hover:bg-purple-700 text-white"}`}
                  >
                    <Edit2 size={13} />
                    {isEditing ? "Cancel" : "Edit"}
                  </button>

                  {/* Delete Button */}
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="h-8 w-8 rounded-lg bg-red-950/20 hover:bg-red-900/20 border border-red-900/35 hover:border-red-500/40 text-red-400 flex items-center justify-center transition-colors"
                    title="Delete Lead"
                  >
                    <Trash2 size={14} />
                  </button>

                  <button 
                    onClick={() => { setSelectedLeadId(null); setIsEditing(false); }}
                    className="h-8 w-8 rounded-lg bg-zinc-850 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Profile Content */}
              <div className="flex-1 overflow-y-auto py-6 space-y-6">
                
                {/* DELETE CONFIRM MODAL OVERLAY */}
                {showDeleteConfirm && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-3 text-xs text-red-400 animate-in fade-in duration-100">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="shrink-0 mt-0.5 text-red-500" size={16} />
                      <div>
                        <p className="font-bold text-zinc-100">Confirm Soft Deletion?</p>
                        <p className="text-zinc-400 leading-normal pt-1">This will soft-delete the lead from the sales pipeline, but historical logs will remain intact.</p>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-1">
                      <button 
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded hover:bg-zinc-800 font-semibold"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleDeleteSubmit}
                        disabled={deleteLeadMutation.isPending}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 font-semibold flex items-center gap-1.5"
                      >
                        Delete Profile
                      </button>
                    </div>
                  </div>
                )}

                {isEditing ? (
                  /* EDIT DETAILS FORM */
                  <form onSubmit={handleEditSubmit} className="space-y-4 text-xs bg-[#18181B] p-5 rounded-xl border border-zinc-800">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 uppercase font-bold">Client Name</label>
                      <input 
                        type="text"
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-650"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 uppercase font-bold">Phone</label>
                        <input 
                          type="text"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-650"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 uppercase font-bold">Email</label>
                        <input 
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-650"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 uppercase font-bold">Event Type</label>
                        <input 
                          type="text"
                          value={editForm.eventType}
                          onChange={(e) => setEditForm({ ...editForm, eventType: e.target.value })}
                          placeholder="Wedding, Corporate..."
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-650"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 uppercase font-bold">Event Date</label>
                        <input 
                          type="date"
                          value={editForm.eventDate}
                          onChange={(e) => setEditForm({ ...editForm, eventDate: e.target.value })}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-650"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 uppercase font-bold">Budget (INR)</label>
                        <input 
                          type="number"
                          value={editForm.budget}
                          onChange={(e) => setEditForm({ ...editForm, budget: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-650"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 uppercase font-bold">Lead Source</label>
                        <select
                          value={editForm.leadSource}
                          onChange={(e) => setEditForm({ ...editForm, leadSource: e.target.value })}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-650"
                        >
                          {SOURCES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 uppercase font-bold">Assigned Owner</label>
                      <select
                        value={editForm.assignedUserId}
                        onChange={(e) => setEditForm({ ...editForm, assignedUserId: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-650"
                      >
                        <option value="">Unassigned</option>
                        {teamMembers.map((m) => (
                          <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 uppercase font-bold">Notes</label>
                      <textarea 
                        rows={2}
                        value={editForm.notes}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-650"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={updateLeadMutation.isPending}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors shadow"
                    >
                      <Save size={13} />
                      Save Profiler Changes
                    </button>
                  </form>
                ) : (
                  /* READ-ONLY VIEW DETAILS PANEL */
                  <div className="grid grid-cols-2 gap-4 text-xs bg-[#18181B] p-5 rounded-xl border border-zinc-800 shadow-inner">
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Budget Allocation</span>
                      <span className="font-extrabold text-emerald-400 text-base">₹{selectedLead.budget?.toLocaleString() || "0"}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Pipeline Stage</span>
                      <span className={`inline-block mt-1 px-2.5 py-0.5 rounded text-[10px] font-bold border ${STAGES.find((s) => s.key === selectedLead.status)?.color || "border-zinc-800 bg-zinc-900 text-zinc-300"}`}>
                        {STAGES.find((s) => s.key === selectedLead.status)?.label || selectedLead.status}
                      </span>
                    </div>
                    <div className="space-y-1 pt-3 border-t border-zinc-800/60 col-span-2">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Assigned Owner</span>
                      <span className="font-semibold text-zinc-200">
                        {getAssigneeName(selectedLead.assignedUserId)}
                      </span>
                    </div>
                    <div className="space-y-1 pt-3 border-t border-zinc-800/60 col-span-2">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Lead Source</span>
                      <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                        {getSourceIcon(selectedLead.leadSource)}
                        <span>{selectedLead.leadSource || "Website"}</span>
                      </span>
                    </div>
                    <div className="space-y-1 pt-3 border-t border-zinc-800/60 col-span-2">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Phone</span>
                      <span className="flex items-center gap-2 text-zinc-200">
                        <Phone size={12} className="text-zinc-400 shrink-0" />
                        {selectedLead.phone || "---"}
                      </span>
                    </div>
                    <div className="space-y-1 pt-3 border-t border-zinc-800/60 col-span-2">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Email</span>
                      <span className="flex items-center gap-2 text-zinc-200">
                        <Mail size={12} className="text-zinc-400 shrink-0" />
                        {selectedLead.email || "---"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Lead Notes */}
                {!isEditing && selectedLead.notes && (
                  <div className="space-y-2 text-xs">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Internal Notes</span>
                    <p className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg text-zinc-300 leading-relaxed italic">
                      "{selectedLead.notes}"
                    </p>
                  </div>
                )}

                {/* Add Activity Form */}
                <div className="space-y-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 text-xs">
                  <h3 className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Add Activity Log</h3>
                  <form onSubmit={handleAddActivitySubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={newActivityType}
                        onChange={(e) => setNewActivityType(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#18181B] border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-650"
                      >
                        <option value="NOTE">General Note</option>
                        <option value="CALL">Phone Call</option>
                        <option value="WHATSAPP">WhatsApp Message</option>
                        <option value="MEETING">In-Person Meeting</option>
                      </select>
                      
                      <button
                        type="submit"
                        disabled={addActivityMutation.isPending}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Save size={13} />
                        Log Activity
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={newActivityText}
                      onChange={(e) => setNewActivityText(e.target.value)}
                      placeholder="E.g., Client requested stages with dynamic floral ceiling..."
                      className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-xs placeholder-zinc-400 text-white focus:outline-none focus:border-purple-650"
                    />
                  </form>
                </div>

                {/* Activity Timeline logs */}
                <div className="space-y-4">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">Activity Log History</span>
                  <div className="relative border-l border-zinc-800 pl-4 ml-2 space-y-6 text-xs py-1">
                    {activities.map((activity) => (
                      <div key={activity.id} className="relative">
                        <div className="absolute -left-[21px] mt-1 h-2 w-2 rounded-full bg-purple-500 ring-4 ring-[#111113]" />
                        <div className="flex justify-between items-center text-zinc-400">
                          <span className="font-bold text-[9px] uppercase flex items-center gap-1">
                            {getActivityIcon(activity.activityType)}
                            <span>{activity.activityType}</span>
                          </span>
                          <span>{new Date(activity.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-zinc-200 mt-1.5 leading-relaxed font-medium">{activity.description}</p>
                      </div>
                    ))}
                    {activities.length === 0 && (
                      <p className="text-zinc-400 text-center italic py-2">No activities logged yet.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </ErrorBoundary>
      )}

    </div>
  );
}
