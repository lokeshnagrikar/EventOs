"use client";

import React from "react";

/**
 * AnimatedMeshGradient - Peripheral Breathing Aurora
 * 
 * Features:
 * - Pure, clean, crisp central canvas (#FAF9F6) for 100% text legibility.
 * - Left Flank: EventOS Royal Purple & Deep Indigo mist (breathes slowly every 11s).
 * - Right Flank: Luminous Lavender & Soft Violet aura (breathes on an offset 13s cycle).
 * - Organic breathing physics with subtle scale, opacity pulse, and vertical drift.
 * - Micro-noise overlay to eliminate digital color banding.
 */
export function AnimatedMeshGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none" aria-hidden="true">
      {/* Base clean background fill */}
      <div className="absolute inset-0 bg-[#FAF9F6]" />

      {/* LEFT FLANK: Royal Purple & Deep Indigo Breathing Aurora */}
      <div
        className="absolute w-[600px] sm:w-[750px] h-[750px] rounded-full blur-[130px] opacity-75"
        style={{
          background: `
            radial-gradient(circle at 35% 50%, 
              rgba(124, 58, 237, 0.22) 0%, 
              rgba(99, 102, 241, 0.12) 45%, 
              rgba(147, 51, 234, 0.04) 65%, 
              transparent 75%
            )
          `,
          top: "8%",
          left: "-18%",
          animation: "auroraBreatheLeft 11s ease-in-out infinite alternate",
          willChange: "transform, opacity",
        }}
      />

      {/* Secondary Left Accent: Deep Violet Ambient Flare */}
      <div
        className="absolute w-[450px] h-[500px] rounded-full blur-[110px] opacity-60"
        style={{
          background: "radial-gradient(circle, rgba(147, 51, 234, 0.18) 0%, rgba(99, 102, 241, 0) 70%)",
          top: "35%",
          left: "-10%",
          animation: "auroraBreatheLeftAlt 14s ease-in-out infinite alternate",
          willChange: "transform, opacity",
        }}
      />

      {/* RIGHT FLANK: Soft Lavender & Luminous Violet Breathing Aurora */}
      <div
        className="absolute w-[600px] sm:w-[750px] h-[750px] rounded-full blur-[135px] opacity-75"
        style={{
          background: `
            radial-gradient(circle at 65% 50%, 
              rgba(168, 85, 247, 0.22) 0%, 
              rgba(192, 132, 252, 0.12) 45%, 
              rgba(236, 72, 153, 0.04) 65%, 
              transparent 75%
            )
          `,
          top: "12%",
          right: "-18%",
          animation: "auroraBreatheRight 13s ease-in-out infinite alternate",
          willChange: "transform, opacity",
        }}
      />

      {/* Secondary Right Accent: Warm Lilac Glow */}
      <div
        className="absolute w-[450px] h-[500px] rounded-full blur-[110px] opacity-60"
        style={{
          background: "radial-gradient(circle, rgba(192, 132, 252, 0.18) 0%, rgba(168, 85, 247, 0) 70%)",
          top: "40%",
          right: "-10%",
          animation: "auroraBreatheRightAlt 16s ease-in-out infinite alternate",
          willChange: "transform, opacity",
        }}
      />

      {/* CENTER SPOTLIGHT SHIELD: Guarantees 100% Crisp, Pure Center Legibility */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 65% at 50% 40%, 
              rgba(250, 249, 246, 0.96) 0%, 
              rgba(250, 249, 246, 0.75) 45%, 
              rgba(250, 249, 246, 0.2) 75%, 
              transparent 100%
            )
          `,
        }}
      />

      {/* Micro-texture noise overlay for smooth, band-free gradients */}
      <div
        className="absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />

      {/* Breathing Keyframes */}
      <style jsx>{`
        @keyframes auroraBreatheLeft {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.65;
          }
          50% {
            transform: translate3d(25px, -18px, 0) scale(1.06);
            opacity: 0.85;
          }
          100% {
            transform: translate3d(-15px, 22px, 0) scale(0.96);
            opacity: 0.60;
          }
        }

        @keyframes auroraBreatheLeftAlt {
          0% {
            transform: translate3d(0, 0, 0) scale(0.95);
            opacity: 0.5;
          }
          50% {
            transform: translate3d(15px, 25px, 0) scale(1.05);
            opacity: 0.7;
          }
          100% {
            transform: translate3d(-20px, -15px, 0) scale(1.0);
            opacity: 0.55;
          }
        }

        @keyframes auroraBreatheRight {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.7;
          }
          50% {
            transform: translate3d(-28px, 20px, 0) scale(1.08);
            opacity: 0.9;
          }
          100% {
            transform: translate3d(18px, -16px, 0) scale(0.95);
            opacity: 0.62;
          }
        }

        @keyframes auroraBreatheRightAlt {
          0% {
            transform: translate3d(0, 0, 0) scale(1.02);
            opacity: 0.55;
          }
          50% {
            transform: translate3d(-18px, -22px, 0) scale(0.94);
            opacity: 0.72;
          }
          100% {
            transform: translate3d(22px, 15px, 0) scale(1.06);
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
