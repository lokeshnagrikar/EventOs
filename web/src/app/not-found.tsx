"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Home, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-[#09090B] text-zinc-100 flex items-center justify-center p-6 overflow-hidden relative selection:bg-purple-600/35 selection:text-white font-sans">
      {/* Background Radial & Grid Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-950/15 blur-[140px] rounded-full pointer-events-none z-0" />

      <div className="w-full max-w-md z-10 relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-zinc-950/60 border border-purple-500/25 rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.8),0_0_40px_rgba(139,92,246,0.1)] backdrop-blur-2xl p-8 relative overflow-hidden text-center space-y-6"
        >
          {/* Top Line Accent */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500" />

          {/* SVG Vector Illustration for 404 */}
          <div className="relative flex items-center justify-center mx-auto my-2">
            <svg className="w-32 h-32" viewBox="0 0 140 140" fill="none">
              <circle cx="70" cy="70" r="56" fill="url(#nf_bg)" fillOpacity="0.12" stroke="#A855F7" strokeWidth="1.5" strokeDasharray="4 4" />
              {/* Lost Compass Dial */}
              <circle cx="70" cy="70" r="36" fill="#18181B" stroke="#EC4899" strokeWidth="2" />
              <path d="M70 44L77 63L70 96L63 77L70 44Z" fill="url(#pointer_grad)" />
              <circle cx="70" cy="70" r="6" fill="#38BDF8" />
              {/* Orbiting Satellite Dots */}
              <circle cx="108" cy="46" r="3.5" fill="#C084FC" />
              <circle cx="32" cy="94" r="3" fill="#F472B6" />
              <defs>
                <radialGradient id="nf_bg" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(70 70) scale(56)">
                  <stop stopColor="#C084FC" />
                  <stop offset="1" stopColor="#09090B" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="pointer_grad" x1="70" y1="44" x2="70" y2="96" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#EC4899" />
                  <stop offset="1" stopColor="#A855F7" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 inline-block font-mono">
              HTTP 404 • Resource Missing
            </span>
            <h1 className="text-2xl font-black tracking-tight text-white font-heading">
              Page Not Found
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto font-semibold">
              The requested URL does not exist or has been relocated to another workspace endpoint.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2 border-t border-zinc-900">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-purple-500/20 active:scale-95 cursor-pointer"
            >
              <Home size={14} />
              <span>Go to Command Dashboard</span>
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 rounded-xl text-xs font-extrabold transition-all active:scale-95 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to EventOS Home</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
