# Session: 2026-09-25 — Razorpay Payment Gateway & SEO Compliance Hardening

## Objective
Integrate Razorpay payment gateway (Key ID: `rzp_test_TgKHPSNur6OkpY`) across backend microservices and frontend checkout for Indian INR transactions (UPI, Cards, Netbanking). Synchronize domain and contact information across the platform for RBI and Razorpay compliance.

## Files Inspected
- `backend/auth-service/pom.xml`
- `backend/auth-service/src/main/resources/application.yml`
- `backend/auth-service/src/main/java/com/eventos/auth/controller/BillingController.java`
- `backend/auth-service/src/main/java/com/eventos/auth/service/EmailService.java`
- `web/src/app/contact/page.tsx`
- `web/src/app/settings/page.tsx`
- `web/src/store/billingStore.ts`
- `web/src/lib/razorpay.ts`
- `web/.env.local`
- `.env`

## Changes Made
- **Razorpay Backend (`auth-service`)**:
  - Created `RazorpayService.java` with order generation via Razorpay Orders API, HMAC-SHA256 signature verification, and graceful fallback.
  - Added endpoints `/api/v1/auth/billing/razorpay/create-order` and `/api/v1/auth/billing/razorpay/verify-payment` in `BillingController.java`.
  - Configured `app.razorpay.key-id` and `app.razorpay.key-secret` in `application.yml` and `.env`.
- **Razorpay Frontend (`web`)**:
  - Created `web/src/lib/razorpay.ts` providing dynamic Checkout.js script loading and modal launch with EventOS theme (`#8B5CF6`).
  - Integrated Razorpay modal into `web/src/app/settings/page.tsx` plan upgrade buttons with instant verification and subscription state refresh.
  - Updated `billingStore.ts` to trigger Razorpay checkout for paid tier upgrades.
- **Contact & Compliance**:
  - Updated `web/src/app/contact/page.tsx` with official Indian phone number (`+91 93099 65483`) and verified address (`SAI Colony, Ward No. 6, Deori, Gondia, Maharashtra - 441901, India`) matching government identity records.
  - Connected contact inquiry form directly to backend `/auth/inquiries` endpoint.
- **SEO & Search Console**:
  - Synced canonical domains to `https://www.eventosapp.in` to prevent 308 redirect loops on Google Search Console.
  - Verified Cloudflare Email Routing for `sales@eventosapp.in` forwarding to `devloperonly@gmail.com`.

## Architectural Decisions
- Used standard JDK `javax.crypto.Mac` (HmacSHA256) and Spring `RestTemplate` for Razorpay integration to ensure lightweight, zero-conflict compatibility with Java 21 and Spring Boot 3.3.
- Retained Stripe backend architecture for international USD/EUR fallback while using Razorpay as the primary gateway for the Indian domestic market.

## Bugs Discovered & Fixed
- Fixed Google Search Console sitemap "Couldn't fetch" error caused by Vercel 308 redirect from non-www to `www.eventosapp.in`.
- Replaced dummy US phone format `+1 (800) 555-EVNT` with verified Indian contact details.

## Tests Performed
- Executed `mvn test-compile` on `auth-service` (114 source files compiled successfully with BUILD SUCCESS).
- Verified DNS MX and TXT records for `eventosapp.in`.

## Deployment Status
- Changes pushed to `origin/main` (commits `3a43b20`, `7df5c13`, `ad36cfa`, `b4d9dec`).
- Continuous deployment active via Vercel.
