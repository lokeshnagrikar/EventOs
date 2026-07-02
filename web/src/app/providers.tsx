"use client";

import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { analytics } from "@/lib/analytics";
import AiAssistant from "@/components/AiAssistant";
import SmartSearch from "@/components/SmartSearch";
import { SessionTimeoutHandler } from "@/components/auth/SessionTimeoutHandler";
import { SocketProvider } from "@/context/SocketContext";
import Lenis from "lenis";
import { GoogleOAuthProvider } from "@react-oauth/google";


export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10 * 1000, // Cache data for 10 seconds
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    // Initialize Lenis smooth scroll ONLY on the public landing page (/)
    // This prevents Lenis from hijacking trackpad/mouse scroll events in nested scroll containers in dashboard & portal pages.
    const isLandingPage = pathname === "/";
    let lenis: Lenis | null = null;
    let animationFrameId: number;

    if (isLandingPage) {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.5,
      });

      const raf = (time: number) => {
        lenis?.raf(time);
        animationFrameId = requestAnimationFrame(raf);
      };
      animationFrameId = requestAnimationFrame(raf);
    }

    // Register PWA Service Worker on client-side mount (production only to avoid dev HMR caching issues)
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("PWA ServiceWorker registration skipped/failed: ", err);
      });
    }

    // Global keyboard triggers
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }

      // Alt + D (Dashboard), Alt + E (Events), Alt + S (Settings), Alt + A (Automation) shortcuts
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === "d") {
          e.preventDefault();
          router.push("/dashboard");
        } else if (key === "e") {
          e.preventDefault();
          router.push("/events");
        } else if (key === "s") {
          e.preventDefault();
          router.push("/settings");
        } else if (key === "a") {
          e.preventDefault();
          router.push("/automation");
        }
      }
    };

    // Custom event trigger
    const handleOpenSearch = () => {
      setSearchOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-global-search", handleOpenSearch);

    return () => {
      if (lenis) {
        cancelAnimationFrame(animationFrameId);
        lenis.destroy();
      }
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-global-search", handleOpenSearch);
    };
  }, [router, pathname]);

  // Page view analytics trigger

  useEffect(() => {
    analytics.track("page_view", { path: pathname });
  }, [pathname]);

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "171503360314-e51mor0dee5v5f5jqi3gincelrhuva4l.apps.googleusercontent.com"}>
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }} // Fast, premium Vercel/Linear cubic-bezier
              className="min-h-screen flex flex-col"
            >
              {children}
            </motion.div>
          </AnimatePresence>
          <AiAssistant />
          <SmartSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
          <SessionTimeoutHandler />
        </SocketProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
