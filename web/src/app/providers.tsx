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
import { useAuthStore } from "@/store/authStore";
import { useBillingStore } from "@/store/billingStore";
import LimitExceededModal from "@/components/ui/LimitExceededModal";
import { useOnboardingStore } from "@/store/onboardingStore";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import ProductTourSpotlight from "@/components/onboarding/ProductTourSpotlight";
import HelpSearch from "@/components/help/HelpSearch";
import { AuthModal } from "@/components/auth/AuthModal";
import { ExitIntent } from "@/components/landing/ExitIntent";
import OfflineBanner from "@/components/ui/OfflineBanner";
import CelebrationOverlay from "@/components/onboarding/CelebrationOverlay";
import ContextualHelp from "@/components/help/ContextualHelp";
import PWAProvider from "@/components/PWAProvider";




import { LogoutConfirmationModal } from "@/components/auth/LogoutConfirmationModal";

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const { activeTenantId, accessToken, initializeAuth } = useAuthStore();
  const { fetchSubscription, fetchUsage, fetchSettings, fetchPlans } = useBillingStore();
  const { openOnboarding } = useOnboardingStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initializeAuth();
    setMounted(true);
  }, [initializeAuth]);

  useEffect(() => {
    const restoreSession = async () => {
      const activeTenant = typeof window !== 'undefined' ? (sessionStorage.getItem("activeTenantId") || localStorage.getItem("eventos_active_tenant_id")) : null;
      const storedAccessToken = typeof window !== 'undefined' ? (sessionStorage.getItem("accessToken") || localStorage.getItem("eventos_access_token")) : null;
      if (activeTenant && !accessToken && !storedAccessToken) {
        try {
          const storedRefreshToken = typeof window !== 'undefined' ? (sessionStorage.getItem("refreshToken") || localStorage.getItem("eventos_refresh_token")) : null;
          const { apiClient } = require("@/lib/api-client");
          const response = await apiClient.post("/auth/refresh", storedRefreshToken ? { refreshToken: storedRefreshToken } : {});
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
          
          useAuthStore.setState({ 
            accessToken: newAccessToken,
            refreshToken: newRefreshToken || storedRefreshToken 
          });
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('accessToken', newAccessToken);
            localStorage.setItem('eventos_access_token', newAccessToken);
            if (newRefreshToken) {
              sessionStorage.setItem('refreshToken', newRefreshToken);
              localStorage.setItem('eventos_refresh_token', newRefreshToken);
            }
          }
        } catch (err) {
          console.error("Failed to restore session token:", err);
          const path = typeof window !== 'undefined' ? window.location.pathname : '';
          if (path !== '/' && !path.includes('workspace-select')) {
            useAuthStore.getState().clearAuth();
          }
        }
      }
    };

    if (mounted) {
      restoreSession();
    }
  }, [mounted, accessToken]);

  useEffect(() => {
    const isDashboardRoute = pathname?.startsWith('/dashboard') || pathname?.startsWith('/superadmin') || pathname?.startsWith('/portal');
    if (activeTenantId && accessToken && isDashboardRoute) {
      fetchPlans();
      fetchSubscription();
      fetchUsage();
      fetchSettings();

      // Detect if new workspace
      const storedStatus = localStorage.getItem("eventos_onboarding_status");
      if (!storedStatus) {
        openOnboarding();
      }
    }
  }, [activeTenantId, accessToken, pathname]);


  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // Instant 60-second in-memory caching across routes
            gcTime: 5 * 60 * 1000, // Keep cached data in memory for 5 minutes
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    // Initialize Lenis smooth scroll on all public marketing pages.
    // This prevents Lenis from hijacking trackpad/mouse scroll events in nested scroll containers in dashboard & portal pages.
    const isDashboardOrPortal = pathname.startsWith("/dashboard") || 
                                pathname.startsWith("/portal") || 
                                pathname.startsWith("/activity") ||
                                pathname.startsWith("/ai") ||
                                pathname.startsWith("/bookings") ||
                                pathname.startsWith("/chat") ||
                                pathname.startsWith("/crm") ||
                                pathname.startsWith("/developer") ||
                                pathname.startsWith("/events") ||
                                pathname.startsWith("/settings") ||
                                pathname.startsWith("/superadmin") ||
                                pathname.startsWith("/workspace-select") ||
                                pathname.startsWith("/onboarding") ||
                                pathname.startsWith("/invoices") ||
                                pathname.startsWith("/quotes") ||
                                pathname.startsWith("/reports") ||
                                pathname.startsWith("/share") ||
                                pathname.startsWith("/import") ||
                                pathname.startsWith("/payments");
    const isPublicMarketingPage = !isDashboardOrPortal;
    let lenis: Lenis | null = null;
    let animationFrameId: number;
    let observer: MutationObserver | null = null;

    if (isPublicMarketingPage) {
      lenis = new Lenis({
        duration: 0.9,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 1.15,
        touchMultiplier: 1.8,
      });

      (window as any).lenis = lenis;

      // Synchronize Lenis state with body overflow style (locks scroll during preloader or modals)
      if (document.body.style.overflow === "hidden") {
        lenis.stop();
      }

      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === "style") {
            const overflow = document.body.style.overflow;
            if (overflow === "hidden") {
              lenis?.stop();
            } else {
              lenis?.start();
            }
          }
        });
      });

      observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });

      const raf = (time: number) => {
        lenis?.raf(time);
        animationFrameId = requestAnimationFrame(raf);
      };
      animationFrameId = requestAnimationFrame(raf);
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
      if (observer) {
        observer.disconnect();
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
      <PWAProvider>
        <QueryClientProvider client={queryClient}>
          <SocketProvider>
            <div className="min-h-screen flex flex-col relative overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full flex-1 flex flex-col"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
            {mounted && (
              <>
                <AiAssistant />
                <SmartSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
                <SessionTimeoutHandler />
                <LimitExceededModal />
                <OnboardingWizard />
                <ProductTourSpotlight />
                <HelpSearch />
                <AuthModal />
                <LogoutConfirmationModal />
                <ExitIntent />
                <CelebrationOverlay />
                <ContextualHelp />
              </>
            )}
            <OfflineBanner />
          </SocketProvider>
        </QueryClientProvider>
      </PWAProvider>
    </GoogleOAuthProvider>
  );
}
