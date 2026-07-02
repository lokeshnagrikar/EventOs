"use client";

import React, { useState, useEffect } from "react";
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
  Activity, 
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
  GitMerge
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
  const [activeTab, setActiveTab] = useState<"overview" | "contact" | "quotes" | "tasks" | "comms" | "timeline">("overview");

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

  // Task Input States
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");

  // Communication Log Input States
  const [newCommType, setNewCommType] = useState<"CALL" | "EMAIL" | "MEETING" | "WHATSAPP" | "SMS">("CALL");
  const [newCommText, setNewCommText] = useState("");

  // Custom Field Input States
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");

  // Attachment Input States
  const [newAttachName, setNewAttachName] = useState("");
  const [newAttachUrl, setNewAttachUrl] = useState("");

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
  };

  // Compile current form and metadata into updates object, serializing notes as JSON
  const saveLeadMetadata = (customNotesText?: string, customTasks?: TaskItem[], customComms?: CommLog[], customFieldsList?: CustomField[], customAttachments?: Attachment[], customContactProfile?: any) => {
    const serializedNotes = JSON.stringify({
      notes: customNotesText !== undefined ? customNotesText : rawNotesText,
      priority: leadPriority,
      probability: probabilityPercent,
      referral: referralName,
      customFields: customFieldsList || customFields,
      attachments: customAttachments || attachments,
      contactProfile: customContactProfile || {
        altPhones,
        altEmails,
        address: streetAddress,
        companyName,
        anniversary: anniversaryDate,
        birthday: birthdayDate,
        favTheme,
        instagram: socialInsta,
        facebook: socialFb,
        guestCount
      },
      tasks: customTasks || leadTasks,
      comms: customComms || commLogs
    });

    onUpdateLead({
      name: editName,
      phone: editPhone || null,
      email: editEmail || null,
      eventType: editEventType,
      eventDate: editEventDate || null,
      budget: Number(editBudget),
      leadSource: editSource,
      notes: serializedNotes,
      assignedUserId: editAssignee || null
    });
  };

  // Calculate completeness score (AI-ready lead score)
  const calculateLeadScore = () => {
    let score = 0;
    if (editName) score += 20;
    if (editPhone || lead?.contact?.phone) score += 20;
    if (editEmail || lead?.contact?.email) score += 20;
    if (editEventDate) score += 20;
    if (editBudget > 0) score += 20;
    return score;
  };

  const leadScore = calculateLeadScore();

  if (!lead) return null;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 26, stiffness: 210 }}
      className="fixed inset-y-0 right-0 z-50 w-full max-w-xl border-l border-zinc-800 bg-[#09090b]/98 backdrop-blur-md shadow-2xl flex flex-col justify-between select-none"
    >
      {/* Drawer Header */}
      <div className="h-16 border-b border-zinc-850 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm text-zinc-150 truncate max-w-[200px]">{lead.name}</span>
          <span className={cn(
            "text-[9px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase",
            lead.status === "WON" || lead.status === "BOOKED" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" :
            lead.status === "LOST" ? "border-red-500/20 bg-red-500/5 text-red-400" : "border-purple-500/20 bg-purple-500/5 text-purple-400"
          )}>
            {lead.status}
          </span>
          <span className="px-1.5 py-0.5 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-full font-mono text-[9px] flex items-center gap-1">
            <Sparkles size={8} />
            Score: {leadScore}
          </span>
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
          { id: "overview", label: "Overview" },
          { id: "contact", label: "Contact Profile" },
          { id: "quotes", label: "Quotes" },
          { id: "tasks", label: "Tasks & To-Dos" },
          { id: "comms", label: "Communications" },
          { id: "timeline", label: "Timeline" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "py-3 text-[10px] font-bold border-b-2 tracking-wide uppercase transition-all cursor-pointer shrink-0",
              activeTab === tab.id ? "border-purple-500 text-purple-400" : "border-transparent text-zinc-500 hover:text-zinc-350"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-semibold">
        
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveLeadMetadata();
              onAddActivity("SYSTEM", "Lead details updated");
            }}
            className="space-y-4 font-semibold text-xs"
          >
            {/* Core details */}
            <div className="p-4 rounded-xl border border-zinc-850 bg-zinc-900/10 space-y-3.5">
              <h4 className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Leads Specs</h4>
              <div className="space-y-1.5">
                <label className="text-zinc-500 font-bold block">Lead Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-200 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">Category</label>
                  <select
                    value={editEventType}
                    onChange={(e) => setEditEventType(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-300 focus:outline-none"
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
                    onChange={(e) => setEditEventDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">Budget (INR)</label>
                  <input
                    type="number"
                    value={editBudget}
                    onChange={(e) => setEditBudget(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">Source</label>
                  <select
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-300 focus:outline-none"
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
                    onChange={(e) => setLeadPriority(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-300 focus:outline-none"
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
                    onChange={(e) => setProbabilityPercent(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">Assigned Planner</label>
                  <select
                    value={editAssignee}
                    onChange={(e) => setEditAssignee(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-300 focus:outline-none"
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
              
              {/* Existing custom fields */}
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
                        saveLeadMetadata(rawNotesText, leadTasks, commLogs, updated);
                      }}
                      className="text-zinc-500 hover:text-red-400"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Custom field input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Key (e.g. Diet)"
                  value={newFieldKey}
                  onChange={(e) => setNewFieldKey(e.target.value)}
                  className="w-1/2 px-2 py-1 bg-zinc-950 border border-zinc-850 rounded text-zinc-200"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. Vegan)"
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  className="w-1/2 px-2 py-1 bg-zinc-950 border border-zinc-850 rounded text-zinc-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newFieldKey || !newFieldValue) return;
                    const updated = [...customFields, { key: newFieldKey, value: newFieldValue }];
                    setCustomFields(updated);
                    saveLeadMetadata(rawNotesText, leadTasks, commLogs, updated);
                    setNewFieldKey("");
                    setNewFieldValue("");
                  }}
                  className="px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded font-bold"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-650 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold cursor-pointer transition shadow-md active:scale-95"
              >
                Save Details
              </button>
            </div>
          </form>
        )}

        {/* CONTACT PROFILE TAB */}
        {activeTab === "contact" && (
          <div className="space-y-4 font-semibold text-xs">
            <div className="p-4 rounded-xl border border-zinc-850 bg-zinc-900/10 space-y-3.5">
              <h4 className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Personal Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">First Name</label>
                  <input
                    type="text"
                    value={editName.split(" ")[0]}
                    onChange={(e) => setEditName(e.target.value + " " + (editName.split(" ")[1] || ""))}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">Last Name</label>
                  <input
                    type="text"
                    value={editName.split(" ")[1] || ""}
                    onChange={(e) => setEditName((editName.split(" ")[0] || "") + " " + e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">Primary Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">Primary Phone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-200 focus:outline-none"
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
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">Guest Count</label>
                  <input
                    type="number"
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-250 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">Birthday</label>
                  <input
                    type="date"
                    value={birthdayDate}
                    onChange={(e) => setBirthdayDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-300 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">Anniversary</label>
                  <input
                    type="date"
                    value={anniversaryDate}
                    onChange={(e) => setAnniversaryDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500 font-bold block">Social coordinates</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Instagram handle"
                    value={socialInsta}
                    onChange={(e) => setSocialInsta(e.target.value)}
                    className="w-1/2 px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white"
                  />
                  <input
                    type="text"
                    placeholder="Facebook Profile"
                    value={socialFb}
                    onChange={(e) => setSocialFb(e.target.value)}
                    className="w-1/2 px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500 font-bold block">Street Address</label>
                <input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Street and City"
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-200 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={() => {
                saveLeadMetadata();
                onAddActivity("SYSTEM", "Contact profile updated");
              }}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition"
            >
              Update Contact Profile
            </button>
          </div>
        )}

        {/* QUOTES TAB */}
        {activeTab === "quotes" && (
          <div className="space-y-4 font-semibold text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Lead Proposals</span>
              <button
                onClick={() => router.push("/quotes/new")}
                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
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
                    q.status === "REJECTED" ? "border-red-500/20 bg-red-500/5 text-red-450" : "border-zinc-800 text-zinc-400"
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
            <h4 className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Operational checklists</h4>

            {/* Checklist items */}
            <div className="space-y-2.5">
              {leadTasks.map((t, idx) => (
                <div 
                  key={t.id} 
                  className="flex items-center justify-between p-3 border border-zinc-850 rounded-xl bg-zinc-950/20 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={t.completed}
                      onChange={() => {
                        const updated = leadTasks.map(tk => tk.id === t.id ? { ...tk, completed: !tk.completed } : tk);
                        setLeadTasks(updated);
                        saveLeadMetadata(rawNotesText, updated);
                      }}
                      className="accent-purple-500 h-4 w-4 rounded cursor-pointer shrink-0"
                    />
                    <div>
                      <span className={cn("font-bold text-zinc-200 block", t.completed && "line-through text-zinc-550")}>{t.text}</span>
                      <p className="text-[9px] text-zinc-500 font-medium">Due: {t.dueDate || "No Date"} • Priority: {t.priority}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const updated = leadTasks.filter(tk => tk.id !== t.id);
                      setLeadTasks(updated);
                      saveLeadMetadata(rawNotesText, updated);
                    }}
                    className="text-zinc-550 hover:text-red-400 p-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
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
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={newTaskDue}
                    onChange={(e) => setNewTaskDue(e.target.value)}
                    className="px-2 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white font-semibold text-[10px]"
                  />
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="px-2 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white"
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
                  saveLeadMetadata(rawNotesText, updated);
                  // reset fields
                  setNewTaskText("");
                  setNewTaskDue("");
                  setNewTaskPriority("MEDIUM");
                }}
                className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold"
              >
                Add Action Item
              </button>
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
                  className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[9px] font-bold text-zinc-400"
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
                className="w-full p-2 bg-zinc-900 border border-zinc-850 rounded-lg text-white"
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
                  saveLeadMetadata(rawNotesText, leadTasks, updated);
                  setNewCommText("");
                }}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold ml-auto block"
              >
                Log Interaction
              </button>
            </div>

            {/* Logs List */}
            <div className="space-y-3">
              {commLogs.map((log) => (
                <div key={log.id} className="p-3 border border-zinc-850 bg-zinc-900/10 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded font-bold text-purple-400 uppercase">
                      {log.type}
                    </span>
                    <span className="text-[8px] text-zinc-550">{new Date(log.date).toLocaleString()}</span>
                  </div>
                  <p className="text-zinc-350 leading-relaxed font-semibold">{log.text}</p>
                </div>
              ))}
              {commLogs.length === 0 && (
                <p className="text-zinc-500 italic text-[11px] py-4 text-center">No communications logged yet.</p>
              )}
            </div>
          </div>
        )}

        {/* TIMELINE VIEW TAB */}
        {activeTab === "timeline" && (
          <div className="space-y-6">
            <h4 className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Audit Timeline</h4>
            <div className="relative border-l border-zinc-850 pl-4 ml-2 space-y-6 text-xs font-semibold">
              {activities.map((act) => (
                <div key={act.id} className="relative">
                  <span className="absolute -left-[21px] mt-1 h-2.5 w-2.5 rounded-full bg-purple-500 ring-4 ring-[#111113]" />
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <span className="font-extrabold text-zinc-200 block">{act.type}</span>
                      <p className="text-zinc-500 mt-0.5 leading-normal">{act.description}</p>
                    </div>
                    <span className="text-[9px] text-zinc-550 shrink-0 font-bold">
                      {new Date(act.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-zinc-500 italic text-[11px] py-4">No chronological events logged.</p>
              )}
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
}
