"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { BookOpen, Calendar, ArrowRight, Mail } from "lucide-react";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { useToastStore } from "@/lib/toastStore";

const POSTS = [
  {
    title: "SaaS Workspace vs Dubsado: Why Consolidated Engines Win",
    date: "July 4, 2026",
    readTime: "6 min read",
    desc: "Why juggling separate platforms for portfolios, invoicing ledger contracts, and calendars slows down booking rates, and how single command centers optimize conversions.",
  },
  {
    title: "AWS Schema-Based Multi-Tenancy Explained",
    date: "June 28, 2026",
    readTime: "8 min read",
    desc: "An in-depth review of Postgres database tenant schema isolation contexts and why KMS hardware key encryption matters for corporate agencies data protection.",
  },
  {
    title: "How to Optimize Photography Workflows",
    date: "June 14, 2026",
    readTime: "5 min read",
    desc: "Best practices for wedding studio collectives deliveringRAW proofs securely using Amazon CloudFront signed time-expiring URLs.",
  },
];

export default function BlogPage() {
  const addToast = useToastStore((state) => state.addToast);
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    addToast("Successfully subscribed to EventOS Insights Newsletter! ✉", "success");
    setEmail("");
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
            SaaS operational blog
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none"
          >
            Insights, Architecture, & SaaS Growth.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base text-zinc-400 font-semibold"
          >
            Follow strategies from event production managers, database security engineers, and brand strategists.
          </motion.p>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {POSTS.map((post, idx) => (
            <motion.div
              key={post.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex"
            >
              <SpotlightCard className="p-6 rounded-2xl border border-zinc-850 bg-zinc-950/20 backdrop-blur w-full flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="flex justify-between text-[9px] text-zinc-555 font-mono font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Calendar size={9} /> {post.date}</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h4 className="text-xs font-black text-zinc-200 leading-snug group-hover:text-white transition-colors">{post.title}</h4>
                  <p className="text-[10.5px] text-zinc-500 leading-relaxed font-semibold">{post.desc}</p>
                </div>
                <button
                  onClick={() => addToast("Changelog post content coming soon...", "info")}
                  className="text-[10px] font-black text-purple-450 hover:text-white uppercase tracking-widest flex items-center gap-0.5 mt-2 cursor-pointer self-start"
                >
                  Read Article <ArrowRight size={11} />
                </button>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>

        {/* Newsletter subscribe */}
        <div className="p-12 border border-zinc-800 bg-zinc-950 rounded-3xl text-center space-y-5 select-none">
          <div className="space-y-1.5 max-w-xl mx-auto">
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Subscribe to our newsletter</h3>
            <p className="text-[11px] text-zinc-450 font-semibold leading-relaxed">
              Get the latest updates on AWS multi-tenancy frameworks, payment clearing optimizations, and event checklists.
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row justify-center items-center gap-2 max-w-md mx-auto">
            <input
              required
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-850 px-4 py-2 rounded-xl text-xs text-white focus:outline-none"
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 px-5 py-2 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer w-full sm:w-auto"
            >
              Subscribe <Mail size={12} />
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
