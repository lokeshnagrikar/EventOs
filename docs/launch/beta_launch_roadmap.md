# 🚀 EventOS — Complete Beta Launch Roadmap

> Everything you need to do, step by step, before going live with beta users.

---

## Overview: 6 Phases to Beta Launch

```mermaid
graph LR
    A["Phase 1<br/>Code Freeze<br/>& Testing<br/>(Week 1-2)"] --> B["Phase 2<br/>Deploy to<br/>Render.com<br/>(Week 2-3)"]
    B --> C["Phase 3<br/>Domain &<br/>DNS & SSL<br/>(Week 3)"]
    C --> D["Phase 4<br/>Beta User<br/>Recruitment<br/>(Week 3-4)"]
    D --> E["Phase 5<br/>Beta<br/>Monitoring<br/>(Week 4-5)"]
    E --> F["Phase 6<br/>Go/No-Go<br/>& Public<br/>Launch"]
```

---

## 📌 PHASE 1: Code Freeze & Testing (Week 1-2)

### Step 1.1 — Build Verification

```bash
# Backend: Ensure all 5 microservices compile cleanly
cd d:\EventOs\backend
mvn clean install -DskipTests

# Backend: Run all unit + integration tests
mvn test

# Backend: Generate JaCoCo coverage report
mvn jacoco:report

# Frontend: Build production bundle
cd d:\EventOs\web
npm run build
```

> [!IMPORTANT]
> If ANY of these fail — **STOP and fix**. Do NOT proceed to deployment with broken builds.

### Step 1.2 — Run the Golden Path Test

From our [Pre-Launch Testing Checklist](file:///C:/Users/LENOVO/.gemini/antigravity-ide/brain/52e37188-221e-4e55-99f0-ccd00c2a0ea3/pre_launch_testing_and_pitch.md), execute the complete end-to-end flow:

- [ ] Register → Verify email → Login
- [ ] Create Contact → Create Lead → Move through Kanban stages
- [ ] Create Quote → Export PDF → Share on WhatsApp
- [ ] Create Event Booking → Add Timeline items → Detect conflicts
- [ ] Create Gallery Album → Upload photos → Share with passcode
- [ ] Logout → Login again → Verify data persists

### Step 1.3 — Security Hardening

- [ ] Remove all `console.log()` debug statements from frontend
- [ ] Verify `spring.profiles.active=prod` in all service configs
- [ ] Verify JWT RSA keys are NOT hardcoded (use env variables)
- [ ] Verify `create-drop` is NOT used in production JPA config (should be `validate` or `update`)
- [ ] Verify CORS is restricted to your domain only (not `*`)
- [ ] Verify rate limiting is enabled on login/register endpoints
- [ ] Add `robots.txt` and `sitemap.xml` to frontend public folder

```bash
# Quick check for dangerous patterns in backend
cd d:\EventOs\backend
grep -r "create-drop" --include="*.yml" --include="*.yaml" --include="*.properties"
grep -r "cors.*\*" --include="*.java"
```

### Step 1.4 — Git Housekeeping

```bash
cd d:\EventOs

# Ensure everything is committed
git add -A
git status
git commit -m "chore: pre-beta code freeze — all tests passing"

# Tag the release
git tag -a v0.9.0-beta -m "EventOS v0.9.0 Beta Release Candidate"
git push origin main --tags
```

---

## 🌐 PHASE 2: Deploy to Render.com (Week 2-3)

> You already have the full [Render Deployment Guide](file:///d:/EventOs/docs/render_deployment_guide.md). Follow it in this exact order:

### Deployment Order

| # | Service | Render Type | Est. Cost |
|---|---------|------------|-----------|
| 1 | **PostgreSQL** | Managed Database | Free (90 days) or $7/mo |
| 2 | **Redis** | Managed Redis | Free or $10/mo |
| 3 | **RabbitMQ** | Docker Private Service | $7/mo |
| 4 | **Auth Service** | Web Service (Docker) | $7/mo |
| 5 | **CRM Service** | Web Service (Docker) | $7/mo |
| 6 | **Event Service** | Web Service (Docker) | $7/mo |
| 7 | **Gallery Service** | Web Service (Docker) | $7/mo |
| 8 | **API Gateway** | Web Service (Docker) | $7/mo |
| 9 | **Frontend (Next.js)** | Static/Web Service | $7/mo |

> **Total Beta Cost: ~$50-66/month** (₹4,000-5,500/month)

### Environment Variables to Set on Each Service

```bash
# Common for ALL backend services:
DATABASE_URL=postgres://eventos_admin:xxxxx@dpg-xxxx.render.com/eventos_root
REDIS_URL=redis://xxxxx@red-xxxx.render.com:6379
RABBITMQ_HOST=rabbitmq-xxxx.render.com
SPRING_PROFILES_ACTIVE=prod
JWT_PUBLIC_KEY=<your-rsa-public-key>
JWT_PRIVATE_KEY=<your-rsa-private-key>

# For Gallery Service additionally:
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# For Auth Service additionally:
SMTP_HOST=smtp.sendgrid.net
SMTP_USERNAME=apikey
SMTP_PASSWORD=SG.your-sendgrid-key

# For Frontend:
NEXT_PUBLIC_API_URL=https://api.eventos.agency
```

### Post-Deployment Smoke Test

After all services are live on Render:

```bash
# Health check each service
curl -f https://api.eventos.agency/actuator/health
curl -f https://auth.eventos.agency/actuator/health
curl -f https://crm.eventos.agency/actuator/health
curl -f https://events.eventos.agency/actuator/health
curl -f https://gallery.eventos.agency/actuator/health

# Test API Gateway routing
curl -X POST https://api.eventos.agency/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

---

## 🌍 PHASE 3: Domain, DNS & SSL (Week 3)

### Step 3.1 — Buy Domain

| Option | Provider | Cost |
|--------|----------|------|
| `eventos.agency` | Namecheap / GoDaddy | ~₹800-1500/year |
| `eventos.in` | BigRock / GoDaddy | ~₹500-800/year |
| `eventosindia.com` | Namecheap | ~₹700/year |

### Step 3.2 — DNS Configuration

```
# A Records / CNAME Records in your DNS provider:
eventos.agency          → Render frontend service URL
api.eventos.agency      → Render API gateway service URL
app.eventos.agency      → Render frontend (dashboard)
```

### Step 3.3 — SSL Certificate

- Render provides **FREE automatic SSL** (Let's Encrypt) for custom domains
- Just add your domain in Render dashboard → Custom Domains → it auto-provisions HTTPS

### Step 3.4 — Email Domain Setup (SendGrid)

```
# Add DNS records for SendGrid email authentication:
TXT  _dkim.eventos.agency   → (SendGrid provides this)
TXT  eventos.agency          → v=spf1 include:sendgrid.net ~all
CNAME em1234.eventos.agency  → (SendGrid provides this)
```

> This ensures your verification emails don't go to spam.

---

## 👥 PHASE 4: Beta User Recruitment (Week 3-4)

### Target: 10-15 Event Agencies

### Channel 1: Instagram DM Outreach

1. Search Instagram for: `wedding planner [your city]`, `event coordinator`, `wedding decor`
2. Find 30-50 active accounts (posting regularly, 1K-50K followers)
3. Send personalized DMs:

**Hinglish DM Template:**
> "Hi [Name] 🙏 Aapke setups bahut amazing hain! Quick question — aap apne wedding quotes aur client communication kaise manage karte ho? Agar abhi bhi Excel aur WhatsApp se kaam chal raha hai, toh humne ek tool banaya hai specifically Indian wedding planners ke liye — EventOS. Abhi 15 agencies ko Founder's Beta access de rahe hain — FREE setup + 50% lifetime discount. Ek 2-minute video bhejun?"

### Channel 2: WhatsApp Groups

- Join local event vendor WhatsApp groups
- Share a 30-second screen recording of the Quote Calculator
- Offer free onboarding calls

### Channel 3: Local Event Vendor Networks

- Visit 2-3 banquet halls or wedding venues in your city
- Talk to their in-house coordinators
- Offer free trial + setup

### Beta Onboarding Flow

```
1. Agency signs up at eventos.agency/signup?invite=BETA-FOUNDER-2026
2. Auto-welcome email sent (from your Beta Playbook template)
3. Schedule 15-min Calendly onboarding call
4. On call: Set up their workspace, import logo, create first lead together
5. Goal: Agency generates first PDF Quote within 48 hours (TTFV < 48h)
```

---

## 📊 PHASE 5: Beta Monitoring (Week 4-5)

### Daily Monitoring Checklist

- [ ] Check Render dashboard — all 6 services running (green status)
- [ ] Check PostgreSQL connection count (< 80% of max)
- [ ] Check Cloudinary usage (storage + bandwidth)
- [ ] Review any error logs in Render → service → Logs tab

### Weekly Metrics to Track

| Metric | How to Check | Target |
|--------|-------------|--------|
| **Time to First Value** | DB query: time between signup and first quote creation | < 48 hours |
| **Daily Active Users** | DB query: unique logins per day | > 10 agencies/day |
| **Feature Adoption** | DB query: % using quotes + gallery + events | > 70% |
| **Bugs Reported** | WhatsApp group + email inbox | < 3 P1 bugs/week |
| **CSAT Score** | Weekly 1-click rating prompt | > 4.6 / 5.0 |

### SQL Queries for Metrics

```sql
-- Time to First Value (TTFV)
SELECT u.email, u.created_at AS signup,
       MIN(q.created_at) AS first_quote,
       EXTRACT(HOURS FROM MIN(q.created_at) - u.created_at) AS hours_to_first_quote
FROM users u
LEFT JOIN quotes q ON q.created_by = u.id
GROUP BY u.id, u.email, u.created_at
ORDER BY u.created_at DESC;

-- Daily Active Users (last 7 days)
SELECT DATE(last_login) AS login_date, COUNT(DISTINCT id) AS active_users
FROM users
WHERE last_login > NOW() - INTERVAL '7 days'
GROUP BY DATE(last_login)
ORDER BY login_date DESC;

-- Feature Adoption Rate
SELECT
  COUNT(DISTINCT q.created_by) AS used_quotes,
  COUNT(DISTINCT a.created_by) AS used_gallery,
  COUNT(DISTINCT b.created_by) AS used_events,
  COUNT(DISTINCT u.id) AS total_users
FROM users u
LEFT JOIN quotes q ON q.created_by = u.id
LEFT JOIN albums a ON a.created_by = u.id
LEFT JOIN bookings b ON b.created_by = u.id;
```

### Bug Triage Process

| Severity | Definition | Response Time |
|----------|-----------|---------------|
| **P0 (Critical)** | App crashes, data loss, login fails | Fix within 4 hours |
| **P1 (High)** | Feature broken but workaround exists | Fix within 24 hours |
| **P2 (Medium)** | UI issue, minor functionality gap | Fix within 3 days |
| **P3 (Low)** | Enhancement request, cosmetic issue | Add to backlog |

---

## ✅ PHASE 6: Go/No-Go Decision & Public Launch (Week 5-6)

### Go/No-Go Checklist

| Criteria | Required | Status |
|----------|----------|--------|
| Zero P0/P1 bugs in last 7 days | ✅ Required | ☐ |
| 10+ beta agencies active 30+ days | ✅ Required | ☐ |
| TTFV < 48 hours for 65%+ agencies | ✅ Required | ☐ |
| CSAT > 4.5/5.0 | ✅ Required | ☐ |
| Payment processing (Stripe/UPI) verified | ✅ Required | ☐ |
| Email delivery latency < 5 seconds | ✅ Required | ☐ |
| At least 3 agencies willing to pay | Strongly Desired | ☐ |
| Legal pages published (/terms, /privacy) | ✅ Required | ☐ |

### If GO ✅ — Public Launch Steps

1. **Remove beta invite-only restriction** — open `/signup` to public
2. **Publish launch announcements** — LinkedIn, Instagram, Twitter
3. **Activate Stripe live billing** — connect real payment processing
4. **Start 14-day free trial clock** for all new signups
5. **Monitor first 100 registrations** closely for 7 days

### If NO-GO ❌ — Extend Beta

1. Identify and fix blocking issues
2. Extend beta by 2 weeks
3. Re-evaluate with updated metrics

---

## 💰 Total Beta Launch Costs Summary

| Item | Monthly Cost | One-Time Cost |
|------|-------------|---------------|
| Render.com hosting (9 services) | ₹4,000-5,500 | — |
| Domain name (eventos.agency) | — | ₹800-1,500/year |
| SendGrid email (free tier: 100 emails/day) | Free | — |
| Cloudinary (free tier: 25 credits/mo) | Free | — |
| SSL Certificate | Free (Render auto) | — |
| **TOTAL** | **~₹4,000-5,500/mo** | **~₹1,000** |

> [!TIP]
> Total investment for 2-month beta: approximately **₹10,000-12,000** (less than one wedding decoration quote!)

---

## 📅 Timeline Summary

| Week | Phase | Key Deliverable |
|------|-------|----------------|
| Week 1-2 | Code Freeze & Testing | All builds green, golden path passes |
| Week 2-3 | Deploy to Render.com | All 9 services live on cloud |
| Week 3 | Domain & DNS & SSL | `eventos.agency` live with HTTPS |
| Week 3-4 | Beta Recruitment | 10-15 agencies onboarded |
| Week 4-5 | Beta Monitoring | Track TTFV, DAU, bugs, CSAT |
| Week 5-6 | Go/No-Go Decision | Public launch OR extend beta |
