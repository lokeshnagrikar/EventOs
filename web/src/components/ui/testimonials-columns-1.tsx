"use client";

import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";

export interface TestimonialItem {
  text: string;
  image: string;
  name: string;
  role: string;
  company?: string;
  badge?: string;
}

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: TestimonialItem[];
  duration?: number;
  reverse?: boolean;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: props.reverse ? ["-50%", "0%"] : ["0%", "-50%"],
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-transparent"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role, company, badge }, i) => (
                <div
                  className="p-6 sm:p-7 rounded-3xl border border-purple-200/80 bg-white/70 backdrop-blur-2xl backdrop-saturate-[1.8] shadow-[0_10px_30px_rgba(124,58,237,0.08),inset_0_1px_2px_rgba(255,255,255,0.95)] hover:shadow-[0_16px_40px_rgba(124,58,237,0.18)] hover:border-purple-400 transition-all duration-300 relative overflow-hidden max-w-xs w-full group"
                  key={i}
                >
                  {/* Top specular glass sheen line */}
                  <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-purple-300/80 to-transparent pointer-events-none" />

                  {/* Stars Rating */}
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, starIdx) => (
                      <Icon key={starIdx} icon="solar:star-bold" className="text-amber-400 text-sm" />
                    ))}
                  </div>

                  {/* Testimonial Quote */}
                  <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                    &ldquo;{text}&rdquo;
                  </p>

                  {/* User Profile */}
                  <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-200/80">
                    <img
                      width={40}
                      height={40}
                      src={image}
                      alt={name}
                      className="h-10 w-10 rounded-full object-cover border-2 border-purple-300/80 shadow-sm shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="font-bold text-xs text-slate-900 tracking-tight leading-snug truncate group-hover:text-purple-700 transition-colors">
                        {name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium tracking-tight leading-snug truncate">
                        {role} {company ? `• ${company}` : ""}
                      </div>
                    </div>
                  </div>

                  {badge && (
                    <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-[10px] font-extrabold text-purple-700">
                      <span>✨</span>
                      <span>{badge}</span>
                    </div>
                  )}
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};
