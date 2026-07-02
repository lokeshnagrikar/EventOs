"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
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
    <section className="py-24 border-b border-zinc-900 bg-[#09090B] w-full relative z-10">
      <div className="max-w-6xl mx-auto px-6">
        {/* Large Gradient Card */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="relative rounded-3xl border border-purple-500/20 bg-gradient-to-br from-[#8B5CF6]/12 via-[#EC4899]/8 to-[#06B6D4]/8 p-8 sm:p-16 overflow-hidden shadow-[0_0_100px_rgba(139,92,246,0.07)]"
        >
          {/* BorderBeam decoration */}
          {!shouldReduceMotion && (
            <BorderBeam size={300} duration={14} borderWidth={1.5} colorFrom="#8B5CF6" colorTo="#06B6D4" />
          )}

          {/* Animated corner glows */}
          <div className="absolute -right-20 -bottom-20 w-[350px] h-[350px] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute -left-20 -top-20 w-[300px] h-[300px] bg-pink-500/12 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-gradient-to-r from-purple-500/5 to-cyan-500/5 blur-2xl rounded-full pointer-events-none" />

          {/* Subtle grid backdrop */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f23_1px,transparent_1px),linear-gradient(to_bottom,#1f1f23_1px,transparent_1px)] bg-[size:32px_32px] opacity-8 pointer-events-none" />

          {/* Gradient border ring */}
          <div className="absolute inset-0 rounded-3xl border border-white/5 pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto text-center space-y-8">
            {/* Badge */}
            <span className="inline-flex items-center gap-2 text-[11px] font-extrabold tracking-widest text-[#06B6D4] bg-[#06B6D4]/10 border border-[#06B6D4]/25 px-4 py-1.5 rounded-full uppercase">
              <Icon icon="solar:gift-bold-duotone" className="text-sm" />
              Free 14-Day Trial — No Credit Card Required
            </span>

            {/* Headline */}
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight font-heading">
                Streamline your event
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#06B6D4]">
                  operations today.
                </span>
              </h2>
              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
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
                      className="w-full pl-10 pr-4 py-3.5 bg-zinc-950/80 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all shadow-inner"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="bg-white hover:bg-zinc-100 text-zinc-950 rounded-xl font-bold px-6 shadow-lg transition-all active:scale-[0.98] flex items-center gap-2 whitespace-nowrap"
                  >
                    Get Started
                    <Icon icon="solar:arrow-right-bold" className="text-sm" />
                  </Button>
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
