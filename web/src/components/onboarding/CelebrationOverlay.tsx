"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { useCelebrationStore, CelebrationMilestone, CELEBRATION_MESSAGES } from "@/store/celebrationStore";

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
  shape: "circle" | "square" | "star";
}

/* Micro SVG Celebration Animations */
function MilestoneSvgAnimation({ milestone }: { milestone: CelebrationMilestone }) {
  switch (milestone) {
    case "first_payment":
      return (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [0.5, 1.15, 1], opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative flex items-center justify-center my-3"
        >
          <svg className="w-28 h-28" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="50" fill="url(#pay_bg)" fillOpacity="0.15" stroke="#34D399" strokeWidth="2" strokeDasharray="4 4" />
            <rect x="36" y="44" width="48" height="32" rx="8" fill="#065F46" stroke="#10B981" strokeWidth="2" />
            <line x1="36" y1="54" x2="84" y2="54" stroke="#047857" strokeWidth="3" />
            <circle cx="50" cy="64" r="4" fill="#34D399" />
            <motion.circle
              cx="60"
              cy="60"
              r="28"
              fill="#059669"
              stroke="#6EE7B7"
              strokeWidth="2.5"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <path d="M52 60L57 65L68 54" stroke="#ECFDF5" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <radialGradient id="pay_bg" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(60 60) scale(50)">
                <stop stopColor="#34D399" />
                <stop offset="1" stopColor="#09090B" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        </motion.div>
      );
    case "first_booking":
    case "first_quote":
      return (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [0.5, 1.15, 1], opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative flex items-center justify-center my-3"
        >
          <svg className="w-28 h-28" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="50" fill="url(#quote_bg)" fillOpacity="0.15" stroke="#C084FC" strokeWidth="2" strokeDasharray="4 4" />
            <rect x="40" y="30" width="40" height="60" rx="8" fill="#3B0764" stroke="#A855F7" strokeWidth="2" />
            <line x1="48" y1="44" x2="72" y2="44" stroke="#E9D5FF" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="48" y1="54" x2="66" y2="54" stroke="#C084FC" strokeWidth="2" strokeLinecap="round" />
            <line x1="48" y1="64" x2="60" y2="64" stroke="#7E22CE" strokeWidth="2" strokeLinecap="round" />
            <circle cx="74" cy="74" r="12" fill="#9333EA" stroke="#F0ABFC" strokeWidth="2" />
            <path d="M70 74L73 77L79 71" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <radialGradient id="quote_bg" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(60 60) scale(50)">
                <stop stopColor="#A855F7" />
                <stop offset="1" stopColor="#09090B" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        </motion.div>
      );
    default:
      return null;
  }
}

export default function CelebrationOverlay() {
  const { activeCelebration, dismissCelebration } = useCelebrationStore();
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    if (!activeCelebration) {
      setShowOverlay(false);
      return;
    }

    setShowOverlay(true);

    // Generate celebratory particles
    const colors = ["#8b5cf6", "#ec4899", "#38bdf8", "#10b981", "#fbbf24", "#f97316", "#a855f7", "#06b6d4"];
    const shapes: ConfettiParticle["shape"][] = ["circle", "square", "star"];
    const newParticles = Array.from({ length: 160 }).map((_, i) => ({
      id: i,
      x: (typeof window !== "undefined" ? window.innerWidth : 1000) * Math.random(),
      y: (typeof window !== "undefined" ? window.innerHeight : 800) + 30,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 10 + 4,
      speedY: -(Math.random() * 20 + 12),
      speedX: Math.random() * 14 - 7,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 12 - 6,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    }));

    setParticles(newParticles);

    let currentParticles = [...newParticles];
    let animId: number;

    const updatePhysics = () => {
      currentParticles = currentParticles
        .map((p) => ({
          ...p,
          x: p.x + p.speedX,
          y: p.y + p.speedY,
          speedY: p.speedY + 0.35,
          speedX: p.speedX * 0.99,
          rotation: p.rotation + p.rotationSpeed,
        }))
        .filter((p) => p.y < (typeof window !== "undefined" ? window.innerHeight : 800) + 80);

      setParticles(currentParticles);

      if (currentParticles.length > 0) {
        animId = requestAnimationFrame(updatePhysics);
      }
    };

    animId = requestAnimationFrame(updatePhysics);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [activeCelebration]);

  if (!activeCelebration || !showOverlay) return null;

  const message = CELEBRATION_MESSAGES[activeCelebration];

  return (
    <div className="fixed inset-0 z-[99999] pointer-events-none font-sans">
      {/* Particle Explosions */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            transform: `rotate(${p.rotation}deg)`,
            boxShadow: `0 0 10px ${p.color}80`
          }}
        />
      ))}

      {/* Glassmorphic Milestone Dialog */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/60 backdrop-blur-md">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.88 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
            className="relative bg-[#09090b]/90 border border-purple-500/30 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_25px_80px_rgba(0,0,0,0.9),0_0_40px_rgba(168,85,247,0.2)] text-center max-w-sm mx-4 space-y-4 overflow-hidden"
          >
            {/* Ambient Background Aura */}
            <div className="absolute -top-16 -right-16 h-36 w-36 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />

            <button
              onClick={dismissCelebration}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white transition cursor-pointer rounded-full bg-zinc-900 border border-zinc-800"
              aria-label="Dismiss celebration"
            >
              <X size={14} />
            </button>

            {/* SVG Vector Animation */}
            <MilestoneSvgAnimation milestone={activeCelebration} />

            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-950/60 border border-purple-500/30 px-3 py-1 rounded-full inline-block">
                {message.emoji} Milestone Achieved
              </span>
              <h2 className="text-xl font-black text-white tracking-tight">
                {message.title}
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
                {message.subtitle}
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={dismissCelebration}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-lg shadow-purple-500/25 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Continue Work</span>
                <Sparkles size={13} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
