"use client";

import React from "react";
import { SparklesCore } from "@/components/ui/sparkles";
import { AuroraBackground } from "@/components/ui/aurora-background";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuroraBackground className="min-h-screen w-full bg-[#060813] text-zinc-100 flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-hidden selection:bg-purple-600/35 selection:text-white">
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

      {/* Centered Children Container */}
      <div className="w-full flex items-center justify-center z-10 relative my-auto py-4 sm:py-8">
        {children}
      </div>
    </AuroraBackground>
  );
}
