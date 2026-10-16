"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  BookOpen,
  FileText,
  Coins,
  Calendar,
  Calculator,
  Sparkles,
  X,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionItem {
  id: string;
  label: string;
  description: string;
  href: string;
  shortcut: string;
  keyLetter: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  gradient: string;
  textColor: string;
  badgeBg: string;
}

const QUICK_ACTIONS: ActionItem[] = [
  {
    id: "bookings",
    label: "Bookings Ledger",
    description: "Client reservations & event contracts",
    href: "/bookings",
    shortcut: "Ctrl+Shift+B",
    keyLetter: "b",
    icon: BookOpen,
    gradient: "from-purple-500 to-indigo-600",
    textColor: "text-purple-400",
    badgeBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  {
    id: "invoices",
    label: "Invoices Center",
    description: "Generate & audit client billings",
    href: "/invoices",
    shortcut: "Ctrl+Shift+I",
    keyLetter: "i",
    icon: FileText,
    gradient: "from-blue-500 to-cyan-600",
    textColor: "text-blue-400",
    badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  {
    id: "payments",
    label: "Payment Receipts",
    description: "Record incoming logs & payouts",
    href: "/payments",
    shortcut: "Ctrl+Shift+P",
    keyLetter: "p",
    icon: Coins,
    gradient: "from-emerald-500 to-teal-600",
    textColor: "text-emerald-400",
    badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  {
    id: "events",
    label: "Events Schedule",
    description: "Active timelines & stage operations",
    href: "/events",
    shortcut: "Ctrl+Shift+E",
    keyLetter: "e",
    icon: Calendar,
    gradient: "from-amber-500 to-orange-600",
    textColor: "text-amber-400",
    badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  {
    id: "quotes",
    label: "Quote Builder",
    description: "Build customized event estimates",
    href: "/quotes",
    shortcut: "Ctrl+Shift+Q",
    keyLetter: "q",
    icon: Calculator,
    gradient: "from-pink-500 to-rose-600",
    textColor: "text-pink-400",
    badgeBg: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  },
];

export function QuickActionsFAB() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in form inputs
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (e.key === "Escape") {
        setIsOpen(false);
        return;
      }

      // Check Ctrl + Shift + key
      if (e.ctrlKey && e.shiftKey) {
        const pressedKey = e.key.toLowerCase();
        const matched = QUICK_ACTIONS.find((act) => act.keyLetter === pressedKey);
        if (matched) {
          e.preventDefault();
          setIsOpen(false);
          router.push(matched.href);
        }
      }
    };

    // Close on click outside
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [router]);

  const handleNavigate = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  return (
    <div
      ref={containerRef}
      data-fab="true"
      data-print-hide="true"
      className="fixed bottom-6 right-24 sm:right-32 z-[9900] flex flex-col items-end select-none print:hidden print-hidden"
    >
      {/* ── EXPANDED SPEED-DIAL ACTION SHEET ─────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="mb-3 w-72 sm:w-80 rounded-2xl bg-white/95 dark:bg-[#0c0e18]/95 border border-slate-200/90 dark:border-white/[0.12] shadow-[0_24px_70px_rgba(0,0,0,0.45),0_0_35px_rgba(168,85,247,0.18)] backdrop-blur-2xl overflow-hidden flex flex-col font-sans antialiased"
            role="menu"
            aria-orientation="vertical"
          >
            {/* Top accent glowing bar */}
            <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 w-full shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.6)]" />

            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200/70 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/60 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-sm shadow-purple-600/30">
                  <Zap size={13} className="text-white fill-white" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Quick Actions</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono text-[9px] font-bold">
                      Ops
                    </span>
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="hidden sm:inline-block text-[9px] font-mono font-semibold text-slate-400 dark:text-zinc-500 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  Esc
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 rounded-lg text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.08] flex items-center justify-center transition cursor-pointer"
                  aria-label="Close quick actions menu"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Actions List */}
            <div className="p-2 space-y-1">
              {QUICK_ACTIONS.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.id}
                    type="button"
                    role="menuitem"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.035, duration: 0.16 }}
                    onClick={() => handleNavigate(action.href)}
                    className="w-full px-2.5 py-2 rounded-xl flex items-center gap-3 text-left transition-all duration-150 group cursor-pointer hover:bg-purple-500/10 dark:hover:bg-white/[0.06] active:scale-[0.98]"
                  >
                    {/* Icon container */}
                    <div
                      className={cn(
                        "h-8 w-8 rounded-xl bg-gradient-to-tr flex items-center justify-center text-white shrink-0 shadow-md transition-transform duration-200 group-hover:scale-110",
                        action.gradient
                      )}
                    >
                      <Icon size={15} />
                    </div>

                    {/* Texts */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors truncate">
                          {action.label}
                        </span>
                        <kbd
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-tight border uppercase shrink-0 transition-opacity",
                            action.badgeBg
                          )}
                        >
                          {action.shortcut}
                        </kbd>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium truncate mt-0.5">
                        {action.description}
                      </p>
                    </div>

                    {/* Chevron Indicator */}
                    <ChevronRight
                      size={13}
                      className="text-slate-300 dark:text-zinc-600 group-hover:text-purple-500 dark:group-hover:text-purple-300 group-hover:translate-x-0.5 transition-all shrink-0"
                    />
                  </motion.button>
                );
              })}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 border-t border-slate-200/70 dark:border-white/[0.06] bg-slate-50/50 dark:bg-black/30 flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <Sparkles size={11} className="text-purple-400" />
                <span>Instant Navigation</span>
              </span>
              <span className="font-mono text-[9px] text-purple-600 dark:text-purple-400 font-bold">
                Ctrl + Shift + Key
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN FLOATING TRIGGER BUTTON (Ultra-Glossy FAB) ──────────────────── */}
      <div className="relative group flex items-center justify-end">
        {/* Tooltip on hover (when closed) */}
        {!isOpen && (
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/95 dark:bg-[#0c0e18]/95 text-white shadow-2xl backdrop-blur-xl whitespace-nowrap border border-slate-700/50 dark:border-white/[0.12] z-50">
            <span className="text-xs font-bold tracking-tight">Quick Actions</span>
            <span className="text-[10px] text-purple-300 font-mono px-1.5 py-0.5 rounded bg-purple-500/20">
              Ctrl+Shift
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center text-white transition-all duration-200 cursor-pointer outline-none focus:outline-none select-none",
            "bg-gradient-to-tr from-purple-600 via-pink-600 to-purple-700",
            "ring-2 ring-white/40 dark:ring-white/20 ring-offset-2 ring-offset-transparent",
            "shadow-[0_10px_30px_rgba(168,85,247,0.45)] hover:shadow-[0_12px_38px_rgba(236,72,153,0.6)]",
            "hover:scale-105 active:scale-95"
          )}
          aria-label={isOpen ? "Close quick actions menu" : "Open quick actions menu"}
          aria-expanded={isOpen}
        >
          {/* Smooth 45-degree rotation morphs '+' perfectly into '×' */}
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
            className="flex items-center justify-center"
          >
            <Plus size={22} className="text-white drop-shadow-md stroke-[2.5]" />
          </motion.div>
        </button>
      </div>
    </div>
  );
}

export default QuickActionsFAB;
