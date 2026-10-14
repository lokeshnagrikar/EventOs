"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Bot,
  Brain,
  Sliders,
  History,
  FileText,
  Trash2,
  Copy,
  Check,
  Cpu,
  Zap,
  TrendingUp,
  Clock,
  Save,
  Key,
  FolderOpen,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Play,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getAIConfig, saveAIConfig, getAIHistory, logAIActivity, generateAIResponse, AIProviderName, AIConfig, AIHistoryLog } from "@/lib/aiProvider";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useToastStore } from "@/lib/toastStore";

// Default Prompt Library Preset
const DEFAULT_PROMPTS = [
  { id: "p1", name: "Client Proposal Outline", module: "CRM", prompt: "Write a high-fidelity wedding plan for a client budget of ₹10L in Delhi." },
  { id: "p2", name: "Payment Reminder Notice", module: "Finance", prompt: "Draft a polite overdue invoice alert for 15-day outstanding balance." },
  { id: "p3", name: "Gallery Announcement Post", module: "Gallery", prompt: "Compose an announcement email for a published client album." }
];

export default function AICenterPage() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "playground" | "prompts" | "history" | "settings">("dashboard");
  const { completeStep } = useOnboardingStore();

  // Config State
  const [provider, setProvider] = useState<AIProviderName>("OPENAI");
  const [apiKey, setApiKey] = useState("");
  const [temp, setTemp] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [systemPrompt, setSystemPrompt] = useState("");

  // Prompt Library state
  const [prompts, setPrompts] = useState(DEFAULT_PROMPTS);
  const [newPromptName, setNewPromptName] = useState("");
  const [newPromptModule, setNewPromptModule] = useState("CRM");
  const [newPromptText, setNewPromptText] = useState("");

  // History state
  const [history, setHistory] = useState<AIHistoryLog[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Playground state
  const [playgroundModule, setPlaygroundModule] = useState("CRM AI");
  const [playgroundPrompt, setPlaygroundPrompt] = useState("");
  const [playgroundOutput, setPlaygroundOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setMounted(true);
    completeStep("explore_ai");
    const cfg = getAIConfig();
    setProvider(cfg.provider);
    setApiKey(cfg.apiKey);
    setTemp(cfg.temperature);
    setMaxTokens(cfg.maxTokens);
    setSystemPrompt(cfg.systemPrompt);

    setHistory(getAIHistory());
  }, []);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveAIConfig({
      provider,
      apiKey,
      temperature: temp,
      maxTokens,
      systemPrompt
    });
    addToast("AI configurations updated successfully!", "success");
  };

  const handleAddPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromptName.trim() || !newPromptText.trim()) return;

    const newP = {
      id: "p_" + Date.now(),
      name: newPromptName.trim(),
      module: newPromptModule,
      prompt: newPromptText.trim()
    };
    setPrompts([newP, ...prompts]);
    setNewPromptName("");
    setNewPromptText("");
    addToast("Prompt template successfully registered to library!", "success");
  };

  const handleDeletePrompt = (id: string) => {
    setPrompts(prompts.filter((p) => p.id !== id));
    addToast("Prompt template deleted.", "info");
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast("Prompt text copied to clipboard!", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRunPlayground = async () => {
    if (!playgroundPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = await generateAIResponse(playgroundModule, playgroundPrompt);
      setPlaygroundOutput(res);
      setHistory(getAIHistory());
      addToast("AI completion generated and logged to history!", "success");
    } catch (e: any) {
      addToast("Generation failed: " + (e?.message || "Unknown error"), "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Dynamic Telemetry Metrics (Derived purely from real activity logs)
  const totalTokens = useMemo(() => history.reduce((sum, h) => sum + (h.tokensConsumed || 0), 0), [history]);
  const totalRuns = useMemo(() => history.length, [history]);
  const savedHours = useMemo(() => (totalRuns * 0.25).toFixed(1), [totalRuns]);
  const totalCostSavedInr = useMemo(() => Math.round(totalTokens * 0.75), [totalTokens]);

  // Dynamic Chart Data grouped from real activity logs
  const usageChartData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const map: Record<string, { name: string; Tokens: number; SavedMinutes: number }> = {};
    days.forEach((d) => {
      map[d] = { name: d, Tokens: 0, SavedMinutes: 0 };
    });

    history.forEach((h) => {
      try {
        const d = new Date(h.timestamp);
        const dayName = days[d.getDay()];
        if (map[dayName]) {
          map[dayName].Tokens += h.tokensConsumed || 0;
          map[dayName].SavedMinutes += 15;
        }
      } catch {}
    });

    return Object.values(map);
  }, [history]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#08080a] text-slate-900 dark:text-zinc-100 flex flex-col relative overflow-hidden transition-colors">
      
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Header Navbar */}
      <nav className="h-14 sm:h-16 border-b border-slate-200/90 dark:border-zinc-800 bg-white/80 dark:bg-[#111113]/60 backdrop-blur-md px-3.5 sm:px-6 flex items-center justify-between z-20 shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            onClick={() => router.push("/dashboard")}
            className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200 dark:border-zinc-800 shrink-0 cursor-pointer"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={15} />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-extrabold text-xs sm:text-sm tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
              AI Command Center
            </span>
            <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 bg-purple-50 dark:bg-zinc-850 border border-purple-200 dark:border-zinc-800 rounded text-purple-700 dark:text-zinc-400 font-bold uppercase font-mono tracking-wider shrink-0">
              Einstein Engine
            </span>
          </div>
        </div>
      </nav>

      {/* Content Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden z-10 min-h-0">
        
        {/* Sidebar Nav: Horizontal scroll tabs on mobile, vertical sidebar on desktop */}
        <aside className="w-full md:w-60 border-b md:border-b-0 md:border-r border-slate-200/90 dark:border-zinc-850 bg-white/70 dark:bg-[#111113]/60 md:bg-white/40 md:dark:bg-[#111113]/30 backdrop-blur-md p-2 sm:p-3 flex flex-row md:flex-col gap-1.5 sm:gap-2 overflow-x-auto md:overflow-y-auto shrink-0 scrollbar-none">
          {[
            { id: "dashboard", label: "Overview Metrics", icon: Cpu },
            { id: "playground", label: "AI Playground", icon: Sparkles },
            { id: "prompts", label: "Prompt Library", icon: FolderOpen },
            { id: "history", label: "AI History Logs", icon: History },
            { id: "settings", label: "AI Config Settings", icon: Sliders }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "whitespace-nowrap flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all text-left border shrink-0 cursor-pointer",
                activeTab === tab.id
                  ? "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50 shadow-sm"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-850/40 border-transparent"
              )}
            >
              <tab.icon size={13} className="shrink-0" />
              <span>{tab.label}</span>
            </button>
          ))}
        </aside>

        {/* Content main */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 md:p-8 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="max-w-4xl mx-auto space-y-6 sm:space-y-8"
            >
              
              {/* TAB 1: OVERVIEW METRICS */}
              {activeTab === "dashboard" && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="border-b border-slate-200/90 dark:border-zinc-850 pb-3 sm:pb-4">
                    <h3 className="text-xs sm:text-sm font-extrabold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                      <Cpu size={15} className="text-purple-600 dark:text-purple-500 shrink-0" />
                      <span>Usage & Productivity Telemetry</span>
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 mt-1">Real-time metrics profiling automation runs, tokens consumed and billing saved hours.</p>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                    <div className="p-3 sm:p-4 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111113]/40 rounded-xl sm:rounded-2xl shadow-sm">
                      <span className="text-[8px] sm:text-[9px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-widest block truncate">Tokens Consumed</span>
                      <span className="text-base sm:text-xl font-bold font-mono block mt-1 truncate text-slate-900 dark:text-white">{totalTokens.toLocaleString()}</span>
                    </div>
                    <div className="p-3 sm:p-4 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111113]/40 rounded-xl sm:rounded-2xl shadow-sm">
                      <span className="text-[8px] sm:text-[9px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-widest block truncate">Saved Business Hours</span>
                      <span className="text-base sm:text-xl font-bold font-mono block mt-1 flex items-center gap-1 truncate text-purple-600 dark:text-purple-400">
                        <Clock size={13} className="shrink-0" /> {savedHours} hrs
                      </span>
                    </div>
                    <div className="p-3 sm:p-4 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111113]/40 rounded-xl sm:rounded-2xl shadow-sm">
                      <span className="text-[8px] sm:text-[9px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-widest block truncate">Automation Runs</span>
                      <span className="text-base sm:text-xl font-bold font-mono block mt-1 truncate text-slate-900 dark:text-white">{totalRuns} tasks</span>
                    </div>
                    <div className="p-3 sm:p-4 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111113]/40 rounded-xl sm:rounded-2xl shadow-sm">
                      <span className="text-[8px] sm:text-[9px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-widest block truncate">AI Cost Saved</span>
                      <span className="text-base sm:text-xl font-bold font-mono block mt-1 text-emerald-600 dark:text-emerald-450 truncate">₹{totalCostSavedInr.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Token consumption chart */}
                  <div className="p-3.5 sm:p-5 border border-slate-200/90 dark:border-zinc-850 bg-white dark:bg-[#111113]/30 rounded-xl sm:rounded-2xl space-y-3 sm:space-y-4 min-w-0 shadow-sm">
                    <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-zinc-400 font-black uppercase tracking-wider block">Token Consumption Trends</span>
                    {totalTokens === 0 ? (
                      <div className="h-44 w-full flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-zinc-850 rounded-xl text-slate-500 dark:text-zinc-550 text-xs gap-2">
                        <Cpu size={24} className="opacity-40 text-purple-600 dark:text-purple-400" />
                        <span>No tokens consumed yet. Run a prompt in the AI Playground to see activity trends!</span>
                      </div>
                    ) : (
                      <div className="h-44 w-full text-xs">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={usageChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <defs>
                              <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-zinc-800" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip contentStyle={{ backgroundColor: "#1e1b4b", borderColor: "#4338ca", borderRadius: "12px", color: "#fff" }} />
                            <Area type="monotone" dataKey="Tokens" stroke="#9333ea" strokeWidth={2} fillOpacity={1} fill="url(#aiGrad)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: AI PLAYGROUND */}
              {activeTab === "playground" && (
                <div className="space-y-6">
                  <div className="border-b border-slate-200/90 dark:border-zinc-850 pb-4">
                    <h3 className="text-sm font-extrabold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles size={16} className="text-purple-600 dark:text-purple-500" />
                      Interactive AI Playground
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-450 mt-1">Execute prompts live with your configured AI engine ({provider}) and generate real outputs.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-black text-slate-500 dark:text-zinc-400 block">Target Module</label>
                        <select
                          value={playgroundModule}
                          onChange={(e) => setPlaygroundModule(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white font-semibold shadow-sm focus:outline-none focus:border-purple-600"
                        >
                          <option value="CRM AI">CRM Lead Score</option>
                          <option value="Quote AI">Quote Recommendations</option>
                          <option value="Event Timeline">Event Timeline</option>
                          <option value="Finance Forecast">Finance Forecast</option>
                          <option value="Gallery Tagging">Gallery Tagging</option>
                          <option value="General Assistant">General Assistant</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[9px] uppercase font-black text-slate-500 dark:text-zinc-400 block">Quick Preset Insertion</label>
                        <div className="flex flex-wrap gap-1.5">
                          {prompts.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setPlaygroundPrompt(p.prompt)}
                              className="px-2 py-1 bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-lg text-[10px] text-slate-700 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-white transition-colors truncate max-w-[200px] shadow-sm cursor-pointer"
                              title={p.prompt}
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase font-black text-slate-500 dark:text-zinc-400 block">Enter Prompt Instructions</label>
                      <textarea
                        rows={4}
                        placeholder="Type your prompt instructions or select a preset above..."
                        value={playgroundPrompt}
                        onChange={(e) => setPlaygroundPrompt(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs text-slate-900 dark:text-white leading-relaxed font-mono focus:border-purple-600 focus:outline-none transition-colors shadow-sm"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={isGenerating || !playgroundPrompt.trim()}
                      onClick={handleRunPlayground}
                      className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/15 disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          Generating Output...
                        </>
                      ) : (
                        <>
                          <Play size={13} fill="currentColor" />
                          Run AI Generation
                        </>
                      )}
                    </button>

                    {playgroundOutput && (
                      <div className="p-5 border border-purple-200 dark:border-purple-900/30 bg-purple-50/50 dark:bg-purple-950/10 rounded-2xl space-y-3 shadow-sm">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                            <Sparkles size={13} /> Generated Output
                          </span>
                          <button
                            onClick={() => handleCopyText(playgroundOutput, "playground-out")}
                            className="text-[10px] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId === "playground-out" ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                            Copy
                          </button>
                        </div>
                        <div className="p-4 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl font-mono text-xs text-slate-900 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed shadow-sm">
                          {playgroundOutput}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: PROMPT LIBRARY */}
              {activeTab === "prompts" && (
                <div className="space-y-6">
                  <div className="border-b border-slate-200/90 dark:border-zinc-850 pb-4">
                    <h3 className="text-sm font-extrabold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                      <FolderOpen size={16} className="text-purple-600 dark:text-purple-500" />
                      Workspace Prompt Library
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-450 mt-1">Design and CRUD prompt presets used by event planners and sales coordinators.</p>
                  </div>

                  {/* Add Prompt Form */}
                  <form onSubmit={handleAddPrompt} className="p-5 border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111113]/30 rounded-2xl space-y-4 text-xs font-semibold shadow-sm">
                    <span className="text-[9px] text-slate-500 dark:text-zinc-400 uppercase tracking-widest block font-black">Register New Prompt Preset</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-slate-500 dark:text-zinc-400 uppercase font-black block">Preset Label Name</label>
                        <input type="text" required placeholder="E.g. Follow-up SMS template" value={newPromptName} onChange={(e) => setNewPromptName(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 rounded-xl text-slate-900 dark:text-white text-xs shadow-sm focus:outline-none focus:border-purple-600 font-medium" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-slate-500 dark:text-zinc-400 uppercase font-black block">Target Module</label>
                        <select value={newPromptModule} onChange={(e) => setNewPromptModule(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 rounded-xl text-slate-800 dark:text-zinc-300 text-xs shadow-sm focus:outline-none focus:border-purple-600 font-bold">
                          <option value="CRM">CRM Leads</option>
                          <option value="Finance">Finance / Invoices</option>
                          <option value="Gallery">Gallery Tags</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-500 dark:text-zinc-400 uppercase font-black block">Prompt Instructions Text</label>
                      <textarea required rows={3} placeholder="Enter instruction directives..." value={newPromptText} onChange={(e) => setNewPromptText(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white leading-relaxed font-mono shadow-sm focus:outline-none focus:border-purple-600" />
                    </div>

                    <button type="submit" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl shadow-md font-bold cursor-pointer transition active:scale-95">
                      Register Preset
                    </button>
                  </form>

                  {/* Prompt cards */}
                  <div className="space-y-3">
                    <span className="text-xs font-black uppercase text-slate-500 dark:text-zinc-400 tracking-wider block">Prompt Presets Directory</span>
                    {prompts.map((p) => (
                      <div key={p.id} className="p-4 border border-slate-200/90 dark:border-zinc-850 bg-white dark:bg-zinc-950/20 rounded-xl flex items-start justify-between gap-4 text-xs shadow-sm">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 dark:text-zinc-200">{p.name}</span>
                            <span className="text-[8.5px] px-1.5 py-0.5 rounded-full border border-purple-500/20 bg-purple-50 dark:bg-purple-550/5 text-purple-700 dark:text-purple-400 font-bold font-mono">{p.module}</span>
                          </div>
                          <p className="text-slate-600 dark:text-zinc-400 font-mono text-[10.5px] leading-relaxed">"{p.prompt}"</p>
                        </div>
                        <button onClick={() => handleDeletePrompt(p.id)} className="text-slate-400 hover:text-red-500 shrink-0 cursor-pointer p-1 transition">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: AI HISTORY LOGS */}
              {activeTab === "history" && (
                <div className="space-y-6">
                  <div className="border-b border-slate-200/90 dark:border-zinc-850 pb-4">
                    <h3 className="text-sm font-extrabold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                      <History size={16} className="text-purple-600 dark:text-purple-500" />
                      AI Telemetry Logs Registry
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-450 mt-1">Audit trail tracing actor query templates, cost estimates, and model tokens.</p>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    {history.length === 0 ? (
                      <div className="text-center py-20 border border-dashed border-slate-200 dark:border-zinc-850 rounded-2xl bg-slate-50/50 dark:bg-zinc-950/20 text-slate-500 dark:text-zinc-500">
                        No AI operations logged.
                      </div>
                    ) : (
                      history.map((log) => (
                        <div key={log.id} className="p-4 border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111113]/35 rounded-2xl space-y-3 shadow-sm">
                          <div className="flex justify-between items-center text-[9px] text-slate-500 dark:text-zinc-400 font-mono font-bold">
                            <span>Module: {log.module} ({log.provider})</span>
                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                          
                          <div className="space-y-1.5">
                            <p className="text-slate-700 dark:text-zinc-300 font-mono text-[10.5px] leading-normal font-semibold">Prompt: "{log.prompt}"</p>
                            <div className="p-3 bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-850 rounded-xl font-mono text-[10px] text-slate-800 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                              {log.response}
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-2.5 border-t border-slate-200/90 dark:border-zinc-850/40 text-[9px] font-mono text-slate-500 dark:text-zinc-400">
                            <span>Cost: ${log.costEstimate.toFixed(5)} &bull; Tokens: {log.tokensConsumed}</span>
                            <button
                              onClick={() => handleCopyText(log.response, log.id)}
                              className="flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors cursor-pointer font-bold"
                            >
                              {copiedId === log.id ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                              Copy output
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: CONFIG SETTINGS */}
              {activeTab === "settings" && (
                <div className="space-y-6">
                  <div className="border-b border-slate-200/90 dark:border-zinc-850 pb-4">
                    <h3 className="text-sm font-extrabold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                      <Sliders size={16} className="text-purple-600 dark:text-purple-500" />
                      AI Provider Configuration Settings
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-450 mt-1">Configure active models, key authorizations, and system instructions.</p>
                  </div>

                  <form onSubmit={handleSaveConfig} className="p-5 border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111113]/30 rounded-2xl space-y-4 text-xs font-semibold shadow-sm">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-500 dark:text-zinc-400 uppercase font-black">Active AI Provider</label>
                      <select
                        value={provider}
                        onChange={(e) => setProvider(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-zinc-200 font-bold shadow-sm focus:outline-none focus:border-purple-600"
                      >
                        <option value="OPENAI">OpenAI GPT-4o</option>
                        <option value="CLAUDE">Anthropic Claude 3.5 Sonnet</option>
                        <option value="GEMINI">Google Gemini Pro</option>
                        <option value="AZURE">Azure OpenAI Instance</option>
                        <option value="OLLAMA">Ollama (Self-Hosted Llama3)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-500 dark:text-zinc-400 uppercase font-black flex items-center gap-1">
                        <Key size={11} className="text-purple-600 dark:text-purple-400" /> Authorized API Access Key
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Enter sk-... key credentials"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-600 shadow-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-slate-500 dark:text-zinc-400 uppercase font-black">Temperature ({temp})</label>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.1"
                          value={temp}
                          onChange={(e) => setTemp(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 dark:bg-zinc-850 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-slate-500 dark:text-zinc-400 uppercase font-black">Max Generation Tokens</label>
                        <input
                          type="number"
                          value={maxTokens}
                          onChange={(e) => setMaxTokens(parseInt(e.target.value) || 1024)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 rounded-xl text-slate-900 dark:text-white font-mono text-xs shadow-sm focus:outline-none focus:border-purple-600"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-500 dark:text-zinc-400 uppercase font-black">Default Custom System Instructions</label>
                      <textarea
                        rows={4}
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white leading-relaxed font-medium shadow-sm focus:outline-none focus:border-purple-600"
                      />
                    </div>

                    <div className="flex justify-end pt-3 border-t border-slate-200/90 dark:border-zinc-850">
                      <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold transition-all shadow-md shadow-purple-600/15 flex items-center gap-1.5 cursor-pointer active:scale-95">
                        <Save size={13} /> Save AI Settings
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>

      </div>

    </div>
  );
}
