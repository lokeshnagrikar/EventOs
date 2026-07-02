"use client";

import React, { useState, useEffect } from "react";
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
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getAIConfig, saveAIConfig, getAIHistory, logAIActivity, AIProviderName, AIConfig, AIHistoryLog } from "@/lib/aiProvider";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

// Default Prompt Library Preset
const DEFAULT_PROMPTS = [
  { id: "p1", name: "Client Proposal Outline", module: "CRM", prompt: "Write a high-fidelity wedding plan for a client budget of ₹10L in Delhi." },
  { id: "p2", name: "Payment Reminder Notice", module: "Finance", prompt: "Draft a polite overdue invoice alert for 15-day outstanding balance." },
  { id: "p3", name: "Gallery Announcement Post", module: "Gallery", prompt: "Compose an announcement email for a published client album." }
];

export default function AICenterPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "prompts" | "history" | "settings">("dashboard");

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

  useEffect(() => {
    setMounted(true);
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
    addToastLocal("AI configurations updated successfully!", "success");
  };

  const addToastLocal = (msg: string, type: "success" | "info") => {
    // Basic browser notifier helper
    alert(msg);
  };

  const handleAddPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromptName.trim() || !newPromptText.trim()) return;
    const newP = {
      id: Math.random().toString(36).substring(7),
      name: newPromptName,
      module: newPromptModule,
      prompt: newPromptText
    };
    setPrompts(prev => [...prev, newP]);
    setNewPromptName("");
    setNewPromptText("");
  };

  const handleDeletePrompt = (id: string) => {
    setPrompts(prev => prev.filter(p => p.id !== id));
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Recharts usage telemetry metrics (Mock)
  const usageChartData = [
    { name: "Mon", Tokens: 4200, SavedMinutes: 65 },
    { name: "Tue", Tokens: 6800, SavedMinutes: 98 },
    { name: "Wed", Tokens: 8900, SavedMinutes: 120 },
    { name: "Thu", Tokens: 12500, SavedMinutes: 180 },
    { name: "Fri", Tokens: 14200, SavedMinutes: 210 }
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-100 flex flex-col relative overflow-hidden">
      
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Header Navbar */}
      <nav className="h-16 border-b border-zinc-800 bg-[#111113]/60 backdrop-blur-md px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="h-8 w-8 rounded-xl bg-zinc-850 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-zinc-800"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={15} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">AI Command Center</span>
            <span className="text-[10px] px-2 py-0.5 bg-zinc-850 border border-zinc-800 rounded text-zinc-400 font-bold uppercase font-mono tracking-wider">Einstein</span>
          </div>
        </div>
      </nav>

      {/* Content Container */}
      <div className="flex-1 flex overflow-hidden z-10">
        
        {/* Sidebar Nav */}
        <aside className="w-60 border-r border-zinc-850 bg-[#111113]/30 backdrop-blur-md p-3 flex flex-col gap-2 shrink-0">
          {[
            { id: "dashboard", label: "Overview Metrics", icon: Cpu },
            { id: "prompts", label: "Prompt Library", icon: FolderOpen },
            { id: "history", label: "AI History Logs", icon: History },
            { id: "settings", label: "AI Config Settings", icon: Sliders }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left border",
                activeTab === tab.id
                  ? "bg-purple-950/20 text-purple-400 border-purple-900/40 shadow-sm"
                  : "text-zinc-450 hover:text-zinc-200 hover:bg-zinc-850/40 border-transparent"
              )}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Content main */}
        <main className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              
              {/* TAB 1: OVERVIEW METRICS */}
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  <div className="border-b border-zinc-850 pb-4">
                    <h3 className="text-sm font-extrabold uppercase text-white flex items-center gap-2">
                      <Cpu size={16} className="text-purple-500" />
                      Usage & Productivity Telemetry
                    </h3>
                    <p className="text-[11px] text-zinc-450 mt-1">Real-time metrics profiling automation runs, tokens consumed and billing saved hours.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 border border-zinc-800 bg-[#111113]/40 rounded-2xl">
                      <span className="text-[8px] text-zinc-550 uppercase font-black tracking-widest block">Tokens Consumed</span>
                      <span className="text-xl font-bold font-mono block mt-1">46,420</span>
                    </div>
                    <div className="p-4 border border-zinc-800 bg-[#111113]/40 rounded-2xl">
                      <span className="text-[8px] text-zinc-550 uppercase font-black tracking-widest block">Saved Business Hours</span>
                      <span className="text-xl font-bold font-mono block mt-1 flex items-center gap-1">
                        <Clock size={14} className="text-purple-400" /> 18.5 hrs
                      </span>
                    </div>
                    <div className="p-4 border border-zinc-800 bg-[#111113]/40 rounded-2xl">
                      <span className="text-[8px] text-zinc-550 uppercase font-black tracking-widest block">Automation Runs</span>
                      <span className="text-xl font-bold font-mono block mt-1">112 tasks</span>
                    </div>
                    <div className="p-4 border border-zinc-800 bg-[#111113]/40 rounded-2xl">
                      <span className="text-[8px] text-zinc-550 uppercase font-black tracking-widest block">AI Cost Saved</span>
                      <span className="text-xl font-bold font-mono block mt-1 text-emerald-450">₹32,400</span>
                    </div>
                  </div>

                  {/* Token consumption chart */}
                  <div className="p-5 border border-zinc-850 bg-[#111113]/30 rounded-2xl space-y-4">
                    <span className="text-[10px] text-zinc-550 font-black uppercase tracking-wider block">Token Consumption Trends</span>
                    <div className="h-44 w-full text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={usageChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                          <XAxis dataKey="name" stroke="#71717a" />
                          <YAxis stroke="#71717a" />
                          <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a" }} />
                          <Area type="monotone" dataKey="Tokens" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#aiGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PROMPT LIBRARY */}
              {activeTab === "prompts" && (
                <div className="space-y-6">
                  <div className="border-b border-zinc-850 pb-4">
                    <h3 className="text-sm font-extrabold uppercase text-white flex items-center gap-2">
                      <FolderOpen size={16} className="text-purple-500" />
                      Workspace Prompt Library Library
                    </h3>
                    <p className="text-[11px] text-zinc-450 mt-1">Design and CRUD prompt presets used by event planners and sales coordinators.</p>
                  </div>

                  {/* Add Prompt Form */}
                  <form onSubmit={handleAddPrompt} className="p-5 border border-zinc-800 bg-[#111113]/30 rounded-2xl space-y-4 text-xs font-semibold">
                    <span className="text-[9px] text-zinc-550 uppercase tracking-widest block font-black">Register New Prompt Preset</span>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-550 uppercase font-black block">Preset Label Name</label>
                        <input type="text" required placeholder="E.g. Follow-up SMS template" value={newPromptName} onChange={(e) => setNewPromptName(e.target.value)} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-550 uppercase font-black block">Target Module</label>
                        <select value={newPromptModule} onChange={(e) => setNewPromptModule(e.target.value)} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-350">
                          <option value="CRM">CRM Leads</option>
                          <option value="Finance">Finance / Invoices</option>
                          <option value="Gallery">Gallery Tags</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-555 uppercase font-black block">Prompt Instructions Text</label>
                      <textarea required rows={3} placeholder="Enter instruction directives..." value={newPromptText} onChange={(e) => setNewPromptText(e.target.value)} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white leading-relaxed font-mono" />
                    </div>

                    <button type="submit" className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white rounded-xl shadow-md">
                      Register Preset
                    </button>
                  </form>

                  {/* Prompt cards */}
                  <div className="space-y-3">
                    <span className="text-xs font-black uppercase text-zinc-400 tracking-wider block">Prompt Presets Directory</span>
                    {prompts.map((p) => (
                      <div key={p.id} className="p-4 border border-zinc-850 bg-zinc-950/20 rounded-xl flex items-start justify-between gap-4 text-xs">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-zinc-200">{p.name}</span>
                            <span className="text-[8.5px] px-1.5 py-0.5 rounded-full border border-purple-500/20 bg-purple-550/5 text-purple-400 font-bold font-mono">{p.module}</span>
                          </div>
                          <p className="text-zinc-450 font-mono text-[10.5px] leading-relaxed">"{p.prompt}"</p>
                        </div>
                        <button onClick={() => handleDeletePrompt(p.id)} className="text-zinc-650 hover:text-red-500 shrink-0">
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
                  <div className="border-b border-zinc-850 pb-4">
                    <h3 className="text-sm font-extrabold uppercase text-white flex items-center gap-2">
                      <History size={16} className="text-purple-500" />
                      AI Telemetry Logs Registry
                    </h3>
                    <p className="text-[11px] text-zinc-450 mt-1">Audit trail tracing actor query templates, cost estimates, and model tokens.</p>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    {history.length === 0 ? (
                      <div className="text-center py-20 border border-dashed border-zinc-850 rounded-2xl bg-zinc-950/20 text-zinc-600">
                        No AI operations logged.
                      </div>
                    ) : (
                      history.map((log) => (
                        <div key={log.id} className="p-4 border border-zinc-800 bg-[#111113]/35 rounded-2xl space-y-3">
                          <div className="flex justify-between items-center text-[9px] text-zinc-550 font-mono font-bold">
                            <span>Module: {log.module} ({log.provider})</span>
                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                          
                          <div className="space-y-1.5">
                            <p className="text-zinc-450 font-mono text-[10.5px] leading-normal font-semibold">Prompt: "{log.prompt}"</p>
                            <div className="p-3 bg-zinc-950/60 border border-zinc-850 rounded-xl font-mono text-[10px] text-zinc-300 leading-relaxed whitespace-pre-wrap">
                              {log.response}
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-2.5 border-t border-zinc-850/40 text-[9px] font-mono text-zinc-550">
                            <span>Cost: ${log.costEstimate.toFixed(5)} &bull; Tokens: {log.tokensConsumed}</span>
                            <button
                              onClick={() => handleCopyText(log.response, log.id)}
                              className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
                            >
                              {copiedId === log.id ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
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
                  <div className="border-b border-zinc-850 pb-4">
                    <h3 className="text-sm font-extrabold uppercase text-white flex items-center gap-2">
                      <Sliders size={16} className="text-purple-500" />
                      AI Provider Configuration Settings
                    </h3>
                    <p className="text-[11px] text-zinc-450 mt-1">Configure active models, key authorizations, and system instructions.</p>
                  </div>

                  <form onSubmit={handleSaveConfig} className="p-5 border border-zinc-800 bg-[#111113]/30 rounded-2xl space-y-4 text-xs font-semibold">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-550 uppercase font-black">Active AI Provider</label>
                      <select
                        value={provider}
                        onChange={(e) => setProvider(e.target.value as any)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 font-bold"
                      >
                        <option value="OPENAI">OpenAI GPT-4o</option>
                        <option value="CLAUDE">Anthropic Claude 3.5 Sonnet</option>
                        <option value="GEMINI">Google Gemini Pro</option>
                        <option value="AZURE">Azure OpenAI Instance</option>
                        <option value="OLLAMA">Ollama (Self-Hosted Llama3)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-550 uppercase font-black flex items-center gap-1">
                        <Key size={11} className="text-purple-400" /> Authorized API Access Key
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Enter sk-... key credentials"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-555 uppercase font-black">Temperature ({temp})</label>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.1"
                          value={temp}
                          onChange={(e) => setTemp(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-555 uppercase font-black">Max Generation Tokens</label>
                        <input
                          type="number"
                          value={maxTokens}
                          onChange={(e) => setMaxTokens(parseInt(e.target.value) || 1024)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-555 uppercase font-black">Default Custom System Instructions</label>
                      <textarea
                        rows={4}
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white leading-relaxed"
                      />
                    </div>

                    <div className="flex justify-end pt-3 border-t border-zinc-850">
                      <button type="submit" className="px-5 py-2.5 bg-purple-650 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-1.5">
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
