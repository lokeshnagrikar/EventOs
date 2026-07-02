"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  Search,
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  ArrowRight,
  CheckCircle,
  ExternalLink,
  BookOpen,
  Video,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "How do I confirm my event quotation?",
    a: "Navigate to the 'Proposal Vault' tab, review the active quotation, and click 'Approve & Lock Proposal'. Once signed digitally, our system will generate the deposit statements."
  },
  {
    q: "What payment options are supported?",
    a: "We support direct UPI payments, bank transfers, credit/debit cards, and cash. Scan the QR code in Invoices to generate quick mobile UPI triggers."
  },
  {
    q: "Can I edit the guest count after booking?",
    a: "Yes, modifications to guest counts can be logged up to 14 days before the event by raising a support ticket below or calling coordinator Sneha Rao."
  },
  {
    q: "How do I access and download my photos?",
    a: "Once completed, albums show up in the 'Media Assets' tab. You can download individual high-res images or compile a bulk ZIP download."
  }
];

const GUIDES = [
  { title: "Reviewing and Signing Contracts", duration: "2 min", category: "Documentation" },
  { title: "Logging Deposit References", duration: "1 min", category: "Billing" },
  { title: "Collaborating on Media Assets", duration: "3 min", category: "Gallery" }
];

export default function PortalSupportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  
  // Ticket Form state
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("BILLING");
  const [ticketDesc, setTicketDesc] = useState("");
  const [ticketSuccess, setTicketSuccess] = useState(false);

  // Video guide selector
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const filteredFaqs = FAQS.filter(
    (f) =>
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSuccess(true);
    setTimeout(() => {
      setTicketSuccess(false);
      setTicketSubject("");
      setTicketDesc("");
    }, 3000);
  };

  return (
    <div className="space-y-8 animate-slide-in text-zinc-300 select-none">
      
      {/* Header */}
      <header className="border-b border-zinc-800 pb-6">
        <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
          Support & Help Desk <HelpCircle className="text-purple-400" size={20} />
        </h2>
        <p className="text-xs text-zinc-450 mt-1">
          Access your coordinator, resolve FAQs, review guidebooks, and submit assistance tickets.
        </p>
      </header>

      {/* Direct Planner Contact Bento Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Designated Coordinator */}
        <div className="p-5 rounded-2xl border border-zinc-800 bg-[#111113]/55 flex flex-col justify-between h-[150px]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-zinc-550 uppercase tracking-wider">Designated Coordinator</span>
            <div className="h-7 w-7 rounded-full bg-purple-550/10 flex items-center justify-center text-purple-400 border border-purple-900/20">
              <MessageSquare size={13} />
            </div>
          </div>
          <div>
            <p className="font-extrabold text-xs text-zinc-200">Sneha Rao</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Design lead & Wedding planner</p>
          </div>
          <a
            href="https://wa.me/919999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] font-bold text-purple-400 hover:text-purple-300 group hover:underline"
          >
            Chat on WhatsApp <ExternalLink size={10} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>

        {/* fast Email Help */}
        <div className="p-5 rounded-2xl border border-zinc-800 bg-[#111113]/55 flex flex-col justify-between h-[150px]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-zinc-555 uppercase tracking-wider">Fast Email Help</span>
            <div className="h-7 w-7 rounded-full bg-emerald-555/10 flex items-center justify-center text-emerald-450 border border-emerald-900/20">
              <Mail size={13} />
            </div>
          </div>
          <div>
            <p className="font-extrabold text-xs text-zinc-200">planner@eventos.io</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Average response: 2 hours</p>
          </div>
          <a
            href="mailto:planner@eventos.io"
            className="flex items-center gap-1 text-[10px] font-bold text-emerald-450 hover:text-emerald-450 group hover:underline"
          >
            Send Email Inquiry <ExternalLink size={10} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>

        {/* Schedule sync meeting */}
        <div className="p-5 rounded-2xl border border-zinc-800 bg-[#111113]/55 flex flex-col justify-between h-[150px]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-zinc-550 uppercase tracking-wider">Calendly Sync</span>
            <div className="h-7 w-7 rounded-full bg-purple-550/10 flex items-center justify-center text-purple-400 border border-purple-900/20">
              <Calendar size={13} />
            </div>
          </div>
          <div>
            <p className="font-extrabold text-xs text-zinc-200">1-on-1 video call</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Book brief check-ins</p>
          </div>
          <button className="flex items-center gap-1 text-[10px] font-bold text-purple-400 hover:text-purple-300 group hover:underline text-left">
            Launch Scheduler <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

      </div>

      {/* Guide Books & video tutorials */}
      <div className="p-5 border border-zinc-800 bg-[#111113]/40 rounded-2xl space-y-4">
        <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
          <BookOpen size={14} className="text-purple-400" /> Guidebooks & Video Tutorials
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {GUIDES.map((g, idx) => (
            <div
              key={idx}
              onClick={() => setActiveVideo(g.title)}
              className="p-3.5 border border-zinc-850 bg-zinc-950/20 rounded-xl flex items-center justify-between gap-3 cursor-pointer hover:border-purple-650/45 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Video size={14} className="text-zinc-500" />
                <div>
                  <span className="font-bold text-[10.5px] text-zinc-200 block">{g.title}</span>
                  <span className="text-[8.5px] text-zinc-550 block">{g.category} &bull; {g.duration}</span>
                </div>
              </div>
              <ArrowRight size={12} className="text-zinc-600" />
            </div>
          ))}
        </div>
      </div>

      {/* FAQ & Ticket Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* FAQs */}
        <div className="space-y-4">
          <div>
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400">Frequently Asked Questions</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Quick resolutions to common billing and media gallery topics.</p>
          </div>

          <div className="relative w-full mb-3">
            <Search size={13} className="absolute left-3 top-2.5 text-zinc-550" />
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 bg-zinc-950/20 border border-zinc-850 rounded-xl text-xs text-white placeholder-zinc-550 focus:outline-none"
            />
          </div>

          <div className="space-y-2.5">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="border border-zinc-800 bg-[#111113]/30 rounded-xl overflow-hidden transition-colors">
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-3.5 text-left font-bold text-zinc-200 flex justify-between items-center text-xs"
                  >
                    <span>{faq.q}</span>
                    <span className="text-zinc-500">{isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-3.5 pb-3.5 text-[10.5px] text-zinc-450 leading-relaxed font-medium"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Raise Ticket Form */}
        <div className="p-5 border border-zinc-800 bg-[#111113]/40 rounded-2xl space-y-4 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/10 via-transparent to-transparent pointer-events-none" />

          <div>
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400">Submit Assistance Ticket</h3>
            <p className="text-[10px] text-zinc-550 mt-0.5">Submit technical assistance queries directly to our operations office.</p>
          </div>

          <AnimatePresence>
            {ticketSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 border border-emerald-500/20 bg-emerald-950/20 text-emerald-450 rounded-xl flex items-start gap-2.5"
              >
                <CheckCircle size={15} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-xs">Ticket Registered Successfully</p>
                  <p className="text-[9.5px] opacity-90 mt-0.5 font-semibold">We will assign a technician and notify you via WhatsApp shortly.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleTicketSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-500 uppercase font-black">Category</label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300"
                >
                  <option value="BILLING">Billing & Payment</option>
                  <option value="DESIGN">Design & Decoration</option>
                  <option value="MEDIA">Photos & Galleries</option>
                  <option value="TECHNICAL">App Portal Issue</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-500 uppercase font-black">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Invoice discrepancy"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-xl text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-500 uppercase font-black">Description</label>
              <textarea
                required
                rows={4}
                placeholder="Detail your request..."
                value={ticketDesc}
                onChange={(e) => setTicketDesc(e.target.value)}
                className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-xl text-white focus:outline-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-850">
              <button type="submit" className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md">
                Submit Ticket
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Video Guide Playback Modal */}
      <AnimatePresence>
        {activeVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-[#111113] border border-zinc-850 rounded-2xl p-6 relative">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3 mb-4">
                <span className="text-xs font-black text-white uppercase tracking-wider">Video Guide: {activeVideo}</span>
                <button onClick={() => setActiveVideo(null)} className="text-zinc-500 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="aspect-video bg-zinc-950 border border-zinc-850 rounded-xl flex flex-col items-center justify-center gap-2 text-zinc-650">
                <Video size={36} />
                <span className="text-[10px] font-bold">Simulated Video Tutorial Playback</span>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
