"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Check,
  X,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  HelpCircle,
  Clock,
  TrendingUp,
  Server
} from "lucide-react";
import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";
import { useAuthModalStore } from "@/store/authModalStore";
import {
  PRICING_PLANS,
  COMPARISON_MATRIX,
  PRICING_FAQS,
  PricingPlan
} from "@/config/pricing";

export function Pricing() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [isYearly, setIsYearly] = useState(true);
  const [eventVolume, setEventVolume] = useState<number>(12);
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const openModal = useAuthModalStore((state) => state.openModal);

  // Dynamic recommendation logic based on finalized prompt specifications:
  // 1–5 events: STARTER
  // 6–20 events: PROFESSIONAL
  // 21+ events: AGENCY
  const recommendedPlanId: "starter" | "professional" | "agency" =
    eventVolume <= 5 ? "starter" : eventVolume <= 20 ? "professional" : "agency";

  const getRecommendationMessage = () => {
    if (recommendedPlanId === "starter") {
      return "Based on your event volume, STARTER is a strong fit for your team.";
    }
    if (recommendedPlanId === "professional") {
      return "Based on your event volume, we recommend the PROFESSIONAL plan for optimal team capacity and operational efficiency.";
    }
    return "Based on your event volume, AGENCY is recommended for unlimited operational scale.";
  };

  const handleCtaClick = (plan: PricingPlan) => {
    analytics.trackCta(`pricing_${plan.id}`, plan.name, "pricing");
    openModal("waitlist");
  };

  return (
    <section
      className="py-24 sm:py-32 relative bg-[#FAF9F6] border-b border-slate-200/80 font-sans overflow-hidden"
      id="pricing"
    >
      {/* Background Soft Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-purple-200/25 blur-[150px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Container */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200/80 text-purple-700 text-xs font-bold uppercase tracking-widest mb-4 shadow-xs">
            <Sparkles size={13} className="text-purple-600" />
            <span>Transparent, Predictable Pricing</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Run Your Event Business. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 bg-clip-text text-transparent">
              Not Your Spreadsheets.
            </span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            From enquiry and quotation to client approval, payments, vendors, timelines, and event-day execution — EventOS keeps your entire operation in one workspace.
          </p>

          {/* Billing Switcher with 20% Discount Badge */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <div
              className="inline-flex items-center p-1 rounded-full bg-white border border-slate-200/90 shadow-sm"
              role="group"
              aria-label="Billing cycle selector"
            >
              <button
                type="button"
                aria-pressed={!isYearly}
                onClick={() => setIsYearly(false)}
                className={cn(
                  "px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer",
                  !isYearly
                    ? "bg-[#7C3AED] text-white shadow-md shadow-purple-500/25"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                aria-pressed={isYearly}
                onClick={() => setIsYearly(true)}
                className={cn(
                  "px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
                  isYearly
                    ? "bg-[#7C3AED] text-white shadow-md shadow-purple-500/25"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <span>Annual Billing</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Event Volume Slider & Recommendation */}
        <div className="max-w-2xl mx-auto mb-16 p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono block">
                Interactive Plan Finder
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-0.5">
                How many events does your agency run per month?
              </h4>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-2xl font-black text-purple-700 font-heading">
                {eventVolume >= 50 ? "50+ Events" : `${eventVolume} Events`}
              </span>
            </div>
          </div>

          {/* Slider Control */}
          <input
            type="range"
            min={1}
            max={50}
            value={eventVolume}
            onChange={(e) => setEventVolume(parseInt(e.target.value))}
            aria-label="Monthly events volume slider"
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />

          <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-2 font-mono">
            <span>1 (Solo)</span>
            <span>10 (Growing Team)</span>
            <span>20 (Active Agency)</span>
            <span>21+ (Agency Scale)</span>
          </div>

          {/* Live Recommendation Badge */}
          <div className="mt-4 p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200/80 flex items-center gap-3">
            <Zap size={16} className="text-purple-600 shrink-0 fill-purple-600" />
            <p className="text-xs text-purple-950 font-semibold leading-relaxed">
              {getRecommendationMessage()}
            </p>
          </div>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid lg:grid-cols-3 gap-8 items-stretch mb-16">
          {PRICING_PLANS.map((plan, index) => {
            const price = isYearly ? plan.annualMonthlyPrice : plan.monthlyPrice;
            const isHighlighted = plan.id === recommendedPlanId;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={cn(
                  "rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 relative border",
                  plan.popular
                    ? "bg-[#0B0F19] text-white border-purple-500/80 shadow-2xl shadow-purple-950/30 lg:-translate-y-2 ring-2 ring-purple-500/30"
                    : isHighlighted
                    ? "bg-white border-purple-400 shadow-xl ring-2 ring-purple-400/20 text-slate-900"
                    : "bg-white/90 border-slate-200/90 hover:border-slate-300 shadow-md text-slate-900"
                )}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                    <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white text-[11px] font-extrabold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                      <Sparkles size={12} className="fill-white" />
                      <span>{plan.badge || "⚡ MOST POPULAR CHOICE"}</span>
                    </span>
                  </div>
                )}

                <div>
                  {/* Top Plan Header */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={cn(
                          "text-2xl font-black font-heading tracking-tight",
                          plan.popular ? "text-white" : "text-slate-900"
                        )}
                      >
                        {plan.name}
                      </h3>
                      <span
                        className={cn(
                          "text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full font-mono",
                          plan.popular
                            ? "bg-purple-900/60 text-purple-300 border border-purple-700/50"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {plan.tagline}
                      </span>
                    </div>

                    <p
                      className={cn(
                        "text-xs font-semibold mt-1",
                        plan.popular ? "text-purple-300" : "text-purple-700"
                      )}
                    >
                      {plan.positioning}
                    </p>

                    <p
                      className={cn(
                        "text-xs leading-relaxed mt-2.5",
                        plan.popular ? "text-slate-300" : "text-slate-600"
                      )}
                    >
                      {plan.description}
                    </p>
                  </div>

                  {/* Price Section */}
                  <div className="mb-6 pb-6 border-b border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-baseline gap-1">
                      <span
                        className={cn(
                          "text-4xl sm:text-5xl font-extrabold tracking-tight font-heading",
                          plan.popular ? "text-white" : "text-slate-900"
                        )}
                      >
                        ₹{price.toLocaleString("en-IN")}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-bold font-mono ml-1",
                          plan.popular ? "text-slate-400" : "text-slate-500"
                        )}
                      >
                        {isYearly ? "/ month · billed annually" : "/ month"}
                      </span>
                    </div>

                    {/* Annual Savings Badge */}
                    <div className="mt-2.5 flex items-center gap-2">
                      {isYearly ? (
                        <span className="inline-flex items-center text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-2.5 py-0.5 rounded-full font-mono">
                          {plan.annualSavingsFormatted}
                        </span>
                      ) : (
                        <span
                          className={cn(
                            "text-[11px] font-semibold",
                            plan.popular ? "text-slate-400" : "text-slate-500"
                          )}
                        >
                          Switch to annual for ~20% discount
                        </span>
                      )}
                    </div>

                    {/* Operational Value Callout */}
                    <div
                      className={cn(
                        "mt-3.5 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2",
                        plan.popular
                          ? "bg-purple-950/70 border border-purple-800/50 text-purple-200"
                          : "bg-slate-100 border border-slate-200/80 text-slate-800"
                      )}
                    >
                      <Clock size={13} className="text-purple-500 shrink-0" />
                      <span>{plan.valueCallout}</span>
                    </div>

                    {/* Agency Infrastructure Optional Note */}
                    {plan.infrastructureNote && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                        <Server size={12} className="text-slate-400 shrink-0" />
                        <span>{plan.infrastructureNote}</span>
                      </div>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    <span
                      className={cn(
                        "text-[11px] font-bold uppercase tracking-wider block font-mono",
                        plan.popular ? "text-slate-400" : "text-slate-500"
                      )}
                    >
                      Included Capabilities:
                    </span>
                    <ul className="space-y-2.5">
                      {plan.features.map((feature, i) => {
                        const isPlusHeader = feature.startsWith("Everything in");
                        return (
                          <li
                            key={i}
                            className={cn(
                              "flex items-start gap-2.5 text-xs",
                              isPlusHeader
                                ? plan.popular
                                  ? "text-purple-300 font-bold"
                                  : "text-purple-800 font-bold"
                                : plan.popular
                                ? "text-slate-200 font-medium"
                                : "text-slate-700 font-medium"
                            )}
                          >
                            <Check
                              size={15}
                              className={cn(
                                "shrink-0 mt-0.5",
                                plan.popular ? "text-purple-400" : "text-purple-600"
                              )}
                            />
                            <span>{feature}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                {/* Card CTA Button */}
                <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800">
                  <button
                    onClick={() => handleCtaClick(plan)}
                    className={cn(
                      "w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md",
                      plan.popular
                        ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white hover:brightness-110 active:scale-[0.98] shadow-purple-500/25"
                        : "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]"
                    )}
                  >
                    <span>{plan.cta}</span>
                  </button>
                  <p
                    className={cn(
                      "text-[11px] text-center font-medium mt-2",
                      plan.popular ? "text-slate-400" : "text-slate-500"
                    )}
                  >
                    {plan.ctaSubtext}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Feature Comparison Matrix Drawer Trigger */}
        <div className="text-center mb-16">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-slate-200/90 text-slate-800 text-xs sm:text-sm font-bold shadow-sm hover:border-purple-300 hover:text-purple-700 transition cursor-pointer"
          >
            <span>
              {showComparison ? "Hide Detailed Feature Comparison" : "Compare All Features & Modules Side-by-Side"}
            </span>
            <ChevronDown
              size={16}
              className={cn("transition-transform duration-300", showComparison && "rotate-180")}
            />
          </button>
        </div>

        {/* Expandable Comparison Matrix Table */}
        <AnimatePresence>
          {showComparison && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-20 overflow-hidden"
            >
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-x-auto p-6 sm:p-8">
                <div className="mb-6">
                  <h4 className="text-xl font-black text-slate-900 font-heading">
                    Full Plan Feature & Scale Comparison
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Direct architectural comparison of capacity limits, workflows, and operational capabilities across all tiers.
                  </p>
                </div>

                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="p-4 font-extrabold text-slate-900 w-2/5 uppercase tracking-wider text-[11px] font-mono">
                        Capability & Specification
                      </th>
                      <th className="p-4 font-bold text-slate-900 text-center w-1/5">Starter</th>
                      <th className="p-4 font-extrabold text-purple-700 text-center w-1/5 bg-purple-50/70 rounded-t-xl">
                        Professional (Most Popular)
                      </th>
                      <th className="p-4 font-bold text-slate-900 text-center w-1/5">Agency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {COMPARISON_MATRIX.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 text-slate-900 font-semibold">
                          <span>{row.name}</span>
                          {row.category && (
                            <span className="block text-[10px] text-slate-400 font-mono font-normal uppercase mt-0.5">
                              {row.category}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center text-slate-700 font-mono">{row.starter}</td>
                        <td className="p-4 text-center text-purple-900 font-mono font-extrabold bg-purple-50/40">
                          {row.professional}
                        </td>
                        <td className="p-4 text-center text-slate-700 font-mono">{row.agency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 6-Item Objection-Handling FAQ Accordion */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-700 font-mono block mb-1">
              Clear Answers
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
              Frequently Asked Questions
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Everything you need to know about licensing, volume handling, and team scale.
            </p>
          </div>

          <div className="space-y-3">
            {PRICING_FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-5 text-left font-bold text-slate-900 text-xs sm:text-sm flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition"
                  >
                    <span className="flex items-center gap-2.5">
                      <HelpCircle size={16} className="text-purple-600 shrink-0" />
                      <span>{faq.q}</span>
                    </span>
                    <ChevronDown
                      size={16}
                      className={cn(
                        "text-slate-400 transition-transform duration-200 shrink-0",
                        isOpen && "rotate-180 text-purple-600"
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-5 pb-5 pt-1 text-xs text-slate-600 font-medium leading-relaxed pl-11">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk-Reversal 30-Day Guarantee Footer Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-lg text-center max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-left">
            <div className="h-14 w-14 rounded-2xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-600 shrink-0 shadow-xs">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900">
                100% Risk-Free 30-Day Guarantee
              </h4>
              <p className="text-xs text-slate-600 font-medium mt-0.5 max-w-md">
                Try EventOS completely risk-free. If it doesn't streamline your proposals, timelines, and crew coordination, cancel anytime with zero lock-in contracts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => openModal("register")}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-500/25 hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center gap-2"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
