# EventOS — Third-Party Integrations

## 1. Stripe (Payment Processing)

**FACT:**
- **Purpose:** Platform subscription billing, checkout, webhooks
- **Used in:** `auth-service/controller/BillingController.java`, `auth-service/service/BillingService.java`
- **Configuration:** `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET` environment variables
- **API interaction:** Stripe Checkout Session creation, webhook event processing
- **Failure behavior:** Falls back to direct database upgrade if Stripe Checkout unavailable
- **Env vars required:** `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`

Source: `backend/auth-service/.../service/BillingService.java`, `docker-compose.yml`

## 2. Cloudinary (Media Storage)

**FACT:**
- **Purpose:** Image/video upload, storage, transformation, watermarking
- **Used in:** `gallery-service/service/CloudinaryService.java` (16KB), `crm-service/service/CloudinaryService.java` (3KB)
- **Configuration:** Cloud name, API key, API secret
- **Features:** Upload, transformation, thumbnail generation, watermark overlay, deletion
- **Used by:** Gallery items, album cover images, quote PDFs
- **Env vars required:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

Source: `backend/gallery-service/.../service/CloudinaryService.java`, `backend/crm-service/.../service/CloudinaryService.java`

## 3. Google OAuth

**FACT:**
- **Purpose:** Google sign-in for authentication
- **Used in:** `auth-service/service/GoogleAuthService.java`, `web/src/app/providers.tsx`
- **Configuration:** `GOOGLE_CLIENT_ID` env var
- **Frontend:** `@react-oauth/google` package, `GoogleOAuthProvider` wrapper
- **Fallback:** Hardcoded Google client ID in providers.tsx as fallback
- **Env vars required:** `GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

Source: `backend/auth-service/.../service/GoogleAuthService.java`, `web/src/app/providers.tsx`

## 4. Meta WhatsApp Cloud API

**FACT:**
- **Purpose:** Send automated messages to clients (proposals, invoices, run-of-show alerts)
- **Used in:** `web/src/lib/whatsapp.ts`
- **API:** Meta Graph API v20.0 (`https://graph.facebook.com/v20.0/{phoneNumberId}/messages`)
- **Configuration:** phoneNumberId + accessToken stored per company (`whatsappConfig` field)
- **Templates:** PROPOSAL_LINK, INVOICE_RECEIPT, RUN_OF_SHOW_ALERT, LEAD_CONFIRMATION
- **Also:** wa.me deep links for 1-click WhatsApp Web opening
- **Env vars required:** Per-company configuration (not global env var)

Source: `web/src/lib/whatsapp.ts`

## 5. SMTP Email

**FACT:**
- **Purpose:** Transactional emails (verification, password reset, invoices, notifications)
- **Used in:** `auth-service/service/EmailService.java` (36KB)
- **Configuration:** SMTP host, port, username, password, sender address
- **Development:** MailHog container (port 1025 SMTP, port 8025 UI)
- **Env vars required:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `APP_MAIL_FROM`

Source: `backend/auth-service/.../service/EmailService.java`, `docker-compose.yml` (mailhog service)

## 6. Google reCAPTCHA

**FACT:**
- **Purpose:** Bot protection on registration and public forms
- **Used in:** `auth-service/service/RecaptchaService.java`, frontend forms
- **Frontend:** `react-google-recaptcha` package
- **Configuration:** `RECAPTCHA_ENABLED`, `RECAPTCHA_SECRET_KEY`
- **Env vars required:** `RECAPTCHA_ENABLED`, `RECAPTCHA_SECRET_KEY`

Source: `backend/auth-service/.../service/RecaptchaService.java`

## 7. Google Analytics 4

**FACT:**
- **Purpose:** Product analytics, user behavior tracking
- **Used in:** `web/src/lib/analytics.ts`
- **Configuration:** Dynamically loaded if `NEXT_PUBLIC_GA_ID` env var is set
- **Features:** Page views, CTA clicks, auth events, CRM events, billing events
- **Env vars required:** `NEXT_PUBLIC_GA_ID` (optional)

## 8. PostHog

**FACT:**
- **Purpose:** Product analytics, user identification
- **Used in:** `web/src/lib/analytics.ts`
- **Configuration:** Dynamically loaded if `NEXT_PUBLIC_POSTHOG_KEY` env var is set
- **API host:** `https://us.i.posthog.com`
- **Env vars required:** `NEXT_PUBLIC_POSTHOG_KEY` (optional)

## 9. Microsoft Clarity

**FACT:**
- **Purpose:** Session recording, heatmaps, user behavior analysis
- **Used in:** `web/src/lib/analytics.ts`
- **Configuration:** Dynamically loaded if `NEXT_PUBLIC_CLARITY_ID` env var is set
- **Env vars required:** `NEXT_PUBLIC_CLARITY_ID` (optional)

## 10. Redis

**FACT:**
- **Purpose:** Caching, rate limiting, session storage
- **Used by:** API Gateway (rate limiting), Auth Service (caching), Frontend (`web/src/lib/redis.ts`)
- **Version:** 7.2 Alpine
- **Frontend:** ioredis client for SSR-side caching
- **Env vars required:** `REDIS_HOST`, `REDIS_PORT`, `REDIS_URL`

## 11. RabbitMQ

**FACT:**
- **Purpose:** Asynchronous inter-service messaging
- **Version:** 3.12 Management Alpine
- **Used for:** Quote acceptance → booking, payment → gallery access, audit logging, budget → lead conversion, media cleanup
- **Management UI:** Port 15672
- **Env vars required:** `RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_USER`, `RABBITMQ_PASS`

## 12. Slack (Alerting)

**FACT:**
- **Purpose:** Monitoring alerts via Grafana
- **Configuration:** `SLACK_WEBHOOK_URL` in docker-compose (Grafana env)
- **Env vars required:** `SLACK_WEBHOOK_URL` (optional)

## Integration Configuration Summary

| Integration | Required | Status |
|---|---|---|
| PostgreSQL | ✅ Required | FACT: Implemented |
| Redis | ✅ Required | FACT: Implemented |
| RabbitMQ | ✅ Required | FACT: Implemented |
| Stripe | ⚠️ Optional (billing) | FACT: Implemented with fallback |
| Cloudinary | ⚠️ Required for media | FACT: Implemented |
| SMTP | ⚠️ Required for emails | FACT: Implemented (MailHog dev) |
| Google OAuth | ⚠️ Optional | FACT: Implemented |
| reCAPTCHA | ⚠️ Optional | FACT: Implemented |
| WhatsApp API | ⚠️ Optional (per-company) | FACT: Implemented |
| GA4 | ❌ Optional | FACT: Conditional loading |
| PostHog | ❌ Optional | FACT: Conditional loading |
| Clarity | ❌ Optional | FACT: Conditional loading |
| Slack | ❌ Optional | FACT: Grafana alerts only |

Source: `.env.example`, `docker-compose.yml`, respective service files
