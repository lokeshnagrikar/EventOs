"use client";

import React, { useEffect, useRef, Suspense } from "react";
import { useAuthModalStore } from "@/store/authModalStore";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { X } from "lucide-react";
import { SpotlightCard } from "@/components/ui/spotlight-card";

export function AuthModal() {
  const { isOpen, mode, prefilledEmail, closeModal, setMode } = useAuthModalStore();
  const modalRef = useRef<HTMLDivElement>(null);

  // Disable background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeModal]);

  // Magnetic button effects
  const mX = useMotionValue(0);
  const mY = useMotionValue(0);
  const springConfig = { stiffness: 200, damping: 15 };
  const dX = useSpring(mX, springConfig);
  const dY = useSpring(mY, springConfig);

  const handleButtonMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    mX.set(mouseX * 0.4);
    mY.set(mouseY * 0.4);
  };

  const handleButtonMouseLeave = () => {
    mX.set(0);
    mY.set(0);
  };

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      closeModal();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
            ref={modalRef}
            className="w-full max-w-[430px] z-10"
          >
            <SpotlightCard className="w-full bg-white/[0.01] border border-white/[0.08] rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.4)] shadow-purple-500/[0.03] backdrop-blur-xl relative overflow-hidden text-zinc-100 selection:bg-purple-600/35 selection:text-white">
              {/* Top Accent Gradient Line */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#06B6D4] opacity-90 z-20" />

              {/* Close Button - Magnetic motion.button */}
              <motion.button
                onClick={closeModal}
                onMouseMove={handleButtonMouseMove}
                onMouseLeave={handleButtonMouseLeave}
                style={{ x: dX, y: dY }}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white hover:bg-zinc-800/40 p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50 z-30 cursor-pointer"
                aria-label="Close modal"
              >
                <X size={18} />
              </motion.button>

              {/* Padded Content Area to fix colored line overlap */}
              <div className="p-6 sm:p-8 pt-10 sm:pt-12">
                {/* Modal Forms inside Suspense to support useSearchParams in LoginForm */}
                <Suspense fallback={<div className="text-xs text-zinc-400 text-center py-12">Loading form...</div>}>
                  {mode === "login" ? (
                    <LoginForm isModal onSwitchMode={setMode} />
                  ) : (
                    <RegisterForm isModal onSwitchMode={setMode} prefilledEmail={prefilledEmail} />
                  )}
                </Suspense>
              </div>
            </SpotlightCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
