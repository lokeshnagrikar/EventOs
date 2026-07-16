"use client";

/**
 * EventOS Product Analytics & User Intelligence Service
 * 
 * Inspired by enterprise analytics stacks (PostHog, Mixpanel, GA4, Clarity).
 * Features:
 * - Independent dynamic toggle of providers via environment variables
 * - GDPR Consent Management & Navigator Do-Not-Track checks
 * - Batch Event Delivery to optimize network payloads
 * - Offline Cache Queue utilizing localStorage to prevent data loss
 * - Strongly-typed event payloads
 */

interface TrackProps {
  [key: string]: string | number | boolean | any;
}

interface AnalyticsEvent {
  name: string;
  props: TrackProps;
  timestamp: string;
}

class AnalyticsService {
  private queue: AnalyticsEvent[] = [];
  private consentAccepted: boolean = true;
  private batchIntervalId: any = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.consentAccepted = window.localStorage.getItem("eventos_consent_accepted") !== "false";
      this.loadQueue();
      this.init();
      // Start batch scheduler
      this.batchIntervalId = setInterval(() => this.flushQueue(), 5000);
      
      // Listen for window close or offline changes
      window.addEventListener("beforeunload", () => this.saveQueue());
    }
  }

  /**
   * Initialize third-party scripts dynamically if configuration tokens exist
   */
  public init() {
    if (typeof window === "undefined" || !this.consentAccepted) return;

    // Respect Do Not Track headers
    if (window.navigator && (window.navigator.doNotTrack === "1" || (window as any).doNotTrack === "1")) {
      if (process.env.NODE_ENV === "development") {
        console.log("[Analytics] Do Not Track header detected. Blocking third-party initialization.");
      }
      return;
    }

    // 1. Google Analytics 4 Script Tag
    if (process.env.NEXT_PUBLIC_GA_ID) {
      try {
        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`;
        document.head.appendChild(script);
        (window as any).dataLayer = (window as any).dataLayer || [];
        (window as any).gtag = function gtag() {
          (window as any).dataLayer.push(arguments);
        };
        (window as any).gtag("js", new Date());
        (window as any).gtag("config", process.env.NEXT_PUBLIC_GA_ID);
      } catch (e) {
        console.error("GA4 initialization failed", e);
      }
    }

    // 2. Microsoft Clarity Script Injection
    if (process.env.NEXT_PUBLIC_CLARITY_ID) {
      try {
        const c = (window as any).clarity = (window as any).clarity || function() {
          (c.q = c.q || []).push(arguments);
        };
        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.clarity.ms/tag/${process.env.NEXT_PUBLIC_CLARITY_ID}`;
        document.head.appendChild(script);
      } catch (e) {
        console.error("Microsoft Clarity initialization failed", e);
      }
    }

    // 3. PostHog Dynamic Initializer
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      try {
        import("posthog-js").then(({ default: posthog }) => {
          posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
            api_host: "https://us.i.posthog.com",
            person_profiles: "identified_only",
            capture_pageview: true,
          });
        }).catch(e => console.error("PostHog import failed", e));
      } catch (e) {
        console.error("PostHog initialization failed", e);
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] Initialized stubs and providers check complete.");
    }
  }

  /**
   * Set Consent settings (GDPR ready)
   */
  public setConsent(accepted: boolean) {
    this.consentAccepted = accepted;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("eventos_consent_accepted", accepted ? "true" : "false");
      if (!accepted) {
        this.queue = [];
        this.saveQueue();
      } else {
        this.init();
      }
    }
  }

  /**
   * Strongly-typed Event Track
   */
  public track(eventName: string, props: TrackProps = {}) {
    if (typeof window === "undefined" || !this.consentAccepted) return;

    const event: AnalyticsEvent = {
      name: eventName,
      props: {
        ...props,
        url: window.location.href,
        userAgent: window.navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`
      },
      timestamp: new Date().toISOString()
    };

    // Add to batch queue
    this.queue.push(event);

    if (process.env.NODE_ENV === "development") {
      console.log(`[Analytics] Queued Event: "${eventName}"`, event);
    }

    // If queue gets large, flush immediately to optimize memory
    if (this.queue.length >= 10) {
      this.flushQueue();
    }
  }

  /**
   * Flush Batch Events to configured providers
   */
  private flushQueue() {
    if (this.queue.length === 0 || typeof window === "undefined") return;

    const eventsToFlush = [...this.queue];
    this.queue = []; // Clear active queue
    this.saveQueue();

    if (process.env.NODE_ENV === "development") {
      console.log(`[Analytics] Flushing batch of ${eventsToFlush.length} events...`);
    }

    eventsToFlush.forEach(event => {
      // 1. Google Analytics 4 Send
      try {
        const gtag = (window as any).gtag;
        if (gtag) gtag("event", event.name, event.props);
      } catch (e) {
        console.error("GA4 tracking fail", e);
      }

      // 2. PostHog Send
      try {
        const posthog = (window as any).posthog;
        if (posthog) posthog.capture(event.name, event.props);
      } catch (e) {
        console.error("PostHog tracking fail", e);
      }

      // 3. Custom server log/api client reporting (if needed)
      // apiClient.post("/analytics/log", event).catch(() => {});
    });
  }

  /**
   * Save Queue to LocalStorage in case of offline states
   */
  private saveQueue() {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("eventos_analytics_queue", JSON.stringify(this.queue));
      }
    } catch (e) {
      console.error("Failed to save analytics queue", e);
    }
  }

  /**
   * Load Queue from LocalStorage
   */
  private loadQueue() {
    try {
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem("eventos_analytics_queue");
        if (raw) {
          this.queue = JSON.parse(raw);
        }
      }
    } catch (e) {
      console.error("Failed to load analytics queue", e);
    }
  }

  // --- Strongly Typed Helpers ---

  public trackCta(ctaId: string, label: string, location: string) {
    this.track("cta_click", { cta_id: ctaId, cta_label: label, page_location: location });
  }

  public trackAuth(action: "register" | "login" | "logout" | "password_reset", email?: string) {
    this.track("authentication_event", { action, email_masked: email ? email.replace(/(?<=.{2}).(?=[^@]*?@)/g, "*") : "N/A" });
  }

  public trackWorkspace(action: "created" | "invited" | "switched", workspaceId: string) {
    this.track("workspace_event", { action, workspace_id: workspaceId });
  }

  public trackCrm(action: "lead_created" | "lead_edited" | "lead_converted" | "quote_created" | "quote_accepted", details: TrackProps) {
    this.track("crm_event", { action, ...details });
  }

  public trackBilling(action: "plan_selected" | "coupon_applied" | "invoice_pdf_printed" | "cancellation_offered" | "cancellation_completed", details: TrackProps) {
    this.track("billing_event", { action, ...details });
  }

  public trackAi(action: "prompt_submitted" | "quote_generated" | "forecast_requested", query: string) {
    this.track("ai_event", { action, query_length: query.length });
  }

  public trackError(type: "frontend" | "backend" | "payment" | "upload", message: string, details: TrackProps = {}) {
    this.track("system_error", { error_type: type, error_message: message, ...details });
  }
}

export const analytics = new AnalyticsService();
