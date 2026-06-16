"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Printer,
  Check,
  X as XIcon,
  AlertCircle,
  Clock,
  Briefcase,
  FileText,
  DollarSign,
  Send
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
  billingAddress?: string;
  notes?: string;
  createdAt: string;
}

interface Booking {
  id: string;
  bookingNumber: string;
  totalAmount: number;
  paidAmount: number;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "border-zinc-800 bg-zinc-800/20 text-zinc-400",
  SENT: "border-blue-500/20 bg-blue-500/5 text-blue-400",
  PENDING: "border-amber-500/20 bg-amber-500/5 text-amber-500",
  PARTIAL: "border-indigo-500/20 bg-indigo-500/5 text-indigo-400",
  PAID: "border-emerald-500/20 bg-emerald-500/5 text-emerald-450",
  OVERDUE: "border-rose-500/20 bg-rose-500/5 text-rose-450",
  REFUNDED: "border-purple-500/20 bg-purple-500/5 text-purple-400",
  CANCELLED: "border-zinc-800 bg-zinc-900/10 text-zinc-650"
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const queryClient = useQueryClient();
  const [errorText, setErrorText] = useState("");

  // 1. Fetch Invoice details
  const { data: invoiceResponse, isLoading: invoiceLoading, error: invoiceError } = useQuery<{ data: Invoice }>({
    queryKey: ["invoice", invoiceId],
    queryFn: async () => {
      const response = await api.get(`/events/invoices/${invoiceId}`);
      return response.data;
    }
  });

  const invoice = invoiceResponse?.data;

  // 2. Fetch Booking info
  const { data: bookingResponse, isLoading: bookingLoading } = useQuery<{ data: Booking }>({
    queryKey: ["booking", invoice?.bookingId],
    queryFn: async () => {
      const response = await api.get(`/events/bookings/${invoice?.bookingId}`);
      return response.data;
    },
    enabled: !!invoice?.bookingId
  });

  const booking = bookingResponse?.data;

  // 3. Mutation: Update Status
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const response = await api.put(`/events/invoices/${invoiceId}/status`, { status: newStatus });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (err: any) => {
      setErrorText(err.response?.data?.error?.message || "Failed to update invoice status.");
    }
  });

  const sendReminderMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/events/invoices/${invoiceId}/remind`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      alert("Payment reminder notification generated and logged!");
    },
    onError: (err: any) => {
      setErrorText(err.response?.data?.error?.message || "Failed to trigger payment reminder.");
    }
  });

  const handlePrint = () => {
    window.print();
  };

  const handleUpdateStatus = (status: string) => {
    setErrorText("");
    updateStatusMutation.mutate(status);
  };

  if (invoiceLoading || bookingLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-400 flex items-center justify-center animate-pulse text-sm">
        Generating invoice sheet...
      </div>
    );
  }

  if (invoiceError || !invoice) {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-150 flex flex-col items-center justify-center p-6 space-y-4">
        <AlertCircle className="text-red-500 h-12 w-12" />
        <h2 className="text-lg font-bold">Invoice not found</h2>
        <p className="text-zinc-500 text-xs">Verify that the invoice exists and backend microservices are running.</p>
        <button
          onClick={() => (window.location.href = "/invoices")}
          className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold"
        >
          <ArrowLeft size={14} />
          Back to Invoices
        </button>
      </div>
    );
  }

  const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== "PAID" && invoice.status !== "CANCELLED";
  const displayedStatus = isOverdue ? "OVERDUE" : invoice.status;
  const statusStyle = STATUS_COLORS[displayedStatus] || "border-zinc-800 text-zinc-400";

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col">
      {/* Top Navbar */}
      <nav className="h-16 border-b border-zinc-800 bg-[#111113]/80 backdrop-blur px-6 flex items-center justify-between z-20 shrink-0 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.location.href = "/invoices")}
            className="h-8 w-8 rounded-md bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
            aria-label="Back to invoices"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">Invoice Ledger</span>
            <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">{invoice.invoiceNumber}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 border border-zinc-850 hover:bg-zinc-800 rounded-lg text-xs font-semibold transition-all"
          >
            <Printer size={14} />
            Export PDF
          </button>

          {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && invoice.status !== "REFUNDED" && (
            <button
              onClick={() => {
                setErrorText("");
                sendReminderMutation.mutate();
              }}
              disabled={sendReminderMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-2 border border-amber-500/30 hover:bg-amber-500/10 text-amber-500 rounded-lg text-xs font-semibold transition-all"
            >
              <Clock size={14} />
              Send Reminder
            </button>
          )}

          {/* Quick status changers */}
          {invoice.status === "DRAFT" && (
            <button
              onClick={() => handleUpdateStatus("SENT")}
              disabled={updateStatusMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/25 rounded-lg text-xs font-semibold transition-all"
            >
              <Send size={12} />
              Mark as Sent
            </button>
          )}

          {(invoice.status === "DRAFT" || invoice.status === "SENT") && (
            <>
              <button
                onClick={() => handleUpdateStatus("CANCELLED")}
                disabled={updateStatusMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 rounded-lg text-xs font-semibold transition-all"
              >
                <XIcon size={12} />
                Cancel Bill
              </button>
              <button
                onClick={() => handleUpdateStatus("PAID")}
                disabled={updateStatusMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all shadow-md"
              >
                <Check size={12} />
                Mark as Paid
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6 print:p-0 print:max-w-full">
        {errorText && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-2 print:hidden">
            <AlertCircle size={14} />
            <span>{errorText}</span>
          </div>
        )}

        {/* INVOICE BILL SHEET */}
        <div
          className="p-10 border border-zinc-800 bg-[#111113] rounded-2xl shadow-xl space-y-8 print:border-none print:shadow-none print:p-0 print:bg-white print:text-black"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b border-zinc-800 pb-6 print:border-zinc-300">
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold tracking-tight text-purple-400 print:text-black">
                INVOICE STATEMENT
              </h2>
              <p className="text-[10px] text-zinc-550 font-semibold uppercase tracking-wider print:text-zinc-650">
                EventOS Operations billing sheet
              </p>
            </div>
            <div className="text-right space-y-1">
              <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-bold ${statusStyle} print:border-black print:text-black`}>
                {displayedStatus}
              </span>
              <p className="text-[11px] font-mono text-zinc-400 mt-2 print:text-zinc-650">
                Invoice ID: {invoice.invoiceNumber}
              </p>
              <p className="text-[10px] text-zinc-500 print:text-zinc-650">
                Generated: {new Date(invoice.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Details specs */}
          <div className="grid grid-cols-2 gap-6 text-xs leading-relaxed">
            <div className="space-y-1.5">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block print:text-zinc-650">Billed Client</span>
              <h4 className="font-extrabold text-sm text-zinc-150 print:text-black">{invoice.clientName}</h4>
              <p className="text-zinc-450 print:text-zinc-650">{invoice.clientEmail || "—"}</p>
              {invoice.billingAddress && (
                <p className="text-zinc-450 print:text-zinc-650">{invoice.billingAddress}</p>
              )}
            </div>
            <div className="space-y-1.5 text-left md:text-right">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block print:text-zinc-650">Payment Remittance</span>
              <h4 className="font-extrabold text-sm text-zinc-150 print:text-black">EventOS Planners Corp</h4>
              <p className="text-zinc-450 print:text-zinc-650">finance@eventos.com</p>
              <p className="text-zinc-450 print:text-zinc-650">+91 98765 43210</p>
            </div>
          </div>

          {/* Reference Booking */}
          <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/10 flex flex-wrap justify-between items-center text-xs print:border-zinc-300 print:bg-transparent">
            <div>
              <span className="text-[10px] text-zinc-500 block print:text-zinc-650">Linked booking agreement</span>
              <span className="font-bold text-zinc-200 print:text-black">
                {booking ? booking.bookingNumber : "—"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 block print:text-zinc-650">Invoice Due Date</span>
              <span className="font-bold text-rose-400 print:text-black">
                {new Date(invoice.dueDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Table list breakdown */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/30 text-zinc-450 font-bold print:border-zinc-300 print:text-black">
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/60 print:divide-zinc-300">
                <tr>
                  <td className="py-3 px-3">
                    <span className="font-bold text-zinc-200 block print:text-black">Event Planners Operational Charge</span>
                    <span className="text-[10px] text-zinc-500 block print:text-zinc-650">Linked contract service payment</span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-zinc-200 print:text-black">
                    INR {invoice.subtotal.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes and Calculations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div className="space-y-4">
              {invoice.notes && (
                <div className="space-y-1 text-xs">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block print:text-zinc-650">Invoice Notes & Bank Details</span>
                  <p className="text-zinc-400 bg-zinc-900/40 p-3 rounded-lg border border-zinc-850 print:border-zinc-300 print:bg-transparent print:text-black leading-relaxed">
                    {invoice.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3 text-xs justify-self-end w-full max-w-[320px]">
              <div className="flex justify-between items-center text-zinc-450 print:text-zinc-650">
                <span>Subtotal Sum</span>
                <span className="font-mono font-semibold text-zinc-250 print:text-black">
                  INR {invoice.subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center text-zinc-450 print:text-zinc-650">
                <span>Taxes & GST</span>
                <span className="font-mono font-semibold text-zinc-250 print:text-black">
                  + INR {invoice.tax.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center text-zinc-450 print:text-zinc-650">
                <span>Discount Deduction</span>
                <span className="font-mono font-semibold text-zinc-250 print:text-black">
                  - INR {invoice.discount.toLocaleString()}
                </span>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center border-t border-zinc-800 pt-3.5 text-sm font-bold print:border-zinc-300">
                <span className="text-zinc-200 print:text-black">Total Due Amount</span>
                <span className="font-mono font-extrabold text-emerald-450 text-base print:text-black">
                  INR {invoice.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
