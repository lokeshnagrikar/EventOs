"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Shield } from "lucide-react";

interface AuthLoaderProps {
  isOpen: boolean;
  type?: "login" | "register";
}

export function AuthLoader({ isOpen, type = "login" }: AuthLoaderProps) {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = type === "register"
    ? [
        { label: "Google Account Connected", desc: "Identity verified successfully" },
        { label: "Creating Workspace & Tenant", desc: "Provisioning isolated database storage" },
        { label: "Initializing EventOS", desc: "Launching your creative studio" },
      ]
    : [
        { label: "Google Account Verified", desc: "Access credentials authenticated" },
        { label: "Loading Workspace Memberships", desc: "Syncing role permissions & access tokens" },
        { label: "Welcome to EventOS", desc: "Preparing your dashboard" },
      ];

  useEffect(() => {
    if (!isOpen) {
      setStepIndex(0);
      return;
    }

    const t1 = setTimeout(() => setStepIndex(1), 1200);
    const t2 = setTimeout(() => setStepIndex(2), 2600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/75 backdrop-blur-xl cursor-wait select-none p-4"
        >
          {/* Ambient Lighting Gradients */}
          <div className="absolute h-80 w-80 rounded-full bg-gradient-to-tr from-purple-600/20 via-pink-500/15 to-blue-500/20 blur-[90px] pointer-events-none" />

          {/* Sleek Floating Card */}
          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="w-full max-w-sm p-6 sm:p-7 rounded-3xl bg-zinc-950/80 border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl relative z-10 flex flex-col items-center text-center space-y-6"
          >
            {/* Google Brand Quad-Color Animated Ring with Logo */}
            <div className="relative h-16 w-16 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full p-[2px] bg-gradient-to-tr from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853]"
              >
                <div className="w-full h-full bg-zinc-950 rounded-full" />
              </motion.div>

              {/* Google SVG Icon inside */}
              <div className="relative z-10 w-11 h-11 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center backdrop-blur-md">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
            </div>

            {/* Header Title */}
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white tracking-tight">
                {type === "register" ? "Setting up EventOS Workspace" : "Signing In With Google"}
              </h3>
              <p className="text-[11px] text-zinc-400">
                Please wait a moment while we authenticate your session.
              </p>
            </div>

            {/* Linear Progress Steps */}
            <div className="w-full space-y-2 text-left pt-1">
              {steps.map((step, idx) => {
                const isDone = idx < stepIndex;
                const isCurrent = idx === stepIndex;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-300 ${
                      isCurrent
                        ? "bg-white/[0.06] border-purple-500/40 shadow-sm shadow-purple-500/10"
                        : isDone
                        ? "bg-emerald-500/10 border-emerald-500/20 opacity-80"
                        : "bg-transparent border-transparent opacity-40"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        isDone
                          ? "bg-emerald-500 text-black"
                          : isCurrent
                          ? "bg-purple-500 text-white animate-pulse"
                          : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {isDone ? "✓" : idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white truncate">{step.label}</div>
                      <div className="text-[10px] text-zinc-400 truncate">{step.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
