import React from "react";
import { LucideIcon, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import { useRouter } from "next/navigation";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaText?: string;
  onCtaClick?: () => void;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  tutorialLabel?: string;
  tutorialPath?: string;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  ctaText,
  onCtaClick,
  primaryAction,
  secondaryAction,
  tutorialLabel,
  tutorialPath,
  className
}: EmptyStateProps) {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className={cn(
        "flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-3xl border border-zinc-850/60 bg-zinc-950/20 backdrop-blur-md space-y-4 max-w-md mx-auto my-6 shadow-xl relative overflow-hidden",
        className
      )}
    >
      {/* Decorative Orbs */}
      <div className="absolute -top-12 -left-12 h-24 w-24 rounded-full bg-purple-500/5 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 h-24 w-24 rounded-full bg-pink-500/5 blur-2xl pointer-events-none" />

      {/* Glow Ring Icon Wrapper */}
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-purple-400 shadow-md">
        <Icon size={20} />
      </div>

      {/* Info details */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-black uppercase text-white tracking-wider">
          {title}
        </h3>
        <p className="text-[11px] font-semibold text-zinc-450 leading-relaxed max-w-xs mx-auto">
          {description}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2.5 justify-center pt-2">
        {/* Legacy Primary Action */}
        {primaryAction && (
          <button
            type="button"
            onClick={primaryAction.onClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-[10px] font-extrabold shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            {primaryAction.label}
            <ArrowRight size={12} />
          </button>
        )}

        {/* Legacy Secondary Action */}
        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            className="flex items-center gap-1.5 px-4 py-2 border border-zinc-850 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 rounded-xl text-[10px] font-extrabold transition-all active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            {secondaryAction.label}
          </button>
        )}

        {/* Direct CTA */}
        {ctaText && onCtaClick && (
          <button
            type="button"
            onClick={onCtaClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-[10px] font-extrabold shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            {ctaText}
            <ArrowRight size={12} />
          </button>
        )}
      </div>

      {/* Quick Video Tutorial option */}
      {tutorialPath && (
        <div className="pt-2 border-t border-zinc-900/60 w-full flex items-center justify-center">
          <button
            type="button"
            onClick={() => router.push(tutorialPath)}
            className="text-[9px] font-bold text-purple-400 hover:text-purple-300 hover:underline cursor-pointer flex items-center gap-1"
          >
            Quick Video Tutorial: {tutorialLabel || "Watch and Learn"} →
          </button>
        </div>
      )}
    </motion.div>
  );
}
