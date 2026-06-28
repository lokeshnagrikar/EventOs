"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Plus,
  Trash2,
  FileText,
  ArrowLeft,
  AlertCircle,
  Calendar,
  Eye,
  Send,
  CheckCircle,
  FileX
} from "lucide-react";

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

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; num: string } | null>(null);

  // Form State
  const [bookingId, setBookingId] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [tax, setTax] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16));
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [notes, setNotes] = useState("");

  const modalRef = React.useRef<HTMLDivElement>(null);

  // Keyboard Escape listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
        setDeleteTarget(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Keyboard focus trap
  React.useEffect(() => {
    if (isModalOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
      );
      if (focusableElements.length > 0) {
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        firstElement.focus();

        const handleTabTrap = (e: KeyboardEvent) => {
          if (e.key === "Tab") {
            if (e.shiftKey) {
              if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
              }
            } else {
              if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
              }
            }
          }
        };

        const currentModalRef = modalRef.current;
        currentModalRef.addEventListener("keydown", handleTabTrap);
        return () => {
          currentModalRef.removeEventListener("keydown", handleTabTrap);
        };
      }
    }
  }, [isModalOpen]);

  // 1. Fetch Invoices
  const { data: invoicesResponse, isLoading: invoicesLoading } = useQuery<{ data: Invoice[] }>({
    queryKey: ["invoices"],
    queryFn: async () => {
      const response = await api.get("/events/invoices");
      return response.data;
    }
  });

  const invoices = invoicesResponse?.data || [];

  // 2. Fetch Bookings (to autofill values or link the invoice)
  const { data: bookingsResponse } = useQuery<{ data: Booking[] }>({
    queryKey: ["bookings"],
    queryFn: async () => {
      const response = await api.get("/events/bookings");
      return response.data;
    }
  });

  const bookings = bookingsResponse?.data || [];

  // 3. Mutation: Save Invoice
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

  // 4. Mutation: Delete Invoice
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
      // Autocomplete subtotal with outstanding contract value
      const balance = Math.max(0, selected.totalAmount - selected.paidAmount);
      setSubtotal(balance.toString());
      setClientName(`Client for Booking ${selected.bookingNumber}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");

    if (!bookingId) {
      setErrorText("Please link invoice to a booking.");
      return;
    }

    const subPaisa = Math.round(parseFloat(subtotal) * 100);
    const taxPaisa = Math.round(parseFloat(tax) * 100);
    const discPaisa = Math.round(parseFloat(discount) * 100);

    if (isNaN(subPaisa) || subPaisa < 0) {
      setErrorText("Subtotal must be a non-negative number.");
      return;
    }
    if (isNaN(taxPaisa) || taxPaisa < 0) {
      setErrorText("Tax must be a non-negative number.");
      return;
    }
    if (isNaN(discPaisa) || discPaisa < 0) {
      setErrorText("Discount must be a non-negative number.");
      return;
    }
    if (discPaisa > subPaisa + taxPaisa) {
      setErrorText("Discount cannot exceed subtotal plus tax.");
      return;
    }
    if (!clientName.trim()) {
      setErrorText("Client Name is required.");
      return;
    }

    saveInvoiceMutation.mutate({
      bookingId,
      subtotal: subPaisa / 100,
      tax: taxPaisa / 100,
      discount: discPaisa / 100,
      dueDate: new Date(dueDate).toISOString(),
      clientName,
      clientEmail,
      billingAddress,
      notes
    });
  };

  const filteredInvoices = statusFilter === "ALL"
    ? invoices
    : invoices.filter((inv) => inv.status === statusFilter);

  // Metric Computations
  const draftCount = invoices.filter((i) => i.status === "DRAFT").length;
  const sentCount = invoices.filter((i) => i.status === "SENT").length;
  const paidCount = invoices.filter((i) => i.status === "PAID").length;
  const overdueCount = invoices.filter((i) => i.status === "OVERDUE").length;

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex flex-col relative overflow-hidden transition-all duration-200">
      
      {/* Background glow effects to match landing page theme */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Top Navbar */}
      <nav className="h-16 border-b border-zinc-800 bg-[#111113]/80 backdrop-blur px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="h-8 w-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-zinc-700/50"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">Invoices Manager</span>
            <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">Billing</span>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-purple-600/10 active:scale-[0.98]"
        >
          <Plus size={16} />
          Generate Invoice
        </button>
      </nav>

      {/* Main Workspace */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Metric widgets layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-zinc-800 bg-[#161618]/30">
            <span className="text-[10px] text-zinc-500 font-bold block uppercase">Draft Bills</span>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xl font-bold text-zinc-150">{draftCount}</span>
              <FileText size={16} className="text-zinc-600" />
            </div>
          </div>
          <div className="p-4 rounded-xl border border-zinc-800 bg-[#161618]/30">
            <span className="text-[10px] text-zinc-500 font-bold block uppercase">Invoices Sent</span>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xl font-bold text-blue-400">{sentCount}</span>
              <Send size={16} className="text-blue-500/50" />
            </div>
          </div>
          <div className="p-4 rounded-xl border border-zinc-800 bg-[#161618]/30">
            <span className="text-[10px] text-zinc-500 font-bold block uppercase">Fully Settled</span>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xl font-bold text-emerald-450">{paidCount}</span>
              <CheckCircle size={16} className="text-emerald-500/50" />
            </div>
          </div>
          <div className="p-4 rounded-xl border border-zinc-800 bg-[#161618]/30">
            <span className="text-[10px] text-zinc-500 font-bold block uppercase">Overdue Receivables</span>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xl font-bold text-rose-400">{overdueCount}</span>
              <FileX size={16} className="text-rose-500/50" />
            </div>
          </div>
        </div>

        {/* Invoice Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 select-none">
          {INVOICE_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                statusFilter === status
                  ? "bg-purple-600/15 border-purple-500/35 text-purple-400"
                  : "bg-zinc-900/30 border-zinc-850 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Invoices List Table */}
        <div className="border border-zinc-800 bg-[#111113]/30 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-zinc-850 flex items-center justify-between">
            <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-350">Billing Statements</h3>
            <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-500 rounded font-bold font-mono">
              {filteredInvoices.length} INVOICES
            </span>
          </div>

          {invoicesLoading ? (
            <div className="text-center py-12 text-zinc-500 animate-pulse italic text-xs">
              Fetching invoice list...
            </div>
          ) : (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-850 bg-zinc-900/30 text-zinc-400 font-bold">
                    <th className="p-4">Invoice Number</th>
                    <th className="p-4">Booking</th>
                    <th className="p-4">Billed To</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Total Invoice Sum</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {filteredInvoices.map((inv) => {
                    const booking = bookings.find((b) => b.id === inv.bookingId);
                    const isOverdue = new Date(inv.dueDate) < new Date() && inv.status !== "PAID" && inv.status !== "CANCELLED";
                    const statusStr = isOverdue ? "OVERDUE" : inv.status;
                    const pillStyle = STATUS_PILLS[statusStr] || STATUS_PILLS.DRAFT;

                    return (
                      <tr key={inv.id} className="hover:bg-[#161618]/30 transition-all">
                        <td className="p-4 font-bold text-zinc-200">
                          {inv.invoiceNumber}
                        </td>
                        <td className="p-4 text-zinc-450 font-semibold">
                          {booking ? booking.bookingNumber : "—"}
                        </td>
                        <td className="p-4">
                          <div>
                            <span className="font-bold block text-zinc-200">{inv.clientName}</span>
                            <span className="text-[10px] text-zinc-500 block">{inv.clientEmail || "—"}</span>
                          </div>
                        </td>
                        <td className="p-4 text-zinc-450">
                          {new Date(inv.dueDate).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-2 py-0.5 border rounded-full text-[9px] font-bold ${pillStyle}`}>
                            {statusStr}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-zinc-250">
                          INR {inv.totalAmount.toLocaleString()}
                        </td>
                        <td className="p-4 flex items-center justify-center gap-2">
                          <button
                            onClick={() => router.push(`/invoices/${inv.id}`)}
                            className="h-7 w-7 rounded bg-zinc-800/40 hover:bg-zinc-700 hover:text-white flex items-center justify-center text-zinc-400 transition-all"
                            aria-label="View Printable Invoice Sheet"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ id: inv.id, num: inv.invoiceNumber })}
                            className="h-7 w-7 rounded bg-zinc-800/40 hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center text-zinc-500 transition-all"
                            aria-label="Delete Invoice"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-zinc-500 italic">
                        No invoices found under selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Generate Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div ref={modalRef} className="bg-[#111113] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/30">
              <h3 id="modal-title" className="font-bold text-sm text-zinc-200">Generate New Billing Invoice</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-sm font-semibold transition-colors"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {errorText && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{errorText}</span>
                </div>
              )}

              {/* Booking Contract selection */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold uppercase">Linked Booking Contract</label>
                <select
                  required
                  value={bookingId}
                  onChange={(e) => handleBookingChange(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-600"
                >
                  <option value="">Select contract...</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bookingNumber} (Total: INR {b.totalAmount.toLocaleString()} • Paid: INR {b.paidAmount.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Client Info Grid */}
              <div className="space-y-3 p-3 bg-zinc-900/20 border border-zinc-800/60 rounded-xl">
                <h4 className="font-bold text-[10px] uppercase text-zinc-400 tracking-wider">Client Billing Info</h4>
                
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-semibold">Client Name</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Full client name"
                    className="w-full px-3 py-1.5 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-semibold">Client Email (Optional)</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@gmail.com"
                    className="w-full px-3 py-1.5 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-semibold">Billing Address (Optional)</label>
                  <input
                    type="text"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    placeholder="E.g. Sector-15, Noida"
                    className="w-full px-3 py-1.5 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              {/* Prices calculations grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-semibold uppercase">Subtotal (₹)</label>
                  <input
                    type="number"
                    required
                    value={subtotal}
                    onChange={(e) => setSubtotal(e.target.value)}
                    placeholder="Subtotal"
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-600 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-semibold uppercase">Taxes / GST (₹)</label>
                  <input
                    type="number"
                    required
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-600 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-semibold uppercase">Discount (₹)</label>
                  <input
                    type="number"
                    required
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-600 font-mono"
                  />
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold uppercase">Due Date</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-zinc-500"><Calendar size={14} /></span>
                  <input
                    type="datetime-local"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold uppercase">Invoice Terms / Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Terms, bank account instructions..."
                  className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveInvoiceMutation.isPending}
                  className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold transition-all shadow-md shadow-purple-600/10 active:scale-[0.98]"
                >
                  {saveInvoiceMutation.isPending ? "Generating..." : "Generate Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accessible Void / Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div className="bg-[#111113] border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-4">
            <h3 id="delete-title" className="font-bold text-base text-zinc-200">Confirm Deletion</h3>
            <p className="text-xs text-zinc-400">
              Are you sure you want to void invoice <span className="font-mono text-zinc-200 font-semibold">{deleteTarget.num}</span>? This action cannot be undone and will record a reversing entry in the ledger.
            </p>
            <div className="flex gap-3 pt-2 text-xs">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-350 rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteInvoiceMutation.mutate(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="flex-1 py-2 bg-red-650 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
              >
                Void Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
