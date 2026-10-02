"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Lock, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBillingStore } from "@/store/billingStore";
import { cn } from "@/lib/utils";

export default function TrialBanner() {
  const pathname = usePathname();
  const { subscription, fetchSubscription } = useBillingStore();

  useEffect(() => {
    if (!subscription) {
      fetchSubscription();
    }
  }, [subscription, fetchSubscription]);

  const trialInfo = useMemo(() => {
    if (!subscription) return null;

    const status = (subscription.status || "").toUpperCase();
    const isFreeTrial = (subscription.plan?.code || "").toLowerCase() === "free_trial";

    if (status === "EXPIRED") {
      return {
        type: "EXPIRED" as const,
        title: "14-Day Free Trial Concluded",
        message: "Your trial period has ended. Record creation is paused, but all your events and client records are 100% safe.",
        ctaText: "Reactivate Workspace",
        badge: "LOCKED",
      };
    }

    if (status === "TRIALING" || (status === "ACTIVE" && isFreeTrial)) {
      if (!subscription.trialEnd) return null;
      const trialEndTime = new Date(subscription.trialEnd).getTime();
      const diffMs = trialEndTime - Date.now();
      const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      // Only show urgency countdown in the final 3 days (Day 11, 12, 13, 14)
      if (daysLeft <= 3) {
        return {
          type: "WARNING" as const,
          daysLeft,
          title: daysLeft <= 1 ? "Trial Expires Tomorrow" : `${daysLeft} Days Left in Free Trial`,
          message: "Upgrade to a paid tier now to ensure uninterrupted timelines, quotations & client portals.",
          ctaText: "Choose Plan",
          badge: daysLeft <= 1 ? "FINAL 24 HOURS" : `${daysLeft} DAYS LEFT`,
        };
      }
    }

    return null;
  }, [subscription]);

  // Don't show on checkout/billing tab if already viewing it, or if trial is active with plenty of time
  if (!trialInfo) return null;

  const isExpired = trialInfo.type === "EXPIRED";

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        role="alert"
        aria-live="polite"
        className={cn(
          "w-full relative z-30 px-3 py-2 sm:px-4 sm:py-2.5 text-xs border-b backdrop-blur-md transition-colors",
          isExpired
            ? "bg-gradient-to-r from-red-950/90 via-zinc-950/95 to-red-950/90 border-red-500/40 text-red-200"
            : "bg-gradient-to-r from-purple-950/80 via-zinc-950/90 to-amber-950/80 border-amber-500/30 text-zinc-200"
        )}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0",
                isExpired
                  ? "bg-red-500/20 text-red-300 border border-red-500/40"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              )}
            >
              {isExpired ? <Lock className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {trialInfo.badge}
            </span>

            <div className="truncate">
              <span className="font-bold text-white mr-1.5">{trialInfo.title}:</span>
              <span className="text-zinc-300 hidden md:inline">{trialInfo.message}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/settings?tab=billing"
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold tracking-tight transition shadow-sm",
                isExpired
                  ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-900/30"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-900/30"
              )}
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>{trialInfo.ctaText}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
