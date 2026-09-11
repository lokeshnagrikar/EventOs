"use client";

import React from "react";
import { motion } from "framer-motion";

export function TrustedBy() {
  const metrics = [
    { value: "25 Slots", label: "Founding Agencies Cohort" },
    { value: "1-on-1", label: "Direct Founder Onboarding" },
    { value: "100%", label: "Tenant-Isolated Architecture" },
  ];

  return (
    <section className="py-12 border-t border-b border-slate-200/80 bg-[#FAF9F6] w-full relative z-10">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-200/90"
        >
          {metrics.map((metric, i) => (
            <div key={i} className="pt-4 md:pt-0 md:px-6 space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-heading block">
                {metric.value}
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-600 tracking-wide font-sans uppercase">
                {metric.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

