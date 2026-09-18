"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Clock, Play, CheckCircle2, X, AlertCircle, Sparkles, ExternalLink, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import PageShell from "@/components/ui/PageShell";
import EmptyState from "@/components/ui/EmptyState";
import { TUTORIALS, type Tutorial } from "@/lib/helpData";
import { useRouter } from "next/navigation";

import { useHelpStore } from "@/store/helpStore";

const CATEGORIES = ["All", "Getting Started", "CRM", "Events", "Finance", "Gallery", "AI", "Settings"];

export default function TutorialsPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [videoError, setVideoError] = useState(false);
  const { tutorialProgress, markTutorialComplete, isTutorialComplete } = useHelpStore();

  useEffect(() => {
    setVideoError(false);
  }, [selectedTutorial]);

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
                      onClick={() => {
                        setSelectedTutorial(tut);
                        markTutorialComplete(tut.id);
                      }}
                    >
                      {/* Thumbnail */}
                      <div className="h-36 w-full flex items-center justify-center relative" style={{ background: tut.thumbnail }}>
                        <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-black/30">
                          {isWatched ? <CheckCircle2 size={22} className="text-white" /> : <Play size={22} className="text-white ml-0.5" />}
                        </div>
                        <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-md text-[10px] font-bold text-white flex items-center gap-1">
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
                        <h3 className="text-xs font-extrabold text-zinc-200 group-hover:text-white transition-colors">{tut.title}</h3>
                        <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold line-clamp-2">{tut.description}</p>
                        <div className="flex items-center justify-between pt-1">
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
                          <span className="text-[9px] font-bold text-purple-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            Watch <ArrowRight size={10} />
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

        {/* ── VIDEO PLAYER MODAL ── */}
        <AnimatePresence>
          {selectedTutorial && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
              >
                {/* Modal Header */}
                <div className="p-4 sm:p-5 border-b border-zinc-850 flex items-center justify-between gap-4 bg-zinc-900/40">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
                      <Video size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-850 text-zinc-400">
                          {selectedTutorial.category}
                        </span>
                        <span className="text-[9px] font-bold text-zinc-500 flex items-center gap-1">
                          <Clock size={10} /> {selectedTutorial.duration}
                        </span>
                      </div>
                      <h2 className="text-sm sm:text-base font-extrabold text-white truncate mt-0.5">
                        {selectedTutorial.title}
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTutorial(null)}
                    className="h-8 w-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Video / Playback Viewport */}
                <div className="relative bg-black aspect-video w-full flex items-center justify-center overflow-hidden">
                  {selectedTutorial.videoSrc && !videoError ? (
                    <video
                      key={selectedTutorial.videoSrc}
                      src={selectedTutorial.videoSrc}
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                      onError={() => setVideoError(true)}
                    />
                  ) : (
                    /* Elegant Recording In Progress / Pending Fallback */
                    <div className="p-8 text-center space-y-4 max-w-md">
                      <div className="h-16 w-16 mx-auto rounded-3xl bg-gradient-to-tr from-purple-650 to-pink-555 flex items-center justify-center shadow-xl shadow-purple-500/20 text-white">
                        <Play size={28} className="ml-1" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-base font-black text-white">Walkthrough Recording in Progress</h3>
                        <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                          This screen tutorial is ready for upload. Save your OBS screen recording as{" "}
                          <span className="text-purple-400 font-mono font-bold">
                            {selectedTutorial.videoSrc?.split("/").pop() || "tutorial.mp4"}
                          </span>{" "}
                          in the <span className="text-zinc-200 font-mono">web/public/videos/tutorials/</span> directory to stream live instantly.
                        </p>
                      </div>
                      <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            if (selectedTutorial.category === "CRM") router.push("/crm");
                            else if (selectedTutorial.category === "Events") router.push("/events");
                            else if (selectedTutorial.category === "Finance") router.push("/invoices");
                            else if (selectedTutorial.category === "Gallery") router.push("/gallery");
                            else router.push("/dashboard");
                            setSelectedTutorial(null);
                          }}
                          className="px-4 py-2 rounded-xl bg-purple-650 hover:bg-purple-600 text-white text-xs font-bold transition shadow-md flex items-center gap-1.5 cursor-pointer"
                        >
                          <ExternalLink size={12} /> Open Live Screen
                        </button>
                        <button
                          onClick={() => {
                            router.push("/help/docs");
                            setSelectedTutorial(null);
                          }}
                          className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-bold transition cursor-pointer"
                        >
                          Read Text Guide
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer & Description */}
                <div className="p-4 sm:p-5 border-t border-zinc-850 bg-zinc-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <p className="text-xs text-zinc-400 font-semibold max-w-xl">
                    {selectedTutorial.description}
                  </p>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <CheckCircle2 size={11} /> Marked Completed
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  );
}
