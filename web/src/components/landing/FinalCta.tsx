"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, CheckCircle2 } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { useAuthModalStore } from "@/store/authModalStore";

export function FinalCta() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const openModal = useAuthModalStore((state) => state.openModal);

  const handleBookDemo = () => {
    analytics.trackCta("final_cta_book_demo", "Book a Free Demo", "final_cta");
    router.push("/demo");
  };

  const handleStartTrial = () => {
    analytics.trackCta("final_cta_start_trial", "Start 14-Day Free Trial", "final_cta");
    openModal("register");
  };

  return (
    <section
      id="final-cta"
      className="py-24 sm:py-32 bg-[#FAF9F6] relative overflow-hidden font-sans text-left"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="relative rounded-3xl bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white p-8 sm:p-16 lg:p-20 overflow-hidden shadow-2xl shadow-purple-950/40 border border-purple-800/40 text-center"
        >
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-purple-600/20 blur-[150px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-indigo-600/20 blur-[130px] rounded-full pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-purple-200 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
              <Sparkles size={13} className="text-purple-300" />
              <span>Transform Your Event Operations</span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] font-heading text-balance">
                Ready to Run Your Events{" "}
                <span className="bg-gradient-to-r from-purple-400 via-pink-300 to-indigo-300 bg-clip-text text-transparent">
                  Without the Chaos?
                </span>
              </h2>

              <p className="text-slate-300 text-base sm:text-lg lg:text-xl font-medium leading-relaxed max-w-2xl mx-auto">
                Bring leads, quotes, payments, planning and client communication into one workspace.
              </p>
            </div>

            {/* Two-Button CTA Hierarchy */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              {/* Primary CTA: Book a Free Demo */}
              <button
                type="button"
                onClick={handleBookDemo}
                className="w-full sm:w-auto relative overflow-hidden px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm sm:text-base font-extrabold shadow-xl shadow-purple-500/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97] group"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
                <span>Book a Free Demo</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Secondary CTA: Start 14-Day Free Trial */}
              <button
                type="button"
                onClick={handleStartTrial}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/20 text-sm sm:text-base font-bold transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-[0.97]"
              >
                <span>Start 14-Day Free Trial</span>
              </button>
            </div>

            {/* Reassurance Strip */}
            <div className="pt-4 flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>14-day free trial</span>
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-700 hidden sm:inline-block" />
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>No credit card required</span>
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-700 hidden sm:inline-block" />
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>Personalized founder onboarding</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
