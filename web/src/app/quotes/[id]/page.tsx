"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  ChevronRight,
  Loader2,
  Trash2
} from "lucide-react";
import { cn, getAppBaseUrl } from "@/lib/utils";

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
  shareToken?: string;
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
  DRAFT: "border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800/40 text-slate-600 dark:text-zinc-400",
  SENT: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  VIEWED: "border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  ACCEPTED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  REJECTED: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
  EXPIRED: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400"
};

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;
  const queryClient = useQueryClient();
  
  useEffect(() => {
    router.prefetch("/quotes");
  }, [router]);
  
  const [errorText, setErrorText] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [signerName, setSignerName] = useState("");
  const [signerTitle, setSignerTitle] = useState("Client Sponsor");
  const [feedbackText, setFeedbackText] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);

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

  // 3. Fetch All Active Leads for Reassigning
  const { data: allLeadsResponse } = useQuery<{ data: Lead[] }>({
    queryKey: ["activeLeadsForReassign"],
    queryFn: async () => {
      const response = await api.get("/crm/leads");
      return response.data;
    }
  });

  const activeLeads = allLeadsResponse?.data || [];

  // 4. Fetch Associated Booking if ACCEPTED
  const { data: bookingResponse } = useQuery<{ data: { id: string; bookingNumber: string } }>({
    queryKey: ["bookingByQuote", quoteId],
    queryFn: async () => {
      const response = await api.get(`/events/bookings/by-quote/${quoteId}`);
      return response.data;
    },
    enabled: !!quote && quote.status === "ACCEPTED"
  });

  const booking = bookingResponse?.data;

  // Mutation to reassign quotation to another active lead
  const reassignLeadMutation = useMutation({
    mutationFn: async (newLeadId: string) => {
      const response = await api.patch(`/crm/quotes/${quoteId}/reassign`, { leadId: newLeadId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote", quoteId] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["lead"] });
      setShowReassignModal(false);
      setErrorText("");
    },
    onError: (err: any) => {
      setErrorText(err.response?.data?.error?.message || err.response?.data?.message || "Failed to reassign lead.");
    }
  });

  // Mutation to delete draft quotation
  const deleteQuoteMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/crm/quotes/${quoteId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      router.push("/quotes");
    },
    onError: (err: any) => {
      setErrorText(err.response?.data?.error?.message || err.response?.data?.message || "Failed to delete quote.");
    }
  });

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
      const response = await api.post(`/crm/quotes/${quoteId}/approve`, {
        signerName,
        signerTitle,
      });
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
      setErrorText(err.response?.data?.error?.message || err.response?.data?.message || "Failed to approve quote.");
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
      const publicShareUrl = `${getAppBaseUrl()}/quotes/share/${quote?.shareToken || quoteId}`;
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
    const publicShareUrl = `${getAppBaseUrl()}/quotes/share/${quote?.shareToken || quoteId}`;
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

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      setErrorText("");
      const response = await api.get(`/crm/quotes/${quoteId}/pdf`, {
        responseType: "blob"
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `quote-${quote?.quoteNumber || "proposal"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (e: any) {
      console.error("PDF download failed:", e);
      if (quote?.pdfUrl && !quote.pdfUrl.includes("dummy.pdf")) {
        window.open(quote.pdfUrl, "_blank");
      } else {
        setErrorText("Failed to generate and download quote proposal PDF.");
      }
    } finally {
      setDownloadingPdf(false);
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
        <Link
          href="/quotes"
          prefetch={true}
          className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 active:scale-95 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150"
        >
          <ArrowLeft size={14} />
          Back to Quotes
        </Link>
      </div>
    );
  }

  const statusStyle = STATUS_COLORS[quote.status] || "border-zinc-800 text-zinc-400";
  const auditLogs = typeof window !== "undefined" ? JSON.parse(localStorage.getItem(`quote_audit_${quoteId}`) || "[]") : [];

  // Template styling variables
  let tplBg = "bg-white dark:bg-[#12131a] border-slate-200/90 dark:border-white/[0.08] text-slate-900 dark:text-zinc-200 shadow-sm";
  let tplHeader = "border-slate-200/90 dark:border-white/[0.08]";
  let tplFont = "font-sans";
  let tplAccentText = "text-purple-600 dark:text-purple-400";
  let tplTableHead = "bg-slate-50 dark:bg-zinc-900/40 text-slate-600 dark:text-zinc-400 border-slate-200/90 dark:border-white/[0.08]";
  let tplTitle = "EventOS Proposals";

  if (quote.templateName === "ELEGANT") {
    tplBg = "bg-rose-50/40 dark:bg-[#0F0D0E]/80 border-rose-200 dark:border-pink-900/30 text-rose-950 dark:text-rose-100 font-serif shadow-sm";
    tplHeader = "border-rose-200 dark:border-pink-900/25";
    tplFont = "font-serif";
    tplAccentText = "text-pink-600 dark:text-pink-400";
    tplTableHead = "bg-rose-100/50 dark:bg-pink-950/20 text-rose-800 dark:text-pink-300 border-rose-200 dark:border-pink-900/20";
    tplTitle = "Wedding Celebration Proposal";
  } else if (quote.templateName === "PLAYFUL") {
    tplBg = "bg-emerald-50/40 dark:bg-[#090D0A]/80 border-emerald-200 dark:border-emerald-900/30 text-emerald-950 dark:text-emerald-100 shadow-sm";
    tplHeader = "border-emerald-200 dark:border-emerald-900/25";
    tplFont = "font-sans";
    tplAccentText = "text-emerald-600 dark:text-emerald-400";
    tplTableHead = "bg-emerald-100/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/20";
    tplTitle = "Birthday Gala Pricing Proposal";
  } else {
    tplBg = "bg-white dark:bg-[#111113] border-slate-200/90 dark:border-zinc-800 text-slate-900 dark:text-zinc-200 shadow-sm";
    tplHeader = "border-slate-200/90 dark:border-zinc-800";
    tplFont = "font-sans";
    tplAccentText = "text-blue-600 dark:text-blue-400";
    tplTableHead = "bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200/90 dark:border-zinc-800";
    tplTitle = "Corporate Events Agreement";
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f] text-slate-900 dark:text-foreground flex flex-col relative overflow-hidden transition-all duration-200 select-none">
      
      {/* Background glow effects to match landing page theme */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Top Navbar Header */}
      <nav className="h-16 border-b border-slate-200/90 dark:border-white/[0.08] bg-white/80 dark:bg-card/80 backdrop-blur px-6 flex items-center justify-between z-20 shrink-0 print:hidden">

        <div className="flex items-center gap-3">
          <Link
            href="/quotes"
            prefetch={true}
            className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 active:scale-90 active:bg-purple-600/30 flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-all duration-150 border border-slate-200 dark:border-zinc-700/50 cursor-pointer shadow-sm group"
            aria-label="Back to quotes"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-slate-900 dark:text-white">Quotation Sheet</span>
            <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded-lg text-slate-600 dark:text-zinc-400 font-semibold">{quote.quoteNumber}</span>
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 transition cursor-pointer shadow-sm"
          >
            {copiedLink ? <CheckCircle size={13} className="text-emerald-500" /> : <Share2 size={13} />}
            <span>{copiedLink ? "Link Copied" : "Share link"}</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-600/10 dark:hover:bg-purple-600/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            {downloadingPdf ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            <span>{downloadingPdf ? "Generating PDF..." : "Download PDF"}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/60 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 transition cursor-pointer shadow-sm"
          >
            <Printer size={13} />
            Print Quote
          </button>

          {/* Approve/Reject triggers */}
          {(quote.status === "DRAFT" || quote.status === "SENT" || quote.status === "VIEWED") && (
            <>
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-650/10 dark:hover:bg-red-650/20 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-500/20 rounded-xl text-xs font-bold transition cursor-pointer"
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

          {/* Reassign Lead Action */}
          <button
            onClick={() => {
              setSelectedLeadId(quote.leadId || "");
              setShowReassignModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/80 hover:bg-slate-50 dark:hover:bg-zinc-850 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 transition cursor-pointer shadow-sm"
            title="Link this quote to an active CRM lead"
          >
            <UserCheck size={13} className="text-purple-600 dark:text-purple-400" />
            <span>Link Lead</span>
          </button>

          {/* Delete Draft Quote (Strictly enabled only for DRAFT quotes) */}
          {quote.status === "DRAFT" && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Delete this draft quote"
            >
              <Trash2 size={13} />
              <span>Delete Draft</span>
            </button>
          )}

          {quote.status === "ACCEPTED" && booking && (
            <button
              onClick={() => router.push(`/bookings/${booking.id}`)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-650/10 dark:hover:bg-emerald-650/20 text-emerald-700 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
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

          {/* Informational Alert if Associated Lead was deleted or unassigned */}
          {!lead && (
            <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs print:hidden shadow-lg shadow-amber-500/5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <AlertCircle size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-300">CRM Lead Record is Archived / Detached</span>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Audit Preserved
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    This quotation&apos;s itemized pricing, PDF contract, and legal terms are securely retained. You can link this proposal to any active CRM lead anytime.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedLeadId("");
                  setShowReassignModal(true);
                }}
                className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95"
              >
                <UserCheck size={13} />
                <span>Link Active Lead</span>
              </button>
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
                <p className="text-zinc-450 print:text-zinc-650">billing@eventosapp.in</p>
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
          <div className="p-4 sm:p-5 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 shadow-sm backdrop-blur-md rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
              <Lock size={13} className="text-purple-600 dark:text-purple-400" />
              Digital Sign-off Vault
            </h3>
            {quote.status === "ACCEPTED" ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <UserCheck size={14} className="shrink-0" />
                <div>
                  <span className="font-bold block">Digital Sign-off Completed</span>
                  <span className="text-[10px] opacity-80 block">Signee: {signerName || "Client Sponsor"}</span>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 dark:text-zinc-400 leading-normal font-medium">
                Waiting for client approval. Secure sharing link active for client review.
              </p>
            )}
          </div>

          {/* Audit version timeline */}
          <div className="p-4 sm:p-5 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 shadow-sm backdrop-blur-md rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
              <History size={13} className="text-purple-600 dark:text-purple-400" />
              Quote Version Logs
            </h3>
            <div className="space-y-4 border-l border-slate-200 dark:border-zinc-800 pl-3 ml-1.5">
              {auditLogs.map((log: any, idx: number) => (
                <div key={idx} className="relative">
                  <span className="absolute -left-[18px] mt-1.5 h-2 w-2 rounded-full bg-purple-500 ring-4 ring-white dark:ring-[#09090b]" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-zinc-200 block">v1.{idx} - Status: {log.status}</span>
                    {log.signer && <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Signed by: {log.signer}</p>}
                    {log.feedback && <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Feedback: {log.feedback}</p>}
                    <span className="text-[9px] text-slate-400 dark:text-zinc-500 block">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              <div className="relative">
                <span className="absolute -left-[18px] mt-1.5 h-2 w-2 rounded-full bg-purple-500 ring-4 ring-white dark:ring-[#09090b]" />
                <div>
                  <span className="font-bold text-slate-800 dark:text-zinc-200 block">v1.0 - Original Proposal Draft</span>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">Created by CRM system broker</p>
                  <span className="text-[9px] text-slate-400 dark:text-zinc-500">{new Date(quote.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Digital Sign-off Modal overlay */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 bg-white dark:bg-[#0e0f15] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl text-slate-900 dark:text-white space-y-4 relative">
            <button onClick={() => setShowSignModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
              <XIcon size={16} />
            </button>
            <h3 className="text-base font-bold flex items-center gap-2">
              <UserCheck size={16} className="text-purple-600 dark:text-purple-400" />
              Digital Approval Sign-off
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
              By typing your name, you acknowledge this is a binding contract sign-off for Quote number {quote.quoteNumber}.
            </p>
            {errorText && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorText}</span>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleApprove();
              }}
              className="space-y-4 text-xs font-semibold"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Full Signee Name</label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="E.g., Shreya Sen"
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Job Title / Role</label>
                <input
                  type="text"
                  value={signerTitle}
                  onChange={(e) => setSignerTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
                />
              </div>
              <button
                type="submit"
                disabled={approveQuoteMutation.isPending}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold transition active:scale-95 cursor-pointer shadow-md shadow-purple-600/10"
              >
                {approveQuoteMutation.isPending ? "Signing..." : "Electronically Sign & Accept"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reject/Request Changes feedback overlay */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 bg-white dark:bg-[#0e0f15] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl text-slate-900 dark:text-white space-y-4 relative">
            <button onClick={() => setShowFeedbackModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
              <XIcon size={16} />
            </button>
            <h3 className="text-base font-bold flex items-center gap-2">
              <MessageSquare size={16} className="text-red-500" />
              Request Changes / Decline Proposal
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
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
                <label className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Feedback / Remarks</label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Specify budget changes or line items corrections needed..."
                  required
                  rows={4}
                  className="w-full p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <button
                type="submit"
                disabled={rejectQuoteMutation.isPending}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition cursor-pointer shadow-md shadow-red-600/10"
              >
                {rejectQuoteMutation.isPending ? "Submitting..." : "Submit Decline & Feedback"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Send Proposal to Client Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md p-6 bg-white dark:bg-[#0e0f15] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl text-slate-900 dark:text-white space-y-5 relative">
            <button 
              onClick={() => setShowSendModal(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <XIcon size={16} />
            </button>

            <div className="space-y-1.5">
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-widest block">
                Proposal Delivery Hub
              </span>
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                <Send size={18} className="text-emerald-600 dark:text-emerald-400" />
                Send Web Proposal to Client
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                Dispatch the interactive Web Proposal link to <strong className="text-slate-900 dark:text-zinc-200">{lead?.name || "Client"}</strong>. Status will automatically update from <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded text-slate-700 dark:text-zinc-300 font-mono text-[10px]">DRAFT</span> ➔ <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded font-mono text-[10px]">SENT</span>.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-500 dark:text-zinc-400">
                <span>Quote Number:</span>
                <span className="font-mono text-slate-900 dark:text-zinc-200 font-bold">{quote?.quoteNumber}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-zinc-400">
                <span>Client Name:</span>
                <span className="text-slate-900 dark:text-zinc-200 font-bold">{lead?.name || "Unassigned"}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-zinc-400">
                <span>Client Phone:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{lead?.phone || lead?.contact?.phone || "Not Specified"}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-zinc-400 border-t border-slate-200 dark:border-white/[0.06] pt-2">
                <span>Contract Total:</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">₹{quote?.total?.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {/* Option 1: WhatsApp Direct Dispatch */}
              <button
                onClick={sendViaWhatsApp}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2.5 transition shadow-lg shadow-emerald-600/20 cursor-pointer active:scale-[0.98]"
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
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {copiedLink ? <CheckCircle size={15} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={15} />}
                <span>{copiedLink ? "Web Link Copied to Clipboard!" : "Copy Web Proposal Link"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reassign to Active Lead Modal ── */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md p-6 bg-white dark:bg-[#0E0E11] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl text-slate-900 dark:text-white space-y-5 relative">
            <button
              onClick={() => setShowReassignModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <XIcon size={16} />
            </button>

            <div className="space-y-1.5">
              <span className="text-[9px] text-purple-600 dark:text-purple-400 font-extrabold uppercase tracking-widest block font-mono">
                CRM Relationship Linker
              </span>
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                <UserCheck size={18} className="text-purple-600 dark:text-purple-400" />
                Link Quotation to Active Lead
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                Connect quotation <strong className="text-slate-900 dark:text-zinc-200 font-mono">#{quote?.quoteNumber}</strong> to an active client inquiry. All line items, grand totals (₹{quote?.total?.toLocaleString("en-IN")}), and PDF terms will be instantly synced.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] text-slate-600 dark:text-zinc-400 uppercase font-bold tracking-wider block">
                Select Active CRM Lead:
              </label>

              {activeLeads.length === 0 ? (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900/50 text-center text-xs text-slate-500 dark:text-zinc-500 font-medium">
                  No active CRM leads found in this workspace. Please create or restore a lead in the CRM pipeline first.
                </div>
              ) : (
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-purple-500 transition cursor-pointer"
                >
                  <option value="">-- Choose Lead from CRM --</option>
                  {activeLeads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} {l.contact?.email ? `(${l.contact.email})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowReassignModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedLeadId || reassignLeadMutation.isPending}
                onClick={() => reassignLeadMutation.mutate(selectedLeadId)}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-purple-600/20 disabled:opacity-50 cursor-pointer"
              >
                {reassignLeadMutation.isPending ? "Linking..." : "Confirm Link"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Draft Quote Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm p-6 bg-white dark:bg-[#0E0E11] border border-red-500/20 rounded-2xl shadow-2xl text-slate-900 dark:text-white space-y-5 relative">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <XIcon size={16} />
            </button>

            <div className="space-y-2 text-center pt-2">
              <div className="h-12 w-12 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-inner">
                <Trash2 size={22} />
              </div>
              <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                Delete Draft Quotation?
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                Are you sure you want to permanently delete quotation <strong className="text-slate-900 dark:text-zinc-200 font-mono">#{quote?.quoteNumber}</strong>?
              </p>
              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 text-[11px] text-slate-500 dark:text-zinc-500 font-medium">
                Note: Only unsent DRAFT proposals can be deleted. Sent or accepted proposals are permanently preserved for legal tax & audit integrity.
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteQuoteMutation.isPending}
                onClick={() => deleteQuoteMutation.mutate()}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-red-600/20 cursor-pointer disabled:opacity-50"
              >
                {deleteQuoteMutation.isPending ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
