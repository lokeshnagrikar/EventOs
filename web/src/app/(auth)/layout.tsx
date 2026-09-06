"use client";

import React from "react";
import { SparklesCore } from "@/components/ui/sparkles";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { AuroraBackground } from "@/components/ui/aurora-background";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuroraBackground className="min-h-screen w-full bg-[#FAF9F6]/95 dark:bg-[#07090F]/80 text-zinc-100 flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-hidden selection:bg-purple-600/35 selection:text-white">
      {/* Liquid Glass Orb 1 */}
      <div className="absolute top-[10%] left-[15%] w-[450px] h-[450px] bg-gradient-to-tr from-[#7C3AED]/40 via-[#EC4899]/30 to-cyan-500/25 blur-[100px] rounded-full pointer-events-none animate-pulse duration-[8000ms]" />
      {/* Liquid Glass Orb 2 */}
      <div className="absolute bottom-[10%] right-[15%] w-[500px] h-[500px] bg-gradient-to-br from-indigo-600/35 via-[#9333EA]/35 to-pink-500/25 blur-[110px] rounded-full pointer-events-none animate-pulse duration-[10000ms]" />

      {/* Decorative Glass Mesh Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(124,58,237,0.15)_1px,transparent_1px)] [background-size:32px_32px] opacity-40 pointer-events-none z-0" />

      {/* Sparkles / Particles */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-30">
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

      {/* Centered Single Card Container */}
      <div className="w-full max-w-[440px] z-10 relative my-auto animate-in fade-in zoom-in-95 duration-300">
        <SpotlightCard className="bg-[#0e0e12]/90 border border-white/10 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.7)] backdrop-blur-2xl relative overflow-hidden transition-all duration-300">
          {/* Top Accent Gradient Line */}
          <div className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#EC4899] z-20" />
          <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none z-20" />
          
          <div className="p-6 sm:p-7">
            {children}
          </div>
        </SpotlightCard>
      </div>
    </AuroraBackground>
  );
}
