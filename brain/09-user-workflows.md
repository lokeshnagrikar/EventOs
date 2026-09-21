# EventOS — User Workflows

## Primary Workflow: Lead → Booking → Event → Delivery

**FACT (reconstructed from code):**

```
1. Lead Capture
   └─ Agency receives inquiry (manual entry in CRM or budget calculator conversion)
   └─ Frontend: /crm → POST /api/v1/crm/leads
   └─ DB: Lead created in crm_db with status NEW

2. Lead Qualification
   └─ Agency reviews lead, adds notes, assigns team member
   └─ Frontend: /crm (pipeline view) → PUT /api/v1/crm/leads/{id}
   └─ DB: Lead status updated (NEW → CONTACTED → QUALIFIED)

3. Quote Generation
   └─ Agency creates itemized quote/proposal for lead
   └─ Frontend: /quotes/new → POST /api/v1/crm/quotes
   └─ DB: Quote created with line items, sequential number (QT-XXXX-v1)
   └─ Optional: AI-assisted quote generation (/quotes/ai-generator)

4. Proposal Delivery
   └─ Share quote via WhatsApp link or email with public share URL
   └─ Frontend: /quotes/share → generates share link with token
   └─ WhatsApp: formatWhatsAppMessage(PROPOSAL_LINK) → wa.me deep link
   └─ Client views at public share URL (no login required)

5. Quote Acceptance
   └─ Client approves quote via portal or share link
   └─ Backend: Quote status → APPROVED
   └─ RabbitMQ: quote.accepted event → event.booking.queue
   └─ Consumer: QuoteAcceptedConsumer creates Booking automatically
   └─ DB: Booking created in event_db with status INQUIRY

6. Event Creation
   └─ Agency creates event linked to booking
   └─ Frontend: /events → POST /api/v1/events
   └─ DB: Event with multi-day support, venues, guest list

7. Event Planning
   └─ Add timeline tasks, vendor assignments, budget tracking
   └─ Frontend: /events/[id] → various PUT/POST endpoints
   └─ DB: TimelineTasks, VendorAssignments, BudgetCategoryAllocations

8. Invoicing
   └─ Generate milestone invoices
   └─ Frontend: /invoices → POST /api/v1/events/invoices
   └─ DB: Invoice with sequential number (INV-YYYY-XXXXXX)
   └─ Optional: Send via WhatsApp (INVOICE_RECEIPT template)

9. Payment Collection
   └─ Record payments against invoices
   └─ Frontend: /payments → POST /api/v1/events/payments
   └─ RabbitMQ: payment.recorded → gallery access update
   └─ DB: Payment, Transaction records

10. Event Execution
    └─ On-site team uses timeline view for cue management
    └─ WhatsApp alerts: RUN_OF_SHOW_ALERT template for live cues
    └─ Timeline task status updates (TODO → IN_PROGRESS → COMPLETED)

11. Photo Delivery
    └─ Upload photos to album linked to event
    └─ Frontend: /gallery → POST /api/v1/gallery/albums, /items
    └─ Create share link for client access
    └─ Client views at /portal/gallery or public share link

12. Completion
    └─ Event status → COMPLETED, Booking status → COMPLETED
    └─ Final invoice settlement
    └─ Gallery published for client download
```

## Authentication Workflow

**FACT:**

```
New User Registration:
  1. User fills form → POST /auth/register
  2. Backend creates User + sends verification email
  3. User clicks email link → POST /auth/verify-email
  4. Account activated → redirect to login

Login (Email/Password):
  1. User submits credentials → POST /auth/login
  2. Backend validates BCrypt hash, checks lockout/2FA
  3. If 2FA enabled: return partial response → user enters TOTP → POST /auth/2fa/verify
  4. Returns: accessToken, refreshToken, user profile, memberships
  5. Frontend: authStore.setAuth() → stores tokens, sets cookies

Login (Google OAuth):
  1. Google sign-in button → Google ID token received
  2. POST /auth/login/google with idToken
  3. Backend verifies with Google, creates/links user
  4. Returns tokens + profile (same as email login)

Workspace Selection:
  1. User with multiple memberships → /workspace-select
  2. User selects workspace → POST /auth/switch with tenantId
  3. New token issued scoped to selected workspace
  4. Frontend: authStore.updateActiveTenant()
  5. Redirect to /dashboard
```

## Client Portal Workflow

**FACT:**

```
Client Access:
  1. Client receives share link (WhatsApp/email) OR has portal account
  2. Logs in with CLIENT role
  3. Middleware enforces /portal/* only access

Portal Features:
  - /portal → Client dashboard (overview of bookings, upcoming events)
  - /portal/quotes → View and approve proposals
  - /portal/invoices → View invoices and payment status
  - /portal/timeline → View event timeline
  - /portal/gallery → View and download event photos
  - /portal/support → Submit support requests
  - /portal/settings → Update personal settings
```

## Billing Workflow

**FACT:**

```
Subscription Management:
  1. On workspace creation → default STARTER plan
  2. User navigates to /settings (billing tab)
  3. Clicks upgrade → POST /auth/billing/subscription/checkout
  4. If Stripe configured: redirects to Stripe Checkout
  5. If direct mode: POST /auth/billing/subscription/upgrade
  6. Webhook: POST /auth/billing/webhook (Stripe events)
  7. Usage tracked per billing period via TenantUsage

Limit Enforcement:
  1. API call increments usage counter
  2. Frontend checkLimit() before create operations
  3. If limit exceeded: 402 response OR client-side modal
  4. LimitExceededModal shows upgrade prompt
```

## Onboarding Workflow

**FACT:**

```
New Workspace:
  1. User creates workspace (during registration or via workspace-select)
  2. Frontend checks localStorage for onboarding status
  3. If not completed → OnboardingWizard modal opens
  4. User completes wizard steps
  5. ProductTourSpotlight highlights key features
  6. CelebrationOverlay on milestone completion
  7. Status stored in localStorage (eventos_onboarding_status)
```

## SuperAdmin Workflow

**FACT:**

```
Platform Administration:
  1. Platform operator navigates to /superadmin/login
  2. Logs in with platform role credentials
  3. Middleware: JWT cryptographically verified + role checked against PLATFORM_ROLES
  4. /superadmin → full platform management (tenants, users, billing, support, audit)
  5. Non-platform users accessing /superadmin → redirected to /dashboard
  6. Platform users accessing /dashboard → redirected to /superadmin
```

Source: `web/src/middleware.ts`, `web/src/store/authStore.ts`, `web/src/lib/api-client.ts`, `web/src/lib/whatsapp.ts`, `web/src/store/billingStore.ts`, backend controller/service files
