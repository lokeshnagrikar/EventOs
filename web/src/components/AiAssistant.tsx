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
  LogIn
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

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

// Routes where AI Assistant must be completely hidden (onboarding / internal setup)
const HIDDEN_ROUTES = [
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/accept-invite",
  "/onboarding",
  "/workspace-select",
  "/superadmin/login"
];

// Public landing & marketing routes
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
  "/blog"
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
        <div key={pIdx} className="space-y-2 my-2">
          {lines.map((line, lIdx) => {
            const trimmed = line.trim();
            const isBullet = trimmed.startsWith("•") || trimmed.startsWith("- ");
            const content = isBullet ? trimmed.replace(/^[•\-]\s*/, "") : line;
            return (
              <div key={lIdx} className={isBullet ? "flex items-start gap-2.5 pl-1" : ""}>
                {isBullet && (
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400 mt-2 shrink-0 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
                )}
                <span className="leading-relaxed text-slate-100 text-[13px]">
                  {parseBoldText(content)}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return (
      <p key={pIdx} className="mb-2 last:mb-0 leading-relaxed text-slate-100 text-[13px]">
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
      return { name: "Account Login", module: "Auth AI", role: "Access Specialist" };
    }
    if (path === "/register") {
      return { name: "Agency Registration", module: "Auth AI", role: "Onboarding Specialist" };
    }
    if (isPublicMode) {
      return { name: "EventOS Concierge", module: "Public AI", role: "Product Specialist" };
    }
    if (path.startsWith("/crm")) return { name: "CRM / Leads", module: "CRM AI", role: "Sales Co-pilot" };
    if (path.startsWith("/events") || path.startsWith("/bookings")) return { name: "Events Planning", module: "Event AI", role: "Operations Co-pilot" };
    if (path.startsWith("/quotes")) return { name: "Quotes & Proposals", module: "Quote AI", role: "Pricing Co-pilot" };
    if (path.startsWith("/gallery")) return { name: "Media Galleries", module: "Gallery AI", role: "Media Co-pilot" };
    if (path.startsWith("/finance") || path.startsWith("/invoices") || path.startsWith("/payments") || path.startsWith("/calculator")) {
      return { name: "Finance & Billing", module: "Finance AI", role: "Finance Co-pilot" };
    }
    if (path.startsWith("/settings")) return { name: "Settings & System", module: "Settings AI", role: "Admin Co-pilot" };
    if (path.startsWith("/reports")) return { name: "Reports & Analytics", module: "Analytics AI", role: "BI Co-pilot" };
    if (path.startsWith("/chat")) return { name: "Workspace Chat", module: "Collab AI", role: "Team Co-pilot" };
    return { name: "Dashboard", module: "Overview", role: "Executive Co-pilot" };
  }, [pathname, isPublicMode]);

  // Generate context-aware suggestions
  const getContextSuggestions = (): { label: string; action: () => void }[] => {
    const path = pathname.toLowerCase();
    if (path === "/login") {
      return [
        { label: "How to sign in with Google SSO?", action: () => handleSendText("How do I sign in with Google SSO?") },
        { label: "Forgot password / recovery", action: () => handleSendText("How do I reset my password?") },
        { label: "Create new agency account", action: () => handleSendText("How do I create a new agency account?") },
        { label: "Explore features & pricing", action: () => handleSendText("What are the pricing plans and features?") }
      ];
    }
    if (path === "/register") {
      return [
        { label: "What is in the 14-Day Free Trial?", action: () => handleSendText("What is included in the 14-day free trial?") },
        { label: "Can I sign up with Google SSO?", action: () => handleSendText("How do I sign up with Google SSO?") },
        { label: "I already have an account", action: () => handleSendText("I already have an account, take me to login") },
        { label: "Which plan should I choose?", action: () => handleSendText("Which plan is best for my agency?") }
      ];
    }
    if (isPublicMode) {
      return [
        { label: "What are the core features?", action: () => handleSendText("What are the core features of EventOS?") },
        { label: "Explore pricing & plans", action: () => handleSendText("What are your pricing plans?") },
        { label: "How does White-Labeling work?", action: () => handleSendText("Can I use my custom domain and brand colors?") },
        { label: "Book a 1-on-1 demo", action: () => handleSendText("How do I book a demo?") }
      ];
    }

    if (pageContext.module === "CRM AI") {
      return [
        { label: "How to qualify & score leads?", action: () => handleSendText("How does lead scoring work in EventOS?") },
        { label: "Tips for converting leads into quotes", action: () => handleSendText("How do I convert an active lead into a proposal quote?") }
      ];
    }
    if (pageContext.module === "Quote AI") {
      return [
        { label: "Proposal best practices", action: () => handleSendText("How do I create a high-converting wedding proposal?") },
        { label: "Configuring GST & milestones", action: () => handleSendText("How do payment milestones and GST work in quotes?") }
      ];
    }
    if (pageContext.module === "Event AI") {
      return [
        { label: "Create a visual timeline", action: () => handleSendText("How to build a multi-day event timeline?") },
        { label: "Manage event ingress & vendors", action: () => handleSendText("How to assign tasks and vendor ingress?") }
      ];
    }
    if (pageContext.module === "Finance AI") {
      return [
        { label: "Generate dynamic UPI QR Code", action: () => handleSendText("How to generate instant UPI QR code for client?") },
        { label: "Review outstanding receivables", action: () => handleSendText("Where can I track pending client payments?") }
      ];
    }
    if (pageContext.module === "Gallery AI") {
      return [
        { label: "Client proofing link guide", action: () => handleSendText("How to share password-protected client proofing galleries?") },
        { label: "Organize album sub-folders", action: () => handleSendText("How to organize ceremony albums like Sangeet and Haldi?") }
      ];
    }
    return [
      { label: "Core feature testing walkthrough", action: () => handleSendText("Guide me through the 5 core steps of EventOS") },
      { label: "How to invite team members", action: () => handleSendText("How do I invite team members and set roles?") }
    ];
  };

  // Welcome message when context or drawer opens
  useEffect(() => {
    let welcomeText = "";
    const path = pathname.toLowerCase();
    if (path === "/login") {
      welcomeText = "Welcome to **EventOS**! 🔐\n\nI am your **Access Specialist**. I can help you sign in, guide you with **Google SSO**, or help you reset a forgotten password.\n\nHow can I help you access your account?";
    } else if (path === "/register") {
      welcomeText = "Welcome to **EventOS**! ✨\n\nReady to elevate your event agency? Get started with our **14-day free trial** — zero credit card required.\n\nNeed help choosing a plan or signing up with Google SSO?";
    } else if (isPublicMode) {
      welcomeText = "Welcome to **EventOS**! ✨\n\nI am your **Product Specialist**. I can help you explore our operating system for event planners, answer questions about features & pricing, or help you book a live demo.\n\nWhat would you like to know about EventOS?";
    } else {
      const name = user?.firstName || "Partner";
      welcomeText = `Hello, **${name}**! 👋\n\nI am your **EventOS Co-pilot** for **${pageContext.name}**.\n\nHow can I assist you with your operations and workflows today?`;
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
  }, [pageContext, isPublicMode, isOpen, pathname]);

  // Keyboard shortcut toggle (Ctrl + Space / Cmd + Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === "Space") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Robust Auto-Scroll: scroll smoothly to bottom when messages or typing changes
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

  // 1. Hide on login, register, forgot-password, onboarding, etc.
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
      await new Promise((resolve) => setTimeout(resolve, 600));
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
            "• Includes full unrestricted access to CRM, Interactive Proposal Builder, Day-of Timelines, and Photo Galleries.\n" +
            "• **Zero credit card required** to begin.\n" +
            "• Get your entire event agency onboarded in under 60 seconds!";
          actionBtn = { label: "Start Free 14-Day Trial", href: "/register" };
          nextSuggestions = [
            { label: "Explore pricing plans", action: () => handleSendText("What are the pricing plans?") },
            { label: "Sign in with existing account", action: () => handleSendText("I want to sign in") }
          ];
        } else if (q.includes("sign in") || q.includes("login") || q.includes("log in")) {
          aiResponse =
            "**Sign In to Your Workspace:**\n\n" +
            "• Enter your work email and password or use **Continue with Google** to access your dashboard, active events, and team communications.";
          actionBtn = { label: "Go to Sign In", href: "/login", icon: LogIn };
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
            "5. **Client Proofing Galleries**: High-speed photo delivery with client favorites selection and PIN locks.";
          actionBtn = { label: "Explore Solutions", href: "/solutions" };
          nextSuggestions = [
            { label: "Book a live demo", action: () => handleSendText("I want to book a live demo") },
            { label: "Compare pricing plans", action: () => handleSendText("What are the pricing plans?") }
          ];
        } else if (q.includes("white-label") || q.includes("domain") || q.includes("branding") || q.includes("logo")) {
          aiResponse =
            "**Enterprise White-Labeling in EventOS:**\n\n" +
            "• **Custom CNAME Domain**: Serve the entire client portal under your brand (e.g. `clients.youragency.com`).\n" +
            "• **Brand Identity**: Upload custom logos, set primary luxury brand colors, and customize invoice templates.\n" +
            "• **Zero Watermark**: Remove all EventOS badges from proposal PDFs, emails, and client-facing galleries.";
          actionBtn = { label: "Learn About Enterprise", href: "/pricing" };
        } else if (q.includes("demo") || q.includes("call") || q.includes("sales")) {
          aiResponse =
            "We would love to show you a live interactive walkthrough of EventOS tailored to your agency's wedding & corporate workflow!\n\n" +
            "Click below to reserve your 20-minute 1-on-1 session with our product specialist:";
          actionBtn = { label: "Schedule Live Demo", href: "/book-demo" };
        } else if (q.includes("invoice") || q.includes("lead") || q.includes("wedding") || q.includes("client") || q.includes("payment")) {
          // Prevent any leak or mock data queries on the public landing page!
          aiResponse =
            "**Security Notice:**\n\n" +
            "All client information, invoices, and event records are strictly encrypted and protected within individual agency workspaces.\n\n" +
            "If you already have an agency account, please **Sign In** to view and manage your workspace.";
          actionBtn = { label: "Sign In to EventOS", href: "/login", icon: LogIn };
        } else {
          aiResponse =
            "**EventOS** is India's premier Operating System built specifically for wedding planners, event coordinators, and creative agencies.\n\n" +
            "We automate everything from initial lead intake to signed quotes, day-of timelines, and high-speed photo delivery.";
          actionBtn = { label: "Book a Demo", href: "/book-demo" };
          nextSuggestions = [
            { label: "View Pricing", action: () => handleSendText("What are the pricing tiers?") },
            { label: "Explore Features", action: () => handleSendText("What features are included?") }
          ];
        }
      }

      // ==========================================
      // B. AUTHENTICATED WORKSPACE CO-PILOT RESPONSES (Real guidance, zero mock hallucination)
      // ==========================================
      else {
        if (q.includes("lead") || q.includes("crm")) {
          aiResponse =
            "**CRM Pipeline Guidance:**\n\n" +
            "• To log a new client inquiry, click **'+ New Lead'** in your CRM desk.\n" +
            "• You can filter leads by stage (*New, Qualified, Proposal Sent, Won, Lost*).\n" +
            "• When a client approves your pitch, convert the lead directly into a formal Proposal Quote with 1 click.";
          actionBtn = { label: "Open CRM / Leads Desk", href: "/crm" };
          nextSuggestions = [
            { label: "How to create a quote?", action: () => handleSendText("How do I generate a quote from a lead?") }
          ];
        } else if (q.includes("quote") || q.includes("proposal")) {
          aiResponse =
            "**Quote & Proposal Engine:**\n\n" +
            "• Build itemized packages with Catering, Decor, AV Lighting, and Stage Effects.\n" +
            "• Automatic 18% GST and custom discounts are computed in real-time.\n" +
            "• You can share a secure client approval link for digital sign-off and milestone clearing.";
          actionBtn = { label: "Open Quotes Desk", href: "/quotes" };
          nextSuggestions = [
            { label: "Setup Payment Engine", action: () => handleSendText("How do I setup payments?") }
          ];
        } else if (q.includes("event") || q.includes("timeline") || q.includes("schedule") || q.includes("wedding")) {
          aiResponse =
            "**Event & Operations Desk:**\n\n" +
            "• Manage your confirmed bookings, venue ingress times, and ceremony milestones.\n" +
            "• Set up multi-day itineraries for Sangeet, Haldi, Vows, and Reception.\n" +
            "• To view all your real confirmed calendar bookings, click below:";
          actionBtn = { label: "Open Events & Calendar", href: "/events" };
        } else if (q.includes("invoice") || q.includes("payment") || q.includes("upi") || q.includes("unpaid")) {
          aiResponse =
            "**Finance & Collections:**\n\n" +
            "• To inspect real outstanding balances, check your **Invoices Desk**.\n" +
            "• You can generate instant **Dynamic UPI QR Codes** directly on the Payments page for client payments (GPay/PhonePe/Paytm).\n" +
            "• Review settlements and tax liabilities under the unified Finance Hub.";
          actionBtn = { label: "Open Finance Hub", href: "/finance" };
          nextSuggestions = [
            { label: "Open Invoices", action: () => { router.push("/invoices"); setIsOpen(false); } },
            { label: "Open Payments Desk", action: () => { router.push("/payments"); setIsOpen(false); } }
          ];
        } else if (q.includes("gallery") || q.includes("photo")) {
          aiResponse =
            "**Media Gallery & Proofing:**\n\n" +
            "• Upload and deliver high-resolution wedding albums organized by ceremony.\n" +
            "• Enable client selection proofing with download PIN locks and custom watermarking.";
          actionBtn = { label: "Open Media Gallery", href: "/gallery" };
        } else if (q.includes("team") || q.includes("member") || q.includes("user")) {
          aiResponse =
            "**Team & Governance:**\n\n" +
            "• You can invite team members and coordinators under **Settings -> Users & Teams**.\n" +
            "• Configure granular role-based access control (RBAC) to ensure assistants only see assigned events.";
          actionBtn = { label: "Open Team Settings", href: "/settings?tab=team" };
        } else if (q.includes("setting") || q.includes("whatsapp") || q.includes("domain") || q.includes("gateway")) {
          aiResponse =
            "**Enterprise Configuration:**\n\n" +
            "Manage all 20 agency configuration settings including Meta WhatsApp API, Razorpay/Stripe gateways, Custom CNAME domain, and GST rules in the Settings center.";
          actionBtn = { label: "Open Settings Center", href: "/settings" };
        } else {
          aiResponse =
            `**${pageContext.role} Insight:**\n\n` +
            `I am actively synchronized with your workspace. You can ask me how to manage any workflow, generate quotes, track payments, or navigate to any feature.\n\n` +
            `What operational task would you like guidance on?`;
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
      {/* ── 1. FLOATING ANIMATED ROBOT MASCOT TRIGGER (Vibrant Electric Sapphire & Azure Shift) ────────────────── */}
      <motion.button
        whileHover={{ scale: 1.12, y: -4 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "ai-trigger-btn fixed right-4 sm:right-6 w-14 h-14 sm:w-20 sm:h-20 flex items-center justify-center z-[9990] group cursor-pointer focus:outline-none select-none drop-shadow-[0_10px_24px_rgba(37,99,235,0.35)] transition-all duration-300",
          isCookieBannerOpen ? "bottom-44 sm:bottom-6" : "bottom-5 sm:bottom-6"
        )}
        title="EventOS AI Assistant (Cmd + Space)"
        aria-label="Open EventOS AI Assistant"
      >
        {/* Subtle organic ambient pulse beneath the mascot - neat, crisp, and no fuzzy washed-out halo */}
        <div className="absolute inset-2 bg-gradient-to-tr from-blue-600/30 via-indigo-600/25 to-cyan-500/20 rounded-full blur-md opacity-40 group-hover:opacity-75 transition-opacity -z-10" />

        <div className="w-full h-full flex items-center justify-center p-0.5 lottie-theme-bot">
          <DotLottieReact
            src={CHATBOT_LOTTIE_URL}
            loop
            autoplay
            className="w-full h-full object-contain pointer-events-none filter drop-shadow-md"
          />
        </div>
      </motion.button>

      {/* ── 2. ULTRA GLASSMORHPIC DRAWER PANEL ─────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            ref={containerRef}
            className={cn(
              "fixed right-3 sm:right-6 w-[calc(100vw-24px)] sm:w-[430px] h-[520px] sm:h-[590px] max-h-[calc(100dvh-120px)] bg-[#090d1f]/95 dark:bg-[#060813]/98 border border-blue-500/25 dark:border-white/[0.12] rounded-[28px] shadow-[0_30px_90px_rgba(0,0,0,0.8),0_0_50px_rgba(37,99,235,0.22),inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-[36px] backdrop-saturate-[1.9] flex flex-col overflow-hidden z-[9999] font-sans antialiased",
              isCookieBannerOpen ? "bottom-52 sm:bottom-24" : "bottom-20 sm:bottom-24"
            )}
          >
            {/* Top Accent Gradient Line with Glow */}
            <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 w-full shrink-0 shadow-[0_0_12px_rgba(59,130,246,0.6)]" />

            {/* Ambient Inner Glass Light Blobs */}
            <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-blue-600/20 blur-[70px] -z-10" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-indigo-600/20 blur-[70px] -z-10" />

            {/* Glassmorphic Header Bar */}
            <div className="px-5 py-3.5 border-b border-white/[0.08] dark:border-blue-500/20 bg-white/[0.04] dark:bg-black/30 backdrop-blur-xl flex items-center justify-between z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 flex items-center justify-center shrink-0 lottie-theme-bot">
                  <DotLottieReact
                    src={CHATBOT_LOTTIE_URL}
                    loop
                    autoplay
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-xs text-white tracking-tight drop-shadow-sm">
                      {isPublicMode ? (isAuthRoute ? pageContext.name : "EventOS Concierge") : "EventOS Co-pilot"}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-[9px] font-black text-blue-300 font-mono tracking-wider uppercase shadow-[0_0_10px_rgba(59,130,246,0.25)]">
                      {isPublicMode ? pageContext.role : pageContext.role}
                    </span>
                  </div>
                  <p className="text-[10px] text-blue-200/70 font-medium flex items-center gap-1.5 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                    {isPublicMode ? (isAuthRoute ? "Authentication & Workspace Access" : "Product Specialist & Onboarding") : pageContext.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 text-[9.5px] text-blue-200/60 bg-white/[0.06] border border-white/[0.1] px-2 py-0.5 rounded-md font-mono select-none">
                  <Command size={9} /> Space
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-blue-200 hover:text-white flex items-center justify-center transition cursor-pointer"
                  aria-label="Close Assistant"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* ── Chat Messages Body (Fixed Scroll with data-lenis-prevent & custom scrollbar) ── */}
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
                    "flex gap-3 max-w-[88%]",
                    msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  {/* Sender Avatar */}
                  <div
                    className={cn(
                      "h-7 w-7 flex items-center justify-center shrink-0 mt-0.5",
                      msg.sender === "user"
                        ? "rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30"
                        : "lottie-theme-bot"
                    )}
                  >
                    {msg.sender === "user" ? (
                      <User size={12} />
                    ) : (
                      <DotLottieReact
                        src={CHATBOT_LOTTIE_URL}
                        loop
                        autoplay
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>

                  <div className="space-y-2 flex-1 min-w-0">
                    {/* Glassmorphic Message Card Bubble */}
                    <div
                      className={cn(
                        "p-4 text-[13px] leading-relaxed relative overflow-hidden font-sans transition-all",
                        msg.sender === "user"
                          ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white rounded-[22px] rounded-tr-sm shadow-[0_6px_20px_rgba(37,99,235,0.35)] border border-blue-400/30"
                          : "bg-white/[0.06] dark:bg-white/[0.05] border border-white/[0.12] dark:border-blue-500/25 text-white rounded-[22px] rounded-tl-sm shadow-[0_6px_25px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-2xl relative overflow-hidden"
                      )}
                    >
                      {/* Subtle Glass Card Highlight Reflection */}
                      {msg.sender !== "user" && (
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-transparent pointer-events-none" />
                      )}

                      {renderFormattedText(msg.text)}

                      {/* Direct Navigation Action Button (Zero fake data) */}
                      {msg.actionBtn && (
                        <div className="mt-3 pt-2.5 border-t border-white/[0.1] dark:border-blue-500/20">
                          <button
                            onClick={() => {
                              router.push(msg.actionBtn!.href);
                              setIsOpen(false);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-[0_4px_16px_rgba(37,99,235,0.4)] border border-blue-400/30 transition-all cursor-pointer"
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

                    <span className="text-[9.5px] text-blue-200/50 font-medium block pl-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>

                    {/* Glass Capsule Suggestion Chips */}
                    {msg.sender === "ai" && msg.suggestions && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.suggestions.map((sug, i) => (
                          <button
                            key={i}
                            onClick={sug.action}
                            className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-blue-500/20 border border-blue-500/25 hover:border-blue-400/60 text-blue-100 hover:text-white transition-all cursor-pointer text-[11px] font-bold flex items-center gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_20px_rgba(37,99,235,0.3)] backdrop-blur-md group"
                          >
                            <Sparkles size={11} className="text-blue-400 group-hover:scale-110 group-hover:text-cyan-300 transition-all" />
                            <span>{sug.label}</span>
                            <ChevronRight size={11} className="text-blue-300/50 group-hover:text-blue-300 group-hover:translate-x-0.5 transition-all ml-auto" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing animation */}
              {isTyping && (
                <div className="flex gap-3 max-w-[80%] mr-auto">
                  <div className="h-7 w-7 flex items-center justify-center shrink-0 lottie-theme-bot">
                    <DotLottieReact
                      src={CHATBOT_LOTTIE_URL}
                      loop
                      autoplay
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="px-4 py-3 bg-white/[0.06] border border-blue-500/20 rounded-[20px] rounded-tl-sm flex items-center gap-1.5 backdrop-blur-xl shadow-md">
                    <span className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce" />
                  </div>
                </div>
              )}

              {/* Anchor for Auto-Scroll */}
              <div ref={messagesEndRef} className="h-1 w-full shrink-0" />
            </div>

            {/* Glassmorphic Input Bar */}
            <div className="p-3.5 border-t border-white/[0.08] dark:border-blue-500/20 bg-white/[0.02] dark:bg-black/40 backdrop-blur-xl z-10 shrink-0">
              <div className="flex items-center gap-2 bg-white/[0.06] dark:bg-black/50 border border-blue-500/30 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/30 focus-within:shadow-[0_0_25px_rgba(59,130,246,0.35)] rounded-full px-4 py-2 transition-all shadow-inner backdrop-blur-xl">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendText(input);
                  }}
                  placeholder={
                    isPublicMode
                      ? (isAuthRoute ? "Ask about login, Google SSO, or accounts..." : "Ask about features, pricing, or demo...")
                      : `Ask ${pageContext.name} Co-pilot...`
                  }
                  className="flex-1 bg-transparent py-1 text-xs text-white placeholder-blue-200/50 outline-none font-medium"
                />
                <button
                  onClick={() => handleSendText(input)}
                  className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:scale-105 active:scale-95 text-white flex items-center justify-center shrink-0 transition cursor-pointer shadow-[0_4px_14px_rgba(37,99,235,0.4)] border border-blue-400/30"
                  aria-label="Send message"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
