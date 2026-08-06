# 🔑 EventOS Master Production Environment & API Integration Guide

This document is the authoritative master guide for replacing development/test keys with **real production API keys, secrets, database endpoints, and webhook URLs** across the EventOS platform.

---

## 📁 File Location Summary

| Config File Path | Purpose | Scope |
| :--- | :--- | :--- |
| `d:/EventOs/.env` | Root Environment Variables for Backend Microservices | Backend & Docker |
| `d:/EventOs/web/.env.local` | Next.js Frontend Client Environment Variables | Web Frontend |
| `d:/EventOs/docker-compose.prod.yml` | Container Orchestration & Limits | Production Docker |
| `d:/EventOs/k8s/*.yaml` | Kubernetes Deployments & Ingress Configs | Cloud K8s Cluster |

---

## 1. 🌐 Web Frontend Configuration (`d:/EventOs/web/.env.local`)

| Variable Name | Test / Local Value | Real Production Value to Add | Where to Get Real Key |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `171503360...usercontent.com` | `your-prod-client-id.apps.googleusercontent.com` | [Google Cloud Console](https://console.cloud.google.com/) ➔ Credentials ➔ OAuth 2.0 |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | `6LeIxAcTAAAAAJcZVRqyH...` | `your-production-recaptcha-site-key` | [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin) v2 Checkbox |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_51Tq...` | `pk_live_51...` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) ➔ API Keys (Live Mode) |

---

## 2. ⚙️ Root Backend Configuration (`d:/EventOs/.env`)

### 🛡️ Security & JWT Keys
```env
# Replace with a secure 256-bit randomly generated secret (Run: openssl rand -hex 32)
JWT_SECRET_KEY=9a4f2c8d7e6b5a3f1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d
JWT_EXPIRATION_MS=900000
JWT_REFRESH_EXPIRATION_MS=604800000
```

### 💳 Stripe Enterprise Payments & Subscriptions
```env
# Replace test keys with Live Production Keys
STRIPE_API_KEY=sk_live_51...
STRIPE_PUBLISHABLE_KEY=pk_live_51...
# Webhook signing secret from Stripe Dashboard -> Developers -> Webhooks
STRIPE_WEBHOOK_SECRET=whsec_your_production_signing_secret
```

### 📧 Transactional Email Dispatch (SMTP / SendGrid / Amazon SES)
```env
# Change from Gmail test config to your production transactional email provider
SMTP_HOST=smtp.sendgrid.net           # Or email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USERNAME=apikey                   # Or AWS SES SMTP Access Key
SMTP_PASSWORD=SG.your_sendgrid_key     # Or AWS SES Secret Key
```

### 📸 Cloudinary Media Storage (Event Photo Booth & Media Uploads)
```env
# Production Cloudinary Account Credentials
CLOUDINARY_CLOUD_NAME=your_prod_cloud_name
CLOUDINARY_API_KEY=your_prod_api_key
CLOUDINARY_API_SECRET=your_prod_api_secret
```

### 🤖 Google reCAPTCHA Backend Verification
```env
RECAPTCHA_ENABLED=true
RECAPTCHA_SECRET_KEY=your_production_recaptcha_secret_key
```

### 🗄️ PostgreSQL Database & Redis Cache
```env
POSTGRES_PORT=5433
POSTGRES_USER=eventos_admin
POSTGRES_PASSWORD=your_ultra_secure_db_password
REDIS_PORT=6379
```

### 🔔 Operations, Monitoring & Slack Alerts
```env
# Webhook for live incident & revenue alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/PROD/WEBHOOK
# OpenTelemetry exporter endpoint
OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4318
```

---

## 3. 🚀 Step-by-Step Production Deployment Command Sequence

Once all real API keys are saved in `d:/EventOs/.env` and `d:/EventOs/web/.env.local`:

```powershell
# Step 1: Load updated root .env into current PowerShell session
cd d:\EventOs
.\load_env.ps1

# Step 2: Build and start all 5 microservices + Next.js frontend in production mode
docker-compose -f docker-compose.prod.yml up -d --build

# Step 3: Verify all containers are running healthily
docker-compose -f docker-compose.prod.yml ps

# Step 4: Test overall live health status
curl http://localhost:3000/status
```

---

## ✅ Post-Deployment Verification Checklist

- [ ] Workspace Owners can upgrade plans via Stripe Live Checkout (`pk_live_...`).
- [ ] Users can sign in using Google OAuth with production domain URIs.
- [ ] Registration forms are protected by live Google reCAPTCHA v2.
- [ ] WhatsApp 6-digit OTPs and Email verification codes send without delays.
- [ ] Event photo uploads process through production Cloudinary storage.
