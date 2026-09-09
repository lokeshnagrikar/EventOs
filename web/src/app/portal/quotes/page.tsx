"use client";

import React, { useState, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToastStore } from "@/lib/toastStore";
import {
  FileText,
  FileCheck,
  X,
  AlertCircle,
  ChevronRight,
  Loader2,
  Download,
  PenTool,
  Bookmark,
  Calendar,
  Lock,
  Layers,
  History,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import EmptyState from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/skeletons";

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
  quoteNumber: string;
  status: "DRAFT" | "SENT" | "VIEWED" | "ACCEPTED" | "REJECTED" | "EXPIRED" | string;
  templateName: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  clientNotes?: string;
  termsConditions?: string;
  createdAt: string;
  approvedAt?: string;
  items?: QuoteItem[];
}

export default function PortalQuotesPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Digital Signature states
  const [showSignPad, setShowSignPad] = useState(false);
  const [typedSignature, setTypedSignature] = useState("");

  // Document Vault Category
  const [activeCategory, setActiveCategory] = useState<"PROPOSALS" | "CONTRACTS" | "PLANS">("PROPOSALS");

  // Escape key listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedQuote(null);
        setShowSignPad(false);
      }
    };
    if (selectedQuote) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedQuote]);

  // Fetch Quotes
  const { data: quotesResponse, isLoading } = useQuery<{ data: Quote[] }>({
    queryKey: ["clientQuotes"],
    queryFn: async () => {
      const res = await api.get("/crm/quotes/client");
      return res.data;
    }
  });

  const clientQuotes = useMemo<Quote[]>(() => {
    if (Array.isArray(quotesResponse?.data)) return quotesResponse.data;
    if (Array.isArray(quotesResponse)) return quotesResponse as any;
    return [];
  }, [quotesResponse]);

  const signedContracts = useMemo(() => {
    return clientQuotes.filter((q) => q.status === "ACCEPTED");
  }, [clientQuotes]);

  // Mutation: Approve Quote
  const approveQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const res = await api.post(`/crm/quotes/${quoteId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientQuotes"] });
      if (selectedQuote) {
        setSelectedQuote(prev => prev ? { ...prev, status: "ACCEPTED", approvedAt: new Date().toISOString() } : null);
      }
      setShowSignPad(false);
      addToast("Contract signed and locked! Invoices have been generated.", "success");
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error?.message || err.response?.data?.message || "Failed to approve quote.", "error");
    }
  });

  // Mutation: Reject Quote
  const rejectQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const res = await api.post(`/crm/quotes/${quoteId}/reject`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientQuotes"] });
      if (selectedQuote) {
        setSelectedQuote(prev => prev ? { ...prev, status: "REJECTED" } : null);
      }
      addToast("Proposal declined. Your coordinator has been notified.", "info");
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error?.message || err.response?.data?.message || "Failed to reject quote.", "error");
    }
  });

  const handleOpenQuote = async (quote: Quote) => {
    setSelectedQuote(quote);
    setShowSignPad(false);
    setTypedSignature("");

    // If quote is SENT, record that the client has viewed it
    if (quote.status === "SENT") {
      try {
        await api.post(`/crm/quotes/${quote.id}/view`);
        queryClient.invalidateQueries({ queryKey: ["clientQuotes"] });
      } catch {
        // Non-blocking view tracking
      }
    }
  };

  const handleDownloadPdf = async (quoteId: string, quoteNumber: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      addToast("Generating official proposal PDF...", "info");
      const res = await api.get(`/crm/quotes/${quoteId}/pdf`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Proposal-${quoteNumber || "Quote"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      addToast("Proposal PDF downloaded!", "success");
    } catch {
      addToast("Could not download proposal PDF.", "error");
    }
  };

  const handleSignConfirm = () => {
    if (!typedSignature.trim()) {
      addToast("Please type your full legal name to execute the contract.", "error");
      return;
    }
    if (selectedQuote) {
      approveQuoteMutation.mutate(selectedQuote.id);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in text-zinc-300 select-none">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/[0.04] pb-5">
        <div>
          <h3 className="text-base font-extrabold text-zinc-150 uppercase tracking-wider flex items-center gap-2">
            <FileText size={18} className="text-purple-500" />
            Document Vault & Proposals
          </h3>
          <p className="text-xs text-zinc-400 mt-1 font-bold">
            Review itemized breakdowns, execute digital contract sign-offs, and track coordinator approvals.
          </p>
        </div>
      </div>

      {/* Tabs navigation for Document Vault */}
      <div className="flex bg-white/[0.02] border border-white/[0.04] p-1.5 rounded-2xl gap-2 max-w-md text-xs font-bold">
        {[
          { id: "PROPOSALS", label: "Event Proposals", count: clientQuotes.length },
          { id: "CONTRACTS", label: "Signed Contracts", count: signedContracts.length },
          { id: "PLANS", label: "Venue Plans", count: 0 }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id as any)}
            className={cn(
              "flex-1 py-2 text-center rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer",
              activeCategory === tab.id ? "bg-white/[0.08] text-purple-400 shadow-[0_1px_3px_rgba(0,0,0,0.3)] font-black" : "text-zinc-550 hover:text-zinc-300"
            )}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[9px]",
                activeCategory === tab.id ? "bg-purple-500/20 text-purple-300" : "bg-zinc-800 text-zinc-500"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── TAB 1: PROPOSALS ─── */}
      {activeCategory === "PROPOSALS" && (
        clientQuotes.length === 0 ? (
          <EmptyState
            variant="quotes"
            title="No active proposals found"
            description="Quotations and digital proposals will show here once issued by your coordinator."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clientQuotes.map((quote) => {
              const isActionable = quote.status === "SENT" || quote.status === "VIEWED" || quote.status === "DRAFT";
              return (
                <div
                  key={quote.id}
                  onClick={() => handleOpenQuote(quote)}
                  className="p-5 border border-white/[0.06] bg-white/[0.015] backdrop-blur-md hover:border-purple-500/40 hover:bg-white/[0.03] rounded-2xl transition-all cursor-pointer flex flex-col justify-between gap-4 group hover:shadow-lg hover:shadow-purple-500/5 duration-300"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">Proposal Number</span>
                        <h4 className="text-sm font-extrabold text-zinc-200 mt-1 group-hover:text-purple-400 transition-colors">{quote.quoteNumber}</h4>
                      </div>
                      <span className={`text-[8.5px] px-2.5 py-0.5 rounded-full font-black uppercase border ${
                        quote.status === "ACCEPTED"
                          ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/30"
                          : quote.status === "REJECTED" || quote.status === "EXPIRED"
                          ? "bg-red-500/10 text-red-400 border-red-500/30"
                          : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                      }`}>
                        {quote.status}
                      </span>
                    </div>

                    <div className="flex justify-between border-t border-white/[0.04] pt-3 text-xs font-bold">
                      <span className="text-zinc-500 font-bold">Grand Total Amount:</span>
                      <span className="font-mono text-zinc-200 font-black">₹{(Number(quote.total) || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-white/[0.04] text-[9px] text-zinc-500 font-bold">
                    <span>Issued: {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : "Recent"}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDownloadPdf(quote.id, quote.quoteNumber, e)}
                        className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition"
                        title="Download Proposal PDF"
                      >
                        <Download size={12} />
                      </button>

                      {isActionable ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenQuote(quote);
                            setShowSignPad(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-[10px] font-bold shadow-md shadow-purple-950/40 transition cursor-pointer"
                        >
                          <PenTool size={11} />
                          Sign & Approve
                        </button>
                      ) : (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-purple-400 group-hover:underline">
                          View details
                          <ChevronRight size={12} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ─── TAB 2: SIGNED CONTRACTS ─── */}
      {activeCategory === "CONTRACTS" && (
        <div className="p-6 border border-white/[0.04] bg-white/[0.01] backdrop-blur-md rounded-2xl space-y-4 shadow-sm">
          <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
            <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Executed & Legally Bound Contracts</h4>
            <span className="text-[9px] text-zinc-500 font-bold font-mono">{signedContracts.length} agreements locked</span>
          </div>

          {signedContracts.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-zinc-800/80 rounded-2xl text-zinc-500 text-xs space-y-2">
              <Lock size={22} className="mx-auto text-zinc-600 mb-2" />
              <p className="font-bold text-zinc-300">No signed contracts archived yet</p>
              <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                Once you review and approve a quotation in the Event Proposals tab, the executed contract and verified sign-off PDF will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {signedContracts.map((contract) => (
                <div
                  key={contract.id}
                  className="p-4 bg-white/[0.01] border border-white/[0.04] rounded-xl flex items-center justify-between gap-4 transition-all hover:border-white/[0.08]"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <FileCheck size={18} />
                    </div>
                    <div>
                      <h5 className="font-bold text-zinc-200 text-xs">
                        Agreement_{contract.quoteNumber}_Executed.pdf
                      </h5>
                      <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                        ₹{(Number(contract.total) || 0).toLocaleString()} &bull; Signed {contract.approvedAt ? new Date(contract.approvedAt).toLocaleDateString() : new Date(contract.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenQuote(contract)}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
                    >
                      View Agreement
                    </button>
                    <button
                      onClick={(e) => handleDownloadPdf(contract.id, contract.quoteNumber, e)}
                      className="h-8 w-8 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
                      title="Download Executed Contract PDF"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: VENUE PLANS ─── */}
      {activeCategory === "PLANS" && (
        <div className="p-6 border border-white/[0.04] bg-white/[0.01] backdrop-blur-md rounded-2xl space-y-4 shadow-sm">
          <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
            <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Venue Layout & Seating Schematics</h4>
            <span className="text-[9px] text-zinc-500 font-bold font-mono">Architectural Layouts</span>
          </div>
          
          <div className="text-center py-12 border border-dashed border-zinc-800/80 rounded-2xl text-zinc-500 text-xs space-y-2">
            <Layers size={24} className="mx-auto text-zinc-600 mb-2" />
            <p className="font-bold text-zinc-300">No floor plan schematics attached yet</p>
            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
              Your coordinator will upload verified ballroom blueprints, seating charts, and stage staging maps as they are finalized.
            </p>
          </div>
        </div>
      )}

      {/* ─── DETAIL VIEW MODAL & APPROVAL / SIGNATURE ENGINE ─── */}
      <AnimatePresence>
        {selectedQuote && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 pt-6 sm:pt-10 pb-8 overflow-y-auto">
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="w-full max-w-3xl bg-[#111113] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[86vh] relative my-auto shrink-0"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_var(--tw-gradient-stops))] from-purple-950/20 via-transparent to-transparent pointer-events-none" />

              {/* Header - Always visible sticky top bar */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800 shrink-0 z-30 sticky top-0 bg-[#111113]/95 backdrop-blur-md">
                <div className="min-w-0 pr-3">
                  <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2 truncate">
                    <FileText className="text-purple-400 shrink-0" size={18} />
                    <span>Proposal: {selectedQuote.quoteNumber}</span>
                  </h2>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400 font-mono font-bold">
                    <span>Issued: {selectedQuote.createdAt ? new Date(selectedQuote.createdAt).toLocaleDateString() : "Active"}</span>
                    <span>&bull;</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] uppercase font-black tracking-wider border",
                      selectedQuote.status === "ACCEPTED" ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/30" :
                      selectedQuote.status === "REJECTED" ? "bg-red-500/10 text-red-400 border-red-500/30" :
                      "bg-purple-500/10 text-purple-400 border-purple-500/30"
                    )}>
                      {selectedQuote.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => handleDownloadPdf(selectedQuote.id, selectedQuote.quoteNumber, e)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-750 transition cursor-pointer shadow-sm"
                    title="Download Official Proposal PDF"
                  >
                    <Download size={13} />
                    <span className="hidden sm:inline">Download PDF</span>
                  </button>
                  <button
                    onClick={() => { setSelectedQuote(null); setShowSignPad(false); }}
                    className="h-8 w-8 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer"
                    title="Close proposal modal"
                    aria-label="Close"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Scrollable contents */}
              <div className="p-6 overflow-y-auto space-y-6 text-xs leading-relaxed z-10 relative">
                
                {/* Proposal Items Table */}
                <div className="border border-zinc-850 rounded-2xl overflow-hidden bg-zinc-900/10">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-900/60 border-b border-zinc-850 text-[9.5px] font-black text-zinc-400 uppercase tracking-wider">
                        <th className="p-3.5">Deliverable Specification</th>
                        <th className="p-3.5 text-right">Unit Rate</th>
                        <th className="p-3.5 text-center">Qty</th>
                        <th className="p-3.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850/60 font-medium">
                      {(selectedQuote.items || []).map((item) => (
                        <tr key={item.id} className="text-zinc-300">
                          <td className="p-3.5">
                            <p className="font-bold text-zinc-200 text-xs">{item.itemName}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5 font-normal">{item.description || "Specifications included in master scope."}</p>
                          </td>
                          <td className="p-3.5 text-right font-mono text-zinc-300">₹{(Number(item.unitPrice) || 0).toLocaleString()}</td>
                          <td className="p-3.5 text-center font-mono font-bold">{item.quantity || 1}</td>
                          <td className="p-3.5 text-right font-mono font-black text-zinc-100">₹{(Number(item.total) || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                      {(!selectedQuote.items || selectedQuote.items.length === 0) && (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-zinc-500 text-xs">
                            Comprehensive package services included in this quotation proposal.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Total breakups */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-2 border-t border-zinc-850 pt-3 text-right font-mono text-[11px] font-semibold">
                    <div className="flex justify-between text-zinc-400">
                      <span>Subtotal:</span>
                      <span>₹{(Number(selectedQuote.subtotal) || 0).toLocaleString()}</span>
                    </div>
                    {(Number(selectedQuote.discount) || 0) > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Special Discount:</span>
                        <span>- ₹{(Number(selectedQuote.discount) || 0).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-zinc-400">
                      <span>GST Compliance (18%):</span>
                      <span>₹{(Number(selectedQuote.tax) || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-zinc-100 border-t border-zinc-850 pt-2">
                      <span>Grand Total:</span>
                      <span className="text-emerald-450 font-black">₹{(Number(selectedQuote.total) || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Terms and Version Logs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-zinc-850/60 pt-4 text-zinc-400">
                  <div className="space-y-1 bg-zinc-900/20 p-3.5 rounded-2xl border border-zinc-850/40">
                    <h5 className="font-bold text-zinc-300 flex items-center gap-1.5 text-xs">
                      <Lock size={12} className="text-purple-400" />
                      Sign-Off Agreement
                    </h5>
                    <p className="text-[10px] mt-1 leading-normal font-semibold text-zinc-500">
                      Accepting this proposal generates locked production schedules and verified billing invoices. Digital signatures signify legal consent under the EventOS master service contract.
                    </p>
                  </div>
                  
                  <div className="space-y-1 bg-zinc-900/20 p-3.5 rounded-2xl border border-zinc-850/40">
                    <h5 className="font-bold text-zinc-300 flex items-center gap-1.5 text-xs">
                      <History size={12} className="text-purple-400" />
                      Proposal Audit Trail
                    </h5>
                    <div className="space-y-1.5 text-[9.5px] mt-1.5 font-bold font-mono text-zinc-500">
                      <p className="flex justify-between">
                        <span>Proposal Published</span>
                        <span>{selectedQuote.createdAt ? new Date(selectedQuote.createdAt).toLocaleDateString() : "Active"}</span>
                      </p>
                      {selectedQuote.approvedAt ? (
                        <p className="flex justify-between text-emerald-400">
                          <span>✓ Digitally Approved</span>
                          <span>{new Date(selectedQuote.approvedAt).toLocaleDateString()}</span>
                        </p>
                      ) : (
                        <p className="flex justify-between text-purple-400">
                          <span>Awaiting Client Sign-Off</span>
                          <span>Pending</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Draw Signature Drawer */}
                {showSignPad && (selectedQuote.status === "SENT" || selectedQuote.status === "VIEWED" || selectedQuote.status === "DRAFT") && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="p-5 border border-purple-500/30 bg-purple-950/20 rounded-2xl space-y-4"
                  >
                    <div>
                      <span className="text-[9.5px] text-purple-400 uppercase font-black tracking-widest block">Digital Contract Execution</span>
                      <p className="text-[11px] text-zinc-300 mt-0.5">Type your full legal name below to bind and approve this proposal.</p>
                    </div>

                    <div className="space-y-2.5">
                      <input
                        type="text"
                        placeholder="e.g., Rohan Sharma"
                        value={typedSignature}
                        onChange={(e) => setTypedSignature(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                      />
                      
                      {typedSignature.trim() && (
                        <div className="p-3.5 bg-zinc-950/60 border border-purple-500/30 rounded-xl text-center space-y-1">
                          <span className="text-[8px] text-zinc-500 uppercase font-black block">Generated Signature Stamp</span>
                          <span className="font-mono text-xl text-purple-400 italic font-black block select-none">
                            /s/ {typedSignature}
                          </span>
                          <span className="text-[9px] text-zinc-500 block">Verified E-Signature &bull; EventOS Secure Sign</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2 text-[11px]">
                      <button
                        onClick={() => setShowSignPad(false)}
                        className="px-3.5 py-1.5 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-zinc-300 font-bold transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSignConfirm}
                        disabled={approveQuoteMutation.isPending}
                        className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold shadow-md transition cursor-pointer disabled:opacity-50"
                      >
                        {approveQuoteMutation.isPending ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Signing & Locking...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={13} />
                            <span>Confirm & Legally Bind</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

              </div>

              {/* Actions Footer */}
              <div className="p-5 border-t border-zinc-800 bg-zinc-900/40 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0 z-10 relative">
                <div>
                  <button
                    onClick={(e) => handleDownloadPdf(selectedQuote.id, selectedQuote.quoteNumber, e)}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white font-bold transition cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Download PDF Copy</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  {(selectedQuote.status === "SENT" || selectedQuote.status === "VIEWED" || selectedQuote.status === "DRAFT") ? (
                    <>
                      {!showSignPad && (
                        <>
                          <button
                            onClick={() => rejectQuoteMutation.mutate(selectedQuote.id)}
                            disabled={rejectQuoteMutation.isPending}
                            className="px-4 py-2 border border-zinc-800 bg-zinc-950 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 text-zinc-350 rounded-xl font-bold text-xs transition cursor-pointer disabled:opacity-50"
                          >
                            {rejectQuoteMutation.isPending ? "Declining..." : "Decline Proposal"}
                          </button>
                          <button
                            onClick={() => setShowSignPad(true)}
                            className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-purple-950/40 transition cursor-pointer active:scale-95"
                          >
                            <PenTool size={13} />
                            Sign & Approve Proposal
                          </button>
                        </>
                      )}
                    </>
                  ) : selectedQuote.status === "ACCEPTED" ? (
                    <div className="flex items-center gap-2 text-emerald-450 font-bold text-xs">
                      <Bookmark size={14} className="text-emerald-400" />
                      <span>Contract Signed & Legally Locked</span>
                      <span className="px-2 py-0.5 rounded-full text-[8.5px] uppercase font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        ACCEPTED
                      </span>
                    </div>
                  ) : selectedQuote.status === "REJECTED" ? (
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                      <X size={14} className="text-rose-400" />
                      <span>Proposal Declined</span>
                      <span className="px-2 py-0.5 rounded-full text-[8.5px] uppercase font-black bg-rose-500/10 border border-rose-500/20 text-rose-400">
                        REJECTED
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-zinc-500 font-bold text-xs">
                      <span>Status:</span>
                      <span className="uppercase text-zinc-300 font-mono font-bold tracking-wider">{selectedQuote.status}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
