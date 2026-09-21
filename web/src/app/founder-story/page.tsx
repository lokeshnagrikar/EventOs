"use client";

import React from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Heart, Sparkles, Instagram, ArrowRight, ShieldCheck, Zap, Users } from "lucide-react";
import { useAuthModalStore } from "@/store/authModalStore";

export default function FounderStoryPage() {
  const openModal = useAuthModalStore((state) => state.openModal);

  const handleJoinFoundingMembers = () => {
    openModal("register");
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-600 selection:text-white">
      {/* Liquid background glow effects */}
      <div className="absolute top-[8%] left-[12%] w-[450px] h-[450px] bg-purple-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] w-[500px] h-[500px] bg-pink-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(124,58,237,0.1)_1px,transparent_1px)] [background-size:32px_32px] opacity-25 pointer-events-none" />

      <Navbar />

      <main className="flex-1 pt-32 pb-24 max-w-4xl mx-auto px-4 sm:px-6 space-y-12 w-full relative z-10">
        {/* Header Badge */}
        <div className="text-center space-y-4">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-xs font-bold uppercase tracking-widest text-purple-400"
          >
            <Heart size={14} className="text-purple-400 fill-purple-400" />
            Founder's Note
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight"
          >
            Why I Built EventOS: <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              From 0 to SaaS in 6 Months.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-slate-400 font-medium max-w-xl mx-auto leading-relaxed"
          >
            A 2-minute read by Lokesh Nagrikar on solving the chaotic, late-night workflow for event planners across India.
          </motion.p>
        </div>

        {/* Founder Card & Story Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#101524] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 text-slate-300 leading-relaxed font-normal text-sm sm:text-base backdrop-blur-md"
        >
          {/* Founder Bio Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0 group/photo cursor-pointer">
                <img
                  src="/founder-profile/lokesh-nagrikar.png"
                  alt="Lokesh Nagrikar - Creator & Lead Architect, EventOS"
                  className="h-16 w-16 rounded-full object-cover border-2 border-purple-500/50 shadow-md transition-all duration-300 group-hover/photo:scale-105 group-hover/photo:border-purple-400"
                />
                <span className="absolute bottom-0.5 right-0.5 flex h-4 w-4 items-center justify-center" title="Online · Building EventOS">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border-2 border-[#101524]" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">Lokesh Nagrikar</h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Online</span>
                  </span>
                </div>
                <p className="text-xs font-semibold text-purple-400">Solo Founder & Lead Architect • Nagpur, India</p>
              </div>
            </div>

            <motion.a
              href="https://www.instagram.com/solo.founder.ai/"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md shadow-pink-500/20 overflow-hidden group/insta cursor-pointer transition-shadow hover:shadow-lg hover:shadow-pink-500/30 w-fit"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] transition-all duration-300 group-hover/insta:opacity-95" />
              <span className="relative z-10 flex items-center gap-1.5">
                <Instagram size={14} />
                <span>@solo.founder.ai on Instagram</span>
              </span>
            </motion.a>
          </div>

          {/* Story Paragraphs */}
          <div className="space-y-5 text-slate-300">
            <p>
              Six months ago, I was sitting with a wedding planner friend who was managing 4 weddings simultaneously in December. Her laptop had 24 tabs open: Excel sheets for budgets, WhatsApp Web with 50+ unread client messages, Google Drive links for photogs, and manual Word documents for proposals.
            </p>

            <p className="border-l-2 border-purple-500 pl-4 italic text-purple-200">
              "Lokesh, I spend 70% of my week doing manual admin work and chasing clients for milestone payments instead of actually designing dream events."
            </p>

            <p>
              That was the spark for <strong className="text-white">EventOS</strong>. I realized that while Western software like HoneyBook or HubSpot exist, none of them were built for the real realities of Indian event agencies — 18% GST auto-invoicing, WhatsApp run-of-show alerts, zero-fee UPI QR payments, and instant multi-tenant quotes.
            </p>

            <p>
              I built the first version of EventOS in 6 months — working day and night to craft a system that lets planners send itemized PDF proposals in 45 seconds and automate client follow-ups. We are now accepting our first cohort of <strong className="text-white">25 founding agencies</strong> into our private beta community!
            </p>
          </div>

          {/* Key Metrics / Highlights Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4.5 rounded-2xl bg-[#0B0F19] border border-white/10 text-center space-y-1">
              <Users size={20} className="text-purple-400 mx-auto" />
              <span className="text-2xl font-extrabold text-white block">25 Slots</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Founding Beta Cohort</span>
            </div>
            <div className="p-4.5 rounded-2xl bg-[#0B0F19] border border-white/10 text-center space-y-1">
              <Zap size={20} className="text-pink-400 mx-auto" />
              <span className="text-2xl font-extrabold text-white block">45 sec</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Quote Generation</span>
            </div>
            <div className="p-4.5 rounded-2xl bg-[#0B0F19] border border-white/10 text-center space-y-1">
              <ShieldCheck size={20} className="text-emerald-400 mx-auto" />
              <span className="text-2xl font-extrabold text-white block">50% Off</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Lifetime Price Lock</span>
            </div>
          </div>

          {/* Build in Public Instagram Link */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-pink-950/30 to-indigo-950/40 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-center sm:text-left">
              <div className="h-11 w-11 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
                <Instagram size={22} />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">Follow the Build-in-Public Journey on Instagram</span>
                <span className="text-xs text-slate-400 font-medium">Daily engineering reels, feature demos & founder behind-the-scenes (<strong className="text-pink-400 font-bold">@solo.founder.ai</strong>)</span>
              </div>
            </div>
            <a
              href="https://www.instagram.com/solo.founder.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold transition shadow-md shrink-0 cursor-pointer"
            >
              Follow @solo.founder.ai →
            </a>
          </div>

          {/* Founding Member Call to Action */}
          <div className="pt-6 border-t border-white/10 text-center space-y-4">
            <h4 className="text-lg font-bold text-white">
              Ready to automate your event operations?
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-md mx-auto">
              Join our Founding Member Cohort today and lock in 50% off your Professional Plan forever.
            </p>
            <button
              onClick={handleJoinFoundingMembers}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:via-pink-500 hover:to-indigo-500 text-white rounded-full text-sm font-bold shadow-lg shadow-purple-500/25 active:scale-[0.98] transition cursor-pointer"
            >
              <span>Join Founding Members (50% Off)</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
