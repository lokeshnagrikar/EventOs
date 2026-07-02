# EventOS: Complete System Architecture, Guide & Technical Report

This document is a comprehensive, end-to-end technical guide for the **EventOS** system. It details the system architecture, directory structures, backend microservices, database schemas, APIs, frontend state management, security configurations, and all fixes applied to date. 

Paste this file into ChatGPT to provide a complete context of the codebase for generating plans, database migrations, or new features.

---

## 🏢 1. System Overview & Product Concept
**EventOS** is an enterprise-grade Software-as-a-Service (SaaS) platform built for event planning companies, wedding planners, and corporate venue managers. The system enables businesses (tenants) to manage their entire lifecycle:
* **CRM & Leads:** Gather customer inquiries, estimate event costs, and convert leads.
* **Quotes & Proposals:** Send itemized pricing proposals to clients and generate print-ready invoice outlines.
* **Event Logistics & Bookings:** Coordinate schedules, assign staff coordinators, and monitor calendar event states.
* **Invoices & Payments:** Record installment payments, track invoice histories, and trigger payment reminders.
* **Client Portal:** Provide clients a direct space to check booked events, read proposals, and view invoices.

---

## 🗺️ 2. Architectural Structure

EventOS uses a decoupled **Microservices Backend** (Spring Boot, Java, PostgreSQL) and a **Single Page Application Frontend** (Next.js, TypeScript, Tailwind CSS).

### 2.1 Services Network Map

All frontend Axios requests target the **API Gateway** on port `8080` under `/api/v1`. The gateway acts as a reverse proxy, rewriting paths and routing requests to appropriate backend services:

```
                            ┌───────────────────────────┐
                            │    Next.js Client app     │
                            │        (Port 3000)        │
                            └─────────────┬─────────────┘
                                          │ Axios HTTP (apiClient)
                                          ▼
                            ┌───────────────────────────┐
                            │   API Gateway (:8080)     │
                            └─────────────┬─────────────┘
                                          │
         ┌────────────────────────┬───────┴──────────────┬────────────────────────┐
         │ /api/v1/auth           │ /api/v1/crm          │ /api/v1/events         │ /api/v1/bookings
         ▼                        ▼                      ▼                        ▼ (rewritten to events)
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   auth-service   │    │   crm-service    │    │  event-service   │    │  event-service   │
│   (Port 8081)    │    │   (Port 8083)    │    │   (Port 8082)    │    │   (Port 8082)    │
└──────────────────┘    └──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## 📂 3. Repository Directory Structure

```
EventOs/
├── backend/
│   ├── gateway/                  # Spring Cloud Gateway (port 8080)
│   ├── auth-service/             # Port 8081 - Tenant registration, users, company & team management
│   ├── event-service/            # Port 8082 - Calendar, bookings, invoicing, calculator, payments
│   └── crm-service/              # Port 8083 - Leads, proposals, CRM dashboard metrics
├── web/                          # Next.js Frontend (port 3000)
│   ├── public/                   # Static assets & images
│   └── src/
│       ├── app/                  # Next.js App Router (Layouts & Pages)
│       │   ├── (auth)/           # Route Group: login, register, forgot/reset password
│       │   ├── crm/              # Leads management
│       │   ├── quotes/           # Proposals & Quote views (new, [id])
│       │   ├── events/           # Calendar & Event details ([id])
│       │   ├── bookings/         # Confirmed bookings
│       │   ├── payments/         # Payment receipts tracker
│       │   ├── invoices/         # Billing & Invoices
│       │   ├── calculator/       # Budget estimation tools
│       │   └── settings/         # Company branding & team settings
│       ├── components/           # Reusable UI widgets & Forms
│       │   ├── auth/             # LoginForm, RegisterForm, AuthModal
│       │   └── ui/               # Core design elements (buttons, inputs, cards)
│       ├── lib/                  # Utilities (Axios client, Toast notifications)
│       └── store/                # Zustand client state (authStore, authModalStore)
```

---

## 💾 4. Database Entities & Relationships

Each microservice communicates with a multi-tenant PostgreSQL database. Separation is enforced logically using a `tenant_id` UUID column.

```
                  ┌──────────────┐
                  │    Tenant    │
                  └──────┬───────┘
                         │ 1
        ┌────────────────┼──────────────────────────────┐
        │ 1..*           │ 1..*                         │ 1..*
┌───────▼──────┐  ┌──────▼──────┐                ┌──────▼──────┐
│     User     │  │    Lead     │                │    Event    │
└──────────────┘  └──────┬──────┘                └──────┬──────┘
                         │ 1                            │ 1
                         ▼ 0..1                         ▼ 1
                  ┌──────────────┐               ┌──────▼──────┐
                  │    Quote     │               │   Booking   │
                  └──────┬───────┘               └──────┬──────┘
                         │ 1                            │ 1
                         ▼ 1..*                         ▼ 1..*
                  ┌──────────────┐               ┌──────▼──────┐
                  │  QuoteItem   │               │   Invoice   │
                  └──────────────┘               └──────┬──────┘
                                                        │ 1
                                                        ▼ 1..*
                                                 ┌──────────────┐
                                                 │   Payment    │
                                                 └──────────────┘
```

### 4.1 Key Tables Description
1. **Tenant:** Stores workspace profile (Company Name, Branding Colors, Logo URL, Address).
2. **User:** User credentials, password hashes, contact details, and role permissions.
3. **Lead:** Contains client contact properties nested in `Contact` structures, inquiry budget values, event type, and pipeline state (`NEW, QUALIFIED, PROPOSAL_SENT, NEGOTIATION, WON, LOST`).
4. **Quote:** Itemized pricing proposal linked to a `Lead`. Includes subtotals, tax ratios, and status (`DRAFT, SENT, ACCEPTED, REJECTED`).
5. **Event:** Event logistics schedules (Title, Venue, Date, Status: `PLANNING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED`).
6. **Booking:** Represents a confirmed event with payment milestones.
7. **Invoice:** Invoicing logs generated for Bookings, listing amount due, tax, and status (`DRAFT, SENT, PARTIALLY_PAID, PAID, OVERDUE, VOID`).
8. **Payment:** Transactions logged against invoices (Amount, Method: `CREDIT_CARD, BANK_TRANSFER, CASH, UPI`, Date).
9. **BudgetEstimate / PricingRule:** Pricing calculation sheets based on guest count, decor style, venue rental, and catering tiers.

---

## 🔒 5. Authentication, Roles & Security Flow

EventOS uses standard JSON Web Tokens (JWT) to secure endpoints.

1. **Authentication Token Generation:**
   * User enters credentials on the frontend `/login` page.
   * Auth Service processes the credentials, checks reCAPTCHA, and returns a short-lived `accessToken` along with lightweight metadata (Role, Tenant ID, Name).
   * A HTTP-Only `refreshToken` cookie is set on the gateway response to handle transparent token rotations.
2. **Endpoint Pre-Authorizations:**
   Spring Security intercepts service requests and decodes the JWT claims. Roles restrict controller methods using `@PreAuthorize`:
   * `OWNER` / `ADMIN`: Complete system configurations (delete workspaces, change billing, view full accounting reports).
   * `MANAGER`: Operational privileges (create events, edit quotes, issue invoices).
   * `STAFF`: Coordinator access (read calendar events, update coordinator notes, log payments).
   * `CLIENT`: Restrictive access to their portal (/portal) showing only personal bookings, quotes, and payment history.

---

## 🔌 6. Core REST API Catalog

The backend services expose the following controllers routed through Gateway:

### 6.1 Authentication (`auth-service`)
* `POST /api/v1/auth/register` $\rightarrow$ Registers owner user and builds a new tenant database profile.
* `POST /api/v1/auth/login` $\rightarrow$ Authenticates email/password, issues JWT tokens.
* `GET /api/v1/auth/captcha` $\rightarrow$ Fetches standard CAPTCHA verification codes.
* `GET /api/v1/auth/settings/company` $\rightarrow$ Returns company profile.
* `GET /api/v1/auth/settings/team` $\rightarrow$ Lists all team staff members in the current workspace.

### 6.2 CRM & Quotes (`crm-service`)
* `GET /api/v1/crm/leads` $\rightarrow$ Returns list of leads.
* `POST /api/v1/crm/leads` $\rightarrow$ Registers new inquiry leads.
* `GET /api/v1/crm/leads/stats` $\rightarrow$ CRM pipeline KPI summary values.
* `GET /api/v1/crm/quotes` $\rightarrow$ Lists generated proposals.
* `POST /api/v1/crm/quotes` $\rightarrow$ Creates a new Quote matching items.

### 6.3 Scheduling, Billing & Calculator (`event-service`)
* `GET /api/v1/events` $\rightarrow$ Returns events list for calendar queries.
* `GET /api/v1/events/bookings` $\rightarrow$ Returns active bookings list.
* `GET /api/v1/events/invoices` $\rightarrow$ Invoices list.
* `POST /api/v1/events/payments` $\rightarrow$ Logs transaction payments against an invoice.
* `GET /api/v1/events/calculator` $\rightarrow$ Returns saved estimates.
* `POST /api/v1/events/calculator/{id}/convert-to-lead` $\rightarrow$ Promotes a price estimate to a CRM Lead.

---

## 🛠️ 7. Full History of Applied Technical Fixes

The following key repairs have been successfully completed:

### 7.1 Type Mapping Sync: Client Details in CRM/Quotes
* **Problem:** Backend returns lead data with customer email/phone inside a nested `contact` object (`Contact.java`), but the React code parsed them as flat root properties, producing TypeScript compilation failures.
* **Fix:** Updated the `Lead` model interfaces in `/web/src/app/crm/page.tsx` and quotes page configurations to nest details under `contact?: { email?: string; phone?: string; }`. Adjusted display views to render nested values.

### 7.2 Event Calendar Status Alignment
* **Problem:** Calendars were crashing because the UI filter selection `PLANNED` did not match the backend enum structure. The JPA layer rejected the filter with a `400 Bad Request` validation error.
* **Fix:** Re-aligned all frontend UI filters in `/events/page.tsx` and `/events/[id]/page.tsx` to query using the database-mapped status value `PLANNING`.

### 7.3 Dynamic Staff Allocation
* **Problem:** The team assignment panel on the event detail view used a text box. Submitting the assignment failed because it passed an empty `selectedUserId` UUID parameter.
* **Fix:** Implemented dynamic list querying from `/auth/settings/team` and changed the input to a dropdown `<select>` element. Staff coordinators are now assigned using valid database user IDs.

### 7.4 Glassmorphic & Compact Authentication Redesign
* **Problem:** Login and Register cards required scrolling and lacked modern visual styles.
* **Fix:**
  * Redesigned Login and Register screens using a glassmorphic card layout, rotating brand badges, and animated `Sparkles` icons.
  * Added a dynamic progress wizard bubble chain showing current registration status.
  * Compacted layout width (`max-w-[380px]`) and scaled down paddings (`py-1.5`) to keep the cards fully visible without scrolling.
