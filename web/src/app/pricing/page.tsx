"use client";

import React, { useState, useMemo } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Check, HelpCircle, ArrowRight, Calculator } from "lucide-react";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/lib/toastStore";
import { Competitors } from "@/components/landing/Competitors";

const FAQS = [
  { q: "Can I upgrade or downgrade my plan at any time?", a: "Yes, you can upgrade, downgrade, or cancel your subscription at any time. If you upgrade, the changes will apply immediately. If you downgrade or cancel, the changes will take effect at the end of your current billing cycle." },
  { q: "Is there a limit on how many events I can manage?", a: "Each tier has a soft limit on active events managed per month. The Starter plan includes 5 active events, while the Professional plan includes 20 active events. Pinned active events can be archived to free up slots." },
  { q: "How does the Client Portal billing work?", a: "Your clients do not need to pay anything or create an account to use the portal. They can view quotes, sign contracts, and pay invoices instantly. Stripe gateway processing fees apply standardly depending on your regional Stripe account configuration." },
  { q: "What is your data security and backup SLA?", a: "EventOS is built on top of AWS isolated multi-tenant architecture. All data is encrypted in transit using TLS 1.3 and at rest using AES-256. Database schemas are logically isolated per workspace, with daily automated backups retained for 30 days." },
];

const COMPARISON_FEATURES = [
  { name: "Active Events (Per Month)", free: "2", starter: "5", professional: "20", business: "50", enterprise: "Unlimited" },
  { name: "Team Seats Included", free: "1", starter: "2", professional: "5", business: "15", enterprise: "Custom" },
  { name: "Storage Quota Capacity", free: "5 GB", starter: "20 GB", professional: "100 GB", business: "500 GB", enterprise: "Unlimited" },
  { name: "Interactive Client Portals", free: "✔", starter: "✔", professional: "✔", business: "✔", enterprise: "✔ (White-labeled)" },
  { name: "Automated Invoicing & Quotes", free: "✕", starter: "✔", professional: "✔", business: "✔", enterprise: "✔" },
  { name: "AI Operations Assistant", free: "✕", starter: "Basic", professional: "Full Access", business: "Full Access", enterprise: "Custom Models" },
  { name: "Custom Domain & Branding", free: "✕", starter: "✕", professional: "✕", business: "✔", enterprise: "✔" },
  { name: "Developer API & Webhooks", free: "✕", starter: "✕", professional: "Read-Only", business: "✔", enterprise: "✔" },
  { name: "SLA & Support channels", free: "Community", starter: "Email", professional: "Priority Email", business: "24/7 Chat", enterprise: "Dedicated Manager" },
];

export default function PricingPage() {
  const addToast = useToastStore((state) => state.addToast);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [eventVolume, setEventVolume] = useState(15);
  const [hoursSpent, setHoursSpent] = useState(10);
  const [hourlyRate, setHourlyRate] = useState(1200);

  // Calculations for ROI
  const calculatedSavings = useMemo(() => {
    const totalHoursSpent = eventVolume * hoursSpent;
    const efficiencyRatio = 0.45; // 45% time saved
    const hoursSaved = Math.round(totalHoursSpent * efficiencyRatio);
    const moneySaved = hoursSaved * hourlyRate;
    const softwareCost = billingCycle === "yearly" ? 79 * 12 * 83 : 99 * 83; // Professional plan price in INR
    const roiMultiplier = moneySaved > 0 ? (moneySaved / (softwareCost / 12)).toFixed(1) : "0.0";

    return { hoursSaved, moneySaved, roiMultiplier };
  }, [eventVolume, hoursSpent, hourlyRate, billingCycle]);

  const plans = [
    {
      name: "Free",
      desc: "For newly launched event coordinators getting off the ground.",
      price: { monthly: 0, yearly: 0 },
      features: [
        "2 Active Events",
        "1 Team seat",
        "5 GB Media storage quota",
        "Standard client portal access",
        "Standard email invoices",
      ],
      cta: "Start Free",
      isPopular: false,
    },
    {
      name: "Starter",
      desc: "Perfect for independent planners managing multiple schedules.",
      price: { monthly: 39, yearly: 29 },
      features: [
        "5 Active Events",
        "2 Team seats",
        "20 GB Media storage quota",
        "Milestone payments clearing",
        "Automated contract signing",
        "Standard email support",
      ],
      cta: "Start Free Trial",
      isPopular: false,
    },
    {
      name: "Professional",
      desc: "Our most popular package for active event organizations.",
      price: { monthly: 99, yearly: 79 },
      features: [
        "20 Active Events",
        "5 Team seats",
        "100 GB Media storage quota",
        "AI Assistant operations advisor",
        "Interactive custom quotes editor",
        "Priority support queue SLA",
      ],
      cta: "Start Free Trial",
      isPopular: true,
    },
    {
      name: "Business",
      desc: "For established production houses requiring custom domains.",
      price: { monthly: 189, yearly: 149 },
      features: [
        "50 Active Events",
        "15 Team seats",
        "500 GB Media storage quota",
        "Custom white-labeled domains",
        "Developer API & webhooks access",
        "24/7 dedicated support channels",
      ],
      cta: "Start Free Trial",
      isPopular: false,
    },
    {
      name: "Enterprise",
      desc: "Custom structures for global scale agency workloads.",
      price: { monthly: null, yearly: null },
      features: [
        "Unlimited Active Events",
        "Unlimited Team seats",
        "Dedicated AWS storage assets",
        "Custom AI training parameters",
        "Multi-tenant tenant isolation",
        "Dedicated SLA accounts manager",
      ],
      cta: "Contact Sales",
      isPopular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-650 selection:text-white">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 max-w-7xl mx-auto px-6 space-y-24 w-full">
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent"
          >
            Transparent pricing models
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none"
          >
            Predictable Plans for Agencies of All Sizes.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base text-zinc-400 font-semibold"
          >
            Start free on any plan, upgrade when you scale. No hidden margins. 20% discount on yearly invoices.
          </motion.p>

          {/* Toggle */}
          <div className="flex justify-center pt-6 select-none">
            <div className="flex bg-zinc-950 border border-zinc-850 p-1 rounded-full text-xs font-bold items-center gap-1">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "px-4 py-2 rounded-full transition-all cursor-pointer",
                  billingCycle === "monthly" ? "bg-zinc-900 text-purple-400 border border-purple-500/10 shadow" : "text-zinc-555 hover:text-zinc-300"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={cn(
                  "px-4 py-2 rounded-full transition-all cursor-pointer flex items-center gap-1.5",
                  billingCycle === "yearly" ? "bg-zinc-900 text-purple-455 border border-purple-500/10 shadow" : "text-zinc-555 hover:text-zinc-300"
                )}
              >
                Annually
                <span className="text-[9px] bg-emerald-950/40 text-emerald-455 border border-emerald-900/30 px-2 py-0.5 rounded-full uppercase font-black tracking-wide leading-none">
                  -20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 items-stretch w-full">
          {plans.map((plan, idx) => {
            const price = billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly;
            const hasDiscount = plan.price.monthly !== plan.price.yearly;

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="flex"
              >
                <SpotlightCard
                  className={cn(
                    "flex flex-col justify-between p-6 rounded-2xl border bg-zinc-950/20 backdrop-blur w-full relative",
                    plan.isPopular ? "border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.05)]" : "border-zinc-850"
                  )}
                >
                  {plan.isPopular && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-purple-400/20 shadow-md">
                      Most Popular
                    </span>
                  )}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-black uppercase text-zinc-300">{plan.name}</h3>
                      <p className="text-[10px] text-zinc-555 leading-relaxed font-semibold min-h-[40px]">{plan.desc}</p>
                    </div>

                    <div className="py-2">
                      {price !== null ? (
                        <div className="flex items-baseline">
                          <span className="text-3xl font-black tracking-tight text-white font-mono">${price}</span>
                          <span className="text-zinc-555 text-[10px] font-bold ml-1 uppercase">/ mo</span>
                        </div>
                      ) : (
                        <span className="text-xl font-black text-white">Custom Pricing</span>
                      )}
                      {hasDiscount && plan.price.monthly !== 0 && (
                        <span className="text-[9px] text-zinc-555 line-through block mt-0.5 font-bold font-mono">
                          Billed at ${plan.price.monthly}/mo monthly
                        </span>
                      )}
                    </div>

                    <ul className="space-y-2.5 pt-4 border-t border-zinc-900 text-[10.5px] font-semibold text-zinc-400">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5 leading-snug">
                          <Check size={11} className="text-purple-450 mt-0.5 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => addToast(`Initializing signup/demo request flow for ${plan.name} plan...`, "info")}
                    className={cn(
                      "w-full py-2.5 rounded-xl text-[10.5px] font-extrabold uppercase tracking-widest transition-all mt-6 cursor-pointer text-center",
                      plan.isPopular
                        ? "bg-purple-650 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/10 active:scale-98"
                        : "bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-300 hover:text-white"
                    )}
                  >
                    {plan.cta}
                  </button>
                </SpotlightCard>
              </motion.div>
            );
          })}
        </div>

        {/* ROI Calculator Section */}
        <div className="p-8 border border-zinc-850 bg-[#121214]/20 backdrop-blur rounded-2xl space-y-6">
          <div className="flex items-start gap-4 border-b border-zinc-900 pb-5">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Calculator size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-zinc-200">Interactive SaaS ROI Calculator</h3>
              <p className="text-[10px] text-zinc-555 font-semibold mt-0.5">Estimate how much time and operational costs you reclaim using EventOS automation.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Controls */}
            <div className="lg:col-span-2 space-y-4 font-semibold text-xs text-zinc-400">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10.5px]">
                  <span>Monthly Inbound Events Volume</span>
                  <span className="font-mono text-purple-400 font-black">{eventVolume} active events</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="120"
                  value={eventVolume}
                  onChange={(e) => setEventVolume(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10.5px]">
                  <span>Operational Planning Hours per Event (Spreadsheet setup, invoicing, etc.)</span>
                  <span className="font-mono text-purple-400 font-black">{hoursSpent} hrs / event</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="40"
                  value={hoursSpent}
                  onChange={(e) => setHoursSpent(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10.5px]">
                  <span>Hourly Planning Team Labor Rate (INR)</span>
                  <span className="font-mono text-purple-400 font-black">₹{hourlyRate} / hr</span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="5000"
                  step="50"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>

            {/* Output */}
            <div className="lg:col-span-1 p-6 bg-zinc-950/40 border border-zinc-850 rounded-xl flex flex-col justify-between items-center text-center space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-555 font-black uppercase tracking-widest">Calculated Monthly Gains</span>
                <p className="text-xl font-black text-white font-mono">₹{calculatedSavings.moneySaved.toLocaleString()}</p>
                <span className="text-[10px] text-zinc-500 block">estimated cost savings / mo</span>
              </div>

              <div className="w-full h-[1px] bg-zinc-900" />

              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="space-y-1">
                  <span className="text-[8px] text-zinc-555 font-bold uppercase tracking-wider block">Hours Reclaimed</span>
                  <span className="text-sm font-mono font-black text-purple-450">{calculatedSavings.hoursSaved} hrs</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] text-zinc-555 font-bold uppercase tracking-wider block">ROI Multiplier</span>
                  <span className="text-sm font-mono font-black text-emerald-450">{calculatedSavings.roiMultiplier}x</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Comparison Matrix */}
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] text-purple-450 uppercase font-black tracking-widest block">In-depth breakdown</span>
            <h3 className="text-lg font-black text-white">Full Feature Comparison Matrix</h3>
          </div>

          <div className="border border-zinc-850 rounded-2xl overflow-x-auto bg-[#121214]/10 backdrop-blur select-none">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-850 bg-zinc-950/60 font-black text-zinc-300">
                  <th className="p-4 uppercase tracking-wider font-extrabold w-[30%]">Features & Modules</th>
                  <th className="p-4 uppercase tracking-wider font-extrabold text-center">Free</th>
                  <th className="p-4 uppercase tracking-wider font-extrabold text-center">Starter</th>
                  <th className="p-4 uppercase tracking-wider font-extrabold text-center text-purple-400">Professional</th>
                  <th className="p-4 uppercase tracking-wider font-extrabold text-center">Business</th>
                  <th className="p-4 uppercase tracking-wider font-extrabold text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 font-semibold text-zinc-400">
                {COMPARISON_FEATURES.map((feat) => (
                  <tr key={feat.name} className="hover:bg-zinc-900/10 transition">
                    <td className="p-4 text-zinc-200 font-bold">{feat.name}</td>
                    <td className="p-4 text-center font-mono">{feat.free}</td>
                    <td className="p-4 text-center font-mono">{feat.starter}</td>
                    <td className="p-4 text-center font-mono text-purple-400/90">{feat.professional}</td>
                    <td className="p-4 text-center font-mono">{feat.business}</td>
                    <td className="p-4 text-center font-mono">{feat.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Competitor Comparison */}
        <Competitors />

        {/* FAQs */}
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="text-center space-y-1">
            <span className="text-[10px] text-purple-450 uppercase font-black tracking-widest block">Clearance checks</span>
            <h3 className="text-lg font-black text-white">Pricing & Licensing FAQ</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {FAQS.map((faq) => (
              <div key={faq.q} className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-2">
                <h4 className="text-xs font-black text-zinc-200 flex items-center gap-2">
                  <HelpCircle size={13} className="text-purple-400 shrink-0" />
                  {faq.q}
                </h4>
                <p className="text-[10.5px] text-zinc-450 font-semibold leading-relaxed pl-5">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="p-12 border border-zinc-800 bg-gradient-to-tr from-zinc-950 via-zinc-950 to-purple-950/20 rounded-3xl text-center space-y-6 relative overflow-hidden select-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="space-y-2 max-w-xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Ready to Elevate Your Operations?</h3>
            <p className="text-[11px] text-zinc-400 font-semibold leading-relaxed">
              Join thousands of wedding planners, production agencies, and event coordinators managing pipelines on EventOS. No credit card required.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
            <button
              onClick={() => addToast("Initializing signup route...", "info")}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-500/10 cursor-pointer"
            >
              Start Free Trial <ArrowRight size={12} />
            </button>
            <button
              onClick={() => addToast("Demo calendar integration is loading...", "info")}
              className="px-6 py-2.5 border border-zinc-850 hover:bg-zinc-855 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Book a Custom Demo
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
