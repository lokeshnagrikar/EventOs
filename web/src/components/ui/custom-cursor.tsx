"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

export function CustomCursor() {
  const [hovered, setHovered] = useState(false);
  const hoveredRef = useRef(false);
  const [clicked, setClicked] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Position of the actual cursor (instant)
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Lagging spring physics for the trailing ring
  const ringX = useSpring(cursorX, { damping: 40, stiffness: 350, mass: 0.5 });
  const ringY = useSpring(cursorY, { damping: 40, stiffness: 350, mass: 0.5 });

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if it's a touch device, disable custom cursor if it is
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouch) return;

    setIsVisible(true);
    document.documentElement.classList.add("custom-cursor-active");

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseDown = () => setClicked(true);
    const handleMouseUp = () => setClicked(false);

    // Event delegation for hover states on buttons/links
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isClickable =
        !!(target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.closest("button") ||
        target.closest("a") ||
        target.classList.contains("cursor-pointer") ||
        target.closest(".cursor-pointer") ||
        target.getAttribute("role") === "button");

      if (isClickable !== hoveredRef.current) {
        hoveredRef.current = isClickable;
        setHovered(isClickable);
      }
    };

    const handleMouseLeaveWindow = () => setIsVisible(false);
    const handleMouseEnterWindow = () => setIsVisible(true);

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseleave", handleMouseLeaveWindow);
    document.addEventListener("mouseenter", handleMouseEnterWindow);

    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", handleMouseLeaveWindow);
      document.removeEventListener("mouseenter", handleMouseEnterWindow);
    };
  }, [cursorX, cursorY]);

  if (!isVisible) return null;

  return (
    <>
      {/* 1. Inner Instant Dot */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-purple-500 z-[9999] pointer-events-none -translate-x-1/2 -translate-y-1/2"
        style={{
          x: cursorX,
          y: cursorY,
        }}
      />

      {/* 2. Trailing Reactive Ring */}
      <motion.div
        className={cn(
          "fixed top-0 left-0 rounded-full border border-purple-500/30 z-[9998] pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out",
          hovered ? "w-12 h-12 bg-purple-500/5 border-purple-400/60 shadow-[0_0_15px_rgba(139,92,246,0.15)]" : "w-7 h-7",
          clicked && "scale-90 opacity-60"
        )}
        style={{
          x: ringX,
          y: ringY,
        }}
      />
    </>
  );
}
