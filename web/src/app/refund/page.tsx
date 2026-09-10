"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, CheckCircle, FileText } from "lucide-react";
import { Footer } from "@/components/landing/Footer";

export default function RefundPolicyPage() {
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
            <RefreshCw className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-white text-base">EventOS Legal</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full">
        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider">
            <RefreshCw className="w-3.5 h-3.5" /> Guarantee Policy
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Refund & Cancellation Policy</h1>
          <p className="text-zinc-400 text-sm">
            Last Updated: July 2026 • Effective Date: July 2026
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-zinc-300 text-sm leading-relaxed">
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-400" />
              1. 14-Day Risk-Free Trial
            </h2>
            <p>
              EventOS offers a 14-day free trial on all subscription plans without requiring credit card details. This allows event companies to test full quotation, CRM, client portal, and gallery features before making any financial commitment.
            </p>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-purple-400" />
              2. Subscription Cancellation
            </h2>
            <p>
              You can cancel your EventOS subscription at any time directly from your <strong>Workspace Settings ➔ Billing</strong> panel. Upon cancellation:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li>Your account remains active until the end of the current paid billing cycle.</li>
              <li>No further automatic recurring charges will occur.</li>
              <li>You can export all client quotes, invoices, and event data prior to billing period end.</li>
            </ul>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              3. Refund Request Terms
            </h2>
            <p className="text-zinc-400">
              If you experience service disruption or accidental duplicate charges, notify our team within 7 days of the transaction at <span className="text-purple-400 font-semibold">support@eventosapp.in</span> for immediate verification and processing.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
