"use client";

import React from "react";
import { motion } from "framer-motion";

export function TrustedBy() {
  const metrics = [
    { value: "25 Agencies", label: "Founding Cohort Limited" },
    { value: "1-on-1", label: "Direct Founder Onboarding" },
    { value: "100%", label: "Tenant Data Isolation" },
    { value: "18% GST", label: "Automated Tax Compliance" },
  ];

  return (
    <section className="py-10 border-t border-b border-slate-200/80 bg-white/70 backdrop-blur-md w-full relative z-10" id="trust-strip">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-slate-200/90"
        >
          {metrics.map((metric, i) => (
            <div key={i} className="space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading block">
                {metric.value}
              </span>
              <p className="text-[11px] sm:text-xs font-bold text-slate-600 tracking-wide font-sans uppercase">
                {metric.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

