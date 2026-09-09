"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, HelpCircle } from "lucide-react";
import { useToastStore } from "@/lib/toastStore";

export default function ContactPage() {
  const addToast = useToastStore((state) => state.addToast);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMountedAt] = useState<number>(() => Date.now());

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Bot Check 1: Honeypot trap (must be empty)
    const honeypot = formData.get("hp_website") as string;
    if (honeypot) {
      // Silently discard automated bot spam
      form.reset();
      return;
    }

    // Bot Check 2: Submission speed (humans take at least 1.5s to read & fill)
    if (Date.now() - formMountedAt < 1200) {
      addToast("Automated submission detected. Please try again.", "error");
      return;
    }

    const email = (formData.get("email") as string || "").trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      addToast("Please provide a valid work email address.", "error");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      addToast("Sales Inbound Request Logged! We will contact you in 2 hours. 📞", "success");
      form.reset();
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-650 selection:text-white">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 max-w-7xl mx-auto px-6 space-y-20 w-full">
        {/* Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent"
          >
            Connect with Sales
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none"
          >
            Let's Customize Your EventOS Workspace.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base text-zinc-400 font-semibold"
          >
            Have complex migration requests, multi-tenant inquiries, or custom branding requirements? Submit details below.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Info Side */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 border border-zinc-850 bg-zinc-950/20 backdrop-blur rounded-2xl space-y-4">
              <h3 className="text-xs font-black uppercase text-zinc-300">Corporate Channels</h3>
              <ul className="space-y-4 text-xs font-semibold text-zinc-450">
                <li className="flex items-center gap-3">
                  <Mail size={13} className="text-purple-400" />
                  <span>sales@eventos.agency</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={13} className="text-purple-400" />
                  <span>+1 (800) 555-EVNT (Demo inquiries)</span>
                </li>
                <li className="flex items-center gap-3">
                  <MapPin size={13} className="text-purple-400" />
                  <span>Bengaluru Tech Park, India / Delaware, US</span>
                </li>
              </ul>
            </div>

            <div className="p-6 border border-zinc-850 bg-[#121214]/10 rounded-2xl space-y-2">
              <h4 className="text-xs font-black text-white flex items-center gap-2">
                <HelpCircle size={13} className="text-purple-400" />
                Live Chat Support Available?
              </h4>
              <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed">
                Yes. Active subscribers on Professional, Business, and Enterprise tiers have 24/7 direct access to live chat coordinators from the workspace dashboard settings panel.
              </p>
            </div>
          </div>

          {/* Form Side */}
          <div className="lg:col-span-2 p-8 border border-zinc-850 bg-[#121214]/20 backdrop-blur rounded-2xl select-none">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              {/* Anti-Spam Honeypot (Invisible to humans, irresistible to bot scrapers) */}
              <input
                type="text"
                name="hp_website"
                style={{ display: "none", position: "absolute", left: "-9999px" }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Full Name</label>
                <input required name="name" type="text" className="w-full bg-zinc-950 border border-zinc-850 px-3 py-2 rounded-xl text-white focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Work Email Address</label>
                <input required name="email" type="email" className="w-full bg-zinc-950 border border-zinc-850 px-3 py-2 rounded-xl text-white focus:outline-none" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Company Event Sector</label>
                <select name="sector" className="w-full bg-zinc-950 border border-zinc-850 px-3 py-2 rounded-xl text-zinc-350 focus:outline-none cursor-pointer">
                  <option value="wedding">Wedding Agency</option>
                  <option value="corporate">Corporate Event Planner</option>
                  <option value="studio">Photography Company</option>
                  <option value="other">Staging & Production House</option>
                </select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Message & Request details</label>
                <textarea required name="message" rows={4} className="w-full bg-zinc-950 border border-zinc-850 px-3 py-2 rounded-xl text-white focus:outline-none" />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-500/10 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting Inbound..." : "Submit Inquiry"} <Send size={12} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
