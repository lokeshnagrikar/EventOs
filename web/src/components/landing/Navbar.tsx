"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { analytics } from "@/lib/analytics";
import { useAuthModalStore } from "@/store/authModalStore";
import { LiquidButton } from "@/components/ui/liquid-glass-button";


interface NavbarProps {
  activeSection?: string;
}

export function Navbar({ activeSection }: NavbarProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const solutions = [
    { title: "Planner CRM", desc: "Manage client details, leads & pipeline", icon: "solar:users-group-rounded-bold-duotone", href: "#features" },
    { title: "Smart Quotes", desc: "Interactive pricing quotes & contracts", icon: "solar:document-text-bold-duotone", href: "#modules" },
    { title: "Event Planning", desc: "Coordinated task lists & schedules", icon: "solar:calendar-bold-duotone", href: "#workflow" },
    { title: "Instant Payments", desc: "Milestone invoicing & global gateway", icon: "solar:wallet-money-bold-duotone", href: "#modules" },
    { title: "Gallery Delivery", desc: "Deliver photos to clients in style", icon: "solar:gallery-bold-duotone", href: "#portal-preview" },
    { title: "Client Portal", desc: "Self-service quote acceptance & pay", icon: "solar:window-frame-bold-duotone", href: "#portal-preview" },
  ];

  const resources = [
    { title: "Help Center", desc: "Tutorials & platform documentation", icon: "solar:dialog-bold-duotone", href: "#faq" },
    { title: "System Status", desc: "Active uptime logs and SLA metrics", icon: "solar:server-bold-duotone", href: "#footer" },
    { title: "FAQs", desc: "Answers to common hosting questions", icon: "solar:question-square-bold-duotone", href: "#faq" },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsOpen(false);
    setActiveDropdown(null);
    const targetId = href.replace("#", "");
    const elem = document.getElementById(targetId);
    if (elem) {
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
        "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 border-b",
        scrolled || isOpen
          ? "bg-gradient-to-r from-purple-950/15 via-[#09090B]/80 to-cyan-950/15 backdrop-blur-xl border-zinc-800/30 shadow-lg shadow-black/10 py-2.5"
          : "bg-transparent border-transparent py-2.5"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

        {/* Logo */}
        <div
          className="group flex items-center gap-3 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-lg p-1"
          onClick={() => router.push("/")}
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && router.push("/")}
          aria-label="EventOS Home"
        >
          {/* Logo Emblem (From public/logo/logo.png) */}
          <img
            src="/logo/logo.png"
            alt="EO"
            className="h-11 w-11 object-contain transition-all duration-300 ease-out group-hover:scale-105 group-hover:rotate-[3deg] group-hover:drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]"
          />

          {/* Vertical Separator */}
          <div className="h-9 w-[1px] bg-zinc-800 transition-colors duration-300 group-hover:bg-purple-500/40" />

          {/* Brand Text styled in code */}
          <div className="flex flex-col justify-center text-left transition-all duration-300 group-hover:translate-x-0.5">
            <h1 className="font-extrabold text-lg leading-none tracking-tight text-white font-heading flex items-center transition-all duration-300 group-hover:text-purple-100">
              Event
              <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent ml-0.5 transition-all duration-300 group-hover:brightness-110">
                OS
              </span>
            </h1>
            <span className="text-[8px] text-[#8E8A9F] font-bold tracking-[0.16em] uppercase block mt-1 leading-none transition-colors duration-300 group-hover:text-zinc-300">
              MANAGE. ENGAGE. ELEVATE.
            </span>
          </div>
        </div>





        {/* Desktop Nav Items */}
        <nav
          className="hidden md:flex items-center gap-1.5 relative"
          aria-label="Main Navigation"
          onMouseLeave={() => setHoveredIndex(null)}
        >

          <a
            href="#features"
            onClick={(e) => handleNavClick(e, "#features")}
            onMouseEnter={() => setHoveredIndex(0)}
            className={cn(
              "text-[13px] font-semibold tracking-wide transition-colors py-1.5 px-3.5 rounded-full relative z-10 text-zinc-400 hover:text-zinc-100",
              activeSection === "features" && "text-white"
            )}
          >
            Features
            {hoveredIndex === 0 && (
              <motion.div
                layoutId="nav-hover-capsule"
                className="absolute inset-0 rounded-full bg-white/[0.04] border border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_2px_8px_rgba(0,0,0,0.2)] -z-10"
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
                "text-[13px] font-semibold tracking-wide flex items-center gap-1 transition-colors py-1.5 px-3.5 rounded-full relative z-10 text-zinc-400 hover:text-zinc-100 focus:outline-none",
                activeDropdown === "solutions" && "text-white"
              )}
            >
              Solutions
              <Icon icon="solar:alt-arrow-down-bold" className={cn("text-[10px] transition-transform duration-205", activeDropdown === "solutions" && "rotate-180")} />
              {hoveredIndex === 1 && (
                <motion.div
                  layoutId="nav-hover-capsule"
                  className="absolute inset-0 rounded-full bg-white/[0.04] border border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_2px_8px_rgba(0,0,0,0.2)] -z-10"
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
                  transition={{ duration: 0.18 }}
                  className="absolute left-1/2 -translate-x-1/2 top-full pt-4 w-[480px] z-50 pointer-events-auto"
                >
                  <div className="grid grid-cols-2 gap-2 p-4 bg-[#0c0c0e] border border-zinc-800 rounded-2xl shadow-xl backdrop-blur-md">
                    {solutions.map((item) => (
                      <a
                        key={item.title}
                        href={item.href}
                        onClick={(e) => handleNavClick(e, item.href)}
                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-900/50 group transition-all"
                      >
                        <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-purple-400 group-hover:border-purple-500/20 shrink-0 transition-colors">
                          <Icon icon={item.icon} className="text-base" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-zinc-200 group-hover:text-white transition-colors">{item.title}</h4>
                          <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">{item.desc}</p>
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
              "text-[13px] font-semibold tracking-wide transition-colors py-1.5 px-3.5 rounded-full relative z-10 text-zinc-400 hover:text-zinc-100",
              activeSection === "pricing" && "text-white"
            )}
          >
            Pricing
            {hoveredIndex === 2 && (
              <motion.div
                layoutId="nav-hover-capsule"
                className="absolute inset-0 rounded-full bg-white/[0.04] border border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_2px_8px_rgba(0,0,0,0.2)] -z-10"
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
                "text-[13px] font-semibold tracking-wide flex items-center gap-1 transition-colors py-1.5 px-3.5 rounded-full relative z-10 text-zinc-400 hover:text-zinc-100 focus:outline-none",
                activeDropdown === "resources" && "text-white"
              )}
            >
              Resources
              <Icon icon="solar:alt-arrow-down-bold" className={cn("text-[10px] transition-transform duration-200", activeDropdown === "resources" && "rotate-180")} />
              {hoveredIndex === 3 && (
                <motion.div
                  layoutId="nav-hover-capsule"
                  className="absolute inset-0 rounded-full bg-white/[0.04] border border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_2px_8px_rgba(0,0,0,0.2)] -z-10"
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
                  transition={{ duration: 0.18 }}
                  className="absolute left-1/2 -translate-x-1/2 top-full pt-4 w-[280px] z-50 pointer-events-auto"
                >
                  <div className="flex flex-col gap-1 p-2 bg-[#0c0c0e] border border-zinc-800 rounded-2xl shadow-xl backdrop-blur-md">
                    {resources.map((item) => (
                      <a
                        key={item.title}
                        href={item.href}
                        onClick={(e) => handleNavClick(e, item.href)}
                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-900/50 group transition-all"
                      >
                        <div className="h-7 w-7 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-cyan-400 shrink-0 transition-colors">
                          <Icon icon={item.icon} className="text-sm" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-zinc-200 group-hover:text-white transition-colors">{item.title}</h4>
                          <p className="text-[9px] text-zinc-500 mt-0.5 leading-snug">{item.desc}</p>
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
          className="hidden md:flex items-center gap-4"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <button
            onClick={handleSignIn}
            onMouseEnter={() => setHoveredIndex(4)}
            className={cn(
              "text-[13px] font-semibold tracking-wide transition-colors py-1.5 px-4 rounded-full relative z-10 text-zinc-400 hover:text-zinc-100 focus:outline-none",
              hoveredIndex === 4 && "text-white"
            )}
          >
            Login
            {hoveredIndex === 4 && (
              <motion.div
                layoutId="nav-hover-capsule"
                className="absolute inset-0 rounded-full bg-white/[0.04] border border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_2px_8px_rgba(0,0,0,0.2)] -z-10"
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                }}
              />
            )}
          </button>
          <LiquidButton
            variant="brandNavbar"
            onClick={handleStartTrial}
            className="rounded-full text-xs font-bold uppercase tracking-wider active:scale-[0.98]"
            size="default"
          >
            Get Started
          </LiquidButton>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden h-10 w-10 border border-zinc-800/80 bg-zinc-950/40 hover:bg-zinc-900/60 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-purple-500/55 transition-colors shrink-0"
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
            className="md:hidden border-t border-zinc-800 bg-[#09090B] w-full absolute left-0 right-0 overflow-hidden"
          >
            <div className="px-6 py-6 flex flex-col gap-5">
              <nav className="flex flex-col gap-4" aria-label="Mobile Navigation">
                <a
                  href="#features"
                  onClick={(e) => handleNavClick(e, "#features")}
                  className={cn(
                    "text-sm font-bold uppercase tracking-wider py-1 text-zinc-400 hover:text-white",
                    activeSection === "features" && "text-white"
                  )}
                >
                  Features
                </a>
                <a
                  href="#modules"
                  onClick={(e) => handleNavClick(e, "#modules")}
                  className="text-sm font-bold uppercase tracking-wider py-1 text-zinc-400 hover:text-white"
                >
                  Solutions
                </a>
                <a
                  href="#pricing"
                  onClick={(e) => handleNavClick(e, "#pricing")}
                  className={cn(
                    "text-sm font-bold uppercase tracking-wider py-1 text-zinc-400 hover:text-white",
                    activeSection === "pricing" && "text-white"
                  )}
                >
                  Pricing
                </a>
                <a
                  href="#faq"
                  onClick={(e) => handleNavClick(e, "#faq")}
                  className="text-sm font-bold uppercase tracking-wider py-1 text-zinc-400 hover:text-white"
                >
                  Resources
                </a>
              </nav>

              <div className="h-px bg-zinc-850 my-1" />

              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    handleSignIn();
                  }}
                  className="w-full border-zinc-800 text-zinc-300 hover:bg-zinc-900 py-5 font-semibold text-xs uppercase tracking-wider"
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
