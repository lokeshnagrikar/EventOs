// Per-page contextual help data
// Maps route prefixes to page-specific tips, shortcuts, docs, and videos

export interface ContextualHelpContent {
  title: string;
  tips: string[];
  shortcuts: { keys: string; description: string }[];
  docsLink: string;
  videoLink?: string;
}

export const CONTEXTUAL_HELP_MAP: Record<string, ContextualHelpContent> = {
  "/dashboard": {
    title: "Dashboard",
    tips: [
      "Check your daily tasks and upcoming events at a glance.",
      "Click any stat card to drill down into detailed analytics.",
      "Use the date range picker to filter metrics by time period.",
      "Right-click any widget to customize its display settings.",
    ],
    shortcuts: [
      { keys: "Alt + D", description: "Navigate to Dashboard" },
      { keys: "Ctrl + K", description: "Open global search" },
    ],
    docsLink: "/help/docs/getting-started",
    videoLink: "/help/tutorials",
  },
  "/crm": {
    title: "CRM & Leads",
    tips: [
      "Drag and drop leads between pipeline stages.",
      "Click a lead name to view full contact details and history.",
      "Use filters to segment leads by source, status, or budget.",
      "Set follow-up reminders to never miss a client touchpoint.",
    ],
    shortcuts: [
      { keys: "N", description: "Create new lead" },
      { keys: "Ctrl + K", description: "Search leads" },
      { keys: "F", description: "Toggle filters" },
    ],
    docsLink: "/help/docs/crm",
    videoLink: "/help/tutorials",
  },
  "/events": {
    title: "Events",
    tips: [
      "Click + to create a new event with venue and guest details.",
      "Use the calendar view to visualize scheduling conflicts.",
      "Assign team members to specific event roles.",
      "Track vendor payments and logistics in the event detail page.",
    ],
    shortcuts: [
      { keys: "Alt + E", description: "Navigate to Events" },
      { keys: "N", description: "Create new event" },
    ],
    docsLink: "/help/docs/events",
    videoLink: "/help/tutorials",
  },
  "/gallery": {
    title: "Gallery",
    tips: [
      "Upload multiple photos at once using drag and drop.",
      "Create separate albums for different events or clients.",
      "Share gallery links with clients via the Client Portal.",
      "Enable download locks until invoice payments clear.",
    ],
    shortcuts: [
      { keys: "U", description: "Upload photos" },
      { keys: "Ctrl + A", description: "Select all" },
    ],
    docsLink: "/help/docs/gallery",
    videoLink: "/help/tutorials",
  },
  "/invoices": {
    title: "Invoices",
    tips: [
      "Create invoices from bookings with pre-filled line items.",
      "Set milestone billing points (retainer, pre-event, final).",
      "Send invoices directly to clients via email or portal link.",
      "Track overdue payments and send automated reminders.",
    ],
    shortcuts: [
      { keys: "N", description: "Create new invoice" },
      { keys: "Ctrl + P", description: "Print invoice" },
    ],
    docsLink: "/help/docs/finance",
    videoLink: "/help/tutorials",
  },
  "/quotes": {
    title: "Quotes & Proposals",
    tips: [
      "Create detailed quotes with line items and tax calculations.",
      "Send quotes to clients for digital approval.",
      "Convert accepted quotes into bookings with one click.",
      "Track quote status: Draft, Sent, Accepted, Rejected.",
    ],
    shortcuts: [
      { keys: "N", description: "Create new quote" },
    ],
    docsLink: "/help/docs/quotes",
    videoLink: "/help/tutorials",
  },
  "/settings": {
    title: "Settings",
    tips: [
      "Complete your company profile to appear professional to clients.",
      "Upload your logo and set brand colors for client-facing pages.",
      "Invite team members and assign specific role permissions.",
      "Connect Stripe to enable online payment collection.",
    ],
    shortcuts: [
      { keys: "Alt + S", description: "Navigate to Settings" },
    ],
    docsLink: "/help/docs/getting-started",
    videoLink: "/help/tutorials",
  },
  "/ai": {
    title: "AI Assistant",
    tips: [
      "Ask the AI to draft contracts, emails, or event briefs.",
      "Use natural language to query your business data.",
      "The AI can suggest pricing based on historical bookings.",
      "Export AI-generated content directly to quotes or events.",
    ],
    shortcuts: [
      { keys: "Alt + A", description: "Navigate to AI" },
    ],
    docsLink: "/help/docs/getting-started",
  },
  "/reports": {
    title: "Reports & Analytics",
    tips: [
      "View revenue, bookings, and client metrics over time.",
      "Export reports as PDF or CSV for stakeholder sharing.",
      "Compare performance across different time periods.",
      "Track team member productivity and task completion.",
    ],
    shortcuts: [],
    docsLink: "/help/docs/getting-started",
  },
};

export function getContextualHelp(pathname: string): ContextualHelpContent | null {
  // Find the best matching route prefix
  const keys = Object.keys(CONTEXTUAL_HELP_MAP).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (pathname.startsWith(key)) {
      return CONTEXTUAL_HELP_MAP[key];
    }
  }
  return null;
}
