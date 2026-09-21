# Product Decisions

## PD-001: India-First Market Focus

**Date:** Pre-2026
**Status:** Accepted

**Context:** EventOS targets the Indian event management market.

**Decision:** Default all financial, locale, and business settings to Indian standards.

**Evidence:**
- Default currency: INR (₹)
- Default timezone: Asia/Kolkata
- GST number field on Company entity
- PAN number field on Company entity
- Date format default: DD/MM/YYYY
- Pricing in INR (₹1,999 – ₹12,999/month)
- Phone number defaulting: 10-digit → prefix with +91

---

## PD-002: Multi-Modal Authentication

**Date:** Pre-2026
**Status:** Accepted

**Context:** Indian event professionals use diverse devices and may prefer WhatsApp-based access.

**Decision:** Support 5 login methods: email/password, Google OAuth, magic link, WhatsApp OTP, TOTP 2FA.

**Reason:** Maximize accessibility across user segments (tech-savvy agency owners, on-site crew, clients).

---

## PD-003: Three-Tier Pricing Model

**Date:** Pre-2026
**Status:** Accepted

**Context:** Need to serve solo planners through large agencies.

**Decision:** Starter (₹1,999), Professional (₹4,999), Agency (₹12,999) with annual discount (~20%).

**Evidence:** `web/src/config/pricing.ts`

---

## PD-004: Unified Landing + Auth Modal Pattern

**Date:** Pre-2026
**Status:** Accepted

**Context:** `/login` and `/register` as separate pages create friction.

**Decision:** Redirect `/login` → `/?login=true`, `/register` → `/?register=true`. Auth is handled via modal overlay on the landing page.

**Evidence:** `web/src/middleware.ts:89-105`, `web/src/components/auth/AuthModal.tsx`
