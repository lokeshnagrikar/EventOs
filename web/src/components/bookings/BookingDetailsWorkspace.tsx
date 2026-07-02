"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  CheckCircle2,
  Plus,
  Trash2,
  FileText,
  CreditCard,
  History,
  Briefcase,
  AlertCircle,
  HelpCircle,
  QrCode
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingTimelineEvent {
  id: string;
  bookingId: string;
  title: string;
  description?: string;
  eventDate: string;
  status: string;
}

interface BookingAssignment {
  id: string;
  bookingId: string;
  resourceName: string;
  resourceType: string;
  assignedAt: string;
}

interface BookingAuditLog {
  id: string;
  bookingId: string;
  action: string;
  details: string;
  changedBy: string;
  createdAt: string;
}

interface Booking {
  id: string;
  eventId: string;
  bookingNumber: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  contractUrl?: string;
  createdAt: string;
  timelineEvents: BookingTimelineEvent[];
}

interface Event {
  id: string;
  name: string;
}

interface Invoice {
  id: string;
  bookingId: string;
  invoiceNumber: string;
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  dueDate: string;
  status: string;
  clientName: string;
  createdAt: string;
}

const TAB_OPTIONS = [
  { id: "overview", label: "Overview", icon: Briefcase },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "resources", label: "Resources", icon: Users },
  { id: "audit", label: "Audit Log", icon: History }
];

const STATUSES = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const STATUS_COLORS: Record<string, string> = {
  PENDING: "border-zinc-800 bg-zinc-800/20 text-zinc-400",
  CONFIRMED: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
  IN_PROGRESS: "border-amber-500/20 bg-amber-500/5 text-amber-400",
  COMPLETED: "border-blue-500/20 bg-blue-500/5 text-blue-400",
  CANCELLED: "border-red-500/20 bg-red-500/5 text-red-400"
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled"
};

export default function BookingDetailsWorkspace({ bookingId }: { bookingId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("overview");

  // Form States
  const [newPaymentAmount, setNewPaymentAmount] = useState("");
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneDesc, setNewMilestoneDesc] = useState("");
  const [newMilestoneDate, setNewMilestoneDate] = useState("");
  const [newResourceName, setNewResourceName] = useState("");
  const [newResourceType, setNewResourceType] = useState("STAFF");
  const [formError, setFormError] = useState("");

  // Signature States
  const [isSigned, setIsSigned] = useState(false);
  const [signedBy, setSignedBy] = useState("");
  const [signTitle, setSignTitle] = useState("Client Sponsor");
  const [signNameInput, setSignNameInput] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const signed = localStorage.getItem(`booking_signed_${bookingId}`);
      if (signed) {
        setIsSigned(true);
        setSignedBy(localStorage.getItem(`booking_signee_${bookingId}`) || "");
      }
    }
  }, [bookingId]);

  // 1. Fetch Booking Details
  const { data: bookingResponse, isLoading: bookingLoading, error: bookingError } = useQuery<{ data: Booking }>({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      const response = await api.get(`/bookings/${bookingId}`);
      return response.data;
    }
  });

  const booking = bookingResponse?.data;

  // 2. Fetch Associated Event
  const { data: eventResponse, isLoading: eventLoading } = useQuery<{ data: Event }>({
    queryKey: ["event", booking?.eventId],
    queryFn: async () => {
      const response = await api.get(`/events/${booking?.eventId}`);
      return response.data;
    },
    enabled: !!booking?.eventId
  });

  const event = eventResponse?.data;

  // 3. Fetch Resource Assignments
  const { data: resourcesResponse } = useQuery<{ data: BookingAssignment[] }>({
    queryKey: ["bookingResources", bookingId],
    queryFn: async () => {
      const response = await api.get(`/bookings/${bookingId}/resources`);
      return response.data;
    }
  });
  const resources = useMemo(() => resourcesResponse?.data || [], [resourcesResponse]);

  // 4. Fetch Audit Logs
  const { data: auditResponse } = useQuery<{ data: BookingAuditLog[] }>({
    queryKey: ["bookingAudit", bookingId],
    queryFn: async () => {
      const response = await api.get(`/bookings/${bookingId}/audit`);
      return response.data;
    }
  });
  const auditLogs = useMemo(() => auditResponse?.data || [], [auditResponse]);

  // 5. Fetch Invoices to filter for this Booking
  const { data: invoicesResponse } = useQuery<{ data: Invoice[] }>({
    queryKey: ["invoices"],
    queryFn: async () => {
      const response = await api.get("/events/invoices");
      return response.data;
    }
  });
  const invoices = useMemo(() => {
    const all = invoicesResponse?.data || [];
    return all.filter((inv) => inv.bookingId === bookingId);
  }, [invoicesResponse, bookingId]);

  // ── MUTATIONS ──
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await api.patch(`/bookings/${bookingId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["bookingAudit", bookingId] });
    }
  });

  const collectPaymentMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await api.patch(`/bookings/${bookingId}/payment`, { amount: amount.toString() });
      return response.data;
    },
    onSuccess: () => {
      setNewPaymentAmount("");
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["bookingAudit", bookingId] });
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error?.message || "Failed to log payment transaction.");
    }
  });

  const toggleMilestoneMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      const response = await api.patch(`/bookings/${bookingId}/timeline/${milestoneId}/toggle`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookingAudit", bookingId] });
    }
  });

  const addMilestoneMutation = useMutation({
    mutationFn: async (newMilestone: Partial<BookingTimelineEvent>) => {
      const response = await api.post(`/bookings/${bookingId}/timeline`, newMilestone);
      return response.data;
    },
    onSuccess: () => {
      setNewMilestoneTitle("");
      setNewMilestoneDesc("");
      setNewMilestoneDate("");
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookingAudit", bookingId] });
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error?.message || "Failed to save milestone.");
    }
  });

  const assignResourceMutation = useMutation({
    mutationFn: async (payload: { resourceName: string; resourceType: string }) => {
      const response = await api.post(`/bookings/${bookingId}/resources`, payload);
      return response.data;
    },
    onSuccess: () => {
      setNewResourceName("");
      setNewResourceType("STAFF");
      queryClient.invalidateQueries({ queryKey: ["bookingResources", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookingAudit", bookingId] });
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error?.message || "Failed to assign resource.");
    }
  });

  const removeResourceMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      const response = await api.delete(`/bookings/${bookingId}/resources/${resourceId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookingResources", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookingAudit", bookingId] });
    }
  });

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!newPaymentAmount || parseFloat(newPaymentAmount) <= 0) return;
    collectPaymentMutation.mutate(parseFloat(newPaymentAmount));
  };

  const handleMilestoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!newMilestoneTitle.trim() || !newMilestoneDate) return;
    addMilestoneMutation.mutate({
      title: newMilestoneTitle,
      description: newMilestoneDesc,
      eventDate: new Date(newMilestoneDate).toISOString(),
      status: "PENDING"
    });
  };

  const handleResourceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!newResourceName.trim()) return;
    assignResourceMutation.mutate({
      resourceName: newResourceName,
      resourceType: newResourceType
    });
  };

  // ── RENDER SKELETON ──
  const isPageLoading = bookingLoading || eventLoading;
  if (isPageLoading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto w-full animate-pulse">
        <div className="h-10 bg-zinc-900 border border-zinc-850 rounded-xl w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-[300px] bg-zinc-900/10 border border-zinc-850 rounded-xl lg:col-span-1" />
          <div className="h-[300px] bg-zinc-900/10 border border-zinc-850 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (bookingError || !booking) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="text-red-500 h-10 w-10 animate-bounce" />
        <h3 className="font-extrabold text-sm text-zinc-200">Booking File Load Error</h3>
        <button onClick={() => router.push("/bookings")} className="px-3 py-1.5 bg-zinc-850 rounded-xl text-xs text-zinc-300">
          Back to Bookings
        </button>
      </div>
    );
  }

  const percentPaid = booking.totalAmount > 0 ? Math.min(100, Math.round((booking.paidAmount / booking.totalAmount) * 100)) : 0;
  const outstanding = booking.totalAmount - booking.paidAmount;

  return (
    <div className="space-y-6">
      
      {/* ─── HEADER BAR ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-850 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-550/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-extrabold shadow-inner text-lg">
            B
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-zinc-200">
              {event?.name || "Contract Workspace"}
            </h1>
            <p className="text-[10px] text-zinc-550 font-bold mt-0.5">Booking Record: {booking.bookingNumber}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-zinc-500 font-bold uppercase tracking-wider">Status:</span>
          <select
            value={booking.status}
            onChange={(e) => updateStatusMutation.mutate(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-[10px] font-bold px-3 py-1.5 focus:outline-none focus:border-purple-650"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
      </div>

      {/* ─── TABS HEADER ─── */}
      <div className="flex bg-[#121214]/60 border border-zinc-850 p-1 rounded-2xl overflow-x-auto gap-1">
        {TAB_OPTIONS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all shrink-0",
              activeTab === tab.id ? "bg-zinc-800 text-purple-400 shadow-md" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── OPERATIONS SPLIT CONTAINER ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Info Column */}
        <div className="lg:col-span-1 p-5 border border-zinc-800 bg-[#141416]/40 rounded-2xl space-y-5 text-xs text-zinc-350">
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400 border-b border-zinc-850 pb-2">
            Financial Ledger Summary
          </h3>

          <div className="space-y-4">
            <div className="space-y-0.5">
              <span className="text-[9px] text-zinc-500 uppercase font-black block">Total Contract Value</span>
              <span className="text-base font-black text-zinc-200 font-mono">₹{booking.totalAmount.toLocaleString()}</span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[9px] text-zinc-500 uppercase font-black block">Paid Balance</span>
              <span className="text-base font-black text-emerald-450 font-mono">₹{booking.paidAmount.toLocaleString()}</span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[9px] text-zinc-500 uppercase font-black block">Outstanding Cost</span>
              <span className="text-base font-black text-rose-400 font-mono">₹{outstanding.toLocaleString()}</span>
            </div>

            {/* Payment Progress Ring simulation */}
            <div className="flex items-center gap-3 border-t border-zinc-850/60 pt-4">
              <div className="relative h-10 w-10 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-zinc-800" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-emerald-500" strokeWidth="4" strokeDasharray={`${percentPaid}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[8.5px] font-black text-zinc-300">
                  {percentPaid}%
                </span>
              </div>
              <div>
                <span className="text-[9px] text-zinc-550 uppercase font-bold">Installment Progress</span>
                <p className="text-[10px] text-zinc-400 mt-0.5">Cleared contract ratios</p>
              </div>
            </div>

            {/* Collect Payment form */}
            {outstanding > 0 && (
              <form onSubmit={handlePaymentSubmit} className="border-t border-zinc-850/60 pt-4 space-y-2">
                <span className="text-[9px] text-zinc-500 uppercase font-black block">Collect Installment Payment</span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    required
                    placeholder="Enter amount..."
                    value={newPaymentAmount}
                    onChange={(e) => setNewPaymentAmount(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono"
                  />
                  <button type="submit" disabled={collectPaymentMutation.isPending} className="px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold">
                    Log
                  </button>
                </div>
                {formError && <p className="text-[9px] text-red-400 mt-1">{formError}</p>}
              </form>
            )}
          </div>
        </div>

        {/* Right Tab Content Column */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="space-y-6 text-xs text-zinc-300"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 border border-zinc-800 bg-[#141416]/20 rounded-2xl">
                    <span className="text-[9px] text-zinc-550 font-black uppercase">Timeline Actions</span>
                    <p className="text-base font-black text-zinc-200 mt-1">
                      {booking.timelineEvents?.filter((e) => e.status === "COMPLETED").length || 0} / {booking.timelineEvents?.length || 0}
                    </p>
                  </div>
                  <div className="p-4 border border-zinc-800 bg-[#141416]/20 rounded-2xl">
                    <span className="text-[9px] text-zinc-550 font-black uppercase">Staff Allocated</span>
                    <p className="text-base font-black text-zinc-200 mt-1">{resources.length} resources</p>
                  </div>
                  <div className="p-4 border border-zinc-800 bg-[#141416]/20 rounded-2xl">
                    <span className="text-[9px] text-zinc-550 font-black uppercase">Outstanding Invoices</span>
                    <p className="text-base font-black text-zinc-200 mt-1">{invoices.filter((i) => i.status !== "PAID").length} pending</p>
                  </div>
                </div>

                <div className="p-5 border border-zinc-800 bg-[#141416]/40 rounded-2xl space-y-3.5">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400">Contracts Workspace Logs</h3>
                  <p className="leading-relaxed">This workspace coordinates the specific financial contracts, invoices, and installment ledgers associated with this booking. Use the tabs above to track the timeline, log payment receipts, and assign personnel resources.</p>
                </div>
              </motion.div>
            )}

            {/* TIMELINE TAB */}
            {activeTab === "timeline" && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="p-5 border border-zinc-800 bg-[#141416]/40 rounded-2xl space-y-6"
              >
                <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-300">Contract Lifecycle timeline</h3>
                </div>

                <div className="relative border-l border-zinc-800 pl-6 ml-2 space-y-5 py-1">
                  {booking.timelineEvents?.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => toggleMilestoneMutation.mutate(m.id)}
                      className={cn(
                        "relative p-3 border rounded-xl bg-zinc-950/20 cursor-pointer flex justify-between items-center transition-colors",
                        m.status === "COMPLETED" ? "border-zinc-850 text-zinc-550" : "border-zinc-800 text-zinc-200 hover:border-zinc-700"
                      )}
                    >
                      <div className="absolute -left-[32px] top-4 h-3 w-3 rounded-full border-2 bg-[#09090b]"
                        style={{ borderColor: m.status === "COMPLETED" ? "#a855f7" : "#3f3f46" }}
                      />
                      <div className="flex items-center gap-2">
                        {m.status === "COMPLETED" ? <CheckCircle2 size={14} className="text-emerald-500" /> : <div className="h-3.5 w-3.5 rounded-full border border-zinc-700" />}
                        <span className="font-bold text-xs">{m.title}</span>
                      </div>
                      <span className="text-[9px] text-zinc-550 font-bold">{new Date(m.eventDate).toLocaleDateString()}</span>
                    </div>
                  ))}
                  {(!booking.timelineEvents || booking.timelineEvents.length === 0) && (
                    <p className="text-xs text-zinc-550 italic">No milestones defined.</p>
                  )}
                </div>

                {/* Add Milestone Form */}
                <form onSubmit={handleMilestoneSubmit} className="border-t border-zinc-850 pt-5 space-y-3">
                  <h4 className="text-[9px] uppercase font-black text-zinc-400">Add Timeline Milestone</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" required placeholder="Milestone Title (e.g. Contract signed)" value={newMilestoneTitle} onChange={(e) => setNewMilestoneTitle(e.target.value)}
                      className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs" />
                    <input type="datetime-local" required value={newMilestoneDate} onChange={(e) => setNewMilestoneDate(e.target.value)}
                      className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs" />
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-md">
                      Log Milestone
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* INVOICES TAB */}
            {activeTab === "invoices" && (
              <motion.div
                key="invoices"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="p-5 border border-zinc-800 bg-[#141416]/40 rounded-2xl space-y-4"
              >
                <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-300">Generated Invoices</h3>
                  <button onClick={() => router.push("/invoices")} className="text-purple-400 hover:text-purple-300 font-bold text-[10px] uppercase tracking-wider">
                    Invoice Center &rarr;
                  </button>
                </div>

                <div className="space-y-2.5">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="p-3.5 border border-zinc-850 bg-zinc-950/20 rounded-xl flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-xs text-zinc-200">{inv.invoiceNumber}</h4>
                        <span className="text-[9.5px] text-zinc-550 font-bold">Due Date: {new Date(inv.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold text-zinc-300 text-xs">₹{inv.totalAmount.toLocaleString()}</span>
                        <span className={cn("px-2 py-0.5 border rounded-full text-[8.5px] font-black uppercase")}>
                          {inv.status}
                        </span>
                        <button onClick={() => router.push(`/invoices/${inv.id}`)} className="text-purple-400 font-bold text-[9px] uppercase hover:underline">
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                  {invoices.length === 0 && (
                    <p className="text-xs text-zinc-550 italic py-4 text-center">No invoices generated for this contract ledger yet.</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* PAYMENTS TAB */}
            {activeTab === "payments" && (
              <motion.div
                key="payments"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="p-5 border border-zinc-800 bg-[#141416]/40 rounded-2xl space-y-4"
              >
                <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-300">Transaction Ledgers</h3>
                  <button onClick={() => router.push("/payments")} className="text-purple-400 hover:text-purple-300 font-bold text-[10px] uppercase tracking-wider">
                    Payment Ledgers &rarr;
                  </button>
                </div>

                <div className="space-y-2.5">
                  {/* Let's mock transaction receipts based on the paidAmount, or allow logging in local payments state */}
                  <div className="p-3.5 border border-zinc-850 bg-zinc-950/20 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-xs text-zinc-200">TXN-DEPOSIT-001</h4>
                      <span className="text-[9px] text-zinc-550 font-bold flex items-center gap-1 mt-0.5">
                        <Clock size={9} /> Logged Deposit Payment
                      </span>
                    </div>
                    <span className="font-mono font-black text-emerald-450 text-xs">₹{booking.paidAmount.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* RESOURCES TAB */}
            {activeTab === "resources" && (
              <motion.div
                key="resources"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="p-5 border border-zinc-800 bg-[#141416]/40 rounded-2xl space-y-6"
              >
                <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-300">Resource Allocations</h3>
                  <span className="text-[10px] text-zinc-500 font-bold">{resources.length} active assignments</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {resources.map((res) => (
                    <div key={res.id} className="p-3 border border-zinc-850 bg-zinc-950/20 rounded-xl flex items-center justify-between group">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-250">{res.resourceName}</h4>
                        <span className="text-[9px] text-zinc-500 uppercase font-black mt-0.5 block">{res.resourceType}</span>
                      </div>
                      <button onClick={() => removeResourceMutation.mutate(res.id)} className="h-7 w-7 bg-zinc-900 border border-zinc-800 flex items-center justify-center rounded-lg hover:bg-red-500/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        &times;
                      </button>
                    </div>
                  ))}
                  {resources.length === 0 && (
                    <p className="text-xs text-zinc-550 italic col-span-2">No assigned resources.</p>
                  )}
                </div>

                {/* Assignment form */}
                <form onSubmit={handleResourceSubmit} className="border-t border-zinc-850 pt-5 space-y-3">
                  <h4 className="text-[9px] uppercase font-black text-zinc-400">Allocate Resource</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="text" required placeholder="Resource/Staff Name (e.g. Sound Engineer)" value={newResourceName} onChange={(e) => setNewResourceName(e.target.value)}
                      className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs" />
                    <select value={newResourceType} onChange={(e) => setNewResourceType(e.target.value)} className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold">
                      <option value="STAFF">Staff Personnel</option>
                      <option value="EQUIPMENT">System Equipment</option>
                      <option value="VEHICLE">Logistics Vehicle</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" disabled={assignResourceMutation.isPending} className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-md">
                      Assign Resource
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* AUDIT LOG TAB */}
            {activeTab === "audit" && (
              <motion.div
                key="audit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="p-5 border border-zinc-800 bg-[#141416]/40 rounded-2xl space-y-4"
              >
                <div className="border-b border-zinc-850 pb-3">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-300">Operations Audit Trail</h3>
                </div>

                <div className="space-y-3 text-xs leading-normal">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3 border border-zinc-850/60 bg-zinc-950/20 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-zinc-550 font-bold">
                        <span>{log.changedBy}</span>
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="font-bold text-zinc-250">{log.action}</p>
                      {log.details && <p className="text-[10px] text-zinc-500">{log.details}</p>}
                    </div>
                  ))}
                  {auditLogs.length === 0 && (
                    <p className="text-xs text-zinc-550 italic py-2">No logs audited for this ledger.</p>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
