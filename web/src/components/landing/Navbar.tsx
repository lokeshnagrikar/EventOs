"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { ChevronDown, ChevronRight, Menu, X, Sparkles, Layers, CreditCard, BookOpen, Star, LogIn, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceSelectorPill } from "./WorkspaceSelectorPill";
import { Button } from "@/components/ui/button";
import { analytics } from "@/lib/analytics";
import { useAuthModalStore } from "@/store/authModalStore";
import { LiquidButton } from "@/components/ui/liquid-glass-button";


interface NavbarProps {
  activeSection?: string;
}

export function Navbar({ activeSection }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const lastScrollYRef = useRef(0);
  const capsuleRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -999, y: -999 });
  const [isHovered, setIsHovered] = useState(false);

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
    const threshold = 120;

    const handleScroll = () => {
      const activeLenis = (window as any).lenis;
      const currentScrollY = activeLenis ? activeLenis.scroll : window.scrollY;

      setScrolled(currentScrollY > 40);

      if (isOpen) {
        setVisible(true);
        return;
      }

      // Show top Navbar ONLY when near top (Hero section <= 350px)
      // When scrolled down, Navbar hides so FloatingDock takes over (never show together)
      if (currentScrollY <= 350) {
        setVisible(true);
      } else {
        setVisible(false);
      }

      lastScrollYRef.current = currentScrollY;
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pathname, isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const solutions = [
    {
      title: "Planner CRM",
      desc: "Manage client details, leads & pipeline",
      icon: "solar:users-group-rounded-bold-duotone",
      href: "/#features",
      iconColor: "text-purple-600",
      hoverBg: "hover:bg-purple-50/70",
      hoverBorder: "hover:border-purple-200"
    },
    {
      title: "Smart Quotes",
      desc: "Interactive pricing quotes & contracts",
      icon: "solar:document-text-bold-duotone",
      href: "/#quote-calculator",
      iconColor: "text-blue-600",
      hoverBg: "hover:bg-blue-50/70",
      hoverBorder: "hover:border-blue-200"
    },
    {
      title: "Event Planning",
      desc: "Coordinated task lists & schedules",
      icon: "solar:calendar-bold-duotone",
      href: "/#workflow",
      iconColor: "text-emerald-600",
      hoverBg: "hover:bg-emerald-50/70",
      hoverBorder: "hover:border-emerald-200"
    },
    {
      title: "Instant Payments",
      desc: "Milestone invoicing & global gateway",
      icon: "solar:wallet-money-bold-duotone",
      href: "/#modules",
      iconColor: "text-amber-600",
      hoverBg: "hover:bg-amber-50/70",
      hoverBorder: "hover:border-amber-200"
    },
    {
      title: "Gallery Delivery",
      desc: "Deliver photos to clients in style",
      icon: "solar:gallery-bold-duotone",
      href: "/#modules",
      iconColor: "text-rose-600",
      hoverBg: "hover:bg-rose-50/70",
      hoverBorder: "hover:border-rose-200"
    },
    {
      title: "Client Portal",
      desc: "Self-service quote acceptance & pay",
      icon: "solar:window-frame-bold-duotone",
      href: "/#portal-preview",
      iconColor: "text-cyan-600",
      hoverBg: "hover:bg-cyan-50/70",
      hoverBorder: "hover:border-cyan-200"
    },
  ];

  const resources = [
    {
      title: "Quote Calculator 🧮",
      desc: "Live cost estimation & instant PDF export",
      icon: "solar:calculator-bold-duotone",
      href: "/#quote-calculator",
      iconColor: "text-purple-600",
      hoverBg: "hover:bg-purple-50/70",
      hoverBorder: "hover:border-purple-200"
    },
    {
      title: "Developer Docs",
      desc: "API payload schema & webhooks guide",
      icon: "solar:dialog-bold-duotone",
      href: "/docs",
      iconColor: "text-indigo-600",
      hoverBg: "hover:bg-indigo-50/70",
      hoverBorder: "hover:border-indigo-200"
    },
    {
      title: "Operational Blog",
      desc: "SaaS growth insights & product changelogs",
      icon: "solar:server-bold-duotone",
      href: "/blog",
      iconColor: "text-violet-600",
      hoverBg: "hover:bg-violet-50/70",
      hoverBorder: "hover:border-violet-200"
    },
    {
      title: "Download Templates",
      desc: "Operations checklists & invoicing sheets",
      icon: "solar:document-text-bold-duotone",
      href: "/resources",
      iconColor: "text-sky-600",
      hoverBg: "hover:bg-sky-50/70",
      hoverBorder: "hover:border-sky-200"
    },
    {
      title: "Security & Trust",
      desc: "SOC2 compliance & multi-tenant isolation",
      icon: "solar:shield-bold-duotone",
      href: "/security",
      iconColor: "text-teal-600",
      hoverBg: "hover:bg-teal-50/70",
      hoverBorder: "hover:border-teal-200"
    },
    {
      title: "Solutions Directory",
      desc: "Tailored structures for event agencies",
      icon: "solar:window-frame-bold-duotone",
      href: "/#modules",
      iconColor: "text-fuchsia-600",
      hoverBg: "hover:bg-fuchsia-50/70",
      hoverBorder: "hover:border-fuchsia-200"
    },
  ];



  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsOpen(false);
    setActiveDropdown(null);

    // Immediately release body scroll lock so scrolling is not blocked on mobile
    document.body.style.overflow = "";

    let targetHash = "";
    if (href.startsWith("/#")) {
      targetHash = href.substring(2);
    } else if (href.startsWith("#")) {
      targetHash = href.substring(1);
    }

    if (targetHash) {
      const performScroll = () => {
        const elem = document.getElementById(targetHash);
        if (elem) {
          const lenis = (window as any).lenis;
          if (lenis) {
            lenis.scrollTo(elem, { offset: -80, duration: 1.2 });
          } else {
            const offset = 80;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = elem.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth",
            });
          }
        }
      };

      if (pathname === "/") {
        // Small timeout allows mobile browser to unlock scroll before animating
        setTimeout(performScroll, 60);
        return;
      }
      router.push(`/#${targetHash}`);
      return;
    }

    if (href.startsWith("/")) {
      router.push(href);
    }
  };

  const openModal = useAuthModalStore((state) => state.openModal);

  const handleStartTrial = () => {
    analytics.trackCta("nav_trial", "Join Private Beta", "nav");
    openModal("waitlist");
  };

  const handleSignIn = () => {
    analytics.trackCta("nav_signin", "Login", "nav");
    openModal("login");
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 w-full pt-3 px-4 transition-all duration-700 ease-smooth transform pointer-events-none",
          (visible || isOpen) ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        )}
      >
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-2 pointer-events-none">
      {/* Always-on Apple-style Floating Glass Capsule */}
      <div
        ref={capsuleRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setMousePos({ x: -999, y: -999 });
        }}
        className={cn(
          "pointer-events-auto w-full flex items-center justify-between rounded-full border backdrop-blur-2xl backdrop-saturate-[1.8] transition-all duration-700 ease-smooth relative group/navbar",
          scrolled || isOpen
            ? "bg-slate-950/85 border-purple-500/30 px-5 py-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.3),0_2px_10px_rgba(124,58,237,0.15),inset_0_1px_1.5px_rgba(255,255,255,0.2)]"
            : "bg-slate-900/80 border-purple-500/25 px-6 py-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.2),0_2px_8px_rgba(124,58,237,0.12),inset_0_1px_1.5px_rgba(255,255,255,0.15)]"
        )}
      >
        {/* Top specular glass sheen reflection line */}
        <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-purple-400/70 to-transparent pointer-events-none" />

        {/* Subtle static gradient sheen matching WebGL cyan/purple light colors */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-purple-500/10 opacity-100 pointer-events-none rounded-full z-0" />

        {/* Mouse tracking radial glow clipped to rounded capsule border */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-0">
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              opacity: isHovered ? 1 : 0,
              background: `radial-gradient(120px circle at ${mousePos.x}px ${mousePos.y}px, rgba(168, 85, 247, 0.15) 0%, transparent 100%)`,
            }}
          />
        </div>

        {/* Logo */}
        <div
          className="group flex items-center gap-2.5 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-lg p-1 relative z-10"
          onClick={() => router.push("/")}
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && router.push("/")}
          aria-label="EventOS Home"
        >
          {/* Logo Emblem */}
          <img
            src="/logo/logo.png"
            alt="EventOS Logo"
            width={44}
            height={44}
            decoding="async"
            loading="eager"
            suppressHydrationWarning
            className={cn(
              "object-contain transition-all duration-500 ease-out group-hover:scale-105 group-hover:rotate-[3deg]",
              scrolled ? "h-8 w-8" : "h-11 w-11"
            )}
          />

          {/* Vertical Separator */}
          <div className={cn(
            "w-[1px] bg-white/20 transition-all duration-500",
            scrolled ? "h-6" : "h-9"
          )} />

          {/* Brand Text */}
          <div className="flex flex-col justify-center text-left transition-all duration-300 group-hover:translate-x-0.5">
            <h1 className={cn(
              "font-extrabold leading-none tracking-tight text-white font-heading flex items-center transition-all duration-500",
              scrolled ? "text-sm" : "text-lg"
            )}>
              Event
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent ml-0.5 transition-all duration-300">
                OS
              </span>
            </h1>
            {/* Hide tagline when scrolled for compact capsule */}
            <span className={cn(
              "text-[8px] text-slate-400 font-bold tracking-[0.16em] uppercase block leading-none transition-all duration-500",
              scrolled ? "mt-0 h-0 opacity-0 overflow-hidden" : "mt-1 opacity-100"
            )}>
              MANAGE. ENGAGE. ELEVATE.
            </span>
          </div>
        </div>

        {/* Desktop Nav Items */}
        <nav
          className="hidden md:flex items-center gap-1 relative z-10"
          aria-label="Main Navigation"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <a
            href="#features"
            onClick={(e) => handleNavClick(e, "#features")}
            onMouseEnter={() => setHoveredIndex(0)}
            className={cn(
              "text-[13px] font-medium tracking-wide transition-colors py-1.5 px-3.5 rounded-full relative z-10 text-slate-300 hover:text-white",
              activeSection === "features" && "text-purple-300 font-semibold"
            )}
          >
            Features
            {hoveredIndex === 0 && (
              <motion.div
                layoutId="nav-hover-capsule"
                className="absolute inset-0 rounded-full bg-white/10 border border-white/15 shadow-sm -z-10"
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                }}
              />
            )}
            {activeSection === "features" && (
              <motion.div
                layoutId="activeNavIndicatorDot"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.9)]"
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                }}
              />
            )}
          </a>

          {/* Solutions Dropdown Menu */}
          <div
            className="relative"
            onMouseEnter={() => {
              setActiveDropdown("solutions");
              setHoveredIndex(1);
            }}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              className={cn(
                "text-[13px] font-medium tracking-wide flex items-center gap-1 transition-colors py-1.5 px-3.5 rounded-full relative z-10 text-slate-300 hover:text-white focus:outline-none",
                (activeDropdown === "solutions" || activeSection === "modules") && "text-purple-300 font-semibold"
              )}
            >
              Solutions
              <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-200", activeDropdown === "solutions" && "rotate-180 text-purple-300")} />
              {hoveredIndex === 1 && (
                <motion.div
                  layoutId="nav-hover-capsule"
                  className="absolute inset-0 rounded-full bg-white/10 border border-white/15 shadow-sm -z-10"
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                  }}
                />
              )}
              {activeSection === "modules" && (
                <motion.div
                  layoutId="activeNavIndicatorDot"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.9)]"
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                  }}
                />
              )}
            </button>

            <AnimatePresence>
              {activeDropdown === "solutions" && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute left-1/2 -translate-x-1/2 top-full pt-3 w-[460px] z-50 pointer-events-auto"
                >
                  <div className="grid grid-cols-2 gap-2.5 p-4 bg-slate-950/95 border border-purple-500/30 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.5),inset_0_1px_1.5px_rgba(255,255,255,0.15)] backdrop-blur-2xl z-50 relative">
                    {solutions.map((item) => (
                      <a
                        key={item.title}
                        href={item.href}
                        onClick={(e) => handleNavClick(e, item.href)}
                        className="flex items-start gap-3 p-2.5 rounded-xl border border-transparent hover:border-purple-500/30 hover:bg-purple-950/40 group transition-all duration-250"
                      >
                        <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-purple-900/40 group-hover:border-purple-400/40 shrink-0 transition-all duration-250 text-purple-300">
                          <Icon icon={item.icon} className="text-base" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-100 group-hover:text-purple-300 transition-colors">{item.title}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-snug group-hover:text-slate-200">{item.desc}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <a
            href="#pricing"
            onClick={(e) => handleNavClick(e, "#pricing")}
            onMouseEnter={() => setHoveredIndex(2)}
            className={cn(
              "text-[13px] font-medium tracking-wide transition-colors py-1.5 px-3.5 rounded-full relative z-10 text-slate-300 hover:text-white",
              activeSection === "pricing" && "text-purple-300 font-semibold"
            )}
          >
            Pricing
            {hoveredIndex === 2 && (
              <motion.div
                layoutId="nav-hover-capsule"
                className="absolute inset-0 rounded-full bg-white/10 border border-white/15 shadow-sm -z-10"
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                }}
              />
            )}
            {activeSection === "pricing" && (
              <motion.div
                layoutId="activeNavIndicatorDot"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.9)]"
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                }}
              />
            )}
          </a>

          {/* Resources Dropdown Menu */}
          <div
            className="relative"
            onMouseEnter={() => {
              setActiveDropdown("resources");
              setHoveredIndex(3);
            }}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              className={cn(
                "text-[13px] font-medium tracking-wide flex items-center gap-1 transition-colors py-1.5 px-3.5 rounded-full relative z-10 text-slate-300 hover:text-white focus:outline-none",
                activeDropdown === "resources" && "text-purple-300 font-semibold"
              )}
            >
              Resources
              <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-200", activeDropdown === "resources" && "rotate-180 text-purple-300")} />
              {hoveredIndex === 3 && (
                <motion.div
                  layoutId="nav-hover-capsule"
                  className="absolute inset-0 rounded-full bg-white/10 border border-white/15 shadow-sm -z-10"
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                  }}
                />
              )}
            </button>

            <AnimatePresence>
              {activeDropdown === "resources" && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute left-1/2 -translate-x-1/2 top-full pt-3 w-[260px] z-50 pointer-events-auto"
                >
                  <div className="flex flex-col gap-1 p-2 bg-slate-950/95 border border-purple-500/30 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.5),inset_0_1px_1.5px_rgba(255,255,255,0.15)] backdrop-blur-2xl z-50 relative">
                    {resources.map((item) => (
                      <a
                        key={item.title}
                        href={item.href}
                        onClick={(e) => handleNavClick(e, item.href)}
                        className="flex items-start gap-3 p-2 rounded-xl border border-transparent hover:border-purple-500/30 hover:bg-purple-950/40 group transition-all duration-250"
                      >
                        <div className="h-7 w-7 rounded bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-purple-900/40 group-hover:border-purple-400/40 shrink-0 transition-all duration-250 text-purple-300">
                          <Icon icon={item.icon} className="text-sm" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-100 group-hover:text-purple-300 transition-colors">{item.title}</h4>
                          <p className="text-[9px] text-slate-400 mt-0.5 leading-snug group-hover:text-slate-200">{item.desc}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </nav>

        {/* Desktop CTAs */}
        <div
          className="hidden md:flex items-center gap-2 shrink-0 relative z-10"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Multi-Tenant Workspace Selector Pill */}
          <WorkspaceSelectorPill />
          <button
            onClick={handleSignIn}
            onMouseEnter={() => setHoveredIndex(4)}
            className={cn(
              "text-[13px] font-medium tracking-wide transition-colors py-1.5 px-3.5 rounded-full relative z-10 text-slate-300 hover:text-white focus:outline-none whitespace-nowrap shrink-0"
            )}
          >
            Login
            {hoveredIndex === 4 && (
              <motion.div
                layoutId="nav-hover-capsule"
                className="absolute inset-0 rounded-full bg-white/10 border border-white/15 shadow-sm -z-10"
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                }}
              />
            )}
          </button>
          <LiquidButton
            variant="appleGlass"
            onClick={handleStartTrial}
            className="rounded-full text-xs font-bold uppercase tracking-wider active:scale-[0.98] shadow-md shadow-purple-500/20 whitespace-nowrap shrink-0"
            size="default"
          >
            Join Beta
          </LiquidButton>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "md:hidden h-10 w-10 border backdrop-blur-[20px] active:scale-95 rounded-full flex items-center justify-center text-white focus:outline-none transition-all shrink-0 cursor-pointer shadow-md",
            isOpen
              ? "border-purple-500/50 bg-purple-500/25 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.35)]"
              : "border-white/20 bg-white/10 hover:bg-white/20 text-white"
          )}
          aria-expanded={isOpen}
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X size={20} className="text-purple-300" /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu attached right below Navbar capsule (100% identical width!) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.99 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="w-full md:hidden pointer-events-auto overflow-hidden rounded-[26px] border border-purple-500/30 bg-[#090a16]/95 backdrop-blur-2xl backdrop-saturate-[1.8] shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_35px_rgba(168,85,247,0.2),inset_0_1px_1.5px_rgba(255,255,255,0.2)] max-h-[calc(85vh-80px)] flex flex-col relative"
          >
            {/* Top & bottom specular sheen lines */}
            <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-purple-400/60 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 inset-x-12 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent pointer-events-none" />

            {/* Ambient Radial Glows */}
            <div className="absolute -top-12 right-0 w-60 h-60 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 left-0 w-60 h-60 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

            {/* Content Body (Navbar capsule stays on top with Logo & Close button) */}
            <div className="overflow-y-auto p-4 space-y-3 relative z-10">
              {/* Workspace Selector Pill */}
              <div className="pb-0.5">
                <WorkspaceSelectorPill />
              </div>

              {/* Navigation Items */}
              <nav className="flex flex-col gap-1.5" aria-label="Mobile Navigation">
                {/* Features Link */}
                <a
                  href="#features"
                  onClick={(e) => handleNavClick(e, "#features")}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all group",
                    activeSection === "features"
                      ? "bg-purple-500/20 text-purple-200 border border-purple-500/35"
                      : "bg-white/[0.03] hover:bg-white/[0.08] text-slate-200 hover:text-white border border-white/[0.06]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-300">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span>Features</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </a>

                {/* Solutions Expandable Dropdown */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => setMobileSolutionsOpen(!mobileSolutionsOpen)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-200 hover:text-white transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-lg bg-pink-500/15 border border-pink-500/25 flex items-center justify-center text-pink-300">
                        <Layers className="w-3.5 h-3.5" />
                      </div>
                      <span>Solutions</span>
                    </div>
                    <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-200", mobileSolutionsOpen && "rotate-180 text-pink-400")} />
                  </button>
                  {mobileSolutionsOpen && (
                    <div className="px-2 pb-2.5 pt-0.5 space-y-1">
                      {solutions.map((item) => (
                        <a
                          key={item.title}
                          href={item.href}
                          onClick={(e) => handleNavClick(e, item.href)}
                          className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.04] transition-all group/item"
                        >
                          <div className={cn("h-6 w-6 rounded-md bg-white/5 flex items-center justify-center text-xs shrink-0", item.iconColor)}>
                            <Icon icon={item.icon} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-200 group-hover/item:text-white truncate">{item.title}</p>
                            <p className="text-[10px] text-slate-400 truncate">{item.desc}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pricing Link */}
                <a
                  href="#pricing"
                  onClick={(e) => handleNavClick(e, "#pricing")}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all group",
                    activeSection === "pricing"
                      ? "bg-purple-500/20 text-purple-200 border border-purple-500/35"
                      : "bg-white/[0.03] hover:bg-white/[0.08] text-slate-200 hover:text-white border border-white/[0.06]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-300">
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                    <span>Pricing</span>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Flexible
                  </span>
                </a>

                {/* Resources Expandable Dropdown */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => setMobileResourcesOpen(!mobileResourcesOpen)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-200 hover:text-white transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-cyan-300">
                        <BookOpen className="w-3.5 h-3.5" />
                      </div>
                      <span>Resources</span>
                    </div>
                    <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-200", mobileResourcesOpen && "rotate-180 text-cyan-400")} />
                  </button>
                  {mobileResourcesOpen && (
                    <div className="px-2 pb-2.5 pt-0.5 space-y-1">
                      {resources.map((item) => (
                        <a
                          key={item.title}
                          href={item.href}
                          onClick={(e) => handleNavClick(e, item.href)}
                          className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.04] transition-all group/item"
                        >
                          <div className="h-6 w-6 rounded-md bg-white/5 flex items-center justify-center text-cyan-300 text-xs shrink-0">
                            <Icon icon={item.icon} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-200 group-hover/item:text-white truncate">{item.title}</p>
                            <p className="text-[10px] text-slate-400 truncate">{item.desc}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </nav>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-white/[0.08] flex flex-col gap-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      router.push("/demo");
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                    <span>Live Demo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      handleSignIn();
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-purple-400" />
                    <span>Login</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    handleStartTrial();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider shadow-[0_4px_22px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Join Private Beta</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Handle Pill */}
              <div className="mx-auto w-12 h-1 rounded-full bg-white/20 mt-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </header>

    {/* Deep Translucent Backdrop */}
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden pointer-events-auto"
          onClick={() => setIsOpen(false)}
        />
      )}
    </AnimatePresence>
    </>
  );
}
