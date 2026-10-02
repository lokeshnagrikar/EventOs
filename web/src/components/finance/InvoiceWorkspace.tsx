"use client";

import React, { useMemo, useState, useEffect } from "react";
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
  Activity,
  Sparkles,
  Building2,
  Crown,
  Zap,
  BarChart3,
  CheckCircle,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/lib/toastStore";
import DynamicUpiQrModal from "@/components/finance/DynamicUpiQrModal";
import { emitWorkspaceNotification } from "@/lib/notificationService";

export type InvoiceTemplateId = "ROYAL_WEDDING" | "GST_CORPORATE" | "MINIMAL_STUDIO" | "MILESTONE_SPLIT";

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
  const addToast = useToastStore((state) => state.addToast);

  const triggerToast = (msg: string, type: "success" | "info" = "success") => {
    addToast(msg, type === "success" ? "success" : "info");
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

  // Parse template from notes
  const detectedTemplate = useMemo<InvoiceTemplateId>(() => {
    if (invoice?.notes && invoice.notes.includes("[TPL:")) {
      const match = invoice.notes.match(/\[TPL:(\w+)\]/);
      if (match && ["ROYAL_WEDDING", "GST_CORPORATE", "MINIMAL_STUDIO", "MILESTONE_SPLIT"].includes(match[1])) {
        return match[1] as InvoiceTemplateId;
      }
    }
    return "ROYAL_WEDDING";
  }, [invoice?.notes]);

  const [activeTemplate, setActiveTemplate] = useState<InvoiceTemplateId>("ROYAL_WEDDING");

  useEffect(() => {
    if (detectedTemplate) {
      setActiveTemplate(detectedTemplate);
    }
  }, [detectedTemplate]);

  const cleanNotes = useMemo(() => {
    if (!invoice?.notes) return "";
    return invoice.notes.replace(/\[TPL:\w+\]\s*/g, "").trim();
  }, [invoice?.notes]);

  // Real Owner Payment Destination from Workspace Settings
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [ownerPaymentConfig, setOwnerPaymentConfig] = useState({
    upiId: "eventos@okhdfcbank",
    accountHolder: "EventOS Workspace",
    bankName: "HDFC Bank",
    accountNumber: "50100293847192",
    ifsc: "HDFC0001092"
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedConfig = localStorage.getItem("eventos_payment_engine_config");
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig);
          if (parsed.ownerUpiId) {
            setOwnerPaymentConfig((prev) => ({
              ...prev,
              upiId: parsed.ownerUpiId,
              accountHolder: parsed.ownerAccountHolder || prev.accountHolder,
              bankName: parsed.ownerBankName || prev.bankName,
              accountNumber: parsed.ownerAccountNumber || prev.accountNumber,
              ifsc: parsed.ownerIfsc || prev.ifsc
            }));
          }
        } catch (e) {}
      }
      const directDest = localStorage.getItem("eventos_direct_payment_destination");
      if (directDest) {
        try {
          const parsed = JSON.parse(directDest);
          if (parsed.ownerUpiId) {
            setOwnerPaymentConfig((prev) => ({
              ...prev,
              upiId: parsed.ownerUpiId,
              accountHolder: parsed.ownerAccountName || prev.accountHolder,
              bankName: parsed.ownerBankName || prev.bankName,
              accountNumber: parsed.ownerAccountNumber || prev.accountNumber,
              ifsc: parsed.ownerIfsc || prev.ifsc
            }));
          }
        } catch (e) {}
      }
    }
  }, []);

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
      triggerToast("Invoice successfully reconciled against ledger!");
    },
    onError: () => triggerToast("Reconciliation failed", "info")
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      window.print();
      triggerToast("Preparing Print / PDF document...");
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

      {/* ─── WORKSPACE ACTIONS HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-850 pb-4 print:hidden select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/finance")}
            className="h-8 w-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-zinc-800/80 cursor-pointer"
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
            className="h-8 px-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={12} />
            PDF File
          </button>
          <button
            onClick={handlePrint}
            className="h-8 px-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={12} />
            Print Receipt
          </button>

          {invoice.status !== "PAID" && (
            <>
              <button
                onClick={() => sendReminderMutation.mutate()}
                disabled={sendReminderMutation.isPending}
                className="h-8 px-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Bell size={12} />
                Send Reminder
              </button>
              <button
                onClick={() => updateStatusMutation.mutate("PAID")}
                className="h-8 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Check size={12} />
                Mark Paid
              </button>
            </>
          )}

          <button
            onClick={() => reconcileMutation.mutate()}
            disabled={reconcileMutation.isPending}
            className="h-8 px-3 bg-purple-950/20 border border-purple-900/40 text-purple-400 hover:bg-purple-900/10 rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-pointer"
            title="Reconcile Invoice status against bookings"
          >
            <RefreshCw size={12} className={cn(reconcileMutation.isPending && "animate-spin")} />
            Reconcile Ledger
          </button>
        </div>
      </div>

      {/* ─── TEMPLATE SWITCHER BAR (Interactive Preview Control) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-[#121214]/60 border border-zinc-800 rounded-2xl print:hidden select-none">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-purple-400" />
          <span className="text-[10px] text-zinc-400 font-mono uppercase font-black tracking-wider">
            Presentation Template:
          </span>
          <span className="text-xs font-bold text-white">
            {activeTemplate === "ROYAL_WEDDING" && "💍 Royal Luxury Wedding"}
            {activeTemplate === "GST_CORPORATE" && "🏢 Classic GST Tax (Rule 46)"}
            {activeTemplate === "MINIMAL_STUDIO" && "⚡ Minimal Modern Studio"}
            {activeTemplate === "MILESTONE_SPLIT" && "📊 Milestone Advance & UPI QR"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {([
            { id: "ROYAL_WEDDING", label: "💍 Royal Wedding", desc: "Gold Luxe" },
            { id: "GST_CORPORATE", label: "🏢 Classic GST", desc: "Rule 46 Tax" },
            { id: "MINIMAL_STUDIO", label: "⚡ Modern Studio", desc: "Monochrome" },
            { id: "MILESTONE_SPLIT", label: "📊 Milestone Split", desc: "50-25-25 + UPI" },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTemplate(t.id);
                triggerToast(`Switched preview to ${t.label}`, "info");
              }}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer",
                activeTemplate === t.id
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/25 ring-1 ring-purple-400"
                  : "bg-zinc-800/80 hover:bg-zinc-750 text-zinc-400 hover:text-white border border-zinc-700/60"
              )}
            >
              {t.label}
            </button>
          ))}
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

      {/* ═══════════════════════════════════════════════════════════════
          TEMPLATE 1: 💍 ROYAL LUXURY WEDDING TEMPLATE
          ═══════════════════════════════════════════════════════════════ */}
      {activeTemplate === "ROYAL_WEDDING" && (
        <motion.div
          key="royal"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 sm:p-10 border border-amber-500/25 bg-gradient-to-b from-[#18131d] via-[#100d14] to-[#0c0a0e] rounded-3xl space-y-8 shadow-2xl relative overflow-hidden print:bg-white print:text-black print:border-none print:shadow-none"
        >
          {/* Ornamental Background Accent */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />
          
          {/* Header */}
          <div className="flex justify-between items-start gap-4 border-b border-amber-500/20 pb-6 print:border-zinc-300">
            <div className="space-y-1.5">
              <span className="text-[10px] text-amber-400 font-mono font-black uppercase tracking-widest flex items-center gap-1.5">
                <Crown size={13} className="text-amber-400" /> EVENTOS ROYALE BESPOKE CELEBRATIONS
              </span>
              <h2 className="text-xl sm:text-2xl font-serif italic font-bold text-amber-100 print:text-black">
                Royal Wedding Celebration
              </h2>
              <p className="text-xs text-zinc-400 max-w-sm leading-relaxed print:text-zinc-600">
                Official ceremonial invoice & hospitality ledger. Managed exclusively under EventOS Luxury Suite.
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase border border-amber-500/40 bg-amber-500/10 text-amber-300 print:border-black print:text-black inline-block">
                {invoice.status}
              </span>
              <p className="text-[9px] text-zinc-400 uppercase font-mono font-bold">Folio Number</p>
              <h3 className="font-mono font-bold text-amber-200 text-sm print:text-black">{invoice.invoiceNumber}</h3>
            </div>
          </div>

          {/* Client Details Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white/[0.02] p-5 rounded-2xl border border-amber-500/15 print:border-zinc-300 print:bg-zinc-50">
            <div>
              <span className="text-[9px] text-amber-400 uppercase font-black tracking-wider block font-mono">Honored Patron / Family</span>
              <h4 className="font-serif italic font-bold text-lg text-white mt-1 print:text-black">{invoice.clientName}</h4>
              {invoice.clientEmail && <p className="text-xs text-zinc-400 mt-0.5 print:text-zinc-600">{invoice.clientEmail}</p>}
              {invoice.billingAddress && <p className="text-xs text-zinc-400 mt-1 max-w-xs">{invoice.billingAddress}</p>}
            </div>

            <div className="sm:text-right space-y-2">
              <div>
                <span className="text-[9px] text-zinc-400 uppercase font-mono font-bold block">Celebration Reference</span>
                <p className="text-xs text-zinc-200 font-bold font-mono">Booking Ref #{booking?.bookingNumber || "CONFIRMED"}</p>
              </div>
              <div>
                <span className="text-[9px] text-zinc-400 uppercase font-mono font-bold block">Ceremony Due Date</span>
                <p className="text-xs text-amber-300 font-bold font-mono flex sm:justify-end items-center gap-1">
                  <Calendar size={12} /> {new Date(invoice.dueDate).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>
          </div>

          {/* Line items table */}
          <div className="space-y-3">
            <span className="text-[10px] text-amber-400 uppercase font-mono font-black tracking-wider block">Ceremonial Deliverables Ledger</span>
            <div className="border border-amber-500/20 rounded-2xl overflow-hidden print:border-zinc-300">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-amber-950/20 text-amber-300 border-b border-amber-500/20 text-[9px] font-mono uppercase font-black print:bg-zinc-100 print:text-black">
                    <th className="p-3.5">Scope & Production Milestone</th>
                    <th className="p-3.5 text-right">Tax (GST)</th>
                    <th className="p-3.5 text-right">Investment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-zinc-200 print:text-black">
                  <tr>
                    <td className="p-3.5 space-y-1">
                      <p className="font-bold text-white text-xs print:text-black">Mandap Architecture, Stage Scenography & Royal Banquet</p>
                      <p className="text-[11px] text-zinc-400 italic font-serif">
                        {cleanNotes || "Curated royal destination event execution, concert AV lighting, and luxury hospitality."}
                      </p>
                    </td>
                    <td className="p-3.5 text-right font-mono text-zinc-400">{invoice.tax}%</td>
                    <td className="p-3.5 text-right font-mono font-bold text-amber-200 print:text-black">₹{invoice.subtotal.toLocaleString("en-IN")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-end gap-6 pt-4 border-t border-amber-500/20 print:border-zinc-300">
            <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <ShieldCheck size={28} className="text-amber-400 shrink-0" />
              <div>
                <span className="text-[9px] text-amber-300 font-mono font-black uppercase block">Certified Royal Attestation</span>
                <p className="text-[10px] text-zinc-400 leading-snug">Every ceremony detail is verified and backed by the EventOS Bespoke Guarantee.</p>
              </div>
            </div>

            <div className="w-full sm:w-64 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal Investment:</span>
                <span className="text-white font-bold">₹{invoice.subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>GST (18%):</span>
                <span>₹{(cgst + sgst).toLocaleString("en-IN")}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>Royal Privilege Discount:</span>
                  <span>- ₹{invoice.discount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-amber-500/30 text-amber-300 font-bold text-sm print:text-black">
                <span>Grand Total:</span>
                <span className="text-base font-black">₹{invoice.totalAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TEMPLATE 2: 🏢 CLASSIC CORPORATE GST TAX INVOICE (RULE 46)
          ═══════════════════════════════════════════════════════════════ */}
      {activeTemplate === "GST_CORPORATE" && (
        <motion.div
          key="gst"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 sm:p-10 border border-blue-900/40 bg-[#0c1222] rounded-3xl space-y-6 shadow-2xl text-zinc-100 print:bg-white print:text-black print:border-none print:shadow-none font-sans"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b border-blue-900/40 pb-5 print:border-zinc-300">
            <div>
              <span className="text-[10px] bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono font-bold px-2 py-0.5 rounded uppercase">
                Form GST INV-1
              </span>
              <h2 className="text-lg font-black text-white mt-1.5 uppercase tracking-wide print:text-black">
                TAX INVOICE (RULE 46 OF CGST RULES, 2017)
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">Original for Recipient</p>
            </div>

            <div className="text-right space-y-1 font-mono">
              <p className="text-[10px] text-zinc-400 font-bold uppercase">Invoice No: <span className="text-white font-black">{invoice.invoiceNumber}</span></p>
              <p className="text-[10px] text-zinc-400">Date: {new Date(invoice.createdAt).toLocaleDateString("en-IN")}</p>
              <p className="text-[10px] text-rose-400 font-bold">Due Date: {new Date(invoice.dueDate).toLocaleDateString("en-IN")}</p>
            </div>
          </div>

          {/* Supplier & Recipient 2-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 bg-white/[0.02] border border-blue-900/30 rounded-xl space-y-1">
              <span className="text-[9px] text-blue-400 font-black uppercase block">Details of Supplier</span>
              <p className="font-bold text-white font-sans text-xs">EventOS Enterprise Technologies Pvt Ltd</p>
              <p className="text-zinc-400 text-[11px]">DLF Cyber City, Sector 24, Gurgaon, HR</p>
              <p className="text-zinc-300 text-[11px]">GSTIN: <span className="font-bold text-white">06ABCDE1234F1Z5</span></p>
              <p className="text-zinc-400 text-[11px]">State: Haryana · Code: 06</p>
            </div>

            <div className="p-4 bg-white/[0.02] border border-blue-900/30 rounded-xl space-y-1">
              <span className="text-[9px] text-blue-400 font-black uppercase block">Details of Recipient (Billed To)</span>
              <p className="font-bold text-white font-sans text-xs">{invoice.clientName}</p>
              <p className="text-zinc-400 text-[11px]">{invoice.clientEmail || "client@enterprise.com"}</p>
              <p className="text-zinc-400 text-[11px]">{invoice.billingAddress || "Place of Supply: Gurgaon, Haryana (06)"}</p>
              <p className="text-zinc-400 text-[11px]">Reverse Charge Applicable: <span className="font-bold text-white">NO</span></p>
            </div>
          </div>

          {/* Table */}
          <div className="border border-blue-900/40 rounded-xl overflow-hidden text-xs font-mono">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-blue-950/30 text-blue-300 border-b border-blue-900/40 text-[9px] uppercase font-black">
                  <th className="p-3">Sl</th>
                  <th className="p-3">Description of Services</th>
                  <th className="p-3">HSN/SAC</th>
                  <th className="p-3 text-right">Taxable Value</th>
                  <th className="p-3 text-right">CGST (9%)</th>
                  <th className="p-3 text-right">SGST (9%)</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-zinc-300">
                <tr>
                  <td className="p-3">1</td>
                  <td className="p-3 font-sans">
                    <p className="font-bold text-white">Corporate Event Production & Management</p>
                    <p className="text-[10px] text-zinc-400">{cleanNotes || "Audiovisual rigging, stage staging, and technical coordination."}</p>
                  </td>
                  <td className="p-3 text-zinc-400">998599</td>
                  <td className="p-3 text-right">₹{invoice.subtotal.toLocaleString("en-IN")}</td>
                  <td className="p-3 text-right">₹{cgst.toLocaleString("en-IN")}</td>
                  <td className="p-3 text-right">₹{sgst.toLocaleString("en-IN")}</td>
                  <td className="p-3 text-right font-bold text-emerald-400">₹{invoice.totalAmount.toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bank Transfer Details & Signatory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-blue-950/20 border border-blue-900/30 rounded-xl text-xs font-mono space-y-1">
              <span className="text-[9px] text-blue-400 font-bold uppercase block">Bank Remittance (NEFT / RTGS)</span>
              <p className="text-zinc-300 text-[11px]">Bank: <span className="font-bold text-white">HDFC Bank Ltd</span></p>
              <p className="text-zinc-300 text-[11px]">Account Name: <span className="font-bold text-white">EventOS Enterprise Pvt Ltd</span></p>
              <p className="text-zinc-300 text-[11px]">Account No: <span className="font-bold text-white">50200098765432</span></p>
              <p className="text-zinc-300 text-[11px]">IFSC Code: <span className="font-bold text-white">HDFC0001234</span></p>
            </div>

            <div className="flex flex-col justify-between items-end p-4 border border-blue-900/30 rounded-xl text-right">
              <div className="space-y-1 font-mono text-xs w-full">
                <div className="flex justify-between text-zinc-400">
                  <span>Total Taxable Amount:</span>
                  <span className="font-bold text-white">₹{invoice.subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Total GST Output:</span>
                  <span className="font-bold text-white">₹{(cgst + sgst).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-blue-900/40">
                  <span>Invoice Total (INR):</span>
                  <span className="text-emerald-400">₹{invoice.totalAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>
              <div className="pt-4 text-center w-full sm:w-auto">
                <div className="h-6 w-32 border-b border-zinc-700 mx-auto" />
                <span className="text-[8px] text-zinc-400 uppercase tracking-widest font-mono mt-1 block">Authorized Signatory</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TEMPLATE 3: ⚡ MINIMAL MODERN STUDIO
          ═══════════════════════════════════════════════════════════════ */}
      {activeTemplate === "MINIMAL_STUDIO" && (
        <motion.div
          key="minimal"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 sm:p-10 border border-zinc-800 bg-[#09090b] rounded-3xl space-y-8 shadow-2xl text-zinc-200 print:bg-white print:text-black print:border-none font-sans"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="h-9 w-9 bg-white text-black font-black flex items-center justify-center rounded-lg text-sm font-mono">
                EOS
              </div>
              <h2 className="text-base font-black text-white mt-2 tracking-tight">STUDIO STATEMENT</h2>
              <p className="text-xs text-zinc-400 font-mono">Creative Media & Production Agency</p>
            </div>

            <div className="text-right space-y-1 font-mono text-xs">
              <p className="text-zinc-400">Invoice: <span className="text-white font-bold">{invoice.invoiceNumber}</span></p>
              <p className="text-zinc-400">Issued: {new Date(invoice.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
              <p className="text-emerald-400 font-bold">Due: {new Date(invoice.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-6 grid grid-cols-2 gap-6 text-xs">
            <div>
              <span className="text-[9px] text-zinc-500 uppercase font-mono font-bold block">Client Account</span>
              <p className="font-bold text-white mt-0.5">{invoice.clientName}</p>
              <p className="text-zinc-400 text-[11px] font-mono">{invoice.clientEmail || "client@domain.com"}</p>
            </div>
            <div className="text-right font-mono">
              <span className="text-[9px] text-zinc-500 uppercase font-bold block">Status</span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 text-[10px] font-bold inline-block mt-0.5">
                {invoice.status}
              </span>
            </div>
          </div>

          {/* Simple Clean Table */}
          <div className="border-t border-b border-zinc-800 py-4 text-xs font-mono space-y-3">
            <div className="flex justify-between text-zinc-500 text-[10px] uppercase font-bold">
              <span>Scope Item</span>
              <span>Amount</span>
            </div>
            <div className="flex justify-between items-center text-white">
              <div className="font-sans">
                <p className="font-bold">Creative Direction, Photography & Event Production</p>
                <p className="text-[11px] text-zinc-400 font-mono">{cleanNotes || "Deliverables include raw reels, final album proofing, and live coverage."}</p>
              </div>
              <span className="font-bold font-mono text-sm">₹{invoice.subtotal.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Minimal Totals */}
          <div className="flex justify-between items-end text-xs font-mono pt-2">
            <div className="space-y-1 text-zinc-500 text-[11px]">
              <p>• Delivery download PIN provided upon settlement clearance.</p>
              <p>• GST 18% inclusive in official tax ledger.</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-zinc-400 text-xs">Total Outstanding</p>
              <p className="text-2xl font-black text-white font-mono">₹{invoice.totalAmount.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TEMPLATE 4: 📊 MILESTONE ADVANCE SPLIT WITH DYNAMIC UPI QR
          ═══════════════════════════════════════════════════════════════ */}
      {activeTemplate === "MILESTONE_SPLIT" && (
        <motion.div
          key="milestone"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 sm:p-10 border border-emerald-500/25 bg-[#0a1410] rounded-3xl space-y-8 shadow-2xl text-zinc-200 print:bg-white print:text-black print:border-none font-sans"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b border-emerald-500/20 pb-5">
            <div>
              <span className="text-[10px] text-emerald-400 font-mono font-black uppercase tracking-wider flex items-center gap-1.5">
                <Zap size={13} className="text-emerald-400" /> Milestone Advance Settlement Invoice
              </span>
              <h2 className="text-xl font-black text-white mt-1">Multi-Stage Payment Schedule</h2>
              <p className="text-xs text-zinc-400">Billed for: <span className="text-emerald-300 font-bold">{invoice.clientName}</span> · Inv #{invoice.invoiceNumber}</p>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                {invoice.status}
              </span>
              <p className="text-lg font-black text-white font-mono mt-1">₹{invoice.totalAmount.toLocaleString("en-IN")}</p>
            </div>
          </div>

          {/* 3-Stage Progress Timeline */}
          <div className="space-y-3">
            <span className="text-[10px] text-emerald-400 uppercase font-mono font-black tracking-wider block">Stage Progress Ledger</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Stage 1 */}
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">Stage 1: Retainer</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">50%</span>
                </div>
                <p className="text-sm font-black text-white font-mono">₹{(invoice.totalAmount * 0.5).toLocaleString("en-IN")}</p>
                <p className="text-[10px] text-zinc-400">Due at booking confirmation lock.</p>
                <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle size={11} /> {invoice.status === "PAID" || invoice.status === "PARTIAL" ? "Cleared / Paid" : "Payable Now"}
                </span>
              </div>

              {/* Stage 2 */}
              <div className="p-4 bg-white/[0.02] border border-white/[0.08] rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">Stage 2: Venue Setup</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/[0.05] text-zinc-300">25%</span>
                </div>
                <p className="text-sm font-black text-white font-mono">₹{(invoice.totalAmount * 0.25).toLocaleString("en-IN")}</p>
                <p className="text-[10px] text-zinc-400">Due 48 hrs prior to venue ingress.</p>
                <span className="text-[9px] font-bold text-zinc-400 flex items-center gap-1">
                  <Clock size={11} /> Scheduled Milestone
                </span>
              </div>

              {/* Stage 3 */}
              <div className="p-4 bg-white/[0.02] border border-white/[0.08] rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">Stage 3: Settlement</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/[0.05] text-zinc-300">25%</span>
                </div>
                <p className="text-sm font-black text-white font-mono">₹{(invoice.totalAmount * 0.25).toLocaleString("en-IN")}</p>
                <p className="text-[10px] text-zinc-400">Due at final event ceremony wrap.</p>
                <span className="text-[9px] font-bold text-zinc-400 flex items-center gap-1">
                  <Clock size={11} /> Post-Event Clearance
                </span>
              </div>
            </div>
          </div>

          {/* Instant Live UPI Pay Box with Real Dynamic QR */}
          {(() => {
            const milestoneDue = Math.round(invoice.totalAmount * (invoice.status === "PAID" ? 0 : 0.5));
            const upiPayString = `upi://pay?pa=${encodeURIComponent(ownerPaymentConfig.upiId)}&pn=${encodeURIComponent(ownerPaymentConfig.accountHolder)}&am=${milestoneDue}&cu=INR&tn=${encodeURIComponent(`Inv_${invoice.invoiceNumber}`)}`;
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiPayString)}&color=09090b&bgcolor=ffffff`;

            return (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-6 p-5 bg-emerald-950/20 border border-emerald-500/25 rounded-2xl relative overflow-hidden group">
                <div className="flex items-center gap-4">
                  {/* Real Live Dynamic Scannable QR Code */}
                  <div
                    onClick={() => setShowUpiModal(true)}
                    className="p-2 bg-white rounded-xl shadow-lg shrink-0 cursor-pointer hover:scale-105 transition-transform border border-emerald-400/30 group-hover:ring-2 group-hover:ring-emerald-400/40"
                    title="Click to view full payment modal"
                  >
                    <img
                      src={qrImageUrl}
                      alt="Real NPCI UPI QR"
                      className="w-16 h-16 object-contain rounded-md"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-emerald-400 font-mono font-black uppercase px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
                        Live Dynamic NPCI UPI QR
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowUpiModal(true)}
                        className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Enlarge / Details</span>
                        <ArrowUpRight size={11} />
                      </button>
                    </div>
                    <p className="text-xs font-bold text-white">Scan with GPay, PhonePe, Paytm or BHIM</p>
                    <p className="text-[11px] text-zinc-300 font-mono">
                      VPA: <span className="text-emerald-300 font-bold">{ownerPaymentConfig.upiId}</span>
                      {ownerPaymentConfig.bankName && <span className="text-zinc-500 text-[10px] ml-2">({ownerPaymentConfig.bankName})</span>}
                    </p>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <span className="text-[10px] text-zinc-400 uppercase font-mono block">Current Milestone Due</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">₹{milestoneDue.toLocaleString("en-IN")}</span>
                  {invoice.status !== "PAID" && (
                    <button
                      type="button"
                      onClick={() => setShowUpiModal(true)}
                      className="mt-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow"
                    >
                      <span>Pay Milestone ₹{milestoneDue.toLocaleString("en-IN")}</span>
                      <ArrowUpRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}

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

      {/* Real Owner Dynamic UPI QR Modal */}
      {invoice && (
        <DynamicUpiQrModal
          isOpen={showUpiModal}
          onClose={() => setShowUpiModal(false)}
          ownerUpiId={ownerPaymentConfig.upiId}
          ownerName={ownerPaymentConfig.accountHolder}
          bankAccountName={ownerPaymentConfig.accountHolder}
          bankAccountNumber={ownerPaymentConfig.accountNumber}
          bankIfsc={ownerPaymentConfig.ifsc}
          bankName={ownerPaymentConfig.bankName}
          amount={Math.round(invoice.totalAmount * (invoice.status === "PAID" ? 0 : 0.5))}
          invoiceNumber={invoice.invoiceNumber}
          clientName={invoice.clientName}
          onPaymentConfirm={() => {
            const milestonePaid = Math.round(invoice.totalAmount * (invoice.status === "PAID" ? 0 : 0.5));
            triggerToast("Payment recorded successfully!", "success");
            queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
            queryClient.invalidateQueries({ queryKey: ["invoiceHistory", invoiceId] });
            emitWorkspaceNotification({
              title: "Invoice Payment Logged! 💰",
              desc: `Milestone payment of ₹${milestonePaid.toLocaleString("en-IN")} recorded for Invoice #${invoice.invoiceNumber}`,
              type: "success",
              href: `/invoices/${invoiceId}`,
              category: "payment",
              actorType: "TEAM",
              actorName: "Finance Desk"
            });
          }}
        />
      )}

    </div>
  );
}
