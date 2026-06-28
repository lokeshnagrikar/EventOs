"use client";

/**
 * EventOS Analytics Hooks
 * Disabled by default. To enable, configure your PostHog/GA tokens
 * and uncomment the tracking library initializers.
 */

interface TrackProps {
  [key: string]: string | number | boolean;
}

export const analytics = {
  /**
   * Initialize analytics libraries
   */
  init: () => {
    if (typeof window === "undefined") return;
    
    // Google Analytics Stub
    // if (process.env.NEXT_PUBLIC_GA_ID) {
    //   const script = document.createElement("script");
    //   script.async = true;
    //   script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`;
    //   document.head.appendChild(script);
    //   window.dataLayer = window.dataLayer || [];
    //   window.gtag = function gtag() { window.dataLayer.push(arguments); };
    //   window.gtag("js", new Date());
    //   window.gtag("config", process.env.NEXT_PUBLIC_GA_ID);
    // }

    // PostHog Stub
    // if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    //   import("posthog-js").then(({ default: posthog }) => {
    //     posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    //       api_host: "https://us.i.posthog.com",
    //       person_profiles: "identified_only",
    //       capture_pageview: true,
    //     });
    //   });
    // }

    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] Initialized stubs");
    }
  },

  /**
   * Track general custom event
   */
  track: (name: string, props?: TrackProps) => {
    if (typeof window === "undefined") return;

    if (process.env.NODE_ENV === "development") {
      console.log(`[Analytics] Track Event: "${name}"`, props);
    }

    // PostHog Track
    // try {
    //   const posthog = (window as any).posthog;
    //   if (posthog) posthog.capture(name, props);
    // } catch (e) {
    //   console.error("PostHog capture failed", e);
    // }

    // Google Analytics Event
    // try {
    //   const gtag = (window as any).gtag;
    //   if (gtag) gtag("event", name, props);
    // } catch (e) {
    //   console.error("Google Analytics tracking failed", e);
    // }
  },

  /**
   * Track CTA Interaction
   */
  trackCta: (ctaId: string, label: string, location: string) => {
    analytics.track("cta_click", {
      cta_id: ctaId,
      cta_label: label,
      page_location: location,
    });
  },
};
