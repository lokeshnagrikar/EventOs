"use client";

import React from "react";
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
  AlertCircle
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

  const getLeadName = (leadId: string) => {
    return leads.find((l) => l.id === leadId)?.name || "Unassigned Lead";
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
        <div className="space-y-4">
          {/* Grid Layout of Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quotes.map((q) => {
              const statusStyle = STATUS_COLORS[q.status] || "border-zinc-800 text-zinc-400";
              const templateLabel = TEMPLATE_LABELS[q.templateName] || q.templateName;

              return (
                <div
                  key={q.id}
                  onClick={() => router.push(`/quotes/${q.id}`)}
                  className="p-5 rounded-xl border border-zinc-800 bg-[#161618]/40 hover:border-purple-500/30 transition-all cursor-pointer flex flex-col justify-between h-[210px] hover:shadow-lg hover:shadow-purple-500/5 group"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-bold">
                          {q.quoteNumber}
                        </span>
                        <a
                          href={q.pdfUrl && !q.pdfUrl.includes("dummy.pdf") ? q.pdfUrl : `/api/v1/crm/quotes/${q.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-1.5 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all flex items-center gap-1 text-[9px] font-bold border border-zinc-700/30"
                          title="Download PDF"
                        >
                          <FileText size={10} />
                          PDF
                        </a>
                      </div>
                      <span className={`px-2 py-0.5 border rounded-full text-[9px] font-bold ${statusStyle}`}>
                        {q.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-zinc-100 group-hover:text-purple-400 transition-colors leading-tight">
                      {getLeadName(q.leadId)}
                    </h3>
                    <p className="text-[10px] text-zinc-550 font-semibold">{templateLabel}</p>
                  </div>

                  <div className="border-t border-zinc-800/60 pt-3 mt-4 flex items-center justify-between text-xs">
                    <div className="text-zinc-500 flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Grand Total</span>
                      <span className="font-extrabold text-emerald-450 text-sm">
                        INR {q.total?.toLocaleString()}
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
