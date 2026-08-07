"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/lib/toastStore";
import { Download, FileText, CheckCircle2, X } from "lucide-react";

const RESOURCES = [
  { id: "wedding_checklist", name: "Wedding Planning Checklist", type: "PDF Guide", size: "1.4 MB", desc: "A comprehensive 12-month checklist for coordinators managing elite weddings." },
  { id: "budget_calculator", name: "Operations Budget Calculator", type: "Excel / Sheets", size: "3.2 MB", desc: "Track line items cost margins, agency commission fees, and client payments schedules." },
  { id: "vendor_checklist", name: "Elite Vendor Audit Checklist", type: "PDF Guide", size: "850 KB", desc: "Questions to ask catering, florist, AV staging and sound companies before signing contracts." },
  { id: "client_questionnaire", name: "New Client Onboarding Questionnaire", type: "DocX Template", size: "450 KB", desc: "Gather style preferences, guest counts estimates, and budget ranges in your first consultation." },
  { id: "event_timeline", name: "Run-of-Show Timeline Template", type: "PDF/Excel", size: "2.1 MB", desc: "Sample event coordinator master timetable mapped minute-by-minute." },
  { id: "pricing_template", name: "Pricing & Quotation Matrix", type: "Sheets Template", size: "1.8 MB", desc: "Pre-formulated sheet to calculate labor rates, materials costs, and markup percentages." },
  { id: "invoice_template", name: "Milestone E-Invoicing Template", type: "HTML/PDF", size: "1.1 MB", desc: "Professional milestone invoice structure with clear bank details and terms outlines." },
  { id: "proposal_template", name: "Interactive Sangeet Proposal Pitch", type: "Keynote/PPT", size: "5.4 MB", desc: "Pitch deck presentation styling designed to close high-ticket event production deals." },
];

export default function ResourcesPage() {
  const addToast = useToastStore((state) => state.addToast);
  const [activeResource, setActiveResource] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    setDownloadSuccess(true);
    const targetResource = RESOURCES.find((r) => r.id === activeResource)?.name || "Resource";
    addToast(`Successfully dispatched download link for ${targetResource}! 📩`, "success");
    setTimeout(() => {
      setActiveResource(null);
      setEmail("");
      setDownloadSuccess(false);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-600 selection:text-white">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 max-w-7xl mx-auto px-6 space-y-12 w-full">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Free Lead Magnets
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none">
            Download SaaS Resource Pack.
          </h1>
          <p className="text-base text-zinc-400 font-semibold">
            Industry checklists, billing calculators, client questionnaires, and presentation decks engineered to optimize your event agency.
          </p>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto select-none">
          {RESOURCES.map((r, idx) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex"
            >
              <SpotlightCard className="p-6 border border-zinc-850 bg-zinc-950/20 rounded-2xl flex flex-col justify-between items-stretch w-full relative">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded font-black uppercase font-mono tracking-wider">
                      {r.type}
                    </span>
                    <span className="text-[9px] text-zinc-555 font-bold font-mono">{r.size}</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-black uppercase text-zinc-200">{r.name}</h3>
                    <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold min-h-[50px]">{r.desc}</p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveResource(r.id)}
                  className="w-full py-2.5 bg-zinc-900 border border-zinc-850 hover:border-zinc-700 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-1.5 mt-6 cursor-pointer text-zinc-300"
                >
                  <Download size={11} /> Download File
                </button>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>

        {/* Newsletter Signup Panel */}
        <div className="max-w-3xl mx-auto p-8 border border-zinc-850 bg-zinc-950/20 backdrop-blur rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-[9px] text-purple-450 uppercase font-black tracking-widest block font-mono">Product changelogs</span>
            <h4 className="text-xs font-black uppercase text-zinc-200">Join our Operations Newsletter</h4>
            <p className="text-[10px] text-zinc-500 font-semibold max-w-sm">Get periodic updates on multi-tenant deployment guidelines, e-invoicing updates, and product guides.</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addToast("Thank you for joining the EventOS updates list! ✉", "success");
            }}
            className="flex w-full md:w-auto gap-2 text-xs"
          >
            <input
              required
              type="email"
              placeholder="name@agency.com"
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 focus:border-[#8B5CF6] focus:bg-zinc-950 text-white rounded-xl focus:outline-none placeholder-zinc-600 text-[11px]"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-purple-650 hover:bg-purple-600 text-white rounded-xl font-bold transition cursor-pointer"
            >
              Subscribe
            </button>
          </form>
        </div>
      </main>

      {/* Download Lead Capture Modal Overlay */}
      <AnimatePresence>
        {activeResource && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-hidden select-none font-sans text-xs">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveResource(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-zinc-950 border border-zinc-850 p-6 rounded-2xl shadow-2xl backdrop-blur-md space-y-6"
            >
              {/* Close button */}
              <button
                onClick={() => setActiveResource(null)}
                className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
              >
                <X size={15} />
              </button>

              <div className="text-center space-y-2">
                <div className="h-10 w-10 mx-auto rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <FileText size={18} />
                </div>
                <h3 className="text-xs font-black uppercase text-zinc-200">Verify Email to Download</h3>
                <p className="text-[10px] text-zinc-500 leading-relaxed max-w-[260px] mx-auto font-semibold">
                  We'll email the requested template file **({RESOURCES.find(r => r.id === activeResource)?.name})** along with invoice calculator spreadsheets.
                </p>
              </div>

              <AnimatePresence mode="wait">
                {!downloadSuccess ? (
                  <motion.form
                    key="download-form"
                    onSubmit={handleDownloadTrigger}
                    className="space-y-4"
                  >
                    <input
                      required
                      type="email"
                      placeholder="name@agency.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-[#8B5CF6] focus:bg-zinc-950 rounded-xl text-white focus:outline-none text-[11px] font-semibold"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-purple-650 hover:bg-purple-600 text-white rounded-xl font-extrabold uppercase tracking-widest transition cursor-pointer"
                    >
                      Verify & Start Download
                    </button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="download-success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-2 space-y-2"
                  >
                    <div className="h-7 w-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                      <CheckCircle2 size={16} />
                    </div>
                    <span className="text-[10px] text-emerald-450 font-black uppercase tracking-wider block">Download Started!</span>
                    <p className="text-[9.5px] text-zinc-500 font-semibold leading-relaxed">
                      Check your email inbox or updates folder for the attachments.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
