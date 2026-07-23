"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Copy, TrendingUp, DollarSign, Users, Award, ExternalLink, CheckCircle2, Plus } from "lucide-react";
import { useToastStore } from "@/lib/toastStore";
import { cn } from "@/lib/utils";

interface Affiliate {
  id: string;
  name: string;
  role: "VENDOR" | "PAST_CLIENT" | "PLANNER";
  refLink: string;
  clicks: number;
  conversions: number;
  earnings: string;
  status: "ACTIVE" | "PAYOUT_PENDING";
}

const INITIAL_AFFILIATES: Affiliate[] = [
  { id: "aff-1", name: "Luxe Decor Studio", role: "VENDOR", refLink: "https://eventos.co/r/luxe-decor-99", clicks: 420, conversions: 12, earnings: "$1,200", status: "ACTIVE" },
  { id: "aff-2", name: "Rachel & Marcus (Wedding 2025)", role: "PAST_CLIENT", refLink: "https://eventos.co/r/rachel-marcus", clicks: 180, conversions: 5, earnings: "$500", status: "PAYOUT_PENDING" },
  { id: "aff-3", name: "Starlight Sound & AV", role: "VENDOR", refLink: "https://eventos.co/r/starlight-av", clicks: 310, conversions: 8, earnings: "$800", status: "ACTIVE" },
];

export default function ReferralAffiliateEngine() {
  const { addToast } = useToastStore();
  const [affiliates, setAffiliates] = useState<Affiliate[]>(INITIAL_AFFILIATES);
  const [newPartnerName, setNewPartnerName] = useState("");
  const [partnerRole, setPartnerRole] = useState<"VENDOR" | "PAST_CLIENT" | "PLANNER">("VENDOR");

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    addToast("📋 Unique referral tracking link copied to clipboard!", "success");
  };

  const handleCreatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName) {
      addToast("Please enter partner name.", "error");
      return;
    }
    const slug = newPartnerName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const newAff: Affiliate = {
      id: "aff-" + Date.now(),
      name: newPartnerName,
      role: partnerRole,
      refLink: `https://eventos.co/r/${slug}`,
      clicks: 0,
      conversions: 0,
      earnings: "$0",
      status: "ACTIVE",
    };
    setAffiliates([newAff, ...affiliates]);
    setNewPartnerName("");
    addToast(`🚀 Referral affiliate partner created for ${newPartnerName}!`, "success");
  };

  return (
    <div className="space-y-6 select-none text-zinc-300 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/[0.06] pb-4 gap-3">
        <div>
          <span className="text-[9px] text-purple-400 font-mono font-extrabold uppercase tracking-widest block">
            Viral Acquisition Engine
          </span>
          <h2 className="text-lg font-extrabold text-white mt-0.5 flex items-center gap-2">
            <Share2 size={18} className="text-pink-400" /> Viral Referral & Affiliate Engine
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Reward past clients and vendors for referring new high-ticket event bookings.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 border border-white/[0.06] bg-white/[0.02] rounded-2xl">
          <span className="text-[10px] text-zinc-500 font-mono uppercase font-black block">Total Referral Clicks</span>
          <span className="text-lg font-black text-white mt-1 block">1,420 Clicks</span>
        </div>
        <div className="p-4 border border-white/[0.06] bg-white/[0.02] rounded-2xl">
          <span className="text-[10px] text-zinc-500 font-mono uppercase font-black block">Converted Bookings</span>
          <span className="text-lg font-black text-emerald-400 mt-1 block">25 Closed Events</span>
        </div>
        <div className="p-4 border border-white/[0.06] bg-white/[0.02] rounded-2xl">
          <span className="text-[10px] text-zinc-500 font-mono uppercase font-black block">Referred Revenue</span>
          <span className="text-lg font-black text-purple-400 mt-1 block">$42,500 USD</span>
        </div>
        <div className="p-4 border border-white/[0.06] bg-white/[0.02] rounded-2xl">
          <span className="text-[10px] text-zinc-500 font-mono uppercase font-black block">Affiliate Payouts</span>
          <span className="text-lg font-black text-amber-400 mt-1 block">$2,500 Paid</span>
        </div>
      </div>

      {/* Create Partner Form */}
      <div className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl space-y-4 shadow-xl">
        <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">Generate New Referral Partner Link</span>

        <form onSubmit={handleCreatePartner} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Partner Name (e.g. Royal Photo Studio)"
            value={newPartnerName}
            onChange={(e) => setNewPartnerName(e.target.value)}
            className="flex-1 px-3.5 py-2 bg-white/[0.02] border border-white/[0.06] text-white rounded-xl text-xs outline-none focus:border-purple-500 font-bold"
          />

          <select
            value={partnerRole}
            onChange={(e) => setPartnerRole(e.target.value as any)}
            className="px-3.5 py-2 bg-white/[0.02] border border-white/[0.06] text-white rounded-xl text-xs outline-none focus:border-purple-500 font-bold"
          >
            <option value="VENDOR">Vendor Partner ($100 Payout)</option>
            <option value="PAST_CLIENT">Past Client ($100 Payout)</option>
            <option value="PLANNER">Co-Planner (5% RevShare)</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 justify-center"
          >
            <Plus size={14} /> Create Tracking Link
          </button>
        </form>
      </div>

      {/* Affiliates Ledger Table */}
      <div className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl space-y-4 shadow-xl">
        <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">Active Referral Partners & Earnings</span>

        <div className="border border-white/[0.06] rounded-xl overflow-hidden">
          <table className="w-full text-xs font-medium text-zinc-300 font-mono">
            <thead>
              <tr className="text-left border-b border-white/[0.06] text-[9px] text-zinc-500 font-black uppercase tracking-wider bg-white/[0.02]">
                <th className="p-3">Partner Name</th>
                <th className="p-3">Role Type</th>
                <th className="p-3">Tracking Link</th>
                <th className="p-3">Clicks</th>
                <th className="p-3">Conversions</th>
                <th className="p-3">Total Earnings</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map((aff) => (
                <tr key={aff.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                  <td className="p-3 font-bold text-white font-sans">{aff.name}</td>
                  <td className="p-3 text-purple-400">{aff.role}</td>
                  <td className="p-3 text-zinc-400 text-[10px]">{aff.refLink}</td>
                  <td className="p-3 text-white font-bold">{aff.clicks}</td>
                  <td className="p-3 text-emerald-400 font-bold">{aff.conversions}</td>
                  <td className="p-3 text-amber-400 font-bold">{aff.earnings}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleCopyLink(aff.refLink)}
                      className="px-2.5 py-1 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ml-auto"
                    >
                      <Copy size={11} /> Copy Link
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
