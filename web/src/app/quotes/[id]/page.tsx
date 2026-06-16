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
  FileSpreadsheet,
  Award
} from "lucide-react";

interface QuoteItem {
  id: string;
  itemName: string;
  description?: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

interface Quote {
  id: string;
  leadId: string;
  quoteNumber: string;
  status: string;
  templateName: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  clientNotes?: string;
  termsConditions?: string;
  createdAt: string;
  items: QuoteItem[];
  pdfUrl?: string;
}

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "border-zinc-800 bg-zinc-800/20 text-zinc-400",
  SENT: "border-blue-500/20 bg-blue-500/5 text-blue-450",
  VIEWED: "border-indigo-500/20 bg-indigo-500/5 text-indigo-400",
  ACCEPTED: "border-emerald-500/20 bg-emerald-500/5 text-emerald-450",
  REJECTED: "border-red-500/20 bg-red-500/5 text-red-450",
  EXPIRED: "border-amber-500/20 bg-amber-500/5 text-amber-450"
};

export default function QuoteDetailPage() {
  const params = useParams();
  const quoteId = params.id as string;
  const queryClient = useQueryClient();
  const [errorText, setErrorText] = useState("");

  // 1. Fetch Quote Details
  const { data: quoteResponse, isLoading: quoteLoading, error: quoteError } = useQuery<{ data: Quote }>({
    queryKey: ["quote", quoteId],
    queryFn: async () => {
      const response = await api.get(`/crm/quotes/${quoteId}`);
      return response.data;
    }
  });

  const quote = quoteResponse?.data;

  // 2. Fetch Associated Lead Info (to display client contact info on the quote sheet)
  const { data: leadResponse, isLoading: leadLoading } = useQuery<{ data: Lead }>({
    queryKey: ["lead", quote?.leadId],
    queryFn: async () => {
      const response = await api.get(`/crm/leads/${quote?.leadId}`);
      return response.data;
    },
    enabled: !!quote?.leadId
  });

  const lead = leadResponse?.data;

  // 3. Fetch Associated Booking if ACCEPTED
  const { data: bookingResponse } = useQuery<{ data: { id: string; bookingNumber: string } }>({
    queryKey: ["bookingByQuote", quoteId],
    queryFn: async () => {
      const response = await api.get(`/events/bookings/by-quote/${quoteId}`);
      return response.data;
    },
    enabled: !!quote && quote.status === "ACCEPTED"
  });

  const booking = bookingResponse?.data;

  // Mutations
  const approveQuoteMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/crm/quotes/${quoteId}/approve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote", quoteId] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
    onError: (err: any) => {
      setErrorText(err.response?.data?.error?.message || "Failed to approve quote.");
    }
  });

  const rejectQuoteMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/crm/quotes/${quoteId}/reject`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote", quoteId] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
    onError: (err: any) => {
      setErrorText(err.response?.data?.error?.message || "Failed to reject quote.");
    }
  });

  const viewQuoteMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/crm/quotes/${quoteId}/view`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote", quoteId] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    }
  });

  React.useEffect(() => {
    if (quote && (quote.status === "DRAFT" || quote.status === "SENT")) {
      viewQuoteMutation.mutate();
    }
  }, [quote]);

  const handlePrint = () => {
    window.print();
  };

  const handleApprove = () => {
    setErrorText("");
    approveQuoteMutation.mutate();
  };

  const handleReject = () => {
    setErrorText("");
    rejectQuoteMutation.mutate();
  };

  if (quoteLoading || leadLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-400 flex items-center justify-center animate-pulse text-sm">
        Generating quote invoice template sheet...
      </div>
    );
  }

  if (quoteError || !quote) {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-150 flex flex-col items-center justify-center p-6 space-y-4">
        <AlertCircle className="text-red-500 h-12 w-12" />
        <h2 className="text-lg font-bold">Quote not found</h2>
        <p className="text-zinc-500 text-xs">Verify that the quote exists and the backend microservices are running.</p>
        <button
          onClick={() => (window.location.href = "/quotes")}
          className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold"
        >
          <ArrowLeft size={14} />
          Back to Quotes
        </button>
      </div>
    );
  }

  const statusStyle = STATUS_COLORS[quote.status] || "border-zinc-800 text-zinc-400";

  // Template styling variables
  let tplBg = "bg-[#161618]/30 border-zinc-800 text-zinc-200";
  let tplHeader = "border-zinc-800";
  let tplFont = "font-sans";
  let tplAccentText = "text-purple-450";
  let tplTableHead = "bg-zinc-900/40 text-zinc-400 border-zinc-800";
  let tplTitle = "EventOS Proposals";

  if (quote.templateName === "ELEGANT") {
    tplBg = "bg-[#0F0D0E]/80 border-pink-900/30 text-rose-100 font-serif";
    tplHeader = "border-pink-900/25";
    tplFont = "font-serif";
    tplAccentText = "text-pink-400";
    tplTableHead = "bg-pink-950/10 text-pink-300 border-pink-900/20";
    tplTitle = "Wedding Celebration Proposal";
  } else if (quote.templateName === "PLAYFUL") {
    tplBg = "bg-[#090D0A]/80 border-emerald-900/30 text-emerald-100";
    tplHeader = "border-emerald-900/25";
    tplFont = "font-sans";
    tplAccentText = "text-emerald-400";
    tplTableHead = "bg-emerald-950/10 text-emerald-300 border-emerald-900/20";
    tplTitle = "Birthday Gala Pricing Proposal";
  } else {
    tplBg = "bg-[#111113] border-zinc-800 text-zinc-200";
    tplHeader = "border-zinc-800";
    tplFont = "font-sans";
    tplAccentText = "text-blue-400";
    tplTableHead = "bg-zinc-900 text-zinc-450 border-zinc-800";
    tplTitle = "Corporate Events Agreement";
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col">
      {/* Top Navbar */}
      <nav className="h-16 border-b border-zinc-800 bg-[#111113]/80 backdrop-blur px-6 flex items-center justify-between z-20 shrink-0 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.location.href = "/quotes")}
            className="h-8 w-8 rounded-md bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
            aria-label="Back to quotes"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">Proposal View</span>
            <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">{quote.quoteNumber}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {quote.pdfUrl ? (
            <a
              href={quote.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 border border-zinc-850 hover:bg-zinc-800 rounded-lg text-xs font-semibold transition-all text-zinc-350 hover:text-white"
            >
              <Printer size={14} />
              Download PDF
            </a>
          ) : (
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 border border-zinc-850 hover:bg-zinc-800 rounded-lg text-xs font-semibold transition-all"
            >
              <Printer size={14} />
              Export PDF
            </button>
          )}

          {/* Approve/Reject triggers */}
          {(quote.status === "DRAFT" || quote.status === "SENT" || quote.status === "VIEWED") && (
            <>
              <button
                onClick={handleReject}
                disabled={rejectQuoteMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-650/10 hover:bg-red-650/20 text-red-500 border border-red-500/20 rounded-lg text-xs font-semibold transition-all"
              >
                <XIcon size={14} />
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={approveQuoteMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md"
              >
                <Check size={14} />
                Approve
              </button>
            </>
          )}

          {quote.status === "ACCEPTED" && booking && (
            <button
              onClick={() => (window.location.href = `/bookings/${booking.id}`)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-650/10 hover:bg-emerald-650/20 text-emerald-450 border border-emerald-500/20 rounded-lg text-xs font-semibold transition-all shadow-md"
            >
              <Award size={14} />
              Go to Booking ({booking.bookingNumber})
            </button>
          )}
        </div>
      </nav>

      {/* Main content grid */}
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6 print:p-0 print:max-w-full">
        {/* Error Banner */}
        {errorText && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-2 print:hidden">
            <AlertCircle size={14} />
            <span>{errorText}</span>
          </div>
        )}

        {/* PROPOSAL INVOICE SHEET */}
        <div
          className={`p-10 border rounded-2xl shadow-xl space-y-8 print:border-none print:shadow-none print:p-0 print:bg-white print:text-black ${tplBg}`}
        >
          {/* Sheet Header */}
          <div className={`flex justify-between items-start border-b pb-6 ${tplHeader}`}>
            <div className="space-y-1">
              <h2 className={`text-2xl font-extrabold tracking-tight ${tplAccentText} print:text-black`}>
                {tplTitle}
              </h2>
              <p className="text-[10px] text-zinc-500 font-semibold print:text-zinc-650">
                EventOS Business Operations Workspace
              </p>
            </div>
            <div className="text-right space-y-1">
              <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-bold ${statusStyle} print:border-black print:text-black`}>
                {quote.status}
              </span>
              <p className="text-[11px] font-mono text-zinc-400 mt-2 print:text-zinc-650">
                Number: {quote.quoteNumber}
              </p>
              <p className="text-[10px] text-zinc-500 print:text-zinc-650">
                Date: {new Date(quote.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Client & Company Context Specs */}
          <div className="grid grid-cols-2 gap-6 text-xs leading-relaxed">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block print:text-zinc-650">Prepared For</span>
              <h4 className="font-extrabold text-sm text-zinc-150 print:text-black">{lead?.name || "Client Lead"}</h4>
              <p className="text-zinc-450 print:text-zinc-650">{lead?.email || "---"}</p>
              <p className="text-zinc-450 print:text-zinc-650">{lead?.phone || "---"}</p>
            </div>
            <div className="space-y-1 text-left md:text-right">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block print:text-zinc-650">Provider Info</span>
              <h4 className="font-extrabold text-sm text-zinc-150 print:text-black">EventOS Planner Corp</h4>
              <p className="text-zinc-450 print:text-zinc-650">workspace@eventos.com</p>
              <p className="text-zinc-450 print:text-zinc-650">+91 98765 43210</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className={`border-b font-bold ${tplTableHead} print:border-black print:text-black`}>
                  <th className="py-2.5 px-3">Service Name</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 print:divide-zinc-300">
                {quote.items?.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-900/10 print:hover:bg-transparent">
                    <td className="py-3 px-3 font-bold text-zinc-200 print:text-black">{item.itemName}</td>
                    <td className="py-3 px-3 text-zinc-450 print:text-zinc-650">{item.description || "---"}</td>
                    <td className="py-3 px-3 text-right font-mono text-zinc-300 print:text-black">
                      INR {item.unitPrice?.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-zinc-300 print:text-black">{item.quantity}</td>
                    <td className="py-3 px-3 text-right font-bold font-mono text-zinc-200 print:text-black">
                      INR {item.total?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Final Financials and Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            {/* Notes Section */}
            <div className="space-y-4">
              {quote.clientNotes && (
                <div className="space-y-1 text-xs">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block print:text-zinc-650">Operational Notes</span>
                  <p className="text-zinc-400 bg-zinc-900/40 p-3 rounded-lg border border-zinc-850 print:border-zinc-300 print:bg-transparent print:text-black leading-relaxed">
                    {quote.clientNotes}
                  </p>
                </div>
              )}

              {quote.termsConditions && (
                <div className="space-y-1 text-xs">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block print:text-zinc-650">Contract Terms</span>
                  <p className="text-[10px] text-zinc-500 print:text-zinc-650 leading-relaxed">
                    {quote.termsConditions}
                  </p>
                </div>
              )}
            </div>

            {/* Calculations Section */}
            <div className="space-y-3 text-xs justify-self-end w-full max-w-[320px]">
              <div className="flex justify-between items-center text-zinc-450 print:text-zinc-650">
                <span>Subtotal Sum</span>
                <span className="font-mono font-bold text-zinc-200 print:text-black">
                  INR {quote.subtotal?.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center text-zinc-450 print:text-zinc-650">
                <span>Discount Deduction</span>
                <span className="font-mono font-bold text-zinc-200 print:text-black">
                  - INR {quote.discount?.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center text-zinc-450 print:text-zinc-650">
                <span>Taxes & GST</span>
                <span className="font-mono font-bold text-zinc-200 print:text-black">
                  + INR {quote.tax?.toLocaleString()}
                </span>
              </div>

              {/* Grand Total */}
              <div className={`flex justify-between items-center border-t pt-3.5 text-sm font-bold ${tplHeader} print:border-black`}>
                <span className="text-zinc-200 print:text-black">Grand Total</span>
                <span className={`font-mono font-extrabold text-emerald-400 text-base print:text-black ${tplAccentText}`}>
                  INR {quote.total?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
