"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  FileText,
  HelpCircle,
  Video,
  Command,
  Keyboard,
  X,
  ArrowRight,
  CornerDownLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buildSearchIndex, fuzzySearch, SearchItem } from "@/lib/helpData";

const TYPE_ICONS: Record<string, React.ElementType> = {
  article: FileText,
  faq: HelpCircle,
  tutorial: Video,
  shortcut: Keyboard,
  command: Command,
};

const TYPE_LABELS: Record<string, string> = {
  article: "Documentation",
  faq: "FAQ",
  tutorial: "Tutorial",
  shortcut: "Shortcut",
  command: "Command",
};

const TYPE_COLORS: Record<string, string> = {
  article: "text-purple-400 bg-purple-500/10",
  faq: "text-blue-400 bg-blue-500/10",
  tutorial: "text-pink-400 bg-pink-500/10",
  shortcut: "text-amber-400 bg-amber-500/10",
  command: "text-emerald-400 bg-emerald-500/10",
};

export default function HelpSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const searchIndex = useMemo(() => buildSearchIndex(), []);
  const results = useMemo(() => fuzzySearch(searchIndex, query), [searchIndex, query]);

  // Global keyboard listener for Ctrl+/
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset active index on results change
  useEffect(() => {
    setActiveIndex(0);
  }, [results]);

  const handleSelect = useCallback(
    (item: SearchItem) => {
      setIsOpen(false);
      router.push(item.href);
    },
    [router]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      handleSelect(results[activeIndex]);
    }
  };

  // Highlight matching text
  const highlight = (text: string, q: string) => {
    if (!q.trim()) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-purple-500/20 text-purple-300 rounded-sm px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] bg-black/70 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800/60">
              <Search size={18} className="text-zinc-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search documentation, FAQs, shortcuts, tutorials..."
                className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none font-medium"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 flex items-center justify-center rounded-md bg-zinc-800 text-zinc-400 hover:text-white text-[10px] font-bold shrink-0"
              >
                <X size={12} />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[360px] overflow-y-auto scrollbar-thin">
              {query.trim() === "" ? (
                <div className="p-6 text-center space-y-3">
                  <Search size={28} className="mx-auto text-zinc-700" />
                  <p className="text-xs text-zinc-500 font-semibold">
                    Start typing to search across documentation, FAQs, tutorials, and shortcuts.
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center pt-1">
                    {["create lead", "invoices", "reset password", "gallery", "keyboard shortcuts"].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setQuery(tag)}
                        className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-bold text-zinc-400 hover:text-purple-400 hover:border-purple-500/20 transition-colors cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : results.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <HelpCircle size={28} className="mx-auto text-zinc-700" />
                  <p className="text-xs text-zinc-500 font-semibold">
                    No results for &quot;{query}&quot;
                  </p>
                  <p className="text-[10px] text-zinc-600">
                    Try different keywords or{" "}
                    <button
                      onClick={() => { setIsOpen(false); router.push("/help/support"); }}
                      className="text-purple-400 hover:underline cursor-pointer"
                    >
                      contact support
                    </button>
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  {results.map((item, idx) => {
                    const Icon = TYPE_ICONS[item.type] || FileText;
                    return (
                      <button
                        key={`${item.type}-${idx}`}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={cn(
                          "w-full flex items-start gap-3 px-5 py-3 text-left transition-colors cursor-pointer",
                          idx === activeIndex ? "bg-zinc-900/80" : "hover:bg-zinc-900/40"
                        )}
                      >
                        <div className={cn("mt-0.5 h-7 w-7 flex items-center justify-center rounded-lg shrink-0", TYPE_COLORS[item.type])}>
                          <Icon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-zinc-200 truncate">
                            {highlight(item.title, query)}
                          </p>
                          <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                            {highlight(item.description, query)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-center">
                          <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider", TYPE_COLORS[item.type])}>
                            {TYPE_LABELS[item.type]}
                          </span>
                          {idx === activeIndex && (
                            <CornerDownLeft size={12} className="text-zinc-500" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-2.5 border-t border-zinc-800/60 bg-zinc-950/80">
              <div className="flex items-center gap-3 text-[9px] text-zinc-600 font-bold">
                <span className="flex items-center gap-1"><ArrowRight size={9} className="rotate-[-90deg]" /><ArrowRight size={9} className="rotate-90" /> Navigate</span>
                <span className="flex items-center gap-1"><CornerDownLeft size={9} /> Open</span>
                <span>Esc Close</span>
              </div>
              <button
                onClick={() => { setIsOpen(false); router.push("/help"); }}
                className="text-[9px] text-purple-400 font-bold hover:underline cursor-pointer"
              >
                Open Help Center →
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
