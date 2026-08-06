"use client";

import React from "react";
import { Marquee } from "@/components/ui/marquee";
import { Icon } from "@iconify/react";

import { motion } from "framer-motion";

const brands = [
  { name: "Vogue Weddings", icon: "solar:heart-bold-duotone", color: "#EC4899" },
  { name: "Apex Productions", icon: "solar:star-shine-bold-duotone", color: "#8B5CF6" },
  { name: "Echo Planners", icon: "solar:calendar-bold-duotone", color: "#06B6D4" },
  { name: "Horizon Galas", icon: "solar:compass-bold-duotone", color: "#10B981" },
  { name: "Starlight Agency", icon: "solar:star-bold-duotone", color: "#F59E0B" },
  { name: "Nova Premium Events", icon: "solar:medal-star-bold-duotone", color: "#6366F1" },
  { name: "Bloom Event Co.", icon: "solar:flower-bold-duotone", color: "#F472B6" },
  { name: "Summit Occasions", icon: "solar:buildings-bold-duotone", color: "#14B8A6" },
  { name: "Prestige Soirees", icon: "solar:cup-star-bold-duotone", color: "#A78BFA" },
  { name: "Elara Weddings", icon: "solar:diamond-bold-duotone", color: "#FB923C" },
];

function BrandPill({ brand }: { brand: (typeof brands)[0] }) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-2.5 mx-3 rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-sm select-none hover:border-purple-300 transition-colors shadow-sm group">
      <div
        className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
        style={{ background: `${brand.color}18`, border: `1px solid ${brand.color}30` }}
      >
        <Icon icon={brand.icon} style={{ color: brand.color }} className="text-base" />
      </div>
      <span className="text-sm font-bold text-slate-800 group-hover:text-purple-700 transition-colors tracking-tight whitespace-nowrap">
        {brand.name}
      </span>
    </div>
  );
}

export function TrustedBy() {
  const firstRow = brands.slice(0, 6);
  const secondRow = brands.slice(4);

  return (
    <section className="py-12 border-t border-b border-slate-200/80 bg-[#FAF9F6] w-full relative z-10 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="max-w-7xl mx-auto px-6 mb-7"
      >
        <p className="text-center text-[10px] font-extrabold text-slate-600 uppercase tracking-widest">
          Trusted by high-end planners, luxury wedding agencies, and production teams globally
        </p>
      </motion.div>

      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden gap-3">
        <Marquee className="[--duration:30s] py-1" pauseOnHover>
          {firstRow.map((brand) => <BrandPill key={brand.name} brand={brand} />)}
        </Marquee>
        <Marquee className="[--duration:25s] py-1" reverse pauseOnHover>
          {secondRow.map((brand) => <BrandPill key={brand.name + "-r"} brand={brand} />)}
        </Marquee>

        {/* Fade overlays */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-[#FAF9F6] via-[#FAF9F6]/80 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-[#FAF9F6] via-[#FAF9F6]/80 to-transparent z-10" />
      </div>
    </section>
  );
}
