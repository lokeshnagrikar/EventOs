"use client";

import React from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle2, 
  FileText, 
  Clock, 
  CreditCard, 
  HelpCircle, 
  ShieldCheck, 
  AlertCircle,
  Building2
} from "lucide-react";
import { Footer } from "@/components/landing/Footer";

export default function RefundPolicyPage() {
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
            <RefreshCw className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-white text-base">EventOS Legal & Compliance</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-16 w-full space-y-12">
        {/* Title Header */}
        <div className="space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <RefreshCw className="w-3.5 h-3.5" /> 
            <span>Merchant Compliance Standard</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Refund & Cancellation Policy
          </h1>
          <p className="text-zinc-400 text-sm font-medium">
            Effective Date: October 2026 • Registered Entity: EventOS Technologies / Lokesh Nagrikar
          </p>
        </div>

        {/* Quick Highlights Summary Box */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-sm">Refund Turnaround</h4>
            <p className="text-xs text-zinc-400">
              Approved refunds are credited within <strong>5 to 7 business days</strong> to the original payment source.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-sm">Cancel Anytime</h4>
            <p className="text-xs text-zinc-400">
              Zero lock-in. Cancel your recurring subscription anytime from <strong>Settings ➔ Billing</strong>.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-sm">14-Day Guarantee</h4>
            <p className="text-xs text-zinc-400">
              100% money-back guarantee for first-time subscribers if our platform does not suit your workflow.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
              1. Subscription Cancellation Policy
            </h2>
            <p>
              At EventOS, we believe in complete operational freedom for our event professionals. You may cancel your subscription at any time without paying any cancellation fee or termination penalty.
            </p>
            <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 space-y-2 text-xs text-zinc-400">
              <p className="font-semibold text-white">How to initiate a cancellation:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Self-Service:</strong> Log into your EventOS dashboard, navigate to <strong>Settings ➔ Billing & Subscription</strong>, and click <em>"Cancel Subscription"</em>.</li>
                <li><strong>Assisted Cancellation:</strong> Alternatively, email our billing desk at <span className="text-purple-400 font-semibold">support@eventosapp.in</span> with your workspace name and registered email from your account email.</li>
              </ul>
            </div>
            <p className="text-xs text-zinc-400">
              <strong>Post-Cancellation Access:</strong> When you cancel your subscription, your account remains fully active with all premium features until the end of your current paid billing period. No future charges will be billed to your card or UPI handle. You retain full access to export your client leads, quotation documents, invoices, and photo gallery archives prior to period expiration.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              2. Refund Eligibility Criteria
            </h2>
            <p>
              We provide refunds under the following explicit circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-zinc-400">
              <li>
                <strong className="text-white">14-Day Money-Back Guarantee:</strong> If you are a first-time subscriber and determine that EventOS does not meet your agency’s requirements, you may request a 100% full refund within 14 calendar days of your initial plan purchase.
              </li>
              <li>
                <strong className="text-white">Duplicate or Accidental Debits:</strong> In the event of network disruption or gateway timeouts where your account is billed multiple times for a single subscription invoice, the duplicate amount will be refunded immediately upon verification.
              </li>
              <li>
                <strong className="text-white">Unresolved Service Downtime:</strong> If a catastrophic technical defect or service outage on our cloud infrastructure prevents core software use for more than 48 consecutive hours, a pro-rata refund for the affected period will be issued.
              </li>
            </ul>
            <p className="text-xs text-zinc-400">
              <strong>Non-Refundable Scenarios:</strong> Refund requests made after 14 calendar days from the billing date, accounts suspended for violating our Terms of Service (e.g. fraudulent activity or illegal media upload), or domain registration fees are non-refundable.
            </p>
          </section>

          {/* Section 3 */}
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-cyan-400" />
              3. Refund Processing Timelines & Method (Razorpay Gateway)
            </h2>
            <p>
              All payment transactions on EventOS are securely processed via our licensed banking partner and payment aggregator, <strong>Razorpay</strong>.
            </p>
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-purple-200 text-xs font-medium space-y-2">
              <p className="font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-purple-400" />
                Mandatory Processing Timeline:
              </p>
              <p>
                Once your refund request is received and verified by our finance team, the refund will be initiated within <strong>24 to 48 hours</strong>. The credited amount will reflect in the customer's original payment method (Credit/Debit Card, Net Banking, or UPI) within <strong>5 to 7 business days</strong>, subject to your issuing bank's clearing timelines.
              </p>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-zinc-400">
              <li><strong>UPI Payments:</strong> Credited back to the linked Virtual Payment Address (VPA) / Bank Account within 24–48 hours (typically faster).</li>
              <li><strong>Credit / Debit Cards:</strong> Reflected on your bank statement within 5–7 business days depending on the card issuer (Visa/Mastercard/RuPay).</li>
              <li><strong>Net Banking:</strong> Credited directly into your source bank account within 3–7 business days.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-amber-400" />
              4. Digital Product Delivery Statement
            </h2>
            <p className="text-xs text-zinc-400">
              EventOS provides digital Software-as-a-Service (SaaS) applications. No physical goods or packages are shipped. Upon successful payment authorization, your tenant workspace, software features, and cloud storage allocations are provisioned electronically and made accessible instantaneously. Confirmation and tax invoices are delivered to your registered email immediately.
            </p>
          </section>

          {/* Section 5: Support & Contact */}
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <HelpCircle className="w-5 h-5 text-purple-400" />
              5. How to File a Refund Request
            </h2>
            <p className="text-xs text-zinc-400">
              To request a refund or raise a billing dispute, contact our merchant support team with your payment details:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-zinc-500 font-bold block uppercase text-[10px]">Email Support</span>
                <a href="mailto:support@eventosapp.in" className="text-purple-400 font-semibold hover:underline">
                  support@eventosapp.in
                </a>
                <span className="text-zinc-500 block text-[11px]">Subject: "Refund Request - [Workspace Name]"</span>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-zinc-500 font-bold block uppercase text-[10px]">Customer Care Helpline</span>
                <a href="tel:+919309965483" className="text-emerald-400 font-semibold hover:underline">
                  +91 93099 65483
                </a>
                <span className="text-zinc-500 block text-[11px]">Mon – Sat: 9:30 AM – 6:30 PM IST</span>
              </div>
            </div>
            <div className="pt-2 text-[11px] text-zinc-500">
              Operating Entity: EventOS Technologies / Lokesh Nagrikar • Address: SAI Colony, Ward No. 6, Deori, Gondia, Maharashtra - 441901, India.
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
