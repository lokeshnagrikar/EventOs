"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useOnboardingStore } from "@/store/onboardingStore";
import {
  ArrowLeft,
  Printer,
  Download,
  Check,
  X as XIcon,
  AlertCircle,
  Clock,
  Briefcase,
  FileText,
  DollarSign,
  FileSpreadsheet,
  Award,
  Share2,
  Copy,
  Send,
  CheckCircle,
  MessageSquare,
  History,
  Lock,
  UserCheck,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  contact?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
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
  const router = useRouter();
  const quoteId = params.id as string;
  const queryClient = useQueryClient();
  
  const [errorText, setErrorText] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerTitle, setSignerTitle] = useState("Client Sponsor");
  const [feedbackText, setFeedbackText] = useState("");

  // 1. Fetch Quote Details
  const { data: quoteResponse, isLoading: quoteLoading, error: quoteError } = useQuery<{ data: Quote }>({
    queryKey: ["quote", quoteId],
    queryFn: async () => {
      const response = await api.get(`/crm/quotes/${quoteId}`);
      return response.data;
    }
  });

  const quote = quoteResponse?.data;

  // 2. Fetch Associated Lead Info
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

  // Mutation to mark quote as SENT
  const sendQuoteMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put(`/crm/quotes/${quoteId}/send`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote", quoteId] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    }
  });

  // Mutations
  const approveQuoteMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/crm/quotes/${quoteId}/approve`);
      return response.data;
    },
    onSuccess: () => {
      // Log audit history locally in session
      const logs = JSON.parse(localStorage.getItem(`quote_audit_${quoteId}`) || "[]");
      const signLog = {
        signer: signerName,
        title: signerTitle,
        timestamp: new Date().toISOString(),
        status: "APPROVED"
      };
      localStorage.setItem(`quote_audit_${quoteId}`, JSON.stringify([...logs, signLog]));

      queryClient.invalidateQueries({ queryKey: ["quote", quoteId] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      setShowSignModal(false);
      useOnboardingStore.getState().completeStep("convert_booking");
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
      // Log feedback audit locally
      const logs = JSON.parse(localStorage.getItem(`quote_audit_${quoteId}`) || "[]");
      const rejectLog = {
        feedback: feedbackText,
        timestamp: new Date().toISOString(),
        status: "REJECTED"
      };
      localStorage.setItem(`quote_audit_${quoteId}`, JSON.stringify([...logs, rejectLog]));

      queryClient.invalidateQueries({ queryKey: ["quote", quoteId] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      setShowFeedbackModal(false);
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

  useEffect(() => {
    if (quote && (quote.status === "DRAFT" || quote.status === "SENT")) {
      viewQuoteMutation.mutate();
    }
  }, [quote]);

  const handlePrint = () => {
    window.print();
  };

  const copyShareableLink = () => {
    if (typeof window !== "undefined") {
      const publicShareUrl = `${window.location.origin}/quotes/share/${quoteId}`;
      navigator.clipboard.writeText(publicShareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);

      // Auto-transition status from DRAFT -> SENT
      if (quote?.status === "DRAFT") {
        sendQuoteMutation.mutate();
      }
    }
  };

  const sendViaWhatsApp = () => {
    if (typeof window === "undefined") return;
    const phone = lead?.phone || lead?.contact?.phone || "";
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const publicShareUrl = `${window.location.origin}/quotes/share/${quoteId}`;
    const textMessage = encodeURIComponent(
      `Hello ${lead?.name || "Client"},\n\n` +
      `Here is your official EventOS Proposal & Price Quote (#${quote?.quoteNumber}):\n` +
      `💰 Contract Total: ₹${quote?.total?.toLocaleString("en-IN")}\n` +
      `🔗 View & Sign Web Proposal: ${publicShareUrl}\n\n` +
      `Please review and digitally approve on screen. Thank you!`
    );

    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${textMessage}`
      : `https://wa.me/?text=${textMessage}`;

    window.open(waUrl, "_blank");

    if (quote?.status === "DRAFT") {
      sendQuoteMutation.mutate();
    }
    setShowSendModal(false);
  };

  const handleDownloadPdf = () => {
    if (quote?.pdfUrl && !quote.pdfUrl.includes("dummy.pdf")) {
      window.open(quote.pdfUrl, "_blank");
    } else {
      window.open(`/api/v1/crm/quotes/${quoteId}/pdf`, "_blank");
    }
  };

  const handleApprove = () => {
    approveQuoteMutation.mutate();
  };

  const handleReject = () => {
    rejectQuoteMutation.mutate();
  };

  if (quoteLoading || leadLoading) {
    return (
      <div className="min-h-screen bg-background text-muted-foreground flex items-center justify-center animate-pulse text-sm">

        Generating quote invoice template sheet...
      </div>
    );
  }

  if (quoteError || !quote) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 space-y-4">

        <AlertCircle className="text-red-500 h-12 w-12" />
        <h2 className="text-lg font-bold">Quote not found</h2>
        <p className="text-zinc-500 text-xs">Verify that the quote exists and the backend microservices are running.</p>
        <button
          onClick={() => router.push("/quotes")}
          className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold"
        >
          <ArrowLeft size={14} />
          Back to Quotes
        </button>
      </div>
    );
  }

  const statusStyle = STATUS_COLORS[quote.status] || "border-zinc-800 text-zinc-400";
  const auditLogs = typeof window !== "undefined" ? JSON.parse(localStorage.getItem(`quote_audit_${quoteId}`) || "[]") : [];

  // Template styling variables
  let tplBg = "bg-[#161618]/30 border-zinc-850 text-zinc-200";
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
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden transition-all duration-200 select-none">
      
      {/* Background glow effects to match landing page theme */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Top Navbar Header */}
      <nav className="h-16 border-b border-border bg-card/80 backdrop-blur px-6 flex items-center justify-between z-20 shrink-0 print:hidden">

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/quotes")}
            className="h-8 w-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-zinc-700/50 cursor-pointer"
            aria-label="Back to quotes"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">Quotation Sheet</span>
            <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">{quote.quoteNumber}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Primary Send Proposal Button */}
          <button
            onClick={() => setShowSendModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-500/20 cursor-pointer active:scale-[0.98]"
          >
            <Send size={13} />
            <span>Send Proposal to Client</span>
          </button>

          <button
            onClick={copyShareableLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-300 transition cursor-pointer"
          >
            {copiedLink ? <CheckCircle size={13} className="text-emerald-500" /> : <Share2 size={13} />}
            <span>{copiedLink ? "Link Copied" : "Share link"}</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/20 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Download size={13} />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-300 transition cursor-pointer"
          >
            <Printer size={13} />
            Print Quote
          </button>

          {/* Approve/Reject triggers */}
          {(quote.status === "DRAFT" || quote.status === "SENT" || quote.status === "VIEWED") && (
            <>
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-red-650/10 hover:bg-red-650/20 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <XIcon size={14} />
                Reject
              </button>
              <button
                onClick={() => setShowSignModal(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple-650 to-pink-650 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer active:scale-[0.98]"
              >
                <Check size={14} />
                Approve
              </button>
            </>
          )}

          {quote.status === "ACCEPTED" && booking && (
            <button
              onClick={() => router.push(`/bookings/${booking.id}`)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-650/10 hover:bg-emerald-650/20 text-emerald-450 border border-emerald-500/20 rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
            >
              <Award size={14} />
              Open Booking ({booking.bookingNumber})
            </button>
          )}
        </div>
      </nav>

      {/* Main content split grid */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-8 print:p-0 print:block">
        
        {/* Left Columns (Invoice sheet) */}
        <div className="lg:col-span-3 space-y-6">
          {errorText && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2 print:hidden">
              <AlertCircle size={14} />
              <span>{errorText}</span>
            </div>
          )}

          <div
            className={`p-10 border rounded-2xl shadow-xl space-y-8 print:border-none print:shadow-none print:p-0 print:bg-white print:text-black ${tplBg}`}
          >
            {/* Sheet Header */}
            <div className={`flex justify-between items-start border-b pb-6 ${tplHeader}`}>
              <div className="space-y-1">
                <h2 className={`text-2xl font-extrabold tracking-tight ${tplAccentText} print:text-black`}>
                  {tplTitle}
                </h2>
                <p className="text-[10px] text-zinc-500 font-bold print:text-zinc-650">
                  EventOS Business Operations Workspace
                </p>
              </div>
              <div className="text-right space-y-1">
                <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-bold uppercase tracking-wider ${statusStyle} print:border-black print:text-black`}>
                  {quote.status}
                </span>
                <p className="text-[11px] font-mono text-zinc-400 mt-2.5 print:text-zinc-650">
                  Ref: {quote.quoteNumber}
                </p>
                <p className="text-[10px] text-zinc-500 print:text-zinc-650">
                  Date: {new Date(quote.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* Client Context Details */}
            <div className="grid grid-cols-2 gap-6 text-xs leading-relaxed">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block print:text-zinc-650">Prepared For</span>
                <h4 className="font-extrabold text-sm text-zinc-150 print:text-black">{lead?.name || "Client Sponsor"}</h4>
                <p className="text-zinc-450 print:text-zinc-650">{lead?.contact?.email || lead?.email || "---"}</p>
                <p className="text-zinc-450 print:text-zinc-650">{lead?.contact?.phone || lead?.phone || "---"}</p>
              </div>
              <div className="space-y-1 text-left md:text-right">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block print:text-zinc-650">Provider Info</span>
                <h4 className="font-extrabold text-sm text-zinc-150 print:text-black">EventOS Planner Corp</h4>
                <p className="text-zinc-450 print:text-zinc-650">billing@eventos.com</p>
                <p className="text-zinc-450 print:text-zinc-650">+91 99999 88888</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto text-xs font-semibold">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b font-bold ${tplTableHead} print:border-black print:text-black`}>
                    <th className="py-2.5 px-3">Service Line Item</th>
                    <th className="py-2.5 px-3">Description Details</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 print:divide-zinc-300 font-medium">
                  {quote.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-900/10 print:hover:bg-transparent">
                      <td className="py-3 px-3 font-bold text-zinc-200 print:text-black">{item.itemName}</td>
                      <td className="py-3 px-3 text-zinc-450 print:text-zinc-650">{item.description || "---"}</td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-300 print:text-black">
                        ₹{item.unitPrice?.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-zinc-300 print:text-black">{item.quantity}</td>
                      <td className="py-3 px-3 text-right font-bold font-mono text-zinc-200 print:text-black">
                        ₹{item.total?.toLocaleString()}
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
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block print:text-zinc-650">Operational Notes</span>
                    <p className="text-zinc-400 bg-zinc-900/40 p-3 rounded-xl border border-zinc-850 print:border-zinc-300 print:bg-transparent print:text-black leading-relaxed">
                      {quote.clientNotes}
                    </p>
                  </div>
                )}

                {quote.termsConditions && (
                  <div className="space-y-1 text-xs">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block print:text-zinc-650">Contract Terms</span>
                    <p className="text-[10px] text-zinc-500 print:text-zinc-650 leading-relaxed font-medium">
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
                    ₹{quote.subtotal?.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-zinc-450 print:text-zinc-650">
                  <span>Discount Deduction</span>
                  <span className="font-mono font-bold text-zinc-200 print:text-black">
                    - ₹{quote.discount?.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-zinc-450 print:text-zinc-650">
                  <span>Taxes & GST</span>
                  <span className="font-mono font-bold text-zinc-200 print:text-black">
                    + ₹{quote.tax?.toLocaleString()}
                  </span>
                </div>

                {/* Grand Total */}
                <div className={`flex justify-between items-center border-t pt-3.5 text-sm font-bold ${tplHeader} print:border-black`}>
                  <span className="text-zinc-200 print:text-black">Grand Total</span>
                  <span className={`font-mono font-extrabold text-emerald-400 text-base print:text-black ${tplAccentText}`}>
                    ₹{quote.total?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar (Version History & Client Digital approvals logs) */}
        <div className="space-y-6 print:hidden font-semibold text-xs select-none">
          {/* Quote metadata details panel */}
          <div className="p-4 border border-zinc-850 bg-zinc-950/20 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <Lock size={13} className="text-purple-400" />
              Digital Sign-off Vault
            </h3>
            {quote.status === "ACCEPTED" ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 flex items-center gap-2">
                <UserCheck size={14} className="shrink-0" />
                <div>
                  <span className="font-bold block">Digitally Sign-off Completed</span>
                  <span className="text-[10px] opacity-80 block">Signee: {signerName || "Client Sponsor"}</span>
                </div>
              </div>
            ) : (
              <p className="text-zinc-500 leading-normal">
                Waiting for client approval. Secure sharing link active for client review.
              </p>
            )}
          </div>

          {/* Audit version timeline */}
          <div className="p-4 border border-zinc-850 bg-zinc-950/20 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <History size={13} className="text-purple-400" />
              Quote Version Logs
            </h3>
            <div className="space-y-4 border-l border-zinc-850 pl-3 ml-1.5">
              {auditLogs.map((log: any, idx: number) => (
                <div key={idx} className="relative">
                  <span className="absolute -left-[18px] mt-1.5 h-2 w-2 rounded-full bg-purple-500 ring-4 ring-[#09090b]" />
                  <div>
                    <span className="font-bold text-zinc-200 block">v1.{idx} - Status: {log.status}</span>
                    {log.signer && <p className="text-[10px] text-zinc-500 font-medium">Signed by: {log.signer}</p>}
                    {log.feedback && <p className="text-[10px] text-zinc-500 font-medium">Feedback: {log.feedback}</p>}
                    <span className="text-[9px] text-zinc-600 block">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              <div className="relative">
                <span className="absolute -left-[18px] mt-1.5 h-2 w-2 rounded-full bg-purple-500 ring-4 ring-[#09090b]" />
                <div>
                  <span className="font-bold text-zinc-200 block">v1.0 - Original Proposal Draft</span>
                  <p className="text-[10px] text-zinc-550">Created by CRM system broker</p>
                  <span className="text-[9px] text-zinc-650">{new Date(quote.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Digital Sign-off Modal overlay */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl text-white space-y-4 relative">
            <button onClick={() => setShowSignModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
              <XIcon size={16} />
            </button>
            <h3 className="text-base font-bold flex items-center gap-2">
              <UserCheck size={16} className="text-purple-400" />
              Digital Approval Sign-off
            </h3>
            <p className="text-xs text-zinc-450 font-medium leading-relaxed">
              By typing your name, you acknowledge this is a binding contract sign-off for Quote number {quote.quoteNumber}.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleApprove();
              }}
              className="space-y-4 text-xs font-semibold"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-555 uppercase">Full Signee Name</label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="E.g., Shreya Sen"
                  required
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-555 uppercase">Job Title / Role</label>
                <input
                  type="text"
                  value={signerTitle}
                  onChange={(e) => setSignerTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                />
              </div>
              <button
                type="submit"
                disabled={approveQuoteMutation.isPending}
                className="w-full py-2.5 bg-purple-650 hover:bg-purple-650 text-white rounded-lg font-bold transition active:scale-95"
              >
                {approveQuoteMutation.isPending ? "Signing..." : "Electronically Sign & Accept"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reject/Request Changes feedback overlay */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl text-white space-y-4 relative">
            <button onClick={() => setShowFeedbackModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
              <XIcon size={16} />
            </button>
            <h3 className="text-base font-bold flex items-center gap-2">
              <MessageSquare size={16} className="text-red-400" />
              Request Changes / Decline Proposal
            </h3>
            <p className="text-xs text-zinc-450 font-medium">
              Provide specific feedback or changes needed. This will be logged on the Lead timeline.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleReject();
              }}
              className="space-y-4 text-xs font-semibold"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-555 uppercase">Feedback / Remarks</label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Specify budget changes or line items corrections needed..."
                  required
                  rows={4}
                  className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={rejectQuoteMutation.isPending}
                className="w-full py-2.5 bg-red-650 hover:bg-red-700 text-white rounded-lg font-bold transition"
              >
                {rejectQuoteMutation.isPending ? "Submitting..." : "Submit Decline & Feedback"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Send Proposal to Client Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md p-6 bg-[#09090B] border border-white/10 rounded-2xl shadow-2xl text-white space-y-5 relative">
            <button 
              onClick={() => setShowSendModal(false)} 
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition"
            >
              <XIcon size={16} />
            </button>

            <div className="space-y-1.5">
              <span className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-widest block">
                Proposal Delivery Hub
              </span>
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                <Send size={18} className="text-emerald-400" />
                Send Web Proposal to Client
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Dispatch the interactive Web Proposal link to <strong className="text-zinc-200">{lead?.name || "Client"}</strong>. Status will automatically update from <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-300 font-mono text-[10px]">DRAFT</span> ➔ <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded font-mono text-[10px]">SENT</span>.
              </p>
            </div>

            <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Quote Number:</span>
                <span className="font-mono text-zinc-200 font-bold">{quote?.quoteNumber}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Client Name:</span>
                <span className="text-zinc-200 font-bold">{lead?.name || "Unassigned"}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Client Phone:</span>
                <span className="font-mono text-emerald-400 font-bold">{lead?.phone || lead?.contact?.phone || "Not Specified"}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400 border-t border-white/[0.06] pt-2">
                <span>Contract Total:</span>
                <span className="font-extrabold text-white text-sm">₹{quote?.total?.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {/* Option 1: WhatsApp Direct Dispatch */}
              <button
                onClick={sendViaWhatsApp}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2.5 transition shadow-lg shadow-emerald-600/25 cursor-pointer active:scale-[0.98]"
              >
                <Share2 size={16} />
                <span>Send via WhatsApp Web/App</span>
              </button>

              {/* Option 2: Copy Live Web Link */}
              <button
                onClick={() => {
                  copyShareableLink();
                  setShowSendModal(false);
                }}
                className="w-full py-2.5 px-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {copiedLink ? <CheckCircle size={15} className="text-emerald-400" /> : <Copy size={15} />}
                <span>{copiedLink ? "Web Link Copied to Clipboard!" : "Copy Web Proposal Link"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
