"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { ChevronDown, ChevronRight } from "lucide-react";
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

    let targetHash = "";
    if (href.startsWith("/#")) {
      targetHash = href.substring(2);
    } else if (href.startsWith("#")) {
      targetHash = href.substring(1);
    }

    if (targetHash) {
      if (pathname === "/") {
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
          return;
        }
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
    analytics.trackCta("nav_trial", "Get Started", "nav");
    openModal("register");
  };

  const handleSignIn = () => {
    analytics.trackCta("nav_signin", "Login", "nav");
    openModal("login");
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full pt-3 px-4 transition-all duration-700 ease-smooth transform pointer-events-none",
        (visible || isOpen) ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      )}
    >
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
          "pointer-events-auto mx-auto flex items-center justify-between rounded-full border backdrop-blur-2xl backdrop-saturate-[1.8] transition-all duration-700 ease-smooth relative group/navbar",
          scrolled || isOpen
            ? "max-w-5xl bg-white/75 border-white/80 px-5 py-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.06),0_2px_8px_rgba(124,58,237,0.04),inset_0_1px_1.5px_rgba(255,255,255,0.9)]"
            : "max-w-6xl bg-white/65 border-white/60 px-6 py-3.5 shadow-[0_8px_28px_rgba(0,0,0,0.04),0_2px_6px_rgba(124,58,237,0.03),inset_0_1px_1.5px_rgba(255,255,255,0.85)]"
        )}
      >
        {/* Top specular glass sheen reflection line */}
        <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-purple-300/60 to-transparent pointer-events-none" />

        {/* Subtle static gradient sheen matching WebGL cyan/purple light colors */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-cyan-500/5 to-purple-500/5 opacity-100 pointer-events-none rounded-full z-0" />

        {/* Mouse tracking radial glow clipped to rounded capsule border */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-0">
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              opacity: isHovered ? 1 : 0,
              background: `radial-gradient(120px circle at ${mousePos.x}px ${mousePos.y}px, rgba(147, 51, 234, 0.08) 0%, transparent 100%)`,
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
            "w-[1px] bg-slate-300/70 transition-all duration-500",
            scrolled ? "h-6" : "h-9"
          )} />

          {/* Brand Text */}
          <div className="flex flex-col justify-center text-left transition-all duration-300 group-hover:translate-x-0.5">
            <h1 className={cn(
              "font-extrabold leading-none tracking-tight text-slate-900 font-heading flex items-center transition-all duration-500",
              scrolled ? "text-sm" : "text-lg"
            )}>
              Event
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent ml-0.5 transition-all duration-300">
                OS
              </span>
            </h1>
            {/* Hide tagline when scrolled for compact capsule */}
            <span className={cn(
              "text-[8px] text-slate-500 font-bold tracking-[0.16em] uppercase block leading-none transition-all duration-500",
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
              "text-[13px] font-medium tracking-wide transition-colors py-1.5 px-3.5 rounded-full relative z-10 text-slate-600 hover:text-slate-900",
              activeSection === "features" && "text-purple-600 font-semibold"
            )}
          >
            Features
            {hoveredIndex === 0 && (
              <motion.div
                layoutId="nav-hover-capsule"
                className="absolute inset-0 rounded-full bg-slate-100/90 border border-slate-200/90 shadow-sm -z-10"
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
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-purple-600 shadow-[0_0_6px_rgba(147,51,234,0.6)]"
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
                "text-[13px] font-medium tracking-wide flex items-center gap-1 transition-colors py-1.5 px-3.5 rounded-full relative z-10 text-slate-600 hover:text-slate-900 focus:outline-none",
                (activeDropdown === "solutions" || activeSection === "modules") && "text-purple-600 font-semibold"
              )}
            >
              Solutions
              <ChevronDown className={cn("w-3.5 h-3.5 text-slate-500 transition-transform duration-200", activeDropdown === "solutions" && "rotate-180 text-purple-600")} />
              {hoveredIndex === 1 && (
                <motion.div
                  layoutId="nav-hover-capsule"
                  className="absolute inset-0 rounded-full bg-slate-100/90 border border-slate-200/90 shadow-sm -z-10"
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
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-purple-600 shadow-[0_0_6px_rgba(147,51,234,0.6)]"
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
                  <div className="grid grid-cols-2 gap-2.5 p-4 bg-white/95 border border-slate-200/90 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur-xl z-50 relative">
                    {solutions.map((item) => (
                      <a
                        key={item.title}
                        href={item.href}
                        onClick={(e) => handleNavClick(e, item.href)}
                        className={cn(
                          "flex items-start gap-3 p-2.5 rounded-xl border border-transparent group transition-all duration-250",
                          item.hoverBg,
                          item.hoverBorder
                        )}
                      >
                        <div className={cn(
                          "h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center group-hover:bg-white shrink-0 transition-all duration-250",
                          item.iconColor
                        )}>
                          <Icon icon={item.icon} className="text-base" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 group-hover:text-purple-900 transition-colors">{item.title}</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-snug group-hover:text-slate-700">{item.desc}</p>
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
              "text-[13px] font-medium tracking-wide transition-colors py-1.5 px-3.5 rounded-full relative z-10 text-slate-600 hover:text-slate-900",
              activeSection === "pricing" && "text-purple-600 font-semibold"
            )}
          >
            Pricing
            {hoveredIndex === 2 && (
              <motion.div
                layoutId="nav-hover-capsule"
                className="absolute inset-0 rounded-full bg-slate-100/90 border border-slate-200/90 shadow-sm -z-10"
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
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-purple-600 shadow-[0_0_6px_rgba(147,51,234,0.6)]"
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
                "text-[13px] font-medium tracking-wide flex items-center gap-1 transition-colors py-1.5 px-3.5 rounded-full relative z-10 text-slate-600 hover:text-slate-900 focus:outline-none",
                activeDropdown === "resources" && "text-purple-600 font-semibold"
              )}
            >
              Resources
              <ChevronDown className={cn("w-3.5 h-3.5 text-slate-500 transition-transform duration-200", activeDropdown === "resources" && "rotate-180 text-purple-600")} />
              {hoveredIndex === 3 && (
                <motion.div
                  layoutId="nav-hover-capsule"
                  className="absolute inset-0 rounded-full bg-slate-100/90 border border-slate-200/90 shadow-sm -z-10"
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
                  <div className="flex flex-col gap-1 p-2 bg-white/95 border border-slate-200/90 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur-xl z-50 relative">
                    {resources.map((item) => (
                      <a
                        key={item.title}
                        href={item.href}
                        onClick={(e) => handleNavClick(e, item.href)}
                        className={cn(
                          "flex items-start gap-3 p-2 rounded-xl border border-transparent group transition-all duration-250",
                          item.hoverBg,
                          item.hoverBorder
                        )}
                      >
                        <div className={cn(
                          "h-7 w-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center group-hover:bg-white shrink-0 transition-all duration-250",
                          item.iconColor
                        )}>
                          <Icon icon={item.icon} className="text-sm" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 group-hover:text-purple-900 transition-colors">{item.title}</h4>
                          <p className="text-[9px] text-slate-500 mt-0.5 leading-snug group-hover:text-slate-700">{item.desc}</p>
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
          className="hidden md:flex items-center gap-3 relative z-10"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Multi-Tenant Workspace Selector Pill */}
          <WorkspaceSelectorPill />

          <button
            onClick={() => router.push("/demo")}
            onMouseEnter={() => setHoveredIndex(5)}
            className={cn(
              "text-[13px] font-medium tracking-wide transition-colors py-1.5 px-4 rounded-full relative z-10 text-slate-700 hover:text-purple-700 focus:outline-none flex items-center gap-1.5"
            )}
          >
            <Icon icon="solar:star-bold-duotone" className="text-xs text-purple-600 transition-colors" />
            Live Demo
            {hoveredIndex === 5 && (
              <motion.div
                layoutId="nav-hover-capsule"
                className="absolute inset-0 rounded-full bg-slate-100/90 border border-slate-200/90 shadow-sm -z-10"
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                }}
              />
            )}
          </button>
          <button
            onClick={handleSignIn}
            onMouseEnter={() => setHoveredIndex(4)}
            className={cn(
              "text-[13px] font-medium tracking-wide transition-colors py-1.5 px-4 rounded-full relative z-10 text-slate-700 hover:text-purple-700 focus:outline-none"
            )}
          >
            Login
            {hoveredIndex === 4 && (
              <motion.div
                layoutId="nav-hover-capsule"
                className="absolute inset-0 rounded-full bg-slate-100/90 border border-slate-200/90 shadow-sm -z-10"
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
            className="rounded-full text-xs font-bold uppercase tracking-wider active:scale-[0.98] shadow-md shadow-purple-500/20"
            size="default"
          >
            Get Started
          </LiquidButton>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden h-9 w-9 border border-slate-200 bg-slate-100/80 backdrop-blur-[20px] hover:bg-slate-200 hover:border-slate-300 rounded-full flex items-center justify-center text-slate-700 hover:text-slate-900 focus:outline-none transition-all shrink-0"
          aria-expanded={isOpen}
          aria-label="Toggle navigation menu"
        >
          <Icon icon={isOpen ? "solar:close-square-bold" : "solar:menu-hamburger-bold"} className="text-xl" />
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="md:hidden border-t border-zinc-800 bg-[#0d0d14] backdrop-blur-2xl w-full absolute left-0 right-0 max-h-[85vh] overflow-y-auto shadow-2xl z-50 pointer-events-auto"
          >
            <div className="px-6 py-6 flex flex-col gap-5">
              <nav className="flex flex-col gap-3" aria-label="Mobile Navigation">
                {/* Features Link */}
                <a
                  href="#features"
                  onClick={(e) => handleNavClick(e, "#features")}
                  className={cn(
                    "text-sm font-bold uppercase tracking-wider py-2 text-white/80 hover:text-white flex items-center justify-between group",
                    activeSection === "features" && "text-white font-extrabold"
                  )}
                >
                  <span>Features</span>
                  <div className="h-6 w-6 rounded-md bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/60 group-hover:text-white group-hover:bg-white/10 transition-all">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </a>

                {/* Solutions Expandable Mobile Accordion Dropdown */}
                <div className="flex flex-col border-y border-white/10 py-2.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMobileSolutionsOpen((prev) => !prev);
                    }}
                    className="text-sm font-bold uppercase tracking-wider py-1 text-white/80 hover:text-white flex items-center justify-between w-full text-left cursor-pointer group"
                  >
                    <span>Solutions</span>
                    <div className="h-6 w-6 rounded-md bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:text-white transition-all">
                      <ChevronDown
                        className={cn(
                          "w-3.5 h-3.5 transition-transform duration-300",
                          mobileSolutionsOpen && "rotate-180 text-purple-400"
                        )}
                      />
                    </div>
                  </button>

                  {mobileSolutionsOpen && (
                    <div className="pt-3 pl-1 space-y-2">
                      {solutions.map((item) => (
                        <a
                          key={item.title}
                          href={item.href}
                          onClick={(e) => handleNavClick(e, item.href)}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-purple-500/40 transition-all"
                        >
                          <div className={cn("h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0", item.iconColor)}>
                            <Icon icon={item.icon} className="text-sm" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">{item.title}</h4>
                            <p className="text-[10px] text-zinc-400 leading-none mt-0.5">{item.desc}</p>
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
                    "text-sm font-bold uppercase tracking-wider py-2 text-white/80 hover:text-white flex items-center justify-between group",
                    activeSection === "pricing" && "text-white font-extrabold"
                  )}
                >
                  <span>Pricing</span>
                  <div className="h-6 w-6 rounded-md bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/60 group-hover:text-white group-hover:bg-white/10 transition-all">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </a>

                {/* Resources Expandable Mobile Accordion Dropdown */}
                <div className="flex flex-col border-y border-white/10 py-2.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMobileResourcesOpen((prev) => !prev);
                    }}
                    className="text-sm font-bold uppercase tracking-wider py-1 text-white/80 hover:text-white flex items-center justify-between w-full text-left cursor-pointer group"
                  >
                    <span>Resources</span>
                    <div className="h-6 w-6 rounded-md bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 group-hover:text-white transition-all">
                      <ChevronDown
                        className={cn(
                          "w-3.5 h-3.5 transition-transform duration-300",
                          mobileResourcesOpen && "rotate-180 text-cyan-400"
                        )}
                      />
                    </div>
                  </button>

                  {mobileResourcesOpen && (
                    <div className="pt-3 pl-1 space-y-2">
                      {resources.map((item) => (
                        <a
                          key={item.title}
                          href={item.href}
                          onClick={(e) => handleNavClick(e, item.href)}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-500/40 transition-all"
                        >
                          <div className={cn("h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0", item.iconColor)}>
                            <Icon icon={item.icon} className="text-sm" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">{item.title}</h4>
                            <p className="text-[10px] text-zinc-400 leading-none mt-0.5">{item.desc}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </nav>

              <div className="h-px bg-white/[0.08] my-1" />

              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/demo");
                  }}
                  className="w-full border-white/[0.08] bg-white/[0.02] text-white/80 hover:bg-white/[0.05] hover:text-white py-5 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <Icon icon="solar:star-bold-duotone" className="text-xs text-white/50" />
                  Live Demo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    handleSignIn();
                  }}
                  className="w-full border-white/[0.08] bg-white/[0.02] text-white/80 hover:bg-white/[0.05] hover:text-white py-5 font-semibold text-xs uppercase tracking-wider"
                >
                  Login
                </Button>
                <LiquidButton
                  variant="brandNavbar"
                  onClick={() => {
                    setIsOpen(false);
                    handleStartTrial();
                  }}
                  className="w-full rounded-full font-bold text-xs uppercase tracking-wider"
                  size="lg"
                >
                  Get Started
                </LiquidButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
