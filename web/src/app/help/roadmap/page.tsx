"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Plus,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  Clock,
  Sparkles,
  Calendar,
  Layers,
  X,
  Send,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageShell from "@/components/ui/PageShell";
import { useToastStore } from "@/lib/toastStore";
import { ROADMAP_ITEMS_INITIAL, RoadmapCard } from "@/lib/successData";

const STAGE_CONFIG = {
  planned: { label: "Planned", color: "text-blue-400 border-blue-500/20 bg-blue-500/5", dot: "bg-blue-500" },
  in_development: { label: "In Development", color: "text-purple-400 border-purple-500/20 bg-purple-500/5", dot: "bg-purple-500" },
  testing: { label: "Testing", color: "text-amber-400 border-amber-500/20 bg-amber-500/5", dot: "bg-amber-500" },
  released: { label: "Released", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5", dot: "bg-emerald-500" },
};

export default function RoadmapPage() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [items, setItems] = useState<RoadmapCard[]>([]);
  const [mounted, setMounted] = useState(false);

  // Modal / Form state
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCat, setNewCat] = useState<any>("CRM");
  const [businessImpact, setBusinessImpact] = useState("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail / Comments state
  const [activeItem, setActiveItem] = useState<RoadmapCard | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState<Record<string, { user: string; text: string; date: string }[]>>({});

  useEffect(() => {
    setMounted(true);
    const storedItems = localStorage.getItem("eventos_roadmap_items");
    const storedComments = localStorage.getItem("eventos_roadmap_comments");
    if (storedItems) {
      try {
        setItems(JSON.parse(storedItems));
      } catch {
        setItems(ROADMAP_ITEMS_INITIAL);
      }
    } else {
      setItems(ROADMAP_ITEMS_INITIAL);
      localStorage.setItem("eventos_roadmap_items", JSON.stringify(ROADMAP_ITEMS_INITIAL));
    }

    if (storedComments) {
      try { setComments(JSON.parse(storedComments)); } catch { /* ignore */ }
    }
  }, []);

  const saveItems = (updated: RoadmapCard[]) => {
    setItems(updated);
    localStorage.setItem("eventos_roadmap_items", JSON.stringify(updated));
  };

  const saveComments = (updated: typeof comments) => {
    setComments(updated);
    localStorage.setItem("eventos_roadmap_comments", JSON.stringify(updated));
  };

  const handleVote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = items.map((item) => {
      if (item.id === id) {
        const nextVoted = !item.voted;
        return {
          ...item,
          votes: nextVoted ? item.votes + 1 : item.votes - 1,
          voted: nextVoted,
        };
      }
      return item;
    });
    saveItems(updated);
    addToast("Vote updated!", "success");
  };

  const handleCreateIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newCard: RoadmapCard = {
        id: `rd-${Date.now().toString(36)}`,
        title: newTitle,
        description: newDesc,
        category: newCat,
        status: "planned",
        progress: 0,
        votes: 1,
        commentsCount: 0,
        estimate: "TBD",
        voted: true,
      };

      saveItems([newCard, ...items]);
      setNewTitle("");
      setNewDesc("");
      setIsSubmitting(false);
      setShowIdeaModal(false);
      addToast("Feature request submitted successfully!", "success");
    }, 800);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !activeItem) return;

    const newComment = {
      user: "Roy Wedding Admin",
      text: commentInput,
      date: new Date().toISOString(),
    };

    const itemComments = comments[activeItem.id] || [];
    const nextComments = {
      ...comments,
      [activeItem.id]: [...itemComments, newComment],
    };
    saveComments(nextComments);
    setCommentInput("");

    // Increment comments count on item
    const updatedItems = items.map((i) => {
      if (i.id === activeItem.id) {
        return { ...i, commentsCount: i.commentsCount + 1 };
      }
      return i;
    });
    saveItems(updatedItems);
  };

  const activeComments = useMemo(() => {
    if (!activeItem) return [];
    return comments[activeItem.id] || [
      { user: "System Success Bot", text: "Welcome to the feature request thread! Feel free to vote and discuss details.", date: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
    ];
  }, [activeItem, comments]);

  if (!mounted) return null;

  return (
    <PageShell
      title="Product Roadmap & Feature Requests"
      subtitle="Vote on future releases, comment on updates, and submit feature requests."
      breadcrumbs={[{ label: "Help Center", href: "/help" }, { label: "Roadmap" }]}
      actions={
        <button
          onClick={() => setShowIdeaModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer print:hidden"
        >
          <Plus size={14} />
          Submit Feature Idea
        </button>
      }
    >
      <div className="space-y-8 select-none text-zinc-300">
        
        {/* ── KANBAN BOARD ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(["planned", "in_development", "testing", "released"] as const).map((status) => {
            const config = STAGE_CONFIG[status];
            const columnItems = items.filter((item) => item.status === status);
            return (
              <div key={status} className="space-y-4">
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", config.dot)} />
                    <span className="text-xs font-black uppercase text-zinc-200">{config.label}</span>
                  </div>
                  <span className="text-[10px] text-zinc-650 font-bold font-mono">{columnItems.length}</span>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
                  {columnItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setActiveItem(item)}
                      className="p-4 rounded-2xl border border-zinc-850 bg-zinc-950/20 hover:border-purple-500/20 hover:bg-zinc-900/10 transition-all space-y-3 cursor-pointer group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase bg-zinc-900 border border-zinc-850 text-purple-400">
                            {item.category}
                          </span>
                          <span className="text-[9px] text-zinc-600 font-mono font-bold">{item.estimate}</span>
                        </div>
                        <h4 className="text-xs font-bold text-zinc-200 group-hover:text-white line-clamp-1">{item.title}</h4>
                        <p className="text-[9px] text-zinc-550 leading-relaxed font-semibold line-clamp-2">{item.description}</p>
                      </div>

                      {/* Progress bar */}
                      {status !== "planned" && status !== "released" && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[7px] font-black text-zinc-550 uppercase">
                            <span>DEVELOPMENT</span>
                            <span>{item.progress}%</span>
                          </div>
                          <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                            <div className="bg-purple-550 h-full rounded-full" style={{ width: `${item.progress}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between border-t border-zinc-850/50 pt-2.5">
                        <button
                          onClick={(e) => handleVote(item.id, e)}
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider transition-colors cursor-pointer",
                            item.voted ? "bg-purple-500/15 border-purple-500/20 text-purple-400"
                              : "bg-zinc-900 border-zinc-850 text-zinc-500 hover:text-zinc-350"
                          )}
                        >
                          <ThumbsUp size={10} />
                          {item.votes} Votes
                        </button>

                        <span className="text-[8px] text-zinc-550 font-bold flex items-center gap-1">
                          <MessageSquare size={10} /> {item.commentsCount}
                        </span>
                      </div>
                    </div>
                  ))}

                  {columnItems.length === 0 && (
                    <div className="py-12 border border-dashed border-zinc-850 rounded-2xl text-center text-[10px] text-zinc-650 font-bold uppercase">
                      No items
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── CREATE IDEA MODAL ────────────────────────────────────────────── */}
        <AnimatePresence>
          {showIdeaModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-5"
              >
                <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
                  <h3 className="text-xs font-black uppercase text-zinc-200 tracking-wider">Submit Feature Request</h3>
                  <button onClick={() => setShowIdeaModal(false)} className="text-zinc-500 hover:text-white cursor-pointer"><X size={16} /></button>
                </div>

                <form onSubmit={handleCreateIdea} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Idea Title</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Ex. Client PDF invoice customization"
                      required
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs placeholder-zinc-650 text-zinc-200 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Category</label>
                      <select
                        value={newCat}
                        onChange={(e) => setNewCat(e.target.value as any)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-350 focus:outline-none"
                      >
                        <option value="CRM">CRM & Leads</option>
                        <option value="Finance">Finance & Invoices</option>
                        <option value="Events">Events & Calendar</option>
                        <option value="Gallery">Media Gallery</option>
                        <option value="Security">Security & Access</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Business Impact</label>
                      <select
                        value={businessImpact}
                        onChange={(e) => setBusinessImpact(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-350 focus:outline-none"
                      >
                        <option value="low">Nice to Have</option>
                        <option value="medium">Important</option>
                        <option value="high">Critical Need</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-zinc-555 tracking-wider">Describe the feature</label>
                    <textarea
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Explain how this improves your operations, what problems it solves..."
                      required
                      rows={4}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowIdeaModal(false)}
                      className="px-4 py-2 border border-zinc-850 hover:bg-zinc-850 text-zinc-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 px-4 py-2 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                      Submit Idea
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── CARD DETAILED COMMENTS DRAWER ────────────────────────────────── */}
        <AnimatePresence>
          {activeItem && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-6"
              >
                <div className="flex justify-between items-start border-b border-zinc-850 pb-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-purple-500/10 text-purple-400">
                        {activeItem.category}
                      </span>
                      <span className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-wider", STAGE_CONFIG[activeItem.status].color)}>
                        {STAGE_CONFIG[activeItem.status].label}
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-zinc-200 truncate">{activeItem.title}</h3>
                  </div>
                  <button onClick={() => setActiveItem(null)} className="text-zinc-500 hover:text-white cursor-pointer"><X size={16} /></button>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed font-semibold">{activeItem.description}</p>

                {/* Comments List */}
                <div className="space-y-3 pt-3 border-t border-zinc-850/50">
                  <h4 className="text-[10px] font-black uppercase text-zinc-550 tracking-wider">Comments Thread</h4>
                  
                  <div className="space-y-3 max-h-[200px] overflow-y-auto scrollbar-thin pr-1">
                    {activeComments.map((com, ci) => (
                      <div key={ci} className="p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl space-y-1">
                        <div className="flex justify-between items-center text-[9px] text-zinc-500 font-mono">
                          <span className="font-bold text-purple-400">{com.user}</span>
                          <span>{new Date(com.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[11px] text-zinc-350 leading-relaxed font-semibold">{com.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Add Comment Form */}
                  <form onSubmit={handleAddComment} className="relative flex items-center pt-2">
                    <input
                      type="text"
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="Post a comment on this feature..."
                      required
                      className="w-full pl-4 pr-12 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs placeholder-zinc-650 text-zinc-200 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 p-1.5 bg-purple-650 hover:bg-purple-650 text-white rounded-lg transition-all cursor-pointer"
                    >
                      <Send size={11} />
                    </button>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </PageShell>
  );
}
