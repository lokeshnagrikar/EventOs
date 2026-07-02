"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Layers,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Sparkles,
  ArrowUpRight,
  Inbox,
  Activity,
  CloudSun,
  UserCheck,
  Award,
  AlertCircle
} from "lucide-react";
import KpiCard from "../dashboard/KpiCard";
import EventCard from "./EventCard";
import { cn } from "@/lib/utils";

export interface Event {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  location?: string;
  venueName?: string;
  venueAddress?: string;
  guestCount?: number;
  guestList?: string;
  budget?: number;
  notes?: string;
}

const EVENT_TYPES = [
  { key: "WEDDING", label: "Wedding", color: "border-pink-500/20 bg-pink-500/5 text-pink-400" },
  { key: "BIRTHDAY", label: "Birthday", color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-450" },
  { key: "ENGAGEMENT", label: "Engagement", color: "border-purple-500/20 bg-purple-500/5 text-purple-400" },
  { key: "CORPORATE", label: "Corporate", color: "border-blue-500/20 bg-blue-500/5 text-blue-400" }
];

const COLUMNS = [
  { id: "PLANNING", label: "Planning", color: "border-zinc-700/50 bg-zinc-950/20 text-zinc-400" },
  { id: "PROPOSAL_SENT", label: "Proposal", color: "border-pink-550/20 bg-pink-500/5 text-pink-400" },
  { id: "CONFIRMED", label: "Confirmed", color: "border-blue-500/20 bg-blue-500/5 text-blue-400" },
  { id: "VENDOR_ASSIGNED", label: "Vendors Assigned", color: "border-cyan-500/20 bg-cyan-500/5 text-cyan-400" },
  { id: "IN_PREPARATION", label: "Preparation", color: "border-purple-500/20 bg-purple-550/5 text-purple-400" },
  { id: "IN_PROGRESS", label: "In Progress", color: "border-amber-500/20 bg-amber-500/5 text-amber-400" },
  { id: "COMPLETED", label: "Completed", color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-450" },
  { id: "ARCHIVED", label: "Archived", color: "border-zinc-600/20 bg-zinc-650/5 text-zinc-400" },
  { id: "CANCELLED", label: "Cancelled", color: "border-red-500/20 bg-red-550/5 text-red-400" }
];

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planning",
  PROPOSAL_SENT: "Proposal Sent",
  CONFIRMED: "Confirmed",
  VENDOR_ASSIGNED: "Vendor Assigned",
  IN_PREPARATION: "In Preparation",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
  CANCELLED: "Cancelled"
};

const STATUS_COLORS: Record<string, string> = {
  PLANNING: "border-zinc-550/20 bg-zinc-500/5 text-zinc-400",
  PROPOSAL_SENT: "border-pink-500/20 bg-pink-500/5 text-pink-450",
  CONFIRMED: "border-blue-500/20 bg-blue-500/5 text-blue-400",
  VENDOR_ASSIGNED: "border-cyan-500/20 bg-cyan-500/5 text-cyan-400",
  IN_PREPARATION: "border-purple-500/20 bg-purple-500/5 text-purple-400",
  IN_PROGRESS: "border-amber-500/20 bg-amber-500/5 text-amber-400",
  COMPLETED: "border-emerald-500/20 bg-emerald-500/5 text-emerald-450",
  ARCHIVED: "border-zinc-500/20 bg-zinc-550/5 text-zinc-450",
  CANCELLED: "border-red-500/20 bg-red-550/5 text-red-400"
};

export default function EventsDashboard() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Saved Views & Filter Settings
  const [activeTab, setActiveTab] = useState<"dashboard" | "grid" | "list" | "kanban" | "calendar" | "timeline">("dashboard");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  
  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("WEDDING");
  const [formLocation, setFormLocation] = useState("");
  const [formVenueName, setFormVenueName] = useState("");
  const [formVenueAddress, setFormVenueAddress] = useState("");
  const [formGuestCount, setFormGuestCount] = useState("");
  const [formBudget, setFormBudget] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState("");

  // Calendar States
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarMode, setCalendarMode] = useState<"month" | "week" | "day">("month");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTab = localStorage.getItem("events_active_tab");
      if (savedTab) setActiveTab(savedTab as any);
      const savedSearch = localStorage.getItem("events_filter_search");
      if (savedSearch) setSearchQuery(savedSearch);
      const savedStatus = localStorage.getItem("events_filter_status");
      if (savedStatus) setStatusFilter(savedStatus);
      const savedType = localStorage.getItem("events_filter_type");
      if (savedType) setTypeFilter(savedType);
    }
  }, []);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    localStorage.setItem("events_active_tab", tab);
  };

  // Fetch events
  const { data: eventsResponse, isLoading } = useQuery<{ data: Event[] }>({
    queryKey: ["events"],
    queryFn: async () => {
      const response = await api.get("/events", { params: { page: 0, size: 500 } });
      return response.data;
    }
  });

  const events = useMemo(() => eventsResponse?.data || [], [eventsResponse]);

  // Client Filter Math
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (e.venueName || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (e.location || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === "ALL" || e.status === statusFilter;
      const matchType = typeFilter === "ALL" || e.type === typeFilter;
      
      const budget = e.budget || 0;
      let calculatedPriority = "LOW";
      if (budget >= 500000) calculatedPriority = "HIGH";
      else if (budget >= 200000) calculatedPriority = "MEDIUM";
      
      const matchPriority = priorityFilter === "ALL" || calculatedPriority === priorityFilter;

      return matchSearch && matchStatus && matchType && matchPriority;
    });
  }, [events, searchQuery, statusFilter, typeFilter, priorityFilter]);

  // KPI Calculations
  const kpiData = useMemo(() => {
    const active = events.filter((e) => e.status === "IN_PROGRESS").length;
    const upcoming = events.filter((e) => ["PLANNING", "PROPOSAL_SENT", "CONFIRMED", "VENDOR_ASSIGNED", "IN_PREPARATION"].includes(e.status)).length;
    const completed = events.filter((e) => e.status === "COMPLETED").length;
    const cancelled = events.filter((e) => e.status === "CANCELLED").length;
    const revenue = events
      .filter((e) => e.status !== "CANCELLED")
      .reduce((sum, e) => sum + (e.budget || 0), 0);

    return { active, upcoming, completed, cancelled, revenue };
  }, [events]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: string }) => {
      const response = await api.patch(`/events/${eventId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    }
  });

  const createEventMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post("/events", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error?.message || "Failed to provision event workspace.");
    }
  });

  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;
    updateStatusMutation.mutate({ eventId: draggableId, status: destination.droppableId });
  };

  const resetForm = () => {
    setFormName("");
    setFormLocation("");
    setFormVenueName("");
    setFormVenueAddress("");
    setFormGuestCount("");
    setFormBudget("");
    setFormStartDate("");
    setFormEndDate("");
    setFormNotes("");
    setFormError("");
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    
    const start = new Date(formStartDate);
    const end = new Date(formEndDate);
    if (end <= start) {
      setFormError("Event conclusion timestamp must occur after initialization date.");
      return;
    }

    createEventMutation.mutate({
      name: formName,
      type: formType,
      status: "PLANNING",
      startDate: new Date(formStartDate).toISOString(),
      endDate: new Date(formEndDate).toISOString(),
      location: formLocation || formVenueAddress,
      venueName: formVenueName,
      venueAddress: formVenueAddress,
      guestCount: formGuestCount ? parseInt(formGuestCount) : 0,
      budget: formBudget ? parseFloat(formBudget) : 0,
      notes: JSON.stringify({
        notesText: formNotes,
        priority: (parseFloat(formBudget) || 0) >= 500000 ? "HIGH" : "MEDIUM",
        tags: [formType.toLowerCase(), "new"],
        checklist: [],
        tasks: [],
        resources: []
      })
    });
  };

  // Calendar date navigations
  const handlePrevDate = () => {
    const d = new Date(currentDate);
    if (calendarMode === "month") d.setMonth(d.getMonth() - 1);
    else if (calendarMode === "week") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNextDate = () => {
    const d = new Date(currentDate);
    if (calendarMode === "month") d.setMonth(d.getMonth() + 1);
    else if (calendarMode === "week") d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const checkConflict = useCallback((event: Event) => {
    const start = new Date(event.startDate).getTime();
    const end = new Date(event.endDate).getTime();
    return events.some(other => {
      if (other.id === event.id || other.status === "CANCELLED") return false;
      const oStart = new Date(other.startDate).getTime();
      const oEnd = new Date(other.endDate).getTime();
      return (start < oEnd && end > oStart);
    });
  }, [events]);

  return (
    <div className="space-y-6 select-none relative">
      
      {/* Search and Filters toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Search size={13} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, venues..."
              className="w-full pl-9 pr-4 py-1.5 bg-zinc-950/40 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-purple-650 transition-all font-semibold"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "px-3 py-1.5 border rounded-xl text-xs font-bold flex items-center gap-2 transition-all",
              showFilters ? "bg-purple-950/20 border-purple-500/40 text-purple-400" : "bg-zinc-900 border-zinc-850 hover:bg-zinc-800 text-zinc-350"
            )}
          >
            <Filter size={13} />
            Filters
          </button>
        </div>

        {/* View Switchers */}
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900 border border-zinc-800/80 p-0.5 rounded-xl">
            {([
              { key: "dashboard", label: "Dashboard", icon: Activity },
              { key: "grid", label: "Grid", icon: Grid },
              { key: "list", label: "List", icon: List },
              { key: "kanban", label: "Kanban", icon: Layers },
              { key: "calendar", label: "Calendar", icon: CalendarIcon },
              { key: "timeline", label: "Timeline", icon: Clock }
            ] as const).map((view) => (
              <button
                key={view.key}
                onClick={() => handleTabChange(view.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                  activeTab === view.key ? "bg-zinc-800 text-purple-400" : "text-zinc-500 hover:text-zinc-350"
                )}
              >
                <view.icon size={12} />
                <span className="hidden md:inline">{view.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-650 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus size={13} />
            Provision Event
          </button>
        </div>
      </div>

      {/* Advanced Filters Expandable Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-[#121214]/40 border border-zinc-850 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-xs focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              {COLUMNS.map((col) => <option key={col.id} value={col.id}>{col.label}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">Category</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-xs focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {EVENT_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-xs focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Budget (₹5L+)</option>
              <option value="MEDIUM">Medium Budget (₹2L-₹5L)</option>
              <option value="LOW">Low Budget (Under ₹2L)</option>
            </select>
          </div>
        </motion.div>
      )}

      {/* WORKSPACE VIEW RENDERING */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[210px] rounded-2xl bg-zinc-900/10 border border-zinc-850 animate-pulse" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* EXECUTIVE EVENT DASHBOARD VIEW */}
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 font-semibold text-xs"
              >
                {/* Dashboard Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <KpiCard
                    title="Active Bookings"
                    value={kpiData.active}
                    subtitle="Currently in execution"
                    icon={CheckCircle2}
                    gradientAccent="from-amber-500 to-yellow-500"
                  />
                  <KpiCard
                    title="Upcoming Schedule"
                    value={kpiData.upcoming}
                    subtitle="Planning & Confirmed stages"
                    icon={CalendarIcon}
                    gradientAccent="from-blue-500 to-indigo-500"
                  />
                  <KpiCard
                    title="Completed Events"
                    value={kpiData.completed}
                    subtitle="Logistics fully wrapped"
                    icon={Award}
                    gradientAccent="from-emerald-500 to-teal-500"
                  />
                  <KpiCard
                    title="Contract Value"
                    value={`₹${(kpiData.revenue / 100000).toFixed(1)} L`}
                    subtitle="Total pipeline bookings"
                    icon={DollarSign}
                    gradientAccent="from-purple-500 to-pink-500"
                  />
                  <KpiCard
                    title="Staff Utilisation"
                    value="84%"
                    subtitle="Planner allocation rate"
                    icon={Users}
                    gradientAccent="from-cyan-500 to-blue-500"
                  />
                </div>

                {/* Dashboard Grid Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Staff Availability & Weather */}
                  <div className="space-y-6">
                    {/* Live weather details */}
                    <div className="p-5 border border-zinc-850 bg-[#161618]/30 rounded-xl space-y-4">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                        <CloudSun size={14} className="text-purple-400" />
                        Weather Contingency Monitor
                      </h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-3xl font-black text-white">28°C</span>
                          <p className="text-[10px] text-zinc-500 mt-1">Lawn & Beach setups alert: Moderate Rain Forecast</p>
                        </div>
                        <span className="text-4xl">🌧️</span>
                      </div>
                      <div className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-lg text-[10px] text-amber-400 border-amber-500/20 flex gap-2">
                        <AlertTriangle size={14} className="shrink-0" />
                        <span>Precautionary tents advised for outdoor Radisson Blu venues today.</span>
                      </div>
                    </div>

                    {/* Staff availability */}
                    <div className="p-5 border border-zinc-850 bg-[#161618]/30 rounded-xl space-y-4">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                        <UserCheck size={14} className="text-purple-400" />
                        Planner Roster Status
                      </h3>
                      <div className="space-y-3">
                        {[
                          { name: "Lokesh Nagrikar", role: "Principal Planner", status: "On Event", color: "text-amber-400 bg-amber-500/10" },
                          { name: "Shreya Gupta", role: "Coordinator", status: "Available", color: "text-emerald-400 bg-emerald-500/10" },
                          { name: "Rahul Sharma", role: "Technician", status: "On Leave", color: "text-zinc-500 bg-zinc-900" },
                          { name: "Priya Patel", role: "Lead Designer", status: "Available", color: "text-emerald-400 bg-emerald-500/10" }
                        ].map((staff) => (
                          <div key={staff.name} className="flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-zinc-200 block">{staff.name}</span>
                              <span className="text-[10px] text-zinc-500">{staff.role}</span>
                            </div>
                            <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold border", staff.color)}>
                              {staff.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Recent Activity Feed & AI Insights */}
                  <div className="space-y-6 md:col-span-2">
                    {/* AI Insights Card */}
                    <div className="p-5 border border-zinc-850 bg-gradient-to-r from-purple-950/15 via-[#161618]/30 to-zinc-950/40 rounded-xl space-y-4">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles size={14} className="text-purple-400" />
                        AI Operations Insights
                      </h3>
                      <div className="space-y-3 leading-relaxed text-zinc-300 text-xs font-medium">
                        <p className="flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                          <span><strong>Resource Conflict Alert:</strong> Line Array Speaker Set #3 is double booked on July 5th for both Kapoor Wedding and Corporate Summit A. Resolve in Resource Manager.</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                          <span><strong>Milestone Bottleneck:</strong> The food menu approval for Jain Anniversary is overdue by 3 days. Send automated payment and catering reminder.</span>
                        </p>
                      </div>
                    </div>

                    {/* Today's Events Timeline */}
                    <div className="p-5 border border-zinc-850 bg-[#161618]/30 rounded-xl space-y-4">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Clock size={14} className="text-purple-400" />
                        Today's Operational Execution Timeline
                      </h3>
                      <div className="space-y-4 border-l border-zinc-800 pl-4 ml-2">
                        {events.slice(0, 3).map((e, idx) => (
                          <div key={e.id} className="relative group cursor-pointer" onClick={() => router.push(`/events/${e.id}`)}>
                            <span className="absolute -left-[21px] mt-1 h-2.5 w-2.5 rounded-full bg-purple-500 ring-4 ring-zinc-950" />
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <span className="font-extrabold text-zinc-200 block group-hover:text-purple-400 transition">{e.name}</span>
                                <span className="text-[10px] text-zinc-550">{e.venueName || "TBA"} • Expected {e.guestCount || 0} guests</span>
                              </div>
                              <span className="text-[9px] text-zinc-500 font-bold font-mono">
                                {new Date(e.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* GRID VIEW */}
            {activeTab === "grid" && (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredEvents.map((event, idx) => (
                  <EventCard key={event.id} event={event} index={idx} />
                ))}
                {filteredEvents.length === 0 && <EmptyState />}
              </motion.div>
            )}

            {/* LIST VIEW */}
            {activeTab === "list" && (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="overflow-x-auto border border-zinc-850 bg-[#121214]/20 rounded-2xl"
              >
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-850 bg-zinc-950/20 text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                      <th className="p-4">Name</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Venue</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Budget</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850/40">
                    {filteredEvents.map((e) => (
                      <tr key={e.id} className="hover:bg-zinc-900/10 text-zinc-300 transition-colors">
                        <td className="p-4 font-extrabold text-zinc-200">{e.name}</td>
                        <td className="p-4">
                          <span className={cn("px-2 py-0.5 border rounded text-[9px] font-bold", EVENT_TYPES.find((t) => t.key === e.type)?.color)}>
                            {EVENT_TYPES.find((t) => t.key === e.type)?.label || e.type}
                          </span>
                        </td>
                        <td className="p-4 text-zinc-450">{e.venueName || "TBA"}</td>
                        <td className="p-4">{new Date(e.startDate).toLocaleDateString()}</td>
                        <td className="p-4 font-mono font-bold text-emerald-450">₹{e.budget?.toLocaleString() || "0"}</td>
                        <td className="p-4">
                          <span className={cn("px-2 py-0.5 border rounded-full text-[9px] font-extrabold", STATUS_COLORS[e.status])}>
                            {STATUS_LABELS[e.status]}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => router.push(`/events/${e.id}`)}
                            className="text-purple-400 hover:text-purple-300 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            Workspace <ArrowUpRight size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredEvents.length === 0 && <EmptyState />}
              </motion.div>
            )}

            {/* KANBAN VIEW */}
            {activeTab === "kanban" && (
              <motion.div
                key="kanban"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <DragDropContext onDragEnd={handleDragEnd}>
                  <div className="flex overflow-x-auto gap-4 pb-4 select-none items-start h-[calc(100vh-320px)] min-h-[480px]">
                    {COLUMNS.map((col) => {
                      const colEvents = filteredEvents.filter((e) => e.status === col.id);

                      return (
                        <div key={col.id} className="flex-1 min-w-[250px] max-w-[320px] rounded-2xl border border-zinc-900 bg-zinc-950/10 flex flex-col max-h-full overflow-hidden">
                          {/* Column Header */}
                          <div className="flex justify-between items-center mb-3 bg-[#121214]/50 border border-zinc-850 p-3 rounded-xl shrink-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-350">{col.label}</span>
                            <span className="text-[9px] font-bold text-zinc-550 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                              {colEvents.length}
                            </span>
                          </div>

                          {/* Droppable Area */}
                          <Droppable droppableId={col.id}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={cn(
                                  "flex-1 overflow-y-auto p-2 space-y-3 min-h-[150px] transition-colors",
                                  snapshot.isDraggingOver ? "bg-purple-550/[0.01] border-purple-500/20" : "border-zinc-850 bg-transparent"
                                )}
                              >
                                {colEvents.map((event, idx) => (
                                  <Draggable key={event.id} draggableId={event.id} index={idx}>
                                    {(providedDraggable, snapshotDraggable) => (
                                      <div
                                        ref={providedDraggable.innerRef}
                                        {...providedDraggable.draggableProps}
                                        {...providedDraggable.dragHandleProps}
                                        style={providedDraggable.draggableProps.style as React.CSSProperties}
                                        onClick={() => router.push(`/events/${event.id}`)}
                                        className={cn(
                                          "p-4 border rounded-xl bg-[#121214]/40 cursor-pointer space-y-3 transition-all",
                                          snapshotDraggable.isDragging ? "border-purple-650 bg-zinc-950 scale-102 shadow-2xl" : "border-zinc-850/80 hover:border-zinc-700/80"
                                        )}
                                      >
                                        <div className="flex justify-between items-start gap-2">
                                          <span className={cn("text-[7.5px] px-1.5 py-0.5 border rounded uppercase font-bold", EVENT_TYPES.find((t) => t.key === event.type)?.color)}>
                                            {EVENT_TYPES.find((t) => t.key === event.type)?.label || event.type}
                                          </span>
                                        </div>
                                        <h5 className="font-extrabold text-xs text-zinc-200 leading-snug line-clamp-2">{event.name}</h5>
                                        <div className="flex justify-between items-center text-[9px] text-zinc-550 pt-2 border-t border-zinc-900">
                                          <span>{new Date(event.startDate).toLocaleDateString()}</span>
                                          <span className="font-bold text-zinc-400">₹{(event.budget ? event.budget / 100000 : 0).toFixed(1)}L</span>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                                {colEvents.length === 0 && (
                                  <div className="text-center py-8 text-zinc-650 italic text-[10px]">Drop events here</div>
                                )}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      );
                    })}
                  </div>
                </DragDropContext>
              </motion.div>
            )}

            {/* CALENDAR VIEW */}
            {activeTab === "calendar" && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="border border-zinc-850 bg-[#121214]/30 rounded-2xl p-5 space-y-4"
              >
                {/* Calendar Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-850">
                  <div className="flex items-center gap-3">
                    <h4 className="font-extrabold text-sm text-zinc-300">
                      {calendarMode === "month" && `${currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`}
                      {calendarMode === "week" && `Week of ${currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                      {calendarMode === "day" && currentDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </h4>
                    <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                      <button onClick={handlePrevDate} className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer">
                        <ChevronLeft size={13} />
                      </button>
                      <button onClick={() => setCurrentDate(new Date())} className="px-2 py-0.5 hover:bg-zinc-800 text-[9px] font-bold rounded text-zinc-300 transition-colors cursor-pointer">
                        Today
                      </button>
                      <button onClick={handleNextDate} className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer">
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="flex bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg">
                    {(["month", "week", "day"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setCalendarMode(m)}
                        className={cn(
                          "px-2.5 py-1 text-[9px] font-black rounded-md uppercase tracking-wider transition-all cursor-pointer",
                          calendarMode === m ? "bg-zinc-800 text-purple-400" : "text-zinc-500 hover:text-zinc-300"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calendar Layout Days rendering */}
                <div className="grid grid-cols-7 gap-2.5 pt-4">
                  {Array.from({ length: 35 }).map((_, idx) => {
                    const dayNum = (idx % 31) + 1;
                    const dateStr = `2026-06-${dayNum < 10 ? "0" + dayNum : dayNum}`;
                    const dayEvents = filteredEvents.filter((e) => e.startDate.startsWith(dateStr));
                    
                    return (
                      <div key={idx} className="border border-zinc-850/60 bg-[#111113]/30 min-h-[90px] rounded-xl p-2 flex flex-col justify-between hover:bg-zinc-900/30 transition">
                        <span className="text-[10px] text-zinc-500 font-bold">{dayNum}</span>
                        <div className="space-y-1 overflow-y-auto max-h-[50px] scrollbar-none">
                          {dayEvents.map(e => (
                            <div key={e.id} onClick={() => router.push(`/events/${e.id}`)}
                              className="text-[8px] px-1.5 py-0.5 border border-purple-500/20 bg-purple-500/5 text-purple-400 rounded cursor-pointer truncate font-bold">
                              {e.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* TIMELINE ROADMAP VIEW */}
            {activeTab === "timeline" && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="border border-zinc-850 bg-[#121214]/30 rounded-2xl p-5 space-y-4"
              >
                <h4 className="font-extrabold text-xs text-zinc-300 uppercase tracking-widest">Upcoming Execution Timeline</h4>
                <div className="relative border-l border-zinc-850 pl-6 ml-2 space-y-6 text-xs py-1">
                  {filteredEvents
                    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                    .map((e) => {
                      const typeColor = EVENT_TYPES.find((t) => t.key === e.type)?.color || "border-zinc-800 text-zinc-400";
                      const statusColor = STATUS_COLORS[e.status] || "border-zinc-800 text-zinc-400";

                      return (
                        <div key={e.id} className="relative group">
                          <div className="absolute -left-[31px] mt-1.5 h-3.5 w-3.5 rounded-full bg-[#0a0a0c] border-2 border-purple-500 group-hover:border-purple-400 transition-colors" />
                          <div
                            onClick={() => router.push(`/events/${e.id}`)}
                            className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-zinc-850 bg-[#141416]/20 rounded-xl hover:border-purple-500/20 cursor-pointer transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={cn("px-2 py-0.5 border rounded-full text-[8px] font-bold", typeColor)}>{e.type}</span>
                                <span className={cn("px-2 py-0.5 border rounded-full text-[8px] font-bold", statusColor)}>{e.status}</span>
                              </div>
                              <h5 className="font-extrabold text-xs text-zinc-200 mt-1">{e.name}</h5>
                              <p className="text-[10px] text-zinc-550 flex items-center gap-1 mt-1">
                                <Clock size={11} />
                                {new Date(e.startDate).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-left md:text-right shrink-0">
                              <span className="text-[8px] text-zinc-550 uppercase font-bold block">Venue Location</span>
                              <span className="text-zinc-350 font-bold text-xs">{e.venueName || "TBA"}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </div>

      {/* CREATE EVENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-[#111113] border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/15 via-transparent to-transparent pointer-events-none" />

            <div className="flex justify-between items-center pb-4 border-b border-zinc-850 mb-4 z-10 relative">
              <div>
                <h2 className="text-sm font-extrabold text-white">Provision Event Workspace</h2>
                <p className="text-[10px] text-zinc-500 mt-0.5">Initialize operational tracking specs for converted accounts.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer">
                &times;
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400 rounded-lg flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs z-10 relative">
              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">Event Name</label>
                <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="E.g., Kapoor Wedding Ceremony"
                  className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">Event Category</label>
                  <select value={formType} onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none">
                    <option value="WEDDING">Wedding Ceremony</option>
                    <option value="BIRTHDAY">Birthday Party</option>
                    <option value="ENGAGEMENT">Engagement Gala</option>
                    <option value="CORPORATE">Corporate Summit</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">Budget (INR)</label>
                  <input type="number" value={formBudget} onChange={(e) => setFormBudget(e.target.value)} placeholder="E.g., 500000"
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">Start Date & Time</label>
                  <input type="datetime-local" required value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">End Date & Time</label>
                  <input type="datetime-local" required value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5 col-span-1">
                  <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">Venue Name</label>
                  <input type="text" value={formVenueName} onChange={(e) => setFormVenueName(e.target.value)} placeholder="E.g., Hall A"
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">Venue Address</label>
                  <input type="text" value={formVenueAddress} onChange={(e) => setFormVenueAddress(e.target.value)} placeholder="E.g., Radisson Blu, Delhi"
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-850">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-xs font-semibold text-zinc-350 transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={createEventMutation.isPending}
                  className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer">
                  {createEventMutation.isPending ? "Creating..." : "Provision Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full border border-dashed border-zinc-850 rounded-2xl p-16 flex flex-col items-center justify-center text-center space-y-3">
      <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
        <Inbox size={16} />
      </div>
      <div>
        <p className="font-extrabold text-zinc-300 text-xs">No Events Found</p>
        <p className="text-[10px] text-zinc-550 mt-1 max-w-[280px]">Try adjusting your search keywords, priority settings or active filter rules.</p>
      </div>
    </div>
  );
}
