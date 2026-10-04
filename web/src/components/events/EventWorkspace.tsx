"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
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
  Activity,
  Eye,
  Printer,
  X,
  Download,
  Mail,
  Receipt,
  CheckCircle,
  HelpCircle,
  AlertCircle
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
  phone?: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  assignedStaff: string;
  dueDate: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  completed: boolean;
}

export interface EventVendor {
  id: string;
  name: string;
  category: string;
  contact: string;
  phone?: string;
  rating: number;
  paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
  cost: number;
  notes?: string;
}

export interface StaffAllocation {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface EventInvoice {
  id: string;
  invoiceNumber: string;
  title: string;
  subtotal: number;
  gstRate: number; // 18%
  gstAmount: number;
  totalAmount: number;
  status: "DRAFT" | "SENT" | "CLEARED" | "OVERDUE";
  dueDate: string;
  createdAt: string;
  notes?: string;
}

export interface PaymentMilestone {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: "PENDING" | "RECEIVED";
  method: "UPI" | "BANK_TRANSFER" | "CASH" | "RAZORPAY" | "CHEQUE";
  referenceNo?: string;
  paidAt?: string;
}

export interface EventAsset {
  id: string;
  title: string;
  category: string;
  url: string;
  uploadedAt: string;
}

export interface EventGuest {
  id: string;
  name: string;
  phone?: string;
  rsvp: "CONFIRMED" | "PENDING" | "DECLINED";
  tableNo?: string;
  dietary?: "VEG" | "NON_VEG" | "JAIN" | "STANDARD";
  plusOnes?: number;
}

export interface EventExpense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
}

export interface EventActivity {
  id: string;
  text: string;
  timestamp: string;
  category?: string;
}

interface RichNote {
  id: string;
  text: string;
  isPinned: boolean;
  createdAt: string;
}

export interface TimelineCue {
  id: string;
  time: string;
  title: string;
  department: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  notes?: string;
}

const TAB_OPTIONS = [
  { id: "overview", label: "Overview", icon: Briefcase },
  { id: "timeline", label: "Run of Show / Timeline", icon: Clock },
  { id: "guests", label: "Guests", icon: Users },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "vendors", label: "Vendors", icon: Car },
  { id: "staff", label: "Staff", icon: UserCheck },
  { id: "budget", label: "Budget", icon: DollarSign },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "gallery", label: "Gallery", icon: ImageIcon },
  { id: "notes", label: "Notes", icon: Pin },
  { id: "activity", label: "Activity", icon: Activity }
];

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

const VENDOR_CATEGORIES = [
  "Decor & Florals",
  "Catering & Banquet",
  "Sound & Audio",
  "Stage & Lights",
  "Photography & Drone",
  "DJ & Music",
  "Makeup & Styling",
  "Security & Valet",
  "Hospitality & Crew",
  "Logistics & Transit",
  "Venue & Infrastructure",
  "Other"
];

const STAFF_ROLES = [
  "Lead Planner",
  "On-site Coordinator",
  "Stage Manager",
  "Chief Photographer",
  "AV & Sound Lead",
  "Hospitality & Hostess",
  "Decor Supervisor",
  "Valet & Logistics Lead",
  "Production Runner"
];

export default function EventWorkspace({ eventId }: { eventId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);

  const [activeTab, setActiveTab] = useState("vendors");
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

  // Metadata fields
  const [rawNotesText, setRawNotesText] = useState("");
  const [dressCode, setDressCode] = useState("Black Tie Optional");
  const [themeName, setThemeName] = useState("Vintage Royal");
  const [priorityTier, setPriorityTier] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");

  // Dynamic modules state - 100% dynamic, NO fake default lists
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newCheckText, setNewCheckText] = useState("");
  const [newCheckStaff, setNewCheckStaff] = useState("");
  const [newCheckDue, setNewCheckDue] = useState("");
  const [newCheckPriority, setNewCheckPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");

  // Dynamic Vendors list
  const [vendors, setVendors] = useState<EventVendor[]>([]);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorCat, setNewVendorCat] = useState("Decor & Florals");
  const [newVendorCost, setNewVendorCost] = useState("");
  const [newVendorPhone, setNewVendorPhone] = useState("");
  const [newVendorStatus, setNewVendorStatus] = useState<"UNPAID" | "PARTIAL" | "PAID">("UNPAID");

  // Dynamic Staff Allocations
  const [staffAllocations, setStaffAllocations] = useState<StaffAllocation[]>([]);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("Lead Planner");
  const [newStaffPhone, setNewStaffPhone] = useState("");

  // Dynamic Invoices
  const [invoices, setInvoices] = useState<EventInvoice[]>([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<EventInvoice | null>(null);
  const [newInvTitle, setNewInvTitle] = useState("");
  const [newInvAmount, setNewInvAmount] = useState("");
  const [newInvDueDate, setNewInvDueDate] = useState("");
  const [newInvIncludeGst, setNewInvIncludeGst] = useState(true);
  const [newInvStatus, setNewInvStatus] = useState<"DRAFT" | "SENT" | "CLEARED">("DRAFT");

  // Dynamic Payment Milestones
  const [paymentMilestones, setPaymentMilestones] = useState<PaymentMilestone[]>([]);
  const [newMileTitle, setNewMileTitle] = useState("");
  const [newMileAmount, setNewMileAmount] = useState("");
  const [newMileDue, setNewMileDue] = useState("");
  const [newMileMethod, setNewMileMethod] = useState<PaymentMilestone["method"]>("UPI");
  const [newMileRef, setNewMileRef] = useState("");

  // Dynamic Gallery Assets
  const [galleryAssets, setGalleryAssets] = useState<EventAsset[]>([]);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [newAssetTitle, setNewAssetTitle] = useState("");
  const [newAssetCategory, setNewAssetCategory] = useState("Decor");
  const [newAssetUrl, setNewAssetUrl] = useState("");
  const [lightboxImage, setLightboxImage] = useState<EventAsset | null>(null);

  // Dynamic Guests Roster
  const [guests, setGuests] = useState<EventGuest[]>([]);
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestPhone, setNewGuestPhone] = useState("");
  const [newGuestRsvp, setNewGuestRsvp] = useState<"CONFIRMED" | "PENDING" | "DECLINED">("CONFIRMED");
  const [newGuestTable, setNewGuestTable] = useState("");
  const [newGuestDietary, setNewGuestDietary] = useState<"VEG" | "NON_VEG" | "JAIN" | "STANDARD">("VEG");
  const [guestSearch, setGuestSearch] = useState("");
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkGuestText, setBulkGuestText] = useState("");

  // Dynamic Budget & Expenses
  const [additionalExpenses, setAdditionalExpenses] = useState<EventExpense[]>([]);
  const [newExpTitle, setNewExpTitle] = useState("");
  const [newExpCategory, setNewExpCategory] = useState("Permits & Licenses");
  const [newExpAmount, setNewExpAmount] = useState("");

  // Dynamic Activity Trail
  const [activityFeed, setActivityFeed] = useState<EventActivity[]>([]);
  const [manualLogText, setManualLogText] = useState("");

  // Notes
  const [richNotes, setRichNotes] = useState<RichNote[]>([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [noteSearch, setNoteSearch] = useState("");

  // Run of Show / Timeline Cues
  const [timelineCues, setTimelineCues] = useState<TimelineCue[]>([]);
  const [showAddCue, setShowAddCue] = useState(false);
  const [newCueTime, setNewCueTime] = useState("06:00 PM");
  const [newCueTitle, setNewCueTitle] = useState("");
  const [newCueDept, setNewCueDept] = useState("Hospitality & Hostess");
  const [newCueNotes, setNewCueNotes] = useState("");

  // Fetch Event details
  const { data: eventResponse, isLoading: eventLoading } = useQuery<{ data: Event }>({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const response = await api.get(`/events/${eventId}`);
      return response.data;
    }
  });

  const event = eventResponse?.data;

  // Fetch real team members from workspace
  const { data: teamData } = useQuery<{ data: TeamMember[] }>({
    queryKey: ["teamMembers"],
    queryFn: async () => {
      try {
        const response = await api.get("/auth/settings/team");
        return response.data;
      } catch {
        return { data: [] };
      }
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
          setPriorityTier(meta.priority || "MEDIUM");

          setChecklist(Array.isArray(meta.checklist) ? meta.checklist : []);
          setTimelineCues(Array.isArray(meta.timelineCues) ? meta.timelineCues : []);
          setVendors(Array.isArray(meta.vendors) ? meta.vendors : []);
          setStaffAllocations(Array.isArray(meta.staffAllocations) ? meta.staffAllocations : []);
          setInvoices(Array.isArray(meta.invoices) ? meta.invoices : []);
          setPaymentMilestones(Array.isArray(meta.paymentMilestones) ? meta.paymentMilestones : []);
          setGalleryAssets(Array.isArray(meta.galleryAssets) ? meta.galleryAssets : []);
          setGuests(Array.isArray(meta.guests) ? meta.guests : []);
          setAdditionalExpenses(Array.isArray(meta.additionalExpenses) ? meta.additionalExpenses : []);
          setActivityFeed(Array.isArray(meta.activityFeed) ? meta.activityFeed : []);
          setRichNotes(Array.isArray(meta.richNotes) ? meta.richNotes : []);
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
    timelineCuesList: TimelineCue[];
    vendorsList: EventVendor[];
    staffList: StaffAllocation[];
    invoicesList: EventInvoice[];
    milestonesList: PaymentMilestone[];
    galleryList: EventAsset[];
    guestsList: EventGuest[];
    expensesList: EventExpense[];
    activityList: EventActivity[];
    notesList: RichNote[];
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

      const metaPayload = {
        notesText: updatedFields.notesText !== undefined ? updatedFields.notesText : rawNotesText,
        dressCode,
        theme: themeName,
        priority: priorityTier,
        checklist: updatedFields.checklistList !== undefined ? updatedFields.checklistList : checklist,
        timelineCues: updatedFields.timelineCuesList !== undefined ? updatedFields.timelineCuesList : timelineCues,
        vendors: updatedFields.vendorsList !== undefined ? updatedFields.vendorsList : vendors,
        staffAllocations: updatedFields.staffList !== undefined ? updatedFields.staffList : staffAllocations,
        invoices: updatedFields.invoicesList !== undefined ? updatedFields.invoicesList : invoices,
        paymentMilestones: updatedFields.milestonesList !== undefined ? updatedFields.milestonesList : paymentMilestones,
        galleryAssets: updatedFields.galleryList !== undefined ? updatedFields.galleryList : galleryAssets,
        guests: updatedFields.guestsList !== undefined ? updatedFields.guestsList : guests,
        additionalExpenses: updatedFields.expensesList !== undefined ? updatedFields.expensesList : additionalExpenses,
        activityFeed: updatedFields.activityList !== undefined ? updatedFields.activityList : activityFeed,
        richNotes: updatedFields.notesList !== undefined ? updatedFields.notesList : richNotes
      };

      const payload = {
        name: mergedName,
        type: mergedType,
        startDate: mergedStart ? new Date(mergedStart).toISOString() : new Date().toISOString(),
        endDate: mergedEnd ? new Date(mergedEnd).toISOString() : new Date().toISOString(),
        location: mergedLoc,
        venueName: mergedVenue,
        venueAddress: mergedAddr,
        guestCount: Number(mergedGuests) || 0,
        budget: Number(mergedBudget) || 0,
        notes: JSON.stringify(metaPayload)
      };

      updateEventMutation.mutate(payload);
    }, 600);
  };

  // Activity Logger Helper
  const logActivityAction = (text: string, category: string = "OPERATION") => {
    const newEntry: EventActivity = {
      id: `act-${Date.now()}`,
      text,
      timestamp: new Date().toISOString(),
      category
    };
    const updated = [newEntry, ...activityFeed];
    setActivityFeed(updated);
    triggerAutoSave({ activityList: updated });
  };

  const handleStatusChange = (newStatus: string) => {
    api.put(`/events/${eventId}/status`, { status: newStatus }).then(() => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      logActivityAction(`Event status updated to ${STATUS_LABELS[newStatus] || newStatus}`, "STATUS");
      addToast(`Status updated to ${STATUS_LABELS[newStatus] || newStatus}`, "success");
    });
  };

  // Vendor calculations
  const totalVendorCost = useMemo(() => {
    return vendors.reduce((sum, v) => sum + (Number(v.cost) || 0), 0);
  }, [vendors]);

  const totalOtherExpenses = useMemo(() => {
    return additionalExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [additionalExpenses]);

  const totalCommittedCosts = totalVendorCost + totalOtherExpenses;

  const budgetPerformance = useMemo(() => {
    const remaining = editBudget - totalCommittedCosts;
    const percentUsed = editBudget > 0 ? (totalCommittedCosts / editBudget) * 100 : 0;
    return { remaining, percentUsed };
  }, [editBudget, totalCommittedCosts]);

  // VENDOR HANDLERS
  const handleAddVendor = () => {
    if (!newVendorName.trim() || !newVendorCost) {
      addToast("Please provide Vendor Name and Quoted Cost", "error");
      return;
    }
    const nextVendor: EventVendor = {
      id: `v-${Date.now()}`,
      name: newVendorName.trim(),
      category: newVendorCat,
      contact: newVendorPhone ? newVendorPhone.trim() : `${newVendorName.toLowerCase().replace(/\s+/g, "")}@partner.com`,
      phone: newVendorPhone.trim(),
      rating: 4.8,
      paymentStatus: newVendorStatus,
      cost: Number(newVendorCost)
    };
    const updated = [...vendors, nextVendor];
    setVendors(updated);
    setNewVendorName("");
    setNewVendorCost("");
    setNewVendorPhone("");
    triggerAutoSave({ vendorsList: updated });
    logActivityAction(`Vendor "${nextVendor.name}" (${nextVendor.category}) mapped at ₹${nextVendor.cost.toLocaleString()}`, "VENDOR");
    addToast(`Mapped vendor ${nextVendor.name} successfully`, "success");
  };

  const handleDeleteVendor = (id: string, name: string) => {
    const updated = vendors.filter(v => v.id !== id);
    setVendors(updated);
    triggerAutoSave({ vendorsList: updated });
    logActivityAction(`Removed vendor "${name}" from event roster`, "VENDOR");
    addToast(`Removed ${name}`, "info");
  };

  const handleCycleVendorPayment = (id: string) => {
    const updated = vendors.map(v => {
      if (v.id === id) {
        const nextStatus = v.paymentStatus === "UNPAID" ? "PARTIAL" : v.paymentStatus === "PARTIAL" ? "PAID" : "UNPAID";
        logActivityAction(`Updated payment status of ${v.name} to ${nextStatus}`, "FINANCE");
        return { ...v, paymentStatus: nextStatus as any };
      }
      return v;
    });
    setVendors(updated);
    triggerAutoSave({ vendorsList: updated });
    addToast("Vendor payment status updated", "success");
  };

  // STAFF HANDLERS
  const handleAddStaff = () => {
    if (!newStaffName.trim()) {
      addToast("Please specify staff member name", "error");
      return;
    }
    const newStaff: StaffAllocation = {
      id: `stf-${Date.now()}`,
      name: newStaffName.trim(),
      role: newStaffRole,
      phone: newStaffPhone.trim()
    };
    const updated = [...staffAllocations, newStaff];
    setStaffAllocations(updated);
    setNewStaffName("");
    setNewStaffPhone("");
    triggerAutoSave({ staffList: updated });
    logActivityAction(`Assigned ${newStaff.name} as ${newStaff.role}`, "STAFF");
    addToast(`Assigned ${newStaff.name} to crew`, "success");
  };

  const handleDeleteStaff = (id: string, name: string) => {
    const updated = staffAllocations.filter(s => s.id !== id);
    setStaffAllocations(updated);
    triggerAutoSave({ staffList: updated });
    logActivityAction(`Unassigned ${name} from crew`, "STAFF");
    addToast(`Unassigned ${name}`, "info");
  };

  // INVOICE HANDLERS
  const handleCreateInvoice = () => {
    if (!newInvTitle.trim() || !newInvAmount) {
      addToast("Please provide Invoice Title and Amount", "error");
      return;
    }
    const subtotal = Number(newInvAmount) || 0;
    const gstRate = newInvIncludeGst ? 18 : 0;
    const gstAmount = Math.round(subtotal * (gstRate / 100));
    const totalAmount = subtotal + gstAmount;

    const nextInvoice: EventInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, "0")}`,
      title: newInvTitle.trim(),
      subtotal,
      gstRate,
      gstAmount,
      totalAmount,
      status: newInvStatus,
      dueDate: newInvDueDate || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      createdAt: new Date().toISOString()
    };

    const updated = [nextInvoice, ...invoices];
    setInvoices(updated);
    setNewInvTitle("");
    setNewInvAmount("");
    setNewInvDueDate("");
    setShowInvoiceModal(false);
    triggerAutoSave({ invoicesList: updated });
    logActivityAction(`Generated invoice ${nextInvoice.invoiceNumber} (${nextInvoice.title}) for ₹${nextInvoice.totalAmount.toLocaleString()}`, "INVOICE");
    addToast(`Invoice ${nextInvoice.invoiceNumber} created`, "success");
  };

  const handleToggleInvoiceStatus = (id: string) => {
    const updated = invoices.map(inv => {
      if (inv.id === id) {
        const nextStatus = inv.status === "DRAFT" ? "SENT" : inv.status === "SENT" ? "CLEARED" : "DRAFT";
        logActivityAction(`Marked invoice ${inv.invoiceNumber} as ${nextStatus}`, "INVOICE");
        return { ...inv, status: nextStatus as any };
      }
      return inv;
    });
    setInvoices(updated);
    triggerAutoSave({ invoicesList: updated });
    addToast("Invoice status updated", "success");
  };

  const handleDeleteInvoice = (id: string, num: string) => {
    const updated = invoices.filter(inv => inv.id !== id);
    setInvoices(updated);
    triggerAutoSave({ invoicesList: updated });
    logActivityAction(`Deleted invoice ${num}`, "INVOICE");
    addToast(`Deleted invoice ${num}`, "info");
  };

  // PAYMENT MILESTONES HANDLERS
  const handleAddMilestone = () => {
    if (!newMileTitle.trim() || !newMileAmount) {
      addToast("Please provide milestone name and amount", "error");
      return;
    }
    const nextMile: PaymentMilestone = {
      id: `mile-${Date.now()}`,
      title: newMileTitle.trim(),
      amount: Number(newMileAmount),
      dueDate: newMileDue || new Date().toISOString().split("T")[0],
      status: "PENDING",
      method: newMileMethod,
      referenceNo: newMileRef.trim()
    };
    const updated = [...paymentMilestones, nextMile];
    setPaymentMilestones(updated);
    setNewMileTitle("");
    setNewMileAmount("");
    setNewMileDue("");
    setNewMileRef("");
    triggerAutoSave({ milestonesList: updated });
    logActivityAction(`Added payment milestone "${nextMile.title}" for ₹${nextMile.amount.toLocaleString()}`, "PAYMENT");
    addToast(`Payment milestone logged`, "success");
  };

  const handleToggleMilestone = (id: string) => {
    const updated = paymentMilestones.map(m => {
      if (m.id === id) {
        const nextStatus = m.status === "PENDING" ? "RECEIVED" : "PENDING";
        logActivityAction(`Marked payment milestone "${m.title}" as ${nextStatus}`, "PAYMENT");
        return { ...m, status: nextStatus as any, paidAt: nextStatus === "RECEIVED" ? new Date().toISOString() : undefined };
      }
      return m;
    });
    setPaymentMilestones(updated);
    triggerAutoSave({ milestonesList: updated });
    addToast("Milestone updated", "success");
  };

  const handleDeleteMilestone = (id: string, title: string) => {
    const updated = paymentMilestones.filter(m => m.id !== id);
    setPaymentMilestones(updated);
    triggerAutoSave({ milestonesList: updated });
    logActivityAction(`Removed milestone "${title}"`, "PAYMENT");
    addToast("Milestone removed", "info");
  };

  // GALLERY HANDLERS
  const handleAddGalleryAsset = () => {
    if (!newAssetUrl.trim() || !newAssetTitle.trim()) {
      addToast("Please enter asset title and photo URL / upload", "error");
      return;
    }
    const nextAsset: EventAsset = {
      id: `ast-${Date.now()}`,
      title: newAssetTitle.trim(),
      category: newAssetCategory,
      url: newAssetUrl.trim(),
      uploadedAt: new Date().toISOString()
    };
    const updated = [nextAsset, ...galleryAssets];
    setGalleryAssets(updated);
    setNewAssetTitle("");
    setNewAssetUrl("");
    setShowAddAssetModal(false);
    triggerAutoSave({ galleryList: updated });
    logActivityAction(`Uploaded gallery visual "${nextAsset.title}" (${nextAsset.category})`, "GALLERY");
    addToast("Visual asset saved to workspace gallery", "success");
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setNewAssetUrl(dataUrl);
        if (!newAssetTitle) {
          setNewAssetTitle(file.name.replace(/\.[^/.]+$/, ""));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAsset = (id: string, title: string) => {
    const updated = galleryAssets.filter(a => a.id !== id);
    setGalleryAssets(updated);
    triggerAutoSave({ galleryList: updated });
    logActivityAction(`Deleted visual asset "${title}"`, "GALLERY");
    addToast("Visual asset removed", "info");
  };

  // GUESTS HANDLERS
  const handleAddGuest = () => {
    if (!newGuestName.trim()) {
      addToast("Please enter guest name", "error");
      return;
    }
    const nextGuest: EventGuest = {
      id: `gst-${Date.now()}`,
      name: newGuestName.trim(),
      phone: newGuestPhone.trim(),
      rsvp: newGuestRsvp,
      tableNo: newGuestTable.trim() || "Unassigned",
      dietary: newGuestDietary
    };
    const updated = [nextGuest, ...guests];
    setGuests(updated);
    setEditGuestCount(updated.length);
    setNewGuestName("");
    setNewGuestPhone("");
    setNewGuestTable("");
    triggerAutoSave({ guestsList: updated, guestCount: updated.length });
    logActivityAction(`Logged guest "${nextGuest.name}" (RSVP: ${nextGuest.rsvp})`, "GUESTS");
    addToast(`Guest ${nextGuest.name} added`, "success");
  };

  const handleCycleRsvp = (id: string) => {
    const updated = guests.map(g => {
      if (g.id === id) {
        const nextRsvp = g.rsvp === "CONFIRMED" ? "PENDING" : g.rsvp === "PENDING" ? "DECLINED" : "CONFIRMED";
        return { ...g, rsvp: nextRsvp as any };
      }
      return g;
    });
    setGuests(updated);
    triggerAutoSave({ guestsList: updated });
    addToast("RSVP updated", "success");
  };

  const handleDeleteGuest = (id: string, name: string) => {
    const updated = guests.filter(g => g.id !== id);
    setGuests(updated);
    setEditGuestCount(updated.length);
    triggerAutoSave({ guestsList: updated, guestCount: updated.length });
    addToast(`Removed ${name}`, "info");
  };

  const handleApplyBulkGuests = () => {
    if (!bulkGuestText.trim()) return;
    const names = bulkGuestText.split(/[,\n]+/).map(n => n.trim()).filter(Boolean);
    const newItems: EventGuest[] = names.map(name => ({
      id: `gst-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name,
      rsvp: "CONFIRMED",
      tableNo: "General Seating",
      dietary: "STANDARD"
    }));
    const updated = [...guests, ...newItems];
    setGuests(updated);
    setEditGuestCount(updated.length);
    setBulkGuestText("");
    setShowBulkPaste(false);
    triggerAutoSave({ guestsList: updated, guestCount: updated.length });
    logActivityAction(`Imported ${newItems.length} guests from bulk registry`, "GUESTS");
    addToast(`Imported ${newItems.length} guests`, "success");
  };

  // CHECKLIST HANDLERS
  const handleAddCheckItem = () => {
    if (!newCheckText.trim()) return;
    const nextCheck: ChecklistItem = {
      id: Date.now().toString(),
      text: newCheckText.trim(),
      assignedStaff: newCheckStaff || (staffAllocations[0]?.name || "Lead Planner"),
      dueDate: newCheckDue || new Date().toISOString().split("T")[0],
      priority: newCheckPriority,
      completed: false
    };
    const updated = [...checklist, nextCheck];
    setChecklist(updated);
    setNewCheckText("");
    triggerAutoSave({ checklistList: updated });
    logActivityAction(`Added checklist task: "${nextCheck.text}"`, "TASK");
    addToast("Checklist task logged", "success");
  };

  const handleDeleteCheckItem = (id: string) => {
    const updated = checklist.filter(c => c.id !== id);
    setChecklist(updated);
    triggerAutoSave({ checklistList: updated });
    addToast("Task removed", "info");
  };

  const checklistProgress = useMemo(() => {
    if (!checklist.length) return 0;
    const completed = checklist.filter(c => c.completed).length;
    return Math.round((completed / checklist.length) * 100);
  }, [checklist]);

  // TIMELINE / RUN-OF-SHOW HANDLERS
  const handleAddCue = () => {
    if (!newCueTitle.trim()) return;
    const newCue: TimelineCue = {
      id: `cue-${Date.now()}`,
      time: newCueTime || "08:00 PM",
      title: newCueTitle.trim(),
      department: newCueDept,
      status: "PENDING",
      notes: newCueNotes.trim()
    };
    const updated = [...timelineCues, newCue];
    setTimelineCues(updated);
    triggerAutoSave({ timelineCuesList: updated });
    setNewCueTitle("");
    setNewCueNotes("");
    setShowAddCue(false);
    logActivityAction(`Logged timeline cue: "${newCue.title}" at ${newCue.time}`, "TIMELINE");
    addToast("Timeline cue logged to Run-of-Show", "success");
  };

  const handleToggleCueStatus = (cueId: string) => {
    const updated = timelineCues.map(c => {
      if (c.id === cueId) {
        const nextStatus = c.status === "PENDING" ? "IN_PROGRESS" : c.status === "IN_PROGRESS" ? "COMPLETED" : "PENDING";
        logActivityAction(`Cue "${c.title}" status changed to ${nextStatus}`, "TIMELINE");
        return { ...c, status: nextStatus as any };
      }
      return c;
    });
    setTimelineCues(updated);
    triggerAutoSave({ timelineCuesList: updated });
  };

  const handleDeleteCue = (cueId: string) => {
    const updated = timelineCues.filter(c => c.id !== cueId);
    setTimelineCues(updated);
    triggerAutoSave({ timelineCuesList: updated });
    addToast("Cue deleted", "info");
  };

  // EXPENSE HANDLERS
  const handleAddExpense = () => {
    if (!newExpTitle.trim() || !newExpAmount) return;
    const nextExp: EventExpense = {
      id: `exp-${Date.now()}`,
      title: newExpTitle.trim(),
      category: newExpCategory,
      amount: Number(newExpAmount),
      date: new Date().toISOString().split("T")[0]
    };
    const updated = [...additionalExpenses, nextExp];
    setAdditionalExpenses(updated);
    setNewExpTitle("");
    setNewExpAmount("");
    triggerAutoSave({ expensesList: updated });
    logActivityAction(`Added operational expense "${nextExp.title}" for ₹${nextExp.amount.toLocaleString()}`, "FINANCE");
    addToast("Expense line item added", "success");
  };

  const handleDeleteExpense = (id: string) => {
    const updated = additionalExpenses.filter(e => e.id !== id);
    setAdditionalExpenses(updated);
    triggerAutoSave({ expensesList: updated });
    addToast("Expense removed", "info");
  };

  // NOTES HANDLERS
  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const nextNote: RichNote = {
      id: Date.now().toString(),
      text: newNoteText.trim(),
      isPinned: false,
      createdAt: new Date().toISOString()
    };
    const updated = [nextNote, ...richNotes];
    setRichNotes(updated);
    setNewNoteText("");
    triggerAutoSave({ notesList: updated });
    addToast("Note saved", "success");
  };

  const handleDeleteNote = (id: string) => {
    const updated = richNotes.filter(n => n.id !== id);
    setRichNotes(updated);
    triggerAutoSave({ notesList: updated });
    addToast("Note removed", "info");
  };

  if (eventLoading || !event) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0c0c0e] text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          <span className="text-xs font-semibold tracking-wider uppercase text-zinc-500">Loading Event Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0c] text-zinc-100 font-sans relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/5 blur-[90px] rounded-full pointer-events-none" />

      {/* Workspace Header */}
      <div className="border-b border-zinc-800 bg-[#111113]/90 backdrop-blur-md p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/events")}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowRight size={13} className="rotate-180" />
            Back
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-base text-zinc-100">{event.name}</h1>
              {saveStatus === "saving" && <span className="text-[9px] text-zinc-500 animate-pulse uppercase font-bold">Saving...</span>}
              {saveStatus === "saved" && <span className="text-[9px] text-emerald-400 uppercase font-bold">Saved ✓</span>}
            </div>
            <p className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1">
              <Calendar size={11} className="text-purple-400" />
              {new Date(event.startDate).toLocaleDateString()} &mdash; {new Date(event.endDate).toLocaleDateString()}
              {event.venueName && <span className="text-zinc-500 ml-1">· {event.venueName}</span>}
            </p>
          </div>
        </div>

        {/* Right Header: Live Sync Indicator & Status Select */}
        <div className="flex items-center gap-3">
          <div className="group relative flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold select-none cursor-pointer transition hover:bg-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold tracking-wide">Live Mesh Sync</span>
            <span className="text-[9px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300 font-mono">Offline Ready</span>
          </div>

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
      <div className="border-b border-zinc-850 px-4 sm:px-6 bg-zinc-950/40 flex gap-4 shrink-0 overflow-x-auto no-scrollbar select-none relative z-10">
        {TAB_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => setActiveTab(opt.id)}
            className={cn(
              "py-3.5 text-[10px] font-bold border-b-2 tracking-wide uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0",
              activeTab === opt.id ? "border-purple-500 text-purple-400" : "border-transparent text-zinc-500 hover:text-zinc-300"
            )}
          >
            <opt.icon size={12} />
            {opt.label}
          </button>
        ))}
      </div>

      {/* Main Tab Container */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-7xl mx-auto w-full select-none relative z-10">

        {/* 1. OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-semibold text-xs text-zinc-300">
            <div className="md:col-span-2 space-y-6">
              <div className="p-5 border border-zinc-850 bg-[#161618]/30 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest pb-2 border-b border-zinc-900">Basic Information</h3>
                
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold block">Event Title</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => { setEditName(e.target.value); triggerAutoSave({ name: e.target.value }); }}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-xl text-white focus:outline-none focus:border-purple-500 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-bold block">Category</label>
                    <select
                      value={editType}
                      onChange={(e) => { setEditType(e.target.value); triggerAutoSave({ type: e.target.value }); }}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-xl text-white focus:outline-none text-xs"
                    >
                      <option value="WEDDING">Wedding</option>
                      <option value="BIRTHDAY">Birthday</option>
                      <option value="ENGAGEMENT">Engagement</option>
                      <option value="CORPORATE">Corporate</option>
                      <option value="CONCERT">Concert / Live Show</option>
                      <option value="RECEPTION">Reception</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-bold block">Total Budget (INR)</label>
                    <input
                      type="number"
                      value={editBudget}
                      onChange={(e) => { setEditBudget(Number(e.target.value)); triggerAutoSave({ budget: Number(e.target.value) }); }}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-xl text-white focus:outline-none focus:border-purple-500 text-xs"
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
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-xl text-white focus:outline-none focus:border-purple-500 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-bold block">End Time</label>
                    <input
                      type="datetime-local"
                      value={editEndDate}
                      onChange={(e) => { setEditEndDate(e.target.value); triggerAutoSave({ endDate: e.target.value }); }}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-xl text-white focus:outline-none focus:border-purple-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-bold block">Venue Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Taj West End, Bangalore"
                      value={editVenueName}
                      onChange={(e) => { setEditVenueName(e.target.value); triggerAutoSave({ venueName: e.target.value }); }}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-xl text-white focus:outline-none text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-bold block">City / Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Bangalore, Karnataka"
                      value={editLocation}
                      onChange={(e) => { setEditLocation(e.target.value); triggerAutoSave({ location: e.target.value }); }}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-xl text-white focus:outline-none text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-5 border border-zinc-850 bg-[#161618]/30 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest pb-2 border-b border-zinc-900">Event Specs</h3>
                
                <div className="space-y-1">
                  <span className="text-zinc-500 font-bold block text-[10px]">Dress Code</span>
                  <input
                    type="text"
                    value={dressCode}
                    onChange={(e) => { setDressCode(e.target.value); triggerAutoSave(); }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-zinc-500 font-bold block text-[10px]">Theme / Styling</span>
                  <input
                    type="text"
                    value={themeName}
                    onChange={(e) => { setThemeName(e.target.value); triggerAutoSave(); }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-zinc-500 font-bold block text-[10px]">Priority Tier</span>
                  <select
                    value={priorityTier}
                    onChange={(e) => { setPriorityTier(e.target.value as any); triggerAutoSave(); }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none text-xs"
                  >
                    <option value="HIGH">High Priority (VIP)</option>
                    <option value="MEDIUM">Standard Execution</option>
                    <option value="LOW">Low Maintenance</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. RUN OF SHOW / TIMELINE TAB */}
        {activeTab === "timeline" && (
          <div className="space-y-6">
            <div className="p-6 border border-zinc-850 bg-[#121214]/60 rounded-2xl space-y-6 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-900">
                <div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-purple-400" />
                    <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-widest">
                      Run-of-Show &amp; Minute-by-Minute Cue Sheet
                    </h3>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Live coordination execution timeline for stage, sound &amp; light, hospitality, and banquet staff.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono font-bold">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">
                      {timelineCues.length} Cues
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      {timelineCues.filter(c => c.status === "COMPLETED").length} Done
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                      {timelineCues.filter(c => c.status === "IN_PROGRESS").length} Active
                    </span>
                  </div>

                  <button
                    onClick={() => setShowAddCue(!showAddCue)}
                    className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-purple-900/30 cursor-pointer"
                  >
                    <Plus size={13} strokeWidth={3} />
                    {showAddCue ? "Close Form" : "Add Timeline Cue"}
                  </button>
                </div>
              </div>

              {/* Add Cue Drawer */}
              {showAddCue && (
                <div className="p-4 border border-purple-500/30 bg-purple-950/10 rounded-xl space-y-3">
                  <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Sparkles size={13} /> Log New Live Cue to Schedule
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold block mb-1">Cue Time</label>
                      <input
                        type="text"
                        placeholder="e.g. 06:00 PM"
                        value={newCueTime}
                        onChange={(e) => setNewCueTime(e.target.value)}
                        className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold block mb-1">Activity / Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Guest Arrival & Welcome Cocktails"
                        value={newCueTitle}
                        onChange={(e) => setNewCueTitle(e.target.value)}
                        className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold block mb-1">Department</label>
                      <select
                        value={newCueDept}
                        onChange={(e) => setNewCueDept(e.target.value)}
                        className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none"
                      >
                        <option value="Hospitality & Hostess">Hospitality & Hostess</option>
                        <option value="Stage & Production">Stage & Production</option>
                        <option value="Entertainment & AV">Entertainment & AV</option>
                        <option value="Catering & Bar">Catering & Bar</option>
                        <option value="Photography & Drone">Photography & Drone</option>
                        <option value="Security & Valet">Security & Valet</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 font-bold block mb-1">Operational Notes (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Wireless mics check, dim ambient lighting..."
                      value={newCueNotes}
                      onChange={(e) => setNewCueNotes(e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setShowAddCue(false)}
                      className="px-3 py-1 bg-zinc-900 text-zinc-400 hover:text-white rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddCue}
                      className="px-3.5 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs cursor-pointer"
                    >
                      Save Cue
                    </button>
                  </div>
                </div>
              )}

              {/* Cue Items List */}
              <div className="space-y-3">
                {timelineCues.length === 0 ? (
                  <div className="text-center py-10 px-4 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/30 space-y-2">
                    <Clock size={24} className="mx-auto text-zinc-600" />
                    <h4 className="font-bold text-xs text-zinc-300">No Timeline Cues Added Yet</h4>
                    <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                      Click "+ Add Timeline Cue" to build your live minute-by-minute execution cue sheet.
                    </p>
                  </div>
                ) : (
                  timelineCues.map((cue) => (
                    <div
                      key={cue.id}
                      className={cn(
                        "p-4 border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200",
                        cue.status === "COMPLETED"
                          ? "bg-zinc-950/40 border-zinc-900 opacity-80"
                          : cue.status === "IN_PROGRESS"
                          ? "bg-purple-950/20 border-purple-500/40 shadow-lg shadow-purple-950/20"
                          : "bg-[#141416]/70 border-zinc-850"
                      )}
                    >
                      <div className="flex items-start md:items-center gap-4">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/90 border border-zinc-800 rounded-lg text-purple-300 font-mono font-extrabold text-xs shrink-0">
                          <Clock size={12} className="text-purple-400" />
                          {cue.time}
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className={cn("font-bold text-sm", cue.status === "COMPLETED" ? "line-through text-zinc-500" : "text-zinc-100")}>
                              {cue.title}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-zinc-800/60 text-zinc-300 border-zinc-700">
                              {cue.department}
                            </span>
                          </div>
                          {cue.notes && <p className="text-[11px] text-zinc-400 mt-1">{cue.notes}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                        <button
                          onClick={() => handleToggleCueStatus(cue.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-sm select-none",
                            cue.status === "COMPLETED" && "bg-emerald-500/15 border-emerald-500/40 text-emerald-400",
                            cue.status === "IN_PROGRESS" && "bg-cyan-500/15 border-cyan-500/40 text-cyan-300 animate-pulse",
                            cue.status === "PENDING" && "bg-amber-500/15 border-amber-500/40 text-amber-400"
                          )}
                        >
                          {cue.status === "COMPLETED" && <><CheckCircle2 size={13} /> Done</>}
                          {cue.status === "IN_PROGRESS" && <><Activity size={13} /> Live Now</>}
                          {cue.status === "PENDING" && <><Clock size={13} /> Pending</>}
                          <span className="text-[9px] opacity-60">↺</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCue(cue.id)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 transition rounded-lg hover:bg-red-500/10 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. GUESTS TAB */}
        {activeTab === "guests" && (
          <div className="space-y-6">
            <div className="p-6 border border-zinc-850 bg-[#121214]/40 rounded-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-900">
                <div>
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-2">
                    <Users size={15} className="text-purple-400" />
                    Interactive Guest &amp; RSVP Registry
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1">Manage guest list, track RSVPs, table seatings, and meal preferences.</p>
                </div>

                {/* RSVP Stats */}
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    Total: {guests.length}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Confirmed: {guests.filter(g => g.rsvp === "CONFIRMED").length}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Pending: {guests.filter(g => g.rsvp === "PENDING").length}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    Declined: {guests.filter(g => g.rsvp === "DECLINED").length}
                  </span>
                </div>
              </div>

              {/* Add Single Guest Form */}
              <div className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-3">
                <span className="text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider block">Add Individual Guest</span>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <input
                    type="text"
                    placeholder="Guest Full Name *"
                    value={newGuestName}
                    onChange={(e) => setNewGuestName(e.target.value)}
                    className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                  <input
                    type="text"
                    placeholder="Phone / WhatsApp"
                    value={newGuestPhone}
                    onChange={(e) => setNewGuestPhone(e.target.value)}
                    className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                  <input
                    type="text"
                    placeholder="Table / Seating (e.g. Table 4)"
                    value={newGuestTable}
                    onChange={(e) => setNewGuestTable(e.target.value)}
                    className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                  <select
                    value={newGuestDietary}
                    onChange={(e) => setNewGuestDietary(e.target.value as any)}
                    className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none"
                  >
                    <option value="VEG">Veg</option>
                    <option value="NON_VEG">Non-Veg</option>
                    <option value="JAIN">Jain</option>
                    <option value="STANDARD">Standard</option>
                  </select>
                  <button
                    onClick={handleAddGuest}
                    className="py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-sm transition"
                  >
                    + Add Guest
                  </button>
                </div>
              </div>

              {/* Guest Search & Bulk Import Accordion */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-64">
                  <Search size={13} className="absolute left-3 top-2.5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search guest by name..."
                    value={guestSearch}
                    onChange={(e) => setGuestSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => setShowBulkPaste(!showBulkPaste)}
                  className="text-xs text-purple-400 hover:text-purple-300 font-bold cursor-pointer"
                >
                  {showBulkPaste ? "Hide Bulk Import" : "+ Bulk Paste Guest Registry"}
                </button>
              </div>

              {showBulkPaste && (
                <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
                  <label className="text-[10px] text-zinc-400 font-bold block">
                    Paste comma or newline-separated guest names:
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Rahul Sharma, Shreya Gupta, Priya Verma, Rohan Mehta..."
                    value={bulkGuestText}
                    onChange={(e) => setBulkGuestText(e.target.value)}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none"
                  />
                  <button
                    onClick={handleApplyBulkGuests}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Import All Pasted Guests
                  </button>
                </div>
              )}

              {/* Guests List */}
              <div className="space-y-2">
                {guests.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
                    <Users size={24} className="mx-auto text-zinc-600 mb-2" />
                    <span className="text-xs text-zinc-400 font-bold block">No guests registered yet</span>
                    <span className="text-[11px] text-zinc-500">Add guests individually or bulk-paste names above.</span>
                  </div>
                ) : (
                  guests
                    .filter(g => g.name.toLowerCase().includes(guestSearch.toLowerCase()))
                    .map((g) => (
                      <div
                        key={g.id}
                        className="p-3 border border-zinc-850 bg-zinc-950/30 rounded-xl flex items-center justify-between gap-4 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-[10px] text-purple-400">
                            {g.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-zinc-100 block">{g.name}</span>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                              {g.phone && <span>{g.phone}</span>}
                              <span>• Table: {g.tableNo}</span>
                              <span>• Meal: {g.dietary}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCycleRsvp(g.id)}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition select-none",
                              g.rsvp === "CONFIRMED" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
                              g.rsvp === "PENDING" && "bg-amber-500/10 text-amber-400 border-amber-500/30",
                              g.rsvp === "DECLINED" && "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            )}
                            title="Click to cycle RSVP status"
                          >
                            {g.rsvp} ↺
                          </button>
                          <button
                            onClick={() => handleDeleteGuest(g.id, g.name)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. TASKS TAB */}
        {activeTab === "tasks" && (
          <div className="space-y-6">
            <div className="p-6 border border-zinc-850 bg-[#121214]/40 rounded-2xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                <div className="flex items-center gap-2">
                  <CheckSquare size={16} className="text-purple-400" />
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Operational Checklist Tasks</h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">{checklistProgress}% Completed</span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 transition-all duration-300" style={{ width: `${checklistProgress}%` }} />
              </div>

              {/* Checklist items */}
              <div className="space-y-2.5">
                {checklist.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
                    <CheckSquare size={20} className="mx-auto text-zinc-600 mb-1" />
                    <span className="text-xs text-zinc-400 font-bold block">No operational tasks added yet</span>
                    <span className="text-[11px] text-zinc-500">Log tasks below to organize event deliverables.</span>
                  </div>
                ) : (
                  checklist.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 border border-zinc-850 rounded-xl bg-zinc-950/30 text-xs">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            const updated = checklist.map(tk => tk.id === t.id ? { ...tk, completed: !tk.completed } : tk);
                            setChecklist(updated);
                            triggerAutoSave({ checklistList: updated });
                            logActivityAction(`Task "${t.text}" marked as ${!t.completed ? "COMPLETED" : "INCOMPLETE"}`, "TASK");
                          }}
                          className={cn(
                            "h-4 w-4 rounded border flex items-center justify-center transition-all cursor-pointer",
                            t.completed ? "bg-purple-600 border-purple-500 text-white" : "border-zinc-700 hover:border-purple-500"
                          )}
                        >
                          {t.completed && <Check size={10} strokeWidth={3} />}
                        </button>
                        <div>
                          <span className={cn("font-bold text-zinc-100 block", t.completed && "line-through text-zinc-500")}>{t.text}</span>
                          <p className="text-[10px] text-zinc-500 font-medium">Due: {t.dueDate} • Assigned: {t.assignedStaff} • Priority: {t.priority}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCheckItem(t.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add checklist task input */}
              <div className="p-3 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-3">
                <span className="text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider block">Add operational task</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Task description..."
                    value={newCheckText}
                    onChange={(e) => setNewCheckText(e.target.value)}
                    className="sm:col-span-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none"
                  />
                  <input
                    type="date"
                    value={newCheckDue}
                    onChange={(e) => setNewCheckDue(e.target.value)}
                    className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none"
                  />
                  <button
                    onClick={handleAddCheckItem}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xs cursor-pointer"
                  >
                    + Add Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. VENDORS TAB (Screenshot 1 Active) */}
        {activeTab === "vendors" && (
          <div className="space-y-6">
            <div className="p-6 border border-zinc-850 bg-[#121214]/40 rounded-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-900">
                <div>
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-2">
                    <Car size={15} className="text-purple-400" />
                    Vendor Management Roster
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1">Assign vendors, track contractual commitments, costs, and payment status.</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 font-mono font-bold text-xs">
                    Total Quoted: ₹{totalVendorCost.toLocaleString()}
                  </span>
                  <span className="px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-bold">
                    {vendors.length} Vendors
                  </span>
                </div>
              </div>

              {/* Vendor Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {vendors.length === 0 ? (
                  <div className="col-span-3 text-center py-12 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/30 space-y-2">
                    <Car size={26} className="mx-auto text-zinc-600" />
                    <h4 className="font-bold text-xs text-zinc-300">No Vendors Mapped Yet</h4>
                    <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                      Use the "Log Vendor Assignment" form below to assign your caterers, decorators, sound engineers, and photographers.
                    </p>
                  </div>
                ) : (
                  vendors.map((v) => (
                    <div key={v.id} className="p-4 border border-zinc-850 bg-[#161618]/50 hover:border-zinc-700/80 transition rounded-xl space-y-3 relative group">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-extrabold text-zinc-100 block text-xs tracking-wide">{v.name}</span>
                          <span className="text-[9px] text-zinc-400 block uppercase font-bold tracking-wider mt-0.5">{v.category}</span>
                        </div>
                        <button
                          onClick={() => handleCycleVendorPayment(v.id)}
                          className={cn(
                            "text-[8px] font-bold px-2 py-0.5 rounded-full border cursor-pointer transition select-none",
                            v.paymentStatus === "PAID" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                            v.paymentStatus === "PARTIAL" && "border-amber-500/30 bg-amber-500/10 text-amber-400",
                            v.paymentStatus === "UNPAID" && "border-zinc-700 bg-zinc-800/40 text-zinc-400"
                          )}
                          title="Click to cycle payment status: Unpaid -> Partial -> Paid"
                        >
                          {v.paymentStatus} ↺
                        </button>
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-bold pt-2 border-t border-zinc-900/60 text-zinc-400">
                        <span className="font-mono text-zinc-200">Rate: ₹{v.cost.toLocaleString()}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-purple-400">★ {v.rating}</span>
                          <button
                            onClick={() => handleDeleteVendor(v.id, v.name)}
                            className="p-1 text-zinc-600 hover:text-red-400 transition rounded"
                            title="Remove Vendor"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {v.phone && (
                        <div className="text-[10px] text-zinc-500 flex items-center justify-between pt-1">
                          <span className="flex items-center gap-1"><Phone size={10} /> {v.phone}</span>
                          <a
                            href={`https://wa.me/${v.phone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[9px] text-emerald-400 hover:underline font-bold"
                          >
                            WhatsApp
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Log Vendor Assignment Form */}
              <div className="p-4 bg-zinc-950/50 border border-zinc-850 rounded-xl space-y-3">
                <span className="text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider block">Log Vendor Assignment</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Vendor Name *"
                    value={newVendorName}
                    onChange={(e) => setNewVendorName(e.target.value)}
                    className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                  <select
                    value={newVendorCat}
                    onChange={(e) => setNewVendorCat(e.target.value)}
                    className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none"
                  >
                    {VENDOR_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Cost (INR) *"
                    value={newVendorCost}
                    onChange={(e) => setNewVendorCost(e.target.value)}
                    className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Phone / WhatsApp"
                      value={newVendorPhone}
                      onChange={(e) => setNewVendorPhone(e.target.value)}
                      className="w-1/2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none"
                    />
                    <button
                      onClick={handleAddVendor}
                      className="w-1/2 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xs cursor-pointer shadow-md transition"
                    >
                      Map Vendor
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. STAFF TAB */}
        {activeTab === "staff" && (
          <div className="space-y-6">
            <div className="p-6 border border-zinc-850 bg-[#121214]/40 rounded-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-900">
                <div>
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-2">
                    <UserCheck size={15} className="text-purple-400" />
                    Account Staff &amp; Crew Allocations
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1">Assign internal workspace team members and on-site event managers.</p>
                </div>

                <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300">
                  {staffAllocations.length} Active Crew
                </span>
              </div>

              {/* Staff Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
                {staffAllocations.length === 0 ? (
                  <div className="col-span-2 text-center py-10 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
                    <UserCheck size={22} className="mx-auto text-zinc-600 mb-1" />
                    <span className="text-xs text-zinc-400 font-bold block">No staff members allocated yet</span>
                    <span className="text-[11px] text-zinc-500">Allocate workspace members or dedicated event runners below.</span>
                  </div>
                ) : (
                  staffAllocations.map((member) => (
                    <div key={member.id} className="p-4 border border-zinc-850 bg-zinc-950/30 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-purple-950/40 border border-purple-800/40 flex items-center justify-center text-purple-300 font-black text-xs">
                          {member.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <span className="text-[9px] text-purple-400 block uppercase tracking-wider">{member.role}</span>
                          <span className="text-zinc-100 font-extrabold text-xs mt-0.5 block">{member.name}</span>
                          {member.phone && <span className="text-[10px] text-zinc-500 font-normal">{member.phone}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteStaff(member.id, member.name)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 cursor-pointer"
                        title="Unassign"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add / Allocate Staff Form */}
              <div className="p-4 bg-zinc-950/50 border border-zinc-850 rounded-xl space-y-3">
                <span className="text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider block">Allocate Crew Member</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {teamMembers.length > 0 ? (
                    <select
                      value={newStaffName}
                      onChange={(e) => {
                        setNewStaffName(e.target.value);
                        const member = teamMembers.find(m => `${m.firstName} ${m.lastName}`.trim() === e.target.value);
                        if (member?.phone) setNewStaffPhone(member.phone);
                      }}
                      className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none"
                    >
                      <option value="">-- Select Team Member --</option>
                      {teamMembers.map(m => (
                        <option key={m.id} value={`${m.firstName} ${m.lastName}`.trim()}>
                          {m.firstName} {m.lastName} ({m.role})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Staff Member Name *"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none"
                    />
                  )}

                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value)}
                    className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none"
                  >
                    {STAFF_ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Phone Number (Optional)"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none"
                  />

                  <button
                    onClick={handleAddStaff}
                    className="py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xs cursor-pointer shadow-md transition"
                  >
                    + Assign to Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. BUDGET TAB */}
        {activeTab === "budget" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-semibold">
              <div className="lg:col-span-2 p-6 border border-zinc-850 bg-[#121214]/40 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest pb-2 border-b border-zinc-900">
                  Operational Cost Ledger
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-zinc-950/40 rounded-xl border border-zinc-850">
                    <span className="text-[9px] text-zinc-500 block uppercase font-bold">Total Budget</span>
                    <span className="text-lg font-mono font-black text-zinc-100 mt-1 block">
                      ₹{editBudget.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-4 bg-zinc-950/40 rounded-xl border border-zinc-850">
                    <span className="text-[9px] text-zinc-500 block uppercase font-bold">Committed Costs</span>
                    <span className="text-lg font-mono font-black text-purple-400 mt-1 block">
                      ₹{totalCommittedCosts.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-zinc-500 block mt-0.5">
                      Vendors: ₹{totalVendorCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-4 bg-zinc-950/40 rounded-xl border border-zinc-850">
                    <span className="text-[9px] text-zinc-500 block uppercase font-bold">Net Profit Margin</span>
                    <span className={cn(
                      "text-lg font-mono font-black mt-1 block",
                      budgetPerformance.remaining >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      ₹{budgetPerformance.remaining.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Gauge */}
              <div className="lg:col-span-1 p-6 border border-zinc-850 bg-[#121214]/40 rounded-2xl flex flex-col justify-between space-y-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Budget Utilization</h3>
                <div className="relative flex items-center justify-center py-4">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="#1c1c1f" strokeWidth="6" fill="transparent" />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke={budgetPerformance.percentUsed > 100 ? "#f43f5e" : "#8b5cf6"}
                      strokeWidth="6"
                      fill="transparent"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 * Math.max(0, 1 - Math.min(1, budgetPerformance.percentUsed / 100))}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="font-mono text-base font-black text-white">{Math.round(budgetPerformance.percentUsed)}%</span>
                    <span className="text-[8px] text-zinc-500 block uppercase">Utilized</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 text-center">
                  {budgetPerformance.percentUsed > 100 ? "⚠️ Event is currently over allocated budget" : "Healthy profit margin maintained"}
                </p>
              </div>
            </div>

            {/* Additional Operational Expenses Line Items */}
            <div className="p-6 border border-zinc-850 bg-[#121214]/40 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest pb-2 border-b border-zinc-900">
                Additional Operational Expenses (Non-Vendor)
              </h3>

              <div className="space-y-2">
                {additionalExpenses.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic py-2">No additional operational expenses logged.</p>
                ) : (
                  additionalExpenses.map(exp => (
                    <div key={exp.id} className="p-3 bg-zinc-950/30 border border-zinc-850 rounded-xl flex items-center justify-between text-xs font-semibold">
                      <div>
                        <span className="text-zinc-200 font-bold block">{exp.title}</span>
                        <span className="text-[10px] text-zinc-500">{exp.category} • {exp.date}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-zinc-200">₹{exp.amount.toLocaleString()}</span>
                        <button onClick={() => handleDeleteExpense(exp.id)} className="text-zinc-500 hover:text-rose-400">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Expense Form */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                <input
                  type="text"
                  placeholder="Expense Title (e.g. Police NOC, Generator Fuel)"
                  value={newExpTitle}
                  onChange={(e) => setNewExpTitle(e.target.value)}
                  className="sm:col-span-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Amount (INR)"
                  value={newExpAmount}
                  onChange={(e) => setNewExpAmount(e.target.value)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none"
                />
                <button
                  onClick={handleAddExpense}
                  className="py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs cursor-pointer"
                >
                  + Add Expense
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 8. INVOICES TAB */}
        {activeTab === "invoices" && (
          <div className="space-y-6">
            <div className="p-6 border border-zinc-850 bg-[#121214]/40 rounded-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-900">
                <div>
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={15} className="text-purple-400" />
                    Event Invoices &amp; Tax Billing Records
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1">Generate GST invoices for client deposits and milestones.</p>
                </div>

                <button
                  onClick={() => setShowInvoiceModal(!showInvoiceModal)}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition"
                >
                  <Plus size={14} />
                  {showInvoiceModal ? "Close Form" : "Create New Invoice"}
                </button>
              </div>

              {/* Create Invoice Drawer */}
              {showInvoiceModal && (
                <div className="p-4 bg-zinc-950/60 border border-purple-500/30 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-purple-300 block">Generate Event Invoice</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Invoice Title (e.g. Booking Advance 30%)"
                      value={newInvTitle}
                      onChange={(e) => setNewInvTitle(e.target.value)}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Subtotal Amount (INR)"
                      value={newInvAmount}
                      onChange={(e) => setNewInvAmount(e.target.value)}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none"
                    />
                    <input
                      type="date"
                      value={newInvDueDate}
                      onChange={(e) => setNewInvDueDate(e.target.value)}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs text-zinc-300 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newInvIncludeGst}
                        onChange={(e) => setNewInvIncludeGst(e.target.checked)}
                        className="rounded accent-purple-600 cursor-pointer"
                      />
                      Apply 18% GST (CGST 9% + SGST 9%)
                    </label>

                    <div className="flex gap-2">
                      <button onClick={() => setShowInvoiceModal(false)} className="px-3 py-1 bg-zinc-900 text-zinc-400 rounded-lg text-xs">
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateInvoice}
                        className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs cursor-pointer"
                      >
                        Generate Invoice
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Invoices List */}
              <div className="space-y-3">
                {invoices.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20 space-y-2">
                    <FileText size={22} className="mx-auto text-zinc-600" />
                    <span className="text-xs text-zinc-300 font-bold block">No invoices generated for this event yet</span>
                    <span className="text-[11px] text-zinc-500">Click "Create New Invoice" to generate an official GST billing record.</span>
                  </div>
                ) : (
                  invoices.map((inv) => (
                    <div key={inv.id} className="p-4 border border-zinc-850 bg-zinc-950/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-semibold text-xs">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-purple-400 font-black text-xs">{inv.invoiceNumber}</span>
                          <span className="text-zinc-100 font-bold">{inv.title}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1">
                          Base: ₹{inv.subtotal.toLocaleString()} • GST ({inv.gstRate}%): ₹{inv.gstAmount.toLocaleString()} • Due: {inv.dueDate}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="font-mono font-bold text-sm text-zinc-100">₹{inv.totalAmount.toLocaleString()}</span>
                        <button
                          onClick={() => handleToggleInvoiceStatus(inv.id)}
                          className={cn(
                            "text-[9px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer transition select-none",
                            inv.status === "CLEARED" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                            inv.status === "SENT" && "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
                            inv.status === "DRAFT" && "border-zinc-700 bg-zinc-800/40 text-zinc-400"
                          )}
                          title="Click to cycle status: Draft -> Sent -> Cleared"
                        >
                          {inv.status} ↺
                        </button>
                        <button
                          onClick={() => setViewInvoice(inv)}
                          className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 hover:text-white"
                          title="Preview Invoice"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 9. PAYMENTS TAB */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <div className="p-6 border border-zinc-850 bg-[#121214]/40 rounded-2xl space-y-6 font-semibold">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-900">
                <div>
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-2">
                    <CreditCard size={15} className="text-purple-400" />
                    Payment Milestones Ledger
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1">Track advance booking, interim disbursements, and final settlements.</p>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold font-mono">
                    Received: ₹{paymentMilestones.filter(m => m.status === "RECEIVED").reduce((s, m) => s + m.amount, 0).toLocaleString()}
                  </span>
                  <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl font-bold font-mono">
                    Pending: ₹{paymentMilestones.filter(m => m.status === "PENDING").reduce((s, m) => s + m.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Milestones list */}
              <div className="space-y-3">
                {paymentMilestones.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
                    <CreditCard size={22} className="mx-auto text-zinc-600 mb-1" />
                    <span className="text-xs text-zinc-400 font-bold block">No payment milestones added yet</span>
                    <span className="text-[11px] text-zinc-500">Log client milestones below to track advance collections.</span>
                  </div>
                ) : (
                  paymentMilestones.map((milestone) => (
                    <div key={milestone.id} className="p-3.5 border border-zinc-850 bg-zinc-950/30 rounded-xl flex items-center justify-between gap-4">
                      <div>
                        <span className="text-zinc-100 font-bold text-xs block">{milestone.title}</span>
                        <div className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-2">
                          <span>Amount: ₹{milestone.amount.toLocaleString()}</span>
                          <span>• Due: {milestone.dueDate}</span>
                          <span>• Mode: {milestone.method}</span>
                          {milestone.referenceNo && <span>• Ref: {milestone.referenceNo}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleMilestone(milestone.id)}
                          className={cn(
                            "px-3 py-1 text-[9px] uppercase tracking-wider rounded-lg font-bold border transition cursor-pointer",
                            milestone.status === "RECEIVED" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-zinc-800 text-zinc-400 hover:text-white"
                          )}
                        >
                          {milestone.status === "RECEIVED" ? "Cleared ✓" : "Mark Cleared"}
                        </button>
                        <button
                          onClick={() => handleDeleteMilestone(milestone.id, milestone.title)}
                          className="p-1 text-zinc-500 hover:text-rose-400"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Milestone Form */}
              <div className="p-4 bg-zinc-950/50 border border-zinc-850 rounded-xl space-y-3">
                <span className="text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider block">Add Payment Milestone</span>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <input
                    type="text"
                    placeholder="Milestone (e.g. 30% Booking Advance)"
                    value={newMileTitle}
                    onChange={(e) => setNewMileTitle(e.target.value)}
                    className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Amount (INR)"
                    value={newMileAmount}
                    onChange={(e) => setNewMileAmount(e.target.value)}
                    className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none"
                  />
                  <input
                    type="date"
                    value={newMileDue}
                    onChange={(e) => setNewMileDue(e.target.value)}
                    className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none"
                  />
                  <select
                    value={newMileMethod}
                    onChange={(e) => setNewMileMethod(e.target.value as any)}
                    className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none"
                  >
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="CASH">Cash</option>
                    <option value="RAZORPAY">Razorpay</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                  <button
                    onClick={handleAddMilestone}
                    className="py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xs cursor-pointer shadow-md transition"
                  >
                    + Add Milestone
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 10. GALLERY TAB */}
        {activeTab === "gallery" && (
          <div className="space-y-6">
            <div className="p-6 border border-zinc-850 bg-[#121214]/40 rounded-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-900">
                <div>
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={15} className="text-purple-400" />
                    Moodboard &amp; Photo Assets Masonry
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1">Upload 3D stage layouts, floral designs, venue photos, and moodboards.</p>
                </div>

                <button
                  onClick={() => setShowAddAssetModal(!showAddAssetModal)}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition"
                >
                  <Plus size={14} />
                  {showAddAssetModal ? "Close Uploader" : "Upload Visual Asset"}
                </button>
              </div>

              {/* Upload Asset Drawer */}
              {showAddAssetModal && (
                <div className="p-4 bg-zinc-950/60 border border-purple-500/30 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-purple-300 block">Add Event Visual / Layout Asset</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Asset Title (e.g. Mandap Floral Blueprint)"
                      value={newAssetTitle}
                      onChange={(e) => setNewAssetTitle(e.target.value)}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none"
                    />
                    <select
                      value={newAssetCategory}
                      onChange={(e) => setNewAssetCategory(e.target.value)}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none"
                    >
                      <option value="Decor">Decor & Florals</option>
                      <option value="Stage">Stage & AV</option>
                      <option value="Venue">Venue Space</option>
                      <option value="Floorplan">Floorplan / Seating</option>
                      <option value="Moodboard">Color Moodboard</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                        <Upload size={13} />
                        Choose File
                        <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
                      </label>
                      <span className="text-[10px] text-zinc-500">or enter image URL below</span>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Image URL (https://... or choose a local file above)"
                    value={newAssetUrl}
                    onChange={(e) => setNewAssetUrl(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none font-mono"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => setShowAddAssetModal(false)} className="px-3 py-1 bg-zinc-900 text-zinc-400 rounded-lg text-xs">
                      Cancel
                    </button>
                    <button
                      onClick={handleAddGalleryAsset}
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs cursor-pointer"
                    >
                      Save Asset
                    </button>
                  </div>
                </div>
              )}

              {/* Gallery Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {galleryAssets.length === 0 ? (
                  <div className="col-span-full text-center py-12 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/20 space-y-2">
                    <ImageIcon size={26} className="mx-auto text-zinc-600" />
                    <span className="text-xs text-zinc-300 font-bold block">No visual assets uploaded yet</span>
                    <span className="text-[11px] text-zinc-500">Click "Upload Visual Asset" to upload design blueprints and inspiration photos.</span>
                  </div>
                ) : (
                  galleryAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="group relative aspect-video bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm"
                    >
                      <img
                        src={asset.url}
                        alt={asset.title}
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-105 cursor-pointer"
                        onClick={() => setLightboxImage(asset)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition p-2.5 flex flex-col justify-end">
                        <span className="text-white font-bold text-xs truncate">{asset.title}</span>
                        <span className="text-[9px] text-purple-300 font-semibold">{asset.category}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteAsset(asset.id, asset.title); }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        title="Delete asset"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 11. NOTES TAB */}
        {activeTab === "notes" && (
          <div className="p-6 border border-zinc-855 bg-[#121214]/40 rounded-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Pin size={14} className="text-purple-400" />
                Operational Scratchpad &amp; Handover Notes
              </h3>
              <div className="relative w-44">
                <Search size={11} className="absolute left-2.5 top-2.5 text-zinc-500" />
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
                placeholder="Type a new operational note or handover instruction..."
                rows={3}
                className="w-full p-2.5 bg-zinc-900 border border-zinc-850 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500 font-semibold"
              />
              <button
                onClick={handleAddNote}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold ml-auto block cursor-pointer text-xs"
              >
                + Add Note
              </button>
            </div>

            <div className="space-y-3 pt-2">
              {richNotes.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-6">No operational notes yet.</p>
              ) : (
                richNotes
                  .filter(n => n.text.toLowerCase().includes(noteSearch.toLowerCase()))
                  .map((n) => (
                    <div key={n.id} className="p-3.5 border border-zinc-850 rounded-xl bg-zinc-950/20 text-xs flex justify-between items-start gap-4">
                      <div>
                        <p className="text-zinc-200 font-semibold leading-relaxed whitespace-pre-wrap">{n.text}</p>
                        <span className="text-[9px] text-zinc-500 font-mono block pt-2">{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                      <button onClick={() => handleDeleteNote(n.id)} className="text-zinc-500 hover:text-rose-400 p-1">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* 12. ACTIVITY TAB */}
        {activeTab === "activity" && (
          <div className="p-6 border border-zinc-850 bg-[#121214]/40 rounded-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-900">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-2">
                <Activity size={15} className="text-purple-400" />
                Live Event Audit Trail &amp; Execution Feed
              </h3>
              <span className="text-xs font-mono text-zinc-400">{activityFeed.length} Action Logs</span>
            </div>

            {/* Manual Activity Log Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Log an on-site operational milestone (e.g. Client signed off on floral mandap design)..."
                value={manualLogText}
                onChange={(e) => setManualLogText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && manualLogText.trim()) {
                    logActivityAction(manualLogText.trim(), "MANUAL");
                    setManualLogText("");
                    addToast("Operational log recorded", "success");
                  }
                }}
                className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={() => {
                  if (manualLogText.trim()) {
                    logActivityAction(manualLogText.trim(), "MANUAL");
                    setManualLogText("");
                    addToast("Operational log recorded", "success");
                  }
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Log Entry
              </button>
            </div>

            {/* Dynamic Activity List */}
            <div className="relative pl-5 border-l border-zinc-800 space-y-5 py-2">
              {activityFeed.length === 0 ? (
                <div className="text-xs text-zinc-500">
                  <span>Event workspace provisioned. Future activities (vendor mappings, status updates, invoice generation) will record here in realtime.</span>
                </div>
              ) : (
                activityFeed.map((act) => (
                  <div key={act.id} className="relative text-xs">
                    <div className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-purple-500 ring-4 ring-[#0c0c0e]" />
                    <div className="space-y-0.5">
                      <span className="text-zinc-200 font-bold block">{act.text}</span>
                      <span className="text-[10px] text-zinc-500 font-mono block">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • {new Date(act.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* Invoice Viewer Modal */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121214] border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-5 text-zinc-200">
            <div className="flex justify-between items-start border-b border-zinc-800 pb-3">
              <div>
                <span className="font-mono text-purple-400 font-bold text-sm">{viewInvoice.invoiceNumber}</span>
                <h3 className="font-extrabold text-base text-white">{viewInvoice.title}</h3>
              </div>
              <button onClick={() => setViewInvoice(null)} className="text-zinc-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-zinc-950/50 rounded-xl space-y-2 text-xs font-semibold">
              <div className="flex justify-between text-zinc-400">
                <span>Event:</span>
                <span className="text-white">{event.name}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Due Date:</span>
                <span className="text-white">{viewInvoice.dueDate}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Payment Status:</span>
                <span className="text-emerald-400 font-bold uppercase">{viewInvoice.status}</span>
              </div>
              <div className="border-t border-zinc-800 pt-2 flex justify-between">
                <span>Subtotal:</span>
                <span>₹{viewInvoice.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>GST ({viewInvoice.gstRate}%):</span>
                <span>₹{viewInvoice.gstAmount.toLocaleString()}</span>
              </div>
              <div className="border-t border-zinc-800 pt-2 flex justify-between text-sm font-bold text-white">
                <span>Total Amount:</span>
                <span className="text-purple-400">₹{viewInvoice.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={13} /> Print Invoice
              </button>
              <button
                onClick={() => setViewInvoice(null)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] space-y-2">
            <img src={lightboxImage.url} alt={lightboxImage.title} className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl" />
            <div className="flex justify-between items-center text-white text-xs px-2">
              <span className="font-bold">{lightboxImage.title} ({lightboxImage.category})</span>
              <button onClick={() => setLightboxImage(null)} className="text-zinc-400 hover:text-white font-bold">
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
