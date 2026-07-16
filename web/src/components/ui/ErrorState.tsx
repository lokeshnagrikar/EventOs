"use client";

import React from "react";
import { AlertTriangle, RotateCcw, ExternalLink, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  errorCode?: string;
  onRetry?: () => void;
  supportLink?: string;
  className?: string;
  compact?: boolean;
}

export default function ErrorState({
  icon: Icon = AlertTriangle,
  title = "Something went wrong",
  message = "We couldn't load this content. Please try again or contact support if the problem persists.",
  errorCode,
  onRetry,
  supportLink,
  className,
  compact = false,
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "rounded-2xl border border-red-500/15 bg-red-500/[0.03] backdrop-blur-sm relative overflow-hidden",
        compact ? "p-4" : "p-6",
        className
      )}
    >
      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-red-500/60 via-rose-500/40 to-transparent" />

      <div className="flex items-start gap-3.5">
        <div className="shrink-0 h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <Icon size={18} />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-red-300 mb-1">{title}</h4>
          <p className="text-[11px] text-red-400/70 leading-relaxed">
            {message}
          </p>

          {errorCode && (
            <p className="text-[9px] font-mono text-red-500/50 mt-1.5 uppercase tracking-wider">
              Error Code: {errorCode}
            </p>
          )}

          <div className="flex items-center gap-2 mt-3">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-lg text-[11px] font-bold border border-red-500/15 transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              >
                <RotateCcw size={11} />
                Retry
              </button>
            )}
            {supportLink && (
              <a
                href={supportLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 text-red-400/60 hover:text-red-300 rounded-lg text-[11px] font-medium transition-colors"
              >
                <ExternalLink size={10} />
                Support
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
