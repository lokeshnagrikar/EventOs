"use client";

import React, { useMemo } from "react";
import { useParticles } from "./useParticles";

export const ParticleField = React.memo(function ParticleField() {
  const particles = useParticles(32); // 32 particles for optimal performance

  // Generate connection lines between close particles
  const connections = useMemo(() => {
    const lines: React.ReactNode[] = [];
    const threshold = 12; // distance threshold in percentage space

    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < threshold) {
          // Opacity fades as distance increases and is bound by particle opacities
          const lineOpacity = (1 - dist / threshold) * 0.15 * Math.min(p1.opacity, p2.opacity);
          lines.push(
            <line
              key={`${p1.id}-${p2.id}`}
              x1={`${p1.x}%`}
              y1={`${p1.y}%`}
              x2={`${p2.x}%`}
              y2={`${p2.y}%`}
              stroke="url(#lineGradient)"
              strokeWidth="0.6"
              style={{ opacity: lineOpacity }}
            />
          );
        }
      }
    }
    return lines;
  }, [particles]);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      {/* SVG overlay for drawing connections */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        {connections}
      </svg>

      {/* Render particles as absolute div dots */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-gradient-to-tr from-purple-400 to-indigo-300 shadow-[0_0_8px_rgba(168,85,247,0.3)] will-change-transform"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            transform: "translate3d(-50%, -50%, 0)",
          }}
        />
      ))}
    </div>
  );
});
