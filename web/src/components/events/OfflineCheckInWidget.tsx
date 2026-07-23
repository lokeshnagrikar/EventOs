"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserCheck, UserX, Star, Zap, WifiOff, CheckCircle2, ShieldCheck, RefreshCw } from "lucide-react";
import { offlineStore } from "@/lib/offlineStore";
import { useToastStore } from "@/lib/toastStore";
import { cn } from "@/lib/utils";

export interface Guest {
  id: string;
  name: string;
  table: string;
  isVip: boolean;
  status: "CHECKED_IN" | "NOT_CHECKED_IN";
  ticketCode: string;
  checkInTime?: string;
}

const INITIAL_GUESTS: Guest[] = [
  { id: "g1", name: "Alexander Wright", table: "Table 01 (Royal)", isVip: true, status: "CHECKED_IN", ticketCode: "TCK-9901", checkInTime: "10:15 AM" },
  { id: "g2", name: "Sophia Martinez", table: "Table 01 (Royal)", isVip: true, status: "NOT_CHECKED_IN", ticketCode: "TCK-9902" },
  { id: "g3", name: "Liam O'Connor", table: "Table 04 (Gold)", isVip: false, status: "CHECKED_IN", ticketCode: "TCK-9903", checkInTime: "10:42 AM" },
  { id: "g4", name: "Emma Watson", table: "Table 02 (Diamond)", isVip: true, status: "NOT_CHECKED_IN", ticketCode: "TCK-9904" },
  { id: "g5", name: "Noah Miller", table: "Table 05 (Silver)", isVip: false, status: "NOT_CHECKED_IN", ticketCode: "TCK-9905" },
  { id: "g6", name: "Olivia Davis", table: "Table 03 (Gold)", isVip: false, status: "CHECKED_IN", ticketCode: "TCK-9906", checkInTime: "11:05 AM" },
];

export default function OfflineCheckInWidget() {
  const [guests, setGuests] = useState<Guest[]>(INITIAL_GUESTS);
  const [search, setSearch] = useState("");
  const [vipOnly, setVipOnly] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const { addToast } = useToastStore();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
    }
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const checkedInCount = guests.filter((g) => g.status === "CHECKED_IN").length;
  const totalCount = guests.length;
  const checkedInPercent = Math.round((checkedInCount / totalCount) * 100);

  const toggleCheckIn = (guest: Guest) => {
    const nextStatus = guest.status === "CHECKED_IN" ? "NOT_CHECKED_IN" : "CHECKED_IN";
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Update local UI immediately
    setGuests(
      guests.map((g) =>
        g.id === guest.id
          ? { ...g, status: nextStatus, checkInTime: nextStatus === "CHECKED_IN" ? nowTime : undefined }
          : g
      )
    );

    // Queue action for offline sync
    offlineStore.enqueue("CHECKIN_GUEST", {
      guestId: guest.id,
      guestName: guest.name,
      status: nextStatus,
      checkInTime: nowTime,
    });

    if (!isOnline) {
      addToast(`⚡ Offline Mode: ${guest.name} check-in saved locally on device.`, "warning");
    } else {
      addToast(`✅ ${guest.name} marked as ${nextStatus === "CHECKED_IN" ? "CHECKED IN" : "PENDING"}.`, "success");
    }
  };

  const filteredGuests = guests.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.ticketCode.toLowerCase().includes(search.toLowerCase()) ||
      g.table.toLowerCase().includes(search.toLowerCase());
    const matchesVip = !vipOnly || g.isVip;
    return matchesSearch && matchesVip;
  });

  return (
    <div className="p-5 border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl rounded-2xl space-y-5 shadow-2xl">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div>
          <span className="text-[9px] text-purple-400 font-mono font-extrabold uppercase tracking-widest block">
            Venue Operations Check-in Desk
          </span>
          <h3 className="text-base font-extrabold text-white mt-0.5 flex items-center gap-2">
            Day-of-Event Guest Roster
            {!isOnline ? (
              <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                <WifiOff size={10} /> Offline Queue
              </span>
            ) : (
              <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                <Zap size={10} /> Auto-Sync Active
              </span>
            )}
          </h3>
        </div>

        {/* Live Check-in Progress Bar */}
        <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.06] px-3.5 py-2 rounded-xl">
          <div className="text-right">
            <span className="text-xs font-black text-white block">{checkedInCount} / {totalCount} Checked In</span>
            <span className="text-[9px] text-zinc-400 font-mono block">{checkedInPercent}% Attendance</span>
          </div>
          <div className="h-8 w-8 rounded-full border-2 border-purple-500/40 flex items-center justify-center text-[10px] font-black text-purple-400 font-mono bg-purple-500/10">
            {checkedInPercent}%
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search guest name, table, or ticket code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/[0.02] border border-white/[0.06] text-white rounded-xl text-xs outline-none focus:border-purple-500 font-medium"
          />
        </div>

        <button
          onClick={() => setVipOnly(!vipOnly)}
          className={cn(
            "px-3.5 py-2 border rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 justify-center",
            vipOnly
              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
              : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white"
          )}
        >
          <Star size={13} className={vipOnly ? "fill-amber-400 text-amber-400" : ""} />
          VIP Filter
        </button>
      </div>

      {/* Guest Roster Table */}
      <div className="border border-white/[0.06] bg-white/[0.01] rounded-xl overflow-hidden">
        <table className="w-full text-xs font-medium text-zinc-300">
          <thead>
            <tr className="text-left border-b border-white/[0.06] text-[9px] text-zinc-500 font-black uppercase tracking-wider bg-white/[0.02] font-mono">
              <th className="p-3">Guest Name</th>
              <th className="p-3">Table Seating</th>
              <th className="p-3">Ticket ID</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Check-in Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredGuests.map((guest) => (
              <tr key={guest.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-xs">{guest.name}</span>
                    {guest.isVip && (
                      <span className="px-1.5 py-0.2 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] font-black uppercase rounded font-mono">
                        VIP
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-zinc-400 text-[11px]">{guest.table}</td>
                <td className="p-3 font-mono text-[10px] text-zinc-500">{guest.ticketCode}</td>
                <td className="p-3">
                  {guest.status === "CHECKED_IN" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                      <CheckCircle2 size={10} /> Arrived ({guest.checkInTime || "Now"})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-white/[0.04] text-zinc-500 border border-white/[0.06] font-mono">
                      Pending
                    </span>
                  )}
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => toggleCheckIn(guest)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition cursor-pointer border flex items-center gap-1 ml-auto",
                      guest.status === "CHECKED_IN"
                        ? "bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-white"
                        : "bg-purple-600 border-purple-500 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20"
                    )}
                  >
                    {guest.status === "CHECKED_IN" ? (
                      <>
                        <UserX size={12} /> Undo Arrived
                      </>
                    ) : (
                      <>
                        <UserCheck size={12} /> Confirm Check-in
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
