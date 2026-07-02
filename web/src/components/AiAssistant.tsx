"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Plus,
  FileText,
  Calendar,
  ClipboardCheck,
  DollarSign,
  Mail,
  ArrowRight,
  Loader2,
  Copy,
  Check,
  Zap,
  HelpCircle,
  TrendingUp,
  Cpu
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { generateAIResponse, getAIConfig } from "@/lib/aiProvider";

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
    if (path.startsWith("/quotes")) return { name: "Quotes proposals", module: "Quote AI" };
    if (path.startsWith("/gallery")) return { name: "Media Galleries", module: "Gallery AI" };
    if (path.startsWith("/finance") || path.startsWith("/invoices") || path.startsWith("/payments")) return { name: "Finance Hub", module: "Finance AI" };
    if (path.startsWith("/portal")) return { name: "Client Portal", module: "Client AI" };
    return { name: "Workspace", module: "Overview" };
  }, [pathname]);

  // Welcome message when context changes
  useEffect(() => {
    const config = getAIConfig();
    setMessages([
      {
        id: "welcome",
        sender: "ai",
        text: `Hello! I am your EventOS AI Co-pilot, currently configured using **${config.provider}** provider.\n\nI see you are browsing the **${pageContext.name}** page. How can I help you optimize these operations today?`,
        timestamp: new Date(),
        suggestions: getContextSuggestions()
      }
    ]);
  }, [pageContext, isOpen]);

  const getContextSuggestions = () => {
    if (pageContext.module === "CRM AI") {
      return [
        { label: "Analyze lead quality score", action: () => handleSendText("Analyze lead quality score") },
        { label: "Generate follow-up reminder email", action: () => handleSendText("Draft a lead follow-up email") }
      ];
    }
    if (pageContext.module === "Event AI") {
      return [
        { label: "Generate optimized day schedule", action: () => handleSendText("Generate wedding timeline checklist") },
        { label: "Predict weather conflict risk", action: () => handleSendText("Predict event risk & weather suggestions") }
      ];
    }
    if (pageContext.module === "Quote AI") {
      return [
        { label: "Suggest upselling package", action: () => handleSendText("Suggest upselling package for corporate quotes") }
      ];
    }
    if (pageContext.module === "Finance AI") {
      return [
        { label: "Forecast Q3 cash flow", action: () => handleSendText("Forecast revenue and payment delay risk") }
      ];
    }
    if (pageContext.module === "Gallery AI") {
      return [
        { label: "Auto caption album covers", action: () => handleSendText("Auto tagging and highlights selection") }
      ];
    }
    return [
      { label: "Search unpaid invoices", action: () => handleSendText("Show unpaid overdue invoices") },
      { label: "Show weddings next month", action: () => handleSendText("Show me weddings next month") }
    ];
  };

  // Toggle with Ctrl + Space
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
    }, 80);
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
      // Direct call to unified AI Provider Abstraction
      const aiResponse = await generateAIResponse(pageContext.module, text);

      const query = text.toLowerCase();
      let type: Message["type"] = "text";
      let data: any = null;

      // Type checks to format visual widgets (Email, Quote, Checklist)
      if (query.includes("email") || query.includes("draft") || query.includes("remind")) {
        type = "email";
        data = {
          subject: "Clearence reminder: outstanding balance",
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
      } else if (query.includes("checklist")) {
        type = "checklist";
        data = {
          items: [
            "Confirm helium balloon bouquet supplier delivery",
            "Pick up cake from bakery (2:00 PM)",
            "Setup photobooth props and backdrop"
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

      const aiMsg: Message = {
        id: Math.random().toString(36).substring(7),
        sender: "ai",
        text: aiResponse,
        timestamp: new Date(),
        type,
        data,
        suggestions: [
          { label: "Show unpaid invoices", action: () => handleSendText("Show unpaid overdue invoices") },
          { label: "Generate event schedule checklist", action: () => handleSendText("Generate wedding checklist") }
        ]
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
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="ai-trigger-btn fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-tr from-purple-500/80 via-pink-500/70 to-purple-700/80 text-white flex items-center justify-center shadow-[0_0_25px_rgba(139,92,246,0.45)] hover:scale-105 active:scale-[0.95] transition-all z-[9999] group cursor-pointer border border-purple-400/50 backdrop-blur-md"
        title="Open AI Assistant (Ctrl + Space)"
      >
        {/* Liquid Glass Inner Shadow Overlay */}
        <div className="absolute top-0 left-0 z-0 h-full w-full rounded-full shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3px_rgba(0,0,0,0.9),inset_-3px_-3px_0.5px_-3px_rgba(0,0,0,0.85),inset_1px_1px_1px_-0.5px_rgba(0,0,0,0.6),inset_-1px_-1px_1px_-0.5px_rgba(0,0,0,0.6),inset_0_0_6px_6px_rgba(0,0,0,0.12),inset_0_0_2px_2px_rgba(0,0,0,0.06),0_0_12px_rgba(255,255,255,0.15)] transition-all dark:shadow-[0_0_8px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.09),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.85),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.6),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.6),inset_0_0_6px_6px_rgba(255,255,255,0.12),inset_0_0_2px_2px_rgba(255,255,255,0.06),0_0_12px_rgba(0,0,0,0.15)] pointer-events-none" />

        <Sparkles size={20} className="group-hover:rotate-12 transition-transform duration-300 relative z-10" />
        <span className="absolute right-18 bg-zinc-900 border border-zinc-800 text-purple-400 text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-xl">
          EventOS AI Co-pilot
        </span>
        <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-cyan-500 ring-2 ring-[#09090b] z-20" />
      </button>

      {/* Slide-out Sidebar Drawer for AI */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            ref={containerRef}
            className="fixed top-16 bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:top-20 sm:bottom-24 w-auto sm:w-full sm:max-w-md bg-gradient-to-b from-purple-950/25 via-pink-950/15 to-[#09090b]/85 border border-purple-500/20 rounded-xl sm:rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.15)] backdrop-blur-xl flex flex-col overflow-hidden z-[9999]"
          >
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-zinc-850 bg-zinc-900/25 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-purple-550/15 flex items-center justify-center text-purple-400 border border-purple-500/20">
                  <Bot size={15} />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-zinc-100">EventOS AI Co-pilot</h3>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Enterprise Intelligence</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-555 hover:text-zinc-355 transition-colors p-1"
              >
                <X size={15} />
              </button>
            </div>

            {/* Message Area */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                    }`}
                >
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 border ${msg.sender === "user"
                      ? "bg-zinc-800 border-zinc-700 text-zinc-300"
                      : "bg-purple-950/20 border-purple-800/30 text-purple-400"
                    }`}>
                    {msg.sender === "user" ? <User size={12} /> : <Bot size={12} />}
                  </div>

                  <div className="space-y-2">
                    <div className={`p-3 rounded-xl text-xs leading-relaxed font-medium ${msg.sender === "user"
                        ? "bg-purple-650 text-white rounded-tr-none"
                        : "bg-zinc-900/40 border border-zinc-850 text-zinc-300 rounded-tl-none"
                      }`}>
                      {msg.text}

                      {/* Render custom type templates */}
                      {msg.type === "search-result" && msg.data?.results && (
                        <div className="mt-3 space-y-2">
                          {msg.data.results.map((res: any) => (
                            <div
                              key={res.id}
                              onClick={() => {
                                router.push(res.link);
                                setIsOpen(false);
                              }}
                              className="p-2 border border-zinc-800 hover:border-purple-500/30 hover:bg-purple-500/[0.02] rounded-lg bg-zinc-950/45 cursor-pointer flex items-center justify-between transition-all"
                            >
                              <div>
                                <span className="font-extrabold text-zinc-200 block text-[11px]">{res.title}</span>
                                <span className="text-[9px] text-zinc-500 block mt-0.5">{res.date}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-bold text-zinc-300 block">{res.budget}</span>
                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border mt-1 inline-block ${res.status === "CONFIRMED" || res.status === "BOOKED"
                                    ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-450"
                                    : "bg-zinc-900 border-zinc-800 text-zinc-400"
                                  }`}>
                                  {res.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.type === "timeline" && msg.data?.items && (
                        <div className="mt-3 space-y-2.5 border-l border-zinc-800 pl-4 py-1 text-[11px]">
                          {msg.data.items.map((item: any, idx: number) => (
                            <div key={idx} className="relative">
                              <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-purple-500 border-2 border-[#09090b]" />
                              <span className="font-black text-purple-400 block">{item.time}</span>
                              <span className="font-extrabold text-zinc-200 block mt-0.5">{item.event}</span>
                              <span className="text-[10px] text-zinc-550 block">{item.note}</span>
                            </div>
                          ))}
                          <button
                            onClick={() => copyToClipboard(msg.data.items.map((i: any) => `[${i.time}] ${i.event} - ${i.note}`).join("\n"), msg.id)}
                            className="mt-3 flex items-center gap-1.5 text-[9px] font-bold text-purple-400 hover:text-purple-300 transition-colors bg-zinc-950 px-2 py-1 rounded border border-zinc-850 cursor-pointer"
                          >
                            {copiedId === msg.id ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                            {copiedId === msg.id ? "Copied!" : "Copy Timeline"}
                          </button>
                        </div>
                      )}

                      {msg.type === "checklist" && msg.data?.items && (
                        <div className="mt-3 space-y-1.5 text-[11px]">
                          {msg.data.items.map((item: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 text-zinc-300">
                              <ClipboardCheck size={12} className="text-purple-450 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </div>
                          ))}
                          <button
                            onClick={() => copyToClipboard(msg.data.items.join("\n"), msg.id)}
                            className="mt-3 flex items-center gap-1.5 text-[9px] font-bold text-purple-400 hover:text-purple-300 transition-colors bg-zinc-950 px-2 py-1 rounded border border-zinc-850 cursor-pointer"
                          >
                            {copiedId === msg.id ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                            {copiedId === msg.id ? "Copied!" : "Copy Checklist"}
                          </button>
                        </div>
                      )}

                      {msg.type === "email" && msg.data && (
                        <div className="mt-3 p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-850/60 space-y-2 text-[10.5px]">
                          <div>
                            <span className="text-zinc-500 font-bold block uppercase text-[8px] tracking-wider">Subject:</span>
                            <span className="font-extrabold text-zinc-300 block">{msg.data.subject}</span>
                          </div>
                          <div className="border-t border-zinc-900 pt-2 whitespace-pre-line text-zinc-400 font-mono text-[10px] leading-relaxed">
                            {msg.data.body}
                          </div>
                          <button
                            onClick={() => copyToClipboard(`Subject: ${msg.data.subject}\n\n${msg.data.body}`, msg.id)}
                            className="flex items-center gap-1.5 text-[9px] font-bold text-purple-400 hover:text-purple-300 transition-colors bg-zinc-900 px-2 py-1 rounded border border-zinc-850 cursor-pointer"
                          >
                            {copiedId === msg.id ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                            {copiedId === msg.id ? "Copied!" : "Copy Email"}
                          </button>
                        </div>
                      )}

                    </div>
                    <span className="text-[8px] text-zinc-650 block pl-1 font-bold">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>

                    {/* Suggestions */}
                    {msg.sender === "ai" && msg.suggestions && (
                      <div className="flex flex-wrap gap-1.5 pt-1 max-w-full">
                        {msg.suggestions.map((sug, i) => (
                          <button
                            key={i}
                            onClick={sug.action}
                            className="px-2.5 py-1.5 border border-zinc-850 bg-zinc-900/35 hover:bg-zinc-850 hover:border-purple-500/20 text-zinc-400 hover:text-purple-400 rounded-lg text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            {sug.label}
                            <ArrowRight size={8} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 max-w-[80%] mr-auto">
                  <div className="h-7 w-7 rounded-full bg-purple-950/20 border border-purple-800/30 text-purple-400 flex items-center justify-center shrink-0">
                    <Loader2 size={12} className="animate-spin" />
                  </div>
                  <div className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-xl rounded-tl-none flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-purple-550 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 bg-purple-550 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 bg-purple-550 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-zinc-850 bg-zinc-900/10 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendText(input);
                }}
                placeholder={`Ask ${pageContext.name} AI, e.g. "Draft follow-up email"...`}
                className="flex-1 bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-zinc-150 placeholder-zinc-550 focus:outline-none focus:border-purple-650 transition-colors"
              />
              <button
                onClick={() => handleSendText(input)}
                className="h-8 w-8 rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shrink-0 transition-colors shadow-lg cursor-pointer"
              >
                <Send size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
