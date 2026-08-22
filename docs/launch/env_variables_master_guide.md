# 🔑 EventOS — Complete Master Guide for Environment Variables (`.env`)

> Every key explained, step-by-step — for both **Local Development** and **Production Deployment (Render.com + Vercel)**.

---

## 📌 QUICK SUMMARY TABLE

| Variable Group | Local Default | Production Source | Required For |
|:---|:---|:---|:---|
| **Database & Cache** | `localhost:5433`, `redis:6379` | Render Postgres & Redis Internal URLs | Database & Session Storage |
| **JWT & Security** | Auto-generated RSA / Secret | Secure Vault / Env Vars | User Auth & Session Tokens |
| **Cloudinary CDN** | Cloud Name, API Key | Cloudinary Console | High-Res Gallery & Media Uploads |
| **Email SMTP** | Gmail / SendGrid SMTP | SendGrid API Key / AWS SES | Account Verification OTP Emails |
| **Stripe / Payments** | `sk_test_...` / `pk_test_...` | Stripe Dashboard | Subscriptions & Invoicing |
| **Frontend Public** | `http://localhost:8080` | `https://api.eventos.agency` | Next.js API Gateway Requests |

---

## 🛠️ SECTION 1: BACKEND ENVIRONMENT VARIABLES (Render.com / Local `.env`)

### 1. Database Connection (`PostgreSQL 16`)

- **`POSTGRES_PORT`**
  - **Local Value:** `5433` *(or `5432` if standard)*
  - **Production Value:** Set automatically by Render (`5432`)
- **`POSTGRES_USER`**
  - **Local Value:** `eventos_admin`
  - **Production Value:** Given by Render Postgres dashboard
- **`POSTGRES_PASSWORD`**
  - **Local Value:** `eventos_secure_pass`
  - **Production Value:** Auto-generated password from Render Postgres
- **`DATABASE_URL`** *(Full Connection String)*
  - **Production Value:** `postgres://eventos_admin:PASSWORD@dpg-xxxx.render.com/eventos_root`

---

### 2. Cache & Message Broker (`Redis` & `RabbitMQ`)

- **`REDIS_PORT`**
  - **Local Value:** `6379`
- **`REDIS_URL`** *(Production)*
  - **Production Value:** `redis://red-xxxx.render.com:6379`
- **`RABBITMQ_HOST`**
  - **Local Value:** `localhost`
  - **Production Value:** `rabbitmq.render.com`
- **`RABBITMQ_USER`** / **`RABBITMQ_PASS`**
  - **Local Value:** `eventos_guest` / `eventos_guest_pass`
  - **Production Value:** Your chosen RabbitMQ credentials

---

### 3. JWT Security & Auth (`auth-service`)

- **`JWT_SECRET_KEY`**
  - **What it is:** 256-bit secret string used to sign JWT user tokens.
  - **Example:** `9a4f2c8d7e6b5a3f1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b`
  - **How to generate a new key:**
    ```powershell
    # In PowerShell:
    [guid]::NewGuid().ToString().Replace("-","") + [guid]::NewGuid().ToString().Replace("-","")
    ```
- **`JWT_EXPIRATION_MS`**
  - **Default Value:** `900000` *(15 minutes for access token)*
- **`JWT_REFRESH_EXPIRATION_MS`**
  - **Default Value:** `604800000` *(7 days for refresh token)*
- **`GOOGLE_CLIENT_ID`**
  - **What it is:** Google OAuth Client ID for "Sign in with Google".
  - **Where to get it:** [Google Cloud Console](https://console.cloud.google.com) $\rightarrow$ APIs & Services $\rightarrow$ Credentials.

---

### 4. Cloudinary CDN Storage (`gallery-service`)

> Required for uploading and serving high-res wedding photos & album proofs.

- **`CLOUDINARY_CLOUD_NAME`**
  - **Where to find:** [Cloudinary Dashboard](https://cloudinary.com/console) $\rightarrow$ Product Environment Details $\rightarrow$ Cloud Name
- **`CLOUDINARY_API_KEY`**
  - **Where to find:** Cloudinary Dashboard $\rightarrow$ API Key (15-digit number)
- **`CLOUDINARY_API_SECRET`**
  - **Where to find:** Cloudinary Dashboard $\rightarrow$ API Secret (Click "View API Secret")

> [!TIP]
> You can sign up for a **FREE Cloudinary account** (25GB storage + 25GB bandwidth free forever).

---

### 5. Email SMTP Setup (`auth-service`)

> Used to send email verification links, password resets, and quote receipts.

- **`SMTP_HOST`**
  - **SendGrid (Recommended):** `smtp.sendgrid.net`
  - **Gmail (Local Dev):** `smtp.gmail.com`
- **`SMTP_PORT`**
  - **Value:** `587` *(TLS)*
- **`SMTP_USERNAME`**
  - **SendGrid:** `apikey`
  - **Gmail:** Your Gmail address
- **`SMTP_PASSWORD`**
  - **SendGrid:** Your SendGrid API Key (`SG.xxxxxxxx...`)
  - **Gmail:** Your 16-character Gmail App Password *(not your normal password)*

---

### 6. Payments & Billing (`crm-service` & `auth-service`)

- **`STRIPE_API_KEY`** *(Secret Key)*
  - **Test Mode:** `sk_test_51Tq...`
  - **Live Mode:** `sk_live_51Tq...`
  - **Where to find:** [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
- **`STRIPE_PUBLISHABLE_KEY`**
  - **Test Mode:** `pk_test_51Tq...`
  - **Live Mode:** `pk_live_51Tq...`
- **`STRIPE_WEBHOOK_SECRET`**
  - **What it is:** Used to verify Stripe billing webhook callbacks (`whsec_...`).

---

## 🌐 SECTION 2: FRONTEND ENVIRONMENT VARIABLES (Vercel / `web/.env.local`)

> ⚠️ All frontend variables **MUST start with `NEXT_PUBLIC_`** so Next.js exposes them to the browser.

Create `web/.env.local` for local development:

```env
# 1. API Gateway URL (Points to local backend gateway or live Render gateway)
NEXT_PUBLIC_API_URL=http://localhost:8080

# For Production Vercel:
# NEXT_PUBLIC_API_URL=https://api.eventos.agency

# 2. Stripe Public Key (For client-side checkout modal)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# 3. Google OAuth Client ID (For Google Login button)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# 4. Google ReCAPTCHA Site Key (For contact & signup forms)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key_here
```

---

## 📋 SECTION 3: STEP-BY-STEP PASTE GUIDE FOR RENDER.COM & VERCEL

### Step-by-Step for Render.com (Backend Services):

1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click on your Service (e.g. `auth-service`) $\rightarrow$ **Environment** tab.
3. Click **"Add Environment Variable"** or **"Add Secret Group"**.
4. Paste the key-value pairs:
   - `DATABASE_URL` = (copy from Render Postgres page)
   - `SPRING_PROFILES_ACTIVE` = `prod`
   - `JWT_SECRET_KEY` = (your secret string)
   - `SMTP_HOST` = `smtp.sendgrid.net`
   - `SMTP_PASSWORD` = (your SendGrid API key)
5. Click **"Save Changes"**. Render will automatically redeploy the service!

### Step-by-Step for Vercel (Frontend):

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) $\rightarrow$ Click `event-os` project.
2. Go to **Settings** $\rightarrow$ **Environment Variables**.
3. Add:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://api.eventos.agency` (or your Render gateway URL)
   - **Environment:** Select Production, Preview, and Development.
4. Click **Save**. Vercel will apply it on the next deployment!
