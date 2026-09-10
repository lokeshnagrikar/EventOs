"use client";

import React, { useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useAuthModalStore } from "@/store/authModalStore";
import { api } from "@/lib/api";
import Sidebar from "@/components/dashboard/Sidebar";
import Navbar from "@/components/dashboard/Navbar";
import CommandPalette from "@/components/CommandPalette";
import { LucideIcon, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumbs?: Breadcrumb[];
  /** If true, skips sidebar and navbar (e.g. for fullscreen pages) */
  bare?: boolean;
  className?: string;
}

export default function PageShell({
  children,
  title,
  subtitle,
  actions,
  breadcrumbs,
  bare = false,
  className,
}: PageShellProps) {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [userName, setUserName] = useState("Admin Workspace");

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedCollapsed = localStorage.getItem("sidebar_collapsed");
      if (storedCollapsed) setIsCollapsed(storedCollapsed === "true");
      const storedName = localStorage.getItem("user_name");
      if (storedName) setUserName(storedName);
    }
  }, []);

  const handleSetCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar_collapsed", String(collapsed));
    }
  };

  const handleLogout = () => {
    useAuthModalStore.getState().openLogoutModal();
  };

  if (bare) {
    return (
      <div className="min-h-screen min-h-dvh bg-background text-foreground font-sans relative overflow-x-hidden theme-dynamic">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-dvh h-dvh flex bg-background text-foreground font-sans relative overflow-x-hidden transition-all duration-200 theme-dynamic">
      {/* Clean workspace background — no decorative blurs */}

      {/* Command Palette */}
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />

      {/* Desktop Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={handleSetCollapsed}
        onLogout={handleLogout}
        userName={userName}
        className="hidden md:flex"
      />

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-[#09090b] flex flex-col justify-between border-r border-slate-200/80 dark:border-white/[0.06] shadow-2xl md:hidden overflow-hidden pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,16px)]"
            >
              <Sidebar
                isCollapsed={false}
                setIsCollapsed={() => {}}
                onLogout={handleLogout}
                userName={userName}
                onClose={() => setIsMobileMenuOpen(false)}
                className="flex w-full h-full border-r-0 bg-transparent"
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-dvh max-h-dvh overflow-hidden relative z-10">
        <Navbar
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onSearchClick={() => setIsPaletteOpen(true)}
        />

        <main
          id="main-content"
          data-lenis-prevent
          className={cn(
            "flex-1 overflow-y-auto p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-7xl w-full mx-auto pb-28 md:pb-24 scrollbar-none hover:scrollbar-thin",
            className
          )}
        >
          {/* Page enter animation wrapper */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
          {/* Page header */}
          {(title || breadcrumbs || actions) && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-b border-zinc-800/80 pb-4 sm:pb-6 mb-4 sm:mb-6 pt-1"
            >
              <div>
                {/* Breadcrumbs */}
                {breadcrumbs && breadcrumbs.length > 0 && (
                  <nav
                    aria-label="Breadcrumb"
                    className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium mb-3 tracking-wide"
                  >
                    {breadcrumbs.map((crumb, idx) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && (
                          <ChevronRight size={12} className="text-zinc-600" />
                        )}
                        {crumb.href ? (
                          <Link
                            href={crumb.href}
                            className="hover:text-white transition-colors"
                          >
                            {crumb.label}
                          </Link>
                        ) : (
                          <span className="text-zinc-400">{crumb.label}</span>
                        )}
                      </React.Fragment>
                    ))}
                  </nav>
                )}

                {title && (
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white leading-snug">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-xs md:text-sm text-zinc-400 mt-2 font-normal leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>


              {actions && (
                <div className="flex items-center gap-3 shrink-0">{actions}</div>
              )}
            </motion.div>
          )}

          {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
