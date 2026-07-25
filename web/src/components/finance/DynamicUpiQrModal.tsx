"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, CheckCircle2, ShieldCheck, Copy, ArrowUpRight, Check, Building, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DynamicUpiQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerUpiId?: string;
  ownerName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankName?: string;
  amount: number;
  invoiceNumber: string;
  clientName?: string;
  onPaymentConfirm?: () => void;
}

export default function DynamicUpiQrModal({
  isOpen,
  onClose,
  ownerUpiId = "rahulevents@okicici",
  ownerName = "Apex Event Management",
  bankAccountName = "Apex Event Management Pvt Ltd",
  bankAccountNumber = "9180200492810",
  bankIfsc = "HDFC0001092",
  bankName = "HDFC Bank, Ramdaspeth",
  amount,
  invoiceNumber,
  clientName = "Client",
  onPaymentConfirm
}: DynamicUpiQrModalProps) {
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Load active Payment Engine config if present
  let feeType = "NO_FEE";
  let feeAmount = 0;
  try {
    const savedConfig = typeof window !== "undefined" ? localStorage.getItem("eventos_payment_engine_config") : null;
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      feeType = parsed.feeType || "NO_FEE";
      if (feeType === "FIXED") feeAmount = parsed.fixedFeeAmount || 0;
      else if (feeType === "PERCENTAGE") feeAmount = Math.round((amount * (parsed.percentageFeeRate || 0)) / 100);
    }
  } catch (e) {}

  const netSettlementAmount = Math.max(0, amount - feeAmount);

  if (!isOpen) return null;

  // Build standard Indian UPI Pay Deep Link String with Net Amount
  const upiString = `upi://pay?pa=${encodeURIComponent(ownerUpiId)}&pn=${encodeURIComponent(ownerName)}&am=${netSettlementAmount}&cu=INR&tn=${encodeURIComponent(`Inv_${invoiceNumber}`)}`;
  
  // Real QR Code API URL for seamless GPay/PhonePe scanning
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiString)}&color=09090b&bgcolor=ffffff`;

  const copyUpi = () => {
    navigator.clipboard.writeText(ownerUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const copyBankDetails = () => {
    const text = `Bank: ${bankName}\nAccount Name: ${bankAccountName}\nAccount No: ${bankAccountNumber}\nIFSC Code: ${bankIfsc}`;
    navigator.clipboard.writeText(text);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl font-sans selection:bg-purple-600/30">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className="relative w-full max-w-md bg-[#09090b] border border-purple-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_25px_80px_rgba(0,0,0,0.9),0_0_40px_rgba(168,85,247,0.15)] text-zinc-100 overflow-hidden space-y-5"
        >
          {/* Top Line Accent */}
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-full bg-zinc-900 border border-zinc-800 transition cursor-pointer"
          >
            &times;
          </button>

          {/* Header */}
          <div className="text-center space-y-1">
            <span className="text-[9.5px] font-black uppercase tracking-widest text-purple-400 bg-purple-950/60 border border-purple-500/30 px-3 py-0.5 rounded-full inline-block">
              {feeType === "NO_FEE" ? "Direct Owner Pay • 0% Platform Fee" : `Configured Payment Engine • ${feeType}`}
            </span>
            <h3 className="text-xl font-black text-white tracking-tight">
              Pay ₹{netSettlementAmount.toLocaleString()} Directly
            </h3>
            <p className="text-xs text-zinc-400 font-semibold">
              Invoice #{invoiceNumber} • Billed to <span className="text-white font-bold">{ownerName}</span>
            </p>
          </div>

          {/* Dynamic Generated UPI QR Code Container */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-4 bg-white rounded-2xl border-4 border-purple-500/30 shadow-xl relative group">
              <img
                src={qrImageUrl}
                alt="Dynamic Owner UPI QR Code"
                className="w-48 h-48 object-contain rounded-lg"
              />
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-zinc-950 border border-zinc-800 text-[9px] font-mono text-purple-300 px-2.5 py-0.5 rounded-full font-bold shadow">
                Scannable on GPay / PhonePe / BHIM
              </div>
            </div>

            {/* Quick Open UPI App Links on Mobile */}
            <a
              href={upiString}
              className="px-4 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-bold hover:bg-purple-900/60 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Tap to Open UPI App</span>
              <ArrowUpRight size={13} />
            </a>
          </div>

          {/* Direct UPI ID & Bank Transfer Option */}
          <div className="space-y-2.5 pt-2 border-t border-zinc-850 text-xs">
            {/* UPI VPA Copy */}
            <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[8.5px] font-black uppercase text-zinc-500 block">Owner UPI ID (VPA)</span>
                <span className="font-mono text-white font-bold text-xs">{ownerUpiId}</span>
              </div>
              <button
                onClick={copyUpi}
                className="px-3 py-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-lg text-zinc-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                {copiedUpi ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                <span>{copiedUpi ? "Copied" : "Copy VPA"}</span>
              </button>
            </div>

            {/* NEFT / RTGS Bank Transfer Details */}
            <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[8.5px] font-black uppercase text-zinc-500 block">NEFT / RTGS Bank Transfer</span>
                <button
                  onClick={copyBankDetails}
                  className="text-[10px] font-bold text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedAccount ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                  <span>{copiedAccount ? "Bank Details Copied" : "Copy Bank Details"}</span>
                </button>
              </div>
              <div className="font-mono text-[10px] text-zinc-300 space-y-0.5">
                <p><span className="text-zinc-500">Account:</span> {bankAccountName}</p>
                <p><span className="text-zinc-500">A/C No:</span> {bankAccountNumber}</p>
                <p><span className="text-zinc-500">IFSC Code:</span> {bankIfsc} ({bankName})</p>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex gap-2">
            <button
              onClick={onClose}
              className="w-1/2 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold rounded-xl text-xs"
            >
              Close
            </button>
            <button
              onClick={() => {
                if (onPaymentConfirm) onPaymentConfirm();
                onClose();
              }}
              className="w-1/2 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 size={14} />
              <span>Mark Paid</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
