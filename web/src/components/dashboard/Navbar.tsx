"use client";

import React, { useState, useEffect } from "react";
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
  DollarSign, 
  MessageSquare,
  Globe,
  Sun,
  Moon,
  Palette,
  Laptop,

  Wifi,
  WifiOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSocket } from "@/context/SocketContext";

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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<"dark" | "light">("dark");
  const [colorTheme, setColorTheme] = useState<string>("violet");
  const [colorsOpen, setColorsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: "1", title: "New Lead Logged", desc: "Varun Mehta requested a quote for a Corporate Gala.", time: "10 mins ago", unread: true, type: "info" },
    { id: "2", title: "Payment Received", desc: "INR 85,000 cleared for booking #EV-2026-902.", time: "2 hours ago", unread: true, type: "success" },
    { id: "3", title: "Contract Signed", desc: "Shreya & Kabir finalized the Wedding planner agreement.", time: "1 day ago", unread: false, type: "success" },
  ]);

  useEffect(() => {
    // Detect theme class on load
    const activeTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setCurrentTheme(activeTheme);

    // Detect and apply color theme on load
    const savedColor = localStorage.getItem("colorTheme") || "violet";
    setColorTheme(savedColor);
    if (savedColor !== "violet") {
      document.documentElement.setAttribute("data-theme", savedColor);
    }

    // Sync theme when updated from settings page

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<"dark" | "light" | "system">;
      let newTheme = customEvent.detail;
      if (newTheme === "system") {
        newTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      setCurrentTheme(newTheme as "dark" | "light");
    };

    // Listen to add-notification event for real-time alerts
    const handleAddNotification = (e: Event) => {
      const customEvent = e as CustomEvent<Omit<NotificationItem, "id" | "time" | "unread">>;
      if (customEvent.detail) {
        const newNotif: NotificationItem = {
          id: Math.random().toString(36).substring(7),
          title: customEvent.detail.title,
          desc: customEvent.detail.desc,
          time: "Just now",
          unread: true,
          type: customEvent.detail.type || "info"
        };
        setNotifications((prev) => [newNotif, ...prev]);
      }
    };

    // Subscribe to websocket notifications topic
    let unsubscribeNotifs: (() => void) | null = null;
    if (status === "CONNECTED") {
      unsubscribeNotifs = subscribe("/topic/notifications", (payload: any) => {
        const newNotif: NotificationItem = {
          id: Math.random().toString(36).substring(7),
          title: payload.title || "Real-time Notification",
          desc: payload.desc || payload.message || "New activity logged in workspace",
          time: "Just now",
          unread: true,
          type: payload.type || "info"
        };
        setNotifications((prev) => [newNotif, ...prev]);
      });
    }

    window.addEventListener("theme-changed", handleThemeChange);
    window.addEventListener("add-notification", handleAddNotification);
    return () => {
      window.removeEventListener("theme-changed", handleThemeChange);
      window.removeEventListener("add-notification", handleAddNotification);
      if (unsubscribeNotifs) unsubscribeNotifs();
    };
  }, [status]);

  const toggleTheme = () => {
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    setCurrentTheme(newTheme);
    document.cookie = `theme=${newTheme}; path=/; SameSite=Lax; max-age=31536000`;
    
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }

    // Sync other components
    window.dispatchEvent(new CustomEvent("theme-changed", { detail: newTheme }));
  };

  const handleColorChange = (color: string) => {
    setColorTheme(color);
    localStorage.setItem("colorTheme", color);
    if (color === "violet") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", color);
    }
    setColorsOpen(false);
  };


  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
  };

  // Convert pathname "/crm/new" to ["Dashboard", "CRM", "Log New Lead"]
  const getBreadcrumbs = () => {
    const parts = pathname.split("/").filter(Boolean);
    const crumbs = [{ label: "Dashboard", href: "/dashboard" }];
    
    parts.forEach((part, idx) => {
      if (part === "dashboard") return;
      
      let label = part.toUpperCase();
      if (part === "crm") label = "CRM";
      if (part === "new") label = "Log New Lead";
      if (part === "calculator") label = "Budget Calculator";
      
      const href = "/" + parts.slice(0, idx + 1).join("/");
      crumbs.push({ label, href });
    });
    
    return crumbs;
  };

  const crumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-border bg-background/80 backdrop-blur-md px-6 flex items-center justify-between transition-colors shadow-sm">
      
      {/* Breadcrumbs / Back button */}
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onMenuToggle}
          className="p-2 border border-border rounded-xl hover:bg-muted md:hidden text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu size={16} />
        </button>

        {/* Dynamic Breadcrumbs */}
        <nav className="hidden sm:flex items-center gap-1.5 text-xs font-semibold select-none">
          {crumbs.map((crumb, idx) => {
            const isLast = idx === crumbs.length - 1;
            return (
              <React.Fragment key={crumb.href}>
                {idx > 0 && <ChevronRight size={10} className="text-zinc-600" />}
                {isLast ? (
                  <span className="text-zinc-200">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="text-zinc-500 hover:text-zinc-350 transition-colors">
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-3">
        {/* Search Shortcut */}
        <button
          onClick={() => {
            if (onSearchClick) onSearchClick();
            window.dispatchEvent(new CustomEvent("open-global-search"));
          }}
          className="hidden md:flex items-center justify-between gap-3 px-3 py-1.5 border border-border rounded-xl bg-background/40 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-all w-52 select-none cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Search size={13} />
            Search Command...
          </span>
          <kbd className="text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border font-mono text-muted-foreground">⌘K</kbd>
        </button>

        <button
          onClick={() => {
            if (onSearchClick) onSearchClick();
            window.dispatchEvent(new CustomEvent("open-global-search"));
          }}
          className="p-2 border border-border hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground md:hidden transition-all cursor-pointer"
          title="Search"
        >
          <Search size={14} />
        </button>

        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 border border-border rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          aria-label="Toggle theme mode"
          title={`Switch to ${currentTheme === "dark" ? "light" : "dark"} mode`}
        >
          {currentTheme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Color Theme Picker */}
        <div className="relative">
          <button
            onClick={() => setColorsOpen(!colorsOpen)}
            className={cn(
              "p-2 border border-border rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer flex items-center justify-center",
              colorsOpen && "bg-muted border-border"
            )}
            title="Change color theme"
          >
            <Palette size={14} className={cn(
              colorTheme === "blue" && "text-blue-500",
              colorTheme === "emerald" && "text-emerald-500",
              colorTheme === "rose" && "text-rose-500",
              colorTheme === "amber" && "text-amber-500",
              colorTheme === "violet" && "text-purple-500"
            )} />
          </button>
          
          <AnimatePresence>
            {colorsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 mt-2 w-36 bg-card border border-border rounded-xl p-2.5 shadow-2xl z-50 flex flex-col gap-1.5 text-xs text-foreground"
              >
                <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block px-1 select-none mb-0.5">Colors</span>
                <button onClick={() => handleColorChange("violet")} className="flex items-center gap-2 px-1.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors w-full text-left">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 block shrink-0" />
                  Violet (Default)
                </button>
                <button onClick={() => handleColorChange("blue")} className="flex items-center gap-2 px-1.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors w-full text-left">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block shrink-0" />
                  Blue
                </button>
                <button onClick={() => handleColorChange("emerald")} className="flex items-center gap-2 px-1.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors w-full text-left">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block shrink-0" />
                  Emerald
                </button>
                <button onClick={() => handleColorChange("rose")} className="flex items-center gap-2 px-1.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors w-full text-left">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block shrink-0" />
                  Rose
                </button>
                <button onClick={() => handleColorChange("amber")} className="flex items-center gap-2 px-1.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors w-full text-left">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block shrink-0" />
                  Amber
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        {/* Notifications Icon with Dropdown */}
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
              "relative p-2 border border-border rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer",
              notificationsOpen && "bg-muted border-border"
            )}
            aria-label="View notifications"
            aria-expanded={notificationsOpen}
            aria-haspopup="true"
          >
            <Bell size={14} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-purple-500 ring-2 ring-background animate-pulse" />
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
                  className="absolute right-0 mt-2.5 w-80 max-w-[calc(100vw-2rem)] border border-border bg-card/90 backdrop-blur-xl rounded-2xl shadow-2xl p-4 z-50 overflow-hidden text-xs"
                  role="dialog"
                  aria-label="Notifications panel"
                >
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="font-extrabold text-foreground">System Activity notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllRead} 
                        className="text-[10px] text-purple-400 hover:text-purple-300 font-bold tracking-wide uppercase cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-border max-h-64 overflow-y-auto">
                    {notifications.map((item) => (
                      <div key={item.id} className={cn("py-3 flex gap-3 transition-colors", item.unread && "bg-muted/30")}>
                        <div className={cn(
                          "h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                          item.type === "success" && "bg-emerald-500/10 text-emerald-500",
                          item.type === "info" && "bg-purple-500/10 text-purple-400",
                          item.type === "warning" && "bg-amber-500/10 text-amber-500",
                        )}>
                          {item.type === "success" && <CheckCircle2 size={12} />}
                          {item.type === "info" && <Activity size={12} />}
                          {item.type === "warning" && <MessageSquare size={12} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <span className={cn("font-bold block text-foreground truncate", item.unread && "text-foreground")}>{item.title}</span>
                            <span className="text-[9px] text-muted-foreground shrink-0 font-medium whitespace-nowrap">{item.time}</span>
                          </div>
                          <p className="text-muted-foreground text-[11px] leading-normal mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <p className="text-center py-6 text-muted-foreground italic">All notifications caught up.</p>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>        {/* Real-time Presence Bar & Connection Status */}
        <div className="flex items-center gap-2">
          {/* Active Users presence avatars count */}
          <div className="hidden lg:flex items-center gap-1 bg-background/20 border border-border px-2.5 py-1 rounded-xl text-[10px] font-bold text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
            <span>{activeUsers.length} Online</span>
          </div>
 
          <div className={cn(
            "hidden md:flex items-center gap-1.5 px-3 py-1.5 border rounded-xl bg-background/40 text-[10px] font-bold select-none",
            status === "CONNECTED" && "border-emerald-500/20 text-emerald-500 bg-emerald-500/5",
            status === "RECONNECTING" && "border-amber-500/20 text-amber-500 bg-amber-500/5 animate-pulse",
            status === "DISCONNECTED" && "border-red-500/20 text-red-500 bg-red-500/5"
          )}>
            <span className={cn(
              "h-1.5 w-1.5 rounded-full",
              status === "CONNECTED" && "bg-emerald-500",
              status === "RECONNECTING" && "bg-amber-500",
              status === "DISCONNECTED" && "bg-red-500"
            )} />
            <span>{status === "CONNECTED" ? "Live Connected" : status === "RECONNECTING" ? "Reconnecting" : "Offline"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

