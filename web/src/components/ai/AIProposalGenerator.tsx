"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, FileText, CheckCircle2, Download, ExternalLink, Send, DollarSign, Clock, ShieldCheck, Copy } from "lucide-react";
import { useToastStore } from "@/lib/toastStore";
import { cn } from "@/lib/utils";

interface LineItem {
  category: string;
  description: string;
  amount: number;
}

export default function AIProposalGenerator() {
  const { addToast } = useToastStore();
  const [briefInput, setBriefInput] = useState(
    "Destination Wedding for 300 guests at Oberoi Udaivilas, Udaipur. Theme: Royal Heritage Gold & Ivory. Requires full AV, drone photography, live Sufi band, floral mandap, and multi-cuisine catering."
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposalGenerated, setProposalGenerated] = useState(true);

  // Generated Proposal State
  const [proposalTitle, setProposalTitle] = useState("Royal Heritage Udaipur Destination Wedding Proposal");
  const [eventVision, setEventVision] = useState(
    "An opulent 3-day royal celebration blending timeless Rajasthani heritage with modern luxury. Featuring handcrafted floral mandaps, immersive Sufi acoustics, and regal hospitality."
  );
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { category: "Venue Decor & Floral Architecture", description: "Custom royal mandap, crystal chandeliers, floral aisle", amount: 18500 },
    { category: "Audio/Visual & Stage Lighting", description: "3D projection mapping, concert sound, drone multi-cam", amount: 9200 },
    { category: "Live Entertainment & Performances", description: "Sufi ensemble, DJ setup, traditional folk dancers", amount: 6500 },
    { category: "Catering & Hospitality Services", description: "Multi-cuisine 5-course dining for 300 guests", amount: 24000 },
  ]);

  const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);

  const handleGenerateProposal = () => {
    if (!briefInput) {
      addToast("Please enter lead brief requirements.", "error");
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setProposalGenerated(true);
      addToast("✨ AI successfully synthesized customized proposal & pricing breakdown!", "success");
    }, 1500);
  };

  const handleCopyProposalUrl = () => {
    navigator.clipboard.writeText(`https://eventos.co/proposals/prop-${Date.now()}`);
    addToast("🔗 Client Web Proposal link copied to clipboard!", "success");
  };

  const handleSendToClient = () => {
    addToast("📩 Interactive proposal sent directly to client email & WhatsApp!", "success");
  };

  return (
    <div className="space-y-6 select-none text-zinc-300 font-sans">
      {/* Top Title Bar */}
      <div className="flex justify-between items-start border-b border-white/[0.06] pb-4">
        <div>
          <span className="text-[9px] text-purple-400 font-mono font-extrabold uppercase tracking-widest block">
            AI Sales Acceleration
          </span>
          <h2 className="text-lg font-extrabold text-white mt-0.5 flex items-center gap-2">
            <Sparkles size={18} className="text-purple-400" /> AI Automated Proposal & Quote Generator
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Turn client lead notes into high-converting branded proposals and line-item estimates in 30 seconds.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Brief Input & Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl space-y-4 shadow-xl">
            <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">Lead Brief & Client Notes</span>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Client Requirements Prompt</label>
              <textarea
                rows={6}
                value={briefInput}
                onChange={(e) => setBriefInput(e.target.value)}
                placeholder="Paste client email, lead notes, or event specifications..."
                className="w-full p-3.5 bg-white/[0.02] border border-white/[0.06] text-white rounded-xl text-xs outline-none focus:border-purple-500 font-sans"
              />
            </div>

            <button
              onClick={handleGenerateProposal}
              disabled={isGenerating}
              className="w-full py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles size={14} className={isGenerating ? "animate-spin" : ""} />
              {isGenerating ? "Synthesizing AI Proposal..." : "Generate AI Proposal in 30s"}
            </button>
          </div>
        </div>

        {/* Right Column: Generated Interactive Web Proposal */}
        <div className="lg:col-span-7 space-y-4">
          {proposalGenerated && (
            <div className="p-6 border border-purple-500/20 bg-[#09090b] rounded-2xl space-y-5 shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-start border-b border-white/[0.06] pb-4">
                <div>
                  <span className="text-[9px] text-purple-400 font-mono font-extrabold uppercase">Generated Proposal Document</span>
                  <h3 className="text-base font-extrabold text-white mt-0.5">{proposalTitle}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyProposalUrl}
                    className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    <Copy size={12} /> Share Link
                  </button>
                  <button
                    onClick={handleSendToClient}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    <Send size={12} /> Send to Client
                  </button>
                </div>
              </div>

              {/* Event Vision Statement */}
              <div className="p-4 bg-purple-950/20 border border-purple-500/20 rounded-xl space-y-1.5">
                <span className="text-[10px] text-purple-300 font-mono font-bold uppercase flex items-center gap-1">
                  <Sparkles size={11} /> AI Vision Concept
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed italic font-serif">"{eventVision}"</p>
              </div>

              {/* Pricing Breakdown Table */}
              <div className="space-y-2">
                <span className="text-[10px] text-zinc-400 font-mono uppercase font-black">Line-Item Cost Estimate</span>
                <div className="border border-white/[0.06] rounded-xl overflow-hidden text-xs">
                  <table className="w-full font-mono">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-[9px] text-zinc-500 font-black uppercase bg-white/[0.02] text-left">
                        <th className="p-3">Category</th>
                        <th className="p-3">Scope Description</th>
                        <th className="p-3 text-right">Investment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item, index) => (
                        <tr key={index} className="border-b border-white/[0.04] last:border-0">
                          <td className="p-3 font-bold text-white font-sans">{item.category}</td>
                          <td className="p-3 text-zinc-400 font-sans text-[11px]">{item.description}</td>
                          <td className="p-3 text-right text-emerald-400 font-bold">${item.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Investment Summary */}
              <div className="flex justify-between items-center pt-3 border-t border-white/[0.06]">
                <div className="text-[11px] text-zinc-400 font-mono">
                  <span>Deposit Required: 25% (${(totalAmount * 0.25).toLocaleString()})</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">Total Proposal Investment</span>
                  <span className="text-xl font-black text-white font-mono">${totalAmount.toLocaleString()} USD</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
