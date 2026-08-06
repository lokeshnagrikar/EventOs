# 📖 EventOS — Commercial SaaS Operations Handbook

> **System Target:** EventOS Production SaaS Platform  
> **Audience:** Founder, Customer Success Team, Billing Ops, Support Agents, Systems Admin  

---

## 📌 1. CUSTOMER LIFECYCLE WORKFLOWS

### 1.1 Trial Signup & Workspace Creation
- **Trigger:** User registers at `https://eventos.agency/signup`.
- **System Action:** 
  1. `AuthService.java` generates tenant workspace with 14-day Free Trial (`status: "TRIALING"`).
  2. Generates 6-digit OTP verification email.
  3. No credit card required at registration.

### 1.2 Trial Expiration & Upgrades
- **Trial Expiry (Day 14):** System displays upgrade prompt modal restricting new lead/event creation until plan selection.
- **Plan Upgrade:** User selects Starter (₹1,999/mo), Professional (₹5,999/mo), or Enterprise (₹11,999/mo). `BillingService.java` processes Stripe/Razorpay payment and updates `subscriptions` status to `ACTIVE`.

---

## 📌 2. BILLING & 18% GST COMPLIANCE SOPS

- **Automated Invoice Dispatch:** On the 1st of every month, `BillingService.java` calculates base price + 18% GST (9% CGST + 9% SGST for Indian entities) and emails PDF invoice receipt.
- **Refund Policy:** 100% money-back guarantee within 14 days of paid subscription. Refunds processed via Stripe/Razorpay dashboard within 24 hours.

---

## 📌 3. SUPPORT INCIDENT & SLA MATRIX

| Priority | Definition | First Response SLA | Resolution SLA |
| :--- | :--- | :--- | :--- |
| **P1 - Critical** | System Outage or Login Blocked | < 15 Minutes | < 2 Hours |
| **P2 - High** | Payment / PDF Quote Failure | < 1 Hour | < 4 Hours |
| **P3 - Normal** | How-to Inquiry / UI Question | < 4 Hours | < 24 Hours |
| **P4 - Low** | Feature Suggestion | < 12 Hours | < 48 Hours |

---

## 📌 4. DAILY FOUNDER & ADMIN OPERATIONAL CHECKLIST

- [ ] **08:00 AM:** Review Prometheus Alerting Slack channel (`#alerts`).
- [ ] **09:00 AM:** Check Daily MRR / ARR revenue additions in SuperAdmin Dashboard (`/superadmin`).
- [ ] **11:00 AM:** Inspect open support tickets & clear P1/P2 inquiries.
- [ ] **03:00 PM:** Verify daily automated PostgreSQL S3 backup completion status.
- [ ] **06:00 PM:** Review daily user signups and 48-hour activation rates.
