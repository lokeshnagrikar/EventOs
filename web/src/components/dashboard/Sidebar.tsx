"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { EventOsLogo } from "@/components/ui/EventOsLogo";
import { motion, AnimatePresence } from "framer-motion";
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
  Database,
  Shield,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onLogout: () => void;
  userName: string;
  className?: string;
}

const MENU_SECTIONS = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/ai", label: "AI Center", icon: Sparkles },
      { href: "/chat", label: "Workspace Chat", icon: MessageSquare },
      { href: "/activity", label: "Activity Logs", icon: Activity, permission: "VIEW_LOGS", roles: ["OWNER", "ADMIN", "MANAGER"] },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/crm", label: "CRM / Leads", icon: Users, permission: "VIEW_CRM", roles: ["OWNER", "ADMIN", "MANAGER"] },
      { href: "/events", label: "Events / Calendar", icon: Calendar, permission: "VIEW_EVENTS", roles: ["OWNER", "ADMIN", "MANAGER", "COORDINATOR"] },
      { href: "/bookings", label: "Bookings", icon: Layers, permission: "VIEW_BOOKINGS", roles: ["OWNER", "ADMIN", "MANAGER", "COORDINATOR"] },
      { href: "/gallery", label: "Media Gallery", icon: Image, permission: "VIEW_GALLERY", roles: ["OWNER", "ADMIN", "MANAGER", "COORDINATOR", "CLIENT"] },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/quotes", label: "Quotes", icon: FileText, permission: "VIEW_QUOTES", roles: ["OWNER", "ADMIN", "MANAGER", "COORDINATOR", "FINANCE"] },
      { href: "/finance", label: "Finance Hub", icon: Coins, permission: "VIEW_FINANCE", roles: ["OWNER", "ADMIN", "FINANCE"] },
      { href: "/payments", label: "Payments", icon: DollarSign, permission: "VIEW_FINANCE", roles: ["OWNER", "ADMIN", "FINANCE"] },
      { href: "/invoices", label: "Invoices", icon: FileSpreadsheet, permission: "VIEW_FINANCE", roles: ["OWNER", "ADMIN", "FINANCE"] },
      { href: "/calculator", label: "Budget Calculator", icon: Calculator, permission: "VIEW_FINANCE", roles: ["OWNER", "ADMIN", "MANAGER", "COORDINATOR", "FINANCE"] },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/reports", label: "Reports & Analytics", icon: TrendingUp, permission: "VIEW_REPORTS", roles: ["OWNER", "ADMIN", "MANAGER", "FINANCE"] },
      { href: "/automation", label: "Smart Automation", icon: GitBranch, permission: "MANAGE_AUTOMATION", roles: ["OWNER", "ADMIN"] },
      { href: "/import", label: "Import Data", icon: Database, permission: "VIEW_LOGS", roles: ["OWNER", "ADMIN"] },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/superadmin", label: "Super Admin", icon: Shield, roles: ["SUPER_ADMIN"] },
      { href: "/developer", label: "Developer Center", icon: Command },
      { href: "/help", label: "Help Center", icon: HelpCircle },
    ],
  },
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

  const isItemVisible = (item: any) => {
    // SuperAdmin link is exclusive to SUPER_ADMIN role
    if (item.href === "/superadmin") {
      return activeRole === "SUPER_ADMIN";
    }
    // SuperAdmin and Workspace Owner have unrestricted clearance across workspace tools
    if (activeRole === "SUPER_ADMIN" || activeRole === "OWNER") return true;

    if (!item.permission && !item.roles) return true;
    if (item.roles && item.roles.includes(activeRole)) return true;
    if (item.permission && activePermissions.includes(item.permission)) return true;
    return false;
  };

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 72 : 252 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex flex-col justify-between shrink-0 border-r sticky top-0 h-screen z-40 select-none overflow-hidden transition-colors duration-200",
        "border-slate-200/80 dark:border-white/[0.05]",
        "bg-white/95 dark:bg-[#09090b]/90 backdrop-blur-2xl shadow-[1px_0_15px_rgba(0,0,0,0.03)] dark:shadow-[1px_0_0_rgba(255,255,255,0.03)]",
        className
      )}
    >
      {/* Inner gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.03] dark:from-purple-500/[0.02] via-transparent to-transparent pointer-events-none" />

      <div className="flex flex-col flex-1 min-h-0 overflow-hidden relative">
        {/* Brand Header */}
        <div className="h-[60px] border-b border-slate-200/60 dark:border-white/[0.04] px-4 flex items-center justify-between shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
            {/* Logo mark */}
            <div className="h-9 w-9 rounded-xl bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-sm">
              <EventOsLogo size={30} animated={false} />
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  key="brand-text"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex flex-col min-w-0"
                >
                  <span className="font-black text-[13px] text-slate-900 dark:text-white tracking-tight leading-none">EventOS</span>
                  <span className="text-[9px] text-purple-600 dark:text-purple-400 font-extrabold tracking-[0.12em] uppercase mt-[3px]">Enterprise</span>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.button
                key="collapse-btn"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                onClick={() => setIsCollapsed(true)}
                className="h-6 w-6 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.03] dark:hover:bg-white/[0.07] border border-slate-200/80 dark:border-white/[0.05] text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 flex items-center justify-center transition-all cursor-pointer shrink-0"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft size={12} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Items with sections */}
        <nav
          data-lenis-prevent
          role="navigation"
          aria-label="Main navigation"
          className="flex-1 overflow-y-auto py-2.5 sidebar-scrollbar pr-0.5"
        >
          {MENU_SECTIONS.map((section, sectionIdx) => {
            const visibleItems = section.items.filter(isItemVisible);
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.label} className={cn("px-3", sectionIdx > 0 && "mt-3")}>
                {/* Section label */}
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      key={`label-${section.label}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="block text-[9.5px] font-black uppercase tracking-[0.14em] text-slate-600 dark:text-zinc-500 px-3 mb-1.5"
                    >
                      {section.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isCollapsed && sectionIdx > 0 && (
                  <div className="h-[1px] bg-slate-200/80 dark:bg-white/[0.04] mx-1 mb-2" />
                )}

                {/* Items */}
                <div className="space-y-0.5">
                  {visibleItems.map((item, itemIdx) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "relative flex items-center gap-2.5 px-3 py-[6.5px] rounded-[10px] text-[11.5px] font-semibold transition-all duration-150 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
                          isCollapsed && "justify-center px-0 h-9 w-full",
                          isActive
                            ? "bg-purple-500/10 text-purple-700 font-bold border border-purple-500/20 shadow-sm dark:bg-white/[0.08] dark:text-white dark:border-white/[0.08] dark:shadow-[0_1px_8px_rgba(0,0,0,0.2)]"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 border border-transparent dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-white/[0.04]"
                        )}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {/* Active glow pill */}
                        {isActive && (
                          <motion.div
                            layoutId="active-pill"
                            className="absolute inset-0 rounded-[10px] bg-purple-500/10 border border-purple-500/20 dark:bg-purple-500/[0.12] dark:border-purple-500/[0.2]"
                            transition={{ type: "spring", stiffness: 400, damping: 35 }}
                          />
                        )}

                        {/* Icon */}
                        <Icon
                          size={15}
                          strokeWidth={isActive ? 2.2 : 1.8}
                          className={cn(
                            "shrink-0 relative z-10 transition-colors",
                            isActive
                              ? "text-purple-600 dark:text-purple-400"
                              : "text-slate-600 group-hover:text-slate-800 dark:text-zinc-400 dark:group-hover:text-zinc-200"
                          )}
                        />

                        {/* Label */}
                        <AnimatePresence>
                          {!isCollapsed && (
                            <motion.span
                              key={`label-item-${item.href}`}
                              initial={{ opacity: 0, x: -4 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -4 }}
                              transition={{ duration: 0.15, delay: itemIdx * 0.015 }}
                              className="truncate relative z-10 tracking-wide"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>

                        {/* Collapsed tooltip */}
                        {isCollapsed && (
                          <div className="absolute left-[60px] bg-slate-900 text-white dark:bg-[#0a0a0f]/98 dark:border dark:border-white/[0.1] dark:text-zinc-100 text-[10px] font-bold px-2.5 py-1.5 rounded-[10px] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 whitespace-nowrap shadow-xl z-50 backdrop-blur-xl">
                            {item.label}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls */}
      <div className="p-3 border-t border-slate-200/60 dark:border-white/[0.04] space-y-2 relative">
        {/* Expand button when collapsed */}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-full h-8 rounded-[10px] bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 text-slate-500 hover:text-slate-700 dark:bg-white/[0.02] dark:hover:bg-white/[0.05] dark:border-white/[0.04] dark:text-zinc-400 dark:hover:text-zinc-200 flex items-center justify-center transition-all cursor-pointer mb-2"
            aria-label="Expand sidebar"
          >
            <ChevronRight size={13} />
          </button>
        )}

        {/* User Card */}
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-[10px] transition-colors",
            isCollapsed ? "justify-center" : "px-2.5 py-2 bg-slate-100/80 border border-slate-200/80 dark:bg-white/[0.02] dark:border-white/[0.04]"
          )}
        >
          <div className="relative shrink-0">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center text-[10px] font-black text-white shadow-md shadow-purple-900/20">
              {userName ? userName.charAt(0).toUpperCase() : <User size={12} />}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-[1.5px] ring-white dark:ring-[#09090b] shadow-sm shadow-emerald-500/50" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                key="user-info"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 min-w-0"
              >
                <p className="text-[11px] font-bold text-slate-900 dark:text-zinc-200 truncate leading-none">{userName}</p>
                <p className="text-[9px] text-slate-500 dark:text-zinc-500 font-semibold mt-[3px]">Admin Console</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings & Logout */}
        <div className={cn("flex gap-1.5", isCollapsed ? "flex-col items-center" : "")}>
          <Link
            href="/settings"
            className={cn(
              "flex items-center justify-center h-8 rounded-[10px] bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200/80 text-slate-600 hover:text-slate-900 dark:bg-white/[0.01] dark:hover:bg-white/[0.04] dark:border-white/[0.04] dark:text-zinc-400 dark:hover:text-zinc-200 transition-all cursor-pointer",
              isCollapsed ? "w-8" : "flex-1 text-[11px] gap-1.5 font-bold"
            )}
            title="Settings"
          >
            <Settings size={13} />
            {!isCollapsed && <span>Settings</span>}
          </Link>

          <button
            onClick={onLogout}
            className={cn(
              "flex items-center justify-center h-8 rounded-[10px] bg-slate-100/80 hover:bg-red-50 hover:border-red-200 text-slate-600 hover:text-red-600 border border-slate-200/80 dark:bg-white/[0.01] dark:hover:bg-red-500/[0.08] dark:hover:border-red-500/20 dark:border-white/[0.04] dark:text-zinc-400 dark:hover:text-red-400 transition-all cursor-pointer",
              isCollapsed ? "w-8" : "flex-1 text-[11px] gap-1.5 font-bold"
            )}
            title="Logout"
          >
            <LogOut size={13} />
            {!isCollapsed && <span>Log Out</span>}
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
