"use client";

import React, { useState, useEffect } from "react";
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
  LayoutDashboard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [darkMode, setDarkMode] = useState(true);
  const [userName, setUserName] = useState("Client");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const mobileMenuRef = React.useRef<HTMLDivElement>(null);

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
      
      // Verification of client role - restrict to CLIENT role only
      if (!storedName || storedRole !== "CLIENT") {
        router.push("/login");
        return;
      }
      
      setUserName(decodeURIComponent(storedName));
      setAuthChecked(true);

      // Dark mode initialization
      const cookieTheme = getCookieValue("theme");
      const isDark = cookieTheme ? cookieTheme === "dark" : true;
      setDarkMode(isDark);
    }
  }, [router]);

  const handleLogout = async (expired: boolean | React.MouseEvent = false) => {
    const isExpired = typeof expired === "boolean" ? expired : false;
    try {
      await api.post("/auth/logout", { email: decodeURIComponent(getCookieValue("user_name")) });
    } catch (err) {
      console.error("Portal logout API call failed:", err);
    }
    document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "user_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "hasSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("tenant_id");
    router.push(isExpired ? "/login?expired=true" : "/login");
  };

  // Inactivity timeout of 30 minutes
  useEffect(() => {
    if (!authChecked) return;

    let timeoutId: any;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLogout(true);
      }, 30 * 60 * 1000);
    };

    const events = ["mousemove", "keydown", "click", "scroll"];
    
    resetTimer();

    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
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

  // Body scroll locking when mobile menu is open
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isMobileMenuOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }
    return () => {
      if (typeof window !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [isMobileMenuOpen]);

  // Escape closing & focus trapping for Mobile menu
  useEffect(() => {
    if (isMobileMenuOpen && mobileMenuRef.current) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsMobileMenuOpen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      const focusableElements = mobileMenuRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }

      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== "Tab") return;
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      };

      window.addEventListener("keydown", handleTab);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keydown", handleTab);
      };
    }
  }, [isMobileMenuOpen]);

  const navItems = [
    { name: "Overview", path: "/portal", icon: LayoutDashboard },
    { name: "Event Timeline", path: "/portal/timeline", icon: Calendar },
    { name: "Proposals & Quotes", path: "/portal/quotes", icon: FileText },
    { name: "Invoices & Payments", path: "/portal/invoices", icon: FileSpreadsheet },
    { name: "Media Gallery", path: "/portal/gallery", icon: Camera }
  ];

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-100 flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#09090B] text-zinc-100 font-sans transition-colors duration-200">
      {/* Mobile Header Top Navigation */}
      <div className="md:hidden h-16 border-b border-zinc-800 bg-[#111113]/90 backdrop-blur px-4 flex items-center justify-between z-30 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
            E
          </div>
          <span className="font-extrabold text-sm tracking-tight text-zinc-200">EventOS Client</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="h-9 w-9 rounded-lg border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
        >
          {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop Overlay for mobile drawer */}
            <div 
              className="md:hidden fixed inset-0 bg-black/60 z-20"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              ref={mobileMenuRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="md:hidden fixed inset-x-0 top-16 bg-[#111113] border-b border-zinc-800 z-25 p-4 flex flex-col gap-4 shadow-xl"
            >
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        router.push(item.path);
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold ${
                        isActive
                          ? "bg-purple-600/10 text-purple-400 border border-purple-900/30"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <Icon size={15} />
                      {item.name}
                    </button>
                  );
                })}
              </nav>

              <div className="border-t border-zinc-800 pt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <User size={14} />
                  </div>
                  <span className="text-xs font-bold text-zinc-300">{userName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleTheme}
                    className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
                  >
                    {darkMode ? <Sun size={14} /> : <Moon size={14} />}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex w-64 border-r border-zinc-800 bg-[#111113] p-6 flex-col justify-between shrink-0 z-10 sticky top-0 h-screen">
        <div>
          {/* Logo Section */}
          <div className="flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-purple-600/20">
              E
            </div>
            <div>
              <h1 className="font-semibold text-base leading-none">EventOS</h1>
              <span className="text-[10px] text-zinc-500 font-medium">Client Experience Portal</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all border ${
                    isActive
                      ? "bg-purple-600/10 text-purple-400 border-purple-900/30"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 border-transparent"
                  }`}
                >
                  <Icon size={16} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Footer */}
        <div className="pt-6 border-t border-zinc-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                <User size={16} />
              </div>
              <div className="truncate max-w-[110px]">
                <p className="text-xs font-semibold leading-none">{userName}</p>
                <span className="text-[10px] text-zinc-500 font-mono">Client Account</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleTheme}
                className="h-8 w-8 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-300 transition-all"
                aria-label="Toggle theme"
              >
                {darkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <button
                onClick={handleLogout}
                className="h-8 w-8 rounded-md bg-zinc-900 hover:bg-red-500/10 hover:text-red-400 border border-zinc-800 flex items-center justify-center text-zinc-400 transition-all"
                aria-label="Logout"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full z-0 flex flex-col">
        {children}
      </main>
    </div>
  );
}

// Simple local Loader fallback
function Loader2({ className, size }: { className?: string; size?: number }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width={size || 24}
      height={size || 24}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
