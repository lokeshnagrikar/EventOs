"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, X, Lightbulb, Keyboard, BookOpen, Video, ArrowRight, ChevronRight } from "lucide-react";
import { getContextualHelp } from "@/lib/contextualHelpData";
import { cn } from "@/lib/utils";

const DASHBOARD_PATHS = ["/dashboard", "/crm", "/events", "/gallery", "/invoices", "/quotes", "/settings", "/ai", "/reports", "/bookings", "/activity", "/chat"];

export default function ContextualHelp() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Only show on dashboard/app pages
  const isAppPage = DASHBOARD_PATHS.some(p => pathname.startsWith(p));
  if (!isAppPage) return null;

  const helpContent = getContextualHelp(pathname);
  if (!helpContent) return null;

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 left-6 z-50 h-10 w-10 rounded-full flex items-center justify-center shadow-lg transition cursor-pointer",
          isOpen
            ? "bg-purple-600 text-white border border-purple-500/30"
            : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-purple-400 hover:border-purple-500/30"
        )}
        aria-label="Toggle contextual help"
      >
        {isOpen ? <X size={16} /> : <HelpCircle size={18} />}
      </button>

      {/* Slide-over Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-80 bg-zinc-950/95 border-r border-zinc-850 shadow-2xl backdrop-blur-xl overflow-y-auto scrollbar-thin"
            >
              <div className="p-5 space-y-5">
                {/* Header */}
                <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                  <div>
                    <h2 className="text-sm font-black text-white tracking-tight">{helpContent.title} Help</h2>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Contextual Guide</p>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 transition cursor-pointer" aria-label="Close help panel">
                    <X size={14} />
                  </button>
                </div>

                {/* Quick Tips */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-amber-400">
                    <Lightbulb size={12} /> Quick Tips
                  </div>
                  <div className="space-y-1.5">
                    {helpContent.tips.map((tip, i) => (
                      <div key={i} className="flex gap-2 items-start p-2 rounded-xl bg-zinc-900/30 border border-zinc-900/60">
                        <span className="text-purple-400 font-bold text-[9px] mt-0.5 shrink-0">{i + 1}.</span>
                        <span className="text-[10px] text-zinc-300 leading-relaxed font-medium">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Keyboard Shortcuts */}
                {helpContent.shortcuts.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-cyan-400">
                      <Keyboard size={12} /> Keyboard Shortcuts
                    </div>
                    <div className="space-y-1.5">
                      {helpContent.shortcuts.map((s, i) => (
                        <div key={i} className="flex justify-between items-center p-2 rounded-xl bg-zinc-900/30 border border-zinc-900/60">
                          <span className="text-[10px] text-zinc-300 font-medium">{s.description}</span>
                          <kbd className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-750 text-zinc-400">
                            {s.keys}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Links */}
                <div className="space-y-2 border-t border-zinc-900 pt-4">
                  <button
                    onClick={() => { router.push(helpContent.docsLink); setIsOpen(false); }}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-zinc-900/60 bg-zinc-900/20 hover:bg-zinc-900/40 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className="text-purple-400" />
                      <span className="text-[10px] font-bold text-zinc-300 group-hover:text-white transition">Read Documentation</span>
                    </div>
                    <ChevronRight size={12} className="text-zinc-600 group-hover:text-zinc-400 transition" />
                  </button>

                  {helpContent.videoLink && (
                    <button
                      onClick={() => { router.push(helpContent.videoLink!); setIsOpen(false); }}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-zinc-900/60 bg-zinc-900/20 hover:bg-zinc-900/40 transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <Video size={14} className="text-pink-400" />
                        <span className="text-[10px] font-bold text-zinc-300 group-hover:text-white transition">Watch Tutorial</span>
                      </div>
                      <ChevronRight size={12} className="text-zinc-600 group-hover:text-zinc-400 transition" />
                    </button>
                  )}

                  <button
                    onClick={() => { router.push("/help"); setIsOpen(false); }}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-purple-500/10 bg-purple-950/10 hover:bg-purple-950/20 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <HelpCircle size={14} className="text-purple-400" />
                      <span className="text-[10px] font-bold text-purple-400 group-hover:text-purple-300 transition">Visit Help Center</span>
                    </div>
                    <ArrowRight size={12} className="text-purple-500/50 group-hover:text-purple-400 transition" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
