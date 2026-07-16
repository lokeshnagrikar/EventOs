"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  ThumbsUp,
  TrendingUp,
  Clock,
  Plus,
  Search,
  Filter,
  Layers,
  Calendar,
  Sparkles,
  Rocket,
  Bug,
  AlertCircle,
  Activity,
  Terminal,
  Star,
  CheckCircle,
  ChevronRight,
  Shield,
  HelpCircle,
  AlertTriangle,
  FolderOpen,
  User,
  Heart,
  Share2,
  Bookmark,
  Bell,
  Trash2,
  LayoutGrid,
  Settings,
  Flame,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageShell from "@/components/ui/PageShell";
import { useToastStore } from "@/lib/toastStore";
import { useAuthStore } from "@/store/authStore";

// Mock existing features to show in upvoting board & roadmaps
const INITIAL_FEATURE_REQUESTS = [
  { id: "feat-stripe", title: "Stripe Subscription Checkout Integration", description: "Enable recurring client retainer payments directly inside quotes.", category: "Billing", status: "In Progress", votes: 94, comments: 12, followers: 8, voted: false, impact: "High", target: "Q3 2026", creator: "Roy Events" },
  { id: "feat-cname", title: "White-label custom DNS domains", description: "Allow agencies to route proofing galleries through custom subdomains.", category: "Feature", status: "Planned", votes: 56, comments: 4, followers: 15, voted: false, impact: "High", target: "Q4 2026", creator: "Apex LLC" },
  { id: "feat-mobile", title: "Dedicated iOS / Android mobile application", description: "Receive real-time push alerts for lead check-ins and client updates.", category: "UX Feedback", status: "Researching", votes: 128, comments: 24, followers: 32, voted: true, impact: "Critical", target: "Q1 2027", creator: "Elevate Studio" },
  { id: "feat-slack", title: "Slack workspace notifications channel integration", description: "Push check-in and booking alerts directly to teammate channels.", category: "Feature", status: "Released", votes: 42, comments: 2, followers: 6, voted: false, impact: "Medium", target: "Released", creator: "Grand Plaza" },
];

const INITIAL_DISCUSSIONS = [
  { id: "disc-1", title: "Best strategies to collect payments before photoshoots?", author: "Meera Sen", replies: 8, reactions: { "❤️": 4, "👍": 6 }, pinned: true, helpfulAnswer: "Lock downloads until milestones clear.", category: "Strategy" },
  { id: "disc-2", title: "How to invite contractors with read-only client scope?", author: "John Doe", replies: 3, reactions: { "👍": 2 }, pinned: false, category: "Help" },
];

export default function ProductFeedbackHub() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Sub-tabs configuration
  const [activeTab, setActiveTab] = useState<
    "board" | "submit" | "roadmap" | "changelog" | "discussions" | "announcements" | "moderation"
  >("board");

  // State collections
  const [features, setFeatures] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortFilter, setSortFilter] = useState<"top" | "trending" | "newest">("top");

  // Submit Feedback Form states
  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedbackDesc, setFeedbackDesc] = useState("");
  const [feedbackCat, setFeedbackCat] = useState("Feature Request");
  const [feedbackPriority, setFeedbackPriority] = useState("Medium");
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // CSAT states
  const [starRating, setStarRating] = useState(5);
  const [npsScore, setNpsScore] = useState(10);
  const [csatWritten, setCsatWritten] = useState("");

  // Discussion forum creation states
  const [discTitle, setDiscTitle] = useState("");
  const [discCat, setDiscCat] = useState("General");

  // Notifications settings
  const [notifDashboard, setNotifDashboard] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Hydrate local mock database
    const savedFeats = localStorage.getItem("eventos_feedback_feats");
    const savedDiscs = localStorage.getItem("eventos_feedback_discs");

    if (savedFeats) {
      setFeatures(JSON.parse(savedFeats));
    } else {
      setFeatures(INITIAL_FEATURE_REQUESTS);
      localStorage.setItem("eventos_feedback_feats", JSON.stringify(INITIAL_FEATURE_REQUESTS));
    }

    if (savedDiscs) {
      setDiscussions(JSON.parse(savedDiscs));
    } else {
      setDiscussions(INITIAL_DISCUSSIONS);
      localStorage.setItem("eventos_feedback_discs", JSON.stringify(INITIAL_DISCUSSIONS));
    }
  }, []);

  const saveFeatures = (updated: any[]) => {
    setFeatures(updated);
    localStorage.setItem("eventos_feedback_feats", JSON.stringify(updated));
  };

  const saveDiscussions = (updated: any[]) => {
    setDiscussions(updated);
    localStorage.setItem("eventos_feedback_discs", JSON.stringify(updated));
  };

  // AI Duplicate Detection on Title Change
  const handleTitleChange = (text: string) => {
    setFeedbackTitle(text);
    if (!text.trim()) {
      setDuplicateWarning(null);
      return;
    }

    const query = text.toLowerCase();
    // Simulate AI semantic matching
    if (query.includes("stripe") || query.includes("pay") || query.includes("billing")) {
      setDuplicateWarning("Stripe Subscription Checkout Integration");
    } else if (query.includes("domain") || query.includes("dns") || query.includes("cname")) {
      setDuplicateWarning("White-label custom DNS domains");
    } else if (query.includes("app") || query.includes("mobile") || query.includes("ios") || query.includes("android")) {
      setDuplicateWarning("Dedicated iOS / Android mobile application");
    } else {
      setDuplicateWarning(null);
    }
  };

  // Submit new request
  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackTitle.trim() || !feedbackDesc.trim()) return;

    const newRequest = {
      id: `feat-${Date.now().toString(36)}`,
      title: feedbackTitle,
      description: feedbackDesc,
      category: feedbackCat,
      status: "Researching",
      votes: 1,
      comments: 0,
      followers: 1,
      voted: true,
      impact: "Medium",
      target: "TBD",
      creator: user?.firstName || "Customer",
    };

    saveFeatures([newRequest, ...features]);
    setFeedbackTitle("");
    setFeedbackDesc("");
    setDuplicateWarning(null);
    setActiveTab("board");
    addToast("Feedback submitted successfully!", "success");
  };

  // Vote toggle
  const handleVote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = features.map((f) => {
      if (f.id === id) {
        const nextVoted = !f.voted;
        return {
          ...f,
          votes: nextVoted ? f.votes + 1 : f.votes - 1,
          voted: nextVoted,
        };
      }
      return f;
    });
    saveFeatures(updated);
    addToast("Vote status updated.", "success");
  };

  // Submit CSAT review
  const handleSubmitCsat = (e: React.FormEvent) => {
    e.preventDefault();
    addToast("NPS rating saved. Thank you!", "success");
    setCsatWritten("");
  };

  // Submit new community discussion
  const handleCreateDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discTitle.trim()) return;

    const newDisc = {
      id: `disc-${Date.now().toString(36)}`,
      title: discTitle,
      author: user?.firstName || "Community member",
      replies: 0,
      reactions: { "👍": 1 },
      pinned: false,
      category: discCat,
    };

    saveDiscussions([newDisc, ...discussions]);
    setDiscTitle("");
    addToast("Discussion started!", "success");
  };

  // Moderate request (change status/assign)
  const handleModerateStatus = (id: string, nextStatus: string) => {
    const updated = features.map((f) => (f.id === id ? { ...f, status: nextStatus } : f));
    saveFeatures(updated);
    addToast(`Status updated to ${nextStatus}`, "info");
  };

  // Filter requests based on search query
  const filteredFeatures = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const list = features.filter(
      (f) =>
        f.title.toLowerCase().includes(query) ||
        f.description.toLowerCase().includes(query) ||
        f.category.toLowerCase().includes(query)
    );

    if (sortFilter === "top") return [...list].sort((a, b) => b.votes - a.votes);
    if (sortFilter === "newest") return [...list].reverse();
    return list;
  }, [features, searchQuery, sortFilter]);

  if (!mounted) return null;

  const isAdmin = user?.role === "SUPER_ADMIN";

  return (
    <PageShell
      title="Feedback & Roadmap Hub"
      subtitle="Shape the future of EventOS. Request features, track roadmap progress, and view changelogs."
      breadcrumbs={[{ label: "Help Center", href: "/help" }, { label: "Feedback Hub" }]}
    >
      <div className="space-y-8 select-none text-zinc-300 max-w-6xl">
        
        {/* Navigation Tabs Header */}
        <div className="flex flex-wrap gap-2 border-b border-zinc-900 pb-3 text-xs font-bold">
          {[
            { id: "board" as const, label: "Upvote Board", icon: ThumbsUp },
            { id: "submit" as const, label: "Submit Feedback", icon: Plus },
            { id: "roadmap" as const, label: "Product Roadmap", icon: Layers },
            { id: "changelog" as const, label: "Changelog Center", icon: Rocket },
            { id: "discussions" as const, label: "Community Discussions", icon: MessageSquare },
            { id: "announcements" as const, label: "Notifications & Tips", icon: Bell },
            ...(isAdmin ? [{ id: "moderation" as const, label: "Admin Moderation", icon: Shield }] : []),
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 border rounded-xl transition cursor-pointer",
                  active
                    ? "bg-purple-500/10 text-purple-400 border-purple-500/20 font-black"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="min-h-[400px]">
          
          {/* TAB 1: UPVOTE BOARD */}
          {activeTab === "board" && (
            <div className="space-y-6">
              
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 text-zinc-550 size-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search feature ideas..."
                    className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[10.5px] outline-none text-white focus:border-purple-500 font-bold"
                  />
                </div>
                
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider font-mono">
                  <button
                    onClick={() => setSortFilter("top")}
                    className={cn("px-3 py-1.5 rounded-lg border transition", sortFilter === "top" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "border-zinc-850 text-zinc-500")}
                  >
                    Top Voted
                  </button>
                  <button
                    onClick={() => setSortFilter("newest")}
                    className={cn("px-3 py-1.5 rounded-lg border transition", sortFilter === "newest" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "border-zinc-850 text-zinc-500")}
                  >
                    Newest
                  </button>
                </div>
              </div>

              {/* Features List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFeatures.map((feat) => (
                  <div
                    key={feat.id}
                    className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl flex items-start gap-4 hover:border-zinc-700 transition"
                  >
                    {/* Vote button */}
                    <button
                      onClick={(e) => handleVote(feat.id, e)}
                      className={cn(
                        "flex flex-col items-center justify-center p-2.5 border rounded-xl w-12 shrink-0 transition cursor-pointer",
                        feat.voted
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      <ThumbsUp size={14} className={feat.voted ? "fill-purple-500/20 text-purple-400" : ""} />
                      <span className="text-[11px] font-black font-mono mt-1">{feat.votes}</span>
                    </button>

                    {/* Request Details */}
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 border border-zinc-800 bg-zinc-900 text-zinc-400 rounded-md">
                          {feat.category}
                        </span>
                        <span className={cn(
                          "text-[8px] font-black uppercase px-2 py-0.5 rounded-md border",
                          feat.status === "Released" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-450" :
                          feat.status === "In Progress" ? "border-purple-500/20 bg-purple-500/5 text-purple-400" :
                          "border-blue-500/20 bg-blue-500/5 text-blue-400"
                        )}>
                          {feat.status}
                        </span>
                      </div>
                      <h3 className="text-xs font-black text-zinc-100">{feat.title}</h3>
                      <p className="text-[10px] text-zinc-450 leading-relaxed font-semibold">{feat.description}</p>
                      
                      <div className="flex items-center justify-between pt-2 text-[8px] font-mono text-zinc-600 font-bold">
                        <span>Target: {feat.target}</span>
                        <span className="flex items-center gap-1">
                          <MessageSquare size={10} /> {feat.comments} comments
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 2: SUBMIT FEEDBACK */}
          {activeTab === "submit" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Submission Form */}
              <form onSubmit={handleSubmitFeedback} className="md:col-span-2 space-y-4 max-w-xl">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Title / Brief Idea</label>
                  <input
                    type="text"
                    value={feedbackTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Add dark mode logo custom overrides"
                    required
                    className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 text-white rounded-xl text-xs outline-none focus:border-purple-500 font-semibold"
                  />
                </div>

                {/* Duplicate Suggestion Overlay (AI Duplicate Detection) */}
                {duplicateWarning && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border border-amber-500/20 bg-amber-500/5 rounded-xl space-y-2 flex gap-3 text-xs"
                  >
                    <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-amber-400 uppercase text-[9px] tracking-wider">AI Duplicate Detection Alert</p>
                      <p className="text-[10.5px] font-semibold text-zinc-400 mt-1">
                        A similar feature request <strong>"{duplicateWarning}"</strong> is already in progress.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setFeedbackTitle("");
                          setDuplicateWarning(null);
                          setActiveTab("board");
                          addToast("Redirected to vote for the existing idea!", "info");
                        }}
                        className="text-[9px] font-black text-amber-400 hover:underline mt-2 cursor-pointer uppercase block"
                      >
                        Vote for original request instead →
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Describe the proposal or issue details</label>
                  <textarea
                    rows={6}
                    value={feedbackDesc}
                    onChange={(e) => setFeedbackDesc(e.target.value)}
                    placeholder="Provide details, use cases, or steps to reproduce..."
                    required
                    className="w-full p-3 bg-zinc-900 border border-zinc-800 text-white rounded-xl text-xs outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Category</label>
                    <select
                      value={feedbackCat}
                      onChange={(e) => setFeedbackCat(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-xs outline-none font-bold"
                    >
                      <option value="Feature Request">Feature Request</option>
                      <option value="Bug Report">Bug Report</option>
                      <option value="UX Feedback">UX Feedback</option>
                      <option value="Performance Issue">Performance Issue</option>
                      <option value="Billing Feedback">Billing Feedback</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Priority</label>
                    <select
                      value={feedbackPriority}
                      onChange={(e) => setFeedbackPriority(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-xs outline-none font-bold"
                    >
                      <option value="Low">Low Impact</option>
                      <option value="Medium">Medium Impact</option>
                      <option value="High">High Priority</option>
                      <option value="Critical">Emergency / Blocked</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-650 to-pink-650 text-white font-bold rounded-xl text-xs shadow-lg transition cursor-pointer hover:opacity-90"
                >
                  Submit Proposal
                </button>
              </form>

              {/* Telemetry card & CSAT survey */}
              <div className="space-y-6">
                
                {/* Auto-Captured Telemetry */}
                <div className="p-4 border border-zinc-850 bg-zinc-950/20 rounded-2xl font-mono text-[10px] space-y-3">
                  <span className="text-[8px] text-zinc-550 uppercase font-black tracking-widest block font-sans">Diagnosis Logs captured</span>
                  <div className="space-y-1.5 text-zinc-400 font-semibold">
                    <div className="flex justify-between">
                      <span>Operating System:</span>
                      <span className="text-zinc-200">Windows 11</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Browser Client:</span>
                      <span className="text-zinc-200">Chrome 125.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>App Version:</span>
                      <span className="text-zinc-200">v1.2.5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Workspace ID:</span>
                      <span className="text-zinc-200">WRK-ROY-EVENTS</span>
                    </div>
                  </div>
                </div>

                {/* Star rating & Written reviews */}
                <div className="p-5 border border-zinc-850 bg-[#111113]/40 rounded-2xl space-y-4">
                  <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block">Customer Sentiment Survey</span>
                  <form onSubmit={handleSubmitCsat} className="space-y-4 text-xs font-semibold">
                    
                    {/* Stars */}
                    <div className="space-y-1.5">
                      <span className="text-[8.5px] uppercase font-black text-zinc-550 tracking-wider">Star Rating (CSAT)</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setStarRating(s)}
                            className="cursor-pointer"
                          >
                            <Star size={16} className={cn(s <= starRating ? "text-amber-400 fill-amber-400" : "text-zinc-700")} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* NPS slider */}
                    <div className="space-y-1.5">
                      <span className="text-[8.5px] uppercase font-black text-zinc-550 tracking-wider">Net Promoter Score (NPS): {npsScore}</span>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={npsScore}
                        onChange={(e) => setNpsScore(parseInt(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                      <div className="flex justify-between text-[8px] text-zinc-550 font-bold uppercase tracking-wider font-mono">
                        <span>Not likely</span>
                        <span>Extremely likely</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-bold rounded-lg border border-zinc-800 transition text-[9px] uppercase cursor-pointer"
                    >
                      Save Sentiment
                    </button>
                  </form>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: PRODUCT ROADMAP */}
          {activeTab === "roadmap" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs animate-slide-in">
              {[
                { name: "Researching", desc: "Evaluating user needs", dot: "bg-blue-400", items: features.filter(f => f.status === "Researching") },
                { name: "Planned", desc: "Scheduled for build", dot: "bg-purple-400", items: features.filter(f => f.status === "Planned") },
                { name: "In Progress", desc: "Currently building", dot: "bg-amber-400", items: features.filter(f => f.status === "In Progress") },
                { name: "Released", desc: "Live in workspace", dot: "bg-emerald-450", items: features.filter(f => f.status === "Released") }
              ].map((col, idx) => (
                <div key={idx} className="p-4 border border-zinc-850 bg-[#111113]/30 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2.5 w-2.5 rounded-full", col.dot)} />
                    <div>
                      <h3 className="text-[11px] font-black uppercase text-white tracking-wider font-sans">{col.name}</h3>
                      <p className="text-[9px] text-zinc-550 font-semibold">{col.desc}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {col.items.length === 0 ? (
                      <div className="py-6 border border-dashed border-zinc-900 text-center text-[9px] font-black uppercase text-zinc-650 rounded-xl">Empty column</div>
                    ) : (
                      col.items.map((item) => (
                        <div
                          key={item.id}
                          className="p-3.5 border border-zinc-900 bg-zinc-950/40 rounded-xl hover:border-zinc-800 transition cursor-pointer"
                        >
                          <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wide block mb-1.5">{item.category}</span>
                          <h4 className="text-[10.5px] font-black text-zinc-200">{item.title}</h4>
                          
                          <div className="mt-3 flex justify-between items-center text-[8px] font-mono text-zinc-600 font-bold border-t border-zinc-900 pt-2">
                            <span>Impact: {item.impact}</span>
                            <span>{item.votes} votes</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: CHANGELOG CENTER */}
          {activeTab === "changelog" && (
            <div className="space-y-8 animate-slide-in max-w-3xl">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block font-mono">Product Releases Ledger</span>
                <button
                  onClick={() => addToast("Subscribed to RSS releases feed!", "success")}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-800 hover:bg-zinc-900 rounded-xl text-[9px] font-bold text-zinc-400 transition cursor-pointer font-mono"
                >
                  RSS Feed 📻
                </button>
              </div>

              <div className="relative pl-6 border-l border-zinc-900 space-y-6">
                {[
                  { ver: "v1.2.5", date: "July 07, 2026", title: "Global Super Admin Panel Releases", desc: "Operational consoles for database backups recovery, server log file rosters, and feature toggle flags.", type: "Feature" },
                  { ver: "v1.2.4", date: "June 28, 2026", title: "Workspace Custom Subdomains DNS", desc: "Allow enterprise agencies to route proofing galleries through custom subdomains.", type: "Feature" },
                  { ver: "v1.2.3", date: "June 14, 2026", title: "Kanban board dragging lags fixed", desc: "Fixed React-Beautiful-Dnd component loading lag under slow network speeds.", type: "Fix" }
                ].map((log, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full bg-purple-500 border border-zinc-950" />
                    <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-[9px] font-bold font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase text-[8px] font-black">{log.type}</span>
                        <span className="text-zinc-300">{log.ver}</span>
                        <span className="text-zinc-550">{log.date}</span>
                      </div>
                      <h4 className="text-xs font-black text-white">{log.title}</h4>
                      <p className="text-[10px] text-zinc-400 leading-normal font-semibold font-sans">{log.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: COMMUNITY DISCUSSIONS */}
          {activeTab === "discussions" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-slide-in text-xs font-semibold">
              
              {/* Discussion Thread List */}
              <div className="md:col-span-2 space-y-4">
                <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block font-mono">Discussion Forums</span>
                <div className="space-y-3">
                  {discussions.map((disc) => (
                    <div
                      key={disc.id}
                      className="p-4 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-3"
                    >
                      <div className="flex justify-between items-start font-bold">
                        <span className="text-[8.5px] font-black text-zinc-500 uppercase tracking-wide">{disc.category}</span>
                        {disc.pinned && (
                          <span className="text-[7.5px] font-black uppercase px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md">Pinned 📌</span>
                        )}
                      </div>
                      <h3 className="text-[11px] font-black text-zinc-200">{disc.title}</h3>
                      
                      {disc.helpfulAnswer && (
                        <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 text-emerald-450 rounded-xl text-[10px] font-sans font-bold leading-normal">
                          💡 Marked helpful: "{disc.helpfulAnswer}"
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[8.5px] font-mono text-zinc-600 font-bold border-t border-zinc-900 pt-2.5">
                        <span>Started by: {disc.author}</span>
                        <div className="flex gap-3">
                          <span>{disc.replies} replies</span>
                          <button
                            onClick={() => addToast("Reaction logged successfully.", "success")}
                            className="hover:text-zinc-300 cursor-pointer"
                          >
                            React 💖
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Start new discussion form */}
              <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
                <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block">Start a Discussion</span>
                <form onSubmit={handleCreateDiscussion} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9.5px] uppercase font-black text-zinc-500">Discussion Title</label>
                    <input
                      type="text"
                      value={discTitle}
                      onChange={(e) => setDiscTitle(e.target.value)}
                      placeholder="e.g. Tips on organizing check-ins?"
                      required
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-xl outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9.5px] uppercase font-black text-zinc-500">Topic Category</label>
                    <select
                      value={discCat}
                      onChange={(e) => setDiscCat(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl outline-none font-bold"
                    >
                      <option value="General">General Talk</option>
                      <option value="Help">Q&A Help</option>
                      <option value="Strategy">Strategy</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-purple-650 hover:bg-purple-600 text-white font-bold rounded-lg transition text-[10px] uppercase cursor-pointer"
                  >
                    Post Topic
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TAB 6: NOTIFICATIONS & TIPS */}
          {activeTab === "announcements" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-slide-in text-xs font-semibold">
              
              {/* Product announcements */}
              <div className="md:col-span-2 space-y-4">
                <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block font-mono">Product Announcements</span>
                <div className="space-y-3.5">
                  <div className="p-4 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-2">
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 border border-purple-500/20 bg-purple-500/5 text-purple-400 rounded-md block w-max">Maintenance</span>
                    <h3 className="text-xs font-black text-zinc-100">Database migration scheduled for Sunday</h3>
                    <p className="text-[10px] text-zinc-450 leading-relaxed font-semibold">We will be updating database latency caching profiles on Sunday 04:00 AM UTC. Expect 5 minutes of read-only access warnings.</p>
                  </div>
                  <div className="p-4 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-2">
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 border border-emerald-500/20 bg-emerald-500/5 text-emerald-455 rounded-md block w-max">New Feature</span>
                    <h3 className="text-xs font-black text-zinc-100">Automated client invoices clearing is live!</h3>
                    <p className="text-[10px] text-zinc-450 leading-relaxed font-semibold">Clients subscribing to Professional features can now trigger email alerts for overdue invoices clearance directly from Settings.</p>
                  </div>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
                <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block">Notification settings</span>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2.5 border border-zinc-900 bg-zinc-950/40 rounded-xl">
                    <span className="text-zinc-350">In-App Banner Notifications</span>
                    <button
                      type="button"
                      onClick={() => setNotifDashboard(!notifDashboard)}
                      className={cn("w-9 h-4.5 rounded-full p-0.5 transition-all relative cursor-pointer", notifDashboard ? "bg-purple-650" : "bg-zinc-800")}
                    >
                      <div className={cn("w-3.5 h-3.5 bg-white rounded-full transition-all absolute top-0.5", notifDashboard ? "left-5.5" : "left-0.5")} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center p-2.5 border border-zinc-900 bg-zinc-950/40 rounded-xl">
                    <span className="text-zinc-350">Email Digests & Reports</span>
                    <button
                      type="button"
                      onClick={() => setNotifEmail(!notifEmail)}
                      className={cn("w-9 h-4.5 rounded-full p-0.5 transition-all relative cursor-pointer", notifEmail ? "bg-purple-650" : "bg-zinc-800")}
                    >
                      <div className={cn("w-3.5 h-3.5 bg-white rounded-full transition-all absolute top-0.5", notifEmail ? "left-5.5" : "left-0.5")} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center p-2.5 border border-zinc-900 bg-zinc-950/40 rounded-xl">
                    <span className="text-zinc-350">Push notifications</span>
                    <button
                      type="button"
                      onClick={() => setNotifPush(!notifPush)}
                      className={cn("w-9 h-4.5 rounded-full p-0.5 transition-all relative cursor-pointer", notifPush ? "bg-purple-650" : "bg-zinc-800")}
                    >
                      <div className={cn("w-3.5 h-3.5 bg-white rounded-full transition-all absolute top-0.5", notifPush ? "left-5.5" : "left-0.5")} />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 7: ADMIN MODERATION PANEL */}
          {activeTab === "moderation" && isAdmin && (
            <div className="space-y-6 animate-slide-in">
              <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block font-mono">Product Board Moderation desk</span>
              
              <div className="border border-zinc-850 bg-zinc-950/20 rounded-2xl overflow-hidden font-mono text-[10px]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-850 text-zinc-500 text-[8.5px] uppercase font-black tracking-wider bg-zinc-900/30">
                      <th className="p-4">Requested Feature Idea</th>
                      <th className="p-4">Workspace Creator</th>
                      <th className="p-4">Votes</th>
                      <th className="p-4 text-right">Moderator overrides</th>
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((feat) => (
                      <tr key={feat.id} className="border-b border-zinc-900 last:border-0 hover:bg-zinc-900/10">
                        <td className="p-4">
                          <span className="font-extrabold text-zinc-200 block text-xs font-sans">{feat.title}</span>
                          <span className="text-[8.5px] text-zinc-500 uppercase font-bold">{feat.category} | Current Status: {feat.status}</span>
                        </td>
                        <td className="p-4 text-zinc-350 font-sans font-bold">{feat.creator}</td>
                        <td className="p-4 font-bold text-zinc-200">{feat.votes}</td>
                        <td className="p-4 text-right flex justify-end gap-1.5">
                          <button
                            onClick={() => handleModerateStatus(feat.id, "In Progress")}
                            className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded text-[9px] transition cursor-pointer"
                          >
                            Set In-Progress
                          </button>
                          <button
                            onClick={() => handleModerateStatus(feat.id, "Released")}
                            className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-emerald-450 rounded text-[9px] transition cursor-pointer"
                          >
                            Set Released
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>
    </PageShell>
  );
}
