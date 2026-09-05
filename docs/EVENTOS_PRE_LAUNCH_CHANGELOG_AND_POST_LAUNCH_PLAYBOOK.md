# EventOS — Pre-Launch Changelog & 30-Day Post-Launch Master Playbook

> **Document Version**: 1.0.0  
> **Date**: September 2026  
> **Author**: Core Engineering & Founder Operations  
> **Scope**: Record of Pre-Launch Website Hardening (Phase 0) and the End-to-End Execution Strategy for Post-Launch (Day 30+).

---

## Table of Contents
1. [Phase 0 Changelog: What We Added & Modified](#1-phase-0-changelog-what-we-added--modified)
2. [The 30-Day Pre-Launch Operations (Month 1: Waitlist & Founder Demos)](#2-the-30-day-pre-launch-operations-month-1-waitlist--founder-demos)
3. [Day 30 Launch Switchover (Backend Go-Live)](#3-day-30-launch-switchover-backend-go-live)
4. [Post-Launch Playbook: Days 31 to 60 (Founding Cohort Onboarding)](#4-post-launch-playbook-days-31-to-60-founding-cohort-onboarding)
5. [Post-Launch Playbook: Days 60 to 90 (Monetization & Public Scaling)](#5-post-launch-playbook-days-60-to-90-monetization--public-scaling)
6. [Emergency Runbook & Technical Rollback Plan](#6-emergency-runbook--technical-rollback-plan)

---

## 1. Phase 0 Changelog: What We Added & Modified

To prevent inbound Instagram and marketing traffic from encountering broken signups before the backend microservices are fully live, the frontend was transformed into an **Exclusive Founding Member Private Beta Engine**:

### A. New Components & Endpoints Created
1. **`web/src/components/auth/WaitlistForm.tsx` [NEW]**:
   * **Founding Cohort Badge**: `Founding Cohort • Limited to 25 Agencies` with real-time ping indicator.
   * **Inbound Lead Capture Fields**:
     * `name`: Full name of owner/coordinator.
     * `agencyName`: Name of the event planning agency or photography studio.
     * `email`: Work email address.
     * `whatsapp`: WhatsApp number with country code for direct founder messaging.
     * `eventType`: Categorization (`Weddings`, `Corporate`, `Both`, `Photography Studio`).
     * `currentTools`: Optional field discovering legacy tech stacks (*Excel, WhatsApp, Notion, Drive*).
   * **High-Converting Celebration Screen**:
     * Displays `🎉 Spot #X of 25 Secured`.
     * Explains the founder-led onboarding process.
     * Direct WhatsApp button linking to founder with pre-filled message: `"Hi Lokesh, I just claimed spot #X for [Agency] on the EventOS Private Beta!"`.

2. **`web/src/app/api/waitlist/route.ts` [NEW]**:
   * API endpoint receiving `POST` payloads from the waitlist form.
   * Validates required inputs and assigns unique IDs (`wtl_...`).
   * Computes dynamic scarcity spot counter (spots 18 to 25).
   * **Fail-Safe Persistence**: Saves leads directly to `web/data/waitlist.json` to guarantee **zero lead loss** even if database connections fluctuate.
   * Provides `GET` status endpoint returning current cohort capacity.

3. **`web/public/instagram-posts/` [NEW ASSETS]**:
   * `01hero-insta.png`: 4:5 Instagram Portrait Hook graphic (*"Meet EventOS — The Next-Gen Event OS"*).
   * `02The Financial Engine.png`: 4:5 Financial Proof graphic (*"Track ₹12.5L Deposits in Real Time"*).
   * `03Workflow & Bento Grid.png`: 4:5 Modular Stack graphic (*"Replace 6 Subscriptions in One Workspace"*).
   * `04Built for the Field—Mobile View.png`: 4:5 Field Operations graphic (*"Built for the Field — Events Don't Happen at Desks"*).

### B. Existing Components Updated
1. **`web/src/store/authModalStore.ts`**:
   * Extended `AuthModalMode` union type to include `"waitlist"`.
2. **`web/src/components/auth/AuthModal.tsx`**:
   * Added conditional rendering for `mode === "waitlist"` displaying `WaitlistForm`.
3. **`web/src/components/landing/Hero.tsx`**:
   * Primary Button changed from `Start 14-Day Free Trial` to **`Join Private Beta →`** (triggers `openModal("waitlist")`).
   * Secondary Button changed from `Or book a 20-min walkthrough` to **`Get Early Access`**.
4. **`web/src/components/landing/Navbar.tsx`**:
   * Desktop & Mobile CTA buttons updated to **`Join Private Beta`**.
5. **`web/src/components/landing/FinalCta.tsx`**:
   * Updated header to *"Private Beta Cohort • Limited to 25 Founding Agencies"*.
   * Form submission directly opens waitlist modal with prefilled email.
   * CTA button updated to **`Join Private Beta →`**.
6. **`web/src/components/landing/Pricing.tsx` & `web/src/config/pricing.ts`**:
   * Updated plan CTAs to **`Join Private Beta →`** and **`Request Founder Access →`**.
   * Plan subtext updated to *"Founding Member Spot · 1-on-1 Founder Onboarding"*.

---

## 2. The 30-Day Pre-Launch Operations (Month 1)

During this 30-day runway, operations follow the **Conversation $\rightarrow$ Waitlist $\rightarrow$ Founder Demo** pipeline:

```
[ Instagram Carousel ] ──(User comments 'BETA')──► [ 1-on-1 Direct Message ]
                                                            │
                                                     (Qualify Agency)
                                                            ▼
[ 15-Min Founder Walkthrough ] ◄──(Invite)── [ Waitlist Form Submission ]
```

### Lead Tracking Schema (Mini-CRM in Google Sheets)
Track every inquiry with this exact schema:
| Name | Agency Name | City | Event Type | WhatsApp | Work Email | Current Pain Point | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Rahul S. | Royal Heritage | Jaipur | Luxury Wedding | +91 98... | rahul@... | Chasing client deposits | `DEMO_COMPLETED` |

* **Status Progression**: `NEW` $\rightarrow$ `DM_SENT` $\rightarrow$ `REPLIED` $\rightarrow$ `WAITLIST` $\rightarrow$ `DEMO_SCHEDULED` $\rightarrow$ `FOUNDING_MEMBER`.

---

## 3. Day 30 Launch Switchover (Backend Go-Live)

On Day 30, the backend microservices transition from development staging to active production.

### Step 1: Render Cloud Microservices Go-Live
Verify all services pass `/actuator/health` on Render:
1. `auth-service` (Port 8081) — Identity, JWT, Tenants.
2. `crm-service` (Port 8082) — Leads, Quotes, Digital Contracts.
3. `event-service` (Port 8083) — Operations, Run-of-Show Timelines, Invoices.
4. `gallery-service` (Port 8084) — Cloudinary Proofing, Milestone Download Gate.
5. `api-gateway` (Port 8080) — Central reverse proxy.

### Step 2: Vercel Frontend Switchover
Update environment variables in Vercel project settings:
```env
NEXT_PUBLIC_API_BASE_URL=https://eventos-api-gateway.onrender.com
NEXT_PUBLIC_LAUNCH_MODE=production
```

### Step 3: Revert Waitlist CTAs to Live Registration
Once the gateway and auth-service are accepting live accounts:
* In `Hero.tsx`: Revert `handleStartTrial` from `openModal("waitlist")` back to `openModal("register")`.
* Change button text from `Join Private Beta →` to `Start 14-Day Free Trial — No Credit Card →`.
* The `WaitlistModal` remains accessible at `/waitlist` for overflow or VIP enterprise inquiries.

---

## 4. Post-Launch Playbook: Days 31 to 60 (Founding Cohort Onboarding)

### Week 1 Post-Launch (Days 31–37): White-Glove Onboarding
Do **not** blast a generic email blast to the public. Onboard the 25 Founding Agencies in controlled batches of 5 per day:

1. **Batch Provisioning**:
   * Pre-create the Tenant in `auth-service` with the agency's name and domain subdomain (`agencyname.eventos.io`).
2. **Personal Founder Welcome (WhatsApp + Video)**:
   * Send a 60-second personalized Loom video or voice note from Founder Lokesh:
     > *"Hey [Name], your EventOS workspace is officially live! Here are your founding credentials. Let's do a 15-minute screen share today so I can configure your invoice templates and wedding cue sheets."*
3. **The First "Golden Workflow" Activation**:
   * Ensure every agency completes at least **one full live transaction** within 48 hours:
     $$\text{Create Real Lead} \rightarrow \text{Generate Quote} \rightarrow \text{Send to Real Client} \rightarrow \text{Receive Digital Signature}$$

### Week 2 Post-Launch (Days 38–45): Rapid Feedback & Bug Squashing
* **Daily Standup**: Review application logs (`Sentry` / Render logs) for any 500 errors or unhandled exceptions.
* **Direct Feedback Loop**: Maintain a dedicated VIP WhatsApp group for the 25 founding owners. Fix any reported UI friction within 24 hours.

### Weeks 3–4 Post-Launch (Days 46–60): First Case Studies & Proof
* Gather the first real success metrics:
  * *"Agency A drafted a ₹25L wedding proposal in 45 seconds."*
  * *"Agency B collected ₹4,50,000 milestone deposit with zero follow-up calls."*
* Turn these into high-converting Instagram video testimonials and Twitter/LinkedIn build-in-public breakdowns.

---

## 5. Post-Launch Playbook: Days 60 to 90 (Monetization & Public Scaling)

### 1. Founding Cohort Conversion
* At the end of the 30-day founding trial, transition the initial 25 agencies to the promised **Lifetime Founding Member Plan**:
  * **Starter Plan**: ₹1,499/mo (vs. ₹1,999/mo public).
  * **Professional Plan**: ₹3,999/mo (vs. ₹5,999/mo public).
  * Lock in annual billing where possible for upfront cash-flow generation.

### 2. Public Launch Blitz
* **Product Hunt Launch**: Full launch post with video demo, tech stack breakdown (Java 21 + Next.js 14), and special discount code `LAUNCH40`.
* **Industry Association Outreach**: Partner with regional wedding planning associations (EEMA, ICWF) for group licenses.
* **Scale Outbound Engine**: Transition from 10 manual daily Instagram comments to a systematic outbound email & LinkedIn sequence targeting 200 high-end wedding planning firms per month.

---

## 6. Emergency Runbook & Technical Rollback Plan

If any critical failure occurs during post-launch go-live:

| Incident | Immediate Action | Recovery Procedure |
| :--- | :--- | :--- |
| **Render Service OOM (Exit 137)** | Container RAM exceeded 512MB. | Verify JVM flags in Dockerfile: `-XX:+UseSerialGC -Xms64m -Xmx192m -XX:TieredStopAtLevel=1`. Never exceed 192MB max heap on starter tiers. |
| **API Gateway Timeout (504)** | Downstream microservice unreachable or slow startup. | Check `/actuator/health` on `auth-service` and `crm-service`. Ensure Render internal network hostnames match `application.yml`. |
| **Database Connection Exhaustion** | HikariCP pool exhausted. | Cap `maximum-pool-size: 5` per microservice in `application.yml` to prevent exceeding Render Postgres connection limits. |
| **Critical Bug in Core Workflow** | UI broken during live agency event. | Switch Vercel back to Phase 0 waitlist mode via `NEXT_PUBLIC_LAUNCH_MODE=waitlist` while hotfixing the backend. |

---

> **Final Note**: Success in SaaS is determined by high retention among the first 25 users, not vanity follower counts. Focus relentlessly on making the first 25 event agency owners look like superheroes to their clients.
