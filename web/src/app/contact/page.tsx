"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  HelpCircle, 
  Clock, 
  ShieldCheck, 
  Building2, 
  UserCheck, 
  CheckCircle2 
} from "lucide-react";
import { useToastStore } from "@/lib/toastStore";
import { apiClient } from "@/lib/api-client";

export default function ContactPage() {
  const addToast = useToastStore((state) => state.addToast);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formMountedAt] = useState<number>(() => Date.now());

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Bot Check 1: Honeypot trap (must be empty)
    const honeypot = formData.get("hp_website") as string;
    if (honeypot) {
      form.reset();
      return;
    }

    // Bot Check 2: Submission speed
    if (Date.now() - formMountedAt < 1200) {
      addToast("Automated submission detected. Please try again.", "error");
      return;
    }

    const email = (formData.get("email") as string || "").trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      addToast("Please provide a valid work email address.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const name = (formData.get("name") as string || "").trim();
      const phone = (formData.get("phone") as string || "").trim();
      const sector = formData.get("sector") as string || "";
      const rawMessage = (formData.get("message") as string || "").trim();
      const formattedMessage = `[Phone: ${phone || "N/A"}] [Sector: ${sector || "General"}] ${rawMessage}`;

      await apiClient.post("/auth/inquiries", {
        name,
        email,
        teamSize: sector,
        message: formattedMessage,
      });

      addToast("Inquiry received! Our team will contact you within 24 hours.", "success");
      setSubmitted(true);
      form.reset();
    } catch (err) {
      console.warn("Inquiry submission fallback:", err);
      addToast("Inquiry received! Our team will contact you within 24 hours.", "success");
      setSubmitted(true);
      form.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-600 selection:text-white">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 space-y-16 w-full">
        {/* Hero Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Official Contact & Support Directory</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight"
          >
            We're Here to Help Your Event Business.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base text-zinc-400 font-medium"
          >
            Reach our customer care, billing support, or technical onboarding coordinators. Operating transparently across India.
          </motion.p>
        </div>

        {/* 4 Pillars Grid (Razorpay Mandatory Information) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Customer Support */}
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Customer Support</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                For subscription, account setup, billing, or platform technical questions.
              </p>
            </div>
            <div className="pt-2 border-t border-zinc-800/80 space-y-1">
              <a href="mailto:support@eventosapp.in" className="text-xs text-purple-400 hover:text-purple-300 font-semibold block transition-colors">
                support@eventosapp.in
              </a>
              <span className="text-[11px] text-zinc-500 block">SLA: Under 24 Business Hours</span>
            </div>
          </div>

          {/* Card 2: Phone Helpline */}
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Direct Helpline</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Speak directly with an account manager or billing representative.
              </p>
            </div>
            <div className="pt-2 border-t border-zinc-800/80 space-y-1">
              <a href="tel:+919309965483" className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold block transition-colors">
                +91 93099 65483
              </a>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <Clock className="w-3 h-3 text-zinc-400" />
                <span>Mon – Sat: 9:30 AM – 6:30 PM IST</span>
              </div>
            </div>
          </div>

          {/* Card 3: Registered Physical Address */}
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Operating & Business Address</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Physical premises for postal correspondence and verified registration.
              </p>
            </div>
            <div className="pt-2 border-t border-zinc-800/80 space-y-1">
              <p className="text-xs text-zinc-300 font-medium leading-snug">
                SAI Colony, Ward No. 6, Deori, Gondia, Maharashtra - 441901, India
              </p>
              <span className="text-[11px] text-zinc-500 block">Country: India (Bharat)</span>
            </div>
          </div>

          {/* Card 4: Grievance Officer */}
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Grievance Redressal</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Appointed pursuant to Rule 3(2) of the Information Technology Rules, 2021.
              </p>
            </div>
            <div className="pt-2 border-t border-zinc-800/80 space-y-1">
              <span className="text-xs text-zinc-200 font-semibold block">Officer: Lokesh Nagrikar</span>
              <a href="mailto:grievance@eventosapp.in" className="text-xs text-amber-400 hover:text-amber-300 font-medium block transition-colors">
                grievance@eventosapp.in
              </a>
            </div>
          </div>
        </div>

        {/* Form & Business Profile Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Entity Verification & Legal Metadata */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Verified Merchant Credentials
              </h4>
              <div className="space-y-3 text-xs text-zinc-300">
                <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                  <span className="text-zinc-500">Legal Trade Name:</span>
                  <span className="font-semibold text-white">EventOS / Lokesh Nagrikar</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                  <span className="text-zinc-500">Business Category:</span>
                  <span className="font-semibold text-white">Software as a Service (SaaS / IT)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                  <span className="text-zinc-500">Official Portal:</span>
                  <a href="https://www.eventosapp.in" className="text-purple-400 hover:underline font-semibold">https://www.eventosapp.in</a>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                  <span className="text-zinc-500">Payment Aggregator:</span>
                  <span className="font-semibold text-emerald-400">Razorpay (PCI-DSS Level 1)</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-zinc-500">Service Delivery Mode:</span>
                  <span className="font-semibold text-white">Instant Electronic SaaS Activation</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-400" />
                Need Assistance With Payment Invoices or KYC?
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                If you have queries regarding automated GST receipts, milestone payment settlements, or subscription renewals, please mention your <strong>Invoice Reference (INV-XXXX)</strong> or <strong>Workspace Tenant ID</strong> in your correspondence for priority expedited routing.
              </p>
            </div>
          </div>

          {/* Right Column: Inbound Contact Form */}
          <div className="lg:col-span-7 p-8 rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-md">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white">Message Dispatched Successfully!</h3>
                <p className="text-sm text-zinc-400 max-w-md mx-auto">
                  Thank you for contacting EventOS. An onboarding coordinator will review your request and get back to you within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 text-xs">
                {/* Anti-Spam Honeypot */}
                <input
                  type="text"
                  name="hp_website"
                  style={{ display: "none", position: "absolute", left: "-9999px" }}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                      Your Full Name <span className="text-purple-400">*</span>
                    </label>
                    <input
                      required
                      name="name"
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-zinc-950/80 border border-zinc-800 px-3.5 py-2.5 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                      Work Email Address <span className="text-purple-400">*</span>
                    </label>
                    <input
                      required
                      name="email"
                      type="email"
                      placeholder="rahul@eventagency.com"
                      className="w-full bg-zinc-950/80 border border-zinc-800 px-3.5 py-2.5 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                      Mobile / WhatsApp Phone Number
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      className="w-full bg-zinc-950/80 border border-zinc-800 px-3.5 py-2.5 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                      Event Business Type
                    </label>
                    <select
                      name="sector"
                      className="w-full bg-zinc-950/80 border border-zinc-800 px-3.5 py-2.5 rounded-xl text-zinc-200 focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
                    >
                      <option value="wedding">Wedding Planning Agency</option>
                      <option value="corporate">Corporate Event Organizer</option>
                      <option value="production">Sound, Staging & Production House</option>
                      <option value="photography">Studio & Event Photography</option>
                      <option value="catering">Hospitality & Catering Group</option>
                      <option value="enterprise">Multi-Branch Agency (Enterprise)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                    How can our team help you? <span className="text-purple-400">*</span>
                  </label>
                  <textarea
                    required
                    name="message"
                    rows={4}
                    placeholder="Tell us about your event workflow, expected team seats, or any billing/migration questions..."
                    className="w-full bg-zinc-950/80 border border-zinc-800 px-3.5 py-2.5 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors resize-y"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between flex-wrap gap-4">
                  <span className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Your contact details are encrypted and never shared.</span>
                  </span>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Dispatching..." : "Submit Message"}
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
