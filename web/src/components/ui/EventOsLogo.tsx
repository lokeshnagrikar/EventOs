"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface EventOsLogoProps {
  className?: string;
  size?: number;
  animated?: boolean;
  interactive?: boolean;
  showGlow?: boolean;
  priority?: boolean;
}

export function EventOsLogo({
  className,
  size = 48,
  animated = true,
  interactive = true,
  showGlow = true,
}: EventOsLogoProps) {
  // 3D Tilt Spring Physics on mouse move
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 25 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["14deg", "-14deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-14deg", "14deg"]);
  const brightness = useTransform(mouseYSpring, [-0.5, 0.5], [1.15, 0.95]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        width: size,
        height: size,
        perspective: 600,
      }}
      className={cn(
        "relative inline-flex items-center justify-center select-none shrink-0 group cursor-pointer",
        className
      )}
    >
      {/* ── AMBIENT NEON GLOW BACKDROP ── */}
      {showGlow && animated && (
        <motion.div
          className="absolute inset-0 -z-10 rounded-full pointer-events-none filter blur-lg"
          style={{
            background:
              "radial-gradient(circle, rgba(168,85,247,0.45) 0%, rgba(236,72,153,0.3) 50%, transparent 75%)",
            transform: "scale(1.25)",
          }}
          animate={{
            opacity: [0.45, 0.85, 0.45],
            scale: [1.15, 1.35, 1.15],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* ── 3D TILT CONTAINER ── */}
      <motion.div
        style={{
          width: "100%",
          height: "100%",
          rotateX: interactive ? rotateX : 0,
          rotateY: interactive ? rotateY : 0,
          filter: interactive ? brightness : undefined,
          transformStyle: "preserve-3d",
        }}
        whileHover={interactive ? { scale: 1.06 } : undefined}
        whileTap={interactive ? { scale: 0.96 } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="relative w-full h-full flex items-center justify-center"
      >
        {/* ── BASE HIGH-RES LOGO IMAGE ── */}
        <img
          src="/logo/logo.png"
          alt="EventOS Logo"
          width={size}
          height={size}
          className="w-full h-full object-contain pointer-events-none drop-shadow-[0_4px_12px_rgba(124,58,237,0.25)]"
        />

        {/* ── METALLIC SHIMMER LIGHT-SWEEP OVERLAY ── */}
        {animated && (
          <div
            className="absolute inset-0 pointer-events-none rounded-full overflow-hidden"
            style={{ mixBlendMode: "color-dodge" }}
          >
            <motion.div
              className="w-[65%] h-[240%] absolute -top-[70%]"
              style={{
                background:
                  "linear-gradient(115deg, transparent 15%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.75) 50%, rgba(244,114,182,0.4) 58%, transparent 75%)",
                transform: "rotate(30deg)",
              }}
              animate={{
                left: ["-120%", "220%"],
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                repeatDelay: 2.4,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          </div>
        )}

        {/* ── ANIMATED 4-POINTED RADIANT DIAMOND STAR IN 'O' ── */}
        {animated && (
          <motion.div
            className="absolute pointer-events-none z-10 flex items-center justify-center"
            style={{
              left: "63%",
              top: "48.2%",
              width: "25%",
              height: "25%",
              transform: "translate(-50%, -50%)",
            }}
            animate={{
              rotate: [0, 360],
              scale: [0.92, 1.18, 0.92],
              opacity: [0.9, 1, 0.9],
            }}
            transition={{
              rotate: { duration: 6.5, repeat: Infinity, ease: "linear" },
              scale: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full overflow-visible drop-shadow-[0_0_8px_rgba(244,114,182,0.95)]"
            >
              <defs>
                <radialGradient id="spark_core_glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="35%" stopColor="#F472B6" />
                  <stop offset="70%" stopColor="#C084FC" />
                  <stop offset="100%" stopColor="rgba(192,132,252,0)" />
                </radialGradient>
              </defs>
              {/* Primary 4-pointed radiant diamond star */}
              <path
                d="M 50 8 Q 50 50 92 50 Q 50 50 50 92 Q 50 50 8 50 Q 50 50 50 8 Z"
                fill="url(#spark_core_glow)"
              />
              {/* Secondary white diamond glint */}
              <path
                d="M 50 25 Q 50 50 75 50 Q 50 50 50 75 Q 50 50 25 50 Q 50 50 50 25 Z"
                fill="#FFFFFF"
                opacity="0.9"
                transform="rotate(45 50 50)"
              />
            </svg>
          </motion.div>
        )}

        {/* ── ANIMATED ORBITAL SATELLITE NODE (Tip of Swoosh) ── */}
        {animated && (
          <motion.div
            className="absolute pointer-events-none rounded-full z-10"
            style={{
              left: "83.6%",
              top: "32.2%",
              width: "9.5%",
              height: "9.5%",
              transform: "translate(-50%, -50%)",
              background:
                "radial-gradient(circle, #FFFFFF 0%, #F472B6 40%, #EC4899 80%, transparent 100%)",
              boxShadow:
                "0 0 10px 2px rgba(244,114,182,0.9), 0 0 18px 4px rgba(192,132,252,0.6)",
            }}
            animate={{
              scale: [1, 1.45, 1],
              opacity: [0.75, 1, 0.75],
            }}
            transition={{
              duration: 2.1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

export default EventOsLogo;
