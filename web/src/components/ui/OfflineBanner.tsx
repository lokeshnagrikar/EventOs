"use client";

import React, { useEffect, useState } from "react";
import { WifiOff, Wifi, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showBackOnline, setShowBackOnline] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(window.navigator.onLine);

      const handleOnline = () => {
        setIsOnline(true);
        setShowBackOnline(true);
        const timer = setTimeout(() => {
          setShowBackOnline(false);
        }, 3000);
        return () => clearTimeout(timer);
      };

      const handleOffline = () => {
        setIsOnline(false);
        setShowBackOnline(false);
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none w-full max-w-sm px-4">
      <AnimatePresence mode="wait">
        {!isOnline && (
          <motion.div
            key="offline-banner"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto w-full flex items-center justify-between gap-3 px-4 py-3 bg-red-950/80 border border-red-500/35 text-red-200 rounded-2xl shadow-xl shadow-black/40 backdrop-blur-xl"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="shrink-0 h-7 w-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <WifiOff size={14} className="animate-pulse" />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-[11px] font-bold leading-tight">Connection Lost</p>
                <p className="text-[9px] text-red-400/80 font-medium leading-normal mt-0.5">
                  You are offline. EventOS will re-sync when online.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOnline(true)} // Allow mock dismiss
              className="shrink-0 text-red-400/60 hover:text-red-300 transition-colors p-1 hover:bg-white/5 rounded-lg"
              aria-label="Dismiss banner"
            >
              <X size={13} />
            </button>
          </motion.div>
        )}

        {isOnline && showBackOnline && (
          <motion.div
            key="online-banner"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto w-full flex items-center justify-between gap-3 px-4 py-3 bg-emerald-950/80 border border-emerald-500/35 text-emerald-250 rounded-2xl shadow-xl shadow-black/40 backdrop-blur-xl"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="shrink-0 h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Wifi size={14} />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-[11px] font-bold leading-tight">Back Online</p>
                <p className="text-[9px] text-emerald-400/80 font-medium leading-normal mt-0.5">
                  Network restored. Workspace connections re-established.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowBackOnline(false)}
              className="shrink-0 text-emerald-400/60 hover:text-emerald-300 transition-colors p-1 hover:bg-white/5 rounded-lg"
              aria-label="Dismiss banner"
            >
              <X size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
