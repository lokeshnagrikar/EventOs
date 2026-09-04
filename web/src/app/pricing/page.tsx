"use client";

import React, { useState, useMemo } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Check, HelpCircle, ArrowRight, Calculator, ShieldCheck } from "lucide-react";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { cn } from "@/lib/utils";
import { Competitors } from "@/components/landing/Competitors";
import { useAuthModalStore } from "@/store/authModalStore";

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
  const openModal = useAuthModalStore((state) => state.openModal);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [eventVolume, setEventVolume] = useState(15);
  const [hoursSpent, setHoursSpent] = useState(10);
  const [hourlyRate, setHourlyRate] = useState(1200);
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");

  // Calculations for ROI
  const calculatedSavings = useMemo(() => {
    const totalHoursSpent = eventVolume * hoursSpent;
    const efficiencyRatio = 0.45; // 45% time saved
    const hoursSaved = Math.round(totalHoursSpent * efficiencyRatio);
    const moneySaved = hoursSaved * hourlyRate;
    const softwareCost = billingCycle === "yearly" ? 4799 * 12 : 5999;
    const roiMultiplier = moneySaved > 0 ? (moneySaved / (softwareCost / 12)).toFixed(1) : "0.0";

    return { hoursSaved, moneySaved, roiMultiplier };
  }, [eventVolume, hoursSpent, hourlyRate, billingCycle]);

  const plans = useMemo(() => [
    {
      name: "Starter",
      desc: "Perfect for independent planners managing multiple event schedules.",
      price: { 
        monthly: currency === "INR" ? 1999 : 29, 
        yearly: currency === "INR" ? 1599 : 23 
      },
      features: [
        "5 Active Events",
        "2 Team seats included",
        "20 GB High-res media storage",
        "Milestone payments clearing",
        "Automated client contracts",
      ],
      cta: "Start 14-Day Free Trial",
      isPopular: false,
    },
    {
      name: "Professional",
      desc: "Best value for active agencies & growing event organizations.",
      price: { 
        monthly: currency === "INR" ? 5999 : 79, 
        yearly: currency === "INR" ? 4799 : 63 
      },
      features: [
        "20 Active Events",
        "5 Team seats included",
        "100 GB High-res media storage",
        "EventOS AI Operations Co-pilot",
        "Interactive custom quotes editor",
        "Priority support queue SLA",
      ],
      cta: "Start 14-Day Free Trial",
      isPopular: true,
    },
    {
      name: "Enterprise",
      desc: "Advanced security & unlimited scale for large production houses.",
      price: { 
        monthly: currency === "INR" ? 14999 : 149, 
        yearly: currency === "INR" ? 11999 : 119 
      },
      features: [
        "Unlimited Active Events & Seats",
        "500 GB+ Dedicated AWS storage",
        "Custom white-labeled domains",
        "Developer API & webhooks access",
        "Dedicated SLA account manager",
      ],
      cta: "Contact Sales",
      isPopular: false,
    },
  ], [currency]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-600 selection:text-white">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 max-w-7xl mx-auto px-6 space-y-20 w-full">
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-black uppercase tracking-widest text-purple-700 block font-mono"
          >
            Transparent pricing models
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 font-heading leading-tight"
          >
            Predictable Plans for Agencies of All Sizes.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base text-slate-600 font-medium"
          >
            Start free on any plan, upgrade when you scale. No hidden margins. 20% discount on yearly invoices.
          </motion.p>

          {/* Toggle Controls */}
          <div className="flex flex-wrap justify-center items-center gap-4 pt-4 select-none">
            <div className="flex bg-white border border-slate-200 p-1.5 rounded-full text-xs font-bold items-center gap-1 shadow-sm">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "px-4 py-2 rounded-full transition-all cursor-pointer",
                  billingCycle === "monthly" ? "bg-purple-600 text-white font-extrabold shadow" : "text-slate-600 hover:text-slate-900"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={cn(
                  "px-4 py-2 rounded-full transition-all cursor-pointer flex items-center gap-1.5",
                  billingCycle === "yearly" ? "bg-purple-600 text-white font-extrabold shadow" : "text-slate-600 hover:text-slate-900"
                )}
              >
                Annually
                <span className="text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase font-black tracking-wide leading-none">
                  -20%
                </span>
              </button>
            </div>

            <div className="flex bg-white border border-slate-200 p-1.5 rounded-full text-xs font-bold items-center gap-1 shadow-sm">
              <button
                onClick={() => setCurrency("INR")}
                className={cn(
                  "px-3.5 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1",
                  currency === "INR" ? "bg-slate-900 text-white font-extrabold" : "text-slate-600 hover:text-slate-900"
                )}
              >
                🇮🇳 ₹ INR
              </button>
              <button
                onClick={() => setCurrency("USD")}
                className={cn(
                  "px-3.5 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1",
                  currency === "USD" ? "bg-slate-900 text-white font-extrabold" : "text-slate-600 hover:text-slate-900"
                )}
              >
                🌐 $ USD
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto w-full">
          {plans.map((plan, idx) => {
            const price = billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly;

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -6 }}
                transition={{ delay: idx * 0.1 }}
                className="flex"
              >
                <div
                  className={cn(
                    "flex flex-col justify-between p-8 rounded-3xl border bg-white shadow-sm hover:shadow-xl transition-all duration-300 w-full relative",
                    plan.isPopular ? "border-purple-500 ring-2 ring-purple-500/20 shadow-purple-500/10" : "border-slate-200/90"
                  )}
                >
                  {plan.isPopular && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md font-mono">
                      Most Popular
                    </span>
                  )}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-black text-slate-900 font-heading">{plan.name}</h3>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed min-h-[36px]">{plan.desc}</p>
                    </div>

                    <div className="py-2">
                      <div className="flex items-baseline">
                        <span className="text-4xl font-black tracking-tight text-slate-900 font-heading">
                          {currency === "INR" ? "₹" : "$"}{price.toLocaleString()}
                        </span>
                        <span className="text-slate-500 text-xs font-bold ml-1.5 uppercase font-mono">/ mo</span>
                      </div>
                      {billingCycle === "yearly" && (
                        <span className="text-[11px] text-purple-700 font-bold block mt-1 font-mono">
                          Billed annually (Save 20%)
                        </span>
                      )}
                    </div>

                    <ul className="space-y-3 pt-6 border-t border-slate-100 text-xs font-medium text-slate-700">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-center gap-2.5">
                          <Check size={16} className="text-purple-600 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => openModal("register")}
                    className={cn(
                      "w-full py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all mt-8 cursor-pointer text-center active:scale-95 shadow-sm",
                      plan.isPopular
                        ? "bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white shadow-purple-500/25 hover:brightness-110"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    )}
                  >
                    {plan.cta}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ROI Calculator Section */}
        <div className="p-8 sm:p-10 border border-slate-200/90 bg-white rounded-3xl space-y-6 shadow-sm">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="h-12 w-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <Calculator size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 font-heading">Interactive SaaS ROI Calculator</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Estimate how much time and operational costs you reclaim using EventOS automation.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Controls */}
            <div className="lg:col-span-2 space-y-5 font-semibold text-xs text-slate-700">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span>Monthly Active Events Volume</span>
                  <span className="font-mono text-purple-700 font-black text-sm">{eventVolume} active events</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="120"
                  value={eventVolume}
                  onChange={(e) => setEventVolume(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span>Operational Hours per Event (Quotes, vendor scheduling, invoicing)</span>
                  <span className="font-mono text-purple-700 font-black text-sm">{hoursSpent} hrs / event</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="40"
                  value={hoursSpent}
                  onChange={(e) => setHoursSpent(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span>Hourly Planning Team Labor Rate (₹)</span>
                  <span className="font-mono text-purple-700 font-black text-sm">₹{hourlyRate} / hr</span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="5000"
                  step="50"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>
            </div>

            {/* Output */}
            <div className="lg:col-span-1 p-6 bg-purple-50/60 border border-purple-100 rounded-2xl flex flex-col justify-between items-center text-center space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] text-purple-700 font-extrabold uppercase tracking-widest font-mono">Calculated Monthly Gains</span>
                <p className="text-2xl font-black text-slate-900 font-heading">₹{calculatedSavings.moneySaved.toLocaleString()}</p>
                <span className="text-xs text-slate-500 font-medium block">estimated cost savings / mo</span>
              </div>

              <div className="w-full h-[1px] bg-purple-200/60" />

              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Hours Reclaimed</span>
                  <span className="text-base font-mono font-black text-purple-700">{calculatedSavings.hoursSaved} hrs</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">ROI Multiplier</span>
                  <span className="text-base font-mono font-black text-emerald-600">{calculatedSavings.roiMultiplier}x</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Comparison Matrix */}
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] text-purple-700 uppercase font-black tracking-widest block font-mono">In-depth breakdown</span>
            <h3 className="text-xl font-black text-slate-900 font-heading">Full Feature Comparison Matrix</h3>
          </div>

          <div className="border border-slate-200/90 rounded-3xl overflow-x-auto bg-white shadow-sm">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 font-black text-slate-900">
                  <th className="p-4 uppercase tracking-wider font-extrabold w-[30%] font-mono text-xs">Features & Modules</th>
                  <th className="p-4 uppercase tracking-wider font-extrabold text-center">Free</th>
                  <th className="p-4 uppercase tracking-wider font-extrabold text-center">Starter</th>
                  <th className="p-4 uppercase tracking-wider font-extrabold text-center text-purple-700">Professional</th>
                  <th className="p-4 uppercase tracking-wider font-extrabold text-center">Business</th>
                  <th className="p-4 uppercase tracking-wider font-extrabold text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {COMPARISON_FEATURES.map((feat) => (
                  <tr key={feat.name} className="hover:bg-purple-50/40 transition">
                    <td className="p-4 text-slate-900 font-bold">{feat.name}</td>
                    <td className="p-4 text-center font-mono">{feat.free}</td>
                    <td className="p-4 text-center font-mono">{feat.starter}</td>
                    <td className="p-4 text-center font-mono text-purple-700 font-extrabold bg-purple-50/50">{feat.professional}</td>
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
            <span className="text-[10px] text-purple-700 uppercase font-black tracking-widest block font-mono">Clearance checks</span>
            <h3 className="text-xl font-black text-slate-900 font-heading">Pricing & Licensing FAQ</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {FAQS.map((faq) => (
              <div key={faq.q} className="p-6 border border-slate-200/90 bg-white rounded-2xl space-y-2 shadow-sm">
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2 font-heading">
                  <HelpCircle size={16} className="text-purple-600 shrink-0" />
                  {faq.q}
                </h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="p-8 sm:p-12 border border-slate-800 bg-slate-900 text-white rounded-3xl text-center space-y-6 shadow-xl">
          <div className="space-y-2 max-w-xl mx-auto">
            <h3 className="text-xl sm:text-3xl font-black font-heading tracking-tight">Ready to Elevate Your Operations?</h3>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Join founding event agencies managing pipelines on EventOS. No credit card required.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={() => openModal("register")}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white rounded-full text-xs font-extrabold shadow-lg shadow-purple-500/25 hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
