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

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex flex-col relative overflow-hidden transition-all duration-200">
      
      {/* Background glow effects to match landing page theme */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Top Navbar */}
      <nav className="h-16 border-b border-zinc-800 bg-[#111113]/80 backdrop-blur px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="h-8 w-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-zinc-700/50"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">Quotes</span>
            <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">Manager</span>
          </div>
        </div>

        <button
          onClick={() => router.push("/quotes/new")}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-purple-600/10 active:scale-[0.98]"
        >
          <Plus size={16} />
          New Quote
        </button>
      </nav>

      {/* Main Container */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header Title */}
        <div className="border-b border-zinc-850 pb-4">
          <h2 className="text-xl font-bold">Quotes & Proposals</h2>
          <p className="text-xs text-zinc-400">Generate pricing templates, line item lists, and review client approvals.</p>
        </div>

        {/* Quotes Render */}
        {isLoading ? (
          <div className="text-center text-zinc-500 animate-pulse py-12 text-sm">
            Fetching active pricing quotes and lead records...
          </div>
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
                          {q.pdfUrl && (
                            <a
                              href={q.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-1.5 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all flex items-center gap-1 text-[9px] font-bold border border-zinc-700/30"
                              title="Download PDF"
                            >
                              <FileText size={10} />
                              PDF
                            </a>
                          )}
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
              {quotes.length === 0 && (
                <div className="col-span-full py-16 text-center border border-dashed border-zinc-800 rounded-xl text-sm text-zinc-500">
                  No quotes generated yet. Click "New Quote" to build your first proposal.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
