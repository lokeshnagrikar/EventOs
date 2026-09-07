"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Pricing } from "@/components/landing/Pricing";
import { Competitors } from "@/components/landing/Competitors";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { PricingLoader } from "./loading";

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <PricingLoader onComplete={() => setIsLoading(false)} durationMs={2000} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-600 selection:text-white"
      >
        <Navbar />

        <main className="flex-1 pt-24 pb-16 w-full">
          {/* Top Hero Trust Badge Bar */}
          <div className="max-w-7xl mx-auto px-6 pt-6 pb-2 text-center">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200/80 text-purple-800 text-[11px] font-bold uppercase tracking-wider mb-3 shadow-xs"
            >
              <Sparkles size={13} className="text-purple-600" />
              <span>Founders Pricing • Transparent & Risk-Free</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl font-black text-slate-950 font-heading tracking-tight leading-[1.1] max-w-3xl mx-auto"
            >
              One Operating System for Your <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-purple-700 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
                Event Business.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate-600 text-sm sm:text-base font-medium max-w-2xl mx-auto mt-4"
            >
              Win clients faster. Run events smarter. Scale without operational chaos.
            </motion.p>
          </div>

          {/* Master Pricing Section (Volume Slider + 3 ROI Cards + Testimonials + Comparison Matrix + FAQ + 30-day Guarantee) */}
          <Pricing />

          {/* Competitor Benchmarking */}
          <div className="max-w-7xl mx-auto px-6 py-12">
            <Competitors />
          </div>
        </main>

        <Footer />
      </motion.div>
    </>
  );
}
