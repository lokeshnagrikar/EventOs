"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Icon } from "@iconify/react";
import { TestimonialStack, Testimonial } from "@/components/ui/glass-testimonial-swiper";
import { Users, Calendar, ShieldCheck, Clock, Share, Rocket, Zap, Gem } from "lucide-react";

const testimonialsData: Testimonial[] = [
  {
    id: 1,
    initials: "AS",
    name: "Aparna Sen",
    role: "Founder, Sen Weddings & Co.",
    quote: "EventOS has transformed our wedding agency operations. Proposal drafting that took 4 hours now takes 15 minutes, and clients pay deposits instantly.",
    tags: [{ text: "Wedding Planner", type: "featured" }, { text: "Verified Agency", type: "default" }],
    stats: [{ icon: Users, text: "15 min quotes" }, { icon: Calendar, text: "2 years customer" }],
    avatarGradient: "linear-gradient(135deg, #5e6ad2, #8b5cf6)",
  },
  {
    id: 2,
    initials: "RK",
    name: "Rohan Kapoor",
    role: "Operations Lead, Peak Corporate",
    quote: "Our production team relies on EventOS for timeline scheduling. Shared vendor dashboards and client approval workflows are completely seamless.",
    tags: [{ text: "Corporate Events", type: "default" }, { text: "Peak Corporate", type: "default" }],
    stats: [{ icon: ShieldCheck, text: "Timeline Sync" }, { icon: Users, text: "25+ vendors" }],
    avatarGradient: "linear-gradient(135deg, #10b981, #059669)",
  },
  {
    id: 3,
    initials: "MN",
    name: "Meera Nair",
    role: "Creative Director, Vogue Gala",
    quote: "The media gallery feature is a lifesaver. We upload wedding deliverables directly, and clients love the secure, expiring guest links.",
    tags: [{ text: "Creative Director", type: "default" }, { text: "Gala Specialist", type: "default" }],
    stats: [{ icon: Rocket, text: "Expiring links" }, { icon: Share, text: "Shared 20x" }],
    avatarGradient: "linear-gradient(135deg, #f59e0b, #d97706)",
  },
  {
    id: 4,
    initials: "VM",
    name: "Vikram Malhotra",
    role: "Managing Director, Apex Events India",
    quote: "Managing multiple corporate clients was chaos before EventOS. The multi-tenant workspace switching allows our managers to coordinate securely.",
    tags: [{ text: "Multi-Tenant CRM", type: "featured" }, { text: "Apex Events", type: "default" }],
    stats: [{ icon: Gem, text: "Secure Tenants" }, { icon: ShieldCheck, text: "SOC2 compliant" }],
    avatarGradient: "linear-gradient(135deg, #ec4899, #d946ef)",
  },
  {
    id: 5,
    initials: "SG",
    name: "Sanya Gupta",
    role: "Principal Planner, Luxe Soirees",
    quote: "Customer support is outstanding, and the product gets better every week. Having leads, quotes, invoices, and payment tracking under one hood is unbeatable.",
    tags: [{ text: "Invoicing Automations", type: "default" }, { text: "Luxe Soirees", type: "default" }],
    stats: [{ icon: Zap, text: "Invoice automate" }, { icon: Clock, text: "Saves 15h/wk" }],
    avatarGradient: "linear-gradient(135deg, #3b82f6, #6366f1)",
  },
  {
    id: 6,
    initials: "AM",
    name: "Arjun Mehta",
    role: "Co-founder, EliteDecor Events",
    quote: "We scaled from 20 to 80 events per year after switching to EventOS. The invoicing automation alone saves our accounts team 15 hours a week.",
    tags: [{ text: "Scaled 4x", type: "featured" }, { text: "EliteDecor", type: "default" }],
    stats: [{ icon: Rocket, text: "80+ events/yr" }, { icon: Users, text: "EliteDecor team" }],
    avatarGradient: "linear-gradient(135deg, #a855f7, #ec4899)",
  }
];

export function Testimonials() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      className="py-24 border-b border-[#E5E7EB] bg-[#FFFFFF] relative overflow-hidden"
      id="testimonials"
    >
      {/* Soft background glow circles to match glassmorphic stack */}
      <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-purple-100/30 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-indigo-100/30 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto space-y-4 mb-16"
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 uppercase">
            <Icon icon="solar:star-bold-duotone" className="text-amber-400 text-sm" />
            Client Stories
          </span>

          {/* Aggregate star display */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon key={i} icon="solar:star-bold" className="text-amber-500 text-xl" />
              ))}
            </div>
            <span className="text-slate-900 font-extrabold text-lg">5.0</span>
            <span className="text-slate-600 text-sm font-semibold">from 200+ agencies</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-heading">
            Endorsed by leading{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600">
              production teams.
            </span>
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
            See how high-volume event creators streamline their sales, billing, and scheduling using the EventOS suite.
          </p>
        </motion.div>

        {/* Dynamic Glass Swiper Testimonials Stack */}
        <div className="w-full flex items-center justify-center py-6">
          <TestimonialStack testimonials={testimonialsData} />
        </div>
      </div>
    </section>
  );
}
