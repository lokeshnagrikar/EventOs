"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  Plus,
  Trash2,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  CreditCard,
  Calendar,
  Wallet,
  ArrowUpRight,
  Inbox,
  AlertCircle
} from "lucide-react";
import KpiCard from "../dashboard/KpiCard";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  paymentMethod: string;
  transactionReference?: string;
  status: "PENDING" | "PENDING_VERIFICATION" | "COMPLETED" | "REFUNDED" | "FAILED";
  paymentDate: string;
  notes?: string;
}

interface Booking {
  id: string;
  bookingNumber: string;
  totalAmount: number;
  paidAmount: number;
}

const PAYMENT_METHODS = ["UPI", "CASH", "CARD", "BANK_TRANSFER", "CHEQUE"];

export default function PaymentCenter() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);

  // Modal Record State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorText, setErrorText] = useState("");
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

  const payments = useMemo(() => paymentsResponse?.data || [], [paymentsResponse]);

  // 2. Fetch Bookings
  const { data: bookingsResponse, isLoading: bookingsLoading } = useQuery<{ data: Booking[] }>({
    queryKey: ["bookings"],
    queryFn: async () => {
      const response = await api.get("/events/bookings");
      return response.data;
    }
  });

  const bookings = useMemo(() => bookingsResponse?.data || [], [bookingsResponse]);

  // 3. Client Filter
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch = (p.transactionReference || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.notes || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchMethod = methodFilter === "ALL" || p.paymentMethod === methodFilter;

      return matchSearch && matchMethod;
    });
  }, [payments, searchQuery, methodFilter]);

  // 4. KPI Calculations
  const kpiData = useMemo(() => {
    const totalVolume = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const collected = payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0);

    const outstanding = Math.max(0, totalVolume - collected);
    const ratio = totalVolume > 0 ? Math.round((collected / totalVolume) * 100) : 0;

    return { totalVolume, collected, outstanding, ratio };
  }, [bookings, payments]);

  // 5. Mutation: Save Payment
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

  // 6. Mutation: Delete Payment
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
      setErrorText("Please select an associated booking.");
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

  const isLoading = paymentsLoading || bookingsLoading;

  return (
    <div className="space-y-8 z-10 relative">
      
      {/* ─── KPI METRICS ROW ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Revenue Collected"
          value={`₹${(kpiData.collected / 100000).toFixed(1)}L`}
          subtitle="Settled transactions"
          icon={Coins}
          gradientAccent="from-emerald-500 to-teal-500"
          sparklineData={[10, 20, 35, 50, 70, kpiData.collected / 100000]}
        />
        <KpiCard
          title="Booked Volume"
          value={`₹${(kpiData.totalVolume / 100000).toFixed(1)}L`}
          subtitle="Contracts value ledger"
          icon={TrendingUp}
          gradientAccent="from-purple-500 to-indigo-500"
          sparklineData={[30, 45, 60, 80, 100, kpiData.totalVolume / 100000]}
        />
        <KpiCard
          title="Receivable Balance"
          value={`₹${(kpiData.outstanding / 100000).toFixed(1)}L`}
          subtitle="Outstanding sum due"
          icon={DollarSign}
          gradientAccent="from-amber-500 to-yellow-500"
          sparklineData={[20, 25, 25, 30, 30, kpiData.outstanding / 100000]}
        />
        <KpiCard
          title="Installment Cleared"
          value={`${kpiData.ratio}%`}
          subtitle="Cleared balance ratio"
          icon={Wallet}
          gradientAccent="from-cyan-500 to-blue-500"
          sparklineData={[10, 15, 20, 22, 28, kpiData.ratio]}
        />
      </div>

      {/* ─── REVENUE ANALYTICS PANEL & INSTALLMENT METER ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Custom SVG Lightweight Graph */}
        <div className="lg:col-span-2 p-5 border border-zinc-800 bg-[#141416]/40 rounded-2xl space-y-4">
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-300">Revenue Analytics Forecast</h3>
          
          <div className="h-44 w-full flex items-end justify-between px-2 pt-6 pb-2 border-b border-l border-zinc-850 relative">
            {/* Grid helper lines */}
            <div className="absolute top-1/4 left-0 w-full h-[0.5px] border-b border-zinc-850/40 border-dashed pointer-events-none" />
            <div className="absolute top-2/4 left-0 w-full h-[0.5px] border-b border-zinc-850/40 border-dashed pointer-events-none" />
            <div className="absolute top-3/4 left-0 w-full h-[0.5px] border-b border-zinc-850/40 border-dashed pointer-events-none" />
            
            {/* SVG area */}
            <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 40" preserveAspectRatio="none">
              <path
                d="M 5,30 Q 25,25 45,15 T 85,5"
                fill="none"
                stroke="url(#purpleGlowGradient)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="purpleGlowGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>

            {/* Monthly indicators */}
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"].map((m, idx) => (
              <div key={m} className="flex flex-col items-center gap-1.5 z-10">
                <span className="text-[7px] text-zinc-550 font-bold uppercase">{m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Installment Tracker card */}
        <div className="lg:col-span-1 p-5 border border-zinc-800 bg-[#141416]/40 rounded-2xl space-y-5 flex flex-col justify-between">
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-300">Installment Tracker</h3>
          
          <div className="flex items-center gap-6 border-b border-zinc-850/60 pb-5">
            <div className="relative h-16 w-16 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-zinc-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-purple-500" strokeWidth="3" strokeDasharray={`${kpiData.ratio}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-zinc-200">
                {kpiData.ratio}%
              </span>
            </div>
            <div>
              <span className="text-[8.5px] text-zinc-550 font-black uppercase">Installments Cleared</span>
              <p className="font-black text-zinc-200 text-sm mt-1">₹{kpiData.collected.toLocaleString()}</p>
              <p className="text-[9px] text-zinc-500">Collected cost value</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-0.5">
              <span className="text-[8px] text-zinc-550 uppercase font-black">Remaining Balance</span>
              <p className="font-black text-rose-400 font-mono">₹{kpiData.outstanding.toLocaleString()}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[8px] text-zinc-550 uppercase font-black">Upcoming Date</span>
              <p className="font-bold text-zinc-350">7 Days Avg</p>
            </div>
          </div>
        </div>

      </div>

      {/* ─── SEARCH & FILTERS ROW ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-850 pb-4">
        <div className="flex items-center gap-3 flex-1 max-w-md relative">
          <Search size={14} className="absolute left-3 text-zinc-550" />
          <input
            type="text"
            placeholder="Search txn references, description notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#121214]/60 border border-zinc-800 focus:border-purple-650 rounded-xl text-xs text-white focus:outline-none transition-colors font-medium"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "px-3 py-2 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0",
              showFilters ? "bg-purple-950/20 border-purple-550/40 text-purple-400" : "bg-zinc-900 border-zinc-800 hover:bg-zinc-850 text-zinc-400"
            )}
          >
            <Filter size={12} />
            Filters
          </button>
        </div>

        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
        >
          <Plus size={13} />
          Record Payment
        </button>
      </div>

      {/* Advanced Filter panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-[#121214]/40 border border-zinc-850 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div className="space-y-1.5 col-span-3 sm:col-span-1">
            <label className="text-[9px] text-zinc-550 uppercase font-black">Payment Method</label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-xs focus:outline-none font-bold"
            >
              <option value="ALL">All Methods</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m.replace("_", " ")}</option>
              ))}
            </select>
          </div>
        </motion.div>
      )}

      {/* ─── TRANSACTIONS LEDGER TABLE ─── */}
      <div className="min-h-[300px]">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-zinc-900/10 border border-zinc-850 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto border border-zinc-850 bg-[#121214]/20 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-850 bg-zinc-950/20 text-zinc-550 font-black uppercase text-[8.5px] tracking-wider">
                  <th className="p-4">Transaction ID</th>
                  <th className="p-4">Event Booking</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Reference No</th>
                  <th className="p-4">Paid Date</th>
                  <th className="p-4">Notes</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/40 text-zinc-350">
                {filteredPayments.map((p) => {
                  const bookingNum = bookings.find((b) => b.id === p.bookingId)?.bookingNumber || "Unassigned";

                  return (
                    <tr key={p.id} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="p-4 font-mono text-zinc-400">{p.id.substring(0, 13)}</td>
                      <td className="p-4 font-extrabold text-zinc-200">Booking {bookingNum}</td>
                      <td className="p-4 font-bold text-zinc-400">{p.paymentMethod}</td>
                      <td className="p-4 font-mono">{p.transactionReference || "N/A"}</td>
                      <td className="p-4">{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td className="p-4 text-zinc-450 italic">"{p.notes || "No descriptive notes"}"</td>
                      <td className="p-4 font-mono font-black text-emerald-450">₹{p.amount.toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => deletePaymentMutation.mutate(p.id)}
                          className="p-1 text-zinc-550 hover:text-red-500 rounded bg-zinc-950/20 hover:bg-red-500/10 transition-colors"
                          title="Delete Transaction"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredPayments.length === 0 && <EmptyState />}
          </div>
        )}
      </div>

      {/* ─── RECORD PAYMENT DIALOG ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#111113] border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/15 via-transparent to-transparent pointer-events-none" />

            <div className="flex justify-between items-center pb-4 border-b border-zinc-850 mb-4 z-10 relative">
              <div>
                <h2 className="text-sm font-extrabold text-white">Record Installment Transaction</h2>
                <p className="text-[10px] text-zinc-550 mt-0.5">Collect and register paid costs on active contract ledgers.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white">
                &times;
              </button>
            </div>

            {errorText && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400 rounded-lg">
                {errorText}
              </div>
            )}

            <form onSubmit={handleRecordSubmit} className="space-y-4 text-xs z-10 relative">
              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-500 uppercase font-black">Select Linked Booking</label>
                <select
                  required
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                >
                  <option value="">-- Choose Booking --</option>
                  {bookings.map((b) => <option key={b.id} value={b.id}>{b.bookingNumber} (&bull; Outstanding: ₹{(b.totalAmount - b.paidAmount).toLocaleString()})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-black">Transaction Amount (INR)</label>
                  <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50000"
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-black">Payment Method</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-bold">
                    <option value="UPI">UPI / GPay</option>
                    <option value="CASH">Cash Payment</option>
                    <option value="CARD">Credit/Debit Card</option>
                    <option value="BANK_TRANSFER">Bank Direct Transfer</option>
                    <option value="CHEQUE">Cheque Draft</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-black">Reference Number</label>
                  <input type="text" value={transactionReference} onChange={(e) => setTransactionReference(e.target.value)} placeholder="TXN123456789"
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-black">Transaction Date</label>
                  <input type="datetime-local" required value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-500 uppercase font-black">Description Notes</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Advance deposit, final clearance fee..."
                  className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-850">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-zinc-805 bg-zinc-900 rounded-lg text-zinc-300 font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={savePaymentMutation.isPending} className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white rounded-lg font-bold">
                  {savePaymentMutation.isPending ? "Logging..." : "Log Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border border-dashed border-zinc-850 rounded-2xl p-16 flex flex-col items-center justify-center text-center space-y-3">
      <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
        <Coins size={16} />
      </div>
      <div>
        <p className="font-extrabold text-zinc-300 text-xs">No Payments Logged</p>
        <p className="text-[10px] text-zinc-550 mt-1 max-w-[280px]">Try adjusting your search filters, query keywords, or method settings.</p>
      </div>
    </div>
  );
}
