"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  FileText,
  Search,
  Filter,
  Eye,
  DollarSign,
  AlertTriangle,
  Calendar,
  Clock,
  TrendingUp,
  Inbox,
  ArrowUpRight,
  CheckCircle2
} from "lucide-react";
import KpiCard from "../dashboard/KpiCard";
import { cn } from "@/lib/utils";

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
  clientEmail?: string;
  createdAt: string;
}

interface Booking {
  id: string;
  bookingNumber: string;
  totalAmount: number;
  paidAmount: number;
}

const INVOICE_STATUSES = ["ALL", "DRAFT", "SENT", "PENDING", "PARTIAL", "PAID", "OVERDUE", "REFUNDED", "CANCELLED"];

const STATUS_PILLS: Record<string, string> = {
  DRAFT: "border-zinc-800 bg-zinc-800/20 text-zinc-450",
  SENT: "border-blue-500/20 bg-blue-500/5 text-blue-400",
  PENDING: "border-amber-500/20 bg-amber-500/5 text-amber-500",
  PARTIAL: "border-indigo-500/20 bg-indigo-500/5 text-indigo-400",
  PAID: "border-emerald-500/20 bg-emerald-500/5 text-emerald-450",
  OVERDUE: "border-rose-500/20 bg-rose-500/5 text-rose-450",
  REFUNDED: "border-purple-500/20 bg-purple-500/5 text-purple-400",
  CANCELLED: "border-zinc-800 bg-zinc-900/10 text-zinc-650"
};

export default function InvoiceCenter() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [tax, setTax] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16));
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [notes, setNotes] = useState("");

  // 1. Fetch Invoices
  const { data: invoicesResponse, isLoading: invoicesLoading } = useQuery<{ data: Invoice[] }>({
    queryKey: ["invoices"],
    queryFn: async () => {
      const response = await api.get("/events/invoices");
      return response.data;
    }
  });

  const invoices = useMemo(() => invoicesResponse?.data || [], [invoicesResponse]);

  // 2. Fetch Bookings
  const { data: bookingsResponse } = useQuery<{ data: Booking[] }>({
    queryKey: ["bookings"],
    queryFn: async () => {
      const response = await api.get("/events/bookings");
      return response.data;
    }
  });

  const bookings = useMemo(() => bookingsResponse?.data || [], [bookingsResponse]);

  // 3. Client-side Search & Filter
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch = inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          inv.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === "ALL" || inv.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  // 4. KPI Calculations
  const kpiData = useMemo(() => {
    const totalVolume = invoices
      .filter((i) => i.status !== "CANCELLED")
      .reduce((sum, i) => sum + i.totalAmount, 0);

    const paidVolume = invoices
      .filter((i) => i.status === "PAID")
      .reduce((sum, i) => sum + i.totalAmount, 0);

    const unpaidVolume = totalVolume - paidVolume;
    const overdueCount = invoices.filter((i) => i.status === "OVERDUE").length;

    return { totalVolume, paidVolume, unpaidVolume, overdueCount };
  }, [invoices]);

  // 5. Mutation: Create Invoice
  const saveInvoiceMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post("/events/invoices", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setErrorText(err.response?.data?.error?.message || "Failed to generate invoice.");
    }
  });

  // 6. Mutation: Delete Invoice
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/events/invoices/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    }
  });

  const resetForm = () => {
    setBookingId("");
    setSubtotal("");
    setTax("0");
    setDiscount("0");
    setDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16));
    setClientName("");
    setClientEmail("");
    setBillingAddress("");
    setNotes("");
    setErrorText("");
  };

  const handleBookingChange = (id: string) => {
    setBookingId(id);
    const selected = bookings.find((b) => b.id === id);
    if (selected) {
      const balance = Math.max(0, selected.totalAmount - selected.paidAmount);
      setSubtotal(balance.toString());
      setClientName(`Client for Booking ${selected.bookingNumber}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");

    if (!bookingId) {
      setErrorText("Please link the invoice to an active booking.");
      return;
    }

    const sub = parseFloat(subtotal) || 0;
    const tx = parseFloat(tax) || 0;
    const disc = parseFloat(discount) || 0;
    
    saveInvoiceMutation.mutate({
      bookingId,
      subtotal: sub,
      tax: tx,
      discount: disc,
      dueDate: new Date(dueDate).toISOString(),
      clientName,
      clientEmail: clientEmail || undefined,
      billingAddress: billingAddress || undefined,
      notes: notes || undefined
    });
  };

  return (
    <div className="space-y-6 z-10 relative">
      
      {/* ─── KPI METRICS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Invoiced"
          value={`₹${(kpiData.totalVolume / 100000).toFixed(1)}L`}
          subtitle="All contract ledgers"
          icon={TrendingUp}
          gradientAccent="from-purple-500 to-indigo-500"
          sparklineData={[30, 45, 60, 80, 100, kpiData.totalVolume / 100000]}
        />
        <KpiCard
          title="Collected Paid"
          value={`₹${(kpiData.paidVolume / 100000).toFixed(1)}L`}
          subtitle="Fully settled invoices"
          icon={CheckCircle2}
          gradientAccent="from-emerald-500 to-teal-500"
          sparklineData={[10, 20, 35, 50, 70, kpiData.paidVolume / 100000]}
        />
        <KpiCard
          title="Outstanding Receivable"
          value={`₹${(kpiData.unpaidVolume / 100000).toFixed(1)}L`}
          subtitle="Pending balance due"
          icon={DollarSign}
          gradientAccent="from-amber-500 to-yellow-500"
          sparklineData={[20, 25, 25, 30, 30, kpiData.unpaidVolume / 100000]}
        />
        <KpiCard
          title="Overdue Invoices"
          value={kpiData.overdueCount}
          subtitle="Passed due dates"
          icon={AlertTriangle}
          gradientAccent="from-red-500 to-orange-500"
          sparklineData={[0, 1, 0, 2, 1, kpiData.overdueCount]}
        />
      </div>

      {/* ─── SEARCH & FILTER HEADER ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-850 pb-4">
        <div className="flex items-center gap-3 flex-1 max-w-md relative">
          <Search size={14} className="absolute left-3 text-zinc-550" />
          <input
            type="text"
            placeholder="Search invoice number, client name..."
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
          Generate Invoice
        </button>
      </div>

      {/* Advanced Filter options */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-[#121214]/40 border border-zinc-850 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div className="space-y-1.5 col-span-3 sm:col-span-1">
            <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">Invoice Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-xs focus:outline-none font-bold"
            >
              <option value="ALL">All Statuses</option>
              {INVOICE_STATUSES.filter(s => s !== "ALL").map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </motion.div>
      )}

      {/* ─── INVOICE LIST TABLE ─── */}
      <div className="min-h-[300px]">
        {invoicesLoading ? (
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
                  <th className="p-4">Invoice No</th>
                  <th className="p-4">Client Name</th>
                  <th className="p-4">Linked Booking</th>
                  <th className="p-4">Subtotal</th>
                  <th className="p-4">Grand Total</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/40 text-zinc-350">
                {filteredInvoices.map((inv) => {
                  const statusPill = STATUS_PILLS[inv.status] || "border-zinc-800 text-zinc-400";
                  const bookingNum = bookings.find((b) => b.id === inv.bookingId)?.bookingNumber || "Unassigned";

                  return (
                    <tr key={inv.id} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="p-4 font-mono font-bold text-zinc-400">{inv.invoiceNumber}</td>
                      <td className="p-4 font-extrabold text-zinc-200">{inv.clientName}</td>
                      <td className="p-4 font-mono">{bookingNum}</td>
                      <td className="p-4 font-mono">₹{inv.subtotal.toLocaleString()}</td>
                      <td className="p-4 font-mono font-black text-emerald-450">₹{inv.totalAmount.toLocaleString()}</td>
                      <td className="p-4">{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={cn("px-2 py-0.5 border rounded-full text-[8.5px] font-black uppercase", statusPill)}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-4 text-right flex justify-end gap-3 items-center">
                        <button
                          onClick={() => router.push(`/invoices/${inv.id}`)}
                          className="text-purple-400 hover:text-purple-300 font-bold inline-flex items-center gap-0.5 hover:underline"
                        >
                          Workspace <ArrowUpRight size={12} />
                        </button>
                        <button
                          onClick={() => deleteInvoiceMutation.mutate(inv.id)}
                          className="p-1 text-zinc-550 hover:text-red-500 rounded bg-zinc-950/20 hover:bg-red-500/10 transition-colors"
                          title="Delete Invoice"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredInvoices.length === 0 && <EmptyState />}
          </div>
        )}
      </div>

      {/* ─── CREATE INVOICE DIALOG ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#111113] border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/15 via-transparent to-transparent pointer-events-none" />

            <div className="flex justify-between items-center pb-4 border-b border-zinc-850 mb-4 z-10 relative">
              <div>
                <h2 className="text-sm font-extrabold text-white">Generate Client Invoice Receipt</h2>
                <p className="text-[10px] text-zinc-550 mt-0.5">Provision line items, billing details, and outstanding balances.</p>
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

            <form onSubmit={handleSubmit} className="space-y-4 text-xs z-10 relative">
              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-500 uppercase font-black">Associated Booking</label>
                <select
                  required
                  value={bookingId}
                  onChange={(e) => handleBookingChange(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                >
                  <option value="">-- Choose Booking --</option>
                  {bookings.map((b) => <option key={b.id} value={b.id}>{b.bookingNumber} (&bull; ₹{b.totalAmount.toLocaleString()})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-black">Client Name</label>
                  <input type="text" required value={clientName} onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-black">Client Email</label>
                  <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="name@domain.com"
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-black">Outstanding subtotal (INR)</label>
                  <input type="number" required value={subtotal} onChange={(e) => setSubtotal(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-black">Tax Rate (%)</label>
                  <input type="number" value={tax} onChange={(e) => setTax(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-black">Discount (INR)</label>
                  <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-500 uppercase font-black">Due Date</label>
                <input type="datetime-local" required value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-500 uppercase font-black">Billing Address</label>
                <input type="text" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} placeholder="123 Corporate Lane, Delhi"
                  className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-850">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-zinc-805 bg-zinc-900 rounded-lg text-zinc-300">
                  Cancel
                </button>
                <button type="submit" disabled={saveInvoiceMutation.isPending} className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white rounded-lg font-bold">
                  {saveInvoiceMutation.isPending ? "Generating..." : "Generate Invoice"}
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
        <FileText size={16} />
      </div>
      <div>
        <p className="font-extrabold text-zinc-300 text-xs">No Invoices Found</p>
        <p className="text-[10px] text-zinc-550 mt-1 max-w-[280px]">Try adjusting your search query, status filters, or link to another contract.</p>
      </div>
    </div>
  );
}
