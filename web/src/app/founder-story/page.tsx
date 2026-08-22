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
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-600 selection:text-white">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 max-w-4xl mx-auto px-6 space-y-12 w-full">
        {/* Header Badge */}
        <div className="text-center space-y-4">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-black uppercase tracking-widest text-purple-700"
          >
            <Heart size={14} className="text-purple-600 fill-purple-600" />
            Founder's Note
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 font-heading leading-tight"
          >
            Why I Built EventOS: <br />
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
              From 0 to SaaS in 6 Months.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-slate-600 font-medium max-w-xl mx-auto"
          >
            A 2-minute read by Lokesh Nagrikar on solving the chaotic, late-night workflow for event planners across India.
          </motion.p>
        </div>

        {/* Founder Card & Story Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-12 shadow-sm space-y-8 text-slate-800 leading-relaxed font-medium text-sm sm:text-base"
        >
          {/* Founder Bio Header */}
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 p-0.5 shadow-md shrink-0">
              <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-white text-xl font-black font-mono">
                LN
              </div>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 font-heading">Lokesh Nagrikar</h3>
              <p className="text-xs font-bold text-purple-600">Creator & Lead Architect, EventOS</p>
            </div>
          </div>

          {/* Story Paragraphs */}
          <div className="space-y-5 text-slate-700">
            <p>
              Six months ago, I was sitting with a wedding planner friend who was managing 4 weddings simultaneously in December. Her laptop had 24 tabs open: Excel sheets for budgets, WhatsApp Web with 50+ unread client messages, Google Drive links for photogs, and manual Word documents for proposals.
            </p>

            <p>
              She told me: <em>"Lokesh, I spend 70% of my week doing manual admin work and chasing clients for milestone payments instead of actually designing dream events."</em>
            </p>

            <p>
              That was the spark for <strong>EventOS</strong>. I realized that while Western software like HoneyBook or HubSpot exist, none of them were built for the real realities of Indian event agencies — 18% GST auto-invoicing, WhatsApp run-of-show alerts, zero-fee UPI QR payments, and instant multi-tenant quotes.
            </p>

            <p>
              I built the first version of EventOS in 6 months — working day and night to craft a system that lets planners send itemized PDF proposals in 45 seconds and automate client follow-ups. Today, over <strong>200+ event agencies</strong> are part of our founding waitlist community!
            </p>
          </div>

          {/* Key Metrics / Highlights Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 text-center space-y-1">
              <Users size={18} className="text-purple-600 mx-auto" />
              <span className="text-xl font-extrabold text-slate-900 block font-heading">200+</span>
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Founding Waitlist</span>
            </div>
            <div className="p-4 rounded-2xl bg-pink-50 border border-pink-100 text-center space-y-1">
              <Zap size={18} className="text-pink-600 mx-auto" />
              <span className="text-xl font-extrabold text-slate-900 block font-heading">45 sec</span>
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Quote Generation</span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-center space-y-1">
              <ShieldCheck size={18} className="text-emerald-600 mx-auto" />
              <span className="text-xl font-extrabold text-slate-900 block font-heading">50% Off</span>
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Lifetime Price Lock</span>
            </div>
          </div>

          {/* Build in Public Instagram Link */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <Instagram size={22} className="text-pink-600 shrink-0" />
              <div>
                <span className="text-xs font-black text-slate-900 block">Follow the Build-in-Public Journey</span>
                <span className="text-[11px] text-slate-500 font-semibold">Behind-the-scenes engineering reels & daily updates</span>
              </div>
            </div>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white border border-slate-200 text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-100 transition shrink-0"
            >
              Watch Reels →
            </a>
          </div>

          {/* Founding Member Call to Action */}
          <div className="pt-6 border-t border-slate-100 text-center space-y-4">
            <h4 className="text-lg font-black text-slate-900 font-heading">
              Ready to automate your event operations?
            </h4>
            <p className="text-xs text-slate-600 font-medium max-w-md mx-auto">
              Join our Founding Member Cohort today and lock in 50% off your Professional Plan forever.
            </p>
            <button
              onClick={handleJoinFoundingMembers}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white rounded-full text-sm font-extrabold shadow-lg shadow-purple-500/25 hover:brightness-110 active:scale-[0.98] transition cursor-pointer"
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
