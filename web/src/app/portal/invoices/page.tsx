"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  FileSpreadsheet,
  DollarSign,
  X,
  Loader2,
  Landmark,
  Download,
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Receipt,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
  
  // Offline Payment reference submit state
  const [txnRef, setTxnRef] = useState("");
  const [txnSuccess, setTxnSuccess] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"UPI" | "BANK" | "CARD">("UPI");

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

  // Fetch Invoices
  const { data: invoicesResponse, isLoading: loadingInvoices } = useQuery<{ data: Invoice[] }>({
    queryKey: ["clientInvoices"],
    queryFn: async () => {
      const res = await api.get("/events/invoices/client");
      return res.data;
    }
  });

  // Fetch Payments Ledger
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

  // Totals calculations
  const totalBalanceDue = clientInvoices
    .filter(i => i.status !== "PAID" && i.status !== "CANCELLED")
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const totalPaid = clientInvoices
    .filter(i => i.status === "PAID")
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const totalInvoiceValue = totalPaid + totalBalanceDue;
  const paidPercent = totalInvoiceValue > 0 ? Math.round((totalPaid / totalInvoiceValue) * 100) : 0;

  const handleOfflinePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txnRef.trim()) return;
    setTxnSuccess(true);
    setTimeout(() => {
      setTxnSuccess(false);
      setTxnRef("");
    }, 4000);
  };

  const handleDownloadInvoicePDF = (inv: Invoice) => {
    // Printable / download PDF action
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <span className="h-8 w-8 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Loading Accounts Statement...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-in text-zinc-300 select-none">
      
      {/* ─── INVOICES STATEMENT LIST ─── */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h3 className="text-base font-extrabold text-zinc-150 uppercase tracking-wider flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-purple-500" />
            Billing & Invoices
          </h3>
          <p className="text-xs text-zinc-400 mt-1.5 font-bold">
            Review detailed balances, due dates, and active invoicing summaries.
          </p>
        </div>

        {clientInvoices.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-850 rounded-2xl bg-[#161618]/10 text-zinc-500 flex flex-col items-center justify-center gap-3">
            <FileSpreadsheet size={36} className="text-zinc-700" />
            <div>
              <p className="font-semibold text-zinc-455">No invoices issued</p>
              <p className="text-xs text-zinc-650 mt-1">Invoice logs will show here once statements are generated.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {clientInvoices.map((invoice) => (
              <div
                key={invoice.id}
                onClick={() => setSelectedInvoice(invoice)}
                className="p-4.5 border border-zinc-800 hover:border-purple-650/45 bg-[#111113]/30 rounded-2xl transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:shadow shadow-purple-500/5"
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-9 w-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0 group-hover:text-purple-400 group-hover:border-purple-600/35 transition-all">
                    <FileSpreadsheet size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-zinc-200 group-hover:text-purple-400 transition-colors">{invoice.invoiceNumber}</h4>
                      <span className={`text-[8.5px] px-1.5 py-0.5 font-black uppercase rounded-full border ${
                        invoice.status === "PAID"
                          ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20"
                          : invoice.status === "OVERDUE"
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : "bg-zinc-800 text-zinc-450 border-zinc-750"
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1 font-semibold">
                      Due: {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black font-mono text-zinc-150">₹{invoice.totalAmount.toLocaleString()}</p>
                  <span className="text-[9px] text-purple-400 font-black hover:underline">View invoice breakups</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── FINANCE LEDGER & OFFLINE RESOLUTIONS ─── */}
      <div className="space-y-6">
        
        {/* Cleared vs Outstanding Progress Gauge */}
        <div className="bg-[#111113]/60 border border-zinc-805 p-5 rounded-2xl space-y-4">
          <span className="text-[9.5px] font-black text-zinc-550 uppercase tracking-wider block">Contract Value cleared</span>
          
          <div className="flex items-center gap-4">
            {/* Circular Gauge */}
            <div className="relative h-16 w-16 shrink-0 flex items-center justify-center">
              <svg className="absolute inset-0 h-full w-full -rotate-90">
                <circle cx="32" cy="32" r="26" className="stroke-zinc-850 fill-none" strokeWidth="4" />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  className="stroke-purple-500 fill-none transition-all duration-500"
                  strokeWidth="4"
                  strokeDasharray="163.3"
                  strokeDashoffset={163.3 - (163.3 * paidPercent) / 100}
                />
              </svg>
              <span className="text-[10px] font-black font-mono text-zinc-200">{paidPercent}%</span>
            </div>
            
            <div className="space-y-1.5 text-xs">
              <h4 className="font-extrabold text-zinc-150">Pending: ₹{totalBalanceDue.toLocaleString()}</h4>
              <p className="text-[10px] text-zinc-500 font-bold">Paid: ₹{totalPaid.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Clear Reference Submission Desk */}
        <div className="p-5 border border-zinc-800 bg-[#111113]/40 rounded-2xl space-y-4 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/10 via-transparent to-transparent pointer-events-none" />

          <div>
            <h4 className="text-xs font-black text-zinc-350 uppercase tracking-widest block">Log Deposit Reference</h4>
            <p className="text-[9.5px] text-zinc-550 mt-0.5">Submit bank receipts or UPI reference IDs to confirm payment.</p>
          </div>

          <AnimatePresence>
            {txnSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10.5px] rounded-xl flex items-start gap-2.5"
              >
                <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                <div>
                  <span className="font-black block">Reference Received</span>
                  <span className="text-[9px] opacity-90 mt-0.5 font-semibold">Verification pending. Ledgers will update shortly.</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleOfflinePaymentSubmit} className="space-y-3.5 text-xs">
            <div className="flex gap-2">
              {(["UPI", "BANK", "CARD"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setSelectedMethod(method)}
                  className={cn(
                    "flex-1 py-1.5 border rounded-xl font-bold text-[9px] transition-colors",
                    selectedMethod === method
                      ? "border-purple-600 bg-purple-600/5 text-purple-400"
                      : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {method}
                </button>
              ))}
            </div>

            {selectedMethod === "UPI" && (
              <div className="p-3.5 bg-zinc-950/20 border border-zinc-850 rounded-xl space-y-3 text-center">
                <span className="text-[8px] text-zinc-550 uppercase font-black tracking-widest block">Scan UPI QR Code</span>
                <div className="h-28 w-28 mx-auto bg-white p-1 rounded-xl flex items-center justify-center border border-zinc-800">
                  <QrCode size={96} className="text-black" />
                </div>
                <span className="text-[9px] text-zinc-500 font-bold block font-mono">UPI ID: eventos@yesbank</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-500 uppercase font-black">Transaction Reference Number</label>
              <input
                type="text"
                required
                value={txnRef}
                onChange={(e) => setTxnRef(e.target.value)}
                placeholder="Enter UPI Ref / Bank UTN..."
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none"
              />
            </div>

            <button type="submit" className="w-full py-2 bg-purple-650 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md">
              Verify Transaction Reference
            </button>
          </form>
        </div>

        {/* Payments Ledger logs */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
            <Landmark size={14} className="text-zinc-500" />
            Receipts Ledger
          </h3>

          <div className="space-y-2.5">
            {clientPayments.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-zinc-850 rounded-xl bg-zinc-950/20 text-zinc-550 text-[10.5px]">
                No payment history logs cleared.
              </div>
            ) : (
              clientPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="p-3.5 border border-zinc-800 bg-zinc-900/15 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-zinc-200 font-mono">₹{payment.amount.toLocaleString()}</p>
                    <p className="text-[9px] text-zinc-550 font-bold mt-0.5">
                      {payment.paymentMethod} &bull; {new Date(payment.paymentDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={cn(
                    "text-[8.5px] px-2 py-0.5 rounded-full font-black uppercase border",
                    payment.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  )}>
                    {payment.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ─── INVOICE DETAIL MODAL DIALOG ─── */}
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
              className="w-full max-w-lg bg-[#111113] border border-zinc-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/10 via-transparent to-transparent pointer-events-none" />

              <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4 z-10 relative">
                <h2 id="modal-title" className="text-xs font-black text-white flex items-center gap-2">
                  <FileSpreadsheet className="text-purple-500" size={15} />
                  Invoice Details: {selectedInvoice.invoiceNumber}
                </h2>
                <button onClick={() => setSelectedInvoice(null)} className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400">
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-4 text-xs font-medium z-10 relative">
                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-zinc-850/45">
                  <div>
                    <span className="text-zinc-500 font-bold uppercase tracking-wider text-[8.5px]">Bill To:</span>
                    <p className="font-extrabold text-zinc-200 mt-0.5">{selectedInvoice.clientName}</p>
                    <p className="text-[9px] text-zinc-500 font-mono mt-0.5">{selectedInvoice.clientEmail}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-500 font-bold uppercase tracking-wider text-[8.5px]">Due Date:</span>
                    <p className="font-extrabold text-red-400 mt-0.5">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Line item breakdown */}
                <div>
                  <span className="text-zinc-555 font-bold uppercase tracking-wider text-[9px] block mb-2">Item Specifications</span>
                  <div className="space-y-2 border border-zinc-850 bg-zinc-950/30 p-3 rounded-xl">
                    <div className="flex justify-between text-zinc-350 font-bold">
                      <span>Venue Decoration & Catering services setup</span>
                      <span>₹{selectedInvoice.subtotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Taxes & subtotals */}
                <div className="space-y-1.5 font-mono pt-3 border-t border-zinc-850/40 text-[10px]">
                  <div className="flex justify-between text-zinc-500 font-semibold">
                    <span>Subtotal:</span>
                    <span>₹{selectedInvoice.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-zinc-500 font-semibold">
                    <span>GST (18%):</span>
                    <span>₹{selectedInvoice.tax.toLocaleString()}</span>
                  </div>
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between text-emerald-500 font-semibold">
                      <span>Discount:</span>
                      <span>- ₹{selectedInvoice.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-black text-zinc-200 pt-2 border-t border-zinc-850/40">
                    <span>Grand Total:</span>
                    <span>₹{selectedInvoice.totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 flex justify-between items-center gap-4">
                  <button
                    onClick={() => handleDownloadInvoicePDF(selectedInvoice)}
                    className="flex-1 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 rounded-xl flex items-center justify-center gap-1.5 font-bold"
                  >
                    <Download size={13} />
                    Download PDF Invoice
                  </button>

                  <span className={`px-2.5 py-1 rounded-full font-black uppercase border text-[9px] ${
                    selectedInvoice.status === "PAID" ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}>
                    {selectedInvoice.status}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
