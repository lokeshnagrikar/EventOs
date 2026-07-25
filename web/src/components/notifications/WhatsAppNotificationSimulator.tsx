"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Bell,
  CheckCheck,
  Send,
  X,
  Play,
  Pause,
  DollarSign,
  Users,
  FileCheck,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { useToastStore } from "@/lib/toastStore";
import { useAuthStore } from "@/store/authStore";
import { usePathname } from "next/navigation";

const APP_PATHS = ["/dashboard", "/crm", "/events", "/gallery", "/invoices", "/quotes", "/settings", "/ai", "/reports", "/bookings", "/activity", "/chat", "/onboarding"];

export interface NotificationItem {
  id: string;
  type: "whatsapp" | "sms" | "contract" | "payment";
  sender: string;
  message: string;
  time: string;
  unread: boolean;
  status: "delivered" | "read" | "action_required";
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "whatsapp",
    sender: "Ananya Mehta (Client)",
    message: "Confirmed Royal Palace Wedding Booking! Deposit payment of ₹50,000 received via UPI.",
    time: "2 mins ago",
    unread: true,
    status: "read"
  },
  {
    id: "notif-2",
    type: "sms",
    sender: "Event Director (Rahul)",
    message: "Dispatched 12 Technical Sound & Stage Crew to Taj Palace Grounds.",
    time: "8 mins ago",
    unread: true,
    status: "delivered"
  },
  {
    id: "notif-3",
    type: "contract",
    sender: "Apex Scenography Ltd",
    message: "Client signed Vendor Proposal Ref #EOS-894120 via digital signature.",
    time: "15 mins ago",
    unread: false,
    status: "delivered"
  },
  {
    id: "notif-4",
    type: "payment",
    sender: "Automated Bot",
    message: "Sent automated WhatsApp payment reminder to Mr. Kapoor for Final Milestone (₹1,20,000).",
    time: "1 hour ago",
    unread: false,
    status: "read"
  }
];

export function WhatsAppNotificationSimulator() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "whatsapp" | "sms" | "payment">("all");

  const isAppPage = APP_PATHS.some((p) => pathname.startsWith(p));
  if (!isAppPage || !isAuthenticated) {
    return null;
  }

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleTestSendAlert = () => {
    const customAlert: NotificationItem = {
      id: "notif-" + Date.now(),
      type: "whatsapp",
      sender: "Test Client",
      message: "Client clicked 'Accept Proposal & Pay Deposit' link on WhatsApp!",
      time: "Just now",
      unread: true,
      status: "read"
    };

    setNotifications((prev) => [customAlert, ...prev]);
    addToast("📲 Instant WhatsApp Booking Alert Triggered!", "success");
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    addToast("Marked all alerts as read", "info");
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true;
    return n.type === activeTab;
  });

  return (
    <div className="fixed bottom-6 right-24 z-50">
      {/* Floating Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-14 w-14 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-white flex items-center justify-center shadow-2xl shadow-emerald-950/60 border border-emerald-400/40 cursor-pointer group"
      >
        <MessageSquare size={24} className="text-white group-hover:rotate-12 transition-transform" />

        {/* Badge Counter */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white font-black text-[10px] flex items-center justify-center border-2 border-zinc-950 animate-pulse">
            {unreadCount}
          </span>
        )}
      </motion.button>

      {/* Drawer Dialog */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-18 right-0 w-80 sm:w-96 bg-[#09090b] border border-emerald-500/30 rounded-3xl p-4 shadow-2xl shadow-emerald-950/60 backdrop-blur-2xl text-white space-y-3"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                  <MessageSquare size={14} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Live Booking Dispatch</h4>
                  <p className="text-[9px] text-emerald-400 font-bold">WhatsApp & SMS Integration</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsSimulating(!isSimulating)}
                  className={`p-1.5 rounded-lg border text-[10px] flex items-center gap-1 font-bold ${
                    isSimulating
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400"
                  }`}
                  title={isSimulating ? "Pause live simulation" : "Resume live simulation"}
                >
                  {isSimulating ? <Pause size={10} /> : <Play size={10} />}
                  <span>{isSimulating ? "Live" : "Paused"}</span>
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1.5 text-zinc-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 text-[10px] font-bold">
              {(["all", "whatsapp", "sms", "payment"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1 rounded-lg transition-all capitalize text-center ${
                    activeTab === tab
                      ? "bg-zinc-800 text-emerald-400 font-extrabold shadow-sm border border-emerald-500/20"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Notification Stream */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredNotifications.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs italic">No alerts in this category.</div>
              ) : (
                filteredNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-2.5 rounded-2xl border text-xs transition-all space-y-1 ${
                      notif.unread
                        ? "bg-emerald-950/20 border-emerald-500/30 text-white"
                        : "bg-zinc-900/60 border-zinc-800/80 text-zinc-300"
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        {notif.type === "whatsapp" && <MessageSquare size={10} />}
                        {notif.type === "payment" && <DollarSign size={10} />}
                        {notif.sender}
                      </span>
                      <span className="text-zinc-500 font-mono">{notif.time}</span>
                    </div>

                    <p className="text-[11px] text-zinc-200 leading-snug">{notif.message}</p>

                    <div className="flex justify-between items-center pt-1 text-[9px] text-zinc-500">
                      <span className="flex items-center gap-1 text-emerald-400/80">
                        <CheckCheck size={10} />
                        Delivered to Client
                      </span>
                      <button
                        type="button"
                        onClick={handleTestSendAlert}
                        className="text-purple-400 hover:underline font-bold cursor-pointer"
                      >
                        Send Auto-Reply 📲
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-[10px]">
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-zinc-400 hover:text-white underline cursor-pointer"
              >
                Mark all read
              </button>
              <button
                type="button"
                onClick={handleTestSendAlert}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1 shadow-md cursor-pointer"
              >
                <Send size={10} />
                <span>Test WhatsApp Dispatch</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
