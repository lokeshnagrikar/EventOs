"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  X,
  User,
  ArrowRight,
  Command,
  ChevronRight,
  LogIn,
  RotateCcw,
  Bot,
  Zap,
  ShieldCheck,
  QrCode,
  Image as ImageIcon,
  DollarSign,
  Calendar,
  Layers,
  FileText,
  Users,
  Settings,
  HelpCircle,
  Clock,
  CheckCircle2
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { generateAIResponse } from "@/lib/aiProvider";

const CHATBOT_LOTTIE_URL = "https://lottie.host/81c78ae8-59f5-4e19-bc6c-b7c5ba867ffd/Id8PQ7Y2HD.lottie";

const DotLottieReact = dynamic(
  () => import("@lottiefiles/dotlottie-react").then((mod) => mod.DotLottieReact),
  {
    ssr: false,
    loading: () => (
      <img
        src="/chatbot-animated.gif"
        alt="EventOS AI"
        className="w-full h-full object-contain pointer-events-none lottie-theme-bot"
      />
    ),
  }
);

// ── ROUTES WHERE AI ASSISTANT MUST BE COMPLETELY HIDDEN ─────────────────────
// 1. /share: Public guest photo viewing & downloads (external guests & couples scan QR here - must be 100% clean)
// 2. /portal: Client guest portal
// 3. /onboarding, /workspace-select: Linear setup flows
// 4. /superadmin: Master superadmin console
// 5. Auth single-focus utility flows
const HIDDEN_ROUTES = [
  "/share",
  "/portal",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/accept-invite",
  "/onboarding",
  "/workspace-select",
  "/superadmin",
  "/design-system-demo",
  "/api"
];

// Public marketing & informational routes
const PUBLIC_MARKETING_ROUTES = [
  "/",
  "/about",
  "/pricing",
  "/features",
  "/solutions",
  "/book-demo",
  "/contact",
  "/terms",
  "/privacy",
  "/refund",
  "/sla",
  "/cookies",
  "/founder-story",
  "/customers",
  "/demo",
  "/blog",
  "/terms-and-conditions",
  "/privacy-policy",
  "/refund-policy",
  "/cancellation-policy",
  "/shipping-policy"
];

function isHiddenRoute(pathname: string): boolean {
  if (!pathname) return false;
  const path = pathname.toLowerCase();
  return HIDDEN_ROUTES.some((route) => path === route || path.startsWith(route + "/"));
}

function isMarketingRoute(pathname: string): boolean {
  if (!pathname) return true;
  const path = pathname.toLowerCase();
  if (path === "/") return true;
  return PUBLIC_MARKETING_ROUTES.some((route) => route !== "/" && (path === route || path.startsWith(route + "/")));
}

function parseBoldText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong
          key={i}
          className="font-bold text-blue-300 drop-shadow-[0_0_8px_rgba(96,165,250,0.3)]"
        >
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function renderFormattedText(text: string) {
  if (!text) return null;
  const paragraphs = text.split("\n\n");
  return paragraphs.map((para, pIdx) => {
    const lines = para.split("\n");
    if (lines.length > 1 || lines[0].trim().startsWith("•") || lines[0].trim().startsWith("- ")) {
      return (
        <div key={pIdx} className="space-y-1.5 my-2">
          {lines.map((line, lIdx) => {
            const trimmed = line.trim();
            const isBullet = trimmed.startsWith("•") || trimmed.startsWith("- ");
            const content = isBullet ? trimmed.replace(/^[•\-]\s*/, "") : line;
            return (
              <div key={lIdx} className={isBullet ? "flex items-start gap-2 pl-0.5" : ""}>
                {isBullet && (
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400 mt-2 shrink-0 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
                )}
                <span className="leading-relaxed text-slate-100 text-[12.5px]">
                  {parseBoldText(content)}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return (
      <p key={pIdx} className="mb-2 last:mb-0 leading-relaxed text-slate-100 text-[12.5px]">
        {parseBoldText(para)}
      </p>
    );
  });
}

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
  suggestions?: { label: string; action: () => void }[];
  actionBtn?: { label: string; href: string; icon?: any };
}

export default function AiAssistant() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const { isAuthenticated, user } = useAuthStore();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isCookieBannerOpen, setIsCookieBannerOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedConsent = localStorage.getItem("eventos_cookie_consent");
    if (!savedConsent) {
      setIsCookieBannerOpen(true);
    }

    const handleCookieState = (e: any) => {
      setIsCookieBannerOpen(Boolean(e.detail?.open));
    };

    window.addEventListener("cookie-banner-state", handleCookieState);
    return () => window.removeEventListener("cookie-banner-state", handleCookieState);
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Determine mode: Public Concierge vs Authenticated Workspace Co-pilot
  const isPublicMode = useMemo(() => {
    return !isAuthenticated || isMarketingRoute(pathname);
  }, [isAuthenticated, pathname]);

  const isAuthRoute = useMemo(() => {
    const path = pathname.toLowerCase();
    return path === "/login" || path === "/register";
  }, [pathname]);

  // Derive Context based on Current Pathname
  const pageContext = useMemo(() => {
    const path = pathname.toLowerCase();
    if (path === "/login") {
      return { name: "Account Login", module: "Auth AI", role: "Access Specialist", icon: LogIn };
    }
    if (path === "/register") {
      return { name: "Agency Registration", module: "Auth AI", role: "Onboarding Specialist", icon: Sparkles };
    }
    if (isPublicMode) {
      return { name: "EventOS Concierge", module: "Public AI", role: "Product Specialist", icon: Bot };
    }
    if (path.startsWith("/crm") || path.startsWith("/leads")) {
      return { name: "CRM / Leads", module: "CRM AI", role: "Sales Co-pilot", icon: Users };
    }
    if (path.startsWith("/events") || path.startsWith("/bookings")) {
      return { name: "Events Planning", module: "Event AI", role: "Operations Co-pilot", icon: Calendar };
    }
    if (path.startsWith("/quotes")) {
      return { name: "Quotes & Proposals", module: "Quote AI", role: "Pricing Co-pilot", icon: FileText };
    }
    if (path.startsWith("/gallery")) {
      return { name: "Media Galleries", module: "Gallery AI", role: "Media & QR Co-pilot", icon: ImageIcon };
    }
    if (path.startsWith("/finance") || path.startsWith("/invoices") || path.startsWith("/payments")) {
      return { name: "Finance & UPI", module: "Finance AI", role: "Finance Co-pilot", icon: DollarSign };
    }
    if (path.startsWith("/tasks")) {
      return { name: "Tasks & Milestones", module: "Task AI", role: "Workflow Co-pilot", icon: CheckCircle2 };
    }
    if (path.startsWith("/clients")) {
      return { name: "Client Directory", module: "Client AI", role: "Client Co-pilot", icon: Users };
    }
    if (path.startsWith("/vendors")) {
      return { name: "Vendor Management", module: "Vendor AI", role: "Vendor Co-pilot", icon: Layers };
    }
    if (path.startsWith("/settings")) {
      return { name: "Settings & System", module: "Settings AI", role: "Admin Co-pilot", icon: Settings };
    }
    if (path.startsWith("/reports") || path.startsWith("/analytics")) {
      return { name: "Reports & Analytics", module: "Analytics AI", role: "BI Co-pilot", icon: Zap };
    }
    if (path.startsWith("/chat")) {
      return { name: "Workspace Chat", module: "Collab AI", role: "Team Co-pilot", icon: Bot };
    }
    if (path.startsWith("/calculator") || path.startsWith("/quote-calculator")) {
      return { name: "Quote Estimator", module: "Calculator AI", role: "Pricing Estimator", icon: FileText };
    }
    if (path.startsWith("/help")) {
      return { name: "Help Center", module: "Help AI", role: "Support Specialist", icon: HelpCircle };
    }
    return { name: "Dashboard", module: "Overview", role: "Executive Co-pilot", icon: Sparkles };
  }, [pathname, isPublicMode]);

  // Generate context-aware suggestions
  const getContextSuggestions = (): { label: string; action: () => void }[] => {
    const path = pathname.toLowerCase();
    if (path === "/login") {
      return [
        { label: "Sign in with Google SSO", action: () => handleSendText("How do I sign in with Google SSO?") },
        { label: "Forgot password / recovery", action: () => handleSendText("How do I reset my password?") },
        { label: "Create new agency account", action: () => handleSendText("How do I create a new agency account?") },
        { label: "Explore features & pricing", action: () => handleSendText("What are the pricing plans and features?") }
      ];
    }
    if (path === "/register") {
      return [
        { label: "14-Day Free Trial features", action: () => handleSendText("What is included in the 14-day free trial?") },
        { label: "Founding Cohort (50% Off)", action: () => handleSendText("How do I join the founding cohort of 25 agencies?") },
        { label: "Sign up with Google SSO", action: () => handleSendText("How do I sign up with Google SSO?") },
        { label: "Which plan should I choose?", action: () => handleSendText("Which plan is best for my agency?") }
      ];
    }
    if (isPublicMode) {
      return [
        { label: "Core features overview", action: () => handleSendText("What are the core features of EventOS?") },
        { label: "Pricing & Plans", action: () => handleSendText("What are your pricing plans?") },
        { label: "Founding Cohort (50% Off)", action: () => handleSendText("How do I join the founding cohort of 25 agencies?") },
        { label: "Talk with Founder Lokesh", action: () => handleSendText("Who is the founder of EventOS?") }
      ];
    }

    if (pageContext.module === "Gallery AI") {
      return [
        { label: "Public vs Private album rules", action: () => handleSendText("Can guests download photos if the album is private?") },
        { label: "Live Scannable QR Codes", action: () => handleSendText("How do live QR codes work for guests to access albums?") },
        { label: "Save QR PNG & Print", action: () => handleSendText("How can I download the QR code PNG to print on table cards?") },
        { label: "Watermark & Passcode lock", action: () => handleSendText("How to protect albums with agency watermark and passcode?") }
      ];
    }
    if (pageContext.module === "Finance AI") {
      return [
        { label: "Dynamic UPI QR generation", action: () => handleSendText("How to generate instant dynamic UPI QR for client payments?") },
        { label: "Track overdue receivables", action: () => handleSendText("Where can I track overdue client advances and balances?") },
        { label: "Record offline Cash/NEFT", action: () => handleSendText("How do I record offline Cash or bank transfer advances?") }
      ];
    }
    if (pageContext.module === "Event AI") {
      return [
        { label: "Build wedding timeline (Haldi/Sangeet)", action: () => handleSendText("How to build a multi-day wedding ceremony timeline?") },
        { label: "Vendor ingress & crew check-in", action: () => handleSendText("How to manage vendor ingress checklists and crew arrivals?") },
        { label: "Day-of cue sheets", action: () => handleSendText("How do I print or share day-of cue sheets with coordinators?") }
      ];
    }
    if (pageContext.module === "Quote AI") {
      return [
        { label: "Proposal line-item structures", action: () => handleSendText("How to structure catering, decor, and AV line items in quotes?") },
        { label: "18% GST & milestone splits", action: () => handleSendText("How do 18% GST and milestone payments work in EventOS?") },
        { label: "Client e-sign approval link", action: () => handleSendText("How do clients digitally approve quotes with e-signatures?") }
      ];
    }
    if (pageContext.module === "CRM AI") {
      return [
        { label: "Lead qualification scoring", action: () => handleSendText("How does automated lead scoring work in EventOS?") },
        { label: "Convert lead to formal quote", action: () => handleSendText("How do I convert an active lead into a proposal quote?") },
        { label: "Import leads via CSV/Excel", action: () => handleSendText("How can I import my existing leads into EventOS?") }
      ];
    }
    if (pageContext.module === "Task AI") {
      return [
        { label: "Assign coordinator tasks", action: () => handleSendText("How to delegate tasks and track deadlines?") },
        { label: "Milestone dependencies", action: () => handleSendText("How to set task milestones for event days?") }
      ];
    }
    if (pageContext.module === "Settings AI") {
      return [
        { label: "Meta WhatsApp Cloud API", action: () => handleSendText("How to configure WhatsApp Cloud API for automated alerts?") },
        { label: "Custom CNAME domain (White-Label)", action: () => handleSendText("How to connect our custom domain like clients.myagency.com?") },
        { label: "Invite team & set RBAC roles", action: () => handleSendText("How do I invite team members and set permissions?") }
      ];
    }
    return [
      { label: "Core 5-step walkthrough", action: () => handleSendText("Guide me through the 5 core steps of EventOS") },
      { label: "Invite coordinators & team", action: () => handleSendText("How do I invite team members and set roles?") },
      { label: "Setup GST & UPI Gateway", action: () => handleSendText("How to configure agency GST and UPI payment settings?") }
    ];
  };

  // Welcome message when context or drawer opens
  const initializeChat = () => {
    let welcomeText = "";
    const path = pathname.toLowerCase();
    if (path === "/login") {
      welcomeText = "Welcome to **EventOS**! 🔐\n\nI am your **Access Specialist**. I can help you sign in, guide you with **Google SSO**, or help you recover your password.\n\nHow can I assist your access today?";
    } else if (path === "/register") {
      welcomeText = "Welcome to **EventOS**! ✨\n\nReady to elevate your event agency? Join our **Founding Agency Cohort (Private Beta)** — limited to 25 agencies with a **50% lifetime price lock** and direct 1-on-1 founder onboarding with Lokesh.\n\nNeed help choosing a plan or signing up with Google SSO?";
    } else if (isPublicMode) {
      welcomeText = "Welcome to **EventOS**! ✨\n\nI am your **EventOS AI Concierge**. We built EventOS to replace chaotic WhatsApp groups and manual Excel quotes with a unified operating system for wedding & event agencies.\n\n• **Private Beta Active**: Limited to **25 Founding Agencies** with **50% lifetime price lock**.\n• **Founder Direct**: Built by **Lokesh Nagrikar** ([@solo.founder.ai](https://www.instagram.com/solo.founder.ai/)).\n\nAsk me anything about features, pricing, or day-of workflows!";
    } else {
      const name = user?.firstName || "Partner";
      welcomeText = `Hello, **${name}**! 👋\n\nI am your **EventOS Co-pilot** for **${pageContext.name}** (${pageContext.role}).\n\nI can assist you with live workflows, guidance on album sharing & real QR codes, GST quote generation, or tracking vendor operations.\n\nHow can I help you today?`;
    }

    setMessages([
      {
        id: "welcome",
        sender: "ai",
        text: welcomeText,
        timestamp: new Date(),
        suggestions: getContextSuggestions()
      }
    ]);
  };

  useEffect(() => {
    initializeChat();
  }, [pageContext.module, isPublicMode, pathname]);

  // Keyboard shortcut toggle (Ctrl + Space / Cmd + Space or Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === "Space") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Auto-Scroll to bottom smoothly
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [messages, isTyping, isOpen]);

  // Click outside to close drawer
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.closest(".ai-trigger-btn")) {
          setIsOpen(false);
        }
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // 1. CRITICAL: Completely hide on excluded routes like /share (guest photo viewer), /portal, etc.
  if (isHiddenRoute(pathname)) {
    return null;
  }

  // Handle send user query
  const handleSendText = async (text: string) => {
    if (!text.trim()) return;

    const userMsgId = Math.random().toString(36).substring(7);
    const newMsg: Message = {
      id: userMsgId,
      sender: "user",
      text,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setIsTyping(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const q = text.toLowerCase();
      let aiResponse = "";
      let actionBtn: Message["actionBtn"] = undefined;
      let nextSuggestions: { label: string; action: () => void }[] = [];

      // ==========================================
      // A. PUBLIC CONCIERGE & AUTH ACCESS RESPONSES
      // ==========================================
      if (isPublicMode) {
        if (q.includes("google") || q.includes("sso") || q.includes("oauth")) {
          aiResponse =
            "**Sign In with Google SSO:**\n\n" +
            "• Click the **'Continue with Google'** button directly on the page.\n" +
            "• It securely logs you into your agency workspace via enterprise OAuth2 in 1 click.\n" +
            "• If you are new, it automatically registers your agency and starts your **14-day free trial**.";
          actionBtn = { label: "Continue with Google", href: "/login", icon: LogIn };
          nextSuggestions = [
            { label: "Forgot password / recovery", action: () => handleSendText("How do I reset my password?") },
            { label: "Create new agency account", action: () => handleSendText("How do I create a new agency account?") }
          ];
        } else if (q.includes("password") || q.includes("forgot") || q.includes("reset") || q.includes("recover")) {
          aiResponse =
            "**Password Recovery Assistance:**\n\n" +
            "• Click on **'Forgot password?'** on the sign-in screen or click the button below.\n" +
            "• Enter your registered agency email address, and we will dispatch a secure reset link to your inbox immediately.";
          actionBtn = { label: "Reset Password", href: "/forgot-password" };
          nextSuggestions = [
            { label: "Sign in with Google SSO", action: () => handleSendText("How do I sign in with Google SSO?") },
            { label: "Back to Sign In", action: () => handleSendText("Take me to the login page") }
          ];
        } else if (q.includes("register") || q.includes("sign up") || q.includes("create account") || q.includes("trial")) {
          aiResponse =
            "**EventOS 14-Day Free Trial:**\n\n" +
            "• Includes full unrestricted access to CRM, Interactive Proposal Builder, Day-of Timelines, and Media Galleries.\n" +
            "• **Zero credit card required** to begin.\n" +
            "• Get your entire event agency onboarded in under 60 seconds!";
          actionBtn = { label: "Start Free 14-Day Trial", href: "/register" };
          nextSuggestions = [
            { label: "Explore pricing plans", action: () => handleSendText("What are the pricing plans?") },
            { label: "Sign in with existing account", action: () => handleSendText("I want to sign in") }
          ];
        } else if (q.includes("founder") || q.includes("lokesh") || q.includes("instagram") || q.includes("who built") || q.includes("creator") || q.includes("solo")) {
          aiResponse =
            "**Meet the Founder of EventOS:**\n\n" +
            "• **Solo Founder & Architect**: **Lokesh Nagrikar**, building out of Nagpur, Maharashtra, India.\n" +
            "• **Mission**: Replacing the chaotic mess of 15 WhatsApp groups, manual Word quotes, and unpaid 30% advances with a high-performance, GST-compliant event operating system.\n" +
            "• **Instagram**: Follow and DM him directly at **[@solo.founder.ai](https://www.instagram.com/solo.founder.ai/)**.\n" +
            "• **Founding Beta Cohort**: We are onboarding our first 25 agency partners with direct 1-on-1 founder support.";
          actionBtn = { label: "DM @solo.founder.ai on Instagram", href: "https://www.instagram.com/solo.founder.ai/" };
          nextSuggestions = [
            { label: "Apply for Founding Cohort (50% Off)", action: () => handleSendText("How do I join the founding cohort of 25 agencies?") },
            { label: "Read the full Founder Story", action: () => router.push("/founder-story") }
          ];
        } else if (q.includes("cohort") || q.includes("beta") || q.includes("founding") || q.includes("slots")) {
          aiResponse =
            "**EventOS Founding Agency Cohort (Private Beta):**\n\n" +
            "• **Limited to 25 Agencies**: We are hand-picking 25 high-standard Indian event agencies to build with us.\n" +
            "• **50% Lifetime Price Lock**: Founding members lock in half-price pricing permanently.\n" +
            "• **Direct Founder Access**: You get direct WhatsApp and 1-on-1 workflow setup with founder Lokesh.\n" +
            "• **Tailored Modules**: We will customize line-item structures and contract terms to match your exact agency needs.";
          actionBtn = { label: "Apply for Founding Cohort", href: "/register" };
          nextSuggestions = [
            { label: "Explore pricing plans", action: () => handleSendText("What are the pricing plans?") },
            { label: "Talk with Founder on Instagram", action: () => handleSendText("Who is the founder of EventOS?") }
          ];
        } else if (q.includes("pricing") || q.includes("cost") || q.includes("plan") || q.includes("tier")) {
          aiResponse =
            "**EventOS Transparent Pricing Plans:**\n\n" +
            "• **Starter (₹1,999/mo)**: For solo planners & boutique studios. Up to 5 active events, 2 team seats, 20 GB storage, AI Quote Generator, and digital proposals.\n" +
            "• **Professional (₹5,999/mo)**: Most popular choice! For growing agencies. Up to 20 active events/mo, 5 team seats, 100 GB storage, AI Timeline Generator, vendor tracking, and WhatsApp/SMS alerts.\n" +
            "• **Agency (₹11,999/mo)**: For high-volume productions. Unlimited active events, unlimited seats, 500+ GB storage, full White-Label Client Portal, and custom domain.\n\n" +
            "💡 *Annual billing saves ~20% across all plans!*";
          actionBtn = { label: "View Detailed Pricing Table", href: "/pricing" };
          nextSuggestions = [
            { label: "Book a 1-on-1 demo", action: () => handleSendText("How do I book a demo?") },
            { label: "How does White-Label work?", action: () => handleSendText("Tell me about custom domain white-label") }
          ];
        } else if (q.includes("feature") || q.includes("what can") || q.includes("do for me") || q.includes("overview")) {
          aiResponse =
            "**EventOS Core Capabilities:**\n\n" +
            "1. **CRM & Lead Pipeline**: Capture inquiries, run quality scoring, and track inquiry status.\n" +
            "2. **Interactive Proposal Builder**: Multi-tier itemized packages, automated 18% GST calculation, and digital e-signatures.\n" +
            "3. **Event Operations & Timeline**: Multi-day ceremony timelines (Sangeet, Haldi, Reception) with vendor ingress checklists.\n" +
            "4. **Smart Finance & UPI Desk**: Instant dynamic UPI QR codes (GPay, PhonePe, Paytm) and automated invoice tracking.\n" +
            "5. **Client Proofing Galleries**: High-speed photo delivery with real scannable QR codes, client favorites selection, and PIN locks.";
          actionBtn = { label: "Explore Solutions", href: "/solutions" };
          nextSuggestions = [
            { label: "Book a live demo", action: () => handleSendText("I want to book a live demo") },
            { label: "Compare pricing plans", action: () => handleSendText("What are the pricing plans?") }
          ];
        } else {
          aiResponse =
            "**EventOS** is India's premier Operating System built specifically for wedding planners, event coordinators, and creative agencies.\n\n" +
            "We automate everything from initial lead intake to signed quotes, day-of timelines, real QR code photo sharing, and high-speed delivery.";
          actionBtn = { label: "Book a Demo", href: "/book-demo" };
          nextSuggestions = [
            { label: "View Pricing", action: () => handleSendText("What are the pricing tiers?") },
            { label: "Explore Features", action: () => handleSendText("What features are included?") }
          ];
        }
      }

      // ==========================================
      // B. AUTHENTICATED WORKSPACE CO-PILOT RESPONSES (Context-Rich & Actionable)
      // ==========================================
      else {
        // Try live AI generation via Gemini first
        let liveGenerated = false;
        try {
          const liveAnswer = await generateAIResponse(
            `${pageContext.name} (${pageContext.role})`,
            text
          );
          if (liveAnswer && liveAnswer.trim().length > 0) {
            aiResponse = liveAnswer;
            liveGenerated = true;
          }
        } catch (e) {
          console.warn("[AiAssistant] Live generation failed, using workspace fallback:", e);
        }

        // 1. GALLERY & QR CODE RULES
        if (q.includes("qr") || q.includes("download") || q.includes("private") || q.includes("public") || q.includes("watermark") || q.includes("proofing") || q.includes("album") || q.includes("photo")) {
          actionBtn = { label: "Open Media Gallery", href: "/gallery", icon: ImageIcon };
          nextSuggestions = [
            { label: "Public vs Private album rules", action: () => handleSendText("Explain the difference between Public and Private albums") },
            { label: "How to save QR Code PNG", action: () => handleSendText("How do I download the QR Code PNG?") }
          ];
          if (!liveGenerated) {
            if (q.includes("private") || q.includes("download") || q.includes("public") || q.includes("rule")) {
              aiResponse =
                "**Album Visibility & Download Security Rules:**\n\n" +
                "• **PUBLIC Mode (Downloads ON)**:\n" +
                "  - Guests scanning the QR code or opening the link can freely browse memories and click **'Download Album'** to get high-resolution photos.\n" +
                "  - Best for finalized event galleries shared with wedding attendees.\n\n" +
                "• **PRIVATE Mode (Downloads Locked)**:\n" +
                "  - Blocks public downloads and restricts unauthenticated guest access.\n" +
                "  - Only agency operators or authorized clients with a token/passcode can preview.\n" +
                "  - Ideal during photo editing, proofing, or before final payment clearance.\n\n" +
                "💡 *You can toggle visibility in 1 click from the top header or sidebar!*";
            } else if (q.includes("qr") || q.includes("scan") || q.includes("print")) {
              aiResponse =
                "**Live Scannable QR Codes for Guests:**\n\n" +
                "• **Real High-Resolution QR**: Generated instantly via high-contrast scannable API (`api.qrserver.com`).\n" +
                "• **Universal Scan**: Compatible with any mobile phone camera, Google Lens, or scanner.\n" +
                "• **Save QR PNG**: Click **'Save QR PNG'** to download the clean graphic file for printing on table stands, welcome cards, or display stands.\n" +
                "• **Share Tokens**: Generate custom expiration tokens (e.g. 7 days) with optional passcode locks and agency watermark overlays.";
            } else {
              aiResponse =
                "**Media Gallery & Proofing Engine:**\n\n" +
                "• **Fast Cloudinary Storage**: Upload RAW, 4K MP4s, AVIF, and JPG assets effortlessly.\n" +
                "• **Live QR Distribution**: Instant QR codes for wedding tables and reception screens.\n" +
                "• **Watermark Protection**: Automatically stamp your agency name until client milestone invoices are cleared.\n" +
                "• **Recycle Bin**: 30-day recovery retention for soft-deleted assets.";
            }
          }
        }

        // 2. FINANCE & PAYMENTS
        else if (q.includes("finance") || q.includes("payment") || q.includes("upi") || q.includes("invoice") || q.includes("gst") || q.includes("advance") || q.includes("unpaid")) {
          actionBtn = { label: "Open Finance Desk", href: "/finance", icon: DollarSign };
          nextSuggestions = [
            { label: "Generate Dynamic UPI QR", action: () => handleSendText("How to generate instant dynamic UPI QR for client payments?") },
            { label: "Open Invoices Desk", action: () => { router.push("/invoices"); setIsOpen(false); } }
          ];
          if (!liveGenerated) {
            aiResponse =
              "**Smart Finance & UPI Desk:**\n\n" +
              "• **Instant Dynamic UPI QR**: Generates scannable UPI codes (GPay, PhonePe, Paytm, BHIM) with exact invoice amount & agency VPA.\n" +
              "• **Milestone Advances**: Typical structure: 30% on quote approval, 50% on vendor ingress, 20% on album delivery.\n" +
              "• **Automated 18% GST**: Compliant tax invoices with automated line-item calculation and downloadable sales reports.\n" +
              "• **Outstanding Tracking**: Filter pending receivables and send 1-click WhatsApp payment reminders.";
          }
        }

        // 3. EVENTS & DAY-OF TIMELINES
        else if (q.includes("event") || q.includes("timeline") || q.includes("schedule") || q.includes("wedding") || q.includes("cue") || q.includes("ingress") || q.includes("ceremony")) {
          actionBtn = { label: "Open Events & Calendar", href: "/events", icon: Calendar };
          nextSuggestions = [
            { label: "Build multi-day timeline", action: () => handleSendText("How to build a multi-day wedding ceremony timeline?") },
            { label: "Vendor ingress checklist", action: () => handleSendText("How to manage vendor ingress checklists and crew arrivals?") }
          ];
          if (!liveGenerated) {
            aiResponse =
              "**Event Operations & Day-of Timeline:**\n\n" +
              "• **Multi-Day Itinerary**: Create dedicated segments for Haldi, Mehendi, Sangeet, Muhurtham, and Reception.\n" +
              "• **Day-of Cue Sheets**: Synchronize sound, stage lighting, bridal entry music, and catering timings.\n" +
              "• **Vendor Ingress Checklists**: Assign arrival times and gate passes to decorators, sound technicians, and florists.\n" +
              "• **Coordinator Dispatch**: Delegate sub-tasks with real-time status updates.";
          }
        }

        // 4. QUOTES & PROPOSALS
        else if (q.includes("quote") || q.includes("proposal") || q.includes("estimate") || q.includes("pricing") || q.includes("line item")) {
          actionBtn = { label: "Open Quotes Desk", href: "/quotes", icon: FileText };
          nextSuggestions = [
            { label: "Proposal line-item structures", action: () => handleSendText("How to structure catering, decor, and AV line items in quotes?") },
            { label: "Client digital e-signatures", action: () => handleSendText("How do clients digitally approve quotes with e-signatures?") }
          ];
          if (!liveGenerated) {
            aiResponse =
              "**Interactive Proposal & Quote Builder:**\n\n" +
              "• **Itemized Categories**: Group items under Decor & Design, Catering & F&B, Sound & Lighting, and Production.\n" +
              "• **Tiered Packages**: Present Silver, Gold, and Royal package options to maximize average contract value.\n" +
              "• **Digital E-Signatures**: Clients can sign quotes directly on mobile or desktop to lock their booking.\n" +
              "• **Instant WhatsApp Sharing**: Send proposal links directly via WhatsApp Cloud API.";
          }
        }

        // 5. CRM & LEADS
        else if (q.includes("lead") || q.includes("crm") || q.includes("inquiry") || q.includes("convert") || q.includes("pipeline")) {
          actionBtn = { label: "Open CRM Desk", href: "/crm", icon: Users };
          nextSuggestions = [
            { label: "Lead scoring formula", action: () => handleSendText("How does automated lead scoring work in EventOS?") },
            { label: "Convert lead to quote", action: () => handleSendText("How do I convert an active lead into a proposal quote?") }
          ];
          if (!liveGenerated) {
            aiResponse =
              "**CRM & Lead Pipeline:**\n\n" +
              "• **Smart Lead Intake**: Capture inquiries from website forms, Instagram ads, or manual walk-ins.\n" +
              "• **Automated Scoring**: Leads are scored based on budget, guest count, and event date urgency.\n" +
              "• **1-Click Conversion**: Convert qualified leads directly into formal proposal drafts without re-entering details.\n" +
              "• **Activity Timeline**: Log client calls, WhatsApp discussions, and venue visit notes in one place.";
          }
        }

        // 6. TEAM, ROLES & SETTINGS
        else if (q.includes("setting") || q.includes("team") || q.includes("member") || q.includes("whatsapp") || q.includes("domain") || q.includes("rbac") || q.includes("cname")) {
          actionBtn = { label: "Open Settings Center", href: "/settings", icon: Settings };
          nextSuggestions = [
            { label: "WhatsApp Cloud API setup", action: () => handleSendText("How to configure WhatsApp Cloud API for automated alerts?") },
            { label: "Custom CNAME white-label", action: () => handleSendText("How to connect our custom domain like clients.myagency.com?") }
          ];
          if (!liveGenerated) {
            aiResponse =
              "**Agency Configuration & Settings:**\n\n" +
              "• **Team & Permissions**: Invite coordinators, photographers, and accountants with custom RBAC access.\n" +
              "• **Meta WhatsApp Cloud API**: Connect official WhatsApp business number for automated cue sheet dispatch and alerts.\n" +
              "• **White-Labeling**: Host the client portal on your agency's domain (e.g. `clients.yourbrand.com`).\n" +
              "• **Payment Gateways**: Configure Razorpay, Stripe, and direct UPI VPAs for automated collections.";
          }
        }

        // 7. DEFAULT WORKSPACE FALLBACK
        else {
          if (!liveGenerated) {
            aiResponse =
              `**${pageContext.role} Insight:**\n\n` +
              `I am synchronized with your active workspace for **${pageContext.name}**.\n\n` +
              `• Ask me how to generate quotes, track Day-of timelines, or manage photo galleries with real QR codes.\n` +
              `• I can also guide you on UPI payments, WhatsApp API configurations, and team roles.\n\n` +
              `What specific workflow would you like to streamline?`;
          }
          nextSuggestions = getContextSuggestions();
        }
      }

      const aiMsg: Message = {
        id: Math.random().toString(36).substring(7),
        sender: "ai",
        text: aiResponse,
        timestamp: new Date(),
        actionBtn,
        suggestions: nextSuggestions
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      console.error("AI Assistant Error:", e);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* ── 1. SLEEK FLOATING AI COPILOT TRIGGER (Modern Glass Capsule & Mascot) ── */}
      <div
        className={cn(
          "fixed right-4 sm:right-6 z-[9990] flex items-center gap-2 select-none print:hidden print-hidden transition-all duration-300",
          isCookieBannerOpen ? "bottom-44 sm:bottom-6" : "bottom-5 sm:bottom-6"
        )}
      >
        <motion.button
          whileHover={{ scale: 1.08, y: -2 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsOpen((prev) => !prev)}
          className="ai-trigger-btn relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#0c1024]/90 hover:bg-[#121634]/95 border border-purple-500/40 hover:border-purple-400/80 shadow-[0_10px_35px_rgba(88,28,135,0.4),0_0_20px_rgba(59,130,246,0.25)] backdrop-blur-2xl group cursor-pointer transition-all duration-300"
          title="EventOS AI Copilot (Cmd + Space)"
          aria-label="Open EventOS AI Copilot"
        >
          {/* Ambient Glow Aura */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-purple-600/40 via-indigo-600/30 to-cyan-400/20 blur-md opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 -z-10" />

          {/* Animated Mascot Bot */}
          <div className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-full p-0.5 lottie-theme-bot pointer-events-none">
            <DotLottieReact
              src={CHATBOT_LOTTIE_URL}
              loop
              autoplay
              className="w-full h-full object-contain filter drop-shadow-md"
            />
          </div>

          {/* Live Status Indicator Dot */}
          <span className="absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#0c1024] shadow-[0_0_8px_rgba(52,211,153,0.95)]">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </span>

          {/* Professional Hover Tooltip (Appears smoothly to the left on hover) */}
          <div className="absolute right-full mr-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0c1024]/95 border border-purple-500/30 text-white shadow-2xl backdrop-blur-xl whitespace-nowrap">
            <span className="text-xs font-bold tracking-tight">AI Copilot</span>
            <span className="text-[10px] text-purple-300 font-mono px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-400/30">⌘ Space</span>
          </div>
        </motion.button>
      </div>

      {/* ── 2. ULTRA GLASSMORHPIC DRAWER PANEL ─────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            ref={containerRef}
            data-print-hide="true"
            className={cn(
              "fixed right-3 sm:right-6 w-[calc(100vw-24px)] sm:w-[440px] h-[540px] sm:h-[620px] max-h-[calc(100dvh-100px)] bg-[#080b18]/95 dark:bg-[#060813]/98 border border-purple-500/30 dark:border-white/[0.12] rounded-[28px] shadow-[0_30px_90px_rgba(0,0,0,0.85),0_0_50px_rgba(147,51,234,0.2),inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-[36px] flex flex-col overflow-hidden z-[9999] font-sans antialiased print:hidden print-hidden",
              isCookieBannerOpen ? "bottom-52 sm:bottom-24" : "bottom-20 sm:bottom-24"
            )}
          >
            {/* Top Accent Gradient Line */}
            <div className="h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 w-full shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.7)]" />

            {/* Ambient Background Glows */}
            <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-purple-600/20 blur-[75px] -z-10" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-blue-600/20 blur-[75px] -z-10" />

            {/* Glassmorphic Header Bar */}
            <div className="px-5 py-3.5 border-b border-white/[0.08] dark:border-purple-500/20 bg-white/[0.03] dark:bg-black/30 backdrop-blur-xl flex items-center justify-between z-10 shrink-0">
              <div className="h-9 w-9 flex items-center justify-center shrink-0 rounded-xl bg-purple-600/20 border border-purple-500/30 p-0.5 lottie-theme-bot">
                <DotLottieReact
                  src={CHATBOT_LOTTIE_URL}
                  loop
                  autoplay
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-xs text-white tracking-tight">
                    {isPublicMode ? (isAuthRoute ? pageContext.name : "EventOS Concierge") : "EventOS Co-pilot"}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-[9px] font-black text-purple-300 font-mono tracking-wider uppercase">
                    {pageContext.role}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  <span>{isPublicMode ? (isAuthRoute ? "Authentication & Access" : "Product & Onboarding") : `${pageContext.name} • Online`}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={initializeChat}
                className="h-7 w-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                title="Reset conversation"
                aria-label="Reset conversation"
              >
                <RotateCcw size={13} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-7 w-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                aria-label="Close Assistant"
              >
                <X size={14} />
              </button>
            </div>


            {/* Quick Context Chips Ribbon */}
            <div className="px-4 py-2 border-b border-white/[0.05] bg-black/20 flex items-center gap-1.5 overflow-x-auto scrollbar-none z-10 shrink-0">
              <span className="text-[9px] font-black uppercase tracking-wider text-purple-400 shrink-0 flex items-center gap-1">
                <Sparkles size={10} /> Quick Ask:
              </span>
              {getContextSuggestions().slice(0, 3).map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={chip.action}
                  className="px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-purple-500/20 border border-white/[0.08] hover:border-purple-400/50 text-[10px] text-zinc-300 hover:text-white font-medium shrink-0 transition cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* ── Chat Messages Body ── */}
            <div
              ref={chatContainerRef}
              data-lenis-prevent
              className="flex-1 overflow-y-auto p-4 space-y-4 text-xs z-10 sidebar-scrollbar overscroll-contain"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2.5 max-w-[90%]",
                    msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  {/* Sender Avatar */}
                  {msg.sender === "user" ? (
                    <div className="h-7 w-7 flex items-center justify-center shrink-0 mt-0.5 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30">
                      <User size={12} />
                    </div>
                  ) : (
                    <div className="h-7 w-7 flex items-center justify-center shrink-0 mt-0.5 rounded-full bg-purple-600/20 border border-purple-500/30 p-0.5 overflow-hidden lottie-theme-bot">
                      <DotLottieReact
                        src={CHATBOT_LOTTIE_URL}
                        loop
                        autoplay
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  <div className="space-y-2 flex-1 min-w-0">
                    {/* Glassmorphic Message Card Bubble */}
                    <div
                      className={cn(
                        "p-3.5 text-[12.5px] leading-relaxed relative overflow-hidden font-sans transition-all",
                        msg.sender === "user"
                          ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-[20px] rounded-tr-sm shadow-[0_6px_20px_rgba(147,51,234,0.35)] border border-purple-400/30"
                          : "bg-white/[0.05] dark:bg-white/[0.04] border border-white/[0.1] dark:border-purple-500/25 text-white rounded-[20px] rounded-tl-sm shadow-[0_6px_25px_rgba(0,0,0,0.3)] backdrop-blur-2xl relative overflow-hidden"
                      )}
                    >
                      {msg.sender !== "user" && (
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-transparent pointer-events-none" />
                      )}

                      {renderFormattedText(msg.text)}

                      {/* Direct Navigation Action Button */}
                      {msg.actionBtn && (
                        <div className="mt-3 pt-2.5 border-t border-white/[0.1] dark:border-purple-500/20">
                          <button
                            type="button"
                            onClick={() => {
                              if (msg.actionBtn!.href.startsWith("http")) {
                                window.open(msg.actionBtn!.href, "_blank");
                              } else {
                                router.push(msg.actionBtn!.href);
                                setIsOpen(false);
                              }
                            }}
                            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs shadow-md border border-purple-400/30 transition-all cursor-pointer active:scale-95"
                          >
                            {msg.actionBtn.icon ? (
                              <msg.actionBtn.icon size={13} />
                            ) : (
                              <ArrowRight size={13} />
                            )}
                            <span>{msg.actionBtn.label}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <span className="text-[9.5px] text-zinc-500 font-medium block pl-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>

                    {/* Capsule Suggestion Chips */}
                    {msg.sender === "ai" && msg.suggestions && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {msg.suggestions.map((sug, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={sug.action}
                            className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-400/50 text-zinc-300 hover:text-white transition-all cursor-pointer text-[11px] font-semibold flex items-center gap-1.5 shadow-sm group"
                          >
                            <Sparkles size={11} className="text-purple-400 group-hover:scale-110 transition-transform" />
                            <span>{sug.label}</span>
                            <ChevronRight size={10} className="text-zinc-500 group-hover:text-purple-300 ml-auto" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing animation */}
              {isTyping && (
                <div className="flex gap-2.5 max-w-[80%] mr-auto">
                  <div className="h-7 w-7 flex items-center justify-center shrink-0 rounded-full bg-purple-600/20 border border-purple-500/30 p-0.5 overflow-hidden lottie-theme-bot">
                    <DotLottieReact
                      src={CHATBOT_LOTTIE_URL}
                      loop
                      autoplay
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="px-4 py-2.5 bg-white/[0.06] border border-purple-500/20 rounded-[18px] rounded-tl-sm flex items-center gap-1.5 backdrop-blur-xl shadow-md">
                    <span className="h-1.5 w-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-bounce" />
                  </div>
                </div>
              )}

              {/* Anchor for Auto-Scroll */}
              <div ref={messagesEndRef} className="h-1 w-full shrink-0" />
            </div>

            {/* Glassmorphic Input Bar */}
            <div className="p-3.5 border-t border-white/[0.08] dark:border-purple-500/20 bg-white/[0.02] dark:bg-black/40 backdrop-blur-xl z-10 shrink-0">
              <div className="flex items-center gap-2 bg-white/[0.05] dark:bg-black/50 border border-purple-500/30 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-400/25 rounded-full px-4 py-1.5 transition-all shadow-inner backdrop-blur-xl">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendText(input);
                  }}
                  placeholder={
                    isPublicMode
                      ? (isAuthRoute ? "Ask about sign-in, Google SSO, or accounts..." : "Ask about features, pricing, or trial...")
                      : `Ask ${pageContext.name} Co-pilot (e.g. QR codes, GST, timelines)...`
                  }
                  className="flex-1 bg-transparent py-1 text-xs text-white placeholder-zinc-500 outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleSendText(input)}
                  className="h-7 w-7 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105 active:scale-95 text-white flex items-center justify-center shrink-0 transition cursor-pointer shadow-md border border-purple-400/30"
                  aria-label="Send message"
                >
                  <Send size={12} />
                </button>
              </div>
              <div className="flex items-center justify-between px-3 pt-2 text-[9px] text-zinc-500">
                <span>Enter to send • Esc to close</span>
                <span className="font-mono text-purple-400/80">EventOS AI Copilot v2.4</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
