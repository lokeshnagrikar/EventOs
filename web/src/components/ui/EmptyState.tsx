"use client";

import React from "react";
import { LucideIcon, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export type EmptyStateVariant = "leads" | "quotes" | "events" | "gallery" | "invoices" | "default";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon?: LucideIcon;
  variant?: EmptyStateVariant;
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

/* Vector SVG Illustrations for Empty States */
function SvgIllustration({ variant }: { variant: EmptyStateVariant }) {
  switch (variant) {
    case "leads":
      return (
        <svg className="w-24 h-24" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="60" cy="60" r="48" fill="url(#leads_grad)" fillOpacity="0.12" stroke="url(#leads_stroke)" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M45 42C45 35.3726 50.3726 30 57 30H63C69.6274 30 75 35.3726 75 42V56C75 62.6274 69.6274 68 63 68H57C50.3726 68 45 62.6274 45 56V42Z" stroke="#C084FC" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M51 68V76C51 80.4183 54.5817 84 59 84H61C65.4183 84 69 80.4183 69 76V68" stroke="#F472B6" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="60" cy="46" r="6" fill="#A855F7" />
          <path d="M48 60C48 55.5817 53.3726 52 60 52C66.6274 52 72 55.5817 72 60" stroke="#E879F9" strokeWidth="2" />
          <circle cx="84" cy="36" r="3" fill="#38BDF8" />
          <circle cx="36" cy="78" r="2.5" fill="#C084FC" />
          <defs>
            <radialGradient id="leads_grad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(60 60) scale(48)">
              <stop stopColor="#C084FC" />
              <stop offset="1" stopColor="#09090B" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="leads_stroke" x1="12" y1="12" x2="108" y2="108" gradientUnits="userSpaceOnUse">
              <stop stopColor="#A855F7" />
              <stop offset="1" stopColor="#EC4899" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>
      );
    case "quotes":
      return (
        <svg className="w-24 h-24" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="34" y="24" width="52" height="72" rx="10" fill="url(#quotes_bg)" stroke="#818CF8" strokeWidth="1.5" />
          <line x1="44" y1="40" x2="76" y2="40" stroke="#A5B4FC" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="44" y1="52" x2="68" y2="52" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
          <line x1="44" y1="62" x2="62" y2="62" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <circle cx="72" cy="74" r="14" fill="#6366F1" fillOpacity="0.2" stroke="#818CF8" strokeWidth="2" />
          <path d="M67 74L70.5 77.5L77 70.5" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <defs>
            <linearGradient id="quotes_bg" x1="34" y1="24" x2="86" y2="96" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1E1B4B" />
              <stop offset="1" stopColor="#09090B" />
            </linearGradient>
          </defs>
        </svg>
      );
    case "gallery":
      return (
        <svg className="w-24 h-24" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="28" y="36" width="64" height="48" rx="12" fill="url(#gal_bg)" stroke="#F472B6" strokeWidth="1.5" />
          <circle cx="60" cy="60" r="16" fill="#18181B" stroke="#EC4899" strokeWidth="2.5" />
          <circle cx="60" cy="60" r="8" fill="#F472B6" />
          <path d="M42 36L46 28H74L78 36" stroke="#FB7185" strokeWidth="2" strokeLinecap="round" />
          <circle cx="78" cy="46" r="3" fill="#38BDF8" />
          <defs>
            <linearGradient id="gal_bg" x1="28" y1="36" x2="92" y2="84" gradientUnits="userSpaceOnUse">
              <stop stopColor="#831843" />
              <stop offset="1" stopColor="#09090B" />
            </linearGradient>
          </defs>
        </svg>
      );
    case "invoices":
      return (
        <svg className="w-24 h-24" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="36" y="22" width="48" height="76" rx="8" fill="url(#inv_bg)" stroke="#34D399" strokeWidth="1.5" />
          <path d="M44 34H76M44 46H68M44 56H60" stroke="#6EE7B7" strokeWidth="2" strokeLinecap="round" />
          <circle cx="60" cy="74" r="12" fill="#059669" fillOpacity="0.3" stroke="#10B981" strokeWidth="2" />
          <text x="60" y="78" fill="#34D399" fontSize="13" fontWeight="bold" textAnchor="middle" className="font-mono">₹</text>
          <defs>
            <linearGradient id="inv_bg" x1="36" y1="22" x2="84" y2="98" gradientUnits="userSpaceOnUse">
              <stop stopColor="#064E3B" />
              <stop offset="1" stopColor="#09090B" />
            </linearGradient>
          </defs>
        </svg>
      );
    case "events":
      return (
        <svg className="w-24 h-24" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="28" y="28" width="64" height="64" rx="14" fill="url(#ev_bg)" stroke="#38BDF8" strokeWidth="1.5" />
          <path d="M28 44H92" stroke="#0284C7" strokeWidth="1.5" />
          <rect x="42" y="20" width="4" height="12" rx="2" fill="#38BDF8" />
          <rect x="74" y="20" width="4" height="12" rx="2" fill="#38BDF8" />
          <circle cx="46" cy="58" r="4" fill="#38BDF8" />
          <circle cx="60" cy="58" r="4" fill="#C084FC" />
          <circle cx="74" cy="58" r="4" fill="#F472B6" />
          <circle cx="46" cy="72" r="4" fill="#34D399" />
          <circle cx="60" cy="72" r="4" fill="#38BDF8" />
          <defs>
            <linearGradient id="ev_bg" x1="28" y1="28" x2="92" y2="92" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0C4A6E" />
              <stop offset="1" stopColor="#09090B" />
            </linearGradient>
          </defs>
        </svg>
      );
    default:
      return null;
  }
}

export default function EmptyState({
  icon: Icon,
  variant = "default",
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
        "flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-3xl border border-zinc-850/60 bg-zinc-950/40 backdrop-blur-xl space-y-4 max-w-md mx-auto my-6 shadow-2xl relative overflow-hidden",
        className
      )}
    >
      {/* Decorative Orbs */}
      <div className="absolute -top-12 -left-12 h-28 w-28 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 h-28 w-28 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />

      {/* SVG Vector Illustration or Glow Icon */}
      {variant !== "default" ? (
        <div className="relative group flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <SvgIllustration variant={variant} />
          </motion.div>
        </div>
      ) : Icon ? (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-950/40 border border-purple-500/30 text-purple-400 shadow-lg shadow-purple-950/50">
          <Icon size={24} />
        </div>
      ) : null}

      {/* Info details */}
      <div className="space-y-1.5 pt-1">
        <h3 className="text-sm font-black uppercase text-white tracking-wider">
          {title}
        </h3>
        <p className="text-[11px] font-semibold text-zinc-400 leading-relaxed max-w-xs mx-auto">
          {description}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2.5 justify-center pt-2">
        {primaryAction && (
          <button
            type="button"
            onClick={primaryAction.onClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-[10px] font-extrabold shadow-lg shadow-purple-500/20 transition-all active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            {primaryAction.label}
            <ArrowRight size={12} />
          </button>
        )}

        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            className="flex items-center gap-1.5 px-4 py-2 border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 rounded-xl text-[10px] font-extrabold transition-all active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            {secondaryAction.label}
          </button>
        )}

        {ctaText && onCtaClick && (
          <button
            type="button"
            onClick={onCtaClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-[10px] font-extrabold shadow-lg shadow-purple-500/20 transition-all active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
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
