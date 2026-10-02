"use client";

import React from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Shield, 
  Lock, 
  Eye, 
  FileText, 
  CheckCircle2, 
  CreditCard, 
  Server, 
  HelpCircle, 
  UserCheck, 
  Building2 
} from "lucide-react";
import { Footer } from "@/components/landing/Footer";

export default function PrivacyPolicyPage() {
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
            <Shield className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-white text-base">EventOS Legal & Compliance</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-16 w-full space-y-12">
        {/* Title Header */}
        <div className="space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" /> 
            <span>Data Protection & Privacy</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-zinc-400 text-sm font-medium">
            Effective Date: October 2026 • Compliant with DPDP Act 2023 & Razorpay Security Standards
          </p>
        </div>

        {/* Commitment Box */}
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            Our Privacy Commitment to Event Professionals
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            EventOS Technologies ("EventOS", "we", "us", or "our") respects your privacy. We are committed to protecting the personal data of our users and their end clients. This Privacy Policy explains how we collect, store, process, and safeguard information across our platform (<a href="https://www.eventosapp.in" className="text-purple-400 hover:underline">https://www.eventosapp.in</a>). We strictly do not sell, rent, or trade your data to third parties.
          </p>
        </div>

        {/* Detailed Privacy Sections */}
        <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-purple-400" />
              1. Information We Collect
            </h2>
            <p>
              We collect information strictly necessary to provide our event planning ERP, lead CRM, quotation builder, and client photo gallery services:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-zinc-400">
              <li>
                <strong className="text-white">Account & Profile Information:</strong> Name, business email, mobile phone number, company/agency name, city, and physical business address provided during registration.
              </li>
              <li>
                <strong className="text-white">Workspace & Business Data:</strong> Client contact records, event dates, venues, quotation figures, invoice milestones, and team assignments managed inside your isolated tenant database.
              </li>
              <li>
                <strong className="text-white">Uploaded Digital Media:</strong> Photographs, event moodboards, and contract documents uploaded to your workspace or client-facing galleries.
              </li>
              <li>
                <strong className="text-white">Billing & Transaction Identifiers:</strong> Subscription plan type, billing history, GST identification number (if provided), and Razorpay transaction IDs.
              </li>
              <li>
                <strong className="text-white">Technical & Usage Logs:</strong> IP address, device type, browser user-agent, operating system, and session timestamps used for security monitoring and audit logging.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              2. Payment Information & Razorpay Security Standards
            </h2>
            <p>
              We utilize <strong>Razorpay Software Private Limited ("Razorpay")</strong> as our licensed payment gateway partner for all online payments and subscription billings:
            </p>
            <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 space-y-2 text-xs text-zinc-400">
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong className="text-white">Zero Raw Card Storage:</strong> EventOS never collects, sees, or stores your credit/debit card numbers, CVVs, or net banking passwords on our servers.</li>
                <li><strong className="text-white">PCI-DSS Level 1 Compliance:</strong> All payment credentials submitted during checkout are handled directly by Razorpay's bank-grade, PCI-DSS Level 1 compliant infrastructure with 256-bit SSL encryption.</li>
                <li><strong className="text-white">Transaction Logs:</strong> We receive only payment status tokens, truncated identifiers (e.g. card brand and last 4 digits), and Razorpay payment IDs to verify and activate your subscription.</li>
                <li><strong className="text-white">Razorpay Privacy:</strong> For further information on Razorpay's data security practices, please visit <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Razorpay Privacy Policy</a>.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Server className="w-5 h-5 text-cyan-400" />
              3. Data Security & Multi-Tenant Logical Isolation
            </h2>
            <p className="text-xs text-zinc-400">
              We employ strict architectural and operational safeguards to protect your data from unauthorized access:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-zinc-400">
              <li><strong>Tenant Partitioning:</strong> Every subscriber workspace operates in strict tenant isolation (<code className="text-purple-300 bg-purple-950/40 px-1 py-0.5 rounded">TenantContext</code>). Your leads and quotes are strictly quarantined from all other users.</li>
              <li><strong>Encryption Standards:</strong> Data in transit is protected using TLS 1.3 / HTTPS. Sensitive data at rest is encrypted using 256-bit AES industry standards.</li>
              <li><strong>Role-Based Access Control (RBAC):</strong> Granular permissions ensure only authorized members of your team can view or export sensitive financial records.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Eye className="w-5 h-5 text-purple-400" />
              4. How We Use Collected Data
            </h2>
            <p className="text-xs text-zinc-400">
              Your data is processed only for legitimate business purposes:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-zinc-400">
              <li>To provision, authenticate, and maintain your EventOS workspace.</li>
              <li>To calculate quotes, dispatch milestone invoices, and verify payment settlements.</li>
              <li>To send service notifications, security alerts, and customer care responses.</li>
              <li>To prevent fraudulent logins, spam abuse, and ensure infrastructure uptime.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <UserCheck className="w-5 h-5 text-amber-400" />
              5. User Rights & Data Deletion (India DPDP Act 2023 / GDPR)
            </h2>
            <p className="text-xs text-zinc-400">
              Under India's Digital Personal Data Protection (DPDP) Act, 2023, you have full authority over your personal information:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-zinc-400">
              <li>
                <strong className="text-white">Right of Access & Correction:</strong> You can review and update your profile and company details anytime from <strong>Settings ➔ Company Profile</strong>.
              </li>
              <li>
                <strong className="text-white">Self-Service Account Erasure:</strong> You can permanently delete your workspace and all associated files by navigating to <strong>Settings ➔ Security ➔ Delete Workspace</strong>.
              </li>
              <li>
                <strong className="text-white">Assisted Data Purge:</strong> You may email our compliance desk at <span className="text-purple-400 font-semibold">support@eventosapp.in</span> with the subject <em>"Data Erasure Request"</em>. Upon identity verification, all records will be deleted from active servers within 30 days.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-purple-400" />
              6. Grievance Officer & Contact Information
            </h2>
            <p className="text-xs text-zinc-400">
              Pursuant to the Information Technology Act, 2000 and the Rules made thereunder, the contact details of the Grievance Officer for EventOS are as follows:
            </p>
            <div className="text-xs text-zinc-400 space-y-1.5 pt-2">
              <p><strong className="text-white">Grievance Officer:</strong> Lokesh Nagrikar</p>
              <p><strong className="text-white">Operating Entity:</strong> EventOS Technologies</p>
              <p><strong className="text-white">Physical Address:</strong> SAI Colony, Ward No. 6, Deori, Gondia, Maharashtra - 441901, India</p>
              <p><strong className="text-white">Grievance Email:</strong> grievance@eventosapp.in / support@eventosapp.in</p>
              <p><strong className="text-white">Customer Support Phone:</strong> +91 93099 65483 (Mon – Sat: 9:30 AM – 6:30 PM IST)</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
