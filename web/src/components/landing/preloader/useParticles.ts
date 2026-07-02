import { useState, useEffect, useRef } from "react";

export interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  baseOpacity: number;
  opacity: number;
  pulseSpeed: number;
  pulsePhase: number;
}

export function useParticles(count: number = 35) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    // Initialize particles with randomized traits
    const initialParticles: Particle[] = Array.from({ length: count }, (_, idx) => {
      const size = Math.random() * 1.5 + 0.8; // 0.8px to 2.3px
      return {
        id: idx,
        x: Math.random() * 100, // percentage x
        y: Math.random() * 100, // percentage y
        size,
        vx: (Math.random() - 0.5) * 0.02, // slow drift speed
        vy: (Math.random() - 0.5) * 0.02,
        baseOpacity: Math.random() * 0.4 + 0.15, // 0.15 to 0.55 opacity
        opacity: 0,
        pulseSpeed: Math.random() * 0.015 + 0.005,
        pulsePhase: Math.random() * Math.PI * 2,
      };
    });

    particlesRef.current = initialParticles;
    setParticles(initialParticles);

    const update = () => {
      particlesRef.current = particlesRef.current.map((p) => {
        // Increment phase for smooth opacity pulsing
        const newPhase = p.pulsePhase + p.pulseSpeed;
        const newOpacity = p.baseOpacity + Math.sin(newPhase) * 0.1;

        // Slow floating drift
        let newX = p.x + p.vx;
        let newY = p.y + p.vy;

        // Wrap around bounds
        if (newX < 0) newX = 100;
        if (newX > 100) newX = 0;
        if (newY < 0) newY = 100;
        if (newY > 100) newY = 0;

        return {
          ...p,
          x: newX,
          y: newY,
          opacity: Math.max(0.05, Math.min(newOpacity, 0.7)),
          pulsePhase: newPhase,
        };
      });

      setParticles(particlesRef.current);
      animationRef.current = requestAnimationFrame(update);
    };

    animationRef.current = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [count]);

  return particles;
}
