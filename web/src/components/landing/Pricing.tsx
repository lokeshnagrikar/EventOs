"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/ui/border-beam";
import { analytics } from "@/lib/analytics";
import { useAuthModalStore } from "@/store/authModalStore";

export function Pricing() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("monthly");

  const plans = [
    {
      name: "Starter",
      desc: "Perfect for independent wedding coordinators and solo planners.",
      monthlyPrice: 2499,
      annualPrice: 1999,
      cta: "Start Free Trial",
      popular: false,
      features: [
        "Up to 15 Active Events",
        "CRM Lead Pipeline Kanban",
        "Smart Proposals & Signature Acceptance",
        "Milestone Invoice Drafting",
        "Secure Client Portal Link",
        "2 Team Members Included",
        "10GB Media Gallery Storage",
      ],
      border: "border-zinc-800/80 bg-zinc-950/40 backdrop-blur-md hover:border-zinc-700/80",
    },
    {
      name: "Growth",
      desc: "For mid-size event agencies and busy production teams.",
      monthlyPrice: 5999,
      annualPrice: 4799,
      cta: "Start Free Trial",
      popular: true,
      features: [
        "Unlimited Active Events",
        "Advanced CRM Fields & Automations",
        "White-Labeled Custom Client Portal",
        "Auto-billing & Online Deposits",
        "Vendor Task Assignments & Timelines",
        "Up to 10 Team Members",
        "100GB Premium Gallery Storage",
        "Custom Branding & Gallery Overlays",
      ],
      border: "border-purple-500/20 bg-zinc-950/80 backdrop-blur-lg shadow-[0_0_50px_rgba(139,92,246,0.08)]",
    },
    {
      name: "Enterprise",
      desc: "For large-scale venue managers and national production houses.",
      monthlyPrice: null,
      annualPrice: null,
      cta: "Contact Sales",
      popular: false,
      features: [
        "Dedicated Multi-Tenant Isolation SLA",
        "Custom Domain Mapping (e.g. portal.yourbrand.com)",
        "White-Labeled SMTP Email Deliveries",
        "Unlimited Team Members & Roles",
        "Premium API Access & Webhooks",
        "1TB Secure Media Gallery Storage",
        "Priority 24/7 Phone Support & SLA",
        "Custom Feature Development Options",
      ],
      border: "border-zinc-800/80 bg-zinc-950/40 backdrop-blur-md hover:border-zinc-700/80",
    },
  ];

  const formatPrice = (price: number | null) => {
    if (price === null) return "Custom";
    return `₹${price.toLocaleString("en-IN")}`;
  };

  const openModal = useAuthModalStore((state) => state.openModal);

  const handleCtaClick = (planName: string, monthlyPrice: number | null) => {
    analytics.trackCta(`pricing_${planName.toLowerCase()}`, planName, "pricing");
    if (monthlyPrice) {
      openModal("register");
    } else {
      router.push("mailto:sales@eventos.io");
    }
  };

  return (
    <section className="py-24 border-b border-zinc-900 bg-[#09090B] relative overflow-hidden" id="pricing">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-pink-500/5 to-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold tracking-widest text-[#8B5CF6] uppercase block">
            Flexible Pricing
          </span>
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-heading">
            Transparent pricing for teams of all sizes.
          </h3>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            All plans include tenant database isolation, secure SSL connections, and core dashboard functionality. Choose a tier to scale your operations.
          </p>

          {/* Billing Cycle Switcher */}
          <div className="pt-6 flex justify-center">
            <div className="flex bg-zinc-950/80 border border-zinc-900 p-1 rounded-xl items-center">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-zinc-900 text-white shadow-inner"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("annually")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  billingCycle === "annually"
                    ? "bg-zinc-900 text-white shadow-inner"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <span>Annually</span>
                <span className="bg-purple-500/20 text-purple-400 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold uppercase">
                  -20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.4, delay: shouldReduceMotion ? 0 : idx * 0.1 }}
              className={`rounded-2xl border p-6 flex flex-col justify-between relative transition-all duration-300 ${plan.border}`}
            >
              {/* BorderBeam decoration on Growth Card */}
              {plan.popular && !shouldReduceMotion && (
                <BorderBeam size={200} duration={12} borderWidth={1.5} colorFrom="#8B5CF6" colorTo="#EC4899" />
              )}

              {/* Hot badge */}
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-extrabold uppercase py-1 px-3.5 rounded-full tracking-wider shadow-md">
                  Most Popular
                </span>
              )}

              {/* Price Details */}
              <div className="space-y-6 text-left">
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-white font-heading">{plan.name}</h4>
                  <p className="text-zinc-500 text-xs leading-relaxed min-h-[40px]">{plan.desc}</p>
                </div>

                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight font-heading">
                    {billingCycle === "monthly"
                      ? formatPrice(plan.monthlyPrice)
                      : formatPrice(plan.annualPrice)}
                  </span>
                  {plan.monthlyPrice !== null && (
                    <span className="text-zinc-500 text-xs">/month</span>
                  )}
                </div>

                {billingCycle === "annually" && plan.monthlyPrice !== null && (
                  <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded font-semibold block w-fit">
                    Billed annually (₹{(plan.annualPrice! * 12).toLocaleString("en-IN")}/yr)
                  </span>
                )}

                <div className="h-px bg-zinc-900" />

                {/* Features List */}
                <ul className="space-y-3" aria-label={`Features of ${plan.name} plan`}>
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-xs text-zinc-300">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-8">
                <Button
                  onClick={() => handleCtaClick(plan.name, plan.monthlyPrice)}
                  className={`w-full py-6 rounded-xl font-bold text-sm transition-all duration-300 ${
                    plan.popular
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md active:scale-[0.98]"
                      : "bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800"
                  }`}
                >
                  {plan.cta}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
