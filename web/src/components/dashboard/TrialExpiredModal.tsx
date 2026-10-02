"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Sparkles, ShieldCheck, ArrowRight, LogOut, CheckCircle2 } from "lucide-react";
import { useBillingStore } from "@/store/billingStore";
import { useAuthStore } from "@/store/authStore";

export default function TrialExpiredModal() {
  const router = useRouter();
  const pathname = usePathname();
  const { subscription } = useBillingStore();
  const { logout } = useAuthStore();

  const isExpired = (subscription?.status || "").toUpperCase() === "EXPIRED";
  // Never trap the user if they are on settings page to pay or logout
  const isSafeRoute = pathname.startsWith("/settings") || pathname === "/login" || pathname === "/";

  if (!isExpired || isSafeRoute) {
    return null;
  }

  const handleUpgrade = () => {
    router.push("/settings?tab=billing");
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      window.location.href = "/";
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-red-500/30 bg-[#0d0d12]/95 p-6 sm:p-8 shadow-2xl shadow-red-950/40 text-center"
        >
          {/* Subtle Ambient Glows */}
          <div className="absolute -top-20 -left-20 h-44 w-44 rounded-full bg-red-600/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 h-44 w-44 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />

          {/* 3D-styled Lock Icon */}
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 via-rose-500/10 to-purple-500/20 border border-red-500/30 shadow-inner">
            <Lock className="h-8 w-8 text-red-400" />
          </div>

          {/* Pill Badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 mb-3">
            TRIAL PERIOD CONCLUDED
          </span>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Your 14-Day Free Trial Has Ended
          </h2>

          <p className="mt-2.5 text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
            To protect your ongoing operations and client privacy, workspace write access is paused. 
            Select an active plan to unlock instant, unrestricted access.
          </p>

          {/* Reassurance Feature List */}
          <div className="my-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 text-left space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs text-zinc-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>All past events, guest lists & CRM records are <strong>100% preserved</strong></span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-zinc-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Instant reactivation — continue right where you left off</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-zinc-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Plans starting at just ₹1,999/month with GST invoices</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              onClick={handleUpgrade}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-500 hover:to-red-500 transition shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Choose a Plan & Unlock Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition hover:bg-zinc-900/50 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out or Switch Account</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
