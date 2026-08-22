"use client";

import React from "react";

/**
 * AnimatedMeshGradient
 * 
 * A premium animated background with soft morphing gradient blobs.
 * Inspired by Linear, Vercel, and Stripe hero backgrounds.
 * Pure CSS animations — no JavaScript runtime cost.
 */
export function AnimatedMeshGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {/* Base subtle tint */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-50/80 via-white to-white" />

      {/* Blob 1: Purple — top center, slow drift right */}
      <div
        className="absolute w-[900px] h-[900px] rounded-full opacity-60 blur-[120px]"
        style={{
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, rgba(139, 92, 246, 0) 70%)",
          top: "-20%",
          left: "20%",
          animation: "meshBlob1 18s ease-in-out infinite alternate",
        }}
      />

      {/* Blob 2: Indigo — middle left, slow drift down */}
      <div
        className="absolute w-[700px] h-[700px] rounded-full opacity-50 blur-[110px]"
        style={{
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.45) 0%, rgba(99, 102, 241, 0) 70%)",
          top: "10%",
          left: "-5%",
          animation: "meshBlob2 22s ease-in-out infinite alternate",
        }}
      />

      {/* Blob 3: Cyan — right side, slow drift left */}
      <div
        className="absolute w-[650px] h-[650px] rounded-full opacity-45 blur-[100px]"
        style={{
          background: "radial-gradient(circle, rgba(34, 211, 238, 0.35) 0%, rgba(34, 211, 238, 0) 70%)",
          top: "25%",
          right: "-5%",
          animation: "meshBlob3 20s ease-in-out infinite alternate",
        }}
      />

      {/* Blob 4: Pink/Magenta — bottom center, slow drift up */}
      <div
        className="absolute w-[800px] h-[800px] rounded-full opacity-40 blur-[130px]"
        style={{
          background: "radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, rgba(236, 72, 153, 0) 70%)",
          bottom: "-10%",
          left: "30%",
          animation: "meshBlob4 25s ease-in-out infinite alternate",
        }}
      />

      {/* Fine grain noise overlay for texture */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />

      {/* Keyframe animations */}
      <style jsx>{`
        @keyframes meshBlob1 {
          0% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(80px, 40px) scale(1.1);
          }
          66% {
            transform: translate(-30px, 80px) scale(0.95);
          }
          100% {
            transform: translate(50px, -20px) scale(1.05);
          }
        }
        @keyframes meshBlob2 {
          0% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(60px, 70px) scale(1.08);
          }
          66% {
            transform: translate(-40px, 30px) scale(0.92);
          }
          100% {
            transform: translate(20px, 90px) scale(1.04);
          }
        }
        @keyframes meshBlob3 {
          0% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(-70px, 50px) scale(1.12);
          }
          66% {
            transform: translate(40px, -30px) scale(0.9);
          }
          100% {
            transform: translate(-50px, 70px) scale(1.06);
          }
        }
        @keyframes meshBlob4 {
          0% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(50px, -60px) scale(1.1);
          }
          66% {
            transform: translate(-60px, -30px) scale(0.95);
          }
          100% {
            transform: translate(30px, -80px) scale(1.03);
          }
        }
      `}</style>
    </div>
  );
}
