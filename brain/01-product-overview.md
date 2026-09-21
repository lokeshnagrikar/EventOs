# EventOS — Product Overview

## Product Identity

**FACT:**
EventOS is a B2B SaaS platform for event management agencies. It digitizes the entire event lifecycle from client inquiry to post-event photo delivery.

**Product tagline (from landing page):**
> Proposals + WhatsApp Alerts + Run-of-Show + Photo Delivery in one single workspace.

## Target Market

**FACT (from pricing, defaults, currency):**
- Primary: Indian event management agencies
- Default currency: INR (₹)
- Default timezone: Asia/Kolkata
- Pricing tiers: ₹1,999/mo (Starter), ₹4,999/mo (Professional), ₹12,999/mo (Agency)
- GST tax integration built into invoicing

## Target Users

**FACT (from role system and middleware):**

| User Type | Access Area | Role Identifiers |
|---|---|---|
| Agency Owner/Admin | Dashboard, CRM, Events, Billing, Settings | Workspace roles (ADMIN, MANAGER, etc.) |
| Team Members | Dashboard, Events, Bookings (scoped) | Workspace roles with permissions |
| Clients | Client Portal only | `CLIENT` role |
| Platform Operators | Superadmin Panel | `SUPER_ADMIN`, `PLATFORM_ADMIN`, `OPERATIONS_LEAD`, `SUPPORT_AGENT`, `FINANCE_OFFICER`, `DEVOPS_ENGINEER`, `COMPLIANCE_AUDITOR`, etc. |

## Pricing Tiers

**FACT (from `web/src/config/pricing.ts`):**

### Starter — ₹1,999/mo (₹1,599/mo annual)
- Up to 5 active events
- 2 team seats
- 20 GB media storage
- AI Quote Generator
- Digital PDF Proposals
- Lead & Enquiry Management
- Milestone Invoicing + GST Receipts

### Professional — ₹4,999/mo (₹3,999/mo annual) ⚡ Most Popular
- Up to 20 active events/month
- 5 team seats
- 100 GB media storage
- Everything in Starter plus:
- AI Timeline Generator
- Vendor Management + Payment Tracking
- Automated WhatsApp & SMS Client Alerts
- Offline PWA
- Client Portal with real-time approvals
- Team Task Workflows

### Agency — ₹12,999/mo (₹9,999/mo annual)
- Unlimited events + team seats
- 500+ GB dedicated storage
- Everything in Professional plus:
- White-label Client Portal
- Custom Domain
- Developer REST API + Webhooks
- Custom Contract Templates
- Multi-workspace/branch support

## Plan Limits (metered by backend)

**FACT (from `billingStore.ts` and billing entities):**

| Metric | Tracked Fields |
|---|---|
| Users | `maxUsers` / `usersCount` |
| Storage | `maxStorage` / `storageBytes` |
| Gallery Uploads | `maxGalleryUploads` / `galleryUploads` |
| Events | `maxEvents` / `eventsCount` |
| Leads | `maxLeads` / `leadsCount` |
| AI Credits | `maxAiCredits` / `aiCreditsUsed` |
| Automation Runs | `maxAutomationRuns` / `automationRuns` |
| API Calls | `maxApiCalls` / `apiCalls` |
| Emails Sent | tracked (`emailsSent`) |
| SMS Sent | tracked (`smsSent`) |

Source: `web/src/store/billingStore.ts`, `backend/auth-service/.../entity/TenantUsage.java`, `backend/auth-service/.../entity/Plan.java`

## Core Value Proposition

**INFERENCE (from landing page components):**
1. Replace spreadsheets and manual proposals
2. Professional branded digital proposals
3. Automated client communication (WhatsApp, email)
4. On-site event execution support (timelines, run-of-show)
5. Post-event photo delivery via galleries
6. Financial tracking (invoices, payments, budgets)
7. Multi-tenant team collaboration
