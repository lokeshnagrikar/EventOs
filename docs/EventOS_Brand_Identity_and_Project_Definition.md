# 🎨 EventOS — Brand Identity & Project Definition Master Specification

> **Document Type:** Brand Strategy, Visual Identity Guidelines & Project Definition Brief  
> **Target Audience:** Executive Team, Product Designers, Frontend Leads, Investors & Marketing Partners  
> **Brand Identity Status:** Production Finalized (v1.0)  

---

## 1. BRAND IDENTITY — 3 PREMIUM LOGO CONCEPTS

To position EventOS alongside B2B SaaS pioneers like **Stripe**, **Linear**, **Notion**, **Figma**, and **Framer**, we avoid generic calendar grids, party balloons, or champagne flutes. Instead, EventOS's visual identity expresses **precision workflow**, **multi-tenant coordination**, **financial velocity**, and **architectural elegance**.

---

### 🎨 Concept A: "The Orbital Convergence" (Default Brand Standard)

```
                       ┌───────────────────────────────┐
                       │     (  ○ ─── ◈ ─── ○  )       │
                       │     (   ╲   ╱   ╲   ╱  )      │
                       │     (     ◈ ─── ◈      )      │
                       └───────────────┬───────────────┘
                                       │
                         EventOS Enterprise Monogram
```

- **Design Philosophy:** Inspired by particle physics, stage choreography, and orbital mechanics. It represents multiple moving parts (vendors, brides, venue coordinators, sound crews) aligning into perfect harmony.
- **Symbol Meaning:** Three interlocking mathematical arcs forming an orbital node. The central intersection creates a radiant spark symbol—representing AI intelligence and fault-tolerant event execution.
- **Brand Personality:** Intelligent, Precision-Engineered, Premium, Dependable, High-Velocity.
- **Typography Recommendation:** **Outfit** (Heading Display, Bold, Tight tracking `-0.03em`) + **Inter** (Body text).
- **Primary Color Palette:**
  - `EventOS Purple (Primary)`: `#A855F7` (RGB: 168, 85, 247)
  - `Cosmic Violet`: `#7C3AED` (RGB: 124, 58, 237)
  - `Electric Cyan`: `#06B6D4` (RGB: 6, 182, 212)
- **Secondary Colors:**
  - `Starlight Rose`: `#EC4899`
  - `Emerald Settlement`: `#10B981`
  - `Obsidian Charcoal`: `#09090B`
- **Variants:**
  - **Light Mode Version:** Dark Slate Monogram (`#0F172A`) with Gradient Purple Spark on Crisp White (`#FFFFFF`).
  - **Dark Mode Version:** Gradient Violet-to-Cyan Monogram on Deep Charcoal (`#09090B`).
  - **Monochrome Version:** Solid Monochrome Black (`#000000`) or Solid White (`#FFFFFF`).
  - **Icon-Only Version:** 32x32px Orbital Node Symbol within rounded super-ellipse container (`rounded-[10px]`).
  - **App Icon Concept:** Metallic gradient node set against a frosted glass dark background (`backdrop-blur-2xl bg-zinc-950/90`).
  - **Favicon Concept:** High-contrast 16x16px vector SVG spark (`#A855F7`).

---

### 💎 Concept B: "The Prism Coordinate"

- **Design Philosophy:** Inspired by architectural blueprints, scenography CAD drawings, and gemstone geometry.
- **Symbol Meaning:** A faceted 3D diamond prism constructed from thin vector coordinate lines. Each facet represents one core module of EventOS (CRM, Quotation, Direct UPI Payment, Run-of-Show, 4K Media Delivery).
- **Brand Personality:** Architectonic, Structured, Luxurious, Enterprise-Grade, Trustworthy.
- **Typography Recommendation:** **Plus Jakarta Sans** (Semi-Bold) or **Outfit** (Extra-Bold).
- **Primary Color Palette:**
  - `Royal Indigo`: `#4F46E5`
  - `Prism Magenta`: `#D946EF`
  - `Titanium Slate`: `#1E293B`
- **Variants:**
  - **Light Mode Version:** High-contrast Indigo coordinate lines on Soft Slate (`#F8FAFC`).
  - **Dark Mode Version:** Glowing Neon Magenta & Indigo wireframe on Midnight Black (`#030712`).
  - **Monochrome Version:** High-density 1px stroke vector outline.

---

### ⚡ Concept C: "The Dynamic Chevron Spark"

- **Design Philosophy:** High-velocity workflow momentum. Inspired by terminal CLI symbols, timeline playheads, and vector chevrons.
- **Symbol Meaning:** Two forward-facing chevrons overlapping to form an internal lightning spark. Communicates speed, automation, and real-time synchronization.
- **Brand Personality:** Energetic, Direct, Modern, Hyper-Efficient, Developer-Friendly.
- **Typography Recommendation:** **Space Grotesk** or **JetBrains Mono** (Semi-Bold).
- **Primary Color Palette:**
  - `Laser Amber`: `#F59E0B`
  - `Hyper Purple`: `#9333EA`
  - `Pure White`: `#FFFFFF`
- **Variants:**
  - **Light Mode Version:** Deep Charcoal Chevrons with Amber Spark on Off-White.
  - **Dark Mode Version:** Laser Amber Chevrons glowing against Dark Zinc (`#09090B`).

---

## 2. LOGO EXPORT SPECIFICATION & GRID SYSTEM

To ensure pixel-perfect rendering across browser favicons, native iOS/Android app icons, high-DPI Retina displays, and billboard print media:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LOGOMETRIC GRID SYSTEM                          │
├────────────────────────────────────────────────────────────────────────┤
│                           ▲ 1.5x X-Height                              │
│                ┌──────────┼──────────┐                                 │
│    1.5x X ◄────┤   [ LOGO MONOGRAM ] ├────► 1.5x X-Height              │
│                └──────────┼──────────┘                                 │
│                           ▼ 1.5x X-Height                              │
└────────────────────────────────────────────────────────────────────────┘
```

### Export Format Matrix:

| Format / Purpose | Target Resolution | Color Space | File Type | Application Site |
| :--- | :--- | :--- | :--- | :--- |
| **Scalable Vector** | Unlimited | sRGB / Display P3 | `.svg` | Web Headers, App Navigation, PDFs |
| **Print Master** | Vector | CMYK | `.pdf` / `.ai` | Contracts, Letterheads, Event Banners |
| **High-Res Master** | 1024 x 1024 px | sRGB | Transparent `.png` | App Stores, Press Kits, Keynotes |
| **Medium Display** | 512 x 512 px | sRGB | `.png` / `.webp` | Web App Profile Avatars, Social Headers |
| **Standard Tile** | 256 x 256 px | sRGB | `.png` | Desktop Shortcuts, Widget Tiles |
| **Small UI Badge** | 128 x 128 px | sRGB | `.png` | Email Headers, WhatsApp Bot Avatars |
| **Favicon HD** | 64 x 64 px | sRGB | `.png` | High-DPI Browser Tabs |
| **Favicon Standard**| 32 x 32 px | sRGB | `.ico` / `.png` | Standard Browser Tab Icons |
| **Micro Favicon** | 16 x 16 px | sRGB | `.ico` | Legacy Browser & Bookmark Bar |

### Grid System & Safe Area Constraints:
- **Minimum Safe Area (Clear Space):** `1.5x` where `X` equals the height of the letter "E" in the EventOS logotype. No text, secondary logos, or UI elements may intrude into this perimeter.
- **Minimum Display Size (Digital):** `24px` height for Icon-only; `16px` height for Logotype.
- **Minimum Print Size:** `6mm` height for print collateral.

---

## 3. BRAND GUIDELINES & DESIGN SYSTEM

### 🎨 Color System Tokens:

```css
:root {
  /* Brand Core Tokens */
  --brand-primary: #A855F7;       /* Purple 500 */
  --brand-primary-hover: #9333EA; /* Purple 600 */
  --brand-secondary: #EC4899;     /* Pink 500 */
  --brand-accent: #06B6D4;        /* Cyan 500 */

  /* Neutral Surface System */
  --surface-canvas-dark: #09090B;  /* Zinc 950 */
  --surface-card-dark: #141419;    /* Zinc 900 custom */
  --surface-border-dark: #27272A;  /* Zinc 800 */
  --surface-canvas-light: #F8FAFC; /* Slate 50 */
  --surface-card-light: #FFFFFF;   /* Pure White */
  --surface-border-light: #E2E8F0; /* Slate 200 */

  /* Semantic Feedback Palette */
  --color-success: #10B981;       /* Emerald 500 */
  --color-warning: #F59E0B;       /* Amber 500 */
  --color-danger: #EF4444;        /* Red 500 */
  --color-info: #3B82F6;          /* Blue 500 */
}
```

### 🔤 Typography System:
- **Heading Display Font:** `Outfit`, sans-serif (Google Fonts). Weights: `700 (Bold)`, `800 (Extra-Bold)`, `900 (Black)`.
- **Body & Interface Font:** `Inter`, sans-serif (Google Fonts). Weights: `400 (Regular)`, `500 (Medium)`, `600 (Semi-Bold)`.
- **Code & Financial Numbers:** `JetBrains Mono` or `tabular-nums` font feature settings for tabular financial numbers.

### 📐 Spacing & Radius Tokens:
- **Base Grid Unit:** `4px` / `8px` scaling system (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`).
- **Border Radius:**
  - Buttons / Inputs: `rounded-xl` (`12px`)
  - Cards / Modals: `rounded-2xl` (`16px`) to `rounded-3xl` (`24px`)
  - Badges / Pill Tags: `rounded-full` (`9999px`)

### ♿ Accessibility (WCAG 2.1 AA Compliance):
- All text-to-background contrast ratios enforce a **minimum 4.5:1 ratio** for normal text and **3.0:1 ratio** for large display headings.
- Interactive elements feature explicit focus-visible rings (`focus-visible:ring-2 focus-visible:ring-purple-500`).

---

## 4. PROJECT BRIEF & TECHNICAL SPECIFICATION

### 📌 Product Summary:
EventOS is a multi-tenant AI operating system built for event planners, wedding agencies, decor scenographers, and sound/stage production houses. It replaces manual spreadsheets and fragmented tools with an end-to-end digital pipeline: **Lead Ingress ➔ Interactive Proposal ➔ E-Signature ➔ 0% Direct UPI Settlement ➔ AI Run-of-Show Timeline ➔ 4K Media Delivery**.

### 🚀 Core Modules:
1. **CRM & Lead Pipeline:** Visual Kanban board for tracking lead status, budget tiers, and conversion rates.
2. **Quotation & Proposal Engine:** Interactive shareable links (`/quotes/share/[token]`) with digital canvas e-signatures and automated PDF rendering.
3. **Dual Payment Engine:** Stripe SaaS subscriptions (Layer 1) + Direct NPCI UPI QR Settlements (Layer 2) with configurable platform fee rules (No Fee, Fixed, Percentage, Enterprise Custom).
4. **AI Operations & Run-of-Show Timeline:** Live timeline simulator with 1-click AI conflict auto-resolver and vendor alert dispatch.
5. **Client Portal & Media Gallery:** Passcode-protected 4K photo proofing, Pinterest-style masonry layout, lightbox EXIF data, client favorites, and ZIP archive downloads.
6. **Meta WhatsApp Cloud API Gateway:** Automated green-tick message triggers for booking acknowledgments, proposal dispatches, payment receipts, and timeline alerts.

---

## 5. PROJECT CONSTRAINTS & COMPLIANCE

- **Security & Multi-Tenant Isolation:** JWT Bearer tokens (`HS512`), mandatory Hibernate `@Where(clause = "tenant_id = :tenantId")` isolation, AES-256 GCM secret encryption at rest, HMAC SHA256 webhook verification.
- **Performance Budget:** First Contentful Paint (FCP) `< 0.8s`, Time to Interactive (TTI) `< 1.2s`, Lighthouse Score `> 95/100`.
- **Browser Compatibility:** Chrome `100+`, Safari `15+`, Firefox `100+`, Edge `100+`, Mobile Safari / Chrome iOS & Android.

---

## 6. IMPLEMENTATION ROADMAP & MILESTONE SCHEDULE

```
[M1: Brand & Design System] ➔ [M2: Web Client & Core Pages] ➔ [M3: Microservices & API Gateway] ➔ [M4: Production Launch]
      Weeks 1–2                      Weeks 3–4                       Weeks 5–6                       Week 7+
```

| Milestone | Key Deliverables | Timeline | Status |
| :--- | :--- | :--- | :--- |
| **M1: Brand Finalization** | Logo exports, design tokens, typography, dark/light theme CSS | Weeks 1–2 | ✅ **100% Complete** |
| **M2: Frontend Engineering** | Next.js 15 pages (`/`, `/pricing`, `/settings`, `/portal`, `/crm`) | Weeks 3–4 | ✅ **100% Complete** |
| **M3: Backend Microservices** | Spring Boot services (`auth-service`, `crm-service`, `event-service`, `gallery-service`) | Weeks 5–6 | ✅ **100% Complete** |
| **M4: Production Launch** | Vercel frontend + Render containers + Cloudflare WAF + 100 Lead Outreach | Week 7+ | 🚀 **Ready for Launch** |

---

## 7. EXECUTIVE SUMMARY OF DELIVERABLES

EventOS is **100% Code-Complete, Architecture-Verified, Brand-Finalized, and Production-Ready**. The complete platform assets, technical specs, GTM blueprints, and legal compliance pages are published and available in `d:\EventOs`.
