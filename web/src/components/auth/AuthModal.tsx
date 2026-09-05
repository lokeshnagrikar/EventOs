"use client";

import React, { useEffect, useRef, Suspense } from "react";
import { useAuthModalStore } from "@/store/authModalStore";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { WaitlistForm } from "./WaitlistForm";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function AuthModal() {
  const { isOpen, mode, prefilledEmail, closeModal, setMode } = useAuthModalStore();
  const modalRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={handleBackdropClick}
          className={cn(
            "fixed inset-0 z-50 flex",
            isMobile ? "w-full h-full bg-[#0A0A0C] overflow-y-auto" : "items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md"
          )}
        >
          <motion.div
            initial={isMobile ? { opacity: 0, y: 12 } : { opacity: 0, scale: 0.96, y: 8 }}
            animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? { opacity: 0, y: 12 } : { opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            ref={modalRef}
            className={cn(
              "w-full z-10",
              isMobile ? "w-full min-h-screen flex flex-col bg-[#0A0A0C] overflow-y-auto" : "max-w-[440px]"
            )}
          >
            <div className={cn(
              "w-full relative text-foreground selection:bg-zinc-800 selection:text-white overflow-hidden",
              isMobile
                ? "min-h-screen rounded-none border-none justify-start bg-[#0A0A0C] p-5"
                : "bg-white/40 dark:bg-white/[0.08] border border-white/60 dark:border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.12),inset_0_1px_2px_rgba(255,255,255,0.8)] backdrop-blur-3xl backdrop-saturate-[2] rounded-3xl p-6 sm:p-7"
            )}>
              {/* Top Accent Gradient Line & Specular Rim */}
              <div className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#EC4899] z-20" />
              <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none z-20" />
              {/* Minimalist Close Button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-700 z-40 cursor-pointer"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>

              <Suspense fallback={<div className="text-xs text-zinc-500 text-center py-10 font-mono">Loading authentication...</div>}>
                {mode === "waitlist" ? (
                  <WaitlistForm prefilledEmail={prefilledEmail} />
                ) : mode === "login" ? (
                  <LoginForm isModal onSwitchMode={setMode} />
                ) : (
                  <RegisterForm isModal onSwitchMode={setMode} prefilledEmail={prefilledEmail} />
                )}
              </Suspense>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
