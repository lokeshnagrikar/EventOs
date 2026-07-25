"use client";

import React, { useEffect, useState } from "react";

export function AmbientCursorGlow() {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only enable on non-touch devices
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);
      animationFrameId = requestAnimationFrame(() => {
        setPos({ x: e.clientX, y: e.clientY });
      });
    };

    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.body.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.body.removeEventListener("mouseleave", handleMouseLeave);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-30 transition-opacity duration-500"
      style={{
        transform: `translate3d(${pos.x - 250}px, ${pos.y - 250}px, 0)`,
        width: 500,
        height: 500,
        opacity: isVisible ? 1 : 0,
      }}
    >
      <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-500/12 via-pink-500/10 to-cyan-400/12 blur-[120px]" />
    </div>
  );
}
