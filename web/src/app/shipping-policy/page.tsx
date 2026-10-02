"use client";

import React from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Truck, 
  Zap, 
  Mail, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  ShieldCheck, 
  FileText,
  Building2 
} from "lucide-react";
import { Footer } from "@/components/landing/Footer";

export default function ShippingPolicyPage() {
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
            <Truck className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-white text-base">EventOS Legal & Compliance</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-16 w-full space-y-12">
        <div className="space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" /> 
            <span>Digital Delivery Standard</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Shipping & Delivery Policy
          </h1>
          <p className="text-zinc-400 text-sm font-medium">
            Effective Date: October 2026 • Business Category: SaaS / IT & Software Services
          </p>
        </div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-sm">Instant Cloud Provisioning</h4>
            <p className="text-xs text-zinc-400">
              Zero waiting time. Your tenant workspace is activated within seconds of payment completion.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Mail className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-sm">Electronic Delivery</h4>
            <p className="text-xs text-zinc-400">
              Login credentials, activation links, and GST tax invoices are delivered to your email instantly.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-sm">No Physical Shipping</h4>
            <p className="text-xs text-zinc-400">
              100% cloud-hosted SaaS. No physical delivery, shipping fees, or courier transit required.
            </p>
          </div>
        </div>

        {/* Detailed Policy Text */}
        <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
              1. Nature of Products & Digital Delivery
            </h2>
            <p>
              EventOS (https://www.eventosapp.in) is a pure cloud-based Software-as-a-Service (SaaS) platform designed for event planners, wedding agencies, and production teams. We do not sell or deliver physical merchandise, hardware, or tangible goods. Consequently, traditional postal or courier shipping services are not applicable to any transactions on our platform.
            </p>
            <p className="text-xs text-zinc-400">
              All services—including event CRM management, quotation generation, automated milestone invoicing, digital signature verification, and client photo galleries—are delivered entirely in digital format via secure web browsers and progressive web apps (PWA).
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-emerald-400" />
              2. Delivery Timeline & Service Access
            </h2>
            <p>
              Upon successful payment authorization via our payment gateway partner (<strong>Razorpay</strong>):
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-zinc-400">
              <li>
                <strong className="text-white">Instant Activation:</strong> Your workspace subscription tier, team seat allocation, and cloud media quotas are upgraded immediately in real time.
              </li>
              <li>
                <strong className="text-white">Confirmation Email:</strong> An automated confirmation containing your transaction reference, active subscription details, and tax invoice is dispatched to your registered account email address within <strong>5 minutes</strong> of transaction completion.
              </li>
              <li>
                <strong className="text-white">Login Credentials:</strong> If you are a new customer completing onboarding, your verified workspace URL and account access are accessible directly on screen post-checkout.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <HelpCircle className="w-5 h-5 text-cyan-400" />
              3. Delivery Issues & Non-Receipt Resolution
            </h2>
            <p className="text-xs text-zinc-400">
              If you have successfully made a payment through Razorpay but have not received access to your workspace or confirmation email within 15 minutes, this may occur due to temporary network lag between your issuing bank and the payment gateway.
            </p>
            <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 space-y-2 text-xs text-zinc-400">
              <p className="font-semibold text-white">Steps to resolve immediate access issues:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Check your email Spam or Promotions folder for receipts from <em>support@eventosapp.in</em> or <em>razorpay.com</em>.</li>
                <li>Refresh your workspace dashboard at <strong>https://www.eventosapp.in/dashboard</strong>.</li>
                <li>If the tier has not updated, email <span className="text-purple-400 font-semibold">support@eventosapp.in</span> or call <span className="text-purple-400 font-semibold">+91 93099 65483</span> with your Payment ID (e.g., pay_XXXXX). Our engineering desk will manually sync and activate your account within 2 hours.</li>
              </ol>
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-purple-400" />
              4. Merchant Operating Details
            </h2>
            <div className="text-xs text-zinc-400 space-y-1.5">
              <p><strong className="text-white">Operating Trade Name:</strong> EventOS Technologies / Lokesh Nagrikar</p>
              <p><strong className="text-white">Registered Physical Address:</strong> SAI Colony, Ward No. 6, Deori, Gondia, Maharashtra - 441901, India</p>
              <p><strong className="text-white">Customer Support:</strong> support@eventosapp.in | Phone: +91 93099 65483</p>
              <p><strong className="text-white">Support Timings:</strong> Monday – Saturday: 9:30 AM to 6:30 PM IST</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
