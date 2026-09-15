"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { HelpCircle, ChevronDown, Sparkles } from "lucide-react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  icon: string;
}

const faqs: FaqItem[] = [
  {
    id: "q1",
    question: "What is EventOS?",
    answer:
      "EventOS is an all-in-one event operations workspace that brings lead tracking, quotation drafting, client approvals, milestone payments, timelines, and client portals together in one unified platform.",
    icon: "solar:star-fall-minimalistic-bold-duotone",
  },
  {
    id: "q2",
    question: "Who is EventOS built for?",
    answer:
      "EventOS is built specifically for Indian wedding planners, boutique event agencies, decor production houses, and independent event coordinators managing multi-step client workflows.",
    icon: "solar:users-group-two-rounded-bold-duotone",
  },
  {
    id: "q3",
    question: "Can I try EventOS before paying?",
    answer:
      "Yes. Every plan includes a 14-day free trial with full access to quotations, timelines, and client portals so you can test it on an active event before committing. No credit card is required.",
    icon: "solar:clock-circle-bold-duotone",
  },
  {
    id: "q4",
    question: "Does EventOS support wedding agencies?",
    answer:
      "Absolutely. EventOS was designed around wedding planning workflows — supporting multi-day itineraries (Mehendi, Sangeet, Wedding, Reception), vendor coordination, client approval sign-offs, and high-res media delivery.",
    icon: "solar:heart-bold-duotone",
  },
  {
    id: "q5",
    question: "Can my team use EventOS?",
    answer:
      "Yes. Depending on your plan, you can invite team members and assign role-based permissions (Director, Lead Planner, On-Site Coordinator) so everyone stays aligned on tasks and schedules.",
    icon: "solar:user-hand-up-bold-duotone",
  },
  {
    id: "q6",
    question: "Can clients access their own portal?",
    answer:
      "Yes. Every event has a dedicated, mobile-friendly client portal where clients can review and sign quotes, inspect payment schedules, track timeline milestones, and access approved deliverables.",
    icon: "solar:laptop-minimalistic-bold-duotone",
  },
  {
    id: "q7",
    question: "Can I track payments and invoices?",
    answer:
      "Yes. You can structure advance milestone payments, generate GST-compliant tax invoices, record received payments via UPI or bank transfer, and send automated client reminders.",
    icon: "solar:wallet-money-bold-duotone",
  },
  {
    id: "q8",
    question: "Can I use EventOS for corporate events?",
    answer:
      "Yes. While optimized for weddings and social celebrations, EventOS easily handles corporate conferences, product launches, and brand activations with stage timelines, vendor rosters, and deliverable tracking.",
    icon: "solar:case-bold-duotone",
  },
  {
    id: "q9",
    question: "Is my data secure?",
    answer:
      "Yes. Each agency workspace has isolated tenant data, TLS-encrypted connections in transit, role-based document access, and regular cloud backups to protect your commercial contracts and client details.",
    icon: "solar:shield-check-bold-duotone",
  },
  {
    id: "q10",
    question: "What happens after my trial?",
    answer:
      "After your 14-day trial, you can choose to upgrade to Starter, Professional, or Agency. Your event data, quotes, and timeline templates are fully preserved so your workflow never gets interrupted.",
    icon: "solar:restart-bold-duotone",
  },
];

export function Faq() {
  const shouldReduceMotion = useReducedMotion();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      className="py-24 sm:py-32 border-b border-slate-200/80 bg-[#FAF9F6] relative overflow-hidden font-sans text-left"
    >
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-purple-100/25 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4 mb-14 sm:mb-18"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200/80 text-purple-700 text-xs font-bold uppercase tracking-widest">
            <HelpCircle size={14} className="text-purple-600" />
            <span>Got Questions?</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 font-heading text-balance leading-[1.12]">
            Frequently Asked{" "}
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
              Questions.
            </span>
          </h2>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-medium max-w-2xl mx-auto">
            Everything you need to know about getting started with EventOS for your event planning business.
          </p>
        </motion.div>

        {/* 10 Accordion Cards */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.id}
                className={cn(
                  "rounded-2xl border transition-all duration-200 overflow-hidden bg-white",
                  isOpen
                    ? "border-purple-300 shadow-md shadow-purple-500/5 ring-1 ring-purple-400/30"
                    : "border-slate-200/90 shadow-2xs hover:border-slate-300"
                )}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggleAccordion(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={cn(
                        "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                        isOpen
                          ? "bg-purple-100/70 border-purple-300 text-purple-700"
                          : "bg-slate-100 border-slate-200 text-slate-600"
                      )}
                    >
                      <Icon icon={faq.icon} className="text-base" />
                    </div>
                    <span className="text-sm sm:text-base font-extrabold text-slate-900">
                      {faq.question}
                    </span>
                  </div>

                  <ChevronDown
                    size={16}
                    className={cn(
                      "text-slate-400 shrink-0 transition-transform duration-200",
                      isOpen && "rotate-180 text-purple-600"
                    )}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed pl-16 border-t border-slate-100">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Support Note */}
        <div className="mt-12 text-center">
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Have a custom workflow question?{" "}
            <a
              href="mailto:support@eventosapp.in"
              className="text-purple-700 font-bold hover:underline"
            >
              Contact our team directly →
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
