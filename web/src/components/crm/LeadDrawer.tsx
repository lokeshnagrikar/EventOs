"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Briefcase, 
  Calendar, 
  DollarSign, 
  FileText, 
  Clock, 
  Activity as ActivityIcon, 
  CheckSquare, 
  Plus, 
  Trash2, 
  Loader2,
  Paperclip,
  CheckCircle,
  FileSpreadsheet,
  Lock,
  Shield,
  Layers,
  HelpCircle,
  ChevronRight,
  Send,
  Globe,
  MessageSquare,
  Heart,
  Sparkles,
  MapPin,
  ExternalLink,
  RefreshCw,
  GitMerge,
  Pin,
  Search,
  Check,
  Award
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface LeadDrawerProps {
  leadId: string | null;
  onClose: () => void;
  leads: any[];
  teamMembers: any[];
  activities: any[];
  onUpdateLead: (updatedData: any) => void;
  onDeleteLead: () => void;
  onAddActivity: (type: string, text: string) => void;
}

interface CustomField {
  key: string;
  value: string;
}

interface Attachment {
  name: string;
  url: string;
}

interface TaskItem {
  id: string;
  text: string;
  dueDate: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  completed: boolean;
  assignedStaffId?: string;
}

interface CommLog {
  id: string;
  type: "CALL" | "EMAIL" | "MEETING" | "WHATSAPP" | "SMS";
  text: string;
  date: string;
  staffName: string;
}

interface RichNote {
  id: string;
  text: string;
  isPinned: boolean;
  createdAt: string;
}

export default function LeadDrawer({
  leadId,
  onClose,
  leads = [],
  teamMembers = [],
  activities = [],
  onUpdateLead,
  onDeleteLead,
  onAddActivity,
}: LeadDrawerProps) {
  const lead = leads.find((l) => l.id === leadId);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "contact" | "quotes" | "tasks" | "notes" | "comms" | "timeline">("overview");

  // Autosave status indicator
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Core Form Fields State
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editEventType, setEditEventType] = useState("");
  const [editEventDate, setEditEventDate] = useState("");
  const [editBudget, setEditBudget] = useState(0);
  const [editSource, setEditSource] = useState("");
  const [editAssignee, setEditAssignee] = useState("");

  // Metadata JSON fields (stored serialized inside database's 'notes' column)
  const [rawNotesText, setRawNotesText] = useState("");
  const [leadPriority, setLeadPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");
  const [probabilityPercent, setProbabilityPercent] = useState(50);
  const [referralName, setReferralName] = useState("");
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // Contact Profile specific fields
  const [altPhones, setAltPhones] = useState<string[]>([]);
  const [altEmails, setAltEmails] = useState<string[]>([]);
  const [streetAddress, setStreetAddress] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [anniversaryDate, setAnniversaryDate] = useState("");
  const [birthdayDate, setBirthdayDate] = useState("");
  const [favTheme, setFavTheme] = useState("Royal Pastel");
  const [socialInsta, setSocialInsta] = useState("");
  const [socialFb, setSocialFb] = useState("");
  const [guestCount, setGuestCount] = useState(100);

  // Lists stored locally in metadata
  const [leadTasks, setLeadTasks] = useState<TaskItem[]>([]);
  const [commLogs, setCommLogs] = useState<CommLog[]>([]);
  const [richNotes, setRichNotes] = useState<RichNote[]>([]);

  // Task Input States
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");

  // Communication Log Input States
  const [newCommType, setNewCommType] = useState<"CALL" | "EMAIL" | "MEETING" | "WHATSAPP" | "SMS">("CALL");
  const [newCommText, setNewCommText] = useState("");

  // Notes Search/Add State
  const [noteSearchQuery, setNoteSearchQuery] = useState("");
  const [newNoteText, setNewNoteText] = useState("");

  // Custom Field Input States
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");

  // Fetch Quotes for this Lead
  const { data: quotesRes } = useQuery({
    queryKey: ["leadQuotes", leadId],
    queryFn: async () => {
      const response = await api.get("/crm/quotes");
      return response.data?.data?.filter((q: any) => q.leadId === leadId) || [];
    },
    enabled: !!leadId
  });
  const quotes = quotesRes || [];

  // Parse notes JSON on load
  useEffect(() => {
    if (lead) {
      setEditName(lead.name || "");
      setEditPhone(lead.contact?.phone || lead.phone || "");
      setEditEmail(lead.contact?.email || lead.email || "");
      setEditEventType(lead.eventType || "WEDDING");
      setEditEventDate(lead.eventDate || "");
      setEditBudget(lead.budget || 0);
      setEditSource(lead.leadSource || "Website");
      setEditAssignee(lead.assignedUserId || "");

      // Deserialize JSON from notes if starting with '{'
      if (lead.notes && lead.notes.startsWith("{")) {
        try {
          const meta = JSON.parse(lead.notes);
          setRawNotesText(meta.notes || "");
          setLeadPriority(meta.priority || "MEDIUM");
          setProbabilityPercent(meta.probability || 50);
          setReferralName(meta.referral || "");
          setCustomFields(meta.customFields || []);
          setAttachments(meta.attachments || []);
          
          // Contact profile
          const cp = meta.contactProfile || {};
          setAltPhones(cp.altPhones || []);
          setAltEmails(cp.altEmails || []);
          setStreetAddress(cp.address || "");
          setCompanyName(cp.companyName || "");
          setAnniversaryDate(cp.anniversary || "");
          setBirthdayDate(cp.birthday || "");
          setFavTheme(cp.favTheme || "Royal Pastel");
          setSocialInsta(cp.instagram || "");
          setSocialFb(cp.facebook || "");
          setGuestCount(cp.guestCount || 100);

          // Tasks & Comms
          setLeadTasks(meta.tasks || []);
          setCommLogs(meta.comms || []);
          setRichNotes(meta.richNotes || []);
        } catch (e) {
          setRawNotesText(lead.notes || "");
          resetMetadataFields();
        }
      } else {
        setRawNotesText(lead.notes || "");
        resetMetadataFields();
      }
    }
  }, [leadId, lead]);

  const resetMetadataFields = () => {
    setLeadPriority("MEDIUM");
    setProbabilityPercent(50);
    setReferralName("");
    setCustomFields([]);
    setAttachments([]);
    setAltPhones([]);
    setAltEmails([]);
    setStreetAddress("");
    setCompanyName("");
    setAnniversaryDate("");
    setBirthdayDate("");
    setFavTheme("Royal Pastel");
    setSocialInsta("");
    setSocialFb("");
    setGuestCount(100);
    setLeadTasks([]);
    setCommLogs([]);
    setRichNotes([]);
  };

  // Auto-Save Handler
  const triggerAutoSave = (updatedFields: Partial<{
    name: string;
    phone: string;
    email: string;
    eventType: string;
    eventDate: string;
    budget: number;
    leadSource: string;
    assignedUserId: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    probability: number;
    notesText: string;
    tasks: TaskItem[];
    comms: CommLog[];
    richNotesList: RichNote[];
    streetAddr: string;
    compName: string;
    anniversary: string;
    birthday: string;
    guests: number;
    insta: string;
    fb: string;
  }> = {}) => {
    setSaveStatus("saving");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      const mergedName = updatedFields.name !== undefined ? updatedFields.name : editName;
      const mergedPhone = updatedFields.phone !== undefined ? updatedFields.phone : editPhone;
      const mergedEmail = updatedFields.email !== undefined ? updatedFields.email : editEmail;
      const mergedEventType = updatedFields.eventType !== undefined ? updatedFields.eventType : editEventType;
      const mergedEventDate = updatedFields.eventDate !== undefined ? updatedFields.eventDate : editEventDate;
      const mergedBudget = updatedFields.budget !== undefined ? updatedFields.budget : editBudget;
      const mergedSource = updatedFields.leadSource !== undefined ? updatedFields.leadSource : editSource;
      const mergedAssignee = updatedFields.assignedUserId !== undefined ? updatedFields.assignedUserId : editAssignee;

      const mergedPriority = updatedFields.priority !== undefined ? updatedFields.priority : leadPriority;
      const mergedProbability = updatedFields.probability !== undefined ? updatedFields.probability : probabilityPercent;
      const mergedNotesText = updatedFields.notesText !== undefined ? updatedFields.notesText : rawNotesText;
      const mergedTasks = updatedFields.tasks !== undefined ? updatedFields.tasks : leadTasks;
      const mergedComms = updatedFields.comms !== undefined ? updatedFields.comms : commLogs;
      const mergedRichNotes = updatedFields.richNotesList !== undefined ? updatedFields.richNotesList : richNotes;

      const cp = {
        altPhones,
        altEmails,
        address: updatedFields.streetAddr !== undefined ? updatedFields.streetAddr : streetAddress,
        companyName: updatedFields.compName !== undefined ? updatedFields.compName : companyName,
        anniversary: updatedFields.anniversary !== undefined ? updatedFields.anniversary : anniversaryDate,
        birthday: updatedFields.birthday !== undefined ? updatedFields.birthday : birthdayDate,
        favTheme,
        instagram: updatedFields.insta !== undefined ? updatedFields.insta : socialInsta,
        facebook: updatedFields.fb !== undefined ? updatedFields.fb : socialFb,
        guestCount: updatedFields.guests !== undefined ? updatedFields.guests : guestCount
      };

      const serializedNotes = JSON.stringify({
        notes: mergedNotesText,
        priority: mergedPriority,
        probability: mergedProbability,
        referral: referralName,
        customFields,
        attachments,
        contactProfile: cp,
        tasks: mergedTasks,
        comms: mergedComms,
        richNotes: mergedRichNotes
      });

      onUpdateLead({
        name: mergedName,
        phone: mergedPhone || null,
        email: mergedEmail || null,
        eventType: mergedEventType,
        eventDate: mergedEventDate || null,
        budget: Number(mergedBudget),
        leadSource: mergedSource,
        notes: serializedNotes,
        assignedUserId: mergedAssignee || null
      });

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    }, 400);
  };

  // Compile lead score
  const leadScore = (() => {
    let score = 0;
    if (editName) score += 20;
    if (editPhone) score += 20;
    if (editEmail) score += 20;
    if (editEventDate) score += 20;
    if (editBudget > 0) score += 20;
    return score;
  })();

  // Pin / Add Notes
  const handleAddRichNote = () => {
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
    triggerAutoSave({ richNotesList: updated });
    onAddActivity("NOTE", "New rich text note added to repository");
  };

  const handleTogglePinNote = (noteId: string) => {
    const updated = richNotes.map(n => n.id === noteId ? { ...n, isPinned: !n.isPinned } : n);
    setRichNotes(updated);
    triggerAutoSave({ richNotesList: updated });
  };

  const handleDeleteRichNote = (noteId: string) => {
    const updated = richNotes.filter(n => n.id !== noteId);
    setRichNotes(updated);
    triggerAutoSave({ richNotesList: updated });
  };

  // Tasks Checklist complete
  const handleToggleTask = (taskId: string) => {
    const updated = leadTasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    setLeadTasks(updated);
    triggerAutoSave({ tasks: updated });
    const task = leadTasks.find(t => t.id === taskId);
    if (task) {
      onAddActivity("TASK", `Task "${task.text}" marked as ${!task.completed ? "COMPLETED" : "INCOMPLETE"}`);
    }
  };

  if (!lead) return null;

  const filteredRichNotes = richNotes.filter(n => 
    n.text.toLowerCase().includes(noteSearchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 26, stiffness: 210 }}
      className="fixed inset-y-0 right-0 z-50 w-full max-w-xl border-l border-border bg-background/98 backdrop-blur-md shadow-2xl flex flex-col justify-between select-none"

    >
      {/* Drawer Header */}
      <div className="h-16 border-b border-zinc-850 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-sm text-zinc-150 truncate max-w-[200px]">{lead.name}</span>
          <span className={cn(
            "text-[9px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase",
            lead.status === "WON" || lead.status === "BOOKED" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" :
            lead.status === "LOST" ? "border-red-500/20 bg-red-500/5 text-red-400" : "border-purple-500/20 bg-purple-500/5 text-purple-400"
          )}>
            {lead.status}
          </span>
          
          {/* Autosave Status */}
          <div className="flex items-center gap-1.5 pl-2">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1 text-[9px] text-zinc-500 font-bold uppercase">
                <Loader2 size={10} className="animate-spin text-purple-400" /> Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-[9px] text-emerald-450 font-bold uppercase">
                <Check size={10} /> Saved
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm("Delete this lead permanently?")) onDeleteLead();
            }}
            className="h-8 w-8 rounded-lg bg-zinc-900/60 hover:bg-red-500/10 hover:text-red-500 border border-zinc-850 flex items-center justify-center transition-all cursor-pointer"
            title="Delete Lead"
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-850 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close details"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="border-b border-zinc-850 px-6 bg-zinc-950/20 flex gap-4 shrink-0 overflow-x-auto scrollbar-none">
        {[
          { id: "overview", label: "Overview", icon: User },
          { id: "contact", label: "Contact Profile", icon: Globe },
          { id: "quotes", label: "Quotes", icon: FileText },
          { id: "tasks", label: "Tasks", icon: CheckSquare },
          { id: "notes", label: "Notes", icon: Pin },
          { id: "comms", label: "Comms", icon: MessageSquare },
          { id: "timeline", label: "Timeline", icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "py-3 text-[10px] font-bold border-b-2 tracking-wide uppercase transition-all cursor-pointer shrink-0 flex items-center gap-1.5",
                activeTab === tab.id ? "border-purple-500 text-purple-400" : "border-transparent text-zinc-500 hover:text-zinc-350"
              )}
            >
              <Icon size={11} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-semibold">
        
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-4 font-semibold text-xs">
            {/* Core details */}
            <div className="p-4 rounded-xl border border-zinc-850 bg-zinc-900/10 space-y-3.5">
              <h4 className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Leads Specs</h4>
              <div className="space-y-1.5">
                <label className="text-zinc-500 font-bold block">Lead Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    triggerAutoSave({ name: e.target.value });
                  }}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-200 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">Category</label>
                  <select
                    value={editEventType}
                    onChange={(e) => {
                      setEditEventType(e.target.value);
                      triggerAutoSave({ eventType: e.target.value });
                    }}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-300 focus:outline-none focus:border-purple-500"
                  >
                    <option value="WEDDING">Wedding</option>
                    <option value="BIRTHDAY">Birthday</option>
                    <option value="ENGAGEMENT">Engagement</option>
                    <option value="CORPORATE">Corporate</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">Event Date</label>
                  <input
                    type="date"
                    value={editEventDate}
                    onChange={(e) => {
                      setEditEventDate(e.target.value);
                      triggerAutoSave({ eventDate: e.target.value });
                    }}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-300 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">Budget (INR)</label>
                  <input
                    type="number"
                    value={editBudget}
                    onChange={(e) => {
                      setEditBudget(Number(e.target.value));
                      triggerAutoSave({ budget: Number(e.target.value) });
                    }}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">Source</label>
                  <select
                    value={editSource}
                    onChange={(e) => {
                      setEditSource(e.target.value);
                      triggerAutoSave({ leadSource: e.target.value });
                    }}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-300 focus:outline-none focus:border-purple-500"
                  >
                    <option value="Website">Website</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Referral">Referral</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pipeline Priority & Forecasting */}
            <div className="p-4 rounded-xl border border-zinc-850 bg-zinc-900/10 space-y-3.5">
              <h4 className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Priority & Deal Health</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">Priority</label>
                  <select
                    value={leadPriority}
                    onChange={(e) => {
                      setLeadPriority(e.target.value as any);
                      triggerAutoSave({ priority: e.target.value as any });
                    }}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-300 focus:outline-none focus:border-purple-500"
                  >
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">Probability (%)</label>
                  <input
                    type="number"
                    value={probabilityPercent}
                    onChange={(e) => {
                      setProbabilityPercent(Number(e.target.value));
                      triggerAutoSave({ probability: Number(e.target.value) });
                    }}
                    min={0}
                    max={100}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">Assigned Planner</label>
                  <select
                    value={editAssignee}
                    onChange={(e) => {
                      setEditAssignee(e.target.value);
                      triggerAutoSave({ assignedUserId: e.target.value });
                    }}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-300 focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Custom fields & Attachments */}
            <div className="p-4 rounded-xl border border-zinc-850 bg-zinc-900/10 space-y-3.5">
              <h4 className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Custom Profile Fields</h4>
              <div className="space-y-1.5">
                {customFields.map((f, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-zinc-950 p-2 rounded-lg border border-zinc-850">
                    <span className="text-zinc-400 font-bold">{f.key}:</span>
                    <span className="text-zinc-200">{f.value}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = customFields.filter((_, i) => i !== idx);
                        setCustomFields(updated);
                        triggerAutoSave();
                      }}
                      className="text-zinc-550 hover:text-red-400"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CONTACT PROFILE TAB */}
        {activeTab === "contact" && (
          <div className="space-y-4 font-semibold text-xs">
            <div className="p-4 rounded-xl border border-zinc-850 bg-zinc-900/10 space-y-3.5">
              <h4 className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Personal Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">Primary Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => {
                      setEditEmail(e.target.value);
                      triggerAutoSave({ email: e.target.value });
                    }}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">Primary Phone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => {
                      setEditPhone(e.target.value);
                      triggerAutoSave({ phone: e.target.value });
                    }}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Corporate & Preferences */}
            <div className="p-4 rounded-xl border border-zinc-850 bg-zinc-900/10 space-y-3.5">
              <h4 className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Demographic details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      triggerAutoSave({ compName: e.target.value });
                    }}
                    placeholder="Acme Corp"
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">Guest Count</label>
                  <input
                    type="number"
                    value={guestCount}
                    onChange={(e) => {
                      setGuestCount(Number(e.target.value));
                      triggerAutoSave({ guests: Number(e.target.value) });
                    }}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-250 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">Birthday</label>
                  <input
                    type="date"
                    value={birthdayDate}
                    onChange={(e) => {
                      setBirthdayDate(e.target.value);
                      triggerAutoSave({ birthday: e.target.value });
                    }}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-300 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">Anniversary</label>
                  <input
                    type="date"
                    value={anniversaryDate}
                    onChange={(e) => {
                      setAnniversaryDate(e.target.value);
                      triggerAutoSave({ anniversary: e.target.value });
                    }}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-300 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500 font-bold block">Social Coordinates</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Instagram handle"
                    value={socialInsta}
                    onChange={(e) => {
                      setSocialInsta(e.target.value);
                      triggerAutoSave({ insta: e.target.value });
                    }}
                    className="w-1/2 px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                  <input
                    type="text"
                    placeholder="Facebook Profile"
                    value={socialFb}
                    onChange={(e) => {
                      setSocialFb(e.target.value);
                      triggerAutoSave({ fb: e.target.value });
                    }}
                    className="w-1/2 px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500 font-bold block">Street Address</label>
                <input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => {
                    setStreetAddress(e.target.value);
                    triggerAutoSave({ streetAddr: e.target.value });
                  }}
                  placeholder="Street and City"
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* QUOTES TAB */}
        {activeTab === "quotes" && (
          <div className="space-y-4 font-semibold text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Lead Proposals</span>
              <button
                onClick={() => router.push("/quotes/new")}
                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus size={11} />
                Generate Quote
              </button>
            </div>

            <div className="space-y-3">
              {quotes.map((q: any) => (
                <div
                  key={q.id}
                  onClick={() => router.push(`/quotes/${q.id}`)}
                  className="p-4 border border-zinc-850 bg-zinc-900/30 hover:border-purple-500/20 rounded-xl flex items-center justify-between cursor-pointer transition-all"
                >
                  <div>
                    <span className="font-mono text-purple-400 font-bold">{q.quoteNumber}</span>
                    <p className="text-[10px] text-zinc-500 font-medium">Grand Total: ₹{q.total?.toLocaleString()}</p>
                  </div>
                  <span className={cn(
                    "text-[8px] font-bold px-1.5 py-0.5 rounded-full border",
                    q.status === "ACCEPTED" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-450" :
                    q.status === "REJECTED" ? "border-red-500/20 bg-red-500/5 text-red-455" : "border-zinc-800 text-zinc-400"
                  )}>
                    {q.status}
                  </span>
                </div>
              ))}
              {quotes.length === 0 && (
                <p className="text-zinc-500 italic text-[11px] py-4 text-center">No proposals built for this client.</p>
              )}
            </div>
          </div>
        )}

        {/* TASKS CHECKLIST TAB */}
        {activeTab === "tasks" && (
          <div className="space-y-4 font-semibold text-xs">
            <h4 className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Operational Checklists</h4>

            {/* Checklist items */}
            <div className="space-y-2.5">
              {leadTasks.map((t) => (
                <div 
                  key={t.id} 
                  className={cn(
                    "flex items-center justify-between p-3 border border-zinc-850 rounded-xl bg-zinc-950/20 text-xs transition-opacity duration-200",
                    t.completed ? "opacity-60" : ""
                  )}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleTask(t.id)}
                      className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center transition-all cursor-pointer",
                        t.completed ? "bg-purple-650 border-purple-600 text-white" : "border-zinc-700 hover:border-purple-500"
                      )}
                    >
                      {t.completed && <Check size={10} strokeWidth={3} />}
                    </button>
                    <div>
                      <span className={cn("font-bold text-zinc-200 block", t.completed && "line-through text-zinc-550")}>{t.text}</span>
                      <p className="text-[9px] text-zinc-500 font-medium">Due: {t.dueDate || "No Date"} • Priority: {t.priority}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const updated = leadTasks.filter(tk => tk.id !== t.id);
                      setLeadTasks(updated);
                      triggerAutoSave({ tasks: updated });
                    }}
                    className="text-zinc-550 hover:text-red-400 p-1 cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {leadTasks.length === 0 && (
                <p className="text-zinc-500 italic text-[11px] py-4 text-center">No tasks assigned. Create one below.</p>
              )}
            </div>

            {/* Add Task input form */}
            <div className="p-3 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-3">
              <span className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider block">Add checklist item</span>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Task title (e.g. Schedule venue visit)"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={newTaskDue}
                    onChange={(e) => setNewTaskDue(e.target.value)}
                    className="px-2 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white font-semibold text-[10px] focus:outline-none"
                  />
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="px-2 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white focus:outline-none"
                  >
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!newTaskText) return;
                  const updated = [...leadTasks, {
                    id: Date.now().toString(),
                    text: newTaskText,
                    dueDate: newTaskDue,
                    priority: newTaskPriority,
                    completed: false
                  }];
                  setLeadTasks(updated);
                  triggerAutoSave({ tasks: updated });
                  setNewTaskText("");
                  setNewTaskDue("");
                  setNewTaskPriority("MEDIUM");
                }}
                className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold cursor-pointer"
              >
                Add Action Item
              </button>
            </div>
          </div>
        )}

        {/* NOTES PANEL (PIN & SEARCH) */}
        {activeTab === "notes" && (
          <div className="space-y-4 font-semibold text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Repository Notes</span>
              <div className="relative w-44">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-550">
                  <Search size={11} />
                </span>
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={noteSearchQuery}
                  onChange={(e) => setNoteSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-3 py-1 bg-zinc-950 border border-zinc-850 rounded-lg text-[10px] focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Note text editor */}
            <div className="p-3 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-2">
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Type a new planner note..."
                rows={3}
                className="w-full p-2.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500 font-semibold"
              />
              <button
                onClick={handleAddRichNote}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold ml-auto block cursor-pointer"
              >
                Add Note
              </button>
            </div>

            {/* Notes List */}
            <div className="space-y-3.5 pt-2">
              {filteredRichNotes.map((note) => (
                <div 
                  key={note.id} 
                  className={cn(
                    "p-3.5 border rounded-xl bg-zinc-900/10 text-xs space-y-2 relative group",
                    note.isPinned ? "border-purple-500/30 bg-purple-950/[0.01]" : "border-zinc-850"
                  )}
                >
                  <div className="flex justify-between items-start gap-4">
                    <p className="text-zinc-200 leading-relaxed font-semibold whitespace-pre-wrap">{note.text}</p>
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleTogglePinNote(note.id)}
                        className={cn(
                          "p-1 hover:bg-zinc-800 rounded transition cursor-pointer",
                          note.isPinned ? "text-purple-400" : "text-zinc-550"
                        )}
                        title={note.isPinned ? "Unpin Note" : "Pin Note"}
                      >
                        <Pin size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteRichNote(note.id)}
                        className="p-1 hover:bg-zinc-800 rounded text-zinc-550 hover:text-red-400 transition cursor-pointer"
                        title="Delete Note"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <span className="text-[9px] text-zinc-550 block font-mono">
                    {new Date(note.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
              {filteredRichNotes.length === 0 && (
                <p className="text-zinc-500 italic text-[11px] text-center py-4">No notes found matching query.</p>
              )}
            </div>
          </div>
        )}

        {/* COMMUNICATIONS TAB */}
        {activeTab === "comms" && (
          <div className="space-y-4 font-semibold text-xs">
            <h4 className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Interaction Ledger</h4>

            {/* Log communication form */}
            <div className="p-3 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Record communication</span>
                <select
                  value={newCommType}
                  onChange={(e) => setNewCommType(e.target.value as any)}
                  className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[9px] font-bold text-zinc-400 focus:outline-none"
                >
                  <option value="CALL">Phone Call</option>
                  <option value="EMAIL">Email Sent</option>
                  <option value="MEETING">Meeting</option>
                  <option value="WHATSAPP">WhatsApp Message</option>
                  <option value="SMS">SMS Notification</option>
                </select>
              </div>
              <textarea
                value={newCommText}
                onChange={(e) => setNewCommText(e.target.value)}
                placeholder="Details of what was discussed..."
                rows={2}
                className="w-full p-2 bg-zinc-900 border border-zinc-850 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newCommText) return;
                  const updated = [...commLogs, {
                    id: Date.now().toString(),
                    type: newCommType,
                    text: newCommText,
                    date: new Date().toISOString(),
                    staffName: "Current Planner"
                  }];
                  setCommLogs(updated);
                  triggerAutoSave({ comms: updated });
                  setNewCommText("");
                }}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold ml-auto block cursor-pointer"
              >
                Log Interaction
              </button>
            </div>

            {/* Comm Logs list */}
            <div className="space-y-3">
              {commLogs.map((log) => (
                <div key={log.id} className="p-3 border border-zinc-850 bg-zinc-950/20 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-purple-400 text-[10px] uppercase">{log.type}</span>
                    <span className="text-[9px] text-zinc-550">{new Date(log.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-zinc-200">{log.text}</p>
                </div>
              ))}
              {commLogs.length === 0 && (
                <p className="text-zinc-500 italic text-[11px] py-4 text-center">No logged interactions.</p>
              )}
            </div>
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === "timeline" && (
          <div className="space-y-4 font-semibold text-xs">
            <h4 className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Audit Trail</h4>
            
            <div className="relative pl-4 border-l border-zinc-850 space-y-4 py-1">
              {activities.map((act) => (
                <div key={act.id} className="relative flex justify-between gap-4 text-[11px]">
                  {/* Indicator dot */}
                  <div className="absolute -left-[20.5px] top-1 h-2 w-2 rounded-full bg-purple-500 ring-4 ring-[#09090b]" />
                  
                  <div>
                    <span className="text-zinc-200 block font-semibold">{act.description}</span>
                    <span className="text-[9px] text-zinc-550 pt-0.5 block">{new Date(act.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-zinc-600 italic py-2">No historical events recorded for this lead.</p>
              )}
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
}
