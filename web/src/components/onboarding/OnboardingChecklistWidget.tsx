"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronUp, ChevronDown, CheckCircle2, Sparkles, Play, Pause, X, Trophy, Star, Zap } from "lucide-react";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/lib/toastStore";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  label: string;
  path: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: "company_profile", label: "Complete company profile", path: "/settings" },
  { id: "logo", label: "Upload agency logo", path: "/settings" },
  { id: "brand_colors", label: "Choose brand colors", path: "/settings" },
  { id: "invite_member", label: "Invite first team member", path: "/settings" },
  { id: "add_lead", label: "Add first lead", path: "/crm" },
  { id: "create_quote", label: "Create first quote", path: "/quotes" },
  { id: "convert_booking", label: "Convert quote to booking", path: "/quotes" },
  { id: "schedule_event", label: "Schedule first event", path: "/events" },
  { id: "upload_gallery", label: "Upload first gallery", path: "/gallery" },
  { id: "generate_invoice", label: "Generate first invoice", path: "/invoices" },
  { id: "connect_stripe", label: "Connect Stripe payments", path: "/settings" },
  { id: "first_payment", label: "Complete first payment", path: "/invoices" },
  { id: "enable_notifications", label: "Enable notifications", path: "/settings" },
  { id: "explore_ai", label: "Explore AI Copilot", path: "/ai" },
];

const MILESTONES = [
  { threshold: 25, emoji: "⚡", message: "25% — Great start!", color: "text-blue-400" },
  { threshold: 50, emoji: "🔥", message: "50% — Halfway there!", color: "text-orange-400" },
  { threshold: 75, emoji: "⭐", message: "75% — Almost done!", color: "text-amber-400" },
  { threshold: 100, emoji: "🎉", message: "100% — All done!", color: "text-emerald-400" },
];

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
}

export default function OnboardingChecklistWidget() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const { completedSteps, progress, completeStep, startTour, skipped, isOpen, loadedDemo, resetDemoWorkspace, tourPaused, resumeTour, restartTour } = useOnboardingStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [lastMilestone, setLastMilestone] = useState(0);

  // Confetti particles states
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState<ConfettiParticle[]>([]);

  // Track milestone celebrations
  useEffect(() => {
    const currentMilestone = MILESTONES.findLast(m => progress >= m.threshold);
    if (currentMilestone && currentMilestone.threshold > lastMilestone && progress > 0) {
      setLastMilestone(currentMilestone.threshold);
      if (currentMilestone.threshold === 100) {
        triggerConfettiAnimation();
      }
      addToast(`${currentMilestone.emoji} ${currentMilestone.message}`, "success");
    }
  }, [progress]);

  const triggerConfettiAnimation = () => {
    setShowConfetti(true);
    const colors = ["#8b5cf6", "#ec4899", "#38bdf8", "#10b981", "#fbbf24", "#f97316"];
    const particles = Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
      y: window.innerHeight + 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 3,
      speedY: -(Math.random() * 18 + 10),
      speedX: Math.random() * 16 - 8,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 10 - 5,
    }));
    setConfettiParticles(particles);

    let currentParticles = [...particles];

    const updatePhysics = () => {
      currentParticles = currentParticles
        .map((p) => ({
          ...p,
          x: p.x + p.speedX,
          y: p.y + p.speedY,
          speedY: p.speedY + 0.35,
          rotation: p.rotation + p.rotationSpeed,
        }))
        .filter((p) => p.y < window.innerHeight + 50 && p.x > -50 && p.x < window.innerWidth + 50);

      setConfettiParticles(currentParticles);

      if (currentParticles.length > 0) {
        requestAnimationFrame(updatePhysics);
      } else {
        setShowConfetti(false);
      }
    };

    requestAnimationFrame(updatePhysics);
  };

  // If welcome wizard is active, do not render checklist widget to prevent UI overload
  if (isOpen) return null;
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-24 z-40 h-10 w-10 rounded-full bg-purple-600 border border-purple-500/30 text-white flex items-center justify-center shadow-lg hover:bg-purple-550 transition cursor-pointer"
        aria-label="Open setup checklist"
      >
        <CheckCircle2 size={18} />
      </button>
    );
  }

  const handleItemClick = (item: ChecklistItem) => {
    if (!completedSteps.includes(item.id)) {
      completeStep(item.id);
      addToast(`Completed: ${item.label}! ✓`, "success");
    }
    if (item.path) {
      router.push(item.path);
    }
  };

  const completedCount = completedSteps.length;
  const totalCount = CHECKLIST_ITEMS.length;
  const currentMilestone = MILESTONES.findLast(m => progress >= m.threshold);

  return (
    <>
      {/* Confetti Overlay */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
          {confettiParticles.map((p) => (
            <div
              key={p.id}
              className="absolute"
              style={{
                left: `${p.x}px`,
                top: `${p.y}px`,
                backgroundColor: p.color,
                width: `${p.size}px`,
                height: `${p.size}px`,
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                transform: `rotate(${p.rotation}deg)`,
              }}
            />
          ))}
        </div>
      )}

      <div className="fixed bottom-6 right-24 z-40 select-none font-sans text-xs">
        <div className="relative">
          <AnimatePresence>
            {!isExpanded ? (
              /* Collapsed Pill Button */
              <motion.button
                key="collapsed"
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                onClick={() => setIsExpanded(true)}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-purple-500/20 bg-zinc-950/80 backdrop-blur-md text-white font-bold shadow-lg hover:border-purple-500/35 transition cursor-pointer group"
              >
                <div className="relative">
                  <CheckCircle2 size={15} className={cn("text-purple-400", progress < 100 && "animate-pulse")} />
                  {progress === 100 && (
                    <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400" />
                  )}
                </div>
                <span>Setup {progress}%</span>
                <div className="h-1 w-12 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <ChevronUp size={14} className="text-zinc-555 group-hover:text-zinc-400 transition" />
              </motion.button>
            ) : (
              /* Expanded Checklist Panel */
              <motion.div
                key="expanded"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-80 border border-zinc-850 bg-zinc-950/90 rounded-2xl shadow-2xl p-5 backdrop-blur-xl space-y-4"
              >
                {/* Header */}
                <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-purple-400" />
                    <span className="font-black uppercase text-[10px] tracking-wider text-white">Setup Checklist</span>
                    {currentMilestone && (
                      <span className={cn("text-[9px] font-bold", currentMilestone.color)}>
                        {currentMilestone.emoji}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsMinimized(true)}
                      className="p-1 rounded-lg text-zinc-550 hover:bg-zinc-900 hover:text-zinc-300 transition cursor-pointer"
                      aria-label="Minimize checklist"
                    >
                      <X size={12} />
                    </button>
                    <button
                      onClick={() => setIsExpanded(false)}
                      className="p-1 rounded-lg text-zinc-550 hover:bg-zinc-900 hover:text-zinc-300 transition cursor-pointer"
                      aria-label="Collapse checklist"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 font-bold font-mono text-[9px] text-zinc-450">
                  <div className="flex justify-between">
                    <span>{completedCount} / {totalCount} COMPLETED</span>
                    <span className={cn(
                      progress === 100 ? "text-emerald-400" : "text-purple-400"
                    )}>{progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-900 border border-zinc-850 rounded-full overflow-hidden">
                    <motion.div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        progress === 100
                          ? "bg-gradient-to-r from-emerald-500 to-green-500"
                          : "bg-gradient-to-r from-purple-650 to-pink-555"
                      )}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                  {/* Milestone dots */}
                  <div className="flex justify-between px-0.5">
                    {MILESTONES.map((m) => (
                      <div key={m.threshold} className="flex flex-col items-center">
                        <div className={cn(
                          "h-1.5 w-1.5 rounded-full transition",
                          progress >= m.threshold ? "bg-emerald-400" : "bg-zinc-800"
                        )} />
                        <span className={cn(
                          "text-[7px] mt-0.5",
                          progress >= m.threshold ? m.color : "text-zinc-700"
                        )}>{m.threshold}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Checklist items */}
                <div className="max-h-52 overflow-y-auto pr-1 space-y-1 scrollbar-thin">
                  {CHECKLIST_ITEMS.map((item) => {
                    const isDone = completedSteps.includes(item.id);
                    return (
                      <motion.div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="flex items-center gap-2.5 p-2 rounded-xl border border-zinc-900/60 bg-zinc-950/30 hover:border-zinc-800 hover:bg-zinc-900/10 cursor-pointer transition group"
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.div
                          className={cn(
                            "h-4.5 w-4.5 rounded border flex items-center justify-center transition shrink-0",
                            isDone ? "bg-purple-600 border-purple-600 text-white" : "border-zinc-800 bg-zinc-950/60 text-transparent group-hover:border-zinc-700"
                          )}
                          animate={isDone ? { scale: [1, 1.3, 1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          <Check size={10} strokeWidth={3} />
                        </motion.div>
                        <span className={cn(
                          "text-[10px] font-semibold transition",
                          isDone ? "text-zinc-500 line-through" : "text-zinc-300 group-hover:text-white"
                        )}>
                          {item.label}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="border-t border-zinc-900 pt-3 space-y-2 text-[10px] font-bold">
                  {/* Resume paused tour */}
                  {tourPaused ? (
                    <button
                      onClick={() => {
                        setIsExpanded(false);
                        resumeTour();
                        addToast("Tour resumed! 🚀", "success");
                      }}
                      className="w-full py-2 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-550/10 text-purple-400 hover:text-purple-300 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Play size={12} /> Resume Product Tour
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsExpanded(false);
                        restartTour();
                        addToast("Product tour started! ✨", "success");
                      }}
                      className="w-full py-2 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-550/10 text-purple-400 hover:text-purple-300 rounded-xl transition flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
                    >
                      <Sparkles size={12} />
                      {completedSteps.length > 0 ? "Restart Product Tour" : "Start Product Tour"}
                    </button>
                  )}
                  {loadedDemo && (
                    <button
                      onClick={async () => {
                        await resetDemoWorkspace();
                        addToast("Demo workspace reset.", "success");
                        setIsExpanded(false);
                      }}
                      className="w-full py-1.5 border border-zinc-900 hover:bg-red-950/20 text-red-500 hover:text-red-450 rounded-xl transition text-center font-bold cursor-pointer"
                    >
                      Delete Demo Workspace Data
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
