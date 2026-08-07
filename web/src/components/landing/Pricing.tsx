"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, Sparkles, Zap, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SparklesCore } from "@/components/ui/sparkles";
import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";
import { useAuthModalStore } from "@/store/authModalStore";

interface Plan {
  name: string;
  desc: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  cta: string;
  popular?: boolean;
  features: string[];
}

const plans: Plan[] = [
  {
    name: "Starter",
    desc: "Perfect for independent planners managing multiple event schedules.",
    monthlyPrice: 1999,
    annualPrice: 1599,
    cta: "Start Free Trial",
    popular: false,
    features: [
      "5 Active Events",
      "2 Team seats included",
      "20 GB High-res media storage",
      "Milestone payments clearing",
      "Automated client contracts",
      "Standard email support queue"
    ]
  },
  {
    name: "Professional",
    desc: "Best value for active agencies & growing event organizations.",
    monthlyPrice: 5999,
    annualPrice: 4799,
    cta: "Start Free Trial",
    popular: true,
    features: [
      "Everything in Starter, plus:",
      "20 Active Events",
      "5 Team seats included",
      "100 GB High-res media storage",
      "EventOS AI Operations Co-pilot",
      "Interactive custom quotes editor",
      "Priority support queue SLA"
    ]
  },
  {
    name: "Enterprise",
    desc: "Advanced security & unlimited scale for large production houses.",
    monthlyPrice: 11999,
    annualPrice: 9599,
    cta: "Contact Sales",
    popular: false,
    features: [
      "Everything in Professional, plus:",
      "Unlimited Active Events & Seats",
      "500 GB+ Dedicated AWS storage",
      "Custom white-labeled domains",
      "Developer API & webhooks access",
      "24/7 Dedicated account manager"
    ]
  }
];

const PricingSwitch = ({ isYearly, onToggle }: { isYearly: boolean; onToggle: (yearly: boolean) => void }) => {
  return (
    <div className="flex justify-center">
      <div className="relative z-10 mx-auto flex w-fit rounded-full bg-white border border-slate-200 p-1.5 shadow-sm">
        <button
          onClick={() => onToggle(false)}
          className={cn(
            "relative z-10 w-fit h-9 rounded-full sm:px-6 px-4 flex items-center justify-center font-medium text-xs transition-colors cursor-pointer",
            !isYearly ? "text-white" : "text-slate-600 hover:text-slate-900"
          )}
        >
          {!isYearly && (
            <motion.span
              layoutId="pricing-switch"
              className="absolute top-0 left-0 h-9 w-full rounded-full border border-purple-600 shadow-md shadow-purple-500/20 bg-[#7C3AED]"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10 font-bold">Monthly</span>
        </button>

        <button
          onClick={() => onToggle(true)}
          className={cn(
            "relative z-10 w-fit h-9 rounded-full sm:px-6 px-4 flex items-center justify-center font-medium text-xs transition-colors cursor-pointer",
            isYearly ? "text-white" : "text-slate-600 hover:text-slate-900"
          )}
        >
          {isYearly && (
            <motion.span
              layoutId="pricing-switch"
              className="absolute top-0 left-0 h-9 w-full rounded-full border border-purple-600 shadow-md shadow-purple-500/20 bg-[#7C3AED]"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2 font-bold">
            Yearly
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
              SAVE 20%
            </span>
          </span>
        </button>
      </div>
    </div>
  );
};

export function Pricing() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [isYearly, setIsYearly] = useState(false);
  const pricingRef = useRef<HTMLDivElement>(null);

  const openModal = useAuthModalStore((state) => state.openModal);

  const handleCtaClick = (planName: string) => {
    analytics.trackCta(`pricing_${planName.toLowerCase()}`, planName, "pricing");
    if (planName !== "Enterprise") {
      openModal("register");
    } else {
      router.push("mailto:sales@eventos.io");
    }
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return "Custom";
    return `₹${price.toLocaleString()}`;
  };

  return (
    <section
      className="min-h-screen pt-24 pb-36 mx-auto relative bg-transparent overflow-visible border-b border-purple-500/10 font-sans"
      id="pricing"
      ref={pricingRef}
    >
      {/* Sparkles particle background behind header */}
      <div className="absolute top-0 left-0 right-0 h-96 w-full overflow-hidden [mask-image:radial-gradient(50%_50%,white,transparent)] pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:70px_80px]" />
        <SparklesCore
          particleDensity={1200}
          speed={0.8}
          particleColor="#A855F7"
          className="absolute inset-x-0 bottom-0 h-full w-full opacity-60"
        />
      </div>

      {/* Blue Glow Radial Blur Blob */}
      <div
        className="absolute top-0 left-[10%] right-[10%] w-[80%] h-full pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 25%, rgba(49, 49, 245, 0.25) 0%, transparent 65%)`,
        }}
      />

      {/* Header Container */}
      <article className="text-center mb-16 pt-8 max-w-3xl mx-auto space-y-4 relative z-10 px-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-700 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
          <Sparkles size={13} className="text-blue-600" /> Transparent Pricing
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight font-heading leading-tight">
          Plans tailored for your event business
        </h2>

        <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-medium">
          Trusted by event agencies and coordinators worldwide. Choose a tier to unlock automation, client portals, and multi-tenant scaling.
        </p>

        <div className="pt-4">
          <PricingSwitch isYearly={isYearly} onToggle={setIsYearly} />
        </div>
      </article>

      {/* Pricing Cards Grid */}
      <div className="grid md:grid-cols-3 max-w-6xl gap-6 px-6 py-4 mx-auto relative z-10 items-stretch">
        {plans.map((plan, index) => {
          const price = isYearly ? plan.annualPrice : plan.monthlyPrice;

          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={cn(
                "relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-500 border backdrop-blur-2xl",
                plan.popular
                  ? "bg-gradient-to-b from-[#0F172A]/95 via-[#1E1B4B]/90 to-[#0F172A]/95 backdrop-blur-2xl border-purple-400/60 text-white shadow-[0_20px_50px_rgba(124,58,237,0.25),inset_0_1px_1.5px_rgba(255,255,255,0.3)] z-20 lg:scale-[1.02]"
                  : "bg-white/70 backdrop-blur-2xl backdrop-saturate-[1.8] border-slate-200/90 hover:border-purple-300 shadow-[0_10px_30px_rgba(124,58,237,0.06),inset_0_1px_1.5px_rgba(255,255,255,0.95)] hover:shadow-[0_16px_40px_rgba(124,58,237,0.15)] text-slate-900 z-10"
              )}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#A855F7] text-white text-[10px] font-black uppercase py-1 px-4 rounded-full tracking-widest shadow-lg shadow-purple-600/30 border border-purple-400/40 flex items-center gap-1.5 z-30">
                  <Zap size={11} className="fill-white" /> Most Popular
                </div>
              )}

              <div>
                {/* Header */}
                <div className="mb-6">
                  <h3 className={cn("text-2xl font-bold font-heading", plan.popular ? "text-white" : "text-[#111827]")}>{plan.name}</h3>
                  <p className={cn("text-xs mt-1.5 leading-relaxed min-h-[36px] font-medium", plan.popular ? "text-slate-300" : "text-[#4B5563]")}>{plan.desc}</p>
                </div>

                {/* Price Display */}
                <div className={cn("mb-6 pb-6 border-b", plan.popular ? "border-white/10" : "border-slate-200")}>
                  <div className="flex items-baseline gap-1">
                    <span className={cn("text-4xl sm:text-5xl font-black font-heading tracking-tight", plan.popular ? "text-white" : "text-[#111827]")}>
                      {formatPrice(price)}
                    </span>
                    {price !== null && (
                      <span className={cn("text-xs font-medium", plan.popular ? "text-slate-400" : "text-[#4B5563]")}>
                        /{isYearly ? "month" : "month"}
                      </span>
                    )}
                  </div>
                  {isYearly && price !== null && (
                    <p className="text-[10px] text-emerald-500 font-bold mt-1">
                      Billed annually (₹{(price * 12).toLocaleString()}/yr)
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3.5 mb-8">
                  <h4 className={cn("text-xs font-bold uppercase tracking-wider", plan.popular ? "text-slate-300" : "text-slate-900")}>
                    {plan.features[0]}
                  </h4>
                  <ul className="space-y-2.5">
                    {plan.features.slice(1).map((feature, fIdx) => (
                      <li key={fIdx} className={cn("flex items-start gap-2.5 text-xs font-medium", plan.popular ? "text-slate-300" : "text-[#4B5563]")}>
                        <span className={cn("h-4 w-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 border", plan.popular ? "bg-purple-500/20 border-purple-400/40" : "bg-purple-50 border-purple-200")}>
                          <Check size={10} className={cn("stroke-[3]", plan.popular ? "text-purple-300" : "text-[#7C3AED]")} />
                        </span>
                        <span className="leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div>
                <button
                  onClick={() => handleCtaClick(plan.name)}
                  className={cn(
                    "w-full py-3.5 px-6 rounded-2xl font-bold text-sm transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 group",
                    plan.popular
                      ? "bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#A855F7] hover:brightness-110 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40 hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md shadow-purple-500/20 border border-purple-600/40 hover:scale-[1.02] active:scale-[0.98]"
                  )}
                >
                  <span>{plan.cta}</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
