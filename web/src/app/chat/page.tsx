"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Send,
  Users,
  Search,
  Pin,
  Smile,
  Plus,
  Paperclip,
  CheckCheck,
  Check,
  Hash,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Info,
  Circle,
  FileText,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSocket } from "@/context/SocketContext";
import { useAuthStore } from "@/store/authStore";

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  channel: string;
  pinned?: boolean;
}

const CHANNELS = ["general", "sales-leads", "operations", "photo-galleries"];

export default function WorkspaceChatPage() {
  const router = useRouter();
  const { status, subscribe, send, activeUsers, triggerTyping, typingUser } = useSocket();
  const { user } = useAuthStore();

  const [activeChannel, setActiveChannel] = useState("general");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isMobileChannelsOpen, setIsMobileChannelsOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("eventos_workspace_chat_messages");
      if (stored) {
        try {
          setMessages(JSON.parse(stored));
        } catch (e) {}
      }
    }
  }, []);

  const [inputMessage, setInputMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to channel WebSocket messages
  useEffect(() => {
    if (status !== "CONNECTED") return;

    const unsubscribeChat = subscribe("/topic/chat", (payload: any) => {
      const newMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        sender: payload.sender || "Peer",
        text: payload.text || "",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        channel: payload.channel || "general",
        pinned: payload.pinned || false
      };
      setMessages(prev => [...prev, newMsg]);
    });

    return () => {
      unsubscribeChat();
    };
  }, [status]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const payload = {
      sender: user?.firstName || "Me",
      text: inputMessage,
      channel: activeChannel
    };

    if (status === "CONNECTED") {
      send("/app/chat", payload);
    } else {
      // Local fallback append
      const localMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        sender: user?.firstName || "Me",
        text: inputMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        channel: activeChannel
      };
      setMessages(prev => {
        const updated = [...prev, localMsg];
        if (typeof window !== "undefined") {
          localStorage.setItem("eventos_workspace_chat_messages", JSON.stringify(updated));
        }
        return updated;
      });
    }

    setInputMessage("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    triggerTyping(activeChannel);
  };

  const filteredMessages = messages
    .filter(m => m.channel === activeChannel)
    .filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-100 flex flex-col relative overflow-hidden">
      
      {/* Glow Orbs */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Header */}
      <nav className="h-14 sm:h-16 border-b border-zinc-800 bg-[#111113]/60 backdrop-blur-md px-3.5 sm:px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => router.push("/dashboard")}
            className="h-8 w-8 rounded-xl bg-zinc-850 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-zinc-800 shrink-0"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={15} />
          </button>
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="font-bold text-xs sm:text-sm tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent truncate">
              Workspace Collaboration
            </span>
            <span className="hidden sm:inline-block text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 bg-zinc-850 border border-zinc-800 rounded text-zinc-400 font-bold uppercase font-mono tracking-wider shrink-0">
              Chat
            </span>
          </div>

          {/* Mobile Channel Switcher Pill */}
          <button
            onClick={() => setIsMobileChannelsOpen(true)}
            className="md:hidden flex items-center gap-1 px-2 py-1 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-purple-400 text-[11px] font-bold rounded-lg ml-1 shrink-0"
            aria-label="Select channel"
          >
            <Hash size={12} />
            <span className="truncate max-w-[80px]">{activeChannel}</span>
            <ChevronDown size={11} className="text-zinc-500" />
          </button>
        </div>
        
        {/* Connection status badge */}
        <div className={cn(
          "px-2 sm:px-2.5 py-1 border rounded-xl text-[8px] sm:text-[9px] font-black uppercase flex items-center gap-1.5 shrink-0",
          status === "CONNECTED" ? "border-emerald-950/40 text-emerald-450 bg-emerald-500/5" : "border-red-950/40 text-red-400 bg-red-500/5"
        )}>
          <span className={cn("h-1 w-1 rounded-full", status === "CONNECTED" ? "bg-emerald-500" : "bg-red-500")} />
          <span>{status}</span>
        </div>
      </nav>

      {/* Main Workspace split */}
      <div className="flex-1 flex overflow-hidden z-10 min-h-0">
        
        {/* Desktop Channels sidebar list */}
        <aside className="hidden md:flex w-64 border-r border-zinc-850 bg-[#111113]/30 backdrop-blur-md p-4 flex-col justify-between shrink-0">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block font-mono">Workspace Channels</span>
              <div className="space-y-0.5">
                {CHANNELS.map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setActiveChannel(ch)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left border",
                      activeChannel === ch
                        ? "bg-purple-950/30 text-purple-300 border-purple-800/50 shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/40 border-transparent"
                    )}
                  >
                    <Hash size={13} className={activeChannel === ch ? "text-purple-400" : "text-zinc-600"} />
                    <span className="truncate">{ch}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Presence panel list */}
            <div className="space-y-3">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block font-mono">Active Collaborators</span>
              <div className="space-y-2">
                {activeUsers.map((u, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                    <Circle size={8} fill={u.status === "Online" ? "#10b981" : "#f59e0b"} className={u.status === "Online" ? "text-emerald-500" : "text-amber-500"} />
                    <div className="flex-1 truncate">
                      <span>{u.name}</span>
                      <span className="text-[8.5px] text-zinc-500 font-normal block font-mono">Browsing {u.page}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3 bg-zinc-950/25 border border-zinc-850 rounded-xl flex items-center gap-2.5 text-xs">
            <div className="h-6 w-6 rounded-full bg-purple-550/15 text-purple-400 flex items-center justify-center font-bold font-mono">
              {user?.firstName?.[0] || "U"}
            </div>
            <div className="truncate">
              <span className="font-bold text-zinc-300 block leading-tight">{user?.firstName}</span>
              <span className="text-[8px] text-zinc-500 block leading-none font-mono uppercase mt-0.5">{user?.role}</span>
            </div>
          </div>
        </aside>

        {/* Mobile Channels Drawer Sheet */}
        <AnimatePresence>
          {isMobileChannelsOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileChannelsOpen(false)}
                className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#111113] border-r border-zinc-850 p-4 flex flex-col justify-between md:hidden shadow-2xl"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                    <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-purple-400" /> Channels
                    </span>
                    <button
                      onClick={() => setIsMobileChannelsOpen(false)}
                      className="h-7 w-7 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center border border-zinc-800"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block font-mono">Workspace Channels</span>
                    <div className="space-y-1">
                      {CHANNELS.map((ch) => (
                        <button
                          key={ch}
                          onClick={() => {
                            setActiveChannel(ch);
                            setIsMobileChannelsOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left border",
                            activeChannel === ch
                              ? "bg-purple-950/30 text-purple-300 border-purple-800/50 shadow-sm"
                              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/40 border-transparent"
                          )}
                        >
                          <Hash size={13} className={activeChannel === ch ? "text-purple-400" : "text-zinc-600"} />
                          <span className="truncate">{ch}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Collaborators */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block font-mono">Active Collaborators</span>
                    <div className="space-y-2">
                      {activeUsers.map((u, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                          <Circle size={8} fill={u.status === "Online" ? "#10b981" : "#f59e0b"} className={u.status === "Online" ? "text-emerald-500" : "text-amber-500"} />
                          <div className="flex-1 truncate">
                            <span>{u.name}</span>
                            <span className="text-[8.5px] text-zinc-500 font-normal block font-mono">Browsing {u.page}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* User badge */}
                <div className="p-3 bg-zinc-950/40 border border-zinc-850 rounded-xl flex items-center gap-2.5 text-xs mt-4">
                  <div className="h-7 w-7 rounded-full bg-purple-550/15 text-purple-400 flex items-center justify-center font-bold font-mono">
                    {user?.firstName?.[0] || "U"}
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-zinc-200 block leading-tight">{user?.firstName}</span>
                    <span className="text-[8px] text-zinc-500 block leading-none font-mono uppercase mt-0.5">{user?.role}</span>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Chat Conversation pane */}
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950/10 min-w-0">
          
          {/* Top search & title bar */}
          <div className="px-3.5 sm:px-6 py-2.5 sm:py-3 border-b border-zinc-850 bg-zinc-900/10 flex items-center justify-between gap-2.5 sm:gap-4 shrink-0">
            <div className="min-w-0">
              <h4 className="text-xs font-black text-zinc-200 uppercase tracking-wider flex items-center gap-1.5 truncate">
                <Hash size={13} className="text-purple-400 shrink-0" />
                <span className="truncate">{activeChannel}</span>
              </h4>
              <p className="text-[9px] sm:text-[10px] text-zinc-500 font-bold mt-0.5 truncate">Workspace coordination logs stream.</p>
            </div>

            <div className="relative w-32 sm:w-48 text-xs shrink-0">
              <Search size={12} className="absolute left-2.5 top-2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 bg-zinc-900/60 border border-zinc-800 rounded-lg placeholder-zinc-600 focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* Messages lists */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-3 sm:space-y-4 min-w-0">
            {filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 py-12 sm:py-16">
                <div className="h-12 w-12 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
                  <MessageSquare size={20} />
                </div>
                <h5 className="text-xs font-bold text-zinc-300">No messages in #{activeChannel}</h5>
                <p className="text-[10px] sm:text-[11px] text-zinc-500 mt-1 max-w-xs">
                  This channel is quiet. Start the conversation with your team members below.
                </p>
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-2.5 sm:gap-3 text-xs leading-relaxed max-w-full sm:max-w-2xl">
                  <div className="h-7 w-7 rounded-full bg-zinc-850 border border-zinc-800 text-purple-400 flex items-center justify-center font-bold uppercase shrink-0 text-[11px]">
                    {msg.sender[0]}
                  </div>
                  <div className="p-2.5 sm:p-3 bg-zinc-900/40 border border-zinc-850/80 rounded-xl space-y-1 max-w-[85%] sm:max-w-none">
                    <div className="flex justify-between items-center text-[9px] sm:text-[9.5px] font-bold gap-4">
                      <span className="text-zinc-200 font-black truncate">{msg.sender}</span>
                      <span className="text-zinc-500 font-mono text-[8.5px] shrink-0">{msg.timestamp}</span>
                    </div>
                    <p className="text-zinc-300 leading-normal font-medium text-xs break-words">{msg.text}</p>
                  </div>
                </div>
              ))
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Typing status bar */}
          {typingUser && typingUser.page === activeChannel && (
            <div className="px-3.5 sm:px-6 py-1 text-[9px] text-zinc-500 font-bold italic animate-pulse">
              {typingUser.name} is typing...
            </div>
          )}

          {/* Input field */}
          <form onSubmit={handleSendMessage} className="p-2.5 sm:p-4 pb-[max(env(safe-area-inset-bottom,0px),0.75rem)] border-t border-zinc-850 bg-zinc-900/40 flex gap-2 sm:gap-2.5 items-center shrink-0">
            <button type="button" className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl shrink-0" aria-label="Attach file">
              <Paperclip size={14} />
            </button>
            
            <input
              type="text"
              placeholder={`Message #${activeChannel}...`}
              value={inputMessage}
              onChange={handleInputChange}
              className="flex-1 px-3 sm:px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors min-w-0"
            />

            <button type="submit" className="p-2 bg-purple-650 hover:bg-purple-700 text-white rounded-xl shadow-md shrink-0 cursor-pointer" aria-label="Send message">
              <Send size={14} />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
