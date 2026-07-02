"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Users,
  CheckCircle2,
  Edit2,
  Save,
  Plus,
  Trash2,
  FileText,
  UserCheck,
  Phone,
  CloudSun,
  Shield,
  Car,
  Briefcase,
  Upload,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Notebook,
  AlertTriangle,
  FolderOpen,
  Sparkles,
  Layers,
  Award,
  Lock,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  GitMerge,
  Tag,
  CheckSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  assignedStaff: string;
  dueDate: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  completed: boolean;
}

interface KanbanTask {
  id: string;
  title: string;
  description: string;
  status: "TO_DO" | "IN_PROGRESS" | "WAITING" | "COMPLETED" | "BLOCKED";
  priority: "HIGH" | "MEDIUM" | "LOW";
  dueDate: string;
  assignedTo: string;
}

interface EventResource {
  id: string;
  name: string;
  type: string;
  status: "Available" | "Reserved" | "Maintenance";
  maintenanceInfo: string;
  assignedHours: string;
}

interface EventDoc {
  id: string;
  name: string;
  type: string;
  version: string;
  date: string;
  url: string;
}

const TAB_OPTIONS = [
  { id: "overview", label: "Overview", icon: Briefcase },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "checklist", label: "Checklist", icon: CheckCircle2 },
  { id: "kanban", label: "Task Board", icon: Layers },
  { id: "resources", label: "Resources", icon: Car },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "team", label: "Staffing", icon: Users },
  { id: "budget", label: "Budget", icon: DollarSign }
];

const EVENT_TYPES = [
  { key: "WEDDING", label: "Wedding", color: "border-pink-500/20 bg-pink-500/5 text-pink-400" },
  { key: "BIRTHDAY", label: "Birthday", color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" },
  { key: "ENGAGEMENT", label: "Engagement", color: "border-purple-500/20 bg-purple-500/5 text-purple-400" },
  { key: "CORPORATE", label: "Corporate", color: "border-blue-500/20 bg-blue-500/5 text-blue-400" }
];

const STATUSES = ["PLANNING", "PROPOSAL_SENT", "CONFIRMED", "VENDOR_ASSIGNED", "IN_PREPARATION", "IN_PROGRESS", "COMPLETED", "ARCHIVED", "CANCELLED"];

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

export default function EventWorkspace({ eventId }: { eventId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("overview");
  const [isEditingEvent, setIsEditingEvent] = useState(false);

  // Core Event Form Fields State
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("WEDDING");
  const [editLocation, setEditLocation] = useState("");
  const [editVenueName, setEditVenueName] = useState("");
  const [editVenueAddress, setEditVenueAddress] = useState("");
  const [editGuestCount, setEditGuestCount] = useState(0);
  const [editBudget, setEditBudget] = useState(0);
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");

  // Serialization Metadata fields (saved inside Event notes column)
  const [rawNotesText, setRawNotesText] = useState("");
  const [dressCode, setDressCode] = useState("Black Tie Optional");
  const [themeName, setThemeName] = useState("Vintage Royal");
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [priorityTier, setPriorityTier] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");
  const [colorLabel, setColorLabel] = useState("Purple");
  const [eventTags, setEventTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");

  // checklist
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newCheckText, setNewCheckText] = useState("");
  const [newCheckStaff, setNewCheckStaff] = useState("");
  const [newCheckDue, setNewCheckDue] = useState("");
  const [newCheckPriority, setNewCheckPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");

  // Kanban Tasks
  const [kanbanTasks, setKanbanTasks] = useState<KanbanTask[]>([]);
  const [newKanbanTitle, setNewKanbanTitle] = useState("");
  const [newKanbanDesc, setNewKanbanDesc] = useState("");
  const [newKanbanDue, setNewKanbanDue] = useState("");
  const [newKanbanAssignee, setNewKanbanAssignee] = useState("");
  const [newKanbanPriority, setNewKanbanPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");

  // Resources list
  const [resources, setResources] = useState<EventResource[]>([]);
  const [newResName, setNewResName] = useState("");
  const [newResType, setNewResType] = useState("Speakers");
  const [newResStatus, setNewResStatus] = useState<"Available" | "Reserved" | "Maintenance">("Available");
  const [newResMaint, setNewResMaint] = useState("Operational");

  // Documents
  const [documents, setDocuments] = useState<EventDoc[]>([]);
  const [newDocName, setNewDocName] = useState("");
  const [newDocType, setNewDocType] = useState("Contract");

  // Roster/Staff assignments
  const [plannerName, setPlannerName] = useState("Lokesh Nagrikar");
  const [coordinatorName, setCoordinatorName] = useState("Shreya Gupta");
  const [photographerName, setPhotographerName] = useState("Rahul Sharma");
  const [designerName, setDesignerName] = useState("Priya Patel");

  // Local simulated budget expenses
  const [expenses, setExpenses] = useState([
    { id: "1", item: "Venue Booking Deposit", category: "Venue", projected: 150000, actual: 150000, status: "PAID" },
    { id: "2", item: "Buffet Catering", category: "Food", projected: 180000, actual: 180000, status: "PAID" },
    { id: "3", item: "Premium Florals", category: "Decoration", projected: 120000, actual: 140000, status: "PARTIAL" }
  ]);
  const [newExpItem, setNewExpItem] = useState("");
  const [newExpProj, setNewExpProj] = useState("");
  const [newExpAct, setNewExpAct] = useState("");
  const [newExpCat, setNewExpCat] = useState("Food");

  // Fetch Event details
  const { data: eventResponse, isLoading: eventLoading } = useQuery<{ data: Event }>({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const response = await api.get(`/events/${eventId}`);
      return response.data;
    }
  });

  const event = eventResponse?.data;

  // Fetch team members
  const { data: teamData } = useQuery<{ data: TeamMember[] }>({
    queryKey: ["teamMembers"],
    queryFn: async () => {
      const response = await api.get("/auth/settings/team");
      return response.data;
    }
  });
  const teamMembers = teamData?.data || [];

  // Parse notes JSON metadata
  useEffect(() => {
    if (event) {
      setEditName(event.name || "");
      setEditType(event.type || "WEDDING");
      setEditLocation(event.location || "");
      setEditVenueName(event.venueName || "");
      setEditVenueAddress(event.venueAddress || "");
      setEditGuestCount(event.guestCount || 0);
      setEditBudget(event.budget || 0);
      setEditStartDate(event.startDate ? event.startDate.substring(0, 16) : "");
      setEditEndDate(event.endDate ? event.endDate.substring(0, 16) : "");

      if (event.notes && event.notes.startsWith("{")) {
        try {
          const meta = JSON.parse(event.notes);
          setRawNotesText(meta.notesText || "");
          setDressCode(meta.dressCode || "Black Tie Optional");
          setThemeName(meta.theme || "Vintage Royal");
          setSpecialRequirements(meta.specialRequirements || "");
          setPriorityTier(meta.priority || "MEDIUM");
          setColorLabel(meta.colorLabel || "Purple");
          setEventTags(meta.tags || []);
          
          setChecklist(meta.checklist || []);
          setKanbanTasks(meta.tasks || []);
          setResources(meta.resources || []);
          setDocuments(meta.documents || []);

          setPlannerName(meta.planner || "Lokesh Nagrikar");
          setCoordinatorName(meta.coordinator || "Shreya Gupta");
          setPhotographerName(meta.photographer || "Rahul Sharma");
          setDesignerName(meta.designer || "Priya Patel");
        } catch (e) {
          setRawNotesText(event.notes || "");
        }
      } else {
        setRawNotesText(event.notes || "");
      }
    }
  }, [event, isEditingEvent]);

  // Mutation to update event status or properties
  const updateEventMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.put(`/events/${eventId}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setIsEditingEvent(false);
    }
  });

  const saveMetadataChanges = (customCheck?: ChecklistItem[], customTasks?: KanbanTask[], customRes?: EventResource[], customDocs?: EventDoc[], customTags?: string[]) => {
    const serializedNotes = JSON.stringify({
      notesText: rawNotesText,
      dressCode,
      theme: themeName,
      specialRequirements,
      priority: priorityTier,
      colorLabel,
      tags: customTags || eventTags,
      checklist: customCheck || checklist,
      tasks: customTasks || kanbanTasks,
      resources: customRes || resources,
      documents: customDocs || documents,
      planner: plannerName,
      coordinator: coordinatorName,
      photographer: photographerName,
      designer: designerName
    });

    updateEventMutation.mutate({
      name: editName,
      type: editType,
      status: event?.status || "PLANNING",
      startDate: new Date(editStartDate).toISOString(),
      endDate: new Date(editEndDate).toISOString(),
      location: editLocation,
      venueName: editVenueName,
      venueAddress: editVenueAddress,
      guestCount: Number(editGuestCount),
      budget: Number(editBudget),
      notes: serializedNotes
    });
  };

  const handleStatusChange = (newStatus: string) => {
    api.patch(`/events/${eventId}/status`, { status: newStatus }).then(() => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    });
  };

  // Kanban task drag end
  const handleTaskDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const updated: KanbanTask[] = kanbanTasks.map(t => t.id === draggableId ? { ...t, status: destination.droppableId as any } : t);
    setKanbanTasks(updated);
    saveMetadataChanges(undefined, updated);
  };

  // Checklist progress % calculator
  const checklistProgress = useMemo(() => {
    if (!checklist.length) return 0;
    const completed = checklist.filter(c => c.completed).length;
    return Math.round((completed / checklist.length) * 100);
  }, [checklist]);

  if (eventLoading || !event) {
    return <div className="h-screen flex items-center justify-center animate-pulse text-zinc-500 text-xs">Loading event operations...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex flex-col relative overflow-hidden transition-all duration-200">
      
      {/* Glow panels */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/5 blur-[90px] rounded-full pointer-events-none" />

      {/* Workspace Header */}
      <div className="border-b border-zinc-800 bg-[#111113]/85 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/events")} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <ArrowRight size={13} className="rotate-180" />
            Back
          </button>
          <div>
            <h1 className="font-extrabold text-sm text-zinc-150">{event.name}</h1>
            <p className="text-[10px] text-zinc-550 mt-1 flex items-center gap-1">
              <Calendar size={11} />
              {new Date(event.startDate).toLocaleDateString()} &mdash; {new Date(event.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* LifeCycle Transition Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={event.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={cn("px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none cursor-pointer", STATUS_COLORS[event.status])}
          >
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs Switchers */}
      <div className="border-b border-zinc-850 px-6 bg-zinc-950/20 flex gap-4 shrink-0 overflow-x-auto scrollbar-none select-none">
        {TAB_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => setActiveTab(opt.id)}
            className={cn(
              "py-3.5 text-[10px] font-bold border-b-2 tracking-wide uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0",
              activeTab === opt.id ? "border-purple-500 text-purple-400" : "border-transparent text-zinc-500 hover:text-zinc-350"
            )}
          >
            <opt.icon size={12} />
            {opt.label}
          </button>
        ))}
      </div>

      {/* Tab Workspaces display */}
      <div className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full select-none">
        
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMetadataChanges();
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 font-semibold text-xs text-zinc-300"
          >
            {/* Left/Middle Columns: Basic & Extended Info */}
            <div className="md:col-span-2 space-y-6">
              <div className="p-5 border border-zinc-850 bg-[#161618]/30 rounded-xl space-y-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest pb-2 border-b border-zinc-900">
                  Basic Information
                </h3>
                
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">Event Title</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-bold block">Category</label>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white"
                    >
                      <option value="WEDDING">Wedding</option>
                      <option value="BIRTHDAY">Birthday</option>
                      <option value="ENGAGEMENT">Engagement</option>
                      <option value="CORPORATE">Corporate</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-bold block">Budget (INR)</label>
                    <input
                      type="number"
                      value={editBudget}
                      onChange={(e) => setEditBudget(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-bold block">Start Time</label>
                    <input
                      type="datetime-local"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-bold block">End Time</label>
                    <input
                      type="datetime-local"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Extended Enterprise CRM specifics */}
              <div className="p-5 border border-zinc-850 bg-[#161618]/30 rounded-xl space-y-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest pb-2 border-b border-zinc-900">
                  Dress Code, Theme & Special Specs
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-bold block">Dress Code</label>
                    <input
                      type="text"
                      value={dressCode}
                      onChange={(e) => setDressCode(e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-bold block">Theme Style</label>
                    <input
                      type="text"
                      value={themeName}
                      onChange={(e) => setThemeName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">Special Requirements / Notes</label>
                  <textarea
                    value={specialRequirements}
                    onChange={(e) => setSpecialRequirements(e.target.value)}
                    rows={3}
                    placeholder="E.g. No alcohol on premises, setup sound system before 4PM..."
                    className="w-full p-3 bg-zinc-900 border border-zinc-850 rounded-lg text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Priority, Color Label & Map */}
            <div className="space-y-6">
              <div className="p-5 border border-zinc-850 bg-[#161618]/30 rounded-xl space-y-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest pb-2 border-b border-zinc-900">
                  Priority & Classification
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-bold block">Priority Tier</label>
                    <select
                      value={priorityTier}
                      onChange={(e) => setPriorityTier(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white"
                    >
                      <option value="HIGH">High Priority</option>
                      <option value="MEDIUM">Medium Priority</option>
                      <option value="LOW">Low Priority</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-bold block">Color Label</label>
                    <select
                      value={colorLabel}
                      onChange={(e) => setColorLabel(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white"
                    >
                      <option value="Purple">Purple Glow</option>
                      <option value="Emerald">Emerald Green</option>
                      <option value="Rose">Rose Pink</option>
                      <option value="Blue">Classic Blue</option>
                    </select>
                  </div>
                </div>

                {/* Google Maps placeholder */}
                <div className="space-y-2 pt-2">
                  <label className="text-zinc-500 font-bold block">Venue Location Map</label>
                  <div className="h-32 bg-zinc-900 border border-zinc-850 rounded-xl relative overflow-hidden flex items-center justify-center text-zinc-550">
                    <MapPin size={24} className="text-purple-400 absolute animate-bounce" />
                    <span className="text-[10px] uppercase font-bold text-zinc-500 mt-12">Radisson Blu, Delhi Coordinates Linked</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-semibold">{editVenueAddress || "No address specified"}</p>
                </div>
              </div>

              {/* Tags Panel */}
              <div className="p-5 border border-zinc-850 bg-[#161618]/30 rounded-xl space-y-4">
                <label className="text-zinc-400 uppercase font-bold tracking-widest block">Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {eventTags.map(t => (
                    <span key={t} className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-350 text-[10px] rounded-md font-bold flex items-center gap-1.5">
                      {t}
                      <button type="button" onClick={() => {
                        const updated = eventTags.filter(tg => tg !== t);
                        setEventTags(updated);
                        saveMetadataChanges(undefined, undefined, undefined, undefined, updated);
                      }} className="hover:text-red-400">
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New Tag"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    className="flex-1 px-2.5 py-1 bg-zinc-950 border border-zinc-850 rounded text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newTagInput.trim()) return;
                      const updated = [...eventTags, newTagInput.trim()];
                      setEventTags(updated);
                      saveMetadataChanges(undefined, undefined, undefined, undefined, updated);
                      setNewTagInput("");
                    }}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded font-bold text-white"
                  >
                    Add
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-650 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-bold transition shadow-md active:scale-95 cursor-pointer"
              >
                Save Details & Sync
              </button>
            </div>
          </form>
        )}

        {/* TIMELINE TAB */}
        {activeTab === "timeline" && (
          <div className="p-5 border border-zinc-850 bg-[#161618]/30 rounded-xl space-y-6">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest pb-2 border-b border-zinc-900">
              Interactive Execution Roadmap
            </h3>
            
            <div className="relative border-l border-zinc-850 pl-6 ml-3 space-y-6 font-semibold text-xs">
              {[
                { title: "Lead Converted", desc: "Converted from HubSpot CRM lead profile", date: "June 25th", status: "COMPLETED" },
                { title: "Quote Accepted", desc: "Pricing proposal accepted by client sponsor", date: "June 26th", status: "COMPLETED" },
                { title: "Booking Created", desc: "Draft booking allocated with sequence Ref", date: "June 26th", status: "COMPLETED" },
                { title: "Invoice Generated", desc: "Contract billing schedule set for 50% advance", date: "June 27th", status: "COMPLETED" },
                { title: "Payment Received", desc: "Advance sum cleared successfully", date: "June 28th", status: "COMPLETED" },
                { title: "Vendor Assigned", desc: "Photographers and florists allocated", date: "June 29th", status: "COMPLETED" },
                { title: "Checklist Verified", desc: "Checklist milestone at 80% mark", date: "June 30th", status: "COMPLETED" },
                { title: "Event Day", desc: "Final execution live setup at Radisson Blu", date: "Scheduled", status: "PENDING" },
                { title: "Gallery Created", desc: "Client sharing portfolio workspace delivery", date: "Pending", status: "PENDING" },
                { title: "Event Completed", desc: "Booking status converted to complete", date: "Pending", status: "PENDING" }
              ].map((milestone, idx) => (
                <div key={idx} className="relative group">
                  <span className={cn(
                    "absolute -left-[32px] mt-1.5 h-3.5 w-3.5 rounded-full border-2 ring-4 ring-[#09090b]",
                    milestone.status === "COMPLETED" ? "bg-emerald-500 border-emerald-450" : "bg-zinc-850 border-zinc-700"
                  )} />
                  <div>
                    <span className={cn("font-bold block", milestone.status === "COMPLETED" ? "text-zinc-200" : "text-zinc-550")}>
                      {milestone.title}
                    </span>
                    <p className="text-[10px] text-zinc-500 font-medium">{milestone.desc}</p>
                    <span className="text-[9px] text-zinc-650 font-bold block mt-0.5">{milestone.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CHECKLIST TAB */}
        {activeTab === "checklist" && (
          <div className="space-y-5 font-semibold text-xs select-none">
            {/* Animated progress bar */}
            <div className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-450">Smart Checklist Progress</span>
                <span className="font-mono text-purple-400 font-extrabold">{checklistProgress}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${checklistProgress}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                />
              </div>
            </div>

            {/* Checklist elements list */}
            <div className="space-y-2.5">
              {checklist.map((item) => (
                <div key={item.id} className="p-3 border border-zinc-850 bg-[#161618]/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => {
                        const updated = checklist.map(c => c.id === item.id ? { ...c, completed: !c.completed } : c);
                        setChecklist(updated);
                        saveMetadataChanges(updated);
                      }}
                      className="h-4 w-4 rounded border-zinc-800 text-purple-500 cursor-pointer accent-purple-500"
                    />
                    <div>
                      <span className={cn("font-bold text-zinc-200", item.completed && "line-through text-zinc-500")}>
                        {item.text}
                      </span>
                      <p className="text-[9px] text-zinc-500 font-semibold mt-0.5">
                        Staff: {item.assignedStaff || "Unassigned"} • Due: {item.dueDate || "TBA"} • Priority: {item.priority}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const updated = checklist.filter(c => c.id !== item.id);
                      setChecklist(updated);
                      saveMetadataChanges(updated);
                    }}
                    className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {checklist.length === 0 && (
                <p className="text-zinc-500 italic py-6 text-center">No checklist milestones added. Use seed presets below.</p>
              )}
            </div>

            {/* Add Checklist form */}
            <div className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-3">
              <span className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Add checklist item</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Task name (e.g. Florist sign-off)"
                  value={newCheckText}
                  onChange={(e) => setNewCheckText(e.target.value)}
                  className="sm:col-span-2 px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Assigned Staff"
                  value={newCheckStaff}
                  onChange={(e) => setNewCheckStaff(e.target.value)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white focus:outline-none"
                />
                <input
                  type="date"
                  value={newCheckDue}
                  onChange={(e) => setNewCheckDue(e.target.value)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white font-semibold text-[10px] focus:outline-none"
                />
              </div>
              <div className="flex justify-between items-center pt-2">
                <select
                  value={newCheckPriority}
                  onChange={(e) => setNewCheckPriority(e.target.value as any)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white"
                >
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (!newCheckText) return;
                    const updated = [...checklist, {
                      id: Date.now().toString(),
                      text: newCheckText,
                      assignedStaff: newCheckStaff,
                      dueDate: newCheckDue,
                      priority: newCheckPriority,
                      completed: false
                    }];
                    setChecklist(updated);
                    saveMetadataChanges(updated);
                    setNewCheckText("");
                    setNewCheckStaff("");
                    setNewCheckDue("");
                  }}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-bold"
                >
                  Add Milestone
                </button>
              </div>
            </div>
          </div>
        )}

        {/* KANBAN TASK BOARD TAB */}
        {activeTab === "kanban" && (
          <div className="space-y-4 select-none">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Internal Team Task Board</span>
            </div>

            <DragDropContext onDragEnd={handleTaskDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto min-w-[900px] pb-4">
                {(["TO_DO", "IN_PROGRESS", "WAITING", "COMPLETED", "BLOCKED"] as const).map((lane) => {
                  const laneTasks = kanbanTasks.filter(t => t.status === lane);

                  return (
                    <div key={lane} className="flex-1 min-w-[180px] rounded-xl border border-zinc-900 bg-zinc-950/10 flex flex-col p-2 space-y-2">
                      <div className="flex justify-between items-center p-2 border-b border-zinc-900 shrink-0">
                        <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">{lane.replace("_", " ")}</span>
                        <span className="text-[8px] px-1.5 py-0.5 bg-zinc-900 text-zinc-550 border border-zinc-800 rounded-full font-bold">{laneTasks.length}</span>
                      </div>

                      <Droppable droppableId={lane}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn("flex-1 space-y-2 p-1 min-h-[200px] transition-colors", snapshot.isDraggingOver && "bg-purple-550/[0.01]")}
                          >
                            {laneTasks.map((t, index) => (
                              <Draggable key={t.id} draggableId={t.id} index={index}>
                                {(providedDrag, snapshotDrag) => (
                                  <div
                                    ref={providedDrag.innerRef}
                                    {...providedDrag.draggableProps}
                                    {...providedDrag.dragHandleProps}
                                    style={providedDrag.draggableProps.style as React.CSSProperties}
                                    className={cn(
                                      "p-3 border rounded-lg bg-zinc-900/35 cursor-grab space-y-2 font-semibold text-xs",
                                      snapshotDrag.isDragging ? "border-purple-500 scale-102" : "border-zinc-850"
                                    )}
                                  >
                                    <span className="font-bold text-zinc-200 block leading-tight">{t.title}</span>
                                    <p className="text-[9px] text-zinc-500 font-medium leading-relaxed">{t.description}</p>
                                    <div className="flex justify-between items-center text-[8px] text-zinc-550 border-t border-zinc-900/50 pt-1">
                                      <span>{t.dueDate || "TBA"}</span>
                                      <span className={cn("px-1 rounded text-[7px] font-black border uppercase",
                                        t.priority === "HIGH" ? "border-red-500/20 text-red-400 bg-red-500/5" :
                                        t.priority === "MEDIUM" ? "border-amber-500/20 text-amber-400 bg-amber-500/5" : "border-zinc-850 text-zinc-500"
                                      )}>
                                        {t.priority}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            </DragDropContext>

            {/* Add Task Kanban item */}
            <div className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-3 font-semibold text-xs">
              <span className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Log New Kanban Task</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Task Title (e.g. Test mic systems)"
                  value={newKanbanTitle}
                  onChange={(e) => setNewKanbanTitle(e.target.value)}
                  className="sm:col-span-2 px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white"
                />
                <input
                  type="text"
                  placeholder="Details/Remarks"
                  value={newKanbanDesc}
                  onChange={(e) => setNewKanbanDesc(e.target.value)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white"
                />
                <input
                  type="date"
                  value={newKanbanDue}
                  onChange={(e) => setNewKanbanDue(e.target.value)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white font-semibold text-[10px]"
                />
              </div>
              <div className="flex justify-between items-center">
                <select
                  value={newKanbanPriority}
                  onChange={(e) => setNewKanbanPriority(e.target.value as any)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white"
                >
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (!newKanbanTitle) return;
                    const updated: KanbanTask[] = [...kanbanTasks, {
                      id: Date.now().toString(),
                      title: newKanbanTitle,
                      description: newKanbanDesc,
                      status: "TO_DO" as const,
                      priority: newKanbanPriority,
                      dueDate: newKanbanDue,
                      assignedTo: newKanbanAssignee
                    }];
                    setKanbanTasks(updated);
                    saveMetadataChanges(undefined, updated);
                    setNewKanbanTitle("");
                    setNewKanbanDesc("");
                    setNewKanbanDue("");
                  }}
                  className="px-4 py-1.5 bg-purple-650 hover:bg-purple-600 rounded-lg text-white font-bold"
                >
                  Add Task Card
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RESOURCES TAB */}
        {activeTab === "resources" && (
          <div className="space-y-4 font-semibold text-xs">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest pb-2 border-b border-zinc-900">
              Inventory & Equipment Logistics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((res) => (
                <div key={res.id} className="p-4 border border-zinc-850 bg-[#161618]/20 rounded-xl space-y-2 relative">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-zinc-200 block text-sm">{res.name}</span>
                    <span className={cn(
                      "text-[8px] font-bold px-1.5 py-0.5 rounded-full border uppercase",
                      res.status === "Available" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-450" :
                      res.status === "Reserved" ? "border-blue-500/20 bg-blue-500/5 text-blue-450" : "border-amber-500/20 bg-amber-500/5 text-amber-450"
                    )}>
                      {res.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-550">Type: {res.type} • Maintenance: {res.maintenanceInfo}</p>
                  
                  <button
                    onClick={() => {
                      const updated = resources.filter(r => r.id !== res.id);
                      setResources(updated);
                      saveMetadataChanges(undefined, undefined, updated);
                    }}
                    className="absolute bottom-2 right-2 text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {resources.length === 0 && (
                <p className="col-span-full text-zinc-550 italic py-6 text-center">No inventory resources allocated to this event.</p>
              )}
            </div>

            {/* Add Resource Form */}
            <div className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-3">
              <span className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Allocate Resource item</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Resource Name (e.g. Sony FX3)"
                  value={newResName}
                  onChange={(e) => setNewResName(e.target.value)}
                  className="sm:col-span-2 px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white"
                />
                <select
                  value={newResType}
                  onChange={(e) => setNewResType(e.target.value)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white"
                >
                  <option value="Cameras">Cameras</option>
                  <option value="Speakers">Speakers</option>
                  <option value="Vehicles">Vehicles</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Decorations">Decorations</option>
                </select>
                <select
                  value={newResStatus}
                  onChange={(e) => setNewResStatus(e.target.value as any)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white"
                >
                  <option value="Available">Available</option>
                  <option value="Reserved">Reserved</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!newResName) return;
                  const updated = [...resources, {
                    id: Date.now().toString(),
                    name: newResName,
                    type: newResType,
                    status: newResStatus,
                    maintenanceInfo: newResMaint,
                    assignedHours: "8 Hours"
                  }];
                  setResources(updated);
                  saveMetadataChanges(undefined, undefined, updated);
                  setNewResName("");
                }}
                className="px-4 py-1.5 bg-purple-650 hover:bg-purple-600 text-white font-bold rounded-lg ml-auto block"
              >
                Allocate Resource
              </button>
            </div>
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === "documents" && (
          <div className="space-y-4 font-semibold text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Secure Document Vault</span>
            </div>

            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 border border-zinc-850 bg-zinc-900/10 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-purple-400 shrink-0" />
                    <div>
                      <span className="font-bold text-zinc-200 block text-xs">{doc.name}</span>
                      <p className="text-[9px] text-zinc-550 font-semibold mt-0.5">Type: {doc.type} • Uploaded: {doc.date} • {doc.version}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => alert(`Opening secure PDF preview: ${doc.name}`)}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-[10px]"
                    >
                      Preview PDF
                    </button>
                    <button
                      onClick={() => {
                        const updated = documents.filter(d => d.id !== doc.id);
                        setDocuments(updated);
                        saveMetadataChanges(undefined, undefined, undefined, updated);
                      }}
                      className="text-zinc-550 hover:text-red-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              {documents.length === 0 && (
                <p className="text-zinc-550 italic py-6 text-center">No contracts or permits uploaded.</p>
              )}
            </div>

            {/* Add Document upload box */}
            <div className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-3">
              <span className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Log Contract / Permit Document</span>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Document Name (e.g. Radisson_Blu_Agreement.pdf)"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white"
                />
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white"
                >
                  <option value="Contract">Client Contract</option>
                  <option value="Permit">Police/Loudspeaker Permit</option>
                  <option value="Agreement">Vendor Agreement</option>
                  <option value="GuestList">Validated Guest List</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!newDocName) return;
                  const updated = [...documents, {
                    id: Date.now().toString(),
                    name: newDocName,
                    type: newDocType,
                    version: "v1.0",
                    date: new Date().toISOString().split("T")[0],
                    url: "https://url.com"
                  }];
                  setDocuments(updated);
                  saveMetadataChanges(undefined, undefined, undefined, updated);
                  setNewDocName("");
                }}
                className="px-4 py-1.5 bg-purple-650 hover:bg-purple-600 text-white font-bold rounded-lg ml-auto block"
              >
                Log Document
              </button>
            </div>
          </div>
        )}

        {/* TEAM / STAFFING TAB */}
        {activeTab === "team" && (
          <div className="space-y-4 font-semibold text-xs">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest pb-2 border-b border-zinc-900">
              Assigned Staffing Roles
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Lead Event Planner", name: plannerName, setter: setPlannerName },
                { label: "Coordinator", name: coordinatorName, setter: setCoordinatorName },
                { label: "Photographer / Media", name: photographerName, setter: setPhotographerName },
                { label: "Lead Designer", name: designerName, setter: setDesignerName }
              ].map((role) => (
                <div key={role.label} className="p-4 border border-zinc-850 bg-[#161618]/20 rounded-xl space-y-2">
                  <span className="text-[10px] text-purple-400 uppercase font-bold block">{role.label}</span>
                  <input
                    type="text"
                    value={role.name}
                    onChange={(e) => {
                      role.setter(e.target.value);
                    }}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-850 rounded-lg text-white"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => saveMetadataChanges()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-bold"
            >
              Sync Staffing Roster
            </button>
          </div>
        )}

        {/* BUDGET TAB */}
        {activeTab === "budget" && (
          <div className="space-y-4 font-semibold text-xs select-none">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest pb-2 border-b border-zinc-900">
              Expense Allocations
            </h3>

            <div className="overflow-x-auto border border-zinc-850 bg-[#121214]/20 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-850 bg-zinc-950/20 text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                    <th className="p-3">Expense Item</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Projected</th>
                    <th className="p-3 text-right">Actual</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/40">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-zinc-900/10 text-zinc-300">
                      <td className="p-3 font-extrabold text-zinc-200">{exp.item}</td>
                      <td className="p-3 text-zinc-500">{exp.category}</td>
                      <td className="p-3 text-right font-mono text-zinc-400">₹{exp.projected?.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-emerald-400">₹{exp.actual?.toLocaleString()}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setExpenses(expenses.filter(x => x.id !== exp.id))}
                          className="text-zinc-650 hover:text-red-400"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add expense form */}
            <div className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-3">
              <span className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Log expense record</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Expense Item (e.g. Sound Engineer Fee)"
                  value={newExpItem}
                  onChange={(e) => setNewExpItem(e.target.value)}
                  className="sm:col-span-2 px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white"
                />
                <input
                  type="number"
                  placeholder="Projected (INR)"
                  value={newExpProj}
                  onChange={(e) => setNewExpProj(e.target.value)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white"
                />
                <input
                  type="number"
                  placeholder="Actual Cost (INR)"
                  value={newExpAct}
                  onChange={(e) => setNewExpAct(e.target.value)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!newExpItem) return;
                  setExpenses([...expenses, {
                    id: Date.now().toString(),
                    item: newExpItem,
                    category: newExpCat,
                    projected: Number(newExpProj) || 0,
                    actual: Number(newExpAct) || 0,
                    status: "PAID"
                  }]);
                  setNewExpItem("");
                  setNewExpProj("");
                  setNewExpAct("");
                }}
                className="px-4 py-1.5 bg-purple-650 hover:bg-purple-600 text-white font-bold rounded-lg ml-auto block"
              >
                Log Expense
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
