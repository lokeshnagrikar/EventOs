// ─── Customer Success Data Layer ────────────────────────────────────────────

export interface RoadmapCard {
  id: string;
  title: string;
  description: string;
  category: "CRM" | "Finance" | "Events" | "Gallery" | "Security" | "AI";
  status: "planned" | "in_development" | "testing" | "released";
  progress: number; // 0 to 100
  votes: number;
  commentsCount: number;
  estimate: string; // e.g. "Q3 2026"
  voted?: boolean;
}

export interface ChatMessageItem {
  id: string;
  sender: "user" | "support";
  text: string;
  timestamp: string;
  read: boolean;
  reactions?: string[]; // e.g. ["👍", "❤️"]
  isPinned?: boolean;
  fileName?: string;
}

export interface NpsFeedbackItem {
  id: string;
  user: string;
  score: number; // 0 to 10
  emoji: string; // 😢, 😐, 😄
  suggestion: string;
  category: "Usability" | "Speed" | "Pricing" | "Features" | "Other";
  date: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC ROADMAP DATA
// ═══════════════════════════════════════════════════════════════════════════════

export const ROADMAP_ITEMS_INITIAL: RoadmapCard[] = [
  { id: "rd-1", title: "Automated WhatsApp client alerts", description: "Send automated payment reminders and day-of schedule timelines directly via WhatsApp Business API.", category: "Finance", status: "planned", progress: 0, votes: 145, commentsCount: 12, estimate: "Q4 2026" },
  { id: "rd-2", title: "Offline mode local caching", description: "Enable full operations editing, schedule loading, and lead entry logging when disconnected from networks.", category: "Security", status: "planned", progress: 0, votes: 98, commentsCount: 5, estimate: "Q1 2027" },
  { id: "rd-3", title: "Multi-currency invoicing rates", description: "Support global client invoices, tax conversion tables, and international multi-currency payment gates.", category: "Finance", status: "in_development", progress: 65, votes: 212, commentsCount: 18, estimate: "Q3 2026" },
  { id: "rd-4", title: "AI-driven contract drafting", description: "Generate binding legal agreements, add custom signature anchors, and run contract risk analysis.", category: "AI", status: "in_development", progress: 40, votes: 310, commentsCount: 22, estimate: "Q3 2026" },
  { id: "rd-5", title: "Custom domain white-label branding", description: "Point client portals and quotes pages to custom domain subfolders (e.g. portal.yourstudio.com).", category: "Security", status: "testing", progress: 90, votes: 418, commentsCount: 35, estimate: "Q2 2026" },
  { id: "rd-6", title: "Advanced budget analytics reports", description: "Renders visual summaries of actual vs projected expenses, payment delays, and profit margin audits.", category: "Finance", status: "testing", progress: 85, votes: 154, commentsCount: 8, estimate: "Q2 2026" },
  { id: "rd-7", title: "Bulk leads import spreadsheet wizard", description: "Upload xlsx spreadsheets directly, auto-map properties, and validate fields in a single step.", category: "CRM", status: "released", progress: 100, votes: 520, commentsCount: 42, estimate: "Released" },
  { id: "rd-8", title: "Public documentation portal index", description: "Browse manuals, video tutorials, keyboard shortcuts, and live status channels under `/help`.", category: "Security", status: "released", progress: 100, votes: 280, commentsCount: 15, estimate: "Released" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// CHAT CONVERSATION LEDGER
// ═══════════════════════════════════════════════════════════════════════════════

export const INITIAL_CHAT_MESSAGES: ChatMessageItem[] = [
  { id: "msg-1", sender: "support", text: "Hello! Thank you for contacting EventOS Customer Success. How can I help you optimize your workspace operations today?", timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), read: true, reactions: ["👍"] },
  { id: "msg-2", sender: "user", text: "Hi, I'm trying to configure my custom branding, but the company logo doesn't reflect on the client quotes page. What should I check?", timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString(), read: true },
  { id: "msg-3", sender: "support", text: "Great question! Please verify that you uploaded the logo under Settings → Branding, and that the file format is PNG or SVG. Also, double check that your quote has not been finalized, as locked quotes preserve previous branding parameters.", timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(), read: true, reactions: ["❤️"], isPinned: true },
  { id: "msg-4", sender: "user", text: "Ah, indeed it was a locked quote. Let me clone it and see if the new brand identity propagates.", timestamp: new Date(Date.now() - 22 * 60 * 1000).toISOString(), read: true },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN NPS FEEDBACK LIST
// ═══════════════════════════════════════════════════════════════════════════════

export const INITIAL_NPS_FEEDBACK: NpsFeedbackItem[] = [
  { id: "nps-1", user: "Sophia Montgomery", score: 10, emoji: "😄", suggestion: "Absolutely loving the new spreadsheet import wizard! Mapped 400 contacts in less than a minute.", category: "Features", date: new Date(Date.now() - 12 * 3600 * 1000).toISOString() },
  { id: "nps-2", user: "TechCorp Coordinator", score: 8, emoji: "😄", suggestion: "The quote builder tax adjustments work beautifully. Would appreciate WhatsApp status triggers soon.", category: "Usability", date: new Date(Date.now() - 24 * 3600 * 1000).toISOString() },
  { id: "nps-3", user: "David Miller", score: 6, emoji: "😐", suggestion: "Payment processing page loads a bit slow in peak times. Charts visual styling is fantastic though.", category: "Speed", date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
  { id: "nps-4", user: "Marcus Vance Studio", score: 9, emoji: "😄", suggestion: "Client portal is extremely sleek. Our wedding photography clients are in love with the layout.", category: "Features", date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() },
];
