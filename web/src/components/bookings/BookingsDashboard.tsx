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
  ArrowUpRight,
  Inbox,
  Lock,
  FileSpreadsheet
} from "lucide-react";
import KpiCard from "../dashboard/KpiCard";
import BookingCard, { Booking } from "./BookingCard";
import { cn } from "@/lib/utils";
import GlobalEmptyState from "../ui/EmptyState";
import { CardSkeleton, TableSkeleton, KanbanSkeleton, CalendarSkeleton } from "../ui/skeletons";

const COLUMNS = [
  { id: "PENDING", label: "Pending", color: "border-slate-300 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950/20 text-slate-700 dark:text-zinc-400" },
  { id: "CONFIRMED", label: "Confirmed", color: "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  { id: "IN_PROGRESS", label: "In Progress", color: "border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  { id: "COMPLETED", label: "Completed", color: "border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  { id: "CANCELLED", label: "Cancelled", color: "border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400" }
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled"
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800/40 text-slate-700 dark:text-zinc-400",
  CONFIRMED: "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  IN_PROGRESS: "border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400",
  COMPLETED: "border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400",
  CANCELLED: "border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
};

interface Event {
  id: string;
  name: string;
}

export default function BookingsDashboard() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // 1. Saved Views & Filter Settings
  const [activeTab, setActiveTab] = useState<"grid" | "list" | "kanban" | "calendar" | "timeline">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [amountFilter, setAmountFilter] = useState("ALL");

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [contractUrl, setContractUrl] = useState("");
  const [formError, setFormError] = useState("");

  // Calendar Specific Date & Mode states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarMode, setCalendarMode] = useState<"month" | "week" | "day">("month");

  // Read saved filters on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTab = localStorage.getItem("bookings_active_tab");
      if (savedTab) setActiveTab(savedTab as any);

      const savedSearch = localStorage.getItem("bookings_filter_search");
      if (savedSearch) setSearchQuery(savedSearch);

      const savedStatus = localStorage.getItem("bookings_filter_status");
      if (savedStatus) setStatusFilter(savedStatus);

      const savedPayment = localStorage.getItem("bookings_filter_payment");
      if (savedPayment) setPaymentFilter(savedPayment);
    }
  }, []);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    localStorage.setItem("bookings_active_tab", tab);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    localStorage.setItem("bookings_filter_search", val);
  };

  // 2. Fetch bookings & events
  const { data: bookingsResponse, isLoading: bookingsLoading } = useQuery<{ data: Booking[] }>({
    queryKey: ["bookings"],
    queryFn: async () => {
      const response = await api.get("/events/bookings");
      return response.data;
    }
  });

  const { data: eventsResponse, isLoading: eventsLoading } = useQuery<{ data: Event[] }>({
    queryKey: ["events"],
    queryFn: async () => {
      const response = await api.get("/events");
      return response.data;
    }
  });

  const bookings = useMemo(() => bookingsResponse?.data || [], [bookingsResponse]);
  const events = useMemo(() => eventsResponse?.data || [], [eventsResponse]);

  const getEventName = useCallback((eventId: string) => {
    return events.find((e) => e.id === eventId)?.name || "Unassigned Event";
  }, [events]);

  // 3. Client Filter Math
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const eventName = getEventName(b.eventId).toLowerCase();
      const matchSearch = eventName.includes(searchQuery.toLowerCase()) ||
        b.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === "ALL" || b.status === statusFilter;

      // Payment status calculation
      const percentPaid = b.totalAmount > 0 ? (b.paidAmount / b.totalAmount) * 100 : 0;
      let calculatedPaymentStatus = "UNPAID";
      if (percentPaid >= 100) calculatedPaymentStatus = "PAID";
      else if (percentPaid > 0) calculatedPaymentStatus = "PARTIAL";

      const matchPayment = paymentFilter === "ALL" || calculatedPaymentStatus === paymentFilter;

      // Amount Filter logic
      let matchAmount = true;
      if (amountFilter === "HIGH") matchAmount = b.totalAmount >= 500000;
      else if (amountFilter === "MEDIUM") matchAmount = b.totalAmount >= 200000 && b.totalAmount < 500000;
      else if (amountFilter === "LOW") matchAmount = b.totalAmount < 200000;

      return matchSearch && matchStatus && matchPayment && matchAmount;
    });
  }, [bookings, searchQuery, statusFilter, paymentFilter, amountFilter, getEventName]);

  // 4. KPI Calculations
  const kpiData = useMemo(() => {
    const active = bookings.filter((b) => b.status === "IN_PROGRESS").length;
    const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length;
    const pending = bookings.filter((b) => b.status === "PENDING").length;
    const completed = bookings.filter((b) => b.status === "COMPLETED").length;
    const cancelled = bookings.filter((b) => b.status === "CANCELLED").length;
    const totalValue = bookings
      .filter((b) => b.status !== "CANCELLED")
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    return { active, confirmed, pending, completed, cancelled, totalValue };
  }, [bookings]);

  // 5. Booking Status Patch Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const response = await api.patch(`/bookings/${bookingId}/status`, { status });
      return response.data;
    },
    onMutate: async ({ bookingId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["bookings"] });
      const previousBookings = queryClient.getQueryData<{ data: Booking[] }>(["bookings"]);

      if (previousBookings) {
        queryClient.setQueryData(["bookings"], {
          ...previousBookings,
          data: previousBookings.data.map((b) => b.id === bookingId ? { ...b, status } : b)
        });
      }
      return { previousBookings };
    },
    onError: (err, variables, context) => {
      if (context?.previousBookings) {
        queryClient.setQueryData(["bookings"], context.previousBookings);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    }
  });

  // 6. Create Booking Mutation
  const createBookingMutation = useMutation({
    mutationFn: async (newBooking: Partial<Booking>) => {
      const response = await api.post("/events/bookings", newBooking);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error?.message || "Failed to create booking.");
    }
  });

  const resetForm = () => {
    setSelectedEventId("");
    setTotalAmount("");
    setPaidAmount("");
    setContractUrl("");
    setFormError("");
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedEventId || !totalAmount || !paidAmount) {
      setFormError("Event reference, total budget, and paid amount are required.");
      return;
    }

    createBookingMutation.mutate({
      eventId: selectedEventId,
      totalAmount: parseFloat(totalAmount),
      paidAmount: parseFloat(paidAmount),
      contractUrl: contractUrl || undefined
    });
  };

  // 7. Kanban drag-and-drop handler
  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return;
    const { draggableId, source, destination } = result;
    if (source.droppableId === destination.droppableId) return;

    updateStatusMutation.mutate({
      bookingId: draggableId,
      status: destination.droppableId
    });
  }, [updateStatusMutation]);

  // 8. Calendar helper render views
  const handlePrevDate = () => {
    if (calendarMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (calendarMode === "week") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const handleNextDate = () => {
    if (calendarMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (calendarMode === "week") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Monthly grid rendering
  const renderCalendarMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const startOffset = new Date(year, month, 1).getDay();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let i = 1; i <= totalDays; i++) cells.push(new Date(year, month, i));

    return (
      <div className="space-y-3 animate-in fade-in duration-200">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-550 uppercase tracking-widest">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((date, idx) => {
            if (!date) {
              return <div key={`empty-${idx}`} className="aspect-square border border-zinc-900/50 bg-zinc-950/10 rounded-xl" />;
            }

            const dateStr = date.toISOString().split("T")[0];
            const isToday = new Date().toDateString() === date.toDateString();
            // Since booking only has createdAt and matches event, we map to createdAt date
            const dayBookings = filteredBookings.filter((b) => b.createdAt.startsWith(dateStr));

            return (
              <div
                key={dateStr}
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                className={cn(
                  "aspect-square border transition-all p-2 flex flex-col justify-between cursor-pointer rounded-xl group hover:bg-zinc-900/50",
                  isToday ? "border-purple-500 bg-purple-550/5" : "border-zinc-850/60 bg-[#111113]/30"
                )}
              >
                <span className={cn("text-[10px] font-bold", isToday ? "text-purple-400 font-extrabold" : "text-zinc-500")}>
                  {date.getDate()}
                </span>

                <div className="flex flex-col gap-1 overflow-y-auto max-h-[36px] scrollbar-none">
                  {dayBookings.slice(0, 3).map((b) => (
                    <div
                      key={b.id}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        router.push(`/bookings/${b.id}`);
                      }}
                      className="text-[7.5px] px-1 py-0.5 border border-purple-500/20 bg-purple-550/5 text-purple-400 rounded-md truncate font-extrabold"
                    >
                      {getEventName(b.eventId)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const isLoading = bookingsLoading || eventsLoading;

  return (
    <div className="space-y-6 z-10 relative">

      {/* ─── KPI METRICS ROW ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          title="Active Bookings"
          value={kpiData.active}
          subtitle="Operations Running"
          icon={TrendingUp}
          gradientAccent="from-amber-500 to-yellow-500"
          sparklineData={[1, 2, 2, 3, 2, kpiData.active]}
        />
        <KpiCard
          title="Confirmed Bookings"
          value={kpiData.confirmed}
          subtitle="Contracts Locked"
          icon={CheckCircle2}
          gradientAccent="from-emerald-500 to-teal-500"
          sparklineData={[4, 5, 8, 9, 10, kpiData.confirmed]}
        />
        <KpiCard
          title="Pending Bookings"
          value={kpiData.pending}
          subtitle="Awaiting Approval"
          icon={Clock}
          gradientAccent="from-purple-500 to-indigo-500"
          sparklineData={[2, 4, 3, 5, 4, kpiData.pending]}
        />
        <KpiCard
          title="Completed Bookings"
          value={kpiData.completed}
          subtitle="Fully Cleared Log"
          icon={Users}
          gradientAccent="from-blue-500 to-cyan-500"
          sparklineData={[6, 9, 12, 14, 15, kpiData.completed]}
        />
        <KpiCard
          title="Cancelled Bookings"
          value={kpiData.cancelled}
          subtitle="Dropped Ledgers"
          icon={AlertTriangle}
          gradientAccent="from-red-500 to-orange-500"
          sparklineData={[0, 1, 1, 2, 2, kpiData.cancelled]}
        />
        <KpiCard
          title="Booking Value"
          value={`₹${(kpiData.totalValue / 100000).toFixed(1)}L`}
          subtitle="Volume value ledger"
          icon={DollarSign}
          gradientAccent="from-pink-500 to-purple-500"
          sparklineData={[80, 95, 110, 140, 180, kpiData.totalValue / 100000]}
        />
      </div>

      {/* ─── FILTERS & VIEW SWAPPER ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/90 dark:border-white/[0.08] pb-4">

        {/* Search & Filter Trigger */}
        <div className="flex items-center gap-3 flex-1 max-w-md relative">
          <Search size={14} className="absolute left-3 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search booking ID, client events..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#121214]/60 border border-slate-200 dark:border-zinc-800 focus:border-purple-600 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none transition-colors font-medium shadow-sm"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "px-3 py-2 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm cursor-pointer",
              showFilters ? "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-500/40 text-purple-700 dark:text-purple-400" : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-700 dark:text-zinc-400"
            )}
          >
            <Filter size={12} />
            Filters
          </button>
        </div>

        {/* View toggles & Action */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 p-0.5 rounded-xl">
            {([
              { key: "grid", label: "Grid", icon: Grid },
              { key: "list", label: "Table", icon: List },
              { key: "kanban", label: "Kanban", icon: Layers },
              { key: "calendar", label: "Calendar", icon: CalendarIcon }
            ] as const).map((view) => (
              <button
                key={view.key}
                onClick={() => handleTabChange(view.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                  activeTab === view.key ? "bg-white dark:bg-zinc-800 text-purple-700 dark:text-purple-400 shadow-sm" : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                )}
              >
                <view.icon size={12} />
                <span className="hidden md:inline">{view.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/15 active:scale-95 cursor-pointer"
          >
            <Plus size={13} />
            Lock Booking
          </button>
        </div>
      </div>

      {/* Advanced Filters Expandable Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-slate-50/90 dark:bg-[#121214]/60 border border-slate-200/90 dark:border-zinc-850 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-sm"
        >
          <div className="space-y-1.5">
            <label className="text-[9px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider">Booking Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-300 rounded-lg text-xs focus:outline-none font-bold shadow-sm"
            >
              <option value="ALL">All Statuses</option>
              {COLUMNS.map((col) => <option key={col.id} value={col.id}>{col.label}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider">Payment Status</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-300 rounded-lg text-xs focus:outline-none font-bold shadow-sm"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="PAID">Fully Paid</option>
              <option value="PARTIAL">Partially Paid</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider">Amount Tier</label>
            <select
              value={amountFilter}
              onChange={(e) => setAmountFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-300 rounded-lg text-xs focus:outline-none font-bold shadow-sm"
            >
              <option value="ALL">All Budgets</option>
              <option value="HIGH">High Volume (&ge; 5L)</option>
              <option value="MEDIUM">Mid Tier (2L - 5L)</option>
              <option value="LOW">Low Tier (&lt; 2L)</option>
            </select>
          </div>
        </motion.div>
      )}

      {/* ─── MAIN CONTENT VIEW SWITCHER ─── */}
      <div className="min-h-[400px]">
        {isLoading ? (
          activeTab === "kanban" ? (
            <KanbanSkeleton />
          ) : activeTab === "calendar" ? (
            <CalendarSkeleton />
          ) : activeTab === "list" || activeTab === "timeline" ? (
            <TableSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} className="h-[220px]" />
              ))}
            </div>
          )
        ) : (
          <AnimatePresence mode="wait">

            {/* GRID CARD VIEW */}
            {activeTab === "grid" && (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredBookings.map((b, idx) => (
                  <BookingCard key={b.id} booking={b} eventName={getEventName(b.eventId)} index={idx} />
                ))}
                {filteredBookings.length === 0 && <EmptyState />}
                {/* LIST TABLE VIEW */}
                {activeTab === "list" && (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="overflow-x-auto border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#121214]/40 rounded-2xl shadow-sm"
                  >
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200/90 dark:border-zinc-850 bg-slate-100/70 dark:bg-zinc-950/20 text-slate-500 dark:text-zinc-400 font-black uppercase text-[8.5px] tracking-wider">
                          <th className="p-4">Booking No</th>
                          <th className="p-4">Event Workspace</th>
                          <th className="p-4">Contract Price</th>
                          <th className="p-4">Paid Cost</th>
                          <th className="p-4">Payment Ratio</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Workspace</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/90 dark:divide-zinc-850/40 text-slate-700 dark:text-zinc-350">
                        {filteredBookings.map((b) => {
                          const percentPaid = b.totalAmount > 0 ? Math.min(100, Math.round((b.paidAmount / b.totalAmount) * 100)) : 0;
                          return (
                            <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-900/20 transition-colors">
                              <td className="p-4 font-mono font-bold text-slate-600 dark:text-zinc-400">{b.bookingNumber}</td>
                              <td className="p-4 font-extrabold text-slate-900 dark:text-zinc-200">{getEventName(b.eventId)}</td>
                              <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-450">₹{b.totalAmount.toLocaleString()}</td>
                              <td className="p-4 font-mono font-semibold text-slate-700 dark:text-zinc-300">₹{b.paidAmount.toLocaleString()}</td>
                              <td className="p-4 font-bold text-slate-600 dark:text-zinc-400">{percentPaid}% Paid</td>
                              <td className="p-4">
                                <span className={cn("px-2 py-0.5 border rounded-full text-[9px] font-black uppercase", STATUS_COLORS[b.status])}>
                                  {STATUS_LABELS[b.status]}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => router.push(`/bookings/${b.id}`)}
                                  className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                                >
                                  Workspace <ArrowUpRight size={12} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {filteredBookings.length === 0 && <EmptyState />}
                  </motion.div>
                )}

                {/* KANBAN BOARD VIEW */}
                {activeTab === "kanban" && (
                  <motion.div
                    key="kanban"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto min-w-[1000px] pb-4">
                        {COLUMNS.map((col) => {
                          const colBookings = filteredBookings.filter((b) => b.status === col.id);

                          return (
                            <div key={col.id} className="flex flex-col min-h-[500px]">
                              {/* Column Title */}
                              <div className="flex justify-between items-center mb-3 bg-slate-100/80 dark:bg-[#121214]/50 border border-slate-200/90 dark:border-zinc-850 p-3 rounded-xl shadow-sm">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">{col.label}</span>
                                <span className="text-[9px] font-bold text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2 py-0.5 rounded-full shadow-sm">
                                  {colBookings.length}
                                </span>
                              </div>

                              {/* Column Droppable */}
                              <Droppable droppableId={col.id}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={cn(
                                      "flex-1 border border-dashed p-3 space-y-3 rounded-2xl transition-colors",
                                      snapshot.isDraggingOver ? "bg-purple-500/[0.04] border-purple-500/30" : "border-slate-200 dark:border-zinc-850 bg-slate-50/40 dark:bg-transparent"
                                    )}
                                  >
                                    {colBookings.map((b, idx) => (
                                      <Draggable key={b.id} draggableId={b.id} index={idx}>
                                        {(providedDraggable, snapshotDraggable) => (
                                          <div
                                            ref={providedDraggable.innerRef}
                                            {...providedDraggable.draggableProps}
                                            {...providedDraggable.dragHandleProps}
                                            style={providedDraggable.draggableProps.style as React.CSSProperties}
                                            onClick={() => router.push(`/bookings/${b.id}`)}
                                            className={cn(
                                              "p-4 border rounded-xl bg-white dark:bg-[#121214]/60 cursor-pointer space-y-3 transition-all shadow-sm",
                                              snapshotDraggable.isDragging ? "border-purple-600 bg-white dark:bg-zinc-900 scale-102 shadow-2xl" : "border-slate-200/90 dark:border-zinc-850/80 hover:border-purple-500/40"
                                            )}
                                          >
                                            <div className="flex justify-between items-center text-[8.5px] text-slate-500 dark:text-zinc-400">
                                              <span className="font-mono font-bold">{b.bookingNumber}</span>
                                            </div>
                                            <h5 className="font-extrabold text-xs text-slate-900 dark:text-zinc-200 leading-snug line-clamp-2">{getEventName(b.eventId)}</h5>
                                            <div className="flex justify-between items-center text-[9px] text-slate-500 dark:text-zinc-400 pt-2 border-t border-slate-100 dark:border-zinc-900">
                                              <span>{new Date(b.createdAt).toLocaleDateString()}</span>
                                              <span className="font-bold text-slate-700 dark:text-zinc-300">₹{(b.totalAmount / 100000).toFixed(1)}L</span>
                                            </div>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                    {provided.placeholder}
                                    {colBookings.length === 0 && (
                                      <div className="h-full flex items-center justify-center text-[9px] text-slate-400 dark:text-zinc-600 italic py-8">Drop bookings here</div>
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
                    className="border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#121214]/30 rounded-2xl p-5 space-y-4 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90 dark:border-zinc-850">
                      <div className="flex items-center gap-3">
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-zinc-200">
                          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h4>
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-0.5">
                          <button onClick={handlePrevDate} className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-850 text-slate-600 dark:text-zinc-400 rounded cursor-pointer">
                            <ChevronLeft size={13} />
                          </button>
                          <button onClick={() => setCurrentDate(new Date())} className="px-2 py-0.5 hover:bg-slate-200 dark:hover:bg-zinc-850 text-[9px] font-bold rounded text-slate-800 dark:text-zinc-300 cursor-pointer">
                            Today
                          </button>
                          <button onClick={handleNextDate} className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-850 text-slate-600 dark:text-zinc-400 rounded cursor-pointer">
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {renderCalendarMonth()}
                  </motion.div>
                )}

              </AnimatePresence>
            )}
          </div>


      {/* ─── CREATE BOOKING DIALOG ─── */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white dark:bg-[#111113] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_var(--tw-gradient-stops))] from-purple-500/10 dark:from-purple-950/15 via-transparent to-transparent pointer-events-none" />

              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-zinc-850 mb-4 z-10 relative">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Create Booking Ledger Record</h2>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">Provision contract values and initial deposit tracking metrics.</p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
                  &times;
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs text-red-600 dark:text-red-400 rounded-lg">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs z-10 relative">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-slate-500 dark:text-zinc-400 uppercase font-black">Associated Event Workspace</label>
                  <select
                    value={selectedEventId}
                    required
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-900 dark:text-white font-semibold shadow-sm focus:outline-none focus:border-purple-600"
                  >
                    <option value="">-- Choose Event Workspace --</option>
                    {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-slate-500 dark:text-zinc-400 uppercase font-black">Total Amount (INR)</label>
                    <input type="number" required value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="500000"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-900 dark:text-white font-semibold shadow-sm focus:outline-none focus:border-purple-600" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-slate-500 dark:text-zinc-400 uppercase font-black">Initial Deposit Paid (INR)</label>
                    <input type="number" required value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="150000"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-900 dark:text-white font-semibold shadow-sm focus:outline-none focus:border-purple-600" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] text-slate-500 dark:text-zinc-400 uppercase font-black">Contract PDF URL (Optional)</label>
                    <span className="text-[9px] text-slate-400 dark:text-zinc-500">Auto-filled if booked via Quote</span>
                  </div>
                  <div className="relative">
                    <input
                      type="url"
                      value={contractUrl}
                      onChange={(e) => setContractUrl(e.target.value)}
                      placeholder="https://res.cloudinary.com/... or leave blank"
                      className="w-full px-3 py-2 pr-20 bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-purple-600 focus:outline-none font-medium shadow-sm"
                    />
                    {contractUrl && (
                      <button
                        type="button"
                        onClick={() => window.open(contractUrl, "_blank")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-600/30 dark:hover:bg-purple-600/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 rounded text-[9px] font-bold transition-colors cursor-pointer"
                      >
                        Test Link
                      </button>
                    )}
                  </div>
                  <p className="text-[9px] text-slate-500 dark:text-zinc-400">
                    {contractUrl
                      ? "✨ Contract milestone will automatically be marked as COMPLETED."
                      : "You can paste a Cloudinary, Google Drive, or S3 signed PDF link."}
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-zinc-850">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-slate-200 dark:border-zinc-805 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 rounded-xl text-slate-700 dark:text-zinc-300 font-bold cursor-pointer transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={createBookingMutation.isPending} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold shadow-md shadow-purple-600/15 cursor-pointer transition active:scale-95">
                    {createBookingMutation.isPending ? "Creating..." : "Lock Ledger"}
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
      <div className="col-span-full w-full">
        <GlobalEmptyState
          icon={Inbox}
          title="No Contracts Found"
          description="Try adjusting your search criteria, payment status filters, or amount tiers."
        />
      </div>
      );
}
