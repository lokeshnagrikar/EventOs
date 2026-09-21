"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { Menu, X, ArrowRight, LogIn, Calendar, ChevronRight, LayoutDashboard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";
import { useAuthModalStore } from "@/store/authModalStore";
import { useAuthStore } from "@/store/authStore";
import { EventOsLogo } from "@/components/ui/EventOsLogo";
import { LiquidMetalButton } from "@/components/landing/LiquidMetalButton";

interface NavbarProps {
  activeSection?: string;
}

export function Navbar({ activeSection }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const capsuleRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -999, y: -999 });
  const [isHovered, setIsHovered] = useState(false);
  const openModal = useAuthModalStore((state) => state.openModal);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = capsuleRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    document.body.style.overflow = "";
  }, [pathname]);

  const navLinks = [
    { label: "Product", href: "#showcase", id: "showcase" },
    { label: "How It Works", href: "#workflow", id: "workflow" },
    { label: "Solutions", href: "#modules", id: "modules" },
    { label: "Pricing", href: "#pricing", id: "pricing" },
    { label: "FAQ", href: "#faq", id: "faq" },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsOpen(false);
    document.body.style.overflow = "";

    const targetHash = href.replace(/^(\/)?#/, "");
    if (targetHash) {
      const elem = document.getElementById(targetHash);
      if (elem) {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elemRect = elem.getBoundingClientRect().top;
        const elemPos = elemRect - bodyRect;
        const offsetPos = elemPos - offset;

        window.scrollTo({
          top: offsetPos,
          behavior: "smooth",
        });
        return;
      }
      if (pathname !== "/") {
        router.push(`/#${targetHash}`);
      }
    }
  };

  const handleBookDemo = () => {
    analytics.trackCta("nav_book_demo", "Book a Demo", "nav");
    setIsOpen(false);
    document.body.style.overflow = "";
    router.push("/book-demo");
  };

  const handleSignIn = () => {
    analytics.trackCta("nav_signin", "Login", "nav");
    setIsOpen(false);
    document.body.style.overflow = "";
    openModal("login");
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-full pt-3 px-3 sm:px-4 pointer-events-none transition-all duration-300">
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-2 pointer-events-none">
          {/* Main Floating Navbar Capsule */}
          <div
            ref={capsuleRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
              setIsHovered(false);
              setMousePos({ x: -999, y: -999 });
            }}
            className={cn(
              "pointer-events-auto w-full flex items-center justify-between rounded-full border backdrop-blur-2xl transition-all duration-300 relative group/navbar",
              scrolled || isOpen
                ? "bg-slate-950/90 border-purple-500/30 px-4 sm:px-6 py-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.28),0_2px_10px_rgba(124,58,237,0.12)]"
                : "bg-slate-900/85 border-purple-500/25 px-5 sm:px-7 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.18),0_2px_8px_rgba(124,58,237,0.1)]"
            )}
          >
            {/* Top specular sheen */}
            <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-purple-400/60 to-transparent pointer-events-none" />

            {/* Subtle radial mouse hover glow */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-0">
              <div
                className="absolute inset-0 transition-opacity duration-300"
                style={{
                  opacity: isHovered ? 1 : 0,
                  background: `radial-gradient(140px circle at ${mousePos.x}px ${mousePos.y}px, rgba(168, 85, 247, 0.16) 0%, transparent 100%)`,
                }}
              />
            </div>

            {/* Logo */}
            <div
              className="flex items-center gap-2.5 cursor-pointer select-none relative z-10 group"
              onClick={() => router.push("/")}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && router.push("/")}
              aria-label="EventOS Home"
            >
              <EventOsLogo size={36} animated={true} interactive={true} />
              <span className="text-base sm:text-lg font-black tracking-tight text-white font-heading">
                Event<span className="text-purple-400">OS</span>
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <nav
              className="hidden md:flex items-center gap-1 relative z-10"
              aria-label="Main Navigation"
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {navLinks.map((link, idx) => {
                const isActive = activeSection === link.id;
                return (
                  <a
                    key={link.id}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    className={cn(
                      "text-[13px] font-semibold tracking-wide transition-colors py-1.5 px-3.5 rounded-full relative z-10",
                      isActive ? "text-purple-300" : "text-slate-300 hover:text-white"
                    )}
                  >
                    {link.label}
                    {hoveredIndex === idx && (
                      <motion.div
                        layoutId="nav-hover-pill"
                        className="absolute inset-0 rounded-full bg-white/10 border border-white/15 -z-10"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeNavDot"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.9)]"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </a>
                );
              })}
            </nav>

            {/* Desktop Actions: Auth-Aware CTA buttons */}
            <div className="hidden md:flex items-center gap-2.5 shrink-0 relative z-10">
              {mounted && isAuthenticated && user ? (
                <>
                  <button
                    onClick={() => {
                      const PLATFORM_ROLES = [
                        "SUPER_ADMIN", "PLATFORM_SUPER_ADMIN", "SUPERADMIN", "PLATFORM_ADMIN",
                        "OPERATIONS_LEAD", "OPERATIONS", "OPERATION", "OPERATIONS_MANAGER", "OPS",
                        "SUPPORT_LEAD", "SUPPORT_AGENT", "SUPPORT", "SUPPORT_ADMIN", "TECH_SUPPORT", "CUSTOMER_SUPPORT",
                        "FINANCE_OFFICER", "FINANCE_ADMIN", "FINANCE",
                        "DEVOPS_ENGINEER", "DEVOPS", "DEVELOPER",
                        "COMPLIANCE_AUDITOR", "AUDITOR", "COMPLIANCE"
                      ];
                      const normRole = (user.role || "").replace(/^ROLE_/, "").toUpperCase();
                      const dest = PLATFORM_ROLES.includes(normRole) ? "/superadmin" : normRole === "CLIENT" ? "/portal" : "/dashboard";
                      router.push(dest);
                    }}
                    className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-500 shadow-[0_4px_16px_rgba(147,51,234,0.35)] hover:shadow-[0_6px_22px_rgba(147,51,234,0.5)] active:scale-[0.97] transition-all duration-200 cursor-pointer overflow-hidden group"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={() => useAuthModalStore.getState().openLogoutModal()}
                    className="flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold tracking-wide text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSignIn}
                    className="text-xs sm:text-[13px] font-semibold tracking-wide text-slate-300 hover:text-white px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                  >
                    Login
                  </button>

                  <LiquidMetalButton
                    label="Book a Demo"
                    onClick={handleBookDemo}
                    width={144}
                    height={38}
                    colorTheme="purple"
                  />
                </>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => {
                const nextState = !isOpen;
                setIsOpen(nextState);
                if (nextState) {
                  document.body.style.overflow = "hidden";
                } else {
                  document.body.style.overflow = "";
                }
              }}
              className={cn(
                "md:hidden h-9 w-9 border rounded-full flex items-center justify-center text-white focus:outline-none transition-all shrink-0 cursor-pointer",
                isOpen
                  ? "border-purple-500/50 bg-purple-500/25 text-purple-300"
                  : "border-white/20 bg-white/10 text-white"
              )}
              aria-expanded={isOpen}
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {/* Responsive Mobile Drawer */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="w-full md:hidden pointer-events-auto overflow-hidden rounded-3xl border border-purple-500/30 bg-[#0B0F19]/95 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(147,51,234,0.15)] flex flex-col relative max-h-[82vh]"
              >
                <div className="p-4 space-y-3 overflow-y-auto max-h-[82vh]">
                  {/* Nav Links */}
                  <nav className="flex flex-col gap-1" aria-label="Mobile Navigation">
                    {navLinks.map((link) => (
                      <a
                        key={link.id}
                        href={link.href}
                        onClick={(e) => handleNavClick(e, link.href)}
                        className={cn(
                          "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                          activeSection === link.id
                            ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                            : "text-slate-300 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <span>{link.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </a>
                    ))}
                  </nav>

                  {/* CTAs */}
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    {mounted && isAuthenticated && user ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            document.body.style.overflow = "";
                            const PLATFORM_ROLES = [
                              "SUPER_ADMIN", "PLATFORM_SUPER_ADMIN", "SUPERADMIN", "PLATFORM_ADMIN",
                              "OPERATIONS_LEAD", "OPERATIONS", "OPERATION", "OPERATIONS_MANAGER", "OPS",
                              "SUPPORT_LEAD", "SUPPORT_AGENT", "SUPPORT", "SUPPORT_ADMIN", "TECH_SUPPORT", "CUSTOMER_SUPPORT",
                              "FINANCE_OFFICER", "FINANCE_ADMIN", "FINANCE",
                              "DEVOPS_ENGINEER", "DEVOPS", "DEVELOPER",
                              "COMPLIANCE_AUDITOR", "AUDITOR", "COMPLIANCE"
                            ];
                            const normRole = (user.role || "").replace(/^ROLE_/, "").toUpperCase();
                            const dest = PLATFORM_ROLES.includes(normRole) ? "/superadmin" : normRole === "CLIENT" ? "/portal" : "/dashboard";
                            router.push(dest);
                          }}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-xs font-extrabold text-white shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          <span>Go to Dashboard</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            document.body.style.overflow = "";
                            useAuthModalStore.getState().openLogoutModal();
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleSignIn}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-white/15 bg-white/5 text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer"
                        >
                          <LogIn className="w-3.5 h-3.5 text-purple-400" />
                          <span>Login to Workspace</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleBookDemo}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-xs font-extrabold text-white shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
                        >
                          <Calendar className="w-4 h-4" />
                          <span>Book a Demo</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Backdrop overlay for mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden pointer-events-auto"
            onClick={() => {
              setIsOpen(false);
              document.body.style.overflow = "";
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
