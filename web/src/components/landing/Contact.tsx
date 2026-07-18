"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useToastStore } from "@/lib/toastStore";

export function Contact() {
  const addToast = useToastStore((state) => state.addToast);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    teamSize: "1-5",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      addToast("Please fill in all required fields.", "error");
      return;
    }

    try {
      setLoading(true);
      const { apiClient } = require("@/lib/api-client");
      const response = await apiClient.post("/auth/inquiries", {
        name: formData.name,
        email: formData.email,
        teamSize: formData.teamSize,
        message: formData.message
      });

      if (response.data?.success) {
        setSubmitted(true);
        addToast("Inquiry submitted successfully! We'll get back to you shortly.", "success");
        setTimeout(() => {
          setSubmitted(false);
          setFormData({
            name: "",
            email: "",
            teamSize: "1-5",
            message: "",
          });
        }, 3000);
      } else {
        addToast(response.data?.message || "Failed to submit inquiry", "error");
      }
    } catch (err: any) {
      console.error("Failed to submit inquiry:", err);
      addToast(err.response?.data?.message || "Failed to submit inquiry", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <section className="py-24 border-b border-zinc-900 bg-[#09090B] relative overflow-hidden" id="contact">
      {/* Background ambient radial gradients */}
      <div className="absolute top-1/3 right-0 w-[450px] h-[450px] bg-purple-950/8 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/3 left-0 w-[400px] h-[400px] bg-cyan-950/8 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Column 1: Copy and Contact Details */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 uppercase">
                <Icon icon="solar:letter-bold-duotone" className="text-purple-400" />
                Get In Touch
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight font-heading">
                Let's scale your event enterprise together.
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                Have questions about custom features, workflow migrations, or enterprise workspace setups? Drop us a line. Our team is here to assist.
              </p>
            </div>

            <div className="space-y-6">
              {/* Direct channels */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/[0.02] border border-white/[0.06] backdrop-blur-xs rounded-xl text-purple-400">
                  <Icon icon="solar:letter-bold-duotone" className="text-xl" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Email Us</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">Response within 12 hours</p>
                  <a href="mailto:hello@eventos.io" className="text-sm font-semibold text-purple-300 hover:text-purple-200 transition-colors mt-1 block">
                    hello@eventos.io
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/[0.02] border border-white/[0.06] backdrop-blur-xs rounded-xl text-cyan-400">
                  <Icon icon="solar:clock-circle-bold-duotone" className="text-xl" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Support Hours</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">Global operational times</p>
                  <p className="text-sm font-semibold text-zinc-300 mt-1">
                    Monday – Friday, 9:00 AM – 6:00 PM (SGT)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/[0.02] border border-white/[0.06] backdrop-blur-xs rounded-xl text-pink-400">
                  <Icon icon="solar:map-point-bold-duotone" className="text-xl" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">HQ Office</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">Physical business base</p>
                  <p className="text-sm font-semibold text-zinc-300 mt-1">
                    Singapore, Central Business District
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Inquiries Form */}
          <div className="lg:col-span-7">
            <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl p-6 sm:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.4)]">
              {/* Subtle top light bar */}
              <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent pointer-events-none" />
              
              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.form
                    key="form"
                    initial={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="contact-name" className="text-xs font-bold text-zinc-300">
                          Full Name <span className="text-purple-400">*</span>
                        </label>
                        <input
                          id="contact-name"
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Jane Doe"
                          className="w-full bg-zinc-950/80 border border-zinc-850 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="contact-email" className="text-xs font-bold text-zinc-300">
                          Business Email <span className="text-purple-400">*</span>
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="jane@company.com"
                          className="w-full bg-zinc-950/80 border border-zinc-850 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="contact-team" className="text-xs font-bold text-zinc-300">
                        Team Size
                      </label>
                      <div className="relative">
                        <select
                          id="contact-team"
                          name="teamSize"
                          value={formData.teamSize}
                          onChange={handleChange}
                          className="w-full bg-zinc-950/80 border border-zinc-850 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-all appearance-none cursor-pointer"
                        >
                          <option value="1-5">1 – 5 planners</option>
                          <option value="6-15">6 – 15 planners</option>
                          <option value="16-50">16 – 50 planners</option>
                          <option value="50+">50+ planners</option>
                        </select>
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-zinc-400">
                          <Icon icon="solar:alt-arrow-down-bold" className="text-sm" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="contact-message" className="text-xs font-bold text-zinc-300">
                        Message <span className="text-purple-400">*</span>
                      </label>
                      <textarea
                        id="contact-message"
                        name="message"
                        required
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us about your events team and how we can support you..."
                        className="w-full bg-zinc-950/80 border border-zinc-850 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-all resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-550 hover:to-pink-550 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl text-sm transition-all duration-200 active:scale-[0.98] shadow-lg shadow-purple-950/20 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Icon icon="line-md:loading-twotone-loop" className="text-lg" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Icon icon="solar:send-square-bold-duotone" className="text-lg" />
                          <span>Submit Inquiry</span>
                        </>
                      )}
                    </button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center justify-center py-12 text-center space-y-4"
                  >
                    <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400 animate-bounce">
                      <Icon icon="solar:check-circle-bold-duotone" className="text-4xl" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Thank You!</h3>
                    <p className="text-zinc-400 text-sm max-w-sm">
                      Your message has been received. One of our system consultants will be in touch shortly to assist with your EventOS setup.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
