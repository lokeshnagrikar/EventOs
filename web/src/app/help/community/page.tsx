"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  MessageCircle,
  BookOpen,
  Award,
  Video,
  ShoppingBag,
  Search,
  Plus,
  ThumbsUp,
  Bookmark,
  Download,
  CheckCircle,
  Play,
  HelpCircle,
  Calendar,
  Star,
  Shield,
  Trash2,
  Lock,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ArrowRight,
  MessageSquare,
  AwardIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageShell from "@/components/ui/PageShell";
import { useToastStore } from "@/lib/toastStore";
import { useAuthStore } from "@/store/authStore";

// Mock templates and assets in Resource Library/Marketplace
const MOCK_TEMPLATES = [
  { id: "tmpl-prop-1", title: "Luxury Wedding Proposal Template", category: "Proposals", downloads: 1450, rating: 4.9, author: "Apex Weddings", premium: false },
  { id: "tmpl-inv-2", title: "Milestone-based Invoice Layout", category: "Invoices", downloads: 820, rating: 4.8, author: "Finance Expert", premium: true },
  { id: "tmpl-chk-3", title: "100-Point Day-of Coordinator Checklist", category: "Planning", downloads: 2100, rating: 5.0, author: "Top Mentor", premium: false },
  { id: "tmpl-mkt-4", title: "SaaS Instagram Marketing templates pack", category: "Marketing", downloads: 340, rating: 4.6, author: "Growth Agency", premium: true },
];

// Mock discussions
const MOCK_FORUMS = [
  { id: "frm-1", title: "How to handle client timeline delays on short notice?", replies: 12, votes: 45, author: "Sarah Johnson", badge: "Mentor", date: "2 hours ago", solved: true },
  { id: "frm-2", title: "Best contract clauses for balloon decor wind damage limits?", replies: 8, votes: 24, author: "Amit Mehta", badge: "Contributor", date: "6 hours ago", solved: false },
  { id: "frm-3", title: "Do you charge extra for initial consultation draft boards?", replies: 21, votes: 68, author: "John Doe", badge: "Expert", date: "1 day ago", solved: true },
];

// Mock courses
const MOCK_COURSES = [
  { id: "crs-beg", title: "EventOS Platform Essentials", level: "Beginner", lessons: 6, progress: 100, completed: true },
  { id: "crs-auto", title: "SaaS Workspace Automation & Webhooks", level: "Intermediate", lessons: 8, progress: 75, completed: false },
  { id: "crs-growth", title: "Scaling your Event Agency to 7-Figures", level: "Advanced", lessons: 12, progress: 10, completed: false },
];

// Mock events/webinars
const MOCK_EVENTS = [
  { id: "evt-webinar", title: "How to automate client retainers with Stripe inside EventOS", date: "July 15, 2026 at 04:00 PM UTC", speaker: "Stripe Integrations Architect", registered: false },
  { id: "evt-ama", title: "Ask Me Anything (AMA) with EventOS Product Design team", date: "July 24, 2026 at 02:00 PM UTC", speaker: "Principal Product Designer", registered: false },
];

// Mock community users leaderboard
const LEADERBOARD_USERS = [
  { rank: 1, name: "Sarah Johnson", points: 12450, badge: "Ambassador", color: "text-purple-400" },
  { rank: 2, name: "Rahul Sharma", points: 8900, badge: "Expert Mentor", color: "text-emerald-400" },
  { rank: 3, name: "Amit Mehta", points: 6420, badge: "Top Contributor", color: "text-blue-400" },
];

export default function EventOsCommunityHub() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Tab views
  const [activeTab, setActiveTab] = useState<
    "feed" | "library" | "academy" | "events" | "reputation" | "moderation"
  >("feed");

  // State collections
  const [forums, setForums] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Quiz interactive simulation state
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [reputationPoints, setReputationPoints] = useState(2450); // Initial mock points

  // Discussion create form
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicCategory, setNewTopicCategory] = useState("General");

  // Library category filter
  const [libraryFilter, setLibraryFilter] = useState("All");

  useEffect(() => {
    setMounted(true);
    // Hydrate local community database
    const savedForums = localStorage.getItem("eventos_community_forums");
    const savedTemplates = localStorage.getItem("eventos_community_templates");
    const savedCourses = localStorage.getItem("eventos_community_courses");
    const savedEvents = localStorage.getItem("eventos_community_events");

    if (savedForums) setForums(JSON.parse(savedForums));
    else {
      setForums(MOCK_FORUMS);
      localStorage.setItem("eventos_community_forums", JSON.stringify(MOCK_FORUMS));
    }

    if (savedTemplates) setTemplates(JSON.parse(savedTemplates));
    else {
      setTemplates(MOCK_TEMPLATES);
      localStorage.setItem("eventos_community_templates", JSON.stringify(MOCK_TEMPLATES));
    }

    if (savedCourses) setCourses(JSON.parse(savedCourses));
    else {
      setCourses(MOCK_COURSES);
      localStorage.setItem("eventos_community_courses", JSON.stringify(MOCK_COURSES));
    }

    if (savedEvents) setEvents(JSON.parse(savedEvents));
    else {
      setEvents(MOCK_EVENTS);
      localStorage.setItem("eventos_community_events", JSON.stringify(MOCK_EVENTS));
    }
  }, []);

  const saveForums = (updated: any[]) => {
    setForums(updated);
    localStorage.setItem("eventos_community_forums", JSON.stringify(updated));
  };

  const saveEvents = (updated: any[]) => {
    setEvents(updated);
    localStorage.setItem("eventos_community_events", JSON.stringify(updated));
  };

  const saveCourses = (updated: any[]) => {
    setCourses(updated);
    localStorage.setItem("eventos_community_courses", JSON.stringify(updated));
  };

  // Upvote forum topic
  const handleForumUpvote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = forums.map(f => f.id === id ? { ...f, votes: f.votes + 1 } : f);
    saveForums(updated);
    addToast("Discussion upvoted!", "success");
  };

  // Submit discussion
  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;

    const newTopic = {
      id: `frm-${Date.now().toString(36)}`,
      title: newTopicTitle,
      replies: 0,
      votes: 1,
      author: user?.firstName || "Community member",
      badge: "Contributor",
      date: "Just now",
      solved: false,
    };

    saveForums([newTopic, ...forums]);
    setNewTopicTitle("");
    addToast("Discussion post published!", "success");
  };

  // Register for event
  const handleRegisterEvent = (id: string) => {
    const updated = events.map(evt => evt.id === id ? { ...evt, registered: !evt.registered } : evt);
    saveEvents(updated);
    const target = events.find(evt => evt.id === id);
    if (!target.registered) {
      addToast("Successfully registered! Reminders set.", "success");
    } else {
      addToast("Registration cancelled.", "info");
    }
  };

  // Quiz submission
  const handleSubmitQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuizAnswer) return;

    setQuizSubmitted(true);
    if (selectedQuizAnswer === "A") {
      setReputationPoints(prev => prev + 50);
      addToast("🎉 Correct! You earned +50 reputation points!", "success");
    } else {
      addToast("❌ Incorrect. Try again to lock in learning.", "error");
    }
  };

  // Course completion simulation
  const handleCompleteCourse = (courseId: string) => {
    const updated = courses.map(c => c.id === courseId ? { ...c, progress: 100, completed: true } : c);
    saveCourses(updated);
    setReputationPoints(prev => prev + 250);
    addToast("🎉 Congratulations! Course completed. Certificate unlocked (+250 pts)", "success");
  };

  // Filter templates list based on search and category filters
  const filteredTemplates = useMemo(() => {
    return templates.filter((tmpl) => {
      const matchSearch = tmpl.title.toLowerCase().includes(searchQuery.toLowerCase()) || tmpl.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = libraryFilter === "All" || tmpl.category === libraryFilter;
      return matchSearch && matchCategory;
    });
  }, [templates, searchQuery, libraryFilter]);

  if (!mounted) return null;

  const isAdmin = user?.role === "SUPER_ADMIN";

  return (
    <PageShell
      title="EventOS Academy & Community Hub"
      subtitle="Interact with event professionals, download proposal templates, and complete SaaS learning courses."
      breadcrumbs={[{ label: "Help Center", href: "/help" }, { label: "Community" }]}
    >
      <div className="space-y-8 select-none text-zinc-300 max-w-6xl">
        
        {/* TAB CONTROLS HEADER */}
        <div className="flex flex-wrap gap-2 border-b border-zinc-900 pb-3 text-xs font-bold">
          {[
            { id: "feed" as const, label: "Community Feed", icon: Users },
            { id: "library" as const, label: "Resource Marketplace", icon: ShoppingBag },
            { id: "academy" as const, label: "Academy Courses", icon: BookOpen },
            { id: "events" as const, label: "Webinars & AMA", icon: Calendar },
            { id: "reputation" as const, label: "My Reputation", icon: Award },
            ...(isAdmin ? [{ id: "moderation" as const, label: "Moderation Queue", icon: Shield }] : []),
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
                    : "border-transparent text-zinc-550 hover:text-zinc-300"
                )}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content panels */}
        <div className="min-h-[400px]">
          
          {/* TAB 1: COMMUNITY FEED */}
          {activeTab === "feed" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-in text-xs font-semibold">
              
              {/* Central Discussions List */}
              <div className="lg:col-span-2 space-y-4">
                <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block font-mono">Trending Conversations</span>
                <div className="space-y-3">
                  {forums.map((frm) => (
                    <div key={frm.id} className="p-4 border border-zinc-850 bg-zinc-950/20 rounded-2xl flex items-start gap-4">
                      
                      {/* Upvotes */}
                      <button
                        onClick={(e) => handleForumUpvote(frm.id, e)}
                        className="flex flex-col items-center justify-center p-2 border border-zinc-900 bg-zinc-950/40 rounded-xl w-11 hover:border-zinc-700 cursor-pointer"
                      >
                        <ThumbsUp size={12} className="text-zinc-500" />
                        <span className="text-[10px] font-bold font-mono mt-0.5 text-zinc-300">{frm.votes}</span>
                      </button>

                      {/* Content */}
                      <div className="flex-1 space-y-1.5">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-[8px] font-black uppercase text-zinc-550 font-mono">Started {frm.date} by {frm.author}</span>
                          <span className="px-1.5 py-0.5 border border-purple-500/20 bg-purple-500/5 text-purple-400 rounded text-[7.5px] font-black font-sans uppercase">
                            {frm.badge}
                          </span>
                          {frm.solved && (
                            <span className="text-[7.5px] font-black px-1.5 py-0.5 bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 rounded-md">Solved ✓</span>
                          )}
                        </div>
                        <h3 className="text-[11.5px] font-black text-white hover:text-purple-400 transition cursor-pointer">{frm.title}</h3>
                        <div className="text-[8px] font-bold text-zinc-550 font-mono flex gap-3 pt-1 border-t border-zinc-900/40">
                          <span>{frm.replies} replies</span>
                          <button
                            onClick={() => addToast("Saved discussion to bookmarks.", "success")}
                            className="hover:text-zinc-300 cursor-pointer"
                          >
                            Bookmark
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar: Leaderboard & Create Topic */}
              <div className="space-y-6">
                
                {/* Create discussion */}
                <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
                  <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block">Start Conversation</span>
                  <form onSubmit={handleCreateTopic} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9.5px] uppercase font-black text-zinc-550">Topic Title</label>
                      <input
                        type="text"
                        value={newTopicTitle}
                        onChange={(e) => setNewTopicTitle(e.target.value)}
                        placeholder="e.g. Tips on collecting client signatures?"
                        required
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-xl outline-none focus:border-purple-500 font-bold"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-purple-650 hover:bg-purple-600 text-white font-bold rounded-lg transition text-[10px] uppercase cursor-pointer"
                    >
                      Post Topic
                    </button>
                  </form>
                </div>

                {/* Leaderboard panel */}
                <div className="p-5 border border-zinc-850 bg-[#111113]/40 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block font-mono">Community Leaderboard</span>
                    <Award size={14} className="text-amber-500" />
                  </div>
                  <div className="space-y-3 font-semibold font-mono">
                    {LEADERBOARD_USERS.map((usr, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 border border-zinc-900 bg-zinc-950/40 rounded-xl">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-550 font-bold">{usr.rank}.</span>
                          <span className="text-zinc-200 font-sans">{usr.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-zinc-100 font-bold block">{usr.points.toLocaleString()} pts</span>
                          <span className={cn("text-[7.5px] font-black uppercase font-sans tracking-wide", usr.color)}>{usr.badge}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: RESOURCE MARKETPLACE */}
          {activeTab === "library" && (
            <div className="space-y-6 animate-slide-in text-xs font-semibold">
              
              {/* Category selector & Search */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 text-zinc-550 size-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search templates, checklists..."
                    className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-xl outline-none text-[10.5px] focus:border-purple-500 font-bold"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {["All", "Proposals", "Invoices", "Planning", "Marketing"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setLibraryFilter(cat)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-[8.5px] font-black uppercase tracking-wider transition cursor-pointer",
                        libraryFilter === cat
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          : "border-zinc-850 text-zinc-500"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Templates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
                {filteredTemplates.map((tmpl) => (
                  <div key={tmpl.id} className="p-4 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-3 hover:border-zinc-700 transition flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[7.5px] font-black font-mono uppercase text-zinc-500">
                        <span>{tmpl.category}</span>
                        {tmpl.premium ? (
                          <span className="px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded">Premium</span>
                        ) : (
                          <span className="text-emerald-450">Free</span>
                        )}
                      </div>
                      <h4 className="text-xs font-black text-zinc-200 leading-normal">{tmpl.title}</h4>
                      <p className="text-[8.5px] text-zinc-550 font-bold font-mono">Shared by: {tmpl.author}</p>
                    </div>

                    <div className="pt-3 border-t border-zinc-900/60 flex items-center justify-between text-[8px] font-bold font-mono">
                      <span className="text-amber-400 flex items-center gap-0.5"><Star size={10} className="fill-amber-400 text-amber-400" /> {tmpl.rating}</span>
                      <button
                        onClick={() => addToast("Downloading template files...", "success")}
                        className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-purple-500/20 text-zinc-300 hover:text-white rounded-lg transition flex items-center gap-1 cursor-pointer font-bold uppercase text-[7.5px]"
                      >
                        <Download size={10} /> Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 3: ACADEMY COURSES */}
          {activeTab === "academy" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-in text-xs font-semibold">
              
              {/* Courses list */}
              <div className="lg:col-span-2 space-y-4">
                <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block font-mono">Academy Learning Tracks</span>
                <div className="space-y-3.5">
                  {courses.map((crs) => (
                    <div key={crs.id} className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[8px] font-black uppercase text-zinc-550 font-mono tracking-wider">Level: {crs.level} ({crs.lessons} lessons)</span>
                          <h3 className="text-xs font-black text-white mt-0.5">{crs.title}</h3>
                        </div>
                        {crs.completed ? (
                          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 rounded uppercase font-black text-[7.5px] tracking-wide">Completed ✓</span>
                        ) : (
                          <button
                            onClick={() => handleCompleteCourse(crs.id)}
                            className="px-2.5 py-1 bg-purple-650 hover:bg-purple-600 text-white rounded text-[8px] font-black uppercase transition cursor-pointer"
                          >
                            Finish Course
                          </button>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-bold text-zinc-555 font-mono uppercase tracking-wide">
                          <span>Overall Progress</span>
                          <span>{crs.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-900 border border-zinc-850 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${crs.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar: Interactive Quiz */}
              <div className="space-y-6 font-sans">
                <div className="p-5 border border-zinc-850 bg-[#111113]/40 rounded-2xl space-y-4 font-semibold">
                  <div className="flex items-center gap-1.5 text-purple-400">
                    <Sparkles size={14} className="animate-pulse" />
                    <span className="text-[9px] uppercase font-black tracking-widest font-mono">Live Academy Quiz Challenge</span>
                  </div>
                  
                  <div className="space-y-3 text-xs leading-relaxed font-sans text-zinc-250">
                    <p className="font-extrabold text-white">Question: Which configuration secures retainer payments before event details are finalized?</p>
                    
                    <form onSubmit={handleSubmitQuiz} className="space-y-2.5">
                      {[
                        { key: "A", text: "Create Stripe payment milestones directly inside quotes proposals." },
                        { key: "B", text: "Lock workspace domain DNS logs in global superadmin." },
                        { key: "C", text: "Enable White-label client templates download links." }
                      ].map((opt) => (
                        <label
                          key={opt.key}
                          className={cn(
                            "flex items-start gap-2.5 p-3 border rounded-xl cursor-pointer hover:border-zinc-800 transition text-[10.5px] font-semibold font-sans",
                            selectedQuizAnswer === opt.key ? "border-purple-500 bg-purple-500/5 text-purple-300" : "border-zinc-900 bg-zinc-950/40 text-zinc-400"
                          )}
                        >
                          <input
                            type="radio"
                            name="quiz"
                            value={opt.key}
                            checked={selectedQuizAnswer === opt.key}
                            onChange={() => setSelectedQuizAnswer(opt.key)}
                            disabled={quizSubmitted}
                            className="hidden"
                          />
                          <span className="font-mono font-black text-purple-400">{opt.key}.</span>
                          <span>{opt.text}</span>
                        </label>
                      ))}

                      {!quizSubmitted ? (
                        <button
                          type="submit"
                          className="w-full py-2 bg-purple-650 hover:bg-purple-600 text-white font-bold rounded-lg transition text-[9px] uppercase cursor-pointer"
                        >
                          Submit Quiz Answer
                        </button>
                      ) : (
                        <div className="text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setQuizSubmitted(false);
                              setSelectedQuizAnswer(null);
                            }}
                            className="text-[9px] font-black text-purple-400 hover:underline cursor-pointer uppercase font-mono"
                          >
                            Reset Quiz Challenge
                          </button>
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: WEBINARS & EVENTS */}
          {activeTab === "events" && (
            <div className="space-y-6 animate-slide-in text-xs font-semibold">
              <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block font-mono">Live Webinars & Event Schedules</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map((evt) => (
                  <div key={evt.id} className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[8px] font-black uppercase font-mono text-zinc-500">
                        <span>Speaker: {evt.speaker}</span>
                      </div>
                      <h3 className="text-xs font-black text-white leading-normal">{evt.title}</h3>
                      <p className="text-[8.5px] text-zinc-550 font-bold font-mono">Schedule: {evt.date}</p>
                    </div>

                    <div className="pt-4 border-t border-zinc-900 flex justify-end">
                      <button
                        onClick={() => handleRegisterEvent(evt.id)}
                        className={cn(
                          "px-4 py-2 font-bold rounded-xl text-[9px] uppercase transition cursor-pointer border",
                          evt.registered
                            ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-450 font-black"
                            : "bg-purple-650 hover:bg-purple-600 text-white border-transparent"
                        )}
                      >
                        {evt.registered ? "Registered ✓" : "Register Seat"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: MY REPUTATION PROFILE */}
          {activeTab === "reputation" && (
            <div className="max-w-xl mx-auto p-5 border border-zinc-850 bg-[#111113]/40 rounded-2xl space-y-6 animate-slide-in text-xs font-semibold">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white">
                  <Award size={20} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white font-sans uppercase">My Reputation Score</h3>
                  <span className="text-xl font-black text-purple-400 font-mono mt-0.5 block">{reputationPoints.toLocaleString()} pts</span>
                </div>
              </div>

              {/* Badges unlocked grid */}
              <div className="space-y-3 border-t border-zinc-900 pt-4">
                <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block font-mono">Badges Unlocked Checklist</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[10px] font-mono text-center font-bold">
                  {[
                    { name: "Beginner Class", unlocked: true, color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" },
                    { name: "Top Contributor", unlocked: true, color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" },
                    { name: "Platform Expert", unlocked: false, color: "text-zinc-500 border-zinc-900 bg-zinc-950/40" },
                    { name: "Support Mentor", unlocked: false, color: "text-zinc-500 border-zinc-900 bg-zinc-950/40" },
                  ].map((badge, idx) => (
                    <div key={idx} className={cn("p-3 border rounded-xl space-y-1.5", badge.color)}>
                      <span className="block truncate font-sans uppercase text-[8px] font-black">{badge.name}</span>
                      <span>{badge.unlocked ? "Unlocked 🔓" : "Locked 🔒"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ADMIN MODERATION */}
          {activeTab === "moderation" && isAdmin && (
            <div className="space-y-6 animate-slide-in font-mono text-[10px]">
              <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block">Community Content Moderation queue</span>
              
              <div className="border border-zinc-850 bg-zinc-950/20 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-855 text-zinc-500 text-[8.5px] uppercase font-black bg-zinc-900/30">
                      <th className="p-4">Forum Discussion Topic</th>
                      <th className="p-4">Author Profile</th>
                      <th className="p-4 text-right">Moderator actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forums.map((frm) => (
                      <tr key={frm.id} className="border-b border-zinc-900 last:border-0 hover:bg-zinc-900/10">
                        <td className="p-4">
                          <span className="font-extrabold text-zinc-200 block text-xs font-sans">{frm.title}</span>
                          <span className="text-[8px] text-zinc-500 font-mono">Date: {frm.date} | Votes: {frm.votes}</span>
                        </td>
                        <td className="p-4 text-zinc-350 font-bold font-sans">{frm.author}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              const updated = forums.filter(f => f.id !== frm.id);
                              saveForums(updated);
                              addToast("Content removed from public community board.", "success");
                            }}
                            className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 hover:border-red-500/20 text-zinc-500 hover:text-red-400 rounded transition cursor-pointer font-bold text-[9px]"
                          >
                            Delete Post
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
