"use client";

import React from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ShieldCheck, 
  CreditCard, 
  Building2, 
  HelpCircle,
  Clock 
} from "lucide-react";
import { Footer } from "@/components/landing/Footer";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
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
            <span className="font-bold text-white text-base">EventOS Legal & Compliance</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-16 w-full space-y-12">
        {/* Title Header */}
        <div className="space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5" /> 
            <span>User Agreement & Service Terms</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Terms & Conditions of Service
          </h1>
          <p className="text-zinc-400 text-sm font-medium">
            Effective Date: October 2026 • Operating Entity: EventOS Technologies / Lokesh Nagrikar
          </p>
        </div>

        {/* Quick Highlights Box */}
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            Summary for Event Planners & Subscribers
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            By signing up or accessing EventOS (<a href="https://www.eventosapp.in" className="text-purple-400 hover:underline">https://www.eventosapp.in</a>), you enter into a legally binding contract with EventOS Technologies. We provide enterprise-grade, cloud-based event planning and management software (SaaS). You retain 100% ownership of your clients' data, event records, and media content. All payments are processed through RBI-authorized payment aggregator <strong>Razorpay</strong>.
          </p>
        </div>

        {/* Detailed Terms */}
        <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-purple-400" />
              1. Acceptance & Eligibility
            </h2>
            <p>
              These Terms of Service ("Terms") govern your access to and use of EventOS ("Platform", "Service", "we", "us", or "our"). By registering for an account, subscribing to a paid plan, or accessing any part of the service, you confirm that:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-zinc-400">
              <li>You are at least 18 years of age and competent to enter into a legally valid agreement under the Indian Contract Act, 1872.</li>
              <li>You represent a legitimate business, agency, sole proprietorship, or organization authorized to conduct event management or related services.</li>
              <li>You agree to supply accurate, truthful, and complete business information during workspace registration.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-purple-400" />
              2. Scope of SaaS Services
            </h2>
            <p>
              EventOS operates as an all-in-one Software-as-a-Service (SaaS) ERP platform designed for event planners, wedding agencies, and production teams. Key features include:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-zinc-400">
              <li>Event CRM, lead pipeline tracking, and customer contact management.</li>
              <li>Dynamic budget calculator, automated quotation builder, and digital signing capabilities.</li>
              <li>Milestone invoice generation, automated payment reminders, and NPCI dynamic UPI QR code generator.</li>
              <li>Vendor contracts, staff assignments, run-of-show timeline coordination, and client photo/media galleries.</li>
            </ul>
            <p className="text-xs text-zinc-400">
              We deliver purely digital software services over the cloud. No physical goods or packages are shipped.
            </p>
          </section>

          {/* Section 3 */}
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              3. Subscription Plans, Billing & Razorpay Payment Gateway
            </h2>
            <p>
              Access to paid tiers (Starter, Professional, Agency, Enterprise) is provided on a recurring subscription basis (monthly or annually) as selected by the user.
            </p>
            <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 space-y-2 text-xs text-zinc-400">
              <p className="font-semibold text-white">Payment Processing Terms:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Payment Aggregator:</strong> All online payments for subscriptions, upgrades, and platform features are routed through our authorized payment partner, <strong>Razorpay Software Private Limited ("Razorpay")</strong>.</li>
                <li><strong>Supported Payment Methods:</strong> Razorpay supports Indian and international Credit Cards, Debit Cards, Net Banking (50+ banks), UPI (Google Pay, PhonePe, Paytm, BHIM), and authorized wallets.</li>
                <li><strong>Security & Card Storage:</strong> EventOS does not store or process raw debit/credit card numbers or CVVs. All sensitive payment credentials are encrypted and processed by Razorpay in compliance with PCI-DSS Level 1 standards.</li>
                <li><strong>Pricing & Taxes:</strong> All plan prices are listed in Indian Rupees (INR / ₹) and are exclusive of applicable statutory taxes (e.g. 18% Goods and Services Tax - GST), which are calculated at checkout.</li>
                <li><strong>Instant Provisioning:</strong> Subscriptions are activated instantaneously upon successful payment confirmation from Razorpay.</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-cyan-400" />
              4. Cancellation & Refund Policy
            </h2>
            <p className="text-xs text-zinc-400">
              Subscription cancellations and refund requests are governed by our official <Link href="/refund" className="text-purple-400 hover:underline font-semibold">Refund & Cancellation Policy</Link>:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-zinc-400">
              <li><strong>Cancellation Anytime:</strong> You may cancel your subscription at any time via <strong>Settings ➔ Billing</strong>. No cancellation fees apply. Access remains active until the end of the paid period.</li>
              <li><strong>14-Day Money Back Guarantee:</strong> First-time paid subscribers are entitled to a full refund within 14 calendar days of purchase if unsatisfied.</li>
              <li><strong>Refund Turnaround:</strong> Approved refunds are credited back to the customer's original payment method via Razorpay within <strong>5 to 7 business days</strong>.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              5. Acceptable Use & Account Responsibilities
            </h2>
            <p className="text-xs text-zinc-400">
              You agree to maintain the security of your workspace login credentials, API tokens, and team invitations. You agree NOT to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-zinc-400">
              <li>Upload, store, or share media that is unlawful, defamatory, abusive, or infringing on third-party intellectual property rights.</li>
              <li>Reverse engineer, decompile, scrape, or attempt unauthorized access to EventOS microservices, databases, or client tenant spaces.</li>
              <li>Use EventOS automated communication modules (SMS, WhatsApp, Email) to transmit unsolicited bulk marketing (spam).</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              6. Data Privacy & Customer Ownership
            </h2>
            <p className="text-xs text-zinc-400">
              You retain all right, title, and interest in and to all event data, lead contacts, photos, and materials that you upload to the Platform. EventOS does not sell or lease your customer records. Our handling of personal data is governed strictly by our <Link href="/privacy" className="text-purple-400 hover:underline font-semibold">Privacy Policy</Link>, crafted in compliance with India's Digital Personal Data Protection (DPDP) Act, 2023.
            </p>
          </section>

          {/* Section 7 */}
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Scale className="w-5 h-5 text-cyan-400" />
              7. Governing Law & Dispute Jurisdiction
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              These Terms and any disputes or claims arising out of or in connection with them or their subject matter or formation (including non-contractual disputes or claims) shall be governed by and construed in accordance with the laws of the <strong>Republic of India</strong>. The courts located in <strong>Gondia / Nagpur / Mumbai, Maharashtra, India</strong> shall have exclusive jurisdiction to settle any dispute or claim that arises out of or in connection with this agreement.
            </p>
          </section>

          {/* Section 8 */}
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <HelpCircle className="w-5 h-5 text-emerald-400" />
              8. Contact Us & Grievance Officer
            </h2>
            <div className="text-xs text-zinc-400 space-y-1.5">
              <p><strong className="text-white">Operating Trade Name:</strong> EventOS Technologies / Lokesh Nagrikar</p>
              <p><strong className="text-white">Registered Physical Address:</strong> SAI Colony, Ward No. 6, Deori, Gondia, Maharashtra - 441901, India</p>
              <p><strong className="text-white">Support Email:</strong> support@eventosapp.in</p>
              <p><strong className="text-white">Customer Support Phone:</strong> +91 93099 65483 (Mon – Sat: 9:30 AM – 6:30 PM IST)</p>
              <p><strong className="text-white">Grievance Officer:</strong> Lokesh Nagrikar (grievance@eventosapp.in)</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
