"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Cookie, ShieldCheck, FileText } from "lucide-react";
import { Footer } from "@/components/landing/Footer";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans selection:bg-purple-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-[#09090B]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <Cookie className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-white text-base">EventOS Legal</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full">
        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider">
            <Cookie className="w-3.5 h-3.5" /> Cookie Policy
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Cookie & Storage Policy</h1>
          <p className="text-zinc-400 text-sm">
            Last Updated: July 2026 • Effective Date: July 2026
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-zinc-300 text-sm leading-relaxed">
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              1. What Are Cookies & Local Storage?
            </h2>
            <p>
              Cookies and browser local storage enable EventOS to maintain your active user session, remember active workspace preferences, and ensure secure JWT token exchanges across microservices.
            </p>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              2. Types of Cookies We Use
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li><strong>Essential Cookies:</strong> Secure HTTP-only cookies storing encrypted refresh tokens (<code className="text-purple-300 bg-purple-950/50 px-1.5 py-0.5 rounded">refreshToken</code>) and session validation.</li>
              <li><strong>Functional Storage:</strong> Local storage for workspace selection, active theme preferences, and draft quote configurations.</li>
              <li><strong>Performance & Analytics:</strong> Anonymous telemetry tracking page navigation speed to optimize microservice endpoints.</li>
            </ul>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-white">3. Managing Your Cookies</h2>
            <p className="text-zinc-400">
              You can modify cookie settings in your web browser. Note that disabling essential security cookies may prevent sign-in to your EventOS dashboard.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
