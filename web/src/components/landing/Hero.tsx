"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { AuroraText } from "@/components/ui/aurora-text";
import { NumberTicker } from "@/components/ui/number-ticker";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { analytics } from "@/lib/analytics";
import { gsap } from "gsap";
import { useAuthModalStore } from "@/store/authModalStore";

export function Hero() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);

  const stats = [
    {
      value: 10000,
      suffix: "+",
      label: "Events Managed",
      desc: "Weddings, galas & corporate events",
      icon: "solar:users-group-rounded-bold-duotone",
      iconColor: "#8B5CF6",
      bg: "from-purple-500/10 to-transparent",
    },
    {
      value: 500,
      prefix: "₹",
      suffix: "Cr+",
      label: "Revenue Processed",
      desc: "Across all tenant workspaces",
      icon: "solar:chart-bold-duotone",
      iconColor: "#EC4899",
      bg: "from-pink-500/10 to-transparent",
    },
    {
      value: 98,
      suffix: "%",
      label: "Client Satisfaction",
      desc: "Outstanding NPS index globally",
      icon: "solar:star-bold-duotone",
      iconColor: "#06B6D4",
      bg: "from-cyan-500/10 to-transparent",
    },
  ];

  // GSAP Text Sequence Animation
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (shouldReduceMotion) {
      gsap.set(".gsap-fade", { opacity: 1, y: 0 });
      gsap.set(".gsap-reveal", { opacity: 1, y: 0, scale: 1 });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(
      ".gsap-badge",
      { opacity: 0, scale: 0.9, y: -10 },
      { opacity: 1, scale: 1, y: 0, duration: 0.5, delay: 0.2 }
    )
      .fromTo(
        ".gsap-title-word",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.12, duration: 0.6 },
        "-=0.25"
      )
      .fromTo(
        ".gsap-desc",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5 },
        "-=0.3"
      )
      .fromTo(
        ".gsap-cta",
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.45 },
        "-=0.25"
      )
      .fromTo(
        ".gsap-trust",
        { opacity: 0 },
        { opacity: 1, duration: 0.4 },
        "-=0.2"
      )
      .fromTo(
        ".gsap-mockup",
        { opacity: 0, scale: 0.97, y: 25 },
        { opacity: 1, scale: 1, y: 0, duration: 0.7 },
        "-=0.3"
      )
      .fromTo(
        ".gsap-stats",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.5 },
        "-=0.4"
      );

    return () => {
      tl.kill();
    };
  }, [shouldReduceMotion]);

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
    <AuroraBackground
      id="hero"
      className="min-h-[95vh] flex flex-col items-center justify-center pt-32 pb-16 relative"
    >
      <AnimatedGridPattern
        numSquares={40}
        maxOpacity={0.08}
        duration={3}
        repeatDelay={1}
        className="[mask-image:radial-gradient(800px_circle_at_center,white,transparent)] stroke-zinc-800/40 fill-zinc-800/40"
      />
      <div className="max-w-7xl mx-auto px-6 w-full relative z-10 flex flex-col items-center text-center space-y-8">
        
        {/* Announcement Badge */}
        <div className="gsap-badge opacity-0 inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/[0.02] border border-white/[0.08] backdrop-blur-md rounded-full text-[11px] font-bold text-zinc-300 tracking-wide shadow-xl">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
          </span>
          <Icon icon="solar:star-shine-bold-duotone" className="text-purple-400 text-xs" />
          <span>The Operating System for Event Businesses</span>
        </div>

        {/* Hero Headline */}
        <div className="space-y-5 max-w-4xl">
          <h1 className="text-3xl sm:text-6xl lg:text-[72px] font-extrabold tracking-tight leading-[1.08] text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-100 to-zinc-400 font-heading text-balance text-pretty">
            <span className="gsap-title-word inline-block opacity-0 mr-3">Run Events.</span>
            <span className="gsap-title-word inline-block opacity-0 mr-3">Manage Clients.</span>
            <br className="hidden sm:inline" />
            <span className="gsap-title-word inline-block opacity-0">
              <AuroraText className="font-extrabold" speed={8}>
                Deliver Memories.
              </AuroraText>
            </span>
          </h1>

          <p className="gsap-desc opacity-0 text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-medium font-sans">
            Manage leads, bookings, proposals, invoicing, galleries, payments, and client communication in one place. Engineered for event planners, wedding agencies, and production teams.
          </p>
        </div>

        {/* Hero Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Button
            onClick={handleStartTrial}
            className="gsap-cta opacity-0 w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-6 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] hover:opacity-95 text-white rounded-xl text-sm font-bold shadow-xl shadow-purple-600/20 group transition-all duration-200 active:scale-[0.98]"
          >
            Start Free Trial
            <Icon icon="solar:arrow-right-bold" className="text-base group-hover:translate-x-1 transition-transform duration-200" />
          </Button>
          <Button
            variant="outline"
            onClick={handleBookDemo}
            className="gsap-cta opacity-0 w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-6 border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-zinc-300 hover:text-white rounded-xl text-sm font-bold transition-all duration-200"
          >
            <Icon icon="solar:play-circle-bold-duotone" className="text-cyan-400 text-base" />
            Book a Demo
          </Button>
        </div>

        {/* Trust signals */}
        <div className="gsap-trust opacity-0 flex flex-wrap justify-center items-center gap-5 text-[10px] text-zinc-600 font-bold tracking-wide uppercase">
          {[
            { icon: "solar:shield-check-bold-duotone", label: "SSL Encrypted", color: "text-emerald-500" },
            { icon: "solar:lock-bold-duotone", label: "Tenant Isolated", color: "text-purple-500" },
            { icon: "solar:server-bold-duotone", label: "99.9% Uptime SLA", color: "text-cyan-500" },
            { icon: "solar:card-bold-duotone", label: "No Credit Card Required", color: "text-pink-500" },
          ].map((t) => (
            <span key={t.label} className="flex items-center gap-1.5">
              <Icon icon={t.icon} className={`${t.color} text-sm`} />
              {t.label}
            </span>
          ))}
        </div>

        {/* Dashboard Floating Mockup */}
        <div className="gsap-mockup opacity-0 pt-6 w-full max-w-5xl relative">
          {/* Top light glow for dashboard */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] h-[100px] bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute inset-x-0 -top-4 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent pointer-events-none" />

          {/* Premium Glassmorphic Mockup Container */}
          <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-2 shadow-[0_0_80px_rgba(139,92,246,0.12)] backdrop-blur-xl">
            
            {/* Browser header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.08] bg-white/[0.02] rounded-t-xl">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="text-[10px] text-zinc-500 font-mono ml-2 select-none">admin.eventos.io/dashboard</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.08] px-2 py-0.5 rounded-md text-[10px] text-zinc-400">
                <Icon icon="solar:shield-check-bold-duotone" className="text-cyan-400 text-xs" />
                <span>Tenant Isolation: active</span>
              </div>
            </div>

            {/* Dashboard Content Mockup */}
            <div className="bg-transparent rounded-b-xl overflow-hidden aspect-[16/10] relative p-6 text-left">
              <div className="absolute inset-0 bg-[radial-gradient(#1c1917_1.2px,transparent_1.2px)] [background-size:22px_22px] opacity-10 pointer-events-none" />

              <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                
                {/* Mockup Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Workspace Dashboard</span>
                    <h4 className="text-lg font-bold text-white font-heading">Event Command Center</h4>
                  </div>
                  <div className="flex gap-2">
                    {["Q", "B", "I"].map((l) => (
                      <span key={l} className="h-8 w-8 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-zinc-400 text-xs font-bold">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Grid stats (frosted glass cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 items-center">
                  {[
                    { title: "Lead Conversion Pipeline", value: "84.2%", delta: "↑ +4.2% vs last month", deltaColor: "text-emerald-400", hoverBorder: "hover:border-purple-500/30" },
                    { title: "Active Event Bookings", value: "142 Projects", delta: "32 Weddings · 110 Corporate", deltaColor: "text-zinc-400", hoverBorder: "hover:border-pink-500/30" },
                    { title: "Projected Revenue", value: "₹8.4M", delta: "Invoiced cleared: ₹7.2M", deltaColor: "text-zinc-500", valueColor: "text-[#06B6D4]", hoverBorder: "hover:border-cyan-500/30" },
                  ].map((card, i) => (
                    <div key={i} className={`p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-md flex flex-col justify-between h-28 transition-colors ${card.hoverBorder} group`}>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{card.title}</span>
                      <div>
                        <span className={`text-2xl font-extrabold block ${card.valueColor || "text-white"} font-heading`}>{card.value}</span>
                        <span className={`text-[10px] mt-1 block ${card.deltaColor}`}>{card.delta}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notification bar (frosted glass) */}
                <div className="p-3 bg-white/[0.01] border border-white/[0.04] backdrop-blur-md rounded-lg flex items-center justify-between text-xs text-zinc-450">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold text-zinc-300">Live Status:</span>
                    <span className="text-zinc-400">Quote #QT-2026-041 accepted by client (Sanjay Shah)</span>
                  </div>
                  <span className="text-[10px] text-purple-400 font-bold cursor-pointer hover:underline shrink-0">View Pipeline →</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics count row */}
        <div className="w-full pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
            {stats.map((stat, idx) => (
              <div
                key={stat.label}
                className="gsap-stats opacity-0 relative group p-6 rounded-2xl border border-white/[0.06] bg-white/[0.01] backdrop-blur-md overflow-hidden hover:border-white/[0.1] hover:bg-white/[0.03] transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-400`} />
                <div className="relative z-10 flex items-center justify-between">
                  <div className="space-y-1.5 text-left">
                    <span className="text-3xl font-extrabold text-white block tracking-tight font-heading">
                      <NumberTicker
                        value={stat.value}
                        prefix={stat.prefix}
                        suffix={stat.suffix}
                        duration={1800}
                      />
                    </span>
                    <h5 className="text-xs font-bold text-zinc-300 tracking-wide uppercase">{stat.label}</h5>
                    <p className="text-[11px] text-zinc-500 font-medium">{stat.desc}</p>
                  </div>
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${stat.iconColor}18`, border: `1px solid ${stat.iconColor}30` }}
                  >
                    <Icon icon={stat.icon} style={{ color: stat.iconColor }} className="text-2xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AuroraBackground>
  );
}
