import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { WaitlistForm } from "@/components/auth/WaitlistForm";
import { EventOsLogo } from "@/components/ui/EventOsLogo";
import { LiquidMetalText } from "@/components/landing/LiquidMetalText";

export const metadata: Metadata = {
  title: "Join EventOS Private Beta | Early Bird Founding Member Access",
  description:
    "Claim your founding spot on EventOS. The all-in-one event management software and CRM built for Indian wedding planners and boutique event agencies.",
  alternates: {
    canonical: "https://www.eventosapp.in/waitlist",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function WaitlistPage() {
  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 font-sans selection:bg-purple-500 selection:text-white relative overflow-hidden">
      {/* Ambient background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 -left-40 w-[400px] h-[400px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-2/3 -right-40 w-[400px] h-[400px] bg-pink-600/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Clean Distraction-Free Header (No Login/Register buttons) */}
      <header className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 cursor-pointer select-none relative z-10 group"
          aria-label="EventOS Home"
        >
          <EventOsLogo size={36} animated={true} interactive={true} />
          <span className="text-base sm:text-lg font-black tracking-tight font-heading inline-flex items-center text-white">
            Event<LiquidMetalText text="OS" variant="purple" />
          </span>
        </Link>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-[11px] sm:text-xs">Private Beta Cohort #1</span>
        </div>
      </header>

      {/* Main Waitlist Content Container */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Glowing Form Card */}
        <div className="relative rounded-3xl bg-zinc-900/70 border border-zinc-800/80 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          {/* Subtle top border accent */}
          <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />

          {/* Render High-Conversion Waitlist Form */}
          <WaitlistForm />
        </div>

        {/* Value Proposition Highlights */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-sm">
            <div className="h-8 w-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-3">
              <Icon icon="solar:chat-round-dots-bold" className="text-base" />
            </div>
            <h4 className="font-bold text-white text-xs sm:text-sm font-heading">WhatsApp-Native</h4>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Send client quotes, payment milestone links, and staff call sheets straight into WhatsApp.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-sm">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3">
              <Icon icon="solar:wallet-money-bold" className="text-base" />
            </div>
            <h4 className="font-bold text-white text-xs sm:text-sm font-heading">Live Profit Margins</h4>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Track vendor disbursements, client receivables, and profit margins per event in real time.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-sm">
            <div className="h-8 w-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-3">
              <Icon icon="solar:crown-star-bold" className="text-base" />
            </div>
            <h4 className="font-bold text-white text-xs sm:text-sm font-heading">Founding Perks</h4>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              1-on-1 walkthrough with Founder Lokesh and grandfathered lifetime early-bird rates.
            </p>
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="mt-12 text-center text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} EventOS Technologies. Built for wedding & corporate event leaders.</p>
        </div>
      </main>
    </div>
  );
}
