"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  ArrowRight,
  Loader2,
  Copy,
  Check,
  Zap,
  Command,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { generateAIResponse, getAIConfig } from "@/lib/aiProvider";
import { cn } from "@/lib/utils";

const CHATBOT_LOTTIE_URL = "https://lottie.host/81c78ae8-59f5-4e19-bc6c-b7c5ba867ffd/Id8PQ7Y2HD.lottie";

const DotLottieReact = dynamic(
  () => import("@lottiefiles/dotlottie-react").then((mod) => mod.DotLottieReact),
  {
    ssr: false,
    loading: () => (
      <img
        src="/chatbot-animated.gif"
        alt="EventOS AI"
        className="w-full h-full object-contain pointer-events-none lottie-theme-bot"
      />
    ),
  }
);

function parseBoldText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded-md border border-purple-200/80 dark:border-purple-800/40 font-sans">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function renderFormattedText(text: string) {
  if (!text) return null;
  const paragraphs = text.split("\n\n");
  return paragraphs.map((para, pIdx) => {
    const lines = para.split("\n");
    if (lines.length > 1 || lines[0].trim().startsWith("•") || lines[0].trim().startsWith("- ")) {
      return (
        <div key={pIdx} className="space-y-2 my-2">
          {lines.map((line, lIdx) => {
            const trimmed = line.trim();
            const isBullet = trimmed.startsWith("•") || trimmed.startsWith("- ");
            const content = isBullet ? trimmed.replace(/^[•\-]\s*/, "") : line;
            return (
              <div key={lIdx} className={isBullet ? "flex items-start gap-2.5 pl-1" : ""}>
                {isBullet && (
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-2 shrink-0 shadow-[0_0_6px_rgba(168,85,247,0.5)]" />
                )}
                <span className="leading-relaxed text-slate-800 dark:text-slate-100 text-[13px]">{parseBoldText(content)}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return (
      <p key={pIdx} className="mb-2 last:mb-0 leading-relaxed text-slate-800 dark:text-slate-100 text-[13px]">
        {parseBoldText(para)}
      </p>
    );
  });
}

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
  suggestions?: { label: string; action: () => void }[];
  type?: "text" | "timeline" | "checklist" | "quote" | "email" | "search-result";
  data?: any;
}

export default function AiAssistant() {
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Derive Context based on Current Pathname
  const pageContext = useMemo(() => {
    if (!pathname) return { name: "Dashboard", module: "Overview" };
    const path = pathname.toLowerCase();
    if (path.startsWith("/crm")) return { name: "CRM / Leads", module: "CRM AI" };
    if (path.startsWith("/events") || path.startsWith("/bookings")) return { name: "Events Planning", module: "Event AI" };
    if (path.startsWith("/quotes")) return { name: "Quotes & Proposals", module: "Quote AI" };
    if (path.startsWith("/gallery")) return { name: "Media Galleries", module: "Gallery AI" };
    if (path.startsWith("/finance") || path.startsWith("/invoices") || path.startsWith("/payments")) return { name: "Finance Hub", module: "Finance AI" };
    if (path.startsWith("/portal")) return { name: "Client Portal", module: "Client AI" };
    return { name: "Workspace", module: "Overview" };
  }, [pathname]);

  const aiConfig = useMemo(() => getAIConfig(), []);

  // Welcome message when context changes
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        sender: "ai",
        text: `Hello! I am your EventOS AI Co-pilot, powered by **${aiConfig.provider}**.\n\nI see you are in **${pageContext.name}**. How can I assist you with your operations today?`,
        timestamp: new Date(),
        suggestions: getContextSuggestions()
      }
    ]);
  }, [pageContext, isOpen]);

  const getContextSuggestions = (): { label: string; action: () => void }[] => {
    if (pageContext.module === "CRM AI") {
      return [
        { label: "Analyze lead quality score", action: () => handleSendText("Analyze lead quality score") },
        { label: "Draft follow-up email", action: () => handleSendText("Draft a lead follow-up email") }
      ];
    }
    if (pageContext.module === "Event AI") {
      return [
        { label: "Generate day-of schedule", action: () => handleSendText("Generate wedding timeline checklist") },
        { label: "Check weather risk", action: () => handleSendText("Predict event risk & weather suggestions") }
      ];
    }
    if (pageContext.module === "Quote AI") {
      return [
        { label: "Suggest upselling package", action: () => handleSendText("Suggest upselling package for corporate quotes") }
      ];
    }
    if (pageContext.module === "Finance AI") {
      return [
        { label: "Forecast cash flow", action: () => handleSendText("Forecast revenue and payment delay risk") }
      ];
    }
    return [
      { label: "Search unpaid invoices", action: () => handleSendText("Show unpaid overdue invoices") },
      { label: "Show weddings next month", action: () => handleSendText("Show me weddings next month") }
    ];
  };

  // Keyboard toggle (Ctrl + Space / Cmd + Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === "Space") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Scroll to bottom
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: "smooth"
        });
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [messages, isTyping, isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.closest(".ai-trigger-btn")) {
          setIsOpen(false);
        }
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendText = async (text: string) => {
    if (!text.trim()) return;

    const userMsgId = Math.random().toString(36).substring(7);
    const newMsg: Message = {
      id: userMsgId,
      sender: "user",
      text,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const query = text.toLowerCase();
      let aiResponse = "";
      let type: Message["type"] = "text";
      let data: any = null;
      let suggestions: { label: string; action: () => void }[] = [
        { label: "Show unpaid invoices", action: () => { handleSendText("Show unpaid overdue invoices"); } },
        { label: "Generate timeline checklist", action: () => { handleSendText("Generate wedding checklist"); } }
      ];

      if (query.includes("help") || query.includes("how to") || query.includes("docs") || query.includes("support")) {
        aiResponse = "Here is what you can do directly from the EventOS portal:\n\n" +
                     "• **Invoices & Payments**: Set up Stripe in Settings, create milestones, and dispatch invoices.\n" +
                     "• **Invite Members**: Navigate to Settings -> Workspace and invite teammates.\n" +
                     "• **Proofing Galleries**: Enable password and download locks via Galleries.\n\n" +
                     "Need human assistance? You can submit a ticket to our support team.";
        suggestions = [
          { label: "Open Help Center", action: () => { router.push("/help"); setIsOpen(false); } },
          { label: "Submit Support Ticket", action: () => { router.push("/help/support"); setIsOpen(false); } }
        ];
      } else {
        aiResponse = await generateAIResponse(pageContext.module, text);

        if (query.includes("email") || query.includes("draft")) {
          type = "email";
          data = {
            subject: "Clearance reminder: outstanding balance",
            body: aiResponse
          };
        } else if (query.includes("timeline") || query.includes("schedule")) {
          type = "timeline";
          data = {
            items: [
              { time: "09:00 AM", event: "Vendor Setup Ingress", note: "Backdrop setup" },
              { time: "04:30 PM", event: "Welcome Mocktails", note: "Guests reception" },
              { time: "07:00 PM", event: "Ballroom Banquet dinner", note: "Curfew checklist" }
            ]
          };
        } else if (query.includes("unpaid") || query.includes("weddings next month")) {
          type = "search-result";
          data = {
            results: [
              { id: "1", title: "Meera & Rohan Wedding Gala", date: "July 12, 2026", budget: "₹12,50,000", status: "CONFIRMED", link: "/events" },
              { id: "2", title: "Siddharth & Ananya Destination Wedding", date: "July 22, 2026", budget: "₹28,00,000", status: "CONFIRMED", link: "/events" }
            ]
          };
        }
      }

      const aiMsg: Message = {
        id: Math.random().toString(36).substring(7),
        sender: "ai",
        text: aiResponse,
        timestamp: new Date(),
        type,
        data,
        suggestions
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Animated Lottie AI Mascot (Without Circle Border) */}
      <motion.button
        whileHover={{ scale: 1.14, y: -4 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className="ai-trigger-btn fixed bottom-20 sm:bottom-6 right-4 sm:right-6 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center z-[9999] group cursor-pointer focus:outline-none select-none drop-shadow-[0_12px_28px_rgba(147,51,234,0.35)]"
        title="EventOS AI Assistant (Cmd + Space)"
      >
        {/* Subtle organic purple ambient pulse beneath the mascot */}
        <div className="absolute inset-2 bg-gradient-to-tr from-purple-600/35 via-indigo-500/25 to-pink-500/25 rounded-full blur-xl opacity-60 group-hover:opacity-100 transition-opacity -z-10" />

        <div className="w-full h-full flex items-center justify-center p-0.5 lottie-theme-bot">
          <DotLottieReact
            src={CHATBOT_LOTTIE_URL}
            loop
            autoplay
            className="w-full h-full object-contain pointer-events-none filter drop-shadow-md"
          />
        </div>
      </motion.button>

      {/* Ultra Glassmorphic Drawer Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            ref={containerRef}
            className="fixed bottom-36 sm:bottom-24 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[430px] h-[540px] sm:h-[600px] max-h-[calc(100vh-160px)] bg-white/95 dark:bg-[#0B0F19]/95 border border-slate-200/90 dark:border-slate-800/80 rounded-[28px] shadow-[0_25px_70px_rgba(15,23,42,0.18),0_0_0_1px_rgba(255,255,255,0.8)] backdrop-blur-[40px] backdrop-saturate-[2.0] flex flex-col overflow-hidden z-[9999] font-sans antialiased"
          >
            {/* Top Accent Gradient Line */}
            <div className="h-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 w-full shrink-0" />

            {/* Ambient Inner Glass Light Blobs */}
            <div className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full bg-purple-500/10 blur-3xl -z-10" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl -z-10" />

            {/* Glassmorphic Header Bar */}
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 flex items-center justify-center shrink-0 lottie-theme-bot">
                  <DotLottieReact
                    src={CHATBOT_LOTTIE_URL}
                    loop
                    autoplay
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white tracking-tight">EventOS Copilot</h3>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 text-[9px] font-bold text-purple-700 dark:text-purple-300 font-mono">
                      {aiConfig.provider}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                    {pageContext.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 text-[9.5px] text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md font-mono">
                  <Command size={9} /> Space
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs z-10 scrollbar-thin">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3 max-w-[88%]",
                    msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  {/* Avatar Icon */}
                  <div
                    className={cn(
                      "h-7 w-7 flex items-center justify-center shrink-0 mt-0.5",
                      msg.sender === "user"
                        ? "rounded-full bg-white/15 border border-white/25 text-white"
                        : "lottie-theme-bot"
                    )}
                  >
                    {msg.sender === "user" ? (
                      <User size={12} />
                    ) : (
                      <DotLottieReact
                        src={CHATBOT_LOTTIE_URL}
                        loop
                        autoplay
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>

                  <div className="space-y-2 flex-1 min-w-0">
                    {/* Glassmorphic Message Card Bubble */}
                    <div
                      className={cn(
                        "p-4 text-[13px] leading-relaxed relative overflow-hidden font-sans transition-all",
                        msg.sender === "user"
                          ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white rounded-[20px] rounded-tr-sm shadow-md shadow-purple-500/20"
                          : "bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 rounded-[20px] rounded-tl-sm shadow-xs"
                      )}
                    >
                      {renderFormattedText(msg.text)}

                      {/* Search Results Widget */}
                      {msg.type === "search-result" && msg.data?.results && (
                        <div className="mt-3 space-y-2">
                          {msg.data.results.map((res: any) => (
                            <div
                              key={res.id}
                              onClick={() => {
                                router.push(res.link);
                                setIsOpen(false);
                              }}
                              className="p-3 border border-slate-200 hover:border-purple-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900/60 cursor-pointer flex items-center justify-between transition-all shadow-xs"
                            >
                              <div>
                                <span className="font-semibold text-slate-900 dark:text-white block text-[12px]">{res.title}</span>
                                <span className="text-[10px] text-slate-500 block mt-0.5">{res.date}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block">{res.budget}</span>
                                <span className="text-[9px] font-medium uppercase px-2 py-0.5 rounded-full border bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 mt-1 inline-block">
                                  {res.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Timeline Widget */}
                      {msg.type === "timeline" && msg.data?.items && (
                        <div className="mt-3 space-y-2.5 border-l-2 border-purple-300 dark:border-purple-800 pl-4 py-1 text-[11.5px]">
                          {msg.data.items.map((item: any, idx: number) => (
                            <div key={idx} className="relative">
                              <span className="absolute -left-[22px] top-1.5 h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
                              <span className="font-semibold text-purple-700 dark:text-purple-300 block">{item.time}</span>
                              <span className="font-medium text-slate-800 dark:text-white block mt-0.5">{item.event}</span>
                              <span className="text-[10px] text-slate-500 block">{item.note}</span>
                            </div>
                          ))}
                          <button
                            onClick={() => copyToClipboard(msg.data.items.map((i: any) => `[${i.time}] ${i.event} - ${i.note}`).join("\n"), msg.id)}
                            className="mt-2.5 flex items-center gap-1.5 text-[10px] font-medium text-purple-600 dark:text-purple-300 hover:text-purple-800 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 px-3 py-1.5 rounded-full border border-purple-200 dark:border-purple-800/50 cursor-pointer transition"
                          >
                            {copiedId === msg.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                            {copiedId === msg.id ? "Copied Timeline" : "Copy Timeline"}
                          </button>
                        </div>
                      )}
                    </div>

                    <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium block pl-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>

                    {/* Glass Capsule Suggestion Chips */}
                    {msg.sender === "ai" && msg.suggestions && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.suggestions.map((sug, i) => (
                          <button
                            key={i}
                            onClick={sug.action}
                            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200/90 dark:border-slate-700 hover:border-purple-300 text-slate-700 dark:text-slate-200 hover:text-purple-700 dark:hover:text-purple-300 transition-all cursor-pointer text-[11px] font-semibold flex items-center gap-2 shadow-xs group"
                          >
                            <Sparkles size={11} className="text-purple-500 group-hover:scale-110 transition-transform" />
                            {sug.label}
                            <ChevronRight size={11} className="text-slate-400 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all ml-auto" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 max-w-[80%] mr-auto">
                  <div className="h-7 w-7 flex items-center justify-center shrink-0 lottie-theme-bot">
                    <DotLottieReact
                      src={CHATBOT_LOTTIE_URL}
                      loop
                      autoplay
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="px-4 py-3 bg-white/[0.05] border border-white/10 rounded-[20px] rounded-tl-sm flex items-center gap-1.5 backdrop-blur-xl">
                    <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 bg-pink-400 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
            </div>

            {/* Glassmorphic Input Pill Bar */}
            <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-md z-10">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-400/20 rounded-full px-4 py-2 transition-all shadow-sm">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendText(input);
                  }}
                  placeholder={`Ask ${pageContext.name} AI...`}
                  className="flex-1 bg-transparent py-1 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none font-medium"
                />
                <button
                  onClick={() => handleSendText(input)}
                  className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105 active:scale-95 text-white flex items-center justify-center shrink-0 transition cursor-pointer shadow-md shadow-purple-500/25"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
