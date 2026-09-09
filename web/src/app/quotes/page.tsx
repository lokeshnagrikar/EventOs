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
  DRAFT: "border-zinc-800 bg-zinc-800/20 text-zinc-400",
  SENT: "border-blue-500/20 bg-blue-500/5 text-blue-450",
  VIEWED: "border-indigo-500/20 bg-indigo-500/5 text-indigo-400",
  ACCEPTED: "border-emerald-500/20 bg-emerald-500/5 text-emerald-450",
  REJECTED: "border-red-500/20 bg-red-500/5 text-red-450",
  EXPIRED: "border-amber-500/20 bg-amber-500/5 text-amber-450"
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

  const getLeadName = (leadId: string) => {
    return leads.find((l) => l.id === leadId)?.name || "Unassigned Lead";
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-zinc-800 bg-[#121214]/60 backdrop-blur-sm space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Total Proposals</span>
              <p className="text-xl font-black text-white font-mono tabular-nums">{quotes.length}</p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800 bg-[#121214]/60 backdrop-blur-sm space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Pipeline Value</span>
              <p className="text-xl font-black text-emerald-400 font-mono tabular-nums">
                ₹{quotes.reduce((acc, q) => acc + (q.total || 0), 0).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800 bg-[#121214]/60 backdrop-blur-sm space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Accepted Deals</span>
              <p className="text-xl font-black text-purple-400 font-mono tabular-nums">
                {quotes.filter((q) => ["ACCEPTED", "APPROVED", "PAID", "E_SIGNED"].includes(q.status)).length}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800 bg-[#121214]/60 backdrop-blur-sm space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Awaiting Sign-Off</span>
              <p className="text-xl font-black text-amber-400 font-mono tabular-nums">
                {quotes.filter((q) => ["SENT", "VIEWED", "PENDING", "DRAFT"].includes(q.status)).length}
              </p>
            </div>
          </div>

          {/* Grid Layout of Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quotes.map((q) => {
              const statusStyle = STATUS_COLORS[q.status] || "border-zinc-800 text-zinc-400";
              const templateLabel = TEMPLATE_LABELS[q.templateName] || q.templateName;

              return (
                <div
                  key={q.id}
                  onClick={() => router.push(`/quotes/${q.id}`)}
                  className="p-5 rounded-2xl border border-zinc-800/80 bg-[#121214]/50 hover:border-purple-500/30 hover:bg-[#121214]/80 transition-all cursor-pointer flex flex-col justify-between h-[215px] hover:shadow-xl hover:shadow-purple-500/5 group"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-bold">
                          {q.quoteNumber}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDownloadPdf(e, q)}
                          disabled={downloadingId === q.id}
                          className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-purple-600/20 text-zinc-400 hover:text-purple-300 transition-all flex items-center gap-1 text-[9px] font-bold border border-zinc-800 cursor-pointer disabled:opacity-50"
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
                    <h3 className="font-bold text-base text-zinc-100 group-hover:text-purple-400 transition-colors leading-tight line-clamp-1">
                      {getLeadName(q.leadId)}
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-semibold">{templateLabel}</p>
                  </div>

                  <div className="border-t border-zinc-850 pt-3 mt-4 flex items-center justify-between text-xs">
                    <div className="text-zinc-500 flex items-center gap-1 font-mono text-[11px]">
                      <Calendar size={12} />
                      <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Grand Total</span>
                      <span className="font-extrabold text-emerald-400 text-sm font-mono tabular-nums">
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
