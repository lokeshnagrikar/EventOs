"use client";

import React, { useState, useRef } from "react";
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
  FileSpreadsheet,
  Download,
  PenTool,
  Bookmark,
  Calendar,
  Lock,
  Layers,
  History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  quoteNumber: string;
  status: "DRAFT" | "SENT" | "VIEWED" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  templateName: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  clientNotes?: string;
  termsConditions?: string;
  createdAt: string;
  approvedAt?: string;
  items: QuoteItem[];
}

export default function PortalQuotesPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Digital Signature Canvas / Pad states
  const [showSignPad, setShowSignPad] = useState(false);
  const [typedSignature, setTypedSignature] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const clientQuotes = quotesResponse?.data || [];

  // Mutation: Approve Quote
  const approveQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const res = await api.post(`/crm/quotes/${quoteId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientQuotes"] });
      if (selectedQuote) {
        setSelectedQuote(prev => prev ? { ...prev, status: "ACCEPTED" as const } : null);
      }
      setShowSignPad(false);
      addToast("Contract signed and locked! Invoices have been generated.", "success");
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error?.message || "Failed to approve quote.", "error");
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
        setSelectedQuote(prev => prev ? { ...prev, status: "REJECTED" as const } : null);
      }
      addToast("Proposal rejected.", "info");
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error?.message || "Failed to reject quote.", "error");
    }
  });

  const handleSignConfirm = () => {
    if (!typedSignature.trim()) {
      addToast("Please type your signature signature name.", "error");
      return;
    }
    if (selectedQuote) {
      approveQuoteMutation.mutate(selectedQuote.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <span className="h-8 w-8 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Retrieving proposals...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in text-zinc-300 select-none">
      
      {/* Header Info */}
      <div className="flex justify-between items-center border-b border-zinc-850 pb-5">
        <div>
          <h3 className="text-base font-extrabold text-zinc-150 uppercase tracking-wider flex items-center gap-2">
            <FileText size={18} className="text-purple-500" />
            Document Vault & Proposals
          </h3>
          <p className="text-xs text-zinc-400 mt-1 font-bold">
            Review detailed breakdowns, digital contract signing, and coordinator version histories.
          </p>
        </div>
      </div>

      {/* Tabs navigation for Document Vault */}
      <div className="flex bg-[#111113]/60 border border-zinc-850 p-1.5 rounded-2xl gap-2 max-w-sm text-xs font-bold">
        {[
          { id: "PROPOSALS", label: "Event Proposals" },
          { id: "CONTRACTS", label: "Signed Contracts" },
          { id: "PLANS", label: "Venue Plans" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id as any)}
            className={cn(
              "flex-1 py-2 text-center rounded-xl transition-all",
              activeCategory === tab.id ? "bg-zinc-800 text-purple-400" : "text-zinc-550 hover:text-zinc-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* RENDER LOGIC BY CATEGORY */}
      {activeCategory === "PROPOSALS" && (
        clientQuotes.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-850 rounded-2xl bg-[#161618]/10 text-zinc-500 flex flex-col items-center justify-center gap-3">
            <FileText size={36} className="text-zinc-700" />
            <div>
              <p className="font-semibold text-zinc-450">No active proposals found</p>
              <p className="text-xs text-zinc-650 mt-1">Quotations will show here once shared by our planner.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clientQuotes.map((quote) => (
              <div
                key={quote.id}
                onClick={() => setSelectedQuote(quote)}
                className="p-5 border border-zinc-800 hover:border-purple-600/40 bg-[#111113]/40 rounded-2xl transition-all cursor-pointer flex flex-col justify-between gap-4 group hover:shadow shadow-purple-500/5"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] text-zinc-555 font-black uppercase tracking-wider block">Proposal Number</span>
                      <h4 className="text-sm font-extrabold text-zinc-200 mt-1 group-hover:text-purple-400 transition-colors">{quote.quoteNumber}</h4>
                    </div>
                    <span className={`text-[8.5px] px-2 py-0.5 rounded-full font-black uppercase border ${
                      quote.status === "ACCEPTED"
                        ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20"
                        : quote.status === "REJECTED" || quote.status === "EXPIRED"
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    }`}>
                      {quote.status}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-850/40 pt-3 text-xs font-bold">
                    <span className="text-zinc-500 font-bold">Grand Total Amount:</span>
                    <span className="font-mono text-zinc-200">INR {quote.total.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2.5 border-t border-zinc-850/30 text-[9px] text-zinc-500 font-bold">
                  <span>Created: {new Date(quote.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-0.5 text-[10px] font-bold text-purple-400">
                    Review proposal details
                    <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {activeCategory === "CONTRACTS" && (
        <div className="p-4 border border-zinc-800 bg-[#111113]/30 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Signed Sign-Off Documents</h4>
            <span className="text-[9px] text-zinc-550 font-bold font-mono">2 files secured</span>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-zinc-950/20 border border-zinc-850 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-purple-400" />
                <div>
                  <h5 className="font-bold text-zinc-300">Client_Agreement_Signed.pdf</h5>
                  <p className="text-[9px] text-zinc-550 mt-0.5 font-mono">1.8 MB &bull; Signed June 28, 2026</p>
                </div>
              </div>
              <button className="h-8 w-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white" title="Download signed PDF">
                <Download size={13} />
              </button>
            </div>

            <div className="p-4 bg-zinc-950/20 border border-zinc-850 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-purple-400" />
                <div>
                  <h5 className="font-bold text-zinc-300">Catering_Deposit_Receipt.pdf</h5>
                  <p className="text-[9px] text-zinc-550 mt-0.5 font-mono">420 KB &bull; Signed June 25, 2026</p>
                </div>
              </div>
              <button className="h-8 w-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white" title="Download Receipt">
                <Download size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeCategory === "PLANS" && (
        <div className="p-4 border border-zinc-800 bg-[#111113]/30 rounded-2xl space-y-4">
          <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Venue Layout Maps</h4>
          
          <div className="p-4 bg-zinc-950/20 border border-zinc-850 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={16} className="text-purple-400" />
              <div>
                <h5 className="font-bold text-zinc-300">Venue_Floor_plan_v2.dwg</h5>
                <p className="text-[9px] text-zinc-550 mt-0.5 font-mono">14.2 MB &bull; Design v2</p>
              </div>
            </div>
            <button className="h-8 w-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white">
              <Download size={13} />
            </button>
          </div>
        </div>
      )}

      {/* DETAIL VIEW MODAL & SIGNATURE ENGINE */}
      <AnimatePresence>
        {selectedQuote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-[#111113] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative animate-fade-in"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/15 via-transparent to-transparent pointer-events-none" />

              {/* Header */}
              <div className="flex justify-between items-center p-5 border-b border-zinc-800 shrink-0 z-10 relative">
                <div>
                  <h2 className="text-xs font-black text-white flex items-center gap-2">
                    <FileText className="text-purple-500" size={16} />
                    Proposal Details: {selectedQuote.quoteNumber}
                  </h2>
                  <span className="text-[10px] text-zinc-550 font-mono font-semibold">
                    Published: {new Date(selectedQuote.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => { setSelectedQuote(null); setShowSignPad(false); }}
                  className="h-8 w-8 rounded-full bg-zinc-850 hover:bg-zinc-800 flex items-center justify-center text-zinc-450 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Scroll contents */}
              <div className="p-6 overflow-y-auto space-y-6 text-xs leading-relaxed z-10 relative">
                
                {/* Proposal Items Table */}
                <div className="border border-zinc-850 rounded-xl overflow-hidden bg-zinc-900/10">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-900 border-b border-zinc-850 text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                        <th className="p-3">Item Details</th>
                        <th className="p-3 text-right">Rate</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Sum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850/60 font-medium">
                      {selectedQuote.items.map((item) => (
                        <tr key={item.id} className="text-zinc-300">
                          <td className="p-3">
                            <p className="font-bold text-zinc-200">{item.itemName}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5 font-normal">{item.description || "No specifications listed."}</p>
                          </td>
                          <td className="p-3 text-right font-mono">INR {item.unitPrice.toLocaleString()}</td>
                          <td className="p-3 text-center font-mono">{item.quantity}</td>
                          <td className="p-3 text-right font-mono font-bold text-zinc-200">INR {item.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total breakups */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-2 border-t border-zinc-850 pt-3 text-right font-mono text-[11px] font-semibold">
                    <div className="flex justify-between text-zinc-500">
                      <span>Subtotal:</span>
                      <span>INR {selectedQuote.subtotal.toLocaleString()}</span>
                    </div>
                    {selectedQuote.discount > 0 && (
                      <div className="flex justify-between text-emerald-500">
                        <span>Discount:</span>
                        <span>- INR {selectedQuote.discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-zinc-500">
                      <span>Tax (GST 18%):</span>
                      <span>INR {selectedQuote.tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs font-black text-zinc-150 border-t border-zinc-850 pt-2">
                      <span>Grand Total:</span>
                      <span>INR {selectedQuote.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Terms and Version Logs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-zinc-850/60 pt-4 text-zinc-450">
                  <div className="space-y-1 bg-zinc-900/20 p-3.5 rounded-xl border border-zinc-850/40">
                    <h5 className="font-bold text-zinc-300 flex items-center gap-1.5">
                      <Lock size={12} className="text-zinc-550" />
                      Sign-Off Agreements
                    </h5>
                    <p className="text-[10px] mt-1 leading-normal font-semibold">Accepted quotes generate active schedules and billing receipts. Digital signatures signify formal layout consent.</p>
                  </div>
                  
                  {/* Proposal Version history logs */}
                  <div className="space-y-1 bg-zinc-900/20 p-3.5 rounded-xl border border-zinc-850/40">
                    <h5 className="font-bold text-zinc-300 flex items-center gap-1.5">
                      <History size={12} className="text-zinc-550" />
                      Version History Logs
                    </h5>
                    <div className="space-y-1 text-[9.5px] mt-1.5 font-bold font-mono text-zinc-500">
                      <p className="flex justify-between"><span>v2 (Latest) &bull; Florals update</span> <span>June 28</span></p>
                      <p className="flex justify-between"><span>v1 &bull; Original Proposal</span> <span>June 25</span></p>
                    </div>
                  </div>
                </div>

                {/* Draw Signature Drawer */}
                {showSignPad && selectedQuote.status === "SENT" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="p-4 border border-purple-500/20 bg-purple-550/[0.01] rounded-2xl space-y-4"
                  >
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest block">Contract Signature Verification</span>
                      <p className="text-[10px] text-zinc-450 mt-0.5">Type your name below to sign the contract digitally.</p>
                    </div>

                    <div className="space-y-2.5">
                      <input
                        type="text"
                        placeholder="Type full legal name..."
                        value={typedSignature}
                        onChange={(e) => setTypedSignature(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-xs focus:outline-none"
                      />
                      
                      {typedSignature && (
                        <div className="p-3 bg-zinc-950/40 border border-zinc-850 rounded-xl text-center">
                          <span className="text-[8px] text-zinc-550 uppercase font-black block">Generated Signature Stamp</span>
                          <span className="font-mono text-lg text-purple-400 italic font-black mt-1.5 block pr-4 select-none">
                            /s/ {typedSignature}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2 text-[10.5px]">
                      <button onClick={() => setShowSignPad(false)} className="px-3 py-1.5 border border-zinc-850 bg-zinc-950 rounded-lg">Cancel</button>
                      <button onClick={handleSignConfirm} className="px-4 py-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded-lg font-bold">
                        Confirm Signature
                      </button>
                    </div>
                  </motion.div>
                )}

              </div>

              {/* Actions Footer */}
              <div className="p-5 border-t border-zinc-800 bg-zinc-900/40 flex justify-end gap-3 shrink-0 z-10 relative">
                {selectedQuote.status === "SENT" ? (
                  <>
                    {!showSignPad && (
                      <>
                        <button
                          onClick={() => rejectQuoteMutation.mutate(selectedQuote.id)}
                          className="px-4 py-2 border border-zinc-850 bg-zinc-950 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/25 text-zinc-350 rounded-lg font-bold"
                        >
                          Reject Proposal
                        </button>
                        <button
                          onClick={() => setShowSignPad(true)}
                          className="flex items-center gap-1.5 px-5 py-2 bg-purple-650 hover:bg-purple-700 text-white rounded-lg font-bold shadow-md"
                        >
                          <PenTool size={13} />
                          Sign & Approve Proposal
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-zinc-550 font-bold">
                    <Bookmark size={13} className="text-emerald-400" />
                    <span>Agreement Signed:</span>
                    <span className="uppercase text-zinc-300 font-mono font-bold tracking-wider">{selectedQuote.status}</span>
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
