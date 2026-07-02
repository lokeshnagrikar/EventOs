"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BOOT_LOGS } from "./constants";

interface BootTerminalProps {
  progress: number;
}

export const BootTerminal = React.memo(function BootTerminal({ progress }: BootTerminalProps) {
  // Map boot logs to progress milestones
  const activeLogs = useMemo(() => {
    const milestones = [12, 26, 42, 56, 70, 84, 94];
    return BOOT_LOGS.filter((_, idx) => progress >= milestones[idx]);
  }, [progress]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of terminal when logs are added
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [activeLogs.length]);

  return (
    <div 
      ref={containerRef}
      className="w-full max-w-[240px] h-[78px] overflow-y-auto px-4 py-2 rounded-lg bg-black/[0.15] border border-white/[0.03] font-mono text-[9px] text-zinc-500 space-y-1.5 scrollbar-thin select-none pointer-events-none"
    >
      <AnimatePresence>
        {activeLogs.map((log, index) => (
          <motion.div
            key={log}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-2"
          >
            <span className="text-emerald-500 font-extrabold">✓</span>
            <span className="text-zinc-400">{log}</span>
            <span className="ml-auto text-zinc-600/70">done</span>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Dynamic Cursor Block */}
      {activeLogs.length < BOOT_LOGS.length && (
        <div className="flex items-center gap-1.5 opacity-60">
          <span className="text-purple-400 font-extrabold animate-pulse">❯</span>
          <span className="animate-pulse bg-purple-400 h-2.5 w-1 rounded-[1px] inline-block" />
        </div>
      )}
    </div>
  );
});
