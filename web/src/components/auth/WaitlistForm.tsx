"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";

interface WaitlistFormProps {
  onSuccess?: () => void;
  prefilledEmail?: string;
}

export function WaitlistForm({ onSuccess, prefilledEmail = "" }: WaitlistFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    agencyName: "",
    email: prefilledEmail,
    whatsapp: "",
    eventType: "Both",
    currentTools: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [spotNumber, setSpotNumber] = useState<number>(1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to join waitlist. Please try again.");
      }

      if (data.spotNumber) {
        setSpotNumber(data.spotNumber);
      }
      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full text-left">
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="form-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="mb-5 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-[10px] font-black uppercase text-purple-400 tracking-wider mb-2.5">
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500" />
                </span>
                Founding Cohort • Limited to 25 Agencies
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white font-heading tracking-tight">
                Join the Private Beta
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                Be the first to run your agency on EventOS. Claim your founding spot for 1-on-1 founder onboarding and lifetime beta perks.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <Icon icon="solar:danger-triangle-bold" className="text-base shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Your Name <span className="text-purple-400">*</span>
                  </label>
                  <div className="relative">
                    <Icon icon="solar:user-bold-duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm" />
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                    />
                  </div>
                </div>

                {/* Agency Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Agency / Studio Name <span className="text-purple-400">*</span>
                  </label>
                  <div className="relative">
                    <Icon icon="solar:buildings-bold-duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm" />
                    <input
                      type="text"
                      name="agencyName"
                      required
                      placeholder="e.g. Royal Heritage Events"
                      value={formData.agencyName}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Work Email */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Work Email <span className="text-purple-400">*</span>
                  </label>
                  <div className="relative">
                    <Icon icon="solar:letter-bold-duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm" />
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="rahul@agency.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                    />
                  </div>
                </div>

                {/* WhatsApp Number */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    WhatsApp Number <span className="text-purple-400">*</span>
                  </label>
                  <div className="relative">
                    <Icon icon="solar:phone-calling-bold-duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm" />
                    <input
                      type="tel"
                      name="whatsapp"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.whatsapp}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Primary Event Focus <span className="text-purple-400">*</span>
                </label>
                <select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                >
                  <option value="Weddings">💍 Luxury & Boutique Weddings</option>
                  <option value="Corporate">🏢 Corporate Conferences & Summits</option>
                  <option value="Both">✨ Both (Weddings & Corporate)</option>
                  <option value="Photography">📸 Photography & Media Studio</option>
                </select>
              </div>

              {/* Current Tools (Optional) */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  What tools do you currently use? <span className="text-zinc-600">(Optional)</span>
                </label>
                <div className="relative">
                  <Icon icon="solar:widget-bold-duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm" />
                  <input
                    type="text"
                    name="currentTools"
                    placeholder="e.g. Excel, WhatsApp groups, Notion, Google Drive"
                    value={formData.currentTools}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#EC4899] hover:opacity-95 active:scale-[0.99] transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Icon icon="solar:restart-bold" className="animate-spin text-sm" />
                    <span>Securing Your Spot...</span>
                  </>
                ) : (
                  <>
                    <span>Claim Priority Beta Spot</span>
                    <Icon icon="solar:arrow-right-bold" className="text-sm" />
                  </>
                )}
              </button>

              <p className="text-[10px] text-zinc-500 text-center mt-2 flex items-center justify-center gap-1.5">
                <Icon icon="solar:shield-check-bold" className="text-emerald-400 text-xs" />
                Zero spam. Founder Lokesh will personally reach out on WhatsApp.
              </p>
            </form>
          </motion.div>
        ) : (
          /* Success View */
          <motion.div
            key="success-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4 px-2"
          >
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/10">
              <Icon icon="solar:check-circle-bold" className="text-3xl" />
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-[11px] font-black uppercase text-purple-300 tracking-wider mb-2">
              🎉 Spot #{spotNumber} of 25 Secured
            </div>

            <h3 className="text-2xl font-black text-white font-heading">
              You're on the VIP Waitlist!
            </h3>

            <p className="text-xs text-zinc-300 mt-2 max-w-sm mx-auto leading-relaxed">
              Thank you, <strong className="text-white">{formData.name}</strong>. Your agency{" "}
              <strong className="text-purple-300">{formData.agencyName}</strong> has been prioritized for Founding Cohort #1.
            </p>

            <div className="my-5 p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-left text-xs text-zinc-300 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Icon icon="solar:verified-check-bold" className="text-base" />
                <span>What happens next?</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-normal pl-6">
                1. Founder Lokesh will personally review your agency profile.<br />
                2. We will WhatsApp you at <strong className="text-white">{formData.whatsapp}</strong> with your private beta credentials and founder walkthrough invite.
              </p>
            </div>

            <a
              href={`https://wa.me/919999999999?text=Hi%20Lokesh,%20I%20just%20claimed%20spot%20${spotNumber}%20for%20${encodeURIComponent(formData.agencyName)}%20on%20the%20EventOS%20Private%20Beta!`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-md shadow-emerald-600/20"
            >
              <Icon icon="solar:chat-round-dots-bold" className="text-base" />
              <span>Say Hi to Founder on WhatsApp</span>
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
