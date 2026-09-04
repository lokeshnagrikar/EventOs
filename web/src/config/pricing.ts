export interface PricingPlan {
  id: "starter" | "professional" | "agency";
  name: string;
  badge?: string;
  positioning: string;
  tagline: string;
  description: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  annualSavingsFormatted: string;
  annualSavingsAmount: number;
  valueCallout: string;
  popular?: boolean;
  cta: string;
  ctaSubtext: string;
  features: string[];
  infrastructureNote?: string;
}

const STARTER_MONTHLY = 1999;
const STARTER_ANNUAL_MONTHLY = 1599;

const PROFESSIONAL_MONTHLY = 5999;
const PROFESSIONAL_ANNUAL_MONTHLY = 4799;

const AGENCY_MONTHLY = 11999;
const AGENCY_ANNUAL_MONTHLY = 9599;

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    positioning: "For solo planners & boutique studios",
    tagline: "Win more clients",
    description:
      "Replace spreadsheets and manual proposals with a simple workflow for quoting, proposals, invoicing, and client communication.",
    monthlyPrice: STARTER_MONTHLY,
    annualMonthlyPrice: STARTER_ANNUAL_MONTHLY,
    annualSavingsAmount: (STARTER_MONTHLY - STARTER_ANNUAL_MONTHLY) * 12,
    annualSavingsFormatted: `Save ₹${((STARTER_MONTHLY - STARTER_ANNUAL_MONTHLY) * 12).toLocaleString("en-IN")}/yr`,
    valueCallout: "Save 20+ hrs/mo · Replace manual proposal & admin work",
    popular: false,
    cta: "Start 14-Day Free Trial →",
    ctaSubtext: "No credit card required · 100% risk-free",
    features: [
      "Up to 5 active events",
      "2 team seats",
      "20 GB high-res media storage",
      "AI Quote Generator",
      "Interactive Digital PDF Proposals",
      "Lead & Enquiry Management",
      "Milestone Invoicing",
      "GST Receipts",
      "Basic Client Communication",
      "Email Support",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    badge: "⚡ MOST POPULAR CHOICE",
    positioning: "For growing agencies & active coordinators",
    tagline: "Run more events",
    description:
      "Your complete EventOS workspace for managing clients, teams, vendors, timelines, approvals, payments, and event execution.",
    monthlyPrice: PROFESSIONAL_MONTHLY,
    annualMonthlyPrice: PROFESSIONAL_ANNUAL_MONTHLY,
    annualSavingsAmount: (PROFESSIONAL_MONTHLY - PROFESSIONAL_ANNUAL_MONTHLY) * 12,
    annualSavingsFormatted: `Save ₹${((PROFESSIONAL_MONTHLY - PROFESSIONAL_ANNUAL_MONTHLY) * 12).toLocaleString("en-IN")}/yr`,
    valueCallout: "Save 150+ hrs/mo · Reduce costly coordination errors",
    popular: true,
    cta: "Start 14-Day Free Trial →",
    ctaSubtext: "No credit card required · 100% risk-free",
    features: [
      "Everything in Starter, plus:",
      "Up to 20 active events/month",
      "5 team seats",
      "100 GB high-res media storage",
      "AI Timeline Generator",
      "Timeline Conflict Resolver",
      "Vendor Management",
      "Vendor Payment Tracking",
      "Automated WhatsApp & SMS Client Alerts",
      "Offline PWA for on-site event operations",
      "Client Portal with real-time approvals",
      "Team Task & Execution Workflows",
      "Milestone Payment Tracking",
      "Advanced Analytics",
      "Priority Support",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    positioning: "For established agencies running high-volume productions",
    tagline: "Scale your agency",
    description:
      "Unlimited operational capacity, advanced workflows, white-label client experiences, integrations, and dedicated support for high-volume agencies.",
    monthlyPrice: AGENCY_MONTHLY,
    annualMonthlyPrice: AGENCY_ANNUAL_MONTHLY,
    annualSavingsAmount: (AGENCY_MONTHLY - AGENCY_ANNUAL_MONTHLY) * 12,
    annualSavingsFormatted: `Save ₹${((AGENCY_MONTHLY - AGENCY_ANNUAL_MONTHLY) * 12).toLocaleString("en-IN")}/yr`,
    valueCallout: "Scale operations without adding administrative complexity",
    popular: false,
    cta: "Schedule a 20-Min Demo →",
    ctaSubtext: "Custom onboarding · Dedicated support",
    infrastructureNote: "Dedicated AWS infrastructure available for qualifying accounts",
    features: [
      "Everything in Professional, plus:",
      "Unlimited active events",
      "Unlimited team seats",
      "500+ GB dedicated cloud storage",
      "Advanced role-based permissions",
      "Multi-workspace / branch support",
      "White-label Client Portal",
      "Custom Client Portal Domain",
      "Developer REST API",
      "Webhooks & Integrations",
      "Custom Client Contract / Legal Templates",
      "Advanced Agency Analytics",
      "Custom Workflows",
      "Dedicated Account Support",
    ],
  },
];

export interface ComparisonFeatureRow {
  category?: string;
  name: string;
  starter: string;
  professional: string;
  agency: string;
}

export const COMPARISON_MATRIX: ComparisonFeatureRow[] = [
  { category: "Capacity & Scale", name: "Active Events Managed", starter: "Up to 5", professional: "Up to 20/mo", agency: "Unlimited" },
  { category: "Capacity & Scale", name: "Team Seats Included", starter: "2 seats", professional: "5 seats", agency: "Unlimited" },
  { category: "Capacity & Scale", name: "High-Res Cloud Media Storage", starter: "20 GB", professional: "100 GB", agency: "500+ GB Dedicated" },
  { category: "Core Workflows", name: "Lead & Enquiry Pipeline", starter: "✔", professional: "✔", agency: "✔" },
  { category: "Core Workflows", name: "AI Quote Generator & Digital PDF Proposals", starter: "✔", professional: "✔", agency: "✔" },
  { category: "Core Workflows", name: "Milestone Invoicing & GST Tax Receipts", starter: "✔", professional: "✔", agency: "✔" },
  { category: "Operations & On-Site", name: "AI Timeline Generator & Conflict Resolver", starter: "✕", professional: "✔", agency: "✔" },
  { category: "Operations & On-Site", name: "Client Portal with Real-Time Approvals", starter: "Basic", professional: "✔", agency: "✔ (White-label)" },
  { category: "Operations & On-Site", name: "Vendor Management & Payment Tracking", starter: "✕", professional: "✔", agency: "✔" },
  { category: "Operations & On-Site", name: "Automated WhatsApp & SMS Client Alerts", starter: "✕", professional: "✔", agency: "✔" },
  { category: "Operations & On-Site", name: "Offline PWA for On-Site Production Crews", starter: "✕", professional: "✔", agency: "✔" },
  { category: "Agency Scale", name: "Custom Domain & White-Label Branding", starter: "✕", professional: "✕", agency: "✔" },
  { category: "Agency Scale", name: "Multi-Workspace / Regional Branch Support", starter: "✕", professional: "✕", agency: "✔" },
  { category: "Agency Scale", name: "Developer REST API & Webhook Integrations", starter: "✕", professional: "✕", agency: "✔" },
  { category: "Agency Scale", name: "Custom Contract & Legal Templates", starter: "✕", professional: "✕", agency: "✔" },
  { category: "Support & Infrastructure", name: "Support Tier", starter: "Email Support", professional: "Priority Support", agency: "Dedicated Account Support" },
  { category: "Support & Infrastructure", name: "Cloud Infrastructure", starter: "Standard Cloud", professional: "Enhanced Cloud", agency: "Dedicated AWS Options" },
];

export const PRICING_FAQS = [
  {
    q: "Can I upgrade, downgrade, or switch plans at any time?",
    a: "Yes. You can upgrade, downgrade, or adjust your billing cycle directly from your workspace billing settings at any time. When upgrading, changes take effect immediately with pro-rated billing.",
  },
  {
    q: "What happens if we exceed our plan's active event limit?",
    a: "We never interrupt live event operations or block client communications. If your agency experiences a seasonal peak, you can archive completed events to free up slots or seamlessly transition to the next plan tier.",
  },
  {
    q: "Do my clients have to pay to use the Client Portal?",
    a: "No. Your clients never pay to access proposals, approve timelines, or view proofs. They receive a private, branded link where they can sign proposals and pay milestone invoices without creating an account.",
  },
  {
    q: "Is there a long-term contract or setup fee?",
    a: "Zero onboarding fees and no lock-in contracts. Monthly plans can be cancelled anytime with a single click. Annual plans provide significant savings (~20% off) billed once per year.",
  },
  {
    q: "How secure is our financial, client, and vendor data?",
    a: "Every tenant workspace is logically isolated. All data is encrypted in transit using TLS 1.3 and at rest with AES-256. Automated daily backups ensure your contracts and quotes remain 100% safe.",
  },
  {
    q: "How does the 14-day free trial work?",
    a: "You get unrestricted access to Starter or Professional for 14 days without entering credit card details. If EventOS fits your agency workflow, choose your billing preference to continue seamlessly.",
  },
];
