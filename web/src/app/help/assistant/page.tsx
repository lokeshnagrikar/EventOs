"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Loader2,
  LifeBuoy,
  MessageSquare,
  User,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import PageShell from "@/components/ui/PageShell";
import { ARTICLES, FAQS, Article } from "@/lib/helpData";
import { generateAIResponse } from "@/lib/aiProvider";

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

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
  articles?: Article[];
  showTicketCTA?: boolean;
}

const SUGGESTIONS = [
  "How do I create a new lead?",
  "How do invoices work?",
  "Can I customize my brand colors?",
  "How do I setup two-factor auth?",
  "How do I invite my team members?",
];

export default function AiAssistantPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Initial welcome message
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        sender: "ai",
        text: "Hello! I am your EventOS Support Assistant. Ask me anything about using the platform, setting up your CRM, configuring invoices, or managing events. If I can't answer your question, I can help you create a support ticket.",
        timestamp: new Date(),
      },
    ]);
  }, []);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      sender: "user",
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response logic
    setTimeout(async () => {
      const query = text.toLowerCase();
      let matchedArticles: Article[] = [];
      let replyText = "";
      let showTicketCTA = false;

      // Simple keywords matching to recommend docs
      if (query.includes("lead") || query.includes("crm")) {
        matchedArticles = ARTICLES.filter((a) => a.categorySlug === "crm" || a.slug === "quick-start");
        replyText = "I found some documentation articles about managing leads and CRM pipelines. You can drag and drop leads through stages, or click 'Quick Add Lead' to add them instantly.";
      } else if (query.includes("invoice") || query.includes("payment") || query.includes("finance") || query.includes("budget")) {
        matchedArticles = ARTICLES.filter((a) => a.categorySlug === "finance");
        replyText = "Here are resources on invoicing, payments, and budgets. In the Finance Hub, you can generate invoices, log payments, and track cash flow with real-time analytics.";
      } else if (query.includes("quote")) {
        matchedArticles = ARTICLES.filter((a) => a.slug === "quote-builder");
        replyText = "The quote builder allows you to create sections, add line items with automatic tax calculation, and send proposals directly to the client portal for digital approval.";
      } else if (query.includes("event") || query.includes("calendar")) {
        matchedArticles = ARTICLES.filter((a) => a.categorySlug === "events");
        replyText = "For event management, you can schedule events, view them on calendars or Kanban boards, manage vendors, and allocate team coordinates.";
      } else if (query.includes("gallery") || query.includes("album") || query.includes("photo")) {
        matchedArticles = ARTICLES.filter((a) => a.slug === "managing-albums");
        replyText = "You can create media albums, upload client photos via Cloudinary, and share galleries securely with clients through the Client Portal.";
      } else if (query.includes("brand") || query.includes("logo") || query.includes("setting")) {
        matchedArticles = ARTICLES.filter((a) => a.categorySlug === "settings");
        replyText = "To brand your workspace, go to Settings → Branding. You can upload your company logo, tagline, and configure colors which propagate to quotes and invoices.";
      } else if (query.includes("2fa") || query.includes("security") || query.includes("password") || query.includes("auth")) {
        matchedArticles = ARTICLES.filter((a) => a.categorySlug === "security" || a.categorySlug === "authentication");
        replyText = "EventOS offers email verification, JWT session tokens, audit logs, and TOTP-based two-factor authentication for maximum security.";
      } else if (query.includes("shortcut")) {
        replyText = "EventOS supports multiple keyboard shortcuts to work faster. For example, press Ctrl+/ to trigger global help search, or Alt+L to quickly add a lead.";
      }

      // Check FAQs for a direct answer
      const matchedFaq = FAQS.find((faq) => query.includes(faq.question.toLowerCase()) || faq.question.toLowerCase().split(" ").some(word => word.length > 4 && query.includes(word)));
      if (matchedFaq) {
        replyText = matchedFaq.answer + (replyText ? `\n\n${replyText}` : "");
      }

      // Default reply if no specific keywords matched
      if (!replyText) {
        try {
          // Use the actual configured AI response logic for a generic reply
          replyText = await generateAIResponse("Help Center AI Support", text);
        } catch {
          replyText = "I apologize, but I could not find a specific documentation article or answer matching your query. Let me know if you would like me to direct you to our Support Center to create a ticket.";
        }
        showTicketCTA = true;
      }

      const aiMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        sender: "ai",
        text: replyText,
        timestamp: new Date(),
        articles: matchedArticles.length > 0 ? matchedArticles.slice(0, 3) : undefined,
        showTicketCTA,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <PageShell
      title="AI Support Assistant"
      subtitle="Interactive co-pilot to help you master EventOS"
      breadcrumbs={[{ label: "Help Center", href: "/help" }, { label: "AI Assistant" }]}
    >
      <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[450px] select-none text-slate-800 dark:text-slate-200 max-w-4xl mx-auto border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-[35px] rounded-3xl overflow-hidden shadow-xl">
        {/* Top Accent Gradient Line */}
        <div className="h-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 w-full shrink-0" />
        
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-md">
          <div className="h-10 w-10 flex items-center justify-center shrink-0 lottie-theme-bot">
            <DotLottieReact
              src={CHATBOT_LOTTIE_URL}
              loop
              autoplay
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase text-slate-900 dark:text-white tracking-wider">EventOS AI Support</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wider">Always online • 100% Automated</p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isAi = msg.sender === "ai";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn("flex gap-3 max-w-[85%]", isAi ? "mr-auto" : "ml-auto flex-row-reverse")}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "h-8 w-8 flex items-center justify-center shrink-0",
                    isAi ? "lottie-theme-bot" : "rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  )}>
                    {isAi ? (
                      <DotLottieReact
                        src={CHATBOT_LOTTIE_URL}
                        loop
                        autoplay
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <User size={14} />
                    )}
                  </div>

                  {/* Bubble */}
                  <div className="space-y-3">
                    <div className={cn(
                      "px-4 py-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-xs border",
                      isAi
                        ? "bg-slate-50 dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-100"
                        : "bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-500 text-white"
                    )}>
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>

                    {/* Documentation Suggestions */}
                    {isAi && msg.articles && msg.articles.length > 0 && (
                      <div className="space-y-1.5 pl-2">
                        <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Suggested Reading:</p>
                        <div className="flex flex-wrap gap-2">
                          {msg.articles.map((art) => (
                            <button
                              key={art.slug}
                              onClick={() => router.push(`/help/docs/${art.slug}`)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-300 text-slate-700 dark:text-slate-200 hover:text-purple-700 rounded-xl text-[10.5px] font-semibold transition-all cursor-pointer shadow-xs"
                            >
                              <BookOpen size={11} className="text-purple-500" />
                              {art.title}
                              <ArrowRight size={10} className="text-slate-400" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Support Ticket CTA */}
                    {isAi && msg.showTicketCTA && (
                      <div className="pl-2">
                        <button
                          onClick={() => router.push("/help/support")}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                        >
                          <LifeBuoy size={12} className="text-purple-600" />
                          Still stuck? Create a Support Ticket
                          <ArrowRight size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 mr-auto"
              >
                <div className="h-8 w-8 flex items-center justify-center shrink-0 lottie-theme-bot">
                  <DotLottieReact
                    src={CHATBOT_LOTTIE_URL}
                    loop
                    autoplay
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 flex items-center gap-2 shadow-xs">
                  <Loader2 size={12} className="animate-spin text-purple-600" />
                  <span className="text-[10.5px] font-bold tracking-wide">AI is searching docs...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Chips */}
        {messages.length === 1 && !isTyping && (
          <div className="px-6 py-2.5 flex flex-wrap gap-2 bg-slate-50/60 dark:bg-slate-900/40 overflow-x-auto scrollbar-none border-t border-slate-100 dark:border-slate-800">
            {SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                onClick={() => handleSend(sug)}
                className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-300 text-slate-700 dark:text-slate-200 hover:text-purple-700 rounded-xl text-[10.5px] font-semibold transition-all whitespace-nowrap cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Sparkles size={11} className="text-purple-500" />
                {sug}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-md">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
              placeholder="Ask a question about EventOS..."
              className="w-full pl-4 pr-12 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs placeholder-slate-400 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-400/20 font-medium shadow-xs"
            />
            <button
              onClick={() => handleSend(input)}
              className="absolute right-2.5 p-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105 text-white rounded-xl transition-all cursor-pointer active:scale-95 shadow-md shadow-purple-500/25"
            >
              <Send size={13} />
            </button>
          </div>
        </div>

      </div>
    </PageShell>
  );
}
