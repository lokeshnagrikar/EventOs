# Design Decisions

## DD-001: Purple-Pink Gradient Brand Identity

**Date:** Pre-2026
**Status:** Accepted

**Context:** EventOS needed a distinctive, premium visual identity.

**Decision:** Purple (#9333ea) primary, Pink (#db2777) accent, Near-black (#18181b) secondary. Gradient preset: "purple-pink".

**Evidence:** `backend/auth-service/.../entity/Company.java` `@PrePersist` defaults.

---

## DD-002: Heavy Landing Page Effects

**Date:** Pre-2026
**Status:** Accepted

**Context:** Landing page needs to create a premium first impression.

**Decision:** Use Three.js, WebGL shaders, GSAP scroll animations, particles, glassmorphism, Lenis smooth scroll, and extensive Framer Motion on public marketing pages. Disable heavy effects on dashboard/portal.

**Evidence:** `web/src/components/landing/` (26 components), `web/src/app/providers.tsx` (Lenis enable/disable logic).

---

## DD-003: CSS Variable-Based Theming

**Date:** Pre-2026
**Status:** Accepted

**Context:** Multi-tenant platform where each workspace has custom branding.

**Decision:** Use CSS custom properties for all color/typography tokens, mapped through Tailwind config. This enables per-workspace theme customization without rebuilding CSS.

**Evidence:** `web/tailwind.config.ts` (all colors reference `var(--*)`)

---

## DD-004: Dashboard as Single Mega-Page

**Date:** Pre-2026
**Status:** Accepted (likely to be superseded)

**Context:** Dashboard needed to show comprehensive workspace overview.

**Decision:** Implement as a single 138KB page with all sections inline.

**Impact:** Performance and maintainability concerns. Likely candidate for decomposition.

**Evidence:** `web/src/app/dashboard/page.tsx` (138KB)
