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
  AlertCircle,
  FolderKanban,
  FileText,
  UserPlus,
  Check,
  Eye,
  Sliders,
  X,
  Truck,
  Box,
  Download,
  Star,
  Settings,
  Shield,
  Trash2,
  Wrench,
  Fuel,
  Compass,
  FileCheck,
  Zap
} from "lucide-react";
import KpiCard from "../dashboard/KpiCard";
import EventCard from "./EventCard";
import { cn } from "@/lib/utils";
import GlobalEmptyState from "../ui/EmptyState";
import OfflineCheckInWidget from "./OfflineCheckInWidget";
import { CardSkeleton, TableSkeleton, KanbanSkeleton, CalendarSkeleton } from "../ui/skeletons";
import { useToastStore } from "@/lib/toastStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from "recharts";

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

interface Resource {
  id: string;
  name: string;
  role: string;
  skills: string[];
  experience: string;
  contact: string;
  email: string;
  rating: number;
  performanceScore: number;
  utilization: number;
  status: "AVAILABLE" | "BOOKED" | "LEAVE" | "UNAVAILABLE";
  emergencyContact: string;
  pastEventsCount: number;
  upcomingEventsCount: number;
  availability: Record<string, "Available" | "Booked" | "Leave" | "Unavailable">;
}

interface Vendor {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  category: string;
  gst: string;
  pan: string;
  address: string;
  bankName: string;
  accountNo: string;
  upiId: string;
  performance: number;
  reviewsCount: number;
  contractsCount: number;
  status: "ACTIVE" | "PENDING" | "INACTIVE";
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  reserved: number;
  damaged: number;
  returned: number;
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "UNDER_MAINTENANCE";
}

interface Vehicle {
  id: string;
  name: string;
  plateNumber: string;
  driver: string;
  fuel: number;
  trips: number;
  status: "AVAILABLE" | "IN_TRANSIT" | "MAINTENANCE";
}

const EVENT_TYPES = [
  { key: "WEDDING", label: "Wedding", color: "border-pink-500/20 bg-pink-500/5 text-pink-400" },
  { key: "BIRTHDAY", label: "Birthday", color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-455" },
  { key: "ENGAGEMENT", label: "Engagement", color: "border-purple-500/20 bg-purple-500/5 text-purple-400" },
  { key: "CORPORATE", label: "Corporate", color: "border-blue-500/20 bg-blue-500/5 text-blue-400" }
];

const COLUMNS = [
  { id: "PLANNING", label: "Planning", color: "border-zinc-700/50 bg-zinc-950/20 text-zinc-450" },
  { id: "CONFIRMED", label: "Confirmed", color: "border-blue-500/20 bg-blue-500/5 text-blue-400" },
  { id: "IN_PREPARATION", label: "Preparation", color: "border-purple-500/20 bg-purple-550/5 text-purple-400" },
  { id: "IN_PROGRESS", label: "In Progress", color: "border-amber-500/20 bg-amber-500/5 text-amber-400" },
  { id: "COMPLETED", label: "Completed", color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-455" }
];

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planning",
  CONFIRMED: "Confirmed",
  IN_PREPARATION: "In Preparation",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled"
};

const STATUS_COLORS: Record<string, string> = {
  PLANNING: "border-zinc-550/20 bg-zinc-500/5 text-zinc-400",
  CONFIRMED: "border-blue-500/20 bg-blue-500/5 text-blue-400",
  IN_PREPARATION: "border-purple-500/20 bg-purple-550/5 text-purple-400",
  IN_PROGRESS: "border-amber-500/20 bg-amber-500/5 text-amber-400",
  COMPLETED: "border-emerald-500/20 bg-emerald-500/5 text-emerald-455",
  CANCELLED: "border-red-500/20 bg-red-550/5 text-red-400"
};

export default function EventsDashboard() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);
  const { completeStep } = useOnboardingStore();

  // Main operational console categories
  const [mainCategory, setMainCategory] = useState<"pipelines" | "resources" | "vendors" | "inventory" | "vehicles">("pipelines");

  // Layout Tab selection: remembered in local storage
  const [activeTab, setActiveTab] = useState<"dashboard" | "grid" | "list" | "kanban" | "calendar" | "timeline" | "agenda">("dashboard");
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

  // Detail Drawer States
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  // Form states for adding items
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    company: "", contact: "", email: "", phone: "", category: "Floral",
    gst: "", pan: "", address: "", bankName: "", accountNo: "", upiId: ""
  });

  // Calendar States
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarMode, setCalendarMode] = useState<"month" | "week" | "day">("month");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTab = localStorage.getItem("events_active_tab");
      if (savedTab && ["dashboard", "grid", "list", "kanban", "calendar", "timeline", "agenda"].includes(savedTab)) {
        setActiveTab(savedTab as any);
      }
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

  // Persistent Mock databases saved in state/local storage
  const [resources, setResources] = useState<Resource[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("eventos_resources_db");
      if (saved) return JSON.parse(saved);
    }
    return [
      {
        id: "res-1",
        name: "Rahul Sharma",
        role: "Photographer",
        skills: ["Candid Portraiture", "Drone Capture", "Adobe Lightroom"],
        experience: "6 Years",
        contact: "+91 98765 43210",
        email: "rahul.sharma@eventos.com",
        rating: 4.9,
        performanceScore: 96,
        utilization: 82,
        status: "AVAILABLE",
        emergencyContact: "Anita Sharma (Wife) - +91 98765 43219",
        pastEventsCount: 42,
        upcomingEventsCount: 3,
        availability: { "2026-07-05": "Available", "2026-07-06": "Booked", "2026-07-07": "Available", "2026-07-08": "Leave" }
      },
      {
        id: "res-2",
        name: "Sneha Varma",
        role: "Decor Designer",
        skills: ["Floral Scaffolding", "Thematic Lighting", "3D SketchUp"],
        experience: "8 Years",
        contact: "+91 99988 77665",
        email: "sneha.varma@eventos.com",
        rating: 4.8,
        performanceScore: 94,
        utilization: 88,
        status: "BOOKED",
        emergencyContact: "Vikram Varma (Husband) - +91 99988 77660",
        pastEventsCount: 78,
        upcomingEventsCount: 6,
        availability: { "2026-07-05": "Booked", "2026-07-06": "Booked", "2026-07-07": "Booked", "2026-07-08": "Available" }
      },
      {
        id: "res-3",
        name: "Amit Patel",
        role: "DJ & Sound Engineer",
        skills: ["Live Mixing", "Acoustics Optimization", "JBL Line Array"],
        experience: "4 Years",
        contact: "+91 95555 44433",
        email: "amit.patel@eventos.com",
        rating: 4.6,
        performanceScore: 90,
        utilization: 64,
        status: "AVAILABLE",
        emergencyContact: "Kiran Patel (Father) - +91 95555 44430",
        pastEventsCount: 29,
        upcomingEventsCount: 2,
        availability: { "2026-07-05": "Available", "2026-07-06": "Available", "2026-07-07": "Leave", "2026-07-08": "Available" }
      },
      {
        id: "res-4",
        name: "Priya Nair",
        role: "Makeup Artist",
        skills: ["Bridal Glam", "HD & Airbrush Techniques", "Kryolan Palette"],
        experience: "5 Years",
        contact: "+91 92222 33344",
        email: "priya.nair@eventos.com",
        rating: 4.9,
        performanceScore: 98,
        utilization: 91,
        status: "LEAVE",
        emergencyContact: "Suresh Nair (Brother) - +91 92222 33340",
        pastEventsCount: 51,
        upcomingEventsCount: 4,
        availability: { "2026-07-05": "Leave", "2026-07-06": "Leave", "2026-07-07": "Available", "2026-07-08": "Available" }
      }
    ];
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("eventos_vendors_db");
      if (saved) return JSON.parse(saved);
    }
    return [
      {
        id: "v-1",
        company: "Monarch Caterers Ltd",
        contact: "Jagdish Prasad",
        email: "contact@monarchcaterers.in",
        phone: "+91 98220 11223",
        category: "Catering",
        gst: "27AAAAA1111A1Z1",
        pan: "AAAAA1111A",
        address: "42, Industrial Estate, Worli, Mumbai - 400018",
        bankName: "HDFC Bank",
        accountNo: "50100200300405",
        upiId: "monarch@upi",
        performance: 92,
        reviewsCount: 34,
        contractsCount: 12,
        status: "ACTIVE"
      },
      {
        id: "v-2",
        company: "Starlight Sound & Lights",
        contact: "Manish Shah",
        email: "info@starlightops.net",
        phone: "+91 98330 44556",
        category: "Lighting",
        gst: "27BBBBB2222B2Z2",
        pan: "BBBBB2222B",
        address: "71, Link Road, Andheri West, Mumbai - 400053",
        bankName: "ICICI Bank",
        accountNo: "000405006007",
        upiId: "starlight@upi",
        performance: 95,
        reviewsCount: 48,
        contractsCount: 20,
        status: "ACTIVE"
      },
      {
        id: "v-3",
        company: "Green Meadows Florals",
        contact: "Radha Krishnan",
        email: "orders@greenmeadows.com",
        phone: "+91 91112 22334",
        category: "Floral",
        gst: "27CCCCC3333C3Z3",
        pan: "CCCCC3333C",
        address: "Flower Market Road, Dadar, Mumbai - 400028",
        bankName: "State Bank of India",
        accountNo: "300400500600",
        upiId: "greenmeadows@upi",
        performance: 89,
        reviewsCount: 22,
        contractsCount: 8,
        status: "ACTIVE"
      }
    ];
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("eventos_inventory_db");
      if (saved) return JSON.parse(saved);
    }
    return [
      { id: "inv-1", name: "Chesterfield Velvet Sofa", category: "Furniture", stock: 12, reserved: 8, damaged: 1, returned: 6, status: "IN_STOCK" },
      { id: "inv-2", name: "LED Par Lights (54x3W)", category: "Lighting", stock: 150, reserved: 145, damaged: 4, returned: 80, status: "LOW_STOCK" },
      { id: "inv-3", name: "JBL VRX Line Array Speakers", category: "Audio", stock: 16, reserved: 12, damaged: 0, returned: 12, status: "IN_STOCK" },
      { id: "inv-4", name: "Hanging Glass Floral Orbs", category: "Decor", stock: 80, reserved: 85, damaged: 3, returned: 40, status: "LOW_STOCK" },
      { id: "inv-5", name: "Silent Diesel Generator (125kVA)", category: "Generators", stock: 4, reserved: 5, damaged: 0, returned: 3, status: "UNDER_MAINTENANCE" }
    ];
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("eventos_vehicles_db");
      if (saved) return JSON.parse(saved);
    }
    return [
      { id: "veh-1", name: "Mahindra Bolero Pickup", plateNumber: "MH-02-FL-1024", driver: "Vikram Jadhav", fuel: 82, trips: 142, status: "AVAILABLE" },
      { id: "veh-2", name: "Tata Ultra Truck (14Ft)", plateNumber: "MH-43-GQ-8095", driver: "Satish Kadam", fuel: 45, trips: 289, status: "IN_TRANSIT" },
      { id: "veh-3", name: "Force Traveller (Cargo)", plateNumber: "MH-12-PA-4423", driver: "Ramesh Shinde", fuel: 12, trips: 78, status: "MAINTENANCE" }
    ];
  });

  // Track operational assignments (connects resources/vendors/vehicles/inventory to events)
  const [assignments, setAssignments] = useState<Record<string, { resources: string[]; vendors: string[]; vehicles: string[] }>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("eventos_allocations_db");
      if (saved) return JSON.parse(saved);
    }
    return {};
  });

  // Persist local storage hooks
  useEffect(() => {
    localStorage.setItem("eventos_resources_db", JSON.stringify(resources));
    localStorage.setItem("eventos_vendors_db", JSON.stringify(vendors));
    localStorage.setItem("eventos_inventory_db", JSON.stringify(inventory));
    localStorage.setItem("eventos_vehicles_db", JSON.stringify(vehicles));
    localStorage.setItem("eventos_allocations_db", JSON.stringify(assignments));
  }, [resources, vendors, inventory, vehicles, assignments]);

  // Conflict warning flags calculation
  const conflictWarnings = useMemo(() => {
    const warnings: string[] = [];

    // 1. Double booking warning (same resource assigned to two active events on same date)
    const resourceDateMap: Record<string, string[]> = {}; // resourceId -> list of dates
    const activeEventsList = events.filter(e => e.status !== "COMPLETED" && e.status !== "CANCELLED");

    activeEventsList.forEach(ev => {
      const dateStr = ev.startDate.split("T")[0];
      const allocs = assignments[ev.id]?.resources || [];
      allocs.forEach(resId => {
        const key = `${resId}_${dateStr}`;
        if (!resourceDateMap[key]) {
          resourceDateMap[key] = [];
        }
        resourceDateMap[key].push(ev.name);
      });
    });

    Object.entries(resourceDateMap).forEach(([key, evNames]) => {
      if (evNames.length > 1) {
        const resId = key.split("_")[0];
        const date = key.split("_")[1];
        const res = resources.find(r => r.id === resId);
        warnings.push(`Double Booking Detected: ${res?.name || "Resource"} is assigned to multiple events (${evNames.join(", ")}) on ${date}!`);
      }
    });

    // 2. Inventory shortage warning (reserved > stock)
    inventory.forEach(item => {
      if (item.reserved > item.stock) {
        warnings.push(`Inventory Shortage Alert: '${item.name}' has ${item.reserved} reservations but only ${item.stock} in stock!`);
      }
    });

    // 3. Vehicle shortage/maintenance conflict
    vehicles.forEach(veh => {
      if (veh.status === "MAINTENANCE") {
        // Check if assigned anywhere
        Object.entries(assignments).forEach(([evId, alloc]) => {
          if (alloc.vehicles.includes(veh.id)) {
            const evName = events.find(e => e.id === evId)?.name || "Active Event";
            warnings.push(`Vehicle Conflict Warning: Vehicle '${veh.name}' (${veh.plateNumber}) is in MAINTENANCE but allocated to '${evName}'!`);
          }
        });
      }
    });

    return warnings;
  }, [events, assignments, resources, inventory, vehicles]);

  // Search filter
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

  // KPIs
  const kpiData = useMemo(() => {
    const active = events.filter((e) => e.status === "IN_PROGRESS").length;
    const upcoming = events.filter((e) => ["PLANNING", "CONFIRMED", "IN_PREPARATION"].includes(e.status)).length;
    const completed = events.filter((e) => e.status === "COMPLETED").length;
    const cancelled = events.filter((e) => e.status === "CANCELLED").length;

    const totalBudget = events.reduce((sum, e) => sum + (e.budget || 0), 0);
    const budgetUsed = events
      .filter(e => e.status === "COMPLETED" || e.status === "IN_PROGRESS")
      .reduce((sum, e) => sum + (e.budget || 0), 0) * 0.85;
    const budgetRemaining = totalBudget - budgetUsed;

    return { active, upcoming, completed, cancelled, totalBudget, budgetUsed, budgetRemaining };
  }, [events]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: string }) => {
      const response = await api.patch(`/events/${eventId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      addToast("Event workflow status updated successfully ✓", "success");
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
      addToast("New event workspace provisioned successfully", "success");
      completeStep("schedule_event");
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error?.message || "Failed to provision event workspace.");
    }
  });

  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    // Check if dragging onto Kanban column
    if (destination.droppableId !== source.droppableId && COLUMNS.some(c => c.id === destination.droppableId)) {
      updateStatusMutation.mutate({ eventId: draggableId, status: destination.droppableId });
      return;
    }

    // Check if dragging resource onto event for allocation
    if (destination.droppableId.startsWith("event-assign-")) {
      const eventId = destination.droppableId.replace("event-assign-", "");
      const resourceId = draggableId;

      const current = assignments[eventId] || { resources: [], vendors: [], vehicles: [] };
      if (current.resources.includes(resourceId)) {
        addToast("Resource is already allocated to this event pipeline.", "info");
        return;
      }

      setAssignments(prev => ({
        ...prev,
        [eventId]: {
          ...current,
          resources: [...current.resources, resourceId]
        }
      }));
      addToast(`Allocated resource to event successfully!`, "success");
    }
  };

  const removeAllocation = (eventId: string, type: "resources" | "vendors" | "vehicles", itemId: string) => {
    const current = assignments[eventId];
    if (!current) return;
    setAssignments(prev => ({
      ...prev,
      [eventId]: {
        ...current,
        [type]: current[type].filter(id => id !== itemId)
      }
    }));
    addToast("Removed allocation successfully.", "info");
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
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      location: formLocation,
      venueName: formVenueName,
      venueAddress: formVenueAddress,
      guestCount: Number(formGuestCount) || 100,
      budget: Number(formBudget) || 150000,
      notes: JSON.stringify({
        notesText: formNotes,
        dressCode: "Black Tie",
        theme: "Classic Garden",
        checklist: [],
        tasks: [],
        resources: []
      })
    });
  };

  const handleVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newVendor: Vendor = {
      id: `v-${Math.random().toString(36).substring(7)}`,
      ...vendorForm,
      performance: 100,
      reviewsCount: 0,
      contractsCount: 0,
      status: "ACTIVE"
    };
    setVendors(prev => [...prev, newVendor]);
    setShowVendorModal(false);
    setVendorForm({
      company: "", contact: "", email: "", phone: "", category: "Floral",
      gst: "", pan: "", address: "", bankName: "", accountNo: "", upiId: ""
    });
    addToast("New vendor logged in database successfully", "success");
  };

  // Calendar Date manipulators
  const handlePrevDate = () => {
    const next = new Date(currentDate);
    if (calendarMode === "month") next.setMonth(next.getMonth() - 1);
    else if (calendarMode === "week") next.setDate(next.getDate() - 7);
    else next.setDate(next.getDate() - 1);
    setCurrentDate(next);
  };

  const handleNextDate = () => {
    const next = new Date(currentDate);
    if (calendarMode === "month") next.setMonth(next.getMonth() + 1);
    else if (calendarMode === "week") next.setDate(next.getDate() + 7);
    else next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  // Filter lists by search query
  const filteredResources = useMemo(() => {
    return resources.filter(res =>
      res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [resources, searchQuery]);

  const filteredVendors = useMemo(() => {
    return vendors.filter(v =>
      v.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [vendors, searchQuery]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [inventory, searchQuery]);

  const exportVendors = (format: "csv" | "json") => {
    const dataStr = format === "json"
      ? JSON.stringify(vendors, null, 2)
      : "Company,Category,Contact,GST,PAN,UPI ID\n" + vendors.map(v => `"${v.company}","${v.category}","${v.contact}","${v.gst}","${v.pan}","${v.upiId}"`).join("\n");

    const blob = new Blob([dataStr], { type: format === "json" ? "application/json" : "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `vendor-directory.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    addToast(`Exported vendor list in ${format.toUpperCase()} format`, "success");
  };

  return (
    <div className="space-y-6 select-none text-zinc-300">

      {/* Category selector row */}
      <div className="flex bg-zinc-900 border border-zinc-850 p-1.5 rounded-2xl text-[10.5px] font-bold uppercase select-none w-full justify-between items-center gap-2 relative">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {([
            { key: "pipelines", label: "Pipelines & Events", icon: FolderKanban },
            { key: "checkin", label: "Venue Check-in (PWA)", icon: Zap },
            { key: "resources", label: "Resource Center", icon: Users },
            { key: "vendors", label: "Partner Vendors", icon: UserCheck },
            { key: "inventory", label: "Prop Inventory", icon: Box },
            { key: "vehicles", label: "Logistics Fleet", icon: Truck }
          ] as const).map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                onClick={() => setMainCategory(cat.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap uppercase text-[10px] font-black tracking-wider",
                  mainCategory === cat.key ? "bg-purple-950/20 text-purple-400 border border-purple-900/40 shadow-sm" : "text-zinc-500 hover:text-zinc-350 border border-transparent"
                )}
              >
                <Icon size={12} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Global Warning Counter indicator */}
        {conflictWarnings.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-red-950/20 border border-red-500/20 rounded-xl text-red-400 font-extrabold text-[9px] animate-pulse">
            <AlertTriangle size={11} /> {conflictWarnings.length} OPERATIONS CONFLICTS
          </div>
        )}
      </div>

      {/* Dynamic Warnings log banner */}
      {conflictWarnings.length > 0 && (
        <div className="p-4 bg-red-950/10 border border-red-900/20 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-red-400">
            <AlertCircle size={14} />
            <span>Active Operational Conflicts Logged ({conflictWarnings.length})</span>
          </div>
          <div className="divide-y divide-red-900/20 max-h-24 overflow-y-auto text-[10px] font-mono text-red-300/80">
            {conflictWarnings.map((warn, idx) => (
              <div key={idx} className="py-1.5 flex items-start gap-2">
                <span className="text-red-500">•</span>
                <p>{warn}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILTER & TOOLBAR BOX */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-900 pb-4">

        {/* Search */}
        <div className="relative w-full max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-550">
            <Search size={13} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${mainCategory === "pipelines" ? "events, venues, bookings..." : mainCategory}...`}
            className="w-full pl-9 pr-4 py-1.5 bg-zinc-950/40 border border-zinc-850 rounded-xl text-xs placeholder-zinc-555 text-zinc-200 focus:outline-none focus:border-purple-650 font-semibold"
          />
        </div>

        {/* View Selection Tabs (Conditional on Category) */}
        <div className="flex flex-wrap items-center gap-4">
          {mainCategory === "pipelines" ? (
            <>
              <div className="flex bg-zinc-950/60 border border-zinc-850 p-0.5 rounded-xl text-[10px] font-bold">
                {[
                  { id: "dashboard", label: "Overview", icon: FolderKanban },
                  { id: "grid", label: "Grid", icon: Grid },
                  { id: "list", label: "List Ledger", icon: List },
                  { id: "kanban", label: "Board", icon: Layers },
                  { id: "calendar", label: "Calendar", icon: CalendarIcon },
                  { id: "timeline", label: "Timeline", icon: Clock },
                  { id: "agenda", label: "Agenda", icon: UserCheck }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id as any)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer font-extrabold uppercase",
                        activeTab === tab.id ? "bg-zinc-800 text-purple-400" : "text-zinc-500 hover:text-zinc-350"
                      )}
                    >
                      <Icon size={11} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-650 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold transition shadow-md active:scale-95 cursor-pointer animate-pulse"
              >
                <Plus size={13} />
                Create Event
              </button>
            </>
          ) : mainCategory === "vendors" ? (
            <div className="flex gap-2">
              <button
                onClick={() => setShowVendorModal(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                <Plus size={12} /> Log Partner Vendor
              </button>
              <button
                onClick={() => exportVendors("csv")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 cursor-pointer"
              >
                <Download size={12} /> Export CSV
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* DragDropContext wraps everything to allow dragging staff onto events */}
      <DragDropContext onDragEnd={handleDragEnd}>
        {/* CATEGORY VIEWS */}
        <div className="min-h-[500px]">
          <AnimatePresence mode="wait">

            {/* B. VENUE CHECK-IN (OFFLINE PWA) */}
            {mainCategory === "checkin" && (
              <motion.div
                key="checkin"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <OfflineCheckInWidget />
              </motion.div>
            )}

            {/* A. EVENTS PIPELINES */}
            {mainCategory === "pipelines" && (
              <motion.div
                key="pipelines"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {isLoading ? (
                  <CalendarSkeleton />
                ) : (
                  <>
                    {/* 1. OVERVIEW */}
                    {activeTab === "dashboard" && (
                      <div className="space-y-6">
                        {/* Stats Summary Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="p-4 border border-zinc-850 bg-[#161618]/30 rounded-2xl flex items-center justify-between hover:border-zinc-700 transition">
                            <div>
                              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Today's Schedule</span>
                              <span className="text-lg font-black text-zinc-200 mt-1 block">{kpiData.active} Active</span>
                            </div>
                            <Clock size={16} className="text-purple-400" />
                          </div>
                          <div className="p-4 border border-zinc-850 bg-[#161618]/30 rounded-2xl flex items-center justify-between hover:border-zinc-700 transition">
                            <div>
                              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Upcoming Events</span>
                              <span className="text-lg font-black text-zinc-200 mt-1 block">{kpiData.upcoming} Booked</span>
                            </div>
                            <CalendarIcon size={16} className="text-blue-400" />
                          </div>
                          <div className="p-4 border border-zinc-850 bg-[#161618]/30 rounded-2xl flex items-center justify-between hover:border-zinc-700 transition">
                            <div>
                              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Budget Expenses</span>
                              <span className="text-lg font-black text-zinc-200 mt-1 block">₹{(kpiData.budgetUsed / 100000).toFixed(1)}L Used</span>
                            </div>
                            <DollarSign size={16} className="text-emerald-450" />
                          </div>
                          <div className="p-4 border border-zinc-850 bg-[#161618]/30 rounded-2xl flex items-center justify-between hover:border-zinc-700 transition">
                            <div>
                              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Remaining Capital</span>
                              <span className="text-lg font-black text-zinc-200 mt-1 block">₹{(kpiData.budgetRemaining / 100000).toFixed(1)}L Free</span>
                            </div>
                            <TrendingUp size={16} className="text-cyan-400" />
                          </div>
                        </div>

                        {/* Operations layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Active Events / Schedule */}
                          <div className="lg:col-span-2 space-y-4">
                            <div className="p-6 border border-zinc-850 bg-[#161618]/30 rounded-2xl space-y-4">
                              <h3 className="text-xs font-black uppercase text-zinc-450 tracking-wider">Active Execution Pipelines</h3>
                              <div className="divide-y divide-zinc-900/60">
                                {filteredEvents.length === 0 ? (
                                  <GlobalEmptyState
                                    icon={CalendarIcon}
                                    title="No events scheduled yet"
                                    description="Create your first event workspace to start managing timelines, venues, and team logistics."
                                    primaryAction={{ label: "Create Event", onClick: () => setShowCreateModal(true) }}
                                  />
                                ) : (
                                  filteredEvents.slice(0, 4).map((e) => (
                                    <div
                                      key={e.id}
                                      onClick={() => router.push(`/events/${e.id}`)}
                                      className="py-3.5 flex justify-between items-center hover:bg-zinc-900/10 px-2 rounded-lg cursor-pointer transition"
                                    >
                                      <div className="space-y-1">
                                        <span className="font-extrabold text-zinc-250 block text-xs">{e.name}</span>
                                        <span className="text-[10px] text-zinc-550 flex items-center gap-1">
                                          <MapPin size={11} /> {e.venueName || "TBA"} • {new Date(e.startDate).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <span className={cn("px-2 py-0.5 border rounded-full text-[8px] font-black uppercase tracking-wider", STATUS_COLORS[e.status])}>
                                        {STATUS_LABELS[e.status]}
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Operational Radar / Resource availability */}
                          <div className="lg:col-span-1 space-y-6">
                            <div className="p-6 border border-zinc-850 bg-[#161618]/30 rounded-2xl space-y-4">
                              <h3 className="text-xs font-black uppercase text-zinc-450 tracking-wider">Operational Radar</h3>
                              <div className="space-y-3 text-xs font-bold">
                                {[
                                  { name: "Main Banquet Hall", status: "Reserved", color: "text-purple-400 bg-purple-950/20" },
                                  { name: "Photographers Roster", status: "Available", color: "text-emerald-450 bg-emerald-950/20" },
                                  { name: "Audio Speakers & DJ Setup", status: "Available", color: "text-emerald-450 bg-emerald-950/20" },
                                  { name: "Catering Roster", status: "Reserved", color: "text-purple-400 bg-purple-950/20" }
                                ].map((res) => (
                                  <div key={res.name} className="flex justify-between items-center p-2.5 bg-zinc-950/25 border border-zinc-850 rounded-xl">
                                    <span className="text-zinc-300">{res.name}</span>
                                    <span className={cn("px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-black", res.color)}>{res.status}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. GRID */}
                    {activeTab === "grid" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEvents.map((e, idx) => (
                          <EventCard key={e.id} event={e} index={idx} />
                        ))}
                        {filteredEvents.length === 0 && <GlobalEmptyState variant="events" icon={CalendarIcon} title="No Events found" description="Initialize a new event workspace!" />}
                      </div>
                    )}

                    {/* 3. LIST */}
                    {activeTab === "list" && (
                      <div className="overflow-x-auto border border-zinc-850 bg-[#121214]/20 rounded-2xl">
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
                                <td className="p-4 font-mono font-bold">₹{e.budget?.toLocaleString() || "TBA"}</td>
                                <td className="p-4">
                                  <span className={cn("px-2 py-0.5 border rounded-full text-[8.5px] uppercase tracking-wider font-black", STATUS_COLORS[e.status])}>
                                    {STATUS_LABELS[e.status]}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <button onClick={() => router.push(`/events/${e.id}`)} className="text-purple-400 hover:text-purple-300 font-bold">Manage</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* 4. KANBAN */}
                    {activeTab === "kanban" && (
                      <Droppable droppableId="board" type="COLUMN" direction="horizontal">
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps} className="flex gap-4 overflow-x-auto pb-4">
                            {COLUMNS.map((column) => {
                              const colEvents = filteredEvents.filter((e) => e.status === column.id);
                              return (
                                <div key={column.id} className="w-80 shrink-0 flex flex-col bg-[#111113]/30 border border-zinc-850 rounded-2xl p-4 space-y-4">
                                  <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                                    <span className="text-[10px] font-black uppercase text-zinc-450 tracking-wider">{column.label}</span>
                                    <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-bold">{colEvents.length}</span>
                                  </div>
                                  <Droppable droppableId={column.id} type="CARD">
                                    {(prov) => (
                                      <div ref={prov.innerRef} {...prov.droppableProps} className="flex-1 space-y-3 min-h-[300px]">
                                        {colEvents.map((e, idx) => (
                                          <Draggable key={e.id} draggableId={e.id} index={idx}>
                                            {(dragProv) => (
                                              <div
                                                ref={dragProv.innerRef}
                                                {...dragProv.draggableProps}
                                                {...dragProv.dragHandleProps}
                                                style={dragProv.draggableProps.style as React.CSSProperties}
                                                onClick={() => router.push(`/events/${e.id}`)}
                                                className="p-4 border border-zinc-850 bg-zinc-950/40 rounded-xl hover:border-purple-500/20 cursor-pointer space-y-2"
                                              >
                                                <span className="font-extrabold text-zinc-250 block text-xs leading-snug">{e.name}</span>
                                                <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold">
                                                  <span>{e.venueName || "TBA"}</span>
                                                  <span>{new Date(e.startDate).toLocaleDateString()}</span>
                                                </div>
                                              </div>
                                            )}
                                          </Draggable>
                                        ))}
                                        {prov.placeholder}
                                      </div>
                                    )}
                                  </Droppable>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </Droppable>
                    )}

                    {/* 5. CALENDAR */}
                    {activeTab === "calendar" && (
                      <div className="p-6 border border-zinc-850 bg-[#161618]/30 rounded-2xl space-y-6">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-xs uppercase text-zinc-350 tracking-wider">
                            {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
                          </h4>
                          <div className="flex gap-2">
                            <button onClick={handlePrevDate} className="p-1.5 border border-zinc-800 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white"><ChevronLeft size={13} /></button>
                            <button onClick={handleNextDate} className="p-1.5 border border-zinc-800 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white"><ChevronRight size={13} /></button>
                          </div>
                        </div>
                        <div className="grid grid-cols-7 gap-2 text-center text-[9px] uppercase font-black text-zinc-550 border-b border-zinc-900 pb-2">
                          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <span key={d}>{d}</span>)}
                        </div>
                        <div className="grid grid-cols-7 gap-2 h-96">
                          {Array.from({ length: 35 }).map((_, idx) => {
                            const day = idx - 4; // Mock dates offset
                            const dayDateStr = `2026-07-${day < 10 ? '0' + day : day}`;
                            const matched = filteredEvents.filter(e => e.startDate.startsWith(dayDateStr));
                            return (
                              <div key={idx} className="p-2 border border-zinc-900 bg-zinc-950/20 rounded-xl flex flex-col justify-between items-stretch overflow-hidden">
                                <span className="text-[10px] font-mono text-zinc-500 font-bold">{day > 0 && day <= 31 ? day : ""}</span>
                                <div className="space-y-1">
                                  {matched.slice(0, 2).map(e => (
                                    <div key={e.id} className="text-[7.5px] font-extrabold uppercase bg-purple-950/30 border border-purple-900/30 text-purple-400 p-0.5 rounded truncate leading-tight">
                                      {e.name}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 6. TIMELINE */}
                    {activeTab === "timeline" && (
                      <div className="p-6 border border-zinc-850 bg-[#161618]/30 rounded-2xl space-y-6">
                        <span className="text-[8px] text-zinc-550 uppercase font-black block">Operational timelines</span>
                        <div className="space-y-6 relative border-l-2 border-zinc-850 pl-6 ml-2.5">
                          {filteredEvents.map((e, idx) => (
                            <div key={e.id} className="relative group">
                              <span className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full bg-zinc-900 border-2 border-purple-650" />
                              <div className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-xl hover:border-zinc-800 transition space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                  <strong className="text-zinc-200">{e.name}</strong>
                                  <span className="text-[10px] text-zinc-500">{new Date(e.startDate).toLocaleDateString()}</span>
                                </div>
                                <p className="text-[10px] text-zinc-500">{e.notes ? JSON.parse(e.notes).notesText : "No notes."}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 7. AGENDA */}
                    {activeTab === "agenda" && (
                      <div className="p-6 border border-zinc-850 bg-[#161618]/30 rounded-2xl space-y-4">
                        <span className="text-[8px] text-zinc-550 uppercase font-black block">Today's executions</span>
                        <div className="space-y-3">
                          {filteredEvents.map(e => (
                            <div key={e.id} className="flex justify-between items-center p-3 bg-zinc-950/30 border border-zinc-850 rounded-xl">
                              <div className="space-y-0.5">
                                <span className="font-extrabold text-zinc-200 text-xs block">{e.name}</span>
                                <span className="text-[10px] text-zinc-500">{e.venueName} • Guest count: {e.guestCount}</span>
                              </div>
                              <span className={cn("px-2 py-0.5 border rounded-full text-[8.5px] font-black uppercase tracking-wider", STATUS_COLORS[e.status])}>
                                {STATUS_LABELS[e.status]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* B. RESOURCE CENTER */}
            {mainCategory === "resources" && (
              <motion.div
                key="resources"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Resource KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
                  <div className="p-4 border border-zinc-850 bg-[#161618]/30 rounded-2xl">
                    <span className="text-[10px] text-zinc-500 uppercase font-black block">Total Roster</span>
                    <span className="text-lg font-black text-zinc-200 mt-1 block">{resources.length} Staff</span>
                  </div>
                  <div className="p-4 border border-zinc-850 bg-[#161618]/30 rounded-2xl">
                    <span className="text-[10px] text-zinc-500 uppercase font-black block">Active Booked</span>
                    <span className="text-lg font-black text-purple-400 mt-1 block">
                      {resources.filter(r => r.status === "BOOKED").length} Assigned
                    </span>
                  </div>
                  <div className="p-4 border border-zinc-850 bg-[#161618]/30 rounded-2xl">
                    <span className="text-[10px] text-zinc-500 uppercase font-black block">Utilization Rate</span>
                    <span className="text-lg font-black text-emerald-455 mt-1 block">82% Average</span>
                  </div>
                  <div className="p-4 border border-zinc-850 bg-[#161618]/30 rounded-2xl">
                    <span className="text-[10px] text-zinc-500 uppercase font-black block">Roster Quality</span>
                    <span className="text-lg font-black text-cyan-400 mt-1 block">4.8 Rating</span>
                  </div>
                </div>

                {/* Split grid for allocation workflow */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* Left: Resources cards list */}
                  <div className="lg:col-span-2 space-y-4">
                    <span className="text-[9px] uppercase font-black text-zinc-550 block tracking-wider">Drag resources onto right events to allocate</span>

                    <Droppable droppableId="resources-list" isDropDisabled={true}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                          {filteredResources.map((res, idx) => (
                            <Draggable key={res.id} draggableId={res.id} index={idx}>
                              {(dragProv, snapshot) => (
                                <div
                                  ref={dragProv.innerRef}
                                  {...dragProv.draggableProps}
                                  {...dragProv.dragHandleProps}
                                  style={dragProv.draggableProps.style as React.CSSProperties}
                                  onClick={() => setSelectedResource(res)}
                                  className={cn(
                                    "p-4 border border-zinc-850 bg-zinc-950/40 rounded-2xl hover:border-purple-500/30 cursor-pointer space-y-3 transition shadow-sm",
                                    snapshot.isDragging && "border-purple-500 bg-purple-950/10 shadow-lg scale-105"
                                  )}
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="font-extrabold text-zinc-200 text-xs block">{res.name}</span>
                                      <span className="text-[10px] text-zinc-500">{res.role} • {res.experience}</span>
                                    </div>
                                    <span className={cn(
                                      "px-2 py-0.5 border rounded-full text-[8px] font-black uppercase tracking-wider",
                                      res.status === "AVAILABLE" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-450" :
                                        res.status === "BOOKED" ? "border-purple-500/20 bg-purple-500/5 text-purple-400" :
                                          "border-red-500/20 bg-red-500/5 text-red-400"
                                    )}>
                                      {res.status}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap gap-1 text-[8.5px] font-bold text-zinc-400">
                                    {res.skills.slice(0, 2).map((s, i) => (
                                      <span key={i} className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-md">{s}</span>
                                    ))}
                                    {res.skills.length > 2 && <span className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-md">+{res.skills.length - 2} more</span>}
                                  </div>

                                  <div className="flex justify-between items-center text-[10px] border-t border-zinc-900 pt-2.5">
                                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                                      <Star size={11} fill="currentColor" />
                                      <span>{res.rating}</span>
                                    </div>
                                    <span className="text-zinc-550 font-semibold font-mono">Utilized: {res.utilization}%</span>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        </div>
                      )}
                    </Droppable>
                  </div>

                  {/* Right: Allocation zones (Droppable events) */}
                  <div className="lg:col-span-1 space-y-4">
                    <span className="text-[9px] uppercase font-black text-zinc-550 block tracking-wider font-mono">Allocation pipelines drops</span>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                      {events.filter(e => e.status !== "COMPLETED").map(ev => {
                        const allocs = assignments[ev.id]?.resources || [];
                        return (
                          <Droppable key={ev.id} droppableId={`event-assign-${ev.id}`}>
                            {(prov, snap) => (
                              <div
                                ref={prov.innerRef}
                                {...prov.droppableProps}
                                className={cn(
                                  "p-4 border border-zinc-850 bg-[#161618]/30 rounded-2xl space-y-3 transition",
                                  snap.isDraggingOver && "border-purple-500 bg-purple-950/15"
                                )}
                              >
                                <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                                  <div>
                                    <span className="font-extrabold text-zinc-250 text-xs block">{ev.name}</span>
                                    <span className="text-[9px] text-zinc-500 block">{new Date(ev.startDate).toLocaleDateString()}</span>
                                  </div>
                                  <span className="text-[10px] font-bold text-purple-400 bg-purple-950/10 px-2 py-0.5 rounded-full border border-purple-900/30">
                                    {allocs.length} Staff
                                  </span>
                                </div>

                                <div className="space-y-1.5 min-h-[50px]">
                                  {allocs.map(resId => {
                                    const r = resources.find(item => item.id === resId);
                                    return (
                                      <div key={resId} className="flex justify-between items-center p-2 bg-zinc-950/50 border border-zinc-850 rounded-xl text-xs font-semibold">
                                        <span className="text-zinc-300">{r?.name || "Resource"} ({r?.role || "Staff"})</span>
                                        <button
                                          onClick={() => removeAllocation(ev.id, "resources", resId)}
                                          className="text-zinc-500 hover:text-red-400 cursor-pointer"
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>
                                    );
                                  })}
                                  {allocs.length === 0 && (
                                    <div className="text-[10px] text-zinc-550 italic text-center py-4">Drag resources here to allocate</div>
                                  )}
                                  {prov.placeholder}
                                </div>
                              </div>
                            )}
                          </Droppable>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* C. PARTNER VENDORS */}
            {mainCategory === "vendors" && (
              <motion.div
                key="vendors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Vendors table registry */}
                <div className="overflow-x-auto border border-zinc-850 bg-[#121214]/20 rounded-3xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-850 bg-zinc-950/20 text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                        <th className="p-4">Company Name</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Contact Person</th>
                        <th className="p-4">GST / PAN</th>
                        <th className="p-4">UPI / Bank Detail</th>
                        <th className="p-4">Score</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850/40">
                      {filteredVendors.map((v) => (
                        <tr key={v.id} className="hover:bg-zinc-900/10 text-zinc-300 transition-colors">
                          <td className="p-4 font-extrabold text-zinc-200">
                            <div className="space-y-0.5">
                              <span>{v.company}</span>
                              <span className="text-[10px] text-zinc-550 block font-normal">{v.address}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase text-[9px] font-bold">
                              {v.category}
                            </span>
                          </td>
                          <td className="p-4 font-semibold text-zinc-400">{v.contact}</td>
                          <td className="p-4 font-mono text-[10px] text-zinc-500">
                            <div>GST: {v.gst}</div>
                            <div>PAN: {v.pan}</div>
                          </td>
                          <td className="p-4 font-mono text-[10px] text-zinc-500">
                            <div>UPI: {v.upiId}</div>
                            <div>{v.bankName} - {v.accountNo}</div>
                          </td>
                          <td className="p-4">
                            <span className="text-emerald-450 font-bold font-mono">{v.performance}%</span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => setSelectedVendor(v)}
                              className="text-purple-400 hover:text-purple-300 font-bold cursor-pointer"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* D. PROP INVENTORY */}
            {mainCategory === "inventory" && (
              <motion.div
                key="inventory"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Inventory Stock Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredInventory.map((item) => {
                    const progress = item.stock > 0 ? (item.reserved / item.stock) * 100 : 0;
                    return (
                      <div key={item.id} className="p-5 border border-zinc-850 bg-zinc-950/40 rounded-3xl relative overflow-hidden flex flex-col justify-between space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] text-zinc-550 uppercase font-black block tracking-wider">{item.category}</span>
                            <span className="font-extrabold text-zinc-200 text-xs mt-0.5 block">{item.name}</span>
                          </div>
                          <span className={cn(
                            "px-2 py-0.5 border rounded-full text-[8.5px] font-black uppercase tracking-wider",
                            item.status === "IN_STOCK" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-450" :
                              item.status === "LOW_STOCK" ? "border-amber-500/20 bg-amber-500/5 text-amber-500" :
                                "border-red-500/20 bg-red-500/5 text-red-400"
                          )}>
                            {item.status.replace("_", " ")}
                          </span>
                        </div>

                        {/* Inventory stock levels progress bar */}
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold">
                            <span>Reserved: {item.reserved}</span>
                            <span>Total Stock: {item.stock}</span>
                          </div>
                          <div className="h-1.5 w-full bg-zinc-900 border border-zinc-850 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all", progress > 100 ? "bg-red-500" : progress > 80 ? "bg-amber-500" : "bg-purple-600")}
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                        </div>

                        {/* Logistics details */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold border-t border-zinc-900/60 pt-3">
                          <span className="text-red-400 flex items-center gap-1">
                            <AlertCircle size={11} /> Damaged: {item.damaged}
                          </span>
                          <span className="text-emerald-450 flex items-center gap-1">
                            <CheckCircle2 size={11} /> Returned: {item.returned}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* E. LOGISTICS FLEET */}
            {mainCategory === "vehicles" && (
              <motion.div
                key="vehicles"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {vehicles.map((veh) => (
                  <div key={veh.id} className="p-5 border border-zinc-850 bg-zinc-950/40 rounded-3xl flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-[9px] text-zinc-500 block">{veh.plateNumber}</span>
                        <span className="font-extrabold text-zinc-200 text-xs mt-0.5 block">{veh.name}</span>
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 border rounded-full text-[8.5px] font-black uppercase tracking-wider",
                        veh.status === "AVAILABLE" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-450" :
                          veh.status === "IN_TRANSIT" ? "border-blue-500/20 bg-blue-500/5 text-blue-400" :
                            "border-amber-500/20 bg-amber-550/5 text-amber-500"
                      )}>
                        {veh.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      <div className="flex justify-between items-center text-zinc-400">
                        <span>Allocated Driver</span>
                        <strong className="text-zinc-250 font-bold">{veh.driver}</strong>
                      </div>

                      {/* Fuel tank level */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold">
                          <span className="flex items-center gap-1"><Fuel size={10} /> Fuel Capacity</span>
                          <span>{veh.fuel}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-900 border border-zinc-850 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", veh.fuel < 20 ? "bg-red-500" : "bg-emerald-600")}
                            style={{ width: `${veh.fuel}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-zinc-900/60 pt-3 text-[10px] text-zinc-550 font-bold font-mono">
                      <span>Total Trips: {veh.trips}</span>
                      {veh.fuel < 20 && (
                        <span className="text-red-400 flex items-center gap-1 animate-pulse">
                          <AlertTriangle size={11} /> Low Fuel
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </DragDropContext>

      {/* CREATE EVENT MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#111113] border border-zinc-800 rounded-3xl p-6 relative space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Sparkles className="text-purple-500" size={16} /> Create Event Workspace
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-450 hover:text-white cursor-pointer"><X size={12} /></button>
              </div>

              {formError && (
                <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">Event Name</label>
                    <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="E.g., Rohan & Meera Wedding Gala"
                      className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-550" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">Event Type</label>
                    <select value={formType} onChange={(e) => setFormType(e.target.value)}
                      className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none">
                      {EVENT_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">Start Date & Time</label>
                    <input type="datetime-local" required value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-555" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">End Date & Time</label>
                    <input type="datetime-local" required value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-555" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">Venue Name</label>
                    <input type="text" value={formVenueName} onChange={(e) => setFormVenueName(e.target.value)} placeholder="E.g., JW Marriott Grand Ballroom"
                      className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-555" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">Guest Count</label>
                    <input type="number" value={formGuestCount} onChange={(e) => setFormGuestCount(e.target.value)} placeholder="E.g., 250"
                      className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-555" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-purple-650 to-pink-650 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold cursor-pointer transition shadow-md active:scale-95"
                >
                  Confirm Provisioning
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LOG VENDOR MODAL */}
      <AnimatePresence>
        {showVendorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#111113] border border-zinc-800 rounded-3xl p-6 relative space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <UserPlus className="text-purple-500" size={16} /> Log Partner Vendor
                </h3>
                <button onClick={() => setShowVendorModal(false)} className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-450 hover:text-white cursor-pointer"><X size={12} /></button>
              </div>

              <form onSubmit={handleVendorSubmit} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">Company Name</label>
                    <input type="text" required value={vendorForm.company} onChange={(e) => setVendorForm({ ...vendorForm, company: e.target.value })} placeholder="Monarch Caterers"
                      className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">Category</label>
                    <select value={vendorForm.category} onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}
                      className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none">
                      <option value="Catering">Catering</option>
                      <option value="Lighting">Lighting</option>
                      <option value="Floral">Floral</option>
                      <option value="Decor">Decor</option>
                      <option value="Security">Security</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">Contact Person</label>
                    <input type="text" required value={vendorForm.contact} onChange={(e) => setVendorForm({ ...vendorForm, contact: e.target.value })} placeholder="Jagdish Prasad"
                      className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">GSTIN</label>
                    <input type="text" required value={vendorForm.gst} onChange={(e) => setVendorForm({ ...vendorForm, gst: e.target.value })} placeholder="27AAAAA1111A1Z1"
                      className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">PAN</label>
                    <input type="text" required value={vendorForm.pan} onChange={(e) => setVendorForm({ ...vendorForm, pan: e.target.value })} placeholder="AAAAA1111A"
                      className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">UPI ID</label>
                    <input type="text" required value={vendorForm.upiId} onChange={(e) => setVendorForm({ ...vendorForm, upiId: e.target.value })} placeholder="monarch@upi"
                      className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-purple-650 to-pink-650 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold cursor-pointer transition shadow-md"
                >
                  Log Partner details
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAIL DRAWERS */}
      <AnimatePresence>
        {selectedResource && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-40" onClick={() => setSelectedResource(null)} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0c0c0e]/95 border-l border-zinc-850 backdrop-blur-xl z-50 p-6 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-zinc-850 pb-4">
                  <div>
                    <span className="text-[8px] text-zinc-550 uppercase font-black block">Staff Profile</span>
                    <h3 className="font-extrabold text-sm text-zinc-100 flex items-center gap-2"><Users size={14} className="text-purple-500" /> Roster Specs</h3>
                  </div>
                  <button onClick={() => setSelectedResource(null)} className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"><X size={14} /></button>
                </div>

                {/* Profile card */}
                <div className="p-4 bg-zinc-900/30 border border-zinc-850 rounded-2xl space-y-4">
                  <div>
                    <h4 className="font-bold text-zinc-200 text-sm">{selectedResource.name}</h4>
                    <span className="text-[10px] text-zinc-500">{selectedResource.role} • {selectedResource.experience} Experience</span>
                  </div>
                  <div className="space-y-2 text-xs text-zinc-400">
                    <p>📧 {selectedResource.email}</p>
                    <p>📞 {selectedResource.contact}</p>
                    <p className="text-[11px] border-t border-zinc-900 pt-2 text-zinc-500">🚑 Emergency Contact: {selectedResource.emergencyContact}</p>
                  </div>
                </div>

                {/* Calendar availability grid */}
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-black text-zinc-500 tracking-wider">Availability Calendar (Next 4 Days)</span>
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                    {Object.entries(selectedResource.availability).map(([date, status]) => (
                      <div key={date} className={cn(
                        "p-2 border rounded-xl",
                        status === "Available" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-450" :
                          status === "Booked" ? "border-purple-500/20 bg-purple-500/5 text-purple-400" :
                            "border-red-500/20 bg-red-500/5 text-red-400"
                      )}>
                        <div>{date.split("-")[2]} Jul</div>
                        <div className="text-[8px] uppercase font-black mt-1">{status}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Specs */}
                <div className="p-4 bg-[#111113]/60 border border-zinc-850 rounded-2xl space-y-3 text-xs text-zinc-400">
                  <div className="flex justify-between">
                    <span>Performance Score</span>
                    <strong className="text-purple-400">{selectedResource.performanceScore}/100</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Utilization Rate</span>
                    <strong className="text-zinc-200">{selectedResource.utilization}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Past Events</span>
                    <strong className="text-zinc-200">{selectedResource.pastEventsCount} Events</strong>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedResource(null)} className="w-full mt-6 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition">Close Profile</button>
            </motion.div>
          </>
        )}

        {selectedVendor && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-40" onClick={() => setSelectedVendor(null)} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0c0c0e]/95 border-l border-zinc-850 backdrop-blur-xl z-50 p-6 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-zinc-850 pb-4">
                  <div>
                    <span className="text-[8px] text-zinc-550 uppercase font-black block">Vendor Specifications</span>
                    <h3 className="font-extrabold text-sm text-zinc-100 flex items-center gap-2"><UserCheck size={14} className="text-purple-500" /> Partner Details</h3>
                  </div>
                  <button onClick={() => setSelectedVendor(null)} className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"><X size={14} /></button>
                </div>

                <div className="p-4 bg-zinc-900/30 border border-zinc-850 rounded-2xl space-y-4 text-xs text-zinc-400">
                  <div>
                    <h4 className="font-bold text-zinc-250 text-sm">{selectedVendor.company}</h4>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold bg-zinc-800 px-2 py-0.5 rounded inline-block mt-1">{selectedVendor.category}</span>
                  </div>
                  <div className="space-y-2">
                    <p>👤 Primary Contact: {selectedVendor.contact}</p>
                    <p>📧 Email: {selectedVendor.email}</p>
                    <p>📞 Phone: {selectedVendor.phone}</p>
                    <p>📍 Address: {selectedVendor.address}</p>
                  </div>
                </div>

                <div className="p-4 bg-[#111113]/60 border border-zinc-850 rounded-2xl space-y-3 text-xs text-zinc-400">
                  <span className="text-[9px] uppercase font-black text-zinc-550 tracking-wider block">Financial Details</span>
                  <div className="space-y-2 font-mono text-[10.5px]">
                    <div>GSTIN: {selectedVendor.gst}</div>
                    <div>PAN: {selectedVendor.pan}</div>
                    <div>Bank: {selectedVendor.bankName}</div>
                    <div>Account: {selectedVendor.accountNo}</div>
                    <div>UPI ID: {selectedVendor.upiId}</div>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedVendor(null)} className="w-full mt-6 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition">Close Profile</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
