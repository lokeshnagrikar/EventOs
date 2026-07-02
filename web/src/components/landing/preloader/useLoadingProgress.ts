import { useState, useEffect } from "react";

export function useLoadingProgress(durationMs: number = 2800) {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const startTime = performance.now();
    let animationFrameId: number;

    const update = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / durationMs, 1);

      // Fast -> Slow -> Fast progression curve:
      // f(t) = t + 0.15 * sin(2 * pi * t)
      const curve = t + 0.15 * Math.sin(2 * Math.PI * t);
      const computedProgress = Math.min(curve * 100, 100);

      setProgress(computedProgress);

      if (t < 1) {
        animationFrameId = requestAnimationFrame(update);
      } else {
        setIsComplete(true);
      }
    };

    animationFrameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [durationMs]);

  return { progress, isComplete };
}
