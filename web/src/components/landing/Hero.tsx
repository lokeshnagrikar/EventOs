"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { AuroraText } from "@/components/ui/aurora-text";
import { NumberTicker } from "@/components/ui/number-ticker";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { AnimatedMeshGradient } from "@/components/ui/AnimatedMeshGradient";
import { analytics } from "@/lib/analytics";

import { gsap } from "gsap";
import { useAuthModalStore } from "@/store/authModalStore";
import dynamic from "next/dynamic";
import { LiquidButton } from "@/components/ui/liquid-glass-button";

function RotatingHeroPhrase() {
  const phrases = [
    "From Lead to Invoice.",
    "From Quote to Contract.",
    "From Stage to Spotlight.",
    // "From Concept to Execution.",
    "From Brief to Deposit."
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="inline-flex items-center justify-center relative min-h-[1.25em] w-full">
      <AnimatePresence mode="wait">
        <motion.span
          key={phrases[index]}
          initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="inline-block"
        >
          <AuroraText className="font-extrabold" speed={8}>
            {phrases[index]}
          </AuroraText>
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function Hero({ preloaderActive = false }: { preloaderActive?: boolean }) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);

  // 3D Tilt Effect values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Map mouse coordinate ratios to degrees of rotation (-5deg to 5deg is highly elegant and premium)
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-6, 6]);

  // Spring physics for smooth slide effect
  const springX = useSpring(rotateX, { damping: 30, stiffness: 120, mass: 0.8 });
  const springY = useSpring(rotateY, { damping: 30, stiffness: 120, mass: 0.8 });

  const [spotlightPos, setSpotlightPos] = useState({ x: -1000, y: -1000 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = heroRef.current;
    if (!el || shouldReduceMotion) return;
    const rect = el.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    setSpotlightPos({ x: clientX, y: clientY });

    const xVal = clientX - width / 2;
    const yVal = clientY - height / 2;

    mouseX.set(xVal / width);
    mouseY.set(yVal / height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setSpotlightPos({ x: -1000, y: -1000 });
  };

  const stats = [
    {
      value: 2847,
      label: "Events Managed",
      desc: "Real customer • Anonymized",
      icon: "solar:users-group-rounded-bold-duotone",
      badgeBg: "bg-purple-50 border-purple-200/80 text-[#7C3AED]",
      bg: "from-purple-500/10 via-purple-500/5 to-transparent",
      borderColor: "hover:border-purple-300",
    },
    {
      value: 12.4,
      prefix: "₹",
      suffix: "Cr",
      decimals: 1,
      label: "Revenue Processed",
      desc: "Real customer • Anonymized",
      icon: "solar:chart-bold-duotone",
      badgeBg: "bg-pink-50 border-pink-200/80 text-pink-600",
      bg: "from-pink-500/10 via-pink-500/5 to-transparent",
      borderColor: "hover:border-pink-300",
    },
    {
      value: 99.4,
      suffix: "%",
      decimals: 1,
      label: "Client Satisfaction",
      desc: "Real customer • Anonymized",
      icon: "solar:star-bold-duotone",
      badgeBg: "bg-sky-50 border-sky-200/80 text-sky-600",
      bg: "from-sky-500/10 via-sky-500/5 to-transparent",
      borderColor: "hover:border-sky-300",
    },
  ];

  // GSAP Text Sequence Animation
  useEffect(() => {
    if (typeof window === "undefined" || preloaderActive) return;

    if (shouldReduceMotion) {
      gsap.set(".gsap-fade", { opacity: 1, y: 0 });
      gsap.set(".gsap-reveal", { opacity: 1, y: 0, scale: 1 });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(
      ".gsap-badge",
      { opacity: 0, scale: 0.96 },
      { opacity: 1, scale: 1, duration: 0.4, delay: 0.1 }
    )
      .fromTo(
        ".gsap-title-word",
        { opacity: 0 },
        { opacity: 1, stagger: 0.08, duration: 0.5 },
        "-=0.2"
      )
      .fromTo(
        ".gsap-desc",
        { opacity: 0 },
        { opacity: 1, duration: 0.4 },
        "-=0.2"
      )
      .fromTo(
        ".gsap-cta",
        { opacity: 0 },
        { opacity: 1, stagger: 0.08, duration: 0.4 },
        "-=0.2"
      )
      .fromTo(
        ".gsap-trust",
        { opacity: 0 },
        { opacity: 1, duration: 0.3 },
        "-=0.2"
      )
      .fromTo(
        ".gsap-mockup",
        { opacity: 0, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.5 },
        "-=0.2"
      )
      .fromTo(
        ".gsap-stats",
        { opacity: 0 },
        { opacity: 1, stagger: 0.08, duration: 0.4 },
        "-=0.3"
      );

    return () => {
      tl.kill();
    };
  }, [shouldReduceMotion, preloaderActive]);

  const openModal = useAuthModalStore((state) => state.openModal);

  const handleStartTrial = () => {
    analytics.trackCta("hero_trial", "Start Free Trial", "hero");
    openModal("register");
  };

  const handleBookDemo = () => {
    analytics.trackCta("hero_demo", "Book a Demo", "hero");
    openModal("login");
  };

  return (
    <section
      id="hero"
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="min-h-[95vh] flex flex-col items-center justify-center pt-32 md:pt-36 pb-16 relative overflow-hidden bg-[#FFFFFF] text-slate-900"
    >
      {/* Interactive Cursor Spotlight Glow */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(700px circle at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(124, 58, 237, 0.08), transparent 70%)`,
        }}
      />

      {/* Radiant Top Specular Horizon Light Bar */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-300/50 to-transparent pointer-events-none z-0" />

      {/* Animated Mesh Gradient Background */}
      <AnimatedMeshGradient />

      <div className="max-w-7xl mx-auto px-6 w-full relative z-10 flex flex-col items-center text-center">

        {/* Announcement Badge */}
        <div className="gsap-badge opacity-0 inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 bg-purple-50 border border-purple-200/80 rounded-full text-[10px] sm:text-[11px] font-bold text-[#7C3AED] tracking-wide shadow-sm mb-4 max-w-[92vw]">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7C3AED]" />
          </span>
          <Icon icon="solar:star-shine-bold-duotone" className="text-[#7C3AED] text-xs shrink-0" />
          <span className="truncate">The #1 All-in-One AI Operating System for Event Businesses</span>
        </div>

        {/* Hero Headline & Description */}
        <div className="max-w-4xl flex flex-col items-center text-center">
          <h1 className="text-4xl sm:text-6xl lg:text-[76px] font-extrabold tracking-tight leading-[1.05] font-heading text-balance text-pretty">
            <span className="gsap-title-word inline-block opacity-0 mr-3 bg-clip-text text-transparent bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#475569] drop-shadow-sm">Plan. Automate.</span>
            <span className="gsap-title-word inline-block opacity-0 mr-3 bg-clip-text text-transparent bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#475569] drop-shadow-sm">Scale Events.</span>
            <br className="hidden sm:inline" />
            <span className="gsap-title-word inline-block opacity-0 mt-1 sm:mt-2 w-full text-center">
              <RotatingHeroPhrase />
            </span>
          </h1>

          <p className="gsap-desc opacity-0 text-[#4B5563] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-medium font-sans mt-5 mb-8">
            The complete operating system for independent event coordinators and boutique agencies. Automate WhatsApp triggers, AI run-of-show timelines, mobile offline PWA check-ins, white-label client portals, and milestone invoicing.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3.5 w-full sm:w-auto mb-6 z-20">
          {/* Primary CTA */}
          <LiquidButton
            variant="brand"
            onClick={handleStartTrial}
            className="gsap-cta opacity-0 w-full sm:w-auto flex items-center justify-center gap-2.5 px-9 py-6 rounded-full text-base font-extrabold active:scale-[0.98] group cursor-pointer shadow-xl shadow-purple-500/25"
            size="xl"
          >
            Start 14-Day Free Trial — No Credit Card
            <Icon icon="solar:arrow-right-bold" className="text-lg group-hover:translate-x-1 transition-transform duration-200" />
          </LiquidButton>

          {/* Secondary Soft Link CTA */}
          <button
            onClick={handleBookDemo}
            className="gsap-cta opacity-0 text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1.5 py-1 px-3.5 rounded-full hover:bg-purple-50/80 focus:outline-none"
          >
            <span>Or book a 20-min walkthrough</span>
            <Icon icon="solar:alt-arrow-right-bold-duotone" className="text-sm" />
          </button>
        </div>

        {/* Trust signals */}
        <div className="gsap-trust opacity-0 flex flex-wrap justify-center items-center gap-5 text-[10px] text-zinc-500 font-bold tracking-wide uppercase mb-10">
          {[
            { icon: "solar:shield-check-bold-duotone", label: "SOC 2 Certified", color: "text-emerald-500" },
            { icon: "solar:lock-bold-duotone", label: "Tenant Isolated", color: "text-purple-500" },
            { icon: "solar:check-circle-bold-duotone", label: "GDPR Ready", color: "text-cyan-500" },
            { icon: "solar:server-bold-duotone", label: "24/7 Monitoring", color: "text-amber-500" },
          ].map((t) => (
            <span key={t.label} className="flex items-center gap-1.5">
              <Icon icon={t.icon} className={`${t.color} text-sm`} />
              {t.label}
            </span>
          ))}
        </div>

        {/* Dashboard Floating Mockup & 3D Glass Floating Badges */}
        <div
          className="gsap-mockup opacity-0 w-full max-w-5xl relative"
          style={{ perspective: 1200 }}
        >
          {/* Floating Glass Card 1 (Top Left) */}
          <motion.div
            animate={shouldReduceMotion ? {} : { y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="hidden lg:flex absolute -top-8 -left-10 z-30 p-3.5 rounded-2xl bg-[#0d0d14]/90 border border-purple-500/35 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(168,85,247,0.25)] items-center gap-3 select-none text-left"
          >
            <div className="h-9 w-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
              <Icon icon="solar:calendar-bold-duotone" className="text-lg" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase text-purple-300 tracking-wider block">AI Auto-Scheduler</span>
              <span className="text-[11px] font-bold text-white block">09:00 AM · Sound Check Approved</span>
            </div>
          </motion.div>

          {/* Floating Glass Card 2 (Top Right) */}
          <motion.div
            animate={shouldReduceMotion ? {} : { y: [0, 10, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="hidden lg:flex absolute -top-8 -right-10 z-30 p-3.5 rounded-2xl bg-[#0d0d14]/90 border border-emerald-500/35 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(52,211,153,0.25)] items-center gap-3 select-none text-left"
          >
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0">
              <Icon icon="solar:wallet-bold-duotone" className="text-lg" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider block">Milestone Invoice</span>
              <span className="text-[11px] font-bold text-white block">₹12,50,000 Deposit Cleared ✓</span>
            </div>
          </motion.div>

          {/* Floating Glass Card 3 (Bottom Left) */}
          <motion.div
            animate={shouldReduceMotion ? {} : { y: [0, 10, 0] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="hidden lg:flex absolute -bottom-8 -left-10 z-30 p-3.5 rounded-2xl bg-[#0d0d14]/90 border border-cyan-500/35 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(34,211,238,0.25)] items-center gap-3 select-none text-left"
          >
            <div className="h-9 w-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
              <Icon icon="solar:chat-round-dots-bold-duotone" className="text-lg" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase text-cyan-300 tracking-wider block">WhatsApp Automation</span>
              <span className="text-[11px] font-bold text-white block">RSVP Confirmed & Directions Sent</span>
            </div>
          </motion.div>

          {/* Floating Glass Card 4 (Bottom Right) */}
          <motion.div
            animate={shouldReduceMotion ? {} : { y: [0, -10, 0] }}
            transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className="hidden lg:flex absolute -bottom-8 -right-10 z-30 p-3.5 rounded-2xl bg-[#0d0d14]/90 border border-pink-500/35 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(244,114,182,0.25)] items-center gap-3 select-none text-left"
          >
            <div className="h-9 w-9 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-300 shrink-0">
              <Icon icon="solar:smartphone-bold-duotone" className="text-lg" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase text-pink-300 tracking-wider block">Offline PWA Venue Check-In</span>
              <span className="text-[11px] font-bold text-white block">1,250 Venue Guests Scanned</span>
            </div>
          </motion.div>

          {/* Top light glow for dashboard */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] h-[100px] bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute inset-x-0 -top-4 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent pointer-events-none" />

          {/* Premium Glassmorphic Mockup Container */}
          <motion.div
            style={{
              rotateX: springX,
              rotateY: springY,
              transformStyle: "preserve-3d",
            }}
            className="relative rounded-2xl border border-slate-800 bg-[#0B0F19] p-2 shadow-[0_20px_70px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-300"
          >

            {/* Browser header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-800 bg-slate-900/90 rounded-t-xl">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                <span className="text-[10px] text-slate-400 font-mono ml-2 select-none">admin.eventos.io/dashboard</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 px-2 py-0.5 rounded-md text-[10px] text-slate-300">
                <Icon icon="solar:shield-check-bold-duotone" className="text-cyan-400 text-xs" />
                <span>Tenant Isolation: active</span>
              </div>
            </div>

            {/* Dashboard Content Mockup */}
            <div className="bg-[#0F172A] rounded-b-xl overflow-hidden min-h-[340px] sm:min-h-[420px] aspect-auto sm:aspect-[16/10] relative text-left flex">
              {/* Background grid */}
              <div className="absolute inset-0 bg-[radial-gradient(#334155_1.2px,transparent_1.2px)] [background-size:22px_22px] opacity-25 pointer-events-none" />

              {/* Sidebar Panel */}
              <div className="w-10 sm:w-12 border-r border-slate-800 bg-slate-900/90 backdrop-blur-md flex flex-col items-center py-3 sm:py-4 justify-between relative z-10 shrink-0">
                {/* Top: Brand switcher */}
                <div className="flex flex-col items-center gap-4">
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-black shadow-md shadow-purple-500/20">
                    E
                  </div>

                  {/* Nav Links */}
                  <div className="flex flex-col items-center gap-2.5">
                    {[
                      { icon: "solar:widget-bold-duotone", active: true },
                      { icon: "solar:users-group-rounded-bold-duotone" },
                      { icon: "solar:calendar-bold-duotone" },
                      { icon: "solar:wallet-money-bold-duotone" },
                      { icon: "solar:gallery-bold-duotone" },
                      { icon: "solar:settings-bold-duotone" },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className={`h-7 w-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${item.active
                          ? "bg-purple-600/30 text-purple-300 border border-purple-500/40"
                          : "text-slate-400 hover:text-white"
                          }`}
                      >
                        <Icon icon={item.icon} className="text-xs sm:text-sm" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom: User avatar & status */}
                <div className="relative">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 border border-slate-700 flex items-center justify-center text-[8px] font-extrabold text-white">
                    U
                  </div>
                  <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-emerald-500 border border-slate-900" />
                </div>
              </div>

              {/* Main Content Area */}
              <div className="relative z-10 flex-1 flex flex-col justify-between p-4 sm:p-5 gap-4">
                {/* Mockup Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">Workspace Dashboard</span>
                    <h4 className="text-base font-bold text-white font-heading">Event Command Center</h4>
                  </div>
                  <div className="flex gap-1.5">
                    {["Q", "B", "I"].map((l) => (
                      <span key={l} className="h-7 w-7 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300 text-[10px] font-bold">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Grid stats (frosted glass cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 items-center">
                  {[
                    { title: "Lead Conversion Pipeline", value: "84.2%", delta: "↑ +4.2% vs last month", deltaColor: "text-emerald-400", hoverBorder: "hover:border-purple-500/40" },
                    { title: "Active Event Bookings", value: "142 Projects", delta: "32 Weddings · 110 Corporate", deltaColor: "text-slate-400", hoverBorder: "hover:border-pink-500/40" },
                    { title: "Projected Revenue", value: "₹8.4M", delta: "Invoiced cleared: ₹7.2M", deltaColor: "text-slate-400", valueColor: "text-cyan-400", hoverBorder: "hover:border-cyan-500/40" },
                  ].map((card, i) => (
                    <div key={i} className={`p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md flex flex-col justify-between h-24 transition-colors ${card.hoverBorder} group`}>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{card.title}</span>
                      <div>
                        <span className={`text-xl font-extrabold block ${card.valueColor || "text-white"} font-heading`}>{card.value}</span>
                        <span className={`text-[9px] mt-0.5 block ${card.deltaColor}`}>{card.delta}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notification bar (frosted glass) */}
                <div className="p-2.5 bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-lg flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold text-slate-200">Live Status:</span>
                    <span className="text-slate-300">Quote #QT-2026-041 accepted by client (Sanjay Shah)</span>
                  </div>
                  <span className="text-[9px] text-purple-400 font-bold cursor-pointer hover:underline shrink-0">View Pipeline →</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Statistics count row */}
        <div className="w-full pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`gsap-stats opacity-0 relative group p-6 rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-md overflow-hidden ${stat.borderColor} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10 flex items-center justify-between">
                  <div className="space-y-1.5 text-left">
                    <span className="text-3xl sm:text-4xl font-black text-[#111827] block tracking-tight font-heading">
                      <NumberTicker
                        value={stat.value}
                        prefix={stat.prefix}
                        suffix={stat.suffix}
                        decimals={stat.decimals || 0}
                        duration={1800}
                      />
                    </span>
                    <h5 className="text-xs font-extrabold text-slate-900 tracking-wide uppercase">{stat.label}</h5>
                    <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                      {stat.desc}
                    </p>
                  </div>
                  <div
                    className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover:scale-110 ${stat.badgeBg}`}
                  >
                    <Icon icon={stat.icon} className="text-2xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
