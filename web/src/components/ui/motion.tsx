"use client";

import React from "react";
import { motion, useReducedMotion, Variants, HTMLMotionProps } from "framer-motion";

interface MotionWrapperProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  yOffset = 16,
  ...props
}: MotionWrapperProps) {
  const shouldReduceMotion = useReducedMotion();

  const variants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : yOffset },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration,
        delay,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({
  children,
  delay = 0.05,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number }) {
  const variants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: delay,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={variants}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function RevealOnScroll({
  children,
  delay = 0,
  duration = 0.5,
  yOffset = 18,
  threshold = 0.1,
  ...props
}: MotionWrapperProps & { threshold?: number }) {
  const shouldReduceMotion = useReducedMotion();

  const variants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : yOffset },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration,
        delay,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px", amount: threshold }}
      variants={variants}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function HoverCard({
  children,
  scale = 1.02,
  ...props
}: HTMLMotionProps<"div"> & { scale?: number }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={shouldReduceMotion ? {} : { scale, y: -2 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
