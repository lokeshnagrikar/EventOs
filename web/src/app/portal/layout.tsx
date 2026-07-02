"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Calendar,
  FileText,
  DollarSign,
  FileSpreadsheet,
  Camera,
  LogOut,
  User,
  Sun,
  Moon,
  Clock,
  Menu,
  X,
  LayoutDashboard,
  HelpCircle,
  Bell,
  MessageSquare,
  Search,
  Send,
  Paperclip,
  Check,
  Pin,
  Sparkles,
  ArrowRight,
  Smile,
  ShieldCheck,
  ThumbsUp,
  Bookmark,
  CheckCheck,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [darkMode, setDarkMode] = useState(true);
  const [userName, setUserName] = useState("Client");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Global Floating Drawers
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);

  // Search input
  const [searchQuery, setSearchQuery] = useState("");

  // Notification lists (State)
  const [notifications, setNotifications] = useState([
    { id: "1", type: "PAYMENT", text: "Advance Payment Receipt Generated", time: "1 hour ago", unread: true },
    { id: "2", type: "TIMELINE", text: "Event Coordinator updated Florals schedule", time: "3 hours ago", unread: true },
    { id: "3", type: "GALLERY", text: "Initial Mood Board Album published", time: "1 day ago", unread: false },
    { id: "4", type: "DOCUMENT", text: "Contract Proposal v2 ready for signature", time: "2 days ago", unread: false }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  // Chat conversation logs (State)
  const [chatMessages, setChatMessages] = useState([
    { id: "1", sender: "planner", text: "Hi! I've uploaded the updated decor proposals in the document vault. Let me know your thoughts.", time: "10:15 AM", read: true },
    { id: "2", sender: "client", text: "Awesome! The color choices look perfect. Let's proceed with the pastel shades.", time: "10:20 AM", read: true },
    { id: "3", sender: "planner", text: "Perfect. I'll lock that in and update the timeline milestones.", time: "10:25 AM", read: true }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [pinnedNotes, setPinnedNotes] = useState<string>("Meeting scheduled: July 5th at 3:00 PM.");

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const getCookieValue = (name: string) => {
    if (typeof window === "undefined") return "";
    return document.cookie
      .split("; ")
      .find(row => row.startsWith(`${name}=`))
      ?.split("=")[1] || "";
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = getCookieValue("user_name");
      const storedRole = getCookieValue("user_role");
      
      if (!storedName || storedRole !== "CLIENT") {
        router.push("/login");
        return;
      }
      
      setUserName(decodeURIComponent(storedName));
      setAuthChecked(true);

      const cookieTheme = getCookieValue("theme");
      const isDark = cookieTheme ? cookieTheme === "dark" : true;
      setDarkMode(isDark);
    }
  }, [router]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (showChatDrawer) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, showChatDrawer]);

  // Cmd+K Event listener for Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchModal(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async (expired: boolean | React.MouseEvent = false) => {
    const isExpired = typeof expired === "boolean" ? expired : false;
    try {
      await api.post("/auth/logout", { email: decodeURIComponent(getCookieValue("user_name")) });
    } catch (err) {
      console.error("Portal logout failed:", err);
    }
    document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "user_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "hasSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push(isExpired ? "/login?expired=true" : "/login");
  };

  // Inactivity timeout
  useEffect(() => {
    if (!authChecked) return;
    let timeoutId: any;
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => handleLogout(true), 30 * 60 * 1000);
    };
    const events = ["mousemove", "keydown", "click", "scroll"];
    resetTimer();
    events.forEach(event => window.addEventListener(event, resetTimer));
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [authChecked]);

  const toggleTheme = () => {
    const nextTheme = !darkMode ? "dark" : "light";
    setDarkMode(!darkMode);
    if (typeof window !== "undefined") {
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      document.cookie = `theme=${nextTheme}; path=/; max-age=31536000; SameSite=Strict`;
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      id: Math.random().toString(),
      sender: "client",
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    setChatMessages(prev => [...prev, newMsg]);
    setChatInput("");
    setIsTyping(true);

    // Simulate coordinator reply
    setTimeout(() => {
      setIsTyping(false);
      const replyMsg = {
        id: Math.random().toString(),
        sender: "planner",
        text: "Got it! I will process this immediately.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: true
      };
      setChatMessages(prev => [...prev, replyMsg]);
    }, 2500);
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const navItems = [
    { name: "Overview Desk", path: "/portal", icon: LayoutDashboard },
    { name: "Journey Timeline", path: "/portal/timeline", icon: Calendar },
    { name: "Proposal Vault", path: "/portal/quotes", icon: FileText },
    { name: "Payment Ledger", path: "/portal/invoices", icon: FileSpreadsheet },
    { name: "Media Assets", path: "/portal/gallery", icon: Camera },
    { name: "Planner Desk & FAQs", path: "/portal/support", icon: HelpCircle },
    { name: "Profile Security", path: "/portal/settings", icon: User }
  ];

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-100 flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500" size={32} />
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen flex flex-col md:flex-row bg-[#09090B] text-zinc-100 font-sans transition-colors duration-200", darkMode ? "dark" : "")}>
      
      {/* Mobile Header Top Navigation */}
      <div className="md:hidden h-16 border-b border-zinc-800 bg-[#111113]/90 backdrop-blur px-4 flex items-center justify-between z-30 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
            E
          </div>
          <span className="font-extrabold text-xs tracking-tight text-zinc-200">EventOS Client</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setShowSearchModal(true)} className="h-8 w-8 rounded-lg border border-zinc-800 flex items-center justify-center text-zinc-400">
            <Search size={14} />
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="h-8 w-8 rounded-lg border border-zinc-800 flex items-center justify-center text-zinc-400">
            {isMobileMenuOpen ? <X size={14} /> : <Menu size={14} />}
          </button>
        </div>
      </div>

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex w-64 border-r border-zinc-800 bg-[#0d0d0e]/95 p-6 flex-col justify-between shrink-0 z-10 sticky top-0 h-screen select-none">
        <div className="space-y-6">
          {/* Logo Section */}
          <div className="flex items-center gap-2.5 pb-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-500 via-pink-500 to-purple-650 flex items-center justify-center text-white font-extrabold text-base shadow-lg shadow-purple-500/10">
              E
            </div>
            <div>
              <h1 className="font-extrabold text-xs leading-none tracking-wide text-zinc-200">EventOS</h1>
              <span className="text-[9px] text-zinc-550 font-black uppercase tracking-wider mt-1 block">Client Experience</span>
            </div>
          </div>

          {/* Quick Actions Search Bar */}
          <button
            onClick={() => setShowSearchModal(true)}
            className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700/80 rounded-xl text-zinc-500 hover:text-zinc-400 transition-all text-xs font-semibold"
          >
            <span className="flex items-center gap-2">
              <Search size={13} /> Search portal...
            </span>
            <span className="font-mono text-[9px] bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">Ctrl+K</span>
          </button>

          {/* Nav Links */}
          <nav data-lenis-prevent className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border",
                    isActive
                      ? "bg-purple-950/20 text-purple-400 border-purple-900/40 shadow-sm"
                      : "text-zinc-450 hover:text-zinc-200 hover:bg-zinc-900/30 border-transparent"
                  )}
                >
                  <Icon size={14} className={isActive ? "text-purple-400" : "text-zinc-500"} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Footer Panel */}
        <div className="pt-6 border-t border-zinc-850 flex flex-col gap-3">
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowNotificationDrawer(true)}
              className="flex-1 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white relative transition-all"
            >
              <Bell size={14} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-purple-500 animate-ping" />
              )}
            </button>
            <button
              onClick={() => setShowChatDrawer(true)}
              className="flex-1 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
            >
              <MessageSquare size={14} />
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-750">
                <User size={15} />
              </div>
              <div className="truncate max-w-[110px]">
                <p className="text-[11px] font-extrabold leading-none text-zinc-200">{userName}</p>
                <span className="text-[9px] text-zinc-550 font-mono">Client Account</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleTheme}
                className="h-7 w-7 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 flex items-center justify-center text-zinc-400 transition-all"
              >
                {darkMode ? <Sun size={13} /> : <Moon size={13} />}
              </button>
              <button
                onClick={handleLogout}
                className="h-7 w-7 rounded-lg bg-zinc-900 hover:bg-red-500/10 hover:text-red-400 border border-zinc-800 flex items-center justify-center text-zinc-500 transition-all"
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main data-lenis-prevent className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full z-0 flex flex-col relative">
        {children}
      </main>

      {/* ─── DRAWERS & GLOBAL MODALS ─── */}

      {/* 1. Global Search Modal (Cmd+K) */}
      <AnimatePresence>
        {showSearchModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 pt-[15vh]">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-lg bg-[#111113] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="relative border-b border-zinc-800">
                <Search className="absolute left-4 top-3 text-zinc-500" size={15} />
                <input
                  type="text"
                  placeholder="Type to search invoices, events, gallery..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-10 py-3.5 bg-transparent text-xs text-white focus:outline-none"
                />
                <button onClick={() => setShowSearchModal(false)} className="absolute right-4 top-3.5 text-[9px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-400 font-bold">
                  ESC
                </button>
              </div>

              <div className="p-4 max-h-[300px] overflow-y-auto text-xs text-zinc-400 space-y-4">
                {searchQuery ? (
                  <div className="space-y-2">
                    <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block">Matched Items</span>
                    {[
                      { title: "Invoice #INV-2026-004", path: "/portal/invoices", type: "invoice" },
                      { title: "Proposal Decor Layout", path: "/portal/quotes", type: "document" },
                      { title: "Wedding Day Photography", path: "/portal/timeline", type: "timeline" }
                    ]
                      .filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => { setShowSearchModal(false); router.push(item.path); }}
                          className="w-full p-2 bg-zinc-900/50 hover:bg-zinc-850 border border-zinc-850 rounded-xl text-left flex justify-between items-center group font-bold"
                        >
                          <span>{item.title}</span>
                          <span className="text-[9px] text-purple-400 bg-purple-550/5 border border-purple-500/10 px-1.5 py-0.5 rounded">{item.type}</span>
                        </button>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-zinc-550">
                    <p className="font-semibold">Search for proposals, receipts, and planner notes.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Notification Center Drawer */}
      <AnimatePresence>
        {showNotificationDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs select-none">
            <div className="absolute inset-0" onClick={() => setShowNotificationDrawer(false)} />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.22 }}
              className="w-80 bg-[#111113] border-l border-zinc-800 p-6 flex flex-col justify-between h-full z-10 text-xs"
            >
              <div className="space-y-5">
                <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
                  <h3 className="font-black text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Bell size={13} className="text-purple-500" />
                    Alert Desk ({unreadCount})
                  </h3>
                  <button onClick={markAllNotificationsRead} className="text-[9.5px] font-bold text-purple-400 hover:underline">
                    Mark all read
                  </button>
                </div>

                <div className="space-y-2.5">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "p-3 border rounded-xl flex items-start gap-2.5 transition-colors",
                        n.unread ? "border-purple-500/25 bg-purple-550/[0.01]" : "border-zinc-850 bg-zinc-950/20"
                      )}
                    >
                      <div className={cn("h-1.5 w-1.5 rounded-full shrink-0 mt-1.5", n.unread ? "bg-purple-400" : "bg-transparent")} />
                      <div className="space-y-1">
                        <p className={cn("font-bold text-zinc-250 leading-relaxed", !n.unread && "text-zinc-500")}>
                          {n.text}
                        </p>
                        <span className="text-[8.5px] text-zinc-550 font-bold block">{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowNotificationDrawer(false)}
                className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl font-bold border border-zinc-800 mt-4"
              >
                Close Panel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Planner Chat Drawer */}
      <AnimatePresence>
        {showChatDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs select-none">
            <div className="absolute inset-0" onClick={() => setShowChatDrawer(false)} />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.22 }}
              className="w-[340px] bg-[#0c0c0e] border-l border-zinc-850 flex flex-col justify-between h-full z-10 text-xs text-zinc-350"
            >
              {/* Header */}
              <div className="p-4 border-b border-zinc-850 bg-zinc-950/30 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-extrabold border border-purple-500/20 shadow">
                    SR
                  </div>
                  <div>
                    <h4 className="font-extrabold text-zinc-200 leading-none">Sneha Rao</h4>
                    <span className="text-[8.5px] text-emerald-400 font-bold flex items-center gap-0.5 mt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" /> Active planner
                    </span>
                  </div>
                </div>
                <button onClick={() => setShowChatDrawer(false)} className="text-zinc-500 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              {/* Pinned Note Banner */}
              {pinnedNotes && (
                <div className="p-2.5 bg-purple-950/20 border-b border-purple-900/30 text-[9.5px] text-purple-400 flex items-center justify-between px-4 font-semibold">
                  <span className="flex items-center gap-1"><Pin size={10} /> {pinnedNotes}</span>
                  <button onClick={() => setPinnedNotes("")} className="text-zinc-550 font-bold hover:text-zinc-300">Dismiss</button>
                </div>
              )}

              {/* Chat Message Lists */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg) => {
                  const isMe = msg.sender === "client";
                  return (
                    <div key={msg.id} className={cn("flex flex-col max-w-[75%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                      <div className={cn(
                        "p-3 rounded-2xl border text-[11px] leading-relaxed font-medium shadow-sm",
                        isMe 
                          ? "bg-purple-600 border-purple-500 text-white rounded-br-none" 
                          : "bg-zinc-900/80 border-zinc-850 text-zinc-200 rounded-bl-none"
                      )}>
                        {msg.text}
                      </div>
                      
                      <div className="flex items-center gap-1.5 mt-1 text-[8.5px] text-zinc-550 font-bold">
                        <span>{msg.time}</span>
                        {isMe && (
                          msg.read ? <CheckCheck size={10} className="text-purple-400" /> : <Check size={10} />
                        )}
                      </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex items-center gap-2 text-zinc-550 font-bold text-[9px] mt-1 pl-1">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-650 animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-650 animate-bounce delay-100" />
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-650 animate-bounce delay-200" />
                    </div>
                    <span>Planner typing...</span>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Inputs */}
              <form onSubmit={handleSendMessage} className="p-3 bg-zinc-950/40 border-t border-zinc-850 flex gap-2 items-center">
                <button type="button" className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white rounded-lg">
                  <Paperclip size={12} />
                </button>
                <input
                  type="text"
                  placeholder="Chat with coordinator..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-[#121214] border border-zinc-800 rounded-lg text-white"
                />
                <button type="submit" className="p-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded-lg">
                  <Send size={12} />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
