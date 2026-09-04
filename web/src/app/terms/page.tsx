"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Scale, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import { Footer } from "@/components/landing/Footer";

export default function TermsOfServicePage() {
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
            <Scale className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-white text-base">EventOS Legal</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full">
        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5" /> Terms of Service
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Terms & Conditions</h1>
          <p className="text-zinc-400 text-sm">
            Last Updated: July 2026 • Effective Date: July 2026
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-zinc-300 text-sm leading-relaxed">
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              1. Agreement to Terms
            </h2>
            <p>
              By accessing or using the EventOS platform ("Platform"), you agree to be bound by these Terms of Service. EventOS provides event planning, CRM lead tracking, quotation automation, invoicing, and client portal gallery services for event management businesses.
            </p>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
              2. Subscription Plans & Free Trials
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li><strong>14-Day Free Trial:</strong> Full access to features without a credit card required during trial.</li>
              <li><strong>Subscription Billing:</strong> Monthly/Annual subscriptions (Starter at ₹1,999/mo, Professional at ₹5,999/mo, or Agency at ₹11,999/mo) billed via automated recurring payments.</li>
              <li><strong>Upgrades & Downgrades:</strong> You may change your subscription tier anytime from your Workspace Billing tab.</li>
            </ul>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              3. Acceptable Use & Account Responsibilities
            </h2>
            <p>
              You are responsible for maintaining the confidentiality of your workspace credentials and team invites. You agree not to upload illegal, explicit, or unauthorized third-party media content to EventOS client galleries.
            </p>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-white">4. Service Level Agreement (SLA) & Uptime</h2>
            <p className="text-zinc-400">
              We target 99.9% system availability for microservices and cloud databases. System status updates are published transparently for all tenant workspaces.
            </p>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-white">5. Contact Support</h2>
            <p className="text-zinc-400">
              For questions regarding account terms or business agreements:
            </p>
            <p className="text-purple-400 font-semibold">support@eventos.app</p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
