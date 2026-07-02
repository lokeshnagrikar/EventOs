"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, DollarSign, Clock, ArrowUpRight, Edit3, FileText, CreditCard, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export interface Booking {
  id: string;
  eventId: string;
  bookingNumber: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  contractUrl?: string;
  createdAt: string;
}

interface BookingCardProps {
  booking: Booking;
  eventName: string;
  index: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "border-zinc-805 bg-zinc-800/20 text-zinc-400",
  CONFIRMED: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
  IN_PROGRESS: "border-amber-500/20 bg-amber-500/5 text-amber-400",
  COMPLETED: "border-blue-500/20 bg-blue-500/5 text-blue-400",
  CANCELLED: "border-red-500/20 bg-red-500/5 text-red-400"
};

export default function BookingCard({ booking, eventName, index }: BookingCardProps) {
  const router = useRouter();

  // 1. Paid Ratio Math
  const percentPaid = useMemo(() => {
    if (booking.totalAmount <= 0) return 0;
    return Math.min(100, Math.round((booking.paidAmount / booking.totalAmount) * 100));
  }, [booking.totalAmount, booking.paidAmount]);

  const outstanding = useMemo(() => {
    return Math.max(0, booking.totalAmount - booking.paidAmount);
  }, [booking.totalAmount, booking.paidAmount]);

  // 2. Mock Venue & Planner (since Booking schema doesn't have it, but we preserve existing functionality)
  const venueName = "Convention Hall A";
  const plannerName = "Rahul Sharma";

  // 3. Status Pill styling
  const statusColor = STATUS_COLORS[booking.status] || "border-zinc-800 text-zinc-400";

  // 4. Payment status label
  const paymentStatusLabel = useMemo(() => {
    if (percentPaid === 100) return { label: "Fully Paid", color: "text-emerald-400 border-emerald-500/10 bg-emerald-500/5" };
    if (percentPaid > 0) return { label: "Partially Paid", color: "text-amber-400 border-amber-500/10 bg-amber-500/5" };
    return { label: "Unpaid", color: "text-red-400 border-red-500/10 bg-red-500/5" };
  }, [percentPaid]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.15), ease: [0.215, 0.61, 0.355, 1] }}
      whileHover={{ y: -4, scale: 1.008 }}
      className="group relative rounded-2xl border border-zinc-800 bg-[#141416]/40 hover:border-zinc-700/80 p-5 flex flex-col justify-between h-[235px] hover:shadow-[0_0_30px_rgba(139,92,246,0.03)] overflow-hidden select-none transition-colors cursor-pointer"
      onClick={() => router.push(`/bookings/${booking.id}`)}
    >
      {/* Decorative Glow accent */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[35px] rounded-full group-hover:scale-110 transition-transform" />

      {/* Header row */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-mono bg-zinc-850 text-zinc-400 px-2 py-0.5 rounded font-black">
            {booking.bookingNumber}
          </span>
          <div className="flex items-center gap-1.5">
            <span className={cn("px-2 py-0.5 border rounded text-[8px] font-black uppercase tracking-wider", paymentStatusLabel.color)}>
              {paymentStatusLabel.label}
            </span>
            <span className={cn("px-2.5 py-0.5 border rounded-full text-[9px] font-extrabold uppercase", statusColor)}>
              {booking.status}
            </span>
          </div>
        </div>

        <h3 className="font-extrabold text-sm text-zinc-150 group-hover:text-purple-400 transition-colors leading-snug line-clamp-1">
          {eventName}
        </h3>

        <div className="flex items-center justify-between text-[9.5px] text-zinc-500">
          <span className="flex items-center gap-1">
            <MapPin size={10} className="text-zinc-650" /> {venueName}
          </span>
          <span>Planner: {plannerName}</span>
        </div>
      </div>

      {/* Financial progress meter */}
      <div className="space-y-1.5 text-[10px]">
        <div className="flex justify-between items-center text-[9px] text-zinc-550">
          <span className="uppercase font-bold tracking-wider">Payment Ledger Progress</span>
          <span className="font-bold font-mono text-zinc-350">{percentPaid}% Paid</span>
        </div>
        <div className="h-1.5 w-full bg-zinc-950 border border-zinc-850 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${percentPaid}%` }}
          />
        </div>
      </div>

      {/* Footer details */}
      <div className="border-t border-zinc-850/60 pt-3 flex items-center justify-between text-[10px] text-zinc-400">
        <div className="flex items-center gap-1">
          <Calendar size={12} className="text-zinc-500" />
          <span>{new Date(booking.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="text-right">
          <span className="text-[8px] text-zinc-550 block uppercase font-bold">Outstanding balance</span>
          <span className="font-black text-rose-400 font-mono">
            ₹{outstanding.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Hover action overlay shortcuts */}
      <div className="absolute inset-0 bg-[#0c0c0e]/95 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-center items-center gap-3 p-4 z-10">
        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Quick Workspace</span>
        <div className="flex gap-2 flex-wrap justify-center">
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/bookings/${booking.id}?tab=edit`); }}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition-colors"
            title="Edit Booking"
          >
            <Edit3 size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/invoices?bookingId=${booking.id}`); }}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition-colors"
            title="Invoices"
          >
            <FileText size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/bookings/${booking.id}?tab=payments`); }}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition-colors"
            title="Collect Payment"
          >
            <CreditCard size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/gallery`); }}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition-colors"
            title="Gallery"
          >
            <ImageIcon size={13} />
          </button>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/bookings/${booking.id}`); }}
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-[9px] uppercase tracking-wider transition-all mt-2 active:scale-95"
        >
          View Workspace <ArrowUpRight size={11} />
        </button>
      </div>
    </motion.div>
  );
}

// ── Mock MapPin Icon helper to avoid imports from lucide-react if needed (already imported)
import { MapPin } from "lucide-react";
