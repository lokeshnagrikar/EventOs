"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Icon } from "@iconify/react";
import { MessageSquareWarning, FileSpreadsheet, Images, Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useAuthModalStore } from "@/store/authModalStore";
import { useRouter } from "next/navigation";

export function Testimonials() {
  const shouldReduceMotion = useReducedMotion();
  const openModal = useAuthModalStore((state) => state.openModal);
  const router = useRouter();

  const problemsAndSolutions = [
    {
      icon: MessageSquareWarning,
      iconColor: "text-amber-600 bg-amber-50 border-amber-200/80",
      tag: "The Coordination Problem",
      title: "15 WhatsApp Groups & Lost Stage Cues",
      problem:
        "Important stage cues, sound check schedules, and vendor instructions get buried across a dozen chaotic WhatsApp groups at 11 PM before the Sangeet.",
      solution:
        "Centralized live run-of-show cue sheets with minute-by-minute timeline sync and automated WhatsApp notifications directly to sound engineers, emcees, and crew.",
    },
    {
      icon: FileSpreadsheet,
      iconColor: "text-purple-600 bg-purple-50 border-purple-200/80",
      tag: "The Proposal Bottleneck",
      title: "4 Hours on PDFs & Chasing Advance Deposits",
      problem:
        "Manually calculating 18% GST line items, retyping decor specs into Canva or Word templates, and following up for days to get the 30% booking advance cleared.",
      solution:
        "Send interactive digital proposals in 60 seconds. Clients approve line items and pay milestone advances via instant UPI QR codes without manual chasing.",
    },
    {
      icon: Images,
      iconColor: "text-sky-600 bg-sky-50 border-sky-200/80",
      tag: "The Deliverables Scramble",
      title: "Expiring Drive Links & Scattered Photo Deliveries",
      problem:
        "Photographers sharing loose Google Drive links that expire, RAW photos lost across external hard drives, and frantic WhatsApp messages from clients asking for downloads.",
      solution:
        "White-labeled client delivery portals with secure, expiring guest links and digital photo proofing built directly into the event workspace.",
    },
  ];

  const foundingPerks = [
    "Direct 1-on-1 founder onboarding",
    "Private founder WhatsApp support channel",
    "Shape our roadmap with custom features",
    "50% lifetime price lock guaranteed",
  ];

  return (
    <section
      className="py-24 border-b border-slate-200/80 bg-[#FAF9F6] relative overflow-hidden text-left"
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
          className="text-center max-w-3xl mx-auto space-y-4 mb-16"
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-purple-700 bg-purple-100/80 border border-purple-200 px-3.5 py-1.5 rounded-full uppercase">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Why We're Building EventOS
          </span>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-heading leading-tight">
            Built out of frustration with spreadsheets, WhatsApp chaos, and{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600">
              payment chasing.
            </span>
          </h2>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium max-w-2xl mx-auto">
            Indian wedding and event agencies manage crores in production budgets every season using fragmented WhatsApp chats, fragile Excel sheets, and manual invoice follow-ups. We experienced this operational mess firsthand and decided to build the dedicated operating system the industry actually needs.
          </p>
        </motion.div>

        {/* 3 Problem & Solution Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {problemsAndSolutions.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: idx * 0.1 }}
                className="p-7 rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-6 group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${item.iconColor} transition-transform duration-300 group-hover:scale-110`}>
                      <IconComp size={22} />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80">
                      {item.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 font-heading leading-snug">
                      {item.title}
                    </h3>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-100 text-xs text-rose-950 font-medium leading-relaxed">
                      <span className="font-extrabold text-rose-700 block uppercase text-[9px] tracking-wider mb-1">
                        The Pain Today
                      </span>
                      {item.problem}
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-950 font-medium leading-relaxed">
                      <span className="font-extrabold text-emerald-700 block uppercase text-[9px] tracking-wider mb-1 flex items-center gap-1">
                        <CheckCircle2 size={11} className="text-emerald-600" />
                        How EventOS Solves It
                      </span>
                      {item.solution}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Founder Letter & Founding Agency Cohort CTA */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55 }}
          className="rounded-3xl border border-purple-200/90 bg-gradient-to-br from-purple-50/70 via-white to-indigo-50/60 p-8 sm:p-12 shadow-xl shadow-purple-500/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-200/30 blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Founder Message */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck size={14} className="text-purple-600" />
                Private Beta Cohort • Limited to 25 Founding Agencies
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading leading-tight">
                We're looking for 25 high-standard Indian event agencies to build with us.
              </h3>

              <div className="space-y-3 text-sm text-slate-700 font-medium leading-relaxed">
                <p>
                  Generic Western software like HoneyBook or HubSpot doesn't understand 18% GST invoices, banquet lawns with zero mobile signal, or WhatsApp run-of-show alerts.
                </p>
                <p>
                  Instead of launching publicly to hundreds of agencies, we are hand-picking a founding cohort of <strong>25 agency partners</strong>. You'll get direct 1-on-1 access to me, our engineers will build workflows tailored to your agency, and you'll lock in 50% discount pricing for life.
                </p>
              </div>

              {/* Founder Sign-off */}
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0 group/photo cursor-pointer">
                    <img
                      src="/founder-profile/lokesh-nagrikar.png"
                      alt="Lokesh Nagrikar - Founder of EventOS"
                      className="h-14 w-14 rounded-full object-cover border-2 border-purple-500/50 shadow-md transition-all duration-300 group-hover/photo:scale-105 group-hover/photo:border-purple-600 group-hover/photo:shadow-purple-500/20"
                    />
                    <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5 items-center justify-center" title="Online · Building EventOS">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white" />
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-slate-900">Lokesh Nagrikar</h4>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Online</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold">Solo Founder & Engineer • Nagpur, India</p>
                  </div>
                </div>

                <motion.a
                  href="https://www.instagram.com/solo.founder.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className="relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold text-white shadow-md shadow-pink-500/20 overflow-hidden group/insta cursor-pointer transition-shadow hover:shadow-lg hover:shadow-pink-500/30"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] transition-all duration-300 group-hover/insta:opacity-95" />
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/insta:translate-x-full duration-700 transition-transform ease-in-out" />
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon icon="simple-icons:instagram" className="text-sm" />
                    <span>@solo.founder.ai</span>
                  </span>
                </motion.a>
              </div>
            </div>

            {/* Right: Founding Member Perks & Action Box */}
            <div className="lg:col-span-5 p-6 sm:p-7 rounded-2xl bg-white border border-purple-100 shadow-lg shadow-purple-500/5 space-y-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 block mb-1">
                  Founding Partner Benefits
                </span>
                <h4 className="text-lg font-bold text-slate-900 font-heading">
                  What you get as Founding Agency #1–25:
                </h4>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700 font-semibold">
                {foundingPerks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={13} />
                    </div>
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-4 pt-1">
                {/* Cohort Scarcity Progress Bar */}
                <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100/90 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      Founding Agency Slots
                    </span>
                    <span className="text-purple-700 font-mono font-extrabold">19 / 25 Reserved</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "76%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 rounded-full"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span className="text-amber-700 font-bold">🔥 6 slots remaining</span>
                    <span className="text-emerald-600 font-extrabold">50% Lifetime discount</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <motion.button
                    onClick={() => openModal("waitlist")}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 cursor-pointer overflow-hidden group transition-all"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform ease-in-out" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <span>Apply for Founding Agency Cohort</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </motion.button>

                  <button
                    onClick={() => router.push("/founder-story")}
                    className="w-full py-2 text-xs font-bold text-purple-600 hover:text-purple-700 text-center block transition-colors cursor-pointer"
                  >
                    Read our full founder story & journey →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
