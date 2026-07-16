"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
  CheckSquare,
  Pin,
  Search,
  Check,
  Sparkle,
  Image as ImageIcon,
  UserPlus,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/lib/toastStore";

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

interface EventVendor {
  id: string;
  name: string;
  category: string;
  contact: string;
  rating: number;
  paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
  cost: number;
}

interface RichNote {
  id: string;
  text: string;
  isPinned: boolean;
  createdAt: string;
}

const TAB_OPTIONS = [
  { id: "overview", label: "Overview", icon: Briefcase },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "guests", label: "Guests", icon: Users },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "vendors", label: "Vendors", icon: Car },
  { id: "staff", label: "Staff", icon: UserCheck },
  { id: "budget", label: "Budget", icon: DollarSign },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "gallery", label: "Gallery", icon: ImageIcon },
  { id: "notes", label: "Notes", icon: Pin },
  { id: "activity", label: "Activity", icon: ActivityIcon }
];

function ActivityIcon({ size = 16, className = "" }) {
  return <Activity size={size} className={className} />;
}

const STATUSES = ["PLANNING", "PROPOSAL_SENT", "CONFIRMED", "VENDOR_ASSIGNED", "IN_PREPARATION", "IN_PROGRESS", "COMPLETED", "ARCHIVED", "CANCELLED"];

const STATUS_COLORS: Record<string, string> = {
  PLANNING: "border-zinc-550/20 bg-zinc-500/5 text-zinc-400",
  PROPOSAL_SENT: "border-pink-500/20 bg-pink-500/5 text-pink-450",
  CONFIRMED: "border-blue-500/20 bg-blue-500/5 text-blue-400",
  VENDOR_ASSIGNED: "border-cyan-500/20 bg-cyan-500/5 text-cyan-400",
  IN_PREPARATION: "border-purple-500/20 bg-purple-500/5 text-purple-400",
  IN_PROGRESS: "border-amber-500/20 bg-amber-500/5 text-amber-400",
  COMPLETED: "border-emerald-500/20 bg-emerald-500/5 text-emerald-455",
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
  const addToast = useToastStore((state) => state.addToast);

  const [activeTab, setActiveTab] = useState("overview");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Resources
  const [resources, setResources] = useState<EventResource[]>([]);
  const [newResName, setNewResName] = useState("");
  const [newResType, setNewResType] = useState("Speakers");

  // Documents
  const [documents, setDocuments] = useState<EventDoc[]>([]);
  const [newDocName, setNewDocName] = useState("");
  const [newDocType, setNewDocType] = useState("Contract");

  // Staffing roles
  const [plannerName, setPlannerName] = useState("Lokesh Nagrikar");
  const [coordinatorName, setCoordinatorName] = useState("Shreya Gupta");
  const [photographerName, setPhotographerName] = useState("Rahul Sharma");
  const [designerName, setDesignerName] = useState("Priya Patel");

  // Guests
  const [guestListText, setGuestListText] = useState("");

  // Vendors
  const [vendors, setVendors] = useState<EventVendor[]>([
    { id: "v1", name: "Royal Florals", category: "Decor", contact: "florals@dream.com", rating: 4.8, paymentStatus: "PARTIAL", cost: 120000 },
    { id: "v2", name: "Gourmet Catering", category: "Catering", contact: "cater@dream.com", rating: 4.9, paymentStatus: "PAID", cost: 180000 },
    { id: "v3", name: "Starlight Beats", category: "Music", contact: "beats@dream.com", rating: 4.6, paymentStatus: "UNPAID", cost: 50000 }
  ]);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorCat, setNewVendorCat] = useState("Decor");
  const [newVendorCost, setNewVendorCost] = useState("");

  // Invoices & Payments Milestones
  const [depositPaid, setDepositPaid] = useState(true);
  const [secondInstallmentPaid, setSecondInstallmentPaid] = useState(false);
  const [finalPaymentPaid, setFinalPaymentPaid] = useState(false);

  // Notes
  const [richNotes, setRichNotes] = useState<RichNote[]>([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [noteSearch, setNoteSearch] = useState("");

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
          setRichNotes(meta.richNotes || []);
          setGuestListText(meta.guestList || "");

          setPlannerName(meta.planner || "Lokesh Nagrikar");
          setCoordinatorName(meta.coordinator || "Shreya Gupta");
          setPhotographerName(meta.photographer || "Rahul Sharma");
          setDesignerName(meta.designer || "Priya Patel");

          if (meta.vendors) setVendors(meta.vendors);
          if (meta.depositPaid !== undefined) {
            setDepositPaid(meta.depositPaid);
            setSecondInstallmentPaid(meta.secondInstallmentPaid);
            setFinalPaymentPaid(meta.finalPaymentPaid);
          }
        } catch (e) {
          setRawNotesText(event.notes || "");
        }
      } else {
        setRawNotesText(event.notes || "");
      }
    }
  }, [event]);

  // Mutation to update event status or properties
  const updateEventMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.put(`/events/${eventId}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    }
  });

  const triggerAutoSave = (updatedFields: Partial<{
    name: string;
    type: string;
    startDate: string;
    endDate: string;
    location: string;
    venueName: string;
    venueAddress: string;
    guestCount: number;
    budget: number;
    notesText: string;
    checklistList: ChecklistItem[];
    tasksList: KanbanTask[];
    resourcesList: EventResource[];
    docsList: EventDoc[];
    notesList: RichNote[];
    guestListVal: string;
    vendorsList: EventVendor[];
    deposit: boolean;
    second: boolean;
    final: boolean;
  }> = {}) => {
    setSaveStatus("saving");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      const mergedName = updatedFields.name !== undefined ? updatedFields.name : editName;
      const mergedType = updatedFields.type !== undefined ? updatedFields.type : editType;
      const mergedStart = updatedFields.startDate !== undefined ? updatedFields.startDate : editStartDate;
      const mergedEnd = updatedFields.endDate !== undefined ? updatedFields.endDate : editEndDate;
      const mergedLoc = updatedFields.location !== undefined ? updatedFields.location : editLocation;
      const mergedVenue = updatedFields.venueName !== undefined ? updatedFields.venueName : editVenueName;
      const mergedAddr = updatedFields.venueAddress !== undefined ? updatedFields.venueAddress : editVenueAddress;
      const mergedGuests = updatedFields.guestCount !== undefined ? updatedFields.guestCount : editGuestCount;
      const mergedBudget = updatedFields.budget !== undefined ? updatedFields.budget : editBudget;

      const mergedNotesText = updatedFields.notesText !== undefined ? updatedFields.notesText : rawNotesText;
      const mergedChecklist = updatedFields.checklistList !== undefined ? updatedFields.checklistList : checklist;
      const mergedTasks = updatedFields.tasksList !== undefined ? updatedFields.tasksList : kanbanTasks;
      const mergedResources = updatedFields.resourcesList !== undefined ? updatedFields.resourcesList : resources;
      const mergedDocs = updatedFields.docsList !== undefined ? updatedFields.docsList : documents;
      const mergedRichNotes = updatedFields.notesList !== undefined ? updatedFields.notesList : richNotes;
      const mergedGuestList = updatedFields.guestListVal !== undefined ? updatedFields.guestListVal : guestListText;
      const mergedVendors = updatedFields.vendorsList !== undefined ? updatedFields.vendorsList : vendors;
      
      const mergedDep = updatedFields.deposit !== undefined ? updatedFields.deposit : depositPaid;
      const mergedSec = updatedFields.second !== undefined ? updatedFields.second : secondInstallmentPaid;
      const mergedFin = updatedFields.final !== undefined ? updatedFields.final : finalPaymentPaid;

      const serializedNotes = JSON.stringify({
        notesText: mergedNotesText,
        dressCode,
        theme: themeName,
        specialRequirements,
        priority: priorityTier,
        colorLabel,
        tags: eventTags,
        checklist: mergedChecklist,
        tasks: mergedTasks,
        resources: mergedResources,
        documents: mergedDocs,
        richNotes: mergedRichNotes,
        guestList: mergedGuestList,
        vendors: mergedVendors,
        depositPaid: mergedDep,
        secondInstallmentPaid: mergedSec,
        finalPaymentPaid: mergedFin,
        planner: plannerName,
        coordinator: coordinatorName,
        photographer: photographerName,
        designer: designerName
      });

      updateEventMutation.mutate({
        name: mergedName,
        type: mergedType,
        status: event?.status || "PLANNING",
        startDate: new Date(mergedStart).toISOString(),
        endDate: new Date(mergedEnd).toISOString(),
        location: mergedLoc,
        venueName: mergedVenue,
        venueAddress: mergedAddr,
        guestCount: Number(mergedGuests),
        budget: Number(mergedBudget),
        notes: serializedNotes
      });
    }, 400);
  };

  const handleStatusChange = (newStatus: string) => {
    api.patch(`/events/${eventId}/status`, { status: newStatus }).then(() => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      addToast(`Status updated to ${newStatus}`, "success");
    });
  };

  const handleTaskDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const updated: KanbanTask[] = kanbanTasks.map(t => t.id === draggableId ? { ...t, status: destination.droppableId as any } : t);
    setKanbanTasks(updated);
    triggerAutoSave({ tasksList: updated });
  };

  const checklistProgress = useMemo(() => {
    if (!checklist.length) return 0;
    const completed = checklist.filter(c => c.completed).length;
    return Math.round((completed / checklist.length) * 100);
  }, [checklist]);

  // Vendor calculations
  const totalVendorCost = useMemo(() => {
    return vendors.reduce((sum, v) => sum + v.cost, 0);
  }, [vendors]);

  const budgetPerformance = useMemo(() => {
    const remaining = editBudget - totalVendorCost;
    const percentUsed = editBudget > 0 ? (totalVendorCost / editBudget) * 100 : 0;
    return { remaining, percentUsed };
  }, [editBudget, totalVendorCost]);

  // Tasks additions
  const handleAddCheckItem = () => {
    if (!newCheckText.trim()) return;
    const nextCheck: ChecklistItem = {
      id: Date.now().toString(),
      text: newCheckText,
      assignedStaff: newCheckStaff || plannerName,
      dueDate: newCheckDue || new Date().toISOString().split("T")[0],
      priority: newCheckPriority,
      completed: false
    };
    const updated = [...checklist, nextCheck];
    setChecklist(updated);
    setNewCheckText("");
    triggerAutoSave({ checklistList: updated });
    addToast("Checklist task logged successfully", "success");
  };

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const nextNote: RichNote = {
      id: Date.now().toString(),
      text: newNoteText,
      isPinned: false,
      createdAt: new Date().toISOString()
    };
    const updated = [nextNote, ...richNotes];
    setRichNotes(updated);
    setNewNoteText("");
    triggerAutoSave({ notesList: updated });
  };

  const handleAddVendor = () => {
    if (!newVendorName.trim() || !newVendorCost) return;
    const nextVendor: EventVendor = {
      id: Date.now().toString(),
      name: newVendorName,
      category: newVendorCat,
      contact: `${newVendorName.toLowerCase().replace(/\s+/g, "")}@vendor.com`,
      rating: 4.5,
      paymentStatus: "UNPAID",
      cost: Number(newVendorCost)
    };
    const updated = [...vendors, nextVendor];
    setVendors(updated);
    setNewVendorName("");
    setNewVendorCost("");
    triggerAutoSave({ vendorsList: updated });
    addToast("Vendor profile mapped successfully", "success");
  };

  if (eventLoading || !event) {
    return <div className="h-screen flex items-center justify-center animate-pulse text-zinc-500 text-xs">Loading event operations...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex flex-col relative overflow-hidden transition-all duration-200">
      
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/5 blur-[90px] rounded-full pointer-events-none" />

      {/* Workspace Header */}
      <div className="border-b border-zinc-800 bg-[#111113]/85 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/events")} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <ArrowRight size={13} className="rotate-180" />
            Back
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm text-zinc-150">{event.name}</h1>
              {saveStatus === "saving" && <span className="text-[9px] text-zinc-500 animate-pulse uppercase font-bold">Saving...</span>}
              {saveStatus === "saved" && <span className="text-[9px] text-emerald-450 uppercase font-bold">Saved</span>}
            </div>
            <p className="text-[10px] text-zinc-550 mt-1 flex items-center gap-1">
              <Calendar size={11} />
              {new Date(event.startDate).toLocaleDateString()} &mdash; {new Date(event.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* LifeCycle Transition Select */}
        <div className="flex items-center gap-2">
          <select
            value={event.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={cn("px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none cursor-pointer", STATUS_COLORS[event.status])}
          >
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
          </select>
        </div>
      </div>

      {/* Tab Switchers */}
      <div className="border-b border-zinc-850 px-6 bg-zinc-950/20 flex gap-4 shrink-0 overflow-x-auto scrollbar-none select-none relative z-10">
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
      <div className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full select-none relative z-10">
        
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-semibold text-xs text-zinc-300">
            <div className="md:col-span-2 space-y-6">
              <div className="p-5 border border-zinc-850 bg-[#161618]/30 rounded-xl space-y-4">
                <h3 className="text-xs font-bold text-zinc-450 uppercase tracking-widest pb-2 border-b border-zinc-900">Basic Information</h3>
                
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">Event Title</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => { setEditName(e.target.value); triggerAutoSave({ name: e.target.value }); }}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-bold block">Category</label>
                    <select
                      value={editType}
                      onChange={(e) => { setEditType(e.target.value); triggerAutoSave({ type: e.target.value }); }}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white focus:outline-none"
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
                      onChange={(e) => { setEditBudget(Number(e.target.value)); triggerAutoSave({ budget: Number(e.target.value) }); }}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-bold block">Start Time</label>
                    <input
                      type="datetime-local"
                      value={editStartDate}
                      onChange={(e) => { setEditStartDate(e.target.value); triggerAutoSave({ startDate: e.target.value }); }}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-bold block">End Time</label>
                    <input
                      type="datetime-local"
                      value={editEndDate}
                      onChange={(e) => { setEditEndDate(e.target.value); triggerAutoSave({ endDate: e.target.value }); }}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar metadata details */}
            <div className="space-y-6">
              <div className="p-5 border border-zinc-850 bg-[#161618]/30 rounded-xl space-y-4">
                <h3 className="text-xs font-bold text-zinc-450 uppercase tracking-widest pb-2 border-b border-zinc-900">Operation Specs</h3>
                
                <div className="space-y-1">
                  <span className="text-zinc-500 font-bold block text-[10px]">Dress Code</span>
                  <input type="text" value={dressCode} onChange={(e) => { setDressCode(e.target.value); triggerAutoSave(); }} className="w-full bg-transparent border-b border-zinc-800 py-1 text-zinc-200 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <span className="text-zinc-500 font-bold block text-[10px]">Theme Design</span>
                  <input type="text" value={themeName} onChange={(e) => { setThemeName(e.target.value); triggerAutoSave(); }} className="w-full bg-transparent border-b border-zinc-800 py-1 text-zinc-200 focus:outline-none" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === "timeline" && (
          <div className="p-6 border border-zinc-850 bg-[#121214]/30 rounded-2xl space-y-4 font-semibold">
            <h3 className="text-xs font-bold text-zinc-450 uppercase tracking-widest pb-2 border-b border-zinc-900">Execution Progression Timeline</h3>
            <div className="relative pl-6 border-l border-zinc-800 space-y-6">
              {[
                { name: "Planning", desc: "Define initial layout boundaries", done: true },
                { name: "Vendor Booking", desc: "Reserve decorators, videographers, caterers", done: totalVendorCost > 0 },
                { name: "Advance Payment", desc: "Clear first deposit billing", done: depositPaid },
                { name: "Decor Prep", desc: "Confirm pastels florals rosters", done: event?.status !== "PLANNING" },
                { name: "Photography Setup", desc: "Map photographer cameras", done: photographerName !== "" },
                { name: "Catering Menu Approved", desc: "Select menu specifications", done: true },
                { name: "Final Event", desc: "Live coordination dispatcher", done: event?.status === "COMPLETED" }
              ].map((stage, idx) => (
                <div key={idx} className="relative">
                  <div className={cn("absolute -left-[31px] mt-1.5 h-3.5 w-3.5 rounded-full border-2", stage.done ? "bg-purple-600 border-purple-550" : "bg-[#0c0c0e] border-zinc-800")} />
                  <div>
                    <span className="text-zinc-200 block font-bold">{stage.name}</span>
                    <span className="text-[10px] text-zinc-550 block pt-0.5">{stage.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GUESTS TAB */}
        {activeTab === "guests" && (
          <div className="p-6 border border-zinc-850 bg-[#121214]/30 rounded-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
              <h3 className="text-xs font-bold text-zinc-450 uppercase tracking-widest">Client Guest Roster</h3>
              <span className="text-xs font-mono font-bold text-purple-400">Total Count: {editGuestCount}</span>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-zinc-500 font-bold block text-xs">Pasted Guest Registry (Comma-separated names)</label>
              <textarea
                value={guestListText}
                onChange={(e) => { setGuestListText(e.target.value); triggerAutoSave({ guestListVal: e.target.value }); }}
                placeholder="Amit Shah, Shreya Gupta, Priya Varma, Rohan Mehta..."
                rows={8}
                className="w-full p-3 bg-zinc-900 border border-zinc-850 rounded-xl text-white font-semibold text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        )}

        {/* TASKS CHECKLIST & BOARD */}
        {activeTab === "tasks" && (
          <div className="space-y-6">
            <div className="p-6 border border-zinc-855 bg-[#121214]/30 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-zinc-450 uppercase tracking-widest">Checklist Tasks</h3>
                <span className="text-xs font-mono font-bold text-emerald-450">{checklistProgress}% Completed</span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${checklistProgress}%` }} />
              </div>

              <div className="space-y-2.5">
                {checklist.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 border border-zinc-850 rounded-xl bg-zinc-950/20 text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          const updated = checklist.map(tk => tk.id === t.id ? { ...tk, completed: !tk.completed } : tk);
                          setChecklist(updated);
                          triggerAutoSave({ checklistList: updated });
                        }}
                        className={cn(
                          "h-4 w-4 rounded border flex items-center justify-center transition-all cursor-pointer",
                          t.completed ? "bg-purple-650 border-purple-600 text-white" : "border-zinc-700 hover:border-purple-500"
                        )}
                      >
                        {t.completed && <Check size={10} strokeWidth={3} />}
                      </button>
                      <div>
                        <span className={cn("font-bold text-zinc-200 block", t.completed && "line-through text-zinc-550")}>{t.text}</span>
                        <p className="text-[9px] text-zinc-500 font-medium">Due: {t.dueDate} • Coordinator: {t.assignedStaff} • Priority: {t.priority}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add checklist input */}
              <div className="p-3 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-3">
                <span className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider block">Add operational checklist task</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Task details..."
                    value={newCheckText}
                    onChange={(e) => setNewCheckText(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white text-xs focus:outline-none"
                  />
                  <button onClick={handleAddCheckItem} className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xs cursor-pointer">
                    Add Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VENDORS TAB */}
        {activeTab === "vendors" && (
          <div className="space-y-6">
            <div className="p-6 border border-zinc-850 bg-[#121214]/30 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-zinc-450 uppercase tracking-widest pb-2 border-b border-zinc-900">Vendor Management Roster</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {vendors.map((v) => (
                  <div key={v.id} className="p-4 border border-zinc-850 bg-[#161618]/30 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-extrabold text-zinc-200 block text-xs">{v.name}</span>
                        <span className="text-[9px] text-zinc-500 block uppercase font-bold">{v.category}</span>
                      </div>
                      <span className={cn(
                        "text-[8px] font-bold px-2 py-0.5 rounded-full border",
                        v.paymentStatus === "PAID" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-450" : "border-zinc-800 text-zinc-400"
                      )}>
                        {v.paymentStatus}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-bold pt-2 border-t border-zinc-900/60 text-zinc-450">
                      <span>Rate: ₹{v.cost.toLocaleString()}</span>
                      <span className="text-purple-400">★ {v.rating}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add vendor form */}
              <div className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-3">
                <span className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider block">Log Vendor Assignment</span>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Vendor Name"
                    value={newVendorName}
                    onChange={(e) => setNewVendorName(e.target.value)}
                    className="px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white"
                  />
                  <input
                    type="number"
                    placeholder="Cost (INR)"
                    value={newVendorCost}
                    onChange={(e) => setNewVendorCost(e.target.value)}
                    className="px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white"
                  />
                  <button onClick={handleAddVendor} className="py-1.5 bg-purple-650 hover:bg-purple-600 text-white rounded-lg font-bold cursor-pointer">
                    Map Vendor
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STAFF TAB */}
        {activeTab === "staff" && (
          <div className="p-6 border border-zinc-855 bg-[#121214]/30 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-455 uppercase tracking-widest pb-2 border-b border-zinc-900">Account Staff Allocations</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
              {[
                { role: "Planner In-Charge", name: plannerName, setter: setPlannerName },
                { role: "On-site Coordinator", name: coordinatorName, setter: setCoordinatorName },
                { role: "Chief Photographer", name: photographerName, setter: setPhotographerName },
                { role: "Stage Decor Designer", name: designerName, setter: setDesignerName }
              ].map((member) => (
                <div key={member.role} className="p-4 border border-zinc-850 bg-zinc-950/20 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[9px] text-zinc-550 block uppercase tracking-wider">{member.role}</span>
                    <span className="text-zinc-200 font-extrabold text-xs mt-1 block">{member.name}</span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400 font-black text-[10px]">
                    {member.name.split(" ").map(n => n[0]).join("")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BUDGET TAB */}
        {activeTab === "budget" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-semibold">
            <div className="lg:col-span-2 p-6 border border-zinc-850 bg-[#121214]/30 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-zinc-450 uppercase tracking-widest pb-2 border-b border-zinc-900">Operational Cost Ledger</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-zinc-950/30 rounded-xl border border-zinc-905">
                  <span className="text-[9px] text-zinc-550 block uppercase">Total Budget</span>
                  <span className="text-base font-mono font-black text-zinc-200 mt-1 block">₹{editBudget.toLocaleString()}</span>
                </div>
                <div className="p-4 bg-zinc-950/30 rounded-xl border border-zinc-905">
                  <span className="text-[9px] text-zinc-550 block uppercase">Vendor Allocations</span>
                  <span className="text-base font-mono font-black text-purple-400 mt-1 block">₹{totalVendorCost.toLocaleString()}</span>
                </div>
                <div className="p-4 bg-zinc-950/30 rounded-xl border border-zinc-905">
                  <span className="text-[9px] text-zinc-550 block uppercase">Net Profit Margin</span>
                  <span className="text-base font-mono font-black text-emerald-450 mt-1 block">₹{budgetPerformance.remaining.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Circular chart gauge */}
            <div className="lg:col-span-1 p-6 border border-zinc-850 bg-[#121214]/30 rounded-2xl flex flex-col justify-between space-y-4">
              <h3 className="text-xs font-bold text-zinc-455 uppercase tracking-widest">Budget Utilization</h3>
              <div className="relative flex items-center justify-center py-4">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="#1c1c1f" strokeWidth="5.5" fill="transparent" />
                  <circle cx="48" cy="48" r="40" stroke="#8b5cf6" strokeWidth="5.5" fill="transparent"
                    strokeDasharray={251.2} strokeDashoffset={251.2 * (1 - (budgetPerformance.percentUsed / 100))} strokeLinecap="round" />
                </svg>
                <div className="absolute text-center">
                  <span className="font-mono text-base font-black text-white">{Math.round(budgetPerformance.percentUsed)}%</span>
                  <span className="text-[8px] text-zinc-500 block uppercase">Utilized</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INVOICES TAB */}
        {activeTab === "invoices" && (
          <div className="p-6 border border-zinc-850 bg-[#121214]/30 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-450 uppercase tracking-widest pb-2 border-b border-zinc-900">Lead Invoices Records</h3>
            
            <div className="space-y-3 font-semibold">
              {[
                { number: "INV-2026-001", type: "Deposit billing", status: "CLEARED", cost: editBudget * 0.25 },
                { number: "INV-2026-002", type: "Vendor advance checkouts", status: "CLEARED", cost: totalVendorCost },
                { number: "INV-2026-003", type: "Final outstanding collections", status: "PENDING", cost: budgetPerformance.remaining }
              ].map((inv) => (
                <div key={inv.number} className="p-3.5 border border-zinc-850 bg-zinc-950/20 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-mono text-purple-400 font-extrabold text-xs block">{inv.number}</span>
                    <span className="text-[10px] text-zinc-500 block pt-0.5">{inv.type}</span>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <span className="font-mono font-bold text-zinc-200">₹{inv.cost.toLocaleString()}</span>
                    <span className={cn(
                      "text-[8px] font-bold px-2 py-0.5 rounded border",
                      inv.status === "CLEARED" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-450" : "border-zinc-800 text-zinc-500"
                    )}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === "payments" && (
          <div className="p-6 border border-zinc-850 bg-[#121214]/30 rounded-2xl space-y-6 font-semibold">
            <h3 className="text-xs font-bold text-zinc-450 uppercase tracking-widest pb-2 border-b border-zinc-900">Milestone Clearances</h3>
            
            <div className="space-y-4">
              {[
                { label: "Deposit Clearance (25%)", active: depositPaid, setter: setDepositPaid, fieldKey: "deposit" },
                { label: "Second installment clearance (50%)", active: secondInstallmentPaid, setter: setSecondInstallmentPaid, fieldKey: "second" },
                { label: "Final collection (100%)", active: finalPaymentPaid, setter: setFinalPaymentPaid, fieldKey: "final" }
              ].map((milestone) => (
                <div key={milestone.label} className="p-3 border border-zinc-850 bg-zinc-950/15 rounded-xl flex items-center justify-between">
                  <span className="text-zinc-200 font-bold text-xs">{milestone.label}</span>
                  <button
                    onClick={() => {
                      milestone.setter(!milestone.active);
                      triggerAutoSave({ [milestone.fieldKey]: !milestone.active });
                    }}
                    className={cn(
                      "px-3 py-1 text-[9px] uppercase tracking-wider rounded-lg font-bold border transition cursor-pointer",
                      milestone.active ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-450" : "border-zinc-800 text-zinc-500"
                    )}
                  >
                    {milestone.active ? "Cleared ✓" : "Mark Cleared"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GALLERY TAB */}
        {activeTab === "gallery" && (
          <div className="p-6 border border-zinc-850 bg-[#121214]/30 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-450 uppercase tracking-widest pb-2 border-b border-zinc-900">Photo Assets Masonry</h3>
            
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((num) => (
                <div key={num} className="aspect-video bg-zinc-900/60 border border-zinc-850 rounded-xl flex flex-col items-center justify-center text-zinc-650 hover:text-zinc-400 cursor-pointer hover:border-zinc-700 transition">
                  <ImageIcon size={20} className="mb-2" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Asset_0{num}.jpg</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === "notes" && (
          <div className="p-6 border border-zinc-855 bg-[#121214]/30 rounded-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
              <h3 className="text-xs font-bold text-zinc-450 uppercase tracking-widest">Workspace Notes</h3>
              <div className="relative w-44">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-550">
                  <Search size={11} />
                </span>
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                  className="w-full pl-7 pr-3 py-1 bg-zinc-950 border border-zinc-850 rounded-lg text-[10px] focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-2">
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Type a new operational note..."
                rows={3}
                className="w-full p-2.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500 font-semibold"
              />
              <button
                onClick={handleAddNote}
                className="px-4 py-1.5 bg-purple-650 hover:bg-purple-600 text-white rounded-lg font-bold ml-auto block cursor-pointer"
              >
                Add Note
              </button>
            </div>

            <div className="space-y-3 pt-2">
              {richNotes.filter(n => n.text.toLowerCase().includes(noteSearch.toLowerCase())).map((n) => (
                <div key={n.id} className="p-3.5 border border-zinc-850 rounded-xl bg-zinc-950/10 text-xs">
                  <p className="text-zinc-200 font-semibold leading-relaxed whitespace-pre-wrap">{n.text}</p>
                  <span className="text-[9px] text-zinc-550 font-mono block pt-2">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === "activity" && (
          <div className="p-6 border border-zinc-850 bg-[#121214]/30 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-450 uppercase tracking-widest pb-2 border-b border-zinc-900">Event History Feed</h3>
            
            <div className="relative pl-4 border-l border-zinc-800 space-y-4 py-1">
              {[
                { text: "Event workspace provisioned successfully", time: event.startDate },
                { text: "Budget threshold allocated", time: event.startDate },
                { text: "Planner staff coordinates locked", time: event.startDate }
              ].map((act, idx) => (
                <div key={idx} className="relative text-[11px] font-bold">
                  <div className="absolute -left-[20.5px] top-1 h-2 w-2 rounded-full bg-purple-500 ring-4 ring-[#0c0c0e]" />
                  <div>
                    <span className="text-zinc-200 block">{act.text}</span>
                    <span className="text-[9px] text-zinc-550 pt-0.5 block">{new Date(act.time).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
