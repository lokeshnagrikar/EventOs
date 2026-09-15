"use client";

import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { analytics } from "@/lib/analytics";
import { useAuthModalStore } from "@/store/authModalStore";
import { cn } from "@/lib/utils";
import { Preloader } from "@/components/landing/preloader/Preloader";

// 1. Above-the-fold eager loads
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { TrustedBy } from "@/components/landing/TrustedBy";

// Dynamic imports for the exact narrative section sequence
import { ProblemSection } from "@/components/landing/ProblemSection";

import { Workflow } from "@/components/landing/Workflow";

import { ProductShowcase } from "@/components/landing/ProductShowcase";

import { Modules } from "@/components/landing/Modules";

import { ClientPortalPreview } from "@/components/landing/ClientPortalPreview";

// 9. AI Engine
const RunOfShowSimulator = dynamic(
  () => import("@/components/landing/RunOfShowSimulator").then((m) => ({ default: m.RunOfShowSimulator })),
  { ssr: false }
);

// 10. Results / Social Proof
const Testimonials = dynamic(
  () => import("@/components/landing/Testimonials").then((m) => ({ default: m.Testimonials })),
  { ssr: true }
);

// 10.5 Workflow Time Recovery Calculator
const RoiCalculator = dynamic(
  () => import("@/components/landing/RoiCalculator").then((m) => ({ default: m.RoiCalculator })),
  { ssr: true }
);

// 11. Pricing
const Pricing = dynamic(
  () => import("@/components/landing/Pricing").then((m) => ({ default: m.Pricing })),
  { ssr: true }
);

// 12. Security
const MultiTenant = dynamic(
  () => import("@/components/landing/MultiTenant").then((m) => ({ default: m.MultiTenant })),
  { ssr: true }
);

// 13. Founder
const FounderSection = dynamic(
  () => import("@/components/landing/FounderSection").then((m) => ({ default: m.FounderSection })),
  { ssr: true }
);

// 14. FAQ
const Faq = dynamic(
  () => import("@/components/landing/Faq").then((m) => ({ default: m.Faq })),
  { ssr: false }
);

// 15. Final CTA
const FinalCta = dynamic(
  () => import("@/components/landing/FinalCta").then((m) => ({ default: m.FinalCta })),
  { ssr: true }
);

// 16. Footer
const Footer = dynamic(
  () => import("@/components/landing/Footer").then((m) => ({ default: m.Footer })),
  { ssr: true }
);

// Ambient & Auxiliary Widgets
const AmbientCursorGlow = dynamic(
  () => import("@/components/ui/AmbientCursorGlow").then((m) => ({ default: m.AmbientCursorGlow })),
  { ssr: false }
);

const WhatsAppNotificationSimulator = dynamic(
  () => import("@/components/notifications/WhatsAppNotificationSimulator").then((m) => ({ default: m.WhatsAppNotificationSimulator })),
  { ssr: false }
);

// Section skeleton loader
function SectionSkeleton() {
  return (
    <div className="py-24 border-b border-slate-200/70 bg-[#FAF9F6] w-full" aria-hidden="true">
      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="h-4 w-40 bg-slate-200/70 rounded-full mx-auto animate-pulse" />
        <div className="h-8 w-96 bg-slate-200/70 rounded-xl mx-auto animate-pulse" />
        <div className="h-4 w-72 bg-slate-200/70 rounded-full mx-auto animate-pulse" />
      </div>
    </div>
  );
}

function HomeContent({ preloaderActive }: { preloaderActive: boolean }) {
  const [activeSection, setActiveSection] = useState<string>("hero");
  const searchParams = useSearchParams();
  const openModal = useAuthModalStore((state) => state.openModal);
  const isAuthModalOpen = useAuthModalStore((state) => state.isOpen);

  useEffect(() => {
    if (searchParams) {
      if (searchParams.get("login") === "true" || searchParams.get("magicToken") || searchParams.get("token")) {
        openModal("login");
      } else if (searchParams.get("register") === "true") {
        openModal("register");
      }
    }
  }, [searchParams, openModal]);

  useEffect(() => {
    // Initialize analytics
    analytics.init();

    // 16-section flow observers
    const sections = [
      "hero",
      "trust-strip",
      "problem",
      "workflow",
      "showcase",
      "modules",
      "portal-preview",
      "ai-assistant",
      "testimonials",
      "time-calculator",
      "pricing",
      "security",
      "founder",
      "faq",
      "final-cta",
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

  return (
    <>
      <div
        className={cn(
          "min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-600 selection:text-white transition-opacity duration-500 ease-out",
          preloaderActive ? "opacity-0" : "opacity-100",
          isAuthModalOpen ? "blur-md scale-[0.99] pointer-events-none" : ""
        )}
      >
        {/* 1. Sticky Navigation */}
        <Navbar activeSection={activeSection} />

        {/* Ambient Cursor Glow */}
        <AmbientCursorGlow />

        {/* Main 16-Section Content Flow */}
        <main id="main-content" role="main">
          {/* 2. Hero */}
          <div id="hero">
            <Hero preloaderActive={preloaderActive} />
          </div>

          {/* 3. Trust / reassurance strip */}
          <TrustedBy />

          {/* 4. Problem section */}
          <ProblemSection />

          {/* 5. Workflow */}
          <Workflow />

          {/* 6. Product demo */}
          <ProductShowcase />

          {/* 7. Core modules */}
          <Modules />

          {/* 8. Client portal */}
          <ClientPortalPreview />

          {/* 9. AI Engine */}
          <Suspense fallback={<SectionSkeleton />}>
            <RunOfShowSimulator />
          </Suspense>

          {/* 10. Results / social proof */}
          <Suspense fallback={<SectionSkeleton />}>
            <Testimonials />
          </Suspense>

          {/* 10.5 Workflow Time Recovery Calculator */}
          <Suspense fallback={<SectionSkeleton />}>
            <RoiCalculator />
          </Suspense>

          {/* 11. Pricing */}
          <Suspense fallback={<SectionSkeleton />}>
            <Pricing />
          </Suspense>

          {/* 12. Security */}
          <Suspense fallback={<SectionSkeleton />}>
            <MultiTenant />
          </Suspense>

          {/* 13. Founder */}
          <Suspense fallback={<SectionSkeleton />}>
            <FounderSection />
          </Suspense>

          {/* 14. FAQ */}
          <Suspense fallback={<SectionSkeleton />}>
            <Faq />
          </Suspense>

          {/* 15. Final CTA */}
          <Suspense fallback={<SectionSkeleton />}>
            <FinalCta />
          </Suspense>
        </main>

        {/* 16. Footer */}
        <Suspense fallback={null}>
          <Footer />
        </Suspense>

        {/* Live Notification Dispatch Simulator */}
        <Suspense fallback={null}>
          <WhatsAppNotificationSimulator />
        </Suspense>
      </div>
    </>
  );
}

let hasPreloaderPlayed = false;

export default function Home() {
  const [preloaderActive, setPreloaderActive] = useState(() => !hasPreloaderPlayed);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("nopreload") === "true" || window.localStorage.getItem("nopreload") === "true") {
        setPreloaderActive(false);
      }
    }
  }, []);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[9999] bg-[#080A11] transition-opacity duration-300 pointer-events-none",
          mounted ? "opacity-0" : "opacity-100"
        )}
      />
      {mounted && preloaderActive && (
        <Preloader
          onComplete={() => {
            hasPreloaderPlayed = true;
            setPreloaderActive(false);
          }}
        />
      )}
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#080A11] flex items-center justify-center text-xs text-zinc-500 font-mono">
            Loading EventOS...
          </div>
        }
      >
        <HomeContent preloaderActive={preloaderActive} />
      </Suspense>
    </>
  );
}
