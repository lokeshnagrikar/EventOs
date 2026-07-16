"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Clock, Play, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import PageShell from "@/components/ui/PageShell";
import EmptyState from "@/components/ui/EmptyState";
import { TUTORIALS } from "@/lib/helpData";

import { useHelpStore } from "@/store/helpStore";

const CATEGORIES = ["All", "Getting Started", "CRM", "Events", "Finance", "Gallery", "AI", "Settings"];

export default function TutorialsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const { tutorialProgress, markTutorialComplete, isTutorialComplete } = useHelpStore();

  const filtered = useMemo(() => {
    if (activeCategory === "All") return TUTORIALS;
    return TUTORIALS.filter((t) => t.category === activeCategory);
  }, [activeCategory]);

  const completedCount = useMemo(() => {
    return TUTORIALS.filter((t) => isTutorialComplete(t.id)).length;
  }, [isTutorialComplete]);

  const progressPercent = Math.round((completedCount / TUTORIALS.length) * 100);

  return (
    <PageShell
      title="Video Tutorials"
      subtitle="Watch and learn at your own pace"
      breadcrumbs={[{ label: "Help Center", href: "/help" }, { label: "Tutorials" }]}
    >
      <div className="space-y-6 select-none text-zinc-300">
        
        {/* Progress Bar & Academy Header */}
        <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Video Academy Progress</h3>
            <div className="flex justify-between text-[9px] font-bold font-mono text-zinc-500">
              <span>{completedCount} OF {TUTORIALS.length} COMPLETED</span>
              <span className="text-purple-400">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full bg-zinc-900 border border-zinc-850 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-650 to-pink-555 rounded-full"
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </div>

        {/* Featured Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/60 p-6 md:p-8" style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)" }}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative z-10 flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Play size={24} className="text-white ml-0.5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Start Here</h2>
              <p className="text-sm text-white/70 font-semibold">New to EventOS? Begin with the Getting Started tutorial series.</p>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
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

        {/* Tutorials Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {filtered.length === 0 ? (
              <EmptyState icon={Video} title="No tutorials" description="No tutorials in this category yet. Check back soon!" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((tut, idx) => {
                  const isWatched = isTutorialComplete(tut.id);
                  return (
                    <motion.div
                      key={tut.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="group rounded-2xl border border-zinc-850 bg-zinc-950/20 hover:border-zinc-700 transition-all overflow-hidden cursor-pointer"
                      onClick={() => markTutorialComplete(tut.id)}
                    >
                      {/* Thumbnail */}
                      <div className="h-36 w-full flex items-center justify-center relative" style={{ background: tut.thumbnail }}>
                        <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                          {isWatched ? <CheckCircle2 size={22} className="text-white" /> : <Play size={22} className="text-white ml-0.5" />}
                        </div>
                        <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-md text-[10px] font-bold text-white flex items-center gap-1">
                          <Clock size={9} /> {tut.duration}
                        </span>
                        {isWatched && (
                          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-emerald-500/80 rounded-md text-[8px] font-black text-white uppercase tracking-wider">
                            Watched
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4 space-y-2">
                        <h3 className="text-xs font-extrabold text-zinc-200 group-hover:text-white">{tut.title}</h3>
                        <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold line-clamp-2">{tut.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-zinc-650 font-bold uppercase">{tut.category}</span>
                          <span className="text-zinc-800">•</span>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                            tut.difficulty === "Beginner" ? "bg-emerald-500/10 text-emerald-400"
                              : tut.difficulty === "Intermediate" ? "bg-amber-500/10 text-amber-400"
                              : "bg-red-500/10 text-red-400"
                          )}>
                            {tut.difficulty}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </PageShell>
  );
}
