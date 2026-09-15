"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Icon } from "@iconify/react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

interface ProblemCard {
  number: string;
  title: string;
  icon: string;
  pain: string;
  solution: string;
  accentGradient: string;
  iconColor: string;
  iconBg: string;
}

const problemCards: ProblemCard[] = [
  {
    number: "01",
    title: "Too Many WhatsApp Groups",
    icon: "solar:chat-round-line-bold-duotone",
    pain: "Important messages, approvals and event updates get buried across conversations.",
    solution: "Keep client communication, tasks and event information organized in one workspace.",
    accentGradient: "from-purple-500/10 via-transparent to-transparent",
    iconColor: "text-purple-600",
    iconBg: "bg-purple-50 border-purple-200/80",
  },
  {
    number: "02",
    title: "Quotes & Payments Take Too Much Time",
    icon: "solar:bill-check-bold-duotone",
    pain: "Creating quotations, following up for approvals and tracking advances manually eats into your day.",
    solution: "Create professional proposals, collect approvals and track milestone payments from one place.",
    accentGradient: "from-pink-500/10 via-transparent to-transparent",
    iconColor: "text-pink-600",
    iconBg: "bg-pink-50 border-pink-200/80",
  },
  {
    number: "03",
    title: "Event Details Are Everywhere",
    icon: "solar:layers-minimalistic-bold-duotone",
    pain: "Timelines, vendors, tasks and media links become difficult to manage as the event gets closer.",
    solution: "Turn every booking into a structured event workspace.",
    accentGradient: "from-indigo-500/10 via-transparent to-transparent",
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-50 border-indigo-200/80",
  },
];

function ProblemSpotlightCard({
  card,
  idx,
  shouldReduceMotion,
}: {
  card: ProblemCard;
  idx: number;
  shouldReduceMotion: boolean | null;
}) {
  const [mousePos, setMousePos] = React.useState<{ x: number; y: number } | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay: idx * 0.1 }}
      whileHover={shouldReduceMotion ? {} : { y: -4, transition: { duration: 0.2 } }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative rounded-3xl border border-slate-200/90 bg-white p-7 sm:p-8 shadow-sm hover:shadow-xl hover:border-purple-300/80 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-default"
    >
      {/* Dynamic Cursor-Tracking Spotlight */}
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"
        style={{
          background: mousePos
            ? `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(168, 85, 247, 0.12), transparent 80%)`
            : undefined,
        }}
      />

      {/* Subtle top card gradient accent */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${card.accentGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0`}
      />

      <div className="space-y-6 relative z-10">
        {/* Header row: Icon & Number */}
        <div className="flex items-center justify-between">
          <div
            className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${card.iconBg} ${card.iconColor} transition-transform duration-300 group-hover:scale-105 shadow-xs`}
          >
            <Icon icon={card.icon} className="text-2xl" />
          </div>
          <span className="text-xs font-black font-mono tracking-widest text-slate-400 group-hover:text-purple-600 transition-colors">
            {card.number}
          </span>
        </div>

        {/* Card Title */}
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading leading-snug">
          {card.title}
        </h3>

        {/* Pain statement */}
        <div className="text-sm text-slate-600 leading-relaxed font-medium">
          {card.pain}
        </div>
      </div>

      {/* Solution container */}
      <div className="mt-8 pt-6 border-t border-slate-100 space-y-2 relative z-10">
        <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-purple-700">
          <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          <span>Solution</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-800 font-semibold leading-relaxed">
          {card.solution}
        </p>
      </div>
    </motion.div>
  );
}

export function ProblemSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="problem"
      className="py-24 sm:py-32 bg-[#FAF9F6] border-b border-slate-200/80 relative overflow-hidden font-sans"
    >
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[300px] bg-purple-100/30 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[250px] bg-indigo-100/30 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-16 sm:mb-20"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200/80 text-purple-700 text-xs font-extrabold uppercase tracking-widest">
            The Operational Bottleneck
          </span>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 font-heading text-balance leading-[1.15]">
            Your event business shouldn't run on{" "}
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
              WhatsApp, Excel and scattered files.
            </span>
          </h2>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium max-w-2xl mx-auto">
            When teams grow and wedding season peaks, juggling disconnected tools causes missed cues, delayed payments, and operational fatigue.
          </p>
        </motion.div>

        {/* 3 Premium SaaS Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {problemCards.map((card, idx) => (
            <ProblemSpotlightCard
              key={card.number}
              card={card}
              idx={idx}
              shouldReduceMotion={shouldReduceMotion}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// Alias export to maintain backward compatibility with all imports
export const ChaosVsEventOsSlider = ProblemSection;
