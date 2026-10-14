"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  FileText,
  Plus,
  ArrowLeft,
  DollarSign,
  ChevronRight,
  TrendingUp,
  Percent,
  CheckCircle,
  Clock,
  Calendar,
  AlertCircle,
  Download,
  Loader2
} from "lucide-react";
import PageShell from "@/components/ui/PageShell";
import EmptyState from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/skeletons";

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
  createdAt: string;
  pdfUrl?: string;
}

interface Lead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
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

const TEMPLATE_LABELS: Record<string, string> = {
  ELEGANT: "Elegant Wedding",
  MINIMALIST: "Minimalist Corporate",
  PLAYFUL: "Standard Birthday"
};

export default function QuotesPage() {
  const router = useRouter();

  // 1. Fetch Quotes
  const { data: quotesResponse, isLoading: quotesLoading } = useQuery<{ data: Quote[] }>({
    queryKey: ["quotes"],
    queryFn: async () => {
      const response = await api.get("/crm/quotes");
      return response.data;
    }
  });

  // 2. Fetch Leads (for correlation name mapping)
  const { data: leadsResponse, isLoading: leadsLoading } = useQuery<{ data: Lead[] }>({
    queryKey: ["leads"],
    queryFn: async () => {
      const response = await api.get("/crm/leads");
      return response.data;
    }
  });

  const quotes = quotesResponse?.data || [];
  const leads = leadsResponse?.data || [];
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const getLeadInfo = (leadId: string) => {
    const found = leads.find((l) => l.id === leadId);
    if (found) {
      return { name: found.name, isArchived: false };
    }
    return { name: "Archived Lead", isArchived: true };
  };

  const handleDownloadPdf = async (e: React.MouseEvent, q: Quote) => {
    e.stopPropagation();
    try {
      setDownloadingId(q.id);
      const response = await api.get(`/crm/quotes/${q.id}/pdf`, {
        responseType: "blob"
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `quote-${q.quoteNumber || "proposal"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("PDF download failed:", err);
      if (q.pdfUrl && !q.pdfUrl.includes("dummy.pdf")) {
        window.open(q.pdfUrl, "_blank");
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const isLoading = quotesLoading || leadsLoading;

  if (isLoading) {
    return (
      <PageShell
        title="Quotes & Proposals"
        subtitle="Generate pricing templates, line item lists, and review client approvals."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </PageShell>
    );
  }

  const headerActions = (
    <button
      onClick={() => router.push("/quotes/new")}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/15 active:scale-[0.98]"
    >
      <Plus size={14} />
      New Quote
    </button>
  );

  return (
    <PageShell
      title="Quotes & Proposals"
      subtitle="Generate pricing templates, line item lists, and review client approvals."
      actions={headerActions}
    >
      {quotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Quotes Generated Yet"
          description="Build pricing models and send professional, interactive quotes to your clients."
          primaryAction={{
            label: "New Quote",
            onClick: () => router.push("/quotes/new")
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 shadow-sm backdrop-blur-md space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest block truncate">Total Proposals</span>
              <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono tabular-nums truncate">{quotes.length}</p>
            </div>
            <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 shadow-sm backdrop-blur-md space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest block truncate">Pipeline Value</span>
              <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums truncate">
                ₹{quotes.reduce((acc, q) => acc + (q.total || 0), 0).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 shadow-sm backdrop-blur-md space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest block truncate">Accepted Deals</span>
              <p className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-400 font-mono tabular-nums truncate">
                {quotes.filter((q) => ["ACCEPTED", "APPROVED", "PAID", "E_SIGNED"].includes(q.status)).length}
              </p>
            </div>
            <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 shadow-sm backdrop-blur-md space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest block truncate">Awaiting Sign-Off</span>
              <p className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums truncate">
                {quotes.filter((q) => ["SENT", "VIEWED", "PENDING", "DRAFT"].includes(q.status)).length}
              </p>
            </div>
          </div>

          {/* Grid Layout of Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {quotes.map((q) => {
              const statusStyle = STATUS_COLORS[q.status] || "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400";
              const templateLabel = TEMPLATE_LABELS[q.templateName] || q.templateName;

              return (
                <div
                  key={q.id}
                  onClick={() => router.push(`/quotes/${q.id}`)}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 hover:border-purple-500/40 hover:bg-slate-50/50 dark:hover:bg-[#151722]/80 transition-all cursor-pointer flex flex-col justify-between h-[215px] shadow-sm hover:shadow-xl hover:shadow-purple-500/5 group"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 text-slate-700 dark:text-zinc-300 px-2 py-0.5 rounded-lg font-bold">
                          {q.quoteNumber}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDownloadPdf(e, q)}
                          disabled={downloadingId === q.id}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-purple-100 dark:bg-zinc-900 dark:hover:bg-purple-600/20 text-slate-600 hover:text-purple-700 dark:text-zinc-400 dark:hover:text-purple-300 transition-all flex items-center gap-1 text-[9px] font-bold border border-slate-200 dark:border-zinc-800 cursor-pointer disabled:opacity-50"
                          title="Download PDF Proposal"
                        >
                          {downloadingId === q.id ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : (
                            <Download size={10} />
                          )}
                          PDF
                        </button>
                      </div>
                      <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-bold ${statusStyle}`}>
                        {q.status}
                      </span>
                    </div>
                    {(() => {
                      const leadInfo = getLeadInfo(q.leadId);
                      return (
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-tight line-clamp-1">
                            {leadInfo.name}
                          </h3>
                          {leadInfo.isArchived && (
                            <span className="shrink-0 text-[8.5px] font-bold font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25" title="Associated CRM lead was archived or detached">
                              Archived Lead
                            </span>
                          )}
                        </div>
                      );
                    })()}
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold">{templateLabel}</p>
                  </div>

                  <div className="border-t border-slate-100 dark:border-white/[0.08] pt-3 mt-4 flex items-center justify-between text-xs">
                    <div className="text-slate-500 dark:text-zinc-400 flex items-center gap-1 font-mono text-[11px]">
                      <Calendar size={12} />
                      <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 dark:text-zinc-500 block uppercase font-bold tracking-wider">Grand Total</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm font-mono tabular-nums">
                        ₹{(q.total || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PageShell>
  );
}
