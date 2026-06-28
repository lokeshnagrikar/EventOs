"use client";

import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

// --- Types ---

export interface AnimationBaseProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
}

export interface FadeInProps extends AnimationBaseProps {
  direction?: "none" | "up" | "down" | "left" | "right";
  distance?: number;
}

export interface DrawerTransitionProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: "left" | "right" | "top" | "bottom";
  className?: string;
}

export interface ModalTransitionProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

// --- 1. FadeIn Wrapper ---
export const FadeIn: React.FC<FadeInProps> = ({
  children,
  direction = "none",
  distance = 20,
  duration = 0.2,
  delay = 0,
  className,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const getDirectionOffset = () => {
    if (shouldReduceMotion || direction === "none") return { x: 0, y: 0 };
    switch (direction) {
      case "up":
        return { x: 0, y: distance };
      case "down":
        return { x: 0, y: -distance };
      case "left":
        return { x: distance, y: 0 };
      case "right":
        return { x: -distance, y: 0 };
      default:
        return { x: 0, y: 0 };
    }
  };

  const offset = getDirectionOffset();

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        duration,
        delay,
        ease: [0.215, 0.61, 0.355, 1], // snappy cubic ease out
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// --- 2. SlideUp Wrapper (Snappy upward transition) ---
export const SlideUp: React.FC<AnimationBaseProps & { distance?: number }> = ({
  children,
  distance = 24,
  duration = 0.25,
  delay = 0,
  className,
}) => {
  return (
    <FadeIn
      direction="up"
      distance={distance}
      duration={duration}
      delay={delay}
      className={className}
    >
      {children}
    </FadeIn>
  );
};

// --- 3. ScaleIn Wrapper ---
export const ScaleIn: React.FC<AnimationBaseProps & { initialScale?: number }> = ({
  children,
  initialScale = 0.95,
  duration = 0.2,
  delay = 0,
  className,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const scaleStart = shouldReduceMotion ? 1 : initialScale;

  return (
    <motion.div
      initial={{ opacity: 0, scale: scaleStart }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration,
        delay,
        ease: "easeOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// --- 4. PageTransition Wrapper ---
export const PageTransition: React.FC<AnimationBaseProps> = ({
  children,
  duration = 0.2,
  className,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
      transition={{
        duration,
        ease: "easeInOut",
      }}
      className={cn("w-full h-full", className)}
    >
      {children}
    </motion.div>
  );
};

// --- 5. DrawerTransition Wrapper (Drawer Panel + Backdrop) ---
export const DrawerTransition: React.FC<DrawerTransitionProps> = ({
  isOpen,
  onClose,
  children,
  side = "right",
  className,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const getDrawerOffset = () => {
    if (shouldReduceMotion) return { x: 0, y: 0 };
    switch (side) {
      case "left":
        return { x: "-100%", y: 0 };
      case "right":
        return { x: "100%", y: 0 };
      case "top":
        return { x: 0, y: "-100%" };
      case "bottom":
        return { x: 0, y: "100%" };
      default:
        return { x: "100%", y: 0 };
    }
  };

  const offset = getDrawerOffset();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
          />

          {/* Drawer Body */}
          <motion.div
            initial={{ ...offset, opacity: shouldReduceMotion ? 0 : 1 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={{ ...offset, opacity: shouldReduceMotion ? 0 : 1 }}
            transition={{
              type: shouldReduceMotion ? "tween" : "spring",
              damping: 26,
              stiffness: 280,
              duration: 0.25,
            }}
            className={cn(
              "fixed bg-background shadow-2xl overflow-y-auto flex flex-col focus:outline-none",
              {
                "top-0 bottom-0 left-0 w-full max-w-md border-r border-border": side === "left",
                "top-0 bottom-0 right-0 w-full max-w-md border-l border-border": side === "right",
                "top-0 left-0 right-0 h-64 border-b border-border": side === "top",
                "bottom-0 left-0 right-0 h-auto max-h-[85vh] rounded-t-2xl border-t border-border": side === "bottom",
              },
              className
            )}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// --- 6. ModalTransition Wrapper (Modal box + Backdrop) ---
export const ModalTransition: React.FC<ModalTransitionProps> = ({
  isOpen,
  onClose,
  children,
  className,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
          />

          {/* Modal Card */}
          <motion.div
            initial={{
              scale: shouldReduceMotion ? 1 : 0.95,
              opacity: 0,
            }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{
              scale: shouldReduceMotion ? 1 : 0.95,
              opacity: 0,
            }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
            className={cn(
              "relative z-50 w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-2xl focus:outline-none",
              className
            )}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
