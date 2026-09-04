"use client";

import React, { useState, useEffect, useRef, memo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, MotionValue } from "framer-motion";
import { Icon } from "@iconify/react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Interface for Dock item configuration
interface DockItemConfig {
  label: string;
  href: string;
  id: string;
  icon: string;
}

// Named export for App-wide root mounting
export function FloatingDock() {
  const [visible, setVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const lastScrollYRef = useRef(0);
  const pathname = usePathname();
  
  // Motion value to track mouse position for real-time magnification
  const mouseX = useMotionValue(Infinity);

  useEffect(() => {
    // Only track scroll on the homepage
    if (pathname !== "/") {
      setVisible(false);
      return;
    }

    const handleScroll = () => {
      const activeLenis = (window as any).lenis;
      const currentScrollY = activeLenis ? activeLenis.scroll : window.scrollY;
      const lastScrollY = lastScrollYRef.current;

      // Only show after scrolling past 350px (Navbar controls 0-350px)
      if (currentScrollY > 350) {
        if (currentScrollY > lastScrollY) {
          setVisible(false); // scrolling down
        } else {
          setVisible(true); // scrolling up / idle
        }
      } else {
        setVisible(false); // near top of page (Navbar is active)
      }

      // Sync active section boundaries
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 120;
      const isAtTop = currentScrollY <= 100;
      if (isAtBottom) {
        setActiveSection("contact");
      } else if (isAtTop) {
        setActiveSection("hero");
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    // Periodically check for Lenis initialization
    let unsubscribeLenis: (() => void) | null = null;
    let checkCount = 0;
    const intervalId = setInterval(() => {
      const activeLenis = (window as any).lenis;
      if (activeLenis) {
        const onLenisScroll = (e: any) => {
          if (e.scroll > 350) {
            if (e.direction === 1) {
              setVisible(false);
            } else {
              setVisible(true);
            }
          } else {
            setVisible(false);
          }

          // Sync active section boundaries inside Lenis context
          const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 120;
          const isAtTop = e.scroll <= 100;
          if (isAtBottom) {
            setActiveSection("contact");
          } else if (isAtTop) {
            setActiveSection("hero");
          }
        };
        activeLenis.on("scroll", onLenisScroll);
        unsubscribeLenis = () => {
          activeLenis.off("scroll", onLenisScroll);
        };
        clearInterval(intervalId);
      }
      checkCount++;
      if (checkCount > 50) {
        clearInterval(intervalId);
      }
    }, 100);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (unsubscribeLenis) unsubscribeLenis();
      clearInterval(intervalId);
    };
  }, [pathname]);

  // Track active section to display macOS dot indicators under active apps
  useEffect(() => {
    if (pathname !== "/") return;

    const sections = ["hero", "features", "modules", "pricing", "contact"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        root: null,
        rootMargin: "-45% 0px -45% 0px",
        threshold: 0,
      }
    );

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      sections.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.unobserve(el);
      });
    };
  }, [pathname]);

  // Render nothing if we are not on the homepage
  if (pathname !== "/") {
    return null;
  }

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace("#", "");
    
    // Immediately select active section on click
    setActiveSection(targetId);
    
    const elem = document.getElementById(targetId);
    if (elem) {
      const lenis = (window as any).lenis;
      if (lenis) {
        lenis.scrollTo(elem, { offset: -80, duration: 1.2 });
      } else {
        const offset = 85;
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

  const dockItems: DockItemConfig[] = [
    { label: "Home", href: "#hero", id: "hero", icon: "solar:home-smile-bold-duotone" },
    { label: "Features", href: "#features", id: "features", icon: "solar:widget-bold-duotone" },
    { label: "Solutions", href: "#modules", id: "modules", icon: "solar:case-round-bold-duotone" },
    { label: "Pricing", href: "#pricing", id: "pricing", icon: "solar:wallet-bold-duotone" },
    { label: "Contact", href: "#contact", id: "contact", icon: "solar:letter-bold-duotone" },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, x: "-50%", opacity: 0, filter: "blur(10px)" }}
          animate={{ y: 0, x: "-50%", opacity: 1, filter: "blur(0px)" }}
          exit={{ y: 80, x: "-50%", opacity: 0, filter: "blur(8px)" }}
          transition={{ type: "spring", stiffness: 220, damping: 28 }}
          onMouseMove={(e) => mouseX.set(e.clientX)}
          onMouseLeave={() => mouseX.set(Infinity)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto flex items-end h-[60px] gap-2.5 sm:gap-3 px-3.5 pb-2 rounded-[22px] border border-white/70 bg-white/80 backdrop-blur-[35px] backdrop-saturate-[2.0] shadow-[0_20px_45px_rgba(15,23,42,0.12),0_0_0_1px_rgba(255,255,255,0.9),inset_0_1px_2px_rgba(255,255,255,1)]"
        >
          {/* Top reflection line simulating macOS 3D glass shelf highlight */}
          <div className="absolute top-0 left-3 right-3 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />
          
          {/* Subtle ambient bloom behind the dock */}
          <div className="absolute -inset-1 bg-purple-500/15 blur-lg rounded-[24px] pointer-events-none -z-10" />

          {dockItems.map((item) => (
            <DockIcon
              key={item.label}
              mouseX={mouseX}
              item={item}
              isActive={activeSection === item.id}
              handleNavClick={handleNavClick}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Child component representing an individual icon tile with high-performance cursor tracking
const DockIcon = memo(function DockIcon({
  mouseX,
  item,
  isActive,
  handleNavClick,
}: {
  mouseX: MotionValue;
  item: DockItemConfig;
  isActive: boolean;
  handleNavClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  // Compute the distance from the center of this icon tile to the screen's cursor x-coordinate
  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  // macOS fisheye magnification mapping:
  const widthTransform = useTransform(distance, [-150, -90, -45, 0, 45, 90, 150], [40, 44.8, 48.8, 54, 48.8, 44.8, 40]);
  const yTransform = useTransform(distance, [-150, -90, -45, 0, 45, 90, 150], [0, -1.5, -4, -9, -4, -1.5, 0]);

  // Smoothen width and height transforms using critically damped Framer Motion springs
  const widthSize = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 280,
    damping: 25,
  });

  const yOffset = useSpring(yTransform, {
    mass: 0.1,
    stiffness: 280,
    damping: 25,
  });

  return (
    <a
      href={item.href}
      onClick={(e) => handleNavClick(e, item.href)}
      className="relative flex flex-col items-center justify-end h-full pb-1 select-none cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {/* Apple-style minimalist Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute bottom-full mb-3.5 px-2.5 py-1 text-[10.5px] font-extrabold tracking-wide text-slate-900 bg-white/95 border border-slate-200/90 rounded-[8px] shadow-lg pointer-events-none whitespace-nowrap z-20"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* macOS App Icon Tile with Spring Size & Offset */}
      <motion.div
        ref={ref}
        style={{
          width: widthSize,
          height: widthSize,
          y: yOffset,
        }}
        className={cn(
          "flex items-center justify-center rounded-[14px] border transition-colors duration-250 relative overflow-hidden",
          isActive
            ? "bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/35"
            : hovered
            ? "bg-white border-purple-300 text-purple-700 shadow-md"
            : "bg-white/85 border-slate-200/90 text-slate-700 shadow-2xs"
        )}
      >
        {/* Subtle top sheen refracting light to mimic physical visionOS material */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-transparent pointer-events-none" />

        <Icon icon={item.icon} className="text-xl relative z-10 transition-colors duration-250" />
      </motion.div>

      {/* macOS indicator dot under the app tile */}
      <div className="absolute bottom-0 left-0 right-0 h-1 flex items-center justify-center pointer-events-none">
        <AnimatePresence>
          {isActive && (
            <motion.div
              layoutId="activeIndicatorDot"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="h-1.5 w-1.5 rounded-full bg-purple-600 shadow-[0_0_8px_rgba(147,51,234,0.7)]"
            />
          )}
        </AnimatePresence>
      </div>
    </a>
  );
});
