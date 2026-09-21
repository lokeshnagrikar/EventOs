# EventOS — Feature Inventory

## IMPLEMENTED

### 1. Multi-Tenant Authentication & Authorization
- **Purpose:** User login, registration, workspace isolation, role-based access
- **Frontend:** `web/src/store/authStore.ts`, `web/src/middleware.ts`, `web/src/components/auth/`
- **Backend:** `auth-service/controller/AuthController.java` (50KB), `auth-service/service/AuthService.java` (102KB)
- **Entities:** User, Tenant, Company, Membership, Session, RefreshToken, Role
- **Login methods:** Email/password, Google OAuth, Magic Link, WhatsApp OTP
- **2FA:** TOTP-based two-factor authentication (`TotpService.java`, `User2Fa` entity)
- **API:** `/api/v1/auth/login`, `/register`, `/refresh`, `/switch`, `/logout`, `/forgot-password`, `/reset-password`, `/verify-email`, `/verify-otp`, `/magic-link`, `/verify-magic-token`, `/send-whatsapp-otp`, `/verify-whatsapp-otp`, `/2fa/verify`
- **Status:** FACT — Fully implemented with token refresh, session management, password history

### 2. Workspace & Team Management
- **Purpose:** Multi-tenant workspaces with team invitations and role management
- **Frontend:** `web/src/app/workspace-select/`, `web/src/app/settings/`
- **Backend:** `auth-service/controller/WorkspaceController.java`, `TeamController.java`, `RoleController.java`
- **Entities:** Tenant, Company, Membership, Invitation, Role
- **API:** Workspace CRUD, team invites, role CRUD with permissions
- **Status:** FACT — Implemented with invite acceptance flow and workspace switching

### 3. CRM — Lead Management
- **Purpose:** Track client inquiries and manage sales pipeline
- **Frontend:** `web/src/app/crm/page.tsx` (56KB), `web/src/components/crm/`
- **Backend:** `crm-service/controller/CrmLeadController.java` (23KB), `crm-service/service/LeadService.java` (39KB)
- **Entities:** Lead, Contact, Activity, AuditLog
- **Statuses:** NEW, CONTACTED, QUALIFIED, PROPOSAL_SENT, WON, LOST
- **Status:** FACT — Full CRUD with pipeline view, lead source tracking, assigned user, activities

### 4. CRM — Contact Management
- **Purpose:** Manage client contacts linked to leads
- **Frontend:** Part of CRM page
- **Backend:** `crm-service/controller/CrmContactController.java`, `crm-service/service/ContactService.java`
- **Entity:** Contact (name, email, phone, company)
- **Status:** FACT — Implemented as part of lead management

### 5. Quoting / Proposals
- **Purpose:** Generate itemized quotes with line items, terms, and shareable links
- **Frontend:** `web/src/app/quotes/`, `web/src/components/quote/`
- **Backend:** `crm-service/controller/QuoteController.java` (19KB), `crm-service/service/QuoteService.java` (34KB)
- **Entities:** Quote (with share_token, revision support), QuoteItem
- **Features:** Sequential numbering (QT-XXXX-v1), revision tracking, PDF generation, share tokens
- **External:** PDF generation via `PdfGenerationService.java` (14KB)
- **Status:** FACT — Full CRUD with revision support, PDF generation, public share links

### 6. Event Management
- **Purpose:** Manage events with multi-day support, venues, guest lists
- **Frontend:** `web/src/app/events/`, `web/src/components/events/`
- **Backend:** `event-service/controller/EventController.java` (25KB), `event-service/service/EventService.java` (38KB)
- **Entities:** Event, EventDay, EventVenue, EventAssignment
- **Types:** WEDDING, CORPORATE, BIRTHDAY, SOCIAL, CONFERENCE, OTHER
- **Statuses:** PLANNING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
- **Status:** FACT — Full CRUD with multi-day, venues, guest management, progress tracking

### 7. Booking Management
- **Purpose:** Convert quotes to bookings, track booking lifecycle
- **Frontend:** `web/src/app/bookings/`, `web/src/components/bookings/`
- **Backend:** `event-service/controller/BookingController.java` (13KB), `event-service/service/BookingService.java` (49KB)
- **Entities:** Booking, BookingAssignment, BookingAuditLog, BookingTimelineEvent, BookingBudget
- **Statuses:** INQUIRY, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
- **Features:** Sequential booking numbers, contract URL tracking, timeline events
- **Cross-service:** Quote accepted → RabbitMQ → creates booking automatically
- **Status:** FACT — Full lifecycle with event-driven creation from CRM

### 8. Invoice Management
- **Purpose:** Generate and track invoices for events/bookings
- **Frontend:** `web/src/app/invoices/`, client portal invoices
- **Backend:** `event-service/controller/InvoiceController.java` (13KB), `event-service/service/InvoiceService.java` (33KB)
- **Entities:** Invoice, InvoiceHistory
- **Features:** Sequential numbering (INV-YYYY-XXXXXX), milestone tracking, PDF generation
- **Status:** FACT — Full CRUD with history, sequential numbering, pessimistic write locks

### 9. Payment Tracking
- **Purpose:** Track payments against invoices and bookings
- **Frontend:** `web/src/app/payments/`, payment components
- **Backend:** `event-service/controller/PaymentController.java` (8KB), `event-service/service/PaymentService.java` (33KB)
- **Entities:** Payment, Transaction
- **Cross-service:** Payment recorded → RabbitMQ → gallery access update
- **Status:** FACT — Full payment tracking with outstanding balance calculation

### 10. Vendor Management
- **Purpose:** Manage event vendors and their contracts
- **Frontend:** Part of event detail views
- **Backend:** `event-service/controller/VendorController.java` (12KB), `event-service/service/VendorService.java` (12KB)
- **Entities:** Vendor, VendorAssignment, VendorContract
- **Categories:** CATERING, DECORATION, PHOTOGRAPHY, MUSIC, VENUE, LIGHTING, TRANSPORT, OTHER
- **Status:** FACT — Implemented with contract tracking and payment status

### 11. Timeline / Run-of-Show
- **Purpose:** Event execution timeline with tasks and ordering
- **Backend:** `event-service/entity/TimelineTask.java`, `event-service/entity/EventTimelineItem.java`, `event-service/service/TimelineService.java`
- **Entities:** TimelineTask, EventTimelineItem
- **Task statuses:** TODO, IN_PROGRESS, COMPLETED
- **Task priorities:** LOW, MEDIUM, HIGH, URGENT
- **Status:** FACT — Backend entities and service exist. Frontend exposure via event detail views

### 12. Gallery / Photo Delivery
- **Purpose:** Upload, organize, and share event photos with clients
- **Frontend:** `web/src/app/gallery/`, `web/src/components/gallery/`
- **Backend:** `gallery-service/controller/AlbumController.java`, `GalleryItemController.java`, `ShareLinkController.java`
- **Entities:** Album, GalleryItem, ShareLink, ShareLinkAccessLog
- **External:** Cloudinary for media storage (`CloudinaryService.java`)
- **Features:** Albums with status/visibility, share links with expiry and access logging, watermark support
- **Status:** FACT — Full implementation with Cloudinary integration and share link access tracking

### 13. Client Portal
- **Purpose:** Client-facing portal for viewing proposals, invoices, galleries, timelines
- **Frontend:** `web/src/app/portal/` (layout 36KB, page 23KB)
- **Backend:** `event-service/controller/ClientPortalController.java` (7KB)
- **Features:** Quote viewing, invoice viewing, gallery access, timeline viewing, support, client settings
- **Status:** FACT — Dedicated layout and pages with role-based routing (CLIENT role only)

### 14. Subscription Billing (Stripe)
- **Purpose:** Platform subscription billing, plan management, usage metering
- **Frontend:** `web/src/store/billingStore.ts`, `web/src/app/settings/`
- **Backend:** `auth-service/controller/BillingController.java` (32KB), `auth-service/service/BillingService.java` (62KB)
- **Entities:** Plan, Subscription, TenantUsage, BillingHistory, Invoice, PaymentMethod
- **Features:** Stripe Checkout, direct upgrade, cancel/pause/reactivate, usage tracking, limit enforcement
- **Status:** FACT — Full billing stack with Stripe integration and plan limit enforcement

### 15. Superadmin Panel
- **Purpose:** Platform-level administration for managing tenants, users, billing
- **Frontend:** `web/src/app/superadmin/page.tsx` (105KB), `/superadmin/login`
- **Backend:** Endpoints in AuthController with platform role guards
- **Roles:** ~20+ platform roles (SUPER_ADMIN, PLATFORM_ADMIN, OPERATIONS_LEAD, etc.)
- **Status:** FACT — Implemented with cryptographic JWT verification in middleware

### 16. WhatsApp Integration
- **Purpose:** Send formatted messages to clients via WhatsApp
- **Frontend:** `web/src/lib/whatsapp.ts`
- **Features:** Template types (PROPOSAL_LINK, INVOICE_RECEIPT, RUN_OF_SHOW_ALERT, LEAD_CONFIRMATION), wa.me deep links, Meta Cloud API dispatch
- **Status:** FACT — Frontend utility library with direct Meta API integration

### 17. AI Assistant
- **Purpose:** In-app AI co-pilot for CRM, quotes, timelines, forecasts, gallery tagging
- **Frontend:** `web/src/components/AiAssistant.tsx` (44KB), `web/src/lib/aiProvider.ts`
- **Features:** Multi-provider abstraction (OpenAI, Claude, Gemini, Azure, Ollama), module-specific responses, activity logging, cost estimation
- **Status:** PARTIALLY IMPLEMENTED — Frontend UI and provider abstraction exist, but responses are **simulated client-side** (800ms delay + hardcoded replies). No real LLM API calls.

### 18. Budget Calculator
- **Purpose:** Public-facing budget estimation tool for event planning
- **Frontend:** `web/src/app/calculator/`, `web/src/app/quote-calculator/`
- **Backend:** `event-service/controller/BudgetCalculatorController.java` (22KB)
- **Entities:** BudgetEstimate, BudgetCategoryAllocation, BudgetAlert, PricingRule
- **Cross-service:** Budget → Lead conversion via RabbitMQ
- **Status:** FACT — Full implementation with backend pricing rules and lead conversion

### 19. Analytics & Tracking
- **Purpose:** Product analytics, user behavior tracking
- **Frontend:** `web/src/lib/analytics.ts` (8KB)
- **Providers:** Google Analytics 4, PostHog, Microsoft Clarity (dynamically loaded)
- **Features:** GDPR consent, Do-Not-Track, batch delivery, offline queue, typed event helpers
- **Status:** FACT — Client-side analytics framework implemented

### 20. Real-time WebSocket Communication
- **Purpose:** Live presence, typing indicators, real-time updates
- **Frontend:** `web/src/context/SocketContext.tsx`
- **Backend:** `auth-service/config/WebSocketConfig.java`
- **Protocol:** STOMP over WebSocket
- **Features:** Auto-reconnect, fallback mode, keep-alive pings
- **Status:** FACT — WebSocket infrastructure exists with graceful fallback

### 21. Onboarding
- **Purpose:** New workspace onboarding wizard
- **Frontend:** `web/src/components/onboarding/`, `web/src/store/onboardingStore.ts`
- **Status:** FACT — OnboardingWizard, ProductTourSpotlight, CelebrationOverlay implemented

### 22. Email Service
- **Purpose:** Transactional emails (verification, password reset, invoices, notifications)
- **Backend:** `auth-service/service/EmailService.java` (36KB)
- **Features:** SMTP-based, HTML templates, configurable sender
- **Status:** FACT — Full email service with MailHog for local development

---

## PARTIALLY IMPLEMENTED

### AI Backend Integration
- Frontend AI provider abstraction exists (`aiProvider.ts`) but all responses are simulated client-side. No backend AI service or LLM API integration exists.

### Automation Module
- Frontend routes exist (`web/src/app/automation/`), components exist (`web/src/components/automation/`), but depth of backend implementation is unclear.

### Chat Module
- Frontend route exists (`web/src/app/chat/`) but no chat service or messaging backend is visible.

### SMS Integration
- Usage tracked in TenantUsage (`smsSent`), referenced in pricing features, but no SMS service implementation found.

---

## PLANNED / REFERENCED

### Run-of-Show Execution UI
- WhatsApp alert template for `RUN_OF_SHOW_ALERT` exists. Timeline tasks/items exist in backend. But no dedicated run-of-show execution dashboard UI found.

### Photo Delivery Workflow
- Gallery share links and access logging exist. But no automated "deliver photos to client" workflow (e.g., trigger email/WhatsApp with gallery link after event).

### Custom Domain / White-Label
- Referenced in pricing (Agency plan). `WorkspaceSettings` entity has `customDomain`, `whiteLabelEnabled`, `customLoginUrl` fields. Backend settings endpoints exist.

### Webhook Integrations
- Referenced in pricing. `Integration` entity exists in event-service. Developer section has API key management.

### Offline PWA
- `PWAProvider.tsx` component exists and is mounted. `OfflineBanner.tsx` exists. `offlineStore.ts` for offline data caching exists.

---

## UNKNOWN

- Depth of superadmin panel functionality beyond the single page
- Whether all vendor contract features are fully connected in the frontend
- Whether the budget calculator → lead conversion pipeline is fully tested end-to-end
- Whether Stripe webhook handling is fully tested in production
