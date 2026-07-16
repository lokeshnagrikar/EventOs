"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useCelebrationStore, CELEBRATION_MESSAGES } from "@/store/celebrationStore";

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
  shape: "circle" | "square" | "triangle";
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

    // Generate confetti
    const colors = ["#8b5cf6", "#ec4899", "#38bdf8", "#10b981", "#fbbf24", "#f97316", "#a855f7", "#06b6d4"];
    const shapes: ConfettiParticle["shape"][] = ["circle", "square", "triangle"];
    const newParticles = Array.from({ length: 180 }).map((_, i) => ({
      id: i,
      x: (typeof window !== "undefined" ? window.innerWidth : 1000) * Math.random(),
      y: (typeof window !== "undefined" ? window.innerHeight : 800) + 30,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 10 + 3,
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
          speedY: p.speedY + 0.3,
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
    <div className="fixed inset-0 z-[99999] pointer-events-none">
      {/* Confetti particles */}
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
            borderRadius: p.shape === "circle" ? "50%" : p.shape === "triangle" ? "0" : "2px",
            transform: `rotate(${p.rotation}deg)`,
            clipPath: p.shape === "triangle" ? "polygon(50% 0%, 0% 100%, 100% 100%)" : undefined,
          }}
        />
      ))}

      {/* Message Card */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            transition={{ type: "spring", duration: 0.6, bounce: 0.2 }}
            className="relative bg-zinc-950/90 border border-zinc-800 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl text-center max-w-sm mx-4 space-y-3"
          >
            <button
              onClick={dismissCelebration}
              className="absolute top-3 right-3 p-1.5 text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
              aria-label="Dismiss celebration"
            >
              <X size={14} />
            </button>

            <motion.div
              className="text-5xl"
              animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              {message.emoji}
            </motion.div>

            <h2 className="text-xl font-black text-white tracking-tight">
              {message.title}
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {message.subtitle}
            </p>

            <div className="pt-2">
              <button
                onClick={dismissCelebration}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-550 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-lg shadow-purple-500/20"
              >
                Continue →
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
