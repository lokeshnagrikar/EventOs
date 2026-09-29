"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserCheck, UserX, Star, Zap, WifiOff, CheckCircle2, Plus, Trash2, Calendar, Users, X } from "lucide-react";
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

interface OfflineCheckInWidgetProps {
  events?: any[];
}

export default function OfflineCheckInWidget({ events = [] }: OfflineCheckInWidgetProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [guests, setGuests] = useState<Guest[]>([]);
  const [search, setSearch] = useState("");
  const [vipOnly, setVipOnly] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New Guest Form State
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestTable, setNewGuestTable] = useState("");
  const [newGuestTicket, setNewGuestTicket] = useState("");
  const [newGuestIsVip, setNewGuestIsVip] = useState(false);

  const { addToast } = useToastStore();

  // Initialize selected event
  useEffect(() => {
    if (events && events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    } else if (!selectedEventId) {
      setSelectedEventId("default-event");
    }
  }, [events, selectedEventId]);

  // Load guests for selected event from localStorage
  useEffect(() => {
    if (!selectedEventId) return;
    const storageKey = `eventos_roster_${selectedEventId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setGuests(JSON.parse(saved));
        return;
      } catch {
        // Fallback to empty
      }
    }
    // Default to clean empty list if no saved roster
    setGuests([]);
  }, [selectedEventId]);

  // Save guests to localStorage on change
  const saveGuests = (updated: Guest[]) => {
    setGuests(updated);
    if (selectedEventId) {
      localStorage.setItem(`eventos_roster_${selectedEventId}`, JSON.stringify(updated));
    }
  };

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
  const checkedInPercent = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

  const toggleCheckIn = (guest: Guest) => {
    const nextStatus = guest.status === "CHECKED_IN" ? "NOT_CHECKED_IN" : "CHECKED_IN";
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const updated = guests.map((g) =>
      g.id === guest.id
        ? { ...g, status: nextStatus, checkInTime: nextStatus === "CHECKED_IN" ? nowTime : undefined }
        : g
    );
    saveGuests(updated);

    // Queue action for offline sync
    offlineStore.enqueue("CHECKIN_GUEST", {
      eventId: selectedEventId,
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

  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim()) {
      addToast("Please enter guest name", "error");
      return;
    }

    const randomTicket = "TCK-" + Math.floor(1000 + Math.random() * 9000);
    const newGuest: Guest = {
      id: "g_" + Date.now(),
      name: newGuestName.trim(),
      table: newGuestTable.trim() || "General Access",
      ticketCode: newGuestTicket.trim().toUpperCase() || randomTicket,
      isVip: newGuestIsVip,
      status: "NOT_CHECKED_IN",
    };

    saveGuests([...guests, newGuest]);
    addToast(`Added ${newGuest.name} to guest roster`, "success");
    setNewGuestName("");
    setNewGuestTable("");
    setNewGuestTicket("");
    setNewGuestIsVip(false);
    setShowAddModal(false);
  };

  const handleDeleteGuest = (id: string, name: string) => {
    const updated = guests.filter((g) => g.id !== id);
    saveGuests(updated);
    addToast(`Removed ${name} from roster`, "info");
  };

  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const matchesSearch =
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.ticketCode.toLowerCase().includes(search.toLowerCase()) ||
        g.table.toLowerCase().includes(search.toLowerCase());
      const matchesVip = !vipOnly || g.isVip;
      return matchesSearch && matchesVip;
    });
  }, [guests, search, vipOnly]);

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="p-5 border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl rounded-2xl space-y-5 shadow-2xl">
      {/* Widget Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
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
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Real-time gate check-in & barcode desk for attendees and VIPs with local offline storage support.
          </p>
        </div>

        {/* Event Selector & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {events.length > 0 && (
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] px-3 py-1.5 rounded-xl">
              <Calendar size={13} className="text-purple-400" />
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer pr-2"
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id} className="bg-zinc-900 text-white">
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Add Guest Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-purple-600/20 cursor-pointer"
          >
            <Plus size={13} /> Add Guest
          </button>

          {/* Live Check-in Progress Bar */}
          <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.06] px-3.5 py-1.5 rounded-xl">
            <div className="text-right">
              <span className="text-xs font-black text-white block">
                {checkedInCount} / {totalCount} Checked In
              </span>
              <span className="text-[9px] text-zinc-400 font-mono block">
                {checkedInPercent}% Attendance
              </span>
            </div>
            <div className="h-8 w-8 rounded-full border-2 border-purple-500/40 flex items-center justify-center text-[10px] font-black text-purple-400 font-mono bg-purple-500/10">
              {checkedInPercent}%
            </div>
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
        {filteredGuests.length === 0 ? (
          <div className="py-14 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mx-auto flex items-center justify-center">
              <Users size={22} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white">No guests on this roster</h4>
              <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                {search || vipOnly
                  ? "No guests match your active search filters."
                  : `Add attendees for ${selectedEvent?.name || "this event"} to enable barcode check-in at the venue desk.`}
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/20"
            >
              <Plus size={14} /> Add First Guest
            </button>
          </div>
        ) : (
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
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleCheckIn(guest)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition cursor-pointer border flex items-center gap-1",
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

                      <button
                        onClick={() => handleDeleteGuest(guest.id, guest.name)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                        title="Remove guest"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Guest Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h4 className="text-sm font-black text-white">Add Attendee / Guest</h4>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-zinc-500 hover:text-white transition"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddGuest} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 block mb-1.5">
                    Guest Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={newGuestName}
                    onChange={(e) => setNewGuestName(e.target.value)}
                    className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 block mb-1.5">
                      Table / Seating
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Table 04 (Gold)"
                      value={newGuestTable}
                      onChange={(e) => setNewGuestTable(e.target.value)}
                      className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 block mb-1.5">
                      Ticket ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Auto-generated if empty"
                      value={newGuestTicket}
                      onChange={(e) => setNewGuestTicket(e.target.value)}
                      className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isVipCheck"
                    checked={newGuestIsVip}
                    onChange={(e) => setNewGuestIsVip(e.target.checked)}
                    className="rounded border-zinc-700 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="isVipCheck" className="text-xs text-zinc-300 font-medium cursor-pointer">
                    Mark as VIP Attendee
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold rounded-xl transition shadow-lg shadow-purple-600/20 cursor-pointer"
                  >
                    Add to Roster
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
