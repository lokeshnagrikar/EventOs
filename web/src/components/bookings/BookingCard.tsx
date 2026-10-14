"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, DollarSign, Clock, ArrowUpRight, Edit3, FileText, CreditCard, Image as ImageIcon, MapPin } from "lucide-react";
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
  PENDING: "border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800/40 text-slate-600 dark:text-zinc-400",
  CONFIRMED: "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  IN_PROGRESS: "border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400",
  COMPLETED: "border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400",
  CANCELLED: "border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
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

  // 2. Dynamic Venue & Planner with clean fallbacks
  const venueName = (booking as any).venueName || (booking as any).location || "Venue TBD";
  const plannerName = (booking as any).plannerName || (booking as any).coordinatorName || "Operations Lead";

  // 3. Status Pill styling
  const statusColor = STATUS_COLORS[booking.status] || "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400";

  // 4. Payment status label
  const paymentStatusLabel = useMemo(() => {
    if (percentPaid === 100) return { label: "Fully Paid", color: "text-emerald-700 dark:text-emerald-400 border-emerald-500/25 bg-emerald-50 dark:bg-emerald-500/10" };
    if (percentPaid > 0) return { label: "Partially Paid", color: "text-amber-700 dark:text-amber-400 border-amber-500/25 bg-amber-50 dark:bg-amber-500/10" };
    return { label: "Unpaid", color: "text-red-700 dark:text-red-400 border-red-500/25 bg-red-50 dark:bg-red-500/10" };
  }, [percentPaid]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.15), ease: [0.215, 0.61, 0.355, 1] }}
      whileHover={{ y: -4, scale: 1.008 }}
      className="group relative rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#141416]/50 hover:border-purple-500/40 p-5 flex flex-col justify-between h-[235px] shadow-sm hover:shadow-xl hover:shadow-purple-500/5 overflow-hidden select-none transition-all cursor-pointer backdrop-blur-md"
      onClick={() => router.push(`/bookings/${booking.id}`)}
    >
      {/* Decorative Glow accent */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-[35px] rounded-full group-hover:scale-110 transition-transform pointer-events-none" />

      {/* Header row */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono bg-slate-100 dark:bg-zinc-850 text-slate-700 dark:text-zinc-300 px-2 py-0.5 rounded font-black border border-slate-200 dark:border-zinc-800">
              {booking.bookingNumber}
            </span>
            {booking.contractUrl && (
              <span
                className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-300 text-[8px] font-bold flex items-center gap-0.5"
                title="Contract PDF Attached"
              >
                <FileText size={9} /> PDF
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn("px-2 py-0.5 border rounded text-[8px] font-black uppercase tracking-wider", paymentStatusLabel.color)}>
              {paymentStatusLabel.label}
            </span>
            <span className={cn("px-2.5 py-0.5 border rounded-full text-[9px] font-extrabold uppercase", statusColor)}>
              {booking.status}
            </span>
          </div>
        </div>

        <h3 className="font-extrabold text-sm text-slate-900 dark:text-zinc-150 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-snug line-clamp-1">
          {eventName}
        </h3>

        <div className="flex items-center justify-between text-[9.5px] text-slate-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <MapPin size={10} className="text-purple-500/70" /> {venueName}
          </span>
          <span className="font-medium">Planner: {plannerName}</span>
        </div>
      </div>

      {/* Financial progress meter */}
      <div className="space-y-1.5 text-[10px]">
        <div className="flex justify-between items-center text-[9px] text-slate-500 dark:text-zinc-400">
          <span className="uppercase font-bold tracking-wider">Payment Ledger</span>
          <span className="font-bold font-mono text-slate-800 dark:text-zinc-300">{percentPaid}% Paid</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${percentPaid}%` }}
          />
        </div>
      </div>

      {/* Footer details */}
      <div className="border-t border-slate-200/90 dark:border-white/[0.08] pt-3 flex items-center justify-between text-[10px] text-slate-600 dark:text-zinc-400">
        <div className="flex items-center gap-1">
          <Calendar size={12} className="text-slate-400 dark:text-zinc-500" />
          <span>{new Date(booking.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="text-right">
          <span className="text-[8px] text-slate-500 dark:text-zinc-400 block uppercase font-bold">Outstanding balance</span>
          <span className="font-black text-rose-600 dark:text-rose-400 font-mono">
            ₹{outstanding.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Hover action overlay shortcuts */}
      <div className="absolute inset-0 bg-white/95 dark:bg-[#0c0c0e]/95 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-center items-center gap-3 p-4 z-10 backdrop-blur-sm">
        <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">Quick Workspace</span>
        <div className="flex gap-2 flex-wrap justify-center">
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/bookings/${booking.id}?tab=edit`); }}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors shadow-sm"
            title="Edit Booking"
          >
            <Edit3 size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/invoices?bookingId=${booking.id}`); }}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors shadow-sm"
            title="Invoices"
          >
            <FileText size={13} />
          </button>
          {booking.contractUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(booking.contractUrl, "_blank");
              }}
              className="p-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-xl border border-purple-200 dark:border-purple-500/30 transition-colors shadow-sm"
              title="Open Contract PDF"
            >
              <FileText size={13} className="text-purple-600 dark:text-purple-400" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/bookings/${booking.id}?tab=payments`); }}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors shadow-sm"
            title="Collect Payment"
          >
            <CreditCard size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/gallery`); }}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors shadow-sm"
            title="Gallery"
          >
            <ImageIcon size={13} />
          </button>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/bookings/${booking.id}`); }}
          className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl text-[9px] uppercase tracking-wider transition-all mt-2 active:scale-95 shadow-md shadow-purple-600/15"
        >
          View Workspace <ArrowUpRight size={11} />
        </button>
      </div>
    </motion.div>
  );
}
