"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Plus,
  Trash2,
  DollarSign,
  CreditCard,
  ArrowLeft,
  AlertCircle,
  Calendar,
  TrendingUp,
  Wallet,
  Coins,
  FileSpreadsheet
} from "lucide-react";

interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  paymentMethod: string;
  transactionReference?: string;
  status: string;
  paymentDate: string;
  notes?: string;
}

interface Booking {
  id: string;
  bookingNumber: string;
  totalAmount: number;
  paidAmount: number;
}

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorText, setErrorText] = useState("");

  // Form State
  const [bookingId, setBookingId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [transactionReference, setTransactionReference] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 16));

  // 1. Fetch Payments
  const { data: paymentsResponse, isLoading: paymentsLoading } = useQuery<{ data: Payment[] }>({
    queryKey: ["payments"],
    queryFn: async () => {
      const response = await api.get("/events/payments");
      return response.data;
    }
  });

  const payments = paymentsResponse?.data || [];

  // 2. Fetch Bookings (to link payments to a specific booking)
  const { data: bookingsResponse, isLoading: bookingsLoading } = useQuery<{ data: Booking[] }>({
    queryKey: ["bookings"],
    queryFn: async () => {
      const response = await api.get("/events/bookings");
      return response.data;
    }
  });

  const bookings = bookingsResponse?.data || [];

  // 3. Mutation: Save Payment
  const savePaymentMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post("/events/payments", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setErrorText(err.response?.data?.error?.message || "Failed to log payment transaction.");
    }
  });

  // 4. Mutation: Delete Payment
  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/events/payments/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    }
  });

  const resetForm = () => {
    setBookingId("");
    setAmount("");
    setPaymentMethod("UPI");
    setTransactionReference("");
    setNotes("");
    setPaymentDate(new Date().toISOString().slice(0, 16));
    setErrorText("");
  };

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");

    if (!bookingId) {
      setErrorText("Please select an active booking.");
      return;
    }

    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      setErrorText("Please enter a valid positive payment amount.");
      return;
    }

    savePaymentMutation.mutate({
      bookingId,
      amount: amtNum,
      paymentMethod,
      transactionReference,
      notes,
      paymentDate: new Date(paymentDate).toISOString()
    });
  };

  // Metric Computations
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalBookedAmount = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalOutstanding = Math.max(0, totalBookedAmount - totalRevenue);

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
            <span className="font-bold text-base">Payment Ledger</span>
            <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">Transactions</span>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md"
        >
          <Plus size={16} />
          Record Payment
        </button>
      </nav>

      {/* Main Workspace */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-8">
        {/* Bento Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Revenue Collected */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-[#161618]/40 shadow-sm flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Revenue Collected</span>
              <div className="h-7 w-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-450">
                <Coins size={14} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-extrabold tracking-tight text-zinc-100">
                INR {totalRevenue.toLocaleString()}
              </p>
              <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                <TrendingUp size={12} className="text-emerald-500" />
                Across {payments.length} successful transactions
              </p>
            </div>
          </div>

          {/* Card 2: Outstanding Balance */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-[#161618]/40 shadow-sm flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Outstanding Balance</span>
              <div className="h-7 w-7 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Wallet size={14} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-extrabold tracking-tight text-purple-450">
                INR {totalOutstanding.toLocaleString()}
              </p>
              <p className="text-[10px] text-zinc-500 mt-1">
                Outstanding from booked contracts
              </p>
            </div>
          </div>

          {/* Card 3: Total Value Booked */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-[#161618]/40 shadow-sm flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Contracts Value</span>
              <div className="h-7 w-7 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                <FileSpreadsheet size={14} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-extrabold tracking-tight text-zinc-200">
                INR {totalBookedAmount.toLocaleString()}
              </p>
              <p className="text-[10px] text-zinc-500 mt-1">
                Total pipeline amount across {bookings.length} bookings
              </p>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="border border-zinc-800 bg-[#111113]/30 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-zinc-850 flex items-center justify-between">
            <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-350">Transaction Register</h3>
            <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-500 rounded font-bold font-mono">
              {payments.length} RECORDS
            </span>
          </div>

          {paymentsLoading ? (
            <div className="text-center py-12 text-zinc-500 animate-pulse italic text-xs">
              Fetching transaction ledger...
            </div>
          ) : (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-850 bg-zinc-900/30 text-zinc-400 font-bold">
                    <th className="p-4">Booking Number</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Payment Method</th>
                    <th className="p-4">Transaction Ref</th>
                    <th className="p-4">Notes</th>
                    <th className="p-4 text-right">Amount</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {payments.map((pay) => {
                    const booking = bookings.find((b) => b.id === pay.bookingId);
                    return (
                      <tr key={pay.id} className="hover:bg-[#161618]/30 transition-all">
                        <td className="p-4 font-bold text-zinc-200">
                          {booking ? booking.bookingNumber : "Unknown"}
                        </td>
                        <td className="p-4 text-zinc-450">
                          {new Date(pay.paymentDate).toLocaleDateString()} {new Date(pay.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold border border-purple-500/20 bg-purple-500/5 text-purple-400">
                            <CreditCard size={10} />
                            {pay.paymentMethod}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-zinc-450">{pay.transactionReference || "—"}</td>
                        <td className="p-4 text-zinc-450 max-w-[200px] truncate">{pay.notes || "—"}</td>
                        <td className="p-4 text-right font-mono font-bold text-emerald-450">
                          INR {pay.amount.toLocaleString()}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => {
                              if (confirm("Delete this transaction? This will automatically update booking outstanding balance.")) {
                                deletePaymentMutation.mutate(pay.id);
                              }
                            }}
                            className="h-7 w-7 rounded bg-zinc-800/40 hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center text-zinc-500 transition-all"
                            aria-label="Delete payment transaction"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-zinc-500 italic">
                        No payments logged in the system ledger.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111113] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/30">
              <h3 className="font-bold text-sm text-zinc-200">Record Payment Transaction</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-sm font-semibold transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="p-5 space-y-4 text-xs">
              {errorText && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{errorText}</span>
                </div>
              )}

              {/* Booking Selection */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold uppercase">Linked Booking Contract</label>
                <select
                  required
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-600"
                >
                  <option value="">Select booking...</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bookingNumber} (Paid: INR {b.paidAmount.toLocaleString()} / INR {b.totalAmount.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold uppercase">Payment Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-500">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="E.g. 50000"
                    className="w-full pl-7 pr-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              {/* Method & Date Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-semibold uppercase">Payment Method</label>
                  <select
                    required
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-600"
                  >
                    <option value="UPI">UPI Transfer</option>
                    <option value="CASH">Cash Payment</option>
                    <option value="CARD">Credit/Debit Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-semibold uppercase">Payment Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              {/* Reference */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold uppercase">Transaction Reference (UPI/Txn ID)</label>
                <input
                  type="text"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  placeholder="E.g. TXN1028392182"
                  className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold uppercase">Private Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Notes or references..."
                  className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savePaymentMutation.isPending}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-750 text-white rounded-lg font-semibold transition-colors"
                >
                  {savePaymentMutation.isPending ? "Logging..." : "Log Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
