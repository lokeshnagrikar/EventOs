"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Search,
  Clock,
  ArrowRight,
  Rocket,
  Shield,
  Users,
  FileText,
  Layers,
  Calendar,
  Coins,
  Image,
  Globe,
  Sparkles,
  Settings,
  Bell,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageShell from "@/components/ui/PageShell";
import EmptyState from "@/components/ui/EmptyState";
import { ARTICLES, DOC_CATEGORIES } from "@/lib/helpData";
import { useHelpStore } from "@/store/helpStore";
import { Bookmark, History } from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Rocket, Shield, Users, FileText, Layers, Calendar, Coins, Image, Globe, Sparkles, Settings, Bell, Lock,
};

export default function DocsPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { bookmarks, recentlyViewed } = useHelpStore();

  const filteredArticles = useMemo(() => {
    let items = ARTICLES;
    if (activeCategory !== "all") {
      items = items.filter((a) => a.categorySlug === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
      );
    }
    return items;
  }, [activeCategory, searchQuery]);

  const bookmarkedArticles = useMemo(() => {
    return ARTICLES.filter((a) => bookmarks.includes(a.slug));
  }, [bookmarks]);

  return (
    <PageShell
      title="Documentation"
      subtitle="Learn everything about EventOS"
      breadcrumbs={[{ label: "Help Center", href: "/help" }, { label: "Documentation" }]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 select-none text-zinc-300">
        
        {/* ── MAIN CONTENT ── */}
        <div className="lg:col-span-3 space-y-6">
          {/* SEARCH + CATEGORY TABS */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative w-full max-w-xs">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-550">
                <Search size={13} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-9 pr-4 py-2 bg-zinc-950/40 border border-zinc-850 rounded-xl text-xs placeholder-zinc-600 text-zinc-200 focus:outline-none focus:border-purple-500/30 font-semibold"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 overflow-x-auto">
              <button
                onClick={() => setActiveCategory("all")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
                  activeCategory === "all"
                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                )}
              >
                All ({ARTICLES.length})
              </button>
              {DOC_CATEGORIES.map((cat) => {
                const count = ARTICLES.filter((a) => a.categorySlug === cat.slug).length;
                const Icon = ICON_MAP[cat.icon] || BookOpen;
                return (
                  <button
                    key={cat.slug}
                    onClick={() => setActiveCategory(cat.slug)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
                      activeCategory === cat.slug
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                    )}
                  >
                    <Icon size={11} />
                    {cat.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* ARTICLES GRID */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory + searchQuery}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {filteredArticles.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No articles found"
                  description={searchQuery ? `No results for "${searchQuery}". Try different keywords.` : "No articles in this category yet."}
                  primaryAction={{ label: "Browse All", onClick: () => { setActiveCategory("all"); setSearchQuery(""); } }}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredArticles.map((article, idx) => (
                    <motion.button
                      key={article.slug}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => router.push(`/help/docs/${article.slug}`)}
                      className="group text-left p-5 rounded-2xl border border-zinc-850 bg-zinc-950/20 hover:border-purple-500/15 hover:bg-zinc-900/15 transition-all space-y-3 cursor-pointer animate-slide-in"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                          article.difficulty === "Beginner" ? "bg-emerald-500/10 text-emerald-400"
                            : article.difficulty === "Intermediate" ? "bg-amber-500/10 text-amber-400"
                            : "bg-red-500/10 text-red-400"
                        )}>
                          {article.difficulty}
                        </span>
                        <span className="text-[9px] text-zinc-650 font-semibold flex items-center gap-1">
                          <Clock size={9} /> {article.readingTime} min
                        </span>
                        <span className="text-[9px] text-zinc-700 font-mono">{article.lastUpdated}</span>
                      </div>
                      <h3 className="text-[13px] font-extrabold text-zinc-200 group-hover:text-white">{article.title}</h3>
                      <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold line-clamp-2">{article.excerpt}</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[9px] text-purple-400/60 font-bold">{article.category}</span>
                        <ArrowRight size={12} className="text-zinc-700 group-hover:text-purple-400 transition-colors" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="space-y-6">
          {/* Bookmarks Section */}
          <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
            <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
              <Bookmark size={12} className="text-purple-400" /> Bookmarks ({bookmarkedArticles.length})
            </h4>
            {bookmarkedArticles.length === 0 ? (
              <p className="text-[10px] text-zinc-600 font-semibold italic">No bookmarked articles yet.</p>
            ) : (
              <div className="space-y-2.5">
                {bookmarkedArticles.map((art) => (
                  <button
                    key={art.slug}
                    onClick={() => router.push(`/help/docs/${art.slug}`)}
                    className="w-full text-left p-2.5 rounded-xl border border-zinc-900 bg-zinc-950/40 hover:border-purple-500/10 transition text-[11px] font-bold block truncate text-zinc-300 hover:text-white cursor-pointer"
                  >
                    {art.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recently Viewed Section */}
          <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
            <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
              <History size={12} className="text-pink-400" /> Recently Viewed
            </h4>
            {recentlyViewed.length === 0 ? (
              <p className="text-[10px] text-zinc-600 font-semibold italic">No recently viewed articles.</p>
            ) : (
              <div className="space-y-2.5">
                {recentlyViewed.map((item) => (
                  <button
                    key={item.slug}
                    onClick={() => router.push(`/help/docs/${item.slug}`)}
                    className="w-full text-left p-2.5 rounded-xl border border-zinc-900 bg-zinc-950/40 hover:border-pink-500/10 transition text-[11px] font-bold block truncate text-zinc-300 hover:text-white cursor-pointer"
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </PageShell>
  );
}
