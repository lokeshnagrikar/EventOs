"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { BorderBeam } from "@/components/ui/border-beam";
import { analytics } from "@/lib/analytics";
import { useAuthModalStore } from "@/store/authModalStore";

export function FinalCta() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const openModal = useAuthModalStore((state) => state.openModal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      analytics.trackCta("final_cta_submit", "Get Started Email", "final_cta");
      setSubmitted(true);
      setTimeout(() => {
        openModal("register", email);
        setSubmitted(false);
        setEmail("");
      }, 1200);
    }
  };

  const trustItems = [
    { icon: "solar:shield-check-bold-duotone", label: "SSL Encrypted", color: "text-emerald-400" },
    { icon: "solar:server-bold-duotone", label: "SaaS Multi-Tenancy", color: "text-purple-400" },
    { icon: "solar:lock-bold-duotone", label: "100% Isolated Data", color: "text-cyan-400" },
    { icon: "solar:card-bold-duotone", label: "No Credit Card", color: "text-pink-400" },
  ];

  return (
    <section className="py-24 border-b border-[#E5E7EB] bg-[#FFFFFF] w-full relative z-10">
      <div className="max-w-6xl mx-auto px-6">
        {/* Large Gradient Card */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="relative rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50 via-white to-indigo-50/50 p-8 sm:p-16 overflow-hidden shadow-xl shadow-purple-500/5"
        >
          {/* BorderBeam decoration */}
          {!shouldReduceMotion && (
            <BorderBeam size={300} duration={14} borderWidth={1.5} colorFrom="#7C3AED" colorTo="#A855F7" />
          )}

          {/* Animated corner glows */}
          <div className="absolute -right-20 -bottom-20 w-[350px] h-[350px] bg-purple-200/40 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute -left-20 -top-20 w-[300px] h-[300px] bg-indigo-100/40 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto text-center space-y-8">
            {/* Badge */}
            <span className="inline-flex items-center gap-2 text-[11px] font-extrabold tracking-widest text-[#7C3AED] bg-purple-100 border border-purple-200 px-4 py-1.5 rounded-full uppercase">
              <Icon icon="solar:gift-bold-duotone" className="text-sm" />
              Free 14-Day Trial — No Credit Card Required
            </span>

            {/* Headline */}
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[#111827] leading-tight font-heading">
                Streamline your event
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#A855F7]">
                  operations today.
                </span>
              </h2>
              <p className="text-[#4B5563] text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-medium">
                Connect your team, coordinate vendors, and delight clients from a single secure workspace. Cancel anytime, no lock-in.
              </p>
            </div>

            {/* Email Capture Form */}
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                  suppressHydrationWarning
                >
                  <label htmlFor="cta-email" className="sr-only">
                    Email address
                  </label>
                  <div className="relative flex-1">
                    <Icon
                      icon="solar:letter-bold-duotone"
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-base pointer-events-none"
                    />
                    <input
                      id="cta-email"
                      type="email"
                      required
                      placeholder="Enter your agency email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 bg-white border border-[#E5E7EB] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 rounded-xl text-sm text-[#111827] font-semibold placeholder-[#6B7280] outline-none transition-all shadow-sm"
                    />
                  </div>
                  <LiquidButton
                    type="submit"
                    variant="brand"
                    className="rounded-xl font-bold px-6 active:scale-[0.98] flex items-center gap-2 whitespace-nowrap"
                    size="lg"
                  >
                    Get Started
                    <Icon icon="solar:arrow-right-bold" className="text-sm" />
                  </LiquidButton>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-3 p-5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl max-w-sm mx-auto"
                >
                  <Icon icon="solar:check-circle-bold-duotone" className="text-emerald-400 text-3xl" />
                  <span className="text-sm font-bold text-zinc-100">
                    Preparing your workspace...
                  </span>
                  <span className="text-xs text-zinc-500">Redirecting you to registration</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center items-center gap-5 text-[10px] text-zinc-500 font-bold tracking-wide uppercase">
              {trustItems.map((t, i) => (
                <React.Fragment key={t.label}>
                  {i > 0 && <span className="text-zinc-800">•</span>}
                  <span className="flex items-center gap-1.5">
                    <Icon icon={t.icon} className={`${t.color} text-sm`} />
                    {t.label}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
