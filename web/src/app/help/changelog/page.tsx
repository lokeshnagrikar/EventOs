"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, Tag, Rocket, Bug, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import PageShell from "@/components/ui/PageShell";
import { CHANGELOG } from "@/lib/helpData";

const CATEGORY_FILTERS = ["All", "Feature", "Fix", "Improvement", "Breaking"];

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; border: string; bg: string; text: string; dot: string }> = {
  Feature: { icon: Rocket, border: "border-purple-500/20", bg: "bg-purple-500/5", text: "text-purple-400", dot: "bg-purple-500" },
  Fix: { icon: Bug, border: "border-red-500/20", bg: "bg-red-500/5", text: "text-red-400", dot: "bg-red-500" },
  Improvement: { icon: TrendingUp, border: "border-blue-500/20", bg: "bg-blue-500/5", text: "text-blue-400", dot: "bg-blue-500" },
  Breaking: { icon: AlertTriangle, border: "border-amber-500/20", bg: "bg-amber-500/5", text: "text-amber-400", dot: "bg-amber-500" },
};

export default function ChangelogPage() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = useMemo(() => {
    if (activeFilter === "All") return CHANGELOG;
    return CHANGELOG.filter((c) => c.category === activeFilter);
  }, [activeFilter]);

  return (
    <PageShell
      title="What's New"
      subtitle="Product updates, releases, and announcements"
      breadcrumbs={[{ label: "Help Center", href: "/help" }, { label: "Changelog" }]}
    >
      <div className="space-y-6 select-none text-zinc-300 max-w-3xl">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
                activeFilter === cat
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  : "text-zinc-500 hover:text-zinc-300 border border-transparent"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative pl-6 border-l border-zinc-850 space-y-8">
          {filtered.map((entry, idx) => {
            const config = CATEGORY_CONFIG[entry.category];
            const Icon = config.icon;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="relative"
              >
                {/* Timeline dot */}
                <div className={cn("absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-zinc-950", config.dot)} />

                <div className={cn("p-5 rounded-2xl border transition-all", config.border, "bg-zinc-950/20")}>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-1", config.bg, config.text)}>
                      <Icon size={9} /> {entry.category}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono font-bold">{entry.version}</span>
                    <span className="text-[10px] text-zinc-600 font-semibold flex items-center gap-1">
                      <Clock size={9} /> {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-zinc-200 mb-1">{entry.title}</h3>
                  <p className="text-[11px] text-zinc-450 leading-relaxed font-medium">{entry.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
