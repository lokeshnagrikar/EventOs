"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Loader2,
  Paperclip,
  Trash2,
  CheckCheck,
  Check,
  Search,
  Pin,
  Bot,
  User,
  Activity,
  Smile,
  X,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageShell from "@/components/ui/PageShell";
import { useToastStore } from "@/lib/toastStore";
import { INITIAL_CHAT_MESSAGES, ChatMessageItem } from "@/lib/successData";

const EMOJIS = ["👍", "❤️", "🔥", "😂", "🎉", "🙏"];

export default function SupportChatPage() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Inputs
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // File simulator
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);

  // Ref for scroll
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("eventos_success_chat");
    if (stored) {
      try {
        setMessages(JSON.parse(stored));
      } catch {
        setMessages(INITIAL_CHAT_MESSAGES);
      }
    } else {
      setMessages(INITIAL_CHAT_MESSAGES);
      localStorage.setItem("eventos_success_chat", JSON.stringify(INITIAL_CHAT_MESSAGES));
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const saveMessages = (updated: ChatMessageItem[]) => {
    setMessages(updated);
    localStorage.setItem("eventos_success_chat", JSON.stringify(updated));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessageItem = {
      id: `msg-${Date.now().toString(36)}`,
      sender: "user",
      text: inputText,
      timestamp: new Date().toISOString(),
      read: false,
      reactions: [],
    };

    const nextMessages = [...messages, userMsg];
    saveMessages(nextMessages);
    setInputText("");

    // Simulate Agent typing response
    setIsTyping(true);
    setTimeout(() => {
      // Mark user message as read
      const readMsg = { ...userMsg, read: true };
      const agentMsg: ChatMessageItem = {
        id: `msg-agent-${Date.now().toString(36)}`,
        sender: "support",
        text: "Thanks for the details. I have forwarded this to our engineering team. We will push an update in our release schedule shortly and keep you posted here.",
        timestamp: new Date().toISOString(),
        read: true,
        reactions: [],
      };

      const updated = nextMessages.map((m) => (m.id === userMsg.id ? readMsg : m));
      saveMessages([...updated, agentMsg]);
      setIsTyping(false);
      addToast("New support response received", "info");
    }, 2500);
  };

  const handleToggleReaction = (id: string, emoji: string) => {
    const updated = messages.map((m) => {
      if (m.id === id) {
        const reactions = m.reactions || [];
        const next = reactions.includes(emoji)
          ? reactions.filter((r) => r !== emoji)
          : [...reactions, emoji];
        return { ...m, reactions: next };
      }
      return m;
    });
    saveMessages(updated);
  };

  const handleTogglePin = (id: string) => {
    const updated = messages.map((m) => {
      if (m.id === id) {
        const nextPin = !m.isPinned;
        addToast(nextPin ? "Message pinned to history tab." : "Message unpinned.", "info");
        return { ...m, isPinned: nextPin };
      }
      return m;
    });
    saveMessages(updated);
  };

  const handleDeleteMessage = (id: string) => {
    saveMessages(messages.filter((m) => m.id !== id));
    addToast("Message deleted.", "info");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingFile(true);

      setTimeout(() => {
        const fileMsg: ChatMessageItem = {
          id: `msg-file-${Date.now().toString(36)}`,
          sender: "user",
          text: `Uploaded attachment: ${file.name}`,
          fileName: file.name,
          timestamp: new Date().toISOString(),
          read: false,
          reactions: [],
        };
        saveMessages([...messages, fileMsg]);
        setUploadingFile(false);
        addToast(`File ${file.name} sent successfully!`, "success");
      }, 1200);
    }
  };

  // Filter messages by search query
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter((m) => m.text.toLowerCase().includes(q));
  }, [messages, searchQuery]);

  const pinnedMessages = useMemo(() => {
    return messages.filter((m) => m.isPinned);
  }, [messages]);

  if (!mounted) return null;

  return (
    <PageShell
      title="Live Support Chat"
      subtitle="Interactive, real-time messaging workspace co-pilot"
      breadcrumbs={[{ label: "Help Center", href: "/help" }, { label: "Chat" }]}
    >
      <div className="flex gap-6 h-[calc(100vh-12rem)] min-h-[450px] select-none text-zinc-300 max-w-5xl mx-auto">
        
        {/* ── CHAT DIALOGUE BOX ────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col border border-zinc-850 bg-zinc-950/20 rounded-3xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-850/60 bg-zinc-950/40">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <MessageCircle size={16} />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase text-zinc-200 tracking-wider">Live Chat Session</h3>
                <p className="text-[9px] text-zinc-550 font-bold uppercase tracking-wider">Average SLA response time: &lt; 4 hours</p>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-40">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-650">
                <Search size={11} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs..."
                className="w-full pl-7 pr-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] placeholder-zinc-650 text-zinc-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Dialogue view */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
            <AnimatePresence initial={false}>
              {filteredMessages.map((msg) => {
                const isSupport = msg.sender === "support";
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={cn("flex gap-3 max-w-[80%] group", isSupport ? "mr-auto" : "ml-auto flex-row-reverse")}
                  >
                    {/* Avatar */}
                    <div className={cn(
                      "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm",
                      isSupport ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-zinc-900 border-zinc-800 text-zinc-500"
                    )}>
                      {isSupport ? <Bot size={13} /> : <User size={13} />}
                    </div>

                    {/* Content Column */}
                    <div className="space-y-1.5 relative">
                      <div className={cn(
                        "px-4 py-3 rounded-2xl text-xs font-semibold leading-relaxed border shadow-md",
                        isSupport ? "bg-zinc-900/60 border-zinc-850 text-zinc-300" : "bg-purple-650 border-purple-650 text-white"
                      )}>
                        <p>{msg.text}</p>
                      </div>

                      {/* Footer: Date, Reactions, Pinned */}
                      <div className="flex items-center gap-2 px-1 flex-wrap">
                        <span className="text-[8px] text-zinc-600 font-mono">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        
                        {!isSupport && (
                          <span className="text-zinc-700">
                            {msg.read ? <CheckCheck size={11} className="text-purple-400" /> : <Check size={11} />}
                          </span>
                        )}

                        {/* reactions count */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="flex gap-1">
                            {msg.reactions.map((r, ri) => (
                              <span key={ri} className="text-[9px] bg-zinc-900 border border-zinc-800 rounded-md px-1 py-0.5">{r}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Tool Controls (Visible on hover) */}
                      <div className={cn(
                        "absolute top-0 flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10",
                        isSupport ? "-right-24" : "-left-24"
                      )}>
                        {/* Emoji Reactions Picker */}
                        <div className="relative group/emoji">
                          <button className="p-1 hover:bg-zinc-900 rounded text-zinc-500 hover:text-white cursor-pointer"><Smile size={11} /></button>
                          <div className="absolute bottom-6 left-0 hidden group-hover/emoji:flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 shadow-md">
                            {EMOJIS.map((emo) => (
                              <button
                                key={emo}
                                type="button"
                                onClick={() => handleToggleReaction(msg.id, emo)}
                                className="hover:scale-125 transition-transform cursor-pointer"
                              >
                                {emo}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => handleTogglePin(msg.id)}
                          className={cn("p-1 hover:bg-zinc-900 rounded cursor-pointer", msg.isPinned ? "text-amber-400" : "text-zinc-500")}
                        >
                          <Pin size={11} />
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-1 hover:bg-zinc-900 rounded text-zinc-700 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 mr-auto">
                  <div className="h-8 w-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <Bot size={13} />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-zinc-900/60 border border-zinc-850 text-zinc-400 flex items-center gap-1.5 shadow-md">
                    <Loader2 size={11} className="animate-spin text-purple-400" />
                    <span className="text-[9px] font-black uppercase tracking-wider">Success Agent is typing...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          {/* Form input bar */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-850/60 bg-zinc-950/40">
            <div className="relative flex items-center gap-2">
              {/* Attachment selector */}
              <label className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-purple-500/20 hover:bg-zinc-850/50 text-zinc-400 hover:text-white cursor-pointer transition-colors shrink-0">
                {uploadingFile ? <Loader2 size={13} className="animate-spin" /> : <Paperclip size={13} />}
                <input type="file" onChange={handleFileUpload} className="hidden" />
              </label>

              {/* Emoji Picker Selector */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEmojiMenu(!showEmojiMenu)}
                  className={cn(
                    "p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:border-purple-500/20 transition cursor-pointer flex items-center justify-center",
                    showEmojiMenu && "bg-zinc-850 border-purple-500/30 text-white"
                  )}
                  aria-label="Open emoji menu"
                >
                  <Smile size={13} />
                </button>
                <AnimatePresence>
                  {showEmojiMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-12 left-0 flex items-center gap-1.5 bg-zinc-950 border border-zinc-850 rounded-xl p-2 shadow-2xl z-20"
                    >
                      {EMOJIS.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => {
                            setInputText((prev) => prev + e);
                            setShowEmojiMenu(false);
                          }}
                          className="hover:scale-125 transition-transform text-xs cursor-pointer"
                        >
                          {e}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask support agent a question..."
                className="flex-1 pl-4 pr-12 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs placeholder-zinc-650 text-zinc-200 focus:outline-none focus:border-purple-500/30"
              />
              <button
                type="submit"
                className="absolute right-2 p-2 bg-purple-650 hover:bg-purple-600 text-white rounded-xl transition-all cursor-pointer shadow-md"
              >
                <Send size={11} />
              </button>
            </div>
          </form>
        </div>

        {/* ── PINNED MESSAGES SIDEBAR ───────────────────────────────────────── */}
        <div className="w-56 shrink-0 border border-zinc-850 bg-zinc-950/20 rounded-3xl p-5 space-y-4 hidden md:block">
          <h4 className="text-[10px] font-black uppercase text-zinc-550 tracking-wider flex items-center gap-1.5">
            <Pin size={10} className="text-amber-400 rotate-45" />
            Pinned Messages ({pinnedMessages.length})
          </h4>

          <div className="space-y-3 overflow-y-auto max-h-[300px] scrollbar-thin">
            {pinnedMessages.map((msg) => (
              <div key={msg.id} className="p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl space-y-1.5 relative group/pin">
                <p className="text-[10px] text-zinc-350 leading-relaxed font-semibold">{msg.text}</p>
                <div className="flex justify-between items-center text-[8px] text-zinc-600 font-mono">
                  <span>{msg.sender === "support" ? "Support Agent" : "You"}</span>
                  <button onClick={() => handleTogglePin(msg.id)} className="text-zinc-650 hover:text-red-400 cursor-pointer font-bold font-mono opacity-0 group-hover/pin:opacity-100 transition-opacity">
                    Unpin
                  </button>
                </div>
              </div>
            ))}
            {pinnedMessages.length === 0 && (
              <p className="text-[9px] text-zinc-600 font-semibold text-center py-6">No pinned messages logs.</p>
            )}
          </div>
        </div>

      </div>
    </PageShell>
  );
}
