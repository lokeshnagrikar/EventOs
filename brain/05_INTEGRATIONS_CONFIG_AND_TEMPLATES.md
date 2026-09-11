# 🔌 Integrations, Email Configuration & Templates

> **Exhaustive documentation for Resend SMTP relay, pre-built 3D HTML email templates, Stripe payments, Cloudinary media processing, and RabbitMQ.**

---

## 1. Transactional Email Dispatch (Resend SMTP Relay)

EventOS uses **Resend** as its transactional email provider via its standard **SMTP Relay**.

### 1.1 SMTP Configuration Settings
* **`.env` Configuration**:
  ```properties
  SMTP_HOST=smtp.resend.com
  SMTP_PORT=587
  SMTP_USERNAME=resend
  SMTP_PASSWORD=your_resend_api_key_here   # Active Resend API Key
  APP_MAIL_FROM=support@eventosapp.in
  FRONTEND_URL=https://eventosapp.in                   # Real domain used in Reset Password & Invite email buttons
  ```
* **Spring Boot Configuration** (`backend/auth-service/src/main/resources/application.yml`):
  ```yaml
  spring:
    mail:
      host: ${SMTP_HOST:smtp.resend.com}
      port: ${SMTP_PORT:587}
      username: ${SMTP_USERNAME:resend}
      password: ${SMTP_PASSWORD:}
      properties:
        mail:
          smtp:
            auth: true
            starttls:
              enable: true
              required: true
  ```

### 1.2 Do We Need to Create Templates on the Resend Dashboard?
👉 **NO. Absolutely not.**
* The "Templates" tab in the Resend dashboard is strictly for their hosted template API (`template_id`).
* EventOS uses **SMTP Relay Mode**. In this mode, our Java backend ([`EmailService.java`](file:///d:/EventOs/backend/auth-service/src/main/java/com/eventos/auth/service/EmailService.java)) dynamically compiles full, responsive HTML email bodies with inline styling and dispatches them via SMTP.
* Resend simply delivers the pre-rendered HTML to the user's inbox.

---

## 2. Pre-Built 3D HTML Email Templates in `EmailService.java`

All 7 core transactional email templates are fully implemented with responsive dark-mode styling, gradients, animated 3D icons, and clear CTAs:

| # | Method | Subject | 3D Emblem / Visual Feature | Action CTA |
|---|---|---|---|---|
| **1** | `sendVerificationEmail` | `🔒 Your EventOS Security Verification Code: {token}` | 3D Animated Lock | 6-digit monospaced code badge (15m expiry) |
| **2** | `sendInvitationEmail` | `🤝 You're invited to join EventOS — {sender}` | 3D Animated Handshake | **🚀 Join Workspace** gradient button |
| **3** | `sendPasswordResetEmail`| `🛡️ Reset Your EventOS Password` | 3D Animated Shield | **🔑 Reset Password** CTA button (15m expiry) |
| **4** | `sendWelcomeEmail` | `🎉 Welcome to EventOS — Account Activated!` | 3D Party Popper | **🚀 Open Console** CTA button |
| **5** | `sendMagicLinkEmail` | `⚡ 1-Click Magic Link — Sign In to EventOS` | 3D Animated Rocket | **🚀 Sign In to EventOS** 1-click button |
| **6** | `sendSubscriptionReceiptEmail`| `👑 Subscription Confirmed — {plan} Active` | 3D Crown Trophy | Itemized receipt summary + **📄 Download Tax Invoice** |
| **7** | `sendTestEmail` | `✅ EventOS SMTP Diagnostic — Email is Working!` | Green Checkmark Badge | Instant SMTP verification endpoint |

---

## 3. Stripe Payments & Webhooks

* **Stripe Keys**:
  - `STRIPE_API_KEY`: Secret key for server-side checkout session creation.
  - `STRIPE_PUBLISHABLE_KEY`: Public key for client-side Stripe Elements.
  - `STRIPE_WEBHOOK_SECRET`: Used to verify signature of incoming webhook payloads.
* **Handled Webhook Events**:
  - `checkout.session.completed`: Upgrades tenant subscription to paid plan (`PROFESSIONAL` or `AGENCY`).
  - `invoice.payment_succeeded`: Dispatches `sendSubscriptionReceiptEmail` and extends subscription validity.
  - `customer.subscription.deleted`: Reverts workspace to free/starter tier.

---

## 4. Cloudinary Dynamic Media Engine

* **Credentials**:
  - `CLOUDINARY_CLOUD_NAME`: `dqvwl8e13`
  - `CLOUDINARY_API_KEY`: `416144262516315`
  - `CLOUDINARY_API_SECRET`: Configured in `.env`
* **Transformations & Watermarking**:
  - **Unpaid Proofing**: Injects a semi-transparent diagonal EventOS agency watermark over preview images.
  - **Paid / Cleared**: Generates secure download tokens linking to full-resolution, un-watermarked assets.
  - **Responsive Thumbnails**: Uses Cloudinary `c_fill,w_600,h_400,q_auto,f_auto` for fast gallery grid loading.

---

## 5. Redis Distributed Caching

* **Port**: `6379`
* **Use Cases**:
  1. **JWT Revocation / Blacklist**: Stores invalidated tokens during logout or password reset.
  2. **Rate Limiting**: Sliding window token-bucket rate limiter preventing brute-force attacks on `/login` and `/verify-email`.
  3. **Real-time User Presence**: Tracks online team members across workspace channels.
