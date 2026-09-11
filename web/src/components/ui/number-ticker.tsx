"use client";

import React, { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NumberTickerProps {
  value: number;
  /** Text to show before number (e.g. "₹") */
  prefix?: string;
  /** Text to show after number (e.g. "Cr+") */
  suffix?: string;
  /** Duration in ms. Default: 1500 */
  duration?: number;
  className?: string;
  /** Decimal places. Default: 0 */
  decimals?: number;
}

export function NumberTicker({
  value,
  prefix = "",
  suffix = "",
  duration = 1500,
  className,
  decimals = 0,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const shouldReduceMotion = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number>(0);
  const fromValueRef = useRef<number>(0);

  useEffect(() => {
    if (!isInView) {
      fromValueRef.current = value;
      return;
    }
    if (shouldReduceMotion) {
      setCurrent(value);
      fromValueRef.current = value;
      return;
    }

    const startVal = fromValueRef.current;
    const endVal = value;
    const diff = endVal - startVal;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextVal = startVal + diff * eased;
      setCurrent(parseFloat(nextVal.toFixed(decimals)));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCurrent(endVal);
        fromValueRef.current = endVal;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isInView, value, duration, shouldReduceMotion, decimals]);

  const formatted =
    decimals > 0
      ? current.toFixed(decimals)
      : Math.floor(current).toLocaleString("en-IN");

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
