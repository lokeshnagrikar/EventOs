"use client";

import React from "react";
import { SparklesCore } from "@/components/ui/sparkles";
import { BlurFade } from "@/components/ui/blur-fade";
import { SpotlightCard } from "@/components/ui/spotlight-card";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full bg-[#09090B] text-zinc-100 flex items-center justify-center p-4 sm:p-6 overflow-hidden selection:bg-purple-600/35 selection:text-white">
      {/* Decorative Radial Grid / Dots */}
      <div className="absolute inset-0 bg-[radial-gradient(#1c1917_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-20 pointer-events-none z-0" />
      
      {/* Gradient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-gradient-to-r from-purple-550/10 to-pink-500/10 blur-[100px] sm:blur-[130px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-0 right-10 w-[200px] h-[200px] bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none z-0" />

      {/* Sparkles / Particles */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-20">
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

      {/* Auth Card Container */}
      <div className="w-full max-w-[420px] z-10 relative">
        <BlurFade duration={0.4} delay={0.05} direction="down" offset={10}>
          <SpotlightCard className="bg-white/[0.01] border border-white/[0.08] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.3)] shadow-purple-500/[0.03] backdrop-blur-xl relative overflow-hidden transition-all duration-300">
            {/* Top Accent Gradient Line */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#06B6D4] opacity-90 z-20" />
            
            <div className="p-6 sm:p-8 pt-10 sm:pt-12">
              {children}
            </div>
          </SpotlightCard>
        </BlurFade>
      </div>
    </div>
  );
}
