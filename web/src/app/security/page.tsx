"use client";

import React from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Shield, Lock, Server, Cpu, CheckCircle, HelpCircle } from "lucide-react";
import { SpotlightCard } from "@/components/ui/spotlight-card";

export default function SecurityPage() {
  const complianceBadges = [
    { name: "SOC 2 Type II", status: "Certified / Audited Yearly", desc: "Verifies secure management of client data based on security, availability, and processing integrity." },
    { name: "GDPR Ready", status: "Active Data Protection", desc: "Full alignment with global privacy mandates, offering automated tenant data export and deletion endpoints." },
    { name: "ISO 27001", status: "On Roadmap (Target: Q4 2026)", desc: "Rigorous standards for establishing, implementing, operating, monitoring, and reviewing information security." },
  ];

  const faqs = [
    { q: "Where is client media and photo assets stored?", a: "All gallery photos and album proofs are stored inside AWS S3 buckets in private ACL scopes, served using signed, time-expiring URLs via Amazon CloudFront CDN to restrict unauthorized indexing." },
    { q: "Do you encrypt database records?", a: "Yes. All database volumes are encrypted using AWS KMS-managed keys with AES-256. Individual database rows containing secrets (such as integration client tokens) are doubly encrypted at the application level." },
    { q: "Do you offer multi-tenant database isolation?", a: "Yes. EventOS uses a schema-based multi-tenancy architecture. Each workspace is isolated inside its own Postgres database schema context, preventing cross-tenant leakage during query execution." },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-600 selection:text-white">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 max-w-7xl mx-auto px-6 space-y-24 w-full">
        {/* Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent"
          >
            Trust & Compliance
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none"
          >
            Enterprise-Grade Security by Design.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base text-zinc-400 font-semibold"
          >
            How EventOS isolates client details, ledger records, and photography portfolios under industry-standard compliance parameters.
          </motion.p>
        </div>

        {/* Compliance badges grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {complianceBadges.map((badge, idx) => (
            <motion.div
              key={badge.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex"
            >
              <SpotlightCard className="p-6 rounded-2xl border border-zinc-850 bg-zinc-950/20 backdrop-blur w-full flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-purple-450 shrink-0" />
                    <h3 className="text-xs font-black uppercase text-zinc-200">{badge.name}</h3>
                  </div>
                  <span className="text-[10px] text-purple-400/90 font-mono block font-bold">{badge.status}</span>
                  <p className="text-[10.5px] text-zinc-500 leading-relaxed font-semibold">{badge.desc}</p>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>

        {/* Security Audit Verification Banner */}
        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-purple-600 shrink-0" />
            <p className="text-xs font-bold text-slate-800">
              <span className="text-slate-900 font-extrabold">Last security audit:</span> August 2026 by SRE Hardening Team — Verified Compliant
            </p>
          </div>
          <a
            href="#trust-vault"
            className="text-[11px] font-extrabold text-purple-700 hover:text-purple-800 underline underline-offset-4 shrink-0"
          >
            Request Audit Summary →
          </a>
        </div>

        {/* Technical Architecture Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-[#121214]/10 border border-zinc-850 p-8 rounded-3xl">
          <div className="space-y-4">
            <span className="text-[9px] text-purple-450 uppercase font-black tracking-widest block">Infrastructure Matrix</span>
            <h3 className="text-lg font-black text-white">AWS Multi-Tenant Isolated Infrastructure</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
              EventOS processes millions in invoicing ledger collections and securely delivers gigabytes of photographic album files. We maintain security indexes through:
            </p>
            <ul className="space-y-3 text-[11px] font-semibold text-zinc-400">
              <li className="flex gap-2 items-start">
                <Lock size={12} className="text-purple-400 mt-0.5 shrink-0" />
                <span><strong>Tenant Database Schema Isolation:</strong> Preventing cross-data queries by segregating database connection pools.</span>
              </li>
              <li className="flex gap-2 items-start">
                <Server size={12} className="text-purple-400 mt-0.5 shrink-0" />
                <span><strong>End-to-End Encryption SSL:</strong> TLS 1.3 for API gateways and AWS KMS hardware-security keys for static archives.</span>
              </li>
              <li className="flex gap-2 items-start">
                <Cpu size={12} className="text-purple-400 mt-0.5 shrink-0" />
                <span><strong>Automated Vulnerability Checks:</strong> Continuous code-level scanning and weekly container orchestration penetration testing.</span>
              </li>
            </ul>
          </div>

          {/* Graphical diagram mock */}
          <div className="p-6 bg-zinc-950/60 border border-zinc-850 rounded-2xl flex flex-col justify-between space-y-4 font-mono text-[10px] text-zinc-400 select-none">
            <div className="space-y-1.5 border-b border-zinc-900 pb-3">
              <span className="text-purple-450 font-bold block">SECURITY GATEWAY VERIFIED</span>
              <span className="text-zinc-555">SLA Uptime Status: 99.99% • Response Latency: 14ms</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-850">
                <span>Client Session TLS 1.3</span>
                <span className="text-emerald-450 text-[8px] font-black uppercase border rounded px-1.5 py-0.2 bg-black/40">Verified</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-850">
                <span>API Gateway isolated proxy</span>
                <span className="text-emerald-450 text-[8px] font-black uppercase border rounded px-1.5 py-0.2 bg-black/40">Secured</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-850">
                <span>Logical DB Schema isolation</span>
                <span className="text-purple-400 text-[8px] font-black uppercase border rounded px-1.5 py-0.2 bg-black/40">Schema Context</span>
              </div>
            </div>

            <div className="pt-2 text-[9px] text-zinc-555 flex justify-between font-bold">
              <span>Host Region: AWS ap-south-1</span>
              <span>Enc: AES-256 GCM</span>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="text-center space-y-1">
            <span className="text-[10px] text-purple-450 uppercase font-black tracking-widest block">Detailed specs</span>
            <h3 className="text-lg font-black text-white">Infrastructure & Data Security FAQs</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-2">
                <h4 className="text-xs font-black text-zinc-200 flex items-center gap-2">
                  <HelpCircle size={13} className="text-purple-400 shrink-0" />
                  {faq.q}
                </h4>
                <p className="text-[10.5px] text-zinc-450 font-semibold leading-relaxed pl-5">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="p-12 border border-zinc-800 bg-zinc-950 rounded-3xl text-center space-y-4 select-none">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Looking for our Security Audits SOC2 Documents?</h3>
          <p className="text-xs text-zinc-400 font-semibold max-w-xl mx-auto leading-relaxed">
            Our full SOC2 compliance matrices and penetration testing audit sheets are made available upon NDA authorization verification.
          </p>
          <button className="px-6 py-2.5 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition cursor-pointer">
            Request Trust Vault Access
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
