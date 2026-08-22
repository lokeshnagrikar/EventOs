"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Icon } from "@iconify/react";
import { Sparkles, Mail, Clock, MapPin, Send, CheckCircle2 } from "lucide-react";
import { useToastStore } from "@/lib/toastStore";

export function Contact() {
  const shouldReduceMotion = useReducedMotion();
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
        message: formData.message,
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
        }, 3500);
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
    <section className="py-24 border-b border-[#E5E7EB] bg-[#F8F7FF] relative overflow-hidden font-sans" id="contact">
      {/* Laser-precision top horizon line */}
      <div className="absolute top-0 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-purple-300/40 to-transparent pointer-events-none" />

      {/* Background ambient radial glows */}
      <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-purple-100/30 blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-indigo-100/30 blur-[130px] rounded-full pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Column 1: Copy and Glassmorphic Channel Badges */}
          <motion.div
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 space-y-8"
          >
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 uppercase">
                <Icon icon="solar:chat-round-dots-bold-duotone" className="text-purple-600 text-sm" />
                Contact Enterprise Desk
              </span>

              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight font-heading">
                Let's scale your event enterprise together.
              </h2>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
                Have questions about custom workflows, white-label setup, or enterprise migration? Drop us a line below. Our engineering team is here 24/7.
              </p>
            </div>

            {/* Glassmorphic Contact Cards */}
            <div className="space-y-4">
              {/* Card 1: Email */}
              <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-md backdrop-blur-xl hover:border-purple-400 transition-all duration-300 flex items-start gap-4 group">
                <div className="h-11 w-11 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 shrink-0 group-hover:scale-110 transition-transform">
                  <Mail size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-heading">Direct Email Desk</h4>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">Rapid response within 12 hours</p>
                  <a href="mailto:hello@eventos.io" className="text-xs font-bold text-purple-700 hover:text-purple-900 transition-colors mt-1 block">
                    hello@eventos.io →
                  </a>
                </div>
              </div>

              {/* Card 2: Hours */}
              <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-md backdrop-blur-xl hover:border-cyan-400 transition-all duration-300 flex items-start gap-4 group">
                <div className="h-11 w-11 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-600 shrink-0 group-hover:scale-110 transition-transform">
                  <Clock size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-heading">Operational SLA</h4>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">Global support coverage</p>
                  <p className="text-xs font-semibold text-slate-800 mt-1">
                    Monday – Friday, 9:00 AM – 6:00 PM (SGT)
                  </p>
                </div>
              </div>

              {/* Card 3: Location */}
              <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-md backdrop-blur-xl hover:border-pink-400 transition-all duration-300 flex items-start gap-4 group">
                <div className="h-11 w-11 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-600 shrink-0 group-hover:scale-110 transition-transform">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-heading">Global Headquarters</h4>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">Isolated Enterprise Hub</p>
                  <p className="text-xs font-semibold text-slate-800 mt-1">
                    Singapore, Central Business District
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Column 2: Ultra-Glassmorphic Form Container */}
          <motion.div
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-7"
          >
            <div className="relative rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-2xl p-6 sm:p-10 shadow-xl overflow-hidden">
              {/* Glass Top Specular Sheen */}
              <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent pointer-events-none" />
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 blur-3xl pointer-events-none" />
              
              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.form
                    key="form"
                    initial={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSubmit}
                    className="space-y-6 relative z-10"
                  >
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 font-heading">Submit Technical Inquiry</h3>
                        <p className="text-xs text-slate-600 font-medium">Fill out your event details below to connect with an engineer.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label htmlFor="contact-name" className="text-xs font-bold text-slate-800">
                          Full Name <span className="text-purple-600 font-extrabold">*</span>
                        </label>
                        <input
                          id="contact-name"
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Jane Doe"
                          className="w-full bg-slate-50/80 border border-slate-200/90 rounded-2xl px-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 backdrop-blur-md transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="contact-email" className="text-xs font-bold text-slate-800">
                          Business Email <span className="text-purple-600 font-extrabold">*</span>
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="jane@agency.com"
                          className="w-full bg-slate-50/80 border border-slate-200/90 rounded-2xl px-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 backdrop-blur-md transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="contact-team" className="text-xs font-bold text-slate-800">
                        Agency Team Size
                      </label>
                      <div className="relative">
                        <select
                          id="contact-team"
                          name="teamSize"
                          value={formData.teamSize}
                          onChange={handleChange}
                          className="w-full bg-slate-50/80 border border-slate-200/90 rounded-2xl px-4 py-3.5 text-sm text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 backdrop-blur-md transition-all appearance-none cursor-pointer"
                        >
                          <option value="1-5" className="bg-white text-slate-900">1 – 5 Coordinators</option>
                          <option value="6-15" className="bg-white text-slate-900">6 – 15 Coordinators</option>
                          <option value="16-50" className="bg-white text-slate-900">16 – 50 Coordinators</option>
                          <option value="50+" className="bg-white text-slate-900">50+ Enterprise Planners</option>
                        </select>
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-600">
                          <Icon icon="solar:alt-arrow-down-bold" className="text-sm" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="contact-message" className="text-xs font-bold text-slate-800">
                        Inquiry Message <span className="text-purple-600 font-extrabold">*</span>
                      </label>
                      <textarea
                        id="contact-message"
                        name="message"
                        required
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us about your event operations, team size, and requirements..."
                        className="w-full bg-slate-50/80 border border-slate-200/90 rounded-2xl px-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 backdrop-blur-md transition-all resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm transition-all duration-300 shadow-lg shadow-purple-600/30 border border-purple-400/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                    >
                      {loading ? (
                        <>
                          <Icon icon="line-md:loading-twotone-loop" className="text-lg" />
                          <span>Submitting Inquiry...</span>
                        </>
                      ) : (
                        <>
                          <Send size={16} />
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
                    className="flex flex-col items-center justify-center py-12 text-center space-y-4 relative z-10"
                  >
                    <div className="p-4 bg-purple-500/15 border border-purple-500/30 rounded-full text-purple-400 animate-bounce">
                      <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-white font-heading">Inquiry Received!</h3>
                    <p className="text-zinc-400 text-sm max-w-sm">
                      Your message has been safely logged. An EventOS solution engineer will contact you shortly.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
