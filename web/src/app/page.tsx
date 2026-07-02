"use client";

import React, { useState, useEffect, lazy, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { analytics } from "@/lib/analytics";
import { useAuthModalStore } from "@/store/authModalStore";
import { AuthModal } from "@/components/auth/AuthModal";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/lib/toastStore";
import { apiClient } from "@/lib/api-client";
import { Preloader } from "@/components/landing/preloader/Preloader";

// Above-the-fold sections loaded eagerly for fast LCP
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { TrustedBy } from "@/components/landing/TrustedBy";

// Below-the-fold sections dynamically imported for smaller initial bundle
const Features = dynamic(() => import("@/components/landing/Features").then(m => ({ default: m.Features })), { ssr: true });
const Modules = dynamic(() => import("@/components/landing/Modules").then(m => ({ default: m.Modules })), { ssr: true });
const MultiTenant = dynamic(() => import("@/components/landing/MultiTenant").then(m => ({ default: m.MultiTenant })), { ssr: true });
const Workflow = dynamic(() => import("@/components/landing/Workflow").then(m => ({ default: m.Workflow })), { ssr: false });
const ClientPortalPreview = dynamic(() => import("@/components/landing/ClientPortalPreview").then(m => ({ default: m.ClientPortalPreview })), { ssr: true });
const ProductShowcase = dynamic(() => import("@/components/landing/ProductShowcase").then(m => ({ default: m.ProductShowcase })), { ssr: true });
const Testimonials = dynamic(() => import("@/components/landing/Testimonials").then(m => ({ default: m.Testimonials })), { ssr: true });
const Pricing = dynamic(() => import("@/components/landing/Pricing").then(m => ({ default: m.Pricing })), { ssr: true });
const Faq = dynamic(() => import("@/components/landing/Faq").then(m => ({ default: m.Faq })), { ssr: false });
const FinalCta = dynamic(() => import("@/components/landing/FinalCta").then(m => ({ default: m.FinalCta })), { ssr: true });
const Footer = dynamic(() => import("@/components/landing/Footer").then(m => ({ default: m.Footer })), { ssr: true });

// Simple fallback for dynamic sections
function SectionSkeleton() {
  return (
    <div className="py-24 border-b border-zinc-900 bg-[#09090B] w-full" aria-hidden="true">
      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="h-4 w-40 bg-zinc-900 rounded-full mx-auto animate-pulse" />
        <div className="h-8 w-96 bg-zinc-900 rounded-xl mx-auto animate-pulse" />
        <div className="h-4 w-72 bg-zinc-900 rounded-full mx-auto animate-pulse" />
      </div>
    </div>
  );
}

function HomeContent({ preloaderActive }: { preloaderActive: boolean }) {
  const [activeSection, setActiveSection] = useState<string>("hero");
  const searchParams = useSearchParams();
  const openModal = useAuthModalStore((state) => state.openModal);

  useEffect(() => {
    if (searchParams) {
      if (searchParams.get("login") === "true") {
        openModal("login");
      } else if (searchParams.get("register") === "true") {
        openModal("register");
      }
    }
  }, [searchParams, openModal]);

  useEffect(() => {
    // Initialize CTA analytics
    analytics.init();

    const sections = [
      "hero", "features", "modules", "multi-tenant", "workflow",
      "portal-preview", "showcase", "testimonials", "pricing", "faq",
    ];

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
  }, []);

  const isAuthModalOpen = useAuthModalStore((state) => state.isOpen);

  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const addToast = useToastStore((state) => state.addToast);

  const handleGoogleSuccess = async (credential: string) => {
    try {
      const response = await apiClient.post("/auth/login/google", {
        idToken: credential,
      });

      const { accessToken, firstName, role, userId, tenantId, memberships, permissions } = response.data.data;
      
      // Store session cookies
      document.cookie = "hasSession=true; path=/; SameSite=Lax";
      document.cookie = `user_name=${encodeURIComponent(firstName)}; path=/; SameSite=Lax`;
      document.cookie = `user_role=${role}; path=/; SameSite=Lax`;
      localStorage.setItem("user_name", firstName);
      localStorage.setItem("user_role", role);
      
      // Save state in Zustand store
      setAuth(
        accessToken,
        { id: userId, email: response.data.data.email || "", firstName, role, permissions: permissions || [] },
        tenantId,
        memberships
      );

      addToast("Successfully authenticated via Google One-Tap!", "success");

      // Redirect
      if (role === "CLIENT") {
        router.push("/portal");
      } else {
        router.push("/workspace-select");
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || "Google One-Tap authentication failed.";
      addToast(errMsg, "error");
    }
  };



  return (
    <>
      <div className={cn(
        "min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-650 selection:text-white transition-all duration-500 ease-out origin-center",
        isAuthModalOpen ? "blur-md scale-[0.99] pointer-events-none" : ""
      )}>
        {/* Sticky Navigation */}
        <Navbar activeSection={activeSection} />

        {/* Main Content */}
        <main id="main-content" role="main">

          {/* 1. Hero — above fold, eager loaded */}
          <div id="hero">
            <Hero />
          </div>

          {/* 2. Trusted By Brand Marquee */}
          <TrustedBy />

          {/* 3. Features Showcase — BentoGrid + SpotlightCards */}
          <div id="features">
            <Suspense fallback={<SectionSkeleton />}>
              <Features />
            </Suspense>
          </div>

          {/* 4. Modules Overview — Bento grid with 6 module previews */}
          <div id="modules">
            <Suspense fallback={<SectionSkeleton />}>
              <Modules />
            </Suspense>
          </div>

          {/* 5. Multi-Tenant Infrastructure */}
          <div id="multi-tenant">
            <Suspense fallback={<SectionSkeleton />}>
              <MultiTenant />
            </Suspense>
          </div>

          {/* 6. Event Workflow — AnimatedBeam lifecycle visualization */}
          <div id="workflow">
            <Suspense fallback={<SectionSkeleton />}>
              <Workflow />
            </Suspense>
          </div>

          {/* 7. Client Portal Preview — interactive portal mockup */}
          <div id="portal-preview">
            <Suspense fallback={<SectionSkeleton />}>
              <ClientPortalPreview />
            </Suspense>
          </div>

          {/* 8. Interactive Product Showcase — tabbed interface */}
          <div id="showcase">
            <Suspense fallback={<SectionSkeleton />}>
              <ProductShowcase />
            </Suspense>
          </div>

          {/* 9. Client Testimonials Marquee */}
          <div id="testimonials">
            <Suspense fallback={<SectionSkeleton />}>
              <Testimonials />
            </Suspense>
          </div>

          {/* 10. Pricing Plans */}
          <div id="pricing">
            <Suspense fallback={<SectionSkeleton />}>
              <Pricing />
            </Suspense>
          </div>

          {/* 11. FAQ Accordion */}
          <div id="faq">
            <Suspense fallback={<SectionSkeleton />}>
              <Faq />
            </Suspense>
          </div>

          {/* 12. Final CTA with Email Capture */}
          <Suspense fallback={<SectionSkeleton />}>
            <FinalCta />
          </Suspense>
        </main>

        {/* 13. Footer */}
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </div>

      <AuthModal />
    </>
  );
}

export default function Home() {
  const [preloaderActive, setPreloaderActive] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <div 
        className={cn(
          "fixed inset-0 z-[9999] bg-[#09090B] transition-opacity duration-300 pointer-events-none",
          mounted ? "opacity-0" : "opacity-100"
        )} 
      />
      {mounted && preloaderActive && (
        <Preloader onComplete={() => setPreloaderActive(false)} />
      )}
      <Suspense fallback={<div className="min-h-screen bg-[#09090B] flex items-center justify-center text-xs text-zinc-555">Loading EventOS...</div>}>
        <HomeContent preloaderActive={preloaderActive} />
      </Suspense>
    </>
  );
}
