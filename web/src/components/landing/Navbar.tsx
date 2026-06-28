"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { analytics } from "@/lib/analytics";
import { useAuthModalStore } from "@/store/authModalStore";

interface NavbarProps {
  activeSection?: string;
}

export function Navbar({ activeSection }: NavbarProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

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
          ? "bg-[#09090B]/95 backdrop-blur-md border-zinc-800/80 shadow-lg shadow-black/10 py-3"
          : "bg-[#09090B]/10 backdrop-blur-xs border-transparent py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-lg p-1"
          onClick={() => router.push("/")}
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && router.push("/")}
          aria-label="EventOS Home"
        >
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-purple-500/20">
            E
          </div>
          <div>
            <h1 className="font-extrabold text-base leading-none tracking-tight text-white flex items-center gap-1 font-heading">
              EventOS
            </h1>
            <span className="text-[10px] text-zinc-500 font-bold tracking-wider uppercase block">
              Business Suite
            </span>
          </div>
        </div>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Main Navigation">
          
          <a
            href="#features"
            onClick={(e) => handleNavClick(e, "#features")}
            className={cn(
              "text-xs font-bold tracking-wide uppercase transition-colors py-1 px-0.5 text-zinc-400 hover:text-zinc-100",
              activeSection === "features" && "text-white"
            )}
          >
            Features
          </a>

          {/* Solutions Dropdown Menu */}
          <div
            className="relative"
            onMouseEnter={() => setActiveDropdown("solutions")}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              className={cn(
                "text-xs font-bold tracking-wide uppercase flex items-center gap-1 transition-colors py-1 px-0.5 text-zinc-400 hover:text-zinc-100 focus:outline-none",
                activeDropdown === "solutions" && "text-white"
              )}
            >
              Solutions
              <Icon icon="solar:alt-arrow-down-bold" className={cn("text-[10px] transition-transform duration-200", activeDropdown === "solutions" && "rotate-180")} />
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
            className={cn(
              "text-xs font-bold tracking-wide uppercase transition-colors py-1 px-0.5 text-zinc-400 hover:text-zinc-100",
              activeSection === "pricing" && "text-white"
            )}
          >
            Pricing
          </a>

          {/* Resources Dropdown Menu */}
          <div
            className="relative"
            onMouseEnter={() => setActiveDropdown("resources")}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              className={cn(
                "text-xs font-bold tracking-wide uppercase flex items-center gap-1 transition-colors py-1 px-0.5 text-zinc-400 hover:text-zinc-100 focus:outline-none",
                activeDropdown === "resources" && "text-white"
              )}
            >
              Resources
              <Icon icon="solar:alt-arrow-down-bold" className={cn("text-[10px] transition-transform duration-200", activeDropdown === "resources" && "rotate-180")} />
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
        <div className="hidden md:flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={handleSignIn}
            className="text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60"
          >
            Login
          </Button>
          <Button
            onClick={handleStartTrial}
            className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:opacity-95 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-purple-600/10 active:scale-[0.98] transition-all py-5 px-5"
          >
            Get Started
          </Button>
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
                <Button
                  onClick={() => {
                    setIsOpen(false);
                    handleStartTrial();
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:opacity-95 text-white py-5 font-bold shadow-md text-xs uppercase tracking-wider"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
