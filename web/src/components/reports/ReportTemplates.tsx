"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Search,
  Star,
  Share2,
  Lock,
  ArrowRight,
  TrendingUp,
  Coins,
  Calendar,
  Layers,
  Shield,
  Image,
  Globe,
  FileText,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/lib/toastStore";
import { REPORT_TEMPLATES, ReportTemplate } from "@/lib/reportsData";

const ICON_MAP: Record<string, React.ElementType> = {
  DollarSign,
  FileText,
  TrendingUp,
  Calendar,
  Layers,
  Shield,
  Image,
  Globe,
};

const CATEGORIES = ["All", "Finance", "Sales", "Operations", "System"];

export default function ReportTemplates() {
  const { addToast } = useToastStore();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  // Secure share modal states
  const [shareItem, setShareItem] = useState<ReportTemplate | null>(null);
  const [sharePassword, setSharePassword] = useState("");
  const [shareExpiry, setShareExpiry] = useState("7");
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("eventos_report_templates");
    if (stored) {
      try {
        setTemplates(JSON.parse(stored));
      } catch {
        setTemplates(REPORT_TEMPLATES);
      }
    } else {
      setTemplates(REPORT_TEMPLATES);
      localStorage.setItem("eventos_report_templates", JSON.stringify(REPORT_TEMPLATES));
    }
  }, []);

  const saveTemplates = (updated: ReportTemplate[]) => {
    setTemplates(updated);
    localStorage.setItem("eventos_report_templates", JSON.stringify(updated));
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = templates.map((t) => {
      if (t.id === id) {
        const nextFav = !t.isFavorite;
        addToast(nextFav ? "Added to favorites." : "Removed from favorites.", "info");
        return { ...t, isFavorite: nextFav };
      }
      return t;
    });
    saveTemplates(updated);
  };

  const handleToggleShared = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = templates.map((t) => {
      if (t.id === id) {
        const nextShared = !t.sharedWithWorkspace;
        addToast(nextShared ? "Shared template with workspace." : "Unshared template from workspace.", "info");
        return { ...t, sharedWithWorkspace: nextShared };
      }
      return t;
    });
    saveTemplates(updated);
  };

  // Filter templates list
  const filtered = useMemo(() => {
    let items = templates;
    if (activeCategory !== "All") {
      items = items.filter((t) => t.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }
    return items;
  }, [templates, activeCategory, searchQuery]);

  const generateShareUrl = () => {
    if (!shareItem) return "";
    const token = Math.random().toString(36).substring(7).toUpperCase();
    return `https://eventos.dev/share/template-${token}`;
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      
      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-550">
            <Search size={13} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search report templates..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-950/40 border border-zinc-850 rounded-xl text-xs placeholder-zinc-650 text-zinc-200 focus:outline-none"
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

      {/* Templates Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 border border-zinc-850 bg-zinc-950/20 rounded-2xl text-center space-y-2">
          <FileText size={32} className="mx-auto text-zinc-700" />
          <p className="text-xs text-zinc-500 font-bold">No report templates match search filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((item, idx) => {
            const Icon = ICON_MAP[item.icon] || FileText;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="group flex flex-col justify-between p-5 rounded-2xl border border-zinc-850 bg-zinc-950/20 hover:border-purple-500/15 hover:bg-zinc-900/10 transition-all space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                      <Icon size={16} />
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Pinned Favorite star */}
                      <button onClick={(e) => handleToggleFavorite(item.id, e)} className="text-zinc-650 hover:text-amber-400 transition-colors cursor-pointer">
                        <Star size={13} fill={item.isFavorite ? "#fbbf24" : "none"} className={item.isFavorite ? "text-amber-400" : ""} />
                      </button>

                      {/* Secure Share Link */}
                      <button onClick={() => { setShareItem(item); setCopiedLink(false); }} className="text-zinc-650 hover:text-purple-400 transition-colors cursor-pointer">
                        <Share2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-xs font-extrabold text-zinc-200 group-hover:text-white line-clamp-1">{item.name}</h4>
                    <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold line-clamp-2">{item.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-850/50 pt-3">
                  <span className="text-[9px] text-purple-400/60 font-black uppercase tracking-wider">{item.category}</span>
                  
                  {/* Share template toggle */}
                  <button
                    onClick={(e) => handleToggleShared(item.id, e)}
                    className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all border",
                      item.sharedWithWorkspace
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-zinc-900 border-zinc-850 text-zinc-500 hover:text-zinc-350"
                    )}
                  >
                    {item.sharedWithWorkspace ? "Workspace Shared" : "Private Template"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Secure Share Modal */}
      <AnimatePresence>
        {shareItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Share2 size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-zinc-200 tracking-wider">Share Template</h3>
                  <p className="text-[9px] text-zinc-550 font-semibold mt-0.5">Generate password secure templates link</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider flex items-center gap-1"><Lock size={9} /> Password Protection (Optional)</label>
                  <input
                    type="password"
                    value={sharePassword}
                    onChange={(e) => setSharePassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs placeholder-zinc-700 text-zinc-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider flex items-center gap-1">Expire Share Link</label>
                  <select
                    value={shareExpiry}
                    onChange={(e) => setShareExpiry(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 focus:outline-none"
                  >
                    <option value="1">Expire in 24 hours</option>
                    <option value="7">Expire in 7 days</option>
                    <option value="30">Expire in 30 days</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-850/50 flex flex-col gap-2">
                <button
                  onClick={() => { setCopiedLink(true); addToast("Encrypted link copied to clipboard!", "success"); }}
                  className="w-full py-2 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-purple-500/10"
                >
                  Generate encrypted URL
                </button>
                {copiedLink && (
                  <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between text-[10px] font-mono select-all">
                    <span className="truncate text-zinc-400">{generateShareUrl()}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generateShareUrl());
                        addToast("Copied!", "success");
                      }}
                      className="text-purple-400 hover:text-white font-bold ml-2 cursor-pointer shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                )}
                <button
                  onClick={() => {
                    setShareItem(null);
                    setSharePassword("");
                    setCopiedLink(false);
                  }}
                  className="w-full py-2 border border-zinc-850 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer mt-1"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
