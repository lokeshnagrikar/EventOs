"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCw, CheckCircle2, Zap } from "lucide-react";
import { offlineStore } from "@/lib/offlineStore";
import { useToastStore } from "@/lib/toastStore";

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const { addToast } = useToastStore();

  useEffect(() => {
    // Initial status
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      setPendingCount(offlineStore.getQueue().length);
    }

    const handleOnline = async () => {
      setIsOnline(true);
      addToast("🌐 Internet Connection Restored! Starting auto-sync...", "info");
      handleManualSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      addToast("⚡ Offline Mode Active. Local venue check-ins will be queued.", "warning");
    };

    const handleQueueChange = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      setPendingCount(customEvent.detail ?? offlineStore.getQueue().length);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("offline-queue-changed", handleQueueChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("offline-queue-changed", handleQueueChange);
    };
  }, [addToast]);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      let apiClient;
      try {
        apiClient = require("@/lib/api-client").apiClient;
      } catch (e) {}

      const { syncedCount } = await offlineStore.flush(apiClient);
      if (syncedCount > 0) {
        addToast(`✅ Successfully synced ${syncedCount} offline guest check-ins to server!`, "success");
      }
      setPendingCount(offlineStore.getQueue().length);
    } catch (e) {
      console.error("Failed to sync offline queue:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline && pendingCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-[1000] bg-gradient-to-r from-purple-950/90 via-zinc-900/95 to-purple-950/90 border-b border-purple-500/30 backdrop-blur-xl px-4 py-2 flex items-center justify-between shadow-2xl text-xs text-zinc-200 select-none"
      >
        <div className="flex items-center gap-2.5 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2">
            {!isOnline ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold text-[10px] font-mono">
                <WifiOff size={12} className="animate-pulse" /> OFFLINE VENUE MODE
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-[10px] font-mono">
                <Zap size={12} /> ONLINE
              </span>
            )}
            <span className="hidden sm:inline text-zinc-300 font-medium text-[11px]">
              {!isOnline
                ? "Changes are saved locally on device. Will auto-sync when internet reconnects."
                : `${pendingCount} offline action(s) ready to sync.`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <span className="bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
                {pendingCount} Pending Queue
              </span>
            )}

            {isOnline && pendingCount > 0 && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
              >
                <RefreshCw size={11} className={isSyncing ? "animate-spin" : ""} />
                {isSyncing ? "Syncing..." : "Sync Now"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
