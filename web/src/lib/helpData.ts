// ─── Help Center Data Layer ──────────────────────────────────────────────────
// All documentation articles, FAQs, tutorials, shortcuts, changelog entries,
// and system services are defined here. Components import from this file.

export interface Article {
  slug: string;
  title: string;
  category: string;
  categorySlug: string;
  readingTime: number; // minutes
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  lastUpdated: string;
  excerpt: string;
  content: ArticleSection[];
  relatedSlugs: string[];
}

export interface ArticleSection {
  id: string;
  heading: string;
  body: string;
  type?: "text" | "note" | "warning" | "tip" | "code";
  code?: string;
  codeLanguage?: string;
}

export interface Tutorial {
  id: string;
  title: string;
  category: string;
  duration: string; // e.g. "4:30"
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  thumbnail: string; // gradient CSS or image URL
  description: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface Shortcut {
  id: string;
  keys: string[];
  description: string;
  category: string;
}

export interface ChangelogEntry {
  id: string;
  version: string;
  date: string;
  category: "Feature" | "Fix" | "Improvement" | "Breaking";
  title: string;
  description: string;
}

export interface SystemService {
  id: string;
  name: string;
  description: string;
  status: "healthy" | "warning" | "offline";
  lastChecked: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENTATION CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

export const DOC_CATEGORIES = [
  { slug: "getting-started", label: "Getting Started", icon: "Rocket" },
  { slug: "authentication", label: "Authentication", icon: "Shield" },
  { slug: "crm", label: "CRM & Leads", icon: "Users" },
  { slug: "quotes", label: "Quotes", icon: "FileText" },
  { slug: "bookings", label: "Bookings", icon: "Layers" },
  { slug: "events", label: "Events", icon: "Calendar" },
  { slug: "finance", label: "Finance", icon: "Coins" },
  { slug: "gallery", label: "Gallery", icon: "Image" },
  { slug: "client-portal", label: "Client Portal", icon: "Globe" },
  { slug: "ai-features", label: "AI Features", icon: "Sparkles" },
  { slug: "settings", label: "Settings", icon: "Settings" },
  { slug: "notifications", label: "Notifications", icon: "Bell" },
  { slug: "security", label: "Security", icon: "Lock" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ARTICLES
// ═══════════════════════════════════════════════════════════════════════════════

export const ARTICLES: Article[] = [
  // ── Getting Started ────────────────────────────────────────────────────────
  {
    slug: "quick-start",
    title: "Quick Start Guide",
    category: "Getting Started",
    categorySlug: "getting-started",
    readingTime: 5,
    difficulty: "Beginner",
    lastUpdated: "2026-06-28",
    excerpt: "Set up your EventOS workspace and create your first event in under 5 minutes.",
    content: [
      { id: "intro", heading: "Welcome to EventOS", body: "EventOS is the premium operating system for event management agencies. This guide walks you through setting up your workspace, importing your first leads, and scheduling your first event.", type: "text" },
      { id: "create-workspace", heading: "1. Create Your Workspace", body: "After registering, you'll be prompted to name your workspace. This becomes your team's shared environment. Choose a name that represents your company — you can change it later in Settings.", type: "text" },
      { id: "invite-team", heading: "2. Invite Your Team", body: "Go to Settings → Team Management → Invite Member. Enter email addresses and assign roles: Admin, Manager, Coordinator, or Staff. Each role has different permission levels.", type: "text" },
      { id: "first-lead", heading: "3. Create Your First Lead", body: "Navigate to CRM → Click 'Quick Add Lead'. Enter the client name, phone number, event type, and estimated budget. The lead will appear in your pipeline immediately.", type: "text" },
      { id: "first-event", heading: "4. Schedule Your First Event", body: "Go to Events → Create Event. Fill in the event name, type, dates, venue, and budget. Once saved, your event workspace is provisioned with timeline management, resource allocation, and vendor coordination tools.", type: "text" },
      { id: "next-steps", heading: "What's Next?", body: "Explore Quotes to build pricing proposals, Gallery to manage media, and Finance Hub for invoicing. Use the AI Center to auto-generate client communications. Check out the Keyboard Shortcuts page to work faster.", type: "tip" },
    ],
    relatedSlugs: ["workspace-setup", "first-login", "creating-leads"],
  },
  {
    slug: "workspace-setup",
    title: "Workspace Setup",
    category: "Getting Started",
    categorySlug: "getting-started",
    readingTime: 4,
    difficulty: "Beginner",
    lastUpdated: "2026-06-25",
    excerpt: "Configure your workspace name, timezone, branding, and team preferences.",
    content: [
      { id: "overview", heading: "Workspace Configuration", body: "Your workspace is the central hub for your entire team. Configure it in Settings → Workspace to customize the experience for your organization.", type: "text" },
      { id: "branding", heading: "Company Branding", body: "Upload your logo, set primary and accent colors, and configure your company tagline. These appear on invoices, quotes, and the client portal.", type: "text" },
      { id: "timezone", heading: "Timezone & Locale", body: "Set your workspace timezone to ensure all event dates, notifications, and calendar views are displayed correctly for your team.", type: "text" },
      { id: "tax-config", heading: "Tax Configuration", body: "Configure GST rates, tax identification numbers, and default tax behavior for invoices and quotes. This is applied globally unless overridden per-invoice.", type: "text" },
    ],
    relatedSlugs: ["quick-start", "team-invites", "branding-setup"],
  },
  {
    slug: "first-login",
    title: "First Login Experience",
    category: "Getting Started",
    categorySlug: "getting-started",
    readingTime: 3,
    difficulty: "Beginner",
    lastUpdated: "2026-06-20",
    excerpt: "What happens when you first log in — onboarding wizard, demo workspace, and guided tour.",
    content: [
      { id: "onboarding", heading: "Onboarding Wizard", body: "When you first log in, EventOS detects that your workspace is new and launches a full-screen onboarding wizard. You can choose to start from scratch or load a demo workspace with sample data.", type: "text" },
      { id: "demo-workspace", heading: "Demo Workspace", body: "The 'Dream Weddings Studio' demo pre-populates your workspace with realistic leads, events, quotes, and media. This helps you explore every feature without setting up real data first.", type: "tip" },
      { id: "guided-tour", heading: "Guided Product Tour", body: "After the wizard, a spotlight tour walks you through the sidebar navigation. Each tooltip explains a feature area. You can replay this tour anytime from the onboarding checklist widget.", type: "text" },
    ],
    relatedSlugs: ["quick-start", "workspace-setup"],
  },
  // ── Authentication ─────────────────────────────────────────────────────────
  {
    slug: "login-methods",
    title: "Login Methods",
    category: "Authentication",
    categorySlug: "authentication",
    readingTime: 3,
    difficulty: "Beginner",
    lastUpdated: "2026-06-15",
    excerpt: "Learn about email/password login, email verification, and session management.",
    content: [
      { id: "email-login", heading: "Email & Password", body: "The primary authentication method. After registration, verify your email address via the link sent to your inbox. Your session token is stored securely and refreshed automatically.", type: "text" },
      { id: "session", heading: "Session Management", body: "Sessions are JWT-based with automatic refresh. You can view and revoke active sessions from Settings → Security → Active Sessions.", type: "text" },
      { id: "remember-me", heading: "Remember Me", body: "Check 'Remember me' during login to extend your session duration. This stores a longer-lived refresh token in your browser.", type: "text" },
    ],
    relatedSlugs: ["two-factor-auth", "password-reset"],
  },
  {
    slug: "two-factor-auth",
    title: "Two-Factor Authentication",
    category: "Authentication",
    categorySlug: "authentication",
    readingTime: 4,
    difficulty: "Intermediate",
    lastUpdated: "2026-06-10",
    excerpt: "Add an extra layer of security with TOTP-based two-factor authentication.",
    content: [
      { id: "setup", heading: "Setting Up 2FA", body: "Go to Settings → Security → Enable 2FA. Scan the QR code with any TOTP app (Google Authenticator, Authy, 1Password). Enter the 6-digit code to confirm activation.", type: "text" },
      { id: "login-with-2fa", heading: "Logging In with 2FA", body: "After entering your email and password, you'll be prompted for a 6-digit TOTP code. Enter the code from your authenticator app to complete the login.", type: "text" },
      { id: "recovery", heading: "Recovery Codes", body: "When enabling 2FA, save your recovery codes in a secure location. These one-time codes can be used to log in if you lose access to your authenticator app.", type: "warning" },
    ],
    relatedSlugs: ["login-methods", "password-reset", "audit-logs"],
  },
  {
    slug: "password-reset",
    title: "Password Reset",
    category: "Authentication",
    categorySlug: "authentication",
    readingTime: 2,
    difficulty: "Beginner",
    lastUpdated: "2026-06-10",
    excerpt: "Reset your password via email if you've forgotten it.",
    content: [
      { id: "request", heading: "Requesting a Reset", body: "Click 'Forgot Password?' on the login page. Enter your registered email address. You'll receive a reset link valid for 15 minutes.", type: "text" },
      { id: "new-password", heading: "Setting a New Password", body: "Click the link in your email and enter your new password. Requirements: minimum 8 characters, at least one uppercase letter, one number, and one special character.", type: "text" },
    ],
    relatedSlugs: ["login-methods", "two-factor-auth"],
  },
  // ── CRM ────────────────────────────────────────────────────────────────────
  {
    slug: "creating-leads",
    title: "Creating & Managing Leads",
    category: "CRM & Leads",
    categorySlug: "crm",
    readingTime: 5,
    difficulty: "Beginner",
    lastUpdated: "2026-06-30",
    excerpt: "Learn how to create, import, and manage client leads in the CRM pipeline.",
    content: [
      { id: "quick-add", heading: "Quick Add Lead", body: "Click the '+' button on the CRM page or press Alt+L. Enter the client name, phone, email, event type, and estimated budget. The lead is instantly added to the 'New' stage of your pipeline.", type: "text" },
      { id: "pipeline", heading: "Lead Pipeline", body: "The CRM uses a Kanban-style pipeline with stages: New → Contacted → Qualified → Proposal Sent → Negotiating → Won → Lost. Drag leads between stages to update their status.", type: "text" },
      { id: "lead-detail", heading: "Lead Details", body: "Click any lead to open the detail drawer. Here you can add notes, log activities (calls, meetings, emails), assign team members, and track the full communication history.", type: "text" },
      { id: "bulk-actions", heading: "Bulk Actions", body: "Select multiple leads using checkboxes. Then use bulk actions: Assign to team member, Change stage, Delete, or Export. This saves time when processing many leads at once.", type: "text" },
      { id: "recycle-bin", heading: "Recycle Bin", body: "Deleted leads are moved to the Recycle Bin, where they can be restored within 30 days. After 30 days, they are permanently purged.", type: "note" },
    ],
    relatedSlugs: ["lead-pipeline", "quote-builder", "quick-start"],
  },
  {
    slug: "lead-pipeline",
    title: "Lead Pipeline & Stages",
    category: "CRM & Leads",
    categorySlug: "crm",
    readingTime: 4,
    difficulty: "Intermediate",
    lastUpdated: "2026-06-28",
    excerpt: "Understand how leads move through stages and how to customize your pipeline.",
    content: [
      { id: "stages", heading: "Default Stages", body: "EventOS provides 7 default stages: New, Contacted, Qualified, Proposal Sent, Negotiating, Won, and Lost. Each stage has a color indicator and can contain unlimited leads.", type: "text" },
      { id: "drag-drop", heading: "Drag & Drop", body: "In Board view, drag lead cards between columns to update their stage. The change is saved automatically and logged in the activity history.", type: "text" },
      { id: "views", heading: "Pipeline Views", body: "Switch between Dashboard (overview metrics), Board (Kanban), List (table), Compact (dense list), Table (spreadsheet), and Timeline views using the tab bar.", type: "text" },
    ],
    relatedSlugs: ["creating-leads", "quote-builder"],
  },
  // ── Quotes ─────────────────────────────────────────────────────────────────
  {
    slug: "quote-builder",
    title: "Building Quotes",
    category: "Quotes",
    categorySlug: "quotes",
    readingTime: 6,
    difficulty: "Intermediate",
    lastUpdated: "2026-06-30",
    excerpt: "Create professional pricing proposals with the interactive quote builder.",
    content: [
      { id: "creating", heading: "Creating a Quote", body: "Navigate to Quotes → New Quote. Select the associated lead, add a title, and begin building your pricing sections.", type: "text" },
      { id: "sections", heading: "Quote Sections", body: "Organize your quote into sections (e.g., Venue, Catering, Decor). Each section contains line items with description, quantity, unit price, and subtotal.", type: "text" },
      { id: "line-items", heading: "Line Items", body: "Add individual services or products as line items. You can drag to reorder, edit inline, and duplicate items. Totals are calculated automatically including tax.", type: "text" },
      { id: "sharing", heading: "Sharing with Clients", body: "Once finalized, share the quote via the Client Portal. Clients can view, approve (with digital signature), or reject the quote with feedback.", type: "text" },
      { id: "conversion", heading: "Converting to Booking", body: "When a client approves a quote, it can be converted into a booking. The booking inherits all quote details including line items, total, and client information.", type: "tip" },
    ],
    relatedSlugs: ["creating-leads", "booking-lifecycle", "invoice-generation"],
  },
  // ── Bookings ───────────────────────────────────────────────────────────────
  {
    slug: "booking-lifecycle",
    title: "Booking Lifecycle",
    category: "Bookings",
    categorySlug: "bookings",
    readingTime: 5,
    difficulty: "Intermediate",
    lastUpdated: "2026-06-28",
    excerpt: "Understand the full lifecycle from quote acceptance to event completion.",
    content: [
      { id: "creation", heading: "Creating a Booking", body: "Bookings are typically created by converting an approved quote. They can also be created manually from the Bookings page with all contract details.", type: "text" },
      { id: "stages", heading: "Booking Stages", body: "Bookings progress through: Draft → Confirmed → In Progress → Completed → Cancelled. Each stage triggers different workflows and notifications.", type: "text" },
      { id: "contracts", heading: "Contract Ledger", body: "Each booking includes a contract ledger with payment schedules, advance amounts, balance tracking, and linked invoices.", type: "text" },
    ],
    relatedSlugs: ["quote-builder", "creating-events", "invoice-generation"],
  },
  // ── Events ─────────────────────────────────────────────────────────────────
  {
    slug: "creating-events",
    title: "Creating Events",
    category: "Events",
    categorySlug: "events",
    readingTime: 5,
    difficulty: "Beginner",
    lastUpdated: "2026-07-01",
    excerpt: "Create event workspaces with timelines, team assignments, and vendor coordination.",
    content: [
      { id: "creation", heading: "Event Creation", body: "Go to Events → Create Event. Fill in the event name, type (Wedding, Corporate, Birthday, etc.), start and end dates, venue, budget, and any notes.", type: "text" },
      { id: "views", heading: "Event Views", body: "The Events dashboard offers Overview, Grid, List, Kanban Board, Calendar, Timeline, and Agenda views. Switch between them using the tab bar.", type: "text" },
      { id: "resources", heading: "Resource Center", body: "The Resource Center tab lets you manage team members assigned to events. Drag staff cards onto events to allocate resources.", type: "text" },
      { id: "vendors", heading: "Partner Vendors", body: "Track external vendors in the Partner Vendors tab. Log vendor details, GST/PAN, UPI info, and export vendor lists as CSV.", type: "text" },
    ],
    relatedSlugs: ["booking-lifecycle", "kanban-board", "budget-tracking"],
  },
  {
    slug: "kanban-board",
    title: "Events Kanban Board",
    category: "Events",
    categorySlug: "events",
    readingTime: 3,
    difficulty: "Beginner",
    lastUpdated: "2026-07-01",
    excerpt: "Manage events visually with the drag-and-drop Kanban board.",
    content: [
      { id: "overview", heading: "Board Overview", body: "The Kanban board organizes events into columns by status: Planning, Confirmed, In Progress, Completed. Drag events between columns to update their status.", type: "text" },
      { id: "cards", heading: "Event Cards", body: "Each card shows the event name, date, venue, budget, and a status badge. Click a card to open the full event workspace.", type: "text" },
    ],
    relatedSlugs: ["creating-events", "lead-pipeline"],
  },
  // ── Finance ────────────────────────────────────────────────────────────────
  {
    slug: "invoice-generation",
    title: "Generating Invoices",
    category: "Finance",
    categorySlug: "finance",
    readingTime: 5,
    difficulty: "Intermediate",
    lastUpdated: "2026-07-01",
    excerpt: "Create, send, and track invoices with automatic tax calculation.",
    content: [
      { id: "creation", heading: "Creating an Invoice", body: "Navigate to Finance Hub → Invoices tab → Create Invoice. Select the booking, add line items, apply tax rates, and set the due date.", type: "text" },
      { id: "tax", heading: "Tax Configuration", body: "EventOS supports GST and custom tax rates. Configure default rates in Settings → Tax Configuration. Override rates per-invoice as needed.", type: "text" },
      { id: "sending", heading: "Sending Invoices", body: "Invoices can be shared via the Client Portal. Clients see a read-only view with payment options. Email notifications are sent automatically.", type: "text" },
      { id: "status", heading: "Invoice Statuses", body: "Invoices progress through: Draft → Sent → Viewed → Paid → Overdue → Cancelled. Status updates are tracked in the audit log.", type: "text" },
    ],
    relatedSlugs: ["recording-payments", "budget-tracking", "quote-builder"],
  },
  {
    slug: "recording-payments",
    title: "Recording Payments",
    category: "Finance",
    categorySlug: "finance",
    readingTime: 3,
    difficulty: "Beginner",
    lastUpdated: "2026-06-28",
    excerpt: "Log payments against invoices and track outstanding balances.",
    content: [
      { id: "recording", heading: "Recording a Payment", body: "Open an invoice and click 'Record Payment'. Enter the amount, payment method (Cash, UPI, Bank Transfer, Card), transaction reference, and date.", type: "text" },
      { id: "partial", heading: "Partial Payments", body: "EventOS supports partial payments. The remaining balance is automatically calculated and displayed on the invoice. Multiple payments can be recorded against a single invoice.", type: "text" },
    ],
    relatedSlugs: ["invoice-generation", "budget-tracking"],
  },
  {
    slug: "budget-tracking",
    title: "Budget Tracking",
    category: "Finance",
    categorySlug: "finance",
    readingTime: 4,
    difficulty: "Intermediate",
    lastUpdated: "2026-06-25",
    excerpt: "Track expenses, revenue, and profitability across all events.",
    content: [
      { id: "dashboard", heading: "Finance Dashboard", body: "The Finance Hub dashboard shows key metrics: total revenue, outstanding payments, expenses, and net profit. Charts visualize trends over time.", type: "text" },
      { id: "expenses", heading: "Expense Tracking", body: "Log expenses in the Expenses tab. Categorize them by type (Venue, Catering, Decor, Travel, etc.) and associate them with specific events.", type: "text" },
      { id: "cash-flow", heading: "Cash Flow", body: "The Cash Flow chart shows money in vs money out over weekly, monthly, quarterly, or yearly periods. Identify seasonal trends and plan accordingly.", type: "text" },
    ],
    relatedSlugs: ["invoice-generation", "recording-payments"],
  },
  // ── Gallery ────────────────────────────────────────────────────────────────
  {
    slug: "managing-albums",
    title: "Managing Albums",
    category: "Gallery",
    categorySlug: "gallery",
    readingTime: 4,
    difficulty: "Beginner",
    lastUpdated: "2026-07-01",
    excerpt: "Create albums, upload photos and videos, and share galleries with clients.",
    content: [
      { id: "creating", heading: "Creating an Album", body: "Go to Gallery → Create Album. Name the album, optionally link it to an event, set visibility (Public/Private), and choose the initial status (Draft/Published).", type: "text" },
      { id: "uploading", heading: "Uploading Media", body: "Open an album and drag files to upload. Supported formats: JPEG, PNG, WebP, MP4, MOV. Files are processed through Cloudinary for optimization.", type: "text" },
      { id: "sharing", heading: "Client Sharing", body: "Publish an album and share the link via the Client Portal. Clients can browse, download, and leave comments on individual media items.", type: "text" },
      { id: "views", heading: "Gallery Views", body: "Browse albums in Grid, List, or Timeline view. Pin important albums to the top. Archive completed albums to keep your gallery organized.", type: "text" },
    ],
    relatedSlugs: ["client-portal-access", "creating-events"],
  },
  // ── Client Portal ──────────────────────────────────────────────────────────
  {
    slug: "client-portal-access",
    title: "Client Portal Access",
    category: "Client Portal",
    categorySlug: "client-portal",
    readingTime: 4,
    difficulty: "Beginner",
    lastUpdated: "2026-06-28",
    excerpt: "Give clients a branded portal to view quotes, invoices, gallery, and timeline.",
    content: [
      { id: "overview", heading: "Portal Overview", body: "The Client Portal (/portal) is a self-service interface for your clients. They can view their event timeline, approve quotes, pay invoices, browse gallery albums, and contact support.", type: "text" },
      { id: "access", heading: "Client Access", body: "Clients log in with the same credentials they were invited with. Their view is limited to their own data — they cannot see other clients' information.", type: "text" },
      { id: "branding", heading: "Portal Branding", body: "The portal inherits your workspace branding (logo, colors, tagline) configured in Settings → Branding.", type: "text" },
    ],
    relatedSlugs: ["managing-albums", "quote-builder", "invoice-generation"],
  },
  // ── AI Features ────────────────────────────────────────────────────────────
  {
    slug: "ai-config",
    title: "AI Configuration",
    category: "AI Features",
    categorySlug: "ai-features",
    readingTime: 4,
    difficulty: "Intermediate",
    lastUpdated: "2026-06-30",
    excerpt: "Configure your AI provider, API keys, and model settings.",
    content: [
      { id: "providers", heading: "Supported Providers", body: "EventOS supports OpenAI, Google Gemini, and Anthropic. Select your provider in the AI Center → Settings tab.", type: "text" },
      { id: "api-key", heading: "API Key", body: "Enter your API key from your chosen provider. Keys are stored securely in your browser's local storage and never sent to EventOS servers.", type: "note" },
      { id: "model-settings", heading: "Model Settings", body: "Adjust temperature (creativity), max tokens (response length), and system prompt to customize AI behavior for your workflow.", type: "text" },
    ],
    relatedSlugs: ["ai-prompt-library"],
  },
  {
    slug: "ai-prompt-library",
    title: "AI Prompt Library",
    category: "AI Features",
    categorySlug: "ai-features",
    readingTime: 3,
    difficulty: "Beginner",
    lastUpdated: "2026-06-28",
    excerpt: "Use and create prompt templates for common tasks.",
    content: [
      { id: "presets", heading: "Built-in Prompts", body: "EventOS includes preset prompts for client proposals, payment reminders, and gallery announcements. Click any prompt to use it instantly.", type: "text" },
      { id: "custom", heading: "Custom Prompts", body: "Create your own prompt templates in the Prompts tab. Assign them to modules (CRM, Finance, Gallery) for organized access.", type: "text" },
    ],
    relatedSlugs: ["ai-config"],
  },
  // ── Settings ───────────────────────────────────────────────────────────────
  {
    slug: "team-invites",
    title: "Team Invitations",
    category: "Settings",
    categorySlug: "settings",
    readingTime: 3,
    difficulty: "Beginner",
    lastUpdated: "2026-06-30",
    excerpt: "Invite team members and assign roles with granular permissions.",
    content: [
      { id: "inviting", heading: "Inviting Members", body: "Go to Settings → Team Management → Invite Member. Enter the email, first name, last name, and assign a role. An invitation email is sent automatically.", type: "text" },
      { id: "roles", heading: "Role Hierarchy", body: "Owner: Full access. Admin: All features except deletion. Manager: CRM, Quotes, Bookings, Events. Staff: CRM and Events only. Client: Quotes and Payments only.", type: "text" },
      { id: "bulk-invite", heading: "Bulk Invites", body: "Enter multiple email addresses separated by commas to send invitations in bulk. All users receive the same role assignment.", type: "text" },
    ],
    relatedSlugs: ["workspace-setup", "audit-logs"],
  },
  {
    slug: "branding-setup",
    title: "Company Branding",
    category: "Settings",
    categorySlug: "settings",
    readingTime: 3,
    difficulty: "Beginner",
    lastUpdated: "2026-06-25",
    excerpt: "Customize your logo, colors, and tagline across the platform.",
    content: [
      { id: "logo", heading: "Logo Upload", body: "Upload your company logo in Settings → Branding. Supported formats: PNG, SVG, JPEG. Maximum size: 2MB. The logo appears on invoices, quotes, and the client portal.", type: "text" },
      { id: "colors", heading: "Brand Colors", body: "Set your primary and accent colors. These are used in the client portal, email templates, and document headers.", type: "text" },
    ],
    relatedSlugs: ["workspace-setup", "team-invites"],
  },
  // ── Security ───────────────────────────────────────────────────────────────
  {
    slug: "audit-logs",
    title: "Audit Logs",
    category: "Security",
    categorySlug: "security",
    readingTime: 3,
    difficulty: "Advanced",
    lastUpdated: "2026-06-20",
    excerpt: "Track every action taken in your workspace for compliance and security.",
    content: [
      { id: "overview", heading: "Audit Trail", body: "Every significant action in EventOS is logged: login attempts, data modifications, team changes, and settings updates. Access logs from Settings → Audit Logs or the Activity Logs page.", type: "text" },
      { id: "filtering", heading: "Filtering Logs", body: "Filter by date range, user, action type, and module. Export logs as CSV for compliance reporting.", type: "text" },
    ],
    relatedSlugs: ["two-factor-auth", "team-invites"],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// TUTORIALS
// ═══════════════════════════════════════════════════════════════════════════════

export const TUTORIALS: Tutorial[] = [
  { id: "t1", title: "Getting Started with EventOS", category: "Getting Started", duration: "6:30", difficulty: "Beginner", thumbnail: "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)", description: "Complete walkthrough of setting up your workspace." },
  { id: "t2", title: "Mastering the CRM Pipeline", category: "CRM", duration: "8:15", difficulty: "Intermediate", thumbnail: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", description: "Advanced lead management and pipeline optimization." },
  { id: "t3", title: "Creating Your First Event", category: "Events", duration: "5:45", difficulty: "Beginner", thumbnail: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)", description: "Step-by-step event workspace creation." },
  { id: "t4", title: "Building Professional Quotes", category: "Finance", duration: "7:00", difficulty: "Intermediate", thumbnail: "linear-gradient(135deg, #10B981 0%, #3B82F6 100%)", description: "Quote builder with sections, line items, and tax." },
  { id: "t5", title: "Invoice & Payment Workflows", category: "Finance", duration: "6:20", difficulty: "Intermediate", thumbnail: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)", description: "End-to-end invoicing and payment recording." },
  { id: "t6", title: "Gallery & Media Management", category: "Gallery", duration: "4:50", difficulty: "Beginner", thumbnail: "linear-gradient(135deg, #EC4899 0%, #F97316 100%)", description: "Album creation, uploads, and client sharing." },
  { id: "t7", title: "Configuring the AI Center", category: "AI", duration: "5:10", difficulty: "Intermediate", thumbnail: "linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)", description: "Set up AI providers and prompt templates." },
  { id: "t8", title: "Advanced Settings & Security", category: "Settings", duration: "9:30", difficulty: "Advanced", thumbnail: "linear-gradient(135deg, #1E293B 0%, #475569 100%)", description: "2FA, API keys, integrations, and audit logs." },
  { id: "t9", title: "Client Portal Walkthrough", category: "Getting Started", duration: "4:20", difficulty: "Beginner", thumbnail: "linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)", description: "How clients experience your portal." },
  { id: "t10", title: "Reports & Analytics Deep Dive", category: "Finance", duration: "7:45", difficulty: "Advanced", thumbnail: "linear-gradient(135deg, #0EA5E9 0%, #22D3EE 100%)", description: "Revenue dashboards, trends, and data exports." },
  { id: "t11", title: "Smart Automation Rules", category: "Settings", duration: "6:00", difficulty: "Advanced", thumbnail: "linear-gradient(135deg, #A78BFA 0%, #C084FC 100%)", description: "Set up automated workflows and triggers." },
  { id: "t12", title: "Budget Calculator & Estimation", category: "Finance", duration: "3:40", difficulty: "Beginner", thumbnail: "linear-gradient(135deg, #34D399 0%, #6EE7B7 100%)", description: "Use the budget calculator for quick estimates." },
];

// ═══════════════════════════════════════════════════════════════════════════════
// FAQs
// ═══════════════════════════════════════════════════════════════════════════════

export const FAQS: FAQ[] = [
  { id: "f1", question: "How do I create a new lead?", answer: "Navigate to CRM and click the 'Quick Add Lead' button, or press Alt+L. Fill in the client name, contact info, event type, and budget. The lead will appear in your pipeline immediately.", category: "CRM" },
  { id: "f2", question: "How do I invite teammates?", answer: "Go to Settings → Team Management → Invite Member. Enter their email, first and last name, and select a role (Admin, Manager, Coordinator, Staff). An invitation email is sent automatically.", category: "Account" },
  { id: "f3", question: "How do invoices work?", answer: "Navigate to Finance Hub → Invoices tab → Create Invoice. Link it to a booking, add line items, configure tax, and send it via the Client Portal. Track payment status in real-time.", category: "Finance" },
  { id: "f4", question: "How do gallery share links work?", answer: "Create a gallery album, upload your media, and set it to 'Published'. The album is accessible through the Client Portal. You can also generate a direct shareable link.", category: "Gallery" },
  { id: "f5", question: "Can I recover deleted events?", answer: "Currently, deleted events cannot be recovered once confirmed. We recommend using the 'Cancel' status instead of deleting. Deleted leads are recoverable from the CRM Recycle Bin within 30 days.", category: "Events" },
  { id: "f6", question: "How do I reset my password?", answer: "Click 'Forgot Password?' on the login page. Enter your email address. You'll receive a reset link valid for 15 minutes. Click the link and set a new password.", category: "Account" },
  { id: "f7", question: "How do I change my workspace name?", answer: "Go to Settings → Workspace → Edit the 'Workspace Name' field → Click Save. The change is reflected across the entire platform including the client portal.", category: "Account" },
  { id: "f8", question: "What payment methods are supported?", answer: "EventOS supports Cash, UPI, Bank Transfer, Credit Card, and Cheque as payment recording methods. These are logged manually when recording payments against invoices.", category: "Finance" },
  { id: "f9", question: "How do I configure tax rates?", answer: "Go to Settings → Tax Configuration. Set your default GST rate, tax identification numbers, and configure whether tax is applied by default on new invoices and quotes.", category: "Finance" },
  { id: "f10", question: "Can I use my own AI provider?", answer: "Yes. EventOS supports OpenAI, Google Gemini, and Anthropic. Go to AI Center → Settings, select your provider, and enter your API key. Keys are stored locally in your browser.", category: "Technical" },
  { id: "f11", question: "How do I export data?", answer: "Most list views include an Export button. You can export leads, vendor lists, invoices, and reports as CSV or JSON. Look for the download icon in the toolbar.", category: "Technical" },
  { id: "f12", question: "What happens when my trial ends?", answer: "When your free trial expires, you'll be prompted to select a subscription plan. Your data is retained for 30 days after trial expiration. Upgrade anytime to continue using EventOS.", category: "Account" },
  { id: "f13", question: "How do client approvals work?", answer: "Send a quote via the Client Portal. The client can view the full quote breakdown, then approve it with a digital signature or reject it with feedback. Approved quotes can be converted to bookings.", category: "CRM" },
  { id: "f14", question: "How do I set up 2FA?", answer: "Go to Settings → Security → Enable Two-Factor Authentication. Scan the QR code with any TOTP app (Google Authenticator, Authy). Enter the 6-digit code to confirm. Save your recovery codes securely.", category: "Account" },
  { id: "f15", question: "Can I customize email templates?", answer: "Yes. Go to Settings → Email Templates. You can customize invoice emails, quote notifications, and booking confirmations with your own subject lines and HTML body content.", category: "Technical" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════════════════════════════════════

export const SHORTCUTS: Shortcut[] = [
  // Navigation
  { id: "s1", keys: ["G", "D"], description: "Go to Dashboard", category: "Navigation" },
  { id: "s2", keys: ["G", "C"], description: "Go to CRM", category: "Navigation" },
  { id: "s3", keys: ["G", "E"], description: "Go to Events", category: "Navigation" },
  { id: "s4", keys: ["G", "G"], description: "Go to Gallery", category: "Navigation" },
  { id: "s5", keys: ["G", "S"], description: "Go to Settings", category: "Navigation" },
  { id: "s6", keys: ["G", "F"], description: "Go to Finance Hub", category: "Navigation" },
  { id: "s7", keys: ["G", "H"], description: "Go to Help Center", category: "Navigation" },
  // Global
  { id: "s8", keys: ["Ctrl", "K"], description: "Open Command Palette", category: "Global" },
  { id: "s9", keys: ["Ctrl", "/"], description: "Search Help Center", category: "Global" },
  { id: "s10", keys: ["Esc"], description: "Close Modal / Drawer", category: "Global" },
  { id: "s11", keys: ["?"], description: "Show Keyboard Shortcuts", category: "Global" },
  // CRM
  { id: "s12", keys: ["Alt", "L"], description: "Quick Add Lead", category: "CRM" },
  { id: "s13", keys: ["Alt", "Q"], description: "New Quote", category: "CRM" },
  // Events
  { id: "s14", keys: ["Alt", "E"], description: "Create Event", category: "Events" },
  // Finance
  { id: "s15", keys: ["Alt", "I"], description: "Create Invoice", category: "Finance" },
  // Views
  { id: "s16", keys: ["1"], description: "Switch to Grid View", category: "Views" },
  { id: "s17", keys: ["2"], description: "Switch to List View", category: "Views" },
  { id: "s18", keys: ["3"], description: "Switch to Board View", category: "Views" },
  { id: "s19", keys: ["4"], description: "Switch to Calendar View", category: "Views" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// CHANGELOG
// ═══════════════════════════════════════════════════════════════════════════════

export const CHANGELOG: ChangelogEntry[] = [
  { id: "cl1", version: "2.4.0", date: "2026-07-05", category: "Feature", title: "Help Center & Documentation", description: "Integrated Help Center with full documentation, tutorials, FAQ, keyboard shortcuts, and system status dashboard." },
  { id: "cl2", version: "2.3.0", date: "2026-07-03", category: "Feature", title: "SaaS Billing & Subscriptions", description: "Multi-tenant subscription system with plans, billing, invoices, usage tracking, and workspace administration." },
  { id: "cl3", version: "2.2.0", date: "2026-07-01", category: "Feature", title: "Onboarding Wizard & Product Tour", description: "Full-screen onboarding wizard, demo workspace seeder, spotlight product tour, and progress checklist widget." },
  { id: "cl4", version: "2.1.5", date: "2026-06-28", category: "Improvement", title: "CRM Pipeline Enhancements", description: "Added Compact view, Timeline view, Recycle Bin, bulk actions, and lead assignment improvements." },
  { id: "cl5", version: "2.1.4", date: "2026-06-25", category: "Fix", title: "Quote Builder Drag & Drop Fix", description: "Resolved TypeScript type incompatibility with @hello-pangea/dnd DraggableStyle types in the quote line item reordering." },
  { id: "cl6", version: "2.1.3", date: "2026-06-22", category: "Improvement", title: "Finance Dashboard Redesign", description: "Revamped the Finance Hub with cash flow charts, expense tracking, and P&L analytics." },
  { id: "cl7", version: "2.1.2", date: "2026-06-18", category: "Fix", title: "Gallery Upload Stability", description: "Fixed Cloudinary integration issues and improved bulk upload reliability for large media files." },
  { id: "cl8", version: "2.1.1", date: "2026-06-15", category: "Feature", title: "AI Center & Prompt Library", description: "AI Center with provider configuration, prompt library, usage analytics, and activity history." },
  { id: "cl9", version: "2.1.0", date: "2026-06-10", category: "Feature", title: "Client Portal", description: "Self-service portal for clients with quote approvals, invoice payments, gallery browsing, and timeline views." },
  { id: "cl10", version: "2.0.0", date: "2026-06-01", category: "Breaking", title: "EventOS v2 Launch", description: "Complete platform redesign with dark mode, glassmorphism, Framer Motion animations, and premium UI. Migration guide available." },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM SERVICES
// ═══════════════════════════════════════════════════════════════════════════════

export const SYSTEM_SERVICES: SystemService[] = [
  { id: "svc-1", name: "API Gateway", description: "Routes all client requests to backend services", status: "healthy", lastChecked: new Date().toISOString() },
  { id: "svc-2", name: "Authentication Service", description: "User auth, JWT, sessions, 2FA, and team management", status: "healthy", lastChecked: new Date().toISOString() },
  { id: "svc-3", name: "CRM Service", description: "Lead management, quotes, contacts, and activities", status: "healthy", lastChecked: new Date().toISOString() },
  { id: "svc-4", name: "Event Service", description: "Events, bookings, invoices, and calendar", status: "healthy", lastChecked: new Date().toISOString() },
  { id: "svc-5", name: "Gallery Service", description: "Media uploads, album management, and CDN delivery", status: "healthy", lastChecked: new Date().toISOString() },
  { id: "svc-6", name: "PostgreSQL Database", description: "Primary relational data store", status: "healthy", lastChecked: new Date().toISOString() },
  { id: "svc-7", name: "Redis Cache", description: "Session cache, rate limiting, and real-time data", status: "healthy", lastChecked: new Date().toISOString() },
  { id: "svc-8", name: "RabbitMQ", description: "Async message queue for notifications and events", status: "healthy", lastChecked: new Date().toISOString() },
  { id: "svc-9", name: "Cloudinary CDN", description: "Image and video processing, optimization, delivery", status: "healthy", lastChecked: new Date().toISOString() },
  { id: "svc-10", name: "Render Deployment", description: "Application hosting and container orchestration", status: "healthy", lastChecked: new Date().toISOString() },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SEARCH INDEX (flattened for fuzzy search)
// ═══════════════════════════════════════════════════════════════════════════════

export interface SearchItem {
  type: "article" | "faq" | "tutorial" | "shortcut" | "command";
  title: string;
  description: string;
  href: string;
  category: string;
  score?: number;
}

export function buildSearchIndex(): SearchItem[] {
  const items: SearchItem[] = [];

  ARTICLES.forEach((a) => {
    items.push({ type: "article", title: a.title, description: a.excerpt, href: `/help/docs/${a.slug}`, category: a.category });
  });

  FAQS.forEach((f) => {
    items.push({ type: "faq", title: f.question, description: f.answer.slice(0, 100) + "...", href: "/help/faq", category: f.category });
  });

  TUTORIALS.forEach((t) => {
    items.push({ type: "tutorial", title: t.title, description: t.description, href: "/help/tutorials", category: t.category });
  });

  SHORTCUTS.forEach((s) => {
    items.push({ type: "shortcut", title: s.keys.join(" + "), description: s.description, href: "/help/shortcuts", category: s.category });
  });

  // Common commands
  items.push({ type: "command", title: "Open Settings", description: "Navigate to workspace settings", href: "/settings", category: "Navigation" });
  items.push({ type: "command", title: "Create Lead", description: "Add a new CRM lead", href: "/crm", category: "CRM" });
  items.push({ type: "command", title: "Create Event", description: "Schedule a new event", href: "/events", category: "Events" });
  items.push({ type: "command", title: "New Quote", description: "Build a client proposal", href: "/quotes/new", category: "Quotes" });
  items.push({ type: "command", title: "View Dashboard", description: "Go to main dashboard", href: "/dashboard", category: "Navigation" });

  return items;
}

export function fuzzySearch(items: SearchItem[], query: string): SearchItem[] {
  if (!query.trim()) return [];
  const lower = query.toLowerCase();
  return items
    .map((item) => {
      const titleMatch = item.title.toLowerCase().includes(lower) ? 2 : 0;
      const descMatch = item.description.toLowerCase().includes(lower) ? 1 : 0;
      const catMatch = item.category.toLowerCase().includes(lower) ? 0.5 : 0;
      const score = titleMatch + descMatch + catMatch;
      return { ...item, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);
}
