"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import BookingDetailsWorkspace from "@/components/bookings/BookingDetailsWorkspace";
import QuickActionsFAB from "@/components/finance/QuickActionsFAB";

export default function BookingDetailPage() {
  const params = useParams();
  const bookingId = params.id as string;
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex flex-col relative overflow-hidden transition-all duration-200">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Top Navbar */}
      <nav className="h-16 border-b border-zinc-800 bg-[#111113]/80 backdrop-blur px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/bookings")}
            className="h-8 w-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-zinc-700/50"
            aria-label="Back to bookings"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">Booking Workspace</span>
            <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">Ledger Details</span>
          </div>
        </div>
      </nav>

      {/* Main Workspace content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full z-10">
        <BookingDetailsWorkspace bookingId={bookingId} />
      </main>

      <QuickActionsFAB />
    </div>
  );
}
