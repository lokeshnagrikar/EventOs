# EventOS Audit Report: Phase 4 – Frontend Architecture & Implementation

**Audit Date:** 2026-10-20  
**Target:** EventOS Web Application (`web/` - Next.js 15.2.1, React 19, TypeScript, TailwindCSS, Zustand, Lucide React)  
**Auditor:** Senior Staff Engineer & Security Auditor  

---

## 1. Executive Summary

The EventOS frontend is a sophisticated, feature-rich web application comprising 59 distinct route segments, with custom dark-mode aesthetics, responsive navigation, and comprehensive client-side state management via Zustand. The UI demonstrates high polish in Indian currency formatting (`.toLocaleString("en-IN")` outputting `₹3,29,220`), real-time STOMP WebSocket integration, and role-based route protection in Next.js middleware.

However, several critical structural gaps exist:
1. **AI Copilot is not real RAG**: `AiAssistant.tsx` and `aiProvider.ts` do not perform document retrieval or vector search against tenant data. It makes raw browser calls to Google Gemini without tenant context, falling back to static mock response templates. Client-side API key configuration exposes credentials in `localStorage`.
2. **Mock Data Persistence in Production Routes**: The Developer Center graphs (`/developer`) use `Math.sin`/`Math.cos` simulations, the interactive demo (`/demo`) and tour (`/tour`) rely on hardcoded data, and Workspace Chat (`/chat`) stores message history only in client `localStorage` with no database persistence.
3. **Access Token in `localStorage`**: The access token is persisted in `localStorage`/`sessionStorage` (`authStore.ts:69`), which exposes it to cross-site scripting (XSS) extraction.
4. **Heavy Bundle Sizes**: Massive page components (e.g. `BookingDetailsWorkspace.tsx`, `InvoiceWorkspace.tsx`, `AiAssistant.tsx` > 1,000 lines) contain inline SVG paths, multiple heavy modals, and direct imports without dynamic chunk splitting.

---

## 2. Route List & Implementation Reality Matrix

| Route | Implementation Status | Data Source | Audit Notes / Evidence |
| :--- | :--- | :--- | :--- |
| `/` | ✅ Implemented | Static / Dynamic SSR | Landing page with hero, modules showcase, pricing, ROI simulator |
| `/login` | ✅ Implemented | API (`auth-service`) | Redirects to `/?login=true` modal, calls `POST /api/v1/auth/login` |
| `/register` | ✅ Implemented | API (`auth-service`) | Redirects to `/?register=true` modal, calls `POST /api/v1/auth/register` |
| `/dashboard` | ✅ Implemented | Real API (`event-service`) | Calls `GET /api/v1/events/dashboard` |
| `/crm` | ✅ Implemented | Real API (`crm-service`) | Kanban pipeline with 7 stages, calls `GET /api/v1/leads` |
| `/quotes` | ✅ Implemented | Real API (`crm-service`) | Quotation list, calls `GET /api/v1/quotes` |
| `/quotes/new` | ✅ Implemented | Real API (`crm-service`) | Dynamic line item calculator, GST, discount, margin calculation |
| `/quotes/share/[token]` | ✅ Implemented | Real API (`crm-service`) | Public quote proposal viewer via high-entropy token |
| `/bookings` | ✅ Implemented | Real API (`event-service`) | Booking list, calls `GET /api/v1/bookings` |
| `/bookings/[id]` | ✅ Implemented | Real API (`event-service`) | Timeline milestones, resource allocations, payment installments |
| `/events` | ✅ Implemented | Real API (`event-service`) | Event management, calls `GET /api/v1/events` |
| `/invoices` | ✅ Implemented | Real API (`event-service`) | Invoice generator & status tracking, calls `GET /api/v1/invoices` |
| `/finance` | ✅ Implemented | Real API (`event-service`) | Financial ledger, payment logs, revenue forecasts |
| `/gallery` | ✅ Implemented | Real API (`gallery-service`) | Album grid, calls `GET /api/v1/albums` |
| `/gallery/[id]` | ✅ Implemented | Real API (`gallery-service`) | Media grid, signed upload, ZIP download |
| `/share/[token]` | ✅ Implemented | Real API (`gallery-service`) | Public guest album viewing & ZIP download with passcode check |
| `/portal` | ✅ Implemented | Real API (`event-service`) | Client dashboard, bookings, quotes, invoices, payments |
| `/portal/quotes` | ✅ Implemented | Real API (`crm-service`) | Client proposal review & typed e-signature approval |
| `/chat` | ⚠️ Partial / Mock Storage | Ephemeral WebSocket + `localStorage` | Messages broadcast via STOMP `/topic/chat`, but stored only in client `localStorage` (`chat/page.tsx:53-59`). No backend DB persistence. |
| `/developer` | 🧪 Mock Telemetry | Mock Math Simulation | API latency/request charts generated via `Math.sin`/`Math.cos` loop (`developer/page.tsx:166-175`). |
| `/demo` | 🧪 Mock Data Sandbox | Hardcoded `MOCK_*` arrays | Sample sandbox with `MOCK_LEADS`, `MOCK_QUOTES`, `MOCK_INVOICES` (`demo/page.tsx:59-96`). |
| `/tour` | 🧪 Mock Interactive Tour | Hardcoded `MOCK_FINANCE_DATA` | Visual walkthrough (`tour/page.tsx:22`). |
| `/superadmin` | ✅ Implemented | Real API (`auth-service`) | Tenant management, user list, metrics, plan upgrades |
| `/settings` | ✅ Implemented | Real API (`auth-service`) | Team members, roles, 2FA setup, branding |

---

## 3. Deep Dive: AI Copilot Architecture (`AiAssistant.tsx` & `aiProvider.ts`)

### Investigation Findings
- **File Location:** `d:\EventOs\web\src\components\AiAssistant.tsx` & `d:\EventOs\web\src\lib\aiProvider.ts`
- **Model Invocation:**
```typescript
// web/src/lib/aiProvider.ts:141-155
const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(config.apiKey)}`;
const res = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    contents: [{
      parts: [{
        text: `${systemInstruction}\nContext: Module ${moduleName}\nUser Request: ${prompt}`
      }]
    }], ...
```
- **RAG Assessment:** **NOT IMPLEMENTED**. There is **no** document embedding, vector database (Pinecone/pgvector), semantic chunking, or database query retrieval. The prompt receives only a static module name string (e.g. `Context: Module CRM AI`).
- **Data Access & Tenant Scoping:** The AI has **no access** to actual tenant bookings, quotes, client names, or financial ledgers.
- **Mock Fallback:** When no Gemini API key is configured, `generateAIResponse` returns pre-written static text strings (`aiProvider.ts:180-204`):
  ```typescript
  reply = `Lead Score Assessment:\n• Quality Score: 92/100 (High Priority)\n• Win Probability: 85%...`;
  ```
- **Security & Privacy Flaw:**
  1. API calls are made directly from the client browser (`"use client"`), exposing the API key in client network requests.
  2. Users can enter API keys in the settings page, which are stored in plain text in `localStorage` under `eventos_ai_config`. Any XSS attack can read this key.

---

## 4. Indian Currency & Date Formatting

### Currency Formatting Audit
- **Standard:** The Indian numbering system groups thousands first (`1,000`), then groups digits in pairs of two for lakhs and crores (`1,00,000` = 1 Lakh, `1,00,00,000` = 1 Crore).
- **Codebase Practice:**
  The frontend consistently uses standard JavaScript `number.toLocaleString("en-IN")` with the Rupee symbol `₹`:
  - `web/src/components/finance/InvoiceWorkspace.tsx:508`: `₹{invoice.subtotal.toLocaleString("en-IN")}`
  - `web/src/components/quote/EventQuoteCalculator.tsx:446`: `₹{grandTotal.toLocaleString("en-IN")}`
  - `web/src/config/pricing.ts:40`: `Save ₹{((STARTER_MONTHLY - STARTER_ANNUAL_MONTHLY) * 12).toLocaleString("en-IN")}/yr`
- **Result:** **COMPLIANT & CONSISTENT**. Calling `.toLocaleString("en-IN")` on `329220` outputs `3,29,220`, producing `₹3,29,220`.

---

## 5. State Management & Data Fetching

### Zustand Stores
- `authStore.ts`: Authentication session, active tenant, user profile, workspace memberships.
- `billingStore.ts`: Razorpay checkout modal, subscription plans, billing cycle selection.
- `sidebarStore.ts`: UI sidebar collapse state.
- `themeStore.ts`: UI theme customization.

### Data Fetching
- Primary data fetching is implemented using Axios instances (`@/lib/api`) inside `useEffect` hooks and custom async service wrappers.
- React Query (`@tanstack/react-query`) is configured in dependencies, but several legacy pages still rely on manual `useState` + `useEffect` fetching patterns, leading to duplicate network requests on route transitions.

---

## 6. Performance, Accessibility & SEO

1. **Unoptimized Image Imports**:
   - `AiAssistant.tsx:43`: Uses unoptimized `<img>` for animated GIF (`/chatbot-animated.gif`) instead of Next.js `<Image>`.
   - `PageShell.tsx`: Several avatar thumbnails use raw `<img>` tags without explicit width/height or blur placeholders.
2. **Bundle Splitting & Heavy Components**:
   - `web/src/app/settings/page.tsx` is over 4,800 lines long in a single file! It contains dozens of sub-tabs (profile, 2FA, billing, notifications, domains, integrations, tax settings) in one monolithic component, significantly inflating initial page load and parse time.
3. **Accessibility (a11y)**:
   - High visual contrast with purple accent badges.
   - Interactive modals and dropdowns lack complete ARIA attribute wiring (`aria-expanded`, `aria-controls`, `aria-labelledby`) on custom styled buttons.
4. **SEO Metadata**:
   - `layout.tsx:196`: Implements structured Schema.org JSON-LD metadata for SoftwareApplication.
   - Public pages (`/pricing`, `/solutions`, `/features`) include standard OpenGraph and Twitter card metadata.

---

## 7. Files Reviewed in this Phase
1. `web/src/middleware.ts`
2. `web/src/store/authStore.ts`
3. `web/src/store/billingStore.ts`
4. `web/src/components/AiAssistant.tsx`
5. `web/src/lib/aiProvider.ts`
6. `web/src/components/finance/InvoiceWorkspace.tsx`
7. `web/src/components/quote/EventQuoteCalculator.tsx`
8. `web/src/components/landing/ProductShowcase.tsx`
9. `web/src/components/landing/QuoteSimulator.tsx`
10. `web/src/app/chat/page.tsx`
11. `web/src/app/developer/page.tsx`
12. `web/src/app/demo/page.tsx`
13. `web/src/app/tour/page.tsx`
14. `web/src/app/settings/page.tsx`
15. `web/src/app/portal/quotes/page.tsx`
