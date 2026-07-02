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
  Info,
  Circle,
  FileText
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "1", sender: "Rahul (Sales)", text: "Varun Mehta requested a custom quote for the corporate event.", timestamp: "10:15 AM", channel: "sales-leads" },
    { id: "2", sender: "Sneha (Coordinator)", text: "Confirming florals ingress scheduled for July 12.", timestamp: "10:30 AM", channel: "operations" },
    { id: "3", sender: "Amit (Photo Lead)", text: "I uploaded the initial decorators mockup layout draft to the gallery.", timestamp: "10:45 AM", channel: "photo-galleries" }
  ]);

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
      setMessages(prev => [...prev, localMsg]);
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
      <nav className="h-16 border-b border-zinc-800 bg-[#111113]/60 backdrop-blur-md px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="h-8 w-8 rounded-xl bg-zinc-850 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-zinc-800"
          >
            <ArrowLeft size={15} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Workspace Collaboration</span>
            <span className="text-[10px] px-2 py-0.5 bg-zinc-850 border border-zinc-800 rounded text-zinc-400 font-bold uppercase font-mono tracking-wider">Chat</span>
          </div>
        </div>
        
        {/* Connection status badge */}
        <div className={cn(
          "px-2.5 py-1 border rounded-xl text-[9px] font-black uppercase flex items-center gap-1.5",
          status === "CONNECTED" ? "border-emerald-950/40 text-emerald-450 bg-emerald-500/5" : "border-red-950/40 text-red-400 bg-red-500/5"
        )}>
          <span className={cn("h-1 w-1 rounded-full", status === "CONNECTED" ? "bg-emerald-500" : "bg-red-500")} />
          {status}
        </div>
      </nav>

      {/* Main Workspace split */}
      <div className="flex-1 flex overflow-hidden z-10">
        
        {/* Channels sidebar list */}
        <aside className="w-64 border-r border-zinc-850 bg-[#111113]/30 backdrop-blur-md p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-[9px] font-black text-zinc-550 uppercase tracking-widest block font-mono">Workspace Channels</span>
              <div className="space-y-0.5">
                {CHANNELS.map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setActiveChannel(ch)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left border",
                      activeChannel === ch
                        ? "bg-purple-950/20 text-purple-400 border-purple-900/40 shadow-sm"
                        : "text-zinc-450 hover:text-zinc-200 hover:bg-zinc-850/40 border-transparent"
                    )}
                  >
                    <Hash size={13} className={activeChannel === ch ? "text-purple-450" : "text-zinc-600"} />
                    <span className="truncate">{ch}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Presence panel list */}
            <div className="space-y-3">
              <span className="text-[9px] font-black text-zinc-550 uppercase tracking-widest block font-mono">Active Collaborators</span>
              <div className="space-y-2">
                {activeUsers.map((u, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                    <Circle size={8} fill={u.status === "Online" ? "#10b981" : "#f59e0b"} className={u.status === "Online" ? "text-emerald-550" : "text-amber-500"} />
                    <div className="flex-1 truncate">
                      <span>{u.name}</span>
                      <span className="text-[8.5px] text-zinc-650 font-normal block font-mono">Browsing {u.page}</span>
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
              <span className="text-[8px] text-zinc-550 block leading-none font-mono uppercase mt-0.5">{user?.role}</span>
            </div>
          </div>
        </aside>

        {/* Chat Conversation pane */}
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950/10">
          
          {/* Top search & title bar */}
          <div className="px-6 py-3 border-b border-zinc-850 bg-zinc-900/10 flex items-center justify-between gap-4 shrink-0">
            <div>
              <h4 className="text-xs font-black text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Hash size={13} className="text-purple-400" />
                {activeChannel}
              </h4>
              <p className="text-[10px] text-zinc-500 font-bold mt-0.5">Workspace coordination logs stream.</p>
            </div>

            <div className="relative w-48 text-xs">
              <Search size={12} className="absolute left-2.5 top-2 text-zinc-550" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 bg-zinc-900/60 border border-zinc-800 rounded-lg placeholder-zinc-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Messages lists */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {filteredMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 text-xs leading-relaxed max-w-2xl">
                <div className="h-7 w-7 rounded-full bg-zinc-850 border border-zinc-800 text-zinc-400 flex items-center justify-center font-bold uppercase shrink-0">
                  {msg.sender[0]}
                </div>
                <div className="p-3 bg-zinc-900/20 border border-zinc-850/80 rounded-xl space-y-1 w-full">
                  <div className="flex justify-between items-center text-[9.5px] font-bold">
                    <span className="text-zinc-300 font-black">{msg.sender}</span>
                    <span className="text-zinc-550 font-mono">{msg.timestamp}</span>
                  </div>
                  <p className="text-zinc-400 leading-normal font-medium">{msg.text}</p>
                </div>
              </div>
            ))}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Typing status bar */}
          {typingUser && typingUser.page === activeChannel && (
            <div className="px-6 py-1 text-[9px] text-zinc-550 font-bold italic animate-pulse">
              {typingUser.name} is typing...
            </div>
          )}

          {/* Input field */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-850 bg-zinc-900/10 flex gap-2.5 items-center shrink-0">
            <button type="button" className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white rounded-xl">
              <Paperclip size={14} />
            </button>
            
            <input
              type="text"
              placeholder={`Send message to #${activeChannel}...`}
              value={inputMessage}
              onChange={handleInputChange}
              className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-550 focus:outline-none"
            />

            <button type="submit" className="p-2 bg-purple-650 hover:bg-purple-700 text-white rounded-xl shadow-md">
              <Send size={14} />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
