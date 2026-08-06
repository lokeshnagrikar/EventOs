"use client";

import React from "react";
import { SparklesCore } from "@/components/ui/sparkles";
import { BlurFade } from "@/components/ui/blur-fade";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Sparkles, ShieldCheck, Zap, Users, FileText } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full bg-[#09090B] text-zinc-100 flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-hidden selection:bg-purple-600/35 selection:text-white">
      {/* Decorative Radial Grid / Dots */}
      <div className="absolute inset-0 bg-[radial-gradient(#1c1917_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-20 pointer-events-none z-0" />
      
      {/* Gradient Glows */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-gradient-to-r from-purple-600/15 via-pink-500/10 to-cyan-500/10 blur-[130px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 right-10 w-[300px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Sparkles / Particles */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-25">
        <SparklesCore
          id="tsparticlesauth"
          background="transparent"
          minSize={0.6}
          maxSize={1.8}
          particleDensity={25}
          particleColor="#8B5CF6"
          className="w-full h-full"
        />
      </div>

      {/* Main Split-Screen Container */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center z-10 relative my-auto">
        
        {/* LEFT COLUMN: Auth Form (Col-span 5/6) */}
        <div className="lg:col-span-6 xl:col-span-5 w-full mx-auto max-w-[440px] lg:max-w-none">
          <BlurFade duration={0.4} delay={0.05} direction="down" offset={10}>
            {/* Top Brand Logo & Header */}
            <div className="flex items-center justify-between mb-6">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 p-[1px] shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
                  <div className="w-full h-full bg-[#09090B] rounded-[11px] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                </div>
                <div>
                  <span className="text-lg font-bold tracking-tight text-white font-mono">EventOS</span>
                  <span className="text-[10px] uppercase tracking-widest text-purple-400 block -mt-1 font-semibold">Enterprise</span>
                </div>
              </Link>
              
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                API Online (12ms)
              </div>
            </div>

            <SpotlightCard className="bg-white/[0.015] border border-white/[0.08] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.4)] shadow-purple-500/[0.03] backdrop-blur-xl relative overflow-hidden transition-all duration-300">
              {/* Top Accent Gradient Line */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#06B6D4] opacity-90 z-20" />
              
              <div className="p-5 sm:p-7 pt-7 sm:pt-8">
                {children}
              </div>
            </SpotlightCard>

            {/* Bottom Security Trust Signals */}
            <div className="mt-5 flex items-center justify-between text-[11px] text-zinc-500 px-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>2048-Bit RSA Encrypted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-pink-400" />
                <span>Bank-Grade SSL</span>
              </div>
            </div>
          </BlurFade>
        </div>

        {/* RIGHT COLUMN: Live Interactive Product Preview (Col-span 6/7) */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-center gap-6 border border-white/[0.08] bg-white/[0.01] rounded-3xl p-8 lg:p-10 backdrop-blur-2xl relative overflow-hidden shadow-2xl shadow-purple-950/20">
          
          {/* Subtle Ambient Background Gradient */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/10 blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-pink-500/10 blur-[100px] pointer-events-none" />

          {/* Header Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-medium text-purple-300 w-fit">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>The Command Center for Event Agencies</span>
          </div>

          {/* Headline & Value Proposition */}
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white leading-tight">
              Run leads, 60s quotes, and live stage cue sheets on one platform.
            </h2>
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
              Join 120+ event management agencies, wedding producers, and concert managers scaling profit margins with EventOS.
            </p>
          </div>

          {/* Live Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 my-1">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                Quotes Today
              </div>
              <div className="text-lg font-bold text-white font-mono mt-1">₹12,30,150</div>
              <div className="text-[10px] text-emerald-400 font-medium mt-0.5">+42.4% Net Margin</div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-pink-400" />
                Export Speed
              </div>
              <div className="text-lg font-bold text-white font-mono mt-1">58 Seconds</div>
              <div className="text-[10px] text-purple-400 font-medium mt-0.5">1-Click PDF & UPI</div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Active Teams
              </div>
              <div className="text-lg font-bold text-white font-mono mt-1">120+ Agencies</div>
              <div className="text-[10px] text-cyan-400 font-medium mt-0.5">RBAC Security</div>
            </div>
          </div>

          {/* Interactive Quote Calculator Preview Widget */}
          <div className="p-5 rounded-2xl bg-zinc-950/80 border border-white/10 relative shadow-inner">
            <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-white/5 pb-3 mb-3">
              <div className="flex items-center gap-2 font-mono text-zinc-200">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                Royal Gala & Reception 2026
              </div>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px]">350 Guests</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-zinc-300 py-1 border-b border-white/[0.03]">
                <span>3D Architectural Stage & Floral Backdrop</span>
                <span className="font-mono text-white font-medium">₹2,55,000</span>
              </div>
              <div className="flex justify-between items-center text-zinc-300 py-1 border-b border-white/[0.03]">
                <span>Concert Line-Array Speakers & Subwoofers</span>
                <span className="font-mono text-white font-medium">₹45,000</span>
              </div>
              <div className="flex justify-between items-center text-zinc-300 py-1">
                <span>P2.5 Curved Ultra-HD LED Wall (20×10 ft)</span>
                <span className="font-mono text-white font-medium">₹60,000</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-400">Total Proposal Value (with 18% GST)</span>
              <span className="text-sm font-mono text-purple-300 font-bold">₹12,30,150</span>
            </div>
          </div>

          {/* Social Proof Card */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-[#09090b]">
                RG
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-[#09090b]">
                WE
              </div>
            </div>
            <div className="text-xs">
              <p className="text-zinc-300 font-medium italic">
                &ldquo;Saved our agency 15+ hours on our last destination wedding gala proposal.&rdquo;
              </p>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                — Founder @ Royal Gala Events
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
