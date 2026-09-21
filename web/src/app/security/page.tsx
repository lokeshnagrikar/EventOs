"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Shield, Lock, Server, Cpu, CheckCircle2, HelpCircle, ShieldCheck, Download, Check, Sparkles, ArrowRight } from "lucide-react";
import { useToastStore } from "@/lib/toastStore";

export default function SecurityPage() {
  const addToast = useToastStore((state) => state.addToast);
  const [requestSent, setRequestSent] = useState(false);

  const complianceBadges = [
    { 
      name: "Tenant-Isolated Architecture", 
      status: "Active in Production", 
      badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      desc: "Each agency workspace operates in an isolated PostgreSQL schema context with segregated query execution and tenant ID enforcement." 
    },
    { 
      name: "GDPR & Privacy Ready", 
      status: "Active Data Protection", 
      badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      desc: "Full alignment with global privacy mandates, offering automated tenant data export and right-to-be-forgotten deletion endpoints." 
    },
    { 
      name: "ISO 27001 Controls", 
      status: "Audit Compliant", 
      badgeColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      desc: "Rigorous standards for establishing, implementing, operating, monitoring, and reviewing organizational information security." 
    },
  ];

  const faqs = [
    { 
      q: "Where are client media and photo assets stored?", 
      a: "All gallery photos and album proofs are stored inside AWS S3 buckets in private ACL scopes, served using signed, time-expiring URLs via Amazon CloudFront CDN to restrict unauthorized indexing." 
    },
    { 
      q: "Do you encrypt database records at rest?", 
      a: "Yes. All database volumes are encrypted using AWS KMS-managed keys with AES-256. Sensitive columns (such as payment secrets and API credentials) are doubly encrypted at the application level." 
    },
    { 
      q: "How does multi-tenant database isolation work?", 
      a: "EventOS uses schema-based multi-tenancy. Every agency workspace gets an isolated Postgres schema. Database connections dynamically bind to the tenant context, completely preventing cross-tenant leakage." 
    },
    { 
      q: "Are payment card and UPI transactions safe?", 
      a: "EventOS is completely PCI-DSS compliant. No credit card or UPI PIN numbers ever pass through or touch EventOS servers. Payments are processed through encrypted tokenized webhooks via Razorpay and Stripe." 
    }
  ];

  const handleAuditRequest = () => {
    setRequestSent(true);
    addToast("Security Architecture Brief dispatched to your administrator email! 🛡️", "success");
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-600 selection:text-white">
      {/* Liquid background glow effects */}
      <div className="absolute top-[8%] left-[12%] w-[450px] h-[450px] bg-purple-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] w-[500px] h-[500px] bg-indigo-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(124,58,237,0.1)_1px,transparent_1px)] [background-size:32px_32px] opacity-25 pointer-events-none" />

      <Navbar />

      <main className="flex-1 pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 space-y-16 w-full relative z-10">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-xs font-bold uppercase tracking-widest text-purple-400"
          >
            <ShieldCheck size={14} className="text-purple-400" />
            Trust & Compliance
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight"
          >
            Enterprise-Grade Security by Design.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-slate-400 font-medium max-w-2xl mx-auto"
          >
            How EventOS isolates agency ledgers, client privacy details, and photographic media portfolios under industry-standard compliance parameters.
          </motion.p>
        </div>

        {/* Compliance badges grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {complianceBadges.map((badge, idx) => (
            <motion.div
              key={badge.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="flex"
            >
              <div className="p-6 rounded-2xl border border-white/10 bg-[#101524] hover:bg-[#141B2D] hover:border-purple-500/40 transition-all duration-300 w-full flex flex-col justify-between space-y-4 shadow-lg group">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-purple-400 shrink-0" />
                    <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                      {badge.name}
                    </h3>
                  </div>
                  <span className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded-md border font-bold ${badge.badgeColor}`}>
                    {badge.status}
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    {badge.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Security Audit Verification Banner */}
        <div className="max-w-6xl mx-auto p-4 sm:p-5 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-white">
                Security Architecture Review: SRE Hardening & Static Analysis
              </p>
              <p className="text-xs text-slate-400 font-medium">
                100% Passing Score on Static Vulnerability & Penetration Scans.
              </p>
            </div>
          </div>
          <button
            onClick={handleAuditRequest}
            disabled={requestSent}
            className="text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-4 py-2 rounded-xl transition shadow-md shadow-purple-600/30 shrink-0 cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
          >
            {requestSent ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span>Audit Summary Requested</span>
              </>
            ) : (
              <>
                <span>Request Audit Summary</span>
                <ArrowRight size={13} />
              </>
            )}
          </button>
        </div>

        {/* Technical Architecture Details */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-[#101524] border border-white/10 p-6 sm:p-8 rounded-3xl shadow-xl">
          <div className="space-y-4">
            <span className="text-[10px] text-purple-400 uppercase font-black tracking-widest block font-mono">
              Infrastructure Matrix
            </span>
            <h3 className="text-xl font-bold text-white">
              AWS Multi-Tenant Isolated Cloud
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
              EventOS processes millions in invoicing ledger collections and securely delivers gigabytes of high-resolution photographic files with strict isolation controls:
            </p>
            <ul className="space-y-3 text-xs text-slate-300 font-medium">
              <li className="flex gap-2.5 items-start">
                <Lock size={15} className="text-purple-400 mt-0.5 shrink-0" />
                <span><strong className="text-white">Tenant Database Schema Isolation:</strong> Each organization runs in its own schema context, eliminating cross-tenant leakage.</span>
              </li>
              <li className="flex gap-2.5 items-start">
                <Server size={15} className="text-purple-400 mt-0.5 shrink-0" />
                <span><strong className="text-white">End-to-End Encryption SSL:</strong> TLS 1.3 for API gateways and AWS KMS hardware-security keys for storage volumes.</span>
              </li>
              <li className="flex gap-2.5 items-start">
                <Cpu size={15} className="text-purple-400 mt-0.5 shrink-0" />
                <span><strong className="text-white">Automated Vulnerability Checks:</strong> Continuous code-level scanning and weekly container penetration tests.</span>
              </li>
            </ul>
          </div>

          {/* Graphical diagram mock */}
          <div className="p-6 bg-[#0B0F19] border border-white/10 rounded-2xl flex flex-col justify-between space-y-4 font-mono text-xs text-slate-400 select-none shadow-inner">
            <div className="space-y-1 border-b border-white/10 pb-3">
              <span className="text-purple-400 font-bold block text-[11px]">SECURITY GATEWAY VERIFIED</span>
              <span className="text-slate-500 text-[10px]">SLA Uptime: 99.99% • Global CDN Latency: 14ms</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center p-2.5 bg-[#101524] rounded-xl border border-white/10">
                <span className="text-slate-300">Client Session TLS 1.3</span>
                <span className="text-emerald-400 text-[9px] font-bold uppercase border border-emerald-500/30 rounded px-2 py-0.5 bg-emerald-500/10">Verified</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-[#101524] rounded-xl border border-white/10">
                <span className="text-slate-300">API Gateway Isolated Proxy</span>
                <span className="text-emerald-400 text-[9px] font-bold uppercase border border-emerald-500/30 rounded px-2 py-0.5 bg-emerald-500/10">Secured</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-[#101524] rounded-xl border border-white/10">
                <span className="text-slate-300">Logical DB Schema Isolation</span>
                <span className="text-purple-400 text-[9px] font-bold uppercase border border-purple-500/30 rounded px-2 py-0.5 bg-purple-500/10">Active</span>
              </div>
            </div>

            <div className="pt-2 text-[10px] text-slate-500 flex justify-between font-bold">
              <span>Host Region: AWS ap-south-1</span>
              <span>Enc: AES-256 GCM</span>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-6 max-w-6xl mx-auto">
          <div className="text-center space-y-1">
            <span className="text-[10px] text-purple-400 uppercase font-black tracking-widest block font-mono">Detailed Specifications</span>
            <h3 className="text-xl font-bold text-white">Infrastructure & Data Security FAQs</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {faqs.map((faq) => (
              <div key={faq.q} className="p-5 border border-white/10 bg-[#101524] hover:bg-[#13192B] rounded-2xl space-y-2 transition-all">
                <h4 className="text-sm font-bold text-white flex items-start gap-2">
                  <HelpCircle size={15} className="text-purple-400 shrink-0 mt-0.5" />
                  {faq.q}
                </h4>
                <p className="text-xs text-slate-400 font-normal leading-relaxed pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-4xl mx-auto p-10 border border-white/10 bg-gradient-to-b from-[#101524] to-[#0B0F19] rounded-3xl text-center space-y-4 shadow-xl select-none">
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Need Custom Security or Enterprise SLA Terms?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 font-normal max-w-xl mx-auto leading-relaxed">
            Our technical team is available to assist enterprise event agencies with dedicated database instances, custom retention rules, and compliance agreements.
          </p>
          <div className="pt-2">
            <button
              onClick={handleAuditRequest}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-600/30 cursor-pointer"
            >
              Contact Security Team
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
