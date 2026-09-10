"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Search, 
  Bell, 
  Menu, 
  Sparkles, 
  ChevronRight, 
  Activity, 
  CheckCircle2, 
  MessageSquare,
  Sun,
  Moon,
  Zap,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSocket } from "@/context/SocketContext";
import { useToastStore } from "@/lib/toastStore";
import { useAuthStore } from "@/store/authStore";

interface NavbarProps {
  onMenuToggle: () => void;
  onSearchClick: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  type: "info" | "success" | "warning" | "error";
}

export default function Navbar({ onMenuToggle, onSearchClick }: NavbarProps) {
  const pathname = usePathname();
  const { status, subscribe, activeUsers } = useSocket();
  const { addToast } = useToastStore();
  const { user } = useAuthStore();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<"dark" | "light">("dark");

  // Dynamic notification items list
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: "1", title: "New Lead Logged", desc: "Rahul & Varsha requested a proposal for Udaipur Wedding.", time: "10 mins ago", unread: true, type: "info" },
    { id: "2", title: "UPI Payment Received", desc: "₹1,50,000 cleared for booking #BK-2026-042.", time: "2 hours ago", unread: true, type: "success" },
    { id: "3", title: "Proposal E-Signed", desc: "Client approved & signed Proposal #QT-2026-089.", time: "1 day ago", unread: false, type: "success" },
  ]);

  // 1. Synchronize Dark / Light Theme on mount & listen to changes
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    const isDarkClass = document.documentElement.classList.contains("dark");
    const activeTheme = savedTheme || (isDarkClass ? "dark" : "dark");
    
    setCurrentTheme(activeTheme);
    if (activeTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // 2. Real-Time Notification & Toast Handler
  const handleIncomingNotification = useCallback((data: { title: string; desc: string; type?: "info" | "success" | "warning" | "error" }) => {
    const notifId = Math.random().toString(36).substring(7);
    const newNotif: NotificationItem = {
      id: notifId,
      title: data.title || "Real-Time Activity",
      desc: data.desc || "New event logged in EventOS workspace",
      time: "Just now",
      unread: true,
      type: data.type || "info"
    };

    setNotifications((prev) => [newNotif, ...prev]);

    // Trigger Dynamic Floating Toast
    addToast(data.desc, data.type || "info", {
      title: data.title || "System Alert",
      duration: 5000
    });
  }, [addToast]);

  useEffect(() => {
    // Listen to custom window events
    const handleAddNotification = (e: Event) => {
      const customEvent = e as CustomEvent<{ title: string; desc: string; type?: "info" | "success" | "warning" | "error" }>;
      if (customEvent.detail) {
        handleIncomingNotification(customEvent.detail);
      }
    };

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<"dark" | "light">;
      if (customEvent.detail) {
        setCurrentTheme(customEvent.detail);
      }
    };

    window.addEventListener("add-notification", handleAddNotification);
    window.addEventListener("theme-changed", handleThemeChange);

    // WebSocket subscription for live notifications
    let unsubscribeNotifs: (() => void) | null = null;
    if (status === "CONNECTED") {
      unsubscribeNotifs = subscribe("/topic/notifications", (payload: any) => {
        handleIncomingNotification({
          title: payload.title || "Real-time Update",
          desc: payload.desc || payload.message || "New activity detected",
          type: payload.type || "info"
        });
      });
    }

    return () => {
      window.removeEventListener("add-notification", handleAddNotification);
      window.removeEventListener("theme-changed", handleThemeChange);
      if (unsubscribeNotifs) unsubscribeNotifs();
    };
  }, [status, subscribe, handleIncomingNotification]);

  // 3. Dynamic Theme Toggle Function
  const toggleTheme = () => {
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    setCurrentTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.cookie = `theme=${nextTheme}; path=/; SameSite=Lax; max-age=31536000`;

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }

    window.dispatchEvent(new CustomEvent("theme-changed", { detail: nextTheme }));

    // Trigger feedback toast
    addToast(`Switched to ${nextTheme.toUpperCase()} mode`, "info", { duration: 2500 });
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Dynamic Online Count: calculates real connected users or current user session
  const onlineCount = activeUsers?.length > 0 ? activeUsers.length : (user ? 1 : 0);

  // Dynamic Breadcrumb Generator
  const getBreadcrumbs = () => {
    const parts = pathname.split("/").filter(Boolean);
    const crumbs = [{ label: "Dashboard", href: "/dashboard" }];
    
    parts.forEach((part, idx) => {
      if (part === "dashboard") return;
      
      let label = part.toUpperCase();
      if (part === "crm") label = "CRM / Leads";
      if (part === "quotes") label = "Quotations";
      if (part === "events") label = "Events / Calendar";
      if (part === "invoices") label = "Invoices & Billing";
      if (part === "portal") label = "Client Portal";
      if (part === "gallery") label = "Media Gallery";
      if (part === "calculator") label = "Budget Calculator";
      if (part === "settings") label = "Workspace Settings";
      
      const href = "/" + parts.slice(0, idx + 1).join("/");
      crumbs.push({ label, href });
    });
    
    return crumbs;
  };

  const crumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 h-[60px] w-full border-b border-border bg-card/80 backdrop-blur-2xl px-5 flex items-center justify-between shadow-[0_1px_0_rgba(255,255,255,0.03)] transition-colors select-none">
      
      {/* ── LEFT: BREADCRUMBS & MOBILE MENU TRIGGER ── */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onMenuToggle}
          className="h-9 w-9 border border-border rounded-xl bg-card/80 hover:bg-muted md:hidden flex items-center justify-center text-foreground hover:text-purple-400 active:scale-95 transition-all cursor-pointer shadow-sm shrink-0"
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>

        {/* Mobile current title */}
        <span className="sm:hidden text-xs font-extrabold text-foreground truncate max-w-[130px]">
          {crumbs[crumbs.length - 1]?.label || "Dashboard"}
        </span>

        <nav className="hidden sm:flex items-center gap-1.5 text-xs font-semibold">
          {crumbs.map((crumb, idx) => {
            const isLast = idx === crumbs.length - 1;
            return (
              <React.Fragment key={crumb.href}>
                {idx > 0 && <ChevronRight size={10} className="text-muted-foreground" />}
                {isLast ? (
                  <span className="text-foreground font-bold">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors">
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* ── RIGHT: GLOBAL ACTIONS & DYNAMIC CONTROLS ── */}
      <div className="flex items-center gap-2.5">
        
        {/* 1. Global Search Shortcut */}
        <button
          onClick={() => {
            if (onSearchClick) onSearchClick();
            window.dispatchEvent(new CustomEvent("open-global-search"));
          }}
          className="hidden md:flex items-center justify-between gap-3 px-3.5 py-1.5 border border-border rounded-full bg-muted/40 hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-all w-52 cursor-pointer group"
        >
          <span className="flex items-center gap-2">
            <Search size={12} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="text-[11px] font-medium">Search workspace...</span>
          </span>
          <kbd className="text-[9px] bg-card px-1.5 py-0.5 rounded-md border border-border font-mono text-muted-foreground">⌘K</kbd>
        </button>

        {/* 2. DYNAMIC DARK / LIGHT MODE TOGGLE BUTTON */}
        <button
          onClick={toggleTheme}
          className={cn(
            "p-2 border rounded-xl transition-all cursor-pointer flex items-center justify-center relative group",
            currentTheme === "dark" 
              ? "border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" 
              : "border-purple-500/20 bg-purple-500/10 text-purple-600 hover:bg-purple-500/20"
          )}
          title={`Switch to ${currentTheme === "dark" ? "Light" : "Dark"} Mode`}
        >
          <motion.div
            key={currentTheme}
            initial={{ scale: 0.5, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {currentTheme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </motion.div>
        </button>

        {/* 3. DYNAMIC NOTIFICATION BELL ICON & DROPDOWN */}
        <div
          className="relative"
          onKeyDown={(e) => {
            if (e.key === "Escape" && notificationsOpen) {
              setNotificationsOpen(false);
            }
          }}
        >
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={cn(
              "relative p-2 border border-border rounded-xl bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer",
              notificationsOpen && "bg-muted border-foreground/20"
            )}
            aria-label="View notifications"
          >
            <Bell size={14} />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-purple-500 text-white font-extrabold text-[9px] flex items-center justify-center ring-2 ring-background shadow-md shadow-purple-500/40"
              >
                {unreadCount}
              </motion.span>
            )}
          </button>

          <AnimatePresence>
            {notificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setNotificationsOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 mt-2.5 w-88 max-w-[calc(100vw-2rem)] border border-border bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl p-4 z-50 overflow-hidden text-xs text-foreground"
                >
                  {/* Header & Global Actions */}
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-1.5">
                      <Zap size={14} className="text-purple-500" />
                      <span className="font-extrabold text-foreground">Workspace Notifications</span>
                      {unreadCount > 0 && (
                        <span className="bg-purple-500/20 text-purple-400 font-extrabold px-1.5 py-0.5 rounded-full text-[9px]">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllRead} 
                          className="text-[10px] text-purple-400 hover:text-purple-300 font-bold uppercase tracking-wider cursor-pointer hover:underline"
                        >
                          Read all
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const testEvents = [
                            { title: "New Lead Logged", desc: "Varun & Priya requested pricing for Goa Concert 2026.", type: "info" as const, href: "/crm" },
                            { title: "UPI Payment Received", desc: "₹85,000 cleared for Invoice #INV-2026-904.", type: "success" as const, href: "/finance" },
                            { title: "Run-of-Show Alert", desc: "Soundcheck completed for Stage 1 Scenography.", type: "warning" as const, href: "/events" },
                          ];
                          const randomEvt = testEvents[Math.floor(Math.random() * testEvents.length)];
                          handleIncomingNotification(randomEvt);
                        }}
                        className="text-[10px] bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer"
                        title="Simulate Real-Time Incoming Notification Alert"
                      >
                        + Test Alert
                      </button>
                    </div>
                  </div>

                  {/* Notification List */}
                  <div className="divide-y divide-border/60 max-h-80 overflow-y-auto mt-1 pr-1">
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          // Mark item as read
                          setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n)));
                          setNotificationsOpen(false);
                          // Determine target route based on notification content
                          if (item.title.includes("Lead") || item.desc.includes("proposal")) window.location.href = "/crm";
                          else if (item.title.includes("Payment") || item.desc.includes("cleared")) window.location.href = "/finance";
                          else if (item.title.includes("Proposal") || item.title.includes("Signed")) window.location.href = "/quotes";
                          else window.location.href = "/dashboard";
                        }}
                        className={cn(
                          "py-3 px-2 flex gap-3 transition-all rounded-xl cursor-pointer group hover:bg-muted/60 relative my-1",
                          item.unread ? "bg-purple-500/5 border border-purple-500/15" : "hover:bg-muted/40"
                        )}
                      >
                        <div
                          className={cn(
                            "h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm",
                            item.type === "success" && "bg-emerald-500/10 text-emerald-500",
                            item.type === "info" && "bg-purple-500/10 text-purple-400",
                            item.type === "warning" && "bg-amber-500/10 text-amber-500",
                            item.type === "error" && "bg-red-500/10 text-red-500"
                          )}
                        >
                          {item.type === "success" && <CheckCircle2 size={13} />}
                          {item.type === "info" && <Activity size={13} />}
                          {item.type === "warning" && <MessageSquare size={13} />}
                          {item.type === "error" && <Zap size={13} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <span className={cn("font-bold block text-foreground truncate text-xs group-hover:text-purple-400 transition-colors", item.unread && "font-black")}>
                              {item.title}
                            </span>
                            <span className="text-[9px] text-muted-foreground shrink-0 font-medium">{item.time}</span>
                          </div>
                          <p className="text-muted-foreground text-[11px] leading-relaxed mt-0.5">{item.desc}</p>
                          <span className="text-[9px] text-purple-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity mt-1 inline-flex items-center gap-1">
                            Click to view details &rarr;
                          </span>
                        </div>
                        {/* Remove Notification Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNotifications((prev) => prev.filter((n) => n.id !== item.id));
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-400 transition-all rounded-md self-start"
                          title="Remove notification"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Zap size={20} className="mx-auto mb-2 opacity-40 text-purple-400" />
                        <p className="font-bold text-xs">All Caught Up!</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">No active notifications in your workspace.</p>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  {notifications.length > 0 && (
                    <div className="border-t border-border pt-2.5 mt-2 flex justify-between items-center text-[10px]">
                      <button
                        onClick={() => setNotifications([])}
                        className="text-muted-foreground hover:text-red-400 transition-colors font-bold cursor-pointer"
                      >
                        Clear All
                      </button>
                      <span className="text-muted-foreground text-[9px]">Click notification to navigate</span>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* 5. DYNAMIC REAL-TIME PRESENCE & CONNECTION STATUS */}
        <div className="flex items-center gap-2">
          {/* Active Online User Count Pill */}
          <div className="hidden lg:flex items-center gap-1.5 bg-card border border-border px-2.5 py-1.5 rounded-full text-[10px] font-bold text-muted-foreground shadow-sm">
            <Users size={11} className="text-purple-400" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{onlineCount} {onlineCount === 1 ? "User Online" : "Users Online"}</span>
          </div>

          {/* WebSocket Status Indicator */}
          <div className={cn(
            "hidden md:flex items-center gap-1.5 px-2.5 py-1.5 border rounded-full text-[10px] font-extrabold select-none transition-all",
            status === "CONNECTED" && "border-emerald-500/20 text-emerald-500 bg-emerald-500/10",
            status === "RECONNECTING" && "border-amber-500/20 text-amber-500 bg-amber-500/10 animate-pulse",
            status === "DISCONNECTED" && "border-red-500/20 text-red-500 bg-red-500/10"
          )}>
            <span className={cn(
              "h-1.5 w-1.5 rounded-full",
              status === "CONNECTED" && "bg-emerald-500",
              status === "RECONNECTING" && "bg-amber-500",
              status === "DISCONNECTED" && "bg-red-500"
            )} />
            <span>{status === "CONNECTED" ? "Live Sync" : status === "RECONNECTING" ? "Reconnecting" : "Offline"}</span>
          </div>
        </div>

      </div>
    </header>
  );
}

