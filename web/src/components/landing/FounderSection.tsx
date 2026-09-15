"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Icon } from "@iconify/react";
import { ArrowRight, UserCheck, MessageSquare, Wrench, Sparkles, CheckCircle2 } from "lucide-react";
import { useAuthModalStore } from "@/store/authModalStore";
import { useRouter } from "next/navigation";

export function FounderSection() {
  const shouldReduceMotion = useReducedMotion();
  const openModal = useAuthModalStore((state) => state.openModal);
  const router = useRouter();

  const founderPillars = [
    {
      title: "Direct Founder Onboarding",
      desc: "Get 1-on-1 assistance setting up your quotation templates, event timelines, and client portal.",
      icon: "solar:user-hand-up-bold-duotone",
    },
    {
      title: "Direct Access for Questions",
      desc: "Fast, personal support when you are preparing for high-stakes wedding weekends and urgent events.",
      icon: "solar:chat-round-dots-bold-duotone",
    },
    {
      title: "Customer-Driven Roadmap",
      desc: "We build new features based on real planner feedback, not software trends or Silicon Valley hype.",
      icon: "solar:tuning-square-2-bold-duotone",
    },
    {
      title: "Built Alongside Early Agencies",
      desc: "Co-designed with active event teams to replace chaotic WhatsApp groups and scattered spreadsheets.",
      icon: "solar:users-group-two-rounded-bold-duotone",
    },
  ];

  return (
    <section
      id="founder"
      className="py-24 sm:py-32 border-b border-slate-200/80 bg-[#FAF9F6] relative overflow-hidden text-left font-sans"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-purple-200/90 bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/40 p-6 sm:p-10 lg:p-12 shadow-xl shadow-purple-500/5 relative overflow-hidden"
        >
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-200/25 blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Founder Story */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100/80 border border-purple-200 text-purple-800 text-xs font-bold uppercase tracking-wider">
                <Sparkles size={13} className="text-purple-600" />
                <span>Founder's Commitment</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 font-heading leading-tight">
                Built for Event Businesses,{" "}
                <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
                  Not Just Software Teams.
                </span>
              </h2>

              <div className="space-y-3.5 text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
                <p>
                  Event agencies don't need generic software designed for tech startups. You manage high-stakes, real-world productions — multi-day weddings, strict client timelines, vendor coordination, and high-pressure event days.
                </p>
                <p>
                  I'm building EventOS directly alongside event and wedding planners to solve those exact operational headaches. When you join EventOS, you get direct access to me for onboarding, personalized setup, and feedback. We build what actually saves your team time on the ground.
                </p>
              </div>

              {/* Founder Profile Box */}
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-slate-200/70 pt-5">
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <img
                      src="/founder-profile/lokesh-nagrikar.png"
                      alt="Lokesh Nagrikar - Founder & Engineer"
                      className="h-14 w-14 rounded-full object-cover border-2 border-purple-400 shadow-sm"
                    />
                    <span
                      className="absolute bottom-0 right-0 flex h-3.5 w-3.5 items-center justify-center"
                      title="Online · Building EventOS"
                    >
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Lokesh Nagrikar
                    </h3>
                    <p className="text-xs text-purple-700 font-bold">
                      Founder & Engineer
                    </p>
                  </div>
                </div>

                <a
                  href="https://www.instagram.com/solo.founder.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-xs hover:opacity-95 transition-opacity"
                >
                  <Icon icon="simple-icons:instagram" className="text-sm" />
                  <span>@solo.founder.ai</span>
                </a>
              </div>
            </div>

            {/* Right: Concrete Pillars of Founder Access */}
            <div className="lg:col-span-5 p-6 sm:p-7 rounded-2xl bg-white border border-purple-100 shadow-lg shadow-purple-500/5 space-y-5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 font-mono block mb-1">
                  How We Work With You
                </span>
                <h4 className="text-base font-extrabold text-slate-900">
                  Building Alongside Early Agencies
                </h4>
              </div>

              <div className="space-y-3">
                {founderPillars.map((pillar, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs">
                    <div className="h-8 w-8 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-700 shrink-0 mt-0.5">
                      <Icon icon={pillar.icon} className="text-base" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-slate-900 text-xs">
                        {pillar.title}
                      </h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium mt-0.5">
                        {pillar.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => router.push("/demo")}
                  className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-md shadow-purple-500/20 transition-all cursor-pointer"
                >
                  <span>Book a Demo with Lokesh</span>
                  <ArrowRight size={14} />
                </button>

                <p className="text-[11px] text-center text-slate-500 font-medium">
                  Direct founder onboarding • No setup fees
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
