"use client";

// High-performance canvas confetti celebration engine
export function triggerConfetti(options?: {
  particleCount?: number;
  origin?: { x: number; y: number };
  colors?: string[];
}) {
  if (typeof window === "undefined") return;

  const count = options?.particleCount ?? 90;
  const colors = options?.colors ?? [
    "#9333ea", // Vibrant Purple
    "#a855f7", // Light Purple
    "#fbbf24", // Royal Gold
    "#f59e0b", // Amber Gold
    "#6366f1", // Indigo
    "#ec4899", // Neon Pink
    "#10b981", // Emerald
  ];

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "999999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    document.body.removeChild(canvas);
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const originX = (options?.origin?.x ?? 0.5) * window.innerWidth;
  const originY = (options?.origin?.y ?? 0.45) * window.innerHeight;

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rotation: number;
    vRotation: number;
    opacity: number;
    shape: "rect" | "circle";
  }

  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const velocity = 8 + Math.random() * 14;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity - 4, // slight upward bias
      size: 4 + Math.random() * 7,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRotation: (Math.random() - 0.5) * 15,
      opacity: 1,
      shape: Math.random() > 0.4 ? "rect" : "circle",
    });
  }

  let animationFrameId: number;
  const gravity = 0.35;
  const drag = 0.96;

  function update() {
    if (!ctx) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    let activeCount = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.opacity <= 0.01) continue;

      activeCount++;

      p.vx *= drag;
      p.vy = p.vy * drag + gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vRotation;
      p.opacity -= 0.012;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;

      if (p.shape === "rect") {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    if (activeCount > 0) {
      animationFrameId = requestAnimationFrame(update);
    } else {
      cancelAnimationFrame(animationFrameId);
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  }

  update();
}
