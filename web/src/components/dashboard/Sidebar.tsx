"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
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
      { href: "/activity", label: "Activity Logs", icon: Activity, permission: "VIEW_LOGS", roles: ["OWNER", "ADMIN"] },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/crm", label: "CRM / Leads", icon: Users, permission: "VIEW_CRM", roles: ["OWNER", "ADMIN"] },
      { href: "/events", label: "Events / Calendar", icon: Calendar, permission: "VIEW_EVENTS", roles: ["OWNER", "ADMIN", "COORDINATOR"] },
      { href: "/bookings", label: "Bookings", icon: Layers, permission: "VIEW_BOOKINGS", roles: ["OWNER", "ADMIN", "COORDINATOR"] },
      { href: "/gallery", label: "Media Gallery", icon: Image, permission: "VIEW_GALLERY", roles: ["OWNER", "ADMIN", "COORDINATOR", "CLIENT"] },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/quotes", label: "Quotes", icon: FileText, permission: "VIEW_QUOTES", roles: ["OWNER", "ADMIN", "COORDINATOR", "CLIENT"] },
      { href: "/finance", label: "Finance Hub", icon: Coins, permission: "VIEW_FINANCE", roles: ["OWNER", "ADMIN"] },
      { href: "/payments", label: "Payments", icon: DollarSign, permission: "VIEW_FINANCE", roles: ["OWNER", "ADMIN"] },
      { href: "/invoices", label: "Invoices", icon: FileSpreadsheet, permission: "VIEW_FINANCE", roles: ["OWNER", "ADMIN"] },
      { href: "/calculator", label: "Budget Calculator", icon: Calculator, permission: "VIEW_FINANCE", roles: ["OWNER", "ADMIN", "COORDINATOR"] },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/reports", label: "Reports & Analytics", icon: TrendingUp, permission: "VIEW_REPORTS", roles: ["OWNER", "ADMIN"] },
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
        "flex flex-col justify-between shrink-0 border-r border-white/[0.05] sticky top-0 h-screen z-40 select-none overflow-hidden",
        "bg-[#09090b]/60 backdrop-blur-2xl shadow-[1px_0_0_rgba(255,255,255,0.03),inset_-1px_0_0_rgba(255,255,255,0.02)]",
        className
      )}
    >
      {/* Inner gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.02] via-transparent to-transparent pointer-events-none" />

      <div className="flex flex-col flex-1 min-h-0 overflow-hidden relative">
        {/* Brand Header */}
        <div className="h-[60px] border-b border-white/[0.04] px-4 flex items-center justify-between shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
            {/* Logo mark */}
            <div className="h-8 w-8 rounded-[10px] bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 shrink-0 transition-transform active:scale-95">
              <Sparkles size={14} strokeWidth={2.5} className="text-white" />
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
                  <span className="font-black text-[13px] text-white tracking-tight leading-none">EventOS</span>
                  <span className="text-[9px] text-zinc-500 font-bold tracking-[0.12em] uppercase mt-[3px]">Enterprise</span>
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
                className="h-6 w-6 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] text-zinc-500 hover:text-zinc-300 flex items-center justify-center transition-all cursor-pointer shrink-0"
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
          className="flex-1 overflow-y-auto py-3 scrollbar-none"
        >
          {MENU_SECTIONS.map((section, sectionIdx) => {
            const visibleItems = section.items.filter(isItemVisible);
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.label} className={cn("px-3", sectionIdx > 0 && "mt-4")}>
                {/* Section label */}
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      key={`label-${section.label}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="block text-[9px] font-black uppercase tracking-[0.14em] text-zinc-600 px-3 mb-1.5"
                    >
                      {section.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isCollapsed && sectionIdx > 0 && (
                  <div className="h-[1px] bg-white/[0.04] mx-1 mb-2" />
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
                          "relative flex items-center gap-2.5 px-3 py-[7px] rounded-[10px] text-[11px] font-semibold transition-all duration-150 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
                          isCollapsed && "justify-center px-0 h-9 w-full",
                          isActive
                            ? "bg-white/[0.06] text-white border border-white/[0.06] shadow-[0_1px_8px_rgba(0,0,0,0.2)]"
                            : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent"
                        )}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {/* Active glow pill */}
                        {isActive && (
                          <motion.div
                            layoutId="active-pill"
                            className="absolute inset-0 rounded-[10px] bg-purple-500/[0.08] border border-purple-500/[0.15]"
                            transition={{ type: "spring", stiffness: 400, damping: 35 }}
                          />
                        )}

                        {/* Icon */}
                        <Icon
                          size={15}
                          strokeWidth={isActive ? 2.2 : 1.8}
                          className={cn(
                            "shrink-0 relative z-10 transition-colors",
                            isActive ? "text-purple-400" : "text-zinc-500 group-hover:text-zinc-300"
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
                          <div className="absolute left-[60px] bg-[#0a0a0f]/98 border border-white/[0.1] text-zinc-100 text-[10px] font-bold px-2.5 py-1.5 rounded-[10px] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 whitespace-nowrap shadow-xl z-50 backdrop-blur-xl">
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
      <div className="p-3 border-t border-white/[0.04] space-y-2 relative">
        {/* Expand button when collapsed */}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-full h-8 rounded-[10px] bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] text-zinc-500 hover:text-zinc-300 flex items-center justify-center transition-all cursor-pointer mb-2"
            aria-label="Expand sidebar"
          >
            <ChevronRight size={13} />
          </button>
        )}

        {/* User Card */}
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-[10px] transition-colors",
            isCollapsed ? "justify-center" : "px-2.5 py-2 bg-white/[0.02] border border-white/[0.04]"
          )}
        >
          <div className="relative shrink-0">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-purple-900/20">
              {userName ? userName.charAt(0).toUpperCase() : <User size={12} />}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-[1.5px] ring-[#09090b] shadow-sm shadow-emerald-500/50" />
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
                <p className="text-[11px] font-bold text-zinc-200 truncate leading-none">{userName}</p>
                <p className="text-[9px] text-zinc-600 font-medium mt-[3px]">Admin Console</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings & Logout */}
        <div className={cn("flex gap-1.5", isCollapsed ? "flex-col items-center" : "")}>
          <Link
            href="/settings"
            className={cn(
              "flex items-center justify-center h-8 rounded-[10px] bg-white/[0.01] hover:bg-white/[0.04] border border-white/[0.04] text-zinc-500 hover:text-zinc-200 transition-all cursor-pointer",
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
              "flex items-center justify-center h-8 rounded-[10px] bg-white/[0.01] hover:bg-red-500/[0.08] hover:border-red-500/20 text-zinc-500 hover:text-red-400 border border-white/[0.04] transition-all cursor-pointer",
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
