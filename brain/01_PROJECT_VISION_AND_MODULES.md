# 🎯 EventOS — Product Vision & Core Modules

> **Comprehensive breakdown of what EventOS is, who it is for, and how the end-to-end event lifecycle flows through each module.**

---

## 1. Problem Statement & Market Opportunity

Event management agencies, wedding planners, corporate exhibition organizers, and professional photo studios traditionally struggle with a fragmented "Frankenstein" software stack:
* Lead capture in spreadsheets or WhatsApp
* Proposals in Canva or Google Slides
* Project tasks in Trello or Asana
* Billing in QuickBooks or Razorpay payment links
* Media delivery via WeTransfer or Google Drive links

**The Consequence**: Fragmented communication, lost client follow-ups, delayed payments, double-booked venues, and disjointed client experiences.

**The EventOS Solution**: EventOS unifies the **entire lifecycle** into a single, multi-tenant, white-labeled B2B platform with real-time sync, automated workflows, and an ultra-premium visual aesthetic.

---

## 2. Core User Personas & Roles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             ROLE HIERARCHY                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. ROLE_SUPERADMIN   ── Platform Owner (Full system access, cross-tenant)  │
│  2. ROLE_OWNER        ── Agency / Company Founder (Billing, all workspaces) │
│  3. ROLE_ADMIN        ── Senior Event Director (Full event & team control)  │
│  4. ROLE_STAFF        ── Event Coordinator / Producer (Assigned events)     │
│  5. ROLE_VENDOR       ── External Caterer, DJ, Decorator (Limited portal)   │
│  6. ROLE_CLIENT       ── End-Customer (Quote accept, invoices, gallery)     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Persona Definitions
1. **Superadmin (`ROLE_SUPERADMIN`)**:
   - Oversees all tenants, platform MRR, system health, database migrations, and tenant isolation policies.
   - Access to `/superadmin` monitoring dashboard and emergency audit plane.
2. **Tenant Owner (`ROLE_OWNER`)**:
   - Creates agency workspaces, configures agency branding, connects payment gateways, and manages team seats.
3. **Event Manager / Planner (`ROLE_ADMIN` / `ROLE_STAFF`)**:
   - Manages leads, crafts dynamic budget estimates, sets up run-of-show cue sheets, and assigns vendor tasks.
4. **Client / Event Host (`ROLE_CLIENT`)**:
   - Accesses the client portal (`/portal`), reviews quotes, signs proposals, tracks budget allocations, makes milestone payments, and favorites gallery photos.
5. **Vendor / Sub-contractor (`ROLE_VENDOR`)**:
   - Views timeline call-sheets, gear load-in times, venue coordinates, and payment statuses.

---

## 3. The Complete Event Lifecycle

The platform is designed around 6 connected stages:

```
[ 1. Inbound Lead ] ──► [ 2. Proposal & Quote ] ──► [ 3. Contract & Payment ]
         │                        │                            │
         ▼                        ▼                            ▼
  Lead Ingest (CRM)         Interactive Quote            Stripe / Razorpay
  Status tracking           PDF Generation               Milestone Invoicing
         │                        │                            │
         ▼                        ▼                            ▼
[ 4. Event Operations ] ◄── [ 5. Client Portal ]  ──► [ 6. Gallery Delivery ]
         │                        │                            │
         ▼                        ▼                            ▼
  Run-of-Show Cues          Guest RSVP & Budget          Cloudinary CDN Proofing
  Vendor Logistics          Milestone Approvals          PIN-Protected Download
```

---

## 4. Detailed Module Breakdown

### 4.1 CRM & Lead Management Pipeline (`crm-service`)
* **Lead Ingestion**: Web forms, manual intake, and API webhook capture.
* **Kanban Stages**: `NEW` $\rightarrow$ `CONTACTED` $\rightarrow$ `QUALIFIED` $\rightarrow$ `PROPOSAL_SENT` $\rightarrow$ `WON` $\rightarrow$ `LOST`.
* **Activity History**: Call notes, email interactions, client budget limits, and lead scoring.
* **Lead Conversion**: Automatically triggers workspace provisioning and event creation when marked `WON`.

### 4.2 Dynamic Quotes & Interactive Proposals (`crm-service` & `web`)
* **Itemized Line Items**: Categorized into Production, Catering, Venue, Entertainment, Photography, and Decor.
* **Tax & Margin Calculation**: Dynamic markup rates, GST/VAT tax percentage handling, discounts, and milestone payment schedules.
* **Real-time Client Acceptance**: Clients can accept proposals with single-click digital signatures.
* **Live Quote Calculator**: Public & internal interactive cost estimator with instant PDF export.

### 4.3 Event Operations, Run-of-Show & Timelines (`event-service`)
* **Itinerary / Run-of-Show**: Minute-by-minute cue sheets (e.g., "18:00 Guest Arrival", "18:45 Bride Entrance", "19:30 First Dance").
* **Vendor Assignments**: Tagging specific vendors (e.g., Sound, Lighting, Flowers) to cue items with real-time status alerts.
* **Logistics & Floorplans**: Venue specifications, stage dimensions, load-in deadlines, and contact directories.

### 4.4 Financial Engine & Milestone Billing (`event-service` & `auth-service`)
* **Milestone Invoicing**: Split contracts into deposit, mid-way, and final delivery milestones (e.g., 30% advance, 50% week before, 20% on delivery).
* **Payment Tracking**: Record manual bank wire payments or process online credit cards via Stripe.
* **Tax Invoice Generation**: Automated PDF generation with agency branding, tax identification numbers, and payment breakdown.

### 4.5 Media Proofing & Photo Delivery (`gallery-service`)
* **Collection Hierarchy**: Events contain Albums (e.g., "Haldi", "Reception", "Portraits").
* **Smart Watermarking**: Automated Cloudinary overlay transformations for unreleased/unpaid photos.
* **Client Selection / Favoriting**: Clients can heart their favorite images for album printing.
* **PIN Protection & Downloads**: High-resolution zip exports locked behind secret PIN and payment clearance.

### 4.6 Real-Time Collaboration & Notification Engine
* **WebSocket Presence**: Live user avatars showing who is viewing the quote or event.
* **Instant Notifications**: Toast notifications and transactional emails dispatched on key actions (quote accepted, invoice paid, comment added).
