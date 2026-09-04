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

import { TestimonialsColumn, TestimonialItem } from "@/components/ui/testimonials-columns-1";

const marqueeTestimonials: TestimonialItem[] = [
  {
    text: "EventOS has transformed our wedding agency operations. Proposal drafting that took 4 hours now takes 15 minutes, and clients pay deposits instantly.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=250&auto=format&fit=crop",
    name: "Aparna Sen",
    role: "Founder",
    company: "Sen Weddings",
    badge: "15 min quotes"
  },
  {
    text: "Our production team relies on EventOS for timeline scheduling. Shared vendor dashboards and client approval workflows are completely seamless.",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=250&auto=format&fit=crop",
    name: "Rohan Kapoor",
    role: "Operations Lead",
    company: "Peak Corporate",
    badge: "Timeline Sync"
  },
  {
    text: "The media gallery feature is a lifesaver. We upload wedding deliverables directly, and clients love the secure, expiring guest links.",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=250&auto=format&fit=crop",
    name: "Meera Nair",
    role: "Creative Director",
    company: "Vogue Gala",
    badge: "Expiring links"
  },
  {
    text: "Managing multiple corporate clients was chaos before EventOS. The multi-tenant workspace switching allows our managers to coordinate securely.",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=250&auto=format&fit=crop",
    name: "Vikram Malhotra",
    role: "Managing Director",
    company: "Apex Events",
    badge: "SOC2 compliant"
  },
  {
    text: "Customer support is outstanding, and the product gets better every week. Having leads, quotes, invoices, and payment tracking under one hood is unbeatable.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=250&auto=format&fit=crop",
    name: "Sanya Gupta",
    role: "Principal Planner",
    company: "Luxe Soirees",
    badge: "Saves 15h/wk"
  },
  {
    text: "We scaled from 20 to 80 events per year after switching to EventOS. The invoicing automation alone saves our accounts team 15 hours a week.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=250&auto=format&fit=crop",
    name: "Arjun Mehta",
    role: "Co-founder",
    company: "EliteDecor Events",
    badge: "Scaled 4x"
  },
  {
    text: "The instant UPI & milestone invoice clearing increased our cashflow reliability by 40%. No more chasing payments after event wrap-up.",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=250&auto=format&fit=crop",
    name: "Pooja Sharma",
    role: "Head of Finance",
    company: "Royal Celebrations",
    badge: "+40% Cashflow"
  },
  {
    text: "Client feedback on our new interactive proposals has been 100% positive. Clients love approving line items directly from their mobile phones.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=250&auto=format&fit=crop",
    name: "Kabir Verma",
    role: "Event Producer",
    company: "Starlight Media",
    badge: "100% Mobile Ready"
  },
  {
    text: "Running 350-guest gala events with minute-by-minute stage cue sheets in EventOS gives our stage managers total peace of mind.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=250&auto=format&fit=crop",
    name: "Ananya Roy",
    role: "Stage Director",
    company: "Spotlight Agency",
    badge: "Live Stage Cueing"
  }
];

const col1 = marqueeTestimonials.slice(0, 3);
const col2 = marqueeTestimonials.slice(3, 6);
const col3 = marqueeTestimonials.slice(6, 9);

export function Testimonials() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      className="py-24 border-b border-slate-200/80 bg-[#FAF9F6] relative overflow-hidden"
      id="testimonials"
    >
      {/* Soft background glow circles */}
      <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-purple-100/40 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-indigo-100/40 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto space-y-4 mb-14"
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 uppercase">
            <Icon icon="solar:star-bold-duotone" className="text-amber-500 text-sm" />
            Client Stories
          </span>

          {/* Aggregate star rating badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-sm">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Icon key={i} icon="solar:star-bold" className="text-amber-500 text-base" />
                ))}
              </div>
              <span className="text-slate-900 font-black text-sm">5.0</span>
              <span className="text-slate-600 text-xs font-semibold">from 200+ agencies</span>
            </div>
          </div>

          <p className="text-xs font-extrabold text-purple-600 uppercase tracking-widest">
            Trusted by leading event agencies across India
          </p>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-heading leading-tight">
            Endorsed by leading{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600">
              production teams.
            </span>
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium max-w-xl mx-auto">
            See how high-volume event creators streamline their sales, billing, and scheduling using the EventOS suite.
          </p>
        </motion.div>

        {/* 3-Column Smooth Marquee Grid */}
        <div className="flex justify-center gap-6 mt-8 [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)] max-h-[520px] sm:max-h-[700px] overflow-hidden">
          <TestimonialsColumn testimonials={col1} duration={22} />
          <TestimonialsColumn testimonials={col2} className="hidden md:block" duration={28} reverse />
          <TestimonialsColumn testimonials={col3} className="hidden lg:block" duration={25} />
        </div>
      </div>
    </section>
  );
}
