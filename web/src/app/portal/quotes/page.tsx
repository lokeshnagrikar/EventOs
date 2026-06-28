"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToastStore } from "@/lib/toastStore";
import { FileText, FileCheck, X, AlertCircle, ChevronRight, Loader2, FileSpreadsheet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const modalRef = React.useRef<HTMLDivElement>(null);

  // Escape key listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedQuote(null);
      }
    };
    if (selectedQuote) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedQuote]);

  // Focus trap listener
  React.useEffect(() => {
    if (selectedQuote && modalRef.current) {
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
  }, [selectedQuote]);

  // 1. Fetch Quotes
  const { data: quotesResponse, isLoading } = useQuery<{ data: Quote[] }>({
    queryKey: ["clientQuotes"],
    queryFn: async () => {
      const res = await api.get("/crm/quotes/client");
      return res.data;
    }
  });

  const clientQuotes = quotesResponse?.data || [];

  // 2. Mutation: Approve Quote
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
      addToast("Quote approved successfully! Preparing booking details...", "success");
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error?.message || "Failed to approve quote.", "error");
    }
  });

  // 3. Mutation: Reject Quote
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

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="animate-spin text-purple-500" size={32} />
        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Retrieving proposals...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h3 className="text-base font-extrabold text-zinc-150 uppercase tracking-wider flex items-center gap-2">
          <FileText size={18} className="text-purple-500" />
          Proposals & Contract Quotations
        </h3>
        <p className="text-xs text-zinc-400 mt-1.5">
          Review details of active cost breakdowns, logistics estimates, and sign-off agreements.
        </p>
      </div>

      {clientQuotes.length === 0 ? (
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
              className="p-5 border border-zinc-850 hover:border-purple-600/40 bg-[#111113]/40 rounded-2xl transition-all cursor-pointer flex flex-col justify-between gap-4 group hover:shadow-lg hover:shadow-purple-500/5"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Proposal No:</span>
                    <h4 className="text-sm font-extrabold text-zinc-200 mt-0.5 group-hover:text-purple-400 transition-colors">{quote.quoteNumber}</h4>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase border ${
                    quote.status === "ACCEPTED"
                      ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20"
                      : quote.status === "REJECTED" || quote.status === "EXPIRED"
                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : quote.status === "VIEWED"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}>
                    {quote.status}
                  </span>
                </div>
                <div className="flex justify-between border-t border-zinc-850/40 pt-3 text-xs font-semibold">
                  <span className="text-zinc-500">Proposed Total:</span>
                  <span className="font-bold text-zinc-150 font-mono">INR {quote.total.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-zinc-850/30">
                <span className="text-[9px] text-zinc-500 font-mono">
                  Dated: {new Date(quote.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-purple-400">
                  Review Details
                  <ChevronRight size={12} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL MODAL DRAWER */}
      <AnimatePresence>
        {selectedQuote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-[#111113] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-5 border-b border-zinc-800 shrink-0">
                <div>
                  <h2 id="modal-title" className="text-base font-bold text-white flex items-center gap-2">
                    <FileText className="text-purple-500" size={18} />
                    Proposal Details: {selectedQuote.quoteNumber}
                  </h2>
                  <span className="text-[10px] text-zinc-550 font-mono">
                    Created: {new Date(selectedQuote.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable details */}
              <div className="p-6 overflow-y-auto space-y-6 text-xs leading-relaxed">
                {/* Items Table */}
                <div className="border border-zinc-850 rounded-xl overflow-hidden bg-zinc-900/10">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-900 border-b border-zinc-850 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
                        <th className="p-3">Item Details</th>
                        <th className="p-3 text-right">Unit Price</th>
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

                {/* Total Breakouts */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-2 border-t border-zinc-850 pt-3 text-right font-mono text-[11px]">
                    <div className="flex justify-between text-zinc-500">
                      <span>Subtotal:</span>
                      <span>INR {selectedQuote.subtotal.toLocaleString()}</span>
                    </div>
                    {selectedQuote.discount > 0 && (
                      <div className="flex justify-between text-emerald-500">
                        <span>Discount Applied:</span>
                        <span>- INR {selectedQuote.discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-zinc-500">
                      <span>Tax (GST):</span>
                      <span>INR {selectedQuote.tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-zinc-100 border-t border-zinc-850 pt-2">
                      <span>Grand Total:</span>
                      <span>INR {selectedQuote.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Notes and terms */}
                {(selectedQuote.clientNotes || selectedQuote.termsConditions) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-zinc-850/60 pt-4 text-zinc-450">
                    {selectedQuote.clientNotes && (
                      <div className="space-y-1 bg-zinc-900/20 p-3.5 rounded-xl border border-zinc-850/40">
                        <h5 className="font-bold text-zinc-300">Guidelines & Comments</h5>
                        <p className="text-[10px] mt-1 leading-normal">{selectedQuote.clientNotes}</p>
                      </div>
                    )}
                    {selectedQuote.termsConditions && (
                      <div className="space-y-1 bg-zinc-900/20 p-3.5 rounded-xl border border-zinc-850/40">
                        <h5 className="font-bold text-zinc-300">Terms & Sign-off Agreements</h5>
                        <p className="text-[10px] mt-1 leading-normal">{selectedQuote.termsConditions}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="p-5 border-t border-zinc-800 bg-zinc-900/40 flex justify-end gap-3 shrink-0">
                {selectedQuote.status === "SENT" ? (
                  <>
                    <button
                      onClick={() => rejectQuoteMutation.mutate(selectedQuote.id)}
                      disabled={rejectQuoteMutation.isPending || approveQuoteMutation.isPending}
                      className="px-4 py-2 border border-zinc-850 bg-zinc-950 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/25 text-zinc-300 rounded-lg font-bold"
                    >
                      Reject Proposal
                    </button>
                    <button
                      onClick={() => approveQuoteMutation.mutate(selectedQuote.id)}
                      disabled={approveQuoteMutation.isPending || rejectQuoteMutation.isPending}
                      className="flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-md shadow-purple-600/15"
                    >
                      <FileCheck size={14} />
                      Approve & Lock Proposal
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-zinc-500 font-bold">
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
