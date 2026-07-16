"use client";

import React, { useEffect, useRef, Suspense } from "react";
import { useAuthModalStore } from "@/store/authModalStore";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { X } from "lucide-react";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { cn } from "@/lib/utils";

export function AuthModal() {
  const { isOpen, mode, prefilledEmail, closeModal, setMode } = useAuthModalStore();
  const modalRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
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
          transition={{ duration: 0.35, ease: "easeOut" }}
          onClick={handleBackdropClick}
          className={cn(
            "fixed inset-0 z-50 flex bg-black/75 backdrop-blur-md",
            isMobile ? "items-end justify-center" : "items-center justify-center p-4 sm:p-6"
          )}
        >
          <motion.div
            initial={isMobile ? { y: "100%", opacity: 1 } : { opacity: 0, scale: 0.88, y: 0 }}
            animate={isMobile ? { y: 0, opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? { y: "100%", opacity: 1 } : { opacity: 0, scale: 0.88, y: 0 }}
            transition={isMobile ? { type: "spring", damping: 30, stiffness: 300 } : { type: "spring", stiffness: 320, damping: 28, mass: 1.2 }}
            drag={isMobile ? "y" : false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.75 }}
            onDragEnd={(e, info) => {
              if (isMobile && info.offset.y > 120) {
                closeModal();
              }
            }}
            ref={modalRef}
            className={cn(
              "w-full max-w-[430px] z-10",
              isMobile ? "max-h-[92vh] overflow-y-auto scrollbar-none" : ""
            )}
          >
            <SpotlightCard className={cn(
              "w-full bg-card/95 border border-border shadow-[0_0_60px_rgba(0,0,0,0.4)] backdrop-blur-xl relative text-foreground selection:bg-purple-650 selection:text-white",
              isMobile ? "rounded-t-[32px] rounded-b-none border-b-0 pb-6" : "rounded-2xl overflow-hidden"
            )}>
              {/* Top Accent Gradient Line (Desktop only) */}
              {!isMobile && (
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#06B6D4] opacity-90 z-20" />
              )}

              {/* iOS bottom sheet drag handle */}
              {isMobile && (
                <div className="w-full pt-4 pb-2 flex justify-center cursor-grab active:cursor-grabbing">
                  <div className="w-12 h-1 bg-zinc-700/50 rounded-full" />
                </div>
              )}

              {/* Close Button - Magnetic motion.button (Desktop only) */}
              {!isMobile && (
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
              )}

              {/* Padded Content Area */}
              <div className={cn(
                "p-6 sm:p-8 sm:pt-10",
                isMobile ? "pt-2" : "pt-8"
              )}>
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
