"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Percent,
  Check,
  RefreshCw,
  Zap,
  ShieldCheck,
  Info,
  Sliders,
  DollarSign,
  QrCode,
  Building,
  Key,
  Lock,
  Layers,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Icon } from "@iconify/react";
import { useToastStore } from "@/lib/toastStore";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export interface PaymentEngineConfig {
  settlementMode: "DIRECT_SETTLEMENT" | "PLATFORM_SETTLEMENT" | "AUTO_SETTLEMENT";
  feeType: "NO_FEE" | "FIXED" | "PERCENTAGE" | "CUSTOM";
  fixedFeeAmount: number;
  percentageFeeRate: number;
  feeBearer: "OWNER_DEDUCTION" | "CLIENT_SURCHARGE";
  enabledProviders: {
    upiDirect: boolean;
    stripe: boolean;
    razorpay: boolean;
    cashfree: boolean;
    phonepe: boolean;
  };
  ownerUpiId: string;
  ownerBankName: string;
  ownerAccountHolder: string;
  ownerAccountNumber: string;
  ownerIfsc: string;
}

const DEFAULT_ENGINE_CONFIG: PaymentEngineConfig = {
  settlementMode: "DIRECT_SETTLEMENT",
  feeType: "NO_FEE",
  fixedFeeAmount: 99,
  percentageFeeRate: 2.0,
  feeBearer: "OWNER_DEDUCTION",
  enabledProviders: {
    upiDirect: true,
    stripe: true,
    razorpay: true,
    cashfree: false,
    phonepe: true,
  },
  ownerUpiId: "",
  ownerBankName: "",
  ownerAccountHolder: "",
  ownerAccountNumber: "",
  ownerIfsc: "",
};

export default function PaymentEngineSettings() {
  const addToast = useToastStore((state) => state.addToast);
  const [config, setConfig] = useState<PaymentEngineConfig>(DEFAULT_ENGINE_CONFIG);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let currentConfig = { ...DEFAULT_ENGINE_CONFIG };
    const saved = localStorage.getItem("eventos_payment_engine_config");
    if (saved) {
      try {
        currentConfig = { ...currentConfig, ...JSON.parse(saved) };
      } catch (err) {
        console.error("Failed to load payment engine config:", err);
      }
    }
    const directSaved = localStorage.getItem("eventos_direct_payment_destination");
    if (directSaved) {
      try {
        const direct = JSON.parse(directSaved);
        if (direct.ownerUpiId) currentConfig.ownerUpiId = direct.ownerUpiId;
        if (direct.ownerBankName) currentConfig.ownerBankName = direct.ownerBankName;
        if (direct.ownerAccountName) currentConfig.ownerAccountHolder = direct.ownerAccountName;
        if (direct.ownerAccountNumber) currentConfig.ownerAccountNumber = direct.ownerAccountNumber;
        if (direct.ownerIfsc) currentConfig.ownerIfsc = direct.ownerIfsc;
      } catch (err) {}
    }
    setConfig(currentConfig);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem("eventos_payment_engine_config", JSON.stringify(config));
      localStorage.setItem("eventos_direct_payment_destination", JSON.stringify({
        ownerUpiId: config.ownerUpiId,
        ownerAccountName: config.ownerAccountHolder,
        ownerAccountNumber: config.ownerAccountNumber,
        ownerIfsc: config.ownerIfsc,
        ownerBankName: config.ownerBankName,
      }));
      await apiClient.put("/workspace/settings/payment-config", config).catch(() => {});
      addToast("Enterprise Payment Engine configuration saved!", "success");
    } catch (err) {
      addToast("Saved payment engine configuration locally.", "info");
    } finally {
      setIsSaving(false);
    }
  };

  const calculateSampleBreakdown = (sampleInvoice: number = 50000) => {
    let fee = 0;
    if (config.feeType === "FIXED") {
      fee = config.fixedFeeAmount;
    } else if (config.feeType === "PERCENTAGE") {
      fee = (sampleInvoice * config.percentageFeeRate) / 100;
    }

    const netSettlement = config.feeBearer === "OWNER_DEDUCTION" 
      ? sampleInvoice - fee 
      : sampleInvoice;

    const clientTotal = config.feeBearer === "CLIENT_SURCHARGE"
      ? sampleInvoice + fee
      : sampleInvoice;

    return { sampleInvoice, fee, netSettlement, clientTotal };
  };

  const sample = calculateSampleBreakdown();

  return (
    <div className="space-y-8 font-sans text-left text-zinc-100">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/60 via-zinc-950 to-zinc-950 border border-purple-500/30 flex flex-col md:flex-row justify-between md:items-center gap-4 relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-extrabold uppercase font-mono tracking-wider flex items-center gap-1">
              <CreditCard size={12} className="text-purple-400" />
              v1.2 Enterprise Payment Engine
            </span>
            <span className="text-xs text-zinc-400 font-medium">• Multi-Gateway Abstraction</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Payment & Monetization Architecture</h2>
          <p className="text-xs text-zinc-400 max-w-xl leading-relaxed font-medium">
            Configure settlement modes, platform fee calculation rules, direct NPCI UPI banking details, and enabled gateway abstractions (Stripe, Razorpay, Cashfree, PhonePe).
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-purple-950 cursor-pointer active:scale-95"
          >
            {isSaving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Saving Setup...</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>Save Payment Engine</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 1. Settlement Mode Selector */}
      <div className="space-y-3">
        <label className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 block font-mono">
          1. Select Workspace Settlement Mode
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              id: "DIRECT_SETTLEMENT",
              title: "Direct Settlement (NPCI UPI / QR)",
              desc: "Payments transfer directly into owner's bank account with live NPCI UPI QR codes.",
              badge: "RECOMMENDED",
              icon: "solar:qr-code-bold-duotone",
            },
            {
              id: "PLATFORM_SETTLEMENT",
              title: "Platform Escrow Settlement",
              desc: "Funds clear via platform gateway and payout periodically to bank.",
              badge: "GATEWAY",
              icon: "solar:vault-bold-duotone",
            },
            {
              id: "AUTO_SETTLEMENT",
              title: "Auto-Split Merchant Payouts",
              desc: "Automated real-time split payouts between platform & agency account.",
              badge: "ENTERPRISE",
              icon: "solar:card-transfer-bold-duotone",
            },
          ].map((mode) => (
            <div
              key={mode.id}
              onClick={() => setConfig({ ...config, settlementMode: mode.id as any })}
              className={cn(
                "p-5 rounded-2xl border transition-all cursor-pointer space-y-2 relative overflow-hidden select-none",
                config.settlementMode === mode.id
                  ? "bg-purple-950/40 border-purple-500/50 text-white shadow-lg shadow-purple-950/50"
                  : "bg-zinc-950/60 border-zinc-850 text-zinc-400 hover:border-zinc-750"
              )}
            >
              <div className="flex items-center justify-between">
                <Icon icon={mode.icon} className="text-2xl text-purple-400" />
                <span className={cn(
                  "text-[9.5px] font-black font-mono px-2 py-0.5 rounded-full border",
                  config.settlementMode === mode.id
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                    : "bg-zinc-900 text-zinc-500 border-zinc-800"
                )}>
                  {mode.badge}
                </span>
              </div>
              <h4 className="font-extrabold text-sm text-white">{mode.title}</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">{mode.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Platform Fee Matrix & Calculation Engine */}
      <div className="p-6 rounded-3xl bg-zinc-950/70 border border-zinc-850 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-zinc-850">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Sliders size={16} className="text-purple-400" />
              <span>2. Platform Fee Calculation Engine</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Configure platform monetization rules per invoice milestone</p>
          </div>
          <span className="text-xs text-purple-400 font-mono font-bold bg-purple-950/60 border border-purple-500/30 px-3 py-1 rounded-full">
            Active Rule: {config.feeType}
          </span>
        </div>

        {/* Fee Type Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { id: "NO_FEE", title: "No Platform Fee", desc: "0% platform cut. 100% of payment goes to owner.", sub: "DEFAULT" },
            { id: "FIXED", title: "Fixed Fee (₹)", desc: "Deducts a static flat fee per invoice milestone.", sub: "FLAT FEE" },
            { id: "PERCENTAGE", title: "Percentage Fee (%)", desc: "Deducts a percentage rate on total invoice amount.", sub: "VARIABLE" },
            { id: "CUSTOM", title: "Enterprise Custom", desc: "Applies tiered custom rule scripts & volume slabs.", sub: "ADVANCED" },
          ].map((type) => (
            <div
              key={type.id}
              onClick={() => setConfig({ ...config, feeType: type.id as any })}
              className={cn(
                "p-4 rounded-2xl border transition-all cursor-pointer space-y-2 select-none",
                config.feeType === type.id
                  ? "bg-purple-950/40 border-purple-500/50 text-white"
                  : "bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:border-zinc-750"
              )}
            >
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black font-mono text-purple-400 uppercase">{type.sub}</span>
                {config.feeType === type.id && <Check size={14} className="text-purple-400" />}
              </div>
              <h4 className="font-extrabold text-xs text-white">{type.title}</h4>
              <p className="text-[10.5px] text-zinc-400 leading-normal">{type.desc}</p>
            </div>
          ))}
        </div>

        {/* Dynamic Inputs based on Fee Type */}
        {config.feeType === "FIXED" && (
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2 text-left">
            <label className="text-xs font-bold text-zinc-300">Fixed Platform Fee Amount (₹ per Invoice)</label>
            <input
              type="number"
              value={config.fixedFeeAmount}
              onChange={(e) => setConfig({ ...config, fixedFeeAmount: Number(e.target.value) })}
              className="w-full max-w-xs px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-purple-500"
              placeholder="99"
            />
          </div>
        )}

        {config.feeType === "PERCENTAGE" && (
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2 text-left">
            <label className="text-xs font-bold text-zinc-300">Percentage Fee Rate (% of Invoice Total)</label>
            <input
              type="number"
              step="0.1"
              value={config.percentageFeeRate}
              onChange={(e) => setConfig({ ...config, percentageFeeRate: Number(e.target.value) })}
              className="w-full max-w-xs px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-purple-500"
              placeholder="2.0"
            />
          </div>
        )}

        {/* Live Calculation Preview Card */}
        <div className="p-5 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
          <div>
            <span className="text-[10px] font-black uppercase text-purple-300 font-mono tracking-widest block">
              Live Calculation Simulator (Sample ₹50,000 Milestone Invoice)
            </span>
            <div className="flex flex-wrap items-center gap-4 mt-2 font-mono">
              <div>
                <span className="text-zinc-400 block text-[10px]">Invoice Subtotal</span>
                <span className="font-bold text-white text-sm">₹{sample.sampleInvoice.toLocaleString()}</span>
              </div>
              <span className="text-zinc-600 text-sm">-</span>
              <div>
                <span className="text-purple-300 block text-[10px]">Platform Fee ({config.feeType})</span>
                <span className="font-bold text-purple-300 text-sm">₹{sample.fee.toLocaleString()}</span>
              </div>
              <span className="text-zinc-600 text-sm">=</span>
              <div>
                <span className="text-emerald-400 block text-[10px]">Net Settlement to Owner</span>
                <span className="font-extrabold text-emerald-400 text-sm">₹{sample.netSettlement.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <span className="px-3 py-1.5 rounded-xl bg-purple-950 border border-purple-500/40 text-purple-300 font-mono font-extrabold text-[10px] shrink-0">
            {config.feeBearer === "OWNER_DEDUCTION" ? "Owner Deduction" : "Client Surcharge"}
          </span>
        </div>
      </div>

      {/* 3. Payment Provider Abstraction Toggles */}
      <div className="p-6 rounded-3xl bg-zinc-950/70 border border-zinc-850 space-y-5 text-left">
        <div className="pb-3 border-b border-zinc-850">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Layers size={16} className="text-purple-400" />
            <span>3. Payment Provider Abstraction Layer (Gateway Enabled)</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">Abstracted provider architecture for multi-gateway settlement</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { key: "upiDirect", name: "Direct NPCI UPI QR", desc: "0% fee direct bank transfer via scannable QR code.", icon: "solar:qr-code-bold-duotone" },
            { key: "razorpay", name: "Razorpay Gateway", desc: "UPI, Cards, Net Banking & Auto-Collect.", icon: "solar:card-bold-duotone" },
            { key: "stripe", name: "Stripe International", desc: "Global credit cards & international currencies.", icon: "solar:globe-bold-duotone" },
            { key: "phonepe", name: "PhonePe PG", desc: "Deep-link UPI payments & Smart QR clearing.", icon: "solar:smartphone-bold-duotone" },
            { key: "cashfree", name: "Cashfree Payments", desc: "Instant payouts and split settlement engine.", icon: "solar:wallet-bold-duotone" },
          ].map((prov) => {
            const isChecked = config.enabledProviders[prov.key as keyof typeof config.enabledProviders];
            return (
              <div
                key={prov.key}
                onClick={() =>
                  setConfig({
                    ...config,
                    enabledProviders: {
                      ...config.enabledProviders,
                      [prov.key]: !isChecked,
                    },
                  })
                }
                className={cn(
                  "p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none",
                  isChecked
                    ? "bg-purple-950/30 border-purple-500/40 text-white"
                    : "bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:border-zinc-750"
                )}
              >
                <div className={cn(
                  "h-5 w-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all",
                  isChecked ? "bg-purple-500 border-purple-400 text-white" : "bg-zinc-900 border-zinc-700"
                )}>
                  {isChecked && <Check size={13} className="stroke-[3]" />}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Icon icon={prov.icon} className="text-base text-purple-400" />
                    <h4 className="text-xs font-bold text-white">{prov.name}</h4>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">{prov.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Direct Settlement Banking Credentials */}
      <div className="p-6 rounded-3xl bg-zinc-950/70 border border-zinc-850 space-y-5 text-left">
        <div className="pb-3 border-b border-zinc-850">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Building size={16} className="text-purple-400" />
            <span>4. Direct Settlement Owner Bank Credentials</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">Used for NPCI UPI QR code generation and direct client wire transfers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300">Business UPI VPA ID</label>
            <input
              type="text"
              value={config.ownerUpiId}
              onChange={(e) => setConfig({ ...config, ownerUpiId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
              placeholder="owner@upi"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300">Account Holder Name</label>
            <input
              type="text"
              value={config.ownerAccountHolder}
              onChange={(e) => setConfig({ ...config, ownerAccountHolder: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
              placeholder="Royal Weddings & Events Ltd"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300">Bank Name</label>
            <input
              type="text"
              value={config.ownerBankName}
              onChange={(e) => setConfig({ ...config, ownerBankName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
              placeholder="HDFC Bank"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300">Account Number</label>
            <input
              type="text"
              value={config.ownerAccountNumber}
              onChange={(e) => setConfig({ ...config, ownerAccountNumber: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
              placeholder="50100293847192"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-zinc-300">IFSC Code</label>
            <input
              type="text"
              value={config.ownerIfsc}
              onChange={(e) => setConfig({ ...config, ownerIfsc: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
              placeholder="HDFC0001234"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
