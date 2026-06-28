"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { FileSpreadsheet, DollarSign, X, ArrowDownRight, ArrowUpRight, Loader2, Landmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Invoice {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  dueDate: string;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
  clientName: string;
  clientEmail: string;
  billingAddress?: string;
  notes?: string;
  createdAt: string;
  bookingId: string;
}

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  transactionReference?: string;
  status: "PENDING" | "PENDING_VERIFICATION" | "COMPLETED" | "REFUNDED" | "FAILED";
  paymentDate: string;
  notes?: string;
}

export default function PortalInvoicesPage() {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const modalRef = React.useRef<HTMLDivElement>(null);

  // Escape key listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedInvoice(null);
      }
    };
    if (selectedInvoice) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedInvoice]);

  // Focus trap listener
  React.useEffect(() => {
    if (selectedInvoice && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }

      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== "Tab") return;
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

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
      };

      window.addEventListener("keydown", handleTab);
      return () => window.removeEventListener("keydown", handleTab);
    }
  }, [selectedInvoice]);

  // Payment is handled offline — clients cannot directly post payment records.
  // Contact coordinator to process payment confirmation.

  // 1. Fetch Invoices
  const { data: invoicesResponse, isLoading: loadingInvoices } = useQuery<{ data: Invoice[] }>({
    queryKey: ["clientInvoices"],
    queryFn: async () => {
      const res = await api.get("/events/invoices/client");
      return res.data;
    }
  });

  // 2. Fetch Payments Ledger
  const { data: paymentsResponse, isLoading: loadingPayments } = useQuery<{ data: Payment[] }>({
    queryKey: ["clientPayments"],
    queryFn: async () => {
      const res = await api.get("/events/payments/client");
      return res.data;
    }
  });

  const clientInvoices = invoicesResponse?.data || [];
  const clientPayments = paymentsResponse?.data || [];

  const isLoading = loadingInvoices || loadingPayments;

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="animate-spin text-purple-500" size={32} />
        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Loading accounts statement...</span>
      </div>
    );
  }

  // Calculate unpaid invoice total
  const totalBalanceDue = clientInvoices
    .filter(i => i.status !== "PAID" && i.status !== "CANCELLED")
    .reduce((sum, i) => sum + i.totalAmount, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-in">
      {/* Invoices List */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h3 className="text-base font-extrabold text-zinc-150 uppercase tracking-wider flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-purple-500" />
            Billing & Invoices
          </h3>
          <p className="text-xs text-zinc-400 mt-1.5">
            Review detailed balances, due dates, and active invoicing summaries.
          </p>
        </div>

        {clientInvoices.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-850 rounded-2xl bg-[#161618]/10 text-zinc-500 flex flex-col items-center justify-center gap-3">
            <FileSpreadsheet size={36} className="text-zinc-700" />
            <div>
              <p className="font-semibold text-zinc-450">No invoices issued</p>
              <p className="text-xs text-zinc-650 mt-1">Invoice logs will show here once statements are generated.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {clientInvoices.map((invoice) => (
              <div
                key={invoice.id}
                onClick={() => setSelectedInvoice(invoice)}
                className="p-4 border border-zinc-850 hover:border-purple-650/40 bg-[#111113]/30 rounded-xl transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-9 w-9 rounded-lg bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-400 shrink-0 group-hover:text-purple-400 group-hover:border-purple-600/35 transition-colors">
                    <FileSpreadsheet size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-zinc-200">{invoice.invoiceNumber}</h4>
                      <span className={`text-[8px] px-1.5 py-0.5 font-bold uppercase rounded border ${
                        invoice.status === "PAID"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : invoice.status === "OVERDUE"
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : "bg-zinc-800 text-zinc-400 border-zinc-750"
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1">
                      Due Date: {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold font-mono text-zinc-150">INR {invoice.totalAmount.toLocaleString()}</p>
                  <span className="text-[9px] text-purple-400 font-bold hover:underline">View invoice breakups</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payments Ledger sidebar */}
      <div className="space-y-6">
        <div className="bg-[#111113]/60 border border-zinc-850/80 p-5 rounded-2xl space-y-4">
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Total Outstanding Balance</span>
          <div className="space-y-1">
            <h4 className="text-2xl font-black text-white font-mono">INR {totalBalanceDue.toLocaleString()}</h4>
            <p className="text-[10px] text-zinc-500 font-medium">Accumulated due sum across all active bookings.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
              <Landmark size={15} className="text-zinc-500" />
              Payments Ledger
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Logs of deposit clears and transactions.</p>
          </div>

          <div className="space-y-3">
            {clientPayments.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-zinc-850 rounded-xl bg-zinc-950/20 text-zinc-500 text-xs">
                No payment history registered.
              </div>
            ) : (
              clientPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="p-3.5 border border-zinc-850 bg-zinc-900/15 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-zinc-200 font-mono">INR {payment.amount.toLocaleString()}</p>
                    <p className="text-[9px] text-zinc-500 font-medium">
                      {payment.paymentMethod} • {new Date(payment.paymentDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase border ${
                    payment.status === "COMPLETED"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : payment.status === "PENDING_VERIFICATION"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}>
                    {payment.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* INVOICE DETAIL MODAL */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#111113] border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4">
                <h2 id="modal-title" className="text-base font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="text-purple-500" size={16} />
                  Invoice Details: {selectedInvoice.invoiceNumber}
                </h2>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4 text-xs font-medium">
                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-zinc-850/45">
                  <div>
                    <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">Bill To:</span>
                    <p className="font-bold text-zinc-200 mt-0.5">{selectedInvoice.clientName}</p>
                    <p className="text-[9px] text-zinc-500 font-mono mt-0.5">{selectedInvoice.clientEmail}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">Due Date:</span>
                    <p className="font-bold text-red-400 mt-0.5">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {selectedInvoice.billingAddress && (
                  <div>
                    <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">Billing Location:</span>
                    <p className="text-zinc-400 mt-1 leading-relaxed">{selectedInvoice.billingAddress}</p>
                  </div>
                )}

                {/* Totals */}
                <div className="space-y-1.5 font-mono pt-3.5 border-t border-zinc-850/40 text-[11px]">
                  <div className="flex justify-between text-zinc-500">
                    <span>Subtotal:</span>
                    <span>INR {selectedInvoice.subtotal.toLocaleString()}</span>
                  </div>
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between text-emerald-500">
                      <span>Discount:</span>
                      <span>- INR {selectedInvoice.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-zinc-500">
                    <span>Tax (GST):</span>
                    <span>INR {selectedInvoice.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-zinc-200 pt-2 border-t border-zinc-850/40">
                    <span>Total Amount:</span>
                    <span>INR {selectedInvoice.totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {selectedInvoice.notes && (
                  <div className="p-3 bg-zinc-900/30 border border-zinc-850/60 rounded-xl text-zinc-400 mt-4 leading-relaxed">
                    <h5 className="font-bold text-zinc-350 mb-1">Payment Instructions</h5>
                    {selectedInvoice.notes}
                  </div>
                )}

                <div className="pt-4 border-t border-zinc-800 flex justify-between items-center mt-6">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">Statement Status:</span>
                  <span className={`px-2.5 py-0.5 rounded font-extrabold uppercase border ${
                    selectedInvoice.status === "PAID"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}>
                    {selectedInvoice.status}
                  </span>
                </div>

                {selectedInvoice.status !== "PAID" && selectedInvoice.status !== "CANCELLED" && (
                  <div className="mt-4 pt-4 border-t border-zinc-800">
                    <div className="w-full p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                        <DollarSign size={15} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-300">Ready to Pay?</p>
                        <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                          Share your UPI transaction reference or bank transfer receipt with your event coordinator to confirm payment.
                          Payments are verified and confirmed by your team.
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-2 font-mono">
                          Invoice: <span className="text-zinc-300 font-bold">{selectedInvoice.invoiceNumber}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
