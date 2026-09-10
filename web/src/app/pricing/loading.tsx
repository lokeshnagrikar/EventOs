"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EventOsLogo } from "@/components/ui/EventOsLogo";
import { Sparkles, ShieldCheck, Tag, Check } from "lucide-react";

interface PricingLoaderProps {
  onComplete?: () => void;
  durationMs?: number;
}

export function PricingLoader({ onComplete, durationMs = 2000 }: PricingLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const start = performance.now();
    let frameId: number;

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / durationMs, 1);
      // S-curve progression: smooth start, steady middle, gentle finish
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const current = Math.min(Math.round(ease * 100), 100);
      setProgress(current);

      if (t < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        if (onComplete) {
          const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => {
              onComplete();
            }, 400);
          }, 260); // 260ms hold at 100% so user sees completion
          return () => clearTimeout(timer);
        }
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [durationMs, onComplete]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-[9999] bg-[#080A11] text-white flex flex-col items-center justify-center relative overflow-hidden font-sans select-none px-4"
        >
          {/* Subtle Ambient Radial Light (Luxury Royal Indigo Glow) */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_45%,rgba(99,102,241,0.16),transparent_75%)] pointer-events-none" />

          {/* Micro Specular Accent Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px] opacity-50 pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex flex-col items-center max-w-xl w-full text-center space-y-7"
          >
            {/* 1. Official EventOS Logo with Breathing Glow */}
            <motion.div
              animate={{
                y: [0, -6, 0],
                filter: [
                  "drop-shadow(0 0 24px rgba(99,102,241,0.35))",
                  "drop-shadow(0 0 44px rgba(124,58,237,0.55))",
                  "drop-shadow(0 0 24px rgba(99,102,241,0.35))"
                ]
              }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              className="py-1"
            >
              <EventOsLogo size={92} animated={true} />
            </motion.div>

            {/* 2. Clear, High-Contrast Pricing Context Header */}
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-[11px] font-bold uppercase tracking-wider shadow-sm">
                <Tag size={13} className="text-indigo-400" />
                <span>EventOS Transparent Pricing</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white font-sans">
                Curating Agency Plans & Tiers
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
                Loading volume tiers, annual 20% savings, and enterprise proposal features...
              </p>
            </div>

            {/* 3. High-Precision Progress Bar with Clear Live % Counter */}
            <div className="w-full max-w-xs space-y-2.5 flex flex-col items-center">
              <div className="w-full h-[3px] bg-white/[0.08] rounded-full overflow-hidden relative shadow-[0_0_16px_rgba(99,102,241,0.4)]">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full transition-all duration-100 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between w-full font-mono text-[10.5px] text-slate-400 font-bold px-1 tracking-wider">
                <span>CONFIGURING TIERS</span>
                <span className="text-indigo-300 font-black">{progress}%</span>
              </div>
            </div>

            {/* 4. High-Contrast 3-Tier Preview Cards (Vivid & Clear) */}
            <div className="grid grid-cols-3 gap-3.5 w-full max-w-lg pt-1">
              {/* Starter Tier */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.1] shadow-lg flex flex-col items-center space-y-1.5 text-center backdrop-blur-md">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Starter</span>
                <span className="text-xs sm:text-sm font-black text-white">₹1,999<span className="text-[9px] text-slate-400 font-normal">/mo</span></span>
                <span className="text-[9px] text-slate-400 font-medium">Up to 5 Events</span>
              </div>

              {/* Professional Tier (Highlighted Popular) */}
              <div className="p-4 rounded-2xl bg-indigo-950/40 border-2 border-indigo-500/60 shadow-[0_0_25px_rgba(99,102,241,0.25)] flex flex-col items-center space-y-1.5 text-center relative -translate-y-1 backdrop-blur-md">
                <span className="text-[9.5px] font-black text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={10} className="fill-indigo-300" /> Popular
                </span>
                <span className="text-xs sm:text-sm font-black text-white">₹4,999<span className="text-[9px] text-slate-400 font-normal">/mo</span></span>
                <span className="text-[9px] text-indigo-200 font-medium">Up to 20 Events</span>
              </div>

              {/* Agency Tier */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.1] shadow-lg flex flex-col items-center space-y-1.5 text-center backdrop-blur-md">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Agency</span>
                <span className="text-xs sm:text-sm font-black text-white">₹12,999<span className="text-[9px] text-slate-400 font-normal">/mo</span></span>
                <span className="text-[9px] text-slate-400 font-medium">Unlimited Scale</span>
              </div>
            </div>

            {/* 5. Trust Guarantee Badge */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 pt-1">
              <ShieldCheck size={15} className="text-emerald-400" />
              <span>14-Day Free Trial • 30-Day Money-Back Guarantee</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function PricingLoading() {
  return <PricingLoader durationMs={2000} />;
}
