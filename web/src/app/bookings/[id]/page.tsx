"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  DollarSign,
  Percent,
  CheckCircle,
  Clock,
  Calendar,
  AlertCircle,
  FileText,
  CreditCard,
  CheckCircle2,
  Plus,
  Trash2,
  Layers,
  History
} from "lucide-react";

interface BookingTimelineEvent {
  id: string;
  bookingId: string;
  title: string;
  description?: string;
  eventDate: string;
  status: string; // "PENDING", "COMPLETED"
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

const STATUSES = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "border-zinc-800 bg-zinc-800/20 text-zinc-400",
  CONFIRMED: "border-emerald-500/20 bg-emerald-500/5 text-emerald-450",
  IN_PROGRESS: "border-amber-500/20 bg-amber-500/5 text-amber-450",
  COMPLETED: "border-blue-500/20 bg-blue-500/5 text-blue-450",
  CANCELLED: "border-red-500/20 bg-red-500/5 text-red-450"
};

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;
  const queryClient = useQueryClient();

  // Form State
  const [newPaymentAmount, setNewPaymentAmount] = useState("");
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneDesc, setNewMilestoneDesc] = useState("");
  const [newMilestoneDate, setNewMilestoneDate] = useState("");
  const [newResourceName, setNewResourceName] = useState("");
  const [newResourceType, setNewResourceType] = useState("STAFF");
  const [formError, setFormError] = useState("");

  // 1. Fetch Booking Details
  const { data: bookingResponse, isLoading: bookingLoading, error: bookingError } = useQuery<{ data: Booking }>({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      const response = await api.get(`/bookings/${bookingId}`);
      return response.data;
    }
  });

  const booking = bookingResponse?.data;

  // 2. Fetch Associated Event details
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
  const resources = resourcesResponse?.data || [];

  // 4. Fetch Audit Logs
  const { data: auditResponse } = useQuery<{ data: BookingAuditLog[] }>({
    queryKey: ["bookingAudit", bookingId],
    queryFn: async () => {
      const response = await api.get(`/bookings/${bookingId}/audit`);
      return response.data;
    }
  });
  const auditLogs = auditResponse?.data || [];

  // Mutations
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

  const handleStatusChange = (newStatus: string) => {
    updateStatusMutation.mutate(newStatus);
  };

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

  if (bookingLoading || eventLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-400 flex items-center justify-center animate-pulse text-sm">
        Loading financial reservation file details...
      </div>
    );
  }

  if (bookingError || !booking) {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-150 flex flex-col items-center justify-center p-6 space-y-4">
        <AlertCircle className="text-red-500 h-12 w-12" />
        <h2 className="text-lg font-bold">Booking file not found</h2>
        <p className="text-zinc-500 text-xs">Verify that the booking exists and the backend microservices are running.</p>
        <button
          onClick={() => router.push("/bookings")}
          className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold"
        >
          <ArrowLeft size={14} />
          Back to Bookings
        </button>
      </div>
    );
  }

  const percentPaid = booking.totalAmount > 0 ? Math.min(100, Math.round((booking.paidAmount / booking.totalAmount) * 100)) : 0;
  const outstanding = booking.totalAmount - booking.paidAmount;
  const statusStyle = STATUS_COLORS[booking.status] || "border-zinc-800 text-zinc-450";

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex flex-col relative overflow-hidden transition-all duration-200">
      
      {/* Background glow effects to match landing page theme */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Top Navbar */}
      <nav className="h-16 border-b border-zinc-800 bg-[#111113]/80 backdrop-blur px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/bookings")}
            className="h-8 w-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-zinc-700/50"
            aria-label="Back to bookings"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">{event?.name || "Booking Workspace"}</span>
            <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">{booking.bookingNumber}</span>
          </div>
        </div>

        {/* Status quick editor */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500 font-semibold uppercase tracking-wider">Status:</span>
          <select
            value={booking.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-purple-600 font-semibold"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </nav>

      {/* Main Grid */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Info Metrics and Payment Collector */}
        <div className="space-y-6 lg:col-span-1">
          {/* Financials Overview Card */}
          <div className="p-6 border border-zinc-800 bg-[#161618]/30 rounded-xl space-y-5">
            <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-2">
              Financial Summary
            </h3>

            {/* Financial meter */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-semibold uppercase">
                <span>Contract Progress</span>
                <span>{percentPaid}% Cleared</span>
              </div>
              <div className="h-2 w-full bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${percentPaid}%` }}
                />
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Contract Budget</span>
                <span className="font-bold font-mono text-zinc-200">
                  INR {booking.totalAmount?.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Total Paid</span>
                <span className="font-bold font-mono text-emerald-450">
                  INR {booking.paidAmount?.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center border-t border-zinc-850 pt-3">
                <span className="text-zinc-500">Outstanding Balance</span>
                <span className="font-bold font-mono text-rose-450 text-sm">
                  INR {outstanding?.toLocaleString()}
                </span>
              </div>
            </div>

            {booking.contractUrl && (
              <div className="border-t border-zinc-850 pt-4 mt-2">
                <a
                  href={booking.contractUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300 font-semibold underline"
                >
                  <FileText size={14} />
                  Open Executed Contract PDF
                </a>
              </div>
            )}
          </div>

          {/* Collect Payment Form */}
          {outstanding > 0 && (
            <div className="p-6 border border-zinc-800 bg-[#161618]/30 rounded-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                <CreditCard size={15} className="text-purple-400" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-400">
                  Collect Payment
                </h3>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-zinc-500 font-semibold uppercase block">Amount Paid (INR)</label>
                  <input
                    type="number"
                    required
                    value={newPaymentAmount}
                    onChange={(e) => setNewPaymentAmount(e.target.value)}
                    placeholder="Enter collected sum..."
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-600 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={collectPaymentMutation.isPending}
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all shadow-md shadow-purple-600/10 text-xs active:scale-[0.98]"
                >
                  {collectPaymentMutation.isPending ? "Logging..." : "Log Transaction"}
                </button>
              </form>
            </div>
          )}

          {/* Resource Assignments */}
          <div className="p-6 border border-zinc-800 bg-[#161618]/30 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-purple-400" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-400">
                  Resource Assignments
                </h3>
              </div>
              <span className="text-[10px] text-zinc-550 font-mono">{resources.length} active</span>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {resources.map((res) => (
                <div key={res.id} className="flex justify-between items-center p-2 rounded bg-zinc-900/40 border border-zinc-850/50 text-[11px]">
                  <div>
                    <span className="font-bold text-zinc-200 block">{res.resourceName}</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded-full font-mono mt-0.5 inline-block">
                      {res.resourceType}
                    </span>
                  </div>
                  <button
                    onClick={() => removeResourceMutation.mutate(res.id)}
                    className="h-6 w-6 rounded bg-zinc-800/45 text-zinc-500 hover:text-red-500 flex items-center justify-center transition-colors"
                    title="Remove assignment"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
              {resources.length === 0 && (
                <p className="text-[10px] text-zinc-500 italic py-2">No operational resources assigned yet.</p>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newResourceName.trim()) return;
                assignResourceMutation.mutate({ resourceName: newResourceName, resourceType: newResourceType });
              }}
              className="border-t border-zinc-850 pt-3 space-y-2 text-[11px]"
            >
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  type="text"
                  required
                  placeholder="Resource/Staff name..."
                  value={newResourceName}
                  onChange={(e) => setNewResourceName(e.target.value)}
                  className="w-full md:flex-1 px-2 py-1.5 bg-[#18181B] border border-zinc-800 rounded text-white focus:outline-none placeholder-zinc-650"
                />
                <select
                  value={newResourceType}
                  onChange={(e) => setNewResourceType(e.target.value)}
                  className="w-full md:w-32 px-2 py-1.5 bg-[#18181B] border border-zinc-800 rounded text-white focus:outline-none"
                >
                  <option value="STAFF">Staff Member</option>
                  <option value="VENUE">Venue/Hall</option>
                  <option value="CATERING">Catering Vendor</option>
                  <option value="EQUIPMENT">AV/Equipment</option>
                  <option value="DECOR">Floral/Decor</option>
                  <option value="OTHER">Other resource</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={assignResourceMutation.isPending}
                className="w-full py-1.5 bg-purple-650/10 hover:bg-purple-650/20 text-purple-400 border border-purple-500/20 rounded-xl font-bold transition-all shadow-sm shadow-purple-500/5"
              >
                {assignResourceMutation.isPending ? "Assigning..." : "Assign Resource"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Columns: Booking Timeline / Milestones */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 border border-zinc-800 bg-[#161618]/30 rounded-xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-purple-400" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-200">Contract Milestones</h3>
              </div>
              <span className="text-xs text-zinc-500 font-semibold">
                {booking.timelineEvents?.filter((e) => e.status === "COMPLETED").length}/{booking.timelineEvents?.length} completed
              </span>
            </div>

            {/* Timeline Items */}
            <div className="space-y-3">
              {booking.timelineEvents?.map((milestone) => (
                <div
                  key={milestone.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Toggle milestone: ${milestone.title}`}
                  onClick={() => toggleMilestoneMutation.mutate(milestone.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleMilestoneMutation.mutate(milestone.id);
                    }
                  }}
                  className={`flex items-start text-left gap-3 p-3.5 border rounded-lg bg-zinc-900/30 cursor-pointer transition-all hover:bg-zinc-900/60 select-none ${
                    milestone.status === "COMPLETED" ? "border-zinc-800/40 text-zinc-500" : "border-zinc-800 text-zinc-200"
                  }`}
                >
                  <div className="mt-0.5" aria-hidden="true">
                    {milestone.status === "COMPLETED" ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <div className="h-4 w-4 rounded border border-zinc-700 hover:border-purple-500 transition-colors" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-xs font-bold leading-none ${milestone.status === "COMPLETED" ? "line-through text-zinc-500" : ""}`}>
                      {milestone.title}
                    </h4>
                    {milestone.description && (
                      <p className="text-[10px] text-zinc-500 mt-1 leading-normal">{milestone.description}</p>
                    )}
                    <span className="text-[9px] text-zinc-500 mt-1.5 block font-semibold flex items-center gap-1">
                      <Calendar size={9} />
                      Due: {new Date(milestone.eventDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}

              {(!booking.timelineEvents || booking.timelineEvents.length === 0) && (
                <p className="text-xs text-zinc-500 italic py-2">No timeline contract milestones scheduled.</p>
              )}
            </div>

            {/* Add milestone form */}
            <div className="border-t border-zinc-800/60 pt-6 mt-4">
              <h4 className="text-xs uppercase font-semibold tracking-wider text-zinc-400 mb-3">
                Schedule Contract Milestone
              </h4>
              <form onSubmit={handleMilestoneSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      required
                      value={newMilestoneTitle}
                      onChange={(e) => setNewMilestoneTitle(e.target.value)}
                      placeholder="E.g., Mid-term Payment Due"
                      className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <input
                      type="date"
                      required
                      value={newMilestoneDate}
                      onChange={(e) => setNewMilestoneDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-600"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMilestoneDesc}
                    onChange={(e) => setNewMilestoneDesc(e.target.value)}
                    placeholder="Milestone descriptions (optional)..."
                    className="flex-1 px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-600"
                  />
                  <button
                    type="submit"
                    disabled={addMilestoneMutation.isPending}
                    className="flex items-center justify-center gap-1.5 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl shrink-0 transition-all shadow-md shadow-purple-600/10 text-xs active:scale-[0.98]"
                  >
                    <Plus size={14} />
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Booking Audit Trail */}
          <div className="p-6 border border-zinc-800 bg-[#161618]/30 rounded-xl space-y-6">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <History size={16} className="text-purple-400" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-200">Audit Trail History</h3>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="relative pl-6 border-l border-zinc-800 pb-1 text-xs">
                  {/* Timeline dot */}
                  <div className="absolute -left-1.5 top-0.5 h-3 w-3 rounded-full bg-zinc-800 border-2 border-[#161618]" />
                  
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-zinc-300 block">{log.action}</span>
                    <span className="text-[9px] text-zinc-550 font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-zinc-450 text-[10px] mt-1 leading-normal">{log.details}</p>
                  <span className="text-[9px] text-zinc-550 mt-1 block">
                    Actor: <span className="font-bold text-zinc-400">{log.changedBy}</span>
                  </span>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <p className="text-xs text-zinc-500 italic py-2">No historical audit entries logged.</p>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
