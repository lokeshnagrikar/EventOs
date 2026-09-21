"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Icon } from "@iconify/react";
import { Calendar, ArrowRight, CheckCircle2, Play, Sparkles } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { AnimatedMeshGradient } from "@/components/ui/AnimatedMeshGradient";
import { LiquidMetalButton } from "@/components/landing/LiquidMetalButton";
import { LiquidRippleHeading } from "@/components/landing/LiquidRippleHeading";
import { StardustButton } from "@/components/landing/StardustButton";

const workflowSteps = [
  { step: "1", label: "Lead captured", icon: "solar:user-plus-bold-duotone", color: "text-purple-600 bg-purple-50 border-purple-200" },
  { step: "2", label: "Quote generated", icon: "solar:document-text-bold-duotone", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { step: "3", label: "Payment tracked", icon: "solar:wallet-bold-duotone", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { step: "4", label: "Event planned", icon: "solar:calendar-bold-duotone", color: "text-pink-600 bg-pink-50 border-pink-200" },
  { step: "5", label: "Client updated", icon: "solar:shield-user-bold-duotone", color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
];

export function Hero({ preloaderActive = false }: { preloaderActive?: boolean }) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);

  // 3D Tilt Effect values for the dashboard container
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-300, 300], [4, -4]);
  const rotateY = useTransform(mouseX, [-400, 400], [-4, 4]);

  const springConfig = { damping: 25, stiffness: 120 };
  const springX = useSpring(rotateX, springConfig);
  const springY = useSpring(rotateY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleBookDemo = () => {
    analytics.trackCta("hero_book_demo", "Book a Free Demo", "hero");
    router.push("/book-demo");
  };

  const handleSeeHowItWorks = () => {
    analytics.trackCta("hero_how_it_works", "See How It Works", "hero");
    const elem = document.getElementById("workflow") || document.getElementById("showcase");
    if (elem) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elemRect = elem.getBoundingClientRect().top;
      const elemPos = elemRect - bodyRect;
      window.scrollTo({
        top: elemPos - offset,
        behavior: "smooth",
      });
    }
  };

  return (
    <section
      id="hero"
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="min-h-[92vh] flex flex-col items-center justify-center pt-28 sm:pt-32 pb-16 relative overflow-hidden bg-[#FAF9F6] text-slate-900"
    >
      {/* Background Soft Glows */}
      <div className="pointer-events-none absolute top-12 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-purple-200/30 blur-[140px] rounded-full z-0" />
      <div className="pointer-events-none absolute top-40 right-10 w-[400px] h-[300px] bg-indigo-100/30 blur-[100px] rounded-full z-0" />

      {/* Subtle Mesh Gradient */}
      <AnimatedMeshGradient />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full relative z-10 flex flex-col items-center text-center">
        {/* Supporting Line Tag */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100/80 border border-purple-200/90 text-xs font-extrabold text-purple-800 uppercase tracking-widest mb-5 shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>From first enquiry to final delivery</span>
        </motion.div>

        {/* Hero Headline */}
        <motion.h1
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight font-heading max-w-4xl text-balance leading-[1.12]"
        >
          <LiquidRippleHeading />
        </motion.h1>

        {/* Supporting Copy */}
        <motion.p
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium"
        >
          Manage leads, quotations, payments, timelines, vendors and client communication from one powerful workspace — built for modern event and wedding agencies.
        </motion.p>

        {/* CTA Buttons Row */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto"
        >
          {/* Primary CTA: Liquid Metal Shader Button */}
          <LiquidMetalButton
            label="Book a Free Demo"
            onClick={handleBookDemo}
            width={204}
            height={50}
          />

          {/* Secondary CTA: Frosted Glass Button */}
          <StardustButton onClick={handleSeeHowItWorks}>
            See How It Works
          </StardustButton>
        </motion.div>

        {/* Below CTA Reassurance Line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.32 }}
          className="mt-4 text-xs font-semibold text-slate-500 flex flex-wrap items-center justify-center gap-x-2 gap-y-1"
        >
          <span>No setup fees</span>
          <span>•</span>
          <span>14-day free trial</span>
          <span>•</span>
          <span>Built for event agencies</span>
        </motion.p>

        {/* Visual Workflow Indicators Strip */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.38 }}
          className="mt-10 sm:mt-12 w-full max-w-4xl"
        >
          <div className="p-3 sm:p-4 rounded-2xl bg-white/90 border border-slate-200/90 shadow-sm backdrop-blur-md">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-between gap-2 sm:gap-4">
              {workflowSteps.map((step, idx) => (
                <React.Fragment key={step.label}>
                  <div className="flex items-center gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-slate-50/80 transition-all duration-150 cursor-default hover:-translate-y-0.5 group/step">
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold border ${step.color} shrink-0 shadow-xs group-hover/step:scale-105 transition-transform`}>
                      <Icon icon={step.icon} className="text-sm" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 tracking-tight">
                      {step.label}
                    </span>
                  </div>
                  {idx < workflowSteps.length - 1 && (
                    <div className="hidden sm:flex items-center text-slate-300">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Dashboard Product Visual */}
        <motion.div
          initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.44 }}
          style={{
            rotateX: springX,
            rotateY: springY,
            transformStyle: "preserve-3d",
          }}
          className="mt-6 w-full max-w-5xl relative"
        >
          {/* Subtle Ambient Bloom Behind Mockup */}
          <div className="absolute -inset-2 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-pink-500/10 blur-xl rounded-3xl -z-10" />

          {/* Browser Container */}
          <div className="rounded-2xl border border-slate-800 bg-[#0B0F19] p-2 sm:p-2.5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            {/* Top Browser Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/90 rounded-t-xl">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                <span className="text-[10px] text-slate-400 font-mono ml-2 select-none">
                  app.eventos.in/workspace/overview
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 px-2 py-0.5 rounded-md text-[10px] text-slate-300 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Agency Hub</span>
              </div>
            </div>

            {/* Dashboard Content Mockup */}
            <div className="bg-[#0F172A] rounded-b-xl overflow-hidden min-h-[300px] sm:min-h-[380px] aspect-auto sm:aspect-[16/10] relative text-left flex">
              {/* Background dots pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(#334155_1.2px,transparent_1.2px)] [background-size:20px_20px] opacity-25 pointer-events-none" />

              {/* Sidebar Navigation */}
              <div className="w-10 sm:w-12 border-r border-slate-800 bg-slate-900/90 backdrop-blur-md flex flex-col items-center py-3 justify-between relative z-10 shrink-0">
                <div className="flex flex-col items-center gap-3.5">
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-black shadow-md shadow-purple-500/20">
                    E
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    {[
                      { icon: "solar:home-bold-duotone", active: true },
                      { icon: "solar:users-group-rounded-bold-duotone" },
                      { icon: "solar:document-text-bold-duotone" },
                      { icon: "solar:calendar-bold-duotone" },
                      { icon: "solar:wallet-money-bold-duotone" },
                      { icon: "solar:gallery-bold-duotone" },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className={`h-7 w-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                          item.active
                            ? "bg-purple-600/30 text-purple-300 border border-purple-500/40"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <Icon icon={item.icon} className="text-xs sm:text-sm" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <div className="h-6 w-6 rounded-full bg-purple-600 border border-slate-700 flex items-center justify-center text-[8px] font-bold text-white">
                    P
                  </div>
                  <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-emerald-500 border border-slate-900" />
                </div>
              </div>

              {/* Main Content Area */}
              <div className="relative z-10 flex-1 flex flex-col justify-between p-3.5 sm:p-5 gap-3.5">
                {/* Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">
                      Agency Command Center
                    </span>
                    <h4 className="text-xs sm:text-base font-bold text-white font-heading truncate max-w-[200px] sm:max-w-none">
                      Royal Weddings & Luxury Events
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] sm:text-[10px] px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold whitespace-nowrap">
                      Current Season: 18 Active Events
                    </span>
                  </div>
                </div>

                {/* 3 Core Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Leads in Pipeline
                    </span>
                    <p className="text-lg sm:text-xl font-extrabold text-white font-heading">24 Qualified</p>
                    <p className="text-[10px] text-emerald-400 font-semibold">↑ 6 proposals sent this week</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Payments & Invoices
                    </span>
                    <p className="text-lg sm:text-xl font-extrabold text-white font-heading">₹28.4 Lakhs</p>
                    <p className="text-[10px] text-purple-400 font-semibold">100% advance deposits on track</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Next Event Execution
                    </span>
                    <p className="text-lg sm:text-xl font-extrabold text-cyan-300 font-heading">Sangeet Gala</p>
                    <p className="text-[10px] text-slate-400 font-semibold">Taj Palace • 450 Guests</p>
                  </div>
                </div>

                {/* Live Activity & Client Acceptance Strip */}
                <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-300 font-medium truncate text-[11px]">
                      <strong className="text-white">Proposal #QT-2026-088</strong> signed & ₹5,00,000 milestone advance paid by client.
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 shrink-0 ml-2">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
