"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Shield } from "lucide-react";

interface AuthLoaderProps {
  isOpen: boolean;
  type?: "login" | "register";
}

export function AuthLoader({ isOpen, type = "login" }: AuthLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  const messages = type === "register" 
    ? [
        "Connecting with Google authentication...",
        "Validating secure identity credentials...",
        "Provisioning your database tenant...",
        "Deploying your EventOS workspace...",
        "Configuring owner permissions...",
        "Almost ready to build events...",
      ]
    : [
        "Verifying Google credentials...",
        "Authorizing secure API tokens...",
        "Resolving workspace memberships...",
        "Configuring security session...",
        "Optimizing dashboards...",
      ];

  useEffect(() => {
    if (!isOpen) {
      setMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev < messages.length - 1 ? prev + 1 : prev));
    }, 1800);

    return () => clearInterval(interval);
  }, [isOpen, messages.length]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md cursor-wait select-none"
        >
          {/* Subtle background glow */}
          <div className="absolute h-96 w-96 rounded-full bg-purple-500/10 blur-[100px] pointer-events-none animate-pulse" />

          {/* Loader Card */}
          <motion.div
            initial={{ scale: 0.9, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 10 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="flex flex-col items-center max-w-sm px-8 py-10 text-center rounded-2xl bg-zinc-900/40 border border-white/[0.06] shadow-2xl relative z-10"
          >
            {/* Spinning Glowing Circle */}
            <div className="relative h-20 w-20 flex items-center justify-center">
              {/* Outer Gradient Spinner */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 border-r-pink-500 border-b-cyan-500 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
              />
              
              {/* Inner Pulsing Core */}
              <motion.div
                animate={{ scale: [0.95, 1.05, 0.95] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="h-14 w-14 rounded-full bg-zinc-950/80 border border-white/[0.08] flex items-center justify-center text-purple-400"
              >
                <Sparkles size={20} className="animate-pulse" />
              </motion.div>
            </div>

            {/* Status Messages */}
            <div className="mt-8 space-y-2">
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center justify-center gap-1.5">
                <Shield size={13} className="text-purple-400 animate-pulse" />
                Securing Authentication
              </h3>
              
              {/* Cycling dynamic text with slide-fade transition */}
              <div className="h-6 overflow-hidden flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={messageIndex}
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -8, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="text-[11px] text-zinc-400 font-semibold tracking-wide"
                  >
                    {messages[messageIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
