# 🏆 EventOS Business Suite — Master Project Report & Technical Blueprint

> **System Version:** v1.1.0-prod  
> **Repository:** `d:\EventOs`  
> **Target Market:** Indian & Global Event Planners, Luxury Wedding Agencies, Decor Scenographers, Sound/Stage Production Houses & Corporate Event Firms.

---

## Executive Summary

**EventOS** is an all-in-one, multi-tenant AI operating system engineered specifically for event planners, wedding coordinators, and production agencies. It replaces fragmented tools (WhatsApp groups, Excel sheets, manual PDFs, legacy bank transfers) with a single, high-velocity platform covering the entire lifecycle: **Lead Ingress ➔ Interactive Proposal ➔ E-Signature ➔ Direct UPI Settlement ➔ AI Run-of-Show ➔ 4K Media Delivery**.

---

## 🏛️ 1. Core System Architecture & Tech Stack

```
                               ┌────────────────────────────────────────┐
                               │           Next.js 15 Web Client        │
                               │  (React 19, TypeScript, Tailwind CSS)  │
                               └──────────────────┬─────────────────────┘
                                                  │
                                       REST / JSON API (JWT + Tenant ID)
                                                  │
                ┌─────────────────────────────────┼─────────────────────────────────┐
                ▼                                 ▼                                 ▼
   ┌──────────────────────────┐     ┌──────────────────────────┐      ┌──────────────────────────┐
   │       auth-service       │     │       crm-service        │      │      event-service       │
   │  (Spring Boot 3.2 Java)  │     │  (Spring Boot 3.2 Java)  │      │  (Spring Boot 3.2 Java)  │
   │   • Authentication       │     │   • Lead Pipeline Kanban │      │   • Event Timelines      │
   │   • Multi-Tenant Isolation│     │   • Proposal Quotations  │      │   • Milestone Invoicing  │
   │   • SaaS Billing (Stripe)│     │   • Client Directory     │      │   • 0% Fee UPI QR Engine │
   └────────────┬─────────────┘     └────────────┬─────────────┘      └────────────┬─────────────┘
                │                                │                                 │
                └────────────────────────────────┼─────────────────────────────────┘
                                                 │
                               ┌─────────────────┴─────────────────┐
                               │  PostgreSQL Database & Redis Cache │
                               └───────────────────────────────────┘
```

### 🛠️ Technology Stack Breakdown:

| Layer | Technologies Used | Key Characteristics |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 15 (App Router)** & **React 19** | Server-Side Rendering (SSR), Static Generation, Dynamic Code-Splitting |
| **Styling & Design System** | **Tailwind CSS**, Vanilla CSS Variables, Glassmorphism | Custom design tokens (`#09090B`, `#141419`, `#18181c`, `#F8FAFC`), Ambient Cursor Glow |
| **Animation & Physics** | **Framer Motion**, **GSAP**, **Lenis Smooth Scroll** | Fluid micro-interactions, spring physics, scroll inertia |
| **State Management** | **Zustand**, React Query (`@tanstack/react-query`) | Global auth, billing, celebration, onboarding, and toast stores |
| **Icons & Vector Arts** | **Iconify**, Lucide-React, Custom Vector SVGs | Hand-crafted SVG empty states, reactor loaders, compass/shield illustrations |
| **Backend Microservices** | **Java 17 / Spring Boot 3.2**, Spring Security, Spring Data JPA | Multi-tenant schema isolation, REST APIs, JWT Bearer Token verification |
| **Database & Cache** | **PostgreSQL**, **Redis**, Docker Compose | Relational persistence, session caching, query performance optimization |

---

## 💳 2. Dual Payment Engine Architecture

EventOS implements a clean separation between **Platform SaaS Subscriptions** and **Agency Client Milestone Collection**:

```
                       ┌──────────────────────────────────────────────────┐
                       │           EVENTOS DUAL PAYMENT SYSTEM            │
                       └────────────────────────┬─────────────────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
  ┌──────────────────────────────┐                              ┌──────────────────────────────┐
  │   LAYER 1: SAAS SUBSCRIPTION │                              │  LAYER 2: CLIENT MILESTONE   │
  │   (Platform Subscription)    │                              │  (Direct Owner Collection)   │
  ├──────────────────────────────┤                              ├──────────────────────────────┤
  │ • Starter:      ₹1,999 / mo  │                              │ • Direct Owner UPI VPA       │
  │ • Professional: ₹5,999 / mo  │                              │   (e.g., owner@upi)          │
  │ • Enterprise:  ₹11,999 / mo  │                              │ • Scannable NPCI UPI QR      │
  │ • Handled via Stripe / Auth  │                              │ • Bank Account & IFSC Code   │
  │   Controller                 │                              │ • Configurable Fee Matrix    │
  └──────────────────────────────┘                              └──────────────────────────────┘
```

### Layer 1: Platform SaaS Subscription Pricing
- **Starter Plan (₹1,999 / month):** 5 Active Events, 2 Team Seats, 20 GB Cloud Storage, Milestone payments, Client contracts.
- **Professional Plan (₹5,999 / month - Most Popular):** 20 Active Events, 5 Team Seats, 100 GB Storage, EventOS AI Operations Co-Pilot, Interactive quotes.
- **Enterprise Plan (₹11,999 / month):** Unlimited Events & Seats, 500 GB+ AWS Storage, Custom White-labeled Domains, Developer API & Webhooks.

### Layer 2: Client Milestone Payments & Enterprise Payment Engine
- Agency owners enter their business **UPI VPA ID (`owner@upi`)**, **Bank Name**, **Account Holder Name**, **Account Number**, and **IFSC Code** in [settings/page.tsx](file:///d:/EventOs/web/src/app/settings/page.tsx).
- EventOS dynamically compiles this into live scannable **NPCI UPI Deep-Links & QR Codes (`upi://pay?pa={ownerUpiId}&pn={ownerName}&am={amount}...`)** via [DynamicUpiQrModal.tsx](file:///d:/EventOs/web/src/components/finance/DynamicUpiQrModal.tsx).
- **Configurable Monetization Matrix:** Supports **No Platform Fee (Default)**, **Fixed Fee (e.g. ₹99)**, **Percentage Fee (e.g. 2%)**, and **Enterprise Custom Fee Rules** with automated settlement.

---

## 📑 3. Public Proposal Sharing & E-Signature Engine

- **No-Login Public Link Generator:** Agency owners copy shareable proposal URLs (`/quotes/share/${quoteId}`) from [quotes/[id]/page.tsx](file:///d:/EventOs/web/src/app/quotes/%5Bid%5D/page.tsx).
- **Client E-Signing Portal ([quotes/share/[token]/page.tsx](file:///d:/EventOs/web/src/app/quotes/share/%5Btoken%5D/page.tsx)):**
  - Clients open the link on mobile or desktop without creating an account.
  - Review itemized cost breakdown, terms & conditions, and e-sign digitally on canvas.
  - Pay advance deposit instantly via GPay/PhonePe UPI QR code.

---

## 📲 4. WhatsApp Meta Cloud API Configuration Panel

- Integrated directly in Workspace Settings ([WhatsAppApiSettings.tsx](file:///d:/EventOs/web/src/components/settings/WhatsAppApiSettings.tsx)).
- **Supported Providers:** Meta Cloud API (Official Direct), Interakt, AiSensy, Twilio WhatsApp.
- **Key Credentials Configured:** `Phone Number ID`, `WhatsApp Business Account ID (WBAID)`, `Meta System User Access Token`, `Template Namespace`, `Webhook Callback URL`.
- **1-Click Connection Test:** Pings Meta Graph API (`v20.0`) and confirms live green-tick status.
- **Automated Message Triggers:**
  - 📱 *Instant Lead Booking Ack* (`lead_inquiry_ack_v1`)
  - 📄 *Interactive Proposal & Quote Link* (`proposal_quote_share_v2`)
  - 💳 *Milestone Deposit & UPI Receipt* (`payment_receipt_upi_v1`)
  - 🎪 *Run of Show Vendor Slot Alert* (`vendor_slot_alert_v1`)

---

## 🌐 5. Complete Page & Route Inventory

| Page Route | Purpose & Implementation Details | Status |
| :--- | :--- | :--- |
| **`/`** | Landing Page with GSAP, Hero, Bento Grid, Animated Beams, Lenis Smooth Scroll | ✅ **100% Complete** |
| **`/pricing`** | Official Pricing Page with ₹1,999, ₹5,999, ₹11,999 Tiers & Annual Discount Switcher | ✅ **100% Complete** |
| **`/status`** | System Status Page with Live Microservice Health, Latency Metrics & 99.9% SLA Tracking | ✅ **100% Complete** |
| **`/about`** | About Us Company Page | ✅ **100% Complete** |
| **`/contact`** | Contact Us Sales & Support Page with Inbound Request Form | ✅ **100% Complete** |
| **`/security`** | Platform Security & Tenant Isolation Documentation | ✅ **100% Complete** |
| **`/resources`** | Templates Center & Agency Resource Library | ✅ **100% Complete** |
| **`/privacy`** | Official Privacy Policy Page | ✅ **100% Complete** |
| **`/terms`** | Official Terms of Service Agreement Page | ✅ **100% Complete** |
| **`/refund`** | Official Refund & Cancellation Policy Page | ✅ **100% Complete** |
| **`/cookies`** | Official Cookie Policy Page | ✅ **100% Complete** |
| **`/sla`** | Official Tenant SLA & Uptime Guarantee | ✅ **100% Complete** |
| **`/quotes/share/[token]`** | Public No-Login Quote Proposal Viewing, E-Signing & Payment Page | ✅ **100% Complete** |
| **`/settings`** | Workspace Settings with Company Profile, Direct UPI Credentials & Meta WhatsApp API | ✅ **100% Complete** |
| **`/not-found`** | Custom Vector 404 Error Page with SVG Compass Illustration | ✅ **100% Complete** |
| **`/error`** | Custom Vector Global Error Boundary Page with SVG Shield Illustration | ✅ **100% Complete** |

---

## 🎨 6. Vector Micro-Graphics & Vibe Upgrades

1. **Vector SVG Empty States ([EmptyState.tsx](file:///d:/EventOs/web/src/components/ui/EmptyState.tsx)):** Hand-crafted vector illustrations for empty leads, quotes, events, gallery, and invoice states.
2. **Celebration Overlay ([CelebrationOverlay.tsx](file:///d:/EventOs/web/src/components/onboarding/CelebrationOverlay.tsx)):** Milestone badges (`first_payment`, `first_quote`, `first_booking`) with particle physics.
3. **Reactor Processing Loader ([ProcessingLoader.tsx](file:///d:/EventOs/web/src/components/ui/ProcessingLoader.tsx)):** Animated SVG reactor spinner for long-running async tasks.
4. **Run-of-Show Timeline Engine ([RunOfShowSimulator.tsx](file:///d:/EventOs/web/src/components/landing/RunOfShowSimulator.tsx)):** Live AI conflict resolution physics for Indian event slots.
5. **WhatsApp Client Card ([ClientPortalPreview.tsx](file:///d:/EventOs/web/src/components/landing/ClientPortalPreview.tsx)):** Interactive client message thread with live GPay UPI deposit receipt dispatch.
6. **Agency Yield Calculator ([RoiCalculator.tsx](file:///d:/EventOs/web/src/components/landing/RoiCalculator.tsx)):** Interactive INR slider calculator with Indian agency presets.
7. **3D Media Delivery Reel ([ProductShowcase.tsx](file:///d:/EventOs/web/src/components/landing/ProductShowcase.tsx)):** Passcode-protected photo album with 1-click ZIP compression simulator.
8. **Ambient Cursor Glow ([AmbientCursorGlow.tsx](file:///d:/EventOs/web/src/components/ui/AmbientCursorGlow.tsx)):** Smooth radial light aura tracking mouse cursor across the page.

---

## 🎯 7. GTM Execution & Outreach Assets

- **100 Lead Master Tracker ([EventOS_100_Leads_Master_Tracker.csv](file:///d:/EventOs/docs/EventOS_100_Leads_Master_Tracker.csv)):** Curated dataset of 100 high-value event planners, wedding agencies, decor firms, and production houses across **Nagpur, Pune, Mumbai, Nashik, Hyderabad, Bangalore, Jaipur, Indore, and Delhi**.
- **Cold Outreach Playbook ([EventOS_100_Leads_Outreach_Blueprint.md](file:///d:/EventOs/docs/EventOS_100_Leads_Outreach_Blueprint.md)):** High-converting WhatsApp pitch scripts, 30-second cold calling scripts with objection handling, cold email templates, and a daily 20-call execution workflow.
