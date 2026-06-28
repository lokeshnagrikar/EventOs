"use client";

import React, { useState, useEffect, useRef } from "react";
import { ICONS, type IconName } from "@/lib/icons";
import Icon from "@/components/ui/icon";
import {
  FadeIn,
  SlideUp,
  ScaleIn,
  DrawerTransition,
  ModalTransition,
} from "@/components/ui/animations";
import { cn } from "@/lib/utils";

export default function DesignSystemDemo() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Animation Demo States
  const [animationKey, setAnimationKey] = useState(0);
  const [animDuration, setAnimDuration] = useState(0.25);
  const [animDirection, setAnimDirection] = useState<"up" | "down" | "left" | "right" | "none">("up");

  // Drawer / Modal States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [drawerSide, setDrawerSide] = useState<"left" | "right" | "top" | "bottom">("right");

  // Refs for focus trapping
  const drawerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  // Handle dark mode toggle
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark");
    }
  };

  // Check initial theme class
  useEffect(() => {
    if (typeof document !== "undefined") {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    }
  }, []);

  // Copy icon key helper
  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(`<Icon name="${key}" />`);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Keyboard Event Handlers for Dialogs (ESC to close + Focus trapping)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. ESC Key to close
      if (e.key === "Escape") {
        if (isDrawerOpen) setIsDrawerOpen(false);
        if (isModalOpen) setIsModalOpen(false);
      }

      // 2. Focus Trapping Logic
      const activeContainer = isModalOpen
        ? modalRef.current
        : isDrawerOpen
        ? drawerRef.current
        : null;

      if (!activeContainer || e.key !== "Tab") return;

      const focusableSelectors =
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const focusableElements = Array.from(
        activeContainer.querySelectorAll(focusableSelectors)
      ) as HTMLElement[];

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab: trap backwards
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab: trap forwards
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, isModalOpen]);

  // Set focus on first element when drawer/modal opens
  useEffect(() => {
    const activeRef = isModalOpen ? modalRef : isDrawerOpen ? drawerRef : null;
    if (activeRef && activeRef.current) {
      const focusable = activeRef.current.querySelector(
        "button, input, select, textarea"
      ) as HTMLElement;
      if (focusable) {
        focusable.focus();
      }
    }
  }, [isDrawerOpen, isModalOpen]);

  // Filtered icons
  const iconKeys = Object.keys(ICONS) as IconName[];
  const filteredIcons = iconKeys.filter((key) =>
    key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 pb-20">
      {/* 1. Header Banner */}
      <header className="border-b border-border bg-card/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Icon name="portal" size={28} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">EventOS Design System</h1>
              <p className="text-xs text-muted-foreground font-mono">Next.js 16 • Framer Motion • Iconify</p>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-lg border border-border hover:bg-muted/60 focus:ring-2 focus:ring-primary focus:ring-offset-2 ring-offset-background outline-none transition-all"
            aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <Icon name={isDarkMode ? "sun" : "moon"} size={20} className="text-primary animate-pulse" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-10 space-y-12">
        {/* Intro */}
        <section className="bg-gradient-to-r from-primary/10 via-background to-secondary/10 border border-border/80 rounded-2xl p-8 shadow-sm">
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 dark:from-purple-400 dark:to-primary">
            Unified Components & Guidelines
          </h2>
          <p className="mt-2 text-muted-foreground max-w-3xl text-sm leading-relaxed">
            This workspace serves as the sandbox to verify that our user flows meet WCAG 2.2 AA standards, respect 
            <code>prefers-reduced-motion</code> parameters, and restrict animation durations between 150ms and 300ms.
          </p>
        </section>

        {/* 2. Interactive Animation Wrappers */}
        <section className="space-y-6">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Icon name="clock" className="text-primary" />
            Snappy Motion Wrappers
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Controller Settings */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm">
              <h4 className="font-semibold text-sm border-b pb-2 mb-3">Animation Sandbox Controls</h4>
              <div className="space-y-3">
                <label className="block text-xs font-medium text-muted-foreground">
                  Direction (FadeIn Wrapper)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["none", "up", "down", "left", "right"] as const).map((dir) => (
                    <button
                      key={dir}
                      onClick={() => {
                        setAnimDirection(dir);
                        setAnimationKey((prev) => prev + 1);
                      }}
                      className={cn(
                        "text-xs py-1.5 px-3 rounded border capitalize transition-all",
                        animDirection === dir
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted"
                      )}
                    >
                      {dir}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-muted-foreground">Duration (Capped)</span>
                  <span className="font-mono text-primary font-semibold">{animDuration}s</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.6"
                  step="0.05"
                  value={animDuration}
                  onChange={(e) => {
                    setAnimDuration(parseFloat(e.target.value));
                    setAnimationKey((prev) => prev + 1);
                  }}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>100ms (Snappy)</span>
                  <span>300ms (Cap)</span>
                  <span>600ms (Marketing Only)</span>
                </div>
              </div>

              <button
                onClick={() => setAnimationKey((prev) => prev + 1)}
                className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground py-2 px-4 rounded-lg font-medium border border-border/80 hover:bg-muted transition-all"
              >
                <Icon name="clock" size={16} />
                Re-trigger Animations
              </button>
            </div>

            {/* Test Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* FadeIn Demo */}
              <div className="border border-border/80 rounded-xl p-5 bg-card/60 flex flex-col justify-between h-48 shadow-sm">
                <div>
                  <span className="text-xs font-mono text-primary bg-primary/10 px-2.5 py-0.5 rounded-full font-medium">
                    &lt;FadeIn&gt;
                  </span>
                  <h4 className="font-bold text-base mt-2">Directional Entrance</h4>
                </div>
                <FadeIn key={`fade-${animationKey}`} direction={animDirection} duration={animDuration} className="p-3 bg-muted/50 border border-dashed rounded text-xs text-muted-foreground">
                  This card animates opacity and slides in from the chosen parameter direction dynamically.
                </FadeIn>
              </div>

              {/* SlideUp Demo */}
              <div className="border border-border/80 rounded-xl p-5 bg-card/60 flex flex-col justify-between h-48 shadow-sm">
                <div>
                  <span className="text-xs font-mono text-primary bg-primary/10 px-2.5 py-0.5 rounded-full font-medium">
                    &lt;SlideUp&gt;
                  </span>
                  <h4 className="font-bold text-base mt-2">Snappy Slide Up</h4>
                </div>
                <SlideUp key={`slide-${animationKey}`} duration={animDuration} className="p-3 bg-muted/50 border border-dashed rounded text-xs text-muted-foreground">
                  This card performs a smooth, quick translate vertical offset on load to guide user attention.
                </SlideUp>
              </div>

              {/* ScaleIn Demo */}
              <div className="border border-border/80 rounded-xl p-5 bg-card/60 flex flex-col justify-between h-48 shadow-sm">
                <div>
                  <span className="text-xs font-mono text-primary bg-primary/10 px-2.5 py-0.5 rounded-full font-medium">
                    &lt;ScaleIn&gt;
                  </span>
                  <h4 className="font-bold text-base mt-2">Scale and Pop</h4>
                </div>
                <ScaleIn key={`scale-${animationKey}`} duration={animDuration} className="p-3 bg-muted/50 border border-dashed rounded text-xs text-muted-foreground">
                  Excellent for modals, buttons, or checkmark badges. It scales from 0.95 and pops into viewport.
                </ScaleIn>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Accessible Dialogs & Overlays */}
        <section className="space-y-6">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Icon name="lock" className="text-primary" />
            Accessible Overlays (WCAG 2.2 AA)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Modal Trigger Card */}
            <div className="border border-border rounded-xl p-6 bg-card space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 text-primary rounded">
                    <Icon name="portal" />
                  </div>
                  <h4 className="font-semibold text-lg">Accessible Modal Overlay</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Triggers a centered popup. Contains keyboard focus loop trapping, escape-key dismiss callbacks, and background click locks.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold py-2.5 px-4 rounded-lg text-sm transition-all focus:ring-2 focus:ring-primary focus:ring-offset-2 ring-offset-background outline-none flex items-center justify-center gap-2"
              >
                <Icon name="plus" size={16} />
                Open Centered Modal
              </button>
            </div>

            {/* Drawer Trigger Card */}
            <div className="border border-border rounded-xl p-6 bg-card space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-secondary/80 text-secondary-foreground rounded border">
                    <Icon name="menu" />
                  </div>
                  <h4 className="font-semibold text-lg">Side Drawer Panel</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Slides in from view borders. Useful for filtering sidebars, mobile navigation menus, and detail overlays.
                </p>
                <div className="flex gap-2 mt-2">
                  {(["left", "right", "bottom"] as const).map((side) => (
                    <button
                      key={side}
                      onClick={() => setDrawerSide(side)}
                      className={cn(
                        "text-[10px] uppercase font-mono px-2 py-0.5 border rounded",
                        drawerSide === side ? "bg-secondary text-secondary-foreground font-bold" : "text-muted-foreground"
                      )}
                    >
                      {side}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="bg-secondary hover:bg-muted text-secondary-foreground font-semibold py-2.5 px-4 rounded-lg text-sm transition-all border border-border/80 focus:ring-2 focus:ring-primary focus:ring-offset-2 ring-offset-background outline-none flex items-center justify-center gap-2"
              >
                <Icon name="menu" size={16} />
                Open Side Drawer ({drawerSide})
              </button>
            </div>
          </div>
        </section>

        {/* 4. High-Contrast Inputs & Accessibility */}
        <section className="space-y-6">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Icon name="user" className="text-primary" />
            Accessible Interactive Form Fields
          </h3>
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="test-name" className="text-xs font-semibold text-muted-foreground block">
                  Name Input (Focus Ring Check)
                </label>
                <input
                  id="test-name"
                  type="text"
                  placeholder="Enter name..."
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm transition-all focus:ring-2 focus:ring-primary focus:ring-offset-2 ring-offset-background outline-none placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="test-select" className="text-xs font-semibold text-muted-foreground block">
                  Event Category Select
                </label>
                <select
                  id="test-select"
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm transition-all focus:ring-2 focus:ring-primary focus:ring-offset-2 ring-offset-background outline-none cursor-pointer"
                >
                  <option value="">Select event type...</option>
                  <option value="corp">Corporate Summit</option>
                  <option value="wedding">Wedding Planners</option>
                  <option value="concert">Live Concert</option>
                </select>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              *Note: Press <code>Tab</code> key to cycle through the inputs. Focus rings will highlight boundaries clearly with high-contrast outlines for WCAG visual accessibility.
            </p>
          </div>
        </section>

        {/* 5. Centralized Icon Registry Directory */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Icon name="gallery" className="text-primary" />
                Centralized Icon Registry
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Visual directory mapping registry names to active Iconify shapes. Click any card to copy code.
              </p>
            </div>
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Search registered icons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
              />
              <Icon name="search" size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {filteredIcons.map((key) => (
              <button
                key={key}
                onClick={() => copyToClipboard(key)}
                className={cn(
                  "p-4 rounded-xl border bg-card hover:bg-muted/40 hover:border-primary/50 flex flex-col items-center justify-center gap-2 group transition-all text-center relative focus:ring-2 focus:ring-primary outline-none",
                  copiedKey === key ? "border-primary bg-primary/5" : "border-border/60"
                )}
                aria-label={`Copy icon code for ${key}`}
              >
                <Icon
                  name={key}
                  size={24}
                  className="text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all duration-200"
                />
                <span className="text-[10px] font-mono font-medium truncate w-full text-foreground/80">
                  {key}
                </span>
                
                {copiedKey === key && (
                  <span className="absolute inset-0 flex items-center justify-center bg-primary/95 text-primary-foreground text-[10px] font-bold rounded-xl animate-fade-in">
                    Copied Code!
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* --- Overlay Containers --- */}

      {/* Side Drawer Transition Container */}
      <DrawerTransition isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} side={drawerSide}>
        <div ref={drawerRef} className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="menu" className="text-primary" />
              <h4 className="font-bold text-lg">Filter Options</h4>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 rounded-lg hover:bg-muted focus:ring-2 focus:ring-primary outline-none transition-all"
              aria-label="Close drawer"
            >
              <Icon name="close" size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 p-6 space-y-6">
            <p className="text-xs text-muted-foreground leading-relaxed">
              This panel uses WCAG focus-locking. Focus remains trapped in this side panel until closed.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="drawer-sort" className="text-xs font-semibold block text-muted-foreground">
                  Sort Results
                </label>
                <select id="drawer-sort" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary">
                  <option>Newest estimates first</option>
                  <option>Budget: Low to High</option>
                  <option>Budget: High to Low</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input id="drawer-check" type="checkbox" className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer" />
                <label htmlFor="drawer-check" className="text-xs font-medium cursor-pointer">
                  Show approved templates only
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border bg-card/60 flex gap-3">
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="flex-1 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg text-xs hover:bg-primary/95 transition-all outline-none focus:ring-2 focus:ring-primary"
            >
              Apply Settings
            </button>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="flex-1 bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg text-xs hover:bg-muted border border-border/80 transition-all outline-none focus:ring-2 focus:ring-primary"
            >
              Cancel
            </button>
          </div>
        </div>
      </DrawerTransition>

      {/* Modal Dialog Transition Container */}
      <ModalTransition isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div ref={modalRef} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Icon name="checkCircle" className="text-green-500 animate-bounce" size={22} />
              <h4 className="font-bold text-lg">Estimate Saved Successfully</h4>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="p-1.5 rounded-lg hover:bg-muted focus:ring-2 focus:ring-primary outline-none transition-all"
              aria-label="Close dialog"
            >
              <Icon name="close" size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your budget plan for the **Corporate Summit** has been generated and cached in CRM Leads.
            </p>
            <div className="p-4 bg-muted/50 border border-border rounded-lg space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-medium">Proposal reference:</span>
                <span className="font-mono font-bold text-foreground">PR-9823-CORP</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-medium">Estimated budget:</span>
                <span className="font-bold text-primary">INR 4,72,000.00</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsModalOpen(false)}
              className="bg-secondary text-secondary-foreground border border-border/80 font-semibold py-2 px-4 rounded-lg text-xs hover:bg-muted transition-all outline-none focus:ring-2 focus:ring-primary"
            >
              Cancel
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg text-xs hover:bg-primary/95 transition-all outline-none focus:ring-2 focus:ring-primary"
            >
              Okay, Got it
            </button>
          </div>
        </div>
      </ModalTransition>
    </div>
  );
}
