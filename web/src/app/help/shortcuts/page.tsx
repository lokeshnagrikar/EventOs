"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Keyboard, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import PageShell from "@/components/ui/PageShell";
import { SHORTCUTS } from "@/lib/helpData";

const CATEGORIES = ["All", "Navigation", "Global", "CRM", "Events", "Finance", "Views"];

export default function ShortcutsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    let items = SHORTCUTS;
    if (activeCategory !== "All") {
      items = items.filter((s) => s.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (s) =>
          s.description.toLowerCase().includes(q) ||
          s.keys.join(" ").toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      );
    }
    return items;
  }, [activeCategory, searchQuery]);

  return (
    <PageShell
      title="Keyboard Shortcuts"
      subtitle="Work faster with keyboard shortcuts"
      breadcrumbs={[{ label: "Help Center", href: "/help" }, { label: "Shortcuts" }]}
    >
      <div className="space-y-6 select-none text-zinc-300">
        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full max-w-xs">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-550">
              <Search size={13} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shortcuts..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-950/40 border border-zinc-850 rounded-xl text-xs placeholder-zinc-600 text-zinc-200 focus:outline-none focus:border-purple-500/30 font-semibold"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
                  activeCategory === cat
                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Shortcuts Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 space-y-3 text-center">
            <Keyboard size={36} className="text-zinc-700" />
            <p className="text-xs text-zinc-500 font-semibold">No shortcuts found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((shortcut, idx) => (
              <motion.div
                key={shortcut.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="flex items-center justify-between p-4 rounded-2xl border border-zinc-850 bg-zinc-950/20 hover:border-zinc-700 transition-all group"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">{shortcut.description}</p>
                  <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-wider">{shortcut.category}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-3">
                  {shortcut.keys.map((key, ki) => (
                    <React.Fragment key={ki}>
                      {ki > 0 && <span className="text-[9px] text-zinc-700 font-bold">+</span>}
                      <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 bg-zinc-900 border border-zinc-700 rounded-lg text-[10px] font-bold text-zinc-300 shadow-sm shadow-zinc-950">
                        {key}
                      </kbd>
                    </React.Fragment>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
