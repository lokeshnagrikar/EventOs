"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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
  Users,
  CreditCard,
  FileText,
  Calendar,
  DollarSign,
  CheckCheck,
  Filter,
  ArrowRight,
  Clock,
  Trash2,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useSocket } from "@/context/SocketContext";
import { useToastStore } from "@/lib/toastStore";
import { useAuthStore } from "@/store/authStore";

interface NavbarProps {
  onMenuToggle: () => void;
  onSearchClick: () => void;
}

export interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  timestamp: number;
  unread: boolean;
  type: "info" | "success" | "warning" | "error";
  href: string;
  category: "lead" | "quote" | "event" | "payment" | "system";
}

function formatRelativeTime(dateStrOrTs?: string | number | Date): string {
  if (!dateStrOrTs) return "Just now";
  try {
    const date = typeof dateStrOrTs === "number" ? new Date(dateStrOrTs) : new Date(dateStrOrTs);
    const now = Date.now();
    const diffMs = now - date.getTime();
    if (isNaN(diffMs) || diffMs < 0) return "Just now";
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 45) return "Just now";
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  } catch {
    return "Recent";
  }
}

export default function Navbar({ onMenuToggle, onSearchClick }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, subscribe, activeUsers } = useSocket();
  const { addToast } = useToastStore();
  const { user, activeTenantId } = useAuthStore();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<"dark" | "light">("dark");
  const [filterTab, setFilterTab] = useState<"all" | "unread">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dynamic notification items list
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

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

  // 2. Fetch real dynamic workspace activities from backend
  const fetchWorkspaceNotifications = useCallback(async () => {
    if (!activeTenantId && !user) return;
    setIsRefreshing(true);

    try {
      // Local storage read & dismissed tracking
      const storageKeyRead = `eventos_notifs_read_${activeTenantId || "default"}`;
      const storageKeyDismissed = `eventos_notifs_dismissed_${activeTenantId || "default"}`;
      const readIds = new Set<string>(JSON.parse(localStorage.getItem(storageKeyRead) || "[]"));
      const dismissedIds = new Set<string>(JSON.parse(localStorage.getItem(storageKeyDismissed) || "[]"));

      // Fetch CRM Leads, Quotes, Events, and Invoices in parallel
      const [leadsRes, quotesRes, eventsRes, invoicesRes] = await Promise.allSettled([
        api.get("/crm/leads"),
        api.get("/crm/quotes"),
        api.get("/events"),
        api.get("/events/invoices"),
      ]);

      const dynamicList: NotificationItem[] = [];

      // 1. Process Live Leads
      if (leadsRes.status === "fulfilled" && Array.isArray(leadsRes.value.data?.data)) {
        leadsRes.value.data.data.slice(0, 4).forEach((lead: any) => {
          const id = `lead-${lead.id}`;
          if (dismissedIds.has(id)) return;
          const ts = lead.createdAt ? new Date(lead.createdAt).getTime() : Date.now() - 1000 * 60 * 20;
          const budgetFormatted = lead.budget ? ` · ₹${Number(lead.budget).toLocaleString("en-IN")}` : "";
          dynamicList.push({
            id,
            title: `New Lead: ${lead.name || "Inquiry"}`,
            desc: `${lead.eventType || "Event inquiry"}${budgetFormatted} requested via portal.`,
            time: formatRelativeTime(ts),
            timestamp: ts,
            unread: !readIds.has(id),
            type: "info",
            href: "/crm",
            category: "lead",
          });
        });
      }

      // 2. Process Live Quotes
      if (quotesRes.status === "fulfilled" && Array.isArray(quotesRes.value.data?.data)) {
        quotesRes.value.data.data.slice(0, 4).forEach((quote: any) => {
          const id = `quote-${quote.id}`;
          if (dismissedIds.has(id)) return;
          const ts = quote.createdAt ? new Date(quote.createdAt).getTime() : Date.now() - 1000 * 60 * 60;
          const isApproved = quote.status === "APPROVED" || quote.status === "ACCEPTED" || quote.status === "SIGNED";
          dynamicList.push({
            id,
            title: `Proposal #${quote.quoteNumber || "QT"} ${quote.status || "Draft"}`,
            desc: `${quote.clientName || "Client"} · ₹${Number(quote.totalAmount || 0).toLocaleString("en-IN")}`,
            time: formatRelativeTime(ts),
            timestamp: ts,
            unread: !readIds.has(id),
            type: isApproved ? "success" : "warning",
            href: "/quotes",
            category: "quote",
          });
        });
      }

      // 3. Process Live Events
      if (eventsRes.status === "fulfilled" && Array.isArray(eventsRes.value.data?.data)) {
        eventsRes.value.data.data.slice(0, 4).forEach((evt: any) => {
          const id = `event-${evt.id}`;
          if (dismissedIds.has(id)) return;
          const ts = evt.createdAt ? new Date(evt.createdAt).getTime() : Date.now() - 1000 * 60 * 120;
          dynamicList.push({
            id,
            title: `Operational Event: ${evt.name}`,
            desc: `${evt.venue || "Venue Assigned"} · ${evt.startDate ? new Date(evt.startDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Scheduled"}`,
            time: formatRelativeTime(ts),
            timestamp: ts,
            unread: !readIds.has(id),
            type: "info",
            href: "/events",
            category: "event",
          });
        });
      }

      // 4. Process Live Invoices
      if (invoicesRes.status === "fulfilled" && Array.isArray(invoicesRes.value.data?.data)) {
        invoicesRes.value.data.data.slice(0, 3).forEach((inv: any) => {
          const id = `inv-${inv.id}`;
          if (dismissedIds.has(id)) return;
          const ts = inv.createdAt ? new Date(inv.createdAt).getTime() : Date.now() - 1000 * 60 * 180;
          const isPaid = inv.status === "PAID";
          dynamicList.push({
            id,
            title: `Invoice #${inv.invoiceNumber || "INV"} ${inv.status || "PENDING"}`,
            desc: `₹${Number(inv.amount || 0).toLocaleString("en-IN")} · ${isPaid ? "Payment cleared via UPI" : "Payment milestone pending"}`,
            time: formatRelativeTime(ts),
            timestamp: ts,
            unread: !readIds.has(id),
            type: isPaid ? "success" : "warning",
            href: "/finance",
            category: "payment",
          });
        });
      }

      // Fallback: If tenant is fresh / brand new with no records, provide real workspace onboarding status
      if (dynamicList.length === 0) {
        const defaultNotifs: NotificationItem[] = [
          {
            id: "sys-workspace-ready",
            title: "Workspace Engine Active",
            desc: "Your EventOS tenancy is configured and ready for live clients.",
            time: "Just now",
            timestamp: Date.now(),
            unread: !readIds.has("sys-workspace-ready"),
            type: "success",
            href: "/dashboard",
            category: "system",
          },
          {
            id: "sys-billing-ready",
            title: "Payment Gateway Initialized",
            desc: "Stripe & UPI gateways active in ₹ INR for automated bookings.",
            time: "1 hour ago",
            timestamp: Date.now() - 3600000,
            unread: !readIds.has("sys-billing-ready"),
            type: "info",
            href: "/settings",
            category: "payment",
          }
        ];
        defaultNotifs.forEach((d) => {
          if (!dismissedIds.has(d.id)) dynamicList.push(d);
        });
      }

      // Sort newest first
      dynamicList.sort((a, b) => b.timestamp - a.timestamp);
      setNotifications(dynamicList);
    } catch (err) {
      console.warn("Failed to load dynamic workspace notifications:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [activeTenantId, user]);

  // Trigger initial fetch when active workspace loads
  useEffect(() => {
    fetchWorkspaceNotifications();
  }, [fetchWorkspaceNotifications]);

  // 3. Real-Time Notification & Toast Handler
  const handleIncomingNotification = useCallback((data: { title: string; desc: string; type?: "info" | "success" | "warning" | "error"; href?: string; category?: any }) => {
    const notifId = `rt-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const newNotif: NotificationItem = {
      id: notifId,
      title: data.title || "Real-Time Activity",
      desc: data.desc || "New event logged in EventOS workspace",
      time: "Just now",
      timestamp: Date.now(),
      unread: true,
      type: data.type || "info",
      href: data.href || "/dashboard",
      category: data.category || "system"
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
      const customEvent = e as CustomEvent<{ title: string; desc: string; type?: "info" | "success" | "warning" | "error"; href?: string; category?: any }>;
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
          type: payload.type || "info",
          href: payload.href || "/dashboard",
          category: payload.category || "system"
        });
      });
    }

    return () => {
      window.removeEventListener("add-notification", handleAddNotification);
      window.removeEventListener("theme-changed", handleThemeChange);
      if (unsubscribeNotifs) unsubscribeNotifs();
    };
  }, [status, subscribe, handleIncomingNotification]);

  // 4. Dynamic Theme Toggle Function
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
    addToast(`Switched to ${nextTheme.toUpperCase()} mode`, "info", { duration: 2500 });
  };

  // Mark all notifications read
  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    const storageKeyRead = `eventos_notifs_read_${activeTenantId || "default"}`;
    const allIds = notifications.map((n) => n.id);
    localStorage.setItem(storageKeyRead, JSON.stringify(allIds));
    addToast("All workspace notifications marked as read", "info", { duration: 2000 });
  };

  // Mark single item read & navigate
  const handleItemClick = (item: NotificationItem) => {
    setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n)));
    const storageKeyRead = `eventos_notifs_read_${activeTenantId || "default"}`;
    const existing = JSON.parse(localStorage.getItem(storageKeyRead) || "[]");
    if (!existing.includes(item.id)) {
      localStorage.setItem(storageKeyRead, JSON.stringify([...existing, item.id]));
    }
    setNotificationsOpen(false);
    router.push(item.href || "/dashboard");
  };

  // Dismiss single notification
  const handleDismissItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const storageKeyDismissed = `eventos_notifs_dismissed_${activeTenantId || "default"}`;
    const existing = JSON.parse(localStorage.getItem(storageKeyDismissed) || "[]");
    if (!existing.includes(id)) {
      localStorage.setItem(storageKeyDismissed, JSON.stringify([...existing, id]));
    }
  };

  // Clear all notifications
  const handleClearAll = () => {
    const storageKeyDismissed = `eventos_notifs_dismissed_${activeTenantId || "default"}`;
    const allIds = notifications.map((n) => n.id);
    localStorage.setItem(storageKeyDismissed, JSON.stringify(allIds));
    setNotifications([]);
    addToast("Cleared all workspace notifications", "info", { duration: 2000 });
  };

  const unreadCount = notifications.filter((n) => n.unread).length;
  const filteredNotifications = useMemo(() => {
    if (filterTab === "unread") return notifications.filter((n) => n.unread);
    return notifications;
  }, [notifications, filterTab]);

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
    <header className="sticky top-0 z-40 h-[60px] w-full border-b border-border bg-card/95 backdrop-blur-2xl px-5 flex items-center justify-between shadow-[0_1px_0_rgba(255,255,255,0.03)] transition-colors select-none">
      
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
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              if (!notificationsOpen) {
                fetchWorkspaceNotifications();
              }
            }}
            className={cn(
              "relative p-2 border border-border rounded-xl bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer",
              notificationsOpen && "bg-muted border-foreground/20 text-foreground"
            )}
            aria-label="View notifications"
          >
            <Bell size={14} />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-purple-600 text-white font-black text-[9px] flex items-center justify-center ring-2 ring-background shadow-md shadow-purple-600/40"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </button>

          <AnimatePresence>
            {notificationsOpen && (
              <>
                {/* Backdrop dismiss overlay */}
                <div 
                  className="fixed inset-0 z-50 bg-black/20" 
                  aria-hidden="true" 
                  onClick={() => setNotificationsOpen(false)} 
                />
                
                {/* Dropdown Container: SOLID OPAQUE bg-zinc-950 to prevent transparency bleed */}
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 mt-2.5 w-[390px] max-w-[calc(100vw-1.5rem)] border border-zinc-800 bg-zinc-950 text-zinc-100 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] ring-1 ring-white/10 z-[60] overflow-hidden text-xs flex flex-col"
                >
                  {/* Top Bar Header */}
                  <div className="bg-zinc-900/90 border-b border-zinc-800/80 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                        <Zap size={13} />
                      </div>
                      <span className="font-extrabold text-sm text-zinc-100 tracking-tight">Workspace Feed</span>
                      {unreadCount > 0 && (
                        <span className="bg-purple-500/20 text-purple-400 font-extrabold px-2 py-0.5 rounded-full text-[10px] tabular-nums border border-purple-500/30">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      {/* Refresh Button */}
                      <button
                        onClick={fetchWorkspaceNotifications}
                        disabled={isRefreshing}
                        className={cn(
                          "p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-lg transition-colors cursor-pointer",
                          isRefreshing && "animate-spin text-purple-400"
                        )}
                        title="Sync latest notifications"
                      >
                        <RefreshCw size={12} />
                      </button>

                      {/* Test Alert Simulator */}
                      <button
                        onClick={() => {
                          const testEvents = [
                            { title: "New Lead Logged", desc: "Varun & Priya requested pricing for Goa Gala 2026 (₹4,50,000).", type: "info" as const, href: "/crm", category: "lead" },
                            { title: "UPI Payment Received", desc: "₹85,000 advance cleared for Invoice #INV-2026-904.", type: "success" as const, href: "/finance", category: "payment" },
                            { title: "Run-of-Show Alert", desc: "Soundcheck completed for Taj Palace Ballroom 1.", type: "warning" as const, href: "/events", category: "event" },
                            { title: "Proposal E-Signed", desc: "Client accepted and e-signed Proposal #QT-2026-118.", type: "success" as const, href: "/quotes", category: "quote" },
                          ];
                          const randomEvt = testEvents[Math.floor(Math.random() * testEvents.length)];
                          handleIncomingNotification(randomEvt);
                        }}
                        className="text-[10px] bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 px-2 py-1 rounded-lg font-bold transition-all cursor-pointer"
                        title="Simulate Real-Time Incoming Notification Alert"
                      >
                        + Test Alert
                      </button>
                    </div>
                  </div>

                  {/* Filter Tabs & Mark Read Bar */}
                  <div className="px-4 py-2 bg-zinc-950/80 border-b border-zinc-800/60 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1 bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800/80">
                      <button
                        onClick={() => setFilterTab("all")}
                        className={cn(
                          "px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer",
                          filterTab === "all" ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                        )}
                      >
                        All ({notifications.length})
                      </button>
                      <button
                        onClick={() => setFilterTab("unread")}
                        className={cn(
                          "px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer",
                          filterTab === "unread" ? "bg-purple-600/30 text-purple-200 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                        )}
                      >
                        Unread ({unreadCount})
                      </button>
                    </div>

                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllRead} 
                        className="text-[10px] text-purple-400 hover:text-purple-300 font-bold tracking-wider cursor-pointer hover:underline inline-flex items-center gap-1"
                      >
                        <CheckCheck size={11} />
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Notification Items List */}
                  <div className="divide-y divide-zinc-800/60 max-h-[350px] overflow-y-auto pr-0.5 bg-zinc-950">
                    {filteredNotifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className={cn(
                          "p-3.5 flex gap-3 transition-all cursor-pointer group hover:bg-zinc-900/80 relative border-l-2",
                          item.unread 
                            ? "bg-purple-950/20 border-l-purple-500" 
                            : "border-l-transparent hover:border-l-zinc-700 opacity-90 hover:opacity-100"
                        )}
                      >
                        {/* Category Icon Badge */}
                        <div
                          className={cn(
                            "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border shadow-sm",
                            item.category === "lead" && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                            item.category === "payment" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                            item.category === "quote" && "bg-purple-500/10 text-purple-400 border-purple-500/20",
                            item.category === "event" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                            item.category === "system" && "bg-zinc-800 text-zinc-300 border-zinc-700"
                          )}
                        >
                          {item.category === "lead" && <Users size={14} />}
                          {item.category === "payment" && <CreditCard size={14} />}
                          {item.category === "quote" && <FileText size={14} />}
                          {item.category === "event" && <Calendar size={14} />}
                          {item.category === "system" && <Zap size={14} />}
                        </div>

                        {/* Text Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <span className={cn(
                              "text-xs block text-zinc-100 truncate group-hover:text-purple-400 transition-colors",
                              item.unread ? "font-black text-white" : "font-semibold text-zinc-200"
                            )}>
                              {item.title}
                            </span>
                            <span className="text-[10px] text-zinc-500 shrink-0 font-medium whitespace-nowrap">
                              {item.time}
                            </span>
                          </div>
                          
                          <p className="text-zinc-400 text-[11px] leading-relaxed mt-0.5 line-clamp-2">
                            {item.desc}
                          </p>

                          <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] text-purple-400 font-bold inline-flex items-center gap-1">
                              Open module <ArrowRight size={10} />
                            </span>
                          </div>
                        </div>

                        {/* Dismiss Single Item Button */}
                        <button
                          onClick={(e) => handleDismissItem(e, item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-md transition-all self-start"
                          title="Dismiss notification"
                        >
                          &times;
                        </button>
                      </div>
                    ))}

                    {/* Empty State */}
                    {filteredNotifications.length === 0 && (
                      <div className="text-center py-10 px-4">
                        <div className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-2.5 text-zinc-500">
                          <Zap size={18} className="text-purple-400 opacity-60" />
                        </div>
                        <p className="font-bold text-xs text-zinc-200">All Caught Up!</p>
                        <p className="text-[11px] text-zinc-500 mt-1 max-w-[220px] mx-auto">
                          {filterTab === "unread" 
                            ? "No unread alerts in this workspace." 
                            : "No new activity logged in your workspace."}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="border-t border-zinc-800/80 bg-zinc-900/60 px-4 py-2.5 flex justify-between items-center text-[10px]">
                    {notifications.length > 0 ? (
                      <button
                        onClick={handleClearAll}
                        className="text-zinc-400 hover:text-red-400 transition-colors font-bold cursor-pointer inline-flex items-center gap-1"
                      >
                        <Trash2 size={11} />
                        Clear All
                      </button>
                    ) : (
                      <span className="text-zinc-500 font-medium">Workspace Feed Empty</span>
                    )}

                    <span className="text-zinc-500 text-[10px] flex items-center gap-1.5 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Feed
                    </span>
                  </div>
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


