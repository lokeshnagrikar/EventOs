"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Calendar,
  Clock,
  Printer,
  Download,
  Share2,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  QrCode,
  Bell,
  Check,
  RefreshCw,
  X,
  CreditCard,
  Activity
} from "lucide-react";
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
  billingAddress?: string;
  notes?: string;
}

interface Booking {
  id: string;
  bookingNumber: string;
  totalAmount: number;
  paidAmount: number;
}

interface InvoiceHistory {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  actionBy?: string;
}

const STATUS_PILLS: Record<string, string> = {
  DRAFT: "border-zinc-800 bg-zinc-800/20 text-zinc-400",
  SENT: "border-blue-500/20 bg-blue-500/5 text-blue-400",
  VIEWED: "border-cyan-500/20 bg-cyan-500/5 text-cyan-400",
  PARTIAL: "border-indigo-500/20 bg-indigo-500/5 text-indigo-400",
  PAID: "border-emerald-500/20 bg-emerald-500/5 text-emerald-450",
  OVERDUE: "border-rose-500/20 bg-rose-500/5 text-rose-450",
  CANCELLED: "border-zinc-800 bg-zinc-900/10 text-zinc-600"
};

export default function InvoiceWorkspace({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Notification alert toasts
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "info">("success");

  // Show Toast helper
  const triggerToast = (msg: string, type: "success" | "info" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // 1. Fetch Invoice Details
  const { data: invoiceResponse, isLoading: invoiceLoading, error: invoiceError } = useQuery<{ data: Invoice }>({
    queryKey: ["invoice", invoiceId],
    queryFn: async () => {
      const response = await api.get(`/events/invoices/${invoiceId}`);
      return response.data;
    }
  });
  const invoice = invoiceResponse?.data;

  // 2. Fetch Linked Booking Details
  const { data: bookingResponse, isLoading: bookingLoading } = useQuery<{ data: Booking }>({
    queryKey: ["booking", invoice?.bookingId],
    queryFn: async () => {
      const response = await api.get(`/events/bookings/${invoice?.bookingId}`);
      return response.data;
    },
    enabled: !!invoice?.bookingId
  });
  const booking = bookingResponse?.data;

  // 3. Fetch Invoice History Audit logs
  const { data: historyResponse } = useQuery<{ data: InvoiceHistory[] }>({
    queryKey: ["invoiceHistory", invoiceId],
    queryFn: async () => {
      const response = await api.get(`/events/invoices/${invoiceId}/history`);
      return response.data;
    },
    enabled: !!invoiceId
  });
  const history = historyResponse?.data || [];

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await api.put(`/events/invoices/${invoiceId}/status`, { status });
      return response.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["invoiceHistory", invoiceId] });
      triggerToast(`Invoice status updated to ${res.data.status}`);
    },
    onError: () => triggerToast("Failed to update status", "info")
  });

  const sendReminderMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/events/invoices/${invoiceId}/remind`);
      return response.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["invoiceHistory", invoiceId] });
      triggerToast(res.message || "Payment reminder sent to customer!");
    },
    onError: () => triggerToast("Failed to dispatch reminder", "info")
  });

  const reconcileMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/events/invoices/${invoiceId}/reconcile`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["invoiceHistory", invoiceId] });
      triggerToast("Invoice ledger reconciled successfully!");
    },
    onError: () => triggerToast("Failed to reconcile invoice", "info")
  });

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleDownloadPdf = async () => {
    try {
      triggerToast("Generating PDF stream...", "info");
      // Trigger download from backend
      const response = await api.get(`/events/invoices/${invoiceId}/pdf`, {
        responseType: "blob"
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `invoice-${invoice?.invoiceNumber || "receipt"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerToast("Invoice PDF downloaded!");
    } catch (e) {
      triggerToast("PDF generation failed.", "info");
    }
  };

  const isLoading = invoiceLoading || bookingLoading;

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto w-full animate-pulse space-y-6">
        <div className="h-10 bg-zinc-900 border border-zinc-850 rounded-xl w-1/4" />
        <div className="h-[400px] bg-zinc-900/10 border border-zinc-850 rounded-2xl" />
      </div>
    );
  }

  if (invoiceError || !invoice) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="text-red-500 h-10 w-10 animate-bounce" />
        <h3 className="font-extrabold text-sm text-zinc-200">Invoice File Load Error</h3>
        <button onClick={() => router.push("/invoices")} className="px-3 py-1.5 bg-zinc-850 rounded-xl text-xs text-zinc-300">
          Back to Invoices
        </button>
      </div>
    );
  }

  const statusColor = STATUS_PILLS[invoice.status] || "border-zinc-800 text-zinc-400";
  const cgst = invoice.subtotal * 0.09;
  const sgst = invoice.subtotal * 0.09;

  // Active status milestones for billing timeline
  const statusesList = ["DRAFT", "SENT", "VIEWED", "PAID"];
  const currentStatusIndex = statusesList.indexOf(invoice.status === "PARTIAL" ? "SENT" : invoice.status);

  return (
    <div className="space-y-6 max-w-4xl mx-auto z-10 relative">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-xl text-xs font-bold border shadow-xl z-50 flex items-center gap-1.5 backdrop-blur-md",
              toastType === "success" ? "bg-emerald-950/80 border-emerald-500/20 text-emerald-400" : "bg-purple-950/80 border-purple-500/20 text-purple-400"
            )}
          >
            {toastType === "success" ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── WORKSPACE ACTIONS HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-850 pb-4 print:hidden select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/finance")}
            className="h-8 w-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-zinc-800/80"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-sm font-extrabold text-zinc-200">Invoice Workspace Details</h1>
            <p className="text-[10px] text-zinc-550 font-mono mt-0.5">Reference ID: {invoice.id}</p>
          </div>
        </div>

        {/* Operational buttons */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <button
            onClick={handleDownloadPdf}
            className="h-8 px-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 rounded-xl text-[10px] font-bold flex items-center gap-1.5"
          >
            <Download size={12} />
            PDF File
          </button>
          <button
            onClick={handlePrint}
            className="h-8 px-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 rounded-xl text-[10px] font-bold flex items-center gap-1.5"
          >
            <Printer size={12} />
            Print Receipt
          </button>

          {invoice.status !== "PAID" && (
            <>
              <button
                onClick={() => sendReminderMutation.mutate()}
                disabled={sendReminderMutation.isPending}
                className="h-8 px-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 rounded-xl text-[10px] font-bold flex items-center gap-1.5"
              >
                <Bell size={12} />
                Send Reminder
              </button>
              <button
                onClick={() => updateStatusMutation.mutate("PAID")}
                className="h-8 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1.5"
              >
                <Check size={12} />
                Mark Paid
              </button>
            </>
          )}

          <button
            onClick={() => reconcileMutation.mutate()}
            disabled={reconcileMutation.isPending}
            className="h-8 px-3 bg-purple-950/20 border border-purple-900/40 text-purple-400 hover:bg-purple-900/10 rounded-xl text-[10px] font-bold flex items-center gap-1.5"
            title="Reconcile Invoice status against bookings"
          >
            <RefreshCw size={12} className={cn(reconcileMutation.isPending && "animate-spin")} />
            Reconcile Ledger
          </button>
        </div>
      </div>

      {/* ─── STATUS MILESTONES TIMELINE ─── */}
      <div className="p-4 border border-zinc-850 bg-[#121214]/15 rounded-2xl print:hidden select-none">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {statusesList.map((step, idx) => {
            const isDone = idx <= currentStatusIndex || invoice.status === "PAID";
            return (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center gap-1.5 relative">
                  <div className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center border font-mono text-[9px] font-black transition-all duration-300",
                    isDone ? "bg-purple-650 border-purple-550 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-650"
                  )}>
                    {isDone ? <Check size={10} /> : idx + 1}
                  </div>
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-wider",
                    isDone ? "text-purple-450" : "text-zinc-650"
                  )}>
                    {step}
                  </span>
                </div>
                {idx < statusesList.length - 1 && (
                  <div className={cn(
                    "flex-1 h-[1px] -mt-4 transition-all duration-300",
                    idx < currentStatusIndex ? "bg-purple-650" : "bg-zinc-850"
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ─── PRINT-FRIENDLY INVOICE CONTAINER ─── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 border border-zinc-800 bg-[#121214]/30 backdrop-blur rounded-3xl space-y-8 print:bg-white print:text-black print:border-none print:shadow-none"
      >
        
        {/* Banner header */}
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-black print:from-black print:to-black">
              E
            </div>
            <h2 className="text-base font-black text-zinc-200 print:text-black">EventOS Operations Ledger</h2>
            <p className="text-[9.5px] text-zinc-550 leading-relaxed max-w-[240px] print:text-zinc-600">
              Sector 52, Gurgaon, Haryana, India<br />
              GSTIN: 06ABCDE1234F1Z5
            </p>
          </div>

          <div className="text-right space-y-1">
            <span className={cn("px-2.5 py-0.5 border rounded-full text-[9px] font-black uppercase inline-block mb-1.5 print:border-black print:text-black", statusColor)}>
              {invoice.status}
            </span>
            <p className="text-[9px] text-zinc-550 font-bold uppercase tracking-wider block print:text-zinc-600">Invoice Number</p>
            <h3 className="font-mono font-black text-sm text-zinc-250 print:text-black">{invoice.invoiceNumber}</h3>
          </div>
        </div>

        {/* Client details row */}
        <div className="grid grid-cols-2 gap-6 border-t border-zinc-850/60 pt-6 print:border-zinc-300">
          <div>
            <span className="text-[9px] text-zinc-500 uppercase font-black block print:text-zinc-600">Billed Client</span>
            <h4 className="font-extrabold text-zinc-200 text-xs mt-1 print:text-black">{invoice.clientName}</h4>
            {invoice.clientEmail && <p className="text-[10px] text-zinc-450 print:text-zinc-650">{invoice.clientEmail}</p>}
            {invoice.billingAddress && (
              <p className="text-[10px] text-zinc-450 mt-1 max-w-[260px] leading-relaxed print:text-zinc-600">
                {invoice.billingAddress}
              </p>
            )}
          </div>

          <div className="text-right space-y-3">
            <div>
              <span className="text-[9px] text-zinc-500 uppercase font-black block print:text-zinc-600">Date Generated</span>
              <p className="text-zinc-300 text-xs font-bold mt-0.5 print:text-black">
                {new Date(invoice.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <div>
              <span className="text-[9px] text-zinc-500 uppercase font-black block print:text-zinc-600">Payment Due Date</span>
              <p className="text-rose-400 text-xs font-black mt-0.5 print:text-black flex items-center justify-end gap-1">
                <Clock size={11} />
                {new Date(invoice.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* Items Breakdown Table */}
        <div className="space-y-2 border-t border-zinc-850/60 pt-6 print:border-zinc-300">
          <span className="text-[9px] text-zinc-500 uppercase font-black block print:text-zinc-600">Line Items Ledger</span>
          
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-850 text-zinc-550 font-black uppercase text-[8px] tracking-wider print:border-zinc-350 print:text-zinc-600">
                <th className="pb-3">Operations Description</th>
                <th className="pb-3 text-right">Tax Rate</th>
                <th className="pb-3 text-right">Discount</th>
                <th className="pb-3 text-right">Total Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850/40 text-zinc-300 print:divide-zinc-200 print:text-black">
              <tr>
                <td className="py-4 font-bold text-zinc-200 print:text-black">
                  Event Contract Allocation &mdash; Booking Ref {booking?.bookingNumber || "Linked"}
                  {invoice.notes && <p className="text-[9px] text-zinc-550 mt-1 font-normal italic leading-relaxed print:text-zinc-600">"{invoice.notes}"</p>}
                </td>
                <td className="py-4 text-right font-mono">{invoice.tax}% GST</td>
                <td className="py-4 text-right font-mono text-rose-450">&minus; ₹{invoice.discount.toLocaleString()}</td>
                <td className="py-4 text-right font-mono font-bold text-zinc-200 print:text-black">₹{invoice.subtotal.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals summation block */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-t border-zinc-850/60 pt-6 print:border-zinc-300">
          {/* QR Code and verified stamp */}
          <div className="flex items-center gap-4 bg-zinc-950/20 border border-zinc-850 p-4 rounded-2xl print:border-zinc-300 print:bg-zinc-50">
            <QrCode size={40} className="text-zinc-400 print:text-black shrink-0" />
            <div>
              <span className="text-[8px] text-zinc-550 uppercase font-black block print:text-zinc-600">Receipt Verification</span>
              <p className="text-[9px] text-zinc-455 leading-normal mt-0.5 print:text-zinc-700">Scan QR to verify this invoice receipt on Gateway Node.</p>
              <span className="text-[7.5px] text-emerald-450 font-bold flex items-center gap-1 mt-1 print:text-emerald-700">
                <ShieldCheck size={10} /> Verified Ledger Record
              </span>
            </div>
          </div>

          <div className="w-full sm:w-64 space-y-2.5 text-xs text-zinc-400 print:text-zinc-800">
            <div className="flex justify-between items-center text-[10px]">
              <span>Subtotal Cost</span>
              <span className="font-mono font-bold">₹{invoice.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span>CGST (9%)</span>
              <span className="font-mono font-bold">₹{cgst.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span>SGST (9%)</span>
              <span className="font-mono font-bold">₹{sgst.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span>Discount</span>
              <span className="font-mono font-bold text-rose-400">&minus; ₹{invoice.discount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-t border-zinc-800 pt-2.5 text-zinc-150 print:border-zinc-350 print:text-black">
              <span className="font-extrabold">Grand Total Balance</span>
              <span className="font-mono font-black text-emerald-450 text-sm print:text-black">
                INR {invoice.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Signature stamp line */}
        <div className="border-t border-zinc-850/60 pt-8 flex justify-between items-end text-[10px] text-zinc-500 print:border-zinc-300 print:text-zinc-600">
          <div>
            <p className="font-bold uppercase tracking-wider text-[8px] text-zinc-550 print:text-zinc-500">Terms & Conditions</p>
            <p className="mt-1 leading-relaxed max-w-[340px]">Payment is due within 7 days of invoice generation. Late payments accrue a 2% monthly interest fee.</p>
          </div>
          <div className="text-right space-y-4">
            <div className="h-6 w-24 border-b border-zinc-800 inline-block print:border-zinc-400" />
            <p className="uppercase tracking-widest font-black text-[8px] text-zinc-550 block print:text-zinc-500">Authorized Signature</p>
          </div>
        </div>

      </motion.div>

      {/* ─── AUDIT TRAILS & HISTORY TIMELINE ─── */}
      <div className="p-6 border border-zinc-850 bg-[#121214]/15 rounded-3xl space-y-4 print:hidden select-none">
        <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-350 flex items-center gap-1.5">
          <Activity size={14} className="text-purple-450" />
          Invoice History & Audit Trail
        </h3>
        <div className="space-y-4 pl-4 border-l border-zinc-850 relative">
          {history.map((log) => (
            <div key={log.id} className="relative space-y-1">
              <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-purple-600 border border-zinc-950" />
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-zinc-200">{log.action.replace("_", " ")}</span>
                <span className="text-[10px] text-zinc-550">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-normal">{log.description}</p>
              {log.actionBy && <span className="text-[8px] font-mono text-zinc-650 uppercase">By: {log.actionBy}</span>}
            </div>
          ))}
          {history.length === 0 && (
            <p className="text-xs text-zinc-550 py-2">No historical audit logs tracked yet.</p>
          )}
        </div>
      </div>

    </div>
  );
}
