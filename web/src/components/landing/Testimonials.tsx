"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Marquee } from "@/components/ui/marquee";
import { Icon } from "@iconify/react";
import Image from "next/image";

const testimonials = [
  {
    name: "Aparna Sen",
    role: "Founder, Sen Weddings & Co.",
    quote: "EventOS has transformed our wedding agency operations. Proposal drafting that took 4 hours now takes 15 minutes, and clients pay deposits instantly.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80",
    rating: 5,
    company: "Sen Weddings",
  },
  {
    name: "Rohan Kapoor",
    role: "Operations Lead, Peak Corporate",
    quote: "Our production team relies on EventOS for timeline scheduling. Shared vendor dashboards and client approval workflows are completely seamless.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80",
    rating: 5,
    company: "Peak Corporate",
  },
  {
    name: "Meera Nair",
    role: "Creative Director, Vogue Gala",
    quote: "The media gallery feature is a lifesaver. We upload wedding deliverables directly, and clients love the secure, expiring guest links.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80",
    rating: 5,
    company: "Vogue Gala",
  },
  {
    name: "Vikram Malhotra",
    role: "Managing Director, Apex Events India",
    quote: "Managing multiple corporate clients was chaos before EventOS. The multi-tenant workspace switching allows our managers to coordinate securely.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80",
    rating: 5,
    company: "Apex Events",
  },
  {
    name: "Sanya Gupta",
    role: "Principal Planner, Luxe Soirees",
    quote: "Customer support is outstanding, and the product gets better every week. Having leads, quotes, invoices, and payment tracking under one hood is unbeatable.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100&q=80",
    rating: 5,
    company: "Luxe Soirees",
  },
  {
    name: "Arjun Mehta",
    role: "Co-founder, EliteDecor Events",
    quote: "We scaled from 20 to 80 events per year after switching to EventOS. The invoicing automation alone saves our accounts team 15 hours a week.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&h=100&q=80",
    rating: 5,
    company: "EliteDecor",
  },
];

const firstRow = testimonials.slice(0, 4);
const secondRow = testimonials.slice(2);

function TestimonialCard({ t }: { t: (typeof testimonials)[0] }) {
  return (
    <div className="w-[320px] sm:w-[370px] p-5 rounded-2xl border border-zinc-900 bg-zinc-950/50 backdrop-blur-sm flex flex-col justify-between gap-4 select-none hover:border-zinc-800/80 transition-all duration-300 mx-2 text-left group hover:shadow-xl hover:shadow-purple-950/5 relative overflow-hidden">
      {/* Subtle gradient top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />

      <div className="flex gap-0.5">
        {Array.from({ length: t.rating }).map((_, i) => (
          <Icon key={i} icon="solar:star-bold" className="text-amber-500 text-sm" />
        ))}
      </div>

      <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed font-medium flex-1">
        &ldquo;{t.quote}&rdquo;
      </p>

      <div className="flex items-center gap-3">
        <div className="relative h-9 w-9 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 shrink-0">
          <Image
            src={t.avatar}
            alt={t.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white leading-tight">{t.name}</h4>
          <span className="text-[10px] text-zinc-500 font-medium block">{t.role}</span>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      className="py-24 border-b border-zinc-900 bg-zinc-950/20 relative overflow-hidden"
      id="testimonials"
    >
      <div className="absolute top-1/4 right-1/4 w-[350px] h-[350px] bg-purple-950/5 blur-[120px] rounded-full pointer-events-none" />

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
          <div className="flex items-center justify-center gap-2">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon key={i} icon="solar:star-bold" className="text-amber-500 text-xl" />
              ))}
            </div>
            <span className="text-white font-extrabold text-lg">5.0</span>
            <span className="text-zinc-500 text-sm font-medium">from 200+ agencies</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Endorsed by leading{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400">
              production teams.
            </span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            See how high-volume event creators streamline their sales, billing, and scheduling using the EventOS suite.
          </p>
        </motion.div>

        {/* Testimonial Marquees */}
        <div className="relative flex flex-col items-center justify-center overflow-hidden w-full gap-3">
          <Marquee className="[--duration:35s]" pauseOnHover>
            {firstRow.map((t) => <TestimonialCard key={t.name} t={t} />)}
          </Marquee>
          <Marquee className="[--duration:30s]" reverse pauseOnHover>
            {secondRow.map((t) => <TestimonialCard key={t.name + "-r"} t={t} />)}
          </Marquee>

          {/* Side fade caps */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/12 sm:w-1/6 bg-gradient-to-r from-zinc-950/90 to-transparent z-20" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/12 sm:w-1/6 bg-gradient-to-l from-zinc-950/90 to-transparent z-20" />
        </div>
      </div>
    </section>
  );
}
