"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  BookOpen,
  Video,
  HelpCircle,
  Keyboard,
  MessageSquare,
  LifeBuoy,
  Sparkles,
  TrendingUp,
  Compass,
  ArrowRight,
  Clock,
  Shield,
  Activity,
  CheckCircle,
  Loader2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageShell from "@/components/ui/PageShell";
import { useToastStore } from "@/lib/toastStore";
import { ARTICLES, TUTORIALS, CHANGELOG, FAQS, buildSearchIndex, fuzzySearch } from "@/lib/helpData";

const QUICK_ACTIONS = [
  { label: "Documentation", description: "Browse all guides", icon: BookOpen, href: "/help/docs", color: "from-purple-500 to-indigo-500" },
  { label: "Video Tutorials", description: "Watch & learn", icon: Video, href: "/help/tutorials", color: "from-pink-500 to-rose-500" },
  { label: "Product Tours", description: "Guided walkthroughs", icon: Compass, href: "/help/tours", color: "from-purple-500 via-pink-500 to-purple-600" },
  { label: "AI Assistant", description: "Chat with co-pilot", icon: Sparkles, href: "/help/assistant", color: "from-cyan-500 to-blue-500" },
  { label: "FAQ", description: "Quick answers", icon: HelpCircle, href: "/help/faq", color: "from-blue-500 to-cyan-500" },
  { label: "Shortcuts", description: "Work faster", icon: Keyboard, href: "/help/shortcuts", color: "from-amber-500 to-orange-500" },
  { label: "What's New", description: "Product updates", icon: TrendingUp, href: "/help/changelog", color: "from-emerald-500 to-teal-500" },
  { label: "Feedback Hub", description: "Bugs & Feature Board", icon: MessageSquare, href: "/help/feedback", color: "from-indigo-500 to-purple-500" },
  { label: "Community & Academy", description: "Interact & Learn", icon: Users, href: "/help/community", color: "from-blue-500 to-indigo-500" },
  { label: "Support", description: "Get help", icon: LifeBuoy, href: "/help/support", color: "from-red-500 to-pink-500" },
];

const POPULAR_TAGS = ["create lead", "invite team", "invoices", "quotes", "gallery", "reset password", "events", "2FA"];

export default function HelpCenterHome() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [searchQuery, setSearchQuery] = useState("");

  // NPS states
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [npsEmoji, setNpsEmoji] = useState("😄");
  const [npsSuggestion, setNpsSuggestion] = useState("");
  const [npsCategory, setNpsCategory] = useState<"Usability" | "Speed" | "Pricing" | "Features" | "Other">("Usability");
  const [submittingNps, setSubmittingNps] = useState(false);
  const [npsSuccess, setNpsSuccess] = useState(false);

  const handleSubmitNps = (e: React.FormEvent) => {
    e.preventDefault();
    if (npsScore === null) {
      addToast("Please select an NPS rating from 0 to 10.", "info");
      return;
    }

    setSubmittingNps(true);
    setTimeout(() => {
      const stored = localStorage.getItem("eventos_nps_feedback");
      const current = stored ? JSON.parse(stored) : [];

      const newFeedback = {
        id: `nps-${Date.now().toString(36)}`,
        user: "Roy Wedding Admin",
        score: npsScore,
        emoji: npsEmoji,
        suggestion: npsSuggestion,
        category: npsCategory,
        date: new Date().toISOString(),
      };

      localStorage.setItem("eventos_nps_feedback", JSON.stringify([newFeedback, ...current]));
      setSubmittingNps(false);
      setNpsSuccess(true);
      addToast("Thank you for your feedback!", "success");
    }, 800);
  };

  const searchIndex = useMemo(() => buildSearchIndex(), []);
  const results = useMemo(() => fuzzySearch(searchIndex, searchQuery), [searchIndex, searchQuery]);

  const featuredArticles = ARTICLES.slice(0, 3);
  const popularArticles = ARTICLES.slice(0, 8);
  const featuredTutorials = TUTORIALS.slice(0, 4);
  const recentChangelog = CHANGELOG.slice(0, 3);

  const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
  };

  return (
    <PageShell title="Help Center" subtitle="Find answers, learn features, and get support">
      <div className="space-y-12 pb-12 select-none text-zinc-300">

        {/* ── HERO SEARCH ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl border border-zinc-800/60 bg-zinc-950/40 backdrop-blur-xl p-8 md:p-12 text-center"
        >
          {/* Decorative Orbs */}
          <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-purple-500/8 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-pink-500/8 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-60 w-60 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-center gap-2">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Sparkles size={18} className="text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">How can we help?</h1>
              <p className="text-sm text-zinc-500 font-semibold mt-2">Search documentation, FAQs, tutorials, and more</p>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-lg mx-auto">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anything..."
                className="w-full pl-11 pr-20 py-3.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl text-sm placeholder-zinc-600 text-zinc-200 focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 font-semibold transition-all"
              />
              <span className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <kbd className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded-md text-[9px] font-bold text-zinc-500">
                  Ctrl /
                </kbd>
              </span>
            </div>

            {/* Search Results Dropdown */}
            {searchQuery.trim() && (
              <div className="max-w-lg mx-auto text-left bg-zinc-900/80 border border-zinc-800 rounded-2xl max-h-[250px] overflow-y-auto shadow-xl">
                {results.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500 font-semibold">{`No results found for "${searchQuery}"`}</div>
                ) : (
                  results.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => router.push(item.href)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/60 transition-colors text-left cursor-pointer border-b border-zinc-800/40 last:border-0"
                    >
                      <span className="text-[8px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded shrink-0">{item.type}</span>
                      <span className="text-xs font-bold text-zinc-200 truncate flex-1">{item.title}</span>
                      <ArrowRight size={12} className="text-zinc-600 shrink-0" />
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Popular Tags */}
            {!searchQuery.trim() && (
              <div className="flex flex-wrap gap-1.5 justify-center">
                {POPULAR_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearchQuery(tag)}
                    className="px-3 py-1 bg-zinc-900/60 border border-zinc-800 rounded-xl text-[10px] font-bold text-zinc-400 hover:text-purple-400 hover:border-purple-500/20 transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── QUICK ACTIONS ─────────────────────────────────────────────────── */}
        <motion.div variants={stagger} initial="hidden" animate="visible">
          <h2 className="text-xs font-black uppercase text-zinc-500 tracking-wider mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.label}
                  variants={fadeUp}
                  onClick={() => router.push(action.href)}
                  className="group p-4 rounded-2xl border border-zinc-850 bg-zinc-950/30 hover:border-zinc-700 transition-all text-center space-y-2.5 cursor-pointer hover:bg-zinc-900/20"
                >
                  <div className={cn("h-10 w-10 mx-auto rounded-xl bg-gradient-to-tr flex items-center justify-center shadow-lg", action.color)}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold text-zinc-200 group-hover:text-white">{action.label}</p>
                    <p className="text-[9px] text-zinc-550 font-semibold">{action.description}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ── FEATURED GUIDES ───────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-black uppercase text-zinc-500 tracking-wider">Featured Guides</h2>
            <button onClick={() => router.push("/help/docs")} className="text-[10px] text-purple-400 font-bold hover:underline cursor-pointer flex items-center gap-1">
              View all <ArrowRight size={10} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredArticles.map((article, idx) => (
              <motion.button
                key={article.slug}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                onClick={() => router.push(`/help/docs/${article.slug}`)}
                className="group text-left p-5 rounded-2xl border border-zinc-850 bg-zinc-950/30 hover:border-purple-500/20 transition-all space-y-3 cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-purple-500/5 blur-2xl pointer-events-none" />
                <div className="flex items-center gap-2">
                  <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider", article.difficulty === "Beginner" ? "bg-emerald-500/10 text-emerald-400" : article.difficulty === "Intermediate" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400")}>
                    {article.difficulty}
                  </span>
                  <span className="text-[9px] text-zinc-600 font-semibold flex items-center gap-1">
                    <Clock size={9} /> {article.readingTime} min read
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-zinc-200 group-hover:text-white">{article.title}</h3>
                <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold line-clamp-2">{article.excerpt}</p>
                <span className="text-[9px] text-purple-400 font-bold flex items-center gap-1 group-hover:underline">
                  Read guide <ArrowRight size={9} />
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── POPULAR ARTICLES + RECENT UPDATES ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Popular Articles */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-black uppercase text-zinc-500 tracking-wider">Popular Articles</h2>
              <button onClick={() => router.push("/help/docs")} className="text-[10px] text-purple-400 font-bold hover:underline cursor-pointer flex items-center gap-1">
                Browse all <ArrowRight size={10} />
              </button>
            </div>
            <div className="border border-zinc-850 rounded-2xl bg-zinc-950/20 divide-y divide-zinc-850/50 overflow-hidden">
              {popularArticles.map((article) => (
                <button
                  key={article.slug}
                  onClick={() => router.push(`/help/docs/${article.slug}`)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-zinc-900/30 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <BookOpen size={14} className="text-purple-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">{article.title}</p>
                      <p className="text-[9px] text-zinc-550 font-semibold">{article.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] text-zinc-600 font-semibold">{article.readingTime} min</span>
                    <ArrowRight size={12} className="text-zinc-700 group-hover:text-purple-400 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Updates */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-black uppercase text-zinc-500 tracking-wider">Recent Updates</h2>
              <button onClick={() => router.push("/help/changelog")} className="text-[10px] text-purple-400 font-bold hover:underline cursor-pointer flex items-center gap-1">
                View all <ArrowRight size={10} />
              </button>
            </div>
            <div className="border border-zinc-850 rounded-2xl bg-zinc-950/20 p-5 space-y-4">
              {recentChangelog.map((entry) => (
                <div key={entry.id} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={cn("px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider", entry.category === "Feature" ? "bg-purple-500/10 text-purple-400" : entry.category === "Fix" ? "bg-red-500/10 text-red-400" : entry.category === "Improvement" ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-400")}>
                      {entry.category}
                    </span>
                    <span className="text-[9px] text-zinc-600 font-mono">{entry.version}</span>
                  </div>
                  <h4 className="text-[11px] font-extrabold text-zinc-200">{entry.title}</h4>
                  <p className="text-[9px] text-zinc-550 leading-relaxed font-semibold">{entry.description.slice(0, 80)}...</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── VIDEO TUTORIALS PREVIEW ───────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-black uppercase text-zinc-500 tracking-wider">Video Tutorials</h2>
            <button onClick={() => router.push("/help/tutorials")} className="text-[10px] text-purple-400 font-bold hover:underline cursor-pointer flex items-center gap-1">
              View all <ArrowRight size={10} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredTutorials.map((tut) => (
              <button
                key={tut.id}
                onClick={() => router.push("/help/tutorials")}
                className="group text-left rounded-2xl border border-zinc-850 bg-zinc-950/30 hover:border-zinc-700 transition-all overflow-hidden cursor-pointer"
              >
                <div className="h-28 w-full flex items-center justify-center relative" style={{ background: tut.thumbnail }}>
                  <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Video size={18} className="text-white" />
                  </div>
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm rounded text-[9px] font-bold text-white">{tut.duration}</span>
                </div>
                <div className="p-3.5 space-y-1">
                  <p className="text-[11px] font-extrabold text-zinc-200 group-hover:text-white truncate">{tut.title}</p>
                  <p className="text-[9px] text-zinc-550 font-semibold">{tut.category} • {tut.difficulty}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push("/help/assistant")}
            className="text-left p-6 rounded-2xl border border-zinc-850 bg-zinc-950/30 hover:border-purple-500/20 transition-all group cursor-pointer relative overflow-hidden"
          >
            <div className="absolute -bottom-10 -right-10 h-24 w-24 rounded-full bg-purple-500/5 blur-2xl pointer-events-none" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 animate-pulse">
                <Sparkles size={18} className="text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-zinc-200 group-hover:text-white">AI Support Assistant</h3>
                <p className="text-[10px] text-zinc-550 leading-relaxed font-semibold">Chat with our AI support co-pilot to get instant answers and walkthroughs.</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push("/help/support")}
            className="text-left p-6 rounded-2xl border border-zinc-850 bg-zinc-950/30 hover:border-purple-500/20 transition-all group cursor-pointer relative overflow-hidden"
          >
            <div className="absolute -bottom-10 -right-10 h-24 w-24 rounded-full bg-purple-500/5 blur-2xl pointer-events-none" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <MessageSquare size={18} className="text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-zinc-200 group-hover:text-white">Need help? Contact Support</h3>
                <p className="text-[10px] text-zinc-550 leading-relaxed font-semibold">Create a support ticket, report a bug, or request a feature. We respond within 4-8 business hours.</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push("/help/status")}
            className="text-left p-6 rounded-2xl border border-zinc-850 bg-zinc-950/30 hover:border-emerald-500/20 transition-all group cursor-pointer relative overflow-hidden"
          >
            <div className="absolute -bottom-10 -right-10 h-24 w-24 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Activity size={18} className="text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-zinc-200 group-hover:text-white">System Status</h3>
                <p className="text-[10px] text-zinc-550 leading-relaxed font-semibold">All systems operational. Check the health of every service in real-time.</p>
              </div>
            </div>
          </button>
        </div>

        {/* ── ENTERPRISE CUSTOMER SUCCESS PORTALS ───────────────────────────── */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-zinc-550 tracking-wider">Customer Success & Feedback Portals</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Public Roadmap", desc: "Vote on new feature ideas", href: "/help/roadmap", color: "from-blue-500 to-cyan-500" },
              { label: "Report a Bug", desc: "Share errors with telemetry", href: "/help/bugs", color: "from-red-500 to-pink-500" },
              { label: "Live Support Chat", desc: "Connect with CS agents", href: "/help/chat", color: "from-purple-500 via-pink-500 to-purple-600" },
              { label: "CS Admin Dashboard", desc: "Track CSAT, NPS, & ticket queue", href: "/help/dashboard", color: "from-emerald-500 to-teal-500" },
            ].map((port) => (
              <button
                key={port.label}
                onClick={() => router.push(port.href)}
                className="text-left p-5 rounded-2xl border border-zinc-850 bg-zinc-950/20 hover:border-zinc-700 hover:bg-zinc-900/10 transition-all cursor-pointer group"
              >
                <p className="text-xs font-extrabold text-zinc-200 group-hover:text-white">{port.label}</p>
                <p className="text-[9px] text-zinc-500 font-semibold leading-relaxed mt-1">{port.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── NPS & CSAT FEEDBACK WIDGET ────────────────────────────────────── */}
        <div className="p-6 border border-zinc-850 bg-zinc-950/25 rounded-3xl relative overflow-hidden">
          <div className="absolute -top-12 -left-12 h-24 w-24 rounded-full bg-purple-500/5 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 h-24 w-24 rounded-full bg-pink-500/5 blur-2xl pointer-events-none" />

          {npsSuccess ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle size={32} className="mx-auto text-emerald-500" />
              <h4 className="text-sm font-extrabold text-zinc-200">Feedback Submitted Successfully!</h4>
              <p className="text-[10px] text-zinc-500 font-semibold">Thank you for helping us improve EventOS. Your insights have been added to our admin logs.</p>
              <button
                onClick={() => setNpsSuccess(false)}
                className="text-[9px] text-purple-400 font-extrabold hover:underline cursor-pointer"
              >
                Submit another rating
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitNps} className="space-y-5 relative z-10">
              <div>
                <h3 className="text-xs font-black uppercase text-zinc-200 tracking-wider">How likely are you to recommend EventOS?</h3>
                <p className="text-[9px] text-zinc-550 font-bold uppercase tracking-wider mt-0.5">NPS rating score index collector</p>
              </div>

              {/* NPS Score Selector */}
              <div className="space-y-2">
                <div className="flex justify-between text-[8px] font-black text-zinc-550 uppercase">
                  <span>0 - Extremely Unlikely</span>
                  <span>10 - Extremely Likely</span>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                    const active = npsScore === score;
                    return (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setNpsScore(score)}
                        className={cn(
                          "h-8 w-8 rounded-lg border text-xs font-extrabold transition-all cursor-pointer shrink-0 flex items-center justify-center",
                          active ? "bg-purple-650 border-purple-500 text-white shadow-md shadow-purple-900/20"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                        )}
                      >
                        {score}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Emoji satisfaction */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Emoji Sentiment Rating</label>
                  <div className="flex gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-1.5 justify-around">
                    {["😢", "😐", "😄"].map((emo) => {
                      const active = npsEmoji === emo;
                      return (
                        <button
                          key={emo}
                          type="button"
                          onClick={() => setNpsEmoji(emo)}
                          className={cn("text-lg hover:scale-125 transition-transform cursor-pointer px-2.5 rounded-lg", active && "bg-zinc-800 border border-zinc-700")}
                        >
                          {emo}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Category select */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Feedback Topic</label>
                  <select
                    value={npsCategory}
                    onChange={(e) => setNpsCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-350 focus:outline-none"
                  >
                    <option value="Usability">Usability & UI</option>
                    <option value="Speed">Response Speed</option>
                    <option value="Pricing">Subscription Pricing</option>
                    <option value="Features">Feature Requests</option>
                    <option value="Other">General Feedback</option>
                  </select>
                </div>

                {/* Suggestions textarea */}
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-[9px] font-black uppercase text-zinc-555 tracking-wider">Comment or suggestion</label>
                  <input
                    type="text"
                    value={npsSuggestion}
                    onChange={(e) => setNpsSuggestion(e.target.value)}
                    placeholder="Tell us what you think..."
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs placeholder-zinc-650 text-zinc-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-zinc-850/50">
                <button
                  type="submit"
                  disabled={submittingNps}
                  className="px-5 py-2.5 bg-purple-650 hover:bg-purple-605 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-purple-500/10 flex items-center gap-1.5"
                >
                  {submittingNps && <Loader2 size={12} className="animate-spin" />}
                  Submit Feedback
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </PageShell>
  );
}
