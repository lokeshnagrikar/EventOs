"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Layers,
  Plus,
  ArrowLeft,
  DollarSign,
  Percent,
  CheckCircle,
  Clock,
  Calendar,
  AlertCircle,
  FileText,
  X,
  CreditCard
} from "lucide-react";

interface Booking {
  id: string;
  eventId: string;
  bookingNumber: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  contractUrl?: string;
  createdAt: string;
}

interface Event {
  id: string;
  name: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "border-zinc-800 bg-zinc-800/20 text-zinc-400",
  CONFIRMED: "border-emerald-500/20 bg-emerald-500/5 text-emerald-450",
  IN_PROGRESS: "border-amber-500/20 bg-amber-500/5 text-amber-450",
  COMPLETED: "border-blue-500/20 bg-blue-500/5 text-blue-450",
  CANCELLED: "border-red-500/20 bg-red-500/5 text-red-450"
};

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [selectedEventId, setSelectedEventId] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [contractUrl, setContractUrl] = useState("");
  const [formError, setFormError] = useState("");

  // 1. Fetch Bookings
  const { data: bookingsResponse, isLoading: bookingsLoading } = useQuery<{ data: Booking[] }>({
    queryKey: ["bookings"],
    queryFn: async () => {
      const response = await api.get("/events/bookings");
      return response.data;
    }
  });

  // 2. Fetch Events
  const { data: eventsResponse, isLoading: eventsLoading } = useQuery<{ data: Event[] }>({
    queryKey: ["events"],
    queryFn: async () => {
      const response = await api.get("/events");
      return response.data;
    }
  });

  const bookings = bookingsResponse?.data || [];
  const events = eventsResponse?.data || [];

  const getEventName = (eventId: string) => {
    return events.find((e) => e.id === eventId)?.name || "Unassigned Event";
  };

  // 3. Mutation: Create Booking
  const createBookingMutation = useMutation({
    mutationFn: async (newBooking: Partial<Booking>) => {
      const response = await api.post("/events/bookings", newBooking);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error?.message || "Failed to create booking.");
    }
  });

  const resetForm = () => {
    setSelectedEventId("");
    setTotalAmount("");
    setPaidAmount("");
    setContractUrl("");
    setFormError("");
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedEventId || !totalAmount || !paidAmount) {
      setFormError("Event reference, total budget, and paid amount are required.");
      return;
    }

    createBookingMutation.mutate({
      eventId: selectedEventId,
      totalAmount: parseFloat(totalAmount),
      paidAmount: parseFloat(paidAmount),
      contractUrl: contractUrl || undefined
    });
  };

  const isLoading = bookingsLoading || eventsLoading;

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col">
      {/* Top Navbar */}
      <nav className="h-16 border-b border-zinc-800 bg-[#111113]/80 backdrop-blur px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.location.href = "/")}
            className="h-8 w-8 rounded-md bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">Bookings</span>
            <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">Ledger</span>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md"
        >
          <Plus size={16} />
          Lock Booking
        </button>
      </nav>

      {/* Main Container */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header Title */}
        <div className="border-b border-zinc-800 pb-4">
          <h2 className="text-xl font-bold">Bookings & Financial Contracts</h2>
          <p className="text-xs text-zinc-400">Monitor event reservation ledgers, payment progress, and contract milestones.</p>
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <div className="text-center text-zinc-500 animate-pulse py-12 text-sm">
            Fetching active reservation ledgers and client files...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((b) => {
              const statusStyle = STATUS_COLORS[b.status] || "border-zinc-800 text-zinc-450";
              const percentPaid = b.totalAmount > 0 ? Math.min(100, Math.round((b.paidAmount / b.totalAmount) * 100)) : 0;
              const outstanding = b.totalAmount - b.paidAmount;

              return (
                <div
                  key={b.id}
                  onClick={() => (window.location.href = `/bookings/${b.id}`)}
                  className="p-5 rounded-xl border border-zinc-800 bg-[#161618]/40 hover:border-purple-500/30 transition-all cursor-pointer flex flex-col justify-between h-[220px] hover:shadow-lg hover:shadow-purple-500/5 group"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-bold">
                        {b.bookingNumber}
                      </span>
                      <span className={`px-2 py-0.5 border rounded-full text-[9px] font-bold ${statusStyle}`}>
                        {b.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-zinc-100 group-hover:text-purple-400 transition-colors leading-tight">
                      {getEventName(b.eventId)}
                    </h3>
                  </div>

                  {/* Financial progress meter */}
                  <div className="space-y-2 mt-4 text-xs">
                    <div className="flex justify-between items-center text-[10px] text-zinc-500">
                      <span>Payment Progress</span>
                      <span className="font-bold font-mono text-zinc-300">{percentPaid}% Paid</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentPaid}%` }}
                      />
                    </div>
                  </div>

                  <div className="border-t border-zinc-800/60 pt-3 mt-4 flex items-center justify-between text-xs">
                    <div className="text-zinc-500 flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{new Date(b.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Outstanding Bal</span>
                      <span className="font-bold text-rose-450 font-mono">
                        INR {outstanding.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {bookings.length === 0 && (
              <div className="col-span-full py-16 text-center border border-dashed border-zinc-800 rounded-xl text-sm text-zinc-500">
                No bookings locked yet. Click "Lock Booking" to catalog your first contract.
              </div>
            )}
          </div>
        )}
      </main>

      {/* CREATE BOOKING DIALOG (MODAL) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#111113] border border-zinc-800 rounded-xl shadow-2xl p-6 overflow-hidden animate-zoom-in">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4">
              <h2 className="text-lg font-bold text-white">Create Booking Record</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400 rounded-lg">
                {formError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-zinc-400 uppercase font-semibold tracking-wider">Associated Event Workspace</label>
                <select
                  value={selectedEventId}
                  required
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-600 font-medium"
                >
                  <option value="">-- Choose event workspace --</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 uppercase font-semibold tracking-wider">Total Contract Amount (INR)</label>
                  <input
                    type="number"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="E.g. 500000"
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-600 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 uppercase font-semibold tracking-wider">Paid Amount (INR)</label>
                  <input
                    type="number"
                    required
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="E.g. 250000"
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-600 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 uppercase font-semibold tracking-wider">Contract PDF Document URL</label>
                <input
                  type="text"
                  value={contractUrl}
                  onChange={(e) => setContractUrl(e.target.value)}
                  placeholder="E.g. https://s3.aws/contracts/roy-wedding-contract.pdf"
                  className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-xs font-semibold text-zinc-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createBookingMutation.isPending}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-all shadow-md"
                >
                  {createBookingMutation.isPending ? "Locking..." : "Lock Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
