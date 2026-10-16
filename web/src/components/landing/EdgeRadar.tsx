"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuthModalStore } from "@/store/authModalStore";

interface RadarNode {
  id: string;
  label: string;
  num: string;
}

const RADAR_NODES: RadarNode[] = [
  { id: "hero", label: "Overview", num: "01" },
  { id: "workflow", label: "Workflow Engine", num: "02" },
  { id: "showcase", label: "Product Core", num: "03" },
  { id: "modules", label: "SaaS Modules", num: "04" },
  { id: "portal-preview", label: "VIP Portal", num: "05" },
  { id: "time-calculator", label: "ROI Calculator", num: "06" },
  { id: "pricing", label: "Pricing & Plans", num: "07" },
  { id: "faq", label: "FAQ & Trust", num: "08" },
];

export function EdgeRadar({ activeSection }: { activeSection?: string }) {
  const [currentSection, setCurrentSection] = useState<string>("hero");
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isNearBottom, setIsNearBottom] = useState(false);
  const isAnyModalOpen = useAuthModalStore((s) => s.isOpen || s.isLogoutOpen);

  // Sync with prop if passed, otherwise compute active
  useEffect(() => {
    if (activeSection) {
      // Map active section to nearest radar node
      const matched = RADAR_NODES.find((node) => node.id === activeSection);
      if (matched) {
        setCurrentSection(matched.id);
      } else {
        // Fallbacks for intermediate sections
        if (["trust-strip", "problem"].includes(activeSection)) setCurrentSection("hero");
        if (["ai-assistant", "testimonials"].includes(activeSection)) setCurrentSection("portal-preview");
        if (["security", "founder"].includes(activeSection)) setCurrentSection("pricing");
        if (["final-cta"].includes(activeSection)) setCurrentSection("faq");
      }
    }
  }, [activeSection]);

  // Track overall scroll progress for active gradient bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollY / docHeight) * 100)) : 0;
      setScrollProgress(progress);

      // Hide near footer to avoid overlapping
      const nearBottom = window.innerHeight + scrollY >= document.documentElement.scrollHeight - 160;
      setIsNearBottom(nearBottom);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollTo = (id: string) => {
    const elem = document.getElementById(id);
    if (elem) {
      const lenis = (window as any).lenis;
      if (lenis) {
        lenis.scrollTo(elem, { offset: -70, duration: 1.1 });
      } else {
        const top = elem.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
  };

  // Find active node index for line progress
  const activeIndex = useMemo(() => {
    const idx = RADAR_NODES.findIndex((n) => n.id === currentSection);
    return idx >= 0 ? idx : 0;
  }, [currentSection]);

  if (isAnyModalOpen || isNearBottom) return null;

  return (
    <div
      aria-label="Section Navigation Radar"
      className="fixed right-3 xl:right-5 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center select-none pointer-events-auto transition-opacity duration-300"
    >
      {/* Outer subtle capsule shell with ultra-refined glass */}
      <div className="relative py-3 px-1.5 flex flex-col items-center">
        {/* Background Vertical Hairline Track */}
        <div className="absolute top-5 bottom-5 w-[1.5px] bg-slate-400/20 dark:bg-white/[0.08] rounded-full pointer-events-none" />

        {/* Dynamic Glowing Progress Fill */}
        <motion.div
          className="absolute top-5 w-[1.5px] bg-gradient-to-b from-purple-500 via-indigo-500 to-cyan-400 shadow-[0_0_8px_rgba(168,85,247,0.85)] rounded-full pointer-events-none"
          initial={false}
          animate={{
            height: `${(activeIndex / (RADAR_NODES.length - 1)) * 100}%`,
          }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
        />

        {/* Radar Nodes */}
        <div className="flex flex-col items-center gap-4 relative z-10">
          {RADAR_NODES.map((node, index) => {
            const isActive = currentSection === node.id;
            const isPassed = index <= activeIndex;

            return (
              <div
                key={node.id}
                className="relative flex items-center justify-center group"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Interactive Click Hitbox */}
                <button
                  type="button"
                  onClick={() => handleScrollTo(node.id)}
                  aria-label={`Jump to ${node.label}`}
                  className="w-6 h-6 flex items-center justify-center cursor-pointer outline-none focus:outline-none"
                >
                  {/* Micro Indicator Dot */}
                  <motion.div
                    className={cn(
                      "rounded-full transition-all duration-300",
                      isActive
                        ? "w-2.5 h-2.5 bg-gradient-to-tr from-purple-400 to-cyan-400 shadow-[0_0_12px_rgba(168,85,247,0.9),0_0_4px_rgba(56,189,248,0.9)] ring-2 ring-purple-500/30"
                        : isPassed
                        ? "w-1.5 h-1.5 bg-purple-400/80 group-hover:scale-125"
                        : "w-1.5 h-1.5 bg-slate-400/40 dark:bg-zinc-600/60 group-hover:bg-slate-300 group-hover:scale-125"
                    )}
                    layoutId={isActive ? "active-radar-dot" : undefined}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                </button>

                {/* Apple/Linear Floating Glass Tooltip */}
                <AnimatePresence>
                  {hoveredNode === node.id && (
                    <motion.div
                      initial={{ opacity: 0, x: 8, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 6, scale: 0.95 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                      className="absolute right-full mr-3.5 pointer-events-none whitespace-nowrap z-50 flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#080b18]/95 dark:bg-[#060813]/98 text-white shadow-[0_12px_32px_rgba(0,0,0,0.5),0_0_20px_rgba(168,85,247,0.25)] border border-white/[0.12] backdrop-blur-2xl"
                    >
                      {/* Left Subtle Indicator Pip */}
                      <span className="text-[10px] font-mono font-black text-purple-400/90 tracking-wider">
                        {node.num}
                      </span>
                      <span className="h-2 w-[1px] bg-white/[0.15]" />
                      <span className="text-xs font-semibold text-slate-100 tracking-tight">
                        {node.label}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
