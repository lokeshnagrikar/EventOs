"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Server, CheckCircle, Clock } from "lucide-react";
import { Footer } from "@/components/landing/Footer";

export default function SLAPage() {
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
            <Server className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-white text-base">EventOS SLA</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full">
        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" /> Reliability Commitment
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Service Level Agreement (SLA)</h1>
          <p className="text-zinc-400 text-sm">
            Last Updated: July 2026 • Effective Date: July 2026
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-zinc-300 text-sm leading-relaxed">
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-400" />
              1. 99.9% Uptime Commitment
            </h2>
            <p>
              EventOS guarantees 99.9% operational availability for API Gateway, Auth, CRM, Event, and Gallery microservices. Our multi-tenant architecture features automated cluster health monitoring and Redis sliding window resilience.
            </p>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-purple-400" />
              2. Maintenance & Support SLAs
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li><strong>Scheduled Maintenance:</strong> Conducted during off-peak hours with 48-hour advance notice.</li>
              <li><strong>Support Response Time:</strong> Priority WhatsApp & Email support response within 2 hours for active business subscribers.</li>
            </ul>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
