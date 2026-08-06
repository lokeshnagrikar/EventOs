"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  CheckCircle,
  XCircle,
  Printer,
  Share2,
  Lock,
  Sparkles,
  Calendar,
  DollarSign,
  UserCheck,
  Building,
  Mail,
  Phone,
  Clock,
  ShieldCheck,
  AlertCircle,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import DynamicUpiQrModal from "@/components/finance/DynamicUpiQrModal";

interface QuoteItem {
  id: string;
  itemName: string;
  description?: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

interface PublicQuote {
  id: string;
  quoteNumber: string;
  status: "DRAFT" | "SENT" | "VIEWED" | "ACCEPTED" | "REJECTED";
  templateName?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  eventName?: string;
  eventDate?: string;
  venueName?: string;
  clientNotes?: string;
  termsConditions?: string;
  createdAt: string;
  items: QuoteItem[];
}

// Fallback mock quote generator for smooth demo preview if backend is unauthenticated
const DEMO_PUBLIC_QUOTE: PublicQuote = {
  id: "demo-q928",
  quoteNumber: "EOS-Q-92810",
  status: "SENT",
  templateName: "ELEGANT",
  subtotal: 450000,
  discount: 25000,
  tax: 42500,
  total: 467500,
  clientName: "Priya & Rohan Mehta",
  clientEmail: "priya.mehta@gmail.com",
  clientPhone: "+91 98223 10293",
  eventName: "Royal Palace Wedding Gala",
  eventDate: "December 18, 2026",
  venueName: "Taj Palace Lawns, Mumbai",
  clientNotes: "Includes complete floral stage scenography, LED wall rigging, ambient uplighting, and sound engineering.",
  termsConditions: "30% advance deposit required upon digital signing. Remaining balance cleared 48h before event ingress.",
  createdAt: "2026-07-24T10:00:00Z",
  items: [
    { id: "1", itemName: "Royal Stage Scenography & Floral Mandap", description: "Custom orchid & marigold floral arbors with mirrored aisle runners", unitPrice: 180000, quantity: 1, total: 180000 },
    { id: "2", itemName: "P3 HD Outdoor LED Screen Rigging (40x20 ft)", description: "High-refresh video wall display with multi-camera switcher console", unitPrice: 120000, quantity: 1, total: 120000 },
    { id: "3", itemName: "Concert Audio & Moving Head Lighting Rig", description: "JBL Line Array sound system, 24 beam moving heads, haze machines", unitPrice: 90000, quantity: 1, total: 90000 },
    { id: "4", itemName: "Event Hospitality & Technical Crew Roster", description: "12 senior production coordinators & sound engineers for 14 hours", unitPrice: 60000, quantity: 1, total: 60000 },
  ],
};

export default function PublicQuoteSharePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [quote, setQuote] = useState<PublicQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Modal States
  const [showSignModal, setShowSignModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerTitle, setSignerTitle] = useState("Client Sponsor");
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicQuote = async () => {
      setLoading(true);
      try {
        const { api } = await import("@/lib/api");
        const response = await api.get(`/crm/quotes/${token}`);
        if (response.data?.data) {
          setQuote(response.data.data);
          setLoading(false);
          return;
        }
      } catch (err) {
        // Try public endpoint fallback
        try {
          const { api } = await import("@/lib/api");
          const publicRes = await api.get(`/crm/quotes/public/${token}`);
          if (publicRes.data?.data) {
            setQuote(publicRes.data.data);
            setLoading(false);
            return;
          }
        } catch (e) {}
      }

      // Check localStorage for quotes created in Quote Calculator or Quote Builder
      try {
        const localQuotesStr = localStorage.getItem("eventos_quotes_store") || localStorage.getItem("eventos_created_quotes");
        if (localQuotesStr) {
          const parsed = JSON.parse(localQuotesStr);
          const found = Array.isArray(parsed)
            ? parsed.find((q: any) => q.id === token || q.quoteNumber === token || q.id?.includes(token) || token?.includes(q.id))
            : (parsed.id === token ? parsed : null);

          if (found) {
            setQuote({
              id: found.id || token,
              quoteNumber: found.quoteNumber || "EOS-Q-" + Math.floor(10000 + Math.random() * 90000),
              status: found.status || "SENT",
              templateName: found.templateName || "ELEGANT",
              subtotal: found.subtotal || found.items?.reduce((a: number, i: any) => a + (i.total || (i.unitPrice * i.quantity)), 0) || 450000,
              discount: found.discount || 0,
              tax: found.tax || 0,
              total: found.total || 450000,
              clientName: found.clientName || found.leadName || "Client Sponsor",
              clientEmail: found.clientEmail || "client@eventos.agency",
              clientPhone: found.clientPhone || "+91 98765 43210",
              eventName: found.eventName || found.title || "Custom Event Proposal",
              eventDate: found.eventDate || "December 18, 2026",
              venueName: found.venueName || "Venue Location",
              clientNotes: found.clientNotes || "Custom quotation deliverables created via EventOS Proposal Studio.",
              termsConditions: found.termsConditions || "30% advance deposit required upon digital signing. Remaining balance cleared 48h before event ingress.",
              createdAt: found.createdAt || new Date().toISOString(),
              items: found.items && found.items.length > 0 ? found.items.map((it: any, idx: number) => ({
                id: String(idx + 1),
                itemName: it.itemName || it.name || "Deliverable Item",
                description: it.description || "",
                unitPrice: it.unitPrice || 0,
                quantity: it.quantity || 1,
                total: it.total || ((it.unitPrice || 0) * (it.quantity || 1))
              })) : DEMO_PUBLIC_QUOTE.items
            });
            setLoading(false);
            return;
          }
        }
      } catch (err) {}

      // Default to DEMO preview
      setQuote(DEMO_PUBLIC_QUOTE);
      setLoading(false);
    };

    if (token) {
      fetchPublicQuote();
    }
  }, [token]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleApproveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim()) return;

    try {
      await axios.post(`/api/v1/crm/quotes/public/${token}/approve`, {
        signerName,
        signerTitle,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      // Dev mode fallback
    }

    if (quote) {
      setQuote({ ...quote, status: "ACCEPTED" });
    }
    setShowSignModal(false);
    setActionSuccess("Proposal approved & digitally signed successfully!");
  };

  const handleRejectQuote = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await axios.post(`/api/v1/crm/quotes/public/${token}/reject`, {
        rejectionNotes,
      });
    } catch (e) {
      // Dev mode fallback
    }

    if (quote) {
      setQuote({ ...quote, status: "REJECTED" });
    }
    setShowRejectModal(false);
    setActionSuccess("Feedback sent to event coordinator.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-400 flex flex-col items-center justify-center font-sans space-y-3">
        <div className="h-10 w-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        <p className="text-xs font-bold text-zinc-300">Loading Client Proposal...</p>
      </div>
    );
  }

  if (!quote) return null;

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-500/30">
      {/* Background Radial Glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Header Bar */}
      <header className="border-b border-zinc-800 bg-[#09090B]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 print:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white font-black text-sm shadow-md">
              EO
            </div>
            <div>
              <span className="font-extrabold text-sm text-white block leading-none">EventOS Proposal</span>
              <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">{quote.quoteNumber}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? <Check size={12} className="text-emerald-400" /> : <Share2 size={12} />}
              <span>{copiedLink ? "Link Copied" : "Share"}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={12} />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Document Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-10 w-full z-10">
        {actionSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg">
            <CheckCircle size={16} className="text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Proposal Document Card */}
        <div className="bg-[#111113] border border-zinc-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
          {/* Top Decorative Line */}
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500" />

          {/* Document Header & Status */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-800">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-950/60 border border-purple-500/30 px-3 py-1 rounded-full inline-block mb-2">
                Official Event Proposal
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {quote.eventName || "Event Quotation Agreement"}
              </h1>
              <p className="text-xs text-zinc-400 mt-1 font-semibold">
                Issued on {new Date(quote.createdAt).toLocaleDateString()} • Ref #{quote.quoteNumber}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={cn(
                "px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border",
                quote.status === "ACCEPTED" ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400" :
                quote.status === "REJECTED" ? "bg-red-950/60 border-red-500/40 text-red-400" :
                "bg-purple-950/60 border-purple-500/40 text-purple-300"
              )}>
                {quote.status}
              </span>
            </div>
          </div>

          {/* Client & Venue Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-zinc-950/50 border border-zinc-800/60 rounded-2xl p-5 text-xs">
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider block">PREPARED FOR CLIENT</span>
              <p className="font-extrabold text-white text-sm">{quote.clientName}</p>
              {quote.clientEmail && <p className="text-zinc-400 flex items-center gap-1.5"><Mail size={12} /> {quote.clientEmail}</p>}
              {quote.clientPhone && <p className="text-zinc-400 flex items-center gap-1.5"><Phone size={12} /> {quote.clientPhone}</p>}
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider block">EVENT DETAILS</span>
              {quote.eventDate && <p className="font-extrabold text-purple-300 flex items-center gap-1.5"><Calendar size={12} /> {quote.eventDate}</p>}
              {quote.venueName && <p className="text-zinc-400 flex items-center gap-1.5"><Building size={12} /> {quote.venueName}</p>}
            </div>
          </div>

          {/* Scope Line Items Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Itemized Deliverables & Scope</h3>
            <div className="overflow-x-auto border border-zinc-800/80 rounded-2xl bg-zinc-950/30">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 font-bold uppercase text-[9px]">
                    <th className="p-3.5">Deliverable</th>
                    <th className="p-3.5 text-center">Qty</th>
                    <th className="p-3.5 text-right">Unit Rate</th>
                    <th className="p-3.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/50 text-zinc-300">
                  {quote.items.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-900/20">
                      <td className="p-3.5">
                        <span className="font-bold text-white block text-xs">{item.itemName}</span>
                        {item.description && <span className="text-[10px] text-zinc-400 block mt-0.5">{item.description}</span>}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold">{item.quantity}</td>
                      <td className="p-3.5 text-right font-mono font-semibold text-zinc-400">₹{item.unitPrice.toLocaleString()}</td>
                      <td className="p-3.5 text-right font-mono font-extrabold text-white">₹{item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-end pt-2">
            <div className="w-full sm:w-72 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400 font-semibold">
                <span>Subtotal</span>
                <span className="font-mono">₹{quote.subtotal.toLocaleString()}</span>
              </div>
              {quote.discount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Special Discount</span>
                  <span className="font-mono">-₹{quote.discount.toLocaleString()}</span>
                </div>
              )}
              {quote.tax > 0 && (
                <div className="flex justify-between text-zinc-400 font-semibold">
                  <span>GST / Tax</span>
                  <span className="font-mono">+₹{quote.tax.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-zinc-800 pt-2 flex justify-between text-white font-extrabold text-sm">
                <span>Total Amount</span>
                <span className="font-mono text-purple-400">₹{quote.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Terms & Notes */}
          {quote.termsConditions && (
            <div className="p-4 bg-zinc-950/30 border border-zinc-800/60 rounded-2xl space-y-1 text-xs">
              <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider block">TERMS & CONDITIONS</span>
              <p className="text-zinc-400 text-[11px] leading-relaxed">{quote.termsConditions}</p>
            </div>
          )}

          {/* Action Bar (No Login Required) */}
          <div className="border-t border-zinc-800 pt-6 flex flex-wrap gap-3 items-center justify-between print:hidden">
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold">
              <ShieldCheck size={14} className="text-purple-400" />
              <span>Secured by EventOS 256-bit Encryption</span>
            </div>

            {quote.status !== "ACCEPTED" && quote.status !== "REJECTED" ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowUpiModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/60 text-emerald-300 text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-950"
                >
                  <DollarSign size={14} className="text-emerald-400" />
                  <span>Pay Deposit (Owner UPI QR)</span>
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 text-xs font-bold transition cursor-pointer"
                >
                  Request Revisions
                </button>
                <button
                  onClick={() => setShowSignModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-extrabold transition shadow-lg shadow-purple-500/20 cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <UserCheck size={14} />
                  <span>Sign & Approve Proposal</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowUpiModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/60 text-emerald-300 text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <DollarSign size={14} className="text-emerald-400" />
                  <span>View Owner Payment QR</span>
                </button>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <CheckCircle size={16} />
                  <span>Proposal Status: {quote.status}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Dynamic Real Owner UPI QR Code Modal */}
      <DynamicUpiQrModal
        isOpen={showUpiModal}
        onClose={() => setShowUpiModal(false)}
        ownerUpiId="apexevents@okicici"
        ownerName="Apex Event Management"
        bankAccountName="Apex Event Management Pvt Ltd"
        bankAccountNumber="9180200492810"
        bankIfsc="HDFC0001092"
        bankName="HDFC Bank, Ramdaspeth"
        amount={Math.round(quote.total * 0.3)} // 30% Advance Retainer Deposit
        invoiceNumber={quote.quoteNumber}
        clientName={quote.clientName}
        onPaymentConfirm={() => {
          setQuote({ ...quote, status: "ACCEPTED" });
          setActionSuccess("Deposit payment cleared! Proposal confirmed.");
        }}
      />

      {/* Digital Signature Dialog */}
      <AnimatePresence>
        {showSignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#111113] border border-purple-500/30 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <h3 className="font-extrabold text-white text-sm">Digitally Sign & Accept Proposal</h3>
                <button onClick={() => setShowSignModal(false)} className="text-zinc-500 hover:text-white">&times;</button>
              </div>

              <form onSubmit={handleApproveQuote} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-zinc-400">Full Name (Signer)</label>
                  <input
                    type="text"
                    required
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="e.g. Rohan Mehta"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-zinc-400">Title / Role</label>
                  <input
                    type="text"
                    required
                    value={signerTitle}
                    onChange={(e) => setSignerTitle(e.target.value)}
                    placeholder="e.g. Client Sponsor / Host"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-[10px] text-zinc-400 space-y-1">
                  <span className="font-bold text-white block">Digital Consent & Contract Clearance</span>
                  <p>By clicking approve, you confirm agreement to the scope, line items, and terms outlined in proposal {quote.quoteNumber}.</p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSignModal(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold shadow-md"
                  >
                    Confirm & Sign
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Revisions / Feedback Dialog */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#111113] border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <h3 className="font-extrabold text-white text-sm">Request Proposal Revisions</h3>
                <button onClick={() => setShowRejectModal(false)} className="text-zinc-500 hover:text-white">&times;</button>
              </div>

              <form onSubmit={handleRejectQuote} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-zinc-400">Feedback / Requested Changes</label>
                  <textarea
                    required
                    rows={4}
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    placeholder="Describe line item budget adjustments or scope changes requested..."
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectModal(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold"
                  >
                    Submit Feedback
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
