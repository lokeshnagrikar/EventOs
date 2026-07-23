"use client";

import React, { useEffect, useRef } from "react";
import { useParticles } from "./useParticles";

export const ParticleField = React.memo(function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { updateParticles } = useParticles(32); // 32 particles for optimal performance

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const threshold = 12; // distance threshold in percentage space

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      ctx.clearRect(0, 0, width, height);

      // 1. Advance simulation
      const currentParticles = updateParticles();

      // 2. Draw connections
      for (let i = 0; i < currentParticles.length; i++) {
        const p1 = currentParticles[i];
        const x1 = (p1.x / 100) * width;
        const y1 = (p1.y / 100) * height;

        for (let j = i + 1; j < currentParticles.length; j++) {
          const p2 = currentParticles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < threshold) {
            const x2 = (p2.x / 100) * width;
            const y2 = (p2.y / 100) * height;

            // Opacity fades as distance increases and is bound by particle opacities
            const lineOpacity = (1 - dist / threshold) * 0.15 * Math.min(p1.opacity, p2.opacity);

            const grad = ctx.createLinearGradient(x1, y1, x2, y2);
            grad.addColorStop(0, `rgba(168, 85, 247, ${lineOpacity * 0.8})`);
            grad.addColorStop(1, `rgba(99, 102, 241, ${lineOpacity * 0.8})`);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // 3. Draw particles
      currentParticles.forEach((p) => {
        const x = (p.x / 100) * width;
        const y = (p.y / 100) * height;

        ctx.beginPath();
        ctx.arc(x, y, p.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(192, 132, 252, ${p.opacity})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [updateParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full z-0 pointer-events-none"
    />
  );
});
