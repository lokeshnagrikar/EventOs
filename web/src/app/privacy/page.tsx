"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, FileText, CheckCircle } from "lucide-react";
import { Footer } from "@/components/landing/Footer";

export default function PrivacyPolicyPage() {
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
            <Shield className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-white text-base">EventOS Legal</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full">
        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" /> Privacy Commitment
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Privacy Policy</h1>
          <p className="text-zinc-400 text-sm">
            Last Updated: July 2026 • Effective Date: July 2026
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-zinc-300 text-sm leading-relaxed">
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              1. Information We Collect
            </h2>
            <p>
              EventOS ("we", "our", or "us") collects information to provide seamless event management, client relationship management (CRM), quotation generation, and digital gallery delivery services to event planners and production teams.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li>Account Credentials: Name, email address, phone number, company name, business address.</li>
              <li>Workspace & Event Data: Client contacts, event schedules, quotes, invoices, and payment statuses created within your tenant workspace.</li>
              <li>Uploaded Media: Photos, videos, and collateral uploaded to EventOS Client Portals and Galleries.</li>
              <li>Usage & Device Logs: IP address, browser type, login timestamps, and system performance metrics.</li>
            </ul>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              2. Multi-Tenant Data Isolation & Security
            </h2>
            <p>
              Your workspace data is logically isolated using enterprise tenant partitioning (<code className="text-purple-300 bg-purple-950/50 px-1.5 py-0.5 rounded">TenantContext</code>). We employ 256-bit AES encryption at rest and TLS 1.3 encryption in transit. Your customer leads, billing amounts, and event documents are never shared or accessible across tenant boundaries.
            </p>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-400" />
              3. How We Use Your Information
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li>To provide, operate, and maintain your EventOS workspace and microservices.</li>
              <li>To process client payments, issue invoices, and sync Stripe webhook statuses.</li>
              <li>To deliver automated SMS, WhatsApp, and email notifications for client quotes and event reminders.</li>
              <li>To ensure system reliability, prevent fraudulent logins, and monitor performance.</li>
            </ul>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-400" />
              4. Third-Party Integrations
            </h2>
            <p>
              We integrate with trusted infrastructure providers to process data securely:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li><strong>Stripe:</strong> Payment processing and subscription management.</li>
              <li><strong>Cloudinary:</strong> Compressed media and gallery storage.</li>
              <li><strong>Redis / AWS / PostgreSQL Cloud:</strong> Encrypted caching and relational database storage.</li>
            </ul>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-white">5. Contact Support</h2>
            <p className="text-zinc-400">
              If you have any questions regarding your data privacy or request data deletion, email our team at:
            </p>
            <p className="text-purple-400 font-semibold">privacy@eventosapp.in</p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
