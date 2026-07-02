"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LOADING_PHASES } from "./constants";
import { CROSSFADE_VARIANTS } from "./animations";

interface LoadingStagesProps {
  progress: number;
}

export const LoadingStages = React.memo(function LoadingStages({ progress }: LoadingStagesProps) {
  // Map progress (0 - 100) to corresponding phase index
  const activePhase = useMemo(() => {
    const totalPhases = LOADING_PHASES.length;
    const index = Math.min(
      Math.floor((progress / 100) * totalPhases),
      totalPhases - 1
    );
    return LOADING_PHASES[index];
  }, [progress]);

  return (
    <div className="h-5 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.span
          key={activePhase}
          variants={CROSSFADE_VARIANTS}
          initial="initial"
          animate="animate"
          exit="exit"
          className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center"
        >
          {activePhase}
        </motion.span>
      </AnimatePresence>
    </div>
  );
});
