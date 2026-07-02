"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { ORB_FLOAT } from "./animations";

export const GlassOrb = React.memo(function GlassOrb() {
  return (
    <motion.div
      variants={ORB_FLOAT}
      animate="animate"
      className="relative h-20 w-20 flex items-center justify-center rounded-full bg-white/[0.03] border border-white/[0.08] shadow-[inset_0_2px_5px_rgba(255,255,255,0.2),0_15px_35px_rgba(0,0,0,0.55),0_0_25px_rgba(168,85,247,0.12)] backdrop-blur-xl"
    >
      {/* Specular glossy highlight top-left */}
      <div 
        className="absolute top-1.5 left-2 w-6 h-3 rounded-full bg-gradient-to-b from-white/[0.18] to-transparent rotate-[-20deg] pointer-events-none" 
        aria-hidden="true"
      />

      {/* Specular glossy highlight bottom-right reflection */}
      <div 
        className="absolute bottom-1.5 right-2 w-5 h-2 rounded-full bg-gradient-to-t from-white/[0.08] to-transparent rotate-[-20deg] pointer-events-none" 
        aria-hidden="true"
      />

      {/* Internal ambient violet glow */}
      <div 
        className="absolute inset-2 rounded-full bg-purple-500/15 blur-[6px] pointer-events-none" 
        aria-hidden="true"
      />

      {/* Sparkles icon inside */}
      <Sparkles size={24} className="text-purple-100 relative z-10 animate-pulse" />
    </motion.div>
  );
});
