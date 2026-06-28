"use client";

import React, { useRef, useEffect } from "react";
import { useReducedMotion } from "framer-motion";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { Icon } from "@iconify/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const steps = [
  {
    title: "Lead",
    desc: "Client inquiry logged in CRM",
    icon: "solar:users-group-rounded-bold-duotone",
    iconColor: "#8B5CF6",
    gradientFrom: "#8B5CF6",
    gradientTo: "#EC4899",
    pathColor: "rgba(139, 92, 246, 0.15)",
    borderColor: "border-purple-500/30",
  },
  {
    title: "Quote",
    desc: "Proposal accepted by client",
    icon: "solar:document-text-bold-duotone",
    iconColor: "#EC4899",
    gradientFrom: "#EC4899",
    gradientTo: "#06B6D4",
    pathColor: "rgba(236, 72, 153, 0.15)",
    borderColor: "border-pink-500/30",
  },
  {
    title: "Booking",
    desc: "Contract signed, dates locked",
    icon: "solar:check-square-bold-duotone",
    iconColor: "#06B6D4",
    gradientFrom: "#06B6D4",
    gradientTo: "#6366F1",
    pathColor: "rgba(6, 182, 212, 0.15)",
    borderColor: "border-cyan-500/30",
  },
  {
    title: "Event",
    desc: "Timelines & tasks coordinated",
    icon: "solar:calendar-bold-duotone",
    iconColor: "#6366F1",
    gradientFrom: "#6366F1",
    gradientTo: "#F59E0B",
    pathColor: "rgba(99, 102, 241, 0.15)",
    borderColor: "border-indigo-500/30",
  },
  {
    title: "Gallery",
    desc: "High-res media delivered",
    icon: "solar:gallery-bold-duotone",
    iconColor: "#F59E0B",
    gradientFrom: "#F59E0B",
    gradientTo: "#10B981",
    pathColor: "rgba(245, 158, 11, 0.15)",
    borderColor: "border-amber-500/30",
  },
  {
    title: "Payment",
    desc: "Milestones invoiced & cleared",
    icon: "solar:wallet-money-bold-duotone",
    iconColor: "#10B981",
    gradientFrom: "#10B981",
    gradientTo: "#10B981",
    pathColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "border-emerald-500/30",
  },
];

export function Workflow() {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const refs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (shouldReduceMotion) {
      gsap.set(".gsap-workflow-step", { opacity: 1, scale: 1, y: 0 });
      gsap.set(".gsap-workflow-stat", { opacity: 1, y: 0 });
      return;
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#workflow-timeline-container",
        start: "top 80%",
        toggleActions: "play none none none",
      },
    });

    tl.fromTo(
      ".gsap-workflow-step",
      { opacity: 0, scale: 0.85, y: 20 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        stagger: 0.12,
        duration: 0.55,
        ease: "power2.out",
      }
    ).fromTo(
      ".gsap-workflow-stat",
      { opacity: 0, y: 15 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.1,
        duration: 0.45,
        ease: "power2.out",
      },
      "-=0.25"
    );

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [shouldReduceMotion]);

  return (
    <section
      className="py-24 border-b border-zinc-900 bg-zinc-950/40 relative overflow-hidden"
      id="workflow"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-purple-500/5 to-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-20">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#06B6D4] uppercase">
            <Icon icon="solar:routing-bold-duotone" className="text-sm" />
            Integrated Lifecycle
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-heading">
            The Complete Event{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
              Workflow
            </span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            See how prospective leads turn into fully paid bookings and finished galleries inside the automated EventOS ecosystem — no context switching required.
          </p>
        </div>

        {/* Workflow Beam Container */}
        <div id="workflow-timeline-container" ref={containerRef} className="relative w-full py-8">
          
          {/* Animated Beams */}
          {!shouldReduceMotion &&
            steps.slice(0, -1).map((step, idx) => (
              <AnimatedBeam
                key={idx}
                containerRef={containerRef}
                fromRef={refs[idx]}
                toRef={refs[idx + 1]}
                curvature={0}
                duration={4}
                delay={idx * 0.5}
                gradientStartColor={step.gradientFrom}
                gradientStopColor={step.gradientTo}
                pathColor={step.pathColor}
              />
            ))}

          {/* Step Nodes */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 md:gap-4 relative z-10">
            {steps.map((step, idx) => (
              <div
                key={step.title}
                className="gsap-workflow-step opacity-0 flex flex-col items-center text-center space-y-4"
              >
                <div
                  ref={refs[idx]}
                  className={`h-16 w-16 rounded-full border-2 bg-zinc-950 flex items-center justify-center shadow-lg relative group transition-all duration-300 hover:bg-zinc-900 ${step.borderColor}`}
                  style={{ boxShadow: `0 0 20px ${step.iconColor}15` }}
                >
                  <Icon icon={step.icon} style={{ color: step.iconColor }} className="text-2xl" />
                  {/* Step number badge */}
                  <span
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-extrabold border text-white"
                    style={{ background: step.iconColor, borderColor: "#09090B" }}
                  >
                    {idx + 1}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-zinc-200">{step.title}</h3>
                  <p className="text-zinc-500 text-[10px] sm:text-xs leading-relaxed max-w-[120px] mx-auto">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stat bar */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[
            { value: "< 15 min", label: "Average time to create & send a proposal" },
            { value: "Zero", label: "Manual data re-entry between pipeline stages" },
            { value: "100%", label: "Automated invoice generation from bookings" },
          ].map((item) => (
            <div key={item.label} className="gsap-workflow-stat opacity-0 text-center p-4 rounded-xl bg-zinc-950/40 border border-zinc-900">
              <p className="text-lg font-extrabold text-white font-heading">{item.value}</p>
              <p className="text-[10px] text-zinc-500 mt-1 leading-snug">{item.label}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
