"use client";

import React from "react";
import Link from "next/link";
import { EventOsLogo } from "@/components/ui/EventOsLogo";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#060813] text-zinc-100 flex flex-col justify-between relative overflow-x-hidden selection:bg-purple-600/35 selection:text-white">
      {/* 1. Static Ambient Glows (No movement, calm & elegant) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[380px] bg-gradient-to-b from-purple-600/12 via-indigo-600/6 to-transparent blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-[15%] w-[550px] h-[280px] bg-gradient-to-t from-pink-600/8 via-purple-900/5 to-transparent blur-[130px] pointer-events-none -z-10" />

      {/* 2. Static Geometric Dot-Grid (Matches EventOS Landing Page & App) */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px] opacity-60 pointer-events-none -z-10" />

      {/* 3. Top Navigation Header (Unifies auth screen with EventOS App) */}
      <header className="w-full border-b border-white/[0.06] bg-[#060813]/85 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 p-[1.5px] shadow-[0_2px_12px_rgba(168,85,247,0.3)] shrink-0 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#080c18] rounded-[10px] flex items-center justify-center">
                <EventOsLogo size={20} interactive={false} showGlow={false} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-white font-sans">
                Event<span className="text-purple-400">OS</span>
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/25 text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider">
                Cloud
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 pr-3 border-r border-white/[0.08]">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Secure Authentication</span>
            </div>
            <Link
              href="/"
              className="text-xs font-semibold text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.06] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Back to Home</span>
              <ArrowUpRight size={13} className="text-zinc-400" />
            </Link>
          </div>
        </div>
      </header>

      {/* 4. Centered Main Content Area */}
      <main className="w-full flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 z-10 relative my-auto">
        {children}
      </main>

      {/* 5. Minimal Footer */}
      <footer className="w-full border-t border-white/[0.05] py-4 px-4 text-center select-none z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-500">
          <span>&copy; {new Date().getFullYear()} EventOS Technologies Inc. All rights reserved.</span>
          <div className="flex items-center gap-4 text-zinc-400">
            <Link href="/privacy" className="hover:text-zinc-200 transition-colors">Privacy Policy</Link>
            <span>&bull;</span>
            <Link href="/terms" className="hover:text-zinc-200 transition-colors">Terms of Service</Link>
            <span>&bull;</span>
            <Link href="/security" className="hover:text-zinc-200 transition-colors">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
