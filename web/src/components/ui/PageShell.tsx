"use client";

import React, { useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import Sidebar from "@/components/dashboard/Sidebar";
import Navbar from "@/components/dashboard/Navbar";
import CommandPalette from "@/components/CommandPalette";
import { LucideIcon, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
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

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [userName, setUserName] = useState("Admin Workspace");

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

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", { email: user?.email || "" });
    } catch (e) {
      console.error("Logout failed:", e);
    }
    clearAuth();
    localStorage.removeItem("user_name");
    router.push("/login");
  };

  if (bare) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden theme-dynamic">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans relative overflow-hidden transition-all duration-200 theme-dynamic">
      {/* Background glow orbs */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none z-0" />

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
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-background flex flex-col justify-between border-r border-zinc-800">

            <Sidebar
              isCollapsed={false}
              setIsCollapsed={() => {}}
              onLogout={handleLogout}
              userName={userName}
              className="flex w-full h-full border-r-0 bg-transparent"
            />
          </div>
        </>
      )}

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-10">
        <Navbar
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onSearchClick={() => setIsPaletteOpen(true)}
        />

        <main
          id="main-content"
          data-lenis-prevent
          className={cn(
            "flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto pb-24 scrollbar-none hover:scrollbar-thin",
            className
          )}
        >
          {/* Header Section */}
          {(title || breadcrumbs || actions) && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5"
            >
              <div>
                {/* Breadcrumbs */}
                {breadcrumbs && breadcrumbs.length > 0 && (
                  <nav
                    aria-label="Breadcrumb"
                    className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium mb-2"
                  >
                    {breadcrumbs.map((crumb, idx) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && (
                          <ChevronRight size={10} className="text-muted-foreground" />
                        )}
                        {crumb.href ? (
                          <Link
                            href={crumb.href}
                            className="hover:text-foreground transition-colors"
                          >
                            {crumb.label}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">{crumb.label}</span>
                        )}
                      </React.Fragment>
                    ))}
                  </nav>
                )}

                {title && (
                  <h2 className="text-xl font-black tracking-tight text-foreground">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
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
        </main>
      </div>
    </div>
  );
}
