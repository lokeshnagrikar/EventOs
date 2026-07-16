"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Sparkles, X, Pause, Play, RotateCcw } from "lucide-react";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useRouter, usePathname } from "next/navigation";

interface TourStep {
  selector: string;
  title: string;
  text: string;
  path: string;
}

const TOUR_STEPS: TourStep[] = [
  { selector: 'a[href="/dashboard"]', title: "Dashboard", text: "Your command center. Track upcoming schedules, review recent activity, and monitor real-time analytics at a glance.", path: "/dashboard" },
  { selector: 'a[href="/ai"]', title: "AI Command Center", text: "Leverage AI models to generate event briefs, write contracts, and automate task management.", path: "/ai" },
  { selector: 'a[href="/crm"]', title: "CRM Pipeline", text: "Manage customer leads, track communication history, and move deals through your sales pipeline.", path: "/crm" },
  { selector: 'a[href="/events"]', title: "Events Planner", text: "Schedule events, coordinate venue logistics, manage vendor timelines, and track delivery milestones.", path: "/events" },
  { selector: 'a[href="/quotes"]', title: "Quotes & Bookings", text: "Draft billing estimates, send interactive proposals, and convert accepted quotes into bookings.", path: "/quotes" },
  { selector: 'a[href="/invoices"]', title: "Invoices & Payments", text: "Generate professional invoices, track payment status, and manage milestone billing.", path: "/invoices" },
  { selector: 'a[href="/gallery"]', title: "Media Galleries", text: "Upload event photos, organize galleries, and share them with clients via secure portals.", path: "/gallery" },
  { selector: 'a[href="/settings"]', title: "Workspace Settings", text: "Configure your company profile, brand identity, team members, billing, and integrations.", path: "/settings" },
];

export default function ProductTourSpotlight() {
  const router = useRouter();
  const pathname = usePathname();
  const { isTourActive, tourStep, tourPaused, nextTourStep, prevTourStep, endTour, pauseTour, restartTour } = useOnboardingStore();
  const [elementRect, setElementRect] = useState<DOMRect | null>(null);

  const activeStep = TOUR_STEPS[tourStep];

  // Re-calculate spotlight box on step change, resize, scroll or path change
  useEffect(() => {
    if (!isTourActive || !activeStep) return;

    // Check if we need to route to the correct page first
    if (activeStep.path && pathname !== activeStep.path) {
      router.push(activeStep.path);
      const timer = setTimeout(() => calculateRect(), 600);
      return () => clearTimeout(timer);
    }

    calculateRect();

    function calculateRect() {
      const element = document.querySelector(activeStep.selector);
      if (element) {
        element.scrollIntoView({ block: "center", behavior: "smooth" });
        setElementRect(element.getBoundingClientRect());
      } else {
        setElementRect(null);
      }
    }

    window.addEventListener("resize", calculateRect);
    window.addEventListener("scroll", calculateRect);

    return () => {
      window.removeEventListener("resize", calculateRect);
      window.removeEventListener("scroll", calculateRect);
    };
  }, [isTourActive, tourStep, pathname, activeStep, router]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isTourActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") endTour();
      if (e.key === "ArrowRight" && tourStep < TOUR_STEPS.length - 1) nextTourStep();
      if (e.key === "ArrowLeft" && tourStep > 0) prevTourStep();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTourActive, tourStep, endTour, nextTourStep, prevTourStep]);

  if (!isTourActive || !activeStep || !elementRect) return null;

  const tooltipX = elementRect.left + elementRect.width + 16 > window.innerWidth - 320
    ? elementRect.left - 320 - 16
    : elementRect.left + elementRect.width + 16;

  const tooltipY = Math.min(
    window.innerHeight - 260,
    Math.max(16, elementRect.top + (elementRect.height / 2) - 100)
  );

  const progressPercent = Math.round(((tourStep + 1) / TOUR_STEPS.length) * 100);

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none select-none" role="dialog" aria-label="Product tour">
      {/* SVG Spotlight Dim Overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="spotlight-mask-cutout">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={elementRect.left - 8}
              y={elementRect.top - 8}
              width={elementRect.width + 16}
              height={elementRect.height + 16}
              rx={12}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.70)"
          mask="url(#spotlight-mask-cutout)"
          onClick={endTour}
          className="cursor-pointer"
        />
      </svg>

      {/* Glowing Highlight Border with pulse */}
      <div
        className="absolute pointer-events-none border-2 border-purple-500 rounded-2xl shadow-[0_0_24px_rgba(139,92,246,0.4)] transition-all duration-300 animate-pulse"
        style={{
          left: elementRect.left - 8,
          top: elementRect.top - 8,
          width: elementRect.width + 16,
          height: elementRect.height + 16
        }}
      />

      {/* Floating Tooltip */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.35 }}
        className="absolute w-80 pointer-events-auto bg-zinc-950/95 border border-zinc-850 p-5 rounded-2xl shadow-2xl backdrop-blur-md space-y-3 z-[9999]"
        style={{ left: tooltipX, top: tooltipY }}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
          <div className="flex items-center gap-1.5 text-purple-400">
            <Sparkles size={12} />
            <span className="text-[10px] font-black uppercase tracking-wider text-white">
              {activeStep.title}
            </span>
          </div>
          <button onClick={endTour} className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 transition cursor-pointer" aria-label="End tour">
            <X size={12} />
          </button>
        </div>

        {/* Description */}
        <p className="text-[10.5px] text-zinc-300 leading-relaxed font-semibold">
          {activeStep.text}
        </p>

        {/* Progress bar */}
        <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full"
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center pt-1 text-[9px] font-bold">
          <span className="text-zinc-550 font-mono">
            {tourStep + 1} / {TOUR_STEPS.length}
          </span>
          <div className="flex gap-1.5">
            {/* Pause button */}
            <button
              onClick={pauseTour}
              className="px-2 py-1 rounded-lg border border-zinc-850 bg-zinc-900 text-zinc-400 hover:text-white transition flex items-center gap-0.5 cursor-pointer"
              aria-label="Pause tour"
            >
              <Pause size={9} /> Pause
            </button>
            {/* Restart button */}
            <button
              onClick={restartTour}
              className="px-2 py-1 rounded-lg border border-zinc-850 bg-zinc-900 text-zinc-400 hover:text-white transition flex items-center gap-0.5 cursor-pointer"
              aria-label="Restart tour"
            >
              <RotateCcw size={9} />
            </button>
            {/* Back */}
            {tourStep > 0 && (
              <button
                onClick={prevTourStep}
                className="px-2 py-1 rounded-lg border border-zinc-850 bg-zinc-900 text-zinc-400 hover:text-white transition flex items-center gap-0.5 cursor-pointer"
              >
                <ChevronLeft size={10} /> Back
              </button>
            )}
            {/* Next / Done */}
            {tourStep < TOUR_STEPS.length - 1 ? (
              <button
                onClick={nextTourStep}
                className="px-2.5 py-1 rounded-lg bg-purple-650 hover:bg-purple-600 text-white transition flex items-center gap-0.5 cursor-pointer"
              >
                Next <ChevronRight size={10} />
              </button>
            ) : (
              <button
                onClick={endTour}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer"
              >
                Done ✓
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
