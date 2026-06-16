"use client";

import React, { useState, Component, ErrorInfo, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Calendar as CalendarIcon,
  Plus,
  ArrowLeft,
  Briefcase,
  Clock,
  MapPin,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  Grid,
  ListTodo,
  CalendarDays,
  FileText,
  X,
  PlusCircle,
  Filter,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

// ─── Error Boundary ────────────────────────────────────────────────────────────

interface ErrorBoundaryState { hasError: boolean; }

class ErrorBoundary extends Component<{ children: ReactNode; fallbackMessage?: string }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode; fallbackMessage?: string }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): ErrorBoundaryState { return { hasError: true }; }
  componentDidCatch(error: Error, _info: ErrorInfo) {
    console.error("[EventsPage ErrorBoundary]", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-xs text-zinc-400">
          <AlertTriangle size={20} className="text-amber-500" />
          <p>{this.props.fallbackMessage || "An error occurred while rendering this section."}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-[10px] font-semibold transition-all"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Event {
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
  { key: "BIRTHDAY", label: "Birthday", color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" },
  { key: "ENGAGEMENT", label: "Engagement", color: "border-purple-500/20 bg-purple-500/5 text-purple-400" },
  { key: "CORPORATE", label: "Corporate", color: "border-blue-500/20 bg-blue-500/5 text-blue-400" }
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "border-purple-500/20 bg-purple-500/5 text-purple-400",
  PLANNED: "border-zinc-500/20 bg-zinc-500/5 text-zinc-400",
  CONFIRMED: "border-blue-500/20 bg-blue-500/5 text-blue-400",
  IN_PROGRESS: "border-amber-500/20 bg-amber-500/5 text-amber-400",
  COMPLETED: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
  ARCHIVED: "border-zinc-800 bg-zinc-900/50 text-zinc-500",
  CANCELLED: "border-red-500/20 bg-red-500/5 text-red-400"
};

// ─── Calendar date-range helpers ──────────────────────────────────────────────

function getCalendarDateRange(
  mode: "month" | "week" | "day",
  date: Date
): { startDate: string; endDate: string } {
  if (mode === "month") {
    const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }
  if (mode === "week") {
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - date.getDay());
    sunday.setHours(0, 0, 0, 0);
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    saturday.setHours(23, 59, 59, 999);
    return { startDate: sunday.toISOString(), endDate: saturday.toISOString() };
  }
  // day
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-[210px] rounded-2xl border border-zinc-800 bg-zinc-900/30 animate-pulse" />
      ))}
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {Array.from({ length: 35 }).map((_, i) => (
        <div key={i} className="min-h-[110px] rounded-xl border border-zinc-800 bg-zinc-900/20 animate-pulse" />
      ))}
    </div>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function EventsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"grid" | "calendar" | "timeline">("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Calendar Date & View Modes
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarMode, setCalendarMode] = useState<"month" | "week" | "day">("month");

  // Advanced Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("WEDDING");
  const [formLocation, setFormLocation] = useState("");
  const [formVenueName, setFormVenueName] = useState("");
  const [formVenueAddress, setFormVenueAddress] = useState("");
  const [formGuestCount, setFormGuestCount] = useState("");
  const [formGuestList, setFormGuestList] = useState("");
  const [formBudget, setFormBudget] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState("");

  // ── Fetch Events — server-side filtered with date-range bounds ───────────────

  const calendarRange = getCalendarDateRange(calendarMode, currentDate);

  const { data: eventsResponse, isLoading } = useQuery<{ data: Event[]; pagination?: object }>({
    queryKey: [
      "events",
      statusFilter,
      typeFilter,
      activeTab === "calendar" ? calendarMode : null,
      activeTab === "calendar" ? currentDate.getFullYear() : null,
      activeTab === "calendar" ? currentDate.getMonth() : null,
      activeTab === "calendar" ? (calendarMode === "day" ? currentDate.getDate() : null) : null,
    ],
    queryFn: async () => {
      const params: Record<string, string | number> = { page: 0, size: 200 };
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (typeFilter !== "ALL") params.type = typeFilter;

      // For calendar views: send date-range so the server filters at DB level
      if (activeTab === "calendar") {
        params.startDate = calendarRange.startDate;
        params.endDate = calendarRange.endDate;
      }

      const response = await api.get("/events", { params });
      return response.data;
    }
  });

  const events = eventsResponse?.data || [];

  // ── Create Event Mutation ─────────────────────────────────────────────────────

  const createEventMutation = useMutation({
    mutationFn: async (newEvent: Partial<Event>) => {
      const response = await api.post("/events", newEvent);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: any) => {
      setFormError(error.response?.data?.error?.message || "Failed to create event. End date must be after start date.");
    }
  });

  const resetForm = () => {
    setFormName(""); setFormType("WEDDING"); setFormLocation(""); setFormVenueName("");
    setFormVenueAddress(""); setFormGuestCount(""); setFormGuestList(""); setFormBudget("");
    setFormStartDate(""); setFormEndDate(""); setFormNotes(""); setFormError("");
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formName.trim() || !formStartDate || !formEndDate) {
      setFormError("Event name, start date, and end date are required.");
      return;
    }

    if (new Date(formEndDate) < new Date(formStartDate)) {
      setFormError("Event end date cannot be before start date.");
      return;
    }

    createEventMutation.mutate({
      name: formName,
      type: formType,
      location: formLocation,
      venueName: formVenueName,
      venueAddress: formVenueAddress,
      guestCount: formGuestCount ? parseInt(formGuestCount) : 0,
      guestList: formGuestList,
      budget: formBudget ? parseFloat(formBudget) : undefined,
      startDate: new Date(formStartDate).toISOString(),
      endDate: new Date(formEndDate).toISOString(),
      notes: formNotes
    });
  };

  // ── Calendar calculations ──────────────────────────────────────────────────────

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const startDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrev = () => {
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

  const handleNext = () => {
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

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // ── Month View ────────────────────────────────────────────────────────────────

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startOffset = startDayOfMonth(year, month);

    const daysArray: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) daysArray.push(null);
    for (let i = 1; i <= totalDays; i++) daysArray.push(new Date(year, month, i));

    return (
      <div className="space-y-4">
        <h2 className="sr-only">
          {`Events calendar — ${monthNames[month]} ${year}`}
        </h2>
        <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-zinc-500 uppercase tracking-wider">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1.5 animate-in fade-in duration-200">
          {daysArray.map((date, idx) => {
            if (!date) {
              return <div key={`empty-${idx}`} className="min-h-[110px] border border-zinc-900 bg-zinc-950/20 rounded-xl" />;
            }

            const isToday = new Date().toDateString() === date.toDateString();
            const dateStr = date.toISOString().split("T")[0];
            const dayEvents = events.filter((e) => e.startDate.startsWith(dateStr));
            const ariaLabel = `${date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}${dayEvents.length > 0 ? `, ${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}` : ", no events"}`;

            return (
              <div
                key={dateStr}
                role="button"
                tabIndex={0}
                aria-label={ariaLabel}
                onClick={() => {
                  setFormStartDate(`${dateStr}T09:00`);
                  setFormEndDate(`${dateStr}T17:00`);
                  setShowCreateModal(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setFormStartDate(`${dateStr}T09:00`);
                    setFormEndDate(`${dateStr}T17:00`);
                    setShowCreateModal(true);
                  }
                }}
                className={`min-h-[110px] border transition-all duration-200 rounded-xl p-2.5 flex flex-col justify-between cursor-pointer group hover:bg-zinc-900/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 focus:ring-offset-zinc-950 ${
                  isToday ? "border-purple-500 bg-purple-500/5" : "border-zinc-800/80 bg-[#111113]/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isToday ? "text-purple-400 font-black" : "text-zinc-400"}`}>
                    {date.getDate()}
                  </span>
                  <PlusCircle size={12} className="text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="space-y-1 mt-2 flex-1 overflow-y-auto max-h-[75px] scrollbar-none">
                  {dayEvents.map((e) => {
                    const typeColor = EVENT_TYPES.find((t) => t.key === e.type)?.color || "border-zinc-800 text-zinc-400";
                    return (
                      <div
                        key={e.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`Event: ${e.name}, type ${e.type}`}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          router.push(`/events/${e.id}`);
                        }}
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter" || ev.key === " ") {
                            ev.preventDefault();
                            ev.stopPropagation();
                            router.push(`/events/${e.id}`);
                          }
                        }}
                        className={`text-[9px] font-bold p-1 border rounded truncate ${typeColor} hover:brightness-125 transition-all focus:outline-none focus:ring-1 focus:ring-purple-400`}
                        title={e.name}
                      >
                        {e.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Week View ─────────────────────────────────────────────────────────────────

  const renderWeekView = () => {
    const sunday = new Date(currentDate);
    sunday.setDate(currentDate.getDate() - currentDate.getDay());

    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      weekDays.push(d);
    }

    return (
      <div className="overflow-x-auto">
        <h2 className="sr-only">Events calendar — weekly view</h2>
        <div className="grid grid-cols-7 gap-4 min-w-[600px] animate-in fade-in duration-200">
          {weekDays.map((date) => {
            const dateStr = date.toISOString().split("T")[0];
            const isToday = new Date().toDateString() === date.toDateString();
            const dayEvents = events.filter((e) => e.startDate.startsWith(dateStr));

            return (
              <div
                key={dateStr}
                role="button"
                tabIndex={0}
                aria-label={`${date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}${dayEvents.length > 0 ? `, ${dayEvents.length} events` : ""}`}
                onClick={() => {
                  setFormStartDate(`${dateStr}T09:00`);
                  setFormEndDate(`${dateStr}T17:00`);
                  setShowCreateModal(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setFormStartDate(`${dateStr}T09:00`);
                    setFormEndDate(`${dateStr}T17:00`);
                    setShowCreateModal(true);
                  }
                }}
                className={`min-h-[350px] border rounded-2xl p-4 flex flex-col gap-3 transition-all cursor-pointer hover:bg-zinc-900/20 focus:outline-none focus:ring-2 focus:ring-purple-500 ${isToday ? "border-purple-500 bg-purple-500/5" : "border-zinc-800/80 bg-[#111113]/40"}`}
              >
                <div className="flex flex-col items-center pb-2 border-b border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span className={`text-base font-extrabold mt-1 ${isToday ? "text-purple-400" : "text-zinc-200"}`}>
                    {date.getDate()}
                  </span>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto scrollbar-none">
                  {dayEvents.map((e) => {
                    const typeColor = EVENT_TYPES.find((t) => t.key === e.type)?.color || "border-zinc-800 text-zinc-400";
                    return (
                      <div
                        key={e.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`Event: ${e.name}`}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          router.push(`/events/${e.id}`);
                        }}
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter" || ev.key === " ") {
                            ev.preventDefault();
                            ev.stopPropagation();
                            router.push(`/events/${e.id}`);
                          }
                        }}
                        className={`p-2 border rounded-xl space-y-1 hover:scale-[1.02] hover:brightness-110 transition-all focus:outline-none focus:ring-1 focus:ring-purple-400 ${typeColor}`}
                      >
                        <p className="font-bold text-[10px] truncate leading-tight">{e.name}</p>
                        <p className="text-[9px] opacity-80 flex items-center gap-1">
                          <Clock size={8} />
                          {new Date(e.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    );
                  })}
                  {dayEvents.length === 0 && (
                    <div className="h-full flex items-center justify-center text-[10px] text-zinc-600 italic select-none">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Day View ──────────────────────────────────────────────────────────────────

  const renderDayView = () => {
    const dateStr = currentDate.toISOString().split("T")[0];
    const dayEvents = events.filter((e) => e.startDate.startsWith(dateStr));

    return (
      <div className="border border-zinc-800/80 bg-[#111113]/40 rounded-2xl p-6 min-h-[300px] flex flex-col gap-4 animate-in fade-in duration-200">
        <h2 className="sr-only">Events calendar — daily view</h2>
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h4 className="text-sm font-extrabold text-zinc-200">
              {currentDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </h4>
            <p className="text-[10px] text-zinc-500 mt-0.5">{dayEvents.length} events scheduled for today</p>
          </div>
          <button
            onClick={() => {
              setFormStartDate(`${dateStr}T09:00`);
              setFormEndDate(`${dateStr}T17:00`);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-purple-400 rounded-lg text-xs font-semibold transition-all"
          >
            <Plus size={12} />
            Quick Book
          </button>
        </div>

        <div className="flex-1 space-y-4">
          {dayEvents.map((e) => {
            const typeColor = EVENT_TYPES.find((t) => t.key === e.type)?.color || "border-zinc-800 text-zinc-400";
            const statusColor = STATUS_COLORS[e.status] || "border-zinc-800 text-zinc-400";

            return (
              <div
                key={e.id}
                role="button"
                tabIndex={0}
                aria-label={`Event: ${e.name}, status ${e.status}`}
                onClick={() => router.push(`/events/${e.id}`)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    router.push(`/events/${e.id}`);
                  }
                }}
                className="p-5 border border-zinc-800 bg-zinc-900/10 hover:border-purple-500/30 rounded-xl cursor-pointer hover:shadow-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 border rounded-full text-[9px] font-bold ${typeColor}`}>{e.type}</span>
                    <span className={`px-2 py-0.5 border rounded-full text-[9px] font-bold ${statusColor}`}>{e.status}</span>
                  </div>
                  <h5 className="font-extrabold text-zinc-100 group-hover:text-purple-400 transition-colors text-sm">{e.name}</h5>
                  {e.notes && <p className="text-xs text-zinc-400 leading-normal line-clamp-1 italic">"{e.notes}"</p>}
                </div>

                <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-400 shrink-0">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">Timeline</span>
                    <span className="flex items-center gap-1 text-zinc-300">
                      <Clock size={12} />
                      {new Date(e.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(e.endDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {e.location && (
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-zinc-500 block">Venue</span>
                      <span className="flex items-center gap-1 text-zinc-300 truncate max-w-[150px]">
                        <MapPin size={12} /> {e.location}
                      </span>
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">Budget</span>
                    <span className="flex items-center gap-1 text-emerald-400 font-bold font-mono">
                      ₹{e.budget?.toLocaleString() || "0"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {dayEvents.length === 0 && (
            <div className="h-40 border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center text-xs text-zinc-500 italic gap-1">
              <CalendarIcon size={20} className="text-zinc-600" />
              No events scheduled for this day.
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col transition-all duration-200">

      {/* Top Navbar */}
      <nav className="h-16 border-b border-zinc-800 bg-[#111113]/85 backdrop-blur px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="h-8 w-8 rounded-md bg-zinc-800/80 hover:bg-zinc-700/80 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">Events</span>
            <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-zinc-400 font-bold">Execution Workspace</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1.5 border rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              showFilters ? "bg-purple-950/20 border-purple-500/40 text-purple-400" : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
            }`}
          >
            <Filter size={13} />
            Filters
          </button>

          <button
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="flex items-center gap-2 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-[0.98]"
          >
            <Plus size={14} />
            Create Event
          </button>
        </div>
      </nav>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-[#111113]/60 border-b border-zinc-800 p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-in fade-in duration-150">
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-xs focus:outline-none focus:border-purple-600 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PLANNED">Planned</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Filter by Category</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-xs focus:outline-none focus:border-purple-600 font-medium"
            >
              <option value="ALL">All Categories</option>
              <option value="WEDDING">Wedding</option>
              <option value="BIRTHDAY">Birthday</option>
              <option value="ENGAGEMENT">Engagement</option>
              <option value="CORPORATE">Corporate</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full overflow-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4 shrink-0">
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">Active Workspaces</h1>
            <p className="text-[11px] text-zinc-400 mt-0.5">Filter calendar logs, allocate teams, and provision tasks.</p>
          </div>

          <div className="flex bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg self-start">
            {(["grid", "calendar", "timeline"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === tab ? "bg-zinc-800 text-purple-400" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab === "grid" && <Grid size={13} />}
                {tab === "calendar" && <CalendarDays size={13} />}
                {tab === "timeline" && <ListTodo size={13} />}
                {tab === "grid" ? "Grid Spec" : tab === "calendar" ? "Calendar Scheduler" : "Roadmap Timeline"}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          activeTab === "calendar" ? <CalendarSkeleton /> : <GridSkeleton />
        ) : (
          <>
            {/* GRID VIEW */}
            {activeTab === "grid" && (
              <ErrorBoundary fallbackMessage="Error loading event grid.">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
                  {events.map((e) => {
                    const typeColor = EVENT_TYPES.find((t) => t.key === e.type)?.color || "border-zinc-800 text-zinc-400";
                    const typeLabel = EVENT_TYPES.find((t) => t.key === e.type)?.label || e.type;
                    const statusColor = STATUS_COLORS[e.status] || "border-zinc-800 text-zinc-400";

                    return (
                      <div
                        key={e.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`Event: ${e.name}, ${e.status}`}
                        onClick={() => router.push(`/events/${e.id}`)}
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter" || ev.key === " ") {
                            ev.preventDefault();
                            router.push(`/events/${e.id}`);
                          }
                        }}
                        className="p-5 rounded-2xl border border-zinc-800 bg-[#161618]/30 hover:border-purple-500/30 transition-all cursor-pointer flex flex-col justify-between h-[210px] hover:shadow-xl hover:shadow-purple-500/5 group focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-bold ${typeColor}`}>{typeLabel}</span>
                            <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-bold ${statusColor}`}>{e.status}</span>
                          </div>
                          <h3 className="font-extrabold text-sm text-zinc-100 group-hover:text-purple-400 transition-colors leading-tight">{e.name}</h3>
                          {e.venueName && (
                            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                              <MapPin size={10} /> {e.venueName}
                            </span>
                          )}
                        </div>

                        <div className="border-t border-zinc-800/60 pt-3 mt-4 grid grid-cols-2 gap-2 text-[10px] text-zinc-400">
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon size={12} className="text-zinc-500" />
                            <span>{new Date(e.startDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5 justify-end">
                            <DollarSign size={12} className="text-emerald-500" />
                            <span className="font-bold text-zinc-300">
                              {e.budget ? `₹${(e.budget / 100000).toFixed(1)}L` : "0L"}
                            </span>
                          </div>
                          {e.guestCount !== undefined && e.guestCount > 0 && (
                            <div className="flex items-center gap-1.5 col-span-2 mt-0.5 text-zinc-500">
                              <Users size={12} className="text-zinc-500" />
                              <span>{e.guestCount} Allocated Guests</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {events.length === 0 && (
                    <div className="col-span-full py-16 text-center border border-dashed border-zinc-800 rounded-2xl text-xs text-zinc-500 italic">
                      No active events found matching the filters.
                    </div>
                  )}
                </div>
              </ErrorBoundary>
            )}

            {/* CALENDAR VIEW */}
            {activeTab === "calendar" && (
              <div className="border border-zinc-800/80 bg-[#111113]/30 rounded-2xl p-6 space-y-6">
                {/* Calendar Nav Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                  <div className="flex items-center gap-4">
                    <h3 className="font-extrabold text-sm text-zinc-200">
                      {calendarMode === "month" && `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                      {calendarMode === "week" && `Week of ${currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                      {calendarMode === "day" && currentDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <button onClick={handlePrev} className="h-7 w-7 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors" aria-label="Previous">
                        <ChevronLeft size={14} />
                      </button>
                      <button onClick={() => setCurrentDate(new Date())} className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold rounded text-zinc-300 transition-colors">
                        Today
                      </button>
                      <button onClick={handleNext} className="h-7 w-7 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors" aria-label="Next">
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg self-start">
                    {(["month", "week", "day"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setCalendarMode(m)}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${calendarMode === m ? "bg-zinc-800 text-purple-400" : "text-zinc-500 hover:text-zinc-300"}`}
                      >
                        {m.charAt(0).toUpperCase() + m.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <ErrorBoundary fallbackMessage="Error loading calendar view.">
                  {calendarMode === "month" && renderMonthView()}
                  {calendarMode === "week" && renderWeekView()}
                  {calendarMode === "day" && renderDayView()}
                </ErrorBoundary>
              </div>
            )}

            {/* TIMELINE ROADMAP VIEW */}
            {activeTab === "timeline" && (
              <ErrorBoundary fallbackMessage="Error loading timeline.">
                <div className="border border-zinc-800/80 bg-[#111113]/30 rounded-2xl p-6 space-y-6">
                  <h2 className="font-extrabold text-sm text-zinc-300">Upcoming Execution Roadmap</h2>
                  <div className="relative border-l border-zinc-800 pl-6 ml-2 space-y-8 text-xs py-1">
                    {events
                      .filter((e) => new Date(e.startDate) >= new Date())
                      .map((e) => {
                        const typeColor = EVENT_TYPES.find((t) => t.key === e.type)?.color || "border-zinc-800 text-zinc-400";
                        const typeLabel = EVENT_TYPES.find((t) => t.key === e.type)?.label || e.type;

                        return (
                          <div key={e.id} className="relative group">
                            <div className="absolute -left-[31px] mt-1 h-3.5 w-3.5 rounded-full bg-[#111113] border-2 border-purple-500 group-hover:border-purple-400 transition-colors" />
                            <div
                              role="button"
                              tabIndex={0}
                              aria-label={`Event: ${e.name}`}
                              onClick={() => router.push(`/events/${e.id}`)}
                              onKeyDown={(ev) => {
                                if (ev.key === "Enter" || ev.key === " ") {
                                  ev.preventDefault();
                                  router.push(`/events/${e.id}`);
                                }
                              }}
                              className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-zinc-800 bg-zinc-900/10 rounded-2xl hover:border-purple-500/20 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              <div className="space-y-1.5">
                                <span className={`inline-block px-2.5 py-0.5 border rounded-full text-[9px] font-bold ${typeColor}`}>{typeLabel}</span>
                                <h4 className="font-extrabold text-zinc-100 group-hover:text-purple-400 transition-colors text-sm">{e.name}</h4>
                                <p className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                                  <Clock size={12} />
                                  {new Date(e.startDate).toLocaleString()} — {new Date(e.endDate).toLocaleTimeString()}
                                </p>
                              </div>
                              <div className="text-left md:text-right text-xs shrink-0">
                                <span className="text-[9px] text-zinc-500 uppercase block font-bold">Venue</span>
                                <span className="text-zinc-300 font-semibold">{e.venueName || e.location || "Not assigned"}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    {events.filter((e) => new Date(e.startDate) >= new Date()).length === 0 && (
                      <p className="text-xs text-zinc-500 italic text-center py-4">No future events scheduled.</p>
                    )}
                  </div>
                </div>
              </ErrorBoundary>
            )}
          </>
        )}
      </main>

      {/* CREATE EVENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-[#111113] border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/15 via-transparent to-transparent pointer-events-none" />

            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4 z-10 relative">
              <div>
                <h2 className="text-base font-extrabold text-white">Provision Event Workspace</h2>
                <p className="text-[10px] text-zinc-400 mt-0.5">Initialize operational tracking specs for converted pipeline accounts.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors" aria-label="Close">
                <X size={16} />
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
                <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Event Name</label>
                <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="E.g., Kapoor Wedding Ceremony"
                  className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-purple-600" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Event Category</label>
                  <select value={formType} onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-600 font-medium">
                    <option value="WEDDING">Wedding Ceremony</option>
                    <option value="BIRTHDAY">Birthday Party</option>
                    <option value="ENGAGEMENT">Engagement Gala</option>
                    <option value="CORPORATE">Corporate Summit</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Budget (INR)</label>
                  <input type="number" value={formBudget} onChange={(e) => setFormBudget(e.target.value)} placeholder="E.g., 500000"
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-purple-600" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Start Date & Time</label>
                  <input type="datetime-local" required value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-600" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">End Date & Time</label>
                  <input type="datetime-local" required value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-600" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5 col-span-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Venue Name</label>
                  <input type="text" value={formVenueName} onChange={(e) => setFormVenueName(e.target.value)} placeholder="E.g., Hall A"
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-purple-600" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Venue Address</label>
                  <input type="text" value={formVenueAddress} onChange={(e) => setFormVenueAddress(e.target.value)} placeholder="E.g., Radisson Blu, Delhi"
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-purple-600" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5 col-span-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Guest Count</label>
                  <input type="number" value={formGuestCount} onChange={(e) => setFormGuestCount(e.target.value)} placeholder="E.g., 200"
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-purple-600" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Invitees/VIPs</label>
                  <input type="text" value={formGuestList} onChange={(e) => setFormGuestList(e.target.value)} placeholder="Comma separated names"
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-purple-600" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Operational Notes</label>
                <textarea rows={2} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Catering, floor design, vendor logs..."
                  className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-purple-600 leading-normal" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-xs font-semibold text-zinc-300 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={createEventMutation.isPending}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-md">
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
