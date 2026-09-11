# 🎨 Frontend Architecture & UI/UX Specifications

> **Complete guide to the Next.js 15 App Router web client, design system tokens, state stores, and interaction animations.**

---

## 1. Frontend Technology Stack

* **Core Framework**: Next.js 15.0.0 (React 19, TypeScript 5.4)
* **Directory Model**: Next.js App Router (`web/src/app`)
* **Styling**: Tailwind CSS 3.4 with custom glassmorphism, glowing borders, and curated dark color palettes
* **State Management**:
  * **Zustand**: Client-side persistent auth state, active workspace, modal managers
  * **TanStack React Query v5**: Server-state synchronization, optimistic mutations, caching
* **Animation & Motion**: Framer Motion 12, Canvas Confetti
* **Smooth Scrolling**: Lenis 1.3.23 (Native momentum scrolling on landing and marketing pages)
* **Iconography**: Lucide React (`lucide-react`) & Iconify (`@iconify/react`)

---

## 2. Directory Structure & Key Routes

```
web/src/
├── app/
│   ├── (auth)/                 ── Login, Registration, Password Reset, Magic Link, OTP
│   │   ├── login/
│   │   ├── register/
│   │   ├── verify-email/
│   │   └── forgot-password/
│   ├── dashboard/              ── Agency Owner & Planner Workspace HQ
│   ├── leads/                  ── CRM Lead Pipeline (Kanban & Table Views)
│   ├── proposals/              ── Interactive Proposals & Quote Builder
│   ├── events/                 ── Event Bookings, Timeline Run-of-Show, Vendor Assignments
│   ├── gallery/                ── Photo Proofing, Cloudinary Media Hub
│   ├── portal/                 ── Client-Facing Portal (White-labeled, PIN-protected)
│   ├── superadmin/             ── EventOS Platform Management & Tenant Health
│   ├── settings/               ── Agency Branding, Team Members, WhatsApp & Billing
│   ├── layout.tsx              ── Root Shell (Providers, Font Loading, Lenis)
│   └── page.tsx                ── High-Converting Marketing Landing Page
├── components/
│   ├── landing/                ── Landing components (Navbar, Hero, Features, Quotes, FAQ)
│   ├── dashboard/              ── Sidebar, Topbar, Metric Widgets, Activity feeds
│   ├── crm/                    ── Lead Kanban, Proposal Generator
│   ├── events/                 ── Timeline Cue Sheet, Vendor Cards
│   ├── gallery/                ── Photo Grid, Watermark Preview, PIN Modal
│   └── ui/                     ── Reusable atomic components (LiquidButton, Modals, Badges)
├── lib/
│   ├── api-client.ts           ── Axios instance with automatic JWT injection & refresh
│   └── utils.ts                ── Tailwind `cn()` helper and currency formatters
└── store/
    ├── authStore.ts            ── Access token, current user, role claims
    └── workspaceStore.ts       ── Active tenant ID, workspace list, switch handler
```

---

## 3. UI Design System & Visual Philosophy

EventOS adheres to an **Ultra-Premium, State-of-the-Art Aesthetic**:
1. **Dark Mode First**:
   - Background: Deep slate/zinc `#090A16` and `#050507`.
   - Panels: Semi-transparent glass (`bg-slate-950/85`, `backdrop-blur-2xl`, `border-purple-500/25`).
2. **Apple-Style Specular Glass Sheens**:
   - Thin, luminous top borders simulating light reflecting off cut glass (`bg-gradient-to-r from-transparent via-purple-400/60 to-transparent`).
3. **Ambient Radial Glows**:
   - Soft, blurred radial gradients behind cards (`bg-purple-600/20`, `blur-3xl`).
4. **Micro-Interactions**:
   - Spring-based button presses (`active:scale-[0.98]`).
   - Smooth layout transitions powered by Framer Motion.

---

## 4. Lenis Smooth Scroll Integration & `data-lenis-prevent`

On public marketing pages, **Lenis** provides momentum-based smooth scrolling:
* Initialized in [`web/src/app/providers.tsx`](file:///d:/EventOs/web/src/app/providers.tsx).
* **The `data-lenis-prevent` Rule**:
  - Lenis intercepts global scroll events.
  - Any nested scrollable element (e.g., chat drawers, mobile navigation menus, modal dialogs, sidebars) **MUST include the `data-lenis-prevent` attribute** to prevent Lenis from hijacking touch/wheel gestures:
    ```tsx
    <div data-lenis-prevent className="overflow-y-auto ...">
      {/* Scrollable content */}
    </div>
    ```

---

## 5. Mobile Navigation & Viewport Responsiveness

* **Mobile Drawer Architecture** ([`Navbar.tsx`](file:///d:/EventOs/web/src/components/landing/Navbar.tsx)):
  - Outer motion container is constrained using `max-h-[calc(100svh-5.5rem)]`.
  - Uses `100svh` (**Small Viewport Height**) to ensure the menu never gets cut off by mobile browser address bars or bottom navigation bars.
  - Inner content container features `data-lenis-prevent`, `overflow-y-auto`, `overscroll-contain`, and `scrollbar-thin` for smooth mobile scrolling when both **SOLUTIONS** and **RESOURCES** submenus are simultaneously expanded.
