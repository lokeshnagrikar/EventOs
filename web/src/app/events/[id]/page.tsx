"use client";

import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Users,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  AlertCircle,
  FileText,
  UserCheck,
  CheckCircle2,
  Edit2,
  Save,
  X,
  PlusCircle,
  CheckCircle,
  ListTodo
} from "lucide-react";

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

interface TimelineItem {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  scheduledTime: string;
  completed: boolean;
}

interface Assignment {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  role: string;
}

interface Task {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  assignedUserId?: string;
  assignedUserName?: string;
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

const EVENT_TYPES = [
  { key: "WEDDING", label: "Wedding", color: "border-pink-500/20 bg-pink-500/5 text-pink-400" },
  { key: "BIRTHDAY", label: "Birthday", color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" },
  { key: "ENGAGEMENT", label: "Engagement", color: "border-purple-500/20 bg-purple-500/5 text-purple-400" },
  { key: "CORPORATE", label: "Corporate", color: "border-blue-500/20 bg-blue-500/5 text-blue-400" }
];

const STATUSES = ["DRAFT", "PLANNED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "ARCHIVED", "CANCELLED"];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "border-purple-500/20 bg-purple-500/5 text-purple-400",
  PLANNED: "border-zinc-500/20 bg-zinc-500/5 text-zinc-400",
  CONFIRMED: "border-blue-500/20 bg-blue-500/5 text-blue-400",
  IN_PROGRESS: "border-amber-500/20 bg-amber-500/5 text-amber-400",
  COMPLETED: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
  ARCHIVED: "border-zinc-800 bg-zinc-900/50 text-zinc-500",
  CANCELLED: "border-red-500/20 bg-red-500/5 text-red-400"
};

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;
  const queryClient = useQueryClient();
  const router = useRouter();

  // Form states for timeline/assignments
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneDesc, setNewMilestoneDesc] = useState("");
  const [newMilestoneTime, setNewMilestoneTime] = useState("");

  const [newAssignName, setNewAssignName] = useState("");
  const [newAssignRole, setNewAssignRole] = useState("");

  // Form states for Tasks checklist
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");

  // Edit Event state
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [editEventForm, setEditEventForm] = useState({
    name: "",
    type: "WEDDING",
    location: "",
    venueName: "",
    venueAddress: "",
    guestCount: 0,
    guestList: "",
    budget: 0,
    notes: "",
    startDate: "",
    endDate: ""
  });

  // 1. Fetch Event Info
  const { data: eventResponse, isLoading: eventLoading, error: eventError } = useQuery<{ data: Event }>({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const response = await api.get(`/events/${eventId}`);
      return response.data;
    }
  });

  const event = eventResponse?.data;

  // Populate Edit Event Form
  useEffect(() => {
    if (event) {
      setEditEventForm({
        name: event.name,
        type: event.type,
        location: event.location || "",
        venueName: event.venueName || "",
        venueAddress: event.venueAddress || "",
        guestCount: event.guestCount || 0,
        guestList: event.guestList || "",
        budget: event.budget || 0,
        notes: event.notes || "",
        startDate: event.startDate ? event.startDate.substring(0, 16) : "",
        endDate: event.endDate ? event.endDate.substring(0, 16) : ""
      });
    }
  }, [event, isEditingEvent]);

  // 2. Fetch Timeline Items
  const { data: timelineResponse } = useQuery<{ data: TimelineItem[] }>({
    queryKey: ["timeline", eventId],
    queryFn: async () => {
      const response = await api.get(`/events/${eventId}/timeline`);
      return response.data;
    },
    enabled: !!eventId
  });

  const timeline = timelineResponse?.data || [];

  // 3. Fetch Team Assignments
  const { data: assignmentsResponse } = useQuery<{ data: Assignment[] }>({
    queryKey: ["assignments", eventId],
    queryFn: async () => {
      const response = await api.get(`/events/${eventId}/assignments`);
      return response.data;
    },
    enabled: !!eventId
  });

  const assignments = assignmentsResponse?.data || [];

  // 3b. Fetch Team Members (for assignment dropdown — replaces fake UUID generation)
  const { data: teamData } = useQuery<{ data: TeamMember[] }>(
    {
      queryKey: ["teamMembers"],
      queryFn: async () => {
        const response = await api.get("/auth/settings/team");
        return response.data;
      }
    }
  );
  const teamMembers: TeamMember[] = teamData?.data || [];
  const [selectedUserId, setSelectedUserId] = useState("");

  // 4. Fetch Event Tasks
  const { data: tasksResponse } = useQuery<{ data: Task[] }>({
    queryKey: ["tasks", eventId],
    queryFn: async () => {
      const response = await api.get(`/events/${eventId}/tasks`);
      return response.data;
    },
    enabled: !!eventId
  });

  const tasks = tasksResponse?.data || [];

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await api.patch(`/events/${eventId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: async (updatedEvent: any) => {
      const response = await api.put(`/events/${eventId}`, updatedEvent);
      return response.data;
    },
    onSuccess: () => {
      setIsEditingEvent(false);
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    }
  });

  const toggleMilestoneMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await api.patch(`/events/${eventId}/timeline/${itemId}/toggle`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline", eventId] });
    }
  });

  const addMilestoneMutation = useMutation({
    mutationFn: async (newItem: Partial<TimelineItem>) => {
      const response = await api.post(`/events/${eventId}/timeline`, newItem);
      return response.data;
    },
    onSuccess: () => {
      setNewMilestoneTitle("");
      setNewMilestoneDesc("");
      setNewMilestoneTime("");
      queryClient.invalidateQueries({ queryKey: ["timeline", eventId] });
    }
  });

  const addAssignmentMutation = useMutation({
    mutationFn: async (newAssign: Partial<Assignment>) => {
      const response = await api.post(`/events/${eventId}/assignments`, newAssign);
      return response.data;
    },
    onSuccess: () => {
      setNewAssignName("");
      setNewAssignRole("");
      queryClient.invalidateQueries({ queryKey: ["assignments", eventId] });
    }
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await api.delete(`/events/${eventId}/assignments/${assignmentId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments", eventId] });
    }
  });

  // Task Mutations
  const addTaskMutation = useMutation({
    mutationFn: async (newTask: any) => {
      const response = await api.post(`/events/${eventId}/tasks`, newTask);
      return response.data;
    },
    onSuccess: () => {
      setNewTaskTitle("");
      setNewTaskDesc("");
      setNewTaskTime("");
      setNewTaskAssignee("");
      queryClient.invalidateQueries({ queryKey: ["tasks", eventId] });
    }
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await api.patch(`/events/${eventId}/tasks/${taskId}/toggle`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", eventId] });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/events/${eventId}/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", eventId] });
    }
  });

  const handleStatusChange = (newStatus: string) => {
    updateStatusMutation.mutate(newStatus);
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim() || !newMilestoneTime) return;

    addMilestoneMutation.mutate({
      title: newMilestoneTitle,
      description: newMilestoneDesc,
      scheduledTime: new Date(newMilestoneTime).toISOString()
    });
  };

  const handleAddAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !newAssignRole.trim()) return;
    const member = teamMembers.find((m: TeamMember) => m.id === selectedUserId);
    addAssignmentMutation.mutate({
      userId: selectedUserId,
      userName: member ? `${member.firstName} ${member.lastName}` : selectedUserId,
      role: newAssignRole
    });
    setSelectedUserId("");
  };

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    addTaskMutation.mutate({
      title: newTaskTitle,
      description: newTaskDesc,
      dueDate: newTaskTime ? new Date(newTaskTime).toISOString() : null,
      assignedUserName: newTaskAssignee || null,
      assignedUserId: null
    });
  };

  const handleEditEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateEventMutation.mutate({
      name: editEventForm.name,
      type: editEventForm.type,
      location: editEventForm.location,
      venueName: editEventForm.venueName,
      venueAddress: editEventForm.venueAddress,
      guestCount: editEventForm.guestCount,
      guestList: editEventForm.guestList,
      budget: editEventForm.budget,
      notes: editEventForm.notes,
      startDate: new Date(editEventForm.startDate).toISOString(),
      endDate: new Date(editEventForm.endDate).toISOString()
    });
  };

  const UUID_fallback = () => {
    return "00000000-0000-0000-0000-" + Math.floor(100000000000 + Math.random() * 900000000000).toString();
  };

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-400 flex items-center justify-center animate-pulse text-xs">
        Loading event timeline workspace details...
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col items-center justify-center p-6 space-y-4">
        <AlertCircle className="text-red-500 h-12 w-12" />
        <h2 className="text-lg font-bold">Event details could not be loaded</h2>
        <p className="text-zinc-550 text-xs">Verify that the event exists and the backend microservices are running.</p>
        <button
          onClick={() => router.push("/events")}
          className="flex items-center gap-1.5 px-4 py-2 bg-zinc-805 hover:bg-zinc-700 rounded-lg text-xs font-semibold"
        >
          <ArrowLeft size={14} />
          Back to Events
        </button>
      </div>
    );
  }

  const typeColor = EVENT_TYPES.find((t) => t.key === event.type)?.color || "border-zinc-850 text-zinc-400";
  const typeLabel = EVENT_TYPES.find((t) => t.key === event.type)?.label || event.type;

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col transition-all duration-200">
      
      {/* Top Navbar */}
      <nav className="h-16 border-b border-zinc-800 bg-[#111113]/85 backdrop-blur px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/events")}
            className="h-8 w-8 rounded-md bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
            aria-label="Back to events"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base">{event.name}</span>
            <span className={`text-[10px] px-2.5 py-0.5 border rounded-full font-bold ${typeColor}`}>
              {typeLabel}
            </span>
          </div>
        </div>

        {/* Status quick editor */}
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => setIsEditingEvent(!isEditingEvent)}
            className="h-8 px-3 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-[10px] font-bold flex items-center gap-1.5 transition-colors"
          >
            <Edit2 size={12} />
            {isEditingEvent ? "Cancel" : "Edit Details"}
          </button>

          <span className="text-zinc-550 font-bold uppercase tracking-wider">Status:</span>
          <select
            value={event.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-650 font-bold"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </nav>

      {/* Main Workspace details grid */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-auto">
        
        {/* Left Side: Info Specs & Edit Form */}
        <div className="space-y-6 lg:col-span-1">
          {isEditingEvent ? (
            /* EDIT EVENT DETAILS */
            <form onSubmit={handleEditEventSubmit} className="p-6 border border-zinc-800 bg-[#161618]/30 rounded-2xl space-y-4 text-xs">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-300 pb-2 border-b border-zinc-850">
                Edit Event Specs
              </h3>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 uppercase font-bold">Event Name</label>
                <input
                  type="text"
                  required
                  value={editEventForm.name}
                  onChange={(e) => setEditEventForm({ ...editEventForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-650 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold">Category</label>
                  <select
                    value={editEventForm.type}
                    onChange={(e) => setEditEventForm({ ...editEventForm, type: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-650 font-medium"
                  >
                    <option value="WEDDING">Wedding</option>
                    <option value="BIRTHDAY">Birthday</option>
                    <option value="ENGAGEMENT">Engagement</option>
                    <option value="CORPORATE">Corporate</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold">Budget</label>
                  <input
                    type="number"
                    value={editEventForm.budget}
                    onChange={(e) => setEditEventForm({ ...editEventForm, budget: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-650 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 uppercase font-bold">General Location</label>
                <input
                  type="text"
                  value={editEventForm.location}
                  onChange={(e) => setEditEventForm({ ...editEventForm, location: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-650 font-medium"
                />
              </div>

              {/* Venue Specs */}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 uppercase font-bold">Venue Name</label>
                <input
                  type="text"
                  value={editEventForm.venueName}
                  onChange={(e) => setEditEventForm({ ...editEventForm, venueName: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-650 font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 uppercase font-bold">Venue Address</label>
                <input
                  type="text"
                  value={editEventForm.venueAddress}
                  onChange={(e) => setEditEventForm({ ...editEventForm, venueAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-650 font-medium"
                />
              </div>

              {/* Guest Counts */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1 col-span-1">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold">Guests</label>
                  <input
                    type="number"
                    value={editEventForm.guestCount}
                    onChange={(e) => setEditEventForm({ ...editEventForm, guestCount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-650 font-medium"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold">VIP Guests list</label>
                  <input
                    type="text"
                    value={editEventForm.guestList}
                    onChange={(e) => setEditEventForm({ ...editEventForm, guestList: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-650 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 uppercase font-bold">Start Date</label>
                <input
                  type="datetime-local"
                  value={editEventForm.startDate}
                  onChange={(e) => setEditEventForm({ ...editEventForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-650 font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 uppercase font-bold">End Date</label>
                <input
                  type="datetime-local"
                  value={editEventForm.endDate}
                  onChange={(e) => setEditEventForm({ ...editEventForm, endDate: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-650 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 uppercase font-bold">Operational Notes</label>
                <textarea
                  rows={2}
                  value={editEventForm.notes}
                  onChange={(e) => setEditEventForm({ ...editEventForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-650 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={updateEventMutation.isPending}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors shadow mt-2"
              >
                <Save size={13} />
                Save Event Specs
              </button>
            </form>
          ) : (
            /* READ-ONLY STATS VIEW */
            <div className="p-6 border border-zinc-800 bg-[#161618]/30 rounded-2xl space-y-5 text-xs">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-400 border-b border-zinc-850 pb-2">
                Event Specs
              </h3>

              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Venue Location</span>
                  <span className="flex items-start gap-2 text-zinc-200 leading-normal">
                    <MapPin size={13} className="text-zinc-550 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-zinc-200">{event.venueName || "No specific venue name"}</p>
                      <p className="text-[11px] text-zinc-400">{event.venueAddress || event.location || "No address details available"}</p>
                    </div>
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Guest List Allocations</span>
                  <span className="flex items-start gap-2 text-zinc-200 leading-normal">
                    <Users size={13} className="text-zinc-550 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-zinc-200">{event.guestCount || 0} Registered Invitees</p>
                      {event.guestList && (
                        <p className="text-[10px] text-zinc-400 mt-1 bg-zinc-900/60 p-2 border border-zinc-850 rounded-lg">
                          {event.guestList}
                        </p>
                      )}
                    </div>
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Budget Allocated</span>
                  <span className="flex items-center gap-2 text-emerald-450 font-black text-sm">
                    <DollarSign size={13} />
                    INR {event.budget?.toLocaleString() || "0"}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Start Date & Time</span>
                  <span className="flex items-center gap-2 text-zinc-350">
                    <Calendar size={13} className="text-zinc-550" />
                    {new Date(event.startDate).toLocaleString()}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">End Date & Time</span>
                  <span className="flex items-center gap-2 text-zinc-350">
                    <Clock size={13} className="text-zinc-550" />
                    {new Date(event.endDate).toLocaleString()}
                  </span>
                </div>
              </div>

              {event.notes && (
                <div className="space-y-2 border-t border-zinc-800/60 pt-4 mt-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">
                    Catering & Operational Notes
                  </span>
                  <p className="text-[11px] text-zinc-350 bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl leading-relaxed italic">
                    "{event.notes}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Task Checklist, Timeline & Team Assignments */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Task Checklist Section */}
          <div className="p-6 border border-zinc-800 bg-[#161618]/30 rounded-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
              <div className="flex items-center gap-2">
                <ListTodo size={16} className="text-purple-400" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-200">Execution Task Checklist</h3>
              </div>
              <span className="text-xs text-zinc-500 font-bold">
                {tasks.filter((t) => t.completed).length}/{tasks.length} Completed
              </span>
            </div>

            {/* Task list items */}
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-start justify-between p-4 border rounded-xl bg-zinc-900/30 transition-all group ${
                    task.completed ? "border-zinc-800/30 text-zinc-500" : "border-zinc-800 text-zinc-200 hover:bg-zinc-900/40"
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0" onClick={() => toggleTaskMutation.mutate(task.id)}>
                    <button className="mt-0.5 cursor-pointer" aria-label="Toggle task completed">
                      {task.completed ? (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      ) : (
                        <div className="h-4 w-4 rounded border border-zinc-700 hover:border-purple-500 transition-colors" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <h4 className={`text-xs font-bold leading-none cursor-pointer ${task.completed ? "line-through text-zinc-550" : ""}`}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-[10px] text-zinc-500 mt-1 leading-normal">{task.description}</p>
                      )}
                      
                      {/* Meta information row */}
                      <div className="flex flex-wrap items-center gap-4 mt-2">
                        {task.dueDate && (
                          <span className="text-[9px] text-zinc-500 font-bold flex items-center gap-1">
                            <Clock size={10} />
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {task.assignedUserName && (
                          <span className="text-[9px] text-purple-400 font-bold flex items-center gap-1 bg-purple-950/20 px-2 py-0.5 rounded-full border border-purple-900/30">
                            <UserCheck size={9} />
                            Assignee: {task.assignedUserName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteTaskMutation.mutate(task.id)}
                    className="h-7 w-7 rounded bg-zinc-800/20 hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center text-zinc-550 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                    title="Delete Task"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              {tasks.length === 0 && (
                <p className="text-xs text-zinc-550 italic py-2 text-center">No tasks assigned for execution.</p>
              )}
            </div>

            {/* Add Task Form */}
            <div className="border-t border-zinc-800/60 pt-6">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-zinc-400 mb-3">
                Log Execution Task
              </h4>
              <form onSubmit={handleAddTaskSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Task title (e.g. Confirm audio setup)"
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-850 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-600 md:col-span-2 font-medium"
                  />
                  <input
                    type="datetime-local"
                    value={newTaskTime}
                    onChange={(e) => setNewTaskTime(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-850 rounded-lg text-white focus:outline-none focus:border-purple-600 font-medium"
                  />
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    placeholder="Task details/description..."
                    className="flex-1 px-3 py-2 bg-[#18181B] border border-zinc-850 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-600 font-medium"
                  />
                  <input
                    type="text"
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    placeholder="Assignee name..."
                    className="w-40 px-3 py-2 bg-[#18181B] border border-zinc-855 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-600 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={addTaskMutation.isPending}
                    className="flex items-center justify-center gap-1.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shrink-0 transition-all"
                  >
                    <Plus size={14} />
                    Add Task
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Timeline Milestones Section */}
          <div className="p-6 border border-zinc-800 bg-[#161618]/30 rounded-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare size={16} className="text-purple-400" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-200">Timeline Milestone Schedule</h3>
              </div>
              <span className="text-xs text-zinc-500 font-semibold">
                {timeline.filter((i) => i.completed).length}/{timeline.length} completed
              </span>
            </div>

            {/* Timeline Milestones list */}
            <div className="space-y-3">
              {timeline.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleMilestoneMutation.mutate(item.id)}
                  className={`flex items-start gap-3 p-3.5 border rounded-xl bg-zinc-900/30 cursor-pointer transition-all hover:bg-zinc-900/60 select-none ${
                    item.completed ? "border-zinc-800/40 text-zinc-500" : "border-zinc-800 text-zinc-200"
                  }`}
                >
                  <button className="mt-0.5" aria-label={item.completed ? "Mark incomplete" : "Mark complete"}>
                    {item.completed ? (
                      <CheckCircle2 size={16} className="text-emerald-555" />
                    ) : (
                      <div className="h-4 w-4 rounded border border-zinc-700 hover:border-purple-500 transition-colors" />
                    )}
                  </button>
                  <div className="flex-1">
                    <h4 className={`text-xs font-bold leading-none ${item.completed ? "line-through text-zinc-500" : ""}`}>
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-[10px] text-zinc-550 mt-1 leading-normal">{item.description}</p>
                    )}
                    <span className="text-[9px] text-zinc-550 mt-1.5 block font-semibold flex items-center gap-1">
                      <Clock size={9} />
                      {new Date(item.scheduledTime).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}

              {timeline.length === 0 && (
                <p className="text-xs text-zinc-550 italic py-2 text-center">No milestone timelines scheduled yet.</p>
              )}
            </div>

            {/* Add Milestone Form */}
            <div className="border-t border-zinc-800/60 pt-6">
              <h4 className="text-xs uppercase font-semibold tracking-wider text-zinc-400 mb-3">
                Schedule Milestone Task
              </h4>
              <form onSubmit={handleAddMilestone} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      required
                      value={newMilestoneTitle}
                      onChange={(e) => setNewMilestoneTitle(e.target.value)}
                      placeholder="E.g., Catering Setup Complete"
                      className="w-full px-3 py-2 bg-[#18181B] border border-zinc-850 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-600 font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <input
                      type="datetime-local"
                      required
                      value={newMilestoneTime}
                      onChange={(e) => setNewMilestoneTime(e.target.value)}
                      className="w-full px-3 py-2 bg-[#18181B] border border-zinc-850 rounded-lg text-white focus:outline-none focus:border-purple-600 font-medium"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMilestoneDesc}
                    onChange={(e) => setNewMilestoneDesc(e.target.value)}
                    placeholder="Milestone description details (optional)..."
                    className="flex-1 px-3 py-2 bg-[#18181B] border border-zinc-850 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-600 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={addMilestoneMutation.isPending}
                    className="flex items-center justify-center gap-1.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shrink-0 transition-all"
                  >
                    <Plus size={14} />
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Team Assignments Section */}
          <div className="p-6 border border-zinc-800 bg-[#161618]/30 rounded-2xl space-y-6">
            <div className="flex items-center gap-2 border-b border-zinc-855 pb-3">
              <Users size={16} className="text-purple-400" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-200">Team Coordinate Assignments</h3>
            </div>

            {/* Assignments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((assign) => (
                <div
                  key={assign.id}
                  className="p-3.5 border border-zinc-850 bg-zinc-900/20 rounded-xl flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center text-purple-400">
                      <UserCheck size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">{assign.userName}</h4>
                      <span className="text-[10px] text-zinc-500 font-semibold">{assign.role}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeAssignmentMutation.mutate(assign.id)}
                    className="h-7 w-7 rounded bg-zinc-800/40 hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center text-zinc-550 transition-all opacity-0 group-hover:opacity-100"
                    aria-label={`Unassign ${assign.userName}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              {assignments.length === 0 && (
                <p className="text-xs text-zinc-550 italic col-span-full py-2">No team members assigned to this event workspace.</p>
              )}
            </div>

            {/* Add Assignment Form */}
            <div className="border-t border-zinc-800/60 pt-6">
              <h4 className="text-xs uppercase font-semibold tracking-wider text-zinc-400 mb-3">
                Assign Team Member
              </h4>
              <form onSubmit={handleAddAssignment} className="flex gap-3 text-xs">
                <input
                  type="text"
                  required
                  value={newAssignName}
                  onChange={(e) => setNewAssignName(e.target.value)}
                  placeholder="Team member name..."
                  className="flex-1 px-3 py-2 bg-[#18181B] border border-zinc-850 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-600 font-medium"
                />
                <input
                  type="text"
                  required
                  value={newAssignRole}
                  onChange={(e) => setNewAssignRole(e.target.value)}
                  placeholder="Role (e.g. Lead Planner)..."
                  className="flex-1 px-3 py-2 bg-[#18181B] border border-zinc-850 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-600 font-medium"
                />
                <button
                  type="submit"
                  disabled={addAssignmentMutation.isPending}
                  className="flex items-center justify-center gap-1.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shrink-0 transition-all"
                >
                  <Plus size={14} />
                  Assign
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
