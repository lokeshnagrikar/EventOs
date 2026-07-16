"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Layers,
  FileText,
  DollarSign,
  FileSpreadsheet,
  Calculator,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Command,
  HelpCircle,
  GitBranch,
  Activity,
  TrendingUp,
  Coins,
  Image,
  MessageSquare,
  Database
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onLogout: () => void;
  userName: string;
  className?: string;
}

const MENU_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ai", label: "AI Center", icon: Sparkles },
  { href: "/chat", label: "Workspace Chat", icon: MessageSquare },
  { href: "/crm", label: "CRM / Leads", icon: Users, permission: "VIEW_CRM", roles: ["OWNER", "ADMIN"] },
  { href: "/events", label: "Events / Calendar", icon: Calendar, permission: "VIEW_EVENTS", roles: ["OWNER", "ADMIN", "COORDINATOR"] },
  { href: "/bookings", label: "Bookings", icon: Layers, permission: "VIEW_BOOKINGS", roles: ["OWNER", "ADMIN", "COORDINATOR"] },
  { href: "/quotes", label: "Quotes", icon: FileText, permission: "VIEW_QUOTES", roles: ["OWNER", "ADMIN", "COORDINATOR", "CLIENT"] },
  { href: "/gallery", label: "Media Gallery", icon: Image, permission: "VIEW_GALLERY", roles: ["OWNER", "ADMIN", "COORDINATOR", "CLIENT"] },
  { href: "/finance", label: "Finance Hub", icon: Coins, permission: "VIEW_FINANCE", roles: ["OWNER", "ADMIN"] },
  { href: "/payments", label: "Payments", icon: DollarSign, permission: "VIEW_FINANCE", roles: ["OWNER", "ADMIN"] },
  { href: "/invoices", label: "Invoices", icon: FileSpreadsheet, permission: "VIEW_FINANCE", roles: ["OWNER", "ADMIN"] },
  { href: "/calculator", label: "Budget Calculator", icon: Calculator, permission: "VIEW_FINANCE", roles: ["OWNER", "ADMIN", "COORDINATOR"] },
  { href: "/reports", label: "Reports & Analytics", icon: TrendingUp, permission: "VIEW_REPORTS", roles: ["OWNER", "ADMIN"] },
  { href: "/automation", label: "Smart Automation", icon: GitBranch, permission: "MANAGE_AUTOMATION", roles: ["OWNER", "ADMIN"] },
  { href: "/activity", label: "Activity Logs", icon: Activity, permission: "VIEW_LOGS", roles: ["OWNER", "ADMIN"] },
  { href: "/import", label: "Import Data", icon: Database, permission: "VIEW_LOGS", roles: ["OWNER", "ADMIN"] },
  { href: "/developer", label: "Developer Center", icon: Command },
  { href: "/help", label: "Help Center", icon: HelpCircle },
];

export default function Sidebar({ isCollapsed, setIsCollapsed, onLogout, userName, className }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userRole = user?.role || "CLIENT";
  const userPermissions = user?.permissions || [];

  const activeRole = mounted ? userRole : "CLIENT";
  const activePermissions = mounted ? userPermissions : [];

  const filteredMenuItems = MENU_ITEMS.filter((item) => {
    // If no permission and roles specified, it is a public sidebar node
    const anyItem = item as any;
    if (!anyItem.permission && !anyItem.roles) return true;

    // Check role access
    if (anyItem.roles && anyItem.roles.includes(activeRole)) return true;

    // Check granular permission access
    if (anyItem.permission && activePermissions.includes(anyItem.permission)) return true;

    return false;
  });

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 76 : 256 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex flex-col justify-between shrink-0 border-r border-border bg-card/75 backdrop-blur-md sticky top-0 h-screen z-40 select-none overflow-hidden shadow-[4px_0_30px_rgba(0,0,0,0.1)]",
        className
      )}
    >
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Brand Header */}
        <div className="h-16 border-b border-border px-4 flex items-center justify-between shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-500 via-pink-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-purple-500/20 active:scale-95 transition-all">
              <Sparkles size={16} className="text-white" />
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col"
              >
                <h1 className="font-extrabold text-sm text-foreground tracking-tight leading-none">EventOS</h1>
                <span className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mt-1">Enterprise</span>
              </motion.div>
            )}
          </Link>
 
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="h-7 w-7 rounded-lg bg-background/60 hover:bg-muted border border-border text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={14} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav data-lenis-prevent role="navigation" aria-label="Main navigation" className="flex-1 overflow-y-auto p-3 space-y-1.5 mt-4 scrollbar-none hover:scrollbar-thin">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
                  isActive
                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/45 border border-transparent"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={18} className={cn("shrink-0", isActive ? "text-purple-400" : "text-muted-foreground group-hover:text-foreground")} />
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
                {isCollapsed && (
                  <div className="absolute left-[72px] bg-card border border-border text-foreground text-[10px] font-bold px-2 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 delay-100 whitespace-nowrap shadow-xl z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls */}
      <div className="p-3 border-t border-border space-y-2">
        {/* Toggle Button when Collapsed */}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-full h-9 rounded-xl bg-background/60 hover:bg-muted border border-border text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer mb-2"
            aria-label="Expand sidebar"
          >
            <ChevronRight size={14} />
          </button>
        )}

        {/* User Session Info Card */}
        <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center px-1" : "px-3 py-2 rounded-xl bg-muted/20 border border-border/40")}>
          <div className="relative shrink-0 select-none">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 border border-white/[0.08] flex items-center justify-center text-[11px] font-extrabold text-white shadow-md shadow-purple-900/10">
              {userName ? userName.charAt(0).toUpperCase() : "U"}
            </div>
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-[1.5px] ring-background animate-pulse" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 min-w-0 text-left"
            >
              <p className="text-[11px] font-bold text-foreground truncate">{userName}</p>
              <p className="text-[9px] text-muted-foreground font-medium truncate">Admin Console</p>
            </motion.div>
          )}
        </div>

        {/* Settings and Logout Buttons */}
        <div className={cn("flex gap-1.5", isCollapsed ? "flex-col items-center" : "justify-between")}>
          <Link
            href="/settings"
            className={cn(
              "flex items-center justify-center h-8 rounded-lg bg-background/60 hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition-all cursor-pointer",
              isCollapsed ? "w-8" : "flex-1 text-xs gap-1.5 font-bold"
            )}
            title="Settings"
          >
            <Settings size={14} />
            {!isCollapsed && <span>Settings</span>}
          </Link>

          <button
            onClick={onLogout}
            className={cn(
              "flex items-center justify-center h-8 rounded-lg bg-background/60 hover:bg-red-500/10 hover:border-red-500/20 text-muted-foreground hover:text-red-500 border border-border transition-all cursor-pointer",
              isCollapsed ? "w-8" : "flex-1 text-xs gap-1.5 font-bold"
            )}
            title="Logout"
          >
            <LogOut size={14} />
            {!isCollapsed && <span>Log Out</span>}
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
