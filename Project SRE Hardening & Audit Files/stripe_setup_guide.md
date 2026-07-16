# Stripe Payment Integration Guide

This guide describes how to configure, run, and test your new Stripe Payment Gateway integration on EventOS.

---

## 1. Environment Configurations

Make sure the following variables are defined in your root [.env](file:///d:/EventOs/.env#L49-L53) file:

```properties
# Stripe Payment Gateway Configurations
STRIPE_API_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret_from_stripe_cli
```

And verify the public key is present in your frontend client configuration [web/.env.local](file:///d:/EventOs/web/.env.local#L7-L8):

```properties
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

---

## 2. Setting Up Local Webhook Forwarding

Because Stripe cannot directly connect to a local port (`localhost`), you must use the **Stripe CLI** to forward event pings:

### Step A: Download & Extract Stripe CLI
1. Download the Windows version of the CLI: [Stripe CLI Windows Release](https://github.com/stripe/stripe-cli/releases/download/v1.22.0/stripe_1.22.0_windows_x86_64.zip).
2. Extract the `stripe.exe` binary.

### Step B: Authenticate
1. Open PowerShell and run:
   ```powershell
   .\stripe.exe login
   ```
2. Follow the browser prompt to log in to your developer dashboard.

### Step C: Forward Webhook Pings
1. Run the local forwarder:
   ```powershell
   .\stripe.exe listen --forward-to localhost:8080/api/v1/auth/billing/webhook
   ```
2. Copy the **webhook signing secret** (`whsec_...`) printed in your console.
3. Paste it as `STRIPE_WEBHOOK_SECRET` in your [.env](file:///d:/EventOs/.env) file.

---

## 3. Testing Subscriptions & Card Payments

1. Start your Spring Boot microservices and Next.js frontend client.
2. Go to **Billing Settings**, choose a plan (Growth or Enterprise), and click **Upgrade**.
3. You will be redirected to the secure Stripe Checkout portal.
4. Input the test credentials:
   - **Card Number**: `4242 4242 4242 4242` (Stripe's default test credit card)
   - **Expiry Date**: Any future date (e.g. `12/30`)
   - **CVC**: Any 3 digits (e.g. `123`)
5. Click **Pay**. Stripe will process the card, redirect you back to `http://localhost:3000/settings/billing?status=success`, and trigger the webhook event which promotes your workspace immediately!
